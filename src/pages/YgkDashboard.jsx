import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRICULA, PROGRAM_DEPARTMENT_MAP } from '../data/seedData';
import { 
  FileText, Check, Plus, Trash2, ArrowRight, Save, Play,
  CheckCircle, PlusCircle, Layout, ArrowLeftRight, FileSpreadsheet
} from 'lucide-react';
import Modal from '../components/Modal';

export default function YgkDashboard() {
  const { 
    applications, 
    intibakTables, 
    currentUser, 
    saveIntibakTable, 
    approveAndSendToOidb 
  } = useApp();

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [subTab, setSubTab] = useState('list'); // 'list' | 'editor'
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  
  // Custom courses inside the active intibak editor
  const [editorCourses, setEditorCourses] = useState([]);
  
  // Single new course mapping row inputs
  const [newCourse, setNewCourse] = useState({
    sourceCode: '',
    sourceName: '',
    sourceCredits: '3',
    sourceGrade: 'AA',
    targetCode: '',
    status: 'accepted'
  });

  // Filter applications for this YGK's department
  const ygkDept = currentUser.department || 'computer_engineering';
  
  const ygkApps = applications.filter(app => {
    const isYgkStatus = app.status === 'forwarded_to_ygk' || app.status === 'intibak_complete';
    const matchesDept = PROGRAM_DEPARTMENT_MAP[app.targetProgram] === ygkDept;
    return isYgkStatus && matchesDept;
  });

  const activeApp = applications.find(a => a.id === selectedAppId);
  const activeCurriculum = CURRICULA[ygkDept] || [];

  // Open editor and load existing intibak table if any
  const handleOpenEditor = (appId) => {
    setSelectedAppId(appId);
    setSubTab('editor');
    const existingTable = intibakTables.find(t => t.applicationId === appId);
    
    if (existingTable) {
      setEditorCourses(existingTable.courses);
    } else {
      // Seed some default course maps based on target program to speed up testing
      setEditorCourses([
        { id: 1, sourceCode: 'MATH101', sourceName: 'Calculus I', sourceCredits: '5', sourceGrade: 'AA', targetCode: 'MATH141', targetName: 'Calculus I', status: 'accepted' },
        { id: 2, sourceCode: 'COMP102', sourceName: 'Intro to Programming', sourceCredits: '6', sourceGrade: 'BA', targetCode: 'CENG113', targetName: 'Programming Basics', status: 'accepted' }
      ]);
    }

    // Reset new course mapping targets
    if (activeCurriculum.length > 0) {
      setNewCourse(prev => ({ ...prev, targetCode: activeCurriculum[0].code }));
    }
  };

  const handleAddCourseMapping = () => {
    if (!newCourse.sourceCode) {
      document.getElementById('sourceCodeInput')?.focus();
      return;
    }
    if (!newCourse.sourceName) {
      document.getElementById('sourceNameInput')?.focus();
      return;
    }
    if (!newCourse.sourceCredits) {
      document.getElementById('sourceCreditsInput')?.focus();
      return;
    }

    const targetCourseObj = activeCurriculum.find(c => c.code === newCourse.targetCode);
    const newId = editorCourses.length > 0 ? Math.max(...editorCourses.map(c => c.id)) + 1 : 1;

    const mapping = {
      id: newId,
      sourceCode: newCourse.sourceCode,
      sourceName: newCourse.sourceName,
      sourceCredits: newCourse.sourceCredits,
      sourceGrade: newCourse.sourceGrade,
      targetCode: newCourse.targetCode,
      targetName: targetCourseObj ? targetCourseObj.name : '',
      status: newCourse.status
    };

    setEditorCourses(prev => [...prev, mapping]);
    
    // Clear inputs
    setNewCourse({
      sourceCode: '',
      sourceName: '',
      sourceCredits: '3',
      sourceGrade: 'AA',
      targetCode: activeCurriculum[0]?.code || '',
      status: 'accepted'
    });
  };

  const handleRemoveCourseMapping = (id) => {
    setEditorCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveTable = () => {
    if (selectedAppId) {
      saveIntibakTable(selectedAppId, editorCourses);
    }
  };

  const handleApproveAndSend = () => {
    if (selectedAppId) {
      // Auto save first
      saveIntibakTable(selectedAppId, editorCourses);
      // Approve
      approveAndSendToOidb(selectedAppId);
      // Exit editor
      setSelectedAppId(null);
      setSubTab('list');
    }
  };

  return (
    <div className="content-body">
      {/* Sub-tab navigation to support YGK-Intibak-AC1 test case */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn btn-sm ${subTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setSubTab('list'); setSelectedAppId(null); }}
        >
          Aday Listesi (Applicants List)
        </button>
        <button 
          className={`btn btn-sm ${subTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('editor')}
        >
          İntibak Editörü (Intibak Editor)
        </button>
      </div>

      {subTab === 'list' ? (
        <div>
          <div className="page-header">
            <div>
              <h2 className="page-title">Yatay Geçiş Komisyonu (YGK)</h2>
              <p className="page-description">
                Bölümünüze yatay geçiş yapacak adayların intibak ders muafiyet tablosunu hazırlayın ve onaylayın.
              </p>
            </div>
          </div>

          <div className="card-grid">
            <div className="card">
              <span className="card-title">İntibak Bekleyen</span>
              <span className="card-value">{ygkApps.length}</span>
              <span className="card-subtitle">Değerlendirme sırasındaki bölüm başvuruları</span>
            </div>
            <div className="card">
              <span className="card-title">Tamamlanan İntibaklar</span>
              <span className="card-value">
                {applications.filter(a => a.status === 'intibak_complete' && PROGRAM_DEPARTMENT_MAP[a.targetProgram] === ygkDept).length}
              </span>
              <span className="card-subtitle">Sıralama aşamasına gönderilenler</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header-bar">
              <h3 className="table-title">İntibak Onay Bekleyen Adaylar</h3>
            </div>

            <table className="ubys-table">
              <thead>
                <tr>
                  <th>Aday Öğrenci</th>
                  <th>Geleceği Üniversite</th>
                  <th>Hedef Program</th>
                  <th>Giriş GPA</th>
                  <th>ÖSYM Puanı</th>
                  <th>Ders Muafiyet Tablosu</th>
                </tr>
              </thead>
              <tbody>
                {ygkApps.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      İntibak aşamasında bekleyen öğrenci bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  ygkApps.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.fullName}</td>
                      <td>{app.sourceUniversity}</td>
                      <td>{app.targetProgram}</td>
                      <td>{app.currentGpa} / 4.00</td>
                      <td>{app.osymPoints}</td>
                      <td>
                        {app.status === 'intibak_complete' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={14} /> Intibak Complete ✓
                          </span>
                        ) : (
                          <button 
                            id="openIntibakTableBtn"
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => handleOpenEditor(app.id)}
                          >
                            <FileSpreadsheet size={12} /> Open intibak table (İntibak Tablosu Düzenle)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {!activeApp ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>No applicant selected</h3>
              <p style={{ fontSize: '0.85rem' }}>Lütfen intibak değerlendirmesi yapmak için öncelikle Aday Listesi sekmesinden bir öğrenci seçiniz.</p>
            </div>
          ) : (
            <div>
              {/* Back link */}
              <div style={{ marginBottom: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedAppId(null); setSubTab('list'); }}>
                  ← Geri Dön
                </button>
              </div>

          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h2 className="page-title">{activeApp.fullName} - İntibak Tablosu Hazırlama</h2>
              <p className="page-description">
                Adayın transkript derslerini İYTE müfredat dersleriyle eşleştirerek muafiyet kararlarını giriniz.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary" 
                id="openTranscriptBtn"
                onClick={() => {
                  const doc = activeApp.documents?.find(d => d.slot === 2);
                  const path = doc ? `/${doc.filePath}` : '/uploads/not_dokumu.pdf';
                  window.open(path, '_blank');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
              >
                <FileText size={16} /> Open Transcript (Transkript Aç)
              </button>
              <button className="btn btn-secondary" onClick={handleSaveTable}>
                <Save size={16} /> Taslağı Kaydet
              </button>
              <button className="btn btn-success" id="sendToOidbBtn" onClick={handleApproveAndSend}>
                <CheckCircle size={16} /> Send to OIDB (ÖİDB'ye Gönder)
              </button>
            </div>
          </div>

          {/* Split Screen View */}
          <div className="split-view">
            
            {/* Left Pane: Student transcript details & Curriculum check */}
            <div className="split-pane">
              <div className="card" style={{ height: '100%', minHeight: '450px' }}>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                  Aday Akademik Belgeleri ve Bilgileri
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mevcut Üniversite:</span>
                    <strong>{activeApp.sourceUniversity}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Hedef Program:</span>
                    <strong>{activeApp.targetProgram}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Kayıtlılık GPA:</span>
                    <strong>{activeApp.currentGpa} / 4.00</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>YKS Giriş Puanı:</span>
                    <strong>{activeApp.osymPoints}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Öğrenci Transkript PDF Belgesi</h4>
                  <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <strong>not_dokumu.pdf</strong> (2.4 MB)
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => alert('PDF Görüntüleme simüle ediliyor.')}>İncele</button>
                  </div>
                  
                  {/* Simulated transcript courses list */}
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Transkript Ders Özetleri (Simüle):</h5>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <table className="ubys-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>Kod</th>
                            <th>Ders Adı</th>
                            <th>Kredi</th>
                            <th>Harf Notu</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>MATH101</td><td>Calculus I</td><td>5 ECTS</td><td>AA</td></tr>
                          <tr><td>PHYS101</td><td>General Physics I</td><td>6 ECTS</td><td>BA</td></tr>
                          <tr><td>COMP102</td><td>Programming Basics</td><td>6 ECTS</td><td>BA</td></tr>
                          <tr><td>ENG101</td><td>English I</td><td>3 ECTS</td><td>CB</td></tr>
                          <tr><td>HIST101</td><td>Ataturk Principles I</td><td>2 ECTS</td><td>AA</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane: Intibak Equivalence Editor */}
            <div className="split-pane" style={{ flex: 1.3 }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                  Ders Eşleştirme ve İntibak Editörü
                </h3>

                {/* Add equivalence form */}
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f8fafc', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>Yeni Eşdeğerlik Ekle</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input 
                        type="text" 
                        id="sourceCodeInput"
                        className="form-control" 
                        placeholder="Kaynak Kod" 
                        value={newCourse.sourceCode}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, sourceCode: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input 
                        type="text" 
                        id="sourceNameInput"
                        className="form-control" 
                        placeholder="Kaynak Ders Adı" 
                        value={newCourse.sourceName}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, sourceName: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <select 
                        className="form-control"
                        value={newCourse.sourceGrade}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, sourceGrade: e.target.value }))}
                      >
                        {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <span className="form-label" style={{ margin: 0 }}>Kredi (ECTS):</span>
                      <input 
                        type="number" 
                        id="sourceCreditsInput"
                        className="form-control" 
                        style={{ width: '60px' }}
                        value={newCourse.sourceCredits}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, sourceCredits: e.target.value }))}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>İYTE Karşılığı:</span>
                      <select 
                        className="form-control"
                        style={{ flexGrow: 1 }}
                        value={newCourse.targetCode}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, targetCode: e.target.value }))}
                      >
                        {activeCurriculum.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name} ({c.akts} ECTS)
                          </option>
                        ))}
                      </select>
                      
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}
                        onClick={() => setIsCurriculumModalOpen(true)}
                        id="addFromCurriculumBtn"
                      >
                        Add from curriculum (Müfredattan Ders Seç)
                      </button>

                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={handleAddCourseMapping}
                      >
                        <Plus size={14} /> Eşleştir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mappings Table */}
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Eşleştirilen Dersler (İntibak Tablosu)</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ubys-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Kaynak Ders</th>
                        <th>Kredi</th>
                        <th>Not</th>
                        <th></th>
                        <th>İYTE Karşılığı</th>
                        <th>Durum</th>
                        <th>Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editorCourses.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                            Henüz ders eşleştirmesi eklenmemiştir.
                          </td>
                        </tr>
                      ) : (
                        editorCourses.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{c.sourceCode}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.sourceName}</div>
                            </td>
                            <td>{c.sourceCredits} ECTS</td>
                            <td style={{ fontWeight: 600 }}>{c.sourceGrade}</td>
                            <td><ArrowLeftRight size={14} style={{ color: 'var(--text-muted)' }} /></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{c.targetCode}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.targetName}</div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.75rem' }}>KABUL</span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-danger btn-sm btn-icon-only"
                                onClick={() => handleRemoveCourseMapping(c.id)}
                                title="Remove course mapping"
                                style={{ fontWeight: 'bold' }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}


      {/* Curriculum selection modal (TC-FWD-08 / YGK-Intibak-Positive) */}
      <Modal
        isOpen={isCurriculumModalOpen}
        title="Müfredattan Ders Seç (Add from Curriculum)"
        onClose={() => setIsCurriculumModalOpen(false)}
      >
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="ubys-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Ders Kodu</th>
                <th>Ders Adı</th>
                <th>AKTS</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {activeCurriculum.map((course) => (
                <tr key={course.code}>
                  <td style={{ fontWeight: 600 }}>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.akts} ECTS</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setNewCourse(prev => ({ ...prev, targetCode: course.code }));
                        setIsCurriculumModalOpen(false);
                      }}
                      id="selectFromCurriculumBtn"
                    >
                      add from curriculum (Dersi Seç)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
