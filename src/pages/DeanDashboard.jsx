import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS, PROGRAM_DEPARTMENT_MAP, getSlotName, translateReason, translateProgram } from '../data/seedData';
import { 
  Eye, Check, RotateCcw, AlertTriangle, FileText, Play,
  TrendingUp, Award, HelpCircle, ArrowRight, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import Modal from '../components/Modal';

export default function DeanDashboard() {
  const { applications, forwardToYgk, returnFromDean, lang } = useApp();
  const [expandedAppId, setExpandedAppId] = useState(null);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState('applicant'); // 'applicant' | 'oidb' | 'ydyo'
  const [returnNotes, setReturnNotes] = useState('');
  const [returningAppId, setReturningAppId] = useState(null);

  // Document Viewer
  const [viewingDoc, setViewingDoc] = useState(null);

  const deanApps = applications.filter(app => app.status === 'forwarded_to_dean');

  const handleToggleExpand = (id) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  const handleForwardToYgk = (appId, targetProgram) => {
    // Maps target program to department
    forwardToYgk(appId, targetProgram);
  };

  const handleReturnSubmit = () => {
    if (returningAppId) {
      returnFromDean(returningAppId, returnTarget, returnNotes);
      setIsReturnModalOpen(false);
      setReturnNotes('');
      setReturningAppId(null);
    }
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">{lang === 'tr' ? 'Mühendislik Fakültesi Dekanlığı' : 'Engineering Faculty Deanery'}</h2>
          <p className="page-description">
            {lang === 'tr'
              ? 'Öğrenci işleri ve YDYO kontrolleri tamamlanmış başvuruları inceleyin, ilgili bölümlerin komisyonlarına (YGK) havale edin.'
              : 'Review applications that have completed student affairs and YDYO checks, and forward them to the relevant department committees (YGK).'}
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <span className="card-title">{lang === 'tr' ? 'Komisyon Havale Bekleyen' : 'Pending Committee Forwarding'}</span>
          <span className="card-value">{deanApps.length}</span>
          <span className="card-subtitle">{lang === 'tr' ? 'Dekanlık onay sırasındaki adaylar' : 'Applicants in the Deanery approval queue'}</span>
        </div>
        <div className="card">
          <span className="card-title">{lang === 'tr' ? 'Bölümlere Gönderilen' : 'Forwarded to Departments'}</span>
          <span className="card-value">
            {applications.filter(a => a.status === 'forwarded_to_ygk' || a.status === 'intibak_complete').length}
          </span>
          <span className="card-subtitle">{lang === 'tr' ? 'Komisyon değerlendirmesinde olan toplam aday' : 'Total applicants under committee evaluation'}</span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3 className="table-title">{lang === 'tr' ? 'Fakülte Değerlendirme Listesi' : 'Faculty Evaluation List'}</h3>
        </div>

        <table className="ubys-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>{lang === 'tr' ? 'Aday Öğrenci' : 'Applicant Student'}</th>
              <th>{lang === 'tr' ? 'Hedef Program' : 'Target Program'}</th>
              <th>{lang === 'tr' ? 'YKS / GPA' : 'YKS / GPA'}</th>
              <th>{lang === 'tr' ? 'Hazırlık Muafiyeti' : 'Prep Exemption'}</th>
              <th>{lang === 'tr' ? 'Durum' : 'Status'}</th>
              <th>{lang === 'tr' ? 'Komisyon Havalesi' : 'Committee Forwarding'}</th>
            </tr>
          </thead>
          <tbody>
            {deanApps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {lang === 'tr' ? 'Dekanlık onay aşamasında bekleyen başvuru bulunmamaktadır.' : 'There are no applications pending approval in the Deanery.'}
                </td>
              </tr>
            ) : (
              deanApps.map((app) => {
                const isExpanded = expandedAppId === app.id;
                
                return (
                  <React.Fragment key={app.id}>
                    <tr>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm btn-icon-only" 
                          onClick={() => handleToggleExpand(app.id)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'tr' ? 'Mevcut: ' : 'Current: '}{app.sourceUniversity}</div>
                      </td>
                      <td>
                        <div>{translateProgram(app.targetProgram, lang)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'tr' ? 'Dönem: ' : 'Semester: '}{app.targetSemester}</div>
                      </td>
                      <td>
                        <div>{lang === 'tr' ? 'YKS: ' : 'YKS: '}{app.osymPoints}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'tr' ? 'Ort.: ' : 'GPA: '}{app.currentGpa} / 4.00</div>
                      </td>
                      <td>
                        {app.prepSchoolStatus === 'eligible' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8rem' }}>{lang === 'tr' ? 'Muaf' : 'Eligible'}</span>
                        ) : (
                          <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.8rem' }}>{lang === 'tr' ? 'Sınava Girmeli' : 'Must Take Exam'}</span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge status-pending-dean">{lang === 'tr' ? 'Dekanlıkta' : 'At Deanery'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button 
                            className="btn btn-success btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            onClick={() => handleForwardToYgk(app.id, app.targetProgram)}
                          >
                            {lang === 'tr' ? 'Komisyona Sevk Et' : 'Forward to YGK'} <ArrowRight size={12} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setReturningAppId(app.id);
                              setIsReturnModalOpen(true);
                            }}
                          >
                            {lang === 'tr' ? 'İade Et / Geri Gönder' : 'Return'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="expanded-row">
                        <td colSpan="7" style={{ padding: '1.25rem', backgroundColor: '#fdfdfd', borderTop: 'none' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Left Column: Documents & Checker Banner */}
                            <div>
                              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                                {lang === 'tr' ? 'Belge Kontrol Sonuçları' : 'Document Control Results'}
                              </h4>
                              
                              {/* Doc Checker Status Banner */}
                              {app.docCheckerErrors && app.docCheckerErrors.length === 0 ? (
                                <div className="doc-checker-banner doc-checker-banner-passed">
                                  <ShieldCheck size={16} />
                                  {lang === 'tr' ? 'ÖİDB Otomatik Belge Kontrolünden Geçti (Herhangi bir hata bulunamadı).' : 'Passed OIDB Automatic Document Control (No errors found).'}
                                </div>
                              ) : (
                                <div className="doc-checker-banner doc-checker-banner-failed">
                                  <AlertTriangle size={16} />
                                  {lang === 'tr' ? `ÖİDB Otomatik Kontrolünde Uyarılara Rastlandı (${app.docCheckerErrors?.length} adet).` : `Warnings Found in OIDB Automatic Control (${app.docCheckerErrors?.length} items).`}
                                </div>
                              )}

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {DOCUMENT_SLOTS.map((slot) => {
                                  const doc = app.documents.find(d => d.slot === slot.id);
                                  return (
                                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '0.8rem' }}>
                                      <span>{getSlotName(slot.id, lang)}</span>
                                      {doc ? (
                                        <button 
                                          className="btn btn-secondary btn-sm" 
                                          style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
                                          onClick={() => setViewingDoc({ ...doc, slotName: getSlotName(slot.id, lang), applicantName: app.fullName })}
                                        >
                                          {lang === 'tr' ? 'İncele' : 'Review'}
                                        </button>
                                      ) : (
                                        <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{lang === 'tr' ? 'Yüklenmedi' : 'Not Uploaded'}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Column: Academic Details & Logs */}
                            <div>
                              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                                {lang === 'tr' ? 'Akademik Kontrol Bilgileri' : 'Academic Control Information'}
                              </h4>
                              <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '0.8rem' }}>
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <strong>{lang === 'tr' ? 'Kayıtlılık Durumu:' : 'Enrollment Status:'}</strong> {app.isCurrentlyEnrolled ? (lang === 'tr' ? 'Aktif Öğrenci' : 'Active Student') : (lang === 'tr' ? 'Okulla İlişiği Kesilmiş' : 'Dismissed from School')}
                                </div>
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <strong>{lang === 'tr' ? 'Öğrenci YKS Yerleşme Puanı:' : 'Student YKS Placement Score:'}</strong> {app.osymPoints}
                                </div>
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <strong>{lang === 'tr' ? 'Adayın Not Ortalaması (GPA):' : 'Applicant GPA:'}</strong> {app.currentGpa} / 4.00
                                </div>
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                  <strong>{lang === 'tr' ? 'ÖİDB Kontrol Logları:' : 'OIDB Control Logs:'}</strong> {app.docCheckerErrors && app.docCheckerErrors.length > 0 ? (
                                    <ul style={{ paddingLeft: '1rem', marginTop: '0.25rem', color: '#b91c1c' }}>
                                      {app.docCheckerErrors.map((err, idx) => (
                                        <li key={idx}>{translateReason(err.reason, lang)}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span style={{ color: '#047857' }}>{lang === 'tr' ? 'Herhangi bir hata veya eksik belge uyarısı bulunmamaktadır.' : 'There are no errors or missing document warnings.'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Document View Modal */}
      <Modal
        isOpen={!!viewingDoc}
        title={viewingDoc ? `${viewingDoc.applicantName} - ${viewingDoc.slotName}` : ''}
        onClose={() => setViewingDoc(null)}
      >
        {viewingDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
            <iframe 
              src={`/${viewingDoc.filePath}`} 
              title="PDF Viewer" 
              style={{ width: '100%', height: '450px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a 
                href={`/${viewingDoc.filePath}`}
                download={viewingDoc.filename}
                className="btn btn-primary btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {lang === 'tr' ? 'Yeni Sekmede Aç / İndir' : 'Open / Download in New Tab'}
              </a>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingDoc(null)}>{lang === 'tr' ? 'Kapat' : 'Close'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal for Dean */}
      <Modal
        isOpen={isReturnModalOpen}
        title={lang === 'tr' ? 'Başvuru İade ve Geri Gönderme Formu' : 'Application Return Form'}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleReturnSubmit}
        confirmText={lang === 'tr' ? 'İade Kararı Ver' : 'Return'}
        confirmType="danger"
      >
        <div className="form-group">
          <label className="form-label">{lang === 'tr' ? 'Geri Gönderilecek Hedef Birim' : 'Target Unit for Return'}</label>
          <select 
            className="form-control"
            value={returnTarget}
            onChange={(e) => setReturnTarget(e.target.value)}
          >
            <option value="applicant">{lang === 'tr' ? 'Aday Öğrenci (Düzeltme İçin)' : 'Return to Applicant'}</option>
            <option value="oidb">{lang === 'tr' ? 'Öğrenci İşleri (Evrak İnceleme)' : 'Return to OIDB'}</option>
            <option value="ydyo">{lang === 'tr' ? 'Yabancı Diller Yüksekokulu' : 'Return to YDYO'}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{lang === 'tr' ? 'İade / Geri Gönderme Açıklaması' : 'Return / Referral Explanation'} <span style={{ color: 'red' }}>*</span></label>
          <textarea 
            className="form-control" 
            rows="4" 
            placeholder={lang === 'tr' ? 'İade veya geri gönderme gerekçesini yazınız...' : 'Write the reason for return or referral...'}
            required
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
