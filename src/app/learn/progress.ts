// Per-browser lesson progress. A convenience only: it can be empty in a private window, so nothing depends on it.
const KEY = "basis:learn:done";

export function readDone(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markDone(slug: string): void {
  try {
    const s = readDone();
    s.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    // storage blocked: progress just isn't remembered
  }
}
