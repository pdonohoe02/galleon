import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 10, prepare: false });

  // drizzle() mutates the client it is given: it swaps the date and JSON
  // serializers (and parsers) on `client.options` for identity functions so
  // that it can do its own conversion. The service layer talks to the raw
  // client, and with identity serializers a Date or object parameter reaches
  // the wire unserialized and postgres.js throws from Buffer.byteLength.
  // Snapshot the serializers first and put them back afterwards. Parsers are
  // left as drizzle set them so the shape of query results does not change.
  const serializers = { ...client.options.serializers };
  const db = drizzle(client, { schema });
  Object.assign(client.options.serializers, serializers);

  return { client, db };
}
