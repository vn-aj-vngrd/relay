import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

// Keep each serverless instance deliberately small. The transaction pooler absorbs
// cross-instance concurrency; opening ten clients per instance can exhaust a free
// Supabase database during a traffic spike before application limits take effect.
const connection = postgres(getServerEnv().DATABASE_URL, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(connection, { schema });
