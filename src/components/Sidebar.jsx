import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, ListOrdered, CheckSquare, Layers, FileSpreadsheet, 
  Users, Settings, Database, ShieldAlert, BookOpen
} from 'lucide-react';

import IyteLogoUrl from './iyte-logo.svg';

export default function Sidebar({ isCollapsed, activeTab, setActiveTab }) {
  const { currentUser, lang } = useApp();

  if (!currentUser) return null;

  const getMenuItems = () => {
    const isTr = lang === 'tr';
    switch (currentUser.role) {
      case 'applicant':
        return [
          { id: 'applicant_status', label: isTr ? 'Başvuru Durumu' : 'Application Status', icon: <Layers size={18} /> },
          { id: 'applicant_submit', label: isTr ? 'Belge Yükleme / Güncelleme' : 'Document Upload / Update', icon: <FileText size={18} /> }
        ];
      case 'oidb':
        return [
          { id: 'oidb_check', label: isTr ? 'Belge Kontrol Paneli' : 'Check Documents', icon: <CheckSquare size={18} /> },
          { id: 'oidb_rankings', label: isTr ? 'Sıralama ve Kontenjan (Asil/Yedek)' : 'Create Ranking Table', icon: <ListOrdered size={18} /> }
        ];
      case 'ydyo':
        return [
          { id: 'ydyo_check', label: isTr ? 'Hazırlık Durumu Girişi' : 'Set Prep School Status', icon: <BookOpen size={18} /> }
        ];
      case 'dean':
        return [
          { id: 'dean_check', label: isTr ? 'Fakülte Değerlendirme' : 'Receive & Forward Applications', icon: <Layers size={18} /> }
        ];
      case 'ygk':
        return [
          { id: 'ygk_check', label: isTr ? 'İntibak Tabloları' : 'Check Applicants', icon: <FileSpreadsheet size={18} /> }
        ];
      case 'admin':
        return [
          { id: 'admin_users', label: isTr ? 'Kullanıcı Yönetimi' : 'User Management', icon: <Users size={18} /> },
          { id: 'admin_config', label: isTr ? 'Sistem Ayarları' : 'System Config', icon: <Settings size={18} /> },
          { id: 'admin_database', label: isTr ? 'Veritabanı ve Yedekleme' : 'Database & Backup', icon: <Database size={18} /> }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!isCollapsed ? (
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={IyteLogoUrl} alt="İYTE" style={{ width: '28px', height: '28px' }} />
            <span>İYTE<span>UBYS</span></span>
          </div>
        ) : (
          <div className="sidebar-logo-abbr" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={IyteLogoUrl} alt="İYTE" style={{ width: '24px', height: '24px' }} />
          </div>
        )}
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id} className="sidebar-menu-item">
            <a 
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        © 2026 İYTE Bilgi İşlem
      </div>
    </aside>
  );
}
