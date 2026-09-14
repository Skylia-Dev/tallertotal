import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5123";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error de autenticación" }));
    return NextResponse.json(err, { status: res.status });
  }

  const data = await res.json();
  const response = NextResponse.json({ ok: true, role: data.role, tenantName: data.tenantName });

  const cookieOpts = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };

  response.cookies.set("tallertotal_token", data.token, { ...cookieOpts, httpOnly: true });

  // Readable cookies so the client-side sidebar can show the tenant name and gate owner-only pages
  if (data.tenantName) {
    response.cookies.set("tallertotal_tenant", data.tenantName, { ...cookieOpts, httpOnly: false });
  }
  if (data.role) {
    response.cookies.set("tallertotal_role", data.role, { ...cookieOpts, httpOnly: false });
  }

  return response;
}
