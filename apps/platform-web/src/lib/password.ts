import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// scrypt from node:crypto: no new dependency, memory-hard, and the parameters
// are recorded in the stored string so they can be raised later without
// invalidating existing hashes.
//
// Stored form:  scrypt$<N>$<r>$<p>$<salt-b64url>$<key-b64url>

const N = 2 ** 15; // cost
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200; // scrypt is not the place to absorb a 1MB body

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

// Bounds for parameters read back from a stored hash. The stored string is
// trusted data in the normal case, but a corrupted, imported, or tampered row
// must not be able to make scrypt throw (a 500 instead of "bad credentials")
// or request a multi-terabyte allocation. N must be a power of two for node's
// scrypt; the caps are generous relative to the defaults above.
const N_MAX = 2 ** 20;
const R_MAX = 32;
const P_MAX = 16;
const MAXMEM = 256 * N_MAX * R_MAX; // fixed ceiling, not derived from the row

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  // Decimal digits only. Number() would also accept "1e3" and "0x8000".
  const n = parseDecimal(parts[1]);
  const r = parseDecimal(parts[2]);
  const p = parseDecimal(parts[3]);
  if (!isPowerOfTwo(n) || n < 2 || n > N_MAX) return false;
  if (!Number.isInteger(r) || r < 1 || r > R_MAX) return false;
  if (!Number.isInteger(p) || p < 1 || p > P_MAX) return false;

  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length === 0 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await derive(password, salt, n, r, p, expected.length);
  } catch {
    // Anything node's scrypt still rejects reads as a non-match, never a 500.
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function parseDecimal(value: string): number {
  return /^\d{1,9}$/.test(value) ? Number(value) : NaN;
}

function isPowerOfTwo(value: number): boolean {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

async function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
  keyLength = KEY_LENGTH,
): Promise<Buffer> {
  const options: ScryptOptions = { N: n, r, p, maxmem: MAXMEM };
  return new Promise((resolve, reject) => {
    // scrypt validates its parameters synchronously and throws rather than
    // calling back; the try keeps that inside the promise.
    try {
      scrypt(password, salt, keyLength, options, (error, key) => {
        if (error) reject(error);
        else resolve(key);
      });
    } catch (error) {
      reject(error);
    }
  });
}
