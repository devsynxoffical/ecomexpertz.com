import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  Gift,
  Calendar,
  ChevronRight,
  Zap,
  Lock,
  Download,
  Search,
  Copy,
  Check,
  Headphones,
  Mail,
  MessageCircle,
  Shield,
  ExternalLink,
  Settings,
  User,
  LogOut,
  ChevronDown,
  BarChart3,
  HelpCircle,
  FileText,
  AlertCircle,
  Award,
  Sparkles,
  RefreshCw,
  Pause,
  Play,
  Send
} from 'lucide-react';
import { openProductUrl, getProductUrl } from '../utils/productUrl';
import { api } from '../services/api';

export default function DashboardView() {
  const { dashboardTab } = useApp();

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-main-content">
        {dashboardTab === 'home' && <TabHome />}
        {dashboardTab === 'menu' && <TabMenu />}
        {dashboardTab === 'records' && <TabRecords />}
        {dashboardTab === 'support' && <TabSupport />}
        {dashboardTab === 'mine' && <TabMine />}
      </div>
    </div>
  );
}

// ==========================================
// 1. TAB: HOME (Matching Screenshot 2)
// ==========================================
function TabHome() {
  const {
    user,
    setModalType,
    tasks,
    setSelectedTask,
    activityStream,
    records,
    setDashboardTab,
    addNotification
  } = useApp();

  const [copiedInvite, setCopiedInvite] = useState(false);

  const ebayTasks = tasks.filter(t => t.platform === 'eBay').slice(0, 6);
  const walmartTasks = tasks.filter(t => t.platform === 'Walmart').slice(0, 6);
  const temuTasks = tasks.filter(t => t.platform === 'Temu').slice(0, 6);

  const pendingRecord = records.find(r => r.status === 'Pending');

  const handleCopyInviteCode = () => {
    const code = user?.referralCode || user?.code || '505282';
    navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    if (addNotification) {
      addNotification('Invitation Code Copied', `Invite Code ${code} copied to clipboard!`);
    }
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div className="container tab-home-container">
      {/* SAPPHIRE HERO BANNER matching Screenshot 2 */}
      <div className="dashboard-hero-banner">
        <div className="hero-banner-top">
          <div className="hero-greeting">
            {/* INVITATION CODE BADGE ON UPPER SIDE OF WELCOME BACK */}
            <div className="hero-invite-bar mb-2.5">
              <div
                className="hero-invite-badge"
                onClick={handleCopyInviteCode}
                title="Click to copy your unique invitation code"
              >
                <div className="invite-tag-label">
                  <Gift size={13} className="text-amber-300" />
                  <span>INVITE CODE:</span>
                </div>
                <span className="invite-code-number">{user?.referralCode || user?.code || '505282'}</span>
                <button
                  type="button"
                  className="invite-code-copy-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyInviteCode();
                  }}
                  title="Copy code"
                >
                  {copiedInvite ? (
                    <>
                      <Check size={11} className="text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <h2>Welcome back,</h2>
            <div className="greeting-name-row">
              <span className="greeting-name">{user?.name || 'User'}</span>
              <span className="greeting-wave">👋</span>
            </div>
          </div>
          <div className="hero-balance-col">
            <span className="hero-bal-label">AVAILABLE BALANCE</span>
            <div className="hero-bal-val">
              <span className="bal-num">{(Number(user?.balance) || 0).toFixed(2)}</span>
              <span className="bal-curr">USDT</span>
            </div>
          </div>
        </div>

        {/* Deposit and Withdraw action buttons matching screenshot */}
        <div className="hero-action-row">
          <button className="btn-hero-deposit" onClick={() => setModalType('deposit')}>
            <Wallet size={16} />
            <span>Deposit</span>
          </button>
          <button className="btn-hero-withdraw" onClick={() => setModalType('withdraw')}>
            <ArrowUpRight size={16} />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* PARTNER PLATFORMS PILL ROW matching Screenshot 2 */}
      <div className="partner-platforms-card mt-4">
        <span className="card-section-title">PARTNER PLATFORMS</span>
        <div className="platforms-pills-row">
          {[
            { name: 'eBay', class: 'ebay-badge', logo: '🔴' },
            { name: 'Walmart', class: 'walmart-badge', logo: '☀️' },
            { name: 'Temu', class: 'temu-badge', logo: '🟠' },
            { name: 'eBay', class: 'ebay-badge', logo: '🔴' },
            { name: 'Walmart', class: 'walmart-badge', logo: '☀️' },
            { name: 'Temu', class: 'temu-badge', logo: '🟠' },
            { name: 'eBay', class: 'ebay-badge', logo: '🔴' },
            { name: 'Walmart', class: 'walmart-badge', logo: '☀️' },
          ].map((item, idx) => (
            <div key={idx} className="partner-pill-item">
              <div className={`platform-logo-circle ${item.class}`}>
                <span>{item.logo}</span>
              </div>
              <span className="partner-name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4 STAT CARDS matching Screenshot 2 */}
      <div className="four-stats-grid mt-4">
        {/* Sapphire Card: Available Balance */}
        <div className="stat-card sapphire-card">
          <div className="stat-card-icon">
            <Wallet size={18} />
          </div>
          <div className="stat-card-body">
            <div className="stat-num">{(Number(user?.balance) || 0).toFixed(2)} <span className="stat-unit">USDT</span></div>
            <span className="stat-label">Available Balance</span>
          </div>
        </div>

        {/* Green Card: Total Earnings */}
        <div className="stat-card green-card">
          <div className="stat-card-icon">
            <TrendingUp size={18} />
          </div>
          <div className="stat-card-body">
            <div className="stat-num">{(Number(user?.totalEarnings) || 0).toFixed(2)} <span className="stat-unit">USD</span></div>
            <span className="stat-label">Total Earnings</span>
          </div>
        </div>

        {/* Blue Card: Requests */}
        <div className="stat-card blue-card">
          <div className="stat-card-icon">
            <Clock size={18} />
          </div>
          <div className="stat-card-body">
            <div className="stat-num">{user?.pendingRequests || 0}</div>
            <span className="stat-label">Requests</span>
          </div>
        </div>

        {/* Orange Card: Team Members */}
        <div className="stat-card orange-card">
          <div className="stat-card-icon">
            <Users size={18} />
          </div>
          <div className="stat-card-body">
            <div className="stat-num">{user?.teamMembersCount || 0}</div>
            <span className="stat-label">Team Members</span>
          </div>
        </div>
      </div>

      {/* ACTIVITY COUNTERS ROW matching Screenshot 2 */}
      <div className="activity-counters-row mt-4">
        <div className="counter-item">
          <div className="counter-icon-wrap amber">
            <Clock size={15} />
          </div>
          <div className="counter-info">
            <strong className="counter-val">{user?.pendingTasks || 0}</strong>
            <span className="counter-name">Pending</span>
          </div>
        </div>

        <div className="counter-item">
          <div className="counter-icon-wrap green">
            <CheckCircle2 size={15} />
          </div>
          <div className="counter-info">
            <strong className="counter-val">{user?.completedTasks || 0}</strong>
            <span className="counter-name">Completed</span>
          </div>
        </div>

        <div className="counter-item">
          <div className="counter-icon-wrap indigo">
            <Gift size={15} />
          </div>
          <div className="counter-info">
            <strong className="counter-val">${(Number(user?.teamBonus) || 0).toFixed(0)}</strong>
            <span className="counter-name">Team Bonus</span>
          </div>
        </div>

        <div className="counter-item">
          <div className="counter-icon-wrap blue">
            <Calendar size={15} />
          </div>
          <div className="counter-info">
            <strong className="counter-val">${(Number(user?.thisMonthEarnings) || 0).toFixed(0)}</strong>
            <span className="counter-name">This Month</span>
          </div>
        </div>
      </div>

      {/* PERFORMANCE CARD matching Screenshot 2 */}
      <div className="performance-card mt-4">
        <div className="card-header-row">
          <div className="header-left-title">
            <BarChart3 size={16} color="#2563eb" />
            <span className="card-section-title">Performance</span>
          </div>
        </div>
        <div className="performance-metrics-list">
          <div className="perf-row">
            <span className="perf-label">Deposit Success</span>
            <div className="perf-bar-wrap">
              <div className="perf-bar-fill" style={{ width: `${user?.depositSuccessRate || 0}%` }}></div>
            </div>
            <span className="perf-percent">{user?.depositSuccessRate || 0}%</span>
          </div>

          <div className="perf-row">
            <span className="perf-label">Withdraw Rate</span>
            <div className="perf-bar-wrap">
              <div className="perf-bar-fill" style={{ width: `${user?.withdrawRate || 0}%` }}></div>
            </div>
            <span className="perf-percent">{user?.withdrawRate || 0}%</span>
          </div>

          <div className="perf-row">
            <span className="perf-label">Task Completion</span>
            <div className="perf-bar-wrap">
              <div className="perf-bar-fill" style={{ width: `${user?.taskCompletionRate || 0}%` }}></div>
            </div>
            <span className="perf-percent">{user?.taskCompletionRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY ALERT STRIP matching Screenshot 2 */}
      {pendingRecord && (
        <div className="recent-activity-alert-strip mt-4">
          <div className="alert-strip-left">
            <div className="clock-icon-circle">
              <Clock size={16} color="#10b981" />
            </div>
            <div className="alert-strip-info">
              <strong>{pendingRecord.type || 'Transaction'}</strong>
              <span className="alert-strip-date">{pendingRecord.date || 'Recent'}</span>
            </div>
          </div>
          <div className="alert-strip-right">
            <span className="alert-strip-amount">+{(Number(pendingRecord.amount) || 0).toFixed(2)}</span>
            <span className="alert-strip-status pending">{(pendingRecord.status || 'Pending').toLowerCase()}</span>
          </div>
        </div>
      )}

      {/* EBAY TASK CAROUSEL matching Screenshot 2 */}
      <div className="platform-task-section mt-6">
        <div className="platform-header-row">
          <div className="platform-title-group">
            <span className="platform-indicator ebay"></span>
            <h3>eBay Campaigns</h3>
          </div>
          <button className="more-link" onClick={() => setDashboardTab('menu')}>
            <span>More</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="horizontal-tasks-scroll">
          {ebayTasks.map((task) => {
            const isRestricted = (task.requiredDeposit || 0) > 0 && user.balance < task.requiredDeposit && (user.totalDeposit || 0) < task.requiredDeposit;
            return (
              <div
                key={task.id}
                className={`dash-task-card ${isRestricted ? 'task-card-restricted' : ''}`}
                onClick={() => {
                  setSelectedTask(task);
                  setModalType('task');
                }}
              >
                <div className="dash-task-img-wrap">
                  <img
                    src={task.image}
                    alt={task.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <button
                    type="button"
                    className="thumb-store-btn"
                    title={`Open live product listing on ${task.platform}`}
                    onClick={(e) => openProductUrl(task, e)}
                  >
                    <ExternalLink size={12} />
                  </button>
                  {task.isLearning && (
                    <span className="card-learning-badge">🎓 Step #{task.learningStep || 1}</span>
                  )}
                  {isRestricted && (
                    <div className="card-lock-overlay">
                      <Lock size={14} />
                      <span>Min Dep ${(Number(task.requiredDeposit) || 0).toFixed(0)}</span>
                    </div>
                  )}
                </div>
                <div className="dash-task-meta-row">
                  <span className="dash-platform-pill ebay">eBay</span>
                  <button
                    type="button"
                    className="card-quick-store-pill"
                    onClick={(e) => openProductUrl(task, e)}
                    title="View on eBay"
                  >
                    <span>Visit</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
                <h5 className="dash-task-title">{task.title}</h5>
                <div className="dash-task-footer-row">
                  <div className="dash-task-price">${(Number(task.price) || 0).toFixed(2)}</div>
                  <span className="dash-task-profit">+${(((Number(task.price) || 0) * 4.0) / 100).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WALMART TASK CAROUSEL matching Screenshot 2 */}
      <div className="platform-task-section mt-6">
        <div className="platform-header-row">
          <div className="platform-title-group">
            <span className="platform-indicator walmart"></span>
            <h3>Walmart Campaigns</h3>
          </div>
          <button className="more-link" onClick={() => setDashboardTab('menu')}>
            <span>More</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="horizontal-tasks-scroll">
          {walmartTasks.map((task) => {
            const reqDep = Number(task.requiredDeposit) || 0;
            const userBal = Number(user?.balance) || 0;
            const userTotDep = Number(user?.totalDeposit) || 0;
            const isRestricted = reqDep > 0 && userBal < reqDep && userTotDep < reqDep;
            return (
              <div
                key={task.id}
                className={`dash-task-card ${isRestricted ? 'task-card-restricted' : ''}`}
                onClick={() => {
                  setSelectedTask(task);
                  setModalType('task');
                }}
              >
                <div className="dash-task-img-wrap">
                  <img
                    src={task.image}
                    alt={task.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <button
                    type="button"
                    className="thumb-store-btn"
                    title={`Open live product listing on ${task.platform}`}
                    onClick={(e) => openProductUrl(task, e)}
                  >
                    <ExternalLink size={12} />
                  </button>
                  {task.isLearning && (
                    <span className="card-learning-badge">🎓 Step #{task.learningStep || 1}</span>
                  )}
                  {isRestricted && (
                    <div className="card-lock-overlay">
                      <Lock size={14} />
                      <span>Min Dep ${reqDep.toFixed(0)}</span>
                    </div>
                  )}
                </div>
                <div className="dash-task-meta-row">
                  <span className="dash-platform-pill walmart">Walmart</span>
                  <button
                    type="button"
                    className="card-quick-store-pill"
                    onClick={(e) => openProductUrl(task, e)}
                    title="View on Walmart"
                  >
                    <span>Visit</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
                <h5 className="dash-task-title">{task.title}</h5>
                <div className="dash-task-footer-row">
                  <div className="dash-task-price">${(Number(task.price) || 0).toFixed(2)}</div>
                  <span className="dash-task-profit">+${(((Number(task.price) || 0) * 8.0) / 100).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEMU TASK CAROUSEL matching Screenshot 2 */}
      <div className="platform-task-section mt-6">
        <div className="platform-header-row">
          <div className="platform-title-group">
            <span className="platform-indicator temu"></span>
            <h3>Temu Campaigns</h3>
          </div>
          <button className="more-link" onClick={() => setDashboardTab('menu')}>
            <span>More</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="horizontal-tasks-scroll">
          {temuTasks.map((task) => {
            const reqDep = Number(task.requiredDeposit) || 0;
            const userBal = Number(user?.balance) || 0;
            const userTotDep = Number(user?.totalDeposit) || 0;
            const isRestricted = reqDep > 0 && userBal < reqDep && userTotDep < reqDep;
            return (
              <div
                key={task.id}
                className={`dash-task-card ${isRestricted ? 'task-card-restricted' : ''}`}
                onClick={() => {
                  setSelectedTask(task);
                  setModalType('task');
                }}
              >
                <div className="dash-task-img-wrap">
                  <img
                    src={task.image}
                    alt={task.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <button
                    type="button"
                    className="thumb-store-btn"
                    title={`Open live product listing on ${task.platform}`}
                    onClick={(e) => openProductUrl(task, e)}
                  >
                    <ExternalLink size={12} />
                  </button>
                  {task.isLearning && (
                    <span className="card-learning-badge">🎓 Step #{task.learningStep || 1}</span>
                  )}
                  {isRestricted && (
                    <div className="card-lock-overlay">
                      <Lock size={14} />
                      <span>Min Dep ${reqDep.toFixed(0)}</span>
                    </div>
                  )}
                </div>
                <div className="dash-task-meta-row">
                  <span className="dash-platform-pill temu">Temu</span>
                  <button
                    type="button"
                    className="card-quick-store-pill"
                    onClick={(e) => openProductUrl(task, e)}
                    title="View on Temu"
                  >
                    <span>Visit</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
                <h5 className="dash-task-title">{task.title}</h5>
                <div className="dash-task-footer-row">
                  <div className="dash-task-price">${(Number(task.price) || 0).toFixed(2)}</div>
                  <span className="dash-task-profit">+${(((Number(task.price) || 0) * 12.0) / 100).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIVE RECENT ACTIVITY MASKED STREAM WITH CONTINUOUS SCROLLING */}
      <ScrollingActivityStream />
    </div>
  );
}

// Expanded Random Masked Users from diverse global regions
const RANDOM_USERS = [
  { name: 'Em*y Joh*n', flag: '🇺🇸' },
  { name: 'Abd**h Al Sa*d', flag: '🇦🇪' },
  { name: 'Ra**h Ku*r', flag: '🇮🇳' },
  { name: 'Fa*ta Ma*k', flag: '🇵🇰' },
  { name: 'Ja*s Wil**s', flag: '🇺🇸' },
  { name: 'Ol**er Sm*th', flag: '🇬🇧' },
  { name: 'Lu*as We**er', flag: '🇩🇪' },
  { name: 'Li*m Brow*', flag: '🇨🇦' },
  { name: 'Ch*oe Du**nt', flag: '🇫🇷' },
  { name: 'Ma*eo Sil**', flag: '🇧🇷' },
  { name: 'Ke*to Ta**ka', flag: '🇯🇵' },
  { name: 'Al*x Ro**si', flag: '🇮🇹' },
  { name: 'Sa*ra Mül**r', flag: '🇨🇭' },
  { name: 'Vi*tor No**k', flag: '🇵🇱' },
  { name: 'Da*id O\'Co**or', flag: '🇮🇪' },
  { name: 'Ta*ya Iv**ov', flag: '🇧🇬' },
  { name: 'Ha*an Az**z', flag: '🇸🇦' },
  { name: 'Ji*woo Pa*k', flag: '🇰🇷' },
  { name: 'An*rea Gom*z', flag: '🇪🇸' },
  { name: 'Zo*ey Cl**ke', flag: '🇦🇺' },
  { name: 'Fe*ix Schu*z', flag: '🇦🇹' },
  { name: 'Ka*im Be*ali', flag: '🇲🇦' },
  { name: 'No*r Al-Ha**im', flag: '🇶🇦' },
  { name: 'El*na Pop*scu', flag: '🇷🇴' },
  { name: 'Dy*an va* Dy*k', flag: '🇳🇱' },
  { name: 'Sve* Lar**on', flag: '🇸🇪' },
  { name: 'Mi*ael Ch*n', flag: '🇸🇬' },
  { name: 'Ar*un Sha**a', flag: '🇮🇳' },
  { name: 'Ga*briel Co*ta', flag: '🇵🇹' },
  { name: 'So*ia Varga*', flag: '🇲🇽' }
];

const RANDOM_TEMPLATES = [
  // Profits & Commissions
  { badge: 'Profit', action: 'eBay 4% task commission earned', min: 12.50, max: 48.00, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'Walmart 8% merchant task yield', min: 42.00, max: 135.50, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'Temu 12% high-value review bonus', min: 75.00, max: 240.00, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'Website rating commission settled', min: 14.20, max: 62.80, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'Product promotion revenue credited', min: 18.50, max: 94.00, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'Flash deal review commission', min: 9.80, max: 52.00, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'Merchant VIP promotional rebate', min: 38.00, max: 165.00, isPositive: true, type: 'profit' },
  { badge: 'Profit', action: 'E-commerce partner daily task yield', min: 22.00, max: 88.00, isPositive: true, type: 'profit' },
  
  // Completed Quotas
  { badge: 'Completed', action: 'Completed 25/25 daily tasks', min: 12.80, max: 28.50, isPositive: true, type: 'completed' },
  { badge: 'Completed', action: 'Completed 40/40 daily tasks', min: 24.00, max: 58.00, isPositive: true, type: 'completed' },
  { badge: 'Completed', action: 'Completed 50/50 VIP task set', min: 52.00, max: 130.00, isPositive: true, type: 'completed' },
  
  // VIP Bonuses
  { badge: 'VIP Bonus', action: 'Weekly referral team dividend', min: 45.00, max: 210.00, isPositive: true, type: 'bonus' },
  { badge: 'VIP Bonus', action: 'Top merchant rank achievement', min: 95.00, max: 400.00, isPositive: true, type: 'bonus' },
  { badge: 'VIP Bonus', action: 'Regional growth leadership pool', min: 120.00, max: 550.00, isPositive: true, type: 'bonus' },
  
  // Withdrawals
  { badge: 'Withdraw', action: 'USDT TRC20 Fast Payout', min: 150.00, max: 650.00, isPositive: false, type: 'withdraw' },
  { badge: 'Withdraw', action: 'Direct TRON wallet transfer', min: 220.00, max: 1100.00, isPositive: false, type: 'withdraw' },
  { badge: 'Withdraw', action: 'Multi-sig authorized payout', min: 350.00, max: 1800.00, isPositive: false, type: 'withdraw' },
  
  // Deposits
  { badge: 'Deposit', action: 'Top-up via USDT TRC20', min: 100.00, max: 800.00, isPositive: true, type: 'deposit' },
  { badge: 'Deposit', action: 'USDT wallet deposit credited', min: 250.00, max: 1500.00, isPositive: true, type: 'deposit' },
  { badge: 'Deposit', action: 'VIP upgrade top-up confirmed', min: 500.00, max: 3000.00, isPositive: true, type: 'deposit' }
];

function ScrollingActivityStream() {
  const { activityStream } = useApp();
  const [items, setItems] = useState(() => activityStream && activityStream.length ? activityStream : MASKED_ACTIVITY_STREAM);
  const [filter, setFilter] = useState('all');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  // Periodic random live transaction generator
  useEffect(() => {
    const interval = setInterval(() => {
      const randomUser = RANDOM_USERS[Math.floor(Math.random() * RANDOM_USERS.length)];
      const randomTemplate = RANDOM_TEMPLATES[Math.floor(Math.random() * RANDOM_TEMPLATES.length)];
      const rawAmount = (Math.random() * (randomTemplate.max - randomTemplate.min) + randomTemplate.min).toFixed(2);
      const amountStr = `${randomTemplate.isPositive ? '+' : '-'}$${rawAmount}`;

      const newItem = {
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        flag: randomUser.flag,
        name: randomUser.name,
        badge: randomTemplate.badge,
        action: randomTemplate.action,
        time: 'just now',
        amount: amountStr,
        isPositive: randomTemplate.isPositive,
        type: randomTemplate.type,
        isNew: true
      };

      setItems(prev => [newItem, ...prev.slice(0, 39)]);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Smooth continuous auto-scrolling
  useEffect(() => {
    if (!autoScroll || isPaused || !scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    let animationFrameId;

    const step = () => {
      if (scrollContainer && !isPaused) {
        scrollContainer.scrollTop += 0.55;
        if (scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight - 2) {
          scrollContainer.scrollTop = 0;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoScroll, isPaused, items]);

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    const badgeLower = (item?.badge || '').toLowerCase();
    const typeLower = (item?.type || '').toLowerCase();
    if (filter === 'profit') return typeLower === 'profit' || typeLower === 'completed' || typeLower === 'bonus' || badgeLower === 'profit';
    if (filter === 'withdraw') return typeLower === 'withdraw' || badgeLower.includes('withdraw');
    if (filter === 'deposit') return typeLower === 'deposit' || badgeLower.includes('deposit');
    return true;
  });

  return (
    <div
      className="masked-stream-card mt-6 mb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="stream-header-bar">
        <div className="stream-header-left">
          <Clock size={16} className="text-primary-brand" />
          <span className="stream-title">Live Transactions & Activity</span>
          <div className="stream-live-indicator">
            <span className="live-pulse-dot"></span>
            <span className="live-text">LIVE FEED</span>
          </div>
        </div>

        <div className="stream-header-controls">
          <button
            className={`stream-control-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Pause Auto Scroll' : 'Resume Auto Scroll'}
          >
            {autoScroll ? <Pause size={12} /> : <Play size={12} />}
            <span>{autoScroll ? 'Auto Scrolling' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="stream-filters-row">
        {[
          { key: 'all', label: 'All Activity' },
          { key: 'profit', label: '📈 Profits & Tasks' },
          { key: 'withdraw', label: '💸 Withdrawals' },
          { key: 'deposit', label: '💰 Deposits' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`stream-filter-pill ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Viewport with top & bottom gradient mask */}
      <div className="stream-scroll-viewport" ref={scrollRef}>
        <div className="stream-items-list">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`stream-row animate-fade-in ${item.isNew ? 'stream-row-highlight' : ''}`}
            >
              <div className="stream-user-info">
                <span className="stream-flag">{item.flag}</span>
                <span className="stream-name">{item.name}</span>
                <span className={`stream-badge-pill ${(item.badge || '').toLowerCase().replace(/[\s/]+/g, '-')}`}>
                  {item.badge}
                </span>
                <span className="stream-action-text">{item.action} • {item.time}</span>
              </div>
              <div className={`stream-amount ${item.isPositive ? 'positive' : 'negative'}`}>
                {item.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="stream-footer-caption">
        <span>Continuous live transaction stream • Hover to pause and inspect</span>
      </div>
    </div>
  );
}

// ==========================================
// 2. TAB: MENU / VIP TIERS (Matching Screenshot 3)
// ==========================================
function TabMenu() {
  const { user, vipTiers, tasks, setSelectedTask, setModalType } = useApp();

  // Determine current tier progress
  const targetWalmart = 500;
  const progressPercent = Math.min(100, Math.round(((Number(user?.balance) || 0) / targetWalmart) * 100));

  const handleStartTasks = (platform) => {
    const platformTasks = (tasks || []).filter(t => (t.platform || '').toLowerCase() === (platform || '').toLowerCase());
    if (platformTasks.length > 0) {
      setSelectedTask(platformTasks[0]);
      setModalType('task');
    }
  };

  return (
    <div className="container tab-menu-container">
      <div className="menu-top-title">
        <h2>Menu</h2>
      </div>

      {/* TOP TIER PROGRESS BANNER matching Screenshot 3 */}
      <div className="tier-progress-banner mt-3">
        <div className="tier-banner-left">
          <div className="tier-icon-circle ebay-bg">
            <span className="ebay-text">ebay</span>
          </div>
          <div className="tier-banner-info">
            <div className="tier-name-row">
              <strong>eBay</strong>
              <span className="tier-current-tag">Current Tier</span>
            </div>
            <span className="tier-sub-balance">
              Balance: <strong>${(Number(user?.balance) || 0).toFixed(2)}</strong> - ${Math.max(0, targetWalmart - (Number(user?.balance) || 0)).toFixed(0)} more to unlock Walmart
            </span>
          </div>
        </div>
        <div className="tier-banner-right">
          <span className="tier-progress-num">${(Number(user?.balance) || 0).toFixed(0)} / ${targetWalmart}</span>
          <div className="tier-mini-bar">
            <div className="tier-mini-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* 3 VIP TIERS CARDS matching Screenshot 3 */}
      <div className="tier-cards-grid mt-6">
        {/* Tier 1: eBay (Red) */}
        <div className="vip-tier-card ebay-card">
          <div className="vip-card-header">
            <div className="vip-active-chip">
              <Zap size={13} />
              <span>active</span>
            </div>
            <div className="vip-commission-badge">4%</div>
          </div>

          <div className="vip-platform-name">
            <span className="platform-logo-big ebay">ebay</span>
            <h3>eBay</h3>
            <span className="vip-price-range">$0 – $499</span>
          </div>

          <div className="vip-card-desc">
            <p>Review eBay product listings and earn entry-level commissions. Great for getting started.</p>
          </div>

          <button
            className="vip-action-btn active-btn"
            onClick={() => handleStartTasks('eBay')}
          >
            <Zap size={16} />
            <span>Start Tasks</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Tier 2: Walmart (Blue) */}
        <div className={`vip-tier-card walmart-card ${user.balance >= 500 ? 'unlocked' : 'locked'}`}>
          <div className="vip-card-header">
            <div className="vip-locked-chip">
              <Lock size={13} />
              <span>{user.balance >= 500 ? 'Unlocked' : 'Locked'}</span>
            </div>
            <div className="vip-commission-badge">8%</div>
          </div>

          <div className="vip-platform-name">
            <span className="platform-logo-big walmart">W</span>
            <h3>Walmart</h3>
            <span className="vip-price-range">$500 – $899</span>
          </div>

          <div className="vip-card-desc">
            <p>Rate wholesale listings on Walmart. Higher commissions for members with larger balances.</p>
          </div>

          {user.balance >= 500 ? (
            <button
              className="vip-action-btn active-btn"
              onClick={() => handleStartTasks('Walmart')}
            >
              <Zap size={16} />
              <span>Start Tasks</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button className="vip-action-btn locked-btn" disabled>
              <Lock size={16} />
              <span>Locked</span>
            </button>
          )}
        </div>

        {/* Tier 3: Temu (Orange) */}
        <div className={`vip-tier-card temu-card ${user.balance >= 900 ? 'unlocked' : 'locked'}`}>
          <div className="vip-card-header">
            <div className="vip-locked-chip">
              <Lock size={13} />
              <span>{user.balance >= 900 ? 'Unlocked' : 'Locked'}</span>
            </div>
            <div className="vip-commission-badge">12%</div>
          </div>

          <div className="vip-platform-name">
            <span className="platform-logo-big temu">TEMU</span>
            <h3>Temu</h3>
            <span className="vip-price-range">$900+</span>
          </div>

          <div className="vip-card-desc">
            <p>Premium review tasks with the highest earning potential. Exclusive to top-tier members.</p>
          </div>

          {user.balance >= 900 ? (
            <button
              className="vip-action-btn active-btn"
              onClick={() => handleStartTasks('Temu')}
            >
              <Zap size={16} />
              <span>Start Tasks</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button className="vip-action-btn locked-btn" disabled>
              <Lock size={16} />
              <span>Locked</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. TAB: RECORDS (Matching Screenshot 4)
// ==========================================
function TabRecords() {
  const { records, user } = useApp();
  const [subTab, setSubTab] = useState('Transactions');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Filter records belonging to the active user (or general records)
  const myRecords = records.filter(r => !r.userId || (user && r.userId === user.id));

  const filtered = myRecords.filter(rec => {
    if (subTab === 'Transactions') {
      if (rec.category !== 'Deposit' && rec.category !== 'Withdrawal' && rec.category !== 'Adjustment') return false;
    } else if (subTab === 'Ad Tasks') {
      if (rec.category !== 'Ad Tasks') return false;
    } else if (subTab === 'Referrals') {
      if (rec.category !== 'Referral' && !rec.type.includes('Referral') && !rec.type.includes('Bonus')) return false;
    }

    if (statusFilter !== 'All' && rec.status !== statusFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        (rec.type && rec.type.toLowerCase().includes(q)) ||
        (rec.code && rec.code.toLowerCase().includes(q)) ||
        (rec.note && rec.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCount = myRecords.length;
  const completedCount = myRecords.filter(r => r.status === 'Completed').length;
  const pendingCount = myRecords.filter(r => r.status === 'Pending').length;
  const incompleteCount = myRecords.filter(r => r.status === 'Rejected').length;

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(myRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `websynx_ledger_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="container tab-records-container">
      {/* Records Top Bar matching Screenshot 4 */}
      <div className="records-top-bar">
        <h2>Records</h2>
        <button className="export-btn" onClick={handleExport}>
          <Download size={15} />
          <span>Export</span>
        </button>
      </div>

      {/* Sub Tabs Pill Row matching Screenshot 4 */}
      <div className="records-subtabs-row mt-4">
        {['Transactions', 'Ad Tasks', 'Analytics', 'My Activity'].map(tab => (
          <button
            key={tab}
            className={`subtab-pill ${subTab === tab ? 'active' : ''}`}
            onClick={() => setSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4 Stat Boxes matching Screenshot 4 */}
      <div className="records-stat-boxes mt-4">
        <div className="record-stat-box">
          <strong className="box-val">{totalCount}</strong>
          <span className="box-label">Total Records</span>
        </div>
        <div className="record-stat-box">
          <strong className="box-val">{completedCount}</strong>
          <span className="box-label">Completed</span>
        </div>
        <div className="record-stat-box">
          <strong className="box-val">{pendingCount}</strong>
          <span className="box-label">Pending</span>
        </div>
        <div className="record-stat-box">
          <strong className="box-val">{incompleteCount}</strong>
          <span className="box-label">Incomplete</span>
        </div>
      </div>

      {/* Filter Row with pills and search input matching Screenshot 4 */}
      <div className="records-filter-toolbar mt-4">
        <div className="filter-pills-wrap">
          <button
            className={`filter-pill ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All Records <span className="pill-badge">{totalCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Completed')}
          >
            Completed <span className="pill-badge">{completedCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Pending')}
          >
            Pending <span className="pill-badge">{pendingCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Rejected')}
          >
            Incomplete <span className="pill-badge">{incompleteCount}</span>
          </button>
        </div>

        <div className="records-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Records Item List matching Screenshot 4 */}
      <div className="records-list-wrapper mt-4 mb-12">
        {filtered.length === 0 ? (
          <div className="empty-records-state py-12 text-center">
            <FileText size={48} color="#94a3b8" />
            <h4 className="mt-3">No Records Found</h4>
            <p className="text-muted">There are no records matching your current filter criteria.</p>
          </div>
        ) : (
          filtered.map(rec => (
            <div key={rec.id} className="record-card-row animate-fade-in">
              <div className="record-left">
                <div className="record-clock-icon">
                  <Clock size={18} color="#b45309" />
                </div>
                <div className="record-meta">
                  <div className="record-title-line">
                    <strong className="record-type-name">{rec.type}</strong>
                    <span className="record-cat-tag">{rec.category}</span>
                  </div>
                  <div className="record-subline">
                    <span>{rec.date}</span>
                    <span className="dot-sep">·</span>
                    <span className="record-code">{rec.code}</span>
                    <span className="dot-sep">·</span>
                    <span className="record-note">{rec.note}</span>
                  </div>
                </div>
              </div>

              <div className="record-right">
                <div className={`record-amount-val ${Number(rec.amount) >= 0 ? 'positive' : 'negative'}`}>
                  {Number(rec.amount) >= 0 ? `+${(Number(rec.amount) || 0).toFixed(2)}` : `${(Number(rec.amount) || 0).toFixed(2)}`} {rec.currency || 'USDT'}
                </div>
                <span className={`record-status-pill ${(rec.status || 'Pending').toLowerCase()}`}>
                  {rec.status || 'Pending'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. TAB: SUPPORT (Live Support Hub)
// ==========================================
function TabSupport() {
  const { user } = useApp();
  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState({ messages: [], unreadByUser: 0 });
  const [settings, setSettings] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const userId = user?.id;

  useEffect(() => {
    api.getSupportSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    api.getMyChat(userId).then(setChat).catch(() => {});
    api.markMyChatRead(userId).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsub = api.subscribeLiveEvents((event) => {
      if (event.type === 'support_message' && event.payload?.chat?.userId === userId) {
        setChat(event.payload.chat);
        api.markMyChatRead(userId).catch(() => {});
      }
      if (event.type === 'support_settings_updated') {
        setSettings(event.payload.settings);
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chat.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !userId || sending) return;

    setSending(true);
    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender: 'user',
      text,
      createdAt: new Date().toISOString()
    };
    setChat((prev) => ({ ...prev, messages: [...(prev.messages || []), optimistic] }));
    setChatInput('');

    try {
      const updated = await api.sendSupportMessage(userId, text);
      setChat(updated);
    } catch (err) {
      console.error('Failed to send support message:', err);
    } finally {
      setSending(false);
    }
  };

  const isOnline = settings?.online !== false;
  const messages = chat.messages || [];

  return (
    <div className="container tab-support-container">
      <div className="support-top-title">
        <h2>Customer Support Hub</h2>
      </div>

      <div className="support-channels-row mt-4">
        {settings?.telegram && (
          <a
            href={settings.telegram}
            target="_blank"
            rel="noreferrer"
            className="channel-box-link"
          >
            <div className="channel-box-icon tg">
              <MessageCircle size={22} />
            </div>
            <div>
              <strong>Telegram Channel</strong>
              <span>Direct 24/7 messaging with support desk</span>
            </div>
          </a>
        )}

        {settings?.whatsapp && (
          <a
            href={settings.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="channel-box-link"
          >
            <div className="channel-box-icon tg" style={{ background: '#25D366' }}>
              <MessageCircle size={22} />
            </div>
            <div>
              <strong>WhatsApp Support</strong>
              <span>Fast live support channel</span>
            </div>
          </a>
        )}

        {settings?.email && (
          <a
            href={`mailto:${settings.email}`}
            className="channel-box-link"
          >
            <div className="channel-box-icon mail">
              <Mail size={22} />
            </div>
            <div>
              <strong>Email Ticket Desk</strong>
              <span>{settings.email} • Priority desk</span>
            </div>
          </a>
        )}
      </div>

      {/* Live Chat Panel connected to Admin Inbox */}
      <div className="live-chat-panel mt-6 mb-12">
        <div className="chat-panel-header">
          <div className="agent-avatar-wrap">
            <div className="agent-circle">🎧</div>
            <div className="agent-info">
              <strong>{settings?.agentName || 'VIP Operations Specialist'}</strong>
              <span className={isOnline ? 'agent-status-online' : 'agent-status-offline'}>
                {isOnline ? 'Online • Live Admin Connected' : 'Offline • Leave a message'}
              </span>
            </div>
          </div>
          {settings?.workingHours && (
            <span className="text-xs text-muted font-bold">{settings.workingHours}</span>
          )}
        </div>

        <div className="chat-messages-area" ref={messagesEndRef}>
          {/* Welcome Message */}
          <div className="chat-bubble-row incoming">
            <div className="chat-bubble">
              <p>{isOnline ? (settings?.welcomeMessage || 'Hello! Welcome to WebSynx VIP Support. How can our operations team assist you today?') : (settings?.offlineMessage || 'We are currently offline. Leave a message and we will respond shortly.')}</p>
              <span className="bubble-time">Live System</span>
            </div>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble-row ${m.sender === 'user' ? 'outgoing' : 'incoming'}`}
            >
              <div className="chat-bubble">
                {m.sender === 'admin' && !m.auto && m.agentName && (
                  <span className="text-xs font-bold text-primary-brand block mb-1">{m.agentName}</span>
                )}
                {m.auto && (
                  <span className="text-xs text-muted block mb-1">Auto-Response</span>
                )}
                <p>{m.text}</p>
                <span className="bubble-time">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="chat-input-bar">
          <input
            type="text"
            placeholder="Type your question regarding tasks, wallets, or withdrawals..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || sending}>
            <Send size={15} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. TAB: MINE / PROFILE (Matching Screenshot 5)
// ==========================================
function TabMine() {
  const { user, setModalType, setDashboardTab, logoutAccount } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null); // 'profile' | 'team' | 'wallet' | 'settings' | null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="tab-mine-wrapper">
      {/* Top action mini bar matching Screenshot 5 */}
      <div className="mine-top-bar">
        <div className="container top-bar-container">
          <div className="mine-brand-left">
            <TrendingUp size={20} color="#2563eb" />
            <span className="mine-brand-title">Web<span className="brand-highlight">Synx</span></span>
          </div>
          <div className="mine-top-actions">
            <button className="btn-mine-deposit" onClick={() => setModalType('deposit')}>
              <Wallet size={14} />
              <span>Deposit</span>
            </button>
            <button className="btn-mine-withdraw" onClick={() => setModalType('withdraw')}>
              <ArrowUpRight size={14} />
              <span>Withdrawal</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mine-content-container mt-4">
        {/* SAPPHIRE USER PROFILE BANNER matching Screenshot 5 */}
        <div className="profile-sapphire-banner">
          <div className="profile-top-line">
            <div className="profile-avatar-circle">
              {user.avatar}
            </div>
            <div className="profile-user-details">
              <div className="name-and-vip">
                <h3 className="profile-name">{user.name}</h3>
                <span className="profile-vip-star">⭐ VIP</span>
              </div>
              <div className="team-code-row">
                <span>Team Code: <strong>{user.referralCode}</strong></span>
                <button className="mini-copy-btn" onClick={handleCopyCode} title="Copy Team Code">
                  {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                </button>
              </div>
              <span className="profile-email">{user.email}</span>
            </div>
            <button
              className="gear-settings-btn"
              onClick={() => setActiveSubMenu(activeSubMenu === 'settings' ? null : 'settings')}
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* 3 STATS COLUMNS inside sapphire card matching Screenshot 5 */}
          <div className="profile-stats-three-col mt-6">
            <div className="p-stat-col">
              <strong>${(Number(user?.balance) || 0).toFixed(2)}</strong>
              <span>Available Balance</span>
            </div>
            <div className="p-stat-col">
              <strong>${(Number(user?.totalEarnings) || 0).toFixed(2)}</strong>
              <span>Total Earned</span>
            </div>
            <div className="p-stat-col">
              <strong>{user?.teamMembersCount || 0}</strong>
              <span>Referrals</span>
            </div>
          </div>
        </div>

        {/* SUBMENU ACCORDIONS / DETAIL VIEWS */}
        {activeSubMenu === 'team' && (
          <div className="mine-card-panel mt-4 animate-fade-in">
            <div className="panel-header">
              <h4>Referral & Team Network</h4>
              <button className="close-panel-btn" onClick={() => setActiveSubMenu(null)}>✕</button>
            </div>
            <div className="referral-box mt-3">
              <span className="input-label">Your Referral Link</span>
              <div className="invite-link-row">
                <code>https://websynx.com/register?ref={user.referralCode}</code>
                <button className="copy-btn" onClick={handleCopyCode}>
                  {copiedCode ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
            <div className="team-tier-breakdown mt-4">
              <div className="team-tier-row">
                <span>Level 1 Referrals (16% Commission)</span>
                <strong>0 Members ($0.00 earned)</strong>
              </div>
              <div className="team-tier-row">
                <span>Level 2 Referrals (8% Commission)</span>
                <strong>0 Members ($0.00 earned)</strong>
              </div>
              <div className="team-tier-row">
                <span>Level 3 Referrals (4% Commission)</span>
                <strong>0 Members ($0.00 earned)</strong>
              </div>
            </div>
          </div>
        )}

        {activeSubMenu === 'wallet' && (
          <div className="mine-card-panel mt-4 animate-fade-in">
            <div className="panel-header">
              <h4>Wallet & Asset Management</h4>
              <button className="close-panel-btn" onClick={() => setActiveSubMenu(null)}>✕</button>
            </div>
            <div className="wallet-details mt-3">
              <div className="wallet-row">
                <span>Registered TRC20 Address:</span>
                <code>{user.walletAddress}</code>
              </div>
              <div className="wallet-row mt-2">
                <span>Network:</span>
                <span className="badge-tech">TRON (TRC20)</span>
              </div>
              <div className="wallet-row mt-2">
                <span>KYC Identity Status:</span>
                <span className="badge-rec">{user.kycStatus}</span>
              </div>
            </div>
          </div>
        )}

        {activeSubMenu === 'settings' && (
          <div className="mine-card-panel mt-4 animate-fade-in">
            <div className="panel-header">
              <h4>Security & Preferences</h4>
              <button className="close-panel-btn" onClick={() => setActiveSubMenu(null)}>✕</button>
            </div>
            <div className="settings-options mt-3">
              <div className="setting-toggle-row">
                <div>
                  <strong>Two-Factor Authentication (2FA)</strong>
                  <p className="text-muted text-xs">Require OTP verification for all withdrawals</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-toggle-row mt-3">
                <div>
                  <strong>Email Withdrawal Confirmations</strong>
                  <p className="text-muted text-xs">Send instant receipt when funds dispatch</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        )}

        {/* MENU OPTIONS LIST matching Screenshot 5 */}
        <div className="mine-menu-card mt-4">
          {/* Profile */}
          <div
            className="mine-menu-item"
            onClick={() => setModalType('kyc')}
          >
            <div className="menu-item-left">
              <div className="menu-icon-circle blue">
                <User size={18} />
              </div>
              <div className="menu-item-text">
                <strong>Profile</strong>
                <span>Edit your personal info & KYC status</span>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-muted" />
          </div>

          {/* My Team */}
          <div
            className="mine-menu-item"
            onClick={() => setActiveSubMenu(activeSubMenu === 'team' ? null : 'team')}
          >
            <div className="menu-item-left">
              <div className="menu-icon-circle blue">
                <Users size={18} />
              </div>
              <div className="menu-item-text">
                <strong>My Team</strong>
                <span>{user.teamMembersCount} members in your network</span>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-muted" />
          </div>

          {/* Wallet */}
          <div
            className="mine-menu-item"
            onClick={() => setActiveSubMenu(activeSubMenu === 'wallet' ? null : 'wallet')}
          >
            <div className="menu-item-left">
              <div className="menu-icon-circle orange">
                <Wallet size={18} />
              </div>
              <div className="menu-item-text">
                <strong>Wallet</strong>
                <span>Manage your wallet & assets</span>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-muted" />
          </div>

          {/* Records */}
          <div
            className="mine-menu-item"
            onClick={() => setDashboardTab('records')}
          >
            <div className="menu-item-left">
              <div className="menu-icon-circle green">
                <FileText size={18} />
              </div>
              <div className="menu-item-text">
                <strong>Records</strong>
                <span>Transactions, tasks & analytics</span>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-muted" />
          </div>

          {/* Account Creation & Management Menu Item */}
          <div
            className="mine-menu-item"
            onClick={() => setModalType('auth')}
          >
            <div className="menu-item-left">
              <div className="menu-icon-circle blue">
                <Sparkles size={18} />
              </div>
              <div className="menu-item-text">
                <strong>Create New Account / Switch User</strong>
                <span>Register a new WebSynx profile or log into another account</span>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-muted" />
          </div>

          {/* Settings */}
          <div
            className="mine-menu-item"
            onClick={() => setActiveSubMenu(activeSubMenu === 'settings' ? null : 'settings')}
          >
            <div className="menu-item-left">
              <div className="menu-icon-circle gray">
                <Settings size={18} />
              </div>
              <div className="menu-item-text">
                <strong>Settings & Security</strong>
                <span>Password, 2FA & ledger preferences</span>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-muted" />
          </div>
        </div>

        {/* AUTH ACTION BUTTONS matching Screenshot 5 */}
        <div className="sign-out-container mt-6 mb-16 flex flex-col gap-3">
          <button
            className="btn-primary w-full py-3"
            onClick={() => setModalType('auth')}
          >
            <Sparkles size={16} />
            <span>Create New Account / Register</span>
          </button>
          <button
            className="sign-out-btn"
            onClick={logoutAccount}
          >
            <LogOut size={16} />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
