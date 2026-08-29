import { DEMO_IDS } from "@galleon/contracts";
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { galleon } from "@/lib/galleon";

export async function GET() {
  try {
    return NextResponse.json(await galleon.getWalletSummary(DEMO_IDS.consumerWallet));
  } catch (error) {
    return apiError(error);
  }
}
