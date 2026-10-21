"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import type { FormState } from "./auth";

import { POST_KINDS } from "@/lib/community";

const PostSchema = z.object({
  kind: z.enum(POST_KINDS),
  track: z.string().max(40),
  title: z.string().trim().min(8, "Give your post a title of at least 8 characters.").max(140),
  body: z.string().trim().min(20, "Add at least a couple of sentences.").max(10_000),
  link: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Links must start with https://"),
});

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/community");
  const parsed = PostSchema.safeParse({ kind: form.get("kind"), track: form.get("track") ?? "", title: form.get("title"), body: form.get("body"), link: form.get("link") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const recent = await db.post.count({ where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent > 0) return { error: "You can post once a minute. Try again shortly." };
  const post = await db.post.create({ data: { ...parsed.data, authorId: user.id } });
  revalidatePath("/community");
  redirect(`/community/${post.id}`);
}

export async function toggleVote(postId: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/community/${postId}`);
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId === user.id) return;
  const existing = await db.vote.findUnique({ where: { userId_postId: { userId: user.id, postId } } });
  await db.$transaction(existing
    ? [db.vote.delete({ where: { userId_postId: { userId: user.id, postId } } }), db.post.update({ where: { id: postId }, data: { score: { decrement: 1 } } })]
    : [db.vote.create({ data: { userId: user.id, postId } }), db.post.update({ where: { id: postId }, data: { score: { increment: 1 } } })]);
  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
}

export async function addComment(postId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(`/community/${postId}`);
  const body = String(form.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Write a comment first." };
  if (body.length > 4000) return { error: "Keep comments under 4,000 characters." };
  await db.comment.create({ data: { postId, authorId: user.id, body } });
  revalidatePath(`/community/${postId}`);
  return { ok: "Comment posted." };
}
