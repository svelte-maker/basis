"use client";
import { useActionState } from "react";
import { createContest } from "../actions/admin";

type T = { slug: string; title: string; track: string; difficulty: string };

export function ContestForm({ templates, tracks }: { templates: T[]; tracks: readonly string[] }) {
  const [state, action, pending] = useActionState(createContest, undefined);
  return (
    <form action={action} className="panel card">
      <h2>Schedule a contest</h2>
      <div className="grid-auto">
        <label className="field">Title<input name="title" required placeholder="Weekly Valuation Sprint #43" /></label>
        <label className="field">Start (UTC)<input name="start" type="datetime-local" required /></label>
        <label className="field">Length in minutes<input name="minutes" type="number" min={10} defaultValue={75} required /></label>
      </div>
      <label className="field">Description<textarea name="description" rows={2} /></label>
      <label className="check"><input type="checkbox" name="rated" defaultChecked /> Rated</label>
      <details>
        <summary className="small">Choose problems (leave empty to auto-pick 2 Easy, 2 Medium, 1 Hard)</summary>
        <div className="grid-auto" style={{ marginTop: 10 }}>
          {tracks.map((tr) => (
            <fieldset key={tr} className="stack-sm" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}>
              <legend className="small muted">{tr}</legend>
              {templates.filter((t) => t.track === tr).map((t) => <label key={t.slug} className="check small"><input type="checkbox" name="problems" value={t.slug} /> {t.title} <span className={`d-${t.difficulty}`}>· {t.difficulty}</span></label>)}
            </fieldset>
          ))}
        </div>
      </details>
      {state?.error && <div className="fb no">{state.error}</div>}
      {state?.ok && <div className="fb ok">{state.ok}</div>}
      <div><button className="btn" disabled={pending}>{pending ? "Scheduling…" : "Schedule contest"}</button></div>
    </form>
  );
}
