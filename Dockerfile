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
if old not in s:
    raise SystemExit('seed_demo patch target not found')
p.write_text(s.replace(old,new,1), encoding='utf-8')
PY
RUN pip install --no-cache-dir -r requirements.txt
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
