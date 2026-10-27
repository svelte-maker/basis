import type { Prisma } from "@prisma/client";

/**
 * Solves that count towards public numbers: members only. Admin and recruiter accounts
 * can practise, but their activity is never shown as social proof.
 */
export const MEMBER_SOLVES = { everSolved: true, user: { role: "MEMBER" } } satisfies Prisma.PracticeStateWhereInput;

/** "1 person solved this", "3 people solved this". */
export function peopleDid(n: number, did: string): string {
  return `${n} ${n === 1 ? "person" : "people"} ${did}`;
}
