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
