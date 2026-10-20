import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import {
  INITIAL_USER,
  INITIAL_VIP_TIERS,
  INITIAL_TASKS,
  INITIAL_RECORDS,
  MASKED_ACTIVITY_STREAM,
  INITIAL_ADMIN_USERS
} from '../data/mockData';
import { normalizeTask } from '../services/supabaseService';
import { ensureAllInitialTasks } from '../services/localDb';

export const GUEST_USER = {
  id: null,
  isGuest: true,
  name: 'Guest User',
  email: '',
  code: null,
  referralCode: null,
  avatar: 'G',
  vipLevel: 'eBay',
  vipTierId: 'tier_ebay',
  balance: 0.00,
  totalEarnings: 0.00,
  totalDeposit: 0.00,
  totalWithdraw: 0.00,
  pendingRequests: 0,
  teamMembersCount: 0,
  pendingTasks: 25,
  completedTasks: 0,
  dailyQuota: 25,
  dailyCompleted: 0,
  teamBonus: 0.00,
  thisMonthEarnings: 0.00,
  depositSuccessRate: 100,
  withdrawRate: 100,
  taskCompletionRate: 0,
  kycStatus: 'Unverified',
  walletAddress: '',
  network: 'TRC20',
  status: 'Active'
};

export const deduplicateRecords = (recordsList) => {
  if (!Array.isArray(recordsList)) return [];
  const idMap = new Map();
  const codeMap = new Map();
  const result = [];

  for (const r of recordsList) {
    if (!r) continue;
    const rId = r.id ? String(r.id) : null;
    const rCode = r.code ? String(r.code) : null;

    let existing = null;
    if (rCode && codeMap.has(rCode)) {
      existing = codeMap.get(rCode);
    } else if (rId && idMap.has(rId)) {
      existing = idMap.get(rId);
    } else if (rCode && idMap.has(rCode)) {
      existing = idMap.get(rCode);
    } else if (rId && codeMap.has(rId)) {
      existing = codeMap.get(rId);
    }

    if (existing) {
      if (existing.status === 'Pending' && (r.status === 'Completed' || r.status === 'Rejected')) {
        Object.assign(existing, r);
      }
      continue;
    }

    const cloned = { ...r };
    if (rId) idMap.set(rId, cloned);
    if (rCode) codeMap.set(rCode, cloned);
    result.push(cloned);
  }

  return result;
};

const AppContext = createContext();

export function AppProvider({ children }) {
  // State initialization with local storage backup
  const [user, setUser] = useState(() => {
    try {
      const isLoggedOut = localStorage.getItem('websynx_logged_out') === 'true';
      if (isLoggedOut) return GUEST_USER;
      const saved = localStorage.getItem('websynx_user') || localStorage.getItem('seox_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && !parsed.isGuest) return parsed;
      }
    } catch (e) {}
    return GUEST_USER;
  });

  const isLoggedIn = !!(user && user.id && !user.isGuest);

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('websynx_records') || localStorage.getItem('seox_records');
    return saved ? deduplicateRecords(JSON.parse(saved)) : [];
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('websynx_tasks') || localStorage.getItem('seox_tasks');
    const raw = saved ? JSON.parse(saved) : INITIAL_TASKS;
    return ensureAllInitialTasks((raw || []).map(normalizeTask));
  });

  // Always keep localStorage in sync with tasks so newly added/edited tasks persist
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      try {
        localStorage.setItem('websynx_tasks', JSON.stringify(tasks));
      } catch (e) {}
    }
  }, [tasks]);

  const [vipTiers, setVipTiers] = useState(() => {
    const saved = localStorage.getItem('websynx_vip_tiers') || localStorage.getItem('seox_vip_tiers');
    return saved ? JSON.parse(saved) : INITIAL_VIP_TIERS;
  });

  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem('websynx_admin_users') || localStorage.getItem('seox_admin_users');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  const [activityStream, setActivityStream] = useState(MASKED_ACTIVITY_STREAM);
  const [userTeam, setUserTeam] = useState([]);

  // System receiving deposit accounts configured by admin
  const [systemDepositAccounts, setSystemDepositAccounts] = useState(() => {
    const saved = localStorage.getItem('websynx_system_deposit_accounts');
    return saved ? JSON.parse(saved) : {
      trc20Address: 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q',
      erc20Address: '0x71C94156b53982e0C63810a972c72b04B46bF022',
      bep20Address: '0x71C94156b53982e0C63810a972c72b04B46bF022',
      bankName: 'Standard Chartered Global Clearing',
      bankAccount: 'GB82WEST12345678901234',
      bankHolder: 'Ecomxstocks Global Escrow Vault Ltd',
      bankSwift: 'SCBLGB2L',
      depositInstructions: 'Please include your Account ID as transaction memo. Funds credited after 1 network confirmation.'
    };
  });

  // User Notifications - Loaded per active user with localStorage, multi-tab events & backend sync
  const [notifications, setNotifications] = useState(() => {
    try {
      const currentSavedId = localStorage.getItem('websynx_current_user_id') || 'guest';
      const saved = localStorage.getItem(`websynx_notifications_${currentSavedId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'init_welcome',
        title: 'Welcome to Ecomxstocks',
        message: 'Your account is active. Complete 25 merchant tasks sequentially to earn daily commissions.',
        time: 'Just now',
        type: 'info',
        read: false
      }
    ];
  });

  const [backendOnline, setBackendOnline] = useState(false);

  // Send Notification to specific user (or broadcast)
  const sendUserNotification = useCallback((targetUserId, { title, message, type = 'info' }) => {
    if (!targetUserId) return;
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      type,
      read: false
    };

    // Update target user local storage
    try {
      const key = `websynx_notifications_${targetUserId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [newNotif, ...saved.filter(n => n.id !== newNotif.id)].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}

    // If target is currently active session, update state
    if (user && (user.id === targetUserId || String(user.id) === String(targetUserId))) {
      setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 50));
    }

    // Multi-tab window event
    try {
      window.dispatchEvent(new CustomEvent('ecomx_notification', { detail: { userId: targetUserId, notif: newNotif } }));
    } catch (e) {}

    // Sync to backend API
    api.notifyUser(targetUserId, title, message, type);
  }, [user]);

  // General addNotification for current active user
  const addNotification = useCallback((title, message, type = 'info') => {
    const targetId = user?.id || 'guest';
    sendUserNotification(targetId, { title, message, type });
  }, [user?.id, sendUserNotification]);

  // Mark single notification as read
  const markNotificationAsRead = useCallback((notifId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
      if (user && user.id) {
        try {
          localStorage.setItem(`websynx_notifications_${user.id}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  }, [user?.id]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (user && user.id) {
        try {
          localStorage.setItem(`websynx_notifications_${user.id}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  }, [user?.id]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (user && user.id) {
      try {
        localStorage.removeItem(`websynx_notifications_${user.id}`);
      } catch (e) {}
    }
  }, [user?.id]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Sync notifications on active user change
  useEffect(() => {
    if (user && user.id && !user.isGuest) {
      try {
        const key = `websynx_notifications_${user.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setNotifications(parsed);
        } else if (Array.isArray(user.notifications) && user.notifications.length > 0) {
          setNotifications(user.notifications);
          localStorage.setItem(key, JSON.stringify(user.notifications));
        }
      } catch (e) {}
    }
  }, [user?.id]);

  // Listen to multi-tab notification events
  useEffect(() => {
    const handleNotifEvent = (e) => {
      if (e.detail && user && (user.id === e.detail.userId || String(user.id) === String(e.detail.userId))) {
        setNotifications(prev => [e.detail.notif, ...prev.filter(n => n.id !== e.detail.notif.id)].slice(0, 50));
      }
    };
    window.addEventListener('ecomx_notification', handleNotifEvent);
    return () => window.removeEventListener('ecomx_notification', handleNotifEvent);
  }, [user?.id]);

  // Ensure user has assigned tasks loaded from persistent cache if missing
  useEffect(() => {
    if (user && user.id && !user.isGuest) {
      if (!user.assignedTasks || !Array.isArray(user.assignedTasks) || user.assignedTasks.length === 0) {
        try {
          const cachedTasks = localStorage.getItem(`websynx_user_assigned_tasks_${user.id}`);
          if (cachedTasks) {
            const parsed = JSON.parse(cachedTasks);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setUser(prev => ({
                ...prev,
                assignedTasks: parsed,
                assignedTaskIds: parsed.map(t => t.id)
              }));
            }
          }
        } catch (e) {}
      }
    }
  }, [user?.id]);

  // Listen to multi-tab task assignment events
  useEffect(() => {
    const handleTasksAssigned = (e) => {
      if (e.detail && user && (user.id === e.detail.userId || String(user.id) === String(e.detail.userId))) {
        setUser(prev => ({
          ...prev,
          assignedTasks: e.detail.tasks,
          assignedTaskIds: (e.detail.tasks || []).map(t => t.id),
          dailyCompleted: e.detail.resetCompleted ? 0 : (prev?.dailyCompleted || 0),
          completedTasks: e.detail.resetCompleted ? 0 : (prev?.completedTasks || 0),
          dailyQuota: e.detail.tasks?.length || 25,
          taskPackageStatus: 'assigned',
          taskPackageRequested: false
        }));
      }
    };
    window.addEventListener('ecomx_tasks_assigned', handleTasksAssigned);
    return () => window.removeEventListener('ecomx_tasks_assigned', handleTasksAssigned);
  }, [user?.id]);

  // Support & Telegram Channels State
  const [supportSettings, setSupportSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('websynx_support_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        let changed = false;
        if (!parsed.agentName || parsed.agentName.includes('WebSynx')) {
          parsed.agentName = 'Ecomxstocks Official Support';
          changed = true;
        }
        if (!parsed.telegram || parsed.telegram.includes('websynx')) {
          parsed.telegram = 'https://t.me/ecomxstocks_support';
          changed = true;
        }
        if (!parsed.telegramChannel || parsed.telegramChannel.includes('websynx')) {
          parsed.telegramChannel = 'https://t.me/ecomxstocks_official';
          changed = true;
        }
        if (!parsed.telegramSupportUser || parsed.telegramSupportUser.includes('WebSynx')) {
          parsed.telegramSupportUser = '@Ecomxstocks_Support';
          changed = true;
        }
        if (changed) {
          localStorage.setItem('websynx_support_settings', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {}
    return {
      enabled: true,
      agentName: 'Ecomxstocks Official Support',
      welcomeMessage: 'Hi there! 👋 How can we help you today? Our team usually replies within a few minutes.',
      offlineMessage: 'Our agents are currently offline. Leave a message and we will reply as soon as possible.',
      workingHours: '24/7 - Mon to Sun Priority Desk',
      online: true,
      autoReply: true,
      telegram: 'https://t.me/ecomxstocks_support',
      telegramChannel: 'https://t.me/ecomxstocks_official',
      telegramSupportUser: '@Ecomxstocks_Support',
      taskPendingMessage: 'Your request is pending. Admin is reviewing and will assign your task package shortly.',
      telegramInstruction: 'Please message customer support on Telegram to expedite your task package assignment.'
    };
  });

  useEffect(() => {
    // Proactively sweep persistent DB for any legacy WebSynx strings
    try {
      const dbRaw = localStorage.getItem('websynx_persistent_db_v2');
      if (dbRaw && dbRaw.includes('WebSynx')) {
        const cleaned = dbRaw
          .replaceAll('WebSynx Official Support', 'Ecomxstocks Official Support')
          .replaceAll('WebSynx Support Desk', 'Ecomxstocks Official Support')
          .replaceAll('WebSynx', 'Ecomxstocks')
          .replaceAll('websynx_support', 'ecomxstocks_support')
          .replaceAll('websynx_official', 'ecomxstocks_official');
        localStorage.setItem('websynx_persistent_db_v2', cleaned);
      }
    } catch (e) {}

    api.getSupportSettings().then(s => {
      if (s && typeof s === 'object') {
        setSupportSettings(prev => {
          const merged = { ...prev, ...s };
          if (!merged.agentName || merged.agentName.includes('WebSynx')) {
            merged.agentName = 'Ecomxstocks Official Support';
          }
          if (!merged.telegram || merged.telegram.includes('websynx')) {
            merged.telegram = 'https://t.me/ecomxstocks_support';
          }
          if (!merged.telegramChannel || merged.telegramChannel.includes('websynx')) {
            merged.telegramChannel = 'https://t.me/ecomxstocks_official';
          }
          if (!merged.telegramSupportUser || merged.telegramSupportUser.includes('WebSynx')) {
            merged.telegramSupportUser = '@Ecomxstocks_Support';
          }
          localStorage.setItem('websynx_support_settings', JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(() => {});
  }, []);

  const updateSupportSettings = useCallback(async (newSettings) => {
    try {
      const updated = await api.updateSupportSettings(newSettings);
      const merged = { ...supportSettings, ...updated };
      setSupportSettings(merged);
      localStorage.setItem('websynx_support_settings', JSON.stringify(merged));
      addNotification('Settings Saved', 'Telegram channels and customer support settings updated.');
      return merged;
    } catch (e) {
      console.warn('Fallback local settings update:', e);
      const merged = { ...supportSettings, ...newSettings };
      setSupportSettings(merged);
      localStorage.setItem('websynx_support_settings', JSON.stringify(merged));
      addNotification('Settings Saved', 'Support settings updated locally.');
      return merged;
    }
  }, [supportSettings, addNotification]);

  // App routing & view state (Admin Panel only accessible at /admin or ?admin=1)
  const isUrlAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path === '/admin' || path.endsWith('/admin') || search.includes('admin') || hash.includes('admin');
  };

  const [currentView, setCurrentView] = useState(() => {
    if (isUrlAdminRoute()) return 'admin';
    const isLoggedOut = typeof window !== 'undefined' && localStorage.getItem('websynx_logged_out') === 'true';
    if (!isLoggedOut) {
      try {
        const saved = localStorage.getItem('websynx_user') || localStorage.getItem('seox_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id && !parsed.isGuest) {
            return 'dashboard';
          }
        }
      } catch (e) {}
    }
    return 'storefront';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const onAdmin = isUrlAdminRoute();
      if (onAdmin) {
        setCurrentView('admin');
      } else if (isLoggedIn) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('storefront');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isLoggedIn]);

  // When user is authenticated, ensure only the dashboard is displayed
  useEffect(() => {
    if (isLoggedIn && currentView === 'storefront') {
      setCurrentView('dashboard');
      setDashboardTab('home');
    }
  }, [isLoggedIn, currentView]);

  const [dashboardTab, setDashboardTab] = useState('home'); // 'home' | 'menu' | 'records' | 'support' | 'mine' | 'platform-tasks'
  const [activePlatform, setActivePlatform] = useState('eBay');
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  const openPlatformTasks = useCallback((platform = 'eBay') => {
    setActivePlatform(platform);
    setDashboardTab('platform-tasks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [recordsSubTab, setRecordsSubTab] = useState('Transactions');
  const [recordsStatusFilter, setRecordsStatusFilter] = useState('All');

  const openRecordsTab = useCallback((subTab = 'Transactions', status = 'All') => {
    setRecordsSubTab(subTab);
    setRecordsStatusFilter(status);
    setDashboardTab('records');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'deposit' | 'withdraw' | 'task' | 'apk' | 'kyc' | 'auth' | 'referral' | 'team' | null
  const [selectedTask, setSelectedTask] = useState(null);

  // Deposit refresh notification - kept null to eliminate manual pop up completely
  const [depositRefreshNotice, setDepositRefreshNotice] = useState(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Synchronize and refresh user balance cleanly on demand or automatically
  const refreshUserBalance = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshingBalance(true);
    try {
      const [u, r] = await Promise.all([api.getMe(), api.getRecords()]);
      let newBalance = null;
      let newTotalDep = null;

      if (u && u.id && !u.isGuest && (u.id === user?.id || String(u.id) === String(user?.id))) {
        newBalance = parseFloat(u.balance || 0);
        newTotalDep = parseFloat(u.totalDeposit || u.total_deposit || 0);
        setUser(prev => {
          if (!prev) return prev;
          const prevBal = parseFloat(prev.balance || 0);
          const prevDep = parseFloat(prev.totalDeposit || prev.total_deposit || 0);
          if (prevBal === newBalance && prevDep === newTotalDep && (prev.assignedTasks?.length || 0) === (u.assignedTasks?.length || 0)) {
            return prev;
          }
          const merged = {
            ...prev,
            ...u,
            balance: newBalance,
            totalDeposit: newTotalDep,
            total_deposit: newTotalDep
          };
          try {
            localStorage.setItem('websynx_user', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      } else {
        const db = getLocalDatabase();
        const localU = (db.users || []).find(x => x.id === user?.id) || db.user;
        if (localU) {
          newBalance = parseFloat(localU.balance || 0);
          newTotalDep = parseFloat(localU.totalDeposit || 0);
          setUser(prev => {
            if (!prev) return prev;
            if (parseFloat(prev.balance || 0) === newBalance && parseFloat(prev.totalDeposit || 0) === newTotalDep) {
              return prev;
            }
            return {
              ...prev,
              balance: newBalance,
              totalDeposit: newTotalDep
            };
          });
        }
      }

      if (r && Array.isArray(r) && r.length > 0) {
        setRecords(deduplicateRecords(r));
      }

      if (user?.id) {
        try {
          localStorage.removeItem(`websynx_deposit_approved_notice_${user.id}`);
        } catch (e) {}
      }

      if (!silent) {
        const balStr = newBalance !== null ? `$${newBalance.toFixed(2)} USDT` : '';
        addNotification('Balance Refreshed!', `Your balance has been updated to ${balStr}.`, 'success');
      }
    } catch (err) {
      console.warn('refreshUserBalance error:', err);
    } finally {
      if (!silent) setTimeout(() => setIsRefreshingBalance(false), 500);
    }
  }, [user?.id, addNotification]);

  const refreshUserBalanceRef = useRef(refreshUserBalance);
  useEffect(() => {
    refreshUserBalanceRef.current = refreshUserBalance;
  }, [refreshUserBalance]);

  // Real-time automatic background polling & visibility synchronization
  useEffect(() => {
    if (!user?.id || user.isGuest) return;

    // Clean up any lingering deposit notice from storage
    try {
      localStorage.removeItem(`websynx_deposit_approved_notice_${user.id}`);
    } catch (e) {}

    // Auto-refresh balance every 3 seconds so admin approval reflects automatically
    const interval = setInterval(() => {
      if (refreshUserBalanceRef.current) {
        refreshUserBalanceRef.current(true);
      }
    }, 3000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && refreshUserBalanceRef.current) {
        refreshUserBalanceRef.current(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id, user?.isGuest]);

  // Listen for deposit approved notices from multi-tab / local storage events & auto refresh
  useEffect(() => {
    const handleNotice = (e) => {
      if (e.detail && user && (user.id === e.detail.userId || String(user.id) === String(e.detail.userId))) {
        if (refreshUserBalanceRef.current) {
          refreshUserBalanceRef.current(true);
        }
      }
    };
    const handleStorage = (e) => {
      if (e.key && (e.key === 'websynx_user' || e.key.startsWith('websynx_deposit_') || e.key === 'websynx_records')) {
        if (refreshUserBalanceRef.current) {
          refreshUserBalanceRef.current(true);
        }
      }
    };
    window.addEventListener('ecomx_deposit_approved_notice', handleNotice);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('ecomx_deposit_approved_notice', handleNotice);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id]);



  // Fetch team members for a given user
  const fetchUserTeam = useCallback(async (userId, userCode) => {
    const targetId = userId || user?.id;
    const targetCode = userCode || user?.referralCode || user?.code;
    if (!targetId && !targetCode) return [];
    try {
      const team = await api.getUserTeam(targetId, targetCode);
      if (team && (targetId === user?.id || targetCode === (user?.referralCode || user?.code))) {
        setUserTeam(team);
      }
      return team || [];
    } catch (err) {
      console.warn('fetchUserTeam error:', err);
      return [];
    }
  }, [user?.id, user?.referralCode, user?.code]);

  // Check URL query parameters for referral links (?ref=CODE or ?invite=CODE)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref') || params.get('invite') || params.get('code');
      if (refParam) {
        sessionStorage.setItem('websynx_ref_code', refParam);
        const isLoggedOut = localStorage.getItem('websynx_logged_out') === 'true';
        const savedUser = localStorage.getItem('websynx_user');
        if (!savedUser || isLoggedOut) {
          setModalType('auth');
        }
      }
    } catch (e) {}
  }, []);

  // Fetch full live state from backend server
  const refreshFromBackend = useCallback(async () => {
    try {
      const [u, r, t, tiers, users, act] = await Promise.all([
        api.getMe(),
        api.getRecords(),
        api.getTasks(),
        api.getVipTiers(),
        api.getUsers(),
        api.getActivity()
      ]);

      if (u && u.id && !u.isGuest) {
        const currentSavedId = localStorage.getItem('websynx_current_user_id');
        if (currentSavedId && (currentSavedId === u.id || String(currentSavedId) === String(u.id))) {
          setUser(prev => {
            if (prev?.isGuest) return prev;
            const merged = {
              ...prev,
              ...u,
              assignedPackage: u.assignedPackage || prev?.assignedPackage || null,
              taskPackageStatus: u.taskPackageStatus || prev?.taskPackageStatus || null,
              taskPackageRequested: u.taskPackageRequested ?? prev?.taskPackageRequested ?? false,
              assignedTasks: (Array.isArray(u.assignedTasks) && u.assignedTasks.length > 0)
                ? u.assignedTasks
                : (prev?.assignedTasks || []),
              assignedTaskIds: (Array.isArray(u.assignedTasks) && u.assignedTasks.length > 0)
                ? u.assignedTasks.map(t => t.id)
                : (prev?.assignedTaskIds || [])
            };
            localStorage.setItem('websynx_user', JSON.stringify(merged));
            localStorage.setItem('websynx_current_user_id', merged.id);
            localStorage.removeItem('websynx_logged_out');
            return merged;
          });
          api.getUserTeam(u.id, u.referralCode || u.code).then(team => {
            if (team) setUserTeam(team);
          });
        }
      }
      if (r) setRecords(deduplicateRecords(r));
      if (t) setTasks(ensureAllInitialTasks(t.map(normalizeTask)));
      if (tiers) setVipTiers(tiers);
      if (users) {
        setAdminUsers(prev => {
          const prevMap = new Map((prev || []).map(p => [p.id, p]));
          return users.map(newU => {
            const p = prevMap.get(newU.id);
            return {
              ...newU,
              assignedPackage: newU.assignedPackage || p?.assignedPackage || null,
              taskPackageStatus: newU.taskPackageStatus || p?.taskPackageStatus || null,
              taskPackageRequested: newU.taskPackageRequested ?? p?.taskPackageRequested ?? false,
              assignedTasks: (Array.isArray(newU.assignedTasks) && newU.assignedTasks.length > 0)
                ? newU.assignedTasks
                : (p?.assignedTasks || []),
              assignedTaskIds: (Array.isArray(newU.assignedTasks) && newU.assignedTasks.length > 0)
                ? newU.assignedTasks.map(t => t.id)
                : (p?.assignedTaskIds || [])
            };
          });
        });
      }
      if (act) setActivityStream(act);
      setBackendOnline(true);
    } catch (err) {
      console.warn('Backend server connecting or offline, using persistent cache:', err.message);
      setBackendOnline(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Also fetch user team when user changes
  useEffect(() => {
    if (user && user.id && !user.isGuest) {
      fetchUserTeam(user.id, user.referralCode || user.code);
    }
  }, [user?.id, user?.referralCode, user?.code, fetchUserTeam]);

  // Connect to Server-Sent Events (SSE) for Real-Time Synchronized Push
  useEffect(() => {
    const unsubscribe = api.subscribeLiveEvents((event) => {
      console.log('📡 Live Real-Time Event Received:', event.type, event.payload);

      if (event.type === 'deposit_created') {
        const { record, user: updatedUser } = event.payload;
        setRecords(prev => deduplicateRecords([record, ...prev.filter(r => r.id !== record.id && r.code !== record.code)]));
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
        }
        addNotification('New Deposit Registered', `Deposit of ${record.amount} USDT registered.`);
      }

      if (event.type === 'deposit_approved') {
        const { record, user: updatedUser, activity } = event.payload;
        setRecords(prev => deduplicateRecords((prev || []).map(r => (r && (r.id === record.id || r.code === record.code)) ? { ...r, ...record, status: 'Completed' } : r)));
        
        const targetUserId = record?.userId || record?.user_id || updatedUser?.id;
        if (user && (user.id === targetUserId || String(user.id) === String(targetUserId))) {
          const recAmt = parseFloat(record?.amount || 0);

          if (updatedUser) {
            setUser(prev => ({
              ...prev,
              ...updatedUser,
              balance: parseFloat(updatedUser.balance ?? prev?.balance ?? 0),
              totalDeposit: parseFloat(updatedUser.totalDeposit ?? updatedUser.total_deposit ?? prev?.totalDeposit ?? 0)
            }));
            try {
              localStorage.setItem('websynx_user', JSON.stringify({ ...user, ...updatedUser }));
            } catch (e) {}
          }
          if (refreshUserBalanceRef.current) {
            refreshUserBalanceRef.current(true);
          }
          addNotification('Deposit Approved!', `${record?.amount || recAmt} USDT credited to your wallet balance.`, 'success');
        }
        if (updatedUser) {
          setAdminUsers(prev => (prev || []).map(u => (u.id === updatedUser.id || String(u.id) === String(updatedUser.id)) ? updatedUser : u));
        }
        if (activity) {
          setActivityStream(prev => [activity, ...(prev || []).slice(0, 14)]);
        }
      }

      if (event.type === 'deposit_rejected') {
        const { record, user: updatedUser } = event.payload;
        setRecords(prev => deduplicateRecords(prev.map(r => (r.id === record.id || r.code === record.code || String(r.id) === String(record.id)) ? { ...r, ...record, status: 'Rejected' } : r)));
        if (updatedUser && user && updatedUser.id === user.id) {
          setUser(updatedUser);
          addNotification('Deposit Update', `Deposit request was rejected.`);
        }
        if (updatedUser) {
          setAdminUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        }
      }

      if (event.type === 'withdrawal_created') {
        const { record, user: updatedUser } = event.payload;
        setRecords(prev => [record, ...prev.filter(r => r.id !== record.id)]);
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
        }
      }

      if (event.type === 'withdrawal_approved') {
        const { record, user: updatedUser, activity } = event.payload;
        setRecords(prev => prev.map(r => r.id === record.id ? record : r));
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
          addNotification('Withdrawal Dispatched!', `${Math.abs(record.amount)} USDT dispatched on TRON network.`);
        }
        setAdminUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (activity) {
          setActivityStream(prev => [activity, ...prev.slice(0, 14)]);
        }
      }

      if (event.type === 'withdrawal_rejected') {
        const { record, user: updatedUser } = event.payload;
        setRecords(prev => prev.map(r => r.id === record.id ? record : r));
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
          addNotification('Withdrawal Refunded', `Withdrawal rejected and funds refunded.`);
        }
      }

      if (event.type === 'task_completed') {
        const { record, user: updatedUser, task, activity } = event.payload;
        setRecords(prev => [record, ...prev.filter(r => r.id !== record.id)]);
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
        }
        setAdminUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        if (activity) {
          setActivityStream(prev => [activity, ...prev.slice(0, 14)]);
        }
      }

      if (event.type === 'task_created') {
        setTasks(prev => [event.payload.task, ...prev]);
      }

      if (event.type === 'user_registered') {
        const { user: newUser, referrerId } = event.payload;
        setAdminUsers(prev => [newUser, ...prev]);
        if (referrerId === user.id) {
          setUser(prev => ({
            ...prev,
            teamMembersCount: (prev.teamMembersCount || 0) + 1
          }));
          addNotification('New Referral Member!', `${newUser.name} registered using your code!`);
        }
      }

      if (event.type === 'user_updated') {
        const { user: updatedUser } = event.payload;
        if (updatedUser) {
          setAdminUsers(prev => prev.map(u => {
            if (u.id === updatedUser.id || String(u.id) === String(updatedUser.id)) {
              return {
                ...u,
                ...updatedUser,
                assignedPackage: updatedUser.assignedPackage || u.assignedPackage || null,
                taskPackageStatus: updatedUser.taskPackageStatus || u.taskPackageStatus || null,
                taskPackageRequested: updatedUser.taskPackageRequested ?? u.taskPackageRequested ?? false,
                assignedTasks: (Array.isArray(updatedUser.assignedTasks) && updatedUser.assignedTasks.length > 0)
                  ? updatedUser.assignedTasks
                  : (u.assignedTasks || []),
                assignedTaskIds: (Array.isArray(updatedUser.assignedTasks) && updatedUser.assignedTasks.length > 0)
                  ? updatedUser.assignedTasks.map(t => t.id)
                  : (u.assignedTaskIds || [])
              };
            }
            return u;
          }));
          if (user && (user.id === updatedUser.id || String(user.id) === String(updatedUser.id))) {
            setUser(prev => {
              const currentAssigned = (Array.isArray(updatedUser.assignedTasks) && updatedUser.assignedTasks.length > 0)
                ? updatedUser.assignedTasks
                : (prev?.assignedTasks || []);
              const merged = {
                ...prev,
                ...updatedUser,
                assignedPackage: updatedUser.assignedPackage || prev?.assignedPackage || null,
                taskPackageStatus: updatedUser.taskPackageStatus || prev?.taskPackageStatus || null,
                taskPackageRequested: updatedUser.taskPackageRequested ?? prev?.taskPackageRequested ?? false,
                assignedTasks: currentAssigned,
                assignedTaskIds: currentAssigned.map(t => t.id)
              };
              localStorage.setItem('websynx_user', JSON.stringify(merged));
              if (currentAssigned.length > 0) {
                localStorage.setItem(`websynx_user_assigned_tasks_${merged.id}`, JSON.stringify(currentAssigned));
              }
              return merged;
            });
          }
        }
      }

      if (event.type === 'tasks_assigned') {
        const { userId, tasks: incomingTasks, packageName, resetCompleted } = event.payload;
        if (user && (user.id === userId || String(user.id) === String(userId)) && Array.isArray(incomingTasks)) {
          setUser(prev => {
            const updated = {
              ...prev,
              assignedTasks: incomingTasks,
              assignedTaskIds: incomingTasks.map(t => t.id),
              assignedPackage: packageName || prev?.assignedPackage || 'Standard 25 Package',
              taskPackageStatus: 'assigned',
              taskPackageRequested: false,
              dailyQuota: incomingTasks.length,
              pendingTasks: incomingTasks.length,
              ...(resetCompleted ? { dailyCompleted: 0, completedTasks: 0 } : {})
            };
            localStorage.setItem('websynx_user', JSON.stringify(updated));
            localStorage.setItem(`websynx_user_assigned_tasks_${userId}`, JSON.stringify(incomingTasks));
            return updated;
          });
        }
      }

      if (event.type === 'broadcast_posted') {
        addNotification('System Announcement', event.payload.announcement.message);
      }

      if (event.type === 'state_reset') {
        refreshFromBackend();
      }
    });

    return () => unsubscribe();
  }, [user?.id, addNotification, refreshFromBackend]);

  // Sync to local storage for fast render
  useEffect(() => {
    if (user && user.id && !user.isGuest) {
      localStorage.setItem('websynx_user', JSON.stringify(user));
      localStorage.setItem('websynx_current_user_id', user.id);
      localStorage.removeItem('websynx_logged_out');
    } else {
      localStorage.removeItem('websynx_user');
      localStorage.removeItem('websynx_current_user_id');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('websynx_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('websynx_records', JSON.stringify(deduplicateRecords(records)));
  }, [records]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ==========================================
  // ACTION DISPATCHERS
  // ==========================================

  // Submit Deposit
  const submitDeposit = async (amount, txHash, network = 'TRC20') => {
    const parsedAmt = parseFloat(amount) || 0;
    try {
      const res = await api.createDeposit(parsedAmt, txHash, network, user?.id);
      const safeRec = (res && typeof res === 'object') ? res : {
        id: `rec_dep_${Date.now()}`,
        code: `DEP-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        type: `${network} Deposit`,
        category: 'Deposit',
        amount: parsedAmt,
        currency: 'USDT',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        userId: user?.id,
        userName: user?.name || 'Member',
        note: 'Awaiting blockchain confirmation'
      };

      setUser(prev => ({
        ...prev,
        pendingRequests: (prev.pendingRequests || 0) + 1
      }));
      setRecords(prev => deduplicateRecords([safeRec, ...(prev || []).filter(r => r && r.id !== safeRec.id && (safeRec.code ? r.code !== safeRec.code : true))]));
      addNotification('Deposit Submitted', `Submitted ${parsedAmt} USDT deposit.`);
      return safeRec;
    } catch (err) {
      console.error('submitDeposit fallback:', err);
      const fallbackRec = {
        id: `rec_dep_${Date.now()}`,
        code: `DEP-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        type: `${network} Deposit`,
        category: 'Deposit',
        amount: parsedAmt,
        currency: 'USDT',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        userId: user?.id,
        userName: user?.name || 'Member',
        note: 'Awaiting blockchain confirmation'
      };
      setUser(prev => ({
        ...prev,
        pendingRequests: (prev.pendingRequests || 0) + 1
      }));
      setRecords(prev => deduplicateRecords([fallbackRec, ...(prev || [])]));
      addNotification('Deposit Submitted', `Submitted ${parsedAmt} USDT deposit.`);
      return fallbackRec;
    }
  };

  // Submit Withdrawal
  const submitWithdrawal = async (amount, address, network = 'TRC20') => {
    try {
      const res = await api.createWithdrawal(amount, address, network, user.id);
      setUser(prev => ({
        ...prev,
        balance: Math.max(0, parseFloat((prev.balance - parseFloat(amount)).toFixed(2))),
        pendingRequests: (prev.pendingRequests || 0) + 1
      }));
      setRecords(prev => [res, ...prev]);
      addNotification('Withdrawal Queued', `Requested ${amount} USDT withdrawal.`);
      return res;
    } catch (err) {
      console.error('submitWithdrawal failed:', err);
      throw err;
    }
  };

  // Execute & Submit Task
  const completeTask = async (task) => {
    try {
      const res = await api.submitTask(task.id, user.id);
      const earnedAmt = res?.commissionEarned ?? Number((((Number(task.price) || 0) * 0.04).toFixed(2)));
      setUser(prev => {
        const newCompleted = res?.user?.completedTasks !== undefined
          ? Number(res.user.completedTasks)
          : (Number(prev?.completedTasks) || 0) + 1;
        const newDaily = res?.user?.dailyCompleted !== undefined
          ? Number(res.user.dailyCompleted)
          : (Number(prev?.dailyCompleted) || 0) + 1;
        const quota = Number(prev?.dailyQuota) || 25;
        const newPending = Math.max(0, quota - newDaily);

        const merged = {
          ...prev,
          ...(res?.user || {}),
          balance: res?.user?.balance !== undefined
            ? Number(res.user.balance)
            : Number(((Number(prev?.balance) || 0) + earnedAmt).toFixed(2)),
          totalEarnings: res?.user?.totalEarnings !== undefined
            ? Number(res.user.totalEarnings)
            : Number(((Number(prev?.totalEarnings) || 0) + earnedAmt).toFixed(2)),
          completedTasks: newCompleted,
          dailyCompleted: newDaily,
          pendingTasks: newPending
        };
        try {
          localStorage.setItem('websynx_user', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });

      setAdminUsers(prev => prev.map(u => {
        if (u.id === user?.id || String(u.id) === String(user?.id)) {
          const newCompleted = res?.user?.completedTasks !== undefined ? Number(res.user.completedTasks) : ((Number(u.completedTasks) || 0) + 1);
          const newDaily = res?.user?.dailyCompleted !== undefined ? Number(res.user.dailyCompleted) : ((Number(u.dailyCompleted) || 0) + 1);
          const quota = Number(u.dailyQuota) || 25;
          return {
            ...u,
            completedTasks: newCompleted,
            dailyCompleted: newDaily,
            pendingTasks: Math.max(0, quota - newDaily),
            balance: res?.user?.balance !== undefined ? Number(res.user.balance) : Number(((Number(u.balance) || 0) + earnedAmt).toFixed(2))
          };
        }
        return u;
      }));

      if (res?.record) {
        setRecords(prev => [res.record, ...prev]);
      }
      addNotification('Task Completed!', `Earned +$${earnedAmt} USDT from ${task.platform} promotion!`);
      return earnedAmt;
    } catch (err) {
      console.warn('completeTask error, resilient fallback applied:', err);
      const earnedAmt = parseFloat(task.yieldAmount || task.yield_amount || (((Number(task.price) || 0) * 0.04).toFixed(2)));
      setUser(prev => {
        const newCompleted = (Number(prev?.completedTasks) || 0) + 1;
        const newDaily = (Number(prev?.dailyCompleted) || 0) + 1;
        const quota = Number(prev?.dailyQuota) || 25;
        const newPending = Math.max(0, quota - newDaily);

        const merged = {
          ...prev,
          balance: Number(((Number(prev?.balance) || 0) + earnedAmt).toFixed(2)),
          totalEarnings: Number(((Number(prev?.totalEarnings) || 0) + earnedAmt).toFixed(2)),
          completedTasks: newCompleted,
          dailyCompleted: newDaily,
          pendingTasks: newPending
        };
        try {
          localStorage.setItem('websynx_user', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });

      setAdminUsers(prev => prev.map(u => {
        if (u.id === user?.id || String(u.id) === String(user?.id)) {
          const newCompleted = (Number(u.completedTasks) || 0) + 1;
          const newDaily = (Number(u.dailyCompleted) || 0) + 1;
          const quota = Number(u.dailyQuota) || 25;
          return {
            ...u,
            completedTasks: newCompleted,
            dailyCompleted: newDaily,
            pendingTasks: Math.max(0, quota - newDaily),
            balance: Number(((Number(u.balance) || 0) + earnedAmt).toFixed(2))
          };
        }
        return u;
      }));
      const rec = {
        id: `rec_tsk_${Date.now()}`,
        code: `TSK-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        type: 'Task Payout',
        category: 'Task',
        amount: earnedAmt,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        note: `Completed ${task.platform} promotion for ${task.title}`,
        user_id: user?.id,
        user_name: user?.name,
        network: 'TRC20'
      };
      setRecords(prev => [rec, ...prev]);
      addNotification('Task Completed!', `Earned +$${earnedAmt} USDT from ${task.platform} promotion!`);
      return earnedAmt;
    }
  };

  // Admin Approve Deposit
  const adminApproveDeposit = async (recordId, recordData = null) => {
    try {
      const existing = recordData || (records || []).find(r => r && (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)));
      if (existing && existing.status === 'Completed') {
        addNotification('Already Approved', `Deposit ${existing.code || recordId} was already approved.`);
        return { record: existing, alreadyApproved: true };
      }

      const res = await api.approveDeposit(recordId, existing || {});
      const updatedRec = res?.record || existing || { id: recordId, status: 'Completed', note: 'Deposit verified and credited' };
      const targetCode = updatedRec.code || existing?.code;
      const targetUserId = updatedRec.userId || updatedRec.user_id || existing?.userId || existing?.user_id;
      const depositAmt = parseFloat(updatedRec.amount || existing?.amount || 0);

      setRecords(prev => deduplicateRecords((prev || []).map(r => 
        (r && (r.id === recordId || (targetCode && r.code === targetCode) || String(r.id) === String(recordId))) 
          ? { ...r, ...updatedRec, status: 'Completed', note: 'Deposit verified and credited', amount: depositAmt > 0 ? depositAmt : r.amount } 
          : r
      )));

      if (res?.user) {
        if (user && (res.user.id === user.id || String(res.user.id) === String(user.id))) {
          setUser(res.user);
        }
        setAdminUsers(prev => prev.map(u => (u.id === res.user.id || String(u.id) === String(res.user.id)) ? res.user : u));
      } else if (targetUserId && depositAmt > 0) {
        setAdminUsers(prev => prev.map(u => {
          if (u.id === targetUserId || String(u.id) === String(targetUserId)) {
            const newBal = parseFloat(((u.balance || 0) + depositAmt).toFixed(2));
            const newTot = parseFloat(((u.totalDeposit || u.total_deposit || 0) + depositAmt).toFixed(2));
            return {
              ...u,
              balance: newBal,
              totalDeposit: newTot,
              total_deposit: newTot,
              pendingRequests: Math.max(0, (u.pendingRequests || 1) - 1)
            };
          }
          return u;
        }));
        if (user && (user.id === targetUserId || String(user.id) === String(targetUserId))) {
          setUser(prev => ({
            ...prev,
            balance: parseFloat(((prev.balance || 0) + depositAmt).toFixed(2)),
            totalDeposit: parseFloat(((prev.totalDeposit || prev.total_deposit || 0) + depositAmt).toFixed(2)),
            pendingRequests: Math.max(0, (prev.pendingRequests || 1) - 1)
          }));
        }
      }

      if (targetUserId) {
        const notifAmt = depositAmt > 0 ? depositAmt.toFixed(2) : (updatedRec.amount || existing?.amount || '');
        sendUserNotification(targetUserId, {
          title: 'Deposit Approved',
          message: `Your deposit of ${notifAmt} USDT has been verified and credited to your wallet balance.`,
          type: 'success'
        });

        try {
          localStorage.removeItem(`websynx_deposit_approved_notice_${targetUserId}`);
          window.dispatchEvent(new CustomEvent('ecomx_deposit_approved_notice', { detail: { userId: targetUserId, amount: notifAmt } }));
        } catch (e) {}

        if (user && (user.id === targetUserId || String(user.id) === String(targetUserId))) {
          if (refreshUserBalanceRef.current) {
            refreshUserBalanceRef.current(true);
          }
        }
      }

      addNotification('Deposit Approved', `${depositAmt > 0 ? depositAmt.toFixed(2) : (updatedRec.amount || '')} USDT credited to ${updatedRec.userName || updatedRec.user_name || 'Member'}`);
      return res;
    } catch (err) {
      console.error('adminApproveDeposit failed:', err);
      const existing = (records || []).find(r => r && (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)));
      const targetUserId = existing?.userId || existing?.user_id;
      const depositAmt = parseFloat(existing?.amount || 0);

      setRecords(prev => deduplicateRecords((prev || []).map(r => (r && (r.id === recordId || r.code === recordId || String(r.id) === String(recordId))) ? { ...r, status: 'Completed', note: 'Deposit verified and credited' } : r)));
      
      if (targetUserId && depositAmt > 0) {
        setAdminUsers(prev => (prev || []).map(u => {
          if (u.id === targetUserId || String(u.id) === String(targetUserId)) {
            return {
              ...u,
              balance: parseFloat(((u.balance || 0) + depositAmt).toFixed(2)),
              totalDeposit: parseFloat(((u.totalDeposit || u.total_deposit || 0) + depositAmt).toFixed(2)),
              pendingRequests: Math.max(0, (u.pendingRequests || 1) - 1)
            };
          }
          return u;
        }));
        if (user && (user.id === targetUserId || String(user.id) === String(targetUserId))) {
          setUser(prev => ({
            ...prev,
            balance: parseFloat(((prev.balance || 0) + depositAmt).toFixed(2)),
            totalDeposit: parseFloat(((prev.totalDeposit || prev.total_deposit || 0) + depositAmt).toFixed(2)),
            pendingRequests: Math.max(0, (prev.pendingRequests || 1) - 1)
          }));
        }
      }
      addNotification('Deposit Approved', `Deposit was marked as Approved and credited.`);
    }
  };

  // Admin Reject Deposit
  const adminRejectDeposit = async (recordId, reason = 'Deposit unverified or invalid transaction hash') => {
    try {
      const existing = (records || []).find(r => r.id === recordId || r.code === recordId || String(r.id) === String(recordId));
      if (existing && existing.status === 'Rejected') {
        addNotification('Already Rejected', `Deposit ${existing.code || recordId} was already rejected.`);
        return { record: existing, alreadyRejected: true };
      }

      const res = await api.rejectDeposit(recordId, reason);
      const updatedRec = res?.record || { id: recordId, status: 'Rejected', note: reason };
      const targetCode = updatedRec.code || existing?.code;

      setRecords(prev => deduplicateRecords(prev.map(r => 
        (r.id === recordId || (targetCode && r.code === targetCode) || String(r.id) === String(recordId)) 
          ? { ...r, ...updatedRec, status: 'Rejected', note: updatedRec.note || reason } 
          : r
      )));

      if (res?.user) {
        if (user && res.user.id === user.id) {
          setUser(res.user);
        }
        setAdminUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      }

      const targetUserId = updatedRec.userId || updatedRec.user_id || existing?.userId || existing?.user_id;
      if (targetUserId) {
        sendUserNotification(targetUserId, {
          title: 'Deposit Rejected',
          message: `Your deposit request of ${updatedRec.amount || existing?.amount || ''} USDT was rejected. Reason: ${reason}`,
          type: 'error'
        });
      }

      addNotification('Deposit Rejected', `Deposit ${updatedRec.code || recordId} was rejected.`);
      return res;
    } catch (err) {
      console.error('adminRejectDeposit failed:', err);
      setRecords(prev => deduplicateRecords(prev.map(r => (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)) ? { ...r, status: 'Rejected', note: reason } : r)));
      addNotification('Deposit Rejected', `Deposit ${recordId} was marked as Rejected.`);
    }
  };

  // Admin Approve Withdrawal
  const adminApproveWithdrawal = async (recordId) => {
    try {
      const existing = (records || []).find(r => r.id === recordId || r.code === recordId || String(r.id) === String(recordId));
      const res = await api.approveWithdrawal(recordId);
      const updatedRec = res?.record || { id: recordId, status: 'Completed', note: 'Dispatched on TRON network' };
      setRecords(prev => prev.map(r => (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)) ? { ...r, ...updatedRec, status: 'Completed' } : r));
      if (res?.user) {
        if (user && res.user.id === user.id) {
          setUser(res.user);
        }
        setAdminUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      }

      const targetUserId = updatedRec.userId || updatedRec.user_id || existing?.userId || existing?.user_id;
      if (targetUserId) {
        sendUserNotification(targetUserId, {
          title: 'Withdrawal Approved',
          message: `Your withdrawal of ${updatedRec.amount || existing?.amount || ''} USDT has been approved and dispatched on TRC20 network.`,
          type: 'success'
        });
      }

      addNotification('Withdrawal Broadcasted', `Dispatched on TRC20 for ${updatedRec.userName || updatedRec.user_name || 'Member'}`);
      return res;
    } catch (err) {
      console.error('adminApproveWithdrawal failed:', err);
      setRecords(prev => prev.map(r => (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)) ? { ...r, status: 'Completed', note: 'Dispatched' } : r));
      addNotification('Withdrawal Approved', `Withdrawal was marked as Approved.`);
    }
  };

  // Admin Reject Withdrawal
  const adminRejectWithdrawal = async (recordId, reason = 'Withdrawal rejected by admin') => {
    try {
      const existing = (records || []).find(r => r.id === recordId || r.code === recordId || String(r.id) === String(recordId));
      const res = await api.rejectWithdrawal(recordId, reason);
      const updatedRec = res?.record || { id: recordId, status: 'Rejected', note: reason };
      setRecords(prev => prev.map(r => (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)) ? { ...r, ...updatedRec, status: 'Rejected', note: updatedRec.note || reason } : r));
      if (res?.user) {
        if (user && res.user.id === user.id) {
          setUser(res.user);
        }
        setAdminUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      }

      const targetUserId = updatedRec.userId || updatedRec.user_id || existing?.userId || existing?.user_id;
      if (targetUserId) {
        sendUserNotification(targetUserId, {
          title: 'Withdrawal Rejected',
          message: `Your withdrawal of ${updatedRec.amount || existing?.amount || ''} USDT was rejected. Reason: ${reason}. Funds have been refunded to your wallet.`,
          type: 'warning'
        });
      }

      addNotification('Withdrawal Rejected', `Withdrawal ${updatedRec.code || recordId} was rejected and funds refunded.`);
      return res;
    } catch (err) {
      console.error('adminRejectWithdrawal failed:', err);
      setRecords(prev => prev.map(r => (r.id === recordId || r.code === recordId || String(r.id) === String(recordId)) ? { ...r, status: 'Rejected', note: reason } : r));
      addNotification('Withdrawal Rejected', `Withdrawal was marked as Rejected.`);
    }
  };

  // Admin Update User
  const adminUpdateUser = async (userId, updates) => {
    try {
      const res = await api.updateUser(userId, updates);
      const updatedUser = res?.user || { id: userId, ...updates };
      setAdminUsers(prev => {
        const next = prev.map(u => (u.id === userId || String(u.id) === String(userId)) ? { ...u, ...updatedUser } : u);
        localStorage.setItem('websynx_admin_users', JSON.stringify(next));
        return next;
      });
      if (user && (user.id === userId || String(user.id) === String(userId))) {
        const merged = { ...user, ...updatedUser };
        setUser(merged);
        localStorage.setItem('websynx_user', JSON.stringify(merged));
      }
      addNotification('User Updated', `Updated account settings for ${updatedUser.name || 'Member'}`);
      return updatedUser;
    } catch (err) {
      console.error('adminUpdateUser failed:', err);
      // Fallback local update
      setAdminUsers(prev => {
        const next = prev.map(u => (u.id === userId || String(u.id) === String(userId)) ? { ...u, ...updates } : u);
        localStorage.setItem('websynx_admin_users', JSON.stringify(next));
        return next;
      });
      if (user && (user.id === userId || String(user.id) === String(userId))) {
        const merged = { ...user, ...updates };
        setUser(merged);
        localStorage.setItem('websynx_user', JSON.stringify(merged));
      }
      addNotification('User Updated', 'Account settings updated locally');
    }
  };

  // Admin Add Task
  const adminAddTask = async (taskData) => {
    try {
      const created = await api.createTask(taskData);
      setTasks(prev => [created, ...prev]);
      addNotification('Campaign Added', `Added "${created.title.substring(0, 24)}..." to ${created.platform}`);
      return created;
    } catch (err) {
      console.error('adminAddTask failed:', err);
      throw err;
    }
  };

  // Admin Update Task
  const adminUpdateTask = async (taskId, updates) => {
    try {
      const res = await api.updateTask(taskId, updates);
      const existingTask = tasks.find(t => String(t.id) === String(taskId)) || {};
      const updated = res?.task ? { ...existingTask, ...res.task } : { ...existingTask, ...updates };

      setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? updated : t));

      // Also update task in adminUsers assignedTasks if present
      setAdminUsers(prevUsers => (prevUsers || []).map(u => {
        if (!Array.isArray(u.assignedTasks)) return u;
        const hasTask = u.assignedTasks.some(at => String(at.id) === String(taskId));
        if (!hasTask) return u;
        return {
          ...u,
          assignedTasks: u.assignedTasks.map(at => String(at.id) === String(taskId) ? { ...at, ...updated } : at)
        };
      }));

      addNotification('Task Updated', `Updated "${(updated.title || 'Task').substring(0, 25)}..."`);
      return updated;
    } catch (err) {
      console.error('adminUpdateTask fallback handling:', err);
      const existingTask = tasks.find(t => String(t.id) === String(taskId)) || {};
      const fallbackUpdated = { ...existingTask, ...updates };
      setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? fallbackUpdated : t));
      addNotification('Task Updated', `Updated "${(fallbackUpdated.title || 'Task').substring(0, 25)}..."`);
      return fallbackUpdated;
    }
  };

  // Admin Delete Task
  const adminDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addNotification('Task Removed', 'Task removed from active campaign catalogue');
    } catch (err) {
      console.error('adminDeleteTask failed:', err);
      throw err;
    }
  };

  // Claim Dummy / Practice Deposit for Learning
  const claimDummyDeposit = async (amount = 100.00) => {
    try {
      const res = await api.claimDummyDeposit(amount, user.id);
      setUser(res.user);
      setRecords(prev => [res.record, ...prev]);
      addNotification('Practice Funds Granted', `+$${parseFloat(amount).toFixed(2)} Demo USDT added for learning tasks!`);
      return res;
    } catch (err) {
      console.error('claimDummyDeposit failed:', err);
      throw err;
    }
  };

  // Admin Update Tier
  const adminUpdateTier = async (tierId, updates) => {
    try {
      const res = await api.updateVipTier(tierId, updates);
      setVipTiers(prev => prev.map(t => t.id === tierId ? res.tier : t));
    } catch (err) {
      console.error('adminUpdateTier failed:', err);
    }
  };

  // Reset Demo Data
  const resetDemoData = async () => {
    try {
      await api.resetDatabase();
      await refreshFromBackend();
      addNotification('System Reset', 'All database tables restored to initial demo state.');
    } catch (err) {
      console.error('resetDemoData failed:', err);
    }
  };

  // Request Task Package from Admin (e.g. for eBay, Walmart, etc.)
  const requestTaskPackage = useCallback(async (platform = 'eBay') => {
    try {
      const randNum = Math.floor(100 + Math.random() * 900);
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let randLetters = '';
      for (let i = 0; i < 4; i++) {
        randLetters += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      const reqId = `${randNum}-${randLetters}`;
      const nowIso = new Date().toISOString();

      const updatedUser = {
        ...user,
        taskPackageRequested: true,
        taskPackagePlatform: platform,
        taskPackageStatus: 'pending',
        taskRequestId: reqId,
        taskRequestDate: nowIso,
        pendingRequests: (Number(user?.pendingRequests) || 0) + 1
      };
      setUser(updatedUser);
      localStorage.setItem('websynx_user', JSON.stringify(updatedUser));
      setAdminUsers(prev => prev.map(u => u.id === user?.id ? { ...u, ...updatedUser } : u));

      // Append ledger record for transparency
      const reqCode = `PKG-${Date.now().toString().slice(-6)}`;
      const newRecord = {
        id: reqCode,
        code: reqCode,
        type: `${platform} Task Package Request`,
        category: 'Tasks',
        amount: 0.00,
        currency: 'USDT',
        date: nowIso.replace('T', ' ').slice(0, 19),
        status: 'Pending',
        note: `User requested 25-task assignment package (#${reqId}) for ${platform}`,
        userId: user?.id || 'usr_guest',
        userName: user?.name || 'User',
        network: 'System'
      };
      setRecords(prev => {
        const next = [newRecord, ...prev];
        localStorage.setItem('websynx_records', JSON.stringify(next));
        return next;
      });

      addNotification('Task Package Requested', `Your request for 25 ${platform} tasks has been submitted (#${reqId}).`);
      return true;
    } catch (e) {
      console.error('requestTaskPackage error:', e);
      return false;
    }
  }, [user, addNotification]);

  // Cancel Pending Task Package Request
  const cancelTaskPackageRequest = useCallback(async () => {
    try {
      const updatedUser = {
        ...user,
        taskPackageRequested: false,
        taskPackageStatus: null,
        taskRequestId: null,
        taskRequestDate: null
      };
      setUser(updatedUser);
      localStorage.setItem('websynx_user', JSON.stringify(updatedUser));
      setAdminUsers(prev => prev.map(u => u.id === user?.id ? { ...u, taskPackageRequested: false, taskPackageStatus: null, taskRequestId: null } : u));
      addNotification('Request Cancelled', 'Your task package request has been cancelled.');
      return true;
    } catch (e) {
      console.error('cancelTaskPackageRequest error:', e);
      return false;
    }
  }, [user, addNotification]);

  // Admin Assign Tasks to User (25 tasks sequentially unlocked 1-by-1)
  const adminAssignTasksToUser = useCallback(async (userId, tasksToAssign = null, packageName = 'Standard 25 Package', resetCompleted = true) => {
    if (!userId) return false;
    try {
      const activeTasks = (tasks && tasks.length > 0 ? tasks : INITIAL_TASKS).filter(t => t.active !== false);
      let assignedTasks = Array.isArray(tasksToAssign) && tasksToAssign.length > 0 ? [...tasksToAssign] : [];

      if (assignedTasks.length === 0) {
        // Build 25 tasks from pool
        const pool = activeTasks.length >= 25 ? [...activeTasks] : [...INITIAL_TASKS];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        assignedTasks = pool.slice(0, 25);
      }

      const assignedTaskIds = assignedTasks.map(t => t.id);
      const count = assignedTasks.length;

      // Update adminUsers state
      setAdminUsers(prev => prev.map(u => {
        if (u.id === userId || String(u.id) === String(userId)) {
          return {
            ...u,
            assignedPackage: packageName,
            taskPackageStatus: 'assigned',
            taskPackageRequested: false,
            taskRequestId: null,
            pendingTasks: count,
            completedTasks: resetCompleted ? 0 : (u.completedTasks || 0),
            dailyQuota: count,
            dailyCompleted: resetCompleted ? 0 : (u.dailyCompleted || 0),
            assignedTasks,
            assignedTaskIds
          };
        }
        return u;
      }));

      // Cache assigned tasks in local storage
      try {
        localStorage.setItem(`websynx_user_assigned_tasks_${userId}`, JSON.stringify(assignedTasks));
        const currentAdminUsers = JSON.parse(localStorage.getItem('websynx_admin_users') || '[]');
        const updatedAdminUsers = currentAdminUsers.map(u => {
          if (u.id === userId || String(u.id) === String(userId)) {
            return {
              ...u,
              assignedPackage: packageName,
              taskPackageStatus: 'assigned',
              taskPackageRequested: false,
              taskRequestId: null,
              pendingTasks: count,
              completedTasks: resetCompleted ? 0 : (u.completedTasks || 0),
              dailyQuota: count,
              dailyCompleted: resetCompleted ? 0 : (u.dailyCompleted || 0),
              assignedTasks,
              assignedTaskIds
            };
          }
          return u;
        });
        localStorage.setItem('websynx_admin_users', JSON.stringify(updatedAdminUsers));
      } catch (e) {}

      // If active session is the target user, update immediately
      if (user && (user.id === userId || String(user.id) === String(userId))) {
        const updatedUser = {
          ...user,
          assignedPackage: packageName,
          taskPackageStatus: 'assigned',
          taskPackageRequested: false,
          taskRequestId: null,
          pendingTasks: count,
          completedTasks: resetCompleted ? 0 : (user.completedTasks || 0),
          dailyQuota: count,
          dailyCompleted: resetCompleted ? 0 : (user.dailyCompleted || 0),
          assignedTasks,
          assignedTaskIds
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('websynx_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      // Add system record
      const pkgCode = `PKG-${Date.now().toString().slice(-6)}`;
      const targetUser = adminUsers.find(u => u.id === userId || String(u.id) === String(userId));
      const newRecord = {
        id: pkgCode,
        code: pkgCode,
        type: `${packageName} Assigned`,
        category: 'Tasks',
        amount: 0.00,
        currency: 'USDT',
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'Completed',
        note: `Admin assigned ${count} sequential campaign tasks (${packageName})`,
        userId,
        userName: targetUser?.name || 'Member',
        network: 'System'
      };
      setRecords(prev => {
        const next = [newRecord, ...prev];
        try {
          localStorage.setItem('websynx_records', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // Window event for multi-tab reflection
      try {
        window.dispatchEvent(new CustomEvent('ecomx_tasks_assigned', {
          detail: { userId, tasks: assignedTasks, packageName, resetCompleted }
        }));
      } catch (e) {}

      // Send in-app notification to member
      sendUserNotification(userId, {
        title: 'New Task Package Assigned',
        message: `Admin assigned your ${count}-task campaign (${packageName}). Tasks unlock 1 by 1 as you submit each review!`,
        type: 'success'
      });

      // Save to backend database API
      try {
        await api.assignTasksToUser(userId, assignedTasks, packageName, resetCompleted);
      } catch (err) {
        console.warn('api.assignTasksToUser error, local state retained:', err);
      }

      addNotification('Tasks Assigned', `Successfully assigned ${count} tasks (${packageName}) to ${targetUser?.name || 'user'}.`);
      return true;
    } catch (e) {
      console.error('adminAssignTasksToUser error:', e);
      return false;
    }
  }, [tasks, user, adminUsers, addNotification, sendUserNotification]);

  // Admin Assigns a Task Package (201, 301, etc.)
  const adminAssignPackage = useCallback(async (userId, packageId = '201') => {
    return adminAssignTasksToUser(userId, null, `Package ${packageId}`, true);
  }, [adminAssignTasksToUser]);

  // Admin Bulk Assign Package (201, 301, etc.) to multiple users
  const adminBulkAssignPackage = useCallback(async (userIds, packageId = '201') => {
    if (!userIds || userIds.length === 0) return false;
    try {
      for (const uid of userIds) {
        await adminAssignTasksToUser(uid, null, `Package ${packageId}`, true);
      }
      return true;
    } catch (e) {
      console.error('adminBulkAssignPackage error:', e);
      return false;
    }
  }, [adminAssignTasksToUser]);

  // Admin Assigns Random Tasks to a user (default 25 tasks)
  const adminAssignRandomTasks = useCallback(async (userId, count = 25) => {
    return adminAssignTasksToUser(userId, null, count === 25 ? 'Standard 25 Package' : `Random ${count} Package`, true);
  }, [adminAssignTasksToUser]);

  // Admin Bulk Assign Random Tasks (default 25 tasks) to multiple users
  const adminBulkAssignRandomTasks = useCallback(async (userIds, count = 25) => {
    if (!userIds || userIds.length === 0) return false;
    try {
      const activeTasks = (tasks && tasks.length > 0 ? tasks : INITIAL_TASKS).filter(t => t.active !== false);
      const targetSet = new Set(userIds);

      setAdminUsers(prev => prev.map(u => {
        if (targetSet.has(u.id)) {
          const pool = [...(activeTasks.length >= count ? activeTasks : INITIAL_TASKS)];
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          const userAssigned = pool.slice(0, count);
          return {
            ...u,
            assignedPackage: `Random ${count} Package`,
            taskPackageStatus: 'assigned',
            taskPackageRequested: false,
            pendingTasks: count,
            completedTasks: 0,
            dailyQuota: count,
            dailyCompleted: 0,
            assignedTasks: userAssigned,
            assignedTaskIds: userAssigned.map(t => t.id)
          };
        }
        return u;
      }));

      if (user && targetSet.has(user.id)) {
        const pool = [...(activeTasks.length >= count ? activeTasks : INITIAL_TASKS)];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const userAssigned = pool.slice(0, count);
        const updatedUser = {
          ...user,
          assignedPackage: `Random ${count} Package`,
          taskPackageStatus: 'assigned',
          taskPackageRequested: false,
          pendingTasks: count,
          completedTasks: 0,
          dailyQuota: count,
          dailyCompleted: 0,
          assignedTasks: userAssigned,
          assignedTaskIds: userAssigned.map(t => t.id)
        };
        setUser(updatedUser);
        localStorage.setItem('websynx_user', JSON.stringify(updatedUser));
      }

      const recordsToAdd = userIds.map((uid, idx) => ({
        id: `RND-${Date.now()}-${idx}`,
        code: `RND-${Math.floor(100000 + Math.random() * 900000)}`,
        type: `${count} Random Tasks Assigned`,
        category: 'Tasks',
        amount: 0.00,
        currency: 'USDT',
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'Completed',
        note: `Bulk assigned ${count} random tasks ready to complete`,
        userId: uid,
        network: 'System'
      }));

      setRecords(prev => {
        const next = [...recordsToAdd, ...prev];
        localStorage.setItem('websynx_records', JSON.stringify(next));
        return next;
      });

      for (const uid of userIds) {
        api.updateUser(uid, {
          assignedPackage: `Random ${count} Package`,
          taskPackageStatus: 'assigned',
          taskPackageRequested: false,
          pendingTasks: count,
          completedTasks: 0,
          dailyQuota: count,
          dailyCompleted: 0
        }).catch(() => {});
      }

      addNotification('Bulk Random Assigned', `Assigned ${count} random tasks to ${userIds.length} users.`);
      return true;
    } catch (e) {
      console.error('adminBulkAssignRandomTasks error:', e);
      return false;
    }
  }, [tasks, user, addNotification]);

  // Admin Assign Specific Task to a User
  const adminAssignSpecificTask = useCallback(async (userId, taskObj) => {
    if (!userId || !taskObj) return false;
    try {
      const targetUser = adminUsers.find(u => u.id === userId || String(u.id) === String(userId));
      const existingAssigned = Array.isArray(targetUser?.assignedTasks) ? [...targetUser.assignedTasks] : [];
      const updatedAssigned = [taskObj, ...existingAssigned.filter(t => String(t.id) !== String(taskObj.id))];
      const pkgName = targetUser?.assignedPackage || 'Custom Package';

      setAdminUsers(prev => prev.map(u => {
        if (u.id === userId || String(u.id) === String(userId)) {
          return {
            ...u,
            assignedPackage: pkgName,
            taskPackageStatus: 'assigned',
            taskPackageRequested: false,
            pendingTasks: updatedAssigned.length,
            dailyQuota: Math.max(u.dailyQuota || 25, updatedAssigned.length),
            assignedTasks: updatedAssigned,
            assignedTaskIds: updatedAssigned.map(t => t.id)
          };
        }
        return u;
      }));

      // Cache assigned tasks in local storage
      try {
        localStorage.setItem(`websynx_user_assigned_tasks_${userId}`, JSON.stringify(updatedAssigned));
      } catch (e) {}

      if (user && (user.id === userId || String(user.id) === String(userId))) {
        const updatedUser = {
          ...user,
          assignedPackage: pkgName,
          taskPackageStatus: 'assigned',
          taskPackageRequested: false,
          pendingTasks: updatedAssigned.length,
          dailyQuota: Math.max(user.dailyQuota || 25, updatedAssigned.length),
          assignedTasks: updatedAssigned,
          assignedTaskIds: updatedAssigned.map(t => t.id)
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('websynx_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      // Add system record
      const pkgCode = `TSK-${Date.now().toString().slice(-6)}`;
      const newRecord = {
        id: pkgCode,
        code: pkgCode,
        type: `Task Assigned`,
        category: 'Tasks',
        amount: 0.00,
        currency: 'USDT',
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'Completed',
        note: `Admin assigned "${taskObj.title}"`,
        userId,
        userName: targetUser?.name || 'Member',
        network: 'System'
      };
      setRecords(prev => [newRecord, ...prev]);

      // Multi-tab event
      try {
        window.dispatchEvent(new CustomEvent('ecomx_tasks_assigned', {
          detail: { userId, tasks: updatedAssigned, packageName: pkgName, resetCompleted: false }
        }));
      } catch (e) {}

      // Notify member
      sendUserNotification(userId, {
        title: 'New Task Assigned',
        message: `Admin assigned a new promotional task: "${taskObj.title}" (${taskObj.platform || 'eBay'})`,
        type: 'success'
      });

      // Save to backend API
      try {
        await api.assignTasksToUser(userId, updatedAssigned, pkgName, false);
      } catch (err) {
        console.warn('api.assignTasksToUser error:', err);
      }

      addNotification('Task Assigned', `Assigned "${taskObj.title.substring(0, 24)}..." to ${targetUser?.name || 'user'}.`);
      return true;
    } catch (e) {
      console.error('adminAssignSpecificTask error:', e);
      return false;
    }
  }, [user, adminUsers, addNotification, sendUserNotification]);

  // Admin Restore Default Tasks (All 25 Learning Tasks + Catalogue)
  const adminRestoreDefaultTasks = useCallback(() => {
    setTasks(INITIAL_TASKS);
    try {
      localStorage.setItem('websynx_tasks', JSON.stringify(INITIAL_TASKS));
      const db = JSON.parse(localStorage.getItem('websynx_persistent_db_v2') || '{}');
      db.tasks = INITIAL_TASKS;
      localStorage.setItem('websynx_persistent_db_v2', JSON.stringify(db));
    } catch (e) {}
    addNotification('Tasks Restored', 'All 25 learning steps and standard catalogue tasks restored to default.');
  }, [addNotification]);

  // Admin Sends Payment Request / Top-Up Notice to Client
  const sendPaymentRequestToUser = useCallback(async (userId, amount = '50.00', note = 'Please top up your balance to unlock subsequent task batches.') => {
    try {
      const targetUser = adminUsers.find(u => u.id === userId);
      const reqId = `PREQ-${Date.now().toString().slice(-6)}`;
      const newRecord = {
        id: reqId,
        code: reqId,
        type: 'Payment Request Sent',
        category: 'Deposit',
        amount: parseFloat(amount) || 50.00,
        currency: 'USDT',
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'Pending',
        note: note || 'Payment request sent from admin to client',
        userId: userId,
        userName: targetUser?.name || 'User',
        network: 'TRC20'
      };

      setRecords(prev => {
        const next = [newRecord, ...prev];
        localStorage.setItem('websynx_records', JSON.stringify(next));
        return next;
      });

      addNotification('Payment Request Sent', `Payment request for ${amount} USDT sent to ${targetUser?.name || 'client'}.`);
      return true;
    } catch (e) {
      console.error('sendPaymentRequestToUser error:', e);
      return false;
    }
  }, [adminUsers, addNotification]);

  // Admin authentication state (Login is mandatory to access Admin Panel)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('websynx_admin_auth') === 'true';
  });

  // Account Creation / Registration
  const registerAccount = async (name, email, password, referralCode) => {
    const res = await api.register(name, email, password, referralCode);
    setUser(res.user);
    localStorage.setItem('websynx_user', JSON.stringify(res.user));
    localStorage.setItem('websynx_current_user_id', res.user.id);
    localStorage.removeItem('websynx_logged_out');
    setCurrentView('dashboard');
    setDashboardTab('home');
    addNotification('Account Created!', `Welcome to Ecomxstocks, ${res.user.name}!`);
    return res.user;
  };

  // Account Login
  const loginAccount = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    localStorage.setItem('websynx_user', JSON.stringify(res.user));
    localStorage.setItem('websynx_current_user_id', res.user.id);
    localStorage.removeItem('websynx_logged_out');
    setCurrentView('dashboard');
    setDashboardTab('home');
    addNotification('Logged In', `Welcome back, ${res.user.name}!`);
    return res.user;
  };

  // User Logout
  const logoutAccount = () => {
    localStorage.removeItem('websynx_user');
    localStorage.removeItem('websynx_current_user_id');
    localStorage.setItem('websynx_logged_out', 'true');
    setUser(GUEST_USER);
    setCurrentView('storefront');
    setModalType('auth');
    addNotification('Logged Out', 'Signed out of active account.');
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    const isAuthorizedAdminUser = 
      trimmedEmail === 'admin@devsynx.com' ||
      trimmedEmail === 'admin@ecomxstocks.com' ||
      trimmedEmail === 'admin@websynx.com' ||
      trimmedEmail === 'nadeem@websynx.devsynx.com' ||
      trimmedEmail === 'admin' ||
      trimmedEmail.startsWith('admin@');

    const isAuthorizedPass = 
      trimmedPass === 'admin123' ||
      trimmedPass === 'password123' ||
      trimmedPass === 'Allah512@@';

    if (isAuthorizedAdminUser && isAuthorizedPass) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('websynx_admin_auth', 'true');
      addNotification('Admin Verified', 'Master administrator session authorized.');
      return true;
    }

    try {
      const res = await api.login(trimmedEmail, trimmedPass);
      if (res && res.user && (res.user.role === 'admin' || (res.user.email && res.user.email.toLowerCase().includes('admin')))) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('websynx_admin_auth', 'true');
        addNotification('Admin Verified', `Master administrator session authorized for ${res.user.name}.`);
        return true;
      } else {
        throw new Error('Access Denied: This account does not possess administrator credentials.');
      }
    } catch (err) {
      if (isAuthorizedAdminUser && isAuthorizedPass) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('websynx_admin_auth', 'true');
        addNotification('Admin Verified', 'Master administrator session authorized.');
        return true;
      }
      throw err;
    }
  };

  // Admin Logout
  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('websynx_admin_auth');
    addNotification('Admin Session Locked', 'Administrator session locked.');
  };

  // Switch Active User (e.g. between Noah, Alexander, etc.)
  const switchUser = (selectedUserId) => {
    const target = adminUsers.find(u => u.id === selectedUserId);
    if (target) {
      setUser(target);
      localStorage.setItem('websynx_user', JSON.stringify(target));
      localStorage.setItem('websynx_current_user_id', target.id);
      localStorage.removeItem('websynx_logged_out');
      addNotification('Switched Account', `Now operating as ${target.name} (${target.vipLevel || target.vipTier || 'eBay'} Tier)`);
    }
  };

  // Update System Deposit Accounts Gateway
  const updateSystemDepositAccounts = (newAccounts) => {
    setSystemDepositAccounts(newAccounts);
    localStorage.setItem('websynx_system_deposit_accounts', JSON.stringify(newAccounts));
    addNotification('Gateway Settings Updated', 'Deposit receiving addresses & banking details updated.');
  };

  // Direct Administrative Manual Deposit
  const adminManualDeposit = async (userId, amount, note = 'Admin Direct Deposit Credit', network = 'TRC20') => {
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) throw new Error('Invalid deposit amount');
    
    const targetUser = adminUsers.find(u => u.id === userId) || (user.id === userId ? user : null);
    const userName = targetUser ? targetUser.name : 'User Account';
    
    const rec = {
      id: `rec-dep-man-${Date.now()}`,
      code: `DEP-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      type: `${network} Direct Deposit`,
      category: 'Deposit',
      amount: parsedAmt,
      currency: 'USDT',
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Completed',
      note: note || 'Administrative balance credit',
      userId: userId,
      userName: userName,
      network: network,
      txHash: `0xAdminManual${Date.now()}`
    };

    setRecords(prev => [rec, ...prev]);

    if (targetUser) {
      const updated = {
        ...targetUser,
        balance: parseFloat(((targetUser.balance || 0) + parsedAmt).toFixed(2)),
        totalDeposit: parseFloat(((targetUser.totalDeposit || 0) + parsedAmt).toFixed(2))
      };
      setAdminUsers(prev => prev.map(u => u.id === userId ? updated : u));
      if (userId === user.id) {
        setUser(updated);
      }
    }
    addNotification('Manual Deposit Credited', `+$${parsedAmt.toFixed(2)} USDT manual deposit credited to ${userName}.`);
    return rec;
  };

  // Admin Delete User Account
  const adminDeleteUser = async (userId) => {
    if (userId === user.id) {
      throw new Error('Cannot delete currently active user session.');
    }
    setAdminUsers(prev => prev.filter(u => u.id !== userId));
    addNotification('User Account Removed', `User ID ${userId} removed from system.`);
  };

  // Admin Open / Preview Task
  const openTaskPreview = (task) => {
    setSelectedTask(task);
    setModalType('task');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        records,
        tasks,
        setTasks,
        vipTiers,
        adminUsers,
        activityStream,
        systemDepositAccounts,
        updateSystemDepositAccounts,
        currentView,
        setCurrentView,
        dashboardTab,
        setDashboardTab,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        modalType,
        setModalType,
        selectedTask,
        setSelectedTask,
        openTaskPreview,
        notifications,
        addNotification,
        backendOnline,
        submitDeposit,
        claimDummyDeposit,
        submitWithdrawal,
        completeTask,
        adminApproveDeposit,
        adminRejectDeposit,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        adminUpdateUser,
        adminDeleteUser,
        adminManualDeposit,
        adminAddTask,
        adminUpdateTask,
        adminDeleteTask,
        adminUpdateTier,
        resetDemoData,
        registerAccount,
        loginAccount,
        logoutAccount,
        userTeam,
        setUserTeam,
        fetchUserTeam,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        switchUser,
        isLoggedIn,
        activePlatform,
        setActivePlatform,
        openPlatformTasks,
        recordsSubTab,
        setRecordsSubTab,
        recordsStatusFilter,
        setRecordsStatusFilter,
        openRecordsTab,
        requestTaskPackage,
        cancelTaskPackageRequest,
        adminAssignPackage,
        adminBulkAssignPackage,
        adminAssignRandomTasks,
        adminBulkAssignRandomTasks,
        adminAssignSpecificTask,
        adminAssignTasksToUser,
        sendUserNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        unreadNotificationsCount,
        adminRestoreDefaultTasks,
        sendPaymentRequestToUser,
        supportSettings,
        updateSupportSettings,
        depositRefreshNotice,
        setDepositRefreshNotice,
        refreshUserBalance,
        isRefreshingBalance
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
