import type { Rng } from "./types";

/** FNV-1a 32-bit string hash. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: small, fast, deterministic PRNG. */
export function seeded(seed: string): Rng {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform pick on a grid: min, min+step, …, max. */
export function pick(rng: Rng, min: number, max: number, step: number): number {
  const n = Math.round((max - min) / step);
  const v = min + Math.floor(rng() * (n + 1)) * step;
  return Number(v.toFixed(10));
}

export function choice<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)];
}
