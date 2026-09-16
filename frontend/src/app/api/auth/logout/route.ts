import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("tallertotal_token");
  response.cookies.delete("tallertotal_tenant");
  response.cookies.delete("tallertotal_role");
  response.cookies.delete("tallertotal_username");
  return response;
}
