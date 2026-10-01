FROM python:3.13-slim
WORKDIR /app
COPY botops-backend.tar.gz.b64 /tmp/app.b64
RUN python - <<'PY'
import base64, tarfile, io
raw=base64.b64decode(open('/tmp/app.b64','rb').read())
tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz').extractall('/app')
PY
COPY botops-db.py /app/app/db.py
RUN pip install --no-cache-dir -r requirements.txt
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
