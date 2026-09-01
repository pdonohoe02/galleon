// Apply pending drizzle migrations without creating a schema.
//
// drizzle-orm's migrator always runs `CREATE SCHEMA IF NOT EXISTS "drizzle"`
// for its bookkeeping table before applying anything. On floo every app shares
// one database (floo_apps) and gets exactly one schema per environment; the
// app role can CREATE TABLE inside that schema but has no CREATE on the
// database, so the CREATE SCHEMA fails with 42501 and drizzle-kit exits before
// a single migration runs (and swallows the error behind its spinner).
//
// This mirrors drizzle's migrator step for step -- same journal, same
// __drizzle_migrations table and columns, same hash and created_at comparison,
// same migration files from `drizzle-kit generate` -- and leaves out only the
// CREATE SCHEMA. The bookkeeping table is created unqualified, so it lands in
// the first schema on search_path: the app's own schema on floo, `public`
// locally.
//
// drizzle-kit also qualifies every foreign-key target as "public"."table",
// because schema.ts declares tables without a schema and the generator
// assumes public. On floo the tables are not in public, so those references
// can never resolve. The prefix is stripped at apply time: an unqualified name
// resolves through search_path (the app schema first, then public), which is
// correct everywhere. Normalising here rather than hand-editing the generated
// SQL means the next `drizzle-kit generate` cannot reintroduce the problem.
//
// A local database previously migrated with `drizzle-kit migrate` is adopted
// on first run: its drizzle.__drizzle_migrations history is copied across, so
// nothing is re-applied.

import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  "postgresql://galleon:galleon@127.0.0.1:5432/galleon";

const migrationsFolder = new URL("../migrations", import.meta.url).pathname;
const migrations = readMigrationFiles({ migrationsFolder });

// onnotice silences the "already exists, skipping" NOTICE from
// CREATE TABLE IF NOT EXISTS on every run after the first.
const sql = postgres(url, { max: 1, connect_timeout: 15, onnotice: () => {} });

try {
  const [{ schema }] = await sql`select current_schema() as schema`;

  await sql`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`;

  // A database that was previously migrated with `drizzle-kit migrate` keeps
  // its history in drizzle.__drizzle_migrations. On the first run here, adopt
  // that history so already-applied migrations are not re-applied. Only ever
  // relevant locally; on floo the drizzle schema cannot exist.
  const [{ empty }] = await sql`
    select not exists (select 1 from "__drizzle_migrations") as empty`;
  if (empty) {
    const [{ legacy }] = await sql`
      select to_regclass('drizzle.__drizzle_migrations') is not null as legacy`;
    if (legacy) {
      const adopted = await sql`
        insert into "__drizzle_migrations" (hash, created_at)
        select hash, created_at from drizzle.__drizzle_migrations
        order by created_at
        returning hash`;
      console.log(`migrations: adopted ${adopted.length} already-applied from drizzle.__drizzle_migrations`);
    }
  }

  const [last] = await sql`
    select id, hash, created_at from "__drizzle_migrations"
    order by created_at desc limit 1`;
  const lastMillis = last?.created_at ? Number(last.created_at) : 0;

  const pending = migrations.filter((m) => m.folderMillis > lastMillis);

  if (pending.length === 0) {
    console.log(`migrations: up to date (${migrations.length} applied) in schema ${schema}`);
  } else {
    await sql.begin(async (tx) => {
      for (const migration of pending) {
        for (const statement of migration.sql) {
          await tx.unsafe(statement.replaceAll('"public".', ""));
        }
        await tx`
          insert into "__drizzle_migrations" ("hash", "created_at")
          values (${migration.hash}, ${migration.folderMillis})`;
        console.log(`applied ${new Date(migration.folderMillis).toISOString()}  ${migration.hash.slice(0, 12)}`);
      }
    });
    console.log(`migrations: applied ${pending.length} in schema ${schema}`);
  }
} finally {
  await sql.end();
}
