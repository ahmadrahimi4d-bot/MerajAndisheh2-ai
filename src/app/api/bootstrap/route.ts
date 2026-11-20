import { getBootstrap, maybeRunWeeklyBackup } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    // Lazy seven-day scheduler: no long-lived process is required in the preview.
    await maybeRunWeeklyBackup().catch(() => undefined);
    return Response.json({ ok: true, data: await getBootstrap() });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Bootstrap failed" }, { status: 500 });
  }
}
