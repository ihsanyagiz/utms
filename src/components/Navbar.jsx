import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, LogOut, GraduationCap, Calendar, Globe } from 'lucide-react';

export default function Header({ isSidebarCollapsed, toggleSidebar }) {
  const { currentUser, logout, config, lang, toggleLanguage } = useApp();

  if (!currentUser) return null;

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <span className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap className="icon" size={24} style={{ color: 'var(--primary-color)' }} />
          <span>{lang === 'tr' ? 'Yatay Geçiş Başvuru Sistemi (UTMS)' : 'Undergraduate Transfer Management System (UTMS)'}</span>
        </span>
      </div>

      <div className="header-right">


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
