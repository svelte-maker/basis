import Link from "next/link";
import { glossary, termId } from "@/lib/learn";
import "../learn.css";

export const metadata = {
  title: "Finance glossary",
  description: "Plain-English definitions of the finance terms used in valuation, accounting, IPOs, M&A, LBOs, bonds, derivatives, risk and credit, each linked to the lesson that teaches it.",
};

export default function GlossaryPage() {
  const entries = glossary();
  const letters = [...new Set(entries.map((e) => e.term[0].toUpperCase()))];
  return (
    <div className="stack glossary" style={{ maxWidth: 860 }}>
      <div className="row small"><Link href="/learn">← Learn</Link></div>
      <div>
        <span className="eyebrow">Glossary</span>
        <h1 style={{ marginTop: 4 }}>Finance terms, in plain English</h1>
        <p className="lede">{entries.length} terms from the Learn lessons. Each links to the lesson where it is taught in context.</p>
      </div>
      <nav className="letters" aria-label="Jump to letter">{letters.map((c) => <a key={c} href={`#letter-${c}`}>{c}</a>)}</nav>
      <div className="panel">
        <dl>
          {entries.map((e, i) => {
            const first = i === 0 || entries[i - 1].term[0].toUpperCase() !== e.term[0].toUpperCase();
            return (
              <div key={e.term} id={termId(e.term)}>
                {first && <span id={`letter-${e.term[0].toUpperCase()}`} />}
                <dt>{e.term}</dt>
                <dd>{e.definition} <Link href={`/learn/${e.lesson.slug}`} className="small">{e.lesson.title.split(":")[0]} →</Link></dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
