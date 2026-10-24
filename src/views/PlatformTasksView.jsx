import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  Check,
  Lock,
  ExternalLink,
  Zap,
  Sparkles,
  Wallet,
  Clock,
  RefreshCw,
  FileText,
  Send,
  MessageCircle
} from 'lucide-react';
import { openProductUrl, getProductImage } from '../utils/productUrl';
import { INITIAL_TASKS } from '../data/mockData';

export default function PlatformTasksView({ platform = 'eBay', onBack }) {
  const {
    user,
    setModalType,
    setDashboardTab,
    requestTaskPackage,
    cancelTaskPackageRequest,
    tasks,
    setSelectedTask,
    addNotification,
    supportSettings,
    vipTiers,
    userActiveTier,
    openPlatformTasks,
    getTierProgressAndStatus,
    getUserActiveTier,
    getEffectiveDepositOrBalance
  } = useApp();

  const [requestLoading, setRequestLoading] = useState(false);
  const [justRequested, setJustRequested] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const displayPlatform = platform || 'eBay';

  const tiersList = Array.isArray(vipTiers) && vipTiers.length > 0 ? vipTiers : [];
  const targetTier = tiersList.find(t => (t.platform || t.name || '').toLowerCase() === displayPlatform.toLowerCase());
  const effectiveAmt = getEffectiveDepositOrBalance ? getEffectiveDepositOrBalance(user) : Math.max(Number(user?.totalDeposit || 0), Number(user?.balance || 0));
  const activeTier = userActiveTier || (getUserActiveTier ? getUserActiveTier(tiersList, user) : { name: 'eBay' });
  const tierStatus = targetTier && getTierProgressAndStatus ? getTierProgressAndStatus(targetTier, tiersList, user) : null;

  // 1. Resolve assigned tasks queue strictly from user object or user-specific cache assigned by admin
  let assignedQueue = [];
  if (Array.isArray(user?.assignedTasks) && user.assignedTasks.length > 0) {
    assignedQueue = user.assignedTasks;
  } else if (user?.id) {
    try {
      const cached = localStorage.getItem(`websynx_user_assigned_tasks_${user.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) assignedQueue = parsed;
      }
    } catch (e) {}
  }
  if (assignedQueue.length === 0 && (user?.assignedPackage || Number(user?.pendingTasks || user?.pending_tasks || 0) > 0)) {
    const pool = (tasks && tasks.length >= 25 ? tasks : INITIAL_TASKS);
    assignedQueue = pool.slice(0, 25);
  }

  // 2. Determine if user has an assigned package:
  // A user ONLY has tasks unlocked if Admin has explicitly assigned the package:
  const isAssigned = (user?.taskPackageStatus === 'assigned' || !!user?.assignedPackage || Number(user?.pendingTasks || user?.pending_tasks || 0) > 0) && assignedQueue.length > 0;
  const isPending = !isAssigned && !!(user?.taskPackageRequested || justRequested);

  const handleRequest = async () => {
    if (!user || user.role === 'guest' || !user.id) {
      setModalType('auth');
      return;
    }
    if (isPending) {
      setShowPendingModal(true);
      return;
    }
    setRequestLoading(true);
    try {
      await requestTaskPackage(displayPlatform);
      setJustRequested(true);
      setShowPendingModal(true);
      if (addNotification) {
        addNotification(
          'Task Request Pending',
          supportSettings?.taskPendingMessage || 'Your request is pending. Admin is reviewing and will assign your task package shortly.'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestLoading(false);
    }
  };

  const platformTasks = (tasks || []).filter(
    t => (t.platform || '').toLowerCase() === displayPlatform.toLowerCase()
  );

  return (
    <div className="platform-tasks-view-container animate-fade-in">
      {/* 1. HEADER */}
      <div className="platform-tasks-header">
        <div className="platform-header-nav-row">
          <button
            type="button"
            className="platform-back-circle-btn"
            onClick={onBack || (() => setDashboardTab('home'))}
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.4} />
          </button>
          <h2 className="platform-tasks-nav-title">{displayPlatform} Tasks</h2>
        </div>

        <div className="platform-header-balance-section">
          <span className="platform-balance-caption">Account Balance :</span>
          <div className="platform-balance-value">
            {(Number(user?.balance) || 0).toFixed(2)} USDT
          </div>
        </div>
      </div>

      {/* 2. MAIN SHEET */}
      <div className="platform-tasks-sheet">
        {/* PROGRESSIVE TIER LOCK ALERT */}
        {tierStatus?.isSurpassed && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} className="text-rose-600 flex-shrink-0" />
              <div>
                <strong style={{ fontSize: '13px', color: '#9f1239', display: 'block' }}>
                  {displayPlatform} Tier Locked (Surpassed)
                </strong>
                <span style={{ fontSize: '12px', color: '#be123c' }}>
                  Your deposit/balance (${effectiveAmt.toFixed(2)}) has unlocked <strong>{activeTier.name}</strong>. Please switch to {activeTier.name}!
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => openPlatformTasks && openPlatformTasks(activeTier.name)}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                background: '#e11d48',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '700'
              }}
            >
              Switch to {activeTier.name} →
            </button>
          </div>
        )}

        {tierStatus?.status === 'locked_below' && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} className="text-blue-600 flex-shrink-0" />
              <div>
                <strong style={{ fontSize: '13px', color: '#1e3a8a', display: 'block' }}>
                  {displayPlatform} Tier Locked
                </strong>
                <span style={{ fontSize: '12px', color: '#1d4ed8' }}>
                  Requires minimum deposit/balance of <strong>${targetTier?.minBalance || 500} USDT</strong> to unlock.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setModalType('deposit')}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                background: '#0284c7',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '700'
              }}
            >
              Deposit to Unlock →
            </button>
          </div>
        )}

        {!isAssigned ? (
          /* STATE A: NO TASKS ASSIGNED YET -> SHOW REQUEST TASK PACKAGE FLOW */
          isPending ? (
            <div className="unassigned-request-card text-center p-8 animate-fade-in">
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 8px 24px rgba(217, 119, 6, 0.2)'
              }}>
                <Clock size={40} className="spin-slow" />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                <Clock size={14} />
                <span>Awaiting Admin Assignment</span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                Task Package Request Pending
              </h3>

              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', maxWidth: '440px', margin: '0 auto 24px auto' }}>
                Your request for <strong>25 {displayPlatform} campaign tasks</strong> (Tracking #{user?.taskRequestId || 'REQ-PENDING'}) has been received. The administrator is reviewing your account and will assign your tasks package shortly.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                maxWidth: '440px',
                margin: '0 auto 24px auto',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Platform:</span>
                  <strong style={{ color: '#0f172a' }}>{displayPlatform} Campaigns</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Batch Size:</span>
                  <strong style={{ color: '#0f172a' }}>25 Tasks (1-by-1 Sequential)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                  <span>Status:</span>
                  <span style={{ color: '#d97706', fontWeight: '700' }}>In Admin Review Queue</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '440px', margin: '0 auto' }}>
                {supportSettings?.telegram && (
                  <a
                    href={!supportSettings.telegram.includes('websynx') ? supportSettings.telegram : 'https://t.me/ecomxstocks_support'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    <Send size={16} />
                    <span>Expedite via Telegram Support</span>
                  </a>
                )}
                <button
                  type="button"
                  className="btn-outline"
                  onClick={cancelTaskPackageRequest}
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ) : (
            <div className="unassigned-request-card text-center p-8 animate-fade-in">
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.2)'
              }}>
                <ClipboardList size={40} />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#f3e8ff',
                color: '#6b21a8',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                <Sparkles size={14} />
                <span>Ready for Assignment</span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                Request Your 25 {displayPlatform} Tasks
              </h3>

              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', maxWidth: '440px', margin: '0 auto 24px auto' }}>
                Deposit confirmed! Click below to request your batch of <strong>25 {displayPlatform} tasks</strong>. Once approved in the admin panel, your tasks will unlock sequentially 1 by 1.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '18px',
                maxWidth: '440px',
                margin: '0 auto 24px auto',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Zap size={18} className="text-purple-600" />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>Strict 1-by-1 Sequential Progression (See Task 1, then Task 2)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Wallet size={18} className="text-emerald-600" />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>Direct Commission Credited to Available Balance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} className="text-blue-600" />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>25 Verified Merchant Tasks Allocated by Admin</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={requestLoading}
                onClick={handleRequest}
                style={{
                  maxWidth: '440px',
                  width: '100%',
                  margin: '0 auto',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)'
                }}
              >
                <Zap size={18} />
                <span>{requestLoading ? 'Submitting Request...' : `Request 25 ${displayPlatform} Tasks`}</span>
              </button>
            </div>
          )
        ) : (
          /* STATE B: TASKS ASSIGNED -> STRICT 1-BY-1 SEQUENTIAL VISIBILITY */
          (() => {
            const completedCount = Number(user?.dailyCompleted ?? user?.completedTasks ?? 0);
            const totalQuota = assignedQueue.length || 25;
            const progressPct = Math.min(100, Math.round((completedCount / totalQuota) * 100));
            const currentActiveTask = assignedQueue[completedCount] || null;

            // Requirements check on current active task (only when Admin explicitly configured it):
            const rawDep = Number(currentActiveTask?.requiredDeposit ?? currentActiveTask?.required_deposit ?? 0);
            const explicitDep = currentActiveTask?.adminCustomized === true || (!currentActiveTask?.isLearning && rawDep > 0)
              ? rawDep
              : 0;
            const minRequired = explicitDep > 0 ? explicitDep : 0;
            const userBal = Number(user?.balance) || 0;
            const isRestricted = minRequired > 0 && userBal < minRequired;
            const shortfall = Math.max(0, minRequired - userBal);

            return (
              <div className="assigned-package-content animate-fade-in">
                {/* Top Campaign Banner */}
                <div className="assigned-banner">
                  <div className="assigned-badge-row">
                    <span className="assigned-tag">{user?.assignedPackage || 'Package 201'}</span>
                    <span className="assigned-status-active">
                      <Sparkles size={13} /> Active Package
                    </span>
                  </div>
                  <h4>{totalQuota} {displayPlatform} Tasks Assigned</h4>
                  <p>Complete tasks sequentially one by one. You see only Task 1 first; completing it reveals Task 2!</p>

                  <div className="package-progress-wrap mt-3">
                    <div className="progress-labels">
                      <span>Progress: {completedCount} / {totalQuota} Tasks Completed</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="package-progress-bar">
                      <div
                        className="package-progress-fill"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* All Tasks Completed State */}
                {completedCount >= totalQuota ? (
                  <div className="mt-4 p-6 rounded-2xl bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white mb-3 shadow-sm">
                      <CheckCircle2 size={26} />
                    </div>
                    <h4 className="text-emerald-800 dark:text-emerald-200 font-bold text-lg mb-1">All {totalQuota} Tasks Completed!</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                      Congratulations! You have completed all sequential tasks in this package. All commissions have been added to your balance.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleRequest}
                      >
                        Request Next Task Package
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => setModalType('withdraw')}
                      >
                        Withdraw Earnings
                      </button>
                    </div>
                  </div>
                ) : (
                  /* CURRENT ACTIVE TASK ONLY */
                  <div className="assigned-tasks-list mt-4">
                    <div className="assigned-list-header flex items-center justify-between mb-3">
                      <div>
                        <h5>Active Task #{completedCount + 1} of {totalQuota}</h5>
                        <p className="text-xs text-slate-500 m-0">
                          Complete Task #{completedCount + 1} to unlock Task #{completedCount + 2}.
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        Step {completedCount + 1} / {totalQuota}
                      </span>
                    </div>

                    {currentActiveTask && (() => {
                      const displayTitle = (currentActiveTask.title || 'Product Campaign Task').replace(/^Step\s*\d+\s*:\s*/i, '');
                      const vipRate = currentActiveTask.commissionRate || 4.0;
                      const activeCommission = (((Number(currentActiveTask.price) || 0) * vipRate) / 100).toFixed(2);

                      return (
                        <div className="mallstocks-order-card animate-fade-in" style={{ marginTop: '6px' }}>
                          {/* 6-Metric Grid matching Screenshot 2 */}
                          <div className="mallstocks-stats-grid">
                            {/* Row 1 */}
                            <div className="mallstocks-stat-box">
                              <div className="mallstocks-stat-val">{completedCount}</div>
                              <div className="mallstocks-stat-label">Today's Time</div>
                            </div>
                            <div className="mallstocks-stat-box">
                              <div className="mallstocks-stat-val">
                                {(Number(user?.totalEarnings ?? user?.total_earnings ?? 0)).toFixed(2)} USDT
                              </div>
                              <div className="mallstocks-stat-label">Total commission</div>
                            </div>

                            {/* Row 2 */}
                            <div className="mallstocks-stat-box">
                              <div className={`mallstocks-stat-val ${shortfall > 0 ? 'text-amber-500 font-bold' : ''}`}>
                                {shortfall > 0 ? `${shortfall.toFixed(2)} USDT` : '0 USDT'}
                              </div>
                              <div className="mallstocks-stat-label">Cash gap between task</div>
                            </div>
                            <div className="mallstocks-stat-box">
                              <div className="mallstocks-stat-val">
                                {(Number(user?.yesterdayEarnings || 0)).toFixed(2)} USDT
                              </div>
                              <div className="mallstocks-stat-label">Yesterday's buy commission</div>
                            </div>

                            {/* Row 3 */}
                            <div className="mallstocks-stat-box">
                              <div className="mallstocks-stat-val">
                                {(Number(user?.teamCommission || user?.teamEarnings || 0)).toFixed(2)} USDT
                              </div>
                              <div className="mallstocks-stat-label">Yesterday's team commission</div>
                            </div>
                            <div className="mallstocks-stat-box">
                              <div className="mallstocks-stat-val text-emerald-500 font-bold">
                                +{activeCommission} USDT
                              </div>
                              <div className="mallstocks-stat-label">Order Commission</div>
                            </div>
                          </div>

                          {/* Elevated Product Info Section */}
                          <div className="mallstocks-product-section">
                            <div className="mallstocks-product-mini">
                              <div className="mallstocks-thumb-wrap">
                                <img
                                  src={getProductImage(currentActiveTask)}
                                  alt={displayTitle}
                                  className="mallstocks-thumb"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getProductImage(currentActiveTask);
                                  }}
                                />
                                <span className={`mallstocks-platform-tag ${(displayPlatform || 'ebay').toLowerCase().replace(/\s+/g, '')}`}>
                                  {displayPlatform}
                                </span>
                              </div>
                              <div className="mallstocks-product-details">
                                <div className="mallstocks-task-step-tag">
                                  Task #{completedCount + 1} of {totalQuota}
                                </div>
                                <h4 className="mallstocks-product-title" title={displayTitle}>
                                  {displayTitle}
                                </h4>
                                <div className="mallstocks-pricing-chips">
                                  <span className="price-chip">Order: ${(Number(currentActiveTask.price) || 0).toFixed(2)} USDT</span>
                                  <span className="profit-chip">+{vipRate}% (+${activeCommission} USDT)</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="mallstocks-external-link-btn"
                              onClick={(e) => openProductUrl(currentActiveTask, e)}
                            >
                              <ExternalLink size={13} />
                              <span>Open Live Listing on {displayPlatform} (New Tab)</span>
                            </button>
                          </div>

                          {/* Shortfall Alert if Restricted */}
                          {isRestricted && (
                            <div className="mallstocks-shortfall-alert mb-4">
                              <Lock size={15} className="text-amber-600 flex-shrink-0" />
                              <span>
                                Deposit Required: <strong>${minRequired.toFixed(2)} USDT</strong> (Shortfall: +${shortfall.toFixed(2)} USDT)
                              </span>
                            </div>
                          )}

                          {/* Action Button: Grab The Order Immediately */}
                          <button
                            type="button"
                            className={`mallstocks-grab-btn ${isRestricted ? 'restricted' : ''}`}
                            onClick={() => {
                              setSelectedTask(currentActiveTask);
                              setModalType('task');
                            }}
                          >
                            {isRestricted ? (
                              <>
                                <Lock size={18} />
                                <span>Unlock Order (Deposit +${shortfall.toFixed(0)} USDT)</span>
                              </>
                            ) : (
                              <>
                                <Zap size={18} />
                                <span>Grab The Order Immediately</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}

                    {/* NEXT TASK LOCKED ROADMAP TEASER */}
                    {completedCount + 1 < totalQuota && (
                      <div className="next-task-locked-banner mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-center flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                        <Lock size={14} className="text-slate-400" />
                        <span>
                          Task #{completedCount + 2} is currently locked. It will automatically appear and unlock once you complete Task #{completedCount + 1}. ({totalQuota - completedCount - 1} more tasks in queue)
                        </span>
                      </div>
                    )}

                    {/* COMPLETED TASKS HISTORY (Previous steps completed) */}
                    {completedCount > 0 && (
                      <div className="completed-tasks-history-section mt-5">
                        <h6 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Completed Tasks History ({completedCount})
                        </h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {assignedQueue.slice(0, completedCount).map((doneTask, dIdx) => (
                            <div
                              key={doneTask.id || dIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  ✓
                                </span>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                                    Task #{dIdx + 1}: {(doneTask.title || 'Completed Campaign Task').replace(/^Step\s*\d+\s*:\s*/i, '')}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    Order: ${(Number(doneTask.price) || 0).toFixed(2)} USDT • Commission Credited
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>
                                +${(((Number(doneTask.price) || 0) * 0.04)).toFixed(2)} USDT
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="assigned-footer-actions mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    className="btn-deposit-more"
                    onClick={() => setModalType('deposit')}
                  >
                    <span>Deposit More Funds</span>
                  </button>

                  {supportSettings?.telegram && (
                    <a
                      href={!supportSettings.telegram.includes('websynx') ? supportSettings.telegram : 'https://t.me/ecomxstocks_support'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-telegram-support text-center"
                      style={{ padding: '9px 14px', fontSize: '0.85rem' }}
                    >
                      <Send size={14} />
                      <span>Need Help? Message Customer Support on Telegram</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* POPUP MODAL: Request is Pending Notification */}
      {showPendingModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowPendingModal(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box text-center max-w-sm animate-scale-up" onClick={(e) => e.stopPropagation()} style={{ padding: '24px 20px' }}>
            <div className="flex justify-end">
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowPendingModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 4px 12px rgba(217,119,6,0.15)' }}>
              <Clock size={32} strokeWidth={2.4} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Request Received
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Your request is pending. Admin is reviewing and will assign your task package shortly.
            </p>
            <a
              href={supportSettings?.telegram && !supportSettings.telegram.includes('websynx') ? supportSettings.telegram : 'https://t.me/ecomxstocks_support'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-telegram-support mb-3"
              style={{ padding: '11px 16px', fontSize: '0.92rem' }}
            >
              <Send size={15} />
              <span>Message Support on Telegram</span>
            </a>
            <button
              type="button"
              className="btn-outline w-full"
              style={{ padding: '10px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer' }}
              onClick={() => setShowPendingModal(false)}
            >
              View Request Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
