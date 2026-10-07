import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Users,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Settings,
  Layers,
  Database,
  AlertTriangle,
  Award,
  Zap,
  Lock,
  ChevronRight,
  Sliders,
  DollarSign,
  QrCode,
  Landmark,
  CreditCard,
  ExternalLink,
  Eye,
  Check,
  Copy,
  Sparkles,
  UserCheck,
  Key,
  Menu,
  X,
  LayoutDashboard,
  MessageCircle,
  Gift,
  FileText,
  CheckSquare,
  Share2
} from 'lucide-react';
import { getProductUrl, openProductUrl } from '../utils/productUrl';
import AdminSupportPanel, { useSupportChats } from '../components/AdminSupportPanel';

export default function AdminView() {
  const {
    records,
    tasks,
    vipTiers,
    adminUsers,
    user,
    systemDepositAccounts,
    updateSystemDepositAccounts,
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
    claimDummyDeposit,
    adminUpdateTier,
    resetDemoData,
    registerAccount,
    addNotification,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    openTaskPreview,
    switchUser,
    setCurrentView,
    setDashboardTab
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('overview'); // 'overview' | 'deposits' | 'withdrawals' | 'users' | 'tasks' | 'gateways' | 'tiers' | 'audit' | 'support'
  const supportState = useSupportChats();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'learning' | 'restricted' | 'eBay' | 'Walmart' | 'Temu'

  // Admin login gate states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Manual Direct Deposit Modal State
  const [showManualDepositModal, setShowManualDepositModal] = useState(false);
  const [manualDepositData, setManualDepositData] = useState({
    userId: adminUsers[0]?.id || user.id,
    amount: '100.00',
    network: 'TRC20',
    note: 'Administrative Account Balance Top-Up'
  });

  // Gateway / System Deposit Accounts Form State
  const [gatewayForm, setGatewayForm] = useState(() => ({
    trc20Address: systemDepositAccounts?.trc20Address || 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q',
    erc20Address: systemDepositAccounts?.erc20Address || '0x71C94156b53982e0C63810a972c72b04B46bF022',
    bep20Address: systemDepositAccounts?.bep20Address || '0x71C94156b53982e0C63810a972c72b04B46bF022',
    bankName: systemDepositAccounts?.bankName || 'Standard Chartered Global Clearing',
    bankAccount: systemDepositAccounts?.bankAccount || 'GB82WEST12345678901234',
    bankHolder: systemDepositAccounts?.bankHolder || 'WebSynx Global Escrow Vault Ltd',
    bankSwift: systemDepositAccounts?.bankSwift || 'SCBLGB2L',
    depositInstructions: systemDepositAccounts?.depositInstructions || 'Please include your Account ID as transfer memo.'
  }));
  const [gatewaySavedMsg, setGatewaySavedMsg] = useState(false);

  // Detailed Withdrawal Dispatch Modal State
  const [dispatchModalRecord, setDispatchModalRecord] = useState(null);
  const [dispatchTxHash, setDispatchTxHash] = useState('');

  // Detailed Withdrawal Reject Modal State
  const [rejectModalRecord, setRejectModalRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState('Invalid or unverified TRON TRC20 wallet address');

  // New task form state (supports all 25 learning steps)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    platform: 'eBay',
    category: 'Flash Deals',
    price: 99.00,
    commissionRate: 4.0,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
    tag: 'Featured',
    description: 'Promotional sponsored product listing.',
    requiredDeposit: 0.00,
    isLearning: false,
    learningStep: 1,
    active: true,
    productUrl: ''
  });

  // Edit task modal state
  const [editingTask, setEditingTask] = useState(null);

  // User management modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: 'password123',
    vipLevel: 'eBay',
    startingBalance: '0.00',
    walletAddress: '',
    referralCode: '505282'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [editTier, setEditTier] = useState('eBay');
  const [editStatus, setEditStatus] = useState('Active');
  const [editWalletAddress, setEditWalletAddress] = useState('');
  const [editKyc, setEditKyc] = useState('Verified');
  const [editReferralCode, setEditReferralCode] = useState('');
  const [editInvitedByCode, setEditInvitedByCode] = useState('');
  const [editPendingTasks, setEditPendingTasks] = useState('25');
  const [editCompletedTasks, setEditCompletedTasks] = useState('0');
  const [editDailyQuota, setEditDailyQuota] = useState('25');

  // Inspect User Record & Dossier Modal
  const [inspectingUser, setInspectingUser] = useState(null);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');

  // Stats calculation
  const pendingDeposits = records.filter(r => r.category === 'Deposit' && r.status === 'Pending');
  const pendingWithdrawals = records.filter(r => r.category === 'Withdrawal' && r.status === 'Pending');
  const totalCompletedDeposits = records
    .filter(r => r.category === 'Deposit' && r.status === 'Completed')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalCompletedWithdrawals = records
    .filter(r => r.category === 'Withdrawal' && r.status === 'Completed')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const totalCompletedTasks = records.filter(r => r.category === 'Ad Tasks').length;

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setAdminAuthError('');
    setAdminAuthLoading(true);
    try {
      await adminLogin(adminEmail, adminPassword);
      setAdminAuthLoading(false);
    } catch (err) {
      setAdminAuthError(err.message || 'Invalid administrator security credentials');
      setAdminAuthLoading(false);
    }
  };

  const handleFillMasterAdmin = () => {
    setAdminEmail('admin@devsynx.com');
    setAdminPassword('admin123');
    setAdminAuthError('');
  };

  const handleAdminCreateUser = async (e) => {
    e.preventDefault();
    try {
      const created = await registerAccount(
        newUserData.name,
        newUserData.email,
        newUserData.password,
        newUserData.referralCode
      );
      if (
        parseFloat(newUserData.startingBalance) > 0 ||
        newUserData.vipLevel !== 'eBay' ||
        newUserData.walletAddress
      ) {
        await adminUpdateUser(created.id, {
          balance: parseFloat(newUserData.startingBalance || 0),
          vipLevel: newUserData.vipLevel,
          walletAddress: newUserData.walletAddress || created.walletAddress
        });
      }
      setShowAddUserModal(false);
      setNewUserData({
        name: '',
        email: '',
        password: 'password123',
        vipLevel: 'eBay',
        startingBalance: '0.00',
        walletAddress: '',
        referralCode: '505282'
      });
      addNotification('User Provisioned', `New user ${created.name} successfully registered.`);
    } catch (err) {
      alert('Error creating user account: ' + err.message);
    }
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    adminUpdateUser(editingUser.id, {
      balance: parseFloat(editBalance) || 0,
      vipLevel: editTier,
      vipTier: editTier,
      status: editStatus,
      walletAddress: editWalletAddress,
      kyc: editKyc,
      kycStatus: editKyc,
      referralCode: editReferralCode,
      code: editReferralCode,
      invitedByCode: editInvitedByCode,
      referredByCode: editInvitedByCode,
      pendingTasks: parseInt(editPendingTasks, 10) || 0,
      completedTasks: parseInt(editCompletedTasks, 10) || 0,
      dailyQuota: parseInt(editDailyQuota, 10) || 25,
      dailyCompleted: parseInt(editCompletedTasks, 10) || 0
    });
    setEditingUser(null);
    addNotification('User Updated', `Updated account settings and task quota for ${editingUser.name}`);
  };

  const handleDeleteUserClick = (userId, userName) => {
    if (window.confirm(`Are you sure you want to permanently delete user account "${userName}"?`)) {
      try {
        adminDeleteUser(userId);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleManualDepositSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminManualDeposit(
        manualDepositData.userId,
        manualDepositData.amount,
        manualDepositData.note,
        manualDepositData.network
      );
      setShowManualDepositModal(false);
      setManualDepositData({
        userId: adminUsers[0]?.id || user.id,
        amount: '100.00',
        network: 'TRC20',
        note: 'Administrative Account Balance Top-Up'
      });
    } catch (err) {
      alert('Manual deposit failed: ' + err.message);
    }
  };

  const handleSaveGatewayAccounts = (e) => {
    e.preventDefault();
    updateSystemDepositAccounts(gatewayForm);
    setGatewaySavedMsg(true);
    setTimeout(() => setGatewaySavedMsg(false), 3000);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await adminAddTask({
        ...newTask,
        price: parseFloat(newTask.price),
        commissionRate: parseFloat(newTask.commissionRate),
        requiredDeposit: parseFloat(newTask.requiredDeposit || 0),
        isLearning: Boolean(newTask.isLearning),
        learningStep: newTask.isLearning ? parseInt(newTask.learningStep || 1) : null,
        active: Boolean(newTask.active),
        productUrl: newTask.productUrl ? newTask.productUrl.trim() : null
      });
      setShowAddTaskModal(false);
      setNewTask({
        title: '',
        platform: 'eBay',
        category: 'Flash Deals',
        price: 99.00,
        commissionRate: 4.0,
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
        tag: 'Featured',
        description: 'Promotional sponsored product listing.',
        requiredDeposit: 0.00,
        isLearning: false,
        learningStep: 1,
        active: true,
        productUrl: ''
      });
    } catch (err) {
      alert('Error creating task: ' + err.message);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await adminUpdateTask(editingTask.id, {
        title: editingTask.title,
        platform: editingTask.platform,
        category: editingTask.category,
        price: parseFloat(editingTask.price),
        commissionRate: parseFloat(editingTask.commissionRate),
        requiredDeposit: parseFloat(editingTask.requiredDeposit || 0),
        isLearning: Boolean(editingTask.isLearning),
        learningStep: editingTask.isLearning ? parseInt(editingTask.learningStep || 1) : null,
        image: editingTask.image,
        tag: editingTask.tag,
        description: editingTask.description,
        active: Boolean(editingTask.active),
        productUrl: editingTask.productUrl ? editingTask.productUrl.trim() : null
      });
      setEditingTask(null);
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (window.confirm(`Are you sure you want to remove the task "${taskTitle}"?`)) {
      try {
        await adminDeleteTask(taskId);
      } catch (err) {
        alert('Error deleting task: ' + err.message);
      }
    }
  };

  const handleToggleTaskActive = async (t) => {
    try {
      await adminUpdateTask(t.id, { active: !t.active });
    } catch (err) {
      alert('Error toggling task status: ' + err.message);
    }
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    addNotification('System Broadcast', broadcastText);
    alert(`Broadcast sent to all active users: "${broadcastText}"`);
    setBroadcastText('');
  };

  const handleConfirmWithdrawalDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchModalRecord) return;
    try {
      await adminApproveWithdrawal(dispatchModalRecord.id);
      setDispatchModalRecord(null);
      setDispatchTxHash('');
    } catch (err) {
      alert('Failed to dispatch withdrawal: ' + err.message);
    }
  };

  const handleConfirmWithdrawalReject = async (e) => {
    e.preventDefault();
    if (!rejectModalRecord) return;
    try {
      await adminRejectWithdrawal(rejectModalRecord.id);
      setRejectModalRecord(null);
      setRejectReason('Invalid or unverified TRON TRC20 wallet address');
    } catch (err) {
      alert('Failed to reject withdrawal: ' + err.message);
    }
  };

  // ==========================================
  // ADMIN AUTHENTICATION GUARD (MANDATORY LOGIN TO ACCESS ADMIN)
  // ==========================================
  if (!isAdminAuthenticated) {
    return (
      <div className="admin-login-wrapper animate-fade-in">
        <div className="admin-login-card">
          <div className="admin-login-shield-badge">
            <ShieldCheck size={36} color="#2563eb" />
          </div>
          <span className="admin-security-tag">🔒 RESTRICTED PORTAL — ADMINISTRATORS ONLY</span>
          <h2>DEVSYNX Operations Admin Control</h2>
          <p className="admin-login-desc">
            Sign in with verified administrator credentials to access financial records, user ledger, task configuration, and ledger approvals.
          </p>

          {adminAuthError && (
            <div className="admin-error-box mt-3 animate-fade-in">
              <AlertTriangle size={16} />
              <span>{adminAuthError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="admin-login-form mt-4">
            <div className="input-group">
              <label className="input-label">Admin Email Address</label>
              <input
                type="email"
                placeholder="admin@devsynx.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="text-input-field"
                required
              />
            </div>

            <div className="input-group mt-3">
              <div className="flex items-center justify-between">
                <label className="input-label">Admin Security Key / Password</label>
                <button
                  type="button"
                  className="text-xs text-primary-brand font-bold"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                >
                  {showAdminPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showAdminPass ? "text" : "password"}
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="text-input-field"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-4 py-3 font-bold"
              disabled={adminAuthLoading}
            >
              {adminAuthLoading ? 'Verifying Security Clearance...' : 'Authorize & Unlock Admin Dashboard'}
            </button>
          </form>

          <div className="admin-login-quick-actions mt-4 pt-3 border-t">
            <button
              type="button"
              className="preset-btn w-full text-xs font-bold py-2"
              onClick={handleFillMasterAdmin}
            >
              👑 1-Click Fill Master Admin Credentials (admin@devsynx.com / admin123)
            </button>

            <button
              type="button"
              className="btn-outline w-full mt-2 text-xs py-2"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
            >
              ← Return to User App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-shell animate-fade-in">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="admin-sidebar-backdrop animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Modern Left Admin Sidebar */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="admin-sidebar-header">
          <div className="sidebar-brand-group">
            <div className="admin-brand-icon">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="sidebar-brand-title">Web<strong>Synx</strong></span>
                <span className="admin-ver-tag">ADMIN</span>
              </div>
              <span className="sidebar-brand-subtitle">Financial & Task Governance</span>
            </div>
          </div>
          <button 
            className="admin-sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Engine Status Strip */}
        <div className="admin-live-strip">
          <span className="live-pulse-dot"></span>
          <span className="live-strip-text">TRC20 Gateway • Auto-Reconcile</span>
        </div>

        {/* Sidebar Nav Links */}
        <div className="admin-sidebar-nav-scroll">
          {/* Section: Financial Ops */}
          <div className="admin-nav-section">
            <span className="nav-section-title">FINANCIAL OPERATIONS</span>
            <div className="nav-items-list">
              <button
                className={`admin-nav-item ${activeAdminTab === 'overview' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('overview');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <TrendingUp size={18} className="nav-item-icon" />
                <span>Platform Overview</span>
              </button>

              <button
                className={`admin-nav-item ${activeAdminTab === 'deposits' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('deposits');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Wallet size={18} className="nav-item-icon" />
                <span className="flex-1 text-left">Deposit Requests</span>
                {pendingDeposits.length > 0 && (
                  <span className="nav-badge alert">{pendingDeposits.length}</span>
                )}
              </button>

              <button
                className={`admin-nav-item ${activeAdminTab === 'withdrawals' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('withdrawals');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <ArrowUpRight size={18} className="nav-item-icon" />
                <span className="flex-1 text-left">Withdrawal Approvals</span>
                {pendingWithdrawals.length > 0 && (
                  <span className="nav-badge alert">{pendingWithdrawals.length}</span>
                )}
              </button>

              <button
                className={`admin-nav-item ${activeAdminTab === 'gateways' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('gateways');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Landmark size={18} className="nav-item-icon" />
                <span>Deposit & Payout Gateways</span>
              </button>
            </div>
          </div>

          {/* Section: User Management */}
          <div className="admin-nav-section mt-4">
            <span className="nav-section-title">USERS & LEDGER</span>
            <div className="nav-items-list">
              <button
                className={`admin-nav-item ${activeAdminTab === 'users' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('users');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Users size={18} className="nav-item-icon" />
                <span>User Accounts & Balances</span>
              </button>

              <button
                className="admin-nav-item quick-action"
                onClick={() => {
                  setShowManualDepositModal(true);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <DollarSign size={18} className="nav-item-icon" />
                <span>Direct Balance Credit</span>
              </button>
            </div>
          </div>

          {/* Section: Tasks & Engine */}
          <div className="admin-nav-section mt-4">
            <span className="nav-section-title">TASK POOL & VIP RULES</span>
            <div className="nav-items-list">
              <button
                className={`admin-nav-item ${activeAdminTab === 'tasks' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('tasks');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Layers size={18} className="nav-item-icon" />
                <span>Task Pool (25 Steps)</span>
              </button>

              <button
                className={`admin-nav-item ${activeAdminTab === 'tiers' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('tiers');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Sliders size={18} className="nav-item-icon" />
                <span>VIP Commission Rules</span>
              </button>
            </div>
          </div>

          {/* Section: Customer Support */}
          <div className="admin-nav-section mt-4">
            <span className="nav-section-title">CUSTOMER SUPPORT</span>
            <div className="nav-items-list">
              <button
                id="admin-nav-support"
                className={`admin-nav-item ${activeAdminTab === 'support' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('support');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <MessageCircle size={18} className="nav-item-icon" />
                <span className="flex-1 text-left">Live Chat & Support</span>
                {supportState.unreadTotal > 0 && (
                  <span className="nav-badge alert">{supportState.unreadTotal}</span>
                )}
              </button>
            </div>
          </div>

          {/* Section: Security & Audit */}
          <div className="admin-nav-section mt-4">
            <span className="nav-section-title">SYSTEM & SECURITY</span>
            <div className="nav-items-list">
              <button
                className={`admin-nav-item ${activeAdminTab === 'audit' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAdminTab('audit');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Database size={18} className="nav-item-icon" />
                <span>Audit Trail & System Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-profile-strip">
            <div className="admin-avatar-box">
              <span>S</span>
            </div>
            <div className="admin-profile-meta">
              <strong className="admin-profile-name">System Administrator</strong>
              <span className="admin-profile-role">👑 SuperAdmin Access</span>
            </div>
          </div>

          <div className="admin-footer-actions-grid mt-3">
            <button
              className="btn-sidebar-action"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
              title="Open User App Interface"
            >
              <ExternalLink size={13} />
              <span>User App</span>
            </button>
            <button
              className="btn-sidebar-action danger"
              onClick={resetDemoData}
              title="Reset Demo State"
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
            <button
              className="btn-sidebar-action warning"
              onClick={adminLogout}
              title="Lock Admin Session"
            >
              <Lock size={13} />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Canvas */}
      <main className="admin-main-canvas">
        {/* Admin Canvas Top Bar Header */}
        <header className="admin-canvas-header">
          <div className="canvas-header-left">
            <button
              className="admin-mobile-toggle-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Toggle Sidebar Menu"
            >
              <Menu size={20} />
            </button>

            <div className="admin-breadcrumb-group">
              <span className="breadcrumb-parent">Admin Console</span>
              <span className="breadcrumb-separator">/</span>
              <h2 className="breadcrumb-active">
                {activeAdminTab === 'overview' && 'Platform KPIs & Overview'}
                {activeAdminTab === 'deposits' && 'Deposit Requests & Proofs'}
                {activeAdminTab === 'withdrawals' && 'Withdrawal Approvals'}
                {activeAdminTab === 'users' && 'User Accounts & Balances'}
                {activeAdminTab === 'tasks' && 'Task Pool Manager (25 Steps)'}
                {activeAdminTab === 'gateways' && 'Deposit & Payout Gateways'}
                {activeAdminTab === 'tiers' && 'VIP Commission Rules'}
                {activeAdminTab === 'audit' && 'Audit Trail & Activity Logs'}
                {activeAdminTab === 'support' && 'Live Chat & Support Settings'}
              </h2>
            </div>
          </div>

          <div className="canvas-header-right">
            <button
              className="btn-quick-credit"
              onClick={() => setShowManualDepositModal(true)}
              title="Manual Account Balance Top-Up"
            >
              <DollarSign size={14} />
              <span>Manual Credit</span>
            </button>
            <button
              className="btn-quick-new-task"
              onClick={() => setShowAddTaskModal(true)}
              title="Create New Campaign Task"
            >
              <Plus size={14} />
              <span>New Task</span>
            </button>
          </div>
        </header>

        {/* Tab Canvas Content */}
        <div className="admin-canvas-content">
        {activeAdminTab === 'support' && (
          <AdminSupportPanel supportState={supportState} />
        )}
        {/* =========================================
            1. TAB: OVERVIEW / KPIS
        ========================================= */}
        {activeAdminTab === 'overview' && (
          <div className="admin-overview animate-fade-in">
            <div className="admin-kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon-wrap navy">
                  <Wallet size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Total Deposited Volume</span>
                  <strong className="kpi-val">${totalCompletedDeposits.toFixed(2)} <span className="kpi-unit">USDT</span></strong>
                  <span className="kpi-trend positive">TRON TRC20 Gateway</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap blue">
                  <ArrowUpRight size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Completed Withdrawals</span>
                  <strong className="kpi-val">${totalCompletedWithdrawals.toFixed(2)} <span className="kpi-unit">USDT</span></strong>
                  <span className="kpi-trend">Multi-Sig Approved</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap amber">
                  <Clock size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Pending Approval Queue</span>
                  <strong className="kpi-val">{pendingDeposits.length + pendingWithdrawals.length} <span className="kpi-unit">Requests</span></strong>
                  <span className="kpi-trend amber">{pendingDeposits.length} Dep / {pendingWithdrawals.length} Wth</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap green">
                  <Zap size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Tasks Completed Today</span>
                  <strong className="kpi-val">{totalCompletedTasks + user.completedTasks} <span className="kpi-unit">Tasks</span></strong>
                  <span className="kpi-trend positive">Active Task Pool</span>
                </div>
              </div>
            </div>

            {/* Quick Action Approval Section */}
            <div className="admin-quick-actions-row mt-6">
              <div className="quick-box">
                <div className="quick-box-header">
                  <h4>Pending Deposits Requiring Approval ({pendingDeposits.length})</h4>
                  <button className="link-action" onClick={() => setActiveAdminTab('deposits')}>View All</button>
                </div>
                {pendingDeposits.length === 0 ? (
                  <div className="empty-mini py-4 text-center text-muted">
                    <CheckCircle2 size={24} color="#10b981" />
                    <p className="mt-1">All deposits approved!</p>
                  </div>
                ) : (
                  <div className="pending-queue-list mt-2">
                    {pendingDeposits.map(dep => (
                      <div key={dep.id} className="pending-queue-row">
                        <div>
                          <strong>{dep.userName} ({dep.code})</strong>
                          <div className="text-muted text-xs">{dep.date} · {dep.network} · {dep.txHash}</div>
                        </div>
                        <div className="queue-right">
                          <strong className="text-green-success">+${dep.amount.toFixed(2)} USDT</strong>
                          <div className="btn-group-mini">
                            <button className="btn-approve-mini" onClick={() => adminApproveDeposit(dep.id)}>
                              Approve
                            </button>
                            <button className="btn-reject-mini" onClick={() => adminRejectDeposit(dep.id)}>
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="quick-box">
                <div className="quick-box-header">
                  <h4>Pending Withdrawals Requiring Approval ({pendingWithdrawals.length})</h4>
                  <button className="link-action" onClick={() => setActiveAdminTab('withdrawals')}>View All</button>
                </div>
                {pendingWithdrawals.length === 0 ? (
                  <div className="empty-mini py-4 text-center text-muted">
                    <CheckCircle2 size={24} color="#10b981" />
                    <p className="mt-1">No pending withdrawals.</p>
                  </div>
                ) : (
                  <div className="pending-queue-list mt-2">
                    {pendingWithdrawals.map(wth => (
                      <div key={wth.id} className="pending-queue-row">
                        <div>
                          <strong>{wth.userName} ({wth.code})</strong>
                          <div className="text-muted text-xs">Destination: {wth.destination}</div>
                        </div>
                        <div className="queue-right">
                          <strong className="text-red-danger">${Math.abs(wth.amount).toFixed(2)} USDT</strong>
                          <div className="btn-group-mini">
                            <button
                              className="btn-approve-mini"
                              onClick={() => {
                                setDispatchModalRecord(wth);
                                setDispatchTxHash(`0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`);
                              }}
                            >
                              Dispatch TX
                            </button>
                            <button
                              className="btn-reject-mini"
                              onClick={() => setRejectModalRecord(wth)}
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Broadcast Notice Form */}
            <div className="broadcast-card mt-6">
              <div className="broadcast-header">
                <Bell size={18} color="#2563eb" />
                <h4>Publish Global Platform Announcement</h4>
              </div>
              <form onSubmit={handleSendBroadcast} className="broadcast-form mt-3">
                <input
                  type="text"
                  placeholder="e.g. System upgrade scheduled for midnight. All deposits and task commissions running normally."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  className="text-input-field flex-1"
                />
                <button type="submit" className="btn-primary">
                  Broadcast Notice
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            2. TAB: DEPOSITS & MANUAL CREDITS
        ========================================= */}
        {activeAdminTab === 'deposits' && (
          <div className="admin-deposits animate-fade-in">
            <div className="admin-section-header">
              <div>
                <h3>USDT Deposit Transaction Monitoring</h3>
                <span className="text-muted">Review, approve on-chain confirmations, or manually credit user accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline"
                  onClick={() => setActiveAdminTab('gateways')}
                >
                  <Landmark size={15} />
                  <span>Configure Deposit Accounts</span>
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setShowManualDepositModal(true)}
                >
                  <Plus size={16} />
                  <span>Manual Direct Credit Deposit</span>
                </button>
              </div>
            </div>

            {/* Live Receiving Address Banner */}
            <div className="gateway-active-preview-card mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="badge-tech">ACTIVE TRC20 RECEIVING WALLET</span>
                  <code className="text-xs font-bold text-primary-brand">{systemDepositAccounts?.trc20Address}</code>
                </div>
                <span className="text-xs text-muted">Configured for user deposits</span>
              </div>
            </div>

            <div className="admin-table-card mt-4">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>User</th>
                    <th>Network</th>
                    <th>Amount</th>
                    <th>TX Hash</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.category === 'Deposit').map(rec => (
                    <tr key={rec.id}>
                      <td><code>{rec.code}</code></td>
                      <td><strong>{rec.userName}</strong></td>
                      <td><span className="badge-tech">{rec.network || 'TRC20'}</span></td>
                      <td className="text-green-success font-bold">+${rec.amount.toFixed(2)} USDT</td>
                      <td><code className="text-xs">{rec.txHash}</code></td>
                      <td>{rec.date}</td>
                      <td>
                        <span className={`status-pill ${(rec.status || 'Pending').toLowerCase()}`}>
                          {rec.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {rec.status === 'Pending' ? (
                          <div className="table-actions-group">
                            <button
                              className="btn-table-approve"
                              onClick={() => adminApproveDeposit(rec.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-table-reject"
                              onClick={() => adminRejectDeposit(rec.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">{rec.note}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MANUAL DIRECT CREDIT DEPOSIT MODAL */}
            {showManualDepositModal && (
              <div className="modal-overlay animate-fade-in" onClick={() => setShowManualDepositModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-md">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue">
                          <Plus size={18} />
                        </div>
                        <div>
                          <h3>Manual Direct Deposit Credit</h3>
                          <span className="sub-text">Directly credit funds to any registered user balance</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setShowManualDepositModal(false)}>✕</button>
                    </div>

                    <form onSubmit={handleManualDepositSubmit} className="mt-4">
                      <div className="input-group">
                        <label className="input-label">Select Target User Account</label>
                        <select
                          className="text-input-field"
                          value={manualDepositData.userId}
                          onChange={(e) => setManualDepositData({ ...manualDepositData, userId: e.target.value })}
                          required
                        >
                          {adminUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email}) — Bal: ${u.balance.toFixed(2)} USDT
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Deposit Amount ($ USDT)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            value={manualDepositData.amount}
                            onChange={(e) => setManualDepositData({ ...manualDepositData, amount: e.target.value })}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Method / Network</label>
                          <select
                            className="text-input-field"
                            value={manualDepositData.network}
                            onChange={(e) => setManualDepositData({ ...manualDepositData, network: e.target.value })}
                          >
                            <option value="TRC20">TRON (TRC20)</option>
                            <option value="ERC20">Ethereum (ERC20)</option>
                            <option value="BEP20">BNB Chain (BEP20)</option>
                            <option value="Bank Wire">Bank Wire Transfer</option>
                            <option value="Admin Adjustment">Admin Direct Bonus</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Administrative Memo / Reason</label>
                        <input
                          type="text"
                          value={manualDepositData.note}
                          onChange={(e) => setManualDepositData({ ...manualDepositData, note: e.target.value })}
                          className="text-input-field"
                          placeholder="e.g. VIP onboarding credit or OTC deposit confirmation"
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4">
                        Confirm & Credit USDT Instantly
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            3. TAB: WITHDRAWALS
        ========================================= */}
        {activeAdminTab === 'withdrawals' && (
          <div className="admin-withdrawals animate-fade-in">
            <div className="admin-section-header">
              <div>
                <h3>USDT Withdrawal Request Approvals</h3>
                <span className="text-muted">Multi-sig validation, compliance auditing, and TRON blockchain broadcasting</span>
              </div>
            </div>

            <div className="admin-table-card mt-4">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>User</th>
                    <th>Gross Amount</th>
                    <th>Net Dispatched</th>
                    <th>Destination Wallet</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.category === 'Withdrawal').length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-muted">
                        No withdrawal requests in ledger. Use the User App "Withdraw" button to test!
                      </td>
                    </tr>
                  ) : (
                    records.filter(r => r.category === 'Withdrawal').map(rec => (
                      <tr key={rec.id}>
                        <td><code>{rec.code}</code></td>
                        <td><strong>{rec.userName}</strong></td>
                        <td className="text-red-danger font-bold">${Math.abs(rec.amount).toFixed(2)} USDT</td>
                        <td><strong>${(rec.netAmount || Math.abs(rec.amount) - 1).toFixed(2)} USDT</strong></td>
                        <td><code className="text-xs">{rec.destination || user.walletAddress}</code></td>
                        <td>{rec.date}</td>
                        <td>
                          <span className={`status-pill ${(rec.status || 'Pending').toLowerCase()}`}>
                            {rec.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          {rec.status === 'Pending' ? (
                            <div className="table-actions-group">
                              <button
                                className="btn-table-approve"
                                onClick={() => {
                                  setDispatchModalRecord(rec);
                                  setDispatchTxHash(`0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`);
                                }}
                              >
                                Dispatch TX
                              </button>
                              <button
                                className="btn-table-reject"
                                onClick={() => setRejectModalRecord(rec)}
                              >
                                Reject & Refund
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted text-xs">{rec.txHash || rec.note}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* WITHDRAWAL DISPATCH MODAL */}
            {dispatchModalRecord && (
              <div className="modal-overlay animate-fade-in" onClick={() => setDispatchModalRecord(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-md">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue">
                          <ArrowUpRight size={18} />
                        </div>
                        <div>
                          <h3>Authorize & Dispatch Withdrawal</h3>
                          <span className="sub-text">Record: {dispatchModalRecord.code}</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setDispatchModalRecord(null)}>✕</button>
                    </div>

                    <form onSubmit={handleConfirmWithdrawalDispatch} className="mt-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <div className="flex justify-between text-xs py-1">
                          <span className="text-muted">User Name:</span>
                          <strong>{dispatchModalRecord.userName}</strong>
                        </div>
                        <div className="flex justify-between text-xs py-1">
                          <span className="text-muted">Gross Amount:</span>
                          <strong className="text-red-danger">${Math.abs(dispatchModalRecord.amount).toFixed(2)} USDT</strong>
                        </div>
                        <div className="flex justify-between text-xs py-1">
                          <span className="text-muted">Network Fee:</span>
                          <span>1.00 USDT</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-t mt-1 pt-1 font-bold">
                          <span>Net Payout to User:</span>
                          <span className="text-primary-brand">${(Math.abs(dispatchModalRecord.amount) - 1).toFixed(2)} USDT</span>
                        </div>
                        <div className="text-xs mt-2 pt-2 border-t">
                          <span className="text-muted block">Destination TRON Address:</span>
                          <code className="text-xs break-all font-bold text-slate-800 dark:text-slate-200">
                            {dispatchModalRecord.destination || user.walletAddress}
                          </code>
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Blockchain TX Hash (TXID)</label>
                        <input
                          type="text"
                          required
                          value={dispatchTxHash}
                          onChange={(e) => setDispatchTxHash(e.target.value)}
                          className="text-input-field"
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4">
                        Confirm Blockchain Dispatch
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* WITHDRAWAL REJECT & REFUND MODAL */}
            {rejectModalRecord && (
              <div className="modal-overlay animate-fade-in" onClick={() => setRejectModalRecord(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-md">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-red">
                          <XCircle size={18} />
                        </div>
                        <div>
                          <h3>Reject Withdrawal & Refund Funds</h3>
                          <span className="sub-text">Record: {rejectModalRecord.code}</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setRejectModalRecord(null)}>✕</button>
                    </div>

                    <form onSubmit={handleConfirmWithdrawalReject} className="mt-3">
                      <p className="text-xs text-muted">
                        Rejecting will immediately refund <strong>${Math.abs(rejectModalRecord.amount).toFixed(2)} USDT</strong> back to {rejectModalRecord.userName}'s balance.
                      </p>

                      <div className="input-group mt-3">
                        <label className="input-label">Rejection Reason</label>
                        <select
                          className="text-input-field"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        >
                          <option value="Invalid or unverified TRON TRC20 wallet address">Invalid or unverified TRON TRC20 wallet address</option>
                          <option value="KYC verification document required">KYC verification document required</option>
                          <option value="Incomplete daily task quota cycle">Incomplete daily task quota cycle</option>
                          <option value="Security audit mismatch on IP / session">Security audit mismatch on IP / session</option>
                        </select>
                      </div>

                      <button type="submit" className="btn-danger w-full mt-4">
                        Confirm Rejection & Refund Funds
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            4. TAB: USERS & LEDGER ACCOUNTS
        ========================================= */}
        {activeAdminTab === 'users' && (
          <div className="admin-users animate-fade-in">
            <div className="admin-section-header">
              <div>
                <h3>User Accounts & Balance Governance</h3>
                <span className="text-muted">Manage balances, adjust VIP levels, and provision new user accounts</span>
              </div>
              <button className="btn-primary" onClick={() => setShowAddUserModal(true)}>
                <Plus size={16} />
                <span>Create New User Account</span>
              </button>
            </div>

            <div className="admin-table-card mt-4">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Invitation / Referral</th>
                    <th>Task Progress</th>
                    <th>TRC20 Wallet</th>
                    <th>Balance</th>
                    <th>VIP Tier</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => {
                    const currentUWallet = (u.id === user.id ? user.walletAddress : u.walletAddress) || 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q';
                    const currentUBal = (u.id === user.id ? user.balance : u.balance);
                    const currentUTier = (u.id === user.id ? user.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                    const currentUStatus = (u.id === user.id ? user.status : u.status) || 'Active';
                    const currentUKyc = (u.id === user.id ? user.kycStatus : (u.kyc || u.kycStatus)) || 'Verified';
                    const ownRefCode = u.referralCode || u.code || '505282';
                    const joinedWithCode = u.invitedByCode || u.referredByCode || (u.referredBy ? u.referredBy : '505282');
                    const dailyQuota = u.dailyQuota || 25;
                    const completedTasks = u.dailyCompleted ?? u.completedTasks ?? 0;
                    const pendingTasks = u.pendingTasks ?? Math.max(0, dailyQuota - completedTasks);

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="table-user-cell">
                            <div className={`user-avatar-mini ${u.role === 'admin' ? 'admin-avatar' : ''}`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="user-name-cell">{u.name}</strong>
                                {u.id === user.id && (
                                  <span className="badge-active-pill">You</span>
                                )}
                              </div>
                              <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <span>{u.role === 'admin' ? '👑 Admin' : `ID: ${ownRefCode.slice(0, 6)}`}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-secondary font-mono">{u.email}</span>
                        </td>
                        <td>
                          <div className="user-invitation-cell">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted text-[10px] uppercase font-semibold">Code:</span>
                              <strong className="text-primary-brand font-mono font-bold">{ownRefCode}</strong>
                            </div>
                            <div className="flex items-center gap-1 text-xs mt-0.5">
                              <span className="text-muted text-[10px]">Joined via:</span>
                              <span className="badge-invited-pill">
                                {joinedWithCode}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="task-status-cell">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="badge-pending-tasks">
                                <Clock size={10} />
                                <span>{pendingTasks} Pending</span>
                              </span>
                              <span className="text-xs text-muted font-medium">
                                {completedTasks}/{dailyQuota}
                              </span>
                            </div>
                            <div className="mini-task-progress-track">
                              <div
                                className="mini-task-progress-fill"
                                style={{ width: `${Math.min(100, Math.round((completedTasks / dailyQuota) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono bg-surface-secondary px-2 py-1 rounded border border-subtle">
                              {currentUWallet.slice(0, 6)}...{currentUWallet.slice(-4)}
                            </code>
                            <button
                              className="copy-mini-btn"
                              title="Copy Full Address"
                              onClick={() => {
                                navigator.clipboard.writeText(currentUWallet);
                                addNotification('info', `Copied wallet address for ${u.name}`);
                              }}
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="balance-cell-badge">
                            <strong>${(Number(currentUBal) || 0).toFixed(2)}</strong>
                            <span className="usdt-unit">USDT</span>
                          </div>
                        </td>
                        <td>
                          <span className={`vip-tag-small ${(currentUTier || '').toLowerCase()}`}>
                            {currentUTier === 'eBay' && '🔴 eBay'}
                            {currentUTier === 'Walmart' && '☀️ Walmart'}
                            {currentUTier === 'Temu' && '🟠 Temu'}
                            {currentUTier === 'Amazon' && '🛒 Amazon'}
                            {!['eBay', 'Walmart', 'Temu', 'Amazon'].includes(currentUTier) && currentUTier}
                          </span>
                        </td>
                        <td>
                          <span className="badge-rec">
                            <CheckCircle2 size={11} />
                            <span>{currentUKyc}</span>
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${(currentUStatus || 'active').toLowerCase()}`}>
                            <span className="status-dot"></span>
                            <span>{currentUStatus}</span>
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              className="btn-action-view"
                              title="Inspect Full User Record & Dossier"
                              onClick={() => setInspectingUser(u)}
                            >
                              <FileText size={12} />
                              <span>Details</span>
                            </button>
                            <button
                              className="btn-edit-user"
                              title="Edit Account Details"
                              onClick={() => {
                                setEditingUser(u);
                                setEditBalance(currentUBal.toString());
                                setEditTier(currentUTier);
                                setEditStatus(currentUStatus);
                                setEditWalletAddress(currentUWallet);
                                setEditKyc(currentUKyc);
                                setEditReferralCode(ownRefCode);
                                setEditInvitedByCode(joinedWithCode);
                                setEditPendingTasks((u.pendingTasks ?? Math.max(0, dailyQuota - completedTasks)).toString());
                                setEditCompletedTasks(completedTasks.toString());
                                setEditDailyQuota(dailyQuota.toString());
                              }}
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn-action-view"
                              title="Login As / Impersonate"
                              onClick={() => {
                                switchUser(u.id);
                                setCurrentView('dashboard');
                                setDashboardTab('home');
                              }}
                            >
                              <UserCheck size={12} />
                            </button>
                            {u.id !== user.id && (
                              <button
                                className="btn-action-delete"
                                title="Delete User"
                                onClick={() => handleDeleteUserClick(u.id, u.name)}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Admin Add User Modal */}
            {showAddUserModal && (
              <div className="modal-overlay animate-fade-in" onClick={() => setShowAddUserModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-md">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue">
                          <Plus size={18} />
                        </div>
                        <div>
                          <h3>Provision New User Account</h3>
                          <span className="sub-text">Add registered member & auto-generate TRON wallet</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
                    </div>

                    <form onSubmit={handleAdminCreateUser} className="mt-4">
                      <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rachel Adams"
                          value={newUserData.name}
                          onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                          className="text-input-field"
                        />
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. rachel@example.com"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          className="text-input-field"
                        />
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Password</label>
                        <input
                          type="password"
                          required
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                          className="text-input-field"
                        />
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Starting Balance ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newUserData.startingBalance}
                            onChange={(e) => setNewUserData({ ...newUserData, startingBalance: e.target.value })}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">VIP Tier</label>
                          <select
                            value={newUserData.vipLevel}
                            onChange={(e) => setNewUserData({ ...newUserData, vipLevel: e.target.value })}
                            className="text-input-field"
                          >
                            <option value="eBay">eBay (4%)</option>
                            <option value="Walmart">Walmart (8%)</option>
                            <option value="Temu">Temu (12%)</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Custom TRC20 Wallet Address (Optional)</label>
                        <input
                          type="text"
                          value={newUserData.walletAddress}
                          onChange={(e) => setNewUserData({ ...newUserData, walletAddress: e.target.value })}
                          className="text-input-field"
                          placeholder="T... (Auto-generated if left blank)"
                        />
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Referral / Sponsor Code</label>
                        <input
                          type="text"
                          value={newUserData.referralCode}
                          onChange={(e) => setNewUserData({ ...newUserData, referralCode: e.target.value })}
                          className="text-input-field"
                          placeholder="505282"
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4">
                        Create & Register Account
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* User Edit Modal */}
            {editingUser && (
              <div className="modal-overlay animate-fade-in" onClick={() => setEditingUser(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-lg">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue">
                          <Edit2 size={18} />
                        </div>
                        <div>
                          <h3>Edit User: {editingUser.name}</h3>
                          <span className="sub-text">Modify ledger balance, invitation details, and task quotas</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setEditingUser(null)}>✕</button>
                    </div>

                    <form onSubmit={handleSaveUser} className="mt-4">
                      <div className="grid-two-col">
                        <div className="input-group">
                          <label className="input-label">Available Balance (USDT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            className="text-input-field font-mono font-bold"
                            required
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">VIP Membership Tier</label>
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value)}
                            className="text-input-field"
                          >
                            <option value="eBay">eBay (4% Commission)</option>
                            <option value="Walmart">Walmart (8% Commission)</option>
                            <option value="Temu">Temu (12% Commission)</option>
                            <option value="Amazon">Amazon (16% Commission)</option>
                          </select>
                        </div>
                      </div>

                      {/* Invitation & Referral Code Controls */}
                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">
                            <span className="flex items-center gap-1">
                              <Gift size={12} className="text-amber-500" />
                              <span>User's Referral Code</span>
                            </span>
                          </label>
                          <input
                            type="text"
                            value={editReferralCode}
                            onChange={(e) => setEditReferralCode(e.target.value)}
                            className="text-input-field font-mono"
                            placeholder="e.g. 505282"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">
                            <span className="flex items-center gap-1">
                              <Gift size={12} className="text-primary-brand" />
                              <span>Joined with Invite Code</span>
                            </span>
                          </label>
                          <input
                            type="text"
                            value={editInvitedByCode}
                            onChange={(e) => setEditInvitedByCode(e.target.value)}
                            className="text-input-field font-mono"
                            placeholder="e.g. 888888"
                          />
                        </div>
                      </div>

                      {/* Task Allocation & Pending Progress */}
                      <div className="grid-three-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Daily Task Quota</label>
                          <input
                            type="number"
                            min="1"
                            value={editDailyQuota}
                            onChange={(e) => setEditDailyQuota(e.target.value)}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Completed Tasks</label>
                          <input
                            type="number"
                            min="0"
                            value={editCompletedTasks}
                            onChange={(e) => setEditCompletedTasks(e.target.value)}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Pending Tasks</label>
                          <input
                            type="number"
                            min="0"
                            value={editPendingTasks}
                            onChange={(e) => setEditPendingTasks(e.target.value)}
                            className="text-input-field font-bold text-amber-600"
                          />
                        </div>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">KYC Verification</label>
                          <select
                            value={editKyc}
                            onChange={(e) => setEditKyc(e.target.value)}
                            className="text-input-field"
                          >
                            <option value="Verified">Verified</option>
                            <option value="Pending">Pending Review</option>
                            <option value="Unverified">Unverified</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Account Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="text-input-field"
                          >
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Pending Review">Pending Review</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">TRON TRC20 Wallet Address</label>
                        <input
                          type="text"
                          value={editWalletAddress}
                          onChange={(e) => setEditWalletAddress(e.target.value)}
                          className="text-input-field font-mono"
                          placeholder="T..."
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4 py-2.5">
                        Save Changes to User Ledger
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Inspect Full User Record / Dossier Modal */}
            {inspectingUser && (
              <div className="modal-overlay animate-fade-in" onClick={() => setInspectingUser(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-2xl user-dossier-modal">
                    {/* Header */}
                    <div className="modal-header pb-3 border-b">
                      <div className="header-with-icon">
                        <div className={`user-avatar-mini large ${inspectingUser.role === 'admin' ? 'admin-avatar' : ''}`}>
                          {inspectingUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{inspectingUser.name}</h3>
                            <span className={`status-pill ${(inspectingUser.status || 'active').toLowerCase()}`}>
                              <span className="status-dot"></span>
                              <span>{inspectingUser.status || 'Active'}</span>
                            </span>
                            <span className={`vip-tag-small ${(inspectingUser.vipLevel || inspectingUser.vipTier || 'ebay').toLowerCase()}`}>
                              {inspectingUser.vipLevel || inspectingUser.vipTier || 'eBay'}
                            </span>
                          </div>
                          <span className="sub-text font-mono text-xs">{inspectingUser.email} • ID: {inspectingUser.id}</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setInspectingUser(null)}>✕</button>
                    </div>

                    {/* Dossier Grid */}
                    <div className="dossier-grid mt-4">
                      {/* 1. Referral & Invitation Details */}
                      <div className="dossier-card">
                        <div className="dossier-card-header">
                          <Gift size={16} className="text-amber-500" />
                          <h4>Invitation & Referral Record</h4>
                        </div>
                        <div className="dossier-data-list">
                          <div className="dossier-row">
                            <span className="d-label">Joined via Invite Code:</span>
                            <strong className="d-val text-primary-brand font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {inspectingUser.invitedByCode || inspectingUser.referredByCode || (inspectingUser.referredBy ? inspectingUser.referredBy : '505282')}
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Invited By / Sponsor:</span>
                            <span className="d-val font-medium">
                              {inspectingUser.referredByName || (inspectingUser.invitedByCode === '888888' ? 'System Administrator' : (inspectingUser.invitedByCode ? `Code #${inspectingUser.invitedByCode}` : 'Genesis'))}
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">User's Own Referral Code:</span>
                            <strong className="d-val text-amber-600 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {inspectingUser.referralCode || inspectingUser.code || '505282'}
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Total Direct Referrals:</span>
                            <span className="d-val font-semibold">{inspectingUser.referrals ?? inspectingUser.teamMembersCount ?? 0} Members</span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Joined / Registered Date:</span>
                            <span className="d-val text-muted">{inspectingUser.joinedDate || inspectingUser.joined || '2026-01-01'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Tasks & Quota Status */}
                      <div className="dossier-card">
                        <div className="dossier-card-header">
                          <CheckSquare size={16} className="text-emerald-500" />
                          <h4>Tasks Lifecycle & Pending</h4>
                        </div>
                        <div className="dossier-data-list">
                          <div className="dossier-row">
                            <span className="d-label">Daily Assigned Quota:</span>
                            <span className="d-val font-bold">{inspectingUser.dailyQuota || 25} Tasks/day</span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Completed Tasks Today:</span>
                            <strong className="d-val text-emerald-600">
                              {inspectingUser.dailyCompleted ?? inspectingUser.completedTasks ?? 0} Tasks
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Tasks Currently Pending:</span>
                            <strong className="d-val text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {inspectingUser.pendingTasks ?? Math.max(0, (inspectingUser.dailyQuota || 25) - (inspectingUser.dailyCompleted ?? inspectingUser.completedTasks ?? 0))} Pending
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Task Completion Rate:</span>
                            <span className="d-val font-semibold">
                              {Math.min(100, Math.round(((inspectingUser.dailyCompleted ?? inspectingUser.completedTasks ?? 0) / (inspectingUser.dailyQuota || 25)) * 100))}%
                            </span>
                          </div>
                          <div className="mini-task-progress-track mt-2">
                            <div
                              className="mini-task-progress-fill"
                              style={{
                                width: `${Math.min(100, Math.round(((inspectingUser.dailyCompleted ?? inspectingUser.completedTasks ?? 0) / (inspectingUser.dailyQuota || 25)) * 100))}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Financial Balances & Ledger */}
                      <div className="dossier-card">
                        <div className="dossier-card-header">
                          <Wallet size={16} className="text-blue-500" />
                          <h4>Financial Ledger & Wallet</h4>
                        </div>
                        <div className="dossier-data-list">
                          <div className="dossier-row">
                            <span className="d-label">Available Balance:</span>
                            <strong className="d-val text-primary-brand text-sm">
                              ${(Number(inspectingUser.balance) || 0).toFixed(2)} USDT
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Lifetime Task Earnings:</span>
                            <span className="d-val text-emerald-600 font-semibold">
                              +${(Number(inspectingUser.totalEarnings) || 0).toFixed(2)} USDT
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Total Deposits:</span>
                            <span className="d-val font-semibold">
                              ${(Number(inspectingUser.totalDeposit) || 0).toFixed(2)} USDT
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Total Withdrawals:</span>
                            <span className="d-val text-red-600 font-semibold">
                              -${(Number(inspectingUser.totalWithdraw) || 0).toFixed(2)} USDT
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Wallet & Security */}
                      <div className="dossier-card">
                        <div className="dossier-card-header">
                          <ShieldCheck size={16} className="text-purple-500" />
                          <h4>TRC20 Wallet & Compliance</h4>
                        </div>
                        <div className="dossier-data-list">
                          <div className="dossier-row flex-col items-start gap-1">
                            <span className="d-label">TRON TRC20 Address:</span>
                            <div className="flex items-center gap-1.5 w-full">
                              <code className="text-xs font-mono bg-surface-secondary px-2 py-1 rounded border border-subtle break-all flex-1">
                                {inspectingUser.walletAddress || inspectingUser.wallet || 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q'}
                              </code>
                              <button
                                className="copy-mini-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(inspectingUser.walletAddress || inspectingUser.wallet);
                                  addNotification('info', `Copied wallet address for ${inspectingUser.name}`);
                                }}
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </div>
                          <div className="dossier-row mt-2">
                            <span className="d-label">KYC Verification:</span>
                            <span className="badge-rec">
                              <CheckCircle2 size={11} />
                              <span>{inspectingUser.kycStatus || inspectingUser.kyc || 'Verified'}</span>
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Account Network:</span>
                            <span className="d-val font-mono">{inspectingUser.network || 'TRC20'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="modal-btn-row mt-4 pt-3 border-t">
                      <button
                        className="btn-outline w-full"
                        onClick={() => {
                          const u = inspectingUser;
                          setInspectingUser(null);
                          setEditingUser(u);
                          setEditBalance((u.balance || 0).toString());
                          setEditTier(u.vipLevel || u.vipTier || 'eBay');
                          setEditStatus(u.status || 'Active');
                          setEditWalletAddress(u.walletAddress || u.wallet || '');
                          setEditKyc(u.kycStatus || u.kyc || 'Verified');
                          setEditReferralCode(u.referralCode || u.code || '505282');
                          setEditInvitedByCode(u.invitedByCode || u.referredByCode || '505282');
                          setEditPendingTasks((u.pendingTasks ?? 25).toString());
                          setEditCompletedTasks((u.completedTasks ?? 0).toString());
                          setEditDailyQuota((u.dailyQuota ?? 25).toString());
                        }}
                      >
                        <Edit2 size={14} />
                        <span>Edit This User</span>
                      </button>

                      <button
                        className="btn-primary w-full"
                        onClick={() => {
                          const uid = inspectingUser.id;
                          setInspectingUser(null);
                          switchUser(uid);
                          setCurrentView('dashboard');
                          setDashboardTab('home');
                        }}
                      >
                        <UserCheck size={14} />
                        <span>Login as {inspectingUser.name}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            5. TAB: TASK POOL MANAGER & 25 LEARNING STEPS
        ========================================= */}
        {activeAdminTab === 'tasks' && (
          <div className="admin-tasks animate-fade-in">
            {/* Header & Primary Actions */}
            <div className="admin-section-header">
              <div>
                <h3>Task Pool & Deposit Restriction Manager (25 Steps)</h3>
                <span className="text-muted">Configure campaign tasks, preview opening flow, enforce deposit barriers, and manage learning milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline"
                  onClick={() => claimDummyDeposit(300)}
                  title="Credit $300 Practice Demo Funds for 25 Learning Tasks"
                >
                  <Award size={15} />
                  <span>Test Practice Funds (+$300)</span>
                </button>
                <button className="btn-primary" onClick={() => setShowAddTaskModal(true)}>
                  <Plus size={16} />
                  <span>Add New Task</span>
                </button>
              </div>
            </div>

            {/* Explanatory Policy Banner */}
            <div className="task-policy-banner mt-4">
              <div className="policy-box learning-mode-card">
                <div className="policy-icon-circle blue">
                  <span>🎓</span>
                </div>
                <div className="policy-text">
                  <strong>25 Learning Journey Steps (Progressive Deposit: $10 to $300)</strong>
                  <p>
                    Steps 1 to 25 feature progressive deposit requirements starting from Step 1 ($10 deposit) up to Step 25 ($300).
                    Users can claim the <strong>$300 Testing Practice Deposit</strong> to test and unlock all tasks instantly.
                  </p>
                </div>
              </div>

              <div className="policy-box deposit-mode-card">
                <div className="policy-icon-circle amber">
                  <Lock size={16} color="#d97706" />
                </div>
                <div className="policy-text">
                  <strong>Deposit Restriction Engine</strong>
                  <p>
                    Set custom <strong>Required Deposit ($)</strong> on any task. When set, users cannot execute the task until their available balance or total deposit meets the requirement.
                  </p>
                </div>
              </div>
            </div>

            {/* Task Stats Row */}
            <div className="admin-kpi-grid mt-4">
              <div className="kpi-card">
                <div className="kpi-icon-wrap blue">
                  <Layers size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Total Catalogue Tasks</span>
                  <strong className="kpi-val">{tasks.length}</strong>
                  <span className="kpi-trend neutral">{tasks.filter(t => t.active !== false).length} Active</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap navy">
                  <Award size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Learning Tasks Series</span>
                  <strong className="kpi-val">{tasks.filter(t => t.isLearning).length} <span className="kpi-unit">Steps</span></strong>
                  <span className="kpi-trend positive">Step 1 ($10) to Step 25 ($300)</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap amber">
                  <Lock size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Deposit-Restricted Tasks</span>
                  <strong className="kpi-val">{tasks.filter(t => (t.requiredDeposit || 0) > 0).length}</strong>
                  <span className="kpi-trend neutral">Deposit Threshold Enforced</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap green">
                  <CheckCircle2 size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Completed Orders</span>
                  <strong className="kpi-val">{tasks.reduce((sum, t) => sum + (t.orders || 0), 0).toLocaleString()}</strong>
                  <span className="kpi-trend positive">Live Platform Volume</span>
                </div>
              </div>
            </div>

            {/* Filter Pills Toolbar */}
            <div className="records-filter-toolbar mt-4">
              <div className="filter-pills-wrap">
                {[
                  { id: 'all', label: `All Tasks (${tasks.length})` },
                  { id: 'learning', label: `🎓 Learning Phase (${tasks.filter(t => t.isLearning).length})` },
                  { id: 'restricted', label: `🔒 Deposit Restricted (${tasks.filter(t => (t.requiredDeposit || 0) > 0).length})` },
                  { id: 'eBay', label: 'eBay Pool' },
                  { id: 'Walmart', label: 'Walmart Pool' },
                  { id: 'Temu', label: 'Temu Pool' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`filter-pill ${taskFilter === tab.id ? 'active' : ''}`}
                    onClick={() => setTaskFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Management Table */}
            <div className="admin-table-card mt-3">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Product / Campaign</th>
                    <th>Platform</th>
                    <th>Price</th>
                    <th>Commission</th>
                    <th>Est. Profit</th>
                    <th>Deposit Barrier</th>
                    <th>Learning Step</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks
                    .filter(t => {
                      if (taskFilter === 'all') return true;
                      if (taskFilter === 'learning') return Boolean(t.isLearning);
                      if (taskFilter === 'restricted') return (t.requiredDeposit || 0) > 0;
                      return (t.platform || '').toLowerCase() === (taskFilter || '').toLowerCase();
                    })
                    .map(t => (
                      <tr key={t.id} className={t.active === false ? 'opacity-50' : ''}>
                        <td>
                          <div className="task-cell-flex">
                            <img
                              src={t.image}
                              alt={t.title}
                              className="task-thumb"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="task-title-clamp" title={t.title}>
                                {t.title}
                              </span>
                              <span className="text-xs text-muted">Category: {t.category}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`platform-tag-mini ${(t.platform || 'ebay').toLowerCase()}`}>
                            {t.platform || 'eBay'}
                          </span>
                        </td>
                        <td><strong>${parseFloat(t.price).toFixed(2)}</strong></td>
                        <td><span className="badge-rec">{t.commissionRate}%</span></td>
                        <td className="text-green-success font-bold">
                          +${((t.price * t.commissionRate) / 100).toFixed(2)} USDT
                        </td>
                        <td>
                          {(t.requiredDeposit || 0) > 0 ? (
                            <span className="badge-restricted">
                              <Lock size={12} />
                              <span>Min Dep: ${parseFloat(t.requiredDeposit).toFixed(2)}</span>
                            </span>
                          ) : (
                            <span className="badge-free">
                              <span>$0.00 (Free)</span>
                            </span>
                          )}
                        </td>
                        <td>
                          {t.isLearning ? (
                            <span className="badge-learning">
                              🎓 Step #{t.learningStep || 1}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">Standard</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${t.active !== false ? 'active' : 'suspended'}`}>
                            {t.active !== false ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {/* Open / Preview Task in Modal */}
                            <button
                              className="btn-action-view"
                              title="Open & Preview Task in Execution Engine"
                              onClick={() => openTaskPreview(t)}
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action-external"
                              title={`Open live product listing on ${t.platform}`}
                              onClick={(e) => openProductUrl(t, e)}
                            >
                              <ExternalLink size={13} />
                              <span>Store ↗</span>
                            </button>
                            <button
                              className="btn-action-edit"
                              title="Edit Task & Restrictions"
                              onClick={() => setEditingTask({ ...t })}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              className={`btn-action-toggle ${t.active !== false ? 'disable-btn' : 'enable-btn'}`}
                              title={t.active !== false ? 'Disable Task' : 'Enable Task'}
                              onClick={() => handleToggleTaskActive(t)}
                            >
                              {t.active !== false ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              className="btn-action-delete"
                              title="Delete Task"
                              onClick={() => handleDeleteTask(t.id, t.title)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* ADD TASK MODAL */}
            {showAddTaskModal && (
              <div className="modal-overlay animate-fade-in" onClick={() => setShowAddTaskModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-xl">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue">
                          <Plus size={18} />
                        </div>
                        <div>
                          <h3>Create New Promotional Task</h3>
                          <span className="sub-text">Add product listing, set deposit restrictions & learning flags</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setShowAddTaskModal(false)}>✕</button>
                    </div>

                    <form onSubmit={handleCreateTask} className="mt-4">
                      <div className="input-group">
                        <label className="input-label">Product / Campaign Title</label>
                        <input
                          type="text"
                          required
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          className="text-input-field"
                          placeholder="e.g. 2026 4K Smart Projector Ultra HD"
                        />
                      </div>

                      <div className="input-group mt-3">
                        <div className="flex items-center justify-between">
                          <label className="input-label">Direct Store Product URL (Optional)</label>
                          <span className="text-xs text-muted">eBay, Amazon, Walmart, Temu link</span>
                        </div>
                        <div className="input-icon-field-wrap">
                          <ExternalLink size={15} className="input-field-left-icon text-muted" />
                          <input
                            type="url"
                            value={newTask.productUrl || ''}
                            onChange={(e) => setNewTask({ ...newTask, productUrl: e.target.value })}
                            className="text-input-field with-icon"
                            placeholder="e.g. https://www.ebay.com/itm/... or https://www.amazon.com/dp/..."
                          />
                        </div>
                        <p className="text-xs text-muted mt-1">Auto-generates live search query on {newTask.platform} if left blank.</p>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Platform Pool</label>
                          <select
                            value={newTask.platform}
                            onChange={(e) => setNewTask({ ...newTask, platform: e.target.value })}
                            className="text-input-field"
                          >
                            <option value="eBay">eBay</option>
                            <option value="Walmart">Walmart</option>
                            <option value="Temu">Temu</option>
                            <option value="Amazon">Amazon</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Category</label>
                          <select
                            value={newTask.category}
                            onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                            className="text-input-field"
                          >
                            <option value="Flash Deals">Flash Deals</option>
                            <option value="Best Sellers">Best Sellers</option>
                            <option value="Trending Campaigns">Trending Campaigns</option>
                            <option value="New Arrivals">New Arrivals</option>
                            <option value="Electronics">Electronics</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Listing Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={newTask.price}
                            onChange={(e) => setNewTask({ ...newTask, price: e.target.value })}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Commission Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={newTask.commissionRate}
                            onChange={(e) => setNewTask({ ...newTask, commissionRate: e.target.value })}
                            className="text-input-field"
                          />
                        </div>
                      </div>

                      {/* DEPOSIT RESTRICTION FIELD */}
                      <div className="restriction-config-box mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock size={15} className="text-primary-brand" />
                          <label className="input-label mb-0 font-bold">Deposit Balance Restriction (USDT)</label>
                        </div>
                        <p className="text-xs text-muted mb-2">
                          Set the minimum deposit/balance required to complete this task. Enter <code>0</code> for free / unrestricted.
                        </p>
                        <div className="amount-input-wrap">
                          <span className="currency-symbol">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newTask.requiredDeposit}
                            onChange={(e) => setNewTask({ ...newTask, requiredDeposit: e.target.value })}
                            className="text-input-field"
                            placeholder="0.00"
                          />
                          <span className="currency-suffix">USDT</span>
                        </div>
                      </div>

                      {/* LEARNING TASK CHECKBOX & STEP SELECTOR (1 to 25) */}
                      <div className="learning-config-box mt-3">
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={newTask.isLearning}
                            onChange={(e) => setNewTask({ ...newTask, isLearning: e.target.checked })}
                          />
                          <div className="checkbox-text-group">
                            <strong className="checkbox-title">🎓 Mark as Beginner Learning Series Task</strong>
                            <span className="checkbox-desc">Configures task in the 25-step progressive learning curriculum</span>
                          </div>
                        </label>

                        {newTask.isLearning && (
                          <div className="input-group mt-2">
                            <label className="input-label">Learning Milestone Step (1 to 25)</label>
                            <select
                              value={newTask.learningStep}
                              onChange={(e) => setNewTask({ ...newTask, learningStep: parseInt(e.target.value, 10) })}
                              className="text-input-field"
                            >
                              {Array.from({ length: 25 }, (_, i) => i + 1).map(s => (
                                <option key={s} value={s}>
                                  Step {s} — {s === 1 ? 'Step 1 ($10 Deposit Requirement)' : s === 25 ? 'Step 25 Graduation ($300 Deposit)' : `Step ${s}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Image URL</label>
                        <input
                          type="url"
                          required
                          value={newTask.image}
                          onChange={(e) => setNewTask({ ...newTask, image: e.target.value })}
                          className="text-input-field"
                        />
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Tag / Badge Label</label>
                        <input
                          type="text"
                          value={newTask.tag}
                          onChange={(e) => setNewTask({ ...newTask, tag: e.target.value })}
                          className="text-input-field"
                          placeholder="e.g. Hot Deal, Featured, Learning #1"
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4">
                        Add Task to Pool
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT TASK MODAL */}
            {editingTask && (
              <div className="modal-overlay animate-fade-in" onClick={() => setEditingTask(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-xl">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue">
                          <Edit2 size={18} />
                        </div>
                        <div>
                          <h3>Edit Campaign Task & Restrictions</h3>
                          <span className="sub-text">Task ID: {editingTask.id}</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setEditingTask(null)}>✕</button>
                    </div>

                    <form onSubmit={handleSaveTask} className="mt-4">
                      <div className="input-group">
                        <label className="input-label">Product / Campaign Title</label>
                        <input
                          type="text"
                          required
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="text-input-field"
                        />
                      </div>

                      <div className="input-group mt-3">
                        <div className="flex items-center justify-between">
                          <label className="input-label">Direct Store Product URL</label>
                          <button
                            type="button"
                            className="btn-link text-xs text-primary-brand flex items-center gap-1"
                            onClick={(e) => openProductUrl(editingTask, e)}
                          >
                            <span>Test Live URL</span>
                            <ExternalLink size={11} />
                          </button>
                        </div>
                        <div className="input-icon-field-wrap">
                          <ExternalLink size={15} className="input-field-left-icon text-muted" />
                          <input
                            type="url"
                            value={editingTask.productUrl || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, productUrl: e.target.value })}
                            className="text-input-field with-icon"
                            placeholder="e.g. https://www.ebay.com/itm/... or https://www.amazon.com/dp/..."
                          />
                        </div>
                        <p className="text-xs text-muted mt-1">Users clicking this task will be redirected to this verified product listing.</p>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Platform Pool</label>
                          <select
                            value={editingTask.platform}
                            onChange={(e) => setEditingTask({ ...editingTask, platform: e.target.value })}
                            className="text-input-field"
                          >
                            <option value="eBay">eBay</option>
                            <option value="Walmart">Walmart</option>
                            <option value="Temu">Temu</option>
                            <option value="Amazon">Amazon</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Category</label>
                          <select
                            value={editingTask.category}
                            onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                            className="text-input-field"
                          >
                            <option value="Flash Deals">Flash Deals</option>
                            <option value="Best Sellers">Best Sellers</option>
                            <option value="Trending Campaigns">Trending Campaigns</option>
                            <option value="New Arrivals">New Arrivals</option>
                            <option value="Electronics">Electronics</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Listing Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={editingTask.price}
                            onChange={(e) => setEditingTask({ ...editingTask, price: e.target.value })}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Commission Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={editingTask.commissionRate}
                            onChange={(e) => setEditingTask({ ...editingTask, commissionRate: e.target.value })}
                            className="text-input-field"
                          />
                        </div>
                      </div>

                      {/* DEPOSIT RESTRICTION FIELD */}
                      <div className="restriction-config-box mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock size={15} className="text-primary-brand" />
                          <label className="input-label mb-0 font-bold">Deposit Balance Restriction (USDT)</label>
                        </div>
                        <p className="text-xs text-muted mb-2">
                          Required account balance or deposit threshold to unlock this task.
                        </p>
                        <div className="amount-input-wrap">
                          <span className="currency-symbol">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingTask.requiredDeposit || 0}
                            onChange={(e) => setEditingTask({ ...editingTask, requiredDeposit: e.target.value })}
                            className="text-input-field"
                          />
                          <span className="currency-suffix">USDT</span>
                        </div>
                      </div>

                      {/* LEARNING TASK CHECKBOX & STEP SELECTOR (1 to 25) */}
                      <div className="learning-config-box mt-3">
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={Boolean(editingTask.isLearning)}
                            onChange={(e) => setEditingTask({ ...editingTask, isLearning: e.target.checked })}
                          />
                          <div className="checkbox-text-group">
                            <strong className="checkbox-title">🎓 Mark as Beginner Learning Task</strong>
                            <span className="checkbox-desc">Configures task in the 25-step learning series</span>
                          </div>
                        </label>

                        {editingTask.isLearning && (
                          <div className="input-group mt-2">
                            <label className="input-label">Learning Tutorial Step (1 to 25)</label>
                            <select
                              value={editingTask.learningStep || 1}
                              onChange={(e) => setEditingTask({ ...editingTask, learningStep: parseInt(e.target.value, 10) })}
                              className="text-input-field"
                            >
                              {Array.from({ length: 25 }, (_, i) => i + 1).map(s => (
                                <option key={s} value={s}>
                                  Step {s} — {s === 1 ? 'Step 1 ($10 Deposit Requirement)' : s === 25 ? 'Step 25 Graduation ($300 Deposit)' : `Step ${s}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="input-group mt-3">
                        <label className="input-label">Image URL</label>
                        <input
                          type="url"
                          required
                          value={editingTask.image}
                          onChange={(e) => setEditingTask({ ...editingTask, image: e.target.value })}
                          className="text-input-field"
                        />
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Tag Label</label>
                          <input
                            type="text"
                            value={editingTask.tag || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, tag: e.target.value })}
                            className="text-input-field"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Status</label>
                          <select
                            value={editingTask.active !== false ? 'true' : 'false'}
                            onChange={(e) => setEditingTask({ ...editingTask, active: e.target.value === 'true' })}
                            className="text-input-field"
                          >
                            <option value="true">Active</option>
                            <option value="false">Disabled / Paused</option>
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4">
                        Save Task Changes
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            6. TAB: DEPOSIT & PAYOUT GATEWAYS (ACCOUNTS)
        ========================================= */}
        {activeAdminTab === 'gateways' && (
          <div className="admin-gateways animate-fade-in">
            <div className="admin-section-header">
              <div>
                <h3>Deposit Receiving & Payout Accounts Gateway</h3>
                <span className="text-muted">Configure receiving blockchain wallet addresses and escrow bank accounts shown to users on deposit</span>
              </div>
            </div>

            {gatewaySavedMsg && (
              <div className="notice-box positive mt-3 animate-fade-in">
                <CheckCircle2 size={16} color="#10b981" />
                <span>Gateway settings successfully saved! User deposit modals are updated instantly.</span>
              </div>
            )}

            <form onSubmit={handleSaveGatewayAccounts} className="gateway-config-form mt-4">
              {/* Crypto Receiving Wallets Card */}
              <div className="admin-card">
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode size={20} className="text-primary-brand" />
                    <h4 className="font-bold">Cryptocurrency Receiving Wallet Accounts</h4>
                  </div>
                  <span className="badge-rec">Active Ingestion Engine</span>
                </div>

                {/* Primary TRON TRC20 Gateway */}
                <div className="gateway-primary-box mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="input-label font-bold text-primary-brand mb-0 flex items-center gap-1.5">
                      <span>TRON (TRC20) Master Receiving Address</span>
                      <span className="badge-active-pill">Default USDT</span>
                    </label>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      title="Copy Address"
                      onClick={() => {
                        navigator.clipboard.writeText(gatewayForm.trc20Address);
                        addNotification('info', 'Copied TRC20 Gateway Address');
                      }}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={gatewayForm.trc20Address}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, trc20Address: e.target.value })}
                    className="text-input-field font-mono"
                    placeholder="T..."
                  />
                  <span className="text-xs text-muted mt-1 block">
                    All user deposits on TRON network are directed to this address.
                  </span>
                </div>

                <div className="grid-two-col">
                  <div className="input-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="input-label mb-0">Ethereum (ERC20) Receiving Address</label>
                      <button
                        type="button"
                        className="copy-mini-btn"
                        title="Copy Address"
                        onClick={() => {
                          navigator.clipboard.writeText(gatewayForm.erc20Address);
                          addNotification('info', 'Copied ERC20 Gateway Address');
                        }}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={gatewayForm.erc20Address}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, erc20Address: e.target.value })}
                      className="text-input-field font-mono"
                      placeholder="0x..."
                    />
                  </div>

                  <div className="input-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="input-label mb-0">BNB Smart Chain (BEP20) Address</label>
                      <button
                        type="button"
                        className="copy-mini-btn"
                        title="Copy Address"
                        onClick={() => {
                          navigator.clipboard.writeText(gatewayForm.bep20Address);
                          addNotification('info', 'Copied BEP20 Gateway Address');
                        }}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={gatewayForm.bep20Address}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bep20Address: e.target.value })}
                      className="text-input-field font-mono"
                      placeholder="0x..."
                    />
                  </div>
                </div>
              </div>

              {/* Escrow Bank Wire Card */}
              <div className="admin-card mt-5">
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark size={20} className="text-primary-brand" />
                    <h4 className="font-bold">Institutional Escrow Bank Wire Account</h4>
                  </div>
                  <span className="badge-active-pill">Direct Wire</span>
                </div>

                <div className="grid-two-col">
                  <div className="input-group">
                    <label className="input-label">Bank Name</label>
                    <input
                      type="text"
                      value={gatewayForm.bankName}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankName: e.target.value })}
                      className="text-input-field"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Account Beneficiary / Company Holder</label>
                    <input
                      type="text"
                      value={gatewayForm.bankHolder}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankHolder: e.target.value })}
                      className="text-input-field"
                    />
                  </div>
                </div>

                <div className="grid-two-col mt-3">
                  <div className="input-group">
                    <label className="input-label">Account Number / IBAN</label>
                    <input
                      type="text"
                      value={gatewayForm.bankAccount}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankAccount: e.target.value })}
                      className="text-input-field font-mono"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">SWIFT / BIC / Routing Code</label>
                    <input
                      type="text"
                      value={gatewayForm.bankSwift}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankSwift: e.target.value })}
                      className="text-input-field font-mono"
                    />
                  </div>
                </div>

                <div className="input-group mt-3">
                  <label className="input-label">Deposit Instructions / Memo Prompt for Users</label>
                  <textarea
                    rows={2}
                    value={gatewayForm.depositInstructions}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, depositInstructions: e.target.value })}
                    className="text-input-field"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-6 py-3 font-bold text-base">
                Save & Broadcast Gateway Account Configuration
              </button>
            </form>
          </div>
        )}

        {/* =========================================
            7. TAB: VIP COMMISSION RULES
        ========================================= */}
        {activeAdminTab === 'tiers' && (
          <div className="admin-tiers animate-fade-in">
            <div className="admin-section-header">
              <div>
                <h3>VIP Tier Rules & Commission Formulas</h3>
                <span className="text-muted">Adjust required minimum balances, daily task quotas, and commission percentages</span>
              </div>
            </div>

            <div className="vip-config-grid mt-4">
              {vipTiers.map(tier => (
                <div key={tier.id} className="vip-config-card">
                  <div className="vip-config-header">
                    <span className={`platform-logo-circle ${(tier.platform || 'ebay').toLowerCase()}-badge`}>
                      {(tier.platform || 'E').charAt(0)}
                    </span>
                    <h4>{tier.name} VIP Tier</h4>
                  </div>

                  <div className="vip-config-inputs mt-4">
                    <div className="input-group">
                      <label className="input-label">Min Balance to Qualify ($)</label>
                      <input
                        type="number"
                        defaultValue={tier.minBalance}
                        className="text-input-field"
                        onChange={(e) => adminUpdateTier(tier.id, { minBalance: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="input-group mt-3">
                      <label className="input-label">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={tier.commissionRate}
                        className="text-input-field"
                        onChange={(e) => adminUpdateTier(tier.id, { commissionRate: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="input-group mt-3">
                      <label className="input-label">Daily Task Quota</label>
                      <input
                        type="number"
                        defaultValue={tier.dailyTasks}
                        className="text-input-field"
                        onChange={(e) => adminUpdateTier(tier.id, { dailyTasks: parseInt(e.target.value, 10) })}
                      />
                    </div>
                  </div>

                  <div className="vip-features-list mt-4">
                    {tier.features.map((f, i) => (
                      <div key={i} className="feature-item-tick">
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            8. TAB: AUDIT TRAIL & LOGS
        ========================================= */}
        {activeAdminTab === 'audit' && (
          <div className="admin-audit animate-fade-in">
            <div className="admin-section-header">
              <div>
                <h3>Immutable Financial & Task Audit Ledger</h3>
                <span className="text-muted">Double-entry record of all platform credits, debits, task rewards, and admin actions</span>
              </div>
            </div>

            <div className="admin-table-card mt-4">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Code</th>
                    <th>User</th>
                    <th>Event Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Transaction Note</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(rec => (
                    <tr key={rec.id}>
                      <td><span className="text-xs text-muted">{rec.date}</span></td>
                      <td><code>{rec.code}</code></td>
                      <td><strong>{rec.userName || user.name}</strong></td>
                      <td><strong>{rec.type}</strong></td>
                      <td><span className="record-cat-tag">{rec.category}</span></td>
                      <td className={rec.amount >= 0 ? 'text-green-success font-bold' : 'text-red-danger font-bold'}>
                        {rec.amount >= 0 ? `+${rec.amount.toFixed(2)}` : `${rec.amount.toFixed(2)}`} {rec.currency}
                      </td>
                      <td className="text-xs">{rec.note}</td>
                      <td>
                        <span className={`status-pill ${(rec.status || 'Pending').toLowerCase()}`}>
                          {rec.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
