import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, LogOut, GraduationCap, Calendar, Globe } from 'lucide-react';

export default function Header({ isSidebarCollapsed, toggleSidebar }) {
  const { currentUser, logout, config, switchDemoUser, lang, toggleLanguage } = useApp();

  if (!currentUser) return null;

  const handleQuickSwitch = (e) => {
    const role = e.target.value;
    if (role === 'applicant') switchDemoUser('emre.yildiz@test', 'applicant');
    else if (role === 'oidb') switchDemoUser('oidb@test', 'oidb');
    else if (role === 'ydyo') switchDemoUser('ydyo@test', 'ydyo');
    else if (role === 'dean') switchDemoUser('dean@test', 'dean');
    else if (role === 'ygk') switchDemoUser('ygk.ceng@test', 'ygk');
    else if (role === 'admin') switchDemoUser('admin@admin', 'admin');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <span className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap className="icon" size={24} style={{ color: 'var(--primary-color)' }} />
          <span>{lang === 'tr' ? 'Yatay Geçiş Başvuru Sistemi (UTMS)' : 'Horizontal Transfer Application System (UTMS)'}</span>
        </span>
      </div>

      <div className="header-right">
        {/* Usability Boost: Quick Demo Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(162, 27, 36, 0.2)', borderRadius: '6px', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(162, 27, 36, 0.04)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>{lang === 'tr' ? 'Hızlı Rol:' : 'Quick Role:'}</span>
          <select 
            value={currentUser.role} 
            onChange={handleQuickSwitch}
            style={{ border: 'none', background: 'none', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="applicant">{lang === 'tr' ? 'Aday (Emre)' : 'Applicant (Emre)'}</option>
            <option value="oidb">{lang === 'tr' ? 'ÖİDB Memuru' : 'OIDB Officer'}</option>
            <option value="ydyo">{lang === 'tr' ? 'YDYO Sorumlusu' : 'YDYO Officer'}</option>
            <option value="dean">{lang === 'tr' ? 'Dekanlık' : 'Deanery'}</option>
            <option value="ygk">{lang === 'tr' ? 'YGK Komisyonu' : 'YGK Committee'}</option>
            <option value="admin">{lang === 'tr' ? 'Yönetici' : 'System Admin'}</option>
          </select>
        </div>

        {/* Language Switcher */}
        <button 
          onClick={toggleLanguage}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid rgba(162, 27, 36, 0.2)', borderRadius: '6px', padding: '0.15rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', backgroundColor: 'rgba(162, 27, 36, 0.04)' }}
        >
          <Globe size={12} style={{ color: 'var(--primary-color)' }} /> {lang === 'tr' ? 'English' : 'Türkçe'}
        </button>

        <span className="semester-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Calendar size={14} />
          {config.semester}
        </span>
        
        <div className="user-profile">
          <div className="user-avatar">
            {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser.fullName}</span>
            <span className="user-role">{currentUser.role === 'ygk' ? (lang === 'tr' ? 'Komisyon Üyesi' : 'Committee Member') : currentUser.role}</span>
          </div>
        </div>

        <button className="btn-logout" onClick={logout}>
          <LogOut size={16} />
          <span>{lang === 'tr' ? 'Çıkış' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
