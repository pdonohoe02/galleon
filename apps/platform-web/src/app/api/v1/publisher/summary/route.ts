import { DEMO_IDS } from "@galleon/contracts";
import { NextResponse } from "next/server";

import { apiError, isPublisherAuthorized, unauthorized } from "@/lib/api";
import { galleon } from "@/lib/galleon";

export async function GET(request: Request) {
  if (!isPublisherAuthorized(request)) return unauthorized();
  try {
    return NextResponse.json(
      await galleon.getPublisherSummary(DEMO_IDS.publisher),
    );
  } catch (error) {
    return apiError(error);
  }
}
