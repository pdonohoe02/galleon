import { describe, expect, it } from "vitest";

import {
  createDemoSource,
  getPublisherDemoOrigin,
  serviceStatusSchema,
} from "./index";

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

describe("demo publisher URLs", () => {
  it("derives an origin and canonical citation from an explicit deployment URL", () => {
    const deploymentUrl = "https://publisher.example.test/demo/";
    const source = createDemoSource(deploymentUrl);

    expect(getPublisherDemoOrigin(deploymentUrl)).toBe(
      "https://publisher.example.test",
    );
    expect(source.canonical_url).toBe("https://publisher.example.test/");
    expect(source.citation.canonical_url).toBe(source.canonical_url);
  });
});
