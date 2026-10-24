import React, { useState, useMemo, useEffect } from 'react';
import { useApp, deduplicateRecords } from '../context/AppContext';
import {
  Home,
  Calendar,
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
  Share2,
  ClipboardList,
  Send,
  Shuffle,
  Dice5,
  Info,
  AlertCircle,
  Save,
  Pause,
  Play,
  Ban
} from 'lucide-react';
import { getProductUrl, openProductUrl } from '../utils/productUrl';
import { sanitizeReferralCode } from '../services/supabaseService';
import AdminSupportPanel, { useSupportChats, SupportSettingsForm } from '../components/AdminSupportPanel';
import {
  EbayLogo,
  WalmartLogo,
  TemuLogo,
  AmazonLogo,
  AliExpressLogo,
  TargetLogo,
  ShopifyLogo,
  ShopeeLogo
} from '../components/PlatformIcons';

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
    adminAssignPackage,
    adminBulkAssignPackage,
    adminAssignRandomTasks,
    adminBulkAssignRandomTasks,
    adminAssignSpecificTask,
    adminAssignTasksToUser,
    adminRestoreDefaultTasks,
    sendPaymentRequestToUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    openTaskPreview,
    switchUser,
    setCurrentView,
    setDashboardTab,
    supportSettings,
    updateSupportSettings
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('overview'); // 'overview' | 'deposits' | 'withdrawals' | 'users' | 'tasks' | 'gateways' | 'tiers' | 'audit' | 'support' | 'telegram'
  const supportState = useSupportChats();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'learning' | 'restricted' | 'eBay' | 'Walmart' | 'Temu'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userTagFilter, setUserTagFilter] = useState('all'); // 'all' | 'eBay' | 'Walmart' | 'Temu'
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [unmaskEmails, setUnmaskEmails] = useState(false);

  // Financial Number Formatting Helper (Stripe / Enterprise standard: "11,950.00 USDT", never combine $ with USDT)
  const formatUSDT = (amount, includeSign = false) => {
    const val = parseFloat(amount) || 0;
    const formatted = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (includeSign) {
      return val > 0 ? `+${formatted} USDT` : val < 0 ? `-${formatted} USDT` : `${formatted} USDT`;
    }
    return `${formatted} USDT`;
  };

  // Truncate crypto wallet addresses or hashes cleanly
  const formatCompactAddress = (addr, head = 8, tail = 6) => {
    if (!addr) return '-';
    if (addr.length <= head + tail + 2) return addr;
    return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
  };

  // Clipboard copy state with momentary feedback
  const [copiedKey, setCopiedKey] = useState(null);
  const copyToClipboard = (text, keyLabel) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyLabel || text);
    if (addNotification) {
      addNotification('Copied', `Copied to clipboard: ${keyLabel || text}`);
    }
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Table filter states
  const [depositFilter, setDepositFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'rejected'
  const [depositSearch, setDepositSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'rejected'
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Helper to mask Gmail / emails across all views unless unmasked by Admin
  const maskEmail = (emailStr) => {
    if (!emailStr) return '-';
    if (unmaskEmails) return emailStr;
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const namePart = parts[0];
    const maskedName = namePart.length <= 2 ? namePart[0] + '***' : namePart.slice(0, 2) + '***' + namePart.slice(-1);
    const domainPart = parts[1];
    const maskedDomain = domainPart.includes('gmail.com') ? 'g***.com' : domainPart;
    return `${maskedName}@${maskedDomain}`;
  };

  // Dedicated Task Box Assignment State
  const [taskBoxUserId, setTaskBoxUserId] = useState('');
  const [taskBoxPackage, setTaskBoxPackage] = useState('Standard 25 Package');
  const [taskBoxResetProgress, setTaskBoxResetProgress] = useState(true);
  const [isTaskBoxAssigning, setIsTaskBoxAssigning] = useState(false);
  const [taskBoxSuccessMsg, setTaskBoxSuccessMsg] = useState('');

  // Auto-select first user with pending request if not chosen
  useEffect(() => {
    if (!taskBoxUserId && adminUsers && adminUsers.length > 0) {
      const pendingUser = adminUsers.find(u => u.taskPackageRequested);
      if (pendingUser) {
        setTaskBoxUserId(pendingUser.id);
      } else {
        setTaskBoxUserId(adminUsers[0].id);
      }
    }
  }, [adminUsers, taskBoxUserId]);

  const handleTaskBoxSubmit = async (e) => {
    e && e.preventDefault();
    if (!taskBoxUserId) {
      alert('Please select a member first');
      return;
    }
    setIsTaskBoxAssigning(true);
    setTaskBoxSuccessMsg('');
    try {
      const activeTasks = (tasks || []).filter(t => t.active !== false);
      let selectedTasks = [];

      if (taskBoxPackage === 'eBay 25 Campaign') {
        selectedTasks = activeTasks.filter(t => (t.platform || '').toLowerCase() === 'ebay');
      } else if (taskBoxPackage === 'Walmart 25 Campaign') {
        selectedTasks = activeTasks.filter(t => (t.platform || '').toLowerCase() === 'walmart');
      } else if (taskBoxPackage === 'Temu 25 Campaign') {
        selectedTasks = activeTasks.filter(t => (t.platform || '').toLowerCase() === 'temu');
      } else if (taskBoxPackage === 'Learning 1-25 Campaign') {
        selectedTasks = [...activeTasks].sort((a, b) => (Number(a.learningStep) || 99) - (Number(b.learningStep) || 99));
      } else {
        // Standard or Randomized: shuffle active pool
        const shuffled = [...activeTasks];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        selectedTasks = shuffled;
      }

      // Ensure 25 tasks
      if (selectedTasks.length < 25) {
        const remaining = activeTasks.filter(t => !selectedTasks.some(st => st.id === t.id));
        selectedTasks = [...selectedTasks, ...remaining];
      }
      const finalTasks = selectedTasks.slice(0, 25);

      const targetMember = adminUsers.find(u => u.id === taskBoxUserId || String(u.id) === String(taskBoxUserId));
      const res = await (adminAssignTasksToUser || adminAssignRandomTasks)(
        taskBoxUserId,
        finalTasks,
        taskBoxPackage,
        taskBoxResetProgress
      );

      if (res) {
        setTaskBoxSuccessMsg(`Assigned 25 tasks (${taskBoxPackage}) to ${targetMember?.name || 'Member'}. Member task package is active and unlocks strictly 1 by 1!`);
        setTimeout(() => setTaskBoxSuccessMsg(''), 7000);
      }
    } catch (err) {
      console.error('Task box assignment error:', err);
    } finally {
      setIsTaskBoxAssigning(false);
    }
  };

  // Admin login gate states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [sidebarNavSearch, setSidebarNavSearch] = useState('');

  // Manual Direct Deposit Modal State
  const [showManualDepositModal, setShowManualDepositModal] = useState(false);
  const [manualDepositData, setManualDepositData] = useState({
    userId: adminUsers[0]?.id || user?.id || '',
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
    bankHolder: systemDepositAccounts?.bankHolder || 'Ecomxstocks Global Escrow Vault Ltd',
    bankSwift: systemDepositAccounts?.bankSwift || 'SCBLGB2L',
    depositInstructions: systemDepositAccounts?.depositInstructions || 'Please include your Account ID as transfer memo.'
  }));
  const [gatewaySavedMsg, setGatewaySavedMsg] = useState(false);

  useEffect(() => {
    if (systemDepositAccounts && Object.keys(systemDepositAccounts).length > 0) {
      setGatewayForm(prev => ({
        ...prev,
        ...systemDepositAccounts
      }));
    }
  }, [systemDepositAccounts]);

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

  // Random and specific task assignment modal states
  const [showAssignRandomModal, setShowAssignRandomModal] = useState(false);
  const [selectedUserForRandom, setSelectedUserForRandom] = useState('');
  const [randomTaskCount, setRandomTaskCount] = useState(25);
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [selectedUserForSpecific, setSelectedUserForSpecific] = useState('');
  const [assignUserModalUser, setAssignUserModalUser] = useState(null);
  const [selectedTaskToAssignToUser, setSelectedTaskToAssignToUser] = useState('');

  const TASK_PRESETS = [
    {
      title: 'Apple AirPods Pro 2nd Gen Wireless Noise Cancelling Earbuds',
      platform: 'eBay',
      category: 'Flash Deals',
      price: 189.00,
      commissionRate: 4.5,
      requiredDeposit: 50.00,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
      tag: 'Trending',
      description: 'High-volume trending consumer audio accessories promotional campaign.'
    },
    {
      title: 'Samsung Galaxy Watch 6 Bluetooth 44mm Smartwatch with ECG',
      platform: 'Walmart',
      category: 'Best Sellers',
      price: 229.00,
      commissionRate: 5.0,
      requiredDeposit: 80.00,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      tag: 'Hot Deal',
      description: 'Smart wearable lifestyle review and consumer promotion task.'
    },
    {
      title: 'DJI Mini 4 Pro Drone with 4K HDR Video Quadcopter',
      platform: 'Amazon',
      category: 'Trending Campaigns',
      price: 349.00,
      commissionRate: 5.5,
      requiredDeposit: 150.00,
      image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80',
      tag: 'VIP Exclusive',
      description: 'Premium aerial technology sponsored merchant campaign.'
    },
    {
      title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera 4K 60p',
      platform: 'Temu',
      category: 'New Arrivals',
      price: 499.00,
      commissionRate: 6.0,
      requiredDeposit: 200.00,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      tag: 'High Yield',
      description: 'Professional grade optics equipment evaluation task.'
    }
  ];

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
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
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
  const [editAssignedPackage, setEditAssignedPackage] = useState('none');

  // Inspect User Record & Dossier Modal
  const [inspectingUser, setInspectingUser] = useState(null);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');
  const [processingDepositId, setProcessingDepositId] = useState(null);

  // Stats calculation
  const uniqueRecords = useMemo(() => {
    return deduplicateRecords(records || []);
  }, [records]);

  const pendingDeposits = uniqueRecords.filter(r => r.category === 'Deposit' && r.status === 'Pending');
  const pendingWithdrawals = uniqueRecords.filter(r => r.category === 'Withdrawal' && r.status === 'Pending');
  const totalCompletedDeposits = uniqueRecords
    .filter(r => r.category === 'Deposit' && r.status === 'Completed')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalCompletedWithdrawals = uniqueRecords
    .filter(r => r.category === 'Withdrawal' && r.status === 'Completed')
    .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount) || 0), 0);
  const totalCompletedTasks = uniqueRecords.filter(r => r.category === 'Ad Tasks').length;
  const totalUserBalances = (adminUsers || []).reduce((sum, u) => sum + (parseFloat(u.balance) || 0), 0) + (parseFloat(user?.balance) || 0);

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
    const cleanName = (newUserData.name || '').trim();
    if (!cleanName) {
      alert('Please enter a username.');
      return;
    }
    if (adminUsers.some(u => (u.name || '').trim().toLowerCase() === cleanName.toLowerCase())) {
      alert(`Username "${cleanName}" is already taken. Please choose a unique username.`);
      return;
    }
    try {
      const cleanRef = sanitizeReferralCode(newUserData.referralCode) || '888888';
      const created = await registerAccount(
        cleanName,
        newUserData.email,
        newUserData.password,
        cleanRef
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
        referralCode: '888888'
      });
      addNotification('User Provisioned', `New user ${created.name} successfully registered.`);
    } catch (err) {
      alert('Error creating user account: ' + err.message);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const cleanRef = sanitizeReferralCode(editReferralCode) || editingUser.referralCode || editingUser.code;
    const cleanInvitedBy = sanitizeReferralCode(editInvitedByCode) || editingUser.invitedByCode || editingUser.referredByCode;
    const updates = {
      name: editName.trim() || editingUser.name,
      email: editEmail.trim() || editingUser.email,
      balance: parseFloat(editBalance) >= 0 ? parseFloat(editBalance) : 0,
      vipLevel: editTier,
      vipTier: editTier,
      vip_level: editTier,
      status: editStatus,
      walletAddress: editWalletAddress,
      wallet_address: editWalletAddress,
      kyc: editKyc,
      kycStatus: editKyc,
      kyc_status: editKyc,
      referralCode: cleanRef,
      code: cleanRef,
      referral_code: cleanRef,
      invitedByCode: cleanInvitedBy,
      referredByCode: cleanInvitedBy,
      invited_by_code: cleanInvitedBy,
      pendingTasks: parseInt(editPendingTasks, 10) || 0,
      pending_tasks: parseInt(editPendingTasks, 10) || 0,
      completedTasks: parseInt(editCompletedTasks, 10) || 0,
      completed_tasks: parseInt(editCompletedTasks, 10) || 0,
      dailyQuota: parseInt(editDailyQuota, 10) || 25,
      daily_quota: parseInt(editDailyQuota, 10) || 25,
      dailyCompleted: parseInt(editCompletedTasks, 10) || 0,
      daily_completed: parseInt(editCompletedTasks, 10) || 0,
      assignedPackage: editAssignedPackage === 'none' ? null : editAssignedPackage,
      assigned_package: editAssignedPackage === 'none' ? null : editAssignedPackage,
      taskPackageStatus: editAssignedPackage === 'none' ? null : 'assigned',
      task_package_status: editAssignedPackage === 'none' ? null : 'assigned',
      taskPackageRequested: false,
      task_package_requested: false
    };
    await adminUpdateUser(editingUser.id, updates);
    setEditingUser(null);
  };

  const handleDeleteUserClick = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to permanently delete user account "${userName}"? This will delete the account from the database and immediately disconnect the user.`)) {
      try {
        await adminDeleteUser(userId);
        alert(`User account "${userName}" has been permanently deleted.`);
      } catch (err) {
        alert(err.message || 'Failed to delete user account.');
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
        userId: adminUsers[0]?.id || user?.id || '',
        amount: '100.00',
        network: 'TRC20',
        note: 'Administrative Account Balance Top-Up'
      });
    } catch (err) {
      alert('Manual deposit failed: ' + err.message);
    }
  };

  const handleSaveGatewayAccounts = async (e) => {
    e.preventDefault();
    try {
      await updateSystemDepositAccounts(gatewayForm);
      setGatewaySavedMsg(true);
      setTimeout(() => setGatewaySavedMsg(false), 4000);
      alert('System deposit wallet addresses and payment gateway settings updated successfully.');
    } catch (err) {
      alert('Failed to save deposit gateway settings: ' + err.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await adminAddTask({
        ...newTask,
        price: parseFloat(newTask.price),
        commissionRate: parseFloat(newTask.commissionRate),
        requiredDeposit: parseFloat(newTask.requiredDeposit || 0),
        adminCustomized: true,
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

  const handleOpenEditModal = (t) => {
    if (!t) return;
    const priceVal = t.price !== undefined && t.price !== null ? parseFloat(t.price) : 10;
    const commVal = parseFloat(
      t.commissionRate ??
      t.commission_rate ??
      t.commission ??
      (t.yieldRate ? parseFloat(t.yieldRate) : (t.yield_rate ? parseFloat(t.yield_rate) : 4))
    ) || 4;
    const reqDepVal = parseFloat(t.requiredDeposit ?? t.required_deposit ?? 0) || 0;
    const isLearnVal = Boolean(
      t.isLearning ??
      t.is_learning ??
      (t.title && t.title.toLowerCase().startsWith('step '))
    );
    let stepNum = t.learningStep ?? t.learning_step;
    if (!stepNum && t.title) {
      const match = t.title.match(/step\s*#?(\d+)/i);
      if (match) stepNum = parseInt(match[1], 10);
    }
    stepNum = stepNum || 1;

    const imgVal = t.image || t.imageUrl || t.image_url || getProductImage(t);
    const prodUrlVal = t.productUrl || t.product_url || getProductUrl(t);

    setEditingTask({
      ...t, // Preserves ALL fields (orders, rating, id, etc.)
      id: t.id,
      title: t.title || '',
      platform: t.platform || 'eBay',
      category: t.category || 'General',
      price: isNaN(priceVal) ? 10 : priceVal,
      commissionRate: isNaN(commVal) ? 4 : commVal,
      requiredDeposit: isNaN(reqDepVal) ? 0 : reqDepVal,
      isLearning: isLearnVal,
      learningStep: stepNum,
      image: imgVal,
      orders: t.orders !== undefined ? t.orders : 120,
      rating: t.rating !== undefined ? t.rating : 4.9,
      tag: t.tag || '',
      description: t.description || '',
      active: t.active !== false && t.status !== 'Inactive' && t.status !== 'Disabled',
      productUrl: prodUrlVal || ''
    });
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.id) return;
    try {
      const existing = tasks.find(x => String(x.id) === String(editingTask.id)) || {};
      const priceVal = parseFloat(editingTask.price);
      const commVal = parseFloat(editingTask.commissionRate);
      const depVal = parseFloat(editingTask.requiredDeposit);

      const finalPrice = !isNaN(priceVal) ? priceVal : (existing.price || 10);
      const finalComm = !isNaN(commVal) ? commVal : (existing.commissionRate || 4);
      const finalYield = parseFloat(((finalPrice * finalComm) / 100).toFixed(2));
      const finalDep = !isNaN(depVal) ? Math.max(0, depVal) : (existing.requiredDeposit || 0);

      const isLearn = Boolean(editingTask.isLearning);
      const stepVal = isLearn ? parseInt(editingTask.learningStep || 1, 10) : null;

      const finalImage = (editingTask.image || existing.image || getProductImage(editingTask)).trim();
      const finalProductUrl = editingTask.productUrl ? editingTask.productUrl.trim() : (existing.productUrl || null);

      // Merge existing task data so NO field is deleted
      const updatedPayload = {
        ...existing,
        ...editingTask,
        id: editingTask.id,
        title: (editingTask.title || existing.title || '').trim(),
        platform: editingTask.platform || existing.platform || 'eBay',
        category: editingTask.category || existing.category || 'General',
        price: finalPrice,
        commissionRate: finalComm,
        commission_rate: finalComm,
        yieldRate: `${finalComm}%`,
        yield_rate: `${finalComm}%`,
        yieldAmount: finalYield,
        yield_amount: finalYield,
        requiredDeposit: finalDep,
        required_deposit: finalDep,
        adminCustomized: true,
        isLearning: isLearn,
        is_learning: isLearn,
        learningStep: stepVal,
        learning_step: stepVal,
        image: finalImage,
        imageUrl: finalImage,
        image_url: finalImage,
        orders: editingTask.orders !== undefined ? editingTask.orders : (existing.orders || 120),
        rating: editingTask.rating !== undefined ? editingTask.rating : (existing.rating || 4.9),
        tag: editingTask.tag ?? existing.tag ?? '',
        description: editingTask.description ?? existing.description ?? '',
        active: Boolean(editingTask.active),
        status: editingTask.active ? 'Active' : 'Disabled',
        productUrl: finalProductUrl,
        product_url: finalProductUrl
      };

      await adminUpdateTask(editingTask.id, updatedPayload);
      setEditingTask(null);
    } catch (err) {
      console.error('Save task error:', err);
      alert('Error updating task: ' + (err.message || 'Please check your input values and try again.'));
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
      await adminRejectWithdrawal(rejectModalRecord.id, rejectReason);
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
          <span className="admin-security-tag">🔒 RESTRICTED PORTAL - ADMINISTRATORS ONLY</span>
          <h2>Ecomxstocks Operations Admin Control</h2>
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
        {/* Sidebar Top Header (Shopify Store Emblem & Close) */}
        <div className="admin-sidebar-header">
          <div className="sidebar-brand-group">
            <div className="admin-brand-icon">
              <ShieldCheck size={16} />
            </div>
            <div className="sidebar-brand-title">
              <span>Ecomxstocks</span>
              <span className="admin-ver-tag">ADMIN</span>
            </div>
          </div>
          <button 
            className="admin-sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Search Box (Matching Reference ⌘K Search) */}
        <div className="shopify-sidebar-search">
          <div className="shopify-search-field">
            <Search size={13} className="shopify-search-icon" />
            <input
              type="text"
              className="shopify-search-input"
              placeholder="Search"
              value={sidebarNavSearch}
              onChange={(e) => setSidebarNavSearch(e.target.value)}
            />
            <span className="shopify-search-kbd">⌘K</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div className="admin-sidebar-nav-scroll">
          {/* Section: Overview */}
          {(!sidebarNavSearch || 'platform overview home dashboard'.includes(sidebarNavSearch.toLowerCase())) && (
            <div className="admin-nav-section">
              <div className="nav-items-list">
                <button
                  className={`admin-nav-item ${activeAdminTab === 'overview' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('overview');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Home size={16} className="nav-item-icon" />
                  <span>Platform Overview</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Financial Operations */}
          {(!sidebarNavSearch || 'deposits withdrawals gateways credit financial operations'.includes(sidebarNavSearch.toLowerCase())) && (
            <div className="admin-nav-section">
              <span className="nav-section-title">Financial Operations</span>
              <div className="nav-items-list">
                <button
                  className={`admin-nav-item ${activeAdminTab === 'deposits' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('deposits');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Wallet size={16} className="nav-item-icon" />
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
                  <ArrowUpRight size={16} className="nav-item-icon" />
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
                  <Landmark size={16} className="nav-item-icon" />
                  <span>Deposit & Payout Gateways</span>
                </button>

                <button
                  className="admin-nav-item quick-action"
                  onClick={() => {
                    setShowManualDepositModal(true);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <DollarSign size={16} className="nav-item-icon" />
                  <span>Direct Balance Credit</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: User Management */}
          {(!sidebarNavSearch || 'users accounts balances ledger members'.includes(sidebarNavSearch.toLowerCase())) && (
            <div className="admin-nav-section">
              <span className="nav-section-title">Customers & Accounts</span>
              <div className="nav-items-list">
                <button
                  className={`admin-nav-item ${activeAdminTab === 'users' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('users');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Users size={16} className="nav-item-icon" />
                  <span>User Accounts & Balances</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Tasks & Engine */}
          {(!sidebarNavSearch || 'tasks pool vip commission rules catalogue 25 steps'.includes(sidebarNavSearch.toLowerCase())) && (
            <div className="admin-nav-section">
              <span className="nav-section-title">Task Engine & VIP Rules</span>
              <div className="nav-items-list">
                <button
                  className={`admin-nav-item ${activeAdminTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('tasks');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Layers size={16} className="nav-item-icon" />
                  <span>Task Pool (25 Steps)</span>
                </button>

                <button
                  className={`admin-nav-item ${activeAdminTab === 'tiers' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('tiers');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Sliders size={16} className="nav-item-icon" />
                  <span>VIP Commission Rules</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Customer Support & Telegram */}
          {(!sidebarNavSearch || 'support chat telegram bot channels messages'.includes(sidebarNavSearch.toLowerCase())) && (
            <div className="admin-nav-section">
              <span className="nav-section-title">Support & Channels</span>
              <div className="nav-items-list">
                <button
                  id="admin-nav-support"
                  className={`admin-nav-item ${activeAdminTab === 'support' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('support');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <MessageCircle size={16} className="nav-item-icon" />
                  <span className="flex-1 text-left">Live Chat & Support</span>
                  {supportState.unreadTotal > 0 && (
                    <span className="nav-badge alert">{supportState.unreadTotal}</span>
                  )}
                </button>

                <button
                  id="admin-nav-telegram"
                  className={`admin-nav-item ${activeAdminTab === 'telegram' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('telegram');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Send size={16} className="nav-item-icon" />
                  <span className="flex-1 text-left">Telegram Channels & Bot</span>
                  <span className="nav-badge">Live</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Security & Audit */}
          {(!sidebarNavSearch || 'audit security system logs trail'.includes(sidebarNavSearch.toLowerCase())) && (
            <div className="admin-nav-section">
              <span className="nav-section-title">System & Security</span>
              <div className="nav-items-list">
                <button
                  className={`admin-nav-item ${activeAdminTab === 'audit' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveAdminTab('audit');
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Database size={16} className="nav-item-icon" />
                  <span>Audit Trail & Ledger</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Controls (Shopify Polaris Style) */}
        <div className="admin-sidebar-footer">
          <button
            className={`admin-nav-item ${activeAdminTab === 'gateways' ? 'active' : ''}`}
            onClick={() => {
              setActiveAdminTab('gateways');
              setIsMobileSidebarOpen(false);
            }}
          >
            <Settings size={16} className="nav-item-icon" />
            <span>Settings</span>
          </button>

          <div className="admin-user-profile-strip">
            <div className="flex items-center gap-2 min-w-0">
              <div className="admin-avatar-box">
                <span>S</span>
              </div>
              <div className="admin-profile-meta">
                <span className="admin-profile-name">Ecomxstocks Admin</span>
                <span className="admin-profile-role">SuperAdmin</span>
              </div>
            </div>

            <div className="admin-footer-actions-grid">
              <button
                className="btn-sidebar-action"
                onClick={() => {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                }}
                title="Switch to User App"
              >
                <ExternalLink size={13} />
              </button>
              <button
                className="btn-sidebar-action warning"
                onClick={resetDemoData}
                title="Reset Database State"
              >
                <RefreshCw size={13} />
              </button>
              <button
                className="btn-sidebar-action danger"
                onClick={adminLogout}
                title="Lock Session"
              >
                <Lock size={13} />
              </button>
            </div>
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
                {activeAdminTab === 'telegram' && 'Official Telegram Channels & Bot Settings'}
              </h2>
            </div>
          </div>

          <div className="canvas-header-right">
            <div className="admin-header-status-pill">
              <span className="live-pulse-dot"></span>
              <span>TRC20 Active</span>
            </div>

            <div className="admin-header-search">
              <Search size={14} className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search accounts, tasks, tx..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-header-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn-header-app-switch"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
              title="Open Customer Front Interface"
            >
              <LayoutDashboard size={14} />
              <span>User App</span>
            </button>

            <div className="admin-header-user-badge">
              <div className="admin-header-avatar">S</div>
              <div className="admin-header-user-info">
                <span className="admin-header-user-name">SuperAdmin</span>
                <span className="admin-header-user-role">Operations</span>
              </div>
              <button
                type="button"
                className="btn-header-lock"
                onClick={adminLogout}
                title="Lock Admin Session"
              >
                <Lock size={13} />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Canvas Content */}
        <div className="admin-canvas-content">
        {activeAdminTab === 'support' && (
          <AdminSupportPanel supportState={supportState} />
        )}
        {activeAdminTab === 'telegram' && (
          <div className="admin-tab-pane animate-fade-in">
            <div className="admin-telegram-banner">
              <div className="admin-telegram-icon">
                ✈️
              </div>
              <div>
                <h3 className="admin-telegram-title">
                  Official Telegram Channels & Customer Support
                </h3>
                <p className="admin-telegram-desc">
                  Manage official Telegram broadcast channels, direct support links, and messages shown to users awaiting task assignment.
                </p>
              </div>
            </div>
            <SupportSettingsForm />
          </div>
        )}
        {/* =========================================
            1. TAB: OVERVIEW / KPIS
        ========================================= */}
        {activeAdminTab === 'overview' && (
          <div className="admin-overview animate-fade-in">
            {/* SAPPHIRE HERO BANNER (Exact matching aesthetic to User Side Dashboard Hero) */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <ShieldCheck size={13} className="text-amber-300" />
                        <span>OPERATIONS CONSOLE:</span>
                      </div>
                      <span className="invite-code-number">SUPERADMIN</span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <Users size={12} />
                      <span>Merchants ({adminUsers?.length || 0})</span>
                    </div>
                  </div>

                  <h2>Operations Command Center,</h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name">SuperAdmin</span>
                    <span className="greeting-wave">👋</span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="hero-bal-label">TOTAL VAULT LIQUIDITY</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">{formatUSDT(totalUserBalances).replace(' USDT', '')}</span>
                      <span className="bal-curr">USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons matching User Side Hero buttons */}
              <div className="hero-action-row">
                <button
                  type="button"
                  className="btn-hero-deposit"
                  onClick={() => setShowManualDepositModal(true)}
                  title="Credit any merchant account"
                >
                  <Wallet size={16} />
                  <span>Manual Credit</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => {
                    setSelectedUserForRandom(adminUsers[0]?.id || '');
                    setRandomTaskCount(25);
                    setShowAssignRandomModal(true);
                  }}
                  title="Assign 25 random tasks"
                >
                  <Shuffle size={16} />
                  <span>🎲 Assign 25 Random</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => setShowAddTaskModal(true)}
                  title="Add new task to catalog"
                >
                  <Plus size={16} />
                  <span>+ Add Campaign Task</span>
                </button>
              </div>
            </div>

            {/* IMMEDIATE ATTENTION: URGENT AUTHORIZATION QUEUE */}
            {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
              <div className="admin-action-required-banner mb-6 animate-slide-down">
                <div className="action-required-left">
                  <div className="action-required-badge">
                    <AlertTriangle size={15} className="text-amber-500" />
                    <span>ACTION REQUIRED</span>
                  </div>
                  <div className="action-required-text">
                    <strong>
                      {pendingDeposits.length > 0 && `${pendingDeposits.length} Deposit${pendingDeposits.length > 1 ? 's' : ''}`}
                      {pendingDeposits.length > 0 && pendingWithdrawals.length > 0 && ' & '}
                      {pendingWithdrawals.length > 0 && `${pendingWithdrawals.length} Withdrawal${pendingWithdrawals.length > 1 ? 's' : ''}`}
                      {' '}Awaiting Verification
                    </strong>
                    <span className="action-required-sub">Pending financial requests require admin authorization before balance ledger settlement.</span>
                  </div>
                </div>
                <div className="action-required-buttons">
                  {pendingDeposits.length > 0 && (
                    <button
                      type="button"
                      className="btn-action-banner deposit"
                      onClick={() => setActiveAdminTab('deposits')}
                    >
                      <Wallet size={14} />
                      <span>Review Deposits ({pendingDeposits.length})</span>
                    </button>
                  )}
                  {pendingWithdrawals.length > 0 && (
                    <button
                      type="button"
                      className="btn-action-banner withdrawal"
                      onClick={() => setActiveAdminTab('withdrawals')}
                    >
                      <ArrowUpRight size={14} />
                      <span>Review Payouts ({pendingWithdrawals.length})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 4 REFINED STAT CARDS */}
            <div className="four-stats-grid mb-6">
              {/* Sapphire Card */}
              <div className="stat-card sapphire-card">
                <div className="stat-card-icon">
                  <Wallet size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{formatUSDT(totalUserBalances).replace(' USDT', '')} <span className="stat-unit">USDT</span></div>
                  <span className="stat-label">Total Vault Balance</span>
                </div>
              </div>

              {/* Green Card */}
              <div className="stat-card green-card">
                <div className="stat-card-icon">
                  <TrendingUp size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{formatUSDT(totalCompletedDeposits).replace(' USDT', '')} <span className="stat-unit">USDT</span></div>
                  <span className="stat-label">Total Deposited Volume</span>
                </div>
              </div>

              {/* Blue Card */}
              <div className="stat-card blue-card">
                <div className="stat-card-icon">
                  <Clock size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{pendingDeposits.length + pendingWithdrawals.length}</div>
                  <span className="stat-label">Pending Requests</span>
                </div>
              </div>

              {/* Orange Card */}
              <div className="stat-card orange-card">
                <div className="stat-card-icon">
                  <Users size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{adminUsers.length}</div>
                  <span className="stat-label">Registered Merchants</span>
                </div>
              </div>
            </div>

            {/* ACTIVITY COUNTERS ROW (Exact match to User Side .activity-counters-row) */}
            <div className="activity-counters-row mb-6">
              <div className="counter-item">
                <div className="counter-icon-wrap amber">
                  <Clock size={15} />
                </div>
                <div className="counter-info">
                  <strong className="counter-val">{pendingDeposits.length}</strong>
                  <span className="counter-name">Pending Deposits</span>
                </div>
              </div>

              <div className="counter-item">
                <div className="counter-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>
                  <ArrowUpRight size={15} />
                </div>
                <div className="counter-info">
                  <strong className="counter-val">{pendingWithdrawals.length}</strong>
                  <span className="counter-name">Pending Withdrawals</span>
                </div>
              </div>

              <div className="counter-item">
                <div className="counter-icon-wrap green">
                  <CheckCircle2 size={15} />
                </div>
                <div className="counter-info">
                  <strong className="counter-val">{totalCompletedTasks + (user?.completedTasks || 0)}</strong>
                  <span className="counter-name">Completed Tasks</span>
                </div>
              </div>

              <div className="counter-item">
                <div className="counter-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Layers size={15} />
                </div>
                <div className="counter-info">
                  <strong className="counter-val">{tasks.length}</strong>
                  <span className="counter-name">Catalog Tasks</span>
                </div>
              </div>
            </div>

            {/* Priority Operational Approvals Grid */}
            <div className="admin-pending-approvals-grid">
              {/* Column 1: Pending Deposits */}
              <div className="admin-panel-card">
                <div className="admin-gateway-card-header">
                  <div className="admin-gateway-title-wrap">
                    <Wallet size={18} className="text-blue-600" />
                    <h3 className="admin-gateway-title">Pending Deposits</h3>
                  </div>
                  <button type="button" className="admin-badge neutral" style={{ cursor: 'pointer' }} onClick={() => setActiveAdminTab('deposits')}>
                    View All ({pendingDeposits.length}) →
                  </button>
                </div>

                {pendingDeposits.length === 0 ? (
                  <div className="admin-pending-empty">
                    <div className="admin-pending-empty-icon">
                      <CheckCircle2 size={22} />
                    </div>
                    <strong>Queue Cleared</strong>
                    <span>All deposits approved and settled.</span>
                  </div>
                ) : (
                  <div className="admin-pending-list">
                    {pendingDeposits.slice(0, 5).map(dep => {
                      const depKey = dep.id || dep.code;
                      const isProcessing = processingDepositId === depKey;
                      const uInitial = ((dep.userName || dep.user_name || 'M')[0] || 'M').toUpperCase();
                      return (
                        <div key={depKey} className="admin-pending-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div className="admin-pending-avatar">
                              {uInitial}
                            </div>
                            <div className="admin-pending-item-info">
                              <span className="admin-pending-item-user">
                                {dep.userName || dep.user_name || 'Member'}
                                <span className="cell-tracking-code">{dep.code || dep.id}</span>
                              </span>
                              <span className="admin-pending-item-meta">
                                <span>{dep.date}</span>
                                <span>•</span>
                                <span>{dep.network || 'TRC20'}</span>
                                <span>•</span>
                                {(dep.txHash || dep.tx_hash) && (dep.txHash || dep.tx_hash) !== 'Direct Deposit' ? (
                                  <span className="cell-mono-addr">{formatCompactAddress(dep.txHash || dep.tx_hash)}</span>
                                ) : (
                                  <span className="cell-text-label">Direct Deposit</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="admin-pending-item-actions">
                            <span className="admin-pending-item-amount deposit">
                              {formatUSDT(dep.amount, true)}
                            </span>
                            <button
                              type="button"
                              className="btn-table-action-approve"
                              disabled={isProcessing}
                              onClick={async () => {
                                if (processingDepositId) return;
                                setProcessingDepositId(depKey);
                                try {
                                  await adminApproveDeposit(depKey, dep);
                                } finally {
                                  setProcessingDepositId(null);
                                }
                              }}
                            >
                              {isProcessing ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              className="btn-table-action-reject"
                              disabled={isProcessing}
                              onClick={async () => {
                                if (processingDepositId) return;
                                setProcessingDepositId(depKey);
                                try {
                                  await adminRejectDeposit(depKey, 'Deposit unverified or invalid transaction hash', dep);
                                } finally {
                                  setProcessingDepositId(null);
                                }
                              }}
                            >
                              {isProcessing ? '...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column 2: Pending Withdrawals */}
              <div className="admin-panel-card">
                <div className="admin-gateway-card-header">
                  <div className="admin-gateway-title-wrap">
                    <ArrowUpRight size={18} className="text-blue-600" />
                    <h3 className="admin-gateway-title">Pending Withdrawals</h3>
                  </div>
                  <button type="button" className="admin-badge neutral" style={{ cursor: 'pointer' }} onClick={() => setActiveAdminTab('withdrawals')}>
                    View All ({pendingWithdrawals.length}) →
                  </button>
                </div>

                {pendingWithdrawals.length === 0 ? (
                  <div className="admin-pending-empty">
                    <div className="admin-pending-empty-icon" style={{ background: '#f8fafc', color: '#64748b' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <strong>No Pending Payouts</strong>
                    <span>No pending withdrawal requests in queue.</span>
                  </div>
                ) : (
                  <div className="admin-pending-list">
                    {pendingWithdrawals.slice(0, 5).map(wth => {
                      const uInitial = ((wth.userName || 'M')[0] || 'M').toUpperCase();
                      return (
                        <div key={wth.id} className="admin-pending-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div className="admin-pending-avatar withdrawal">
                              {uInitial}
                            </div>
                            <div className="admin-pending-item-info">
                              <span className="admin-pending-item-user">
                                {wth.userName || 'Member'}
                                <span className="cell-tracking-code">{wth.code}</span>
                              </span>
                              <span className="admin-pending-item-meta">
                                <span>{wth.date}</span>
                                <span>•</span>
                                <span className="cell-mono-addr">{formatCompactAddress(wth.destination)}</span>
                              </span>
                            </div>
                          </div>
                          <div className="admin-pending-item-actions">
                            <span className="admin-pending-item-amount withdrawal">
                              {formatUSDT(wth.amount, false)}
                            </span>
                            <button
                              type="button"
                              className="btn-table-action-approve"
                              onClick={() => {
                                setDispatchModalRecord(wth);
                                setDispatchTxHash(`0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`);
                              }}
                            >
                              Dispatch TX
                            </button>
                            <button
                              type="button"
                              className="btn-table-action-reject"
                              onClick={() => setRejectModalRecord(wth)}
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PARTNER PLATFORMS & CAMPAIGN DISPATCH */}
            <div className="partner-platforms-card mb-6">
              <span className="card-section-title">PARTNER PLATFORMS & CAMPAIGN DISPATCH</span>
              <div className="platforms-pills-row">
                {[
                  { name: 'eBay', platform: 'ebay', url: 'https://www.ebay.com', icon: <EbayLogo size={42} /> },
                  { name: 'Walmart', platform: 'walmart', url: 'https://www.walmart.com', icon: <WalmartLogo size={42} /> },
                  { name: 'Temu', platform: 'temu', url: 'https://www.temu.com', icon: <TemuLogo size={42} /> },
                  { name: 'Amazon', platform: 'amazon', url: 'https://www.amazon.com', icon: <AmazonLogo size={42} /> },
                  { name: 'AliExpress', platform: 'aliexpress', url: 'https://www.aliexpress.com', icon: <AliExpressLogo size={42} /> },
                  { name: 'Target', platform: 'target', url: 'https://www.target.com', icon: <TargetLogo size={42} /> },
                  { name: 'Shopify', platform: 'shopify', url: 'https://www.shopify.com', icon: <ShopifyLogo size={42} /> },
                  { name: 'Shopee', platform: 'shopee', url: 'https://www.shopee.com', icon: <ShopeeLogo size={42} /> },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="partner-pill-item cursor-pointer"
                    onClick={() => {
                      setActiveAdminTab('tasks');
                      setTaskSearch(item.name);
                    }}
                    title={`Filter ${item.name} catalog tasks`}
                  >
                    <div className={`platform-logo-circle ${item.platform}`}>
                      {item.icon}
                    </div>
                    <span className="partner-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <span>{item.name}</span>
                      <ExternalLink size={10} style={{ opacity: 0.6 }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consolidated Task Engine & Campaign Distribution Card */}
            <div className="admin-campaign-card animate-fade-in">
              <div className="admin-campaign-header">
                <div className="admin-campaign-title-group">
                  <h2 className="admin-campaign-title">
                    <span>Task Assignment & Campaign Allocation ("Task Box")</span>
                    <span className="admin-campaign-badge">25 Tasks Engine</span>
                  </h2>
                  <p className="admin-campaign-desc">
                    Assign 25 merchant tasks sequentially. Unlocks strictly 1 by 1 as the user completes reviews.
                  </p>
                </div>

                <div className="admin-campaign-quick-links">
                  <button
                    type="button"
                    className="btn-admin-secondary btn-admin-sm"
                    onClick={() => setActiveAdminTab('tasks')}
                  >
                    <Edit2 size={13} />
                    <span>Manage Catalogue</span>
                  </button>
                  <button
                    type="button"
                    className="btn-admin-secondary btn-admin-sm"
                    onClick={() => setShowAddTaskModal(true)}
                  >
                    <Plus size={13} />
                    <span>+ Add Task</span>
                  </button>
                </div>
              </div>

              {/* Pending Client Alert bar if any */}
              {adminUsers.filter(u => u.taskPackageRequested).length > 0 && (
                <div className="admin-pending-alert-bar mt-3">
                  <div className="admin-pending-alert-title">
                    <AlertCircle size={15} />
                    <span>Pending Task Requests — Click to select for immediate assignment:</span>
                  </div>
                  <div className="admin-pending-chips">
                    {adminUsers.filter(u => u.taskPackageRequested).map(pu => (
                      <button
                        key={pu.id}
                        type="button"
                        className={`admin-pending-chip-btn ${taskBoxUserId === pu.id ? 'active' : ''}`}
                        onClick={() => setTaskBoxUserId(pu.id)}
                      >
                        ⚡ {pu.name} (Req: {pu.taskRequestId || '130-SYTL'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleTaskBoxSubmit} className="admin-campaign-form">
                <div className="admin-campaign-inputs-grid">
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      <span>Target Member Account</span>
                      <span className="admin-form-label-sub">{adminUsers.length} members</span>
                    </label>
                    <select
                      className="admin-form-select"
                      value={taskBoxUserId}
                      onChange={(e) => setTaskBoxUserId(e.target.value)}
                    >
                      <option value="">-- Choose Member --</option>
                      {adminUsers.map(u => {
                        const isPending = !!u.taskPackageRequested;
                        return (
                          <option key={u.id} value={u.id}>
                            {isPending ? '⚠️ [PENDING] ' : ''}{u.name} ({maskEmail(u.email)}) - {formatUSDT(u.balance)} - {u.assignedPackage || 'No Package'} ({u.dailyCompleted || u.completedTasks || 0}/25)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Campaign Package</label>
                    <select
                      className="admin-form-select"
                      value={taskBoxPackage}
                      onChange={(e) => setTaskBoxPackage(e.target.value)}
                    >
                      <option value="Standard 25 Package">Standard 25 Merchant Tasks (Sequential 1-by-1 Unlock)</option>
                      <option value="Learning 1-25 Campaign">Progressive Learning 1-25 Campaign</option>
                      <option value="eBay 25 Campaign">eBay Official 25 Tasks Campaign</option>
                      <option value="Walmart 25 Campaign">Walmart Superstore 25 Tasks Campaign</option>
                      <option value="Temu 25 Campaign">Temu Wholesale 25 Tasks Campaign</option>
                      <option value="Random 25 Package">Randomized 25 Tasks from Active Pool</option>
                    </select>
                  </div>
                </div>

                {/* Selected Member Live Snapshot */}
                {(() => {
                  const selectedU = adminUsers.find(u => u.id === taskBoxUserId || String(u.id) === String(taskBoxUserId));
                  if (!selectedU) return null;
                  const isPending = !!selectedU.taskPackageRequested;
                  const completedSoFar = Number(selectedU.dailyCompleted ?? selectedU.completedTasks ?? 0);
                  const quota = Number(selectedU.dailyQuota || 25);
                  return (
                    <div className="admin-member-snapshot">
                      <div className="admin-member-snapshot-left">
                        <div className="admin-member-avatar">
                          {(selectedU.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="admin-member-meta">
                          <div className="admin-member-name-row">
                            <span className="admin-member-name">{selectedU.name}</span>
                            <span className="admin-badge neutral">{selectedU.role || 'Member'}</span>
                            <span className="admin-badge success">{selectedU.vipLevel || 'VIP 1'}</span>
                            {isPending && (
                              <span className="admin-badge pending">⚠️ Awaiting Assignment</span>
                            )}
                          </div>
                          <div className="admin-member-sub-row">
                            <span>ID: <code className="admin-id-code">{selectedU.id}</code></span>
                            <span>•</span>
                            <span>{maskEmail(selectedU.email)}</span>
                            <span>•</span>
                            <span>Balance: <strong className="admin-member-balance">{formatUSDT(selectedU.balance)}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="admin-member-snapshot-right">
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Task Progress</span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                          {selectedU.assignedPackage || 'None Assigned'} ({completedSoFar}/{quota} completed)
                        </strong>
                        <div className="admin-progress-track">
                          <div
                            className="admin-progress-fill"
                            style={{ width: `${Math.min(100, Math.round((completedSoFar / quota) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="admin-campaign-submit-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#059669', fontWeight: 500 }}>
                      <input type="checkbox" checked={true} disabled={true} />
                      <span>Strict 1-by-1 Sequential Unlock Enforced</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={taskBoxResetProgress}
                        onChange={(e) => setTaskBoxResetProgress(e.target.checked)}
                      />
                      <span>Reset progress count to 0 (starts at Task #1)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!taskBoxUserId || isTaskBoxAssigning}
                    className="btn-admin-primary"
                  >
                    {isTaskBoxAssigning ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Assigning 25 Tasks...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>
                          {adminUsers.find(u => u.id === taskBoxUserId)?.taskPackageRequested
                            ? 'Approve & Assign 25 Tasks'
                            : 'Assign 25 Tasks (Sequential Unlock)'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {taskBoxSuccessMsg && (
                  <div className="notice-box positive mt-3 animate-fade-in" style={{ padding: '10px 14px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <CheckCircle2 size={16} />
                    <span>{taskBoxSuccessMsg}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Announcement Broadcast Card */}
            <div className="admin-panel-card mt-6">
              <div className="admin-gateway-card-header">
                <div className="admin-gateway-title-wrap">
                  <Bell size={18} className="text-blue-600" />
                  <h3 className="admin-gateway-title">Publish Global Platform Announcement</h3>
                </div>
                <span className="admin-badge neutral">Global Broadcast</span>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <form onSubmit={handleSendBroadcast} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. System upgrade scheduled for midnight. All deposits and task commissions running normally."
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    className="admin-form-input"
                    style={{ flex: 1, minWidth: '260px' }}
                  />
                  <button type="submit" className="btn-admin-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
                    <Send size={14} />
                    <span>Broadcast Notice</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            2. TAB: DEPOSITS & MANUAL CREDITS
        ========================================= */}
        {activeAdminTab === 'deposits' && (
          <div className="admin-deposits animate-fade-in">
            {/* SAPPHIRE HERO BANNER (Homepage aesthetic) */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <Wallet size={13} className="text-amber-300" />
                        <span>DEPOSIT AUDIT & SETTLEMENT:</span>
                      </div>
                      <span className="invite-code-number">LIVE TRON INGESTION</span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <Clock size={12} />
                      <span>{pendingDeposits.length} Pending Approval</span>
                    </div>
                  </div>

                  <h2>Deposit Requests & Blockchain Proofs</h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name" style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>
                      Review on-chain confirmations, audit transaction hashes, and process manual balance credits.
                    </span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="hero-bal-label">TOTAL DEPOSITED</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">{formatUSDT(totalCompletedDeposits).replace(' USDT', '')}</span>
                      <span className="bal-curr">USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons matching User Side Hero buttons */}
              <div className="hero-action-row">
                <button
                  type="button"
                  className="btn-hero-deposit"
                  onClick={() => setShowManualDepositModal(true)}
                  title="Credit Member Account"
                >
                  <Plus size={16} />
                  <span>+ Manual Direct Credit</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => setActiveAdminTab('gateways')}
                  title="Configure Receiving Wallets"
                >
                  <Landmark size={16} />
                  <span>Configure Vaults</span>
                </button>
              </div>
            </div>

            {/* 4 COLORED STAT CARDS (Exact match to User Side .four-stats-grid) */}
            <div className="four-stats-grid mb-6">
              {/* Sapphire Card */}
              <div className="stat-card sapphire-card">
                <div className="stat-card-icon">
                  <TrendingUp size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{formatUSDT(totalCompletedDeposits).replace(' USDT', '')} <span className="stat-unit">USDT</span></div>
                  <span className="stat-label">Total Verified Inflows</span>
                </div>
              </div>

              {/* Green Card */}
              <div className="stat-card green-card">
                <div className="stat-card-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{uniqueRecords.filter(r => r.category === 'Deposit' && (r.status || '').toLowerCase() === 'completed').length} <span className="stat-unit">Txns</span></div>
                  <span className="stat-label">Completed Deposits</span>
                </div>
              </div>

              {/* Blue Card */}
              <div className="stat-card blue-card">
                <div className="stat-card-icon">
                  <Clock size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{pendingDeposits.length} <span className="stat-unit">Pending</span></div>
                  <span className="stat-label">Awaiting Verification</span>
                </div>
              </div>

              {/* Orange Card */}
              <div className="stat-card orange-card">
                <div className="stat-card-icon">
                  <QrCode size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">TRC20 <span className="stat-unit">Active</span></div>
                  <span className="stat-label">Primary Gateway Protocol</span>
                </div>
              </div>
            </div>

            {/* Live Receiving Address Banner */}
            <div className="admin-panel-card mb-4">
              <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="admin-badge success">ACTIVE TRC20 RECEIVING VAULT</span>
                  <code className="cell-mono-addr">{systemDepositAccounts?.trc20Address}</code>
                  <button
                    type="button"
                    className="cell-copy-btn"
                    title="Copy Receiving Address"
                    onClick={() => copyToClipboard(systemDepositAccounts?.trc20Address, 'TRC20 Receiving Address')}
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Connected to TRON Network · Live Ingestion</span>
              </div>
            </div>

            {/* Table Container with Toolbar & Clean Data Table */}
            <div className="admin-table-container">
              <div className="admin-table-toolbar">
                <div className="admin-table-filter-tabs">
                  {[
                    { id: 'all', label: `All (${uniqueRecords.filter(r => r.category === 'Deposit').length})` },
                    { id: 'pending', label: `Pending (${uniqueRecords.filter(r => r.category === 'Deposit' && (r.status || 'Pending').toLowerCase() === 'pending').length})` },
                    { id: 'completed', label: `Completed (${uniqueRecords.filter(r => r.category === 'Deposit' && (r.status || '').toLowerCase() === 'completed').length})` },
                    { id: 'rejected', label: `Rejected (${uniqueRecords.filter(r => r.category === 'Deposit' && (r.status || '').toLowerCase() === 'rejected').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`admin-table-tab-btn ${depositFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setDepositFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="admin-table-toolbar-right">
                  <div className="admin-table-search-wrap">
                    <Search size={13} className="admin-table-search-icon" />
                    <input
                      type="text"
                      placeholder="Search deposits..."
                      value={depositSearch}
                      onChange={(e) => setDepositSearch(e.target.value)}
                      className="admin-table-search-input"
                    />
                  </div>
                  <span className="admin-table-count-text">
                    Showing {uniqueRecords.filter(r => {
                      if (r.category !== 'Deposit') return false;
                      if (depositFilter !== 'all' && (r.status || 'Pending').toLowerCase() !== depositFilter) return false;
                      if (depositSearch) {
                        const q = depositSearch.toLowerCase();
                        return (r.code && r.code.toLowerCase().includes(q)) ||
                               (r.userName && r.userName.toLowerCase().includes(q)) ||
                               (r.txHash && r.txHash.toLowerCase().includes(q));
                      }
                      return true;
                    }).length} records
                  </span>
                </div>
              </div>

              <div className="admin-data-table-scroll">
                <table className="admin-clean-table">
                  <thead>
                    <tr>
                      <th>Tracking Code</th>
                      <th>Member</th>
                      <th>Network</th>
                      <th className="text-right">Amount (USDT)</th>
                      <th>TX Hash / Reference</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = uniqueRecords.filter(r => {
                        if (r.category !== 'Deposit') return false;
                        if (depositFilter !== 'all' && (r.status || 'Pending').toLowerCase() !== depositFilter) return false;
                        if (depositSearch) {
                          const q = depositSearch.toLowerCase();
                          return (r.code && r.code.toLowerCase().includes(q)) ||
                                 (r.userName && r.userName.toLowerCase().includes(q)) ||
                                 (r.txHash && r.txHash.toLowerCase().includes(q));
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                              No deposit records match your selected filters.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map(rec => {
                        const recKey = rec.id || rec.code;
                        const isProcessing = processingDepositId === recKey;
                        const statusLower = (rec.status || 'Pending').toLowerCase();
                        return (
                          <tr key={recKey}>
                            <td>
                              <span className="cell-tracking-code">{rec.code || rec.id}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#0f172a' }}>{rec.userName || rec.user_name || 'Member'}</strong>
                            </td>
                            <td>
                              <span className="admin-badge neutral">{rec.network || 'TRC20'}</span>
                            </td>
                            <td className="text-right">
                              <span className="cell-amount positive">
                                {formatUSDT(rec.amount, true)}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                {(rec.txHash || rec.tx_hash) && (rec.txHash || rec.tx_hash) !== 'Direct Deposit' ? (
                                  <>
                                    <code className="cell-mono-addr">{formatCompactAddress(rec.txHash || rec.tx_hash)}</code>
                                    <button
                                      type="button"
                                      className="cell-copy-btn"
                                      title="Copy TX Hash"
                                      onClick={() => copyToClipboard(rec.txHash || rec.tx_hash, 'TX Hash')}
                                    >
                                      <Copy size={11} />
                                    </button>
                                  </>
                                ) : (
                                  <span className="cell-text-label">Direct Credit</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="cell-date">{rec.date}</span>
                            </td>
                            <td>
                              <span className={`admin-badge ${statusLower === 'completed' ? 'success' : statusLower === 'rejected' ? 'danger' : 'pending'}`}>
                                {rec.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {rec.status === 'Pending' ? (
                                <div className="admin-table-actions">
                                  <button
                                    type="button"
                                    className="btn-table-action-approve"
                                    title="Approve Deposit"
                                    disabled={isProcessing}
                                    onClick={async () => {
                                      if (processingDepositId) return;
                                      setProcessingDepositId(recKey);
                                      try {
                                        await adminApproveDeposit(recKey, rec);
                                      } finally {
                                        setProcessingDepositId(null);
                                      }
                                    }}
                                  >
                                    {isProcessing ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-table-action-reject"
                                    title="Reject Deposit"
                                    disabled={isProcessing}
                                    onClick={async () => {
                                      if (processingDepositId) return;
                                      setProcessingDepositId(recKey);
                                      try {
                                        await adminRejectDeposit(recKey, 'Deposit unverified or invalid transaction hash', rec);
                                      } finally {
                                        setProcessingDepositId(null);
                                      }
                                    }}
                                  >
                                    {isProcessing ? '...' : 'Reject'}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{rec.note || 'Settled'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
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
                              {u.name} ({maskEmail(u.email)}) - Balance: {formatUSDT(u.balance)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="input-group">
                          <label className="input-label">Deposit Amount (USDT)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            value={manualDepositData.amount}
                            onChange={(e) => setManualDepositData({ ...manualDepositData, amount: e.target.value })}
                            className="text-input-field tabular-nums"
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

                      <button type="submit" className="btn-admin-primary w-full justify-center mt-4" style={{ padding: '10px' }}>
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
            {/* SAPPHIRE HERO BANNER (Homepage aesthetic) */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <ArrowUpRight size={13} className="text-amber-300" />
                        <span>MULTI-SIG DISPATCH:</span>
                      </div>
                      <span className="invite-code-number">TRON BROADCAST</span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <Clock size={12} />
                      <span>{pendingWithdrawals.length} Pending Approval</span>
                    </div>
                  </div>

                  <h2>Withdrawal Approvals & Compliance</h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name" style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>
                      Multi-sig validation, compliance auditing, and TRON blockchain broadcasting.
                    </span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="hero-bal-label">TOTAL PAID OUT</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">{formatUSDT(totalCompletedWithdrawals).replace(' USDT', '')}</span>
                      <span className="bal-curr">USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons matching User Side Hero buttons */}
              <div className="hero-action-row">
                <button
                  type="button"
                  className="btn-hero-deposit"
                  onClick={() => setActiveAdminTab('overview')}
                  title="Return to Overview"
                >
                  <LayoutDashboard size={16} />
                  <span>Platform Overview</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => setActiveAdminTab('gateways')}
                  title="Configure Receiving Wallets"
                >
                  <Landmark size={16} />
                  <span>Configure Gateways</span>
                </button>
              </div>
            </div>

            {/* 4 COLORED STAT CARDS (Exact match to User Side .four-stats-grid) */}
            <div className="four-stats-grid mb-6">
              {/* Sapphire Card */}
              <div className="stat-card sapphire-card">
                <div className="stat-card-icon">
                  <ArrowUpRight size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{formatUSDT(totalCompletedWithdrawals).replace(' USDT', '')} <span className="stat-unit">USDT</span></div>
                  <span className="stat-label">Total Completed Dispatches</span>
                </div>
              </div>

              {/* Green Card */}
              <div className="stat-card green-card">
                <div className="stat-card-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{uniqueRecords.filter(r => r.category === 'Withdrawal' && (r.status || '').toLowerCase() === 'completed').length} <span className="stat-unit">Txns</span></div>
                  <span className="stat-label">Settled Dispatches</span>
                </div>
              </div>

              {/* Blue Card */}
              <div className="stat-card blue-card">
                <div className="stat-card-icon">
                  <Clock size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{pendingWithdrawals.length} <span className="stat-unit">Pending</span></div>
                  <span className="stat-label">Awaiting Compliance Sign-Off</span>
                </div>
              </div>

              {/* Orange Card */}
              <div className="stat-card orange-card">
                <div className="stat-card-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">100% <span className="stat-unit">Secure</span></div>
                  <span className="stat-label">TRC20 Gas Optimization</span>
                </div>
              </div>
            </div>

            {/* Table Container with Filter Toolbar */}
            <div className="admin-table-container">
              <div className="admin-table-toolbar">
                <div className="admin-table-filter-tabs">
                  {[
                    { id: 'all', label: `All (${uniqueRecords.filter(r => r.category === 'Withdrawal').length})` },
                    { id: 'pending', label: `Pending (${uniqueRecords.filter(r => r.category === 'Withdrawal' && (r.status || 'Pending').toLowerCase() === 'pending').length})` },
                    { id: 'completed', label: `Completed (${uniqueRecords.filter(r => r.category === 'Withdrawal' && (r.status || '').toLowerCase() === 'completed').length})` },
                    { id: 'rejected', label: `Rejected (${uniqueRecords.filter(r => r.category === 'Withdrawal' && (r.status || '').toLowerCase() === 'rejected').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`admin-table-tab-btn ${withdrawalFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setWithdrawalFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="admin-table-toolbar-right">
                  <div className="admin-table-search-wrap">
                    <Search size={13} className="admin-table-search-icon" />
                    <input
                      type="text"
                      placeholder="Search withdrawals..."
                      value={withdrawalSearch}
                      onChange={(e) => setWithdrawalSearch(e.target.value)}
                      className="admin-table-search-input"
                    />
                  </div>
                  <span className="admin-table-count-text">
                    Showing {uniqueRecords.filter(r => {
                      if (r.category !== 'Withdrawal') return false;
                      if (withdrawalFilter !== 'all' && (r.status || 'Pending').toLowerCase() !== withdrawalFilter) return false;
                      if (withdrawalSearch) {
                        const q = withdrawalSearch.toLowerCase();
                        return (r.code && r.code.toLowerCase().includes(q)) ||
                               (r.userName && r.userName.toLowerCase().includes(q)) ||
                               (r.destination && r.destination.toLowerCase().includes(q));
                      }
                      return true;
                    }).length} records
                  </span>
                </div>
              </div>

              <div className="admin-data-table-scroll">
                <table className="admin-clean-table">
                  <thead>
                    <tr>
                      <th>Tracking Code</th>
                      <th>Member</th>
                      <th>Gross Amount</th>
                      <th>Network Fee</th>
                      <th className="text-right">Net Dispatched</th>
                      <th>Destination Wallet</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = uniqueRecords.filter(r => {
                        if (r.category !== 'Withdrawal') return false;
                        if (withdrawalFilter !== 'all' && (r.status || 'Pending').toLowerCase() !== withdrawalFilter) return false;
                        if (withdrawalSearch) {
                          const q = withdrawalSearch.toLowerCase();
                          return (r.code && r.code.toLowerCase().includes(q)) ||
                                 (r.userName && r.userName.toLowerCase().includes(q)) ||
                                 (r.destination && r.destination.toLowerCase().includes(q));
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                              No withdrawal records match your selected filters.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map(rec => {
                        const statusLower = (rec.status || 'Pending').toLowerCase();
                        const grossVal = Math.abs(parseFloat(rec.amount) || 0);
                        const netVal = rec.netAmount ? parseFloat(rec.netAmount) : Math.max(0, grossVal - 1);
                        const destAddr = rec.destination || user?.walletAddress || 'TRC20Address';
                        return (
                          <tr key={rec.id || rec.code}>
                            <td>
                              <span className="cell-tracking-code">{rec.code}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#0f172a' }}>{rec.userName || 'Member'}</strong>
                            </td>
                            <td>
                              <span className="cell-amount negative">{formatUSDT(grossVal, false)}</span>
                            </td>
                            <td>
                              <span className="cell-date">1.00 USDT</span>
                            </td>
                            <td className="text-right">
                              <span className="cell-amount neutral">{formatUSDT(netVal, false)}</span>
                            </td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <code className="cell-mono-addr">{formatCompactAddress(destAddr)}</code>
                                <button
                                  type="button"
                                  className="cell-copy-btn"
                                  title="Copy Destination Wallet"
                                  onClick={() => copyToClipboard(destAddr, 'Wallet Address')}
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className="cell-date">{rec.date}</span>
                            </td>
                            <td>
                              <span className={`admin-badge ${statusLower === 'completed' ? 'success' : statusLower === 'rejected' ? 'danger' : 'pending'}`}>
                                {rec.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {rec.status === 'Pending' ? (
                                <div className="admin-table-actions">
                                  <button
                                    type="button"
                                    className="btn-table-action-approve"
                                    onClick={() => {
                                      setDispatchModalRecord(rec);
                                      setDispatchTxHash(`0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`);
                                    }}
                                  >
                                    Dispatch TX
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-table-action-reject"
                                    onClick={() => setRejectModalRecord(rec)}
                                  >
                                    Reject & Refund
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{rec.txHash || rec.note || 'Settled'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* WITHDRAWAL DISPATCH MODAL */}
            {dispatchModalRecord && (
              <div className="modal-overlay animate-fade-in" onClick={() => setDispatchModalRecord(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-md">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <ArrowUpRight size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Authorize & Dispatch Withdrawal</h3>
                          <span className="sub-text">Record: <code className="cell-tracking-code">{dispatchModalRecord.code}</code></span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setDispatchModalRecord(null)}>✕</button>
                    </div>

                    <form onSubmit={handleConfirmWithdrawalDispatch} className="mt-3">
                      <div className="modal-summary-card">
                        <div className="modal-summary-row">
                          <span className="text-muted">Member Name:</span>
                          <strong>{dispatchModalRecord.userName}</strong>
                        </div>
                        <div className="modal-summary-row">
                          <span className="text-muted">Gross Amount:</span>
                          <strong className="text-red-danger">{formatUSDT(dispatchModalRecord.amount, false)}</strong>
                        </div>
                        <div className="modal-summary-row">
                          <span className="text-muted">Network Fee:</span>
                          <span>1.00 USDT</span>
                        </div>
                        <div className="modal-summary-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px' }}>
                          <span className="font-bold">Net Payout to Member:</span>
                          <strong style={{ color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                            {formatUSDT(Math.max(0, Math.abs(dispatchModalRecord.amount) - 1), false)}
                          </strong>
                        </div>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                          <span className="text-muted block text-xs mb-1">Destination TRON Address:</span>
                          <code className="text-xs break-all font-bold cell-mono-addr">
                            {dispatchModalRecord.destination || user?.walletAddress || 'TRC20Address'}
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
                          className="admin-form-input font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          type="button"
                          className="btn-admin-secondary flex-1"
                          onClick={() => setDispatchModalRecord(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-admin-primary flex-1">
                          Confirm Blockchain Dispatch
                        </button>
                      </div>
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
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Reject Withdrawal & Refund Funds</h3>
                          <span className="sub-text">Record: <code className="cell-tracking-code">{rejectModalRecord.code}</code></span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setRejectModalRecord(null)}>✕</button>
                    </div>

                    <form onSubmit={handleConfirmWithdrawalReject} className="mt-3">
                      <p className="text-xs text-muted">
                        Rejecting will immediately refund <strong>{formatUSDT(rejectModalRecord.amount, false)}</strong> back to {rejectModalRecord.userName}'s wallet balance.
                      </p>

                      <div className="input-group mt-3">
                        <label className="input-label">Rejection Reason</label>
                        <select
                          className="admin-form-select"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        >
                          <option value="Invalid or unverified TRON TRC20 wallet address">Invalid or unverified TRON TRC20 wallet address</option>
                          <option value="KYC verification document required">KYC verification document required</option>
                          <option value="Incomplete daily task quota cycle">Incomplete daily task quota cycle</option>
                          <option value="Security audit mismatch on IP / session">Security audit mismatch on IP / session</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          type="button"
                          className="btn-admin-secondary flex-1"
                          onClick={() => setRejectModalRecord(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-admin-danger flex-1" style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}>
                          Confirm Rejection & Refund Funds
                        </button>
                      </div>
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
            {/* SAPPHIRE HERO BANNER (Homepage aesthetic) */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <Users size={13} className="text-amber-300" />
                        <span>MERCHANT CAPITAL & PROFILES:</span>
                      </div>
                      <span className="invite-code-number">25-STEP LOCK ACTIVE</span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <Users size={12} />
                      <span>{adminUsers.length} Merchants Registered</span>
                    </div>
                  </div>

                  <h2>User Accounts & Balances</h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name" style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>
                      Manage client balances, adjust VIP levels, enforce 25-task sequential locks, and inspect ledgers.
                    </span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="hero-bal-label">TOTAL CAPITAL POOL</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">{formatUSDT(totalUserBalances).replace(' USDT', '')}</span>
                      <span className="bal-curr">USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons matching User Side Hero buttons */}
              <div className="hero-action-row">
                <button
                  type="button"
                  className="btn-hero-deposit"
                  onClick={() => setShowAddUserModal(true)}
                  title="Provision New Account"
                >
                  <Plus size={16} />
                  <span>+ Create User Account</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => {
                    const allIds = adminUsers.map(u => u.id);
                    adminBulkAssignRandomTasks && adminBulkAssignRandomTasks(allIds, 25);
                  }}
                  title="Bulk Assign 25 Random Tasks to All"
                >
                  <Shuffle size={16} />
                  <span>🎲 Bulk Assign 25</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => setActiveAdminTab('tasks')}
                  title="Open Task Pool Manager"
                >
                  <Layers size={16} />
                  <span>Task Pool (25 Steps)</span>
                </button>
              </div>
            </div>

            {/* 4 COLORED STAT CARDS (Exact match to User Side .four-stats-grid) */}
            <div className="four-stats-grid mb-6">
              {/* Sapphire Card */}
              <div className="stat-card sapphire-card">
                <div className="stat-card-icon">
                  <Users size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{adminUsers.length} <span className="stat-unit">Merchants</span></div>
                  <span className="stat-label">Total Registered Accounts</span>
                </div>
              </div>

              {/* Green Card */}
              <div className="stat-card green-card">
                <div className="stat-card-icon">
                  <Wallet size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{formatUSDT(totalUserBalances).replace(' USDT', '')} <span className="stat-unit">USDT</span></div>
                  <span className="stat-label">Total Combined Liquidity</span>
                </div>
              </div>

              {/* Blue Card */}
              <div className="stat-card blue-card">
                <div className="stat-card-icon">
                  <TrendingUp size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{formatUSDT(totalCompletedDeposits).replace(' USDT', '')} <span className="stat-unit">USDT</span></div>
                  <span className="stat-label">Accumulated Net Inflow</span>
                </div>
              </div>

              {/* Orange Card */}
              <div className="stat-card orange-card">
                <div className="stat-card-icon">
                  <Award size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{adminUsers.filter(u => u.taskPackageRequested).length} <span className="stat-unit">Pending</span></div>
                  <span className="stat-label">Package Assignment Requests</span>
                </div>
              </div>
            </div>

            {/* PENDING REQUESTS NOTIFICATION BANNER */}
            {adminUsers.filter(u => u.taskPackageRequested).length > 0 && (
              <div className="admin-panel-card mb-4" style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '13px', fontWeight: 500 }}>
                    <Clock size={16} color="#d97706" />
                    <span>
                      <strong>{adminUsers.filter(u => u.taskPackageRequested).length} Client(s)</strong> have requested new task packages awaiting assignment.
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-admin-primary btn-admin-sm"
                      onClick={() => {
                        const pendingIds = adminUsers.filter(u => u.taskPackageRequested).map(u => u.id);
                        adminBulkAssignRandomTasks && adminBulkAssignRandomTasks(pendingIds, 25);
                      }}
                    >
                      <Shuffle size={12} />
                      <span>🎲 Assign 25 Random to All</span>
                    </button>
                    <button
                      type="button"
                      className="btn-admin-secondary btn-admin-sm"
                      onClick={() => setActiveAdminTab('telegram')}
                      title="Telegram Settings"
                    >
                      <Send size={12} />
                      <span>Telegram Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BULK TASK ASSIGNMENT TOOLBAR */}
            {selectedUserIds.length > 0 && (
              <div className="admin-panel-card mb-4" style={{ borderColor: '#e9d5ff', background: '#faf5ff' }}>
                <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="admin-badge success" style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }}>
                      {selectedUserIds.length} Selected
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#581c87' }}>
                      Bulk Operations on Selected Members
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-admin-primary btn-admin-sm"
                      onClick={() => {
                        if (confirm(`Bulk assign 25 Random Tasks to ${selectedUserIds.length} selected users?`)) {
                          adminBulkAssignRandomTasks && adminBulkAssignRandomTasks(selectedUserIds, 25);
                          setSelectedUserIds([]);
                        }
                      }}
                    >
                      <Shuffle size={12} />
                      <span>🎲 Bulk Assign 25 Random</span>
                    </button>

                    <button
                      type="button"
                      className="btn-admin-secondary btn-admin-sm"
                      onClick={() => {
                        if (confirm(`Bulk assign Package 201 (25 tasks) to ${selectedUserIds.length} selected users?`)) {
                          adminBulkAssignPackage && adminBulkAssignPackage(selectedUserIds, '201');
                          setSelectedUserIds([]);
                        }
                      }}
                    >
                      <ClipboardList size={12} />
                      <span>⚡ Bulk 25 (Pkg 201)</span>
                    </button>

                    <button
                      type="button"
                      className="btn-admin-secondary btn-admin-sm"
                      onClick={() => {
                        selectedUserIds.forEach(uid => sendPaymentRequestToUser && sendPaymentRequestToUser(uid, '50.00'));
                        alert(`Payment requests sent to ${selectedUserIds.length} clients!`);
                        setSelectedUserIds([]);
                      }}
                    >
                      <Wallet size={12} />
                      <span>✉️ Send Payment Requests</span>
                    </button>

                    <button
                      type="button"
                      className="btn-admin-secondary btn-admin-sm"
                      onClick={() => setSelectedUserIds([])}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Table Container with Filter Tabs & Search */}
            <div className="admin-table-container">
              <div className="admin-table-toolbar">
                <div className="admin-table-filter-tabs">
                  {[
                    { id: 'all', label: `All Users (${adminUsers.length})` },
                    { id: 'eBay', label: `🔴 eBay (${adminUsers.filter(u => ((u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay').toLowerCase() === 'ebay').length})` },
                    { id: 'Walmart', label: `🔵 Walmart (${adminUsers.filter(u => ((u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || '').toLowerCase() === 'walmart').length})` },
                    { id: 'Temu', label: `🟠 Temu (${adminUsers.filter(u => ((u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || '').toLowerCase() === 'temu').length})` }
                  ].map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`admin-table-tab-btn ${userTagFilter === tag.id ? 'active' : ''}`}
                      onClick={() => setUserTagFilter(tag.id)}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>

                <div className="admin-table-toolbar-right">
                  <div className="admin-table-search-wrap">
                    <Search size={13} className="admin-table-search-icon" />
                    <input
                      type="text"
                      placeholder="Search name, email, code..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="admin-table-search-input"
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-admin-secondary btn-admin-sm"
                    onClick={() => setUnmaskEmails(!unmaskEmails)}
                    title={unmaskEmails ? 'Mask emails' : 'Reveal full emails'}
                  >
                    {unmaskEmails ? '🔒 Mask Emails' : '👁️ Reveal Emails'}
                  </button>

                  <span className="admin-table-count-text">
                    {adminUsers.filter(u => {
                      const curTier = (u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                      const matchTag = userTagFilter === 'all' || curTier.toLowerCase() === userTagFilter.toLowerCase();
                      const matchSearch = !userSearchTerm ||
                        (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
                        (u.email && u.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
                        (u.referralCode && u.referralCode.includes(userSearchTerm));
                      return matchTag && matchSearch;
                    }).length} accounts
                  </span>
                </div>
              </div>

              <div className="admin-data-table-scroll">
                <table className="admin-clean-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={
                            adminUsers.filter(u => {
                              const curTier = (u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                              const matchTag = userTagFilter === 'all' || curTier.toLowerCase() === userTagFilter.toLowerCase();
                              const matchSearch = !userSearchTerm || (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase()));
                              return matchTag && matchSearch;
                            }).length > 0 &&
                            adminUsers.filter(u => {
                              const curTier = (u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                              const matchTag = userTagFilter === 'all' || curTier.toLowerCase() === userTagFilter.toLowerCase();
                              const matchSearch = !userSearchTerm || (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase()));
                              return matchTag && matchSearch;
                            }).every(u => selectedUserIds.includes(u.id))
                          }
                          onChange={(e) => {
                            const currentFiltered = adminUsers.filter(u => {
                              const curTier = (u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                              const matchTag = userTagFilter === 'all' || curTier.toLowerCase() === userTagFilter.toLowerCase();
                              const matchSearch = !userSearchTerm || (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase()));
                              return matchTag && matchSearch;
                            });
                            if (e.target.checked) {
                              setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...currentFiltered.map(u => u.id)])));
                            } else {
                              const removeSet = new Set(currentFiltered.map(u => u.id));
                              setSelectedUserIds(prev => prev.filter(id => !removeSet.has(id)));
                            }
                          }}
                          title="Select All Filtered Users"
                        />
                      </th>
                      <th>Member</th>
                      <th>Email</th>
                      <th>Ref Code</th>
                      <th>Progress</th>
                      <th>TRC20 Wallet</th>
                      <th className="text-right">Balance</th>
                      <th>Tier</th>
                      <th>KYC</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers
                      .filter(u => {
                        const curTier = (u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                        const matchTag = userTagFilter === 'all' || curTier.toLowerCase() === userTagFilter.toLowerCase();
                        const matchSearch = !userSearchTerm ||
                          (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
                          (u.email && u.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
                          (u.referralCode && u.referralCode.includes(userSearchTerm));
                        return matchTag && matchSearch;
                      })
                      .map(u => {
                        const currentUWallet = (u.id === user?.id ? (user?.walletAddress || user?.wallet_address || user?.wallet) : (u.walletAddress || u.wallet_address || u.wallet)) || '';
                        const currentUBal = (u.id === user?.id ? user?.balance : u.balance);
                        const currentUTier = (u.id === user?.id ? user?.vipLevel : (u.vipTier || u.vipLevel)) || 'eBay';
                        const currentUStatus = (u.id === user?.id ? user?.status : u.status) || 'Active';
                        const currentUKyc = (u.id === user?.id ? user?.kycStatus : (u.kyc || u.kycStatus)) || 'Verified';
                        const ownRefCode = u.referralCode || u.code || '505282';
                        const dailyQuota = u.dailyQuota || 25;
                        const completedTasks = u.dailyCompleted ?? u.completedTasks ?? 0;
                        const pendingTasks = u.pendingTasks ?? Math.max(0, dailyQuota - completedTasks);
                        const maskedEmail = maskEmail(u.email);
                        const isChecked = selectedUserIds.includes(u.id);

                        return (
                          <tr key={u.id} style={isChecked ? { background: '#f5f3ff' } : {}}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds(prev => [...prev, u.id]);
                                  } else {
                                    setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="admin-header-avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{u.name}</strong>
                                    {u.id === user?.id && (
                                      <span className="admin-badge success" style={{ padding: '0 6px', fontSize: '10.5px' }}>You</span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    {u.role === 'admin' ? '👑 Admin' : `ID: ${u.id.slice(0, 8)}`}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cell-date font-mono" title={u.email}>{maskedEmail}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="cell-tracking-code">{ownRefCode}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  via {u.invitedByCode || u.referredByCode || '505282'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ minWidth: '100px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                                  <span>{completedTasks}/{dailyQuota}</span>
                                  {u.taskPackageRequested && (
                                    <span style={{ color: '#d97706', fontWeight: 600 }}>Req ⚡</span>
                                  )}
                                </div>
                                <div className="admin-progress-track" style={{ width: '100%', height: '5px' }}>
                                  <div
                                    className="admin-progress-fill"
                                    style={{ width: `${Math.min(100, Math.round((completedTasks / dailyQuota) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              {currentUWallet ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <code className="cell-mono-addr">{formatCompactAddress(currentUWallet, 6, 4)}</code>
                                  <button
                                    type="button"
                                    className="cell-copy-btn"
                                    title="Copy Wallet Address"
                                    onClick={() => copyToClipboard(currentUWallet, 'Wallet Address')}
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Not Bound</span>
                              )}
                            </td>
                            <td className="text-right">
                              <span className="cell-amount positive">
                                {formatUSDT(currentUBal)}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${currentUTier === 'eBay' ? 'platform-ebay' : currentUTier === 'Walmart' ? 'platform-walmart' : currentUTier === 'Temu' ? 'platform-temu' : 'neutral'}`}>
                                {currentUTier}
                              </span>
                            </td>
                            <td>
                              <span className="admin-badge success">
                                <CheckCircle2 size={11} />
                                <span>{currentUKyc}</span>
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${
                                currentUStatus.toLowerCase() === 'active' ? 'success' :
                                currentUStatus.toLowerCase() === 'blocked' ? 'danger' :
                                currentUStatus.toLowerCase() === 'suspended' ? 'warning' : 'neutral'
                              }`}>
                                {currentUStatus}
                              </span>
                            </td>
                            <td>
                              <div className="admin-table-actions">
                                <button
                                  type="button"
                                  className="btn-table-action-approve"
                                  title="Assign 25 tasks to this client"
                                  onClick={() => adminAssignPackage && adminAssignPackage(u.id, '201')}
                                >
                                  {u.taskPackageRequested ? 'Assign Now' : 'Assign 25'}
                                </button>

                                <button
                                  type="button"
                                  className="btn-table-action-secondary"
                                  title="Inspect Account Dossier"
                                  onClick={() => setInspectingUser(u)}
                                >
                                  <FileText size={12} />
                                  <span>Details</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-table-action-secondary"
                                  title="Edit Account Details"
                                  onClick={() => {
                                    setEditingUser(u);
                                    setEditName(u.name || '');
                                    setEditEmail(u.email || '');
                                    setEditBalance(currentUBal.toString());
                                    setEditTier(currentUTier);
                                    setEditStatus(currentUStatus);
                                    setEditWalletAddress(currentUWallet);
                                    setEditKyc(currentUKyc);
                                    setEditReferralCode(ownRefCode);
                                    setEditInvitedByCode(u.invitedByCode || u.referredByCode || '505282');
                                    setEditPendingTasks((u.pendingTasks ?? Math.max(0, dailyQuota - completedTasks)).toString());
                                    setEditCompletedTasks(completedTasks.toString());
                                    setEditDailyQuota(dailyQuota.toString());
                                    setEditAssignedPackage(u.assignedPackage || 'none');
                                  }}
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>

                                {/* Quick Status Action Buttons */}
                                {u.id !== user?.id && (
                                  currentUStatus.toLowerCase() === 'blocked' ? (
                                    <button
                                      type="button"
                                      className="btn-table-action-approve"
                                      title="Unblock User Account"
                                      onClick={async () => {
                                        if (window.confirm(`Unblock account "${u.name}" and restore full access?`)) {
                                          await adminUpdateUser(u.id, { status: 'Active' });
                                        }
                                      }}
                                    >
                                      <CheckCircle2 size={12} />
                                      <span>Unblock</span>
                                    </button>
                                  ) : currentUStatus.toLowerCase() === 'suspended' ? (
                                    <button
                                      type="button"
                                      className="btn-table-action-approve"
                                      title="Activate User Account"
                                      onClick={async () => {
                                        if (window.confirm(`Activate account "${u.name}" and restore access?`)) {
                                          await adminUpdateUser(u.id, { status: 'Active' });
                                        }
                                      }}
                                    >
                                      <CheckCircle2 size={12} />
                                      <span>Activate</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="btn-table-action-reject"
                                        style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}
                                        title="Block User (Immediate Ban - User cannot login or reactivate)"
                                        onClick={async () => {
                                          if (window.confirm(`BLOCK "${u.name}"?\n\nThe user will be instantly logged out and permanently blocked from logging in, re-registering, or reactivating their account.`)) {
                                            await adminUpdateUser(u.id, { status: 'Blocked' });
                                          }
                                        }}
                                      >
                                        <Ban size={12} />
                                        <span>Block</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-table-action-secondary"
                                        style={{ color: '#d97706', borderColor: '#fde68a' }}
                                        title="Suspend User Account"
                                        onClick={async () => {
                                          if (window.confirm(`Suspend "${u.name}"?\n\nThe user will be logged out until manually un-suspended.`)) {
                                            await adminUpdateUser(u.id, { status: 'Suspended' });
                                          }
                                        }}
                                      >
                                        <Clock size={12} />
                                        <span>Suspend</span>
                                      </button>
                                    </>
                                  )
                                )}

                                <button
                                  type="button"
                                  className="btn-table-action-secondary"
                                  title="Login As Member"
                                  onClick={() => {
                                    switchUser(u.id);
                                    setCurrentView('dashboard');
                                    setDashboardTab('home');
                                  }}
                                >
                                  <UserCheck size={12} />
                                </button>

                                {u.id !== user?.id && (
                                  <button
                                    type="button"
                                    className="btn-table-action-reject"
                                    title="Delete Member Account"
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
                          <label className="input-label">Starting Balance (USDT)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newUserData.startingBalance}
                            onChange={(e) => setNewUserData({ ...newUserData, startingBalance: e.target.value })}
                            className="text-input-field tabular-nums"
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
                      <div className="grid-two-col mb-3">
                        <div className="input-group">
                          <label className="input-label">Full Name / Display Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-input-field font-semibold"
                            placeholder="e.g. John Doe"
                            required
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Account Email Address</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="text-input-field font-mono"
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                      </div>

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
                            <option value="Blocked">Blocked (Permanent Ban)</option>
                            <option value="Pending Review">Pending Review</option>
                          </select>
                        </div>
                      </div>

                      {/* Task Package Assignment */}
                      <div className="input-group mt-3">
                        <label className="input-label">
                          <span className="flex items-center gap-1 font-semibold text-purple-700">
                            <ClipboardList size={13} />
                            <span>Assigned Task Package</span>
                          </span>
                        </label>
                        <select
                          value={editAssignedPackage}
                          onChange={(e) => setEditAssignedPackage(e.target.value)}
                          className="text-input-field font-semibold text-purple-700"
                        >
                          <option value="none">None (Shows 'No Task Package Assigned')</option>
                          <option value="Package 201">Package 201 (25 eBay Tasks)</option>
                          <option value="Package 301">Package 301 (25 Walmart Tasks)</option>
                          <option value="Package 401">Package 401 (25 Temu Tasks)</option>
                          <option value="Package 501">Package 501 (25 Amazon Tasks)</option>
                        </select>
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
                          <span className="sub-text font-mono text-xs">{maskEmail(inspectingUser.email)} • ID: #{inspectingUser.referralCode || inspectingUser.id}</span>
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
                            <strong className="d-val admin-code-pill blue">
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
                            <strong className="d-val admin-code-pill amber">
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
                            <strong className="d-val admin-code-pill amber">
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
                            <strong className="d-val text-primary-brand text-sm tabular-nums">
                              {formatUSDT(inspectingUser.balance)}
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Lifetime Task Earnings:</span>
                            <span className="d-val text-emerald-600 font-semibold tabular-nums">
                              {formatUSDT(inspectingUser.totalEarnings, true)}
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Total Deposits:</span>
                            <span className="d-val font-semibold tabular-nums">
                              {formatUSDT(inspectingUser.totalDeposit)}
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Total Withdrawals:</span>
                            <span className="d-val text-red-600 font-semibold tabular-nums">
                              {formatUSDT(-(Math.abs(inspectingUser.totalWithdraw) || 0), true)}
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

                    {/* Downline Referral Team Roster */}
                    {(() => {
                      const ownRefCode = inspectingUser.referralCode || inspectingUser.code;
                      const downline = users.filter(u => 
                        u.id !== inspectingUser.id && (
                          u.referredBy === inspectingUser.id || 
                          (ownRefCode && (u.referredByCode === ownRefCode || u.invitedByCode === ownRefCode))
                        )
                      );

                      return (
                        <div className="dossier-card mt-3">
                          <div className="dossier-card-header flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-blue-500" />
                              <h4>Direct Downline Referral Team ({downline.length} Members)</h4>
                            </div>
                            <span className="badge-tech text-xs">Invite Code: {ownRefCode}</span>
                          </div>
                          <div className="mt-2">
                            {downline.length === 0 ? (
                              <div className="admin-downline-empty">
                                No direct referrals registered under code {ownRefCode} yet.
                              </div>
                            ) : (
                              <div className="max-h-48 overflow-y-auto">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b bg-surface-secondary text-muted">
                                      <th className="py-1.5 px-2">Member</th>
                                      <th className="py-1.5 px-2">VIP Tier</th>
                                      <th className="py-1.5 px-2">Tasks Done</th>
                                      <th className="py-1.5 px-2">Pending</th>
                                      <th className="py-1.5 px-2">Balance</th>
                                      <th className="py-1.5 px-2 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-subtle">
                                    {downline.map(d => (
                                      <tr key={d.id} className="hover:bg-blue-50/20">
                                        <td className="py-1.5 px-2 font-medium">
                                          <div>{d.name}</div>
                                          <div className="text-[10px] text-muted">{maskEmail(d.email)}</div>
                                        </td>
                                        <td className="py-1.5 px-2">
                                          <span className="badge-tech text-[10px]">{d.vipLevel || d.vipTier || 'eBay'}</span>
                                        </td>
                                        <td className="py-1.5 px-2 font-semibold text-emerald-600">
                                          {d.dailyCompleted ?? d.completedTasks ?? 0}
                                        </td>
                                        <td className="py-1.5 px-2 font-semibold text-amber-600">
                                          {d.pendingTasks ?? 25}
                                        </td>
                                        <td className="py-1.5 px-2 font-mono tabular-nums">
                                          {formatUSDT(d.balance)}
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <button
                                            type="button"
                                            className="text-xs text-primary-brand hover:underline font-semibold"
                                            onClick={() => setInspectingUser(d)}
                                          >
                                            Inspect
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Footer Actions */}
                    <div className="modal-btn-row mt-4 pt-3 border-t">
                      <button
                        className="btn-outline w-full"
                        onClick={() => {
                          const u = inspectingUser;
                          setInspectingUser(null);
                          setEditingUser(u);
                          setEditName(u.name || '');
                          setEditEmail(u.email || '');
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
                          setEditAssignedPackage(u.assignedPackage || 'none');
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
            {/* SAPPHIRE HERO BANNER (Homepage aesthetic) */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <Zap size={13} className="text-amber-300" />
                        <span>TASK CAMPAIGN ENGINE:</span>
                      </div>
                      <span className="invite-code-number">25 STEPS ACTIVE</span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <Layers size={12} />
                      <span>Catalogue ({tasks.length})</span>
                    </div>
                  </div>

                  <h2>Task Pool & Progressive Steps Manager</h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name" style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>
                      Configure catalogue inventory, set progressive deposit requirements, and manage 25 sequential learning milestones.
                    </span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="hero-bal-label">TOTAL CATALOGUE</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">{tasks.length}</span>
                      <span className="bal-curr">PRODUCTS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons matching User Side Hero buttons */}
              <div className="hero-action-row">
                <button
                  type="button"
                  className="btn-hero-deposit"
                  onClick={() => {
                    setSelectedUserForRandom(adminUsers[0]?.id || '');
                    setRandomTaskCount(25);
                    setShowAssignRandomModal(true);
                  }}
                  title="Assign 25 random tasks to any user"
                >
                  <Shuffle size={16} />
                  <span>🎲 Assign 25 Random</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => {
                    if (confirm('Restore all 25 default learning steps and standard catalogue tasks to default state?')) {
                      adminRestoreDefaultTasks && adminRestoreDefaultTasks();
                    }
                  }}
                  title="Reload and restore all 25 default learning steps"
                >
                  <RefreshCw size={16} />
                  <span>Restore 25 Defaults</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => setShowAddTaskModal(true)}
                  title="Create New Campaign Task"
                >
                  <Plus size={16} />
                  <span>+ Add Campaign Task</span>
                </button>
              </div>
            </div>

            {/* PARTNER PLATFORMS PILL ROW (Exact match to User Side) */}
            <div className="partner-platforms-card mb-6">
              <span className="card-section-title">PARTNER PLATFORMS & CAMPAIGN DISPATCH</span>
              <div className="platforms-pills-row">
                {[
                  { name: 'eBay', platform: 'ebay', url: 'https://www.ebay.com', icon: <EbayLogo size={42} /> },
                  { name: 'Walmart', platform: 'walmart', url: 'https://www.walmart.com', icon: <WalmartLogo size={42} /> },
                  { name: 'Temu', platform: 'temu', url: 'https://www.temu.com', icon: <TemuLogo size={42} /> },
                  { name: 'Amazon', platform: 'amazon', url: 'https://www.amazon.com', icon: <AmazonLogo size={42} /> },
                  { name: 'AliExpress', platform: 'aliexpress', url: 'https://www.aliexpress.com', icon: <AliExpressLogo size={42} /> },
                  { name: 'Target', platform: 'target', url: 'https://www.target.com', icon: <TargetLogo size={42} /> },
                  { name: 'Shopify', platform: 'shopify', url: 'https://www.shopify.com', icon: <ShopifyLogo size={42} /> },
                  { name: 'Shopee', platform: 'shopee', url: 'https://www.shopee.com', icon: <ShopeeLogo size={42} /> },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="partner-pill-item cursor-pointer"
                    onClick={() => {
                      setTaskFilter(item.name);
                    }}
                    title={`Filter ${item.name} catalog tasks`}
                  >
                    <div className="partner-icon-circle">
                      {item.icon}
                    </div>
                    <div className="partner-pill-name-row">
                      <span className="partner-pill-name">{item.name}</span>
                      <ExternalLink size={10} className="partner-ext-icon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 COLORED STAT CARDS (Exact match to User Side .four-stats-grid) */}
            <div className="four-stats-grid mb-6">
              {/* Sapphire Card */}
              <div className="stat-card sapphire-card">
                <div className="stat-card-icon">
                  <Layers size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{tasks.length} <span className="stat-unit">Products</span></div>
                  <span className="stat-label">Total Catalogue Tasks</span>
                </div>
              </div>

              {/* Green Card */}
              <div className="stat-card green-card">
                <div className="stat-card-icon">
                  <Award size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">25 <span className="stat-unit">Steps</span></div>
                  <span className="stat-label">Learning Task Series ($10 - $300)</span>
                </div>
              </div>

              {/* Blue Card */}
              <div className="stat-card blue-card">
                <div className="stat-card-icon">
                  <Lock size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{tasks.filter(t => (t.requiredDeposit || 0) > 0).length} <span className="stat-unit">Enforced</span></div>
                  <span className="stat-label">Deposit-Restricted Tasks</span>
                </div>
              </div>

              {/* Orange Card */}
              <div className="stat-card orange-card">
                <div className="stat-card-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">{tasks.reduce((sum, t) => sum + (t.orders || 0), 0).toLocaleString()}</div>
                  <span className="stat-label">Completed Orders Volume</span>
                </div>
              </div>
            </div>

            {/* Explanatory Policy Grid */}
            <div className="admin-policy-grid">
              <div className="admin-policy-card">
                <div className="admin-policy-icon emerald">
                  <span className="text-base">🎓</span>
                </div>
                <div>
                  <div className="admin-policy-title">25 Progressive Learning Steps (10.00 USDT to 300.00 USDT)</div>
                  <p className="admin-policy-desc">
                    Steps 1 to 25 feature progressive deposit requirements starting from Step 1 (10.00 USDT deposit) up to Step 25 (300.00 USDT) to protect high-yield commissions.
                  </p>
                </div>
              </div>

              <div className="admin-policy-card">
                <div className="admin-policy-icon amber">
                  <Lock size={18} />
                </div>
                <div>
                  <div className="admin-policy-title">Deposit Restriction Engine</div>
                  <p className="admin-policy-desc">
                    Set custom Required Deposit thresholds on any task. When set, users cannot execute the task until their available balance or total deposit meets the requirement.
                  </p>
                </div>
              </div>
            </div>

            {/* Table Toolbar */}
            {(() => {
              const filteredTasks = tasks.filter(t => {
                if (taskFilter === 'learning') return Boolean(t.isLearning);
                if (taskFilter === 'restricted') return (t.requiredDeposit || 0) > 0;
                if (['ebay', 'walmart', 'temu'].includes(taskFilter.toLowerCase())) {
                  return (t.platform || '').toLowerCase() === taskFilter.toLowerCase();
                }
                if (taskSearch) {
                  const q = taskSearch.toLowerCase();
                  const match = (t.title || '').toLowerCase().includes(q) ||
                                (t.category || '').toLowerCase().includes(q) ||
                                (t.platform || '').toLowerCase().includes(q);
                  if (!match) return false;
                }
                return true;
              });

              return (
                <>
                  <div className="admin-table-toolbar">
                    <div className="admin-table-tabs">
                      {[
                        { id: 'all', label: `All Tasks (${tasks.length})` },
                        { id: 'learning', label: `Learning Phase (${tasks.filter(t => t.isLearning).length})` },
                        { id: 'restricted', label: `Deposit Restricted (${tasks.filter(t => (t.requiredDeposit || 0) > 0).length})` },
                        { id: 'eBay', label: 'eBay' },
                        { id: 'Walmart', label: 'Walmart' },
                        { id: 'Temu', label: 'Temu' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className={`admin-table-tab ${taskFilter === tab.id ? 'active' : ''}`}
                          onClick={() => setTaskFilter(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="admin-table-search-wrap">
                      <Search size={14} className="admin-table-search-icon" />
                      <input
                        type="text"
                        placeholder="Search product or category..."
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="admin-table-search-input"
                      />
                      <span className="admin-table-count-text">
                        {filteredTasks.length} of {tasks.length} tasks
                      </span>
                    </div>
                  </div>

                  {/* Task Management Clean Table */}
                  <div className="admin-clean-card">
                    <div className="admin-data-table-scroll">
                      <table className="admin-clean-table">
                        <thead>
                          <tr>
                            <th>Product & Campaign</th>
                            <th>Platform</th>
                            <th className="text-right">Price</th>
                            <th>Commission</th>
                            <th className="text-right">Member Profit</th>
                            <th>Deposit Barrier</th>
                            <th>Learning Step</th>
                            <th>Status</th>
                            <th style={{ minWidth: '240px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                                No tasks found matching the filter criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredTasks.map(t => {
                              const priceNum = parseFloat(t.price) || 0;
                              const commRate = parseFloat(
                                t.commissionRate ??
                                t.commission_rate ??
                                t.commission ??
                                (t.yieldRate ? parseFloat(t.yieldRate) : (t.yield_rate ? parseFloat(t.yield_rate) : 4))
                              ) || 4;
                              const estProfit = (priceNum * commRate) / 100;
                              const platformLower = (t.platform || 'ebay').toLowerCase();
                              const reqDep = parseFloat(t.requiredDeposit ?? t.required_deposit ?? 0) || 0;

                              return (
                                <tr key={t.id} className={t.active === false ? 'opacity-50' : ''}>
                                  <td>
                                    <div className="admin-task-product-cell">
                                      <div className="admin-task-thumb-wrap">
                                        <img
                                          src={t.image || getProductImage(t)}
                                          alt=""
                                          className="admin-task-thumb"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                                          }}
                                        />
                                        {t.isLearning && (
                                          <span className="task-thumb-step-badge">#{t.learningStep || 1}</span>
                                        )}
                                      </div>
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className="admin-task-meta-title" title={t.title}>
                                          {t.title}
                                        </div>
                                        <div className="admin-task-meta-sub flex items-center gap-1.5 flex-wrap">
                                          <span className="admin-task-meta-category">{t.category || 'General'}</span>
                                          {t.orders ? (
                                            <span className="admin-task-meta-orders text-slate-400 text-xs">
                                              • {Number(t.orders).toLocaleString()} orders
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`admin-badge platform-${platformLower}`}>
                                      {t.platform || 'eBay'}
                                    </span>
                                  </td>
                                  <td className="text-right cell-amount">
                                    {formatUSDT(priceNum)}
                                  </td>
                                  <td>
                                    <span className="admin-badge neutral">{commRate}%</span>
                                  </td>
                                  <td className="text-right cell-amount positive">
                                    {formatUSDT(estProfit, true)}
                                  </td>
                                  <td>
                                    {reqDep > 0 ? (
                                      <span className="admin-badge pending" title={`Requires ${formatUSDT(reqDep)} account balance`}>
                                        <Lock size={11} />
                                        <span>Min: {formatUSDT(reqDep)}</span>
                                      </span>
                                    ) : (
                                      <span className="admin-badge neutral">
                                        0.00 USDT (Free)
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {t.isLearning ? (
                                      <span className="admin-badge success" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                        <Award size={11} />
                                        <span>Step #{t.learningStep || 1}</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400 font-medium">Standard</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`admin-badge ${t.active !== false ? 'success' : 'neutral'}`}>
                                      {t.active !== false ? 'Active' : 'Disabled'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="admin-task-actions-row">
                                      <button
                                        type="button"
                                        className="btn-task-action-edit"
                                        title="Edit Task & Pricing (Preserves all data)"
                                        onClick={() => handleOpenEditModal(t)}
                                      >
                                        <Edit2 size={12} />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-task-action-assign"
                                        title="Assign this task to a client"
                                        onClick={() => {
                                          setAssignModalTask(t);
                                          setSelectedUserForSpecific(adminUsers[0]?.id || '');
                                        }}
                                      >
                                        <UserCheck size={12} />
                                        <span>Assign</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-task-action-icon"
                                        title="Preview Task in Execution Engine"
                                        onClick={() => openTaskPreview(t)}
                                      >
                                        <Eye size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-task-action-icon"
                                        title={`Open live product listing on ${t.platform || 'Store'}`}
                                        onClick={(e) => openProductUrl(t, e)}
                                      >
                                        <ExternalLink size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        className={`btn-task-action-icon ${t.active !== false ? 'icon-pause' : 'icon-play'}`}
                                        title={t.active !== false ? 'Pause Task' : 'Activate Task'}
                                        onClick={() => handleToggleTaskActive(t)}
                                      >
                                        {t.active !== false ? <Pause size={13} /> : <Play size={13} />}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-task-action-icon icon-delete"
                                        title="Delete Task from catalogue"
                                        onClick={() => handleDeleteTask(t.id, t.title)}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* =========================================
            6. TAB: DEPOSIT & PAYOUT GATEWAYS (ACCOUNTS)
        ========================================= */}
        {activeAdminTab === 'gateways' && (
          <div className="admin-gateways animate-fade-in">
            {/* SAPPHIRE HERO BANNER (Homepage aesthetic) */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <Landmark size={13} className="text-amber-300" />
                        <span>FINANCIAL ROUTING & SETTLEMENT:</span>
                      </div>
                      <span className="invite-code-number">TRC20 / ERC20 ACTIVE</span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <QrCode size={12} />
                      <span>3 Vaults Online</span>
                    </div>
                  </div>

                  <h2>Deposit & Payout Gateways</h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name" style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>
                      Configure blockchain receiving vaults (TRC20, ERC20, BEP20) and institutional escrow bank wire accounts.
                    </span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="hero-bal-label">ACTIVE INGESTION</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">TRC20</span>
                      <span className="bal-curr">MASTER VAULT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons matching User Side Hero buttons */}
              <div className="hero-action-row">
                <button
                  type="button"
                  className="btn-hero-deposit"
                  onClick={handleSaveGatewayAccounts}
                  title="Save and broadcast gateway configuration"
                >
                  <Save size={16} />
                  <span>Save & Broadcast Settings</span>
                </button>

                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => {
                    copyToClipboard(gatewayForm.trc20Address, 'Master TRC20 Vault');
                  }}
                  title="Copy TRC20 Address"
                >
                  <Copy size={16} />
                  <span>Copy TRC20 Address</span>
                </button>
              </div>
            </div>

            {/* 4 COLORED STAT CARDS (Exact match to User Side .four-stats-grid) */}
            <div className="four-stats-grid mb-6">
              {/* Sapphire Card */}
              <div className="stat-card sapphire-card">
                <div className="stat-card-icon">
                  <QrCode size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">TRC20 <span className="stat-unit">Master</span></div>
                  <span className="stat-label">Default USDT Vault</span>
                </div>
              </div>

              {/* Green Card */}
              <div className="stat-card green-card">
                <div className="stat-card-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">100% <span className="stat-unit">Online</span></div>
                  <span className="stat-label">Ingestion Network Health</span>
                </div>
              </div>

              {/* Blue Card */}
              <div className="stat-card blue-card">
                <div className="stat-card-icon">
                  <Landmark size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">Bank Wire <span className="stat-unit">Active</span></div>
                  <span className="stat-label">Institutional Escrow Vault</span>
                </div>
              </div>

              {/* Orange Card */}
              <div className="stat-card orange-card">
                <div className="stat-card-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="stat-card-body">
                  <div className="stat-num">Automated <span className="stat-unit">Routing</span></div>
                  <span className="stat-label">Multi-Chain Settlement</span>
                </div>
              </div>
            </div>

            {gatewaySavedMsg && (
              <div className="admin-modal-callout-emerald mb-4 animate-fade-in">
                <CheckCircle2 size={16} color="#059669" />
                <span>Gateway settings successfully saved and broadcast. User deposit modals are updated instantly.</span>
              </div>
            )}

            <form onSubmit={handleSaveGatewayAccounts} className="gateway-config-form">
              <div className="admin-gateways-grid">
                {/* Crypto Receiving Wallets Card */}
                <div className="admin-gateway-card">
                  <div className="admin-gateway-card-header">
                    <div className="admin-gateway-title-wrap">
                      <QrCode size={18} className="text-emerald-600" />
                      <h3 className="admin-gateway-title">Cryptocurrency Receiving Vaults</h3>
                    </div>
                    <span className="admin-badge success">Active Ingestion Engine</span>
                  </div>

                  {/* Primary TRON TRC20 Gateway */}
                  <div className="admin-form-group mb-4" style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="admin-form-label font-semibold text-slate-800 flex items-center gap-1.5" style={{ marginBottom: 0 }}>
                        <span>TRON (TRC20) Master Vault</span>
                        <span className="admin-badge success">Default USDT</span>
                      </label>
                      <button
                        type="button"
                        className="cell-copy-btn"
                        title="Copy TRC20 Address"
                        onClick={() => copyToClipboard(gatewayForm.trc20Address, 'TRC20 Address')}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={gatewayForm.trc20Address}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, trc20Address: e.target.value })}
                      className="admin-form-input font-mono"
                      placeholder="T..."
                    />
                    <p className="admin-form-sublabel mt-1 text-slate-500 text-xs">
                      Primary deposit receiving address for all user TRON network USDT transfers.
                    </p>
                  </div>

                  <div className="grid-two-col">
                    <div className="admin-form-group">
                      <div className="flex items-center justify-between mb-1">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Ethereum (ERC20) Vault</label>
                        <button
                          type="button"
                          className="cell-copy-btn"
                          title="Copy ERC20 Address"
                          onClick={() => copyToClipboard(gatewayForm.erc20Address, 'ERC20 Address')}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={gatewayForm.erc20Address}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, erc20Address: e.target.value })}
                        className="admin-form-input font-mono text-xs"
                        placeholder="0x..."
                      />
                    </div>

                    <div className="admin-form-group">
                      <div className="flex items-center justify-between mb-1">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">BNB Chain (BEP20) Vault</label>
                        <button
                          type="button"
                          className="cell-copy-btn"
                          title="Copy BEP20 Address"
                          onClick={() => copyToClipboard(gatewayForm.bep20Address, 'BEP20 Address')}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={gatewayForm.bep20Address}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, bep20Address: e.target.value })}
                        className="admin-form-input font-mono text-xs"
                        placeholder="0x..."
                      />
                    </div>
                  </div>
                </div>

                {/* Escrow Bank Wire Card */}
                <div className="admin-gateway-card">
                  <div className="admin-gateway-card-header">
                    <div className="admin-gateway-title-wrap">
                      <Landmark size={18} className="text-blue-600" />
                      <h3 className="admin-gateway-title">Institutional Escrow Bank Wire</h3>
                    </div>
                    <span className="admin-badge neutral">Direct Wire</span>
                  </div>

                  <div className="grid-two-col">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Bank Name</label>
                      <input
                        type="text"
                        value={gatewayForm.bankName}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, bankName: e.target.value })}
                        className="admin-form-input text-xs"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Beneficiary / Company Holder</label>
                      <input
                        type="text"
                        value={gatewayForm.bankHolder}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, bankHolder: e.target.value })}
                        className="admin-form-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Account Number / IBAN</label>
                      <input
                        type="text"
                        value={gatewayForm.bankAccount}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, bankAccount: e.target.value })}
                        className="admin-form-input font-mono text-xs"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">SWIFT / BIC / Routing Code</label>
                      <input
                        type="text"
                        value={gatewayForm.bankSwift}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, bankSwift: e.target.value })}
                        className="admin-form-input font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Deposit Instructions / Memo Prompt</label>
                    <textarea
                      rows={2}
                      value={gatewayForm.depositInstructions}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, depositInstructions: e.target.value })}
                      className="admin-form-textarea text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-admin-primary" style={{ padding: '10px 24px', fontSize: '13.5px' }}>
                  <Save size={15} />
                  <span>Save & Broadcast Gateway Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================
            7. TAB: VIP COMMISSION RULES
        ========================================= */}
        {activeAdminTab === 'tiers' && (
          <div className="admin-tiers animate-fade-in">
            <div className="admin-page-header">
              <div className="admin-page-title-wrap">
                <h1 className="admin-page-title">VIP Tier Rules & Progressive Yield Settings</h1>
                <p className="admin-page-subtitle">
                  Configure qualification deposit ranges (Min & Max Balance), progressive locking rules, daily task allocation quotas, and commission rates.
                </p>
              </div>
            </div>

            {/* PROGRESSIVE TIER EXPLAINER BANNER */}
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
              border: '1px solid #c7d2fe',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#4f46e5',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#1e1b4b', display: 'block', marginBottom: '3px' }}>
                  Automatic Progressive Tier Locking Rules (Active System)
                </strong>
                <span style={{ fontSize: '12px', color: '#4338ca', lineHeight: 1.5 }}>
                  • <strong>eBay:</strong> 0 - 499 USDT (4% Yield) • As soon as deposit crosses 499 USDT, eBay locks and Walmart opens.<br />
                  • <strong>Walmart:</strong> 500 - 899 USDT (8% Yield) • Once deposit crosses 899 USDT, Walmart locks and Temu opens.<br />
                  • <strong>Temu:</strong> 900+ USDT (12% Yield) • Maximum VIP tier for large balances.
                </span>
              </div>
            </div>

            <div className="admin-tiers-grid">
              {(vipTiers || []).map(tier => {
                const tierFeatures = Array.isArray(tier.features)
                  ? tier.features
                  : (typeof tier.features === 'string'
                      ? (() => { try { return JSON.parse(tier.features); } catch(e) { return []; } })()
                      : [
                          `Daily Task Limit: ${tier.dailyTasks || tier.daily_tasks || 25}`,
                          `Commission Rate: ${tier.commissionRate || tier.commission_rate || 4.0}%`,
                          'Instant Task Credit',
                          'Multi-Sig Vault Protection'
                        ]);
                const tierMinBal = tier.minBalance ?? tier.min_balance ?? 0;
                const tierMaxBal = tier.maxBalance ?? tier.max_balance ?? (tier.id === 'tier_temu' ? 99999 : (tier.id === 'tier_walmart' ? 899 : 499));
                const tierCommRate = tier.commissionRate ?? tier.commission_rate ?? 4;
                const tierDailyTasks = tier.dailyTasks ?? tier.daily_tasks ?? 25;

                return (
                  <div key={tier.id} className="admin-tier-card">
                    <div className="admin-tier-header">
                      <div className="admin-tier-icon">
                        {(tier.platform || tier.name || 'E').charAt(0)}
                      </div>
                      <div>
                        <h3 className="admin-tier-name">{tier.name} VIP Tier</h3>
                        <span className="text-xs text-slate-400">Yield Configuration ID: {tier.id}</span>
                      </div>
                    </div>

                    <div className="admin-tier-body">
                      <div className="admin-form-group">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Min Balance to Qualify (USDT)</label>
                        <input
                          type="number"
                          defaultValue={tierMinBal}
                          className="admin-form-input text-xs tabular-nums"
                          onChange={(e) => adminUpdateTier && adminUpdateTier(tier.id, { minBalance: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Max Balance to Qualify (USDT)</label>
                        <input
                          type="number"
                          defaultValue={tierMaxBal}
                          className="admin-form-input text-xs tabular-nums"
                          placeholder={tier.id === 'tier_temu' ? 'Unlimited (99999)' : 'e.g. 499'}
                          onChange={(e) => adminUpdateTier && adminUpdateTier(tier.id, { maxBalance: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          When deposit crosses this ({tierMaxBal} USDT), {tier.name} locks and next tier unlocks.
                        </span>
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Yield Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={tierCommRate}
                          className="admin-form-input text-xs tabular-nums"
                          onChange={(e) => adminUpdateTier && adminUpdateTier(tier.id, { commissionRate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Daily Task Allocation Quota</label>
                        <input
                          type="number"
                          defaultValue={tierDailyTasks}
                          className="admin-form-input text-xs tabular-nums"
                          onChange={(e) => adminUpdateTier && adminUpdateTier(tier.id, { dailyTasks: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tierFeatures.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            8. TAB: AUDIT TRAIL & LOGS
        ========================================= */}
        {activeAdminTab === 'audit' && (
          <div className="admin-audit animate-fade-in">
            <div className="admin-page-header">
              <div className="admin-page-title-wrap">
                <h1 className="admin-page-title">Immutable Financial Audit Ledger</h1>
                <p className="admin-page-subtitle">
                  Real-time double-entry record of all platform deposits, withdrawals, task rewards, balance corrections, and admin activities.
                </p>
              </div>
            </div>

            {(() => {
              const filteredRecords = records.filter(rec => {
                if (auditSearch) {
                  const q = auditSearch.toLowerCase();
                  const match = (rec.code || '').toLowerCase().includes(q) ||
                                (rec.userName || '').toLowerCase().includes(q) ||
                                (rec.type || '').toLowerCase().includes(q) ||
                                (rec.category || '').toLowerCase().includes(q) ||
                                (rec.note || '').toLowerCase().includes(q) ||
                                String(rec.amount || '').includes(q);
                  if (!match) return false;
                }
                return true;
              });

              return (
                <>
                  <div className="admin-table-toolbar">
                    <div className="admin-table-tabs">
                      <span className="admin-table-tab active">
                        All Audit Entries ({records.length})
                      </span>
                    </div>

                    <div className="admin-table-search-wrap">
                      <Search size={14} className="admin-table-search-icon" />
                      <input
                        type="text"
                        placeholder="Search audit trail or user..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="admin-table-search-input"
                      />
                      <span className="admin-table-count-text">
                        {filteredRecords.length} of {records.length} records
                      </span>
                    </div>
                  </div>

                  <div className="admin-clean-card">
                    <div className="admin-data-table-scroll">
                      <table className="admin-clean-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Event Code</th>
                            <th>User</th>
                            <th>Event Type</th>
                            <th>Category</th>
                            <th className="text-right">Amount</th>
                            <th>Transaction Note</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                                No audit records found matching the search criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map(rec => {
                              const statusLower = (rec.status || 'pending').toLowerCase();
                              const badgeType = statusLower === 'completed' || statusLower === 'approved'
                                ? 'success'
                                : statusLower === 'rejected' || statusLower === 'failed'
                                ? 'danger'
                                : 'pending';

                              return (
                                <tr key={rec.id}>
                                  <td>
                                    <span className="cell-date">{rec.date}</span>
                                  </td>
                                  <td>
                                    <span className="cell-tracking-code">{rec.code}</span>
                                  </td>
                                  <td>
                                    <span className="font-semibold text-slate-800">
                                      {rec.userName || user?.name || 'User'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="admin-badge neutral">{rec.type}</span>
                                  </td>
                                  <td>
                                    <span className="admin-badge neutral">{rec.category}</span>
                                  </td>
                                  <td className={`text-right cell-amount ${rec.amount >= 0 ? 'positive' : 'negative'}`}>
                                    {formatUSDT(rec.amount, true)}
                                  </td>
                                  <td>
                                    <span className="text-xs text-slate-600">{rec.note}</span>
                                  </td>
                                  <td>
                                    <span className={`admin-badge ${badgeType}`}>
                                      {rec.status || 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* =========================================
            GLOBAL MODALS: TASK ASSIGNMENTS
        ========================================= */}

        {/* 1. ASSIGN 25 RANDOM TASKS MODAL */}
        {showAssignRandomModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowAssignRandomModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box max-w-lg">
                <div className="modal-header">
                  <div className="header-with-icon">
                    <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <Shuffle size={18} />
                    </div>
                    <div>
                      <h3 className="modal-title font-semibold text-base text-slate-900">Assign Random Tasks to Client</h3>
                      <span className="text-xs text-slate-500">Picks and assigns a randomized task queue from catalogue</span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setShowAssignRandomModal(false)}>✕</button>
                </div>

                <div className="mt-4">
                  <div className="admin-form-group">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Select Registered Client</label>
                    <select
                      className="admin-form-select text-xs"
                      value={selectedUserForRandom}
                      onChange={(e) => setSelectedUserForRandom(e.target.value)}
                    >
                      <option value="">-- Choose Client --</option>
                      {adminUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({maskEmail(u.email)}) - Balance: {formatUSDT(u.balance)} {u.taskPackageRequested ? '⚠️ [PENDING REQUEST]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Number of Random Tasks to Assign</label>
                    <select
                      className="admin-form-select text-xs"
                      value={randomTaskCount}
                      onChange={(e) => setRandomTaskCount(parseInt(e.target.value, 10))}
                    >
                      <option value={25}>25 Tasks (Standard Daily Quota)</option>
                      <option value={20}>20 Tasks</option>
                      <option value={15}>15 Tasks</option>
                      <option value={10}>10 Tasks</option>
                      <option value={35}>35 Tasks (VIP Pack)</option>
                    </select>
                  </div>

                  <div className="admin-modal-callout-emerald">
                    <CheckCircle2 size={16} color="#059669" className="flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-xs mb-0.5">Automated Assignment Engine</div>
                      <p className="text-xs text-slate-600">
                        The system will shuffle the pool of {tasks.filter(t => t.active !== false).length} active products (including Learning Steps 1-25) and assign {randomTaskCount} random tasks directly to the user's task queue.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      className="btn-admin-secondary flex-1"
                      onClick={() => setShowAssignRandomModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-admin-primary flex-1"
                      disabled={!selectedUserForRandom}
                      onClick={() => {
                        if (!selectedUserForRandom) return;
                        adminAssignRandomTasks && adminAssignRandomTasks(selectedUserForRandom, randomTaskCount);
                        setShowAssignRandomModal(false);
                      }}
                    >
                      <Shuffle size={14} />
                      <span>Assign {randomTaskCount} Random Tasks</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ASSIGN SPECIFIC TASK TO USER MODAL */}
        {assignModalTask && (
          <div className="modal-overlay animate-fade-in" onClick={() => setAssignModalTask(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box max-w-lg">
                <div className="modal-header">
                  <div className="header-with-icon">
                    <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="modal-title font-semibold text-base text-slate-900">Assign Task to User</h3>
                      <span className="text-xs text-slate-500">Add this specific task to client's assigned queue</span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setAssignModalTask(null)}>✕</button>
                </div>

                <div className="mt-4">
                  {/* Task Info Card */}
                  <div className="modal-task-preview-box">
                    <img
                      src={assignModalTask.image}
                      alt={assignModalTask.title}
                      className="modal-task-thumb"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="modal-task-title">{assignModalTask.title}</h4>
                      <div className="modal-task-meta">
                        <span>Platform: <strong>{assignModalTask.platform}</strong></span>
                        <span>Price: <strong>{formatUSDT(assignModalTask.price)}</strong></span>
                        <span>Yield: <strong>{assignModalTask.commissionRate}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Select Client to Assign To</label>
                    <select
                      className="admin-form-select text-xs"
                      value={selectedUserForSpecific}
                      onChange={(e) => setSelectedUserForSpecific(e.target.value)}
                    >
                      <option value="">-- Choose Client --</option>
                      {adminUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({maskEmail(u.email)}) - Balance: {formatUSDT(u.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      className="btn-admin-secondary flex-1"
                      onClick={() => setAssignModalTask(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-admin-primary flex-1"
                      disabled={!selectedUserForSpecific}
                      onClick={() => {
                        if (!selectedUserForSpecific) return;
                        adminAssignSpecificTask && adminAssignSpecificTask(selectedUserForSpecific, assignModalTask);
                        setAssignModalTask(null);
                      }}
                    >
                      Confirm & Assign Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ASSIGN TASK FROM USER ROW MODAL */}
        {assignUserModalUser && (
          <div className="modal-overlay animate-fade-in" onClick={() => setAssignUserModalUser(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box max-w-lg">
                <div className="modal-header">
                  <div className="header-with-icon">
                    <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h3 className="modal-title font-semibold text-base text-slate-900">Assign Task to {assignUserModalUser.name}</h3>
                      <span className="text-xs text-slate-500">Select task from catalogue or assign 25 random tasks</span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setAssignUserModalUser(null)}>✕</button>
                </div>

                <div className="mt-4">
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', marginBottom: '14px' }}>
                    <div><strong>Client:</strong> {assignUserModalUser.name} ({maskEmail(assignUserModalUser.email)})</div>
                    <div className="mt-1">
                      <strong>Balance:</strong> <span className="tabular-nums font-semibold text-emerald-700">{formatUSDT(assignUserModalUser.balance)}</span> | <strong>Package:</strong> {assignUserModalUser.assignedPackage || 'None'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn-admin-primary w-full justify-center mb-3"
                      onClick={() => {
                        adminAssignRandomTasks && adminAssignRandomTasks(assignUserModalUser.id, 25);
                        setAssignUserModalUser(null);
                      }}
                    >
                      <Shuffle size={14} />
                      <span>Assign 25 Random Tasks Now</span>
                    </button>
                    <div className="modal-divider-wrap">
                      <span className="modal-divider-text">OR PICK SPECIFIC TASK</span>
                      <div className="modal-divider-line"></div>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Select Specific Task from Catalogue</label>
                    <select
                      className="admin-form-select text-xs"
                      value={selectedTaskToAssignToUser || tasks[0]?.id || ''}
                      onChange={(e) => setSelectedTaskToAssignToUser(e.target.value)}
                    >
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.platform}] {t.title.slice(0, 36)}... - {formatUSDT(t.price)} (Dep: {formatUSDT(t.requiredDeposit || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const chosenId = selectedTaskToAssignToUser || tasks[0]?.id;
                    const chosenTask = tasks.find(t => t.id === chosenId);
                    if (!chosenTask) return null;
                    return (
                      <div className="modal-task-preview-box mt-3">
                        <img src={chosenTask.image} alt={chosenTask.title} className="modal-task-thumb" />
                        <div className="flex-1 min-w-0">
                          <span className="modal-task-title">{chosenTask.title}</span>
                          <div className="modal-task-meta">
                            <span>Platform: <strong>{chosenTask.platform}</strong></span>
                            <span>Price: <strong>{formatUSDT(chosenTask.price)}</strong></span>
                            <span>Yield: <strong>{chosenTask.commissionRate}%</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      className="btn-admin-secondary flex-1"
                      onClick={() => setAssignUserModalUser(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-admin-primary flex-1"
                      onClick={() => {
                        const chosenId = selectedTaskToAssignToUser || tasks[0]?.id;
                        const taskObj = tasks.find(t => t.id === chosenId);
                        if (taskObj) {
                          adminAssignSpecificTask && adminAssignSpecificTask(assignUserModalUser.id, taskObj);
                        }
                        setAssignUserModalUser(null);
                      }}
                    >
                      Assign This Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ROOT LEVEL: CREATE NEW PROMOTIONAL TASK MODAL */}
        {showAddTaskModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowAddTaskModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box max-w-xl">
                <div className="modal-header">
                  <div className="header-with-icon">
                    <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="modal-title font-semibold text-base text-slate-900">Create New Promotional Task</h3>
                      <span className="text-xs text-slate-500">Add product listing, set deposit restrictions & learning flags</span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setShowAddTaskModal(false)}>✕</button>
                </div>

                <form onSubmit={handleCreateTask} className="mt-4">
                  {/* Quick Fill Presets */}
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                      ⚡ Quick Pre-Fill Templates:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {TASK_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setNewTask(prev => ({ ...prev, ...preset }))}
                        >
                          <span>{preset.platform}:</span>
                          <span style={{ color: '#059669' }}>{formatUSDT(preset.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Product / Campaign Title</label>
                    <input
                      type="text"
                      required
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="admin-form-input text-xs"
                      placeholder="e.g. 2026 4K Smart Projector Ultra HD"
                    />
                  </div>

                  <div className="admin-form-group mt-3">
                    <div className="flex items-center justify-between">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Direct Store Product URL (Optional)</label>
                      <span className="text-xs text-slate-400">eBay, Amazon, Walmart, Temu link</span>
                    </div>
                    <div className="input-icon-field-wrap">
                      <ExternalLink size={14} className="input-field-left-icon text-slate-400" />
                      <input
                        type="url"
                        value={newTask.productUrl || ''}
                        onChange={(e) => setNewTask({ ...newTask, productUrl: e.target.value })}
                        className="admin-form-input text-xs"
                        style={{ paddingLeft: '32px' }}
                        placeholder="e.g. https://www.ebay.com/itm/... or https://www.amazon.com/dp/..."
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Auto-generates live search query on {newTask.platform} if left blank.</p>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Platform Pool</label>
                      <select
                        value={newTask.platform}
                        onChange={(e) => setNewTask({ ...newTask, platform: e.target.value })}
                        className="admin-form-select text-xs"
                      >
                        <option value="eBay">eBay</option>
                        <option value="Walmart">Walmart</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Temu">Temu</option>
                        <option value="AliExpress">AliExpress</option>
                        <option value="Target">Target</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Category</label>
                      <select
                        value={newTask.category}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                        className="admin-form-select text-xs"
                      >
                        <option value="Flash Deals">Flash Deals</option>
                        <option value="Best Sellers">Best Sellers</option>
                        <option value="Trending Campaigns">Trending Campaigns</option>
                        <option value="New Arrivals">New Arrivals</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion & Apparel">Fashion & Apparel</option>
                        <option value="Home & Living">Home & Living</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Listing Price (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newTask.price}
                        onChange={(e) => setNewTask({ ...newTask, price: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={newTask.commissionRate}
                        onChange={(e) => setNewTask({ ...newTask, commissionRate: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  {/* DEPOSIT RESTRICTION FIELD */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '14px' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock size={14} className="text-amber-600" />
                      <label className="admin-form-label mb-0 font-semibold text-slate-800 text-xs">Deposit Balance Barrier (USDT)</label>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Required account balance or deposit threshold to unlock this task. Enter <code>0</code> for free / unrestricted.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTask.requiredDeposit}
                        onChange={(e) => setNewTask({ ...newTask, requiredDeposit: e.target.value })}
                        className="admin-form-input text-xs tabular-nums flex-1"
                        placeholder="0.00"
                      />
                      <span className="text-xs font-semibold text-slate-600">USDT</span>
                    </div>
                  </div>

                  {/* LEARNING TASK CHECKBOX & STEP SELECTOR (1 to 25) */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '14px' }}>
                    <label className="checkbox-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newTask.isLearning}
                        onChange={(e) => setNewTask({ ...newTask, isLearning: e.target.checked })}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <strong className="text-xs font-semibold text-slate-800 block">Beginner Learning Series Task</strong>
                        <span className="text-xs text-slate-500">Configures task in the 25-step progressive learning curriculum</span>
                      </div>
                    </label>

                    {newTask.isLearning && (
                      <div className="admin-form-group mt-3">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Learning Milestone Step (1 to 25)</label>
                        <select
                          value={newTask.learningStep}
                          onChange={(e) => setNewTask({ ...newTask, learningStep: parseInt(e.target.value, 10) })}
                          className="admin-form-select text-xs"
                        >
                          {Array.from({ length: 25 }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s}>
                              Step {s} : {s === 1 ? 'Step 1 (10.00 USDT Deposit Requirement)' : s === 25 ? 'Step 25 Graduation (300.00 USDT Deposit)' : `Step ${s}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Image URL</label>
                    <input
                      type="url"
                      required
                      value={newTask.image}
                      onChange={(e) => setNewTask({ ...newTask, image: e.target.value })}
                      className="admin-form-input text-xs"
                    />
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Tag / Badge Label</label>
                    <input
                      type="text"
                      value={newTask.tag}
                      onChange={(e) => setNewTask({ ...newTask, tag: e.target.value })}
                      className="admin-form-input text-xs"
                      placeholder="e.g. Hot Deal, Featured, Learning #1"
                    />
                  </div>

                  <button type="submit" className="btn-admin-primary w-full justify-center mt-5" style={{ padding: '10px' }}>
                    Add Task to Inventory
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 5. ROOT LEVEL: EDIT TASK & RESTRICTIONS MODAL */}
        {editingTask && (
          <div className="modal-overlay animate-fade-in" onClick={() => setEditingTask(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box max-w-xl">
                <div className="modal-header">
                  <div className="header-with-icon">
                    <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <Edit2 size={18} />
                    </div>
                    <div>
                      <h3 className="modal-title font-semibold text-base text-slate-900">Edit Campaign Task & Restrictions</h3>
                      <span className="text-xs text-slate-500">Task Reference ID: {editingTask.id}</span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setEditingTask(null)}>✕</button>
                </div>

                <form onSubmit={handleSaveTask} className="mt-4">
                  <div className="admin-form-group">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Product / Campaign Title</label>
                    <input
                      type="text"
                      required
                      value={editingTask.title || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="admin-form-input text-xs"
                      placeholder="e.g. Wireless Fast Charging Power Bank"
                    />
                  </div>

                  <div className="admin-form-group mt-3">
                    <div className="flex items-center justify-between">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Direct Store Product URL</label>
                      <button
                        type="button"
                        className="btn-link text-xs text-emerald-600 flex items-center gap-1"
                        onClick={(e) => openProductUrl(editingTask, e)}
                      >
                        <span>Test Live Listing</span>
                        <ExternalLink size={11} />
                      </button>
                    </div>
                    <div className="input-icon-field-wrap">
                      <ExternalLink size={14} className="input-field-left-icon text-slate-400" />
                      <input
                        type="url"
                        value={editingTask.productUrl || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, productUrl: e.target.value })}
                        className="admin-form-input text-xs"
                        style={{ paddingLeft: '32px' }}
                        placeholder="e.g. https://www.ebay.com/itm/... or https://www.amazon.com/dp/..."
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Users clicking this task will be redirected to this verified product listing.</p>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Platform Pool</label>
                      <select
                        value={editingTask.platform || 'eBay'}
                        onChange={(e) => setEditingTask({ ...editingTask, platform: e.target.value })}
                        className="admin-form-select text-xs"
                      >
                        <option value="eBay">eBay</option>
                        <option value="Walmart">Walmart</option>
                        <option value="Temu">Temu</option>
                        <option value="Amazon">Amazon</option>
                        <option value="AliExpress">AliExpress</option>
                        <option value="Target">Target</option>
                        <option value="Shopify">Shopify</option>
                        <option value="Shopee">Shopee</option>
                        {!['eBay', 'Walmart', 'Temu', 'Amazon', 'AliExpress', 'Target', 'Shopify', 'Shopee'].includes(editingTask.platform) && (
                          <option value={editingTask.platform}>{editingTask.platform}</option>
                        )}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Category</label>
                      <select
                        value={editingTask.category || 'Flash Deals'}
                        onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                        className="admin-form-select text-xs"
                      >
                        {[
                          'Flash Deals',
                          'Best Sellers',
                          'Trending Campaigns',
                          'New Arrivals',
                          'Electronics',
                          'Mobile Accessories',
                          'Smart Lighting',
                          'Home & Office',
                          'Furniture',
                          'Drones & Tech',
                          'Photography',
                          'Fashion & Apparel',
                          'Home & Living'
                        ].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        {editingTask.category && ![
                          'Flash Deals',
                          'Best Sellers',
                          'Trending Campaigns',
                          'New Arrivals',
                          'Electronics',
                          'Mobile Accessories',
                          'Smart Lighting',
                          'Home & Office',
                          'Furniture',
                          'Drones & Tech',
                          'Photography',
                          'Fashion & Apparel',
                          'Home & Living'
                        ].includes(editingTask.category) && (
                          <option value={editingTask.category}>{editingTask.category}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Listing Price (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingTask.price !== undefined && editingTask.price !== null ? editingTask.price : ''}
                        onChange={(e) => setEditingTask({ ...editingTask, price: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={editingTask.commissionRate !== undefined && editingTask.commissionRate !== null ? editingTask.commissionRate : ''}
                        onChange={(e) => setEditingTask({ ...editingTask, commissionRate: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  {/* LIVE ESTIMATED PROFIT PREVIEW BOX */}
                  <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={15} style={{ color: '#16a34a' }} />
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#166534' }}>
                        Calculated Member Profit per Order:
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', fontFamily: 'monospace' }}>
                      {formatUSDT(((parseFloat(editingTask.price) || 0) * (parseFloat(editingTask.commissionRate) || 0)) / 100, true)}
                    </span>
                  </div>

                  {/* DEPOSIT RESTRICTION FIELD */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '14px' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock size={14} className="text-amber-600" />
                      <label className="admin-form-label mb-0 font-semibold text-slate-800 text-xs">Deposit Balance Barrier (USDT)</label>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Required account balance or deposit threshold to unlock this task. Enter <code>0</code> for free / unrestricted.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingTask.requiredDeposit !== undefined && editingTask.requiredDeposit !== null ? editingTask.requiredDeposit : 0}
                        onChange={(e) => setEditingTask({ ...editingTask, requiredDeposit: e.target.value })}
                        className="admin-form-input text-xs tabular-nums flex-1"
                      />
                      <span className="text-xs font-semibold text-slate-600">USDT</span>
                    </div>
                  </div>

                  {/* LEARNING TASK CHECKBOX & STEP SELECTOR (1 to 25) */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '14px' }}>
                    <label className="checkbox-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingTask.isLearning)}
                        onChange={(e) => setEditingTask({ ...editingTask, isLearning: e.target.checked })}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <strong className="text-xs font-semibold text-slate-800 block">Beginner Learning Task</strong>
                        <span className="text-xs text-slate-500">Configures task in the 25-step learning series</span>
                      </div>
                    </label>

                    {editingTask.isLearning && (
                      <div className="admin-form-group mt-3">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Learning Tutorial Step (1 to 25)</label>
                        <select
                          value={editingTask.learningStep || 1}
                          onChange={(e) => setEditingTask({ ...editingTask, learningStep: parseInt(e.target.value, 10) })}
                          className="admin-form-select text-xs"
                        >
                          {Array.from({ length: 25 }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s}>
                              Step {s} : {s === 1 ? 'Step 1 (10.00 USDT Deposit Requirement)' : s === 25 ? 'Step 25 Graduation (300.00 USDT Deposit)' : `Step ${s}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Image URL</label>
                    <input
                      type="url"
                      required
                      value={editingTask.image || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, image: e.target.value })}
                      className="admin-form-input text-xs"
                    />
                    {editingTask.image && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={editingTask.image}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        <span className="text-xs text-slate-500 truncate max-w-xs">{editingTask.image}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Tag Label</label>
                      <input
                        type="text"
                        value={editingTask.tag || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, tag: e.target.value })}
                        className="admin-form-input text-xs"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Status</label>
                      <select
                        value={editingTask.active !== false ? 'true' : 'false'}
                        onChange={(e) => setEditingTask({ ...editingTask, active: e.target.value === 'true' })}
                        className="admin-form-select text-xs"
                      >
                        <option value="true">Active</option>
                        <option value="false">Disabled / Paused</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => setEditingTask(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-admin-primary"
                      style={{ flex: 2, justifyContent: 'center', padding: '10px' }}
                    >
                      <Save size={15} />
                      <span>Save Task Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
