import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
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

  // Fetch all resources
  const fetchData = async () => {
    try {
      // Load system config
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (currentUser) {
        // Load applications
        let appUrl = '/api/applications';
        if (currentUser.role === 'ygk') {
          appUrl += `?role=ygk&department=${currentUser.department}`;
        }
        const appsRes = await fetch(appUrl);
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData);
        }

        // Load users if admin
        if (currentUser.role === 'admin') {
          const usersRes = await fetch('/api/users');
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData);
          }

          const backupsRes = await fetch('/api/backups');
          if (backupsRes.ok) {
            const backupsData = await backupsRes.json();
            setBackups(backupsData);
          }
        }
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err);
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
        showToast(data.error || 'Giriş başarısız!', 'error');
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
        showToast(data.error || 'Kayıt başarısız!', 'error');
        return { success: false };
      }
      showToast('Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.');
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
      return { success: false };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setApplications([]);
    setUsers([]);
    showToast('Oturum kapatıldı.');
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

      showToast('Başvurunuz başarıyla kaydedildi.');
      await fetchData();
      return { success: true };
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
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
        showToast(data.error || 'Belge kontrolü başarısız!', 'error');
        return;
      }
      showToast('Otomatik belge kontrolü çalıştırıldı.');
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  const forwardToYdyo = async (appId) => {
    const res = await updateApplication(appId, { status: 'forwarded_to_ydyo' });
    if (res.success) {
      showToast('Başvuru YDYO Kontrolüne sevk edildi.');
    }
  };

  const returnToApplicantFromOidb = async (appId, notes) => {
    if (!notes || notes.trim() === '') {
      showToast('Lütfen iade gerekçesini belirtiniz!', 'error');
      return;
    }
    const res = await updateApplication(appId, { status: 'returned', oidbNotes: notes });
    if (res.success) {
      showToast('Başvuru düzeltme için adaya iade edildi.', 'warning');
    }
  };

  const setPrepStatusAndForward = async (appId, prepStatus) => {
    const res = await updateApplication(appId, { prepSchoolStatus: prepStatus, status: 'forwarded_to_dean' });
    if (res.success) {
      showToast('İngilizce hazırlık durumu kaydedildi ve Dekanlığa sevk edildi.');
    }
  };

  const forwardToYgk = async (appId, programName) => {
    const dept = programName.includes('Electrical') ? 'electrical_electronics_engineering' : 'computer_engineering';
    const res = await updateApplication(appId, { status: 'forwarded_to_ygk', forwardedFaculty: dept });
    if (res.success) {
      showToast(`Başvuru YGK Komisyonuna (${programName}) sevk edildi.`);
    }
  };

  const returnFromDean = async (appId, target, notes) => {
    if (!notes || notes.trim() === '') {
      showToast('Lütfen iade gerekçesini belirtiniz!', 'error');
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
      showToast(`Başvuru ${target.toUpperCase()} kontrolüne geri gönderildi.`, 'warning');
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
      showToast('İntibak tablosu başarıyla kaydedildi.');
      await fetchData();
    } catch (err) {
      showToast('Sunucu bağlantı hatası!', 'error');
    }
  };

  const approveAndSendToOidb = async (appId) => {
    const res = await updateApplication(appId, { status: 'intibak_complete' });
    if (res.success) {
      showToast('Başvuru onaylandı ve ÖİDB sıralama listesine gönderildi.');
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
      returnToApplicantFromOidb,
      setPrepStatusAndForward,
      forwardToYgk,
      returnFromDean,
      getIntibakTable,
      saveIntibakTable,
      approveAndSendToOidb,
      createStaffAccount,
      updateUserRole,
      updateConfig,
      triggerBackup,
      restoreBackup
    }}>
      {children}
    </AppContext.Provider>
  );
};
