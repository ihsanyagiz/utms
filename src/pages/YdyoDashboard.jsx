import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS } from '../data/seedData';
import { FileText, Eye, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';

export default function YdyoDashboard() {
  const { applications, setPrepStatusAndForward } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppId, setSelectedAppId] = useState(null);
  
  // Prep status per applicant in local UI state before saving
  const [prepStatuses, setPrepStatuses] = useState({});

  // Document Viewer
  const [viewingDoc, setViewingDoc] = useState(null);

  const ydyoApps = applications.filter(app => {
    const isYdyoStatus = app.status === 'forwarded_to_ydyo';
    const matchesSearch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.sourceUniversity.toLowerCase().includes(searchQuery.toLowerCase());
    return isYdyoStatus && matchesSearch;
  });

  const handleStatusChange = (appId, val) => {
    setPrepStatuses(prev => ({ ...prev, [appId]: val }));
  };

  const handleForward = (appId) => {
    const status = prepStatuses[appId] || 'eligible'; // Default to eligible
    setPrepStatusAndForward(appId, status);
    // Remove from UI selection
    setSelectedAppId(null);
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Yabancı Diller Yüksekokulu (YDYO)</h2>
          <p className="page-description">Aday öğrencilerin İngilizce yeterlilik belgelerini kontrol edin ve hazırlık durumunu onaylayın.</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <span className="card-title">Bekleyen Kontrol</span>
          <span className="card-value">{applications.filter(a => a.status === 'forwarded_to_ydyo').length}</span>
          <span className="card-subtitle">İngilizce muafiyet bekleyenler</span>
        </div>
        <div className="card">
          <span className="card-title">Tamamlanan</span>
          <span className="card-value">
            {applications.filter(a => a.prepSchoolStatus !== null).length}
          </span>
          <span className="card-subtitle">İngilizce muafiyeti biten toplam aday</span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3 className="table-title">İngilizce Muafiyet Kontrol Listesi</h3>
          <div className="table-actions">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="table-search" 
              placeholder="Öğrenci veya Üni Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="ubys-table">
          <thead>
            <tr>
              <th>Aday Öğrenci</th>
              <th>Geçiş Yapılacak Program</th>
              <th>Önceki Okulu</th>
              <th>İngilizce Muafiyet Belgesi</th>
              <th>Hazırlık Muafiyet Kararı</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {ydyoApps.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  YDYO onay aşamasında bekleyen öğrenci bulunmamaktadır.
                </td>
              </tr>
            ) : (
              ydyoApps.map((app) => {
                const doc = app.documents.find(d => d.slot === 4); // Slot 4 is English Certificate
                const currentSelection = prepStatuses[app.id] || 'eligible';

                return (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.fullName}</td>
                    <td>{app.targetProgram}</td>
                    <td>{app.sourceUniversity}</td>
                    <td>
                      {doc ? (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => setViewingDoc({ ...doc, applicantName: app.fullName })}
                        >
                          <Eye size={12} /> {doc.filename}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                          Yüklenmedi
                        </span>
                      )}
                    </td>
                    <td>
                      <select 
                        className="form-control"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '180px' }}
                        value={currentSelection}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      >
                        <option value="eligible">Hazırlıktan Muaf (Eligible)</option>
                        <option value="needs_test">Düzey Belirleme Sınavı (Needs Test)</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleForward(app.id)}
                      >
                        Kaydet & Sevk Et <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Document View Modal */}
      <Modal
        isOpen={!!viewingDoc}
        title={viewingDoc ? `${viewingDoc.applicantName} - İngilizce Muafiyet Belgesi` : ''}
        onClose={() => setViewingDoc(null)}
      >
        {viewingDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '100%', height: '320px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ color: 'var(--primary-color)' }} />
              <strong>{viewingDoc.filename}</strong>
              <span style={{ fontSize: '0.75rem' }}>İngilizce Muafiyet PDF Belgesi ({viewingDoc.fileSize})</span>
              <p style={{ fontSize: '0.75rem', maxWidth: '300px', textAlignment: 'center', marginTop: '0.5rem' }}>
                *Simülasyon ortamıdır. Belge kontrolünü buradan onaylayabilirsiniz.*
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setViewingDoc(null)}>Kapat</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
