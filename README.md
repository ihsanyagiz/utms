# İYTE Yatay Geçiş Başvuru Sistemi (UTMS)
## Horizontal Transfer Application System (UTMS)

UTMS (University Transfer Management System), İzmir Yüksek Teknoloji Enstitüsü (İYTE) yatay geçiş başvuru ve değerlendirme süreçlerini tamamen dijital, kağıtsız ve şeffaf bir ortamda yönetmek üzere tasarlanmış modern bir web uygulamasıdır.

*UTMS is a modern web application designed to manage horizontal transfer admission and evaluation processes at Izmir Institute of Technology (IZTECH) in a fully digital, paperless, and transparent environment.*

---

## 🚀 Hızlı Başlangıç / Quick Start

Projenin yerel bilgisayarınızda çalıştırılması için aşağıdaki adımları sırasıyla uygulayınız.
*Follow the steps below to run the project on your local machine.*

### 1. Gereksinimler / Prerequisites
* **Node.js** (v18 veya daha yeni bir sürüm / *v18 or newer recommended*)
* **npm** (Node Package Manager)

### 2. Kurulum / Installation
Proje klasörünü klonladıktan veya açtıktan sonra bağımlılıkları yükleyin:
*After cloning or opening the project directory, install dependencies:*

```bash
# Arayüz (Frontend) bağımlılıklarını yükleyin
# Install Frontend dependencies
npm install

# Sunucu (Backend) bağımlılıklarını yükleyin
# Install Backend dependencies
cd server
npm install
cd ..
```

### 3. Veritabanını Kurma ve Tohumlama / Database Setup & Seeding
Uygulama, yerel bir SQLite veritabanı dosyası (`server/utms.db`) kullanmaktadır. Tabloların kurulması ve örnek test verilerinin (Adaylar, belgeler, sistem ayarları) yüklenmesi için tohumlama scriptini çalıştırın:
*The application uses a local SQLite database file. Run the seeding script to initialize schemas and seed test scenarios:*

```bash
# Veritabanını başlatır ve test senaryolarını yükler
# Initializes the database and seeds test cases
node server/seed.js
```

### 4. Çalıştırma / Running the Application
Geliştirme aşamasında hem frontend hem de backend sunucularının çalışıyor olması gerekmektedir.
*During development, both frontend and backend servers need to be active.*

**Sunucu (Backend Server) - Port 5000:**
```bash
cd server
npm start
```

**Arayüz (Frontend Client) - Port 5173:**
Yeni bir terminal sekmesi açıp ana dizinde şu komutu çalıştırın:
*Open a new terminal tab and run in the root directory:*
```bash
npm run dev
```

Tarayıcınızdan **`http://localhost:5173/`** adresini açarak uygulamayı kullanmaya başlayabilirsiniz.

---

## 👥 Test Hesapları / Demo User Accounts

Sistemdeki farklı rolleri ve iş akışlarını test edebilmeniz için hazır tanımlanmış test hesapları (Tüm şifreler aksi belirtilmedikçe `test`'tir):
*Here are pre-defined demo credentials to test different user roles (All passwords are `test` unless specified otherwise):*

| Rol / Role | E-Posta / Email | Şifre / Password | Açıklama / Description |
|---|---|---|---|
| **Aday / Applicant** | `emre.yildiz@test` | `test` | Başvuru yapan aday öğrenci görünümü (*Student view*) |
| **ÖİDB Memuru / OIDB Officer** | `oidb@test` | `test` | Belge kontrolü & sonuçları ilan etme (*Document review & ranking*) |
| **YDYO Sorumlusu / YDYO Officer** | `ydyo@test` | `test` | Hazırlık muafiyet onay paneli (*English prep school check*) |
| **Dekanlık / Deanery** | `dean@test` | `test` | Fakülte onay & komisyona sevk (*Faculty review & forward*) |
| **YGK Komisyonu / YGK Committee** | `ygk.ceng@test` | `test` | Bilgisayar Müh. İntibak Editörü (*Equivalency mapping*) |
| **Sistem Yöneticisi / Admin** | `admin@admin` | `admin` | Kullanıcı, yedekleme & sistem ayarları (*System admin*) |

---

## 🛠️ Kullanılan Teknolojiler / Tech Stack

* **Frontend (Arayüz):** React, Vite, Vanilla CSS (Esneklik ve kararlılık için Tailwind kullanılmamıştır), Lucide React (İkonlar).
* **Backend (Sunucu):** Node.js, Express.js.
* **Database (Veritabanı):** SQLite3, Sqlite (Veriler `server/utms.db` dosyasında saklanır).
* **Dosya Yükleme / Uploads:** Multer (`server/uploads/` dizinine güvenli yükleme).
* **Kimlik Doğrulama / Auth:** BcryptJS (Şifre şifreleme), e-Devlet entegrasyon simülasyonu.
* **Test Suite:** Vitest (Birim testleri).

### Production Deployment

Canli ortamda Docker container `node index.js` ile baslar; `node seed.js` otomatik calismaz. SQLite database, uploads ve backups dosyalari `DATA_DIR` altinda saklanir. CapRover/VPS deploy adimlari icin `DEPLOYMENT.md` dosyasina bakin.

Vercel uzerinde tam deployment icin `VERCEL_DEPLOYMENT.md` dosyasina bakin. Vercel modunda backend Function olarak calisir, SQLite yerine Postgres, upload klasoru yerine Vercel Blob kullanilir.

---

## 📋 İş Akışı / System Workflow

1. **Aday Kaydı & e-Devlet**: Aday T.C. numarası ile kayıt olur (T.C. checksum algoritması çalışmaktadır).
2. **Belge Yükleme**: Öğrenci Belgesi, Transkript ve ÖSYM Sonuç Belgesi PDF olarak yüklenir (Maks 5MB).
3. **Otomatik Evrak Kontrolü**: ÖİDB paneline düşen başvurularda otomatik doğrulayıcı çalıştırılarak GNO barajı (2.00) ve eksik evrak durumları kontrol edilir.
4. **İngilizce Muafiyeti**: YDYO yetkilisi adayın hazırlık belgesini inceler, muaf veya hazırlık sınavına girecek olarak işaretler.
5. **Dekanlık Onayı**: İlgili fakülte dekanlığı başvuruyu doğrular ve YGK Bölüm Komisyonuna sevk eder.
6. **Ders İntibakı**: YGK Komisyonu, adayın transkriptine göre ders eşleştirme tablosunu hazırlar, İYTE karşılıklarını belirler ve onaylar.
7. **Sıralama ve Kontenjan**: ÖİDB, nihai sıralamayı formüle göre hesaplar `((YKS / 560) * 90 + (GPA / 4) * 10)` ve belirlenen kontenjan limitine göre Asil/Yedek adayları ilan eder. Sonuçlar XLSX/CSV formatında indirilebilir.
8. **Yedekleme**: Sistem yöneticisi tüm veritabanını dilediği an yedekleyebilir veya eski yedeğe geri dönebilir (Restore).

---

## 🧪 Birim Testleri / Unit Tests

Uygulamanın iş kuralları (T.C. kimlik doğrulama algoritmaları, otomatik belge kontrol kuralları ve sıralama puanı hesaplama formülü) Vitest ile test edilmektedir. Testleri çalıştırmak için:
*Run unit tests for core validation and calculation business rules:*

```bash
# Birim testlerini koşturur
# Runs unit tests
npm run test
```
