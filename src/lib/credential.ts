import { randomBytes } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

export function newCredentialId(): string {
  const b = randomBytes(8);
  const chars = Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
  return `BX-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
