/**
 * Runs lead_fields_migration.sql against Supabase Postgres.
 * Requires SUPABASE_DB_PASSWORD in .env.local (from Supabase → Settings → Database).
 *
 * Usage: npm run migrate:lead-fields
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import pg from "pg";

const ROOT = process.cwd();

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const projectRef = url.replace("https://", "").replace(".supabase.co", "");

function buildConnectionString() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (!dbPassword) {
    console.error(
      "Missing SUPABASE_DB_PASSWORD in .env.local\n" +
        "Get it from Supabase Dashboard → Project Settings → Database → Database password"
    );
    process.exit(1);
  }
  const encoded = encodeURIComponent(dbPassword);
  return `postgresql://postgres.${projectRef}:${encoded}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
}

const sqlPath = join(ROOT, "supabase/lead_fields_migration.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString: buildConnectionString(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected. Running migration...");
  await client.query(sql);
  console.log("Migration completed successfully.");

  const verify = await client.query(
    "select column_name from information_schema.columns where table_name = 'leads' and column_name in ('disposition','service_type','cva_score','lr_score') order by column_name"
  );
  console.log("Columns present:", verify.rows.map((r) => r.column_name).join(", "));
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
