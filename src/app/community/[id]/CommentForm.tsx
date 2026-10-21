"use client";
import { useActionState, useEffect, useRef } from "react";
import { addComment } from "../../actions/community";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(addComment.bind(null, postId), undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="stack-sm">
      <textarea id="comment" name="body" rows={3} placeholder="Add a comment or review" required />
      {state?.error && <div className="fb no">{state.error}</div>}
      <div><button className="btn" disabled={pending}>{pending ? "Posting…" : "Comment"}</button></div>
    </form>
  );
}
