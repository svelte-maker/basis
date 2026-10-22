// Excel date serials (1900 system). Serial 1 is 1 January 1900; serials from 61 on match Excel exactly.

const EPOCH = Date.UTC(1899, 11, 30);
const DAY = 86_400_000;

export function serial(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY);
}

export function fromSerial(n: number): { y: number; m: number; d: number } {
  const dt = new Date(EPOCH + Math.floor(n) * DAY);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export function eomonth(start: number, months: number): number {
  const { y, m } = fromSerial(start);
  const total = y * 12 + (m - 1) + Math.trunc(months);
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  return serial(ny, nm, lastDay(ny, nm));
}

export function edate(start: number, months: number): number {
  const { y, m, d } = fromSerial(start);
  const total = y * 12 + (m - 1) + Math.trunc(months);
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  return serial(ny, nm, Math.min(d, lastDay(ny, nm)));
}

/** YEARFRAC with Excel's day-count bases 0 (US 30/360), 1 (actual/actual), 2 (actual/360), 3 (actual/365), 4 (European 30/360). */
export function yearfrac(a: number, b: number, basis: number): number | null {
  if (a > b) [a, b] = [b, a];
  const s = fromSerial(a), e = fromSerial(b);
  switch (basis) {
    case 0: {
      let d1 = s.d, d2 = e.d;
      const lastFeb = (x: { y: number; m: number; d: number }) => x.m === 2 && x.d === lastDay(x.y, 2);
      if (lastFeb(s) && lastFeb(e)) d2 = 30;
      if (lastFeb(s)) d1 = 30;
      if (d2 === 31 && d1 >= 30) d2 = 30;
      if (d1 === 31) d1 = 30;
      return ((e.y - s.y) * 360 + (e.m - s.m) * 30 + (d2 - d1)) / 360;
    }
    case 1: {
      const days = b - a;
      const withinYear = e.y === s.y || (e.y === s.y + 1 && (e.m < s.m || (e.m === s.m && e.d <= s.d)));
      if (withinYear) {
        let denom = 365;
        if (e.y === s.y) denom = isLeap(s.y) ? 366 : 365;
        else {
          const feb29 = (y: number) => isLeap(y) && serial(y, 2, 29) >= a && serial(y, 2, 29) <= b;
          if (feb29(s.y) || feb29(e.y) || (e.m === 2 && e.d === 29)) denom = 366;
        }
        return days / denom;
      }
      const years = e.y - s.y + 1;
      const total = serial(e.y + 1, 1, 1) - serial(s.y, 1, 1);
      return days / (total / years);
    }
    case 2: return (b - a) / 360;
    case 3: return (b - a) / 365;
    case 4: {
      const d1 = Math.min(s.d, 30), d2 = Math.min(e.d, 30);
      return ((e.y - s.y) * 360 + (e.m - s.m) * 30 + (d2 - d1)) / 360;
    }
  }
  return null;
}
