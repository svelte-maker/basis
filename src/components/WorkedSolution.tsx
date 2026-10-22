import type { Solution } from "@/lib/problems";
import { RichText } from "./RichText";
import { Blocks } from "./Statement";

const Paras = ({ lines }: { lines: string[] }) => <>{lines.map((l, i) => <p key={i}><RichText text={l} /></p>)}</>;

export function WorkedSolution({ solution: s }: { solution: Solution }) {
  return (
    <div className="solution">
      <span className="eyebrow">Worked solution</span>
      <section><h3>The idea</h3><Paras lines={s.idea} /></section>
      <section>
        <h3>{s.formulas.length > 1 ? "The formulas" : "The formula"}</h3>
        {s.formulas.map((f, i) => (
          <div key={i} className="formula">
            <div className="expr">{f.expr}</div>
            {f.terms.length > 0 && <dl>{f.terms.map(([sym, what], j) => <div key={j}><dt>{sym}</dt><dd><RichText text={what} /></dd></div>)}</dl>}
          </div>
        ))}
      </section>
      <section><h3>Step by step, with your numbers</h3><Blocks blocks={s.steps} /></section>
      <section><h3>What the answer means</h3><Paras lines={s.meaning} /></section>
      <section><h3>Common mistakes</h3><ul>{s.mistakes.map((m, i) => <li key={i}><RichText text={m} /></li>)}</ul></section>
      <section><h3>In Excel or Sheets</h3><Paras lines={s.excel} /></section>
    </div>
  );
}
