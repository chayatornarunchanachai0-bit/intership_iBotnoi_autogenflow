import { NextRequest, NextResponse } from "next/server";

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const base = process.env.BOTOPS_BACKEND_URL;
  const key = process.env.BOTOPS_API_KEY;
  if (!base || !key) return NextResponse.json({ detail: "Proxy is not configured" }, { status: 500 });

  const incoming = new URL(request.url);
  const target = new URL(path.join("/") + incoming.search, base.endsWith("/") ? base : base + "/");
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("x-botops-key", key);

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstream = await fetch(target, { method, headers, body, cache: "no-store" });

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  const disposition = upstream.headers.get("content-disposition");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  if (disposition) responseHeaders.set("content-disposition", disposition);

  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
