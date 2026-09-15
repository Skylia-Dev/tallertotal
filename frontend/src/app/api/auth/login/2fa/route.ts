import { NextResponse } from "next/server";
import { setSessionCookies } from "@/lib/session-cookies";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5123";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND}/api/auth/login/2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Código incorrecto" }));
    return NextResponse.json(err, { status: res.status });
  }

  const data = await res.json();
  return setSessionCookies(data);
}
