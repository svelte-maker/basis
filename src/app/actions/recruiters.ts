"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function toggleShortlist(candidateId: string) {
  const r = await requireRole(["RECRUITER", "ADMIN"], "/recruiters");
  const key = { recruiterId_candidateId: { recruiterId: r.id, candidateId } };
  const existing = await db.shortlist.findUnique({ where: key });
  if (existing) await db.shortlist.delete({ where: key });
  else await db.shortlist.create({ data: { recruiterId: r.id, candidateId } });
  revalidatePath("/recruiters");
  revalidatePath("/recruiters/shortlist");
}

export async function saveNote(candidateId: string, form: FormData) {
  const r = await requireRole(["RECRUITER", "ADMIN"], "/recruiters");
  await db.shortlist.update({ where: { recruiterId_candidateId: { recruiterId: r.id, candidateId } }, data: { note: String(form.get("note") ?? "").slice(0, 1000) } });
  revalidatePath("/recruiters/shortlist");
}
