import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS, PROGRAM_DEPARTMENT_MAP } from '../data/seedData';
import { 
  Eye, Check, RotateCcw, AlertTriangle, FileText, Play,
  TrendingUp, Award, HelpCircle, ArrowRight, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import Modal from '../components/Modal';

export default function DeanDashboard() {
  const { applications, forwardToYgk, returnFromDean } = useApp();
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
          <h2 className="page-title">Mühendislik Fakültesi Dekanlığı</h2>
          <p className="page-description">
            Öğrenci işleri ve YDYO kontrolleri tamamlanmış başvuruları inceleyin, ilgili bölümlerin komisyonlarına (YGK) havale edin.
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <span className="card-title">Komisyon Havale Bekleyen</span>
          <span className="card-value">{deanApps.length}</span>
          <span className="card-subtitle">Dekanlık onay sırasındaki adaylar</span>
        </div>
        <div className="card">
          <span className="card-title">Bölümlere Gönderilen</span>
          <span className="card-value">
            {applications.filter(a => a.status === 'forwarded_to_ygk' || a.status === 'intibak_complete').length}
          </span>
          <span className="card-subtitle">Komisyon değerlendirmesinde olan toplam aday</span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3 className="table-title">Fakülte Değerlendirme Listesi</h3>
        </div>

        <table className="ubys-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Aday Öğrenci</th>
              <th>Hedef Program</th>
              <th>YKS / GPA</th>
              <th>Hazırlık Muafiyeti</th>
              <th>Durum</th>
              <th>Komisyon Havalesi</th>
            </tr>
          </thead>
          <tbody>
            {deanApps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Dekanlık onay aşamasında bekleyen başvuru bulunmamaktadır.
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mevcut: {app.sourceUniversity}</div>
                      </td>
                      <td>
                        <div>{app.targetProgram}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dönem: {app.targetSemester}</div>
                      </td>
                      <td>
                        <div>YKS: {app.osymPoints}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ort.: {app.currentGpa} / 4.00</div>
                      </td>
                      <td>
                        {app.prepSchoolStatus === 'eligible' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8rem' }}>Muaf (Eligible)</span>
                        ) : (
                          <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.8rem' }}>Sınava Girmeli</span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge status-pending-dean">Dekanlıkta</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button 
                            className="btn btn-success btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            onClick={() => handleForwardToYgk(app.id, app.targetProgram)}
                          >
                            Komisyona Sevk <ArrowRight size={12} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setReturningAppId(app.id);
                              setIsReturnModalOpen(true);
                            }}
                          >
                            İade Et
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
                                Belge Kontrol Sonuçları
                              </h4>
                              
                              {/* Doc Checker Status Banner */}
                              {app.docCheckerErrors && app.docCheckerErrors.length === 0 ? (
                                <div className="doc-checker-banner doc-checker-banner-passed">
                                  <ShieldCheck size={16} />
                                  ÖİDB Otomatik Belge Kontrolünden Geçti (Herhangi bir hata bulunamadı).
                                </div>
                              ) : (
                                <div className="doc-checker-banner doc-checker-banner-failed">
                                  <AlertTriangle size={16} />
                                  ÖİDB Otomatik Kontrolünde Uyarılara Rastlandı ({app.docCheckerErrors?.length} adet).
                                </div>
                              )}

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {DOCUMENT_SLOTS.map((slot) => {
                                  const doc = app.documents.find(d => d.slot === slot.id);
                                  return (
                                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '0.8rem' }}>
                                      <span>{slot.name}</span>
                                      {doc ? (
                                        <button 
                                          className="btn btn-secondary btn-sm" 
                                          style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
                                          onClick={() => setViewingDoc({ ...doc, slotName: slot.name, applicantName: app.fullName })}
                                        >
                                          İncele
                                        </button>
                                      ) : (
                                        <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Yüklenmedi</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Column: Academic Details & Logs */}
                            <div>
                              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                                Akademik Kontrol Bilgileri
                              </h4>
                              <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '0.8rem' }}>
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <strong>Kayıtlılık Durumu:</strong> {app.isCurrentlyEnrolled ? 'Aktif Öğrenci' : 'Okulla İlişiği Kesilmiş'}
                                </div>
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <strong>Öğrenci YKS Yerleşme Puanı:</strong> {app.osymPoints}
                                </div>
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <strong>Adayın Not Ortalaması (GPA):</strong> {app.currentGpa} / 4.00
                                </div>
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                  <strong>ÖİDB Kontrol Logları:</strong> {app.docCheckerErrors && app.docCheckerErrors.length > 0 ? (
                                    <ul style={{ paddingLeft: '1rem', marginTop: '0.25rem', color: '#b91c1c' }}>
                                      {app.docCheckerErrors.map((err, idx) => (
                                        <li key={idx}>{err.reason}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span style={{ color: '#047857' }}>Herhangi bir hata veya eksik belge uyarısı bulunmamaktadır.</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '100%', height: '320px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ color: 'var(--primary-color)' }} />
              <strong>{viewingDoc.filename}</strong>
              <span style={{ fontSize: '0.75rem' }}>PDF Dokümanı ({viewingDoc.fileSize})</span>
              <p style={{ fontSize: '0.75rem', maxWidth: '300px', textAlign: 'center', marginTop: '0.5rem' }}>
                *Fakülte dekanı olarak başvuru belgesini buradan inceliyorsunuz.*
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setViewingDoc(null)}>Kapat</button>
          </div>
        )}
      </Modal>

      {/* Return Modal for Dean */}
      <Modal
        isOpen={isReturnModalOpen}
        title="Başvuru İade ve Geri Gönderme Formu"
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleReturnSubmit}
        confirmText="İade Kararı Ver"
        confirmType="danger"
      >
        <div className="form-group">
          <label className="form-label">Geri Gönderilecek Hedef Birim</label>
          <select 
            className="form-control"
            value={returnTarget}
            onChange={(e) => setReturnTarget(e.target.value)}
          >
            <option value="applicant">Aday Öğrenci (Düzeltme İçin)</option>
            <option value="oidb">Öğrenci İşleri (Evrak İnceleme İçin)</option>
            <option value="ydyo">Yabancı Diller Yüksekokulu (Muafiyet Değerlendirmesi İçin)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">İade / Geri Gönderme Açıklaması <span style={{ color: 'red' }}>*</span></label>
          <textarea 
            className="form-control" 
            rows="4" 
            placeholder="İade veya geri gönderme gerekçesini yazınız..."
            required
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
