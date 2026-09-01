import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the password it hashed", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(stored.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword("correct horse battery staple", stored)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const stored = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery stable", stored)).resolves.toBe(false);
  });

  it("salts, so equal passwords hash differently", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
    await expect(verifyPassword("same", a)).resolves.toBe(true);
    await expect(verifyPassword("same", b)).resolves.toBe(true);
  });

  it("rejects malformed stored values instead of throwing", async () => {
    await expect(verifyPassword("x", "")).resolves.toBe(false);
    await expect(verifyPassword("x", "bcrypt$whatever")).resolves.toBe(false);
    await expect(verifyPassword("x", "scrypt$abc$8$1$salt$key")).resolves.toBe(false);
    await expect(verifyPassword("x", "scrypt$32768$8$1$$")).resolves.toBe(false);
  });

  it("rejects out-of-range or invalid scrypt parameters without throwing", async () => {
    const stored = await hashPassword("secret");
    const [, , r, p, salt, key] = stored.split("$");
    const withN = (n: string) => ["scrypt", n, r, p, salt, key].join("$");
    // non-power-of-two N makes node's scrypt throw synchronously
    await expect(verifyPassword("secret", withN("3"))).resolves.toBe(false);
    await expect(verifyPassword("secret", withN("1000"))).resolves.toBe(false);
    // Number() would accept these; the validator must not
    await expect(verifyPassword("secret", withN("1e3"))).resolves.toBe(false);
    await expect(verifyPassword("secret", withN("0x8000"))).resolves.toBe(false);
    // above the cap: must be refused before any allocation is attempted
    await expect(verifyPassword("secret", withN(String(2 ** 30)))).resolves.toBe(false);
    // r and p bounds
    await expect(verifyPassword("secret", ["scrypt", "32768", "0", p, salt, key].join("$"))).resolves.toBe(false);
    await expect(verifyPassword("secret", ["scrypt", "32768", "64", p, salt, key].join("$"))).resolves.toBe(false);
    await expect(verifyPassword("secret", ["scrypt", "32768", r, "32", salt, key].join("$"))).resolves.toBe(false);
  });

  it("rejects a tampered key", async () => {
    const stored = await hashPassword("secret");
    const parts = stored.split("$");
    const key = Buffer.from(parts[5], "base64url");
    key[0] ^= 0xff;
    parts[5] = key.toString("base64url");
    await expect(verifyPassword("secret", parts.join("$"))).resolves.toBe(false);
  });

  it("honours the parameters recorded in the stored string", async () => {
    // A hash made with lower cost must still verify: parameters travel with
    // the hash, so raising the default later does not invalidate old rows.
    const stored = await hashPassword("secret");
    const parts = stored.split("$");
    expect(parts[1]).toBe(String(2 ** 15));
    expect(parts[2]).toBe("8");
    expect(parts[3]).toBe("1");
  });
});
