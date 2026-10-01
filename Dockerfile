FROM node:22-alpine
WORKDIR /app
COPY botops-frontend.tar.gz.b64 /tmp/app.b64
RUN node -e "const fs=require('fs'),zlib=require('zlib'),tar=require('tar');" 2>/dev/null || true
RUN apk add --no-cache python3
RUN python3 - <<'PY'
import base64, tarfile, io
raw=base64.b64decode(open('/tmp/app.b64','rb').read())
tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz').extractall('/app')
PY
RUN npm install
RUN npm run build
CMD ["sh","-c","npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
