"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { instantiate, practiceSeed } from "@/lib/problems";
import { newVariant, practiceState, revealSolution, submitPractice, type PracticeResult } from "@/lib/services/practice";

export type PracticeResponse = (PracticeResult | { status: "login" }) & { solution?: string[] };

async function solutionFor(userId: string, slug: string) {
  const s = await practiceState(userId, slug);
  return instantiate(slug, practiceSeed(userId, slug, s.variant)).solution;
}

export async function submitPracticeAction(slug: string, _: PracticeResponse | undefined, form: FormData): Promise<PracticeResponse> {
  const user = await getCurrentUser();
  if (!user) return { status: "login" };
  const res = await submitPractice(user.id, slug, String(form.get("answer") ?? ""));
  if (res.status === "correct") {
    revalidatePath("/problems");
    revalidatePath("/", "layout");
    return { ...res, solution: await solutionFor(user.id, slug) };
  }
  return res;
}

export async function revealAction(slug: string): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  await revealSolution(user.id, slug);
  return solutionFor(user.id, slug);
}

export async function newVariantAction(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await newVariant(user.id, slug);
  revalidatePath(`/problems/${slug}`);
}
