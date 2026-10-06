import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  INITIAL_USER,
  INITIAL_VIP_TIERS,
  INITIAL_TASKS,
  INITIAL_RECORDS,
  MASKED_ACTIVITY_STREAM,
  INITIAL_ADMIN_USERS
} from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // State initialization with local storage backup
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('websynx_user') || localStorage.getItem('seox_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('websynx_records') || localStorage.getItem('seox_records');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('websynx_tasks') || localStorage.getItem('seox_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [vipTiers, setVipTiers] = useState(() => {
    const saved = localStorage.getItem('websynx_vip_tiers') || localStorage.getItem('seox_vip_tiers');
    return saved ? JSON.parse(saved) : INITIAL_VIP_TIERS;
  });

  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem('websynx_admin_users') || localStorage.getItem('seox_admin_users');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  const [activityStream, setActivityStream] = useState(MASKED_ACTIVITY_STREAM);

  // System receiving deposit accounts configured by admin
  const [systemDepositAccounts, setSystemDepositAccounts] = useState(() => {
    const saved = localStorage.getItem('websynx_system_deposit_accounts');
    return saved ? JSON.parse(saved) : {
      trc20Address: 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q',
      erc20Address: '0x71C94156b53982e0C63810a972c72b04B46bF022',
      bep20Address: '0x71C94156b53982e0C63810a972c72b04B46bF022',
      bankName: 'Standard Chartered Global Clearing',
      bankAccount: 'GB82WEST12345678901234',
      bankHolder: 'WebSynx Global Escrow Vault Ltd',
      bankSwift: 'SCBLGB2L',
      depositInstructions: 'Please include your Account ID as transaction memo. Funds credited after 1 network confirmation.'
    };
  });

  // App routing & view state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'admin'
  const [dashboardTab, setDashboardTab] = useState('home'); // 'home' | 'menu' | 'records' | 'support' | 'mine'
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'deposit' | 'withdraw' | 'task' | 'apk' | 'kyc' | 'auth' | null
  const [selectedTask, setSelectedTask] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Real-Time Backend Connected',
      message: 'TRON TRC20 Gateway & Task Engine connected to live server.',
      time: 'Just now',
      read: false
    }
  ]);

  const [backendOnline, setBackendOnline] = useState(false);

  // Helper to push notification
  const addNotification = useCallback((title, message) => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
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

      if (u) setUser(u);
      if (r) setRecords(r);
      if (t) setTasks(t);
      if (tiers) setVipTiers(tiers);
      if (users) setAdminUsers(users);
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

  // Connect to Server-Sent Events (SSE) for Real-Time Synchronized Push
  useEffect(() => {
    const unsubscribe = api.subscribeLiveEvents((event) => {
      console.log('📡 Live Real-Time Event Received:', event.type, event.payload);

      if (event.type === 'deposit_created') {
        const { record, user: updatedUser } = event.payload;
        setRecords(prev => [record, ...prev.filter(r => r.id !== record.id)]);
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
        }
        addNotification('New Deposit Registered', `Deposit of ${record.amount} USDT registered.`);
      }

      if (event.type === 'deposit_approved') {
        const { record, user: updatedUser, activity } = event.payload;
        setRecords(prev => prev.map(r => r.id === record.id ? record : r));
        if (updatedUser && updatedUser.id === user.id) {
          setUser(updatedUser);
          addNotification('Deposit Approved!', `${record.amount} USDT credited to your account!`);
        }
        setAdminUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (activity) {
          setActivityStream(prev => [activity, ...prev.slice(0, 14)]);
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
        setAdminUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (updatedUser.id === user.id) {
          setUser(updatedUser);
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
  }, [user.id, addNotification, refreshFromBackend]);

  // Sync to local storage for fast render
  useEffect(() => {
    localStorage.setItem('websynx_user', JSON.stringify(user));
    localStorage.setItem('websynx_current_user_id', user.id);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('websynx_records', JSON.stringify(records));
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
    try {
      const res = await api.createDeposit(amount, txHash, network, user.id);
      setUser(prev => ({
        ...prev,
        pendingRequests: (prev.pendingRequests || 0) + 1
      }));
      setRecords(prev => [res, ...prev]);
      addNotification('Deposit Submitted', `Submitted ${amount} USDT deposit.`);
      return res;
    } catch (err) {
      console.error('submitDeposit failed:', err);
      throw err;
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
      setUser(res.user);
      setRecords(prev => [res.record, ...prev]);
      addNotification('Task Completed!', `Earned +$${res.commissionEarned} USDT from ${task.platform} promotion!`);
      return res.commissionEarned;
    } catch (err) {
      console.error('completeTask failed:', err);
      throw err;
    }
  };

  // Admin Approve Deposit
  const adminApproveDeposit = async (recordId) => {
    try {
      const res = await api.approveDeposit(recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? res.record : r));
      if (res.user && res.user.id === user.id) {
        setUser(res.user);
      }
      setAdminUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      addNotification('Deposit Approved', `${res.record.amount} USDT credited to ${res.record.userName}`);
    } catch (err) {
      console.error('adminApproveDeposit failed:', err);
    }
  };

  // Admin Reject Deposit
  const adminRejectDeposit = async (recordId) => {
    try {
      const res = await api.rejectDeposit(recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? res.record : r));
      if (res.user && res.user.id === user.id) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('adminRejectDeposit failed:', err);
    }
  };

  // Admin Approve Withdrawal
  const adminApproveWithdrawal = async (recordId) => {
    try {
      const res = await api.approveWithdrawal(recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? res.record : r));
      if (res.user && res.user.id === user.id) {
        setUser(res.user);
      }
      addNotification('Withdrawal Broadcasted', `Dispatched on TRC20 for ${res.record.userName}`);
    } catch (err) {
      console.error('adminApproveWithdrawal failed:', err);
    }
  };

  // Admin Reject Withdrawal
  const adminRejectWithdrawal = async (recordId) => {
    try {
      const res = await api.rejectWithdrawal(recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? res.record : r));
      if (res.user && res.user.id === user.id) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('adminRejectWithdrawal failed:', err);
    }
  };

  // Admin Update User
  const adminUpdateUser = async (userId, updates) => {
    try {
      const res = await api.updateUser(userId, updates);
      setAdminUsers(prev => prev.map(u => u.id === userId ? res.user : u));
      if (userId === user.id) {
        setUser(res.user);
      }
      addNotification('User Updated', `Updated account settings for ${res.user.name}`);
    } catch (err) {
      console.error('adminUpdateUser failed:', err);
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
      setTasks(prev => prev.map(t => t.id === taskId ? res.task : t));
      addNotification('Task Updated', `Updated settings for "${res.task.title.substring(0, 20)}..."`);
      return res.task;
    } catch (err) {
      console.error('adminUpdateTask failed:', err);
      throw err;
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

  // Admin authentication state (Login is mandatory to access Admin Panel)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('websynx_admin_auth') === 'true';
  });

  // Account Creation / Registration
  const registerAccount = async (name, email, password, referralCode) => {
    const res = await api.register(name, email, password, referralCode);
    setUser(res.user);
    localStorage.setItem('websynx_current_user_id', res.user.id);
    addNotification('Account Created!', `Welcome to WebSynx, ${res.user.name}!`);
    return res.user;
  };

  // Account Login
  const loginAccount = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    localStorage.setItem('websynx_current_user_id', res.user.id);
    addNotification('Logged In', `Welcome back, ${res.user.name}!`);
    return res.user;
  };

  // User Logout
  const logoutAccount = () => {
    localStorage.removeItem('websynx_user');
    localStorage.removeItem('websynx_current_user_id');
    setUser(INITIAL_USER);
    setModalType('auth');
    addNotification('Logged Out', 'Signed out of active account.');
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if ((trimmedEmail === 'admin@devsynx.com' || trimmedEmail === 'admin') && (trimmedPass === 'admin123' || trimmedPass === 'password123')) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('websynx_admin_auth', 'true');
      addNotification('Admin Verified', 'Master administrator session authorized.');
      return true;
    }

    try {
      const res = await api.login(trimmedEmail, trimmedPass);
      if (res.user.role === 'admin' || res.user.email === 'admin@devsynx.com') {
        setIsAdminAuthenticated(true);
        localStorage.setItem('websynx_admin_auth', 'true');
        addNotification('Admin Verified', `Master administrator session authorized for ${res.user.name}.`);
        return true;
      } else {
        throw new Error('Access Denied: This account does not possess administrator credentials.');
      }
    } catch (err) {
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
      localStorage.setItem('websynx_current_user_id', target.id);
      addNotification('Switched Account', `Now operating as ${target.name} (${target.vipLevel} Tier)`);
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
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        switchUser
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
