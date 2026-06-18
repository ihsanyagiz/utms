import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, HelpCircle, ArrowRight, CheckCircle2, Mail, Globe } from 'lucide-react';

export default function Login({ onBackToLanding, initialMode = 'login' }) {
  const { login, loginWithEdevlet, register, resetPassword, showToast } = useApp();
  
  // Modes: 'login' | 'register' | 'edevlet' | 'forgot' | 'verify_email'
  const [mode, setMode] = useState(initialMode);
  const [lang, setLang] = useState('tr');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Standard Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('applicant');

  // Register Fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regTcNo, setRegTcNo] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [kvkkChecked, setKvkkChecked] = useState(false);

  // e-Devlet Fields
  const [edevletTcNo, setEdevletTcNo] = useState('');
  const [edevletFullName, setEdevletFullName] = useState('');

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  // Language Dictionary
  const t = {
    tr: {
      title: 'Yatay Geçiş Başvuru Sistemi (UTMS)',
      loginRole: 'Giriş Rolü',
      email: 'E-Posta Adresi',
      password: 'Şifre',
      forgot: 'Şifremi Unuttum',
      loginBtn: 'Giriş Yap',
      edevletBtn: 'e-Devlet ile Giriş Yap',
      noAccount: 'Hesabınız yok mu?',
      register: 'Kayıt Olun',
      registerTitle: 'Kayıt Ol ve Gönder',
      fullName: 'Ad Soyadı',
      tcNo: 'TC Kimlik Numarası',
      phone: 'Telefon Numarası',
      haveAccount: 'Zaten hesabınız var mı?',
      back: 'Geri Dön',
      verifyTitle: 'E-Posta Doğrulama Gerekli',
      verifySub: 'Hesabınızı aktifleştirmek için e-postanıza gönderilen bağlantıyı doğrulayın.',
      verifyBtn: 'E-Postayı Doğrula (Simüle)',
      resendMail: 'noreply@utms.dev adresinden aktivasyon maili gönderildi.',
      kvkkAgree: 'Kişisel verilerimin işlenmesine ilişkin KVKK Aydınlatma Metni ve Kullanım Koşulları\'nı okudum ve kabul ediyorum.',
      quickLogins: 'Hızlı Giriş Hesapları (Demo Kolaylığı)',
      clickToPrefill: '*Tıkladığınızda bilgiler forma yazılır. Giriş Yap butonuna basarak devam edebilirsiniz.*',
      verifySuccess: 'E-Posta doğrulandı! Giriş yapabilirsiniz.'
    },
    en: {
      title: 'Horizontal Transfer System (UTMS)',
      loginRole: 'Login Role',
      email: 'Email Address',
      password: 'Password',
      forgot: 'Forgot Password',
      loginBtn: 'Log In',
      edevletBtn: 'Log in with e-Devlet',
      noAccount: 'Don\'t have an account?',
      register: 'Register Now',
      registerTitle: 'Register & Submit',
      fullName: 'Full Name',
      tcNo: 'Turkish ID Number',
      phone: 'Phone Number',
      haveAccount: 'Already have an account?',
      back: 'Go Back',
      verifyTitle: 'Email Verification Required',
      verifySub: 'Please verify the activation link sent to your email to activate your account.',
      verifyBtn: 'Verify Email (Simulated)',
      resendMail: 'Activation email sent from noreply@utms.dev.',
      kvkkAgree: 'I have read and agree to the KVKK Privacy Statement and Terms of Use.',
      quickLogins: 'Quick Demo Logins (Evaluation Tool)',
      clickToPrefill: '*Clicking a button pre-fills the form. Press Log In to proceed.*',
      verifySuccess: 'Email verified successfully! You can now log in.'
    }
  }[lang];

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(loginEmail, loginPassword, loginRole);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!kvkkChecked) {
      alert(lang === 'tr' ? 'Lütfen KVKK ve kullanım şartlarını onaylayınız.' : 'Please agree to terms and conditions.');
      return;
    }
    const result = register(regEmail, regPassword, regFullName, regTcNo, regPhone);
    if (result.success) {
      setVerificationEmail(regEmail);
      setMode('verify_email');
    }
  };

  const handleEdevletSubmit = (e) => {
    e.preventDefault();
    loginWithEdevlet(edevletTcNo, edevletFullName);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    const result = resetPassword(forgotEmail, forgotNewPassword);
    if (result.success) {
      setMode('login');
    }
  };

  const handleVerifyConfirm = () => {
    showToast(t.verifySuccess, 'success');
    setMode('login');
    setLoginEmail(verificationEmail);
    setLoginPassword(regPassword);
    setLoginRole('applicant');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ position: 'relative' }}>
        
        {/* Language & Home Toggle Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
          <span className="auth-link" onClick={onBackToLanding}>
            ← Ana Sayfa (Home)
          </span>
          <button 
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.15rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}
          >
            <Globe size={12} /> {lang === 'tr' ? 'English' : 'Türkçe'}
          </button>
        </div>

        <div className="auth-header">
          <div className="auth-logo">
            İYTE<span>UBYS</span>
          </div>
          <p className="auth-subtitle">{t.title}</p>
        </div>

        {mode === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">{t.loginRole}</label>
                <select 
                  className="form-control"
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                >
                  <option value="applicant">{lang === 'tr' ? 'Aday Öğrenci' : 'Applicant Student'}</option>
                  <option value="oidb">{lang === 'tr' ? 'Öğrenci İşleri (ÖİDB)' : 'Office of Student Affairs (OIDB)'}</option>
                  <option value="ydyo">{lang === 'tr' ? 'Yabancı Diller (YDYO)' : 'School of Foreign Languages (YDYO)'}</option>
                  <option value="dean">{lang === 'tr' ? 'Mühendislik Dekanlığı' : 'Engineering Deanery'}</option>
                  <option value="ygk">{lang === 'tr' ? 'Komisyon Üyesi (YGK)' : 'Transfer Committee (YGK)'}</option>
                  <option value="admin">{lang === 'tr' ? 'Sistem Yöneticisi (Admin)' : 'System Admin'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.email}</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@domain.com"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">{t.password}</label>
                  <span className="auth-link" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }} onClick={() => setMode('forgot')}>
                    {t.forgot}
                  </span>
                </div>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="••••••••"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
                {t.loginBtn} <ArrowRight size={16} />
              </button>

              {loginRole === 'applicant' && (
                <>
                  <div className="auth-divider">veya</div>
                  <button 
                    type="button" 
                    className="btn btn-edevlet" 
                    style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem' }}
                    onClick={() => setMode('edevlet')}
                  >
                    {t.edevletBtn}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.noAccount}{' '}
                    <span className="auth-link" onClick={() => setMode('register')}>
                      {t.register}
                    </span>
                  </div>
                </>
              )}
            </form>

            {/* Quick Demo Login Accounts panel */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textAlign: 'center' }}>
                {t.quickLogins}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                  onClick={() => { setLoginEmail('emre.yildiz@test'); setLoginPassword('test'); setLoginRole('applicant'); }}
                >
                  Aday (Emre)
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                  onClick={() => { setLoginEmail('oidb@test'); setLoginPassword('test'); setLoginRole('oidb'); }}
                >
                  ÖİDB Memuru
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                  onClick={() => { setLoginEmail('ydyo@test'); setLoginPassword('test'); setLoginRole('ydyo'); }}
                >
                  YDYO Sorumlusu
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                  onClick={() => { setLoginEmail('dean@test'); setLoginPassword('test'); setLoginRole('dean'); }}
                >
                  Dekanlık
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                  onClick={() => { setLoginEmail('ygk.ceng@test'); setLoginPassword('test'); setLoginRole('ygk'); }}
                >
                  YGK Komisyonu
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                  onClick={() => { setLoginEmail('admin@admin'); setLoginPassword('admin'); setLoginRole('admin'); }}
                >
                  Yönetici (Admin)
                </button>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {t.clickToPrefill}
              </p>
            </div>
          </>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">{t.fullName}</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Örn: Ahmet Yılmaz"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.tcNo}</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="11 haneli TC No"
                maxLength={11}
                required
                value={regTcNo}
                onChange={(e) => setRegTcNo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.email}</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="name@domain.com"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.phone}</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="05xxxxxxxxx"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">{t.password} (Min 8)</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            {/* KVKK / terms checkbox (V&V Requirement) */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input 
                type="checkbox" 
                id="kvkk-agree" 
                checked={kvkkChecked}
                onChange={(e) => setKvkkChecked(e.target.checked)}
                required 
                style={{ marginTop: '0.15rem', cursor: 'pointer' }}
              />
              <label htmlFor="kvkk-agree" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer', margin: 0 }}>
                {t.kvkkAgree}
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem' }}>
              {t.registerTitle}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t.haveAccount}{' '}
              <span className="auth-link" onClick={() => setMode('login')}>
                {t.loginBtn}
              </span>
            </div>
          </form>
        )}

        {/* Email Verification Mock Screen (V&V SMTP/Resend Requirement) */}
        {mode === 'verify_email' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <Mail size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {t.verifyTitle}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {t.verifySub}
              <br />
              <strong style={{ color: 'var(--primary-color)' }}>{t.resendMail}</strong>
            </p>

            <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f8fafc', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Aktivasyon adresi: <code style={{ color: 'var(--primary-color)', fontWeight: 600 }}>https://utms.dev/register/verify?email={verificationEmail}</code>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem' }}
              onClick={handleVerifyConfirm}
            >
              {t.verifyBtn}
            </button>
          </div>
        )}

        {mode === 'edevlet' && (
          <form onSubmit={handleEdevletSubmit}>
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={48} style={{ color: '#e21b22', margin: '0 auto 0.5rem auto' }} />
              <h4 style={{ color: '#1e293b' }}>e-Devlet Kapısı Kimlik Doğrulama</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Bilgileriniz e-Devlet servisleri üzerinden doğrulanacaktır.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">TC Kimlik Numarası</label>
              <input 
                type="text" 
                className="form-control" 
                maxLength={11}
                placeholder="11 haneli TC No"
                required
                value={edevletTcNo}
                onChange={(e) => setEdevletTcNo(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Tam Adınız</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Adınız Soyadınız"
                required
                value={edevletFullName}
                onChange={(e) => setEdevletFullName(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-edevlet" style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem' }}>
              Giriş Yap
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
              <span className="auth-link" onClick={() => setMode('login')}>
                {t.back}
              </span>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <HelpCircle size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 0.5rem auto' }} />
              <h4 style={{ color: '#1e293b' }}>Şifre Sıfırlama Talebi</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Kayıtlı e-posta adresinizi girerek yeni şifrenizi tanımlayınız.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Kayıtlı E-Posta Adresi</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="name@domain.com"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Yeni Şifreniz</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Yeni şifre (Min 8 karakter)"
                required
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem' }}>
              Şifreyi Güncelle
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
              <span className="auth-link" onClick={() => setMode('login')}>
                {t.back}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
