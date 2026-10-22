"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getModelTask } from "@/lib/models";
import { currentInstance, newModelVariant, revealModel, saveDraft, submitModel, type ModelResult } from "@/lib/services/models";

export type ModelReveal = { answer: Record<string, string>; solution: string[] };
export type ModelResponse = (ModelResult | { status: "login" }) & { reveal?: ModelReveal };

async function revealFor(userId: string, slug: string): Promise<ModelReveal> {
  const { inst } = await currentInstance(userId, slug);
  return { answer: inst.answer, solution: inst.solution };
}

export async function saveDraftAction(slug: string, cells: Record<string, string>): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return saveDraft(user.id, slug, cells);
}

export async function submitModelAction(slug: string, cells: Record<string, string>): Promise<ModelResponse> {
  const user = await getCurrentUser();
  if (!user) return { status: "login" };
  const res = await submitModel(user.id, slug, cells);
  if (res.status === "graded" && res.solved) {
    revalidatePath("/models");
    revalidatePath("/", "layout");
    return { ...res, reveal: await revealFor(user.id, slug) };
  }
  return res;
}

export async function revealModelAction(slug: string): Promise<ModelReveal | null> {
  const user = await getCurrentUser();
  if (!user || !getModelTask(slug)) return null;
  await revealModel(user.id, slug);
  return revealFor(user.id, slug);
}

export async function newModelVariantAction(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !getModelTask(slug)) return;
  await newModelVariant(user.id, slug);
  revalidatePath(`/models/${slug}`);
}
