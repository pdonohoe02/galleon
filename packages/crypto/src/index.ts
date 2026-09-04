import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { EntitlementClaims, OfferPresentationClaims } from "@galleon/contracts";
import {
  entitlementClaimsSchema,
  offerPresentationClaimsSchema,
} from "@galleon/contracts";
import {
  SignJWT,
  exportJWK,
  generateKeyPair,
  importJWK,
  jwtVerify,
  type JWK,
} from "jose";

export const GALLEON_SIGNING_ALGORITHM = "ES256" as const;
export const GALLEON_SIGNING_KID = "galleon-local-2026-01";

export const GALLEON_TOKEN_TYPES = {
  entitlement: "galleon-entitlement+jwt",
  offer: "galleon-offer+jwt",
} as const;

export type GalleonTokenType =
  (typeof GALLEON_TOKEN_TYPES)[keyof typeof GALLEON_TOKEN_TYPES];

type KeyFile = { privateJwk: JWK; publicJwk: JWK };
let keyFilePromise: Promise<KeyFile> | undefined;

function signingKeyPath(): string {
  return process.env.GALLEON_SIGNING_KEY_PATH ?? "/tmp/galleon-demo-signing-private.jwk.json";
}

// Deployed, platform-web runs as several services (web, app, console), each in
// its own container. A key generated to a file is private to one container, so
// an offer signed by one service fails verification on another. When
// GALLEON_SIGNING_KEY_JWK is set (the same private P-256 JWK on every
// service), it is the key, and no file is read or written.
function keyFileFromEnv(): KeyFile | undefined {
  const raw = process.env.GALLEON_SIGNING_KEY_JWK;
  if (!raw) return undefined;
  const privateJwk = JSON.parse(raw) as JWK;
  if (
    privateJwk.kty !== "EC" ||
    privateJwk.crv !== "P-256" ||
    !privateJwk.d ||
    !privateJwk.x ||
    !privateJwk.y
  ) {
    throw new Error("GALLEON_SIGNING_KEY_JWK must be a private P-256 JWK.");
  }
  const publicJwk: JWK = {
    crv: privateJwk.crv,
    kty: privateJwk.kty,
    x: privateJwk.x,
    y: privateJwk.y,
  };
  return { privateJwk, publicJwk };
}

async function createKeyFile(path: string): Promise<KeyFile> {
  const { privateKey, publicKey } = await generateKeyPair(
    GALLEON_SIGNING_ALGORITHM,
    { extractable: true },
  );
  const privateJwk = await exportJWK(privateKey);
  const publicJwk = await exportJWK(publicKey);
  const value = JSON.stringify({ privateJwk, publicJwk });
  await mkdir(dirname(path), { recursive: true });

  try {
    await writeFile(path, value, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return { privateJwk, publicJwk };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return JSON.parse(await readFile(path, "utf8")) as KeyFile;
  }
}

async function loadKeyFile(): Promise<KeyFile> {
  if (!keyFilePromise) {
    const fromEnv = keyFileFromEnv();
    if (fromEnv) {
      keyFilePromise = Promise.resolve(fromEnv);
    } else {
      const path = signingKeyPath();
      keyFilePromise = readFile(/* turbopackIgnore: true */ path, "utf8")
        .then((value) => JSON.parse(value) as KeyFile)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
          return createKeyFile(path);
        });
    }
  }
  return await keyFilePromise;
}

export async function getGalleonJwks() {
  const { publicJwk } = await loadKeyFile();
  return {
    keys: [{
      ...publicJwk,
      alg: GALLEON_SIGNING_ALGORITHM,
      kid: GALLEON_SIGNING_KID,
      use: "sig",
    }],
  };
}

async function signClaims(
  claims: OfferPresentationClaims | EntitlementClaims,
  type: GalleonTokenType,
): Promise<string> {
  const { privateJwk } = await loadKeyFile();
  const key = await importJWK(privateJwk, GALLEON_SIGNING_ALGORITHM);
  const { aud, exp, iat, iss, jti, sub, ...custom } = claims;
  return new SignJWT(custom)
    .setProtectedHeader({ alg: GALLEON_SIGNING_ALGORITHM, kid: GALLEON_SIGNING_KID, typ: type })
    .setIssuer(iss)
    .setAudience(aud)
    .setSubject(sub)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(key);
}

export function signOfferPresentation(claims: OfferPresentationClaims): Promise<string> {
  return signClaims(claims, GALLEON_TOKEN_TYPES.offer);
}

export function signEntitlement(claims: EntitlementClaims): Promise<string> {
  return signClaims(claims, GALLEON_TOKEN_TYPES.entitlement);
}

async function verifyClaims(token: string, expectedType: GalleonTokenType, audience: string) {
  const { publicJwk } = await loadKeyFile();
  const key = await importJWK(publicJwk, GALLEON_SIGNING_ALGORITHM);
  const result = await jwtVerify(token, key, {
    algorithms: [GALLEON_SIGNING_ALGORITHM],
    audience,
    clockTolerance: 5,
    typ: expectedType,
  });
  if (result.protectedHeader.kid !== GALLEON_SIGNING_KID) {
    throw new Error("Unsupported Galleon signing key.");
  }
  return result.payload;
}

export async function verifyOfferPresentation(
  token: string,
  audience: string,
): Promise<OfferPresentationClaims> {
  return offerPresentationClaimsSchema.parse(
    await verifyClaims(token, GALLEON_TOKEN_TYPES.offer, audience),
  );
}

export async function verifyEntitlement(
  token: string,
  audience: string,
): Promise<EntitlementClaims> {
  return entitlementClaimsSchema.parse(
    await verifyClaims(token, GALLEON_TOKEN_TYPES.entitlement, audience),
  );
}
