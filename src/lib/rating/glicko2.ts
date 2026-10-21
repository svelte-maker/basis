// Glicko-2 (Glickman, 2012). Ratings are on the familiar Glicko scale; conversion happens internally.

export type Rating = { rating: number; rd: number; vol: number };
export type Result = { opponent: Rating; score: number }; // 1 win, 0.5 draw, 0 loss

const SCALE = 173.7178;
const TAU = 0.5;
const EPS = 1e-6;

export const DEFAULT_RATING: Rating = { rating: 1200, rd: 350, vol: 0.06 };
export const MIN_RD = 30;
export const MAX_RD = 350;

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const E = (mu: number, muj: number, phij: number) => 1 / (1 + Math.exp(-g(phij) * (mu - muj)));

/** Update one player after a rating period. Uses the 1500 Glicko-2 centre regardless of our default. */
export function update(player: Rating, results: Result[]): Rating {
  const mu = (player.rating - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const sigma = player.vol;
  if (results.length === 0) {
    // No games: only the deviation grows
    const phiStar = Math.sqrt(phi * phi + sigma * sigma);
    return { rating: player.rating, rd: Math.min(MAX_RD, phiStar * SCALE), vol: sigma };
  }
  let vInv = 0, deltaSum = 0;
  for (const { opponent, score } of results) {
    const muj = (opponent.rating - 1500) / SCALE, phij = opponent.rd / SCALE;
    const e = E(mu, muj, phij), gj = g(phij);
    vInv += gj * gj * e * (1 - e);
    deltaSum += gj * (score - e);
  }
  const v = 1 / vInv;
  const delta = v * deltaSum;

  // Volatility by the Illinois algorithm
  const a = Math.log(sigma * sigma);
  const f = (x: number) => {
    const ex = Math.exp(x);
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * Math.pow(phi * phi + v + ex, 2)) - (x - a) / (TAU * TAU);
  };
  let A = a, B: number;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else { let k = 1; while (f(a - k * TAU) < 0) k++; B = a - k * TAU; }
  let fA = f(A), fB = f(B);
  while (Math.abs(B - A) > EPS) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA /= 2;
    B = C; fB = fC;
  }
  const newSigma = Math.exp(A / 2);
  const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * deltaSum;
  return {
    rating: newMu * SCALE + 1500,
    rd: Math.max(MIN_RD, Math.min(MAX_RD, newPhi * SCALE)),
    vol: newSigma,
  };
}

/**
 * Rate a contest. Every participant is treated as having played every other:
 * a higher finish is a win, an equal finish a draw. Everyone is updated from pre-contest ratings.
 */
export function rateContest<T extends { id: string; rank: number; before: Rating }>(players: T[]): Map<string, Rating> {
  const out = new Map<string, Rating>();
  for (const p of players) {
    const results: Result[] = players
      .filter((q) => q.id !== p.id)
      .map((q) => ({ opponent: q.before, score: p.rank < q.rank ? 1 : p.rank === q.rank ? 0.5 : 0 }));
    out.set(p.id, update(p.before, results));
  }
  return out;
}
