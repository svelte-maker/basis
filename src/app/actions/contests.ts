"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { phaseOf } from "@/lib/contestScoring";
import { submitContestAnswer, type ContestSubmitResult } from "@/lib/services/contests";

export async function toggleRegistration(contestId: string, slug: string) {
  const user = await requireUser(`/contests/${slug}`);
  const c = await db.contest.findUnique({ where: { id: contestId } });
  if (!c || phaseOf(c) === "ended") return;
  const existing = await db.contestEntry.findUnique({ where: { contestId_userId: { contestId, userId: user.id } } });
  if (existing) {
    // Leaving is only allowed before the start, or during the round if nothing was submitted
    const subs = await db.submission.count({ where: { contestId, userId: user.id } });
    if (subs === 0) await db.contestEntry.delete({ where: { id: existing.id } });
  } else {
    await db.contestEntry.create({ data: { contestId, userId: user.id } });
  }
  revalidatePath(`/contests/${slug}`);
  revalidatePath("/contests");
}

export async function submitContestAction(contestId: string, problemSlug: string, _: ContestSubmitResult | undefined, form: FormData): Promise<ContestSubmitResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "not-registered", message: "Log in to submit." };
  const r = await submitContestAnswer(user.id, contestId, problemSlug, String(form.get("answer") ?? ""));
  if (r.status === "correct") revalidatePath(`/contests`, "layout");
  return r;
}
