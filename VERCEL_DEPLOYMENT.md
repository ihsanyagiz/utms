# UTMS Vercel Deployment Rehberi

Bu kurulumda tum proje Vercel uzerinde calisir:

- React/Vite frontend `dist` olarak build edilir.
- Express backend Vercel Function olarak `server.js` uzerinden calisir.
- SQLite yerine Postgres kullanilir.
- Local upload klasoru yerine Vercel Blob kullanilir.

## Gerekli Vercel Servisleri

Vercel project icinde asagidaki storage servislerini ekle:

1. Postgres uyumlu database
   - Neon, Supabase veya Vercel Marketplace uzerinden Postgres.
   - Env olarak `DATABASE_URL` veya `POSTGRES_URL` verilmeli.

2. Vercel Blob
   - Blob store olustur.
   - Env olarak `BLOB_READ_WRITE_TOKEN` verilmeli.

3. SMTP
   - Resend veya okul SMTP servisi.
   - E-posta dogrulama icin gerekli.

## Vercel Env Degiskenleri

```bash
DATABASE_URL=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

PUBLIC_URL=https://utms.example.edu.tr
FRONTEND_URL=https://utms.example.edu.tr

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=REPLACE_WITH_SMTP_OR_RESEND_SECRET
SMTP_FROM=UTMS <noreply@example.edu.tr>

BOOTSTRAP_ADMIN_EMAIL=admin@example.edu.tr
BOOTSTRAP_ADMIN_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
BOOTSTRAP_ADMIN_NAME=Sistem Yoneticisi

POSTGRES_SSL=true
MAX_UPLOAD_BYTES=4000000
```

Not: Vercel Functions request body limiti nedeniyle mevcut server-side upload akisi icin `MAX_UPLOAD_BYTES` degerini 4 MB civarinda tutmak daha guvenli. Daha buyuk dosyalar icin bir sonraki adim client-direct Vercel Blob upload akisini eklemektir.

## Vercel Project Ayarlari

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- API rewrites: `vercel.json` icinde hazir.

## Deploy Adimlari

1. Repo'yu GitHub'a push et.
2. Vercel'de New Project ile repo'yu import et.
3. Yukaridaki env degiskenlerini gir.
4. Deploy baslat.
5. Deploy tamamlaninca `PUBLIC_URL` ve `FRONTEND_URL` degerlerini final domain ile esitle.
6. Okul domaini kullanilacaksa Vercel'in verdigi DNS kayitlarini okul IT'ye ilet.

## Smoke Test

Deploy sonrasinda su sirayla kontrol et:

1. Site aciliyor mu?
2. Bootstrap admin ile login olunuyor mu?
3. Applicant register oluyor mu?
4. Aktivasyon e-postasi geliyor mu?
5. E-postadaki link hesabi dogruluyor mu?
6. Dogrulama sonrasi applicant login oluyor mu?
7. PDF upload ve submit calisiyor mu?
8. OIDB ekraninda basvuru gorunuyor mu?
9. Staff akislari status degistiriyor mu?

## Demo Data

Production'da `node server/seed.js` otomatik calismaz. Vercel'de demo data gerekiyorsa bunu dikkatli yapmak gerekir; seed script mevcut verileri siler. Canli kullanim icin onerilen yol:

1. Bootstrap admin ile gir.
2. Staff hesaplarini admin panelinden olustur.
3. Applicant kaydini normal register akisiyle test et.
