import { CASE_POINTS, type CaseStudy, type Exhibit, type Figure } from "@/lib/cases";
import { ModelText } from "../models/ModelText";

function sourceLink(c: CaseStudy, f: Figure): string {
  const s = c.sources.find((x) => x.id === f.source)!;
  return f.page && s.pageOffset !== undefined ? `${s.url}#page=${f.page + s.pageOffset}` : s.url;
}

function citation(c: CaseStudy, f: Figure): string {
  const s = c.sources.find((x) => x.id === f.source)!;
  const where = f.page ? `page ${f.page}` : f.xbrl ?? "";
  return `${s.title}, ${where}. ${f.section}. ${f.period}. Reported as “${f.label}” (${f.unit}).`;
}

export function ExhibitView({ c, e }: { c: CaseStudy; e: Exhibit }) {
  const cited = e.rows.flatMap((r) => r.cells).filter((x): x is { text: string; fig: string } => !!x?.fig);
  const n = new Map(cited.map((x, i) => [x.fig, i + 1]));
  return (
    <section className="panel exhibit" id={`ex-${e.key}`}>
      <div className="panel-head"><h3>{e.title}</h3></div>
      <div className="table-box">
        <table className="data">
          <thead><tr>{e.head.map((h, i) => <th key={i} className={i ? "r" : ""}>{h}</th>)}</tr></thead>
          <tbody>
            {e.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.label}</td>
                {r.cells.map((x, j) => (
                  <td key={j} className="r num">
                    {x?.text}
                    {x?.fig && <a className="cite" href={`#cite-${e.key}-${n.get(x.fig)}`} title={citation(c, c.figures[x.fig])}>{n.get(x.fig)}</a>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(e.note || cited.length > 0) && (
        <details className="cites">
          <summary className="small muted">{e.note ?? "Sources"} <span className="link">Where each number comes from</span></summary>
          <ol>
            {cited.map((x, i) => (
              <li key={x.fig} id={`cite-${e.key}-${i + 1}`} className="small">
                <a href={sourceLink(c, c.figures[x.fig])} target="_blank" rel="noreferrer">{citation(c, c.figures[x.fig])}</a>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

/** The case's title block: kind, track, brief and sources. */
export function CaseHeader({ c, finished }: { c: CaseStudy; finished?: number }) {
  return (
    <article className="panel card" style={{ padding: 24, gap: 16 }}>
      <div className="row">
        <span className={`chip kind ${c.kind === "real" ? "real" : "hypo"}`}>{c.kind === "real" ? "Real case: numbers as reported" : "Real data, hypothetical assumptions"}</span>
        <span className="chip">{c.track}</span>
        <span className={`chip d-${c.difficulty}`}>{c.difficulty} · up to +{CASE_POINTS[c.difficulty]} rating</span>
        <span className="chip">About {c.minutes} min</span>
        {finished !== undefined && <span className="small muted">{finished} people completed this</span>}
      </div>
      <h1>{c.title}</h1>
      <div className="statement">{c.brief.map((p, i) => <p key={i}><ModelText text={p} /></p>)}</div>
      <div className="sources small">
        <span className="eyebrow">Sources</span>
        <ul>
          {c.sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> · {s.publisher}{s.ref ? ` · ${s.ref}` : ""}
              {s.dataUrl && <> · <a href={s.dataUrl} target="_blank" rel="noreferrer">machine-readable data</a></>}
              <br /><span className="muted">{s.locatorNote}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
