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
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const {
    user,
    currentView,
    setCurrentView,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    setModalType,
    notifications,
    records,
    setDashboardTab,
    logoutAccount
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;
  const isLoggedIn = !!(user && user.id && localStorage.getItem('websynx_logged_out') !== 'true');

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
      {/* Top micro bar for quick portal switching & system status */}
      <div className="navbar-top-announcement">
        <div className="container announcement-inner">
          <div className="announcement-left">
            <span className="live-dot"></span>
            <span className="announcement-text">
              TRC20 Active • <strong>DEVSYNX Engine</strong>
            </span>
          </div>
          <div className="announcement-right">
            {/* View Switcher Pills */}
            <div className="portal-switcher">
              <button
                className={`portal-pill ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                }}
              >
                <LayoutDashboard size={13} />
                <span>User App</span>
              </button>
              <button
                className={`portal-pill admin ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin')}
              >
                <ShieldCheck size={13} />
                <span>Admin Panel</span>
                {records.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="badge-count">
                    {records.filter(r => r.status === 'Pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header matching screenshot */}
      <div className="navbar-main">
        <div className="container navbar-container">
          {/* Brand Logo */}
          <div className="brand-logo" onClick={() => setCurrentView('dashboard')}>
            <div className="logo-icon-wrap">
              <TrendingUp size={22} className="logo-svg" />
            </div>
            <div className="logo-text-group">
              <span className="brand-title">Web<span className="brand-highlight">Synx</span></span>
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

            {/* Notification Bell */}
            <div className="dropdown-container">
              <button
                className="action-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="dropdown-panel notif-dropdown animate-slide-down">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <span className="notif-badge">{notifications.length} alerts</span>
                  </div>
                  <div className="notif-list">
                    {notifications.map((n) => (
                      <div key={n.id} className="notif-item">
                        <div className="notif-item-top">
                          <strong className="notif-title">{n.title}</strong>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <p className="notif-desc">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Account Controls: Profile Pill when Logged In vs Login/Register button when Logged Out */}
            {isLoggedIn ? (
              <div className="dropdown-container">
                <button
                  className="user-profile-nav-pill"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Account Menu"
                >
                  <div className="user-avatar-circle">{user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}</div>
                  <div className="user-nav-meta">
                    <span className="user-nav-name">{user?.name}</span>
                    <span className="user-nav-tier">⭐ {user?.vipLevel || 'eBay'}</span>
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
                          <span className="vip-tag-small">⭐ {user?.vipLevel || 'eBay'}</span>
                        </div>
                        <span className="user-email">{user?.email}</span>
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
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
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
            ) : (
              <button
                className="action-pill-auth"
                onClick={() => setModalType('auth')}
                title="Sign in or Create New Account"
              >
                <User size={14} />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
