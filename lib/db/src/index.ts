import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// __dirname is lib/db/src — go up 3 levels to reach workspace root
const dbPath = process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../../database/db.sqlite");

const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });

export * from "./schema";
