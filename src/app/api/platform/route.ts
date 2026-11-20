import type { NextRequest } from "next/server";
import { canRunAction, getSessionUser, platformAction } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tokenFrom(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth?.replace(/^Bearer\s+/i, "") || req.cookies.get("mas_session")?.value;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    const user = await getSessionUser(tokenFrom(req));
    if (!canRunAction(action, payload, user)) {
      return Response.json({ ok: false, error: "عدم دسترسی" }, { status: 403 });
    }
    const result = await platformAction(action, payload, user);
    if (!result.ok) return Response.json(result, { status: 400 });
    return Response.json(result);
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Action failed" }, { status: 500 });
  }
}
