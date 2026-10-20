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
    supportSettings
  } = useApp();

  const [requestLoading, setRequestLoading] = useState(false);
  const [justRequested, setJustRequested] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const displayPlatform = platform || 'eBay';

  // 1. Resolve assigned tasks queue from user object, local cache, or platform tasks
  let assignedQueue = [];
  if (Array.isArray(user?.assignedTasks) && user.assignedTasks.length > 0) {
    assignedQueue = user.assignedTasks;
  } else {
    try {
      const cached = localStorage.getItem(`websynx_user_assigned_tasks_${user?.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) assignedQueue = parsed;
      }
    } catch (e) {}
  }

  const allPlatformTasks = (tasks || []).filter(
    t => (t.platform || '').toLowerCase() === displayPlatform.toLowerCase()
  );

  if (assignedQueue.length === 0) {
    if (allPlatformTasks.length >= 25) {
      assignedQueue = allPlatformTasks.slice(0, 25);
    } else {
      const others = (tasks || []).filter(
        t => (t.platform || '').toLowerCase() !== displayPlatform.toLowerCase()
      );
      const combined = [...allPlatformTasks, ...others];
      assignedQueue = combined.slice(0, 25);
      while (assignedQueue.length < 25 && combined.length > 0) {
        assignedQueue = [...assignedQueue, ...combined.slice(0, 25 - assignedQueue.length)];
      }
    }
  }

  // 2. Determine if user has an assigned package:
  // If user has pendingTasks > 0 (e.g. 25 Pending on dashboard) or dailyQuota or completedTasks or assignedPackage:
  const hasQuotaOrPending = (Number(user?.pendingTasks || 0) > 0) ||
                            (Number(user?.dailyQuota || 0) > 0) ||
                            (Number(user?.dailyCompleted || user?.completedTasks || 0) > 0) ||
                            !!user?.assignedPackage ||
                            user?.taskPackageStatus === 'assigned';

  const isAssigned = hasQuotaOrPending && assignedQueue.length > 0;
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
          <span className="platform-balance-caption">Account Balance</span>
          <div className="platform-balance-value">
            {(Number(user?.balance) || 0).toFixed(2)} USDT
          </div>
        </div>
      </div>

      {/* 2. MAIN SHEET */}
      <div className="platform-tasks-sheet">
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

                    {currentActiveTask && (
                      <div className="active-unlocked-task-hero p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-400 dark:from-purple-950/40 dark:to-indigo-950/40 dark:border-purple-800 shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-600 text-white flex items-center gap-1.5 shadow-sm">
                            <Zap size={13} /> Active Unlocked Task • Step #{completedCount + 1}
                          </span>
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            {completedCount} Completed • {totalQuota - completedCount} Remaining
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <img
                            src={getProductImage(currentActiveTask)}
                            alt={currentActiveTask.title}
                            className="w-20 h-20 rounded-xl object-cover border border-purple-200 shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getProductImage(currentActiveTask);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate mb-1">
                              {currentActiveTask.title}
                            </h5>
                            <div className="flex items-center gap-3 text-xs mb-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                Order: ${(Number(currentActiveTask.price) || 0).toFixed(2)} USDT
                              </span>
                              <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                                +{currentActiveTask.yieldRate || `${(currentActiveTask.commissionRate || 4.0).toFixed(1)}%`} Commission
                              </span>
                            </div>

                            {/* Required Deposit Warning if balance insufficient */}
                            {isRestricted ? (
                              <div style={{
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                color: '#92400e',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <Lock size={12} />
                                <span>Deposit Required to Unlock: <strong>${minRequired.toFixed(2)} USDT</strong> (Shortfall: +${shortfall.toFixed(2)})</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                                ✓ Balance Verified • Ready to submit review
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className={`btn-primary text-xs font-bold py-3 px-5 rounded-xl shadow-md whitespace-nowrap ${isRestricted ? 'btn-restricted' : ''}`}
                            onClick={() => {
                              setSelectedTask(currentActiveTask);
                              setModalType('task');
                            }}
                          >
                            {isRestricted ? `Unlock Task (+$${shortfall.toFixed(0)})` : `Start Task #${completedCount + 1} →`}
                          </button>
                        </div>
                      </div>
                    )}

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
                                    Task #{dIdx + 1}: {doneTask.title}
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
