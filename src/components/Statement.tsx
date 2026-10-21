import type { Block } from "@/lib/problems";
import { RichText } from "./RichText";

export function Statement({ blocks, question }: { blocks: Block[]; question: string }) {
  return (
    <div className="statement">
      {blocks.map((b, i) => b.kind === "p"
        ? <p key={i}><RichText text={b.text} /></p>
        : <div key={i} className="table-box"><table className="mini"><thead><tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody></table></div>)}
      <p><strong>{question}</strong></p>
    </div>
  );
}
