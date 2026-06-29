import React, { createContext, useContext, useState, useEffect } from 'react';
import { PROGRAM_DEPARTMENT_MAP } from '../data/seedData';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('utms_lang') || 'tr';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'tr' ? 'en' : 'tr';
    setLang(nextLang);
    localStorage.setItem('utms_lang', nextLang);
  };

  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('utms_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [config, setConfig] = useState({
    systemActive: true,
    deadlineDate: '2026-09-01',
    rankingQuota: 3,
    semester: '2026-2027 Güz'
  });
  const [backups, setBackups] = useState([]);
  const [toast, setToast] = useState(null);

  // Sync session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('utms_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('utms_current_user');
    }
  }, [currentUser]);

  // Fetch all resources in parallel
  const fetchData = async () => {
    try {
      const promises = [];

      promises.push(
        fetch('/api/config').then(async (res) => {
          if (res.ok) {
            const configData = await res.json();
            setConfig(configData);
          }
        })
      );

      if (currentUser) {
        let appUrl = '/api/applications';
        if (currentUser.role === 'ygk') {
          appUrl += `?role=ygk&department=${currentUser.department}`;
        }
        promises.push(
          fetch(appUrl).then(async (res) => {
            if (res.ok) {
              const appsData = await res.json();
              setApplications(appsData);
            }
          })
        );

        if (currentUser.role === 'admin') {
          promises.push(
            fetch('/api/users').then(async (res) => {
              if (res.ok) {
                const usersData = await res.json();
                setUsers(usersData);
              }
            })
          );
          promises.push(
            fetch('/api/backups').then(async (res) => {
              if (res.ok) {
                const backupsData = await res.json();
                setBackups(backupsData);
              }
            })
          );
        }
      }

      await Promise.all(promises);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // --- Toast helper ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- Auth Actions ---
  const login = async (email, password, role) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || 'Giriş başarısız!';
        if (msg.includes('hatalı') || msg.includes('bulunamadı') || msg.includes('wrong') || msg.includes('invalid')) {
          msg = 'Wrong email or password.';
        }
        showToast(msg, 'error');
        return { success: false };
      }
      setCurrentUser(data.user);
      showToast(`Giriş başarılı. Hoş geldiniz, ${data.user.fullName}.`);
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const switchDemoUser = async (email, role) => {
    // In db seed, password is 'admin' for admin, otherwise 'test'
    const password = email.startsWith('admin') ? 'admin' : 'test';
    await login(email, password, role);
  };

  const loginWithEdevlet = async (tcNo, fullName) => {
    try {
      const res = await fetch('/api/auth/edevlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tcNo, fullName })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'e-Devlet girişi başarısız!', 'error');
        return { success: false };
      }
      setCurrentUser(data.user);
      showToast(`e-Devlet ile Giriş başarılı. Hoş geldiniz, ${fullName}.`);
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const register = async (email, password, fullName, tcNo, phone) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, tcNo, phone })
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || 'Kayıt başarısız!';
        if (msg.includes('zaten var') || msg.includes('already') || msg.includes('registered')) {
          msg = 'email has already been registered to the system.';
        }
        showToast(msg, 'error');
        return { success: false };
      }
      showToast(lang === 'tr' ? 'Hesap başarıyla oluşturuldu.' : 'Account successfully created', 'success');
      return { success: true };
    } catch (err) {
      showToast(lang === 'tr' ? 'Sunucu bağlantı hatası!' : 'Server connection error!', 'error');
      return { success: false };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setApplications([]);
    setUsers([]);
    showToast(lang === 'tr' ? 'Oturum kapatıldı.' : 'Logged out successfully.');
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Şifre sıfırlama başarısız!', 'error');
        return { success: false };
      }
      showToast('Şifreniz başarıyla sıfırlandı.');
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  // --- Applicant Actions ---
  const submitApplication = async (appData, files) => {
    try {
      const formData = new FormData();
      formData.append('applicantId', currentUser.id);
      formData.append('fullName', currentUser.fullName);
      formData.append('idNumber', appData.idNumber);
      formData.append('targetProgram', appData.targetProgram);
      formData.append('currentGpa', appData.currentGpa);
      formData.append('sourceUniversity', appData.sourceUniversity);
      formData.append('osymPoints', appData.osymPoints);
      formData.append('isCurrentlyEnrolled', appData.isCurrentlyEnrolled);

      // Append files
      Object.keys(files).forEach(slotKey => {
        if (files[slotKey]) {
          formData.append(slotKey, files[slotKey]);
        }
      });

      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Başvuru gönderilemedi!', 'error');
        return { success: false };
      }

      showToast(lang === 'tr' ? 'Başvuru başarıyla gönderildi.' : 'Application submitted successfully', 'success');
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast(lang === 'tr' ? 'Sunucu bağlantı hatası!' : 'Server connection error!', 'error');
      return { success: false };
    }
  };

  const resubmitApplication = async (appId, appData, files) => {
    try {
      const formData = new FormData();
      formData.append('id', appId);
      formData.append('applicantId', currentUser.id);
      formData.append('idNumber', appData.idNumber);
      formData.append('targetProgram', appData.targetProgram);
      formData.append('currentGpa', appData.currentGpa);
      formData.append('sourceUniversity', appData.sourceUniversity);
      formData.append('osymPoints', appData.osymPoints);
      formData.append('isCurrentlyEnrolled', appData.isCurrentlyEnrolled);

      // Append files
      Object.keys(files).forEach(slotKey => {
        if (files[slotKey]) {
          formData.append(slotKey, files[slotKey]);
        }
      });

      const res = await fetch('/api/applications/resubmit', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Güncelleme gönderilemedi!', 'error');
        return { success: false };
      }

      showToast('Başvurunuz güncellendi ve yeniden gönderildi.');
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const cancelApplication = async (appId) => {
    try {
      const res = await fetch('/api/applications/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, applicantId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'İptal işlemi başarısız!', 'error');
        return { success: false };
      }
      showToast('Başvurunuz kalıcı olarak iptal edildi.', 'warning');
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  // --- Staff Operations ---
  const updateApplication = async (appId, updatedFields) => {
    try {
      const res = await fetch(`/api/applications/${appId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedFields, lastEditedById: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Güncelleme başarısız!', 'error');
        return { success: false };
      }
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const runCheckerManually = async (appId) => {
    try {
      const res = await fetch(`/api/applications/${appId}/checker`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || (lang === 'tr' ? 'Belge kontrolü başarısız!' : 'Document check failed!'), 'error');
        return;
      }
      showToast(lang === 'tr' ? 'Otomatik belge kontrolü çalıştırıldı.' : 'Automatic document check executed successfully.');
      await fetchData();
    } catch (err) {
      showToast(lang === 'tr' ? 'Sunucu bağlantı hatası!' : 'Server connection error!', 'error');
    }
  };

  const forwardToYdyo = async (appId) => {
    const res = await updateApplication(appId, { status: 'forwarded_to_ydyo' });
    if (res.success) {
      showToast(lang === 'tr' ? 'Başvuru başarıyla YDYO\'ya sevk edildi.' : 'Forwarded to YDYO successfully', 'success');
    }
  };

  const cancelForwardToYdyo = async (appId) => {
    const res = await updateApplication(appId, { status: 'submitted' });
    if (res.success) {
      showToast(lang === 'tr' ? 'YDYO sevki iptal edildi. Başvuru incelemede durumuna geri döndü.' : 'Forward to YDYO cancelled. Application reverted to submitted status.', 'success');
    }
  };

  const returnToApplicantFromOidb = async (appId, notes) => {
    if (!notes || notes.trim() === '') {
      showToast(lang === 'tr' ? 'Lütfen iade gerekçesini belirtiniz!' : 'Please write a return reason!', 'error');
      return;
    }
    const res = await updateApplication(appId, { status: 'returned', oidbNotes: notes });
    if (res.success) {
      showToast(lang === 'tr' ? 'Başvuru başarıyla adaya iade edildi.' : 'Application returned successfully.', 'success');
    }
  };

  const setPrepStatusAndForward = async (appId, prepStatus) => {
    const res = await updateApplication(appId, { prepSchoolStatus: prepStatus, status: 'forwarded_to_dean' });
    if (res.success) {
      showToast(lang === 'tr' ? 'Hazırlık durumu işlendi ve başarıyla Dekanlığa sevk edildi.' : 'Application marked and forwarded successfully.', 'success');
    }
  };

  const forwardToYgk = async (appId, programName) => {
    const dept = PROGRAM_DEPARTMENT_MAP[programName] || 'computer_engineering';
    const res = await updateApplication(appId, { status: 'forwarded_to_ygk', forwardedFaculty: dept });
    if (res.success) {
      showToast(lang === 'tr' ? 'Başvuru başarıyla Bölüm Komisyonuna (YGK) sevk edildi.' : 'Application forwarded to YGK successfully.', 'success');
    }
  };

  const returnFromDean = async (appId, target, notes) => {
    if (!notes || notes.trim() === '') {
      showToast(lang === 'tr' ? 'Lütfen iade gerekçesini belirtiniz!' : 'Please write a return reason!', 'error');
      return;
    }

    let status = 'returned';
    let updateFields = { deanNotes: notes };

    if (target === 'applicant') {
      status = 'returned';
      updateFields.status = status;
    } else if (target === 'oidb') {
      status = 'submitted';
      updateFields.status = status;
    } else if (target === 'ydyo') {
      status = 'forwarded_to_ydyo';
      updateFields.status = status;
    }

    const res = await updateApplication(appId, updateFields);
    if (res.success) {
      const unitNamesTr = { applicant: 'adaya', oidb: 'ÖİDB\'ye', ydyo: 'YDYO\'ya' };
      const unitNamesEn = { applicant: 'applicant', oidb: 'OIDB', ydyo: 'YDYO' };
      showToast(lang === 'tr' ? `Başvuru başarıyla ${unitNamesTr[target] || target} iade edildi.` : `Application returned to ${unitNamesEn[target] || target} successfully.`, 'success');
    }
  };

  const getIntibakTable = async (applicationId) => {
    try {
      const res = await fetch(`/api/intibak/${applicationId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const saveIntibakTable = async (appId, courses) => {
    try {
      const res = await fetch(`/api/applications/${appId}/intibak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'İntibak tablosu kaydedilemedi!', 'error');
        return;
      }
      showToast('İntibak tablosu başarıyla kaydedildi.', 'success');
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  const approveAndSendToOidb = async (appId) => {
    const res = await updateApplication(appId, { status: 'intibak_complete' });
    if (res.success) {
      showToast(lang === 'tr' ? 'İntibak onaylandı ve nihai sıralama için ÖİDB\'ye gönderildi.' : 'Application approved and sent to OIDB successfully.', 'success');
    }
  };

  // --- Admin Operations ---
  const createStaffAccount = async (email, password, role, department, fullName) => {
    try {
      const res = await fetch('/api/users/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, department, fullName })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Personel oluşturulamadı!', 'error');
        return { success: false };
      }
      showToast(`${fullName} (${role}) personeli başarıyla oluşturuldu.`);
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Rol güncellenemedi!', 'error');
        return;
      }
      showToast('Kullanıcı rolü güncellendi.');
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Kullanıcı silinemedi!', 'error');
        return { success: false };
      }
      showToast(lang === 'tr' ? 'Kullanıcı silindi.' : 'User deleted.');
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Ayarlar güncellenemedi!', 'error');
        return;
      }
      showToast('Sistem ayarları güncellendi.');
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  // --- Database Backups ---
  const triggerBackup = async () => {
    try {
      const res = await fetch('/api/backups/trigger', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Yedekleme başarısız!', 'error');
        return;
      }
      showToast(`Veritabanı yedeklendi: ${data.filename}`);
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  const restoreBackup = async (filename) => {
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Geri yükleme başarısız!', 'error');
        return;
      }
      showToast(`Yedek başarıyla geri yüklendi: ${filename}. Sistem yeniden yüklendi.`, 'warning');
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  return (
    <AppContext.Provider value={{
      users,
      applications,
      currentUser,
      config,
      backups,
      toast,
      showToast,
      lang,
      setLang,
      toggleLanguage,
      login,
      switchDemoUser,
      loginWithEdevlet,
      register,
      logout,
      resetPassword,
      submitApplication,
      resubmitApplication,
      cancelApplication,
      runCheckerManually,
      forwardToYdyo,
      cancelForwardToYdyo,
      returnToApplicantFromOidb,
      setPrepStatusAndForward,
      forwardToYgk,
      returnFromDean,
      getIntibakTable,
      saveIntibakTable,
      approveAndSendToOidb,
      createStaffAccount,
      updateUserRole,
      deleteUser,
      updateConfig,
      triggerBackup,
      restoreBackup
    }}>
      {children}
    </AppContext.Provider>
  );
};
