"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { newCredentialId } from "@/lib/credential";

export type FormState = { error?: string; ok?: string } | undefined;

const safeNext = (n: FormDataEntryValue | null) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/problems");

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(60),
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,20}$/, "Handle must be 3–20 characters: lowercase letters, numbers and hyphens."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["MEMBER", "RECRUITER"]),
  company: z.string().trim().max(80).optional(),
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.role === "RECRUITER" && !d.company) return { error: "Recruiters need to enter their company." };
  const clash = await db.user.findFirst({ where: { OR: [{ email: d.email }, { handle: d.handle }] } });
  if (clash) return { error: clash.email === d.email ? "An account with that email already exists. Log in instead." : "That handle is taken. Try another." };
  // Emails listed in ADMIN_EMAILS (comma-separated) become admins when they sign up
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const role = admins.includes(d.email) ? "ADMIN" : d.role;
  const user = await db.user.create({
    data: { name: d.name, handle: d.handle, email: d.email, passwordHash: await hashPassword(d.password), role, company: d.company ?? "", credentialId: newCredentialId(), openToWork: d.role === "MEMBER" },
  });
  await startSession(user.id);
  redirect(d.role === "RECRUITER" ? "/recruiters" : safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "That email and password don't match an account." };
  await startSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/");
}
