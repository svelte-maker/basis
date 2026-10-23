"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { TEMPLATES, getTemplate } from "@/lib/problems";
import { phaseOf } from "@/lib/contestScoring";
import type { FormState } from "./auth";

const Schema = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().max(500),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a start time."),
  minutes: z.coerce.number().int().min(10).max(60 * 24 * 7),
});

function autoPick(): string[] {
  const shuffle = <T,>(xs: T[]) => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const by = (d: string) => shuffle(TEMPLATES.filter((t) => t.difficulty === d));
  return [...by("Easy").slice(0, 2), ...by("Medium").slice(0, 2), ...by("Hard").slice(0, 1)].map((t) => t.slug);
}

export async function createContest(_: FormState, form: FormData): Promise<FormState> {
  await requireRole(["ADMIN"], "/admin");
  const parsed = Schema.safeParse({ title: form.get("title"), description: form.get("description") ?? "", start: form.get("start"), minutes: form.get("minutes") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const startsAt = new Date(`${parsed.data.start}:00Z`);
  if (startsAt.getTime() < Date.now() - 60_000) return { error: "Start time must be in the future (times are UTC)." };
  let problems = form.getAll("problems").map(String).filter((s) => getTemplate(s));
  if (problems.length === 0) problems = autoPick();
  if (problems.length > 10) return { error: "Pick at most 10 problems." };
  // The form lists problems by track; contestants see them in stored order, so put Easy first.
  const level = { Easy: 0, Medium: 1, Hard: 2 } as const;
  problems.sort((a, b) => level[getTemplate(a)!.difficulty] - level[getTemplate(b)!.difficulty]);
  const base = parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  const slug = `${base}-${Date.now().toString(36).slice(-4)}`;
  await db.contest.create({ data: { slug, title: parsed.data.title, description: parsed.data.description, startsAt, endsAt: new Date(startsAt.getTime() + parsed.data.minutes * 60_000), rated: form.get("rated") === "on", problemSlugs: JSON.stringify(problems) } });
  revalidatePath("/contests");
  revalidatePath("/admin");
  return { ok: `Scheduled "${parsed.data.title}" with ${problems.length} problems.` };
}

export async function deleteContest(id: string) {
  await requireRole(["ADMIN"], "/admin");
  const c = await db.contest.findUnique({ where: { id } });
  if (c && phaseOf(c) === "upcoming") await db.contest.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/contests");
}
