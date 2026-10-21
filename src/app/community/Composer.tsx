"use client";
import { useActionState } from "react";
import { createPost } from "../actions/community";

export function Composer({ kinds, tracks }: { kinds: readonly string[]; tracks: readonly string[] }) {
  const [state, action, pending] = useActionState(createPost, undefined);
  return (
    <form action={action} className="panel card" style={{ maxWidth: 780 }}>
      <h3>Share your work</h3>
      <div className="row">
        <select id="kind" name="kind" aria-label="Post type">{kinds.map((k) => <option key={k}>{k}</option>)}</select>
        <select id="track" name="track" aria-label="Track"><option value="">Any track</option>{tracks.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <input id="title" name="title" placeholder="Title, e.g. DCF of a regional bank with a deposit-beta sensitivity" required />
      <textarea id="body" name="body" rows={4} placeholder="What did you build or find? Explain your assumptions so others can review them." required />
      <input id="link" name="link" placeholder="Optional link to your model or write-up (https://…)" />
      {state?.error && <div className="fb no">{state.error}</div>}
      <div><button className="btn" disabled={pending}>{pending ? "Posting…" : "Post"}</button></div>
    </form>
  );
}
