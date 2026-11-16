import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp, deduplicateRecords } from '../context/AppContext';
import { formatRecordDate } from './DashboardView';
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
  Ban,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown
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
import { get25CampaignSlots } from '../utils/campaignSlots';
export { get25CampaignSlots };

export default function AdminView() {
  const {
    records,
    tasks,
    vipTiers,
    adminUsers,
    user,
    systemDepositAccounts,
    updateSystemDepositAccounts,
    refreshGatewaySettings,
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
    adminCreateTier,
    adminDeleteTier,
    adminUpdateUserAssignedTask,
    adminResetUserCustomPool,
    resolveUserCurrentQueue,
    adminRemoveUserAssignedTask,
    adminAddUserAssignedTask,
    adminReorderUserAssignedTasks,
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
    adminResetUserPassword,
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
  const campaignSlots = useMemo(() => get25CampaignSlots(tasks), [tasks]);
  const [selectedTaskPoolUser, setSelectedTaskPoolUserState] = useState(() => {
    try {
      return localStorage.getItem('websynx_admin_task_pool_user') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  const setSelectedTaskPoolUser = useCallback((val) => {
    setSelectedTaskPoolUserState(val);
    try {
      localStorage.setItem('websynx_admin_task_pool_user', val);
    } catch (e) {}
  }, []);

  const activePoolTargetUser = useMemo(() => {
    if (selectedTaskPoolUser === 'all') return null;
    return (adminUsers || []).find(u => String(u.id) === String(selectedTaskPoolUser)) || null;
  }, [selectedTaskPoolUser, adminUsers]);

  const activePoolSlots = useMemo(() => {
    if (!activePoolTargetUser) {
      return campaignSlots;
    }
    const userQueue = resolveUserCurrentQueue
      ? resolveUserCurrentQueue(activePoolTargetUser.id)
      : (Array.isArray(activePoolTargetUser.assignedTasks) && activePoolTargetUser.assignedTasks.length > 0 ? activePoolTargetUser.assignedTasks : campaignSlots);
    return get25CampaignSlots(userQueue);
  }, [activePoolTargetUser, campaignSlots, resolveUserCurrentQueue, adminUsers]);
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
    if (typeof refreshGatewaySettings === 'function') {
      refreshGatewaySettings();
    }
  }, [refreshGatewaySettings]);

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
  const [dispatchDestinationAddress, setDispatchDestinationAddress] = useState('');

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

  // Pre-Assignment Configure & Assign Modal state
  const [configureAssignUser, setConfigureAssignUser] = useState(null);
  const [configureAssignSlots, setConfigureAssignSlots] = useState([]);
  const [isAssigningPackage, setIsAssigningPackage] = useState(false);
  const [configureSearch, setConfigureSearch] = useState('');

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
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Quick Password Reset Modal
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState(null);
  const [resetModalNewPass, setResetModalNewPass] = useState('');
  const [resetModalLoading, setResetModalLoading] = useState(false);
  const [showResetModalPass, setShowResetModalPass] = useState(false);

  // VIP Tiers Management
  const [editingTier, setEditingTier] = useState(null);
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [newTierData, setNewTierData] = useState({
    name: '',
    platform: 'eBay',
    minBalance: '0',
    maxBalance: '499',
    commissionRate: '5.0',
    dailyTasks: '25',
    description: '',
    features: 'Daily Task Limit: 25\nCommission Rate: 5.0%\nInstant Task Credit'
  });

  // Client Assigned Tasks Management
  const [taskViewMode, setTaskViewMode] = useState('catalogue'); // 'catalogue' | 'assignedQueue'
  const [selectedUserForTaskQueue, setSelectedUserForTaskQueue] = useState('');
  const [editingAssignedTask, setEditingAssignedTask] = useState(null); // { userId, task, index }
  const [showAddAssignedModalForUser, setShowAddAssignedModalForUser] = useState(null); // userId or null
  const [addAssignedSource, setAddAssignedSource] = useState('catalog'); // 'catalog' | 'custom'
  const [selectedCatalogTaskId, setSelectedCatalogTaskId] = useState('');
  const [customAssignedTaskData, setCustomAssignedTaskData] = useState({
    title: '',
    platform: 'eBay',
    price: '50.00',
    commissionRate: '4.0',
    requiredDeposit: '0.00',
    isLearning: false,
    learningStep: 1,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
    tag: 'Promotional'
  });

  const handleSaveTier = async (e) => {
    e.preventDefault();
    if (!editingTier) return;
    try {
      const minB = parseFloat(editingTier.minBalance) || 0;
      const maxB = editingTier.maxBalance !== '' && editingTier.maxBalance !== null && editingTier.maxBalance !== undefined
        ? parseFloat(editingTier.maxBalance)
        : 99999;
      const comm = parseFloat(editingTier.commissionRate) || 4;
      const daily = parseInt(editingTier.dailyTasks, 10) || 25;
      const feats = typeof editingTier.features === 'string'
        ? editingTier.features.split('\n').map(s => s.trim()).filter(Boolean)
        : editingTier.features;

      await adminUpdateTier(editingTier.id, {
        name: editingTier.name,
        platform: editingTier.platform || editingTier.name,
        minBalance: minB,
        maxBalance: maxB,
        commissionRate: comm,
        dailyTasks: daily,
        description: editingTier.description || '',
        features: feats
      });
      setEditingTier(null);
    } catch (err) {
      alert('Error updating tier: ' + (err.message || err));
    }
  };

  const handleCreateTier = async (e) => {
    e.preventDefault();
    try {
      const minB = parseFloat(newTierData.minBalance) || 0;
      const maxB = newTierData.maxBalance !== '' && newTierData.maxBalance !== null && newTierData.maxBalance !== undefined
        ? parseFloat(newTierData.maxBalance)
        : 99999;
      const comm = parseFloat(newTierData.commissionRate) || 5;
      const daily = parseInt(newTierData.dailyTasks, 10) || 25;
      const feats = typeof newTierData.features === 'string'
        ? newTierData.features.split('\n').map(s => s.trim()).filter(Boolean)
        : newTierData.features;

      await adminCreateTier({
        name: newTierData.name.trim(),
        platform: (newTierData.platform || newTierData.name).trim(),
        minBalance: minB,
        maxBalance: maxB,
        commissionRate: comm,
        dailyTasks: daily,
        description: newTierData.description.trim(),
        features: feats
      });
      setShowAddTierModal(false);
      setNewTierData({
        name: '',
        platform: 'eBay',
        minBalance: '0',
        maxBalance: '499',
        commissionRate: '5.0',
        dailyTasks: '25',
        description: '',
        features: 'Daily Task Limit: 25\nCommission Rate: 5.0%\nInstant Task Credit'
      });
    } catch (err) {
      alert('Error creating tier: ' + (err.message || err));
    }
  };

  const handleDeleteTier = async (tier) => {
    if (window.confirm(`Are you sure you want to remove the VIP tier "${tier.name}"?`)) {
      try {
        await adminDeleteTier(tier.id);
      } catch (err) {
        alert('Error removing tier: ' + (err.message || err));
      }
    }
  };

  const handleSaveAssignedTask = async (e) => {
    e.preventDefault();
    if (!editingAssignedTask) return;
    try {
      const { userId, task, index } = editingAssignedTask;
      await adminUpdateUserAssignedTask(userId, task.id, {
        index,
        slotNumber: index + 1,
        learningStep: index + 1,
        title: task.title,
        platform: task.platform,
        price: parseFloat(task.price) || 10,
        commissionRate: parseFloat(task.commissionRate ?? task.commission_rate) || 4,
        requiredDeposit: parseFloat(task.requiredDeposit ?? task.required_deposit) || 0,
        isLearning: Boolean(task.isLearning),
        learningStep: task.isLearning ? parseInt(task.learningStep || (index + 1), 10) : (index + 1),
        image: task.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
        adminCustomized: true,
        userCustomOverride: true
      });
      setEditingAssignedTask(null);
    } catch (err) {
      alert('Error updating assigned task: ' + (err.message || err));
    }
  };

  const handleAddAssignedTask = async (e) => {
    e.preventDefault();
    if (!showAddAssignedModalForUser) return;
    try {
      const userId = showAddAssignedModalForUser;
      let taskObj = null;
      if (addAssignedSource === 'catalog') {
        const catId = selectedCatalogTaskId || tasks[0]?.id;
        const found = tasks.find(t => String(t.id) === String(catId));
        if (found) {
          taskObj = { ...found, id: `assigned_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
        }
      } else {
        taskObj = {
          id: `assigned_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: customAssignedTaskData.title.trim() || 'Custom Promotional Task',
          platform: customAssignedTaskData.platform || 'eBay',
          price: parseFloat(customAssignedTaskData.price) || 10,
          commissionRate: parseFloat(customAssignedTaskData.commissionRate) || 4,
          requiredDeposit: parseFloat(customAssignedTaskData.requiredDeposit) || 0,
          isLearning: Boolean(customAssignedTaskData.isLearning),
          learningStep: customAssignedTaskData.isLearning ? parseInt(customAssignedTaskData.learningStep || 1, 10) : null,
          image: customAssignedTaskData.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
          tag: customAssignedTaskData.tag || 'Special Deal'
        };
      }
      if (taskObj) {
        await adminAddUserAssignedTask(userId, taskObj);
      }
      setShowAddAssignedModalForUser(null);
      setCustomAssignedTaskData({
        title: '',
        platform: 'eBay',
        price: '50.00',
        commissionRate: '4.0',
        requiredDeposit: '0.00',
        isLearning: false,
        learningStep: 1,
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
        tag: 'Promotional'
      });
    } catch (err) {
      alert('Error adding assigned task: ' + (err.message || err));
    }
  };

  // Inspect User Record & Dossier Modal
  const [inspectingUser, setInspectingUser] = useState(null);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');
  const [processingDepositId, setProcessingDepositId] = useState(null);

  // Stats calculation
  const uniqueRecords = useMemo(() => {
    return deduplicateRecords(records || []);
  }, [records]);

  const isDepositRecord = (r) => {
    if (!r) return false;
    const cat = (r.category || '').toLowerCase();
    const typ = (r.type || '').toLowerCase();
    return cat === 'deposit' || typ.includes('deposit');
  };

  const isWithdrawalRecord = (r) => {
    if (!r) return false;
    const cat = (r.category || '').toLowerCase();
    const typ = (r.type || '').toLowerCase();
    return cat === 'withdrawal' || typ.includes('withdraw');
  };

  const pendingDeposits = uniqueRecords.filter(r => isDepositRecord(r) && (r.status || '').toLowerCase() === 'pending');
  const pendingWithdrawals = uniqueRecords.filter(r => isWithdrawalRecord(r) && (r.status || '').toLowerCase() === 'pending');
  const totalCompletedDeposits = uniqueRecords
    .filter(r => isDepositRecord(r) && (r.status || '').toLowerCase() === 'completed')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalCompletedWithdrawals = uniqueRecords
    .filter(r => isWithdrawalRecord(r) && (r.status || '').toLowerCase() === 'completed')
    .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount) || 0), 0);
  const totalCompletedTasks = uniqueRecords.filter(r => {
    const cat = (r.category || '').toLowerCase();
    return cat === 'ad tasks' || cat === 'tasks' || cat === 'task';
  }).length;
  const totalUserBalances = (adminUsers || []).reduce((sum, u) => sum + (parseFloat(u.balance) || 0), 0);

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
    if (editPassword && editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
      updates.password = editPassword.trim();
    }
    await adminUpdateUser(editingUser.id, updates);
    setEditingUser(null);
    setEditPassword('');
    setShowEditPassword(false);
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

  const handleOpenConfigureAssignModal = (targetUser = null) => {
    let u = targetUser;
    if (!u) {
      if (selectedTaskPoolUser !== 'all') {
        u = activePoolTargetUser;
      }
    }
    if (!u) {
      u = adminUsers[0] || null;
    }
    setConfigureAssignUser(u);
    setConfigureSearch('');
    if (u) {
      const userQueue = resolveUserCurrentQueue
        ? resolveUserCurrentQueue(u.id)
        : (Array.isArray(u.assignedTasks) && u.assignedTasks.length > 0 ? u.assignedTasks : campaignSlots);
      setConfigureAssignSlots(get25CampaignSlots(userQueue));
    } else {
      setConfigureAssignSlots(get25CampaignSlots(tasks));
    }
  };

  const handleSwitchConfigureUser = (userId) => {
    const found = adminUsers.find(u => String(u.id) === String(userId));
    setConfigureAssignUser(found || null);
    if (found) {
      const userQueue = resolveUserCurrentQueue
        ? resolveUserCurrentQueue(found.id)
        : (Array.isArray(found.assignedTasks) && found.assignedTasks.length > 0 ? found.assignedTasks : campaignSlots);
      setConfigureAssignSlots(get25CampaignSlots(userQueue));
    }
  };

  const handleUpdateSlotPrice = (index, newPrice) => {
    const p = parseFloat(newPrice);
    const validPrice = !isNaN(p) && p >= 0 ? p : 0;
    setConfigureAssignSlots(prev => prev.map((s, idx) => {
      if (idx === index) {
        const c = parseFloat(s.commissionRate ?? s.commission_rate ?? 4) || 4;
        const yieldAmt = parseFloat(((validPrice * c) / 100).toFixed(2));
        return {
          ...s,
          price: validPrice,
          yieldAmount: yieldAmt,
          yield_amount: yieldAmt,
          adminCustomized: true
        };
      }
      return s;
    }));
  };

  const handleUpdateSlotCommission = (index, newComm) => {
    const c = parseFloat(newComm);
    const validComm = !isNaN(c) && c >= 0 ? c : 4;
    setConfigureAssignSlots(prev => prev.map((s, idx) => {
      if (idx === index) {
        const p = parseFloat(s.price) || 0;
        const yieldAmt = parseFloat(((p * validComm) / 100).toFixed(2));
        return {
          ...s,
          commissionRate: validComm,
          commission_rate: validComm,
          yieldRate: `${validComm}%`,
          yield_rate: `${validComm}%`,
          yieldAmount: yieldAmt,
          yield_amount: yieldAmt,
          adminCustomized: true
        };
      }
      return s;
    }));
  };

  const handleUpdateSlotDeposit = (index, newDep) => {
    const dep = parseFloat(newDep);
    const validDep = !isNaN(dep) && dep >= 0 ? dep : 0;
    setConfigureAssignSlots(prev => prev.map((s, idx) => {
      if (idx === index) {
        return {
          ...s,
          requiredDeposit: validDep,
          required_deposit: validDep,
          adminCustomized: true
        };
      }
      return s;
    }));
  };

  const handleApplyPresetBarriers = () => {
    setConfigureAssignSlots(prev => prev.map((s, idx) => {
      const slotNum = idx + 1;
      let dep = 0;
      if (slotNum === 10) dep = 50;
      else if (slotNum === 15) dep = 100;
      else if (slotNum === 20) dep = 150;
      else if (slotNum === 25) dep = 300;
      return {
        ...s,
        requiredDeposit: dep,
        required_deposit: dep,
        adminCustomized: true
      };
    }));
  };

  const handleClearAllBarriers = () => {
    setConfigureAssignSlots(prev => prev.map(s => ({
      ...s,
      requiredDeposit: 0,
      required_deposit: 0,
      adminCustomized: true
    })));
  };

  const handleResetToStandardCatalogue = () => {
    setConfigureAssignSlots(get25CampaignSlots(tasks));
  };

  const handleConfirmConfigureAssignment = async () => {
    if (!configureAssignUser) return;
    setIsAssigningPackage(true);
    try {
      await adminAssignTasksToUser(configureAssignUser.id, configureAssignSlots, 'Custom 25 Package', true);
      addNotification('Tasks Assigned', `Successfully customized and assigned 25 tasks to ${configureAssignUser.name}.`);
      setConfigureAssignUser(null);
    } catch (err) {
      alert('Error assigning package: ' + (err.message || err));
    } finally {
      setIsAssigningPackage(false);
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
    let stepNum = t.slotNumber || t.learningStep || t.learning_step;
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
      targetUserId: selectedTaskPoolUser !== 'all' ? selectedTaskPoolUser : null,
      slotNumber: t.slotNumber || stepNum,
      title: t.title || '',
      platform: t.platform || 'eBay',
      category: t.category || 'General',
      price: isNaN(priceVal) ? 10 : priceVal,
      commissionRate: isNaN(commVal) ? 4 : commVal,
      requiredDeposit: isNaN(reqDepVal) ? 0 : reqDepVal,
      isLearning: true,
      learningStep: stepNum,
      image: imgVal,
      orders: t.orders !== undefined ? t.orders : 120,
      rating: t.rating !== undefined ? t.rating : 4.9,
      tag: t.tag || `Slot #${stepNum}`,
      description: t.description || '',
      active: t.active !== false && t.status !== 'Inactive' && t.status !== 'Disabled',
      productUrl: prodUrlVal || ''
    });
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.id) return;
    try {
      const poolSource = editingTask.targetUserId ? activePoolSlots : tasks;
      const existing = (poolSource || []).find(x => String(x.id) === String(editingTask.id)) || {};
      const priceVal = parseFloat(editingTask.price);
      const commVal = parseFloat(editingTask.commissionRate);
      const depVal = parseFloat(editingTask.requiredDeposit);

      const finalPrice = !isNaN(priceVal) ? priceVal : (existing.price || 10);
      const finalComm = !isNaN(commVal) ? commVal : (existing.commissionRate || 4);
      const finalYield = parseFloat(((finalPrice * finalComm) / 100).toFixed(2));
      const finalDep = !isNaN(depVal) ? Math.max(0, depVal) : (existing.requiredDeposit || 0);

      const stepVal = parseInt(editingTask.slotNumber || editingTask.learningStep || 1, 10);

      const finalImage = (editingTask.image || existing.image || getProductImage(editingTask)).trim();
      const finalProductUrl = editingTask.productUrl ? editingTask.productUrl.trim() : (existing.productUrl || null);

      // Merge existing task data so NO field is deleted
      const updatedPayload = {
        ...existing,
        ...editingTask,
        id: editingTask.id,
        slotNumber: stepVal,
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
        isLearning: true,
        is_learning: true,
        learningStep: stepVal,
        learning_step: stepVal,
        image: finalImage,
        imageUrl: finalImage,
        image_url: finalImage,
        orders: editingTask.orders !== undefined ? editingTask.orders : (existing.orders || 120),
        rating: editingTask.rating !== undefined ? editingTask.rating : (existing.rating || 4.9),
        tag: editingTask.tag ?? existing.tag ?? `Slot #${stepVal}`,
        description: editingTask.description ?? existing.description ?? '',
        active: Boolean(editingTask.active),
        status: editingTask.active ? 'Active' : 'Disabled',
        productUrl: finalProductUrl,
        product_url: finalProductUrl
      };

      if (editingTask.targetUserId) {
        // Update user-specific custom pool
        await adminUpdateUserAssignedTask(editingTask.targetUserId, editingTask.id, {
          ...updatedPayload,
          slotNumber: stepVal,
          learningStep: stepVal,
          index: stepVal - 1
        });
      } else {
        // Update global base catalogue
        await adminUpdateTask(editingTask.id, updatedPayload);
      }

      if (configureAssignUser) {
        setConfigureAssignSlots(prev => prev.map((s, idx) => {
          if (String(s.id) === String(editingTask.id) || idx === (stepVal - 1)) {
            return { ...s, ...updatedPayload };
          }
          return s;
        }));
      }
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
      if (selectedTaskPoolUser !== 'all') {
        await adminUpdateUserAssignedTask(selectedTaskPoolUser, t.id, {
          active: t.active === false,
          status: t.active === false ? 'Active' : 'Disabled',
          slotNumber: t.slotNumber,
          learningStep: t.slotNumber,
          index: (t.slotNumber || 1) - 1
        });
      } else {
        await adminUpdateTask(t.id, { active: !t.active });
      }
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
      await adminApproveWithdrawal(dispatchModalRecord.id, dispatchTxHash, dispatchDestinationAddress);
      setDispatchModalRecord(null);
      setDispatchTxHash('');
      setDispatchDestinationAddress('');
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
                placeholder="Enter administrator email"
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
              className="btn-outline w-full text-xs py-2.5 font-medium"
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
                  className="btn-hero-deposit"
                  onClick={() => handleOpenConfigureAssignModal()}
                  title="Configure pricing, commission, and barriers before assigning 25 tasks to any client"
                >
                  <Sliders size={16} />
                  <span>🎯 Configure & Assign 25</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-withdraw"
                  onClick={() => {
                    setSelectedUserForRandom(adminUsers[0]?.id || '');
                    setRandomTaskCount(25);
                    setShowAssignRandomModal(true);
                  }}
                  title="Quick Random Assignment"
                >
                  <Shuffle size={16} />
                  <span>🎲 Quick Random Assign</span>
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
                                <span className="cell-mono-addr">
                                  {(() => {
                                    const uMatch = (adminUsers || []).find(u => u.id === wth.userId || u.id === wth.user_id || u.name === wth.userName);
                                    const rDest = wth.wallet_address || wth.walletAddress || wth.destination || uMatch?.wallet_address || uMatch?.walletAddress || uMatch?.wallet || '';
                                    const cleanAddr = (rDest && rDest !== 'TRC20Address' && rDest !== 'Not Provided') ? rDest : '';
                                    return cleanAddr ? formatCompactAddress(cleanAddr) : 'Not Bound';
                                  })()}
                                </span>
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
                                const uMatch = (adminUsers || []).find(u => u.id === wth.userId || u.id === wth.user_id || u.name === wth.userName);
                                const rDest = wth.wallet_address || wth.walletAddress || wth.destination || uMatch?.wallet_address || uMatch?.walletAddress || uMatch?.wallet || '';
                                const initAddr = (rDest && rDest !== 'TRC20Address' && rDest !== 'Not Provided') ? rDest : '';
                                setDispatchDestinationAddress(initAddr);
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
                    { id: 'all', label: `All (${uniqueRecords.filter(r => isDepositRecord(r)).length})` },
                    { id: 'pending', label: `Pending (${uniqueRecords.filter(r => isDepositRecord(r) && (r.status || 'Pending').toLowerCase() === 'pending').length})` },
                    { id: 'completed', label: `Completed (${uniqueRecords.filter(r => isDepositRecord(r) && (r.status || '').toLowerCase() === 'completed').length})` },
                    { id: 'rejected', label: `Rejected (${uniqueRecords.filter(r => isDepositRecord(r) && (r.status || '').toLowerCase() === 'rejected').length})` }
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
                      if (!isDepositRecord(r)) return false;
                      const statusLower = (r.status || 'Pending').toLowerCase();
                      if (depositFilter !== 'all' && statusLower !== depositFilter) return false;
                      if (depositSearch) {
                        const q = depositSearch.toLowerCase();
                        const code = (r.code || r.id || '').toLowerCase();
                        const userName = (r.userName || r.user_name || '').toLowerCase();
                        const txHash = (r.txHash || r.tx_hash || '').toLowerCase();
                        return code.includes(q) || userName.includes(q) || txHash.includes(q);
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
                        if (!isDepositRecord(r)) return false;
                        const statusLower = (r.status || 'Pending').toLowerCase();
                        if (depositFilter !== 'all' && statusLower !== depositFilter) return false;
                        if (depositSearch) {
                          const q = depositSearch.toLowerCase();
                          const code = (r.code || r.id || '').toLowerCase();
                          const userName = (r.userName || r.user_name || '').toLowerCase();
                          const txHash = (r.txHash || r.tx_hash || '').toLowerCase();
                          return code.includes(q) || userName.includes(q) || txHash.includes(q);
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
                              <span className="cell-date">{formatRecordDate(rec.date)}</span>
                            </td>
                            <td>
                              <span className={`admin-badge ${statusLower === 'completed' ? 'success' : statusLower === 'rejected' ? 'danger' : 'pending'}`}>
                                {rec.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {statusLower === 'pending' ? (
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
                               (r.destination && r.destination.toLowerCase().includes(q)) ||
                               (r.wallet_address && r.wallet_address.toLowerCase().includes(q)) ||
                               (r.walletAddress && r.walletAddress.toLowerCase().includes(q));
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
                                 (r.destination && r.destination.toLowerCase().includes(q)) ||
                                 (r.wallet_address && r.wallet_address.toLowerCase().includes(q)) ||
                                 (r.walletAddress && r.walletAddress.toLowerCase().includes(q));
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
                        const targetUser = (adminUsers || []).find(u => u.id === rec.userId || u.id === rec.user_id || u.name === rec.userName);
                        const rawDest = rec.wallet_address || rec.walletAddress || rec.destination || targetUser?.walletAddress || targetUser?.wallet_address || targetUser?.wallet || '';
                        const destAddr = (rawDest && rawDest !== 'TRC20Address' && rawDest !== 'Not Provided') ? rawDest : null;
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
                              {destAddr ? (
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
                              ) : (
                                <span className="admin-badge neutral" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', fontSize: '11px', padding: '2px 8px' }}>
                                  Not Bound
                                </span>
                              )}
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
                                      const uMatch = (adminUsers || []).find(u => u.id === rec.userId || u.id === rec.user_id || u.name === rec.userName);
                                      const rDest = rec.wallet_address || rec.walletAddress || rec.destination || uMatch?.walletAddress || uMatch?.wallet_address || uMatch?.wallet || '';
                                      const initAddr = (rDest && rDest !== 'TRC20Address' && rDest !== 'Not Provided') ? rDest : '';
                                      setDispatchDestinationAddress(initAddr);
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
                        <div className="modal-summary-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px', alignItems: 'center' }}>
                          <span className="text-muted">Destination TRON Address:</span>
                          {dispatchDestinationAddress ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <code className="cell-mono-addr font-bold" style={{ fontSize: '11.5px', color: '#0f172a' }}>
                                {formatCompactAddress(dispatchDestinationAddress, 10, 8)}
                              </code>
                              <button
                                type="button"
                                className="cell-copy-btn"
                                title="Copy Client TRON Address"
                                onClick={() => copyToClipboard(dispatchDestinationAddress, 'Client Wallet Address')}
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '11px' }}>⚠️ Address Not Bound</span>
                          )}
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label className="input-label" style={{ margin: 0 }}>Destination TRON TRC20 Wallet</label>
                          {dispatchDestinationAddress && (
                            <button
                              type="button"
                              className="cell-copy-btn"
                              title="Copy TRC20 Wallet Address"
                              onClick={() => copyToClipboard(dispatchDestinationAddress, 'TRON Wallet Address')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '11px' }}
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={dispatchDestinationAddress}
                          onChange={(e) => setDispatchDestinationAddress(e.target.value)}
                          className="admin-form-input font-mono"
                          placeholder="e.g. TWiD4iHAcgaqf2WSsbUSSCMrBMUAiiVhDj"
                        />
                        {dispatchDestinationAddress && !dispatchDestinationAddress.trim().startsWith('T') && (
                          <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'block', fontWeight: 500 }}>
                            ⚠️ TRON address must start with capital "T"
                          </span>
                        )}
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

            {/* PENDING DEPOSITS ACTION BANNER */}
            {pendingDeposits.length > 0 && (
              <div className="admin-panel-card mb-4 animate-slide-down" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontSize: '13px', fontWeight: 600 }}>
                    <AlertTriangle size={16} color="#2563eb" />
                    <span>
                      <strong>{pendingDeposits.length} Deposit{pendingDeposits.length > 1 ? 's' : ''} Pending Approval</strong> awaiting admin verification.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-admin-primary btn-admin-sm"
                    onClick={() => setActiveAdminTab('deposits')}
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#fff' }}
                  >
                    <Wallet size={13} />
                    <span>Review Deposits ({pendingDeposits.length}) →</span>
                  </button>
                </div>
              </div>
            )}

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
                      <th title="Member's Sponsor Code & Personal Referral Code">Ref & Sponsor</th>
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
                        const ownRefCode = u.referralCode || u.code || '';
                        const joinedWithCode = u.invitedByCode || u.referredByCode || (u.referredBy && !String(u.referredBy).startsWith('usr_') ? u.referredBy : '888888');
                        const sponsorName = u.referredByName || (joinedWithCode === '888888' ? 'System Administrator' : '');
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 600 }}>Joined:</span>
                                  <span
                                    className="cell-tracking-code"
                                    style={{ padding: '2px 7px', fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                                    title={sponsorName ? `Sponsor: ${sponsorName}` : `Joined via code ${joinedWithCode}`}
                                  >
                                    {joinedWithCode}
                                  </span>
                                  {joinedWithCode === '888888' && (
                                    <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 600, background: '#dbeafe', padding: '1px 5px', borderRadius: '4px' }}>Admin</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
                                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', fontWeight: 600 }}>User:</span>
                                  <span className="font-mono font-semibold" style={{ color: '#0f172a' }} title="Member's personal invitation code">
                                    {ownRefCode || 'None'}
                                  </span>
                                </div>
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
                                  className="btn-table-action-approve flex items-center gap-1"
                                  title="Configure tasks, prices, and deposit barriers before assigning to this client"
                                  onClick={() => handleOpenConfigureAssignModal(u)}
                                >
                                  <Sliders size={12} />
                                  <span>{u.taskPackageRequested ? 'Review & Assign' : 'Configure & Assign'}</span>
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
                                    setEditPassword('');
                                    setShowEditPassword(false);
                                    setEditBalance(currentUBal.toString());
                                    setEditTier(currentUTier);
                                    setEditStatus(currentUStatus);
                                    setEditWalletAddress(currentUWallet);
                                    setEditKyc(currentUKyc);
                                    setEditReferralCode(ownRefCode);
                                    setEditInvitedByCode(u.invitedByCode || u.referredByCode || '888888');
                                    setEditPendingTasks((u.pendingTasks ?? Math.max(0, dailyQuota - completedTasks)).toString());
                                    setEditCompletedTasks(completedTasks.toString());
                                    setEditDailyQuota(dailyQuota.toString());
                                    setEditAssignedPackage(u.assignedPackage || 'none');
                                  }}
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-table-action-secondary"
                                  title="Reset User Password"
                                  style={{ color: '#4338ca', borderColor: '#c7d2fe' }}
                                  onClick={() => {
                                    setResetPasswordModalUser(u);
                                    const rand = 'Pass' + Math.floor(100000 + Math.random() * 900000);
                                    setResetModalNewPass(rand);
                                    setShowResetModalPass(true);
                                  }}
                                >
                                  <Key size={12} />
                                  <span>Password</span>
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

                      <div className="input-group mt-3" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div className="flex items-center justify-between">
                          <label className="input-label" style={{ color: '#4338ca', fontWeight: 600, margin: 0 }}>
                            <Key size={13} style={{ display: 'inline', marginRight: '5px' }} />
                            Reset / Change User Password
                          </label>
                          <button
                            type="button"
                            className="text-xs text-primary-brand font-bold"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                          >
                            {showEditPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <input
                            type={showEditPassword ? "text" : "password"}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="text-input-field font-mono"
                            style={{ fontSize: '12px' }}
                            placeholder="Leave blank to keep current password, or enter new password"
                          />
                          <button
                            type="button"
                            className="btn-outline text-xs px-3"
                            style={{ whiteSpace: 'nowrap', fontWeight: 600 }}
                            onClick={() => {
                              const rand = 'Pass' + Math.floor(100000 + Math.random() * 900000);
                              setEditPassword(rand);
                              setShowEditPassword(true);
                            }}
                          >
                            ⚡ Random
                          </button>
                        </div>
                        <span className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                          Entering a new password here will immediately update the user's password in the database upon saving.
                        </span>
                      </div>

                      <button type="submit" className="btn-primary w-full mt-4 py-2.5">
                        Save Changes to User Ledger
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Reset User Password Modal */}
            {resetPasswordModalUser && (
              <div className="modal-overlay animate-fade-in" onClick={() => setResetPasswordModalUser(null)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-box max-w-md">
                    <div className="modal-header">
                      <div className="header-with-icon">
                        <div className="icon-pill-blue" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                          <Key size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Reset Password: {resetPasswordModalUser.name}</h3>
                          <span className="sub-text">{resetPasswordModalUser.email}</span>
                        </div>
                      </div>
                      <button className="close-btn" onClick={() => setResetPasswordModalUser(null)}>✕</button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const cleanPass = resetModalNewPass.trim();
                        if (!cleanPass || cleanPass.length < 6) {
                          alert('Password must be at least 6 characters long.');
                          return;
                        }
                        setResetModalLoading(true);
                        try {
                          await adminResetUserPassword(resetPasswordModalUser.id, cleanPass);
                          alert(`Password for ${resetPasswordModalUser.name} has been successfully reset to:\n\n${cleanPass}\n\nPlease share this password with the user.`);
                          setResetPasswordModalUser(null);
                          setResetModalNewPass('');
                        } catch (err) {
                          alert('Failed to reset password: ' + (err.message || 'database error'));
                        } finally {
                          setResetModalLoading(false);
                        }
                      }}
                      className="mt-4"
                    >
                      <div className="input-group">
                        <div className="flex items-center justify-between">
                          <label className="input-label font-semibold">New Password for User</label>
                          <button
                            type="button"
                            className="text-xs text-primary-brand font-bold"
                            onClick={() => setShowResetModalPass(!showResetModalPass)}
                          >
                            {showResetModalPass ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <input
                            type={showResetModalPass ? "text" : "password"}
                            value={resetModalNewPass}
                            onChange={(e) => setResetModalNewPass(e.target.value)}
                            className="text-input-field font-mono font-bold"
                            placeholder="Enter new password (min 6 characters)"
                            required
                          />
                          <button
                            type="button"
                            className="btn-outline text-xs px-3 font-semibold"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={() => {
                              const rand = 'Pass' + Math.floor(100000 + Math.random() * 900000);
                              setResetModalNewPass(rand);
                              setShowResetModalPass(true);
                            }}
                          >
                            ⚡ Random
                          </button>
                        </div>
                      </div>

                      <div className="alert-box-info mt-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#1e40af' }}>
                        <span>This will immediately overwrite the password in the database. Provide this new password to the user so they can log in.</span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ flex: 1, padding: '9px 12px' }}
                          onClick={() => setResetPasswordModalUser(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={resetModalLoading}
                          className="btn-primary"
                          style={{ flex: 2, padding: '9px 12px', fontWeight: 600 }}
                        >
                          {resetModalLoading ? 'Saving...' : 'Confirm & Reset Password'}
                        </button>
                      </div>
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
                              {inspectingUser.invitedByCode || inspectingUser.referredByCode || (inspectingUser.referredBy && !String(inspectingUser.referredBy).startsWith('usr_') ? inspectingUser.referredBy : '888888')}
                            </strong>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">Invited By / Sponsor:</span>
                            <span className="d-val font-medium">
                              {inspectingUser.referredByName || (inspectingUser.invitedByCode === '888888' ? 'System Administrator' : (inspectingUser.invitedByCode ? `Code #${inspectingUser.invitedByCode}` : 'System Administrator'))}
                            </span>
                          </div>
                          <div className="dossier-row">
                            <span className="d-label">User's Own Referral Code:</span>
                            <strong className="d-val admin-code-pill amber">
                              {inspectingUser.referralCode || inspectingUser.code || ''}
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

                    {/* 5. Assigned Tasks Queue Section */}
                    {(() => {
                      const userQueue = Array.isArray(inspectingUser.assignedTasks) && inspectingUser.assignedTasks.length > 0
                        ? inspectingUser.assignedTasks
                        : (() => {
                            try {
                              const c = localStorage.getItem(`websynx_user_assigned_tasks_${inspectingUser.id}`);
                              if (c) {
                                const p = JSON.parse(c);
                                if (Array.isArray(p)) return p;
                              }
                            } catch (e) {}
                            return [];
                          })();

                      return (
                        <div className="dossier-card full-width mt-4">
                          <div className="dossier-card-header flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ClipboardList size={16} className="text-indigo-600" />
                              <h4 className="font-semibold text-slate-800">
                                Assigned Tasks Queue ({userQueue.length} Steps)
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="btn-admin-primary text-xs py-1 px-2.5 flex items-center gap-1"
                                onClick={() => setShowAddAssignedModalForUser(inspectingUser.id)}
                              >
                                <Plus size={12} />
                                <span>+ Add Task</span>
                              </button>
                              <button
                                type="button"
                                className="btn-admin-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                                onClick={() => adminAssignRandomTasks && adminAssignRandomTasks(inspectingUser.id, 25)}
                                title="Re-assign 25 Tasks"
                              >
                                <Shuffle size={12} />
                                <span>Assign 25</span>
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            {userQueue.length === 0 ? (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                                No specific tasks queued for this user. System falls back to default platform catalogue tasks.
                              </div>
                            ) : (
                              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-xs text-left bg-white">
                                  <thead>
                                    <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                                      <th className="py-2 px-2.5 text-center w-12">#</th>
                                      <th className="py-2 px-2.5">Task / Product</th>
                                      <th className="py-2 px-2.5">Platform</th>
                                      <th className="py-2 px-2.5">Price</th>
                                      <th className="py-2 px-2.5">Yield</th>
                                      <th className="py-2 px-2.5">Barrier</th>
                                      <th className="py-2 px-2.5 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {userQueue.map((at, idx) => {
                                      const price = Number(at.price || 0);
                                      const comm = Number(at.commissionRate ?? at.commission_rate ?? 4);
                                      const profit = (price * comm) / 100;
                                      const barrier = Number(at.requiredDeposit ?? at.required_deposit ?? 0);

                                      return (
                                        <tr key={at.id || idx} className="hover:bg-indigo-50/20">
                                          <td className="py-2 px-2.5 text-center font-bold text-slate-400">
                                            #{idx + 1}
                                          </td>
                                          <td className="py-2 px-2.5">
                                            <div className="flex items-center gap-2">
                                              <img
                                                src={at.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80'}
                                                alt=""
                                                className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0"
                                                onError={(e) => {
                                                  e.currentTarget.onerror = null;
                                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                                                }}
                                              />
                                              <div className="max-w-[200px]">
                                                <div className="font-medium text-slate-800 truncate" title={at.title}>
                                                  {at.title}
                                                </div>
                                                {at.isLearning && (
                                                  <span className="text-[10px] text-amber-600 font-semibold">
                                                    Step {at.learningStep || (idx + 1)} Learning Task
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-2 px-2.5">
                                            <span className="admin-code-pill font-medium">{at.platform || 'eBay'}</span>
                                          </td>
                                          <td className="py-2 px-2.5 font-mono font-semibold text-slate-700">
                                            ${price.toFixed(2)}
                                          </td>
                                          <td className="py-2 px-2.5">
                                            <div className="font-semibold text-emerald-600">+{comm}%</div>
                                            <div className="text-[10px] text-slate-400">+${profit.toFixed(2)}</div>
                                          </td>
                                          <td className="py-2 px-2.5 font-mono">
                                            {barrier > 0 ? (
                                              <span className="text-amber-600 font-semibold">${barrier.toFixed(2)}</span>
                                            ) : (
                                              <span className="text-slate-400">$0.00</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <button
                                                type="button"
                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                                title="Move Up"
                                                disabled={idx === 0}
                                                onClick={() => adminReorderUserAssignedTasks && adminReorderUserAssignedTasks(inspectingUser.id, idx, idx - 1)}
                                              >
                                                <ChevronUp size={14} />
                                              </button>
                                              <button
                                                type="button"
                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                                title="Move Down"
                                                disabled={idx === userQueue.length - 1}
                                                onClick={() => adminReorderUserAssignedTasks && adminReorderUserAssignedTasks(inspectingUser.id, idx, idx + 1)}
                                              >
                                                <ChevronDown size={14} />
                                              </button>
                                              <button
                                                type="button"
                                                className="btn-table-action-secondary text-xs py-0.5 px-1.5 flex items-center gap-1"
                                                title="Edit this Assigned Task"
                                                onClick={() => setEditingAssignedTask({ userId: inspectingUser.id, task: { ...at }, index: idx })}
                                              >
                                                <Edit2 size={11} />
                                                <span>Edit</span>
                                              </button>
                                              <button
                                                type="button"
                                                className="btn-table-action-danger text-xs py-0.5 px-1.5"
                                                title="Remove Task"
                                                onClick={() => {
                                                  if (confirm(`Remove "${at.title}" from this user's queue?`)) {
                                                    adminRemoveUserAssignedTask && adminRemoveUserAssignedTask(inspectingUser.id, at.id);
                                                  }
                                                }}
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
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
                          setEditPassword('');
                          setShowEditPassword(false);
                          setEditBalance((u.balance || 0).toString());
                          setEditTier(u.vipLevel || u.vipTier || 'eBay');
                          setEditStatus(u.status || 'Active');
                          setEditWalletAddress(u.walletAddress || u.wallet || '');
                          setEditKyc(u.kycStatus || u.kyc || 'Verified');
                          setEditReferralCode(u.referralCode || u.code || '');
                          setEditInvitedByCode(u.invitedByCode || u.referredByCode || '888888');
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
            {/* DYNAMIC SAPPHIRE HERO BANNER */}
            <div className="dashboard-hero-banner mb-6">
              <div className="hero-banner-top">
                <div className="hero-greeting">
                  <div className="hero-invite-bar mb-2.5 flex items-center gap-2 flex-wrap">
                    <div className="hero-invite-badge">
                      <div className="invite-tag-label">
                        <Zap size={13} className="text-amber-300" />
                        <span>{activePoolTargetUser ? 'CUSTOM CLIENT POOL:' : 'CAMPAIGN ENGINE:'}</span>
                      </div>
                      <span className="invite-code-number">
                        {activePoolTargetUser ? activePoolTargetUser.name.toUpperCase() : '25 SLOTS SEQUENTIAL'}
                      </span>
                    </div>

                    <div className="hero-invite-team-btn" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }}>
                      <Layers size={12} />
                      <span>{activePoolTargetUser ? `Client Tier: ${activePoolTargetUser.vipLevel || 'eBay'}` : 'Global Base Catalogue'}</span>
                    </div>
                  </div>

                  <h2>
                    {activePoolTargetUser ? `🎯 ${activePoolTargetUser.name}'s Custom 25 Task Pool` : '25 Campaign Task Slots Pool'}
                  </h2>
                  <div className="greeting-name-row">
                    <span className="greeting-name" style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.95 }}>
                      {activePoolTargetUser
                        ? `Custom promotional slots assigned specifically to ${activePoolTargetUser.name} (${activePoolTargetUser.email || 'No email'}). Every price, commission profit, and deposit barrier changed here applies ONLY to this user.`
                        : 'Manage the global 25 sequential promotion slots. Configure default product pricing, commission profits, and deposit balance barriers for each slot.'}
                    </span>
                  </div>
                </div>

                <div className="hero-balance-col" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <span className="hero-bal-label">{activePoolTargetUser ? 'CLIENT BALANCE' : 'TOTAL CAMPAIGN SLOTS'}</span>
                    <div className="hero-bal-val">
                      <span className="bal-num">
                        {activePoolTargetUser ? Number(activePoolTargetUser.balance || 0).toFixed(2) : '25'}
                      </span>
                      <span className="bal-curr">{activePoolTargetUser ? 'USDT' : 'SLOTS'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="hero-action-row">
                {activePoolTargetUser ? (
                  <>
                    <button
                      type="button"
                      className="btn-hero-deposit"
                      onClick={() => handleOpenConfigureAssignModal(activePoolTargetUser)}
                      title={`Open 25-task pre-assignment customizer to edit all prices and barriers for ${activePoolTargetUser.name} before assigning`}
                    >
                      <Sliders size={16} />
                      <span>Configure & Assign to {activePoolTargetUser.name}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-hero-deposit"
                      style={{ background: '#059669' }}
                      onClick={() => {
                        adminAssignTasksToUser && adminAssignTasksToUser(activePoolTargetUser.id, activePoolSlots, 'Custom 25 Package', false);
                      }}
                      title={`Assign or re-sync this 25 custom slot package directly to ${activePoolTargetUser.name}`}
                    >
                      <Check size={16} />
                      <span>{Number(activePoolTargetUser.pendingTasks || activePoolTargetUser.pending_tasks || 0) > 0 ? `Update Active for ${activePoolTargetUser.name}` : `Assign Package to ${activePoolTargetUser.name}`}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-hero-withdraw"
                      onClick={() => {
                        if (confirm(`Reset ${activePoolTargetUser.name}'s custom pool back to standard initial 25 default slots?`)) {
                          adminResetUserCustomPool && adminResetUserCustomPool(activePoolTargetUser.id);
                        }
                      }}
                      title={`Reset ${activePoolTargetUser.name}'s tasks to default base slots`}
                    >
                      <RefreshCw size={16} />
                      <span>Reset {activePoolTargetUser.name} to Defaults</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-hero-deposit"
                      onClick={() => handleOpenConfigureAssignModal()}
                      title="Select client, configure 25 task pricing & barriers, then assign"
                    >
                      <Sliders size={16} />
                      <span>🎯 Configure & Assign 25 to Client</span>
                    </button>

                    <button
                      type="button"
                      className="btn-hero-withdraw"
                      onClick={() => {
                        if (confirm('Restore all 25 campaign task slots back to standard initial defaults?')) {
                          adminRestoreDefaultTasks && adminRestoreDefaultTasks();
                        }
                      }}
                      title="Reload and restore all 25 default campaign slots"
                    >
                      <RefreshCw size={16} />
                      <span>Restore 25 Defaults</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* USER POOL DROPDOWN SELECTOR BAR */}
            <div className="admin-clean-card p-3.5 mb-5 flex items-center justify-between gap-3 flex-wrap shadow-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3 flex-wrap flex-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
                  <Users size={16} className="text-indigo-600" />
                  <span>Task Pool Scope:</span>
                </div>

                <select
                  value={selectedTaskPoolUser}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTaskPoolUser(val);
                    if (val !== 'all') {
                      setSelectedUserForTaskQueue(val);
                    }
                  }}
                  className="admin-form-select text-xs py-2 px-3 rounded-xl border border-indigo-200 font-bold text-indigo-900 bg-white shadow-sm focus:border-indigo-500 min-w-[280px]"
                >
                  <option value="all">🌐 Global Default Pool (Base Catalogue for All Users)</option>
                  <optgroup label="Custom Client Pools (Select to view & customize only for that user):">
                    {adminUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        👤 {u.name} ({u.email || 'No email'}) • {u.vipLevel || u.vipTier || 'eBay'} • ${Number(u.balance || 0).toFixed(2)} USDT
                      </option>
                    ))}
                  </optgroup>
                </select>

                {activePoolTargetUser ? (
                  <span className="admin-code-pill indigo text-xs py-1 px-2.5 font-bold flex items-center gap-1">
                    <Zap size={11} className="text-amber-500" />
                    <span>Custom Pool Active: {activePoolTargetUser.name}</span>
                  </span>
                ) : (
                  <span className="admin-code-pill neutral text-xs py-1 px-2.5 font-medium">
                    Global Base Pool (Shared)
                  </span>
                )}
              </div>

              {activePoolTargetUser && (
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span>Completed: <strong>{activePoolTargetUser.dailyCompleted ?? activePoolTargetUser.completedTasks ?? 0}/25</strong></span>
                  <span>•</span>
                  <span>Balance: <strong>${Number(activePoolTargetUser.balance || 0).toFixed(2)}</strong></span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600">
                    {activePoolTargetUser.taskPackageStatus === 'assigned' ? '✓ Assigned' : '○ Ready'}
                  </span>
                </div>
              )}
            </div>

            {/* VIEW MODE TOGGLE: 25 CAMPAIGN SLOTS vs CLIENT QUEUE */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${taskViewMode === 'catalogue' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setTaskViewMode('catalogue')}
                >
                  <Layers size={14} />
                  <span>25 Campaign Task Slots (25)</span>
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${taskViewMode === 'assignedQueue' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => {
                    setTaskViewMode('assignedQueue');
                    if (selectedTaskPoolUser !== 'all') {
                      setSelectedUserForTaskQueue(selectedTaskPoolUser);
                    } else if (!selectedUserForTaskQueue && adminUsers.length > 0) {
                      setSelectedUserForTaskQueue(adminUsers[0].id);
                    }
                  }}
                >
                  <ClipboardList size={14} />
                  <span>Client Assigned Tasks Queue</span>
                </button>
              </div>

              {taskViewMode === 'assignedQueue' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs font-semibold text-slate-700">Select Client:</label>
                  <select
                    value={selectedUserForTaskQueue || (adminUsers[0]?.id || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedUserForTaskQueue(val);
                      setSelectedTaskPoolUser(val);
                    }}
                    className="admin-form-select text-xs py-1.5 px-3 rounded-lg border border-slate-300 font-semibold text-indigo-900 bg-white"
                  >
                    {adminUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email || 'No email'}) • {u.vipLevel || u.vipTier || 'eBay'} • Balance: ${Number(u.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn-admin-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    onClick={() => setShowAddAssignedModalForUser(selectedUserForTaskQueue || adminUsers[0]?.id)}
                  >
                    <Plus size={14} />
                    <span>+ Add Task to Queue</span>
                  </button>
                </div>
              )}
            </div>

            {taskViewMode === 'assignedQueue' ? (
              (() => {
                const targetUser = adminUsers.find(u => String(u.id) === String(selectedUserForTaskQueue)) || adminUsers[0];
                if (!targetUser) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs admin-clean-card">
                      No client registered yet. Register a user or create an account to view assigned queues.
                    </div>
                  );
                }

                const queue = resolveUserCurrentQueue
                  ? resolveUserCurrentQueue(targetUser.id)
                  : (Array.isArray(targetUser.assignedTasks) && targetUser.assignedTasks.length > 0 ? targetUser.assignedTasks : get25CampaignSlots(tasks));

                return (
                  <div className="admin-clean-card p-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{targetUser.name}</span>
                          <span className="admin-code-pill font-medium">{targetUser.vipLevel || targetUser.vipTier || 'eBay'}</span>
                          <span className="text-xs text-slate-400">({targetUser.email || 'No email'})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Active Queue: <strong>{queue.length} Tasks</strong> • Completed Today: <strong>{targetUser.dailyCompleted ?? targetUser.completedTasks ?? 0}</strong> • Balance: <strong>${Number(targetUser.balance || 0).toFixed(2)} USDT</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-admin-primary text-xs py-1 px-3 flex items-center gap-1.5"
                          onClick={() => setShowAddAssignedModalForUser(targetUser.id)}
                        >
                          <Plus size={13} />
                          <span>+ Add Task to Queue</span>
                        </button>
                        <button
                          type="button"
                          className="btn-admin-secondary text-xs py-1 px-3 flex items-center gap-1.5"
                          onClick={() => adminAssignRandomTasks && adminAssignRandomTasks(targetUser.id, 25)}
                        >
                          <Shuffle size={13} />
                          <span>Assign 25 Package</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      {queue.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          This client has no assigned tasks queued. Tasks will default to standard catalogue products for their tier.
                        </div>
                      ) : (
                        <div className="admin-data-table-scroll">
                          <table className="admin-clean-table">
                            <thead>
                              <tr>
                                <th className="text-center w-12">#</th>
                                <th>Product & Campaign</th>
                                <th>Platform</th>
                                <th className="text-right">Price</th>
                                <th>Commission Rate</th>
                                <th className="text-right">Profit</th>
                                <th>Deposit Barrier</th>
                                <th>Type</th>
                                <th style={{ minWidth: '180px' }} className="text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queue.map((at, idx) => {
                                const price = Number(at.price || 0);
                                const comm = Number(at.commissionRate ?? at.commission_rate ?? 4);
                                const profit = (price * comm) / 100;
                                const barrier = Number(at.requiredDeposit ?? at.required_deposit ?? 0);

                                return (
                                  <tr key={at.id || idx}>
                                    <td className="text-center font-bold text-slate-400">
                                      #{idx + 1}
                                    </td>
                                    <td>
                                      <div className="admin-task-product-cell">
                                        <div className="admin-task-thumb-wrap">
                                          <img
                                            src={at.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80'}
                                            alt=""
                                            className="admin-task-thumb"
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                                            }}
                                          />
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <div className="admin-task-meta-title" title={at.title}>
                                            {at.title}
                                          </div>
                                          <div className="text-[11px] text-slate-400">
                                            ID: {at.id}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="admin-code-pill font-medium">{at.platform || 'eBay'}</span>
                                    </td>
                                    <td className="text-right font-mono font-semibold text-slate-800">
                                      ${price.toFixed(2)}
                                    </td>
                                    <td>
                                      <span className="font-semibold text-emerald-600">+{comm}%</span>
                                    </td>
                                    <td className="text-right font-mono font-semibold text-emerald-600">
                                      +${profit.toFixed(2)}
                                    </td>
                                    <td>
                                      {barrier > 0 ? (
                                        <span className="admin-code-pill amber font-bold">${barrier.toFixed(2)}</span>
                                      ) : (
                                        <span className="text-slate-400 text-xs">None ($0)</span>
                                      )}
                                    </td>
                                    <td>
                                      {at.isLearning ? (
                                        <span className="badge-tech text-[10px]">Step {at.learningStep || (idx + 1)}</span>
                                      ) : (
                                        <span className="text-xs text-slate-400">Standard</span>
                                      )}
                                    </td>
                                    <td className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                          title="Move Up"
                                          disabled={idx === 0}
                                          onClick={() => adminReorderUserAssignedTasks && adminReorderUserAssignedTasks(targetUser.id, idx, idx - 1)}
                                        >
                                          <ChevronUp size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                          title="Move Down"
                                          disabled={idx === queue.length - 1}
                                          onClick={() => adminReorderUserAssignedTasks && adminReorderUserAssignedTasks(targetUser.id, idx, idx + 1)}
                                        >
                                          <ChevronDown size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-table-action-secondary text-xs py-1 px-2 flex items-center gap-1"
                                          onClick={() => setEditingAssignedTask({ userId: targetUser.id, task: { ...at }, index: idx })}
                                          title="Edit this Assigned Task"
                                        >
                                          <Edit2 size={12} />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-table-action-danger text-xs py-1 px-2"
                                          title="Remove Task"
                                          onClick={() => {
                                            if (confirm(`Remove "${at.title}" from this user's queue?`)) {
                                              adminRemoveUserAssignedTask && adminRemoveUserAssignedTask(targetUser.id, at.id);
                                            }
                                          }}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              (() => {
                const currentSlots = activePoolSlots;
                const totalCampaignOrderValue = currentSlots.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
                const totalCampaignMemberProfit = currentSlots.reduce((sum, s) => {
                  const p = parseFloat(s.price) || 0;
                  const c = parseFloat(s.commissionRate ?? s.commission_rate ?? s.commission ?? 4) || 4;
                  return sum + ((p * c) / 100);
                }, 0);
                const restrictedSlotsCount = currentSlots.filter(s => (parseFloat(s.requiredDeposit ?? s.required_deposit ?? 0) || 0) > 0).length;
                const freeSlotsCount = 25 - restrictedSlotsCount;

                const filteredSlots = currentSlots.filter(s => {
                  if (taskFilter === 'starter') return s.slotNumber <= 10;
                  if (taskFilter === 'growth') return s.slotNumber > 10 && s.slotNumber <= 20;
                  if (taskFilter === 'highyield') return s.slotNumber > 20;
                  if (taskFilter === 'restricted') return (parseFloat(s.requiredDeposit ?? s.required_deposit ?? 0) || 0) > 0;
                  if (taskFilter === 'free') return (parseFloat(s.requiredDeposit ?? s.required_deposit ?? 0) || 0) <= 0;
                  if (taskFilter !== 'all') {
                    if ((s.platform || '').toLowerCase() !== taskFilter.toLowerCase()) return false;
                  }
                  if (taskSearch) {
                    const q = taskSearch.toLowerCase().trim();
                    const slotNumStr = String(s.slotNumber);
                    const matchSlot = slotNumStr === q || `slot #${slotNumStr}`.includes(q) || `slot ${slotNumStr}`.includes(q) || `step ${slotNumStr}`.includes(q);
                    const matchText = (s.title || '').toLowerCase().includes(q) ||
                                      (s.category || '').toLowerCase().includes(q) ||
                                      (s.platform || '').toLowerCase().includes(q);
                    if (!matchSlot && !matchText) return false;
                  }
                  return true;
                });

                return (
                  <>
                    {/* 4 CLEAN CAMPAIGN STAT CARDS */}
                    <div className="four-stats-grid mb-6">
                      <div className="stat-card sapphire-card">
                        <div className="stat-card-icon">
                          <Layers size={18} />
                        </div>
                        <div className="stat-card-body">
                          <div className="stat-num">25 <span className="stat-unit">Slots</span></div>
                          <span className="stat-label">
                            {activePoolTargetUser ? `${activePoolTargetUser.name}'s Sequence` : 'Full Campaign Sequence'}
                          </span>
                        </div>
                      </div>

                      <div className="stat-card green-card">
                        <div className="stat-card-icon">
                          <DollarSign size={18} />
                        </div>
                        <div className="stat-card-body">
                          <div className="stat-num">{formatUSDT(totalCampaignMemberProfit, true)}</div>
                          <span className="stat-label">
                            {activePoolTargetUser ? `${activePoolTargetUser.name}'s 25-Slot Profit` : 'Total 25-Slot User Profit'}
                          </span>
                        </div>
                      </div>

                      <div className="stat-card orange-card">
                        <div className="stat-card-icon">
                          <Award size={18} />
                        </div>
                        <div className="stat-card-body">
                          <div className="stat-num">{formatUSDT(totalCampaignOrderValue)}</div>
                          <span className="stat-label">
                            {activePoolTargetUser ? `${activePoolTargetUser.name}'s Total Orders` : 'Total Campaign Order Value'}
                          </span>
                        </div>
                      </div>

                      <div className="stat-card blue-card">
                        <div className="stat-card-icon">
                          <Lock size={18} />
                        </div>
                        <div className="stat-card-body">
                          <div className="stat-num">{restrictedSlotsCount} <span className="stat-unit">Gated</span></div>
                          <span className="stat-label">Deposit Barriers ({freeSlotsCount} Free)</span>
                        </div>
                      </div>
                    </div>

                    {/* FOCUSED 25-SLOT TOOLBAR */}
                    <div className="admin-table-toolbar">
                      <div className="admin-table-tabs">
                        {[
                          { id: 'all', label: `All 25 Slots (25)` },
                          { id: 'starter', label: 'Starter (Slots 1-10)' },
                          { id: 'growth', label: 'Growth (Slots 11-20)' },
                          { id: 'highyield', label: 'High Yield (Slots 21-25)' },
                          { id: 'restricted', label: `Deposit Required (${restrictedSlotsCount})` },
                          { id: 'free', label: `Free Unlocked (${freeSlotsCount})` }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            className={`admin-table-tab ${taskFilter.toLowerCase() === tab.id.toLowerCase() ? 'active' : ''}`}
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
                          placeholder="Search slot #, product, or platform..."
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          className="admin-table-search-input"
                        />
                        <span className="admin-table-count-text">
                          {filteredSlots.length} of 25 slots {activePoolTargetUser ? `(${activePoolTargetUser.name})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* PROPERLY ALIGNED 25 SLOTS TABLE */}
                    <div className="admin-clean-card">
                      <div className="admin-data-table-scroll">
                        <table className="admin-clean-table">
                          <thead>
                            <tr>
                              <th className="text-center" style={{ width: '85px' }}>Slot</th>
                              <th>Product & Campaign</th>
                              <th className="text-center" style={{ width: '110px' }}>Platform</th>
                              <th className="text-right" style={{ width: '130px' }}>Order Amount</th>
                              <th className="text-center" style={{ width: '95px' }}>Commission</th>
                              <th className="text-right" style={{ width: '130px' }}>Member Profit</th>
                              <th className="text-center" style={{ width: '150px' }}>Deposit Barrier</th>
                              <th className="text-center" style={{ width: '90px' }}>Status</th>
                              <th className="text-center" style={{ width: '200px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSlots.length === 0 ? (
                              <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                                  No slots found matching the search filter criteria.
                                </td>
                              </tr>
                            ) : (
                              filteredSlots.map(slot => {
                                const priceNum = parseFloat(slot.price) || 0;
                                const commRate = parseFloat(
                                  slot.commissionRate ??
                                  slot.commission_rate ??
                                  slot.commission ??
                                  4
                                ) || 4;
                                const estProfit = (priceNum * commRate) / 100;
                                const platformLower = (slot.platform || 'ebay').toLowerCase();
                                const reqDep = parseFloat(slot.requiredDeposit ?? slot.required_deposit ?? 0) || 0;

                                return (
                                  <tr key={slot.id || slot.slotNumber} className={slot.active === false ? 'opacity-60 bg-slate-50/50' : ''}>
                                    {/* Slot # */}
                                    <td className="text-center">
                                      <div className="slot-number-badge">
                                        <span className="slot-badge-hash">Slot</span>
                                        <span className="slot-badge-num">#{String(slot.slotNumber).padStart(2, '0')}</span>
                                      </div>
                                    </td>

                                    {/* Product & Campaign */}
                                    <td>
                                      <div className="admin-task-product-cell">
                                        <div className="admin-task-thumb-wrap">
                                          <img
                                            src={slot.image || getProductImage(slot)}
                                            alt=""
                                            className="admin-task-thumb"
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                                            }}
                                          />
                                          <span className="task-thumb-step-badge">#{slot.slotNumber}</span>
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <div className="admin-task-meta-title" title={slot.title}>
                                            {slot.title}
                                          </div>
                                          <div className="admin-task-meta-sub flex items-center gap-2 flex-wrap">
                                            <span className="admin-task-meta-category">{slot.category || 'Campaign'}</span>
                                            <span className="text-[11px] text-slate-400 font-mono">ID: {slot.id}</span>
                                            {slot.adminCustomized && (
                                              <span className="admin-code-pill indigo text-[10px] py-0.5 px-1.5 font-bold">
                                                Custom for User
                                              </span>
                                            )}
                                            {slot.orders ? (
                                              <span className="text-[11px] text-slate-400">
                                                • {Number(slot.orders).toLocaleString()} orders
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Platform */}
                                    <td className="text-center">
                                      <span className={`admin-badge platform-${platformLower}`}>
                                        {slot.platform || 'eBay'}
                                      </span>
                                    </td>

                                    {/* Order Amount (Click to Edit) */}
                                    <td
                                      className="text-right cell-amount font-mono cursor-pointer hover:bg-indigo-50/70 transition-colors"
                                      onClick={() => handleOpenEditModal(slot)}
                                      title={activePoolTargetUser ? `Click to edit price for ${activePoolTargetUser.name}'s slot #${slot.slotNumber}` : `Click to edit price for slot #${slot.slotNumber}`}
                                    >
                                      <div className="inline-flex items-center justify-end gap-1.5 group">
                                        <span className="font-bold text-slate-800">{formatUSDT(priceNum)}</span>
                                        <Edit2 size={12} className="text-indigo-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </td>

                                    {/* Commission */}
                                    <td className="text-center">
                                      <span className="admin-badge neutral font-semibold">
                                        +{commRate}%
                                      </span>
                                    </td>

                                    {/* Member Profit */}
                                    <td className="text-right cell-amount positive font-mono">
                                      {formatUSDT(estProfit, true)}
                                    </td>

                                    {/* Deposit Barrier */}
                                    <td className="text-center">
                                      {reqDep > 0 ? (
                                        <span className="admin-badge pending font-semibold" title={`Requires ${formatUSDT(reqDep)} account balance`}>
                                          <Lock size={11} />
                                          <span>Min: {formatUSDT(reqDep)}</span>
                                        </span>
                                      ) : (
                                        <span className="admin-badge neutral">
                                          0.00 USDT (Free)
                                        </span>
                                      )}
                                    </td>

                                    {/* Status */}
                                    <td className="text-center">
                                      <span className={`admin-badge ${slot.active !== false ? 'success' : 'neutral'}`}>
                                        {slot.active !== false ? 'Active' : 'Disabled'}
                                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="text-center">
                                      <div className="admin-task-actions-row justify-center">
                                        <button
                                          type="button"
                                          className={`btn-slot-edit ${activePoolTargetUser ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                                          title={activePoolTargetUser ? `Edit Slot #${slot.slotNumber} specifically for ${activePoolTargetUser.name}` : `Edit Slot #${slot.slotNumber} Details, Price, Commission, Deposit Barrier`}
                                          onClick={() => handleOpenEditModal(slot)}
                                        >
                                          <Edit2 size={13} />
                                          <span>{activePoolTargetUser ? `Edit for ${activePoolTargetUser.name.split(' ')[0]}` : 'Edit Slot'}</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-task-action-icon"
                                          title="Preview Slot in Execution Engine"
                                          onClick={() => openTaskPreview(slot)}
                                        >
                                          <Eye size={13} />
                                        </button>
                                        {slot.productUrl && (
                                          <button
                                            type="button"
                                            className="btn-task-action-icon"
                                            title={`Open live product listing on ${slot.platform || 'Store'}`}
                                            onClick={(e) => openProductUrl(slot, e)}
                                          >
                                            <ExternalLink size={13} />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className={`btn-task-action-icon ${slot.active !== false ? 'icon-pause' : 'icon-play'}`}
                                          title={slot.active !== false ? 'Pause Slot' : 'Activate Slot'}
                                          onClick={() => handleToggleTaskActive(slot)}
                                        >
                                          {slot.active !== false ? <Pause size={13} /> : <Play size={13} />}
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
              })()
            )}
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
            <div className="admin-page-header flex items-center justify-between flex-wrap gap-4">
              <div className="admin-page-title-wrap">
                <h1 className="admin-page-title">VIP Tier Rules & Progressive Yield Settings</h1>
                <p className="admin-page-subtitle">
                  Configure qualification deposit ranges (Min & Max Balance), progressive locking rules, daily task allocation quotas, and commission rates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-admin-primary flex items-center gap-1.5"
                  onClick={() => setShowAddTierModal(true)}
                >
                  <Plus size={15} />
                  <span>+ Add New VIP Tier</span>
                </button>
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
                    <div className="admin-tier-header flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="admin-tier-icon">
                          {(tier.platform || tier.name || 'E').charAt(0)}
                        </div>
                        <div>
                          <h3 className="admin-tier-name">{tier.name} VIP Tier</h3>
                          <span className="text-xs text-slate-400">ID: {tier.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btn-table-action-secondary flex items-center gap-1 text-xs py-1 px-2"
                          onClick={() => setEditingTier({
                            ...tier,
                            minBalance: tierMinBal,
                            maxBalance: tierMaxBal,
                            commissionRate: tierCommRate,
                            dailyTasks: tierDailyTasks,
                            features: tierFeatures.join('\n')
                          })}
                          title="Edit Tier Settings"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        {tier.id !== 'tier_ebay' && (
                          <button
                            type="button"
                            className="btn-table-action-danger text-xs py-1 px-2"
                            onClick={() => handleDeleteTier(tier)}
                            title="Delete VIP Tier"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
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

        {/* 0. CONFIGURE & CUSTOMIZE 25 TASKS BEFORE ASSIGNMENT MODAL */}
        {configureAssignUser && (
          <div className="modal-overlay animate-fade-in" onClick={() => setConfigureAssignUser(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box" style={{ maxWidth: '1120px', width: '96vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="modal-header">
                  <div className="header-with-icon">
                    <div className="icon-pill-blue" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <Sliders size={20} />
                    </div>
                    <div>
                      <h3 className="modal-title font-semibold text-lg text-slate-900">
                        Configure 25 Tasks Before Assigning
                      </h3>
                      <span className="text-xs text-slate-500">
                        Edit prices, commissions, and deposit barriers for each slot before assigning them to this client.
                      </span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setConfigureAssignUser(null)}>✕</button>
                </div>

                {/* Modal Body */}
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                  {/* Client Selector & Overview Card */}
                  <div className="admin-clean-card p-3.5 mb-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[280px]">
                        <label className="admin-form-label text-xs font-bold text-slate-700 mb-1 block">
                          Target Client for Task Assignment:
                        </label>
                        <select
                          className="admin-form-select text-xs font-semibold w-full bg-white border border-slate-300 rounded-lg p-2"
                          value={configureAssignUser?.id || ''}
                          onChange={(e) => handleSwitchConfigureUser(e.target.value)}
                        >
                          {adminUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              👤 {u.name} ({maskEmail(u.email)}) • Balance: ${Number(u.balance || 0).toFixed(2)} USDT • Tier: {u.vipLevel || 'eBay'} {u.taskPackageRequested ? '⚠️ [PENDING REQUEST]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Available Balance</span>
                          <strong className="text-sm font-bold text-slate-800">${Number(configureAssignUser?.balance || 0).toFixed(2)} USDT</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Current Status</span>
                          {configureAssignUser?.taskPackageRequested ? (
                            <span className="admin-badge warning text-[11px] py-0.5 px-2">⚠️ Request Pending</span>
                          ) : Number(configureAssignUser?.pendingTasks || configureAssignUser?.pending_tasks || 0) > 0 ? (
                            <span className="admin-badge success text-[11px] py-0.5 px-2">Active ({configureAssignUser.completedTasks || 0}/25)</span>
                          ) : (
                            <span className="admin-badge neutral text-[11px] py-0.5 px-2">🟡 Draft (Not Live Yet)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preset Toolbar & Search */}
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-600 mr-1">Quick Presets:</span>
                      <button
                        type="button"
                        className="btn-admin-secondary text-xs py-1 px-2.5 rounded-lg flex items-center gap-1"
                        onClick={handleResetToStandardCatalogue}
                        title="Reset all 25 slots back to standard catalogue defaults"
                      >
                        <RefreshCw size={12} />
                        <span>Standard 25 Defaults</span>
                      </button>
                      <button
                        type="button"
                        className="btn-admin-secondary text-xs py-1 px-2.5 rounded-lg flex items-center gap-1"
                        onClick={handleApplyPresetBarriers}
                        title="Set balance deposit barriers on milestone slots (Slot 10: $50, Slot 15: $100, Slot 20: $150, Slot 25: $300)"
                      >
                        <Lock size={12} className="text-amber-500" />
                        <span>Progressive Barriers ($50, $100, $150, $300)</span>
                      </button>
                      <button
                        type="button"
                        className="btn-admin-secondary text-xs py-1 px-2.5 rounded-lg text-slate-500"
                        onClick={handleClearAllBarriers}
                        title="Set all deposit barriers to 0.00"
                      >
                        <span>Clear All Barriers</span>
                      </button>
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search slot or product..."
                        value={configureSearch}
                        onChange={(e) => setConfigureSearch(e.target.value)}
                        className="admin-form-input text-xs pl-8 py-1.5 rounded-lg w-full"
                      />
                    </div>
                  </div>

                  {/* 25 Slots Table */}
                  <div className="admin-clean-card" style={{ border: '1px solid #e2e8f0', overflow: 'hidden', borderRadius: '12px' }}>
                    <div style={{ maxHeight: '48vh', overflowY: 'auto' }}>
                      <table className="admin-clean-table text-xs">
                        <thead>
                          <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                            <th className="text-center" style={{ width: '75px' }}>Slot</th>
                            <th>Product & Campaign</th>
                            <th className="text-center" style={{ width: '100px' }}>Platform</th>
                            <th className="text-right" style={{ width: '140px' }}>Price (USDT)</th>
                            <th className="text-center" style={{ width: '110px' }}>Commission</th>
                            <th className="text-right" style={{ width: '120px' }}>Member Profit</th>
                            <th className="text-center" style={{ width: '160px' }}>Deposit Barrier</th>
                            <th className="text-center" style={{ width: '90px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configureAssignSlots
                            .filter(s => {
                              if (!configureSearch) return true;
                              const q = configureSearch.toLowerCase().trim();
                              return String(s.slotNumber) === q ||
                                     `slot #${s.slotNumber}`.includes(q) ||
                                     (s.title || '').toLowerCase().includes(q) ||
                                     (s.platform || '').toLowerCase().includes(q);
                            })
                            .map((slot, idx) => {
                              const actualIdx = (slot.slotNumber || (idx + 1)) - 1;
                              const priceNum = parseFloat(slot.price) || 0;
                              const commRate = parseFloat(slot.commissionRate ?? slot.commission_rate ?? 4) || 4;
                              const estProfit = (priceNum * commRate) / 100;
                              const reqDep = parseFloat(slot.requiredDeposit ?? slot.required_deposit ?? 0) || 0;

                              return (
                                <tr key={slot.id || idx}>
                                  <td className="text-center">
                                    <span className="slot-badge-num font-bold text-slate-800" style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                                      #{String(slot.slotNumber || idx + 1).padStart(2, '0')}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={slot.image || getProductImage(slot)}
                                        alt=""
                                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                                        }}
                                      />
                                      <span className="font-semibold text-slate-800 line-clamp-1 max-w-[260px]" title={slot.title}>
                                        {slot.title}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <span className="admin-badge neutral text-[10px] uppercase font-bold">
                                      {slot.platform || 'eBay'}
                                    </span>
                                  </td>
                                  <td className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="admin-form-input text-xs font-bold text-right py-1 px-2 w-[90px] border border-indigo-200 focus:border-indigo-500 rounded-md"
                                        value={slot.price}
                                        onChange={(e) => handleUpdateSlotPrice(actualIdx, e.target.value)}
                                      />
                                      <span className="text-[11px] text-slate-400 font-semibold">$</span>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        className="admin-form-input text-xs font-bold text-center py-1 px-1.5 w-[60px] border border-slate-200 focus:border-indigo-500 rounded-md"
                                        value={slot.commissionRate ?? slot.commission_rate ?? 4}
                                        onChange={(e) => handleUpdateSlotCommission(actualIdx, e.target.value)}
                                      />
                                      <span className="text-[11px] text-slate-400 font-semibold">%</span>
                                    </div>
                                  </td>
                                  <td className="text-right font-mono font-bold text-emerald-600">
                                    +{formatUSDT(estProfit, true)}
                                  </td>
                                  <td className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {reqDep > 0 && <Lock size={12} className="text-amber-500 flex-shrink-0" />}
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="0.00"
                                        className={`admin-form-input text-xs font-bold py-1 px-2 w-[85px] rounded-md ${
                                          reqDep > 0 ? 'border-amber-300 bg-amber-50/50 text-amber-900' : 'border-slate-200'
                                        }`}
                                        value={slot.requiredDeposit !== undefined ? slot.requiredDeposit : 0}
                                        onChange={(e) => handleUpdateSlotDeposit(actualIdx, e.target.value)}
                                      />
                                      <span className="text-[10px] text-slate-400">USDT</span>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn-admin-secondary text-[11px] py-1 px-2 rounded-md hover:text-indigo-600 flex items-center gap-1 mx-auto"
                                      title="Edit product name, link, or image"
                                      onClick={() => {
                                        handleOpenEditModal({ ...slot, targetUserId: configureAssignUser.id });
                                      }}
                                    >
                                      <Edit2 size={11} />
                                      <span>Edit</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                {(() => {
                  const totalOrderVal = configureAssignSlots.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
                  const totalProfitVal = configureAssignSlots.reduce((sum, s) => {
                    const p = parseFloat(s.price) || 0;
                    const c = parseFloat(s.commissionRate ?? s.commission_rate ?? 4) || 4;
                    return sum + ((p * c) / 100);
                  }, 0);
                  const barrierCount = configureAssignSlots.filter(s => (parseFloat(s.requiredDeposit ?? s.required_deposit ?? 0) || 0) > 0).length;

                  return (
                    <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Total Campaign Value</span>
                          <strong className="text-slate-900 font-bold font-mono">{formatUSDT(totalOrderVal)}</strong>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Est. Member Yield</span>
                          <strong className="text-emerald-600 font-bold font-mono">+{formatUSDT(totalProfitVal)}</strong>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Restricted Slots</span>
                          <strong className="text-amber-600 font-bold">{barrierCount} / 25 Slots</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-admin-secondary text-xs py-2 px-4 rounded-xl"
                          onClick={() => setConfigureAssignUser(null)}
                          disabled={isAssigningPackage}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-admin-primary text-xs py-2 px-5 rounded-xl font-bold flex items-center gap-2"
                          style={{ background: '#059669', borderColor: '#059669' }}
                          onClick={handleConfirmConfigureAssignment}
                          disabled={isAssigningPackage || !configureAssignUser}
                        >
                          {isAssigningPackage ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Assigning Package to Database...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Confirm & Assign 25 Tasks to {configureAssignUser?.name || 'Client'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

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
                        <option value="Shopify">Shopify</option>
                        <option value="Shopee">Shopee</option>
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
                      <h3 className="modal-title font-semibold text-base text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>Edit Campaign Slot #{editingTask.slotNumber || editingTask.learningStep || 1} of 25</span>
                        {editingTask.targetUserId && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
                            👤 For {adminUsers.find(u => String(u.id) === String(editingTask.targetUserId))?.name || 'Client'} Only
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-slate-500">
                        Sequential Step #{editingTask.slotNumber || editingTask.learningStep || 1} • Ref ID: {editingTask.id}
                      </span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setEditingTask(null)}>✕</button>
                </div>

                <div className="admin-form-group mb-4" style={{ background: editingTask.targetUserId ? '#f0fdf4' : '#f8fafc', padding: '14px', borderRadius: '12px', border: editingTask.targetUserId ? '1px solid #86efac' : '1px solid #e2e8f0', marginTop: '14px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="admin-form-label mb-0 font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Users size={15} className={editingTask.targetUserId ? "text-emerald-600" : "text-indigo-600"} />
                      <span>Target Scope: Apply Changes To</span>
                    </label>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${editingTask.targetUserId ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {editingTask.targetUserId ? '👤 User-Specific Override' : '🌐 Global Base Catalogue'}
                    </span>
                  </div>
                  <select
                    value={editingTask.targetUserId || 'all'}
                    onChange={(e) => setEditingTask({
                      ...editingTask,
                      targetUserId: e.target.value === 'all' ? null : e.target.value
                    })}
                    className="admin-form-select text-xs font-semibold bg-white border border-slate-300 rounded-lg py-2 px-3 w-full"
                  >
                    <option value="all">🌐 Global Default Template (Base catalogue for new users)</option>
                    <optgroup label="Customize specifically for one user (will NOT affect other users):">
                      {adminUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          👤 {u.name} ({u.email || 'No email'}) • ${Number(u.balance || 0).toFixed(2)} USDT
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[11px] mt-2 mb-0">
                    {editingTask.targetUserId ? (
                      <span className="text-emerald-700 font-medium">
                        🎯 <strong>Isolated to {adminUsers.find(u => String(u.id) === String(editingTask.targetUserId))?.name || 'selected user'}:</strong> Changes to price, commission, or deposit barrier will <strong>ONLY</strong> be applied to this user. No other users will be affected.
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        🌐 <strong>Global Template:</strong> Updates default catalogue item. It will <strong>NOT</strong> overwrite any client's custom queue.
                      </span>
                    )}
                  </p>
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
                      <span>
                        {editingTask.targetUserId
                          ? `Save Changes for ${adminUsers.find(u => String(u.id) === String(editingTask.targetUserId))?.name || 'Client'}`
                          : `Save Changes to Slot #${editingTask.slotNumber || editingTask.learningStep || 1}`}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: EDIT VIP TIER (eBay, Walmart, Amazon, etc.)
        ======================================================== */}
        {editingTier && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 100000 }} onClick={() => setEditingTier(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box" style={{ maxWidth: '540px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
                <div className="modal-header">
                  <div className="modal-title-with-icon">
                    <div className="modal-icon-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                      <Edit2 size={18} />
                    </div>
                    <div>
                      <h3>Edit VIP Tier: {editingTier.name}</h3>
                      <span className="text-xs text-slate-400">Configure balance requirements, yield rate and limits</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setEditingTier(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  <form onSubmit={handleSaveTier}>
                    <div className="grid-two-col">
                      <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Tier Name</label>
                      <input
                        type="text"
                        value={editingTier.name || ''}
                        onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Platform Identifier</label>
                      <input
                        type="text"
                        value={editingTier.platform || editingTier.name || ''}
                        onChange={(e) => setEditingTier({ ...editingTier, platform: e.target.value })}
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Min Balance to Qualify (USDT)</label>
                      <input
                        type="number"
                        step="1"
                        value={editingTier.minBalance ?? 0}
                        onChange={(e) => setEditingTier({ ...editingTier, minBalance: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Max Balance to Qualify (USDT)</label>
                      <input
                        type="number"
                        step="1"
                        value={editingTier.maxBalance ?? 99999}
                        onChange={(e) => setEditingTier({ ...editingTier, maxBalance: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        placeholder="e.g. 499 (or 99999 for unlimited)"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingTier.commissionRate ?? 4}
                        onChange={(e) => setEditingTier({ ...editingTier, commissionRate: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Daily Task Allocation Quota</label>
                      <input
                        type="number"
                        step="1"
                        value={editingTier.dailyTasks ?? 25}
                        onChange={(e) => setEditingTier({ ...editingTier, dailyTasks: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Marketing / Card Description</label>
                    <textarea
                      rows={2}
                      value={editingTier.description || ''}
                      onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                      className="admin-form-input text-xs"
                      placeholder="e.g. Review product listings and earn progressive commissions."
                    />
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Features Checklist (1 per line)</label>
                    <textarea
                      rows={3}
                      value={editingTier.features || ''}
                      onChange={(e) => setEditingTier({ ...editingTier, features: e.target.value })}
                      className="admin-form-input text-xs"
                      placeholder="Daily Task Limit: 25&#10;Instant Task Credit&#10;Multi-Sig Protection"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => setEditingTier(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-admin-primary"
                      style={{ flex: 2, justifyContent: 'center', padding: '10px' }}
                    >
                      <Save size={15} />
                      <span>Save Tier Configuration</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ========================================================
            MODAL: ADD NEW VIP TIER
        ======================================================== */}
        {showAddTierModal && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 100000 }} onClick={() => setShowAddTierModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box" style={{ maxWidth: '540px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
                <div className="modal-header">
                  <div className="modal-title-with-icon">
                    <div className="modal-icon-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3>Create New VIP Tier</h3>
                      <span className="text-xs text-slate-400">Add a new earning platform & progressive lock range</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowAddTierModal(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                <form onSubmit={handleCreateTier}>
                  <div className="grid-two-col">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Tier Name</label>
                      <input
                        type="text"
                        value={newTierData.name}
                        onChange={(e) => setNewTierData({ ...newTierData, name: e.target.value })}
                        className="admin-form-input text-xs"
                        placeholder="e.g. Amazon, AliExpress, VIP4"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Platform Identifier</label>
                      <input
                        type="text"
                        value={newTierData.platform}
                        onChange={(e) => setNewTierData({ ...newTierData, platform: e.target.value })}
                        className="admin-form-input text-xs"
                        placeholder="e.g. Amazon"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Min Balance to Qualify (USDT)</label>
                      <input
                        type="number"
                        step="1"
                        value={newTierData.minBalance}
                        onChange={(e) => setNewTierData({ ...newTierData, minBalance: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Max Balance to Qualify (USDT)</label>
                      <input
                        type="number"
                        step="1"
                        value={newTierData.maxBalance}
                        onChange={(e) => setNewTierData({ ...newTierData, maxBalance: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        placeholder="e.g. 1999 or 99999"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTierData.commissionRate}
                        onChange={(e) => setNewTierData({ ...newTierData, commissionRate: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Daily Task Allocation Quota</label>
                      <input
                        type="number"
                        step="1"
                        value={newTierData.dailyTasks}
                        onChange={(e) => setNewTierData({ ...newTierData, dailyTasks: e.target.value })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Marketing / Card Description</label>
                    <textarea
                      rows={2}
                      value={newTierData.description}
                      onChange={(e) => setNewTierData({ ...newTierData, description: e.target.value })}
                      className="admin-form-input text-xs"
                      placeholder="e.g. Premium retail listing review tasks with high commissions."
                    />
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Features Checklist (1 per line)</label>
                    <textarea
                      rows={3}
                      value={newTierData.features}
                      onChange={(e) => setNewTierData({ ...newTierData, features: e.target.value })}
                      className="admin-form-input text-xs"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => setShowAddTierModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-admin-primary"
                      style={{ flex: 2, justifyContent: 'center', padding: '10px' }}
                    >
                      <Plus size={15} />
                      <span>Create VIP Tier</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ========================================================
            MODAL: EDIT INDIVIDUAL ASSIGNED TASK FOR A USER
        ======================================================== */}
        {editingAssignedTask && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 100000 }} onClick={() => setEditingAssignedTask(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box" style={{ maxWidth: '560px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
                <div className="modal-header">
                  <div className="modal-title-with-icon">
                    <div className="modal-icon-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                      <Edit2 size={18} />
                    </div>
                    <div>
                      <h3>Edit Assigned Task #{editingAssignedTask.index + 1} for {adminUsers.find(u => String(u.id) === String(editingAssignedTask.userId))?.name || 'Client'}</h3>
                      <span className="text-xs text-emerald-600 font-medium">
                        🎯 Isolated Override: Changes apply ONLY to this user's queue ({adminUsers.find(u => String(u.id) === String(editingAssignedTask.userId))?.name || 'Client'})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setEditingAssignedTask(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  <form onSubmit={handleSaveAssignedTask}>
                    <div className="admin-form-group">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Task Title / Product Name</label>
                    <input
                      type="text"
                      value={editingAssignedTask.task.title || ''}
                      onChange={(e) => setEditingAssignedTask({
                        ...editingAssignedTask,
                        task: { ...editingAssignedTask.task, title: e.target.value }
                      })}
                      className="admin-form-input text-xs"
                      required
                    />
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Platform</label>
                      <select
                        value={editingAssignedTask.task.platform || 'eBay'}
                        onChange={(e) => setEditingAssignedTask({
                          ...editingAssignedTask,
                          task: { ...editingAssignedTask.task, platform: e.target.value }
                        })}
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
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Product Price (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingAssignedTask.task.price ?? 50}
                        onChange={(e) => setEditingAssignedTask({
                          ...editingAssignedTask,
                          task: { ...editingAssignedTask.task, price: e.target.value }
                        })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingAssignedTask.task.commissionRate ?? editingAssignedTask.task.commission_rate ?? 4}
                        onChange={(e) => setEditingAssignedTask({
                          ...editingAssignedTask,
                          task: { ...editingAssignedTask.task, commissionRate: e.target.value }
                        })}
                        className="admin-form-input text-xs tabular-nums"
                        required
                      />
                      <span className="text-[10px] text-emerald-600 mt-1 block">
                        Profit: ${(
                          ((parseFloat(editingAssignedTask.task.price) || 0) * (parseFloat(editingAssignedTask.task.commissionRate ?? editingAssignedTask.task.commission_rate) || 0)) / 100
                        ).toFixed(2)} USDT
                      </span>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Required Deposit Barrier (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingAssignedTask.task.requiredDeposit ?? editingAssignedTask.task.required_deposit ?? 0}
                        onChange={(e) => setEditingAssignedTask({
                          ...editingAssignedTask,
                          task: { ...editingAssignedTask.task, requiredDeposit: e.target.value }
                        })}
                        className="admin-form-input text-xs tabular-nums"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        If &gt; 0, user must have deposit/balance &gt;= this amount to submit.
                      </span>
                    </div>
                  </div>

                  <div className="admin-form-group mt-3">
                    <label className="admin-form-label text-xs font-semibold text-slate-700">Product Image URL</label>
                    <input
                      type="url"
                      value={editingAssignedTask.task.image || ''}
                      onChange={(e) => setEditingAssignedTask({
                        ...editingAssignedTask,
                        task: { ...editingAssignedTask.task, image: e.target.value }
                      })}
                      className="admin-form-input text-xs"
                    />
                    {editingAssignedTask.task.image && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={editingAssignedTask.task.image}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        <span className="text-xs text-slate-500 truncate max-w-xs">{editingAssignedTask.task.image}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid-two-col mt-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Learning Milestone Step</label>
                      <select
                        value={editingAssignedTask.task.isLearning ? 'true' : 'false'}
                        onChange={(e) => setEditingAssignedTask({
                          ...editingAssignedTask,
                          task: { ...editingAssignedTask.task, isLearning: e.target.value === 'true' }
                        })}
                        className="admin-form-select text-xs"
                      >
                        <option value="false">Standard Task</option>
                        <option value="true">Learning Step Milestone</option>
                      </select>
                    </div>

                    {editingAssignedTask.task.isLearning && (
                      <div className="admin-form-group">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Step # (1 to 25)</label>
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={editingAssignedTask.task.learningStep ?? (editingAssignedTask.index + 1)}
                          onChange={(e) => setEditingAssignedTask({
                            ...editingAssignedTask,
                            task: { ...editingAssignedTask.task, learningStep: e.target.value }
                          })}
                          className="admin-form-input text-xs tabular-nums"
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => setEditingAssignedTask(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-admin-primary"
                      style={{ flex: 2, justifyContent: 'center', padding: '10px' }}
                    >
                      <Save size={15} />
                      <span>Save Assigned Task Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ========================================================
            MODAL: ADD TASK TO CLIENT QUEUE
        ======================================================== */}
        {showAddAssignedModalForUser && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 100000 }} onClick={() => setShowAddAssignedModalForUser(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-box" style={{ maxWidth: '560px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
                <div className="modal-header">
                  <div className="modal-title-with-icon">
                    <div className="modal-icon-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3>Add Task to Client Queue</h3>
                      <span className="text-xs text-slate-400">Append a task from the catalogue or create custom</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowAddAssignedModalForUser(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Source Selection: Catalog or Custom */}
                <div className="flex items-center gap-3 mb-4 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${addAssignedSource === 'catalog' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                    onClick={() => setAddAssignedSource('catalog')}
                  >
                    Select From Catalogue
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${addAssignedSource === 'custom' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                    onClick={() => setAddAssignedSource('custom')}
                  >
                    Create Custom Task
                  </button>
                </div>

                <form onSubmit={handleAddAssignedTask}>
                  {addAssignedSource === 'catalog' ? (
                    <div className="admin-form-group">
                      <label className="admin-form-label text-xs font-semibold text-slate-700">Choose Catalogue Product</label>
                      <select
                        value={selectedCatalogTaskId || (tasks[0]?.id || '')}
                        onChange={(e) => setSelectedCatalogTaskId(e.target.value)}
                        className="admin-form-select text-xs"
                      >
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>
                            [{t.platform}] {t.title} (${Number(t.price || 0).toFixed(2)} • {t.commissionRate || 4}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="admin-form-group">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Task Title / Product</label>
                        <input
                          type="text"
                          value={customAssignedTaskData.title}
                          onChange={(e) => setCustomAssignedTaskData({ ...customAssignedTaskData, title: e.target.value })}
                          className="admin-form-input text-xs"
                          placeholder="e.g. Apple Watch Ultra 2 Titanium"
                          required
                        />
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="admin-form-group">
                          <label className="admin-form-label text-xs font-semibold text-slate-700">Platform</label>
                          <select
                            value={customAssignedTaskData.platform}
                            onChange={(e) => setCustomAssignedTaskData({ ...customAssignedTaskData, platform: e.target.value })}
                            className="admin-form-select text-xs"
                          >
                            <option value="eBay">eBay</option>
                            <option value="Walmart">Walmart</option>
                            <option value="Temu">Temu</option>
                            <option value="Amazon">Amazon</option>
                            <option value="AliExpress">AliExpress</option>
                            <option value="Target">Target</option>
                          </select>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label text-xs font-semibold text-slate-700">Price (USDT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={customAssignedTaskData.price}
                            onChange={(e) => setCustomAssignedTaskData({ ...customAssignedTaskData, price: e.target.value })}
                            className="admin-form-input text-xs tabular-nums"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid-two-col mt-3">
                        <div className="admin-form-group">
                          <label className="admin-form-label text-xs font-semibold text-slate-700">Commission Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={customAssignedTaskData.commissionRate}
                            onChange={(e) => setCustomAssignedTaskData({ ...customAssignedTaskData, commissionRate: e.target.value })}
                            className="admin-form-input text-xs tabular-nums"
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label text-xs font-semibold text-slate-700">Required Deposit Barrier (USDT)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={customAssignedTaskData.requiredDeposit}
                            onChange={(e) => setCustomAssignedTaskData({ ...customAssignedTaskData, requiredDeposit: e.target.value })}
                            className="admin-form-input text-xs tabular-nums"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="admin-form-group mt-3">
                        <label className="admin-form-label text-xs font-semibold text-slate-700">Image URL</label>
                        <input
                          type="url"
                          value={customAssignedTaskData.image}
                          onChange={(e) => setCustomAssignedTaskData({ ...customAssignedTaskData, image: e.target.value })}
                          className="admin-form-input text-xs"
                        />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => setShowAddAssignedModalForUser(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-admin-primary"
                      style={{ flex: 2, justifyContent: 'center', padding: '10px' }}
                    >
                      <Plus size={15} />
                      <span>Add to User Queue</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
