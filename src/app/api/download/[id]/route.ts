import type { NextRequest } from "next/server";
import { getSessionUser, getSettings, recordDownload } from "@/core/server";
import { getSetting } from "@/core/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = getSetting<{ requireLogin?: boolean }>(await getSettings(), "downloadGate", { requireLogin: true });
  const user = await getSessionUser(req.cookies.get("mas_session")?.value);
  if (gate.requireLogin !== false && !user) {
    return Response.json({ ok: false, error: "login_required", message: "برای دانلود، ابتدا وارد حساب کاربری شوید." }, { status: 401 });
  }
  const item = await recordDownload(user?.id ?? null, Number(id));
  if (!item) return Response.json({ ok: false, error: "Content not found" }, { status: 404 });
  const target = item.fileUrl || item.externalUrl;
  if (!target) return Response.json({ ok: false, error: "فایل اصلی پیوست نشده است." }, { status: 404 });
  let url = target;
  if (target.startsWith("/api/media/")) url = `${target}${target.includes("?") ? "&" : "?"}dl=1`;
  else if (target.startsWith("/")) url = `${target}${target.includes("?") ? "&" : "?"}download=1`;
  return Response.redirect(new URL(url, req.url), 302);
}
