"use client";
import { useActionState } from "react";
import { updateProfile } from "../actions/profile";

type U = { name: string; headline: string; location: string; bio: string; company: string; openToWork: boolean; role: string };

export function SettingsForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="form" style={{ maxWidth: 560 }}>
      <label className="field">Name<input id="name" name="name" defaultValue={user.name} required /></label>
      <label className="field">Headline<input id="headline" name="headline" defaultValue={user.headline} placeholder="e.g. Equity research analyst, consumer sector" /></label>
      <label className="field">Location<input id="location" name="location" defaultValue={user.location} /></label>
      {user.role !== "MEMBER" && <label className="field">Company<input id="company" name="company" defaultValue={user.company} /></label>}
      {user.role === "MEMBER" && <input type="hidden" name="company" value={user.company} />}
      <label className="field">About you<textarea id="bio" name="bio" rows={5} defaultValue={user.bio} /></label>
      {user.role === "MEMBER" && <label className="check"><input id="openToWork" type="checkbox" name="openToWork" defaultChecked={user.openToWork} /> Show me in recruiter search</label>}
      {state?.error && <div className="fb no">{state.error}</div>}
      {state?.ok && <div className="fb ok">{state.ok}</div>}
      <div><button className="btn" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button></div>
    </form>
  );
}
