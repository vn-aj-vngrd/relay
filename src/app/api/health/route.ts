import { timingSafeEqual } from "node:crypto";

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { getHealthcheckSecret } from "@/lib/env";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function matchesSecret(value: string | null, secret: string) {
  if (!value?.startsWith("Bearer ") || secret.length < 32) return false;
  const supplied = Buffer.from(value.slice(7));
  const expected = Buffer.from(secret);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("deep") !== "1")
    return Response.json(
      {
        status: "ok",
        release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
      },
      { headers: noStoreHeaders }
    );

  const secret = getHealthcheckSecret();
  if (!matchesSecret(request.headers.get("authorization"), secret))
    return Response.json(
      { status: "unauthorized" },
      { status: 401, headers: noStoreHeaders }
    );

  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { status: "ok", database: "reachable" },
      { headers: noStoreHeaders }
    );
  } catch {
    return Response.json(
      { status: "degraded", database: "unreachable" },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
