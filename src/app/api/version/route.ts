import { getAppRelease } from "@/lib/app-release";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getAppRelease(), {
    headers: { "Cache-Control": "no-store" },
  });
}
