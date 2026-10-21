import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Search,
  Moon,
  Sun,
  Smartphone,
  Bell,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  LogOut,
  User,
  Wallet,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function Navbar() {
  const {
    user,
    isLoggedIn,
    currentView,
    setCurrentView,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    setModalType,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    records,
    setDashboardTab,
    logoutAccount,
    isAdminAuthenticated,
    adminLogout,
    setAuthMode
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ar', label: 'العربية', flag: '🇦🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <header className="navbar-root">
      {/* Top micro bar for quick portal switching - visible ONLY when operator is explicitly on /admin route */}
      {currentView === 'admin' && (
        <div className="navbar-top-announcement">
          <div className="container announcement-inner" style={{ justifyContent: 'flex-end' }}>
            <div className="portal-switcher">
              <button
                className="portal-pill"
                onClick={() => {
                  window.history.pushState(null, '', '/');
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                }}
                title="Switch to Client User View"
              >
                <LayoutDashboard size={13} />
                <span>User App</span>
              </button>
              <button
                className="portal-pill admin active"
                onClick={() => {
                  window.history.pushState(null, '', '/admin');
                  setCurrentView('admin');
                }}
              >
                <ShieldCheck size={13} />
                <span>Admin Panel</span>
                {(records || []).filter(r => r && r.status === 'Pending').length > 0 && (
                  <span className="badge-count">
                    {(records || []).filter(r => r && r.status === 'Pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Header matching screenshot */}
      <div className="navbar-main">
        <div className="container navbar-container">
          {/* Brand Logo */}
          <div
            className="brand-logo"
            onClick={() => {
              if (isLoggedIn) {
                setCurrentView('dashboard');
                setDashboardTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setCurrentView('storefront');
              }
            }}
            title={isLoggedIn ? "Dashboard Overview" : "Back to Marketplace Home"}
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-icon-wrap">
              <TrendingUp size={22} className="logo-svg" />
            </div>
            <div className="logo-text-group">
              <span className="brand-title">Ecom<span className="brand-highlight">xstocks</span></span>
              <span className="brand-subtitle">Website Traffic & Task Hub</span>
            </div>
          </div>

          {/* Search Bar matching screenshot */}
          <div className="nav-search-bar">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search website products, partner stores or task IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">Discover</button>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="nav-right-actions">
            {/* Language Selector Dropdown */}
            <div className="dropdown-container">
              <button
                className="action-icon-btn lang-btn"
                onClick={() => setShowLangMenu(!showLangMenu)}
                title="Select Language"
              >
                <span className="flag-emoji">{currentLang.flag}</span>
                <ChevronDown size={14} className="chevron-icon" />
              </button>
              {showLangMenu && (
                <div className="dropdown-panel lang-dropdown animate-slide-down">
                  {languages.map((l) => (
                    <div
                      key={l.code}
                      className={`dropdown-item ${language === l.code ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                    >
                      <span className="flag-emoji">{l.flag}</span>
                      <span>{l.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              className="action-icon-btn"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={19} className="theme-sun" /> : <Moon size={19} />}
            </button>

            {/* Android APK Download Modal Button */}
            <button
              className="action-icon-btn mobile-app-btn"
              onClick={() => setModalType('apk')}
              title="Download Android APK"
            >
              <Smartphone size={19} />
              <span className="apk-indicator">APK</span>
            </button>

            {/* Notification Bell matching Screenshot 2 */}
            <div className="dropdown-container">
              <button
                className="action-icon-btn notif-bell-btn"
                onClick={() => {
                  const nextState = !showNotifications;
                  setShowNotifications(nextState);
                  if (nextState && unreadCount > 0) {
                    markAllNotificationsAsRead && markAllNotificationsAsRead();
                  }
                }}
                title="Notifications"
                style={{
                  position: 'relative'
                }}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span
                    className="notification-dot"
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="dropdown-panel notif-dropdown animate-slide-down">
                  <div className="notif-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4>Notifications</h4>
                      <span className="notif-badge">{notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllNotifications && clearAllNotifications();
                        }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notif" style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                        <Bell size={24} style={{ margin: '0 auto 6px auto', opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isSuccess = n.type === 'success' || n.title?.includes('Approved') || n.title?.includes('Completed') || n.title?.includes('Assigned');
                        const isError = n.type === 'error' || n.title?.includes('Rejected');
                        return (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                            onClick={() => markNotificationAsRead && markNotificationAsRead(n.id)}
                            style={{
                              borderLeft: `3px solid ${isSuccess ? '#10b981' : isError ? '#ef4444' : '#3b82f6'}`,
                              cursor: 'pointer'
                            }}
                          >
                            <div className="notif-item-top">
                              <strong className="notif-title">{n.title}</strong>
                              <span className="notif-time">{n.time || 'Just now'}</span>
                            </div>
                            <p className="notif-desc">{n.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account Controls: Admin Profile vs User Profile vs Login/Register */}
            {currentView === 'admin' && isAdminAuthenticated ? (
              <div className="dropdown-container">
                <button
                  className="user-profile-nav-pill admin-badge-pill"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Master Administrator Session"
                  style={{
                    borderColor: 'rgba(37, 99, 235, 0.4)',
                    background: 'rgba(37, 99, 235, 0.08)'
                  }}
                >
                  <div className="user-avatar-circle" style={{ background: '#2563eb', color: '#fff', fontSize: '13px' }}>
                    🛡️
                  </div>
                  <div className="user-nav-meta">
                    <span className="user-nav-name" style={{ color: '#1e40af', fontWeight: 700 }}>
                      SuperAdmin
                    </span>
                    <span className="user-nav-tier" style={{ color: '#2563eb', fontWeight: 600 }}>
                      👑 Operations Admin
                    </span>
                  </div>
                  <ChevronDown size={14} className={`user-nav-chevron ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="dropdown-panel user-dropdown animate-slide-down">
                    <div className="user-info-banner">
                      <div className="user-avatar-large" style={{ background: '#2563eb', color: '#fff', fontSize: '20px' }}>
                        🛡️
                      </div>
                      <div className="user-meta">
                        <div className="user-name-row">
                          <strong>Master Administrator</strong>
                          <span className="vip-tag-small ebay">SuperAdmin</span>
                        </div>
                        <span className="user-email">{user?.email || 'admin@ecomxstocks.com'} • Operations</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        window.history.pushState(null, '', '/admin');
                        setCurrentView('admin');
                        setShowUserMenu(false);
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Admin Console</span>
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        window.history.pushState(null, '', '/');
                        setCurrentView('dashboard');
                        setShowUserMenu(false);
                      }}
                    >
                      <LayoutDashboard size={16} />
                      <span>View User Website</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div
                      className="dropdown-item logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        adminLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out Admin</span>
                    </div>
                  </div>
                )}
              </div>
            ) : isLoggedIn ? (
              <div className="dropdown-container">
                <button
                  className="user-profile-nav-pill"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Account Menu"
                >
                  <div className="user-avatar-circle">{user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}</div>
                  <div className="user-nav-meta">
                    <span className="user-nav-name">{user?.name}</span>
                    <span className={`user-nav-tier ${(user?.vipLevel || 'ebay').toLowerCase()}`}>
                      {user?.vipLevel === 'eBay' && '🔴 eBay'}
                      {user?.vipLevel === 'Walmart' && '🔵 Walmart'}
                      {user?.vipLevel === 'Temu' && '🟠 Temu'}
                      {!['eBay', 'Walmart', 'Temu'].includes(user?.vipLevel) && `⭐ ${user?.vipLevel || 'eBay'}`}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`user-nav-chevron ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="dropdown-panel user-dropdown animate-slide-down">
                    <div className="user-info-banner">
                      <div className="user-avatar-large">{user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}</div>
                      <div className="user-meta">
                        <div className="user-name-row">
                          <strong>{user?.name}</strong>
                          <span className={`vip-tag-small ${(user?.vipLevel || 'ebay').toLowerCase()}`}>
                            {user?.vipLevel === 'eBay' && '🔴 eBay'}
                            {user?.vipLevel === 'Walmart' && '🔵 Walmart'}
                            {user?.vipLevel === 'Temu' && '🟠 Temu'}
                            {!['eBay', 'Walmart', 'Temu'].includes(user?.vipLevel) && `⭐ ${user?.vipLevel || 'eBay'}`}
                          </span>
                        </div>
                        <span className="user-email">ID: #{user?.referralCode || user?.code || '505282'} • Verified Account</span>
                        <div className="user-bal-pill">
                          <Wallet size={12} />
                          <span>${(Number(user?.balance) || 0).toFixed(2)} USDT</span>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setCurrentView('dashboard');
                        setDashboardTab('home');
                        setShowUserMenu(false);
                      }}
                    >
                      <LayoutDashboard size={16} color="#2563eb" />
                      <span>Dashboard Overview</span>
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setCurrentView('dashboard');
                        setDashboardTab('mine');
                        setShowUserMenu(false);
                      }}
                    >
                      <User size={16} />
                      <span>My Profile & Team</span>
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setCurrentView('dashboard');
                        setDashboardTab('records');
                        setShowUserMenu(false);
                      }}
                    >
                      <LayoutDashboard size={16} />
                      <span>Transaction Ledger</span>
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setModalType('deposit');
                        setShowUserMenu(false);
                      }}
                    >
                      <Wallet size={16} />
                      <span>Deposit USDT</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    {(isAdminAuthenticated || user?.role === 'admin' || (user?.email && user.email.toLowerCase().includes('admin'))) && (
                      <div
                        className="dropdown-item"
                        onClick={() => {
                          window.history.pushState(null, '', '/admin');
                          setCurrentView('admin');
                          setShowUserMenu(false);
                        }}
                      >
                        <ShieldCheck size={16} color="#2563eb" />
                        <span>Admin Console</span>
                      </div>
                    )}
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        setAuthMode && setAuthMode('login');
                        setModalType('auth');
                      }}
                    >
                      <Sparkles size={16} color="#2563eb" />
                      <span>Switch / Create Account</span>
                    </div>
                    <div
                      className="dropdown-item logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        logoutAccount();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </div>
                  </div>
                )}
              </div>
            ) : currentView === 'admin' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck size={13} />
                <span>Admin Gateway</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isAdminAuthenticated && (
                  <button
                    className="portal-pill admin"
                    onClick={() => {
                      window.history.pushState(null, '', '/admin');
                      setCurrentView('admin');
                    }}
                    title="Open Admin Console"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <ShieldCheck size={13} />
                    <span>Admin Panel</span>
                  </button>
                )}
                <button
                  className="action-pill-auth"
                  onClick={() => {
                    setAuthMode && setAuthMode('login');
                    setModalType('auth');
                  }}
                  title="Sign in or Create New Account"
                >
                  <User size={14} />
                  <span>Login / Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
