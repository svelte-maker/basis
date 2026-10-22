// Case studies as team tasks: each case part is a claimable part.
// Addresses: "<part>:ans" holds a numeric or multiple-choice answer, "<part>!B7" a cell of a model part.
import { CASE_POINTS, casePoints, type CasePart, type CaseStudy } from "@/lib/cases";
import { gradePart as gradeCasePart } from "@/lib/cases/grade";
import { MAX_ENTRY } from "@/lib/models/grade";
import { parseAddr } from "@/lib/sheets";
import { authorShares, type PartScore, type TeamCell, type TeamTask } from ".";

export const answerAddr = (key: string) => `${key}:ans`;
export const cellAddr = (key: string, a: string) => `${key}!${a}`;

/** Split a case address into its part key and, for model parts, the sheet cell. */
export function splitAddr(addr: string): { key: string; cell?: string } | null {
  const ans = /^([a-z0-9-]+):ans$/.exec(addr);
  if (ans) return { key: ans[1] };
  const cell = /^([a-z0-9-]+)!([A-Z]+\d+)$/.exec(addr);
  return cell ? { key: cell[1], cell: cell[2] } : null;
}

/** The cells of one model part, keyed by sheet address. */
export function modelCells(key: string, cells: Record<string, TeamCell>): Record<string, TeamCell> {
  const out: Record<string, TeamCell> = {};
  for (const [a, c] of Object.entries(cells)) { const s = splitAddr(a); if (s?.key === key && s.cell) out[s.cell] = c; }
  return out;
}

function partInput(p: CasePart, cells: Record<string, TeamCell>) {
  if (p.kind === "model") return { cells: Object.fromEntries(Object.entries(modelCells(p.key, cells)).map(([a, c]) => [a, c.value])) };
  const v = cells[answerAddr(p.key)]?.value;
  return p.kind === "numeric" ? { value: v ?? "" } : { choice: v === undefined ? -1 : Number(v) };
}

export function caseTeamTask(c: CaseStudy): TeamTask {
  const byKey = new Map(c.parts.map((p) => [p.key, p]));
  const total = casePoints(c);

  const grade = (p: CasePart, cells: Record<string, TeamCell>): PartScore => {
    const g = gradeCasePart(p, partInput(p, cells));
    return { score: g?.score ?? 0, earned: g?.earned ?? 0, total: p.points, report: g?.report };
  };

  return {
    kind: "case", slug: c.slug, title: c.title, difficulty: c.difficulty, pool: CASE_POINTS[c.difficulty],
    parts: c.parts.map((p) => ({ key: p.key, title: p.title, blurb: p.skills.join(", "), weight: p.points })),
    partOf: (addr) => {
      const s = splitAddr(addr);
      const p = s && byKey.get(s.key);
      if (!p) return undefined;
      if (p.kind !== "model") return s.cell ? undefined : p.key;
      const at = s.cell && parseAddr(s.cell);
      if (!at || at.r >= p.model.rows || at.c >= p.model.cols) return undefined;
      const spec = p.model.cells[s.cell!];
      return spec && spec.kind !== "calc" ? undefined : p.key;
    },
    accepts: (addr, v) => {
      const p = byKey.get(splitAddr(addr)?.key ?? "");
      if (!p) return false;
      if (p.kind === "choice") return /^\d+$/.test(v) && Number(v) < p.options.length;
      return v.length <= (p.kind === "numeric" ? 64 : MAX_ENTRY);
    },
    gradePart: (k, cells) => grade(byKey.get(k)!, cells),
    shares: (k, cells) => {
      const p = byKey.get(k)!;
      if (p.kind === "model") return authorShares(p.model, { key: k, title: "", blurb: "", rows: [[1, p.model.rows]] }, modelCells(k, cells));
      const a = cells[answerAddr(k)];
      return a?.value.trim() ? { [a.authorId]: 1 } : {};
    },
    integrated: (cells) => {
      const scores = c.parts.map((p) => grade(p, cells).score);
      return scores.every((x) => x === 1) ? 1 : c.parts.reduce((s, p, i) => s + scores[i] * p.points, 0) / total;
    },
    checkable: (k) => byKey.get(k)?.kind === "model",
  };
}
