import { describe, expect, it } from "vitest";

import { hostnameFromHostHeader, surfaceForHostname } from "./surface";

describe("hostnameFromHostHeader", () => {
  it("uses the first forwarded host and removes its port", () => {
    expect(
      hostnameFromHostHeader(
        "app.galleon.localhost:3000, edge.internal",
        "127.0.0.1",
      ),
    ).toBe("app.galleon.localhost");
  });
});

describe("surfaceForHostname", () => {
  it.each([
    ["galleon.localhost", "marketing"],
    ["app.galleon.localhost", "consumer"],
    ["publishers.galleon.localhost", "publisher"],
  ] as const)("maps %s to %s", (hostname, expected) => {
    expect(
      surfaceForHostname(
        hostname,
        "app.galleon.localhost",
        "publishers.galleon.localhost",
      ),
    ).toBe(expected);
  });
});
