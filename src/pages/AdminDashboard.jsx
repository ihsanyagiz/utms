import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROGRAMS } from '../data/seedData';
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
    restoreBackup 
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
      alert('Lütfen tüm zorunlu alanları doldurunuz!');
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
              <h2 className="page-title">Kullanıcı Yönetimi</h2>
              <p className="page-description">Sistemdeki tüm kullanıcıları görüntüleyin, rollerini düzenleyin veya yeni idari personel hesapları açın.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Column: Users List */}
            <div className="table-container" style={{ margin: 0 }}>
              <div className="table-header-bar">
                <h3 className="table-title">Kayıtlı Kullanıcılar</h3>
              </div>
              <table className="ubys-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Adı Soyadı</th>
                    <th>E-Posta</th>
                    <th>Mevcut Rol</th>
                    <th>Bölüm Yetkisi</th>
                    <th>Rol Değiştir</th>
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
                          {u.role}
                        </span>
                      </td>
                      <td>{u.department ? u.department.replace('_', ' ').toUpperCase() : '-'}</td>
                      <td>
                        {u.role !== 'admin' ? (
                          <select 
                            className="form-control"
                            style={{ padding: '0.2rem', fontSize: '0.75rem', width: '110px' }}
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                          >
                            <option value="applicant">applicant</option>
                            <option value="oidb">oidb</option>
                            <option value="ydyo">ydyo</option>
                            <option value="dean">dean</option>
                            <option value="ygk">ygk</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Düzenlenemez</span>
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
                <Plus size={16} /> Yeni Personel Hesabı Ekle
              </h3>
              <form onSubmit={handleCreateStaff}>
                <div className="form-group">
                  <label className="form-label">Adı Soyadı <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Örn: Prof. Dr. Kemal Ege"
                    required
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-Posta <span style={{ color: 'red' }}>*</span></label>
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
                  <label className="form-label">Şifre <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="Şifre belirleyin"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rolü</label>
                  <select 
                    className="form-control"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="oidb">Öğrenci İşleri Memuru (oidb)</option>
                    <option value="ydyo">Yabancı Diller Yetkilisi (ydyo)</option>
                    <option value="dean">Dekanlık Yetkilisi (dean)</option>
                    <option value="ygk">Komisyon Üyesi (ygk)</option>
                  </select>
                </div>

                {newStaff.role === 'ygk' && (
                  <div className="form-group">
                    <label className="form-label">Sorumlu Olduğu Bölüm</label>
                    <select 
                      className="form-control"
                      value={newStaff.department}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, department: e.target.value }))}
                    >
                      <option value="computer_engineering">Computer Engineering</option>
                      <option value="electrical_electronics_engineering">Electrical-Electronics Engineering</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Personel Hesabı Oluştur
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
              <h2 className="page-title">Sistem Ayarları</h2>
              <p className="page-description">Yatay geçiş başvuru sisteminin aktiflik durumunu, dönem ve kontenjan parametrelerini düzenleyin.</p>
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
                  Yatay Geçiş Başvuru Sistemini Öğrencilere Aç (Aktif)
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Akademik Başvuru Dönemi</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={sysSemester}
                  onChange={(e) => setSysSemester(e.target.value)}
                  placeholder="Örn: 2026-2027 Güz"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Son Başvuru Tarihi</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={sysDeadline}
                  onChange={(e) => setSysDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sıralama Kontenjan Limiti (Asil Aday Adedi)</label>
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
                Ayarları Kaydet ve Güncelle
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'admin_database' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">Yedekleme ve Geri Yükleme</h2>
              <p className="page-description">Tüm başvuru durumlarını, kullanıcı verilerini ve komisyon kararlarını yedekleyin veya geri yükleyin.</p>
            </div>
            <button className="btn btn-primary" onClick={triggerBackup}>
              <Plus size={16} /> Yeni Veritabanı Yedeği Al
            </button>
          </div>

          <div className="table-container">
            <div className="table-header-bar">
              <h3 className="table-title">Yedek Dosyaları (instance/backups/)</h3>
            </div>
            <table className="ubys-table">
              <thead>
                <tr>
                  <th>Yedek Dosya Adı</th>
                  <th>Alınma Zamanı</th>
                  <th>Kullanıcı Sayısı</th>
                  <th>Başvuru Sayısı</th>
                  <th>Yedek İşlemi</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((bak) => (
                  <tr key={bak.filename}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{bak.filename}</td>
                    <td>{bak.date}</td>
                    <td>{bak.data.users.length} Kayıtlı Kullanıcı</td>
                    <td>{bak.data.applications.length} Başvuru</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => {
                          if (window.confirm(`${bak.filename} yedeğini geri yüklemek istiyor musunuz? Mevcut tüm canlı verileriniz bu yedeğe göre sıfırlanacaktır.`)) {
                            restoreBackup(bak.filename);
                          }
                        }}
                      >
                        <RotateCcw size={12} /> Canlıya Yükle (Restore)
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
