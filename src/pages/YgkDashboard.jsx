import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRICULA, PROGRAM_DEPARTMENT_MAP, translateProgram } from '../data/seedData';
import { 
  FileText, Check, Plus, Trash2, ArrowRight, Save, Play,
  CheckCircle, PlusCircle, Layout, ArrowLeftRight, FileSpreadsheet
} from 'lucide-react';
import Modal from '../components/Modal';
import { getDocumentUrl } from '../utils/documentUrl';

export default function YgkDashboard() {
  const { 
    applications, 
    getIntibakTable, 
    currentUser, 
    saveIntibakTable, 
    approveAndSendToOidb,
    lang
  } = useApp();

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [subTab, setSubTab] = useState('list'); // 'list' | 'editor'
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  
  // Custom courses inside the active intibak editor
  const [editorCourses, setEditorCourses] = useState([]);
  
  // Single new course mapping row inputs
  const [newCourse, setNewCourse] = useState({
    sourceCode: '',
    sourceName: '',
    sourceCredits: '3',
    sourceAkts: '5',
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
  const handleOpenEditor = async (appId) => {
    setSelectedAppId(appId);
    setSubTab('editor');
    const existingTable = await getIntibakTable(appId);
    
    if (existingTable && existingTable.courses) {
      setEditorCourses(existingTable.courses);
    } else {
      setEditorCourses([]);
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
    if (!newCourse.sourceAkts) {
      document.getElementById('sourceAktsInput')?.focus();
      return;
    }
 
    const targetCourseObj = activeCurriculum.find(c => c.code === newCourse.targetCode);
    const newId = editorCourses.length > 0 ? Math.max(...editorCourses.map(c => c.id)) + 1 : 1;
 
    const mapping = {
      id: newId,
      sourceCode: newCourse.sourceCode,
      sourceName: newCourse.sourceName,
      sourceCredits: newCourse.sourceCredits,
      sourceAkts: newCourse.sourceAkts,
      sourceGrade: newCourse.sourceGrade,
      targetCode: newCourse.targetCode,
      targetName: targetCourseObj ? targetCourseObj.name : '',
      targetCredits: targetCourseObj ? targetCourseObj.credits : '',
      targetAkts: targetCourseObj ? targetCourseObj.akts : '',
      status: newCourse.status
    };
 
    setEditorCourses(prev => [...prev, mapping]);
    
    // Clear inputs
    setNewCourse({
      sourceCode: '',
      sourceName: '',
      sourceCredits: '3',
      sourceAkts: '5',
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

  const handleApproveClick = () => {
    setIsApproveConfirmOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedAppId) {
      // Auto save first
      saveIntibakTable(selectedAppId, editorCourses);
      // Approve
      approveAndSendToOidb(selectedAppId);
      // Exit editor
      setSelectedAppId(null);
      setSubTab('list');
      setIsApproveConfirmOpen(false);
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
          {lang === 'tr' ? 'Aday Listesi' : 'Applicants List'}
        </button>
        <button 
          className={`btn btn-sm ${subTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('editor')}
        >
          {lang === 'tr' ? 'İntibak Editörü' : 'Intibak Editor'}
        </button>
      </div>

      {subTab === 'list' ? (
        <div>
          <div className="page-header">
            <div>
          <h2 className="page-title">{lang === 'tr' ? 'Yatay Geçiş Komisyonu (YGK)' : 'Horizontal Transfer Committee (YGK)'}</h2>
          <p className="page-description">
            {lang === 'tr'
              ? 'Bölümünüze yatay geçiş yapacak adayların intibak ders muafiyet tablosunu hazırlayın ve onaylayın.'
              : 'Prepare and approve the course equivalency exemption table for candidates transferring to your department.'}
          </p>
            </div>
          </div>

          <div className="card-grid">
            <div className="card">
              <span className="card-title">{lang === 'tr' ? 'İntibak Bekleyen' : 'Pending Equivalency'}</span>
              <span className="card-value">{ygkApps.length}</span>
              <span className="card-subtitle">{lang === 'tr' ? 'Değerlendirme sırasındaki bölüm başvuruları' : 'Department applications under evaluation'}</span>
            </div>
            <div className="card">
              <span className="card-title">{lang === 'tr' ? 'Tamamlanan İntibaklar' : 'Completed Equivalencies'}</span>
              <span className="card-value">
                {applications.filter(a => a.status === 'intibak_complete' && PROGRAM_DEPARTMENT_MAP[a.targetProgram] === ygkDept).length}
              </span>
              <span className="card-subtitle">{lang === 'tr' ? 'Sıralama aşamasına gönderilenler' : 'Sent to the ranking phase'}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header-bar">
              <h3 className="table-title">{lang === 'tr' ? 'İntibak Onay Bekleyen Adaylar' : 'Applicants Pending Equivalency Approval'}</h3>
            </div>

            <table className="ubys-table">
              <thead>
                <tr>
                  <th>{lang === 'tr' ? 'Aday Öğrenci' : 'Applicant Student'}</th>
                  <th>{lang === 'tr' ? 'Geleceği Üniversite' : 'Source University'}</th>
                  <th>{lang === 'tr' ? 'Hedef Program' : 'Target Program'}</th>
                  <th>{lang === 'tr' ? 'Giriş GPA' : 'Entry GPA'}</th>
                  <th>{lang === 'tr' ? 'ÖSYM Puanı' : 'OSYM Score'}</th>
                  <th>{lang === 'tr' ? 'Ders Muafiyet Tablosu' : 'Course Exemption Table'}</th>
                </tr>
              </thead>
              <tbody>
                {ygkApps.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {lang === 'tr' ? 'İntibak aşamasında bekleyen öğrenci bulunmamaktadır.' : 'There are no students pending equivalency evaluation.'}
                    </td>
                  </tr>
                ) : (
                  ygkApps.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.fullName}</td>
                      <td>{app.sourceUniversity}</td>
                      <td>{translateProgram(app.targetProgram, lang)}</td>
                      <td>{app.currentGpa} / 4.00</td>
                      <td>{app.osymPoints}</td>
                      <td>
                        {app.status === 'intibak_complete' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={14} /> {lang === 'tr' ? 'İntibak Tamamlandı ✓' : 'Intibak Complete ✓'}
                          </span>
                        ) : (
                          <button 
                            id="openIntibakTableBtn"
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => handleOpenEditor(app.id)}
                          >
                            <FileSpreadsheet size={12} /> {lang === 'tr' ? 'Tabloyu Düzenle' : 'Open intibak table'}
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
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>{lang === 'tr' ? 'Aday seçilmedi' : 'No applicant selected'}</h3>
              <p style={{ fontSize: '0.85rem' }}>{lang === 'tr' ? 'Lütfen intibak değerlendirmesi yapmak için öncelikle Aday Listesi sekmesinden bir öğrenci seçiniz.' : 'Please select a student from the Applicants List tab first to perform equivalency evaluation.'}</p>
            </div>
          ) : (
            <div>
              {/* Back link */}
              <div style={{ marginBottom: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedAppId(null); setSubTab('list'); }}>
                  {lang === 'tr' ? '← Geri Dön' : '← Go Back'}
                </button>
              </div>

          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h2 className="page-title">{activeApp.fullName} - {lang === 'tr' ? 'İntibak Tablosu Hazırlama' : 'Course Equivalency Table Preparation'}</h2>
              <p className="page-description">
                {lang === 'tr'
                  ? 'Adayın transkript derslerini İYTE müfredat dersleriyle eşleştirerek muafiyet kararlarını giriniz.'
                  : 'Enter exemption decisions by matching the candidate transcript courses with the IZTECH curriculum courses.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary" 
                id="openTranscriptBtn"
                onClick={() => {
                  const doc = activeApp.documents?.find(d => d.slot === 2);
                  const path = doc ? getDocumentUrl(doc.filePath) : '/uploads/not_dokumu.pdf';
                  window.open(path, '_blank');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
              >
                <FileText size={16} /> {lang === 'tr' ? 'Transkripti Aç' : 'Open Transcript'}
              </button>
              <button className="btn btn-secondary" onClick={handleSaveTable}>
                <Save size={16} /> {lang === 'tr' ? 'Taslağı Kaydet' : 'Save Draft'}
              </button>
              <button className="btn btn-success" id="sendToOidbBtn" onClick={handleApproveClick}>
                <CheckCircle size={16} /> {lang === 'tr' ? 'ÖİDB\'ye Gönder' : 'Send to OIDB'}
              </button>
            </div>
          </div>

          {/* Split Screen View */}
          <div className="split-view">
            
            {/* Left Pane: Student transcript details & Curriculum check */}
            <div className="split-pane" style={{ flex: 0.7 }}>
              <div className="card" style={{ height: '100%', minHeight: '450px' }}>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                  {lang === 'tr' ? 'Aday Akademik Belgeleri ve Bilgileri' : 'Candidate Academic Documents & Info'}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Mevcut Üniversite:' : 'Current University:'}</span>
                    <strong>{activeApp.sourceUniversity}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Hedef Program:' : 'Target Program:'}</span>
                    <strong>{translateProgram(activeApp.targetProgram, lang)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'Kayıtlılık GPA:' : 'Current GPA:'}</span>
                    <strong>{activeApp.currentGpa} / 4.00</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>{lang === 'tr' ? 'YKS Giriş Puanı:' : 'YKS Entrance Score:'}</span>
                    <strong>{activeApp.osymPoints}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>{lang === 'tr' ? 'Öğrenci Transkript PDF Belgesi' : 'Student Transcript PDF Document'}</h4>
                  <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <strong>{activeApp.documents?.find(d => d.slot === 2)?.filename || 'not_dokumu.pdf'}</strong>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => {
                        const doc = activeApp.documents?.find(d => d.slot === 2);
                        if (doc) {
                          window.open(getDocumentUrl(doc.filePath), '_blank');
                        } else {
                          alert(lang === 'tr' ? 'Yüklenmiş transkript belgesi bulunamadı.' : 'No uploaded transcript document found.');
                        }
                      }}
                    >
                      {lang === 'tr' ? 'İncele' : 'Review'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane: Intibak Equivalence Editor */}
            <div className="split-pane" style={{ flex: 1.8 }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                  {lang === 'tr' ? 'Ders Eşleştirme ve İntibak Editörü' : 'Course Matching & Equivalency Editor'}
                </h3>

                {/* Add equivalence form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                  {/* Source Course Section */}
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#475569', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {lang === 'tr' ? '1. Eski Üniversite Dersi (Kaynak)' : '1. Old University Course (Source)'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        id="sourceCodeInput"
                        className="form-control" 
                        placeholder={lang === 'tr' ? 'Ders Kodu (Örn: MATH101)' : 'Course Code (e.g. MATH101)'} 
                        value={newCourse.sourceCode}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, sourceCode: e.target.value }))}
                      />
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
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        id="sourceNameInput"
                        className="form-control" 
                        placeholder={lang === 'tr' ? 'Ders Adı (Örn: Calculus I)' : 'Course Name (e.g. Calculus I)'} 
                        value={newCourse.sourceName}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, sourceName: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <span className="form-label" style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{lang === 'tr' ? 'Kredi:' : 'Credit:'}</span>
                        <input 
                          type="number" 
                          id="sourceCreditsInput"
                          className="form-control" 
                          style={{ padding: '0.2rem 0.4rem' }}
                          value={newCourse.sourceCredits}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, sourceCredits: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <span className="form-label" style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{lang === 'tr' ? 'AKTS:' : 'ECTS:'}</span>
                        <input 
                          type="number" 
                          id="sourceAktsInput"
                          className="form-control" 
                          style={{ padding: '0.2rem 0.4rem' }}
                          value={newCourse.sourceAkts}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, sourceAkts: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Course Section */}
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(162, 27, 36, 0.03)', border: '1px solid rgba(162, 27, 36, 0.1)', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#a21b24', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {lang === 'tr' ? '2. İYTE Karşılığı (Eşdeğer)' : '2. IZTECH Equivalent (Exempted)'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <select 
                          className="form-control"
                          style={{ flexGrow: 1 }}
                          value={newCourse.targetCode}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, targetCode: e.target.value }))}
                        >
                          {activeCurriculum.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.name} ({lang === 'tr' ? `${c.credits} Kredi, ${c.akts} AKTS` : `${c.credits} Credit, ${c.akts} ECTS`})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                        onClick={() => setIsCurriculumModalOpen(true)}
                        id="addFromCurriculumBtn"
                      >
                        {lang === 'tr' ? 'Müfredattan Seç' : 'Select from Curriculum'}
                      </button>

                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#a21b24', borderColor: '#a21b24', fontSize: '0.75rem' }}
                        onClick={handleAddCourseMapping}
                      >
                        <Plus size={14} /> {lang === 'tr' ? 'Eşleştir' : 'Match'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mappings Table */}
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>{lang === 'tr' ? 'Eşleştirilen Dersler (İntibak Tablosu)' : 'Matched Courses (Equivalency Table)'}</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ubys-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        {/* Old University Course Group */}
                        <th style={{ backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1', textAlign: 'center' }} colSpan="4">
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569', fontWeight: 700 }}>
                            {lang === 'tr' ? 'ESKİ ÜNİVERSİTE DERSİ (KAYNAK)' : 'OLD UNIVERSITY COURSE (SOURCE)'}
                          </span>
                        </th>
                        <th style={{ backgroundColor: '#ffffff', width: '30px' }}></th>
                        {/* IZTECH Equivalent Group */}
                        <th style={{ backgroundColor: 'rgba(162, 27, 36, 0.08)', color: '#991b1b', textAlign: 'center' }} colSpan="3">
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                            {lang === 'tr' ? 'İYTE KARŞILIĞI (EŞDEĞER)' : 'IZTECH EQUIVALENT (EXEMPTED)'}
                          </span>
                        </th>
                        <th style={{ textAlign: 'center' }}>{lang === 'tr' ? 'Durum' : 'Status'}</th>
                        <th style={{ textAlign: 'center' }}>{lang === 'tr' ? 'Aksiyon' : 'Action'}</th>
                      </tr>
                      <tr>
                        <th style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>{lang === 'tr' ? 'Ders Kodu & Adı' : 'Course Code & Name'}</th>
                        <th style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', width: '50px', textAlign: 'center' }}>{lang === 'tr' ? 'Kredi' : 'Credit'}</th>
                        <th style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', width: '50px', textAlign: 'center' }}>{lang === 'tr' ? 'AKTS' : 'ECTS'}</th>
                        <th style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', width: '50px', textAlign: 'center' }}>{lang === 'tr' ? 'Not' : 'Grade'}</th>
                        <th style={{ width: '30px', textAlign: 'center' }}></th>
                        <th style={{ backgroundColor: 'rgba(162, 27, 36, 0.03)', color: '#991b1b' }}>{lang === 'tr' ? 'Ders Kodu & Adı' : 'Course Code & Name'}</th>
                        <th style={{ backgroundColor: 'rgba(162, 27, 36, 0.03)', color: '#991b1b', width: '50px', textAlign: 'center' }}>{lang === 'tr' ? 'Kredi' : 'Credit'}</th>
                        <th style={{ backgroundColor: 'rgba(162, 27, 36, 0.03)', color: '#991b1b', width: '50px', textAlign: 'center' }}>{lang === 'tr' ? 'AKTS' : 'ECTS'}</th>
                        <th style={{ textAlign: 'center' }}>{lang === 'tr' ? 'Durum' : 'Status'}</th>
                        <th style={{ textAlign: 'center' }}>{lang === 'tr' ? 'Aksiyon' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editorCourses.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            {lang === 'tr' ? 'Henüz ders eşleştirmesi eklenmemiştir.' : 'No course matching added yet.'}
                          </td>
                        </tr>
                      ) : (
                        editorCourses.map((c) => (
                          <tr key={c.id}>
                            <td style={{ borderRight: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.sourceCode}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{c.sourceName}</div>
                            </td>
                            <td style={{ fontWeight: 600, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{c.sourceCredits}</td>
                            <td style={{ fontWeight: 600, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{c.sourceAkts || '—'}</td>
                            <td style={{ fontWeight: 600, textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>{c.sourceGrade}</td>
                            <td style={{ textAlign: 'center' }}><ArrowLeftRight size={14} style={{ color: '#94a3b8' }} /></td>
                            <td style={{ backgroundColor: 'rgba(162, 27, 36, 0.01)' }}>
                              <div style={{ fontWeight: 600, color: '#a21b24' }}>{c.targetCode}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{c.targetName}</div>
                            </td>
                            <td style={{ fontWeight: 600, textAlign: 'center', backgroundColor: 'rgba(162, 27, 36, 0.01)' }}>{c.targetCredits || '—'}</td>
                            <td style={{ fontWeight: 600, textAlign: 'center', backgroundColor: 'rgba(162, 27, 36, 0.01)' }}>{c.targetAkts || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.75rem' }}>{lang === 'tr' ? 'KABUL' : 'ACCEPTED'}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
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
        title={lang === 'tr' ? 'Müfredattan Ders Seç' : 'Add from Curriculum'}
        onClose={() => setIsCurriculumModalOpen(false)}
      >
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="ubys-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>{lang === 'tr' ? 'Ders Kodu' : 'Course Code'}</th>
                <th>{lang === 'tr' ? 'Ders Adı' : 'Course Name'}</th>
                <th>{lang === 'tr' ? 'Kredi' : 'Credit'}</th>
                <th>{lang === 'tr' ? 'AKTS' : 'ECTS'}</th>
                <th>{lang === 'tr' ? 'Aksiyon' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {activeCurriculum.map((course) => (
                <tr key={course.code}>
                  <td style={{ fontWeight: 600 }}>{course.code}</td>
                  <td>{course.name}</td>
                  <td style={{ fontWeight: 600 }}>{course.credits}</td>
                  <td style={{ fontWeight: 600 }}>{course.akts}</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setNewCourse(prev => ({ ...prev, targetCode: course.code }));
                        setIsCurriculumModalOpen(false);
                      }}
                      id="selectFromCurriculumBtn"
                    >
                      {lang === 'tr' ? 'Dersi Seç' : 'add from curriculum'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Approve and Send to OIDB Confirmation Modal */}
      <Modal
        isOpen={isApproveConfirmOpen}
        title={lang === 'tr' ? 'Nihai Onay ve ÖİDB\'ye Gönderme' : 'Final Approval and Send to OIDB'}
        onClose={() => setIsApproveConfirmOpen(false)}
        onConfirm={handleApproveConfirm}
        confirmText={lang === 'tr' ? 'Evet, Onayla ve Gönder' : 'Yes, Approve & Send'}
        confirmType="success"
        cancelText={lang === 'tr' ? 'İptal' : 'Cancel'}
      >
        <p>
          {lang === 'tr'
            ? 'Bu intibak tablosunu nihai olarak onaylayıp sonuçları işlenmek üzere Öğrenci İşleri Daire Başkanlığı\'na (ÖİDB) göndermek istediğinize emin misiniz?'
            : 'Are you sure you want to finally approve this equivalency table and send it to the Student Affairs Department (OIDB) for processing?'}
        </p>
        <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--color-success)' }}>
          {lang === 'tr' ? 'Bu işlem sonucunda adayın intibak değerlendirmesi tamamlanmış olacaktır.' : 'As a result of this action, the candidate\'s equivalency evaluation will be completed.'}
        </p>
      </Modal>
    </div>
  );
}
