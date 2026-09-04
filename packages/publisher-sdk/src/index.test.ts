import { describe, expect, it } from "vitest";

import { registerGalleonSourceTools, type WebMcpContext } from "./index";

describe("registerGalleonSourceTools", () => {
  it("registers the page-scoped inspect and unlock tools", async () => {
    const registeredTools: string[] = [];
    const descriptions: string[] = [];
    const modelContext: WebMcpContext = {
      registerTool: (tool) => {
        registeredTools.push(tool.name);
        descriptions.push(tool.description);
      },
    };

    const registration = await registerGalleonSourceTools({
      modelContext,
    });

    expect(registration.supported).toBe(true);
    expect(registeredTools).toEqual(["inspect_source", "unlock_source"]);
    expect(descriptions[0]).toContain("7¢ per read");
    expect(descriptions[0]).toContain("Do not cite or summarize");
    expect(descriptions[1]).toContain("7¢ per read");
    expect(descriptions[1]).toContain("required before");
  });

  it("is a no-op outside a WebMCP-capable page", async () => {
    await expect(registerGalleonSourceTools()).resolves.toMatchObject({
      supported: false,
    });
  });
});
