FROM node:22-alpine
WORKDIR /app
COPY frontend-part-0.b64 /tmp/part0
COPY frontend-part-1.b64 /tmp/part1
COPY frontend-part-2.b64 /tmp/part2
COPY frontend-part-3.b64 /tmp/part3
COPY frontend-part-4.b64 /tmp/part4
COPY frontend-part-5.b64 /tmp/part5
COPY frontend-part-6a.b64 /tmp/part6a
COPY frontend-part-6b.b64 /tmp/part6b
COPY frontend-part-7.b64 /tmp/part7
RUN cat /tmp/part0 /tmp/part1 /tmp/part2 /tmp/part3 /tmp/part4 /tmp/part5 /tmp/part6a /tmp/part6b /tmp/part7 > /tmp/app.b64
RUN apk add --no-cache python3
RUN python3 - <<'PY'
import base64, tarfile, io
raw=base64.b64decode(open('/tmp/app.b64','rb').read())
tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz').extractall('/app')
PY
RUN npm install
RUN npm run build
CMD ["sh","-c","npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
