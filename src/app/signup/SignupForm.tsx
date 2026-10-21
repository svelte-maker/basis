"use client";
import { useActionState, useState } from "react";
import { signup } from "../actions/auth";

export function SignupForm({ next, initialRole }: { next: string; initialRole: "MEMBER" | "RECRUITER" }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [role, setRole] = useState(initialRole);
  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <div className="row" role="radiogroup" aria-label="Account type">
        <label className="check"><input type="radio" name="role" value="MEMBER" checked={role === "MEMBER"} onChange={() => setRole("MEMBER")} /> I want to build my rating</label>
        <label className="check"><input type="radio" name="role" value="RECRUITER" checked={role === "RECRUITER"} onChange={() => setRole("RECRUITER")} /> I&apos;m hiring</label>
      </div>
      <label className="field">Full name<input id="name" name="name" required autoComplete="name" /></label>
      <label className="field">Handle (your profile link)<input id="handle" name="handle" required pattern="[a-z0-9-]{3,20}" placeholder="e.g. priya-n" /></label>
      {role === "RECRUITER" && <label className="field">Company<input id="company" name="company" required /></label>}
      <label className="field">Email<input id="email" name="email" type="email" required autoComplete="email" /></label>
      <label className="field">Password (8+ characters)<input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
      {state?.error && <div className="fb no">{state.error}</div>}
      <div><button className="btn" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button></div>
    </form>
  );
}
