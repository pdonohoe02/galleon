import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://galleon:galleon@127.0.0.1:5432/galleon",
  },
  strict: true,
  verbose: true,
});
