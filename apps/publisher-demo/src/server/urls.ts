import { getPublisherDemoOrigin } from "@galleon/contracts";

export function consumerUrl(): string {
  return (
    process.env.GALLEON_CONSUMER_URL ?? "http://app.galleon.localhost:3200"
  );
}

export function publisherOrigin(): string {
  return getPublisherDemoOrigin(process.env.GALLEON_PUBLISHER_DEMO_URL);
}
