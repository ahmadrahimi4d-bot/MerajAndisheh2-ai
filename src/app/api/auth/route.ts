import { NextResponse, type NextRequest } from "next/server";
import { authenticate, getSessionUser, logoutSession, registerUser } from "@/core/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const COOKIE = "mas_session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get(COOKIE)?.value);
  return NextResponse.json({ ok: true, user });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "login");
    if (action === "logout") {
      await logoutSession(req.cookies.get(COOKIE)?.value);
      const response = NextResponse.json({ ok: true, user: null });
      response.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
      return response;
    }
    const result = action === "register"
      ? await registerUser(body)
      : await authenticate(String(body.username ?? ""), String(body.password ?? ""));
    if (!result) return NextResponse.json({ ok: false, error: "نام کاربری یا گذرواژه صحیح نیست." }, { status: 401 });
    const response = NextResponse.json({ ok: true, user: result.user, token: result.token });
    response.cookies.set(COOKIE, result.token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60, secure: process.env.NODE_ENV === "production" });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Authentication failed" }, { status: 400 });
  }
}
