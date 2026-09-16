import { NextResponse } from "next/server";

export function setSessionCookies(data: { token: string; role?: string; tenantName?: string; username?: string }) {
  const response = NextResponse.json({ ok: true, role: data.role, tenantName: data.tenantName });

  const cookieOpts = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };

  response.cookies.set("tallertotal_token", data.token, { ...cookieOpts, httpOnly: true });

  // Readable cookies so the client-side UI can show the tenant name / username and gate owner-only pages
  if (data.tenantName) {
    response.cookies.set("tallertotal_tenant", data.tenantName, { ...cookieOpts, httpOnly: false });
  }
  if (data.role) {
    response.cookies.set("tallertotal_role", data.role, { ...cookieOpts, httpOnly: false });
  }
  if (data.username) {
    response.cookies.set("tallertotal_username", data.username, { ...cookieOpts, httpOnly: false });
  }

  return response;
}
