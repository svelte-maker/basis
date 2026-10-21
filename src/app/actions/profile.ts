"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { FormState } from "./auth";

const Schema = z.object({
  name: z.string().trim().min(2).max(60),
  headline: z.string().trim().max(120),
  location: z.string().trim().max(60),
  bio: z.string().trim().max(1000),
  company: z.string().trim().max(80),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/settings");
  const parsed = Schema.safeParse({ name: form.get("name"), headline: form.get("headline") ?? "", location: form.get("location") ?? "", bio: form.get("bio") ?? "", company: form.get("company") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, openToWork: form.get("openToWork") === "on" } });
  revalidatePath(`/u/${user.handle}`);
  return { ok: "Profile saved." };
}
