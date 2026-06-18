import React, { useState } from 'react';
import { 
  GraduationCap, Calendar, Award, BookOpen, MapPin, 
  Users, CheckCircle2, ChevronRight, HelpCircle, ShieldCheck, FileText 
} from 'lucide-react';

export default function LandingPage({ onEnterLogin, onEnterRegister }) {
  const [lang, setLang] = useState('tr');

  const content = {
    tr: {
      headerTitle: 'İzmir Yüksek Teknoloji Enstitüsü',
      headerSub: 'Öğrenci İşleri Daire Başkanlığı',
      btnSubmit: 'Başvuru Yap',
      btnLogin: 'Giriş Yap',
      heroTitle: 'Yatay Geçiş Başvuru Sistemi (UTMS)',
      heroSub: 'İzmir Yüksek Teknoloji Enstitüsü Öğrenci İşleri Daire Başkanlığı tarafından yürütülen yatay geçiş süreci artık tamamen dijital ortamda yönetilmektedir.',
      deadline: 'Son Başvuru Tarihi: 30 Haziran 2026, Saat 17:00',
      btnCreateApp: 'Başvuru Oluştur',
      btnViewApp: 'Mevcut Başvurumu Görüntüle',
      whyIyte: 'Neden İYTE?',
      whyIyteSub: '1992 yılında kurulan İzmir Yüksek Teknoloji Enstitüsü, yalnızca fen bilimleri ve mühendislik alanlarında eğitim veren, araştırma odaklı yapısıyla Türkiye\'nin en prestijli teknik yükseköğretim kurumları arasında yer almaktadır.',
      card1Title: '30+ Yıllık Akademik Birikim',
      card1Text: '1992\'den bu yana lisansüstü ve lisans düzeyinde STEM odaklı, uluslararası standartlarda eğitim.',
      card2Title: 'Araştırma Odaklı Kadro',
      card2Text: 'Neredeyse tamamı doktora dereceli, aktif araştırma projeleri yürüten uzman öğretim üyeleri.',
      card3Title: 'Özgün Kampüs Ortamı',
      card3Text: 'İzmir\'in Urla ilçesinde, denize yakın, yeşil ve modern bir kampüste eğitim imkânı.',
      card4Title: 'Düşük Öğrenci/Öğretim Üyesi Oranı',
      card4Text: 'Her öğrenciye bireysel ilgi gösterebilen küçük ölçekli, nitelikli akademik topluluk.',
      infoTitle: 'Başvuru Bilgileri',
      infoSub: 'Yükseköğretim Kurulu Yatay Geçiş Yönetmeliği çerçevesinde belirlenen genel koşullar aşağıda özetlenmiştir.',
      criteria1Title: 'Genel Not Ortalaması (GNO)',
      criteria1Text: 'Minimum 2.50/4.00 veya eşdeğeri (Başvuru için asgari baraj)',
      criteria2Title: 'Ders Uyumu',
      criteria2Text: 'Hedef programla en az %70 müfredat örtüşmesi ve eşdeğerlik.',
      criteria3Title: 'Kontenjan',
      criteria3Text: 'Her program için YÖK tarafından belirlenen sınırlı kontenjan (Genelde program başına 3 asil aday).',
      criteria4Title: 'Belge Tamlığı',
      criteria4Text: 'Eksik, hatalı veya PDF dışı yüklenen belgelerle yapılan başvurular değerlendirmeye alınmaz.',
      processTitle: 'Başvuru Süreci',
      step1Title: 'Sisteme Kayıt',
      step1Text: 'Kişisel veya kurumsal e-posta adresinizle kayıt olun ve e-posta doğrulama adımını tamamlayın.',
      step2Title: 'Belgeleri Yükleyin',
      step2Text: 'Öğrenci belgesi, transkript ve YKS sonuç belgenizi PDF olarak sisteme yükleyin.',
      step3Title: 'Başvuruyu Gönderin',
      step3Text: 'Bilgilerinizi doğrulayıp onaylayın. Başvurunuz ÖİDB incelemesine otomatik sevk edilir.',
      step4Title: 'Süreci Takip Edin',
      step4Text: 'Her değerlendirme adımında (YDYO, Dekanlık, Komisyon) başvuru durumunuzu panelinizden gerçek zamanlı izleyin.',
      digitalTitle: 'Kağıtsız ve Şeffaf Dijital Süreç',
      digitalText: 'Tüm başvuru ve değerlendirme süreci kağıtsız, şeffaf ve izlenebilir biçimde yönetilmektedir. Öğrenciler, ÖİDB personeli, dekanlıklar ve komisyon üyeleri aynı platform üzerinden iş birliği yapar.',
      secureTitle: 'Güvenli Belge Yükleme',
      secureText: 'Transkript ve evraklarınız güvenli altyapı üzerinden sisteme aktarılır, yetkisiz erişime kapalıdır.',
      realtimeTitle: 'Anlık Durum Takibi',
      realtimeText: 'Başvurunuzun ÖİDB incelemesi, dekanlık onayı ve komisyon kararı aşamalarını gerçek zamanlı izleyin.',
      footerInfo: 'Gülbahçe Mah. İYTE Kampüsü Urla / İzmir, 35430 | Tel: (0232) 750 60 00'
    },
    en: {
      headerTitle: 'Izmir Institute of Technology',
      headerSub: 'Office of Student Affairs',
      btnSubmit: 'Apply Now',
      btnLogin: 'Log In',
      heroTitle: 'Horizontal Transfer System (UTMS)',
      heroSub: 'The transfer admission process carried out by the IZTECH Office of Student Affairs is now managed completely in a digital environment.',
      deadline: 'Application Deadline: June 30, 2026, 17:00',
      btnCreateApp: 'Create Application',
      btnViewApp: 'View My Application',
      whyIyte: 'Why IZTECH?',
      whyIyteSub: 'Established in 1992, Izmir Institute of Technology is a state research-oriented institution focusing exclusively on science and engineering, ranking among the most prestigious technical universities in Turkey.',
      card1Title: '30+ Years of Academic Heritage',
      card1Text: 'STEM-focused undergraduate and graduate education of international standards since 1992.',
      card2Title: 'Research-Oriented Faculty',
      card2Text: 'Expert faculty members, nearly all with doctoral degrees, actively conducting research projects.',
      card3Title: 'Unique Campus Environment',
      card3Text: 'Located in Urla, Izmir, offering campus life close to the sea, green and modern.',
      card4Title: 'Low Student-to-Faculty Ratio',
      card4Text: 'Small-scale, high-quality academic community allowing individual attention to every student.',
      infoTitle: 'Application Information',
      infoSub: 'The general conditions determined within the framework of the Higher Education Council Transfer Regulations are summarized below.',
      criteria1Title: 'Grade Point Average (GPA)',
      criteria1Text: 'Minimum 2.50/4.00 or equivalent (asgari eligibility bar)',
      criteria2Title: 'Curriculum Match',
      criteria2Text: 'At least 70% curriculum overlap and course equivalency with target program.',
      criteria3Title: 'Quotas',
      criteria3Text: 'Limited quota determined by YÖK for each program (typically 3 primary candidates per program).',
      criteria4Title: 'Completeness of Documents',
      criteria4Text: 'Applications with missing, faulty, or non-PDF documents will not be evaluated.',
      processTitle: 'Application Process',
      step1Title: 'Register to System',
      step1Text: 'Register with your personal or institutional email and complete the email verification step.',
      step2Title: 'Upload Documents',
      step2Text: 'Upload your student certificate, transcript, and OSYM score report as PDF.',
      step3Title: 'Submit Application',
      step3Text: 'Verify and submit your form. Your application is automatically routed to OIDB for checks.',
      step4Title: 'Track the Process',
      step4Text: 'Follow your application status in real-time across all steps (YDYO, Dean, Committee) on your dashboard.',
      digitalTitle: 'Paperless & Transparent Digital Process',
      digitalText: 'The entire application and evaluation workflow is managed in a paperless, transparent, and traceable way. Students, OIDB staff, deans, and committee members collaborate on the same platform.',
      secureTitle: 'Secure Document Upload',
      secureText: 'Your transcripts and files are transferred via secure protocols, closed to unauthorized access.',
      realtimeTitle: 'Real-time Tracking',
      realtimeText: 'Monitor the OIDB review, dean approval, and committee decisions for your application in real-time.',
      footerInfo: 'Gulbahce Mah. IZTECH Campus Urla / Izmir, 35430 | Tel: (0232) 750 60 00'
    }
  }[lang];

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navbar */}
      <header className="header" style={{ position: 'static', backgroundColor: '#ffffff', boxShadow: 'var(--box-shadow)' }}>
        <div className="header-left">
          <GraduationCap size={28} style={{ color: 'var(--primary-color)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{content.headerTitle}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{content.headerSub}</span>
          </div>
        </div>
        <div className="header-right" style={{ gap: '0.75rem' }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', gap: '0.25rem', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.15rem' }}>
            <button 
              className={`btn btn-sm ${lang === 'tr' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
              onClick={() => setLang('tr')}
            >
              TR
            </button>
            <button 
              className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onEnterLogin}>
            {content.btnLogin}
          </button>
          <button className="btn btn-primary btn-sm" onClick={onEnterRegister}>
            {content.btnSubmit}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.15 }}>
            {content.heroTitle}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {content.heroSub}
          </p>
          <div className="semester-indicator" style={{ display: 'inline-block', marginBottom: '2rem', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
            {content.deadline}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }} onClick={onEnterRegister}>
              {content.btnCreateApp} <ChevronRight size={18} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }} onClick={onEnterLogin}>
              {content.btnViewApp}
            </button>
          </div>
        </div>
      </section>

      {/* Info & Criteria Section */}
      <section style={{ backgroundColor: '#ffffff', padding: '4rem 2rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
              {content.infoTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
              {content.infoSub}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{content.criteria1Title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{content.criteria1Text}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{content.criteria2Title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{content.criteria2Text}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{content.criteria3Title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{content.criteria3Text}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{content.criteria4Title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{content.criteria4Text}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={24} style={{ color: 'var(--primary-color)' }} /> {content.digitalTitle}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {content.digitalText}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <FileText size={16} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{content.secureTitle}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Users size={16} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{content.realtimeTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Steps Process */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center', marginBottom: '3rem' }}>
          {content.processTitle}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyEncoding: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, margin: '0 auto 1rem auto' }}>1</div>
            <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{content.step1Title}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{content.step1Text}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyEncoding: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, margin: '0 auto 1rem auto' }}>2</div>
            <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{content.step2Title}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{content.step2Text}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyEncoding: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, margin: '0 auto 1rem auto' }}>3</div>
            <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{content.step3Title}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{content.step3Text}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyEncoding: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, margin: '0 auto 1rem auto' }}>4</div>
            <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{content.step4Title}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{content.step4Text}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', backgroundColor: 'var(--secondary-color)', color: '#94a3b8', padding: '3rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem', marginBottom: '0.5rem' }}>
              İzmir Yüksek Teknoloji Enstitüsü
            </div>
            <div>{content.footerInfo}</div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <a href="#" onClick={(e) => {e.preventDefault(); alert('KVKK Metni:\nKişisel verileriniz 6698 sayılı KVKK kapsamında korunmaktadır.');}} style={{ color: '#cbd5e1', textDecoration: 'none' }}>KVKK</a>
            <a href="#" onClick={(e) => {e.preventDefault(); alert('Yardım / Destek:\nDestek için ogrenciisleri@iyte.edu.tr ile iletişime geçebilirsiniz.');}} style={{ color: '#cbd5e1', textDecoration: 'none' }}>Yardım</a>
            <a href="#" onClick={(e) => {e.preventDefault(); alert('Kullanım Şartları:\nPortalın izinsiz ve kötüye kullanımı cezai işleme tabidir.');}} style={{ color: '#cbd5e1', textDecoration: 'none' }}>Kullanım Şartları</a>
          </div>
        </div>
        <div style={{ maxWidth: '1100px', margin: '1.5rem auto 0 auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center', fontSize: '0.75rem' }}>
          © 2026 İzmir Yüksek Teknoloji Enstitüsü. Tüm hakları saklıdır. | Yatay Geçiş Başvuru Sistemi — v1.0
        </div>
      </footer>
    </div>
  );
}
