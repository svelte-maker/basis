import "server-only";
import { db } from "@/lib/db";
import { canClaim, teamSplit, type TeamCell } from "@/lib/teams";
import { finalizeTeamIfDue, parseResult, teamModel, type StoredResult } from "./teams";

/** One colour per part, in claim order on the sheet. Readable on light and dark backgrounds. */
export const PART_COLORS = ["#2F7DE1", "#D9822B", "#2E9E6A", "#A35BC9", "#C9475B", "#3AA6A6"];

export type TeamSnapshot = {
  id: string;
  slug: string;
  name: string;
  deadline: string;
  finalized: boolean;
  me: { userId: string; member: boolean };
  members: { userId: string; name: string; handle: string; ready: boolean; points: number; contribution: number }[];
  parts: {
    key: string; title: string; blurb: string; color: string; rows: [number, number][];
    claimedById: string | null; claimedByName: string | null; activeAt: string | null; score: number | null;
    claim: { ok: boolean; takeover?: boolean; reason?: string };
  }[];
  cells: Record<string, TeamCell>;
  result: StoredResult | null;
  /** After the team finishes: the answer model and how it works. */
  reveal: { answer: Record<string, string>; solution: string[] } | null;
};

export async function teamSnapshot(teamId: string, viewerId: string | null): Promise<TeamSnapshot | null> {
  await finalizeTeamIfDue(teamId);
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { members: { include: { user: { select: { name: true, handle: true } } }, orderBy: { joinedAt: "asc" } }, parts: true, cells: { select: { addr: true, value: true, authorId: true } } },
  });
  const split = team && teamSplit(team.slug);
  if (!team || !split) return null;
  const names = new Map(team.members.map((m) => [m.userId, m.user.name]));
  const member = !!viewerId && team.members.some((m) => m.userId === viewerId);
  const claims = team.parts.map((p) => ({ key: p.key, claimedById: p.claimedById, activeAt: p.lastEditAt ?? p.claimedAt }));
  const inst = team.finalizedAt ? teamModel(team.slug, team.id) : null;

  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    deadline: team.deadline.toISOString(),
    finalized: !!team.finalizedAt,
    me: { userId: viewerId ?? "", member },
    members: team.members.map((m) => ({ userId: m.userId, name: m.user.name, handle: m.user.handle, ready: m.ready, points: m.points, contribution: m.contribution })),
    parts: split.map((s, i) => {
      const p = team.parts.find((x) => x.key === s.key)!;
      const c = member && !team.finalizedAt ? canClaim(viewerId!, s.key, claims, team.members.length) : { ok: false as const, reason: "" };
      return {
        key: s.key, title: s.title, blurb: s.blurb, color: PART_COLORS[i % PART_COLORS.length], rows: s.rows,
        claimedById: p.claimedById, claimedByName: p.claimedById ? names.get(p.claimedById) ?? "A former teammate" : null,
        activeAt: (p.lastEditAt ?? p.claimedAt)?.toISOString() ?? null, score: p.score,
        claim: c.ok ? { ok: true, takeover: c.takeover } : { ok: false, reason: c.reason },
      };
    }),
    cells: Object.fromEntries(team.cells.map((c) => [c.addr, { value: c.value, authorId: c.authorId }])),
    result: parseResult(team.result),
    reveal: inst ? { answer: inst.answer, solution: inst.solution } : null,
  };
}
