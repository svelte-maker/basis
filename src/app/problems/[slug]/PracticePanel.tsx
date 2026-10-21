"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { submitPracticeAction, revealAction, newVariantAction, type PracticeResponse } from "../../actions/practice";
import { RichText } from "@/components/RichText";

export function PracticePanel({ slug, unit, loggedIn, initiallySolved, initialSolution }: { slug: string; unit: string; loggedIn: boolean; initiallySolved: boolean; initialSolution: string[] | null }) {
  const [state, action, pending] = useActionState<PracticeResponse | undefined, FormData>(submitPracticeAction.bind(null, slug), undefined);
  const [revealed, setRevealed] = useState<string[] | null>(initialSolution);
  const [confirming, setConfirming] = useState(false);
  const [busy, start] = useTransition();
  const solution = state?.solution ?? revealed;
  const solved = initiallySolved || state?.status === "correct";
  const prefix = unit === "$" || unit === "$m" ? "$" : "";
  const suffix = unit === "$m" ? "m" : unit === "$" ? "" : unit;

  if (!loggedIn) {
    return <div className="fb info">These are sample numbers. <Link href={`/login?next=/problems/${slug}`}>Log in</Link> or <Link href={`/signup?next=/problems/${slug}`}>join</Link> to get your own version and earn rating.</div>;
  }
  return (
    <div className="stack-sm">
      {!solved && (
        <form action={action} className="answer-row">
          {prefix && <span className="muted">{prefix}</span>}
          <input id="answer" name="answer" inputMode="decimal" autoComplete="off" placeholder="Your answer" aria-label="Your answer" required />
          {suffix && <span className="muted small">{suffix}</span>}
          <button className="btn" disabled={pending}>{pending ? "Checking…" : "Submit"}</button>
        </form>
      )}
      {state?.status === "invalid" && <div className="fb no">{state.message}</div>}
      {state?.status === "login" && <div className="fb no">Your session expired. <Link href="/login">Log in again</Link>.</div>}
      {state?.status === "wrong" && <div className="fb no">Not quite. Check your discounting, signs and units, then try again. Wrong answers in practice never cost rating. Attempts so far: {state.attempts}.</div>}
      {state?.status === "correct" && (
        <div className="fb ok">
          Correct.{" "}
          {state.pointsAwarded > 0 ? <>Rating <span className="num">{state.ratingBefore}</span> → <strong className="num">{state.ratingAfter}</strong> (+{state.pointsAwarded}).</> : state.reason}
        </div>
      )}
      {initiallySolved && !state && <div className="fb ok">You&apos;ve solved this version.</div>}
      <div className="row">
        {!solution && !solved && !confirming && <button type="button" className="btn quiet" onClick={() => setConfirming(true)}>Show solution</button>}
        {confirming && !solution && (
          <span className="row small">
            <span className="muted">Viewing the solution first means this problem won&apos;t add to your rating.</span>
            <button type="button" className="btn ghost small" disabled={busy} onClick={() => start(async () => setRevealed(await revealAction(slug)))}>Show it anyway</button>
            <button type="button" className="btn quiet small" onClick={() => setConfirming(false)}>Keep trying</button>
          </span>
        )}
        {(solved || solution) && <button type="button" className="btn ghost" disabled={busy} onClick={() => start(async () => { await newVariantAction(slug); setRevealed(null); location.reload(); })}>Try new numbers</button>}
      </div>
      {solution && (
        <div className="solution">
          <span className="eyebrow">Worked solution</span>
          {solution.map((line, i) => <p key={i}><RichText text={line} /></p>)}
        </div>
      )}
    </div>
  );
}
