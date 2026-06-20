import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS, PROGRAMS, SEMESTERS, getSlotName, translateReason, translateProgram } from '../data/seedData';
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
    config,
    lang
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
      setFileErrors(prev => ({ ...prev, [slotId]: lang === 'tr' ? 'Sadece PDF dosyaları yüklenebilir!' : 'Only PDF files can be uploaded!' }));
      return;
    }

    // Validation: Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileErrors(prev => ({ ...prev, [slotId]: lang === 'tr' ? 'Dosya boyutu 5 MB\'ı geçemez!' : 'File size cannot exceed 5 MB!' }));
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
          missing.push(getSlotName(slot.id, lang));
        }
      });

      if (missing.length > 0) {
        alert(lang === 'tr' ? `Lütfen zorunlu belgeleri yükleyin:\n- ${missing.join('\n- ')}` : `Please upload mandatory documents:\n- ${missing.join('\n- ')}`);
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
      { id: 0, label: lang === 'tr' ? 'ÖİDB Belge Kontrolü' : 'OIDB Document Control', activeStatus: 'submitted' },
      { id: 1, label: lang === 'tr' ? 'YDYO İngilizce Hazırlık' : 'YDYO English Prep', activeStatus: 'forwarded_to_ydyo' },
      { id: 2, label: lang === 'tr' ? 'Dekanlık Onayı' : 'Deanery Approval', activeStatus: 'forwarded_to_dean' },
      { id: 3, label: lang === 'tr' ? 'YGK İntibak Komisyonu' : 'YGK Equivalency Committee', activeStatus: 'forwarded_to_ygk' },
      { id: 4, label: lang === 'tr' ? 'ÖİDB Nihai Sıralama' : 'OIDB Final Ranking', activeStatus: 'intibak_complete' }
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
              <h2 className="page-title">{lang === 'tr' ? 'Başvuru Takip Paneli' : 'Application Tracking Panel'}</h2>
              <p className="page-description">{lang === 'tr' ? 'Yatay geçiş başvurunuzun güncel durumunu buradan takip edebilirsiniz.' : 'You can track the current status of your horizontal transfer application here.'}</p>
            </div>
            {app && app.status !== 'cancelled' && (
              <button className="btn btn-danger btn-sm" onClick={() => setIsCancelModalOpen(true)}>
                <Trash2 size={14} /> {lang === 'tr' ? 'Başvuruyu İptal Et' : 'Cancel Application'}
              </button>
            )}
          </div>

          {!app ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', alignItems: 'center' }}>
              <AlertTriangle size={48} style={{ color: 'var(--color-warning)', marginBottom: '1rem' }} />
              <h3>{lang === 'tr' ? 'Henüz Bir Başvurunuz Bulunmamaktadır!' : 'You Do Not Have Any Applications Yet!'}</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0.5rem 0 1.5rem 0' }}>
                {lang === 'tr' ? 'Yatay geçiş başvurusunda bulunmak için sol menüden "Belge Yükleme" sayfasına gidebilir veya aşağıdaki butona tıklayabilirsiniz.' : 'To apply for horizontal transfer, you can go to the "Document Upload" page from the left menu or click the button below.'}
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('applicant_submit')}>
                {lang === 'tr' ? 'Hemen Başvur' : 'Apply Now'}
              </button>
            </div>
          ) : (
            <div>
              {/* Timeline Stepper */}
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>{lang === 'tr' ? 'Başvuru Aşamaları' : 'Application Stages'}</h4>
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
                    {lang === 'tr' ? 'Başvurunuz Revizyon İçin İade Edilmiştir!' : 'Your Application Has Been Returned for Revision!'}
                  </div>
                  <div className="alert-feedback-body">
                    <strong>{lang === 'tr' ? 'İade Gerekçesi:' : 'Return Reason:'}</strong> {translateReason(app.oidbNotes || app.deanNotes, lang)}
                    <br />
                    <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                      {lang === 'tr' ? 'Lütfen sol menüdeki "Belge Yükleme / Güncelleme" sayfasına giderek hatalı belgeleri güncelleyiniz ve başvurunuzu yeniden gönderiniz.' : 'Please go to the "Document Upload / Update" page in the left menu, update the incorrect documents, and resubmit your application.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Application Details Summary */}
              <div className="card">
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{lang === 'tr' ? 'Başvuru Detayları' : 'Application Details'}</h3>
                  <span className={`status-badge status-${app.status}`}>
                    {app.status === 'submitted' && (lang === 'tr' ? 'Kontrol Bekliyor' : 'Pending Control')}
                    {app.status === 'forwarded_to_ydyo' && (lang === 'tr' ? 'YDYO Hazırlık Kontrolünde' : 'At YDYO Prep Control')}
                    {app.status === 'forwarded_to_dean' && (lang === 'tr' ? 'Dekanlık İncelemesinde' : 'Under Deanery Review')}
                    {app.status === 'forwarded_to_ygk' && (lang === 'tr' ? 'Komisyon İntibak Aşamasında' : 'At Committee Equivalency')}
                    {app.status === 'intibak_complete' && (lang === 'tr' ? 'İntibak Tamamlandı / Sıralamada' : 'Equivalency Completed / Ranked')}
                    {app.status === 'returned' && (lang === 'tr' ? 'Düzeltme Bekliyor' : 'Revision Pending')}
                  </span>
                </div>

                <div className="form-grid" style={{ gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'T.C. Kimlik No' : 'Turkish ID No'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.idNumber}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Başvurulan Program' : 'Applied Program'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{translateProgram(app.targetProgram, lang)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Başvuru Dönemi' : 'Application Semester'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.targetSemester}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Mevcut Üniversite' : 'Current University'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.sourceUniversity}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Genel Not Ortalaması (GPA)' : 'Cumulative GPA'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.currentGpa} / 4.00</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'ÖSYM YKS Taban Puanı' : 'OSYM YKS Base Score'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.osymPoints}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Kayıt Durumu' : 'Enrollment Status'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.isCurrentlyEnrolled ? (lang === 'tr' ? 'Halen Kayıtlı' : 'Currently Enrolled') : (lang === 'tr' ? 'Kayıtlı Değil' : 'Not Enrolled')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Son Güncelleme' : 'Last Update'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{app.lastEditedAt}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{lang === 'tr' ? 'Yüklenen Belgeler' : 'Uploaded Documents'}</h4>
                  <table className="ubys-table">
                    <thead>
                      <tr>
                        <th>{lang === 'tr' ? 'Belge Türü' : 'Document Type'}</th>
                        <th>{lang === 'tr' ? 'Dosya Adı' : 'File Name'}</th>
                        <th>{lang === 'tr' ? 'Boyut' : 'Size'}</th>
                        <th>{lang === 'tr' ? 'Yükleme Tarihi' : 'Upload Date'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {app.documents.map((doc) => {
                        const slot = DOCUMENT_SLOTS.find(s => s.id === doc.slot);
                        return (
                          <tr key={doc.id}>
                            <td>{slot ? getSlotName(slot.id, lang) : (lang === 'tr' ? 'Diğer' : 'Other')}</td>
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
            title={lang === 'tr' ? 'Başvuru İptal Onayı' : 'Application Cancel Confirmation'}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleCancelConfirm}
            confirmText={lang === 'tr' ? 'Evet, İptal Et' : 'Yes, Cancel'}
            confirmType="danger"
          >
            <p>{lang === 'tr' ? 'Başvurunuzu kalıcı olarak iptal etmek istediğinize emin misiniz?' : 'Are you sure you want to permanently cancel your application?'}</p>
            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>
              {lang === 'tr' ? 'Bu işlem geri alınamaz!' : 'This action cannot be undone!'}
            </p>
          </Modal>
        </div>
      )}

      {activeTab === 'applicant_submit' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{app ? (lang === 'tr' ? 'Başvuru Belgelerini Güncelle' : 'Update Application Documents') : (lang === 'tr' ? 'Yatay Geçiş Başvuru Formu' : 'Horizontal Transfer Application Form')}</h2>
              <p className="page-description">{lang === 'tr' ? 'Lütfen tüm akademik bilgilerinizi giriniz ve ilgili PDF belgelerinizi yükleyiniz.' : 'Please enter all your academic information and upload the relevant PDF documents.'}</p>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleFormSubmit}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{lang === 'tr' ? 'Akademik Bilgiler' : 'Academic Information'}</h4>
              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'T.C. Kimlik Numarası' : 'Turkish ID Number'}</label>
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
                  <label className="form-label">{lang === 'tr' ? 'Başvurulacak Program' : 'Applied Program'}</label>
                  <select 
                    className="form-control" 
                    name="targetProgram"
                    value={formData.targetProgram}
                    onChange={handleChange}
                  >
                    {PROGRAMS.map((prog, idx) => (
                      <option key={idx} value={prog}>{translateProgram(prog, lang)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'Mevcut Üniversiteniz' : 'Your Current University'}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="sourceUniversity"
                    placeholder={lang === 'tr' ? 'Örn: Ege Üniversitesi' : 'e.g. Ege University'}
                    required
                    value={formData.sourceUniversity}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'Genel Not Ortalaması (GPA)' : 'Cumulative GPA'}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="4"
                    className="form-control" 
                    name="currentGpa"
                    placeholder={lang === 'tr' ? 'Örn: 3.45' : 'e.g. 3.45'}
                    required
                    value={formData.currentGpa}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'YKS ÖSYM Taban Puanınız' : 'YKS OSYM Base Score'}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    name="osymPoints"
                    placeholder={lang === 'tr' ? 'Örn: 420.50' : 'e.g. 420.50'}
                    required
                    value={formData.osymPoints}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'tr' ? 'Halen Kayıtlı mısınız?' : 'Are you currently enrolled?'}</label>
                  <select 
                    className="form-control" 
                    name="isCurrentlyEnrolled"
                    value={formData.isCurrentlyEnrolled}
                    onChange={handleChange}
                  >
                    <option value="true">{lang === 'tr' ? 'Evet, halen kayıtlıyım' : 'Yes, currently enrolled'}</option>
                    <option value="false">{lang === 'tr' ? 'Hayır, ilişiğim kesildi / kayıt sildirdim' : 'No, dismissed / registration cancelled'}</option>
                  </select>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{lang === 'tr' ? 'Belgeler (Sadece PDF, Maks 5MB)' : 'Documents (PDF only, Max 5MB)'}</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {DOCUMENT_SLOTS.map((slot) => {
                  let existingDoc = app ? app.documents.find(d => d.slot === slot.id) : null;
                  
                  return (
                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                      <div style={{ flexGrow: 1 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>
                          {getSlotName(slot.id, lang)}
                          {slot.required && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>}
                        </span>
                        {existingDoc && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                            <CheckCircle2 size={12} /> {lang === 'tr' ? 'Yüklü Dosya: ' : 'Uploaded File: '}{existingDoc.filename} ({existingDoc.fileSize})
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
                          {files[slot.id] ? (lang === 'tr' ? 'Dosyayı Değiştir' : 'Change File') : (existingDoc ? (lang === 'tr' ? 'Güncelle' : 'Update') : (lang === 'tr' ? 'Dosya Seç' : 'Choose File'))}
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
                  {lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} /> {app ? (lang === 'tr' ? 'Başvuruyu Güncelle ve Gönder' : 'Update & Submit Application') : (lang === 'tr' ? 'Başvuruyu Tamamla ve Gönder' : 'Complete & Submit Application')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
