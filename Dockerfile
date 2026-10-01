FROM node:22-alpine
WORKDIR /app
COPY botops-frontend.tar.gz.b64 /tmp/app.b64
RUN apk add --no-cache python3
RUN python3 - <<'PY'
import base64, tarfile, io
raw=base64.b64decode(open('/tmp/app.b64','rb').read())
tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz').extractall('/app')
PY
RUN mkdir -p '/app/app/api/proxy/[...path]' && cat > '/app/app/api/proxy/[...path]/route.ts' <<'TS'
import { NextRequest, NextResponse } from "next/server";

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const base = process.env.BOTOPS_BACKEND_URL;
  const key = process.env.BOTOPS_API_KEY;

  if (!base || !key) {
    return NextResponse.json({ detail: "Proxy is not configured" }, { status: 500 });
  }

  const incoming = new URL(request.url);
  const target = new URL(path.join("/") + incoming.search, base.endsWith("/") ? base : base + "/");

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("x-botops-key", key);

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  const disposition = upstream.headers.get("content-disposition");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  if (disposition) responseHeaders.set("content-disposition", disposition);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
TS
RUN cat > /app/next.config.mjs <<'JS'
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
      ]
    }];
  }
};
export default nextConfig;
JS
RUN npm install
RUN npm run build
CMD ["sh","-c","npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
