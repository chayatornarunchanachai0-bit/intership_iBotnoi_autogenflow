FROM python:3.13-slim
WORKDIR /app
COPY botops-backend.tar.gz.b64 /tmp/app.b64
RUN python - <<'PY'
import base64, tarfile, io
raw=base64.b64decode(open('/tmp/app.b64','rb').read())
tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz').extractall('/app')
PY
COPY botops-db.py /app/app/db.py
RUN python - <<'PY'
from pathlib import Path
p=Path('/app/app/main.py')
s=p.read_text(encoding='utf-8')

# Fix demo seed FK ordering.
old='''        if not project:
            db.add(ProjectDB(
                id="nok-air-demo",
                name="Nok Air Chatbot",
                description="Demo project for chatbot regression testing",
            ))

        if db.query(BotConfigDB)'''
new='''        if not project:
            db.add(ProjectDB(
                id="nok-air-demo",
                name="Nok Air Chatbot",
                description="Demo project for chatbot regression testing",
            ))
            db.flush()

        if db.query(BotConfigDB)'''
if old in s:
    s=s.replace(old,new,1)

# Fix create-project FK ordering.
# Insert a flush inside POST /projects immediately before its first BotConfig insert.
route_start = s.find('@app.post("/projects"')
if route_start < 0:
    route_start = s.find("@app.post('/projects'")
if route_start < 0:
    raise SystemExit('POST /projects endpoint not found')
route_end = s.find('\n@app.', route_start + 1)
if route_end < 0:
    route_end = len(s)
route = s[route_start:route_end]
needle_create = 'db.add(BotConfigDB('
idx = route.find(needle_create)
if idx < 0:
    raise SystemExit('BotConfig insert not found inside POST /projects')
before = route[:idx]
if 'db.flush()' not in before[-300:]:
    indent_start = before.rfind('\n') + 1
    indent = before[indent_start:len(before)] if False else ''
    # Match indentation of the BotConfig db.add line.
    line_start = route.rfind('\n', 0, idx) + 1
    prefix = route[line_start:idx]
    route = route[:idx] + 'db.flush()\n' + prefix + route[idx:]
    s = s[:route_start] + route + s[route_end:]

# Security: strict CORS, server-to-server API key, baseline response headers.
s=s.replace('from fastapi.responses import StreamingResponse',
            'from fastapi.responses import StreamingResponse, JSONResponse')
if 'import hmac' not in s:
    s=s.replace('import os\n', 'import os\nimport hmac\n', 1)
s=s.replace(
    'allow_origins=["http://localhost:3000"],',
    'allow_origins=[x.strip() for x in os.getenv("FRONTEND_ORIGINS", "https://botnoiagentbuilder.com,http://localhost:3000").split(",") if x.strip()],'
)
s=s.replace('allow_credentials=True,', 'allow_credentials=False,')

needle='''app.add_middleware(
    CORSMiddleware,
'''
pos=s.find(needle)
if pos < 0:
    raise SystemExit('CORS middleware block not found')
end=s.find('\n\n', pos)
if end < 0:
    raise SystemExit('CORS middleware block end not found')
insert=end
security='''

@app.middleware("http")
async def security_middleware(request, call_next):
    if request.url.path != "/health":
        expected = os.getenv("BOTOPS_API_KEY", "")
        provided = request.headers.get("x-botops-key", "")
        if not expected or not hmac.compare_digest(provided, expected):
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
'''
if 'async def security_middleware' not in s:
    s=s[:insert]+security+s[insert:]

p.write_text(s, encoding='utf-8')
PY
RUN pip install --no-cache-dir -r requirements.txt
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
