import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS, getSlotName, translateReason, translateProgram } from '../data/seedData';
import { 
  Eye, Check, RotateCcw, AlertCircle, FileText, Play,
  TrendingUp, Award, AwardIcon, FileSpreadsheet, Search, CheckCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import { getDocumentUrl } from '../utils/documentUrl';

export default function OidbDashboard({ activeTab }) {
  const { 
    applications, 
    runCheckerManually, 
    forwardToYdyo, 
    cancelForwardToYdyo,
    returnToApplicantFromOidb, 
    config, 
    updateConfig,
    showToast,
    lang
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

  // New confirmation states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isForwardYdyoModalOpen, setIsForwardYdyoModalOpen] = useState(false);
  const [forwardingYdyoAppId, setForwardingYdyoAppId] = useState(null);
  const [isReturnConfirmModalOpen, setIsReturnConfirmModalOpen] = useState(false);
  const [returningConfirmAppId, setReturningConfirmAppId] = useState(null);
  const [returningConfirmNotes, setReturningConfirmNotes] = useState('');

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
    showToast(lang === 'tr' ? 'Yatay Geçiş Asil/Yedek Sonuçları Başarıyla İlan Edilmiştir!' : 'Horizontal Transfer Main/Substitute Results Published Successfully!', 'success');
    setIsPublishModalOpen(false);
  };

  const handleForwardYdyoConfirm = () => {
    if (forwardingYdyoAppId) {
      forwardToYdyo(forwardingYdyoAppId);
      setIsForwardYdyoModalOpen(false);
      setForwardingYdyoAppId(null);
    }
  };

  const handleReturnConfirmSubmit = () => {
    if (returningConfirmAppId) {
      returnToApplicantFromOidb(returningConfirmAppId, returningConfirmNotes);
      setIsReturnConfirmModalOpen(false);
      setReturningConfirmAppId(null);
      setReturningConfirmNotes('');
    }
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
    const headers = lang === 'tr' 
      ? ['Sıra', 'Aday Öğrenci', 'Gittiği Program', 'YKS Puanı', 'GPA', 'Sıralama Puanı', 'Yerleşme Durumu']
      : ['Rank', 'Applicant Student', 'Target Program', 'YKS Score', 'GPA', 'Ranking Score', 'Placement Status'];
    const rows = rankedApps.map((app, idx) => {
      const rank = idx + 1;
      const isAsil = rank <= quota;
      const name = anonymize 
        ? app.fullName.split(' ').map(part => part[0] + '*'.repeat(Math.max(1, part.length - 1))).join(' ')
        : app.fullName;
      return [
        `#${rank}`,
        name,
        translateProgram(app.targetProgram, lang),
        app.osymPoints,
        app.currentGpa,
        app.rankingScore.toFixed(4),
        isAsil ? (lang === 'tr' ? 'ASİL' : 'MAIN') : (lang === 'tr' ? `YEDEK #${rank - quota}` : `SUBSTITUTE #${rank - quota}`)
      ];
    });

    const csvContent = "\uFEFF" // UTF-8 BOM
      + [headers.join(';'), ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Yatay_Gecis_Siralama_${anonymize ? 'Anonim_' : ''}${config.semester.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'tr' ? 'Sıralama listesi başarıyla indirildi.' : 'Ranking list downloaded successfully.', 'success');
  };

  return (
    <div className="content-body">
      {activeTab === 'oidb_check' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{lang === 'tr' ? 'Belge Kontrol Paneli' : 'Document Control Panel'}</h2>
              <p className="page-description">{lang === 'tr' ? 'Öğrencilerin yüklediği evrakları kontrol edin, otomatik doğrulayıcıyı çalıştırın ve onaylayın.' : 'Review documents uploaded by students, run the automatic verifier, and approve.'}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="card-grid">
            <div className="card">
              <span className="card-title">{lang === 'tr' ? 'Kontrol Bekleyen' : 'Pending Control'}</span>
              <span className="card-value">{applications.filter(a => a.status === 'submitted').length}</span>
              <span className="card-subtitle">{lang === 'tr' ? 'Sisteme yeni düşen başvurular' : 'Newly received applications'}</span>
            </div>
            <div className="card">
              <span className="card-title">{lang === 'tr' ? 'Düzeltme İstenen' : 'Revision Requested'}</span>
              <span className="card-value">{applications.filter(a => a.status === 'returned').length}</span>
              <span className="card-subtitle">{lang === 'tr' ? 'Eksik belge nedeniyle iade edilenler' : 'Returned due to missing documents'}</span>
            </div>
            <div className="card">
              <span className="card-title">{lang === 'tr' ? 'Toplam Başvuru' : 'Total Applications'}</span>
              <span className="card-value">{applications.length}</span>
              <span className="card-subtitle">{lang === 'tr' ? 'Tüm aşamalardaki başvurular' : 'Applications in all phases'}</span>
            </div>
          </div>

          {/* Search & List */}
          <div className="table-container">
            <div className="table-header-bar">
              <h3 className="table-title">{lang === 'tr' ? 'Başvuru Listesi' : 'Application List'}</h3>
              <div className="table-actions">
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="table-search" 
                  placeholder={lang === 'tr' ? 'Aday Adı veya Üni Ara...' : 'Search Applicant or Uni...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <table className="ubys-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>{lang === 'tr' ? 'Aday Öğrenci' : 'Applicant Student'}</th>
                  <th>{lang === 'tr' ? 'Üniversite / Program' : 'University / Program'}</th>
                  <th>GPA / YKS</th>
                  <th>{lang === 'tr' ? 'Otomatik Kontrol' : 'Automatic Check'}</th>
                  <th>{lang === 'tr' ? 'Durum' : 'Status'}</th>
                  <th>{lang === 'tr' ? 'İşlemler' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {submittedApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {lang === 'tr' ? 'Kontrol bekleyen başvuru bulunmamaktadır.' : 'There are no applications pending control.'}
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'tr' ? 'Hedef: ' : 'Target: '}{translateProgram(app.targetProgram, lang)}</div>
                          </td>
                          <td>
                            <div>GPA: {app.currentGpa}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>YKS: {app.osymPoints}</div>
                          </td>
                          <td>
                            {app.docCheckerStatus === 'needs_manual_check' && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lang === 'tr' ? 'Çalıştırılmadı' : 'Not Run'}</span>
                            )}
                            {app.docCheckerStatus === 'auto_checked' && errorCount === 0 && (
                              <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Check size={14} /> {lang === 'tr' ? 'Sorun Yok' : 'No Issues'}
                              </span>
                            )}
                            {app.docCheckerStatus === 'auto_checked' && errorCount > 0 && (
                              <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                <AlertCircle size={14} /> {errorCount} {lang === 'tr' ? 'Hata/Eksik' : 'Errors/Missing'}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge status-${app.status}`}>
                              {app.status === 'submitted' && (lang === 'tr' ? 'İncelemede' : 'Under Review')}
                              {app.status === 'returned' && (lang === 'tr' ? 'İade Edildi' : 'Returned')}
                              {app.status === 'forwarded_to_ydyo' && (lang === 'tr' ? 'YDYO\'ya Sevk Edildi' : 'Forwarded To Ydyo')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                title={lang === 'tr' ? 'Otomatik kontrolü çalıştır' : 'Run automatic control'}
                                onClick={() => runCheckerManually(app.id)}
                              >
                                <Play size={12} /> {lang === 'tr' ? 'Kontrol Et' : 'Check'}
                              </button>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleToggleExpand(app.id)}
                              >
                                {isExpanded ? (lang === 'tr' ? 'Kapat' : 'Close') : (lang === 'tr' ? 'Genişlet' : 'Expand')}
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
                                    {lang === 'tr' ? 'Başvuru Evrakları' : 'Application Documents'}
                                  </h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {DOCUMENT_SLOTS.map((slot) => {
                                      const doc = app.documents.find(d => d.slot === slot.id);
                                      return (
                                        <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                            {getSlotName(slot.id, lang)} {slot.required && <span style={{ color: 'red' }}>*</span>}
                                          </span>
                                          {doc ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.fileSize}</span>
                                              <button 
                                                className="btn btn-secondary btn-sm" 
                                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                                onClick={() => setViewingDoc({ ...doc, slotName: getSlotName(slot.id, lang), applicantName: app.fullName })}
                                              >
                                                {lang === 'tr' ? 'Görüntüle' : 'View'}
                                              </button>
                                            </div>
                                          ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{lang === 'tr' ? 'Eksik' : 'Missing'}</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Right Side: Auto checker report */}
                                <div>
                                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                                    {lang === 'tr' ? 'Doğrulayıcı Raporu' : 'Verifier Report'}
                                  </h4>
                                  {app.docCheckerStatus === 'needs_manual_check' ? (
                                    <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '4px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                      {lang === 'tr' ? 'Henüz otomatik kontrol çalıştırılmadı. Lütfen yukarıdaki "Kontrol Et" butonuna basınız.' : 'Automatic check has not been run yet. Please click the "Check" button above.'}
                                    </div>
                                  ) : (
                                    <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', minHeight: '110px' }}>
                                      {errorCount === 0 ? (
                                        <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 500 }}>
                                          <CheckCircle size={16} /> {lang === 'tr' ? 'Otomatik doğrulamada herhangi bir hata veya eksik belgeye rastlanmadı.' : 'No errors or missing documents were found in automatic verification.'}
                                        </div>
                                      ) : (
                                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                          {app.docCheckerErrors.map((err, idx) => (
                                            <li key={idx} style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                                              {translateReason(err.reason, lang)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* If returned notes exist */}
                                  {app.oidbNotes && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.75rem', color: '#991b1b' }}>
                                      <strong>{lang === 'tr' ? 'Önceki İade Açıklaması:' : 'Previous Return Explanation:'}</strong> {translateReason(app.oidbNotes, lang)}
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
                                    {lang === 'tr' ? 'YDYO Sevkini İptal Et' : 'Cancel Forward to YDYO'}
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-success btn-sm"
                                      disabled={app.status === 'returned'}
                                      onClick={() => {
                                        setForwardingYdyoAppId(app.id);
                                        setIsForwardYdyoModalOpen(true);
                                      }}
                                    >
                                      {lang === 'tr' ? 'Onayla ve YDYO\'ya Sevk Et' : 'Approve & forward to YDYO'}
                                    </button>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <textarea 
                                        className="form-control"
                                        style={{ width: '220px', height: '32px', minHeight: '32px', fontSize: '0.75rem', padding: '0.25rem 0.5rem', margin: 0 }}
                                        placeholder={lang === 'tr' ? 'İade gerekçesi yazınız...' : 'Write return reason...'}
                                        value={expandedReturnReasons[app.id] || ''}
                                        onChange={(e) => setExpandedReturnReasons(prev => ({ ...prev, [app.id]: e.target.value }))}
                                      />
                                      <button 
                                        className="btn btn-danger btn-sm"
                                        disabled={!(expandedReturnReasons[app.id] || '').trim()}
                                        onClick={() => {
                                          setReturningConfirmAppId(app.id);
                                          setReturningConfirmNotes(expandedReturnReasons[app.id]);
                                          setIsReturnConfirmModalOpen(true);
                                        }}
                                      >
                                        {lang === 'tr' ? 'Adaya İade Et' : 'Return to Applicant'}
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
                  src={getDocumentUrl(viewingDoc.filePath)} 
                  title="PDF Viewer" 
                  style={{ width: '100%', height: '450px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a 
                    href={getDocumentUrl(viewingDoc.filePath)}
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

          {/* OIDB Return Notes modal */}
          <Modal
            isOpen={isReturnModalOpen}
            title={lang === 'tr' ? 'Başvuru İade Formu' : 'Application Return Form'}
            onClose={() => setIsReturnModalOpen(false)}
            onConfirm={handleReturnSubmit}
            confirmText={lang === 'tr' ? 'İade Et' : 'Return'}
            confirmType="danger"
          >
            <div className="form-group">
              <label className="form-label">{lang === 'tr' ? 'İade Gerekçesi / Adaya Mesaj' : 'Return Reason / Message to Applicant'} <span style={{ color: 'red' }}>*</span></label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder={lang === 'tr' ? 'Öğrencinin hangi belgeleri düzeltmesi gerektiğini detaylıca yazınız...' : 'Explain in detail which documents the student needs to correct...'}
                required
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </Modal>

          {/* Cancel Forward to YDYO confirmation modal */}
          <Modal
            isOpen={isCancelForwardModalOpen}
            title={lang === 'tr' ? 'Sevki İptal Et' : 'Cancel Forward'}
            onClose={() => setIsCancelForwardModalOpen(false)}
            onConfirm={handleCancelForwardConfirm}
            confirmText={lang === 'tr' ? 'Onayla' : 'Confirm'}
            cancelText={lang === 'tr' ? 'İptal' : 'Cancel'}
            confirmType="danger"
          >
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {lang === 'tr' ? 'YDYO sevkini iptal etmek istiyor musunuz? Başvuru İncelemede durumuna geri dönecektir.' : 'Cancel the forward to YDYO? The application will revert to Submitted status.'}
            </p>
          </Modal>
        </div>
      )}

      {activeTab === 'oidb_rankings' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">{lang === 'tr' ? 'Yatay Geçiş Sıralama ve Kontenjan' : 'Horizontal Transfer Ranking & Quota'}</h2>
              <p className="page-description">{lang === 'tr' ? 'Tüm intibak değerlendirmesi tamamlanmış adayları YKS ve GPA ağırlığına göre sıralayıp ilan edin.' : 'Rank and publish all candidates whose equivalency evaluations are complete according to YKS and GPA weight.'}</p>
            </div>
            <button className="btn btn-primary" onClick={handlePublishRankings}>
              <FileSpreadsheet size={16} /> {lang === 'tr' ? 'Sonuçları İlan Et (Yayınla)' : 'Publish Results'}
            </button>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>{lang === 'tr' ? 'Kontenjan Parametreleri' : 'Quota Parameters'}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="form-label" style={{ margin: 0 }}>{lang === 'tr' ? 'Fakülte Asil Kontenjanı:' : 'Faculty Main Quota:'}</span>
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
                {lang === 'tr' ? `*İlk ${quota} aday "Asil" kontenjana yerleşecek, kalan adaylar ise "Yedek" olarak listelenecektir.*` : `*The first ${quota} candidates will be placed in the "Main" quota, and the remaining candidates will be listed as "Substitutes".*`}
                <br />
                <strong>{lang === 'tr' ? 'Sıralama Puanı Formülü:' : 'Ranking Score Formula:'}</strong> (YKS / 560) × 90 + (GPA / 4) × 10
              </p>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="table-title">{lang === 'tr' ? 'Nihai Sıralama Listesi (İntibakı Bitenler)' : 'Final Ranking List (Equivalencies Completed)'}</h3>
              <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    id="anonymizeCheckbox"
                    checked={anonymize}
                    onChange={(e) => setAnonymize(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{lang === 'tr' ? 'Adayları Anonimleştir' : 'Anonymize Applicants'}</span>
                </label>

                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={handleDownloadXlsx}
                >
                  <FileSpreadsheet size={14} /> {lang === 'tr' ? 'Excel İndir (CSV)' : 'Download Excel (CSV)'}
                </button>

                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success)' }}>
                  {lang === 'tr' ? 'Toplam Aday: ' : 'Total Candidates: '}{rankedApps.length}
                </span>
              </div>
            </div>

            <table className="ubys-table">
              <thead>
                <tr>
                  <th>{lang === 'tr' ? 'Sıra' : 'Rank'}</th>
                  <th>{lang === 'tr' ? 'Aday Öğrenci' : 'Applicant Student'}</th>
                  <th>{lang === 'tr' ? 'Gittiği Program' : 'Target Program'}</th>
                  <th>YKS (OSYM)</th>
                  <th>GPA</th>
                  <th>{lang === 'tr' ? 'Sıralama Puanı' : 'Ranking Score'}</th>
                  <th>{lang === 'tr' ? 'Yerleşme Durumu' : 'Placement Status'}</th>
                </tr>
              </thead>
              <tbody>
                {rankedApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {lang === 'tr' ? 'Henüz intibak aşaması bitmiş ve sıralamaya girmeye hak kazanmış öğrenci bulunmamaktadır.' : 'There are no students whose equivalency evaluations are complete and qualified for ranking yet.'}
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
                        <td>{translateProgram(app.targetProgram, lang)}</td>
                        <td>{app.osymPoints}</td>
                        <td>{app.currentGpa}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                          {app.rankingScore.toFixed(4)}
                        </td>
                        <td>
                          <span className={`badge-quota ${isAsil ? 'badge-quota-asil' : 'badge-quota-yedek'}`}>
                            {isAsil ? (lang === 'tr' ? 'ASİL' : 'MAIN') : (lang === 'tr' ? `YEDEK #${rank - quota}` : `SUBSTITUTE #${rank - quota}`)}
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

      {/* YDYO Forward Confirmation Modal */}
      <Modal
        isOpen={isForwardYdyoModalOpen}
        title={lang === 'tr' ? 'YDYO Sevk Onayı' : 'YDYO Forward Confirmation'}
        onClose={() => {
          setIsForwardYdyoModalOpen(false);
          setForwardingYdyoAppId(null);
        }}
        onConfirm={handleForwardYdyoConfirm}
        confirmText={lang === 'tr' ? 'Evet, Sevk Et' : 'Yes, Forward'}
        confirmType="success"
        cancelText={lang === 'tr' ? 'İptal' : 'Cancel'}
      >
        <p>{lang === 'tr' ? 'Bu başvuruyu onaylayıp yabancı dil muafiyet kontrolü için YDYO yetkilisine sevk etmek istediğinize emin misiniz?' : 'Are you sure you want to approve this application and forward it to YDYO for foreign language exemption control?'}</p>
      </Modal>

      {/* Return to Applicant Confirmation Modal */}
      <Modal
        isOpen={isReturnConfirmModalOpen}
        title={lang === 'tr' ? 'İade Onayı' : 'Return Confirmation'}
        onClose={() => {
          setIsReturnConfirmModalOpen(false);
          setReturningConfirmAppId(null);
          setReturningConfirmNotes('');
        }}
        onConfirm={handleReturnConfirmSubmit}
        confirmText={lang === 'tr' ? 'Evet, İade Et' : 'Yes, Return'}
        confirmType="danger"
        cancelText={lang === 'tr' ? 'İptal' : 'Cancel'}
      >
        <p>{lang === 'tr' ? 'Bu başvuruyu belirtilen gerekçe ile adaya iade etmek istediğinize emin misiniz?' : 'Are you sure you want to return this application to the applicant with the specified reason?'}</p>
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong>{lang === 'tr' ? 'İade Gerekçesi:' : 'Return Reason:'}</strong> {returningConfirmNotes}
        </div>
      </Modal>

      {/* Publish Rankings Confirmation Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        title={lang === 'tr' ? 'Sonuçları İlan Etme Onayı' : 'Publish Results Confirmation'}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handlePublishRankings}
        confirmText={lang === 'tr' ? 'Evet, İlan Et' : 'Yes, Publish'}
        confirmType="primary"
        cancelText={lang === 'tr' ? 'İptal' : 'Cancel'}
      >
        <p>{lang === 'tr' ? 'Tüm başvuru sonuçlarını ilan etmek istediğinize emin misiniz? Bu işlem sonucunda asil ve yedek sıralamalar adayların ekranlarında görünecektir.' : 'Are you sure you want to publish all application results? As a result of this action, the main and substitute rankings will be visible on the candidates\' screens.'}</p>
      </Modal>
    </div>
  );
}
