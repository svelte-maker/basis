// A1-style cell addresses. Rows and columns are 0-based internally.

export function colName(c: number): string {
  let s = "";
  for (let n = c + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function addr(r: number, c: number): string {
  return colName(c) + (r + 1);
}

export function parseAddr(a: string): { r: number; c: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,6})$/.exec(a.trim());
  if (!m) return null;
  return { r: Number(m[2]) - 1, c: colIndex(m[1]) };
}

/**
 * Move a formula from one cell to another the way Excel's copy and fill do: relative parts of
 * each reference shift by (dr, dc), parts marked with $ stay. Text in quotes is left alone.
 * A reference pushed off the sheet becomes #REF!.
 */
export function shiftFormula(src: string, dr: number, dc: number): string {
  if (!src.startsWith("=")) return src;
  let out = "";
  let i = 0;
  const re = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,6})/;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      const j = src.indexOf('"', i + 1);
      const end = j < 0 ? src.length : j + 1;
      out += src.slice(i, end);
      i = end;
      continue;
    }
    const prev = i > 0 ? src[i - 1] : "";
    const m = /[A-Za-z0-9_.]/.test(prev) ? null : re.exec(src.slice(i));
    if (m && !/^[A-Za-z0-9_(.]/.test(src.slice(i + m[0].length))) {
      const [all, cAbs, col, rAbs, row] = m;
      const c = cAbs ? colIndex(col) : colIndex(col) + dc;
      const r = rAbs ? Number(row) - 1 : Number(row) - 1 + dr;
      out += c < 0 || r < 0 ? "#REF!" : `${cAbs}${colName(c)}${rAbs}${r + 1}`;
      i += all.length;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}
