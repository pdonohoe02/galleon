function platformUrl(): string {
  return process.env.GALLEON_PLATFORM_API_URL ?? "http://127.0.0.1:3200";
}

function publisherApiKey(): string {
  if (process.env.GALLEON_PUBLISHER_API_KEY) return process.env.GALLEON_PUBLISHER_API_KEY;
  if (process.env.NODE_ENV === "production") {
    throw new Error("GALLEON_PUBLISHER_API_KEY is required in production.");
  }
  return "galleon-local-publisher-key";
}

export async function callGalleon(path: string, body: Record<string, string>) {
  return fetch(`${platformUrl()}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${publisherApiKey()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}
