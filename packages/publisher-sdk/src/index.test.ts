import { describe, expect, it } from "vitest";

import { registerGalleonSourceTools, type WebMcpContext } from "./index";

describe("registerGalleonSourceTools", () => {
  it("registers the page-scoped inspect and unlock tools", async () => {
    const registeredTools: string[] = [];
    const modelContext: WebMcpContext = {
      registerTool: (tool) => {
        registeredTools.push(tool.name);
      },
    };

    const registration = await registerGalleonSourceTools({
      modelContext,
    });

    expect(registration.supported).toBe(true);
    expect(registeredTools).toEqual(["inspect_source", "unlock_source"]);
  });

  it("is a no-op outside a WebMCP-capable page", async () => {
    await expect(registerGalleonSourceTools()).resolves.toMatchObject({
      supported: false,
    });
  });
});
