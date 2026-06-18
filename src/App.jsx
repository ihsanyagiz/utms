import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Navbar';
import Toast from './components/Toast';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import ApplicantDashboard from './pages/ApplicantDashboard';
import OidbDashboard from './pages/OidbDashboard';
import YdyoDashboard from './pages/YdyoDashboard';
import DeanDashboard from './pages/DeanDashboard';
import YgkDashboard from './pages/YgkDashboard';
import AdminDashboard from './pages/AdminDashboard';

function MainAppLayout() {
  const { currentUser, toast, showToast } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [viewMode, setViewMode] = useState('landing');
  const [authMode, setAuthMode] = useState('login');

  // Handle Tab Default Selection on Role Change
  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'applicant':
          setActiveTab('applicant_status');
          break;
        case 'oidb':
          setActiveTab('oidb_check');
          break;
        case 'ydyo':
          setActiveTab('ydyo_check');
          break;
        case 'dean':
          setActiveTab('dean_check');
          break;
        case 'ygk':
          setActiveTab('ygk_check');
          break;
        case 'admin':
          setActiveTab('admin_users');
          break;
        default:
          setActiveTab('');
      }
    } else {
      setActiveTab('');
    }
  }, [currentUser]);

  if (!currentUser) {
    if (viewMode === 'landing') {
      return (
        <>
          <LandingPage 
            onEnterLogin={() => { setViewMode('auth'); setAuthMode('login'); }}
            onEnterRegister={() => { setViewMode('auth'); setAuthMode('register'); }}
          />
          {toast && <Toast toast={toast} onClose={() => {}} />}
        </>
      );
    }
    return (
      <>
        <Login 
          initialMode={authMode}
          onBackToLanding={() => setViewMode('landing')}
        />
        {toast && <Toast toast={toast} onClose={() => {}} />}
      </>
    );
  }

  const renderActiveDashboard = () => {
    switch (currentUser.role) {
      case 'applicant':
        return <ApplicantDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'oidb':
        return <OidbDashboard activeTab={activeTab} />;
      case 'ydyo':
        return <YdyoDashboard />;
      case 'dean':
        return <DeanDashboard />;
      case 'ygk':
        return <YgkDashboard />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;
      default:
        return <div className="content-body">Yetkiniz bulunmayan bir rol.</div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      <div className="main-wrapper">
        <Header 
          isSidebarCollapsed={isSidebarCollapsed} 
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        
        {renderActiveDashboard()}
      </div>

      {toast && <Toast toast={toast} onClose={() => {}} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}
