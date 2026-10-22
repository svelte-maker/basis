"use client";
import { useState } from "react";
import type { QuizQuestion } from "@/lib/learn";
import { RichText } from "@/components/RichText";
import { markDone } from "./progress";

export function Quiz({ slug, questions }: { slug: string; questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const right = picked.filter((p, i) => p === questions[i].answer).length;
  const allDone = answered === questions.length;

  function pick(qi: number, oi: number) {
    if (picked[qi] !== null) return;
    const next = picked.map((p, i) => (i === qi ? oi : p));
    setPicked(next);
    if (next.every((p, i) => p === questions[i].answer)) markDone(slug);
  }

  return (
    <div className="quiz">
      {questions.map((q, qi) => {
        const p = picked[qi];
        return (
          <div key={qi} className="quiz-q">
            <p className="q"><span className="num muted">{qi + 1}.</span> <RichText text={q.q} /></p>
            <div className="options" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {q.options.map((o, oi) => {
                const cls = p === null ? "" : oi === q.answer ? "right" : oi === p ? "wrong" : "";
                return (
                  <label key={oi} className={`option ${cls}`}>
                    <input type="radio" name={`q-${slug}-${qi}`} checked={p === oi} disabled={p !== null} onChange={() => pick(qi, oi)} />
                    <span><RichText text={o} /></span>
                  </label>
                );
              })}
            </div>
            {p !== null && (
              <div className={`fb ${p === q.answer ? "ok" : "no"}`}>
                <strong>{p === q.answer ? "Right." : "Not quite."}</strong> <RichText text={q.why} />
              </div>
            )}
          </div>
        );
      })}
      <div className="row between">
        <span className="small muted">{allDone ? `You got ${right} of ${questions.length}.` : `${answered} of ${questions.length} answered`}</span>
        {allDone && right < questions.length && <button className="btn quiet small" onClick={() => setPicked(questions.map(() => null))}>Try again</button>}
        {allDone && right === questions.length && <span className="small" style={{ color: "var(--good)" }}>Lesson complete. Now try the practice below.</span>}
      </div>
    </div>
  );
}
