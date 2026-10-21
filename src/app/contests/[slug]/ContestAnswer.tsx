"use client";
import { useActionState } from "react";
import { submitContestAction } from "../../actions/contests";
import type { ContestSubmitResult } from "@/lib/services/contests";

export function ContestAnswer({ contestId, slug, unit, solved, wrong }: { contestId: string; slug: string; unit: string; solved: boolean; wrong: number }) {
  const [state, action, pending] = useActionState<ContestSubmitResult | undefined, FormData>(submitContestAction.bind(null, contestId, slug), undefined);
  if (solved || state?.status === "correct") {
    return <div className="fb ok">Solved{state?.status === "correct" ? ` for ${state.points} points` : ""}.</div>;
  }
  const w = state?.status === "wrong" ? state.wrong : wrong;
  return (
    <div className="stack-sm">
      <form action={action} className="answer-row">
        <input name="answer" inputMode="decimal" autoComplete="off" placeholder="Your answer" aria-label="Your answer" required />
        {unit && <span className="muted small">{unit}</span>}
        <button className="btn" disabled={pending}>{pending ? "Checking…" : "Submit"}</button>
        {w > 0 && <span className="small muted">{w} wrong {w === 1 ? "attempt" : "attempts"} (−50 each)</span>}
      </form>
      {state?.status === "wrong" && <div className="fb no">Wrong answer. Each wrong attempt costs 50 points on this problem once you solve it.</div>}
      {state && "message" in state && <div className="fb no">{state.message}</div>}
    </div>
  );
}
