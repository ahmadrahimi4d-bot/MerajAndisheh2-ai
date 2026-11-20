import { ensureSeed, maybeRunWeeklyBackup } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Call weekly from any host cron: GET /api/cron/backup */
export async function GET() {
  try {
    await ensureSeed();
    await maybeRunWeeklyBackup();
    return Response.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Backup check failed" }, { status: 500 });
  }
}
