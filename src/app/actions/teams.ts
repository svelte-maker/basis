"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireUser } from "@/lib/auth";
import type { GradeReport } from "@/lib/models/grade";
import {
  checkPart, claimPart, createTeam, joinTeam, leaveTeam, releasePart, saveTeamCells, setReady, type TeamActionResult, type TeamKind,
} from "@/lib/services/teams";
import { teamSnapshot, type TeamSnapshot } from "@/lib/services/teamView";

export async function createTeamAction(kind: TeamKind, slug: string): Promise<void> {
  const user = await requireUser(`/${kind === "case" ? "cases" : "models"}/${slug}`);
  const r = await createTeam(user.id, kind, slug);
  if (r.ok) redirect(`/teams/${r.id}`);
}

export async function joinTeamAction(teamId: string): Promise<TeamActionResult> {
  const user = await requireUser(`/teams/${teamId}`);
  const r = await joinTeam(user.id, teamId);
  revalidatePath(`/teams/${teamId}`);
  return r;
}

export async function leaveTeamAction(teamId: string): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Log in first." };
  const r = await leaveTeam(user.id, teamId);
  if (r.ok) redirect("/teams");
  return r;
}

async function act<R extends TeamActionResult>(teamId: string, fn: (userId: string) => Promise<R>): Promise<(R | { ok: false; message: string }) & { snapshot?: TeamSnapshot }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session expired. Log in again." };
  const r = await fn(user.id);
  return { ...r, snapshot: (await teamSnapshot(teamId, user.id)) ?? undefined };
}

export async function claimPartAction(teamId: string, key: string) {
  return act(teamId, (u) => claimPart(u, teamId, key));
}

export async function releasePartAction(teamId: string, key: string) {
  return act(teamId, (u) => releasePart(u, teamId, key));
}

export async function setReadyAction(teamId: string, ready: boolean) {
  return act(teamId, (u) => setReady(u, teamId, ready));
}

export async function saveTeamCellsAction(teamId: string, changes: Record<string, string>) {
  return act(teamId, (u) => saveTeamCells(u, teamId, changes));
}

/** Poll for teammates' work. */
export async function teamSnapshotAction(teamId: string): Promise<TeamSnapshot | null> {
  const user = await getCurrentUser();
  return user ? teamSnapshot(teamId, user.id) : null;
}

export async function checkPartAction(teamId: string, key: string): Promise<GradeReport | null> {
  const user = await getCurrentUser();
  return user ? (await checkPart(user.id, teamId, key))?.report ?? null : null;
}
