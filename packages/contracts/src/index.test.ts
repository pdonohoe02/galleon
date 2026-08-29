import { describe, expect, it } from "vitest";

import { serviceStatusSchema } from "./index";

describe("serviceStatusSchema", () => {
  it("accepts the demo-ready service contract", () => {
    expect(
      serviceStatusSchema.parse({
        name: "galleon-mcp",
        mode: "demo",
        status: "ready",
        version: "0.0.0",
      }),
    ).toMatchObject({ status: "ready" });
  });
});
