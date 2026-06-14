# Deploy GenerateFlow ไปยัง Cloudflare (Next.js 16 + App Router)

โปรเจกต์นี้มี API Route (`app/api/generate/route.ts`) ที่ทำ server-side fetch ไปยัง AI provider ดังนั้นวิธีที่ Cloudflare แนะนำตอนนี้คือ **Cloudflare Workers ผ่าน OpenNext adapter** (`@opennextjs/cloudflare`) ซึ่งรองรับ App Router + Route Handlers แบบเต็ม (วิธีเก่า `@cloudflare/next-on-pages` มีข้อจำกัดเยอะกว่าและไม่แนะนำแล้ว)

ข้อดี: โปรเจกต์นี้ไม่มี secret ฝั่ง server (ผู้ใช้กรอก API Key เองในหน้าเว็บแล้วส่งไปที่ `/api/generate` ต่อไปยัง provider) เลยไม่ต้องตั้งค่า environment secret อะไรเพิ่ม

**วิธี update ที่ใช้: deploy ผ่าน Git** — push โค้ดขึ้น GitHub แล้วให้ Cloudflare Workers Builds build/deploy ให้อัตโนมัติทุกครั้งที่ push ไม่ต้องรัน `npm run deploy` จากเครื่องตัวเองอีก (รันบนเครื่องได้เฉพาะตอนอยากทดสอบ preview ก่อน push)

---

## ขั้นตอน

### 1. ✅ ติดตั้ง dependencies สำหรับ Cloudflare
```bash
npm install --save-dev @opennextjs/cloudflare wrangler
```

### 2. ✅ สร้างไฟล์ `wrangler.jsonc` ที่ root โปรเจกต์
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "generateflow",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

### 3. ✅ สร้างไฟล์ `open-next.config.ts` ที่ root โปรเจกต์
```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig();
```

### 4. ✅ เพิ่ม script ใน `package.json`
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
}
```
(script `preview`/`deploy` เก็บไว้สำหรับรันบนเครื่องเพื่อทดสอบเท่านั้น ตัว deploy จริงจะให้ Cloudflare รันให้ผ่าน Git ตามขั้นตอนด้านล่าง)

### 5. ✅ เพิ่มใน `.gitignore`
```
.open-next/
.wrangler/
```

### 6. ⬜ Push โค้ดขึ้น GitHub — ต้องทำเอง
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 7. ⬜ เชื่อม Cloudflare เข้ากับ Git repo (Workers Builds) — ต้องทำเอง
1. ไปที่ Cloudflare Dashboard → **Workers & Pages → Create → Connect to Git**
2. Authorize GitHub แล้วเลือก repo ที่ push ไปในขั้นตอนที่ 6
3. ตั้งชื่อ Worker ให้ตรงกับ `name` ใน `wrangler.jsonc` (คือ `generateflow`) — ถ้าไม่ตรง build จะ fail
4. ตั้งค่า Build configuration:
   - **Build command**: `npx opennextjs-cloudflare build`
   - **Deploy command**: `npx wrangler deploy` (ค่า default ของ Cloudflare ใช้ได้เลย เพราะ `wrangler.jsonc` ชี้ไปที่ `.open-next/worker.js` ที่ build ไว้แล้ว)
   - **Root directory**: `/` (ค่า default)
5. กด **Save and Deploy**

จากนี้ไป ทุกครั้งที่ push ขึ้น branch `main` Cloudflare จะ build + deploy ให้อัตโนมัติ พร้อม URL `https://generateflow.<your-subdomain>.workers.dev`

### 8. (ทางเลือก) ทดสอบบนเครื่องก่อน push
```bash
npx wrangler login   # ครั้งแรกครั้งเดียว เปิดเบราว์เซอร์ให้ล็อกอินบัญชี Cloudflare
npm run preview      # รันบน Cloudflare Workers runtime จำลอง
```

---

## ตั้งโดเมนของตัวเอง (ถ้าต้องการ)
ไปที่ Worker ที่ deploy แล้ว → **Settings → Domains & Routes → Add Custom Domain** แล้วชี้ DNS (ถ้าโดเมนอยู่ใน Cloudflare อยู่แล้วจะตั้งค่าให้อัตโนมัติ)

---

⚠️ หมายเหตุ: ขั้นตอนที่ 6 (push ขึ้น GitHub) และขั้นตอนที่ 7 (เชื่อม Cloudflare กับ Git repo, รวมถึง `wrangler login` ถ้าจะทดสอบบนเครื่อง) ต้องทำโดยผู้ใช้เอง เพราะต้อง login ด้วยบัญชี GitHub/Cloudflare ของคุณ — หลังจากเชื่อมเสร็จแล้ว การ update ครั้งต่อไปทำได้แค่ `git push`
