import type { LessonBlock } from "@/lib/learn";
import { RichText } from "@/components/RichText";
import { LiveSheet } from "./LiveSheet";

const TONE: Record<"insight" | "desk" | "warning", string> = { insight: "Key idea", desk: "On the desk", warning: "Watch out" };

function Block({ b }: { b: LessonBlock }) {
  switch (b.kind) {
    case "p": return <p><RichText text={b.text} /></p>;
    case "h": return <h3>{b.text}</h3>;
    case "list": {
      const items = b.items.map((t, i) => <li key={i}><RichText text={t} /></li>);
      return b.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "table":
      return (
        <figure>
          <div className="table-box"><table className="mini">
            <thead><tr>{b.head.map((h, i) => <th key={i}><RichText text={h} /></th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><RichText text={c} /></td>)}</tr>)}</tbody>
          </table></div>
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      );
    case "formula":
      return (
        <div className="formula">
          <div className="expr">{b.expr}</div>
          {b.terms.length > 0 && <dl>{b.terms.map(([sym, what], i) => <div key={i}><dt>{sym}</dt><dd><RichText text={what} /></dd></div>)}</dl>}
        </div>
      );
    case "callout":
      return (
        <aside className={`callout ${b.tone}`}>
          <div className="t"><span className="tag">{TONE[b.tone]}</span>{b.title}</div>
          {b.text.map((t, i) => <p key={i}><RichText text={t} /></p>)}
        </aside>
      );
    case "excel":
      return (
        <figure>
          <div className="table-box"><table className="excel">
            <thead><tr><th>Cell</th><th>Type</th><th>Shows</th></tr></thead>
            <tbody>{b.rows.map(([cell, f, v], i) => <tr key={i}><td>{cell}</td><td className="f">{f}</td><td className="v">{v}</td></tr>)}</tbody>
          </table></div>
          {b.title && <figcaption>{b.title}</figcaption>}
        </figure>
      );
    case "sheet": return <LiveSheet block={b} />;
  }
}

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return <>{blocks.map((b, i) => <Block key={i} b={b} />)}</>;
}
