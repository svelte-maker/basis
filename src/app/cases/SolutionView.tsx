import type { Solution } from "@/lib/cases";
import type { Block } from "@/lib/problems/types";
import { ModelText } from "../models/ModelText";

function BlockView({ b }: { b: Block }) {
  if (b.kind === "p") return <p><ModelText text={b.text} /></p>;
  return (
    <div className="table-box">
      <table className="mini">
        <thead><tr>{b.head.map((h, i) => <th key={i}><ModelText text={h} /></th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><ModelText text={c} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** The six sections of a worked solution. */
export function SolutionView({ s }: { s: Solution }) {
  return (
    <div className="solution case-solution">
      <section><h4>The idea</h4>{s.idea.map((t, i) => <p key={i}><ModelText text={t} /></p>)}</section>
      <section>
        <h4>Formulas</h4>
        {s.formulas.map((f, i) => (
          <div key={i} className="formula">
            <code>{f.expr}</code>
            <dl>{f.terms.map(([sym, meaning]) => <div key={sym}><dt>{sym}</dt><dd>{meaning}</dd></div>)}</dl>
          </div>
        ))}
      </section>
      <section><h4>Step by step</h4>{s.steps.map((b, i) => <BlockView key={i} b={b} />)}</section>
      <section><h4>What it means</h4>{s.meaning.map((t, i) => <p key={i}><ModelText text={t} /></p>)}</section>
      <section><h4>Common mistakes</h4><ul>{s.mistakes.map((t, i) => <li key={i}><ModelText text={t} /></li>)}</ul></section>
      <section><h4>In Excel</h4>{s.excel.map((t, i) => <p key={i}><ModelText text={t} /></p>)}</section>
    </div>
  );
}
