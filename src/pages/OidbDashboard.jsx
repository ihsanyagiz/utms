import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS } from '../data/seedData';
import { 
  Eye, Check, RotateCcw, AlertCircle, FileText, Play,
  TrendingUp, Award, AwardIcon, FileSpreadsheet, Search, CheckCircle
} from 'lucide-react';
import Modal from '../components/Modal';

export default function OidbDashboard({ activeTab }) {
  const { 
    applications, 
    runCheckerManually, 
    forwardToYdyo, 
    cancelForwardToYdyo,
    returnToApplicantFromOidb, 
    config, 
    updateConfig,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppId, setExpandedAppId] = useState(null);
  
  // Return Notes Modal State
  const [returnNotes, setReturnNotes] = useState('');
  const [returningAppId, setReturningAppId] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState(null);

  // Quota Management
  const [quota, setQuota] = useState(config.rankingQuota);

  // Expanded area Return Reason & YDYO Forward Cancel states
  const [expandedReturnReasons, setExpandedReturnReasons] = useState({});
  const [isCancelForwardModalOpen, setIsCancelForwardModalOpen] = useState(false);
  const [cancellingForwardAppId, setCancellingForwardAppId] = useState(null);
  const [anonymize, setAnonymize] = useState(false);

  // Filter applications for search
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.sourceUniversity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Submitted & Forwarded Ydyo apps for control panel
  const submittedApps = filteredApps.filter(app => 
    app.status === 'submitted' || 
    app.status === 'returned' || 
    app.status === 'forwarded_to_ydyo'
  );

  // Intibak complete apps for rankings
  const rankedApps = applications
    .filter(app => app.status === 'intibak_complete')
    .map(app => {
      const score = Number(((parseFloat(app.osymPoints) / 560) * 90 + (parseFloat(app.currentGpa) / 4.0) * 10).toFixed(4));
      return { ...app, rankingScore: score };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);

  const handleToggleExpand = (id) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  const handleReturnSubmit = () => {
    if (returningAppId) {
      returnToApplicantFromOidb(returningAppId, returnNotes);
      setIsReturnModalOpen(false);
      setReturnNotes('');
      setReturningAppId(null);
    }
  };

  const handlePublishRankings = () => {
    updateConfig({ rankingQuota: quota });
    showToast('Yatay Geçiş Asil/Yedek Sonuçları Başarıyla İlan Edilmiştir!', 'success');
  };

  const handleCancelForwardClick = (id) => {
    setCancellingForwardAppId(id);
    setIsCancelForwardModalOpen(true);
  };

  const handleCancelForwardConfirm = () => {
    if (cancellingForwardAppId) {
      cancelForwardToYdyo(cancellingForwardAppId);
      setIsCancelForwardModalOpen(false);
      setCancellingForwardAppId(null);
    }
  };

  const handleDownloadXlsx = () => {
    const headers = ['Sira', 'Aday Ogrenci', 'Gittigi Program', 'YKS Puani', 'GPA', 'Siralama Puani', 'Yerlesme Durumu'];
    const rows = rankedApps.map((app, idx) => {
      const rank = idx + 1;
      const isAsil = rank <= quota;
      const name = anonymize 
        ? app.fullName.split(' ').map(part => part[0] + '*'.repeat(Math.max(1, part.length - 1))).join(' ')
        : app.fullName;
      return [
        `#${rank}`,
        name,
        app.targetProgram,
        app.osymPoints,
        app.currentGpa,
        app.rankingScore.toFixed(4),
        isAsil ? 'ASİL' : `YEDEK #${rank - quota}`
      ];
    });

    const csvContent = "\uFEFF" // UTF-8 BOM
      + [headers.join(';'), ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Yatay_Gecis_Siralama_${anonymize ? 'Anonim_' : ''}${config.semester.replace(/\s+/g, '_')}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ranking list downloaded successfully.', 'success');
  };

  return (
    <div className="content-body">
      {activeTab === 'oidb_check' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">Belge Kontrol Paneli</h2>
              <p className="page-description">Öğrencilerin yüklediği evrakları kontrol edin, otomatik doğrulayıcıyı çalıştırın ve onaylayın.</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="card-grid">
            <div className="card">
              <span className="card-title">Kontrol Bekleyen</span>
              <span className="card-value">{applications.filter(a => a.status === 'submitted').length}</span>
              <span className="card-subtitle">Sisteme yeni düşen başvurular</span>
            </div>
            <div className="card">
              <span className="card-title">Düzeltme İstenen</span>
              <span className="card-value">{applications.filter(a => a.status === 'returned').length}</span>
              <span className="card-subtitle">Eksik belge nedeniyle iade edilenler</span>
            </div>
            <div className="card">
              <span className="card-title">Toplam Başvuru</span>
              <span className="card-value">{applications.length}</span>
              <span className="card-subtitle">Tüm aşamalardaki başvurular</span>
            </div>
          </div>

          {/* Search & List */}
          <div className="table-container">
            <div className="table-header-bar">
              <h3 className="table-title">Başvuru Listesi</h3>
              <div className="table-actions">
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="table-search" 
                  placeholder="Aday Adı veya Üni Ara..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <table className="ubys-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Aday Öğrenci</th>
                  <th>Üniversite / Program</th>
                  <th>GPA / YKS</th>
                  <th>Otomatik Kontrol</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {submittedApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Kontrol bekleyen başvuru bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  submittedApps.map((app) => {
                    const isExpanded = expandedAppId === app.id;
                    const errorCount = app.docCheckerErrors ? app.docCheckerErrors.length : 0;
                    
                    return (
                      <React.Fragment key={app.id}>
                        <tr>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm btn-icon-only" 
                              onClick={() => handleToggleExpand(app.id)}
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{app.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TC: {app.idNumber}</div>
                          </td>
                          <td>
                            <div>{app.sourceUniversity}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hedef: {app.targetProgram}</div>
                          </td>
                          <td>
                            <div>GPA: {app.currentGpa}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>YKS: {app.osymPoints}</div>
                          </td>
                          <td>
                            {app.docCheckerStatus === 'needs_manual_check' && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Çalıştırılmadı</span>
                            )}
                            {app.docCheckerStatus === 'auto_checked' && errorCount === 0 && (
                              <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Check size={14} /> Sorun Yok
                              </span>
                            )}
                            {app.docCheckerStatus === 'auto_checked' && errorCount > 0 && (
                              <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                <AlertCircle size={14} /> {errorCount} Hata/Eksik
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge status-${app.status}`}>
                              {app.status === 'submitted' && 'İncelemede'}
                              {app.status === 'returned' && 'İade Edildi'}
                              {app.status === 'forwarded_to_ydyo' && 'Forwarded To Ydyo'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                title="Otomatik kontrolü çalıştır"
                                onClick={() => runCheckerManually(app.id)}
                              >
                                <Play size={12} /> Kontrol Et
                              </button>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleToggleExpand(app.id)}
                              >
                                {isExpanded ? 'Kapat' : 'Genişlet (Expand)'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="expanded-row">
                            <td colSpan="7" style={{ padding: '1.25rem', backgroundColor: '#fdfdfd', borderTop: 'none' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                
                                {/* Left Side: Documents list */}
                                <div>
                                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                                    Başvuru Evrakları
                                  </h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {DOCUMENT_SLOTS.map((slot) => {
                                      const doc = app.documents.find(d => d.slot === slot.id);
                                      return (
                                        <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                            {slot.name} {slot.required && <span style={{ color: 'red' }}>*</span>}
                                          </span>
                                          {doc ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.fileSize}</span>
                                              <button 
                                                className="btn btn-secondary btn-sm" 
                                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                                onClick={() => setViewingDoc({ ...doc, slotName: slot.name, applicantName: app.fullName })}
                                              >
                                                Görüntüle
                                              </button>
                                            </div>
                                          ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Eksik</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Right Side: Auto checker report */}
                                <div>
                                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                                    Doğrulayıcı Raporu
                                  </h4>
                                  {app.docCheckerStatus === 'needs_manual_check' ? (
                                    <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '4px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                      Henüz otomatik kontrol çalıştırılmadı. Lütfen yukarıdaki "Kontrol Et" butonuna basınız.
                                    </div>
                                  ) : (
                                    <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', minHeight: '110px' }}>
                                      {errorCount === 0 ? (
                                        <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 500 }}>
                                          <CheckCircle size={16} /> Otomatik doğrulamada herhangi bir hata veya eksik belgeye rastlanmadı.
                                        </div>
                                      ) : (
                                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                          {app.docCheckerErrors.map((err, idx) => (
                                            <li key={idx} style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                                              {err.reason}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* If returned notes exist */}
                                  {app.oidbNotes && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.75rem', color: '#991b1b' }}>
                                      <strong>Önceki İade Açıklaması:</strong> {app.oidbNotes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Expanded Panel Actions Area (TC-FWD-06 & TC-FWD-07) */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                                {app.status === 'forwarded_to_ydyo' ? (
                                  <button 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleCancelForwardClick(app.id)}
                                  >
                                    Cancel Forward to YDYO (YDYO Sevki İptal Et)
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-success btn-sm"
                                      disabled={app.status === 'returned'}
                                      onClick={() => forwardToYdyo(app.id)}
                                    >
                                      Approve & forward to YDYO (Onayla ve YDYO'ya Sevk Et)
                                    </button>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <textarea 
                                        className="form-control"
                                        style={{ width: '220px', height: '32px', minHeight: '32px', fontSize: '0.75rem', padding: '0.25rem 0.5rem', margin: 0 }}
                                        placeholder="İade gerekçesi yazınız..."
                                        value={expandedReturnReasons[app.id] || ''}
                                        onChange={(e) => setExpandedReturnReasons(prev => ({ ...prev, [app.id]: e.target.value }))}
                                      />
                                      <button 
                                        className="btn btn-danger btn-sm"
                                        disabled={!(expandedReturnReasons[app.id] || '').trim()}
                                        onClick={() => {
                                          returnToApplicantFromOidb(app.id, expandedReturnReasons[app.id]);
                                        }}
                                      >
                                        Return to Applicant (Adaya İade Et)
                                      </button>
                                    </div>
                                  </>
                                )}
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

          {/* Document Viewer Mockup Modal */}
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
                    Yeni Sekmede Aç / İndir (Open / Download)
                  </a>
                  <button className="btn btn-secondary btn-sm" onClick={() => setViewingDoc(null)}>Kapat</button>
                </div>
              </div>
            )}
          </Modal>

          {/* OIDB Return Notes modal */}
          <Modal
            isOpen={isReturnModalOpen}
            title="Başvuru İade Formu"
            onClose={() => setIsReturnModalOpen(false)}
            onConfirm={handleReturnSubmit}
            confirmText="İade Et"
            confirmType="danger"
          >
            <div className="form-group">
              <label className="form-label">İade Gerekçesi / Adaya Mesaj <span style={{ color: 'red' }}>*</span></label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder="Öğrencinin hangi belgeleri düzeltmesi gerektiğini detaylıca yazınız..."
                required
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </Modal>

          {/* Cancel Forward to YDYO confirmation modal */}
          <Modal
            isOpen={isCancelForwardModalOpen}
            title="Sevki İptal Et"
            onClose={() => setIsCancelForwardModalOpen(false)}
            onConfirm={handleCancelForwardConfirm}
            confirmText="Confirm"
            cancelText="Cancel"
            confirmType="danger"
          >
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              Cancel the forward to YDYO? The application will revert to Submitted status.
            </p>
          </Modal>
        </div>
      )}

      {activeTab === 'oidb_rankings' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">Yatay Geçiş Sıralama ve Kontenjan</h2>
              <p className="page-description">Tüm intibak değerlendirmesi tamamlanmış adayları YKS ve GPA ağırlığına göre sıralayıp ilan edin.</p>
            </div>
            <button className="btn btn-primary" onClick={handlePublishRankings}>
              <FileSpreadsheet size={16} /> Sonuçları İlan Et (Yayınla)
            </button>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Kontenjan Parametreleri</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="form-label" style={{ margin: 0 }}>Fakülte Asil Kontenjanı:</span>
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ width: '80px', padding: '0.35rem' }} 
                  value={quota}
                  onChange={(e) => setQuota(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexGrow: 1 }}>
                *İlk {quota} aday "Asil" kontenjana yerleşecek, kalan adaylar ise "Yedek" olarak listelenecektir.*
                <br />
                <strong>Sıralama Puanı Formülü:</strong> (YKS / 560) × 90 + (GPA / 4) × 10
              </p>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="table-title">Nihai Sıralama Listesi (İntibakı Bitenler)</h3>
              <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    id="anonymizeCheckbox"
                    checked={anonymize}
                    onChange={(e) => setAnonymize(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Anonymize Applicants (Adayları Anonimleştir)</span>
                </label>

                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={handleDownloadXlsx}
                >
                  <FileSpreadsheet size={14} /> Download XLSX (Excel İndir)
                </button>

                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success)' }}>
                  Toplam Aday: {rankedApps.length}
                </span>
              </div>
            </div>

            <table className="ubys-table">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Aday Öğrenci</th>
                  <th>Gittiği Program</th>
                  <th>YKS (OSYM)</th>
                  <th>GPA</th>
                  <th>Sıralama Puanı</th>
                  <th>Yerleşme Durumu</th>
                </tr>
              </thead>
              <tbody>
                {rankedApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Henüz intibak aşaması bitmiş ve sıralamaya girmeye hak kazanmış öğrenci bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  rankedApps.map((app, idx) => {
                    const rank = idx + 1;
                    const isAsil = rank <= quota;
                    
                    return (
                      <tr key={app.id} className={isAsil ? 'ranking-row-asil' : 'ranking-row-yedek'}>
                        <td style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-muted)' }}>#{rank}</td>
                        <td style={{ fontWeight: 600 }}>
                          {anonymize 
                            ? app.fullName.split(' ').map(part => part[0] + '*'.repeat(Math.max(1, part.length - 1))).join(' ')
                            : app.fullName
                          }
                        </td>
                        <td>{app.targetProgram}</td>
                        <td>{app.osymPoints}</td>
                        <td>{app.currentGpa}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                          {app.rankingScore.toFixed(4)}
                        </td>
                        <td>
                          <span className={`badge-quota ${isAsil ? 'badge-quota-asil' : 'badge-quota-yedek'}`}>
                            {isAsil ? 'ASİL' : `YEDEK #${rank - quota}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
