import type { NextRequest } from "next/server";
import { hasSectionPermission, getSessionUser, saveMediaFile } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const user = await getSessionUser(auth || req.cookies.get("mas_session")?.value);
    if (!hasSectionPermission(user, "content")) return Response.json({ ok: false, error: "عدم دسترسی" }, { status: 403 });
    const body = await req.json();
    const dataUrl = String(body.dataUrl ?? "");
    const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl);
    if (!match) return Response.json({ ok: false, error: "فرمت بارگذاری معتبر نیست." }, { status: 400 });
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length > 25 * 1024 * 1024) return Response.json({ ok: false, error: "حداکثر اندازه فایل ۲۵ مگابایت است." }, { status: 413 });
    const file = await saveMediaFile(String(body.name ?? "upload.bin"), match[1], bytes.length, match[2]);
    return Response.json({ ok: true, file });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
