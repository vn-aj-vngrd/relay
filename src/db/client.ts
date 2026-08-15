import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

const connection = postgres(getServerEnv().DATABASE_URL, { prepare: false, max: 10 });
export const db = drizzle(connection, { schema });
