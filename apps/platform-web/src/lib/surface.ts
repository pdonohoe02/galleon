import type { PlatformSurface } from "@galleon/contracts";

const defaultConsumerHost = "app.galleon.localhost";
const defaultPublisherHost = "publishers.galleon.localhost";

export function hostnameFromHostHeader(
  hostHeader: string | null,
  fallback: string,
): string {
  const firstHost = hostHeader?.split(",", 1)[0]?.trim();

  if (!firstHost) {
    return fallback;
  }

  return firstHost.replace(/:\d+$/, "");
}

export function surfaceForHostname(
  hostname: string,
  consumerHost = process.env.GALLEON_CONSUMER_HOST ?? defaultConsumerHost,
  publisherHost = process.env.GALLEON_PUBLISHER_HOST ?? defaultPublisherHost,
): PlatformSurface {
  if (hostname === consumerHost) {
    return "consumer";
  }

  if (hostname === publisherHost) {
    return "publisher";
  }

  return "marketing";
}
