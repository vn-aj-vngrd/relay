import { createHash } from "node:crypto";

import postgres from "postgres";

type ScopeName = "all-auth" | "password-login" | "password-reset" | "signup";

type Rule = {
  scope: string;
  windowSeconds: number;
};

const rules: Record<Exclude<ScopeName, "all-auth">, Rule> = {
  signup: { scope: "password-sign-up", windowSeconds: 3600 },
  "password-reset": { scope: "password-reset", windowSeconds: 3600 },
  "password-login": { scope: "password-sign-in", windowSeconds: 600 },
};

function usage(): never {
  console.error(`Usage:
  pnpm auth:reset-limits -- --scope <signup|password-reset|password-login|all-auth> \\
    [--email player@example.com] [--ip 203.0.113.10] --confirm-production

At least one of --email or --ip is required. Only the matching current fixed-window buckets are deleted.`);
  process.exit(1);
}

function valueAfter(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) usage();
if (!args.includes("--confirm-production")) {
  throw new Error("Refusing to change rate-limit buckets without --confirm-production.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const scope = valueAfter(args, "--scope") as ScopeName | undefined;
const email = valueAfter(args, "--email")?.trim().toLowerCase();
const ip = valueAfter(args, "--ip")?.trim();
if (!scope || !(scope in rules || scope === "all-auth")) usage();
if (!email && !ip) usage();
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("--email must be a valid email address.");
if (ip && !/^[0-9a-f:.]+$/i.test(ip)) throw new Error("--ip must be an IPv4 or IPv6 address.");

const selectedRules = scope === "all-auth" ? Object.values(rules) : [rules[scope]];
const identities = [email ? `email:${email}` : null, ip ? `ip:${ip}` : null].filter((value): value is string =>
  Boolean(value),
);
const keys = selectedRules.flatMap((rule) => {
  const bucket = Math.floor(Date.now() / (rule.windowSeconds * 1000));
  return identities.map((identity) => digest(`${rule.scope}:${identity}:${bucket}`));
});

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const deleted = await sql<{ key: string }[]>`
    delete from rate_limit_buckets
    where key in ${sql(keys)}
    returning key
  `;
  console.log(`Reset ${deleted.length} matching auth rate-limit bucket(s).`);
  if (deleted.length === 0) console.log("No matching current-window buckets existed; the identity is already clear.");
} finally {
  await sql.end();
}
