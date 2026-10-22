import "server-only";
import { db } from "@/lib/db";
import { getCase } from "@/lib/cases";
import { getModelTask, instantiateModel, type ModelInstance } from "@/lib/models";
import { basisRating } from "@/lib/rating/grades";
import type { Difficulty } from "@/lib/problems/types";
import {
  canClaim, modelTeamTask, scoreTask, shouldFinalize, teamInstance, teamSplit, TEAM_DAYS, type TeamCell, type TeamResult, type TeamTask,
} from "@/lib/teams";
import { caseTeamTask } from "@/lib/teams/cases";

const MAX_CELLS = 600;

export type TeamActionResult = { ok: true } | { ok: false; message: string };
const fail = (message: string): TeamActionResult => ({ ok: false, message });

export function teamSeed(teamId: string): string {
  return `team:${teamId}`;
}

export function teamModel(slug: string, teamId: string): ModelInstance {
  return teamInstance(instantiateModel(slug, teamSeed(teamId)), teamSplit(slug)!);
}

export type TeamKind = "model" | "case";

/** The task a team works on. Model teams get their own numbers; cases are fixed real data. */
export function teamTask(kind: string, slug: string, teamId: string): TeamTask | undefined {
  if (kind === "case") {
    const c = getCase(slug);
    return c && caseTeamTask(c);
  }
  const t = getModelTask(slug);
  const parts = teamSplit(slug);
  return t && parts && modelTeamTask(t, teamModel(slug, teamId), parts);
}

/** Whether a task can be played as a team at all. */
export function teamable(kind: TeamKind, slug: string): boolean {
  return kind === "case" ? !!getCase(slug) : !!(getModelTask(slug) && teamSplit(slug));
}

/** Title, difficulty and part count for listings, without building the task. */
export function teamTaskInfo(kind: string, slug: string): { title: string; difficulty: Difficulty; parts: number; href: string } | null {
  if (kind === "case") {
    const c = getCase(slug);
    return c ? { title: c.title, difficulty: c.difficulty, parts: c.parts.length, href: `/cases/${slug}` } : null;
  }
  const t = getModelTask(slug);
  const parts = teamSplit(slug);
  return t && parts ? { title: t.title, difficulty: t.difficulty, parts: parts.length, href: `/models/${slug}` } : null;
}

/** The unfinished team a person is on for a task, if any. One at a time per task. */
export async function activeTeamFor(userId: string, slug: string, kind: TeamKind = "model") {
  const m = await db.teamMember.findFirst({ where: { userId, team: { kind, slug, finalizedAt: null } }, select: { teamId: true } });
  return m?.teamId ?? null;
}

export async function createTeam(userId: string, kind: TeamKind, slug: string): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!teamable(kind, slug)) return { ok: false, message: "That task can't be played as a team." };
  // Part keys don't depend on the team's numbers, so any id gives the list
  const parts = teamTask(kind, slug, "new")!.parts;
  const existing = await activeTeamFor(userId, slug, kind);
  if (existing) return { ok: true, id: existing };
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const team = await db.team.create({
    data: {
      kind, slug, name: `${user.name.split(" ")[0]}'s team`, createdById: userId,
      deadline: new Date(Date.now() + TEAM_DAYS * 86_400_000),
      members: { create: { userId } },
      parts: { create: parts.map((p) => ({ key: p.key })) },
    },
  });
  return { ok: true, id: team.id };
}

async function loadOpen(teamId: string) {
  const team = await db.team.findUnique({ where: { id: teamId }, include: { members: true, parts: true } });
  if (!team) return { error: "That team doesn't exist." } as const;
  if (team.finalizedAt) return { error: "This team has finished." } as const;
  return { team, task: teamTask(team.kind, team.slug, team.id)! } as const;
}

export async function joinTeam(userId: string, teamId: string): Promise<TeamActionResult> {
  const r = await loadOpen(teamId);
  if ("error" in r) return fail(r.error!);
  const { team, task } = r;
  if (team.members.some((m) => m.userId === userId)) return { ok: true };
  if (team.members.length >= task.parts.length) return fail("This team is full: it has one person per part.");
  const other = await activeTeamFor(userId, team.slug, team.kind as TeamKind);
  if (other) return fail("You're already on a team for this task. Finish or leave it first.");
  await db.teamMember.create({ data: { teamId, userId } });
  // Someone new has joined, so nobody has agreed to finish without them yet
  await db.teamMember.updateMany({ where: { teamId }, data: { ready: false } });
  return { ok: true };
}

export async function leaveTeam(userId: string, teamId: string): Promise<TeamActionResult> {
  const r = await loadOpen(teamId);
  if ("error" in r) return fail(r.error!);
  if (!r.team.members.some((m) => m.userId === userId)) return fail("You're not on this team.");
  const wrote = await db.teamCell.count({ where: { teamId, authorId: userId } });
  if (wrote > 0) return fail("You've written cells for this team, so you're staying on it to be credited. Clear your cells first if you really want to leave.");
  await db.$transaction([
    db.teamPart.updateMany({ where: { teamId, claimedById: userId }, data: { claimedById: null, claimedAt: null, lastEditAt: null } }),
    db.teamMember.delete({ where: { teamId_userId: { teamId, userId } } }),
  ]);
  if (r.team.members.length === 1) await db.team.delete({ where: { id: teamId } });
  return { ok: true };
}

export async function claimPart(userId: string, teamId: string, key: string): Promise<TeamActionResult> {
  const r = await loadOpen(teamId);
  if ("error" in r) return fail(r.error!);
  const { team } = r;
  if (!team.members.some((m) => m.userId === userId)) return fail("Join the team first.");
  const claims = team.parts.map((p) => ({ key: p.key, claimedById: p.claimedById, activeAt: p.lastEditAt ?? p.claimedAt }));
  const check = canClaim(userId, key, claims, team.members.length);
  if (!check.ok) return fail(check.reason);
  const prev = team.parts.find((p) => p.key === key)!;
  // Only succeeds if nobody else claimed it in the meantime
  const done = await db.teamPart.updateMany({
    where: { teamId, key, claimedById: prev.claimedById },
    data: { claimedById: userId, claimedAt: new Date(), lastEditAt: null },
  });
  return done.count ? { ok: true } : fail("Someone else just claimed that part.");
}

export async function releasePart(userId: string, teamId: string, key: string): Promise<TeamActionResult> {
  const r = await loadOpen(teamId);
  if ("error" in r) return fail(r.error!);
  await db.teamPart.updateMany({ where: { teamId, key, claimedById: userId }, data: { claimedById: null, claimedAt: null, lastEditAt: null } });
  return { ok: true };
}

/** Save edits. Each cell is accepted only from the person who holds the part it sits in, which is what makes credit trustworthy. */
export async function saveTeamCells(userId: string, teamId: string, changes: Record<string, unknown>): Promise<TeamActionResult & { rejected?: string[] }> {
  const r = await loadOpen(teamId);
  if ("error" in r) return fail(r.error!);
  const { team, task } = r;
  if (!team.members.some((m) => m.userId === userId)) return fail("Join the team first.");
  const claims = Object.fromEntries(team.parts.map((p) => [p.key, p.claimedById]));
  const ops = [];
  const rejected: string[] = [];
  const touched = new Set<string>();
  for (const [raw, v] of Object.entries(changes ?? {})) {
    const a = task.kind === "model" ? raw.toUpperCase().replace(/\$/g, "") : raw.replace(/\$/g, "");
    const key = task.partOf(a);
    if (!key || typeof v !== "string") continue;
    if (claims[key] !== userId) { rejected.push(a); continue; }
    if (v.trim() && !task.accepts(a, v)) continue;
    touched.add(key);
    const value = v;
    ops.push(value.trim()
      ? db.teamCell.upsert({ where: { teamId_addr: { teamId, addr: a } }, update: { value, authorId: userId }, create: { teamId, addr: a, value, authorId: userId } })
      : db.teamCell.deleteMany({ where: { teamId, addr: a } }));
  }
  if (ops.length) {
    const count = await db.teamCell.count({ where: { teamId } });
    if (count + ops.length > MAX_CELLS) return fail("This sheet is too large to save.");
    const now = new Date();
    await db.$transaction([
      ...ops,
      db.teamPart.updateMany({ where: { teamId, key: { in: [...touched] }, claimedById: userId }, data: { lastEditAt: now } }),
      // Changing your work withdraws your "ready", so the team never finishes on a version you haven't signed off
      db.teamMember.updateMany({ where: { teamId, userId }, data: { ready: false } }),
    ]);
  }
  return { ok: true, rejected };
}

export async function cellsOf(teamId: string): Promise<Record<string, TeamCell>> {
  const rows = await db.teamCell.findMany({ where: { teamId }, select: { addr: true, value: true, authorId: true } });
  return Object.fromEntries(rows.map((c) => [c.addr, { value: c.value, authorId: c.authorId }]));
}

export async function checkPart(userId: string, teamId: string, key: string) {
  const team = await db.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (!team || !team.members.some((m) => m.userId === userId)) return null;
  const task = teamTask(team.kind, team.slug, team.id);
  if (!task?.parts.some((p) => p.key === key) || !task.checkable(key)) return null;
  return task.gradePart(key, await cellsOf(teamId));
}

export async function setReady(userId: string, teamId: string, ready: boolean): Promise<TeamActionResult> {
  const r = await loadOpen(teamId);
  if ("error" in r) return fail(r.error!);
  const done = await db.teamMember.updateMany({ where: { teamId, userId }, data: { ready } });
  if (!done.count) return fail("You're not on this team.");
  await finalizeTeamIfDue(teamId);
  return { ok: true };
}

/** Why a member can't earn points from this team, if they can't. */
async function ineligibility(userId: string, kind: string, slug: string, teamId: string, memberCount: number): Promise<string | undefined> {
  if (memberCount < 2) return "Teams need at least two people to earn points.";
  if (kind === "case") {
    const solo = await db.caseState.findUnique({ where: { userId_slug: { userId, slug } } });
    if (solo?.everCompleted) return "Already completed this case alone, so this was mentoring.";
    const progress = Object.values(parseJson(solo?.parts)) as { solved?: boolean; revealed?: boolean }[];
    if (progress.some((p) => p?.solved || p?.revealed)) return "Had already solved or opened answers to parts of this case alone.";
  } else {
    const solo = await db.modelState.findUnique({ where: { userId_slug: { userId, slug } } });
    if (solo?.everSolved) return "Already solved this task alone, so this was mentoring.";
    if (solo?.revealed) return "Opened this task's answer model before the team finished.";
  }
  const before = await db.teamMember.count({ where: { userId, credited: true, teamId: { not: teamId }, team: { kind, slug } } });
  if (before) return "Already earned team points on this task.";
  return undefined;
}

function parseJson(json: string | undefined): Record<string, unknown> {
  try { const v = JSON.parse(json ?? "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}

export type StoredResult = Omit<TeamResult, "parts"> & {
  parts: { key: string; title: string; weight: number; value: number; score: number; earned: number; total: number; shares: Record<string, number> }[];
};

/**
 * Score a finished team and award points, once. Safe to call repeatedly or concurrently:
 * only the call that sets finalizedAt does the work.
 */
export async function finalizeTeamIfDue(teamId: string): Promise<void> {
  const team = await db.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (!team || !shouldFinalize(team, team.members)) return;
  const t = teamTask(team.kind, team.slug, teamId)!;
  const cells = await cellsOf(teamId);
  const members = await Promise.all(team.members.map(async (m) => ({ userId: m.userId, ineligible: await ineligibility(m.userId, team.kind, team.slug, teamId, team.members.length) })));
  const res = scoreTask(t, cells, members);
  const stored: StoredResult = {
    ...res,
    parts: res.parts.map((p) => ({ key: p.key, title: p.title, weight: p.weight, value: p.value, score: p.report.score, earned: p.report.earned, total: p.report.total, shares: p.shares })),
  };

  await db.$transaction(async (tx) => {
    const claimed = await tx.team.updateMany({ where: { id: teamId, finalizedAt: null }, data: { finalizedAt: new Date(), teamScore: res.integrated.score, result: JSON.stringify(stored) } });
    if (claimed.count === 0) return;
    for (const p of res.parts) await tx.teamPart.update({ where: { teamId_key: { teamId, key: p.key } }, data: { score: p.report.score } });
    for (const m of res.members) {
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId: m.userId } }, data: { points: m.points, contribution: m.contribution, credited: m.points > 0 } });
      if (m.points <= 0) continue;
      const user = await tx.user.findUniqueOrThrow({ where: { id: m.userId } });
      const before = basisRating(user.glickoRating, user.practicePoints);
      const u2 = await tx.user.update({ where: { id: m.userId }, data: { practicePoints: { increment: m.points } } });
      const after = basisRating(u2.glickoRating, u2.practicePoints);
      if (after !== before) {
        await tx.ratingEvent.create({ data: { userId: m.userId, kind: "practice", delta: after - before, ratingAfter: after, note: `Team ${t.kind === "case" ? "case" : "build"}: ${t.title} (${Math.round(m.contribution * 100)}% of the work)` } });
      }
    }
  });
}

/** Finish every team whose deadline has passed. Called from the team pages. */
export async function finalizeDueTeams(): Promise<void> {
  const due = await db.team.findMany({ where: { finalizedAt: null, deadline: { lte: new Date() } }, select: { id: true } });
  for (const d of due) await finalizeTeamIfDue(d.id);
}

export function parseResult(json: string | null): StoredResult | null {
  if (!json) return null;
  try { return JSON.parse(json) as StoredResult; } catch { return null; }
}
