import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5123";

async function forward(req: Request, params: { path: string[] }, method: string) {
  const token = (await cookies()).get("tallertotal_token")?.value;
  const path = params.path.join("/");
  const search = new URL(req.url).search;
  const url = `${BACKEND}/api/${path}${search}`;

  // Preservar el Content-Type entrante (incluye el boundary de multipart/form-data —
  // pisarlo con "application/json" rompe cualquier upload de archivo).
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // arrayBuffer (no .text()) en ambas direcciones: .text() decodifica como UTF-8 y
  // corrompe cualquier body binario (imágenes, PDFs, multipart) de forma irreversible.
  const body = method !== "GET" && method !== "DELETE" ? await req.arrayBuffer() : undefined;
  const res = await fetch(url, { method, headers, body });
  const bytes = await res.arrayBuffer();

  // A Response with a 204/205/304 status must have a null body (fetch spec) —
  // passing even an empty buffer throws "Invalid response status code".
  const isEmptyStatus = res.status === 204 || res.status === 205 || res.status === 304;

  return new NextResponse(isEmptyStatus ? null : bytes, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params, "GET");
}
export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params, "POST");
}
export async function PUT(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params, "PUT");
}
export async function PATCH(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params, "PATCH");
}
export async function DELETE(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params, "DELETE");
}
