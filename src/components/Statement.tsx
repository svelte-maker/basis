import type { Block } from "@/lib/problems";
import { RichText } from "./RichText";

export function Blocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b, i) => b.kind === "p"
    ? <p key={i}><RichText text={b.text} /></p>
    : <div key={i} className="table-box"><table className="mini"><thead><tr>{b.head.map((h, j) => <th key={j}><RichText text={h} /></th>)}</tr></thead><tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><RichText text={c} /></td>)}</tr>)}</tbody></table></div>)}</>;
}

export function Statement({ blocks, question }: { blocks: Block[]; question: string }) {
  return (
    <div className="statement">
      <Blocks blocks={blocks} />
      <p><strong>{question}</strong></p>
    </div>
  );
}
