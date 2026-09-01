import { NextResponse } from "next/server";

import { apiError, unauthenticated } from "@/lib/api";
import { galleon } from "@/lib/galleon";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.wallet_id) return unauthenticated();
    return NextResponse.json({
      purchases: await galleon.getConsumerPurchases(user.wallet_id),
    });
  } catch (error) {
    return apiError(error);
  }
}
