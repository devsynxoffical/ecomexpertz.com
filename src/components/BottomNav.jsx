import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Headphones } from 'lucide-react';

export default function BottomNav() {
  const { dashboardTab, setDashboardTab, setCurrentView, currentView } = useApp();

  const handleTabClick = (tabKey) => {
    if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
    setDashboardTab(tabKey);
    // Smooth scroll to top when changing tab
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="bottom-nav-bar" aria-label="Bottom Navigation Menu">
      <button
        type="button"
        id="bottom-nav-home"
        className={`nav-tab-btn ${currentView === 'dashboard' && dashboardTab === 'home' ? 'active' : ''}`}
        onClick={() => handleTabClick('home')}
      >
        <div className="nav-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="nav-tab-label">Home</span>
        {currentView === 'dashboard' && dashboardTab === 'home' && <span className="nav-tab-active-dot"></span>}
      </button>

      <button
        type="button"
        id="bottom-nav-menu"
        className={`nav-tab-btn ${currentView === 'dashboard' && dashboardTab === 'menu' ? 'active' : ''}`}
        onClick={() => handleTabClick('menu')}
      >
        <div className="nav-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1.5" />
            <rect width="7" height="7" x="14" y="3" rx="1.5" />
            <rect width="7" height="7" x="14" y="14" rx="1.5" />
            <rect width="7" height="7" x="3" y="14" rx="1.5" />
          </svg>
        </div>
        <span className="nav-tab-label">Menu</span>
        {currentView === 'dashboard' && dashboardTab === 'menu' && <span className="nav-tab-active-dot"></span>}
      </button>

      <button
        type="button"
        id="bottom-nav-records"
        className={`nav-tab-btn ${currentView === 'dashboard' && dashboardTab === 'records' ? 'active' : ''}`}
        onClick={() => handleTabClick('records')}
      >
        <div className="nav-tab-icon">
          <FileText size={22} strokeWidth={2.2} />
        </div>
        <span className="nav-tab-label">Records</span>
        {currentView === 'dashboard' && dashboardTab === 'records' && <span className="nav-tab-active-dot"></span>}
      </button>

      <button
        type="button"
        id="bottom-nav-support"
        className={`nav-tab-btn ${currentView === 'dashboard' && dashboardTab === 'support' ? 'active' : ''}`}
        onClick={() => handleTabClick('support')}
      >
        <div className="nav-tab-icon">
          <Headphones size={22} strokeWidth={2.2} />
        </div>
        <span className="nav-tab-label">Support</span>
        {currentView === 'dashboard' && dashboardTab === 'support' && <span className="nav-tab-active-dot"></span>}
      </button>
    </nav>
  );
}
