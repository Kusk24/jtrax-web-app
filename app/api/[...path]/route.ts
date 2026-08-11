/**
 * Same-origin proxy to jtrax-backend — attaches the httpOnly session token
 * server-side so it never reaches client JavaScript.
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE, SESSION_COOKIE } from "@/lib/session";

async function forward(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  const url = `${API_BASE}/api/v1/${path.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch {
    return NextResponse.json({ error: "backend unreachable" }, { status: 502 });
  }
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
