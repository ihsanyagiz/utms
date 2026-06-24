import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROGRAMS, PROGRAM_DEPARTMENT_MAP, translateProgram } from '../data/seedData';
import { 
  Users, Settings, Database, Plus, Check, Play, 
  RotateCcw, Trash2, Shield, Calendar, ShieldAlert
} from 'lucide-react';

export default function AdminDashboard({ activeTab }) {
  const { 
    users, 
    backups, 
    config, 
    updateUserRole, 
    createStaffAccount, 
    updateConfig, 
    triggerBackup, 
    restoreBackup,
    lang
  } = useApp();

  // New staff user form state
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'oidb',
    department: 'computer_engineering'
  });

  // System config state
  const [sysActive, setSysActive] = useState(config.systemActive);
  const [sysSemester, setSysSemester] = useState(config.semester);
  const [sysDeadline, setSysDeadline] = useState(config.deadlineDate);
  const [sysQuota, setSysQuota] = useState(config.rankingQuota);

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaff.fullName || !newStaff.email || !newStaff.password) {
      alert(lang === 'tr' ? 'Lütfen tüm zorunlu alanları doldurunuz!' : 'Please fill all required fields!');
      return;
    }

    const dept = newStaff.role === 'ygk' ? newStaff.department : null;
    const result = createStaffAccount(
      newStaff.email, 
      newStaff.password, 
      newStaff.role, 
      dept, 
      newStaff.fullName
    );

    if (result.success) {
      setNewStaff({
        fullName: '',
        email: '',
        password: '',
        role: 'oidb',
        department: 'computer_engineering'
      });
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    updateConfig({
      systemActive: sysActive,
      semester: sysSemester,
      deadlineDate: sysDeadline,
      rankingQuota: parseInt(sysQuota) || 3
    });
  };

  return (
    <div className="content-body">
      {activeTab === 'admin_users' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{lang === 'tr' ? 'Kullanıcı Yönetimi' : 'User Management'}</h2>
              <p className="page-description">{lang === 'tr' ? 'Sistemdeki tüm kullanıcıları görüntüleyin, rollerini düzenleyin veya yeni idari personel hesapları açın.' : 'View all users in the system, edit their roles, or open new administrative staff accounts.'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Column: Users List */}
            <div className="table-container" style={{ margin: 0 }}>
              <div className="table-header-bar">
                <h3 className="table-title">{lang === 'tr' ? 'Kayıtlı Kullanıcılar' : 'Registered Users'}</h3>
              </div>
              <table className="ubys-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>{lang === 'tr' ? 'Adı Soyadı' : 'Full Name'}</th>
                    <th>{lang === 'tr' ? 'E-Posta' : 'Email'}</th>
                    <th>{lang === 'tr' ? 'Mevcut Rol' : 'Current Role'}</th>
                    <th>{lang === 'tr' ? 'Bölüm Yetkisi' : 'Department Authority'}</th>
                    <th>{lang === 'tr' ? 'Rol Değiştir' : 'Change Role'}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          backgroundColor: u.role === 'admin' ? '#fecaca' : '#e2e8f0', 
                          color: u.role === 'admin' ? '#991b1b' : '#334155',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {u.role === 'admin' 
                            ? (lang === 'tr' ? 'YÖNETİCİ' : 'ADMIN') 
                            : u.role === 'applicant' 
                              ? (lang === 'tr' ? 'ADAY' : 'APPLICANT')
                              : u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {u.department 
                          ? (() => {
                              const entry = Object.entries(PROGRAM_DEPARTMENT_MAP).find(([, v]) => v === u.department);
                              if (entry) {
                                return translateProgram(entry[0], lang).toUpperCase();
                              }
                              return u.department.replace(/_/g, ' ').toUpperCase();
                            })()
                          : '-'}
                      </td>
                      <td>
                        {u.role !== 'admin' ? (
                          <select 
                            className="form-control"
                            style={{ padding: '0.2rem', fontSize: '0.75rem', width: '110px' }}
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                          >
                            <option value="applicant">{lang === 'tr' ? 'aday' : 'applicant'}</option>
                            <option value="oidb">{lang === 'tr' ? 'öidb' : 'oidb'}</option>
                            <option value="ydyo">{lang === 'tr' ? 'ydyo' : 'ydyo'}</option>
                            <option value="dean">{lang === 'tr' ? 'dekan' : 'dean'}</option>
                            <option value="ygk">{lang === 'tr' ? 'ygk' : 'ygk'}</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'tr' ? 'Düzenlenemez' : 'Cannot Edit'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Column: Add Staff Account Form (TODO completion!) */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                <Plus size={16} /> {lang === 'tr' ? 'Yeni Personel Hesabı Ekle' : 'Add New Staff Account'}
              </h3>
              <form onSubmit={handleCreateStaff}>
                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'Adı Soyadı' : 'Full Name'} <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder={lang === 'tr' ? 'Örn: Prof. Dr. Kemal Ege' : 'e.g. Prof. Dr. Kemal Ege'}
                    required
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'E-Posta' : 'Email'} <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="name@iyte.edu.tr"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'Şifre' : 'Password'} <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder={lang === 'tr' ? 'Şifre belirleyin' : 'Set a password'}
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'Rolü' : 'Role'}</label>
                  <select 
                    className="form-control"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="oidb">{lang === 'tr' ? 'Öğrenci İşleri Memuru' : 'Office of Student Affairs Officer'}</option>
                    <option value="ydyo">{lang === 'tr' ? 'Yabancı Diller Yetkilisi' : 'Foreign Languages Official'}</option>
                    <option value="dean">{lang === 'tr' ? 'Dekanlık Yetkilisi' : 'Deanery Official'}</option>
                    <option value="ygk">{lang === 'tr' ? 'Komisyon Üyesi' : 'Committee Member'}</option>
                  </select>
                </div>

                {newStaff.role === 'ygk' && (
                  <div className="form-group">
                    <label className="form-label">{lang === 'tr' ? 'Sorumlu Olduğu Bölüm' : 'Responsible Department'}</label>
                    <select 
                      className="form-control"
                      value={newStaff.department}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, department: e.target.value }))}
                    >
                      {Object.entries(PROGRAM_DEPARTMENT_MAP)
                        .filter((entry, index, self) => self.findIndex(e => e[1] === entry[1]) === index)
                        .map(([progName, deptKey]) => (
                          <option key={deptKey} value={deptKey}>
                            {translateProgram(progName, lang)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  {lang === 'tr' ? 'Personel Hesabı Oluştur' : 'Create Staff Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin_config' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{lang === 'tr' ? 'Sistem Ayarları' : 'System Settings'}</h2>
              <p className="page-description">{lang === 'tr' ? 'Yatay geçiş başvuru sisteminin aktiflik durumunu, dönem ve kontenjan parametrelerini düzenleyin.' : 'Edit system active status, semester, and ranking quota parameters.'}</p>
            </div>
          </div>

          <div className="card" style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSaveConfig}>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="sysActive" 
                  checked={sysActive}
                  onChange={(e) => setSysActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="sysActive" style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                  {lang === 'tr' ? 'Yatay Geçiş Başvuru Sistemini Öğrencilere Aç (Aktif)' : 'Open Horizontal Transfer System to Students (Active)'}
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'tr' ? 'Akademik Başvuru Dönemi' : 'Academic Application Semester'}</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={sysSemester}
                  onChange={(e) => setSysSemester(e.target.value)}
                  placeholder={lang === 'tr' ? 'Örn: 2026-2027 Güz' : 'e.g. 2026-2027 Fall'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'tr' ? 'Son Başvuru Tarihi' : 'Application Deadline'}</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={sysDeadline}
                  onChange={(e) => setSysDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">{lang === 'tr' ? 'Sıralama Kontenjan Limiti (Asil Aday Adedi)' : 'Ranking Quota Limit (Number of Main Candidates)'}</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={sysQuota}
                  onChange={(e) => setSysQuota(e.target.value)}
                  min={1}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                {lang === 'tr' ? 'Ayarları Kaydet ve Güncelle' : 'Save & Update Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'admin_database' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{lang === 'tr' ? 'Yedekleme ve Geri Yükleme' : 'Backup & Restore'}</h2>
              <p className="page-description">{lang === 'tr' ? 'Tüm başvuru durumlarını, kullanıcı verilerini ve komisyon kararlarını yedekleyin veya geri yükleyin.' : 'Backup or restore all application states, user data, and committee decisions.'}</p>
            </div>
            <button className="btn btn-primary" onClick={triggerBackup}>
              <Plus size={16} /> {lang === 'tr' ? 'Yeni Veritabanı Yedeği Al' : 'Take New Database Backup'}
            </button>
          </div>

          <div className="table-container">
            <div className="table-header-bar">
              <h3 className="table-title">{lang === 'tr' ? 'Yedek Dosyaları (instance/backups/)' : 'Backup Files (instance/backups/)'}</h3>
            </div>
            <table className="ubys-table">
              <thead>
                <tr>
                  <th>{lang === 'tr' ? 'Yedek Dosya Adı' : 'Backup File Name'}</th>
                  <th>{lang === 'tr' ? 'Alınma Zamanı' : 'Created Time'}</th>
                  <th>{lang === 'tr' ? 'Kullanıcı Sayısı' : 'User Count'}</th>
                  <th>{lang === 'tr' ? 'Başvuru Sayısı' : 'Application Count'}</th>
                  <th>{lang === 'tr' ? 'Yedek İşlemi' : 'Backup Action'}</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((bak) => (
                  <tr key={bak.filename}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{bak.filename}</td>
                    <td>{bak.date}</td>
                    <td>{bak.data.users.length} {lang === 'tr' ? 'Kayıtlı Kullanıcı' : 'Registered Users'}</td>
                    <td>{bak.data.applications.length} {lang === 'tr' ? 'Başvuru' : 'Applications'}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => {
                          if (window.confirm(lang === 'tr' ? `${bak.filename} yedeğini geri yüklemek istiyor musunuz? Mevcut tüm canlı verileriniz bu yedeğe göre sıfırlanacaktır.` : `Are you sure you want to restore the backup ${bak.filename}? All current live data will be reset according to this backup.`)) {
                            restoreBackup(bak.filename);
                          }
                        }}
                      >
                        <RotateCcw size={12} /> {lang === 'tr' ? 'Canlıya Yükle (Restore)' : 'Restore to Live'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
