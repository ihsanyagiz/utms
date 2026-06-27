# UTMS Canliya Alma Rehberi

Bu proje production icin tek container olarak calisir:

- React frontend build edilir.
- Express backend `dist` klasorunu ve API endpointlerini ayni domain uzerinden servis eder.
- SQLite database, upload dosyalari ve backup dosyalari `DATA_DIR` altinda saklanir.

## Onerilen Canli Ortam

- VPS: DigitalOcean, Hetzner veya benzeri Linux VPS
- Panel: CapRover
- App port: `5000`
- HTTPS: CapRover uzerinden ac
- Persistent directory: `/app/data`

## Production Env Degiskenleri

CapRover app ayarlarina asagidakileri gir:

```bash
NODE_ENV=production
PORT=5000
DATA_DIR=/app/data
PUBLIC_URL=https://utms.example.com
FRONTEND_URL=https://utms.example.com

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=REPLACE_WITH_RESEND_API_KEY
SMTP_FROM=UTMS <noreply@example.com>

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
BOOTSTRAP_ADMIN_NAME=Sistem Yoneticisi
```

Notlar:

- `BOOTSTRAP_ADMIN_*` degerleri sadece admin yoksa ilk admin hesabini olusturur.
- Demo seed production startup'ta calismaz. Demo verisi gerekiyorsa container icinde manuel `node seed.js` calistirilir.
- `SMTP_PASSWORD` bos kalirsa e-posta gercek gitmez; backend aktivasyon linkini log'a simule eder.

## CapRover Deploy Adimlari

1. VPS uzerine CapRover kur.
2. Domain/DNS kaydini VPS IP adresine yonlendir.
3. CapRover'da yeni app olustur.
4. App portunu `5000` yap.
5. HTTPS'i ac.
6. Persistent app ayarinda `/app/data` klasorunu kalici yap.
7. Yukaridaki env degiskenlerini gir.
8. Repo'yu CapRover'a deploy et.

## Smoke Test Listesi

Canli deploy sonrasi su sirayla kontrol et:

1. `https://utms.example.com` aciliyor mu?
2. Admin `BOOTSTRAP_ADMIN_EMAIL` ile login olabiliyor mu?
3. Yeni applicant register olabiliyor mu?
4. Aktivasyon e-postasi geliyor mu?
5. E-postadaki linke tiklayinca hesap dogrulaniyor mu?
6. Dogrulanan applicant login olabiliyor mu?
7. PDF upload ve basvuru submit calisiyor mu?
8. App restart sonrasi database ve uploads duruyor mu?
9. OIDB, YDYO, Dean ve YGK staff hesaplari admin panelinden olusturulup login deneniyor mu?

## Yerelde Production Benzeri Test

Windows PowerShell:

```powershell
npm install
npm run build
cd server
npm install
$env:DATA_DIR="C:\tmp\utms-prod-data"
$env:PUBLIC_URL="http://localhost:5000"
$env:FRONTEND_URL="http://localhost:5000"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD="change-this-password"
node index.js
```

Sonra `http://localhost:5000` adresini ac.
