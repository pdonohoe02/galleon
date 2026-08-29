import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const body: unknown = await request.json().catch(() => undefined);

  if (
    typeof body !== "object" ||
    body === null ||
    !("entitlement_token" in body) ||
    typeof body.entitlement_token !== "string"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ENTITLEMENT_INVALID",
          message: "A valid entitlement token is required.",
          retryable: false,
          request_id: requestId,
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "SOURCE_LOCKED",
        message:
          "Entitlement redemption is not enabled in the executable skeleton.",
        retryable: true,
        request_id: requestId,
      },
    },
    { status: 501 },
  );
}
