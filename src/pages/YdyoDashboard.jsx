import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENT_SLOTS, translateProgram } from '../data/seedData';
import { FileText, Eye, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';
import { getDocumentUrl } from '../utils/documentUrl';

export default function YdyoDashboard() {
  const { applications, setPrepStatusAndForward, lang } = useApp();
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
          <h2 className="page-title">{lang === 'tr' ? 'Yabancı Diller Yüksekokulu (YDYO)' : 'School of Foreign Languages (YDYO)'}</h2>
          <p className="page-description">{lang === 'tr' ? 'Aday öğrencilerin İngilizce yeterlilik belgelerini kontrol edin ve hazırlık durumunu onaylayın.' : 'Check applicant students\' English proficiency documents and approve prep school status.'}</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <span className="card-title">{lang === 'tr' ? 'Bekleyen Kontrol' : 'Pending Control'}</span>
          <span className="card-value">{applications.filter(a => a.status === 'forwarded_to_ydyo').length}</span>
          <span className="card-subtitle">{lang === 'tr' ? 'İngilizce muafiyet bekleyenler' : 'Those waiting for English exemption'}</span>
        </div>
        <div className="card">
          <span className="card-title">{lang === 'tr' ? 'Tamamlanan' : 'Completed'}</span>
          <span className="card-value">
            {applications.filter(a => a.prepSchoolStatus !== null).length}
          </span>
          <span className="card-subtitle">{lang === 'tr' ? 'İngilizce muafiyeti biten toplam aday' : 'Total applicants with completed English exemption'}</span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3 className="table-title">{lang === 'tr' ? 'İngilizce Muafiyet Kontrol Listesi' : 'English Exemption Checklist'}</h3>
          <div className="table-actions">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="table-search" 
              placeholder={lang === 'tr' ? 'Öğrenci veya Üni Ara...' : 'Search Student or Uni...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="ubys-table">
          <thead>
            <tr>
              <th>{lang === 'tr' ? 'Aday Öğrenci' : 'Applicant Student'}</th>
              <th>{lang === 'tr' ? 'Geçiş Yapılacak Program' : 'Target Program'}</th>
              <th>{lang === 'tr' ? 'Önceki Okulu' : 'Previous School'}</th>
              <th>{lang === 'tr' ? 'İngilizce Muafiyet Belgesi' : 'English Exemption Certificate'}</th>
              <th>{lang === 'tr' ? 'Hazırlık Muafiyet Kararı' : 'Prep Exemption Decision'}</th>
              <th>{lang === 'tr' ? 'İşlemler' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {ydyoApps.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {lang === 'tr' ? 'YDYO onay aşamasında bekleyen öğrenci bulunmamaktadır.' : 'There are no students waiting for YDYO approval.'}
                </td>
              </tr>
            ) : (
              ydyoApps.map((app) => {
                const doc = app.documents.find(d => d.slot === 4); // Slot 4 is English Certificate
                const currentSelection = prepStatuses[app.id] || 'eligible';

                return (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.fullName}</td>
                    <td>{translateProgram(app.targetProgram, lang)}</td>
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
                          {lang === 'tr' ? 'Yüklenmedi' : 'Not Uploaded'}
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
                        <option value="eligible">{lang === 'tr' ? 'Hazırlıktan Muaf' : 'Eligible'}</option>
                        <option value="needs_test">{lang === 'tr' ? 'Düzey Belirleme Sınavı' : 'Needs Test'}</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                        onClick={() => handleForward(app.id)}
                      >
                        {lang === 'tr' ? (
                          currentSelection === 'eligible' ? 'Hazırlıktan Muaf Olarak Sevk Et' : 'Sınava Girecek Olarak Sevk Et'
                        ) : (
                          currentSelection === 'eligible' ? 'English Eligible - Forward to Dean' : 'Needs Internal Test Forward to Dean'
                        )} <ArrowRight size={12} />
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
        title={viewingDoc ? `${viewingDoc.applicantName} - ${lang === 'tr' ? 'İngilizce Muafiyet Belgesi' : 'English Exemption Certificate'}` : ''}
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
    </div>
  );
}
