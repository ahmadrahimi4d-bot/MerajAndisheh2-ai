import type { NextRequest } from "next/server";
import { getMediaFile } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getMediaFile(Number(id));
  if (!row) return Response.json({ ok: false, error: "File not found" }, { status: 404 });
  const data = Buffer.from(row.data, "base64");
  const attachment = req.nextUrl.searchParams.get("dl") === "1";
  const disposition = `${attachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(row.name)}`;
  const baseHeaders: Record<string, string> = {
    "Content-Type": row.mimeType,
    "Content-Disposition": disposition,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  };
  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = Math.min(Number(match[1]), Math.max(0, data.length - 1));
      const end = match[2] ? Math.min(Number(match[2]), data.length - 1) : data.length - 1;
      const slice = data.subarray(start, end + 1);
      return new Response(new Uint8Array(slice), {
        status: 206,
        headers: { ...baseHeaders, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": String(slice.length) },
      });
    }
  }
  return new Response(new Uint8Array(data), { headers: { ...baseHeaders, "Content-Length": String(data.length) } });
}
