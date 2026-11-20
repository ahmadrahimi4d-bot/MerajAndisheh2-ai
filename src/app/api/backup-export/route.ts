import type { NextRequest } from "next/server";
import { exportBackupJson, getSessionUser, hasSectionPermission } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const user = await getSessionUser(auth || req.cookies.get("mas_session")?.value);
  if (!hasSectionPermission(user, "backups")) return Response.json({ ok: false, error: "عدم دسترسی" }, { status: 403 });
  const data = await exportBackupJson();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="meraj-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
