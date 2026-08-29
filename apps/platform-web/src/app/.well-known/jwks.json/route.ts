import { getGalleonJwks } from "@galleon/crypto";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(await getGalleonJwks(), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
