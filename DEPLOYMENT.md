# 🚀 Deployment qo'llanmasi — CareTrack MRMS

Sizning loyihangiz **uchta qism**dan iborat:
1. **Frontend** — static HTML/CSS/JS (Netlify uchun ideal)
2. **Backend** — Node + Express API (Netlify ishlatmaydi, alohida joy kerak)
3. **MySQL** — relational database (cloud-hosted)

Eng oson va bepul kombinatsiya:

| Qism | Joyi | Bepul rejasi |
|---|---|---|
| Frontend | **Netlify** | ✅ Cheksiz |
| Backend | **Render.com** | ✅ 750 soat/oy (uxlab qoladi) |
| MySQL | **Railway.app** yoki **Aiven** | ✅ Cheklangan |

---

## 1️⃣ MySQL bazani Railway'ga joylash

1. https://railway.app ga GitHub orqali kiring
2. **New Project → Provision MySQL**
3. Yaratilgach, MySQL'ni bosing → **Variables** tab
4. **MYSQL_URL** qiymatini ko'chiring (`mysql://root:xxx@xxx.railway.app:1234/railway` shaklida)
5. **Connect** tab'da Railway CLI yoki MySQL Workbench bilan ulanishingiz mumkin

> Eslatma: Bazani to'ldirish uchun mahalliy `npm run db:init` ishga tushirishdan oldin `.env` da `DATABASE_URL` ni Railway'dan olingan qiymatga moslang va `DB_SSL=true` qo'shing.

```bash
# .env (mahalliy)
DATABASE_URL=mysql://root:xxxxx@hostname.railway.app:1234/railway
DB_SSL=true
```

So'ng:

```bash
cd backend
npm run db:init
```

Bu cloud bazaga jadvallar va seed ma'lumotlarni o'rnatadi.

---

## 2️⃣ Backend'ni Render.com'ga joylash

1. https://render.com ga GitHub orqali kiring
2. **New → Blueprint** → repository'ngizni tanlang
   - Render `backend/render.yaml` ni o'qib avtomatik sozlaydi
3. Yoki qo'lda: **New → Web Service** → repository → quyidagicha to'ldiring:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables** bo'limida quyidagilarni qo'shing:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | (random uzun matn — Generate tugmasini bosing) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `DATABASE_URL` | (Railway'dan olingan MYSQL_URL) |
   | `DB_SSL` | `true` |
   | `CLIENT_ORIGIN` | `https://YOUR-SITE.netlify.app` (Netlify URL'ni keyinroq qo'shasiz) |

5. **Deploy** bosing
6. Deploy tugagach, sizga URL berishadi: `https://caretrack-mrms-api.onrender.com`
7. Tekshiring: `https://caretrack-mrms-api.onrender.com/api/health`

> ⚠️ Render free tier server 15 daqiqa harakatsiz bo'lsa **uxlab qoladi**. Birinchi so'rov 30-60 soniya ko'tariladi. Keyingilari tez. Buni bartaraf qilish uchun Cron-Job.org'da har 10 daqiqada `/api/health`'ga so'rov yuboring.

---

## 3️⃣ Frontend'ni Netlify'ga joylash

### A) Frontend kodini sozlash

`frontend/js/config.js` faylini oching va `REMOTE_API_URL` ni o'zgartiring:

```js
const REMOTE_API_URL = 'https://caretrack-mrms-api.onrender.com/api';
//                                ↑ sizning Render URL'ingiz + /api
```

So'ng GitHub'ga push qiling:

```bash
git add .
git commit -m "Configure API URL for production"
git push
```

### B) Netlify'da deploy qilish

1. https://app.netlify.com ga GitHub bilan kiring
2. **Add new site → Import an existing project** → GitHub'ni tanlang
3. Repository'ngizni tanlang
4. Build sozlamalari:
   - **Base directory**: `frontend`
   - **Build command**: `# bo'sh qoldiring`
   - **Publish directory**: `frontend`
5. **Deploy**
6. Sizga URL beradi: `https://random-name-12345.netlify.app`
   - Site settings → Change site name → masalan `caretrack-clinic`
   - Yangi URL: `https://caretrack-clinic.netlify.app`

### C) Backend'da CORS'ni yangilang

Render.com'ga qaytib boring → Service → Environment → `CLIENT_ORIGIN` qiymatini Netlify URL'iga o'zgartiring:

```
CLIENT_ORIGIN=https://caretrack-clinic.netlify.app
```

Render avtomatik qayta deploy qiladi. Tayyor.

---

## 4️⃣ Sinov

1. `https://caretrack-clinic.netlify.app` ga kiring
2. Login: `admin@caretrack.uz` / `password123`
3. Hammasi ishlasa — tabriklayman, deploy tugadi! 🎉

---

## 🔧 Mahalliy ishlash (development)

Hech narsa o'zgarmaydi:

```bash
cd backend
npm install
npm run db:init    # mahalliy MySQL uchun
npm start
```

Brauzer: `http://localhost:5000` — frontend backend bilan birga ishlaydi.

`config.js` `localhost`ni avtomatik aniqlaydi va `/api` ishlatadi.

---

## 🆘 Xatolar va yechimlar

**`Failed to fetch` xatosi**
- `frontend/js/config.js` da `REMOTE_API_URL` to'g'ri yozilganmi?
- Render'da backend ishlayaptimi? `/api/health` ochib tekshiring.

**`CORS error`**
- Render'da `CLIENT_ORIGIN` ga to'g'ri Netlify URL yozilganmi (oxirida `/` bo'lmasin)?
- Bir nechta URL bo'lsa vergul bilan ajrating: `https://a.netlify.app,https://b.netlify.app`

**MySQL connection failed**
- Railway'dagi MySQL active'mi? (uxlab qolgan bo'lishi mumkin)
- `DB_SSL=true` qo'shilganmi?

**Render server 30 soniya javob bermayapti**
- Bu bepul rejada normal. Uxlab qolgan, bir oz kuting.

---

## 📦 Faqat frontend Netlify'ga (backendsiz demo)

Agar siz **vaqtincha faqat dizaynni** Netlify'da ko'rsatmoqchi bo'lsangiz (ma'lumotsiz), `frontend/` papkani Netlify'ga sudrab tashlang. API ishlamaydi, lekin login sahifa va dizayn ko'rinadi.

To'liq ishlaydigan demo uchun yuqoridagi 3 bosqichni bajaring.
