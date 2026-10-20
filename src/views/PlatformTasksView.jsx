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
  const isAssigned = !!(user?.assignedPackage && user?.taskPackageStatus === 'assigned');
  const isPending = !!(user?.taskPackageRequested || justRequested);

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
      {/* 1. PURPLE HEADER matching User Screenshot */}
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

      {/* 2. MAIN SHEET / WHITE CONTAINER matching User Screenshot */}
      {/* 2. MAIN SHEET / WHITE CONTAINER matching User Screenshot */}
      <div className="platform-tasks-sheet">
        {(() => {
          const completedCount = Number(user?.dailyCompleted ?? user?.completedTasks ?? 0);
          const targetQuota = 25;

          const platformTasks = (tasks || []).filter(
            t => (t.platform || '').toLowerCase() === displayPlatform.toLowerCase()
          );

          let baseQueue = [];
          if (user?.assignedTasks && Array.isArray(user.assignedTasks) && user.assignedTasks.length > 0) {
            baseQueue = user.assignedTasks;
          } else {
            try {
              const cached = localStorage.getItem(`websynx_user_assigned_tasks_${user?.id}`);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) baseQueue = parsed;
              }
            } catch (e) {}
          }

          if (baseQueue.length === 0) {
            if (platformTasks.length >= targetQuota) {
              baseQueue = platformTasks.slice(0, targetQuota);
            } else {
              // Fill with available tasks to guarantee exactly 25 tasks
              const otherTasks = (tasks || []).filter(
                t => (t.platform || '').toLowerCase() !== displayPlatform.toLowerCase()
              );
              const combined = [...platformTasks, ...otherTasks];
              baseQueue = combined.slice(0, targetQuota);
              while (baseQueue.length < targetQuota && combined.length > 0) {
                const needed = targetQuota - baseQueue.length;
                baseQueue = [...baseQueue, ...combined.slice(0, needed)];
              }
            }
          }

          // Ensure exactly 25 items with clean sequential Step titles
          const assignedQueue = baseQueue.map((t, idx) => ({
            ...t,
            platform: t.platform || displayPlatform,
            learningStep: idx + 1,
            title: t.title?.startsWith('Step ') ? t.title : `Step ${idx + 1}: ${t.title || 'Product Promotion Review'}`
          }));

          const totalQuota = assignedQueue.length || 25;
          const progressPct = Math.min(100, Math.round((completedCount / totalQuota) * 100));

          return (
            <div className="assigned-package-content">
              {/* Top Campaign Banner */}
              <div className="assigned-banner">
                <div className="assigned-badge-row">
                  <span className="assigned-tag">{user?.assignedPackage || 'Package 201'}</span>
                  <span className="assigned-status-active">
                    <Sparkles size={13} /> Active Package
                  </span>
                </div>
                <h4>25 {displayPlatform} Tasks Ready</h4>
                <p>Complete tasks sequentially one-by-one to earn commission directly to your balance.</p>

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

              {/* Tasks Queue List */}
              <div className="assigned-tasks-list mt-4">
                <div className="assigned-list-header flex items-center justify-between">
                  <div>
                    <h5>Assigned Task Queue</h5>
                    <p className="text-xs text-slate-500 m-0">
                      {completedCount >= totalQuota
                        ? 'All 25 tasks completed! Great job!'
                        : `Task #${completedCount + 1} is currently active & unlocked. Next tasks unlock strictly 1 by 1.`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    {completedCount} / {totalQuota} Tasks
                  </span>
                </div>

                {/* Active Unlocked Task Hero (when tasks remaining) */}
                {assignedQueue[completedCount] && completedCount < totalQuota && (
                  <div className="active-unlocked-task-hero mt-3 mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 dark:from-purple-950/40 dark:to-indigo-950/40 dark:border-purple-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-600 text-white flex items-center gap-1.5 shadow-sm">
                        <Zap size={13} /> Active Unlocked Task • Step #{completedCount + 1}
                      </span>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                        Task {completedCount + 1} of {totalQuota}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <img
                        src={getProductImage(assignedQueue[completedCount])}
                        alt={assignedQueue[completedCount].title}
                        className="w-16 h-16 rounded-xl object-cover border border-purple-200 shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getProductImage(assignedQueue[completedCount]);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mb-1">
                          {assignedQueue[completedCount].title}
                        </h5>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ${(Number(assignedQueue[completedCount].price) || 0).toFixed(2)} USDT
                          </span>
                          <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            +{assignedQueue[completedCount].yieldRate || `${(assignedQueue[completedCount].commissionRate || 4.0).toFixed(1)}%`} Commission
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-primary text-xs font-bold py-2.5 px-4 rounded-xl shadow-md whitespace-nowrap"
                        onClick={() => {
                          setSelectedTask(assignedQueue[completedCount]);
                          setModalType('task');
                        }}
                      >
                        Start Task →
                      </button>
                    </div>
                  </div>
                )}

                {/* When all tasks are completed */}
                {completedCount >= totalQuota && (
                  <div className="mt-3 mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white mb-2 shadow-sm">
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 className="text-emerald-800 dark:text-emerald-200 font-bold text-base mb-1">All 25 Tasks Completed!</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 m-0">
                      Congratulations! You have successfully completed all sequential tasks in this package. Commissions have been credited to your balance.
                    </p>
                  </div>
                )}

                {/* STRICT SEQUENTIAL PROGRESSION:
                    Only unlocked tasks are visible (all completed tasks + the currently active unlocked task).
                    Future locked tasks remain hidden until the preceding task is submitted! */}
                <div className="task-queue-grid">
                  {assignedQueue
                    .filter((_, idx) => idx <= completedCount)
                    .map((t, idx) => {
                      const taskPrice = Number(t.price) || 0;
                      const explicitDep = Number(t.requiredDeposit || t.required_deposit || 0);
                      const minRequired = explicitDep > 0 ? explicitDep : 0;
                      const userBal = Number(user?.balance) || 0;
                      const isRestricted = minRequired > 0 && userBal < minRequired;

                      const isCompleted = idx < completedCount;
                      const isActive = idx === completedCount;

                      return (
                        <div
                          key={t.id || idx}
                          className={`queue-task-card ${
                            isCompleted
                              ? 'queue-task-completed'
                              : 'queue-task-active ring-2 ring-purple-500 shadow-md'
                          }`}
                          style={{
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (isCompleted) {
                              if (addNotification) {
                                addNotification('Task Completed', `Task #${idx + 1} has already been completed.`, 'info');
                              }
                              return;
                            }
                            setSelectedTask(t);
                            setModalType('task');
                          }}
                        >
                          <div className="queue-task-thumb" style={{ position: 'relative' }}>
                            <img
                              src={getProductImage(t)}
                              alt={t.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getProductImage(t);
                              }}
                            />
                            <span className="queue-order-badge">#{idx + 1}</span>

                            {isCompleted && (
                              <span
                                className="queue-done-badge"
                                title="Task Completed"
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#10b981',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 5px rgba(16, 185, 129, 0.4)'
                                }}
                              >
                                <Check size={13} strokeWidth={3} />
                              </span>
                            )}
                          </div>

                          <div className="queue-task-info">
                            <div className="flex items-center gap-1.5 mb-1">
                              {isCompleted && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                  <CheckCircle2 size={12} /> Completed
                                </span>
                              )}
                              {isActive && (
                                <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded animate-pulse flex items-center gap-1">
                                  <Zap size={11} /> Active Step • Unlocked
                                </span>
                              )}
                            </div>
                            <h6>{t.title}</h6>
                            <div className="queue-task-pricing">
                              <span className="queue-price">${taskPrice.toFixed(2)}</span>
                              <span className="queue-yield">+{t.yieldRate || `${(t.commissionRate || 4.0).toFixed(1)}%`}</span>
                            </div>
                          </div>

                          {isCompleted ? (
                            <div
                              className="queue-start-btn"
                              style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                cursor: 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={13} strokeWidth={2.6} />
                              <span>Done</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={`queue-start-btn ${isRestricted ? 'btn-restricted' : ''}`}
                              style={!isRestricted ? { background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', color: '#fff', fontWeight: '700' } : {}}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(t);
                                setModalType('task');
                              }}
                            >
                              {isRestricted ? `Unlock ($${minRequired.toFixed(0)})` : 'Start Task'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Locked Teaser for next upcoming task */}
                {completedCount < totalQuota && (
                  <div className="next-task-locked-banner mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-center flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <Lock size={13} className="text-slate-400" />
                    <span>
                      Task #{completedCount + 2} will unlock automatically after you complete Task #{completedCount + 1}. ({totalQuota - completedCount - 1} remaining in package)
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="assigned-footer-actions mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-deposit-more"
                  onClick={() => setModalType('deposit')}
                >
                  <span>Deposit More</span>
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
        })()}
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
