const BASE_URL = 'http://localhost:5000';

async function runTestFlow() {
  console.log('=== UTMS API Entegrasyon ve Akış Doğrulama Testi ===\n');

  try {
    // 1. Aday Öğrenci Kaydı (UC-1)
    console.log('1. Aday Kaydı Yapılıyor (UC-1)...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_ogrenci@test.com',
        password: 'test-password-123',
        fullName: 'Deneme Ogrenci',
        tcNo: '10000000146', // Geçerli T.C. checksum
        phone: '05301112233'
      })
    });
    
    if (!regRes.ok) {
      const err = await regRes.json();
      throw new Error(`Kayıt başarısız: ${err.error}`);
    }
    const regData = await regRes.json();
    console.log(`✓ Aday başarıyla kaydedildi. Üye ID: ${regData.userId}`);

    // 2. E-posta Aktivasyonu (UC-1 / verify-email)
    console.log('2. E-posta Doğrulanıyor (Simüle verify-email)...');
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_ogrenci@test.com' })
    });
    if (!verifyRes.ok) throw new Error('E-posta doğrulanamadı.');
    console.log('✓ E-posta doğrulandı, hesap aktif.');

    // 3. Giriş Yapılıyor (UC-2)
    console.log('3. Giriş Yapılıyor (UC-2)...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_ogrenci@test.com',
        password: 'test-password-123',
        role: 'applicant'
      })
    });
    if (!loginRes.ok) {
      const err = await loginRes.json();
      throw new Error(`Giriş başarısız: ${err.error}`);
    }
    const loginData = await loginRes.json();
    const studentUser = loginData.user;
    console.log(`✓ Giriş Başarılı. Aday Adı: ${studentUser.fullName}`);

    // 4. Başvuru Gönderiliyor (UC-4)
    console.log('4. Başvuru Gönderiliyor (UC-4)...');
    const submitRes = await fetch(`${BASE_URL}/api/applications/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantId: studentUser.id,
        fullName: studentUser.fullName,
        idNumber: studentUser.tcNo,
        targetProgram: 'Computer Engineering',
        currentGpa: '3.60',
        sourceUniversity: 'Ege University',
        osymPoints: '450.50',
        isCurrentlyEnrolled: 'true'
      })
    });
    if (!submitRes.ok) {
      const err = await submitRes.json();
      throw new Error(`Başvuru gönderilemedi: ${err.error}`);
    }
    console.log('✓ Başvuru başarıyla kaydedildi.');

    // 5. Başvuru Çekiliyor ve Otomatik Checker Sonuçları İnceleniyor (UC-5 / UC-27)
    console.log('5. Başvuru Durumu ve Otomatik Denetçi Sonuçları Alınıyor (UC-5)...');
    const myAppRes = await fetch(`${BASE_URL}/api/applications/my?applicantId=${studentUser.id}`);
    const app = await myAppRes.json();
    console.log(`✓ Başvuru ID: ${app.id}, Statü: ${app.status}`);
    console.log(`✓ Otomatik Kontrol Durumu: ${app.docCheckerStatus}`);
    console.log(`✓ Bulunan Otomatik Hatalar/Uyarılar (DocChecker):`, app.docCheckerErrors);

    // 6. ÖİDB Olarak Giriş ve YDYO'ya Sevk (UC-19 / UC-30)
    console.log('6. ÖİDB Giriş Yapıyor ve Başvuruyu YDYO\'ya Sevk Ediyor...');
    const forwardYdyoRes = await fetch(`${BASE_URL}/api/applications/${app.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'forwarded_to_ydyo',
        lastEditedById: 2 // OIDB User ID
      })
    });
    if (!forwardYdyoRes.ok) throw new Error('YDYO sevk işlemi başarısız.');
    console.log('✓ Başvuru YDYO birimine iletildi.');

    // 7. YDYO Giriş ve Hazırlık Muafiyeti İşaretleme (UC-30)
    console.log('7. YDYO Muafiyet Durumunu "eligible" Olarak İşaretliyor ve Dekanlığa Sevk Ediyor...');
    const forwardDeanRes = await fetch(`${BASE_URL}/api/applications/${app.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prepSchoolStatus: 'eligible',
        status: 'forwarded_to_dean',
        lastEditedById: 4 // YDYO User ID
      })
    });
    if (!forwardDeanRes.ok) throw new Error('Dekanlık sevk işlemi başarısız.');
    console.log('✓ YDYO muafiyeti onaylandı, Dekanlığa iletildi.');

    // 8. Dekanlık Giriş ve Bölüm Komisyonuna Sevk (UC-8)
    console.log('8. Dekanlık Başvuruyu Bilgisayar Mühendisliği Komisyonuna (YGK) Sevk Ediyor (UC-8)...');
    const forwardYgkRes = await fetch(`${BASE_URL}/api/applications/${app.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'forwarded_to_ygk',
        forwardedFaculty: 'computer_engineering',
        lastEditedById: 3 // Dean User ID
      })
    });
    if (!forwardYgkRes.ok) throw new Error('YGK sevk işlemi başarısız.');
    console.log('✓ Başvuru Bilgisayar Müh. Komisyonuna iletildi.');

    // 9. YGK Giriş, İntibak Tablosu Doldurma (UC-18)
    console.log('9. YGK Komisyonu İntibak Mappings Tablosunu Dolduruyor (UC-18)...');
    const mockCourses = [
      { id: 1, sourceCode: 'C101', sourceName: 'Intro to Comp', sourceCredits: '4', sourceGrade: 'AA', targetCode: 'CENG113', targetName: 'Programming Basics', status: 'accepted' },
      { id: 2, sourceCode: 'M101', sourceName: 'Calculus I', sourceCredits: '4', sourceGrade: 'BA', targetCode: 'MATH141', targetName: 'Calculus I', status: 'accepted' }
    ];
    const intibakRes = await fetch(`${BASE_URL}/api/applications/${app.id}/intibak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses: mockCourses })
    });
    if (!intibakRes.ok) throw new Error('İntibak kaydedilemedi.');
    const intibakData = await intibakRes.json();
    console.log(`✓ İntibak Tablosu Kaydedildi. Tahmini GNO: ${intibakData.estimatedGpa}, Hesaplanan Sıralama Puanı: ${intibakData.rankingScore}`);

    // 10. Komisyon Onayı (Send to OIDB)
    console.log('10. Komisyon Başvuruyu Sıralama İçin Onaylayıp ÖİDB\'ye Geri Gönderiyor...');
    const approveAppRes = await fetch(`${BASE_URL}/api/applications/${app.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'intibak_complete',
        lastEditedById: 5 // YGK User ID
      })
    });
    if (!approveAppRes.ok) throw new Error('Nihai onay işlemi başarısız.');
    console.log('✓ Başvuru nihai sıralama listesine başarıyla eklendi.');

    // 11. ÖİDB Son Kontrol ve Sıralama Tablosu (UC-20)
    console.log('11. ÖİDB Nihai Sıralama Tablosunu Çekiyor (UC-20)...');
    const allAppsRes = await fetch(`${BASE_URL}/api/applications`);
    const allApps = await allAppsRes.json();
    const finalRankedApps = allApps
      .filter(a => a.status === 'intibak_complete')
      .sort((a, b) => b.rankingScore - a.rankingScore);

    console.log('\n=== NİHAİ YATAY GEÇİŞ SIRALAMA TABLOSU ===');
    finalRankedApps.forEach((a, index) => {
      const isQuota = index < 3 ? 'ASİL ✓' : 'YEDEK';
      console.log(`${index + 1}. Aday: ${a.fullName} - Puan: ${a.rankingScore} - Durum: ${isQuota} (GPA: ${a.currentGpa}, YKS: ${a.osymPoints}, Okul: ${a.sourceUniversity})`);
    });

    console.log('\n=================================================');
    console.log('🎉 TÜM AKIŞ VE ENTEGRASYON ADIMLARI BAŞARIYLA GEÇTİ!');
    console.log('=================================================');

  } catch (error) {
    console.error('\n❌ TEST AKIŞINDA HATA MEYDANA GELDİ:', error.message);
  }
}

runTestFlow();
