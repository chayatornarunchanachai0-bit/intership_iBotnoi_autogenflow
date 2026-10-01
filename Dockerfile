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
# Project must be flushed before its default BotConfig is inserted, otherwise
# PostgreSQL can reject the child row with a foreign-key violation.
create_patterns = [
    ('db.add(project)\n    db.add(BotConfigDB(', 'db.add(project)\n    db.flush()\n    db.add(BotConfigDB('),
    ('db.add(new_project)\n    db.add(BotConfigDB(', 'db.add(new_project)\n    db.flush()\n    db.add(BotConfigDB('),
    ('db.add(project_db)\n    db.add(BotConfigDB(', 'db.add(project_db)\n    db.flush()\n    db.add(BotConfigDB('),
]
patched_create = False
for old_create, new_create in create_patterns:
    if old_create in s:
        s=s.replace(old_create,new_create,1)
        patched_create=True
        break
if not patched_create:
    raise SystemExit('Create-project insert sequence not found; refusing to build an unpatched backend')

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
