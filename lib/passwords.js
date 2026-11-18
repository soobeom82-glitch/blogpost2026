import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  if (stored.startsWith("scrypt:")) {
    const [, salt, expected] = stored.split(":");
    const hash = await scrypt(password, salt, 64);
    return safeEqual(hash.toString("hex"), expected);
  }
  // Existing comments remain editable; successful edits upgrade their hash.
  return safeEqual(createHash("sha256").update(password).digest("hex"), stored);
}
