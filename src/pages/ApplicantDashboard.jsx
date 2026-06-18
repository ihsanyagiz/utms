import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS, PROGRAMS, SEMESTERS } from '../data/seedData';
import { 
  FileText, AlertTriangle, CheckCircle2, ShieldAlert, 
  Trash2, Send, RefreshCw, Eye, HelpCircle 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function ApplicantDashboard({ activeTab, setActiveTab }) {
  const { 
    applications, 
    currentUser, 
    submitApplication, 
    resubmitApplication, 
    cancelApplication,
    config
  } = useApp();

  const app = applications.find(a => a.applicantId === currentUser.id && a.status !== 'cancelled');

  // Submit/Resubmit Form State
  const [formData, setFormData] = useState({
    idNumber: currentUser.tcNo || '',
    targetProgram: PROGRAMS[0],
    targetSemester: config.semester,
    currentGpa: '',
    sourceUniversity: '',
    osymPoints: '400',
    isCurrentlyEnrolled: 'true'
  });

  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Sync state if app exists (for editing/resubmitting)
  useEffect(() => {
    if (app) {
      setFormData({
        idNumber: app.idNumber,
        targetProgram: app.targetProgram,
        targetSemester: app.targetSemester,
        currentGpa: app.currentGpa,
        sourceUniversity: app.sourceUniversity,
        osymPoints: app.osymPoints,
        isCurrentlyEnrolled: app.isCurrentlyEnrolled ? 'true' : 'false'
      });
    }
  }, [app]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle File Input Change
  const handleFileChange = (slotId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: PDF only
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileErrors(prev => ({ ...prev, [slotId]: 'Sadece PDF dosyaları yüklenebilir!' }));
      return;
    }

    // Validation: Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileErrors(prev => ({ ...prev, [slotId]: 'Dosya boyutu 5 MB\'ı geçemez!' }));
      return;
    }

    // Clear error and set file
    setFileErrors(prev => {
      const copy = { ...prev };
      delete copy[slotId];
      return copy;
    });

    setFiles(prev => ({ ...prev, [slotId]: file }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Check if files are uploaded
    if (!app) {
      // Create mode: Verify required files are uploaded
      const missing = [];
      DOCUMENT_SLOTS.forEach(slot => {
        if (slot.required && !files[slot.id]) {
          missing.push(slot.name);
        }
      });

      if (missing.length > 0) {
        alert(`Lütfen zorunlu belgeleri yükleyin:\n- ${missing.join('\n- ')}`);
        return;
      }

      const result = submitApplication(formData, files);
      if (result.success) {
        setActiveTab('applicant_status');
      }
    } else {
      // Resubmit mode: just updates documents and resets statuses
      const result = resubmitApplication(app.id, formData, files);
      if (result.success) {
        setFiles({});
        setActiveTab('applicant_status');
      }
    }
  };

  const handleCancelConfirm = () => {
    if (app) {
      cancelApplication(app.id);
      setIsCancelModalOpen(false);
    }
  };

  // Stepper Tracker computation
  const getStepperStatus = () => {
    const steps = [
      { id: 0, label: 'ÖİDB Belge Kontrolü', activeStatus: 'submitted' },
      { id: 1, label: 'YDYO İngilizce Hazırlık', activeStatus: 'forwarded_to_ydyo' },
      { id: 2, label: 'Dekanlık Onayı', activeStatus: 'forwarded_to_dean' },
      { id: 3, label: 'YGK İntibak Komisyonu', activeStatus: 'forwarded_to_ygk' },
      { id: 4, label: 'ÖİDB Nihai Sıralama', activeStatus: 'intibak_complete' }
    ];

    if (!app) return steps.map(s => ({ ...s, state: 'inactive' }));

    const statusOrder = ['submitted', 'forwarded_to_ydyo', 'forwarded_to_dean', 'forwarded_to_ygk', 'intibak_complete'];
    const currentIdx = statusOrder.indexOf(app.status);

    return steps.map((step, idx) => {
      let state = 'inactive';
      
      if (app.status === 'returned') {
        // Find which step it failed on
        if (app.deanNotes) {
          // Dean returned it (step 2)
          if (idx === 2) state = 'error';
          else if (idx < 2) state = 'completed';
        } else if (app.oidbNotes) {
          // OIDB returned it (step 0)
          if (idx === 0) state = 'error';
        }
      } else {
        if (idx < currentIdx) {
          state = 'completed';
        } else if (idx === currentIdx) {
          state = 'active';
        }
      }

      return { ...step, state };
    });
  };

  const steps = getStepperStatus();

  return (
    <div className="content-body">
      {activeTab === 'applicant_status' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">Başvuru Takip Paneli</h2>
              <p className="page-description">Yatay geçiş başvurunuzun güncel durumunu buradan takip edebilirsiniz.</p>
            </div>
            {app && app.status !== 'cancelled' && (
              <button className="btn btn-danger btn-sm" onClick={() => setIsCancelModalOpen(true)}>
                <Trash2 size={14} /> Başvuruyu İptal Et
              </button>
            )}
          </div>

          {!app ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', alignItems: 'center' }}>
              <AlertTriangle size={48} style={{ color: 'var(--color-warning)', marginBottom: '1rem' }} />
              <h3>Henüz Bir Başvurunuz Bulunmamaktadır!</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0.5rem 0 1.5rem 0' }}>
                Yatay geçiş başvurusunda bulunmak için sol menüden "Belge Yükleme" sayfasına gidebilir veya aşağıdaki butona tıklayabilirsiniz.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('applicant_submit')}>
                Hemen Başvur
              </button>
            </div>
          ) : (
            <div>
              {/* Timeline Stepper */}
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Başvuru Aşamaları</h4>
                <div className="stepper">
                  {steps.map((step) => (
                    <div key={step.id} className={`step ${step.state}`}>
                      <div className="step-node">
                        {step.state === 'completed' ? <CheckCircle2 size={24} /> : step.id + 1}
                      </div>
                      <div className="step-label">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Feedback Alert */}
              {app.status === 'returned' && (
                <div className="alert-feedback">
                  <div className="alert-feedback-title">
                    <ShieldAlert size={18} />
                    Başvurunuz Revizyon İçin İade Edilmiştir!
                  </div>
                  <div className="alert-feedback-body">
                    <strong>İade Gerekçesi:</strong> {app.oidbNotes || app.deanNotes}
                    <br />
                    <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                      Lütfen sol menüdeki "Belge Yükleme / Güncelleme" sayfasına giderek hatalı belgeleri güncelleyiniz ve başvurunuzu yeniden gönderiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Application Details Summary */}
              <div className="card">
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Başvuru Detayları</h3>
                  <span className={`status-badge status-${app.status}`}>
                    {app.status === 'submitted' && 'Kontrol Bekliyor'}
                    {app.status === 'forwarded_to_ydyo' && 'YDYO Hazırlık Kontrolünde'}
                    {app.status === 'forwarded_to_dean' && 'Dekanlık İncelemesinde'}
                    {app.status === 'forwarded_to_ygk' && 'Komisyon İntibak Aşamasında'}
                    {app.status === 'intibak_complete' && 'İntibak Tamamlandı / Sıralamada'}
                    {app.status === 'returned' && 'Düzeltme Bekliyor'}
                  </span>
                </div>

                <div className="form-grid" style={{ gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>T.C. Kimlik No</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.idNumber}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Başvurulan Program</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.targetProgram}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Başvuru Dönemi</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.targetSemester}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Mevcut Üniversite</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.sourceUniversity}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Genel Not Ortalaması (GPA)</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.currentGpa} / 4.00</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ÖSYM YKS Taban Puanı</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.osymPoints}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Kayıt Durumu</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.isCurrentlyEnrolled ? 'Halen Kayıtlı' : 'Kayıtlı Değil'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Son Güncelleme</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.lastEditedAt}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Yüklenen Belgeler</h4>
                  <table className="ubys-table">
                    <thead>
                      <tr>
                        <th>Belge Türü</th>
                        <th>Dosya Adı</th>
                        <th>Boyut</th>
                        <th>Yükleme Tarihi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {app.documents.map((doc) => {
                        const slot = DOCUMENT_SLOTS.find(s => s.id === doc.slot);
                        return (
                          <tr key={doc.id}>
                            <td>{slot ? slot.name : 'Diğer'}</td>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)' }}>
                                <FileText size={14} /> {doc.filename}
                              </span>
                            </td>
                            <td>{doc.fileSize}</td>
                            <td>{doc.uploadDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <Modal 
            isOpen={isCancelModalOpen} 
            title="Başvuru İptal Onayı"
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleCancelConfirm}
            confirmText="Evet, İptal Et"
            confirmType="danger"
          >
            <p>Başvurunuzu kalıcı olarak iptal etmek istediğinize emin misiniz?</p>
            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>
              Bu işlem geri alınamaz!
            </p>
          </Modal>
        </div>
      )}

      {activeTab === 'applicant_submit' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{app ? 'Başvuru Belgelerini Güncelle' : 'Yatay Geçiş Başvuru Formu'}</h2>
              <p className="page-description">Lütfen tüm akademik bilgilerinizi giriniz ve ilgili PDF belgelerinizi yükleyiniz.</p>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleFormSubmit}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Akademik Bilgiler</h4>
              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">T.C. Kimlik Numarası</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="idNumber"
                    maxLength={11}
                    required
                    value={formData.idNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Başvurulacak Program</label>
                  <select 
                    className="form-control" 
                    name="targetProgram"
                    value={formData.targetProgram}
                    onChange={handleChange}
                  >
                    {PROGRAMS.map((prog, idx) => (
                      <option key={idx} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mevcut Üniversiteniz</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="sourceUniversity"
                    placeholder="Örn: Ege Üniversitesi"
                    required
                    value={formData.sourceUniversity}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Genel Not Ortalaması (GPA)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="4"
                    className="form-control" 
                    name="currentGpa"
                    placeholder="Örn: 3.45"
                    required
                    value={formData.currentGpa}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">YKS ÖSYM Taban Puanınız</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    name="osymPoints"
                    placeholder="Örn: 420.50"
                    required
                    value={formData.osymPoints}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Halen Kayıtlı mısınız?</label>
                  <select 
                    className="form-control" 
                    name="isCurrentlyEnrolled"
                    value={formData.isCurrentlyEnrolled}
                    onChange={handleChange}
                  >
                    <option value="true">Evet, halen kayıtlıyım</option>
                    <option value="false">Hayır, ilişiğim kesildi / kayıt sildirdim</option>
                  </select>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Belgeler (Sadece PDF, Maks 5MB)</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {DOCUMENT_SLOTS.map((slot) => {
                  let existingDoc = app ? app.documents.find(d => d.slot === slot.id) : null;
                  
                  return (
                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                      <div style={{ flexGrow: 1 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>
                          {slot.name}
                          {slot.required && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>}
                        </span>
                        {existingDoc && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                            <CheckCircle2 size={12} /> Yüklü Dosya: {existingDoc.filename} ({existingDoc.fileSize})
                          </span>
                        )}
                        {fileErrors[slot.id] && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', display: 'block', marginTop: '0.15rem' }}>
                            {fileErrors[slot.id]}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="file" 
                          id={`file-${slot.id}`}
                          accept=".pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(slot.id, e)}
                        />
                        <label 
                          htmlFor={`file-${slot.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer' }}
                        >
                          {files[slot.id] ? 'Dosyayı Değiştir' : (existingDoc ? 'Güncelle' : 'Dosya Seç')}
                        </label>
                        {files[slot.id] && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {files[slot.id].name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('applicant_status')}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} /> {app ? 'Başvuruyu Güncelle ve Gönder' : 'Başvuruyu Tamamla ve Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
