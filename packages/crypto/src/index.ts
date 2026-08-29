export const GALLEON_SIGNING_ALGORITHM = "ES256" as const;

export const GALLEON_TOKEN_TYPES = {
  entitlement: "galleon-entitlement+jwt",
  offer: "galleon-offer+jwt",
} as const;

export type GalleonTokenType =
  (typeof GALLEON_TOKEN_TYPES)[keyof typeof GALLEON_TOKEN_TYPES];
