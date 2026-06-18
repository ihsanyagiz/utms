import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, ListOrdered, CheckSquare, Layers, FileSpreadsheet, 
  Users, Settings, Database, ShieldAlert, BookOpen
} from 'lucide-react';

import IyteLogoUrl from './iyte-logo.svg';

export default function Sidebar({ isCollapsed, activeTab, setActiveTab }) {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  const getMenuItems = () => {
    switch (currentUser.role) {
      case 'applicant':
        return [
          { id: 'applicant_status', label: 'Başvuru Durumu', icon: <Layers size={18} /> },
          { id: 'applicant_submit', label: 'Belge Yükleme / Güncelleme', icon: <FileText size={18} /> }
        ];
      case 'oidb':
        return [
          { id: 'oidb_check', label: 'Belge Kontrol Paneli', icon: <CheckSquare size={18} /> },
          { id: 'oidb_rankings', label: 'Sıralama ve Kontenjan (Asil/Yedek)', icon: <ListOrdered size={18} /> }
        ];
      case 'ydyo':
        return [
          { id: 'ydyo_check', label: 'Hazırlık Durumu Girişi', icon: <BookOpen size={18} /> }
        ];
      case 'dean':
        return [
          { id: 'dean_check', label: 'Fakülte Değerlendirme', icon: <Layers size={18} /> }
        ];
      case 'ygk':
        return [
          { id: 'ygk_check', label: 'İntibak Tabloları', icon: <FileSpreadsheet size={18} /> }
        ];
      case 'admin':
        return [
          { id: 'admin_users', label: 'Kullanıcı Yönetimi', icon: <Users size={18} /> },
          { id: 'admin_config', label: 'Sistem Ayarları', icon: <Settings size={18} /> },
          { id: 'admin_database', label: 'Veritabanı ve Yedekleme', icon: <Database size={18} /> }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={IyteLogoUrl} alt="İYTE" style={{ width: '28px', height: '28px' }} />
          <span>İYTE<span>UBYS</span></span>
        </div>
        <div className="sidebar-logo-abbr" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={IyteLogoUrl} alt="İYTE" style={{ width: '24px', height: '24px' }} />
        </div>
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
