"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCase } from "@/lib/cases";
import type { PartInput } from "@/lib/cases/grade";
import { restartCase, revealPart, saveCaseDraft, submitPart, type CaseResult, type PartReveal } from "@/lib/services/cases";

export type CaseResponse = CaseResult | { status: "login" };

export async function submitCasePartAction(slug: string, key: string, input: PartInput): Promise<CaseResponse> {
  const user = await getCurrentUser();
  if (!user) return { status: "login" };
  const res = await submitPart(user.id, slug, key, input);
  if (res.status === "graded" && res.completed) {
    revalidatePath("/cases");
    revalidatePath("/", "layout");
  }
  return res;
}

export async function revealCasePartAction(slug: string, key: string): Promise<PartReveal | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return revealPart(user.id, slug, key);
}

export async function saveCaseDraftAction(slug: string, key: string, cells: Record<string, string>): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return saveCaseDraft(user.id, slug, key, cells);
}

export async function restartCaseAction(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !getCase(slug)) return;
  await restartCase(user.id, slug);
  revalidatePath(`/cases/${slug}`);
}
