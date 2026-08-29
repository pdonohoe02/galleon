import { randomUUID } from "node:crypto";

import { DEMO_IDS } from "@galleon/contracts";
import { describe, expect, it } from "vitest";

import { createGalleonService } from "./galleon-service";

const describeIntegration =
  process.env.GALLEON_INTEGRATION_TESTS === "true" ? describe.sequential : describe.skip;

describeIntegration("Galleon demo ledger flow", () => {
  const service = createGalleonService();
  const sessionHash = "a".repeat(64);
  const nonce = "test-redemption-nonce-with-at-least-128-bits";

  it("posts one balanced charge, retries safely, and gives returning buyers fresh access", async () => {
    const before = await service.getWalletSummary();
    const presentation = await service.createOfferPresentation({
      resourceId: DEMO_IDS.resource,
      publisherSessionHash: sessionHash,
      redemptionNonce: nonce,
    });
    const input = {
      offer_token: presentation.offer.offer_token,
      idempotency_key: `vitest:${randomUUID()}`,
      expected_amount_minor: 7,
      expected_currency: "USD" as const,
    };

    const first = await service.purchaseOffer(DEMO_IDS.consumerWallet, input);
    const afterFirst = await service.getWalletSummary();
    expect(afterFirst.balance_minor).toBe(
      before.balance_minor - (first.payment.charged ? 7 : 0),
    );
    expect(await service.assertLedgerBalanced()).toBe(true);

    const retry = await service.purchaseOffer(DEMO_IDS.consumerWallet, input);
    expect(retry.purchase_id).toBe(first.purchase_id);
    expect((await service.getWalletSummary()).balance_minor).toBe(afterFirst.balance_minor);

    const freshPresentation = await service.createOfferPresentation({
      resourceId: DEMO_IDS.resource,
      publisherSessionHash: sessionHash,
      redemptionNonce: nonce,
    });
    const returning = await service.purchaseOffer(DEMO_IDS.consumerWallet, {
      ...input,
      offer_token: freshPresentation.offer.offer_token,
      idempotency_key: `vitest:${randomUUID()}`,
    });
    expect(returning.status).toBe("already_purchased");
    expect(returning.payment.charged).toBe(false);
    expect(returning.entitlement.token).not.toBe(first.entitlement.token);

    const redemption = await service.redeemEntitlement({
      entitlementToken: returning.entitlement.token,
      publisherOrigin: "http://127.0.0.1:3001",
      publisherSessionHash: sessionHash,
      redemptionNonce: nonce,
      resourceId: DEMO_IDS.resource,
    });
    expect(redemption.status).toBe("redeemed");
    const retryRedemption = await service.redeemEntitlement({
      entitlementToken: returning.entitlement.token,
      publisherOrigin: "http://127.0.0.1:3001",
      publisherSessionHash: sessionHash,
      redemptionNonce: nonce,
      resourceId: DEMO_IDS.resource,
    });
    expect(retryRedemption.status).toBe("already_redeemed");
  });
});
