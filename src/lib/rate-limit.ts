import "server-only";

import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db/client";
import { rateLimitBuckets } from "@/db/schema";

export type RateLimitRule = {
  scope: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function digest(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export async function requestIdentity(userId?: string | null) {
  if (userId) return `user:${userId}`;
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-vercel-forwarded-for") ?? requestHeaders.get("x-forwarded-for") ?? "unknown";
  return `ip:${forwarded.split(",")[0]?.trim() || "unknown"}`;
}

export async function checkRateLimit(rule: RateLimitRule, identity: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const bucket = Math.floor(now / windowMs);
  const key = digest(`${rule.scope}:${identity}:${bucket}`);
  const expiresAt = new Date((bucket + 2) * windowMs);

  const [record] = await db
    .insert(rateLimitBuckets)
    .values({ key, expiresAt })
    .onConflictDoUpdate({
      target: rateLimitBuckets.key,
      set: { count: sql`${rateLimitBuckets.count} + 1` },
    })
    .returning({ count: rateLimitBuckets.count });

  const count = record?.count ?? rule.limit + 1;
  const retryAfterSeconds = Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000));
  return {
    allowed: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds,
  };
}

export async function assertRateLimit(rule: RateLimitRule, identity: string, message: string) {
  const result = await checkRateLimit(rule, identity);
  if (!result.allowed) {
    const error = new Error(message);
    error.name = "RateLimitError";
    throw error;
  }
  return result;
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}
