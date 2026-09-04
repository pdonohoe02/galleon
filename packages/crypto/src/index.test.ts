import { exportJWK, generateKeyPair } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";

const ENV = "GALLEON_SIGNING_KEY_JWK";

// The key is cached at module scope, so each case loads a fresh module.
async function loadCrypto(envValue: string | undefined) {
  vi.resetModules();
  if (envValue === undefined) delete process.env[ENV];
  else process.env[ENV] = envValue;
  return import("./index");
}

async function privateJwkJson(): Promise<string> {
  const { privateKey } = await generateKeyPair("ES256", { extractable: true });
  return JSON.stringify(await exportJWK(privateKey));
}

describe("signing key from GALLEON_SIGNING_KEY_JWK", () => {
  afterEach(() => {
    delete process.env[ENV];
  });

  it("publishes the env key's public half, without the private scalar", async () => {
    const json = await privateJwkJson();
    const { x, y } = JSON.parse(json) as { x: string; y: string };
    const crypto = await loadCrypto(json);

    const { keys } = await crypto.getGalleonJwks();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({ crv: "P-256", kty: "EC", x, y });
    expect(keys[0]).not.toHaveProperty("d");
  });

  it("gives two separately loaded modules the same key, as two containers would", async () => {
    const json = await privateJwkJson();
    const first = await (await loadCrypto(json)).getGalleonJwks();
    const second = await (await loadCrypto(json)).getGalleonJwks();
    expect(second.keys[0]).toEqual(first.keys[0]);
  });

  it("rejects a JWK that is not a private P-256 key", async () => {
    const json = await privateJwkJson();
    const { d: _omitted, ...publicOnly } = JSON.parse(json) as Record<string, string>;
    const crypto = await loadCrypto(JSON.stringify(publicOnly));
    await expect(crypto.getGalleonJwks()).rejects.toThrow("private P-256 JWK");
  });
});
