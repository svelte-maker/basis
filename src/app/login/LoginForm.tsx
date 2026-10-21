"use client";
import { useActionState } from "react";
import { login } from "../actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <label className="field">Email<input id="email" name="email" type="email" autoComplete="email" required /></label>
      <label className="field">Password<input id="password" name="password" type="password" autoComplete="current-password" required /></label>
      {state?.error && <div className="fb no">{state.error}</div>}
      <div><button className="btn" disabled={pending}>{pending ? "Logging in…" : "Log in"}</button></div>
    </form>
  );
}
