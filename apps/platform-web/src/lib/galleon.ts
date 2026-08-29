import { createGalleonService } from "@galleon/database";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://galleon:galleon@127.0.0.1:5432/galleon";

export const galleon = createGalleonService(databaseUrl);
