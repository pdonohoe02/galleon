type JsonSchema = Record<string, unknown>;

type WebMcpTool<Input extends Record<string, unknown>> = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: {
    readOnlyHint?: boolean;
  };
  execute: (input: Input) => Promise<unknown> | unknown;
};

export type WebMcpContext = {
  registerTool: <Input extends Record<string, unknown>>(
    tool: WebMcpTool<Input>,
  ) => Promise<void> | void;
  unregisterTool?: (name: string) => Promise<void> | void;
};

declare global {
  interface Document {
    modelContext?: WebMcpContext;
  }
}

export type RegisterGalleonSourceToolsOptions = {
  inspectUrl?: string;
  modelContext?: WebMcpContext;
  onUnlock?: (result: unknown) => void;
  unlockUrl?: string;
};

export type GalleonSourceToolsRegistration = {
  dispose: () => Promise<void>;
  supported: boolean;
};

const inspectSourceInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

const unlockSourceInputSchema = {
  type: "object",
  properties: {
    entitlement_token: {
      type: "string",
      minLength: 100,
      maxLength: 8192,
      description:
        "Short-lived Galleon entitlement returned by purchase_offer.",
    },
  },
  required: ["entitlement_token"],
  additionalProperties: false,
} as const;

async function parseResponse(response: Response): Promise<unknown> {
  const result: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      `Galleon publisher request failed with HTTP ${response.status}`,
    );
  }

  return result;
}

export async function registerGalleonSourceTools(
  options: RegisterGalleonSourceToolsOptions = {},
): Promise<GalleonSourceToolsRegistration> {
  const modelContext =
    options.modelContext ??
    (typeof document === "undefined" ? undefined : document.modelContext);

  if (!modelContext) {
    return {
      dispose: async () => undefined,
      supported: false,
    };
  }

  const inspectUrl = options.inspectUrl ?? "/api/galleon/offer";
  const unlockUrl = options.unlockUrl ?? "/api/galleon/unlock";

  await modelContext.registerTool({
    name: "inspect_source",
    description:
      "Inspect the free metadata, provenance, exact price, rights, and signed purchase offer for the source on this page.",
    inputSchema: inspectSourceInputSchema,
    annotations: { readOnlyHint: true },
    execute: async () =>
      parseResponse(
        await fetch(inspectUrl, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        }),
      ),
  });

  await modelContext.registerTool<{ entitlement_token: string }>({
    name: "unlock_source",
    description:
      "Redeem a short-lived Galleon entitlement for the source visible on this page and return its canonical citation and paid content.",
    inputSchema: unlockSourceInputSchema,
    annotations: { readOnlyHint: false },
    execute: async ({ entitlement_token }) => {
      const result = await parseResponse(
        await fetch(unlockUrl, {
          body: JSON.stringify({ entitlement_token }),
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
      );
      options.onUnlock?.(result);
      return result;
    },
  });

  return {
    supported: true,
    dispose: async () => {
      await modelContext.unregisterTool?.("inspect_source");
      await modelContext.unregisterTool?.("unlock_source");
    },
  };
}
