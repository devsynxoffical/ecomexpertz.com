import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  QrCode,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Shield,
  Download,
  Smartphone,
  Star,
  Zap,
  CheckCircle2,
  Lock,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Award,
  Sparkles,
  User,
  Users,
  Share2,
  Layers,
  Clock,
  Eye,
  EyeOff,
  Mail,
  Key,
  Gift,
  ExternalLink,
  ShoppingBag,
  Send,
  CheckCircle
} from 'lucide-react';
import { getProductUrl, openProductUrl, getProductImage } from '../utils/productUrl';

export default function Modals() {
  const {
    modalType,
    setModalType,
    selectedTask,
    setSelectedTask,
    user,
    setUser,
    submitDeposit,
    submitWithdrawal,
    completeTask,
    setDashboardTab,
    setCurrentView,
    currentView,
    authMode,
    setAuthMode
  } = useApp();

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (modalType) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalType]);

  if (!modalType) return null;

  const modalMarkup = (
    <div className="modal-overlay animate-fade-in" onClick={() => setModalType(null)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {modalType === 'deposit' && <DepositModal onClose={() => setModalType(null)} />}
        {modalType === 'withdraw' && <WithdrawModal onClose={() => setModalType(null)} />}
        {modalType === 'task' && <TaskExecutionModal task={selectedTask} onClose={() => setModalType(null)} />}
        {modalType === 'apk' && <ApkModal onClose={() => setModalType(null)} />}
        {modalType === 'kyc' && <KycModal onClose={() => setModalType(null)} />}
        {(modalType === 'auth' || modalType === 'seller') && (
          <AuthModal 
            initialRegister={authMode === 'register' || modalType === 'seller'} 
            onClose={() => {
              setModalType(null);
              if (setAuthMode) setAuthMode('login');
            }} 
          />
        )}
        {(modalType === 'team' || modalType === 'referral' || modalType === 'invite') && (
          <ReferralTeamModal onClose={() => setModalType(null)} />
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
}

// 1. USDT CRYPTO DEPOSIT MODAL
function DepositModal({ onClose }) {
  const { submitDeposit, user, systemDepositAccounts, setDashboardTab } = useApp();
  const [network, setNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('100.00');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(null);

  const depositAddress = network === 'ERC20'
    ? (systemDepositAccounts?.erc20Address || '0x71C94156b53982e0C63810a972c72b04B46bF022')
    : network === 'BEP20'
    ? (systemDepositAccounts?.bep20Address || '0x71C94156b53982e0C63810a972c72b04B46bF022')
    : (systemDepositAccounts?.trc20Address || 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q');

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isSubmitting || !numAmt || numAmt <= 0) return;
    setIsSubmitting(true);
    try {
      const rec = await submitDeposit(numAmt, txHash, network);
      setSubmittedCode(rec?.code || rec?.id || 'DEP-PENDING');
    } catch (err) {
      console.error('Failed to submit deposit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedCode) {
    const displayCode = typeof submittedCode === 'object'
      ? (submittedCode?.code || submittedCode?.id || 'DEP-PENDING')
      : String(submittedCode || 'DEP-PENDING');

    return (
      <div className="modal-box text-center">
        <div className="modal-header">
          <h3>Payment Request Sent</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="success-icon-wrap">
          <CheckCircle2 size={54} color="#10b981" />
        </div>
        <h4 className="mt-3">Payment Request Sent Successfully</h4>
        <p className="modal-desc">
          Your payment deposit request of <strong>{parseFloat(amount || 0).toFixed(2)} USDT</strong> has been submitted for network verification under record:
        </p>
        <div className="code-pill mt-2">
          <code>{displayCode}</code>
        </div>
        <div className="alert-box-info mt-4">
          <AlertCircle size={16} />
          <span>Status: <strong>Payment request submitted. Awaiting network confirmation.</strong> Your balance will update automatically upon verification.</span>
        </div>
        <div className="modal-btn-row mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-primary w-full" onClick={() => {
            onClose();
            setDashboardTab('platform-tasks');
          }}>
            Go to Tasks & Request Package →
          </button>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => {
              onClose();
              setDashboardTab('records');
            }}>
              Check in Records
            </button>
            <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-box max-w-lg">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-blue">
            <Wallet size={18} />
          </div>
          <div>
            <h3>Deposit USDT</h3>
            <span className="sub-text">Top-up balance securely via cryptocurrency gateway (TRC20, ERC20, BEP20)</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="real-deposit-section animate-fade-in">
        <div className="network-selector mt-3">
          <label className="input-label">Select Network</label>
          <div className="network-pills">
            <button
              type="button"
              className={`net-pill ${network === 'TRC20' ? 'active' : ''}`}
              onClick={() => setNetwork('TRC20')}
            >
              <span>TRON (TRC20)</span>
              <span className="badge-rec">Recommended</span>
            </button>
            <button
              type="button"
              className={`net-pill ${network === 'ERC20' ? 'active' : ''}`}
              onClick={() => setNetwork('ERC20')}
            >
              <span>Ethereum (ERC20)</span>
            </button>
            <button
              type="button"
              className={`net-pill ${network === 'BEP20' ? 'active' : ''}`}
              onClick={() => setNetwork('BEP20')}
            >
              <span>BNB Chain (BEP20)</span>
            </button>
          </div>
        </div>

        {/* QR Code and Address Box */}
        <div className="deposit-qr-card mt-3">
          <div className="qr-visual">
            <div className="qr-fake-code">
              <svg viewBox="0 0 100 100" className="qr-svg">
                <rect x="5" y="5" width="25" height="25" fill="#111" />
                <rect x="9" y="9" width="17" height="17" fill="#fff" />
                <rect x="13" y="13" width="9" height="9" fill="#111" />

                <rect x="70" y="5" width="25" height="25" fill="#111" />
                <rect x="74" y="9" width="17" height="17" fill="#fff" />
                <rect x="78" y="13" width="9" height="9" fill="#111" />

                <rect x="5" y="70" width="25" height="25" fill="#111" />
                <rect x="9" y="74" width="17" height="17" fill="#fff" />
                <rect x="13" y="78" width="9" height="9" fill="#111" />

                <circle cx="45" cy="15" r="3" fill="#2563eb" />
                <circle cx="55" cy="22" r="3" fill="#111" />
                <circle cx="40" cy="45" r="4" fill="#2563eb" />
                <circle cx="50" cy="50" r="5" fill="#111" />
                <circle cx="60" cy="45" r="4" fill="#2563eb" />
                <circle cx="45" cy="85" r="3" fill="#111" />
                <circle cx="75" cy="75" r="3" fill="#111" />
                <circle cx="85" cy="85" r="3" fill="#111" />
              </svg>
            </div>
            <span className="qr-scan-label">Scan to transfer USDT</span>
          </div>

          <div className="deposit-address-box">
            <span className="addr-label">Deposit {network} Address</span>
            <div className="addr-input-row">
              <span className="addr-code">{depositAddress}</span>
              <button className="copy-btn" onClick={handleCopy} title="Copy Address">
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="deposit-form mt-4">
          <label className="input-label">Deposit Amount (USDT)</label>
          <div className="amount-input-wrap">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              step="0.01"
              min="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-input-field"
              required
            />
            <span className="currency-suffix">USDT</span>
          </div>

          <div className="quick-amount-row mt-2">
            {['50', '100', '250', '500', '1000'].map((val) => (
              <button
                type="button"
                key={val}
                className={`preset-btn ${parseFloat(amount) === parseFloat(val) ? 'selected' : ''}`}
                onClick={() => setAmount(Number(val).toFixed(2))}
              >
                +${val}
              </button>
            ))}
          </div>

          <div className="input-group mt-3">
            <label className="input-label">
              Blockchain Transaction ID / TX Hash <span className="text-muted">(Optional)</span>
            </label>
            <div className="input-icon-field-wrap">
              <Key size={16} className="input-field-left-icon" />
              <input
                type="text"
                placeholder="e.g. 0x8f2d...c34b"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="text-input-field with-icon"
              />
            </div>
          </div>

          <div className="notice-box mt-3">
            <AlertCircle size={15} />
            <span>Send only USDT ({network}) to this address. Minimum deposit is 10 USDT. Credited immediately upon network confirmation.</span>
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying & Submitting...' : `Confirm ${network} Deposit`}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. USDT TRC20 WITHDRAWAL MODAL
function WithdrawModal({ onClose }) {
  const { user, submitWithdrawal, setDashboardTab } = useApp();
  const [address, setAddress] = useState(user.walletAddress || '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(null);

  const numAmount = parseFloat(amount) || 0;
  const fee = 1.00; // 1 USDT network fee
  const netReceived = Math.max(0, numAmount - fee);

  const handleMax = () => {
    setAmount(user.balance.toFixed(2));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (numAmount < 10) {
      setError('Minimum withdrawal amount is 10.00 USDT');
      return;
    }

    if (numAmount > user.balance) {
      setError('Withdrawal amount exceeds your current available balance');
      return;
    }

    if (!address.startsWith('T') || address.length < 20) {
      setError('Please provide a valid TRON TRC20 address starting with "T"');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const rec = submitWithdrawal(numAmount, address, 'TRC20');
        setIsSubmitting(false);
        setSubmittedCode(rec.code);
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
      }
    }, 600);
  };

  if (submittedCode) {
    return (
      <div className="modal-box text-center">
        <div className="modal-header">
          <h3>Payment Request Sent</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="success-icon-wrap">
          <CheckCircle2 size={54} color="#10b981" />
        </div>
        <h4 className="mt-3">Payment Request Sent Successfully</h4>
        <p className="modal-desc">
          Your payment withdrawal request of <strong>{numAmount} USDT</strong> ({netReceived.toFixed(2)} USDT net) has been submitted for network settlement processing:
        </p>
        <div className="code-pill mt-2">
          <code>{submittedCode}</code>
        </div>
        <div className="alert-box-info mt-4">
          <Shield size={16} />
          <span>Security Notice: All withdrawals undergo multi-signature audit before broadcast to TRON mainnet.</span>
        </div>
        <div className="modal-btn-row mt-4">
          <button className="btn-outline w-full" onClick={() => {
            onClose();
            setDashboardTab('records');
          }}>
            Check in Records
          </button>
          <button className="btn-primary w-full" onClick={onClose}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-box">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-red">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <h3>USDT Withdrawal</h3>
            <span className="sub-text">Transfer funds to your external TRC20 wallet</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="balance-summary-card mt-3">
        <div className="balance-info-left">
          <span className="bal-label">Available Balance</span>
          <strong className="bal-val">${user.balance.toFixed(2)} <span className="bal-unit">USDT</span></strong>
        </div>
        <div className="vip-badge-pill">
          <span>Tier: {user.vipLevel}</span>
        </div>
      </div>

      {error && (
        <div className="error-banner mt-3 animate-fade-in">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="withdraw-form mt-3">
        <div className="input-group">
          <label className="input-label">Destination TRON TRC20 Wallet Address</label>
          <div className="input-icon-field-wrap">
            <Wallet size={16} className="input-field-left-icon" />
            <input
              type="text"
              placeholder="T..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-input-field with-icon"
              required
            />
          </div>
        </div>

        <div className="input-group mt-3">
          <div className="label-with-action">
            <label className="input-label">Withdrawal Amount</label>
            <button type="button" className="max-btn" onClick={handleMax}>USE MAX</button>
          </div>
          <div className="amount-input-wrap">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              step="0.01"
              min="10"
              max={user.balance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-input-field"
              required
            />
            <span className="currency-suffix">USDT</span>
          </div>
        </div>

        {/* Calculation summary */}
        <div className="fee-breakdown mt-3">
          <div className="breakdown-row">
            <span>Requested Amount:</span>
            <span>{numAmount.toFixed(2)} USDT</span>
          </div>
          <div className="breakdown-row">
            <span>TRON Gas / Platform Fee:</span>
            <span>{numAmount > 0 ? `${fee.toFixed(2)} USDT` : '0.00 USDT'}</span>
          </div>
          <div className="breakdown-divider"></div>
          <div className="breakdown-row total">
            <span>Estimated Received:</span>
            <strong className="text-primary-brand">{netReceived.toFixed(2)} USDT</strong>
          </div>
        </div>

        <button
          type="submit"
          className="btn-danger w-full mt-4"
          disabled={isSubmitting || user.balance <= 0}
        >
          {isSubmitting ? 'Authorizing Request...' : 'Confirm & Request Withdrawal'}
        </button>
      </form>
    </div>
  );
}

// 3. TASK GRAB & SUBMISSION WORKFLOW MODAL
function TaskExecutionModal({ task, onClose }) {
  const { user, completeTask, vipTiers, setDashboardTab, setCurrentView, setModalType, tasks, setSelectedTask } = useApp();
  const [currentTask, setCurrentTask] = useState(task);
  const [progress, setProgress] = useState(0);
  const [earnedCommission, setEarnedCommission] = useState(0);
  const [countdown, setCountdown] = useState(3);

  // Sync if prop changes
  React.useEffect(() => {
    if (task && task.id !== currentTask?.id) {
      setCurrentTask(task);
      setProgress(0);
      setEarnedCommission(0);
    }
  }, [task]);

  // Balance & Deposit restriction check (only locks when Admin explicitly sets a requirement):
  const userBalance = Number(user?.balance || 0);
  const taskPrice = Number(currentTask?.price || 0);
  const rawDeposit = Number(currentTask?.requiredDeposit || currentTask?.required_deposit || 0);
  const explicitDeposit = currentTask?.adminCustomized === true || (!currentTask?.isLearning && rawDeposit > 0)
    ? rawDeposit
    : 0;
  const minRequiredBalance = explicitDeposit > 0 ? explicitDeposit : 0;
  const isDepositRestricted = currentTask && minRequiredBalance > 0 && userBalance < minRequiredBalance;
  const shortfall = Math.max(0, minRequiredBalance - userBalance);

  const [step, setStep] = useState(isDepositRestricted ? 'ready' : 'match'); // 'match' -> 'ready' -> 'processing' -> 'success'

  // Auto transition from radar matching to ready if not restricted
  React.useEffect(() => {
    if (isDepositRestricted) {
      setStep('ready');
    } else if (step === 'match') {
      const timer = setTimeout(() => {
        setStep('ready');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, isDepositRestricted, currentTask?.id]);

  // Current tier info
  const userVip = (user?.vipLevel || '').toLowerCase();
  const currentTier = vipTiers?.find(t => (t.name || '').toLowerCase() === userVip) || vipTiers?.[0] || { commissionRate: 4.0 };
  const commissionRate = currentTier?.commissionRate || 4.0;
  const calculatedCommission = currentTask ? parseFloat((((Number(currentTask.price) || 0) * commissionRate) / 100).toFixed(2)) : 0;

  // Queue and Next Task discovery - exactly matches PlatformTasksView 25-task queue
  const platform = currentTask?.platform || 'eBay';
  const allPlatformTasks = (tasks || []).filter(
    t => (t.platform || '').toLowerCase() === platform.toLowerCase()
  );
  let queue = [];
  if (user?.assignedTasks && Array.isArray(user.assignedTasks) && user.assignedTasks.length > 0) {
    queue = user.assignedTasks;
  } else {
    try {
      const cached = localStorage.getItem(`websynx_user_assigned_tasks_${user?.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) queue = parsed;
      }
    } catch (e) {}
  }

  if (queue.length === 0) {
    if (allPlatformTasks.length >= 25) {
      queue = allPlatformTasks.slice(0, 25);
    } else {
      const others = (tasks || []).filter(
        t => (t.platform || '').toLowerCase() !== platform.toLowerCase()
      );
      const combined = [...allPlatformTasks, ...others];
      queue = combined.slice(0, 25);
      while (queue.length < 25 && combined.length > 0) {
        queue = [...queue, ...combined.slice(0, 25 - queue.length)];
      }
    }
  }

  const currentTaskIndex = queue.findIndex(t => String(t.id) === String(currentTask?.id));
  const completedCount = Number(user?.dailyCompleted ?? user?.completedTasks ?? 0);
  const isLockedSequential = currentTaskIndex > completedCount;
  const isAlreadyDone = currentTaskIndex >= 0 && currentTaskIndex < completedCount;
  const nextTaskIndex = currentTaskIndex >= 0 && currentTaskIndex < queue.length - 1 ? currentTaskIndex + 1 : 0;
  const nextTask = queue[nextTaskIndex] || null;
  const hasNextTask = nextTask && String(nextTask.id) !== String(currentTask?.id);
  const currentTaskNumber = currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentTask?.learningStep || 1);
  const nextTaskNumber = currentTaskIndex >= 0 ? (currentTaskIndex + 2 <= queue.length ? currentTaskIndex + 2 : 1) : 2;

  const handleGoToNextTask = (targetTask = nextTask) => {
    if (!targetTask) {
      onClose();
      return;
    }
    setCurrentTask(targetTask);
    if (setSelectedTask) setSelectedTask(targetTask);
    setProgress(0);
    setEarnedCommission(0);

    const targetExplicit = Number(targetTask.requiredDeposit || targetTask.required_deposit || 0);
    const targetMin = targetExplicit > 0 ? targetExplicit : 0;
    const updatedBal = Number(user?.balance || 0);

    setStep('ready');
  };

  // Auto-close modal on success after showing completion, returning to previous task screen
  React.useEffect(() => {
    if (step === 'success') {
      setCountdown(2);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, onClose]);

  const handleSubmitTask = () => {
    if (isDepositRestricted) return;

    setStep('processing');
    setProgress(20);

    const int1 = setTimeout(() => setProgress(50), 300);
    const int2 = setTimeout(() => setProgress(85), 650);
    const int3 = setTimeout(async () => {
      setProgress(100);
      try {
        const earned = await completeTask(currentTask);
        const finalEarned = typeof earned === 'number' ? earned : (parseFloat(earned) || calculatedCommission);
        setEarnedCommission(finalEarned);
        setStep('success');

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      } catch (err) {
        console.error('completeTask error:', err);
        setEarnedCommission(calculatedCommission);
        setStep('success');
      }
    }, 1000);

    return () => {
      clearTimeout(int1);
      clearTimeout(int2);
      clearTimeout(int3);
    };
  };

  if (!currentTask) return null;

  return (
    <div className="modal-box task-modal">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-blue">
            <Zap size={18} />
          </div>
          <div>
            <h3>Task Engine • #{currentTaskNumber}</h3>
            <span className="sub-text">{currentTask.platform} Campaign • Item {currentTaskNumber} of {queue.length || 25}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      {/* LEARNING / PROGRESSIVE STEP BANNER */}
      {currentTask.isLearning && (
        <div className="learning-task-top-strip mt-2">
          <div className="learning-strip-icon">🎓</div>
          <div className="learning-strip-text">
            <strong>Beginner Learning Campaign (Step #{currentTask.learningStep || currentTaskNumber} of 25)</strong>
            <span>Order Value: ${taskPrice.toFixed(2)} USDT</span>
          </div>
        </div>
      )}

      {step === 'match' && !isDepositRestricted && (
        <div className="task-step-matching py-8 text-center">
          <div className="radar-spinner-wrap">
            <div className="radar-circle"></div>
            <div className="radar-circle delay-1"></div>
            <div className="radar-center-icon">
              <TrendingUp size={28} color="#2563eb" />
            </div>
          </div>
          <h4 className="mt-4">Matching Campaign Order #{currentTaskNumber}...</h4>
          <p className="modal-desc">
            Allocating verified website product review from <strong>{currentTask.platform}</strong> merchant network.
          </p>
        </div>
      )}

      {step === 'ready' && (
        <div className="task-step-ready mt-3">
          {/* 1. ALREADY COMPLETED STATE */}
          {isAlreadyDone ? (
            <div className="deposit-restriction-card animate-fade-in text-center p-6">
              <div className="lock-icon-hero" style={{ background: '#ecfdf5', color: '#10b981', margin: '0 auto 12px auto' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className="mt-2 font-bold text-emerald-700" style={{ fontSize: '1.2rem' }}>
                Task #{currentTaskNumber} Already Completed
              </h3>
              <p className="modal-desc mt-2" style={{ color: '#64748b', fontSize: '0.92rem' }}>
                You have already submitted this task and your commission has been credited to your balance.
              </p>
              <div className="restriction-actions-grid mt-4">
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    const activeTask = queue[completedCount];
                    if (activeTask) {
                      handleGoToNextTask(activeTask);
                    } else {
                      onClose();
                    }
                  }}
                >
                  <Zap size={15} />
                  <span>Go to Task #{completedCount + 1} (Active Step)</span>
                </button>
              </div>
            </div>
          ) : isLockedSequential ? (
            /* 2. LOCKED SEQUENTIAL BARRIER: Shown when user tries to access a task ahead of their completed sequence */
            <div className="deposit-restriction-card animate-fade-in text-center p-6">
              <div className="lock-icon-hero" style={{ background: '#f1f5f9', color: '#64748b', margin: '0 auto 12px auto' }}>
                <Lock size={36} />
              </div>
              <h3 className="mt-2 font-bold text-slate-800 dark:text-slate-100" style={{ fontSize: '1.2rem' }}>
                Task #{currentTaskNumber} is Locked
              </h3>
              <p className="modal-desc mt-2" style={{ color: '#64748b', fontSize: '0.92rem' }}>
                Tasks unlock strictly 1 by 1. Please complete <strong>Task #{completedCount + 1}</strong> first to unlock this task sequentially.
              </p>
              <div className="restriction-actions-grid mt-4">
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    const activeTask = queue[completedCount];
                    if (activeTask) {
                      handleGoToNextTask(activeTask);
                    } else {
                      onClose();
                    }
                  }}
                >
                  <Zap size={15} />
                  <span>Switch to Task #{completedCount + 1} (Active Step)</span>
                </button>
              </div>
            </div>
          ) : isDepositRestricted ? (
            <div className="deposit-restriction-card animate-fade-in">
              <div className="lock-icon-hero">
                <Lock size={36} color="#d97706" />
              </div>
              <h3 className="mt-2 text-amber-warning font-bold">Deposit Required to Unlock Task</h3>
              <p className="modal-desc mt-1">
                Your available balance is <strong>${userBalance.toFixed(2)} USDT</strong>.
                This task requires a minimum balance of <strong>${minRequiredBalance.toFixed(2)} USDT</strong>.
                Please deposit the required funds to unlock and complete this campaign task.
              </p>

              <div className="restriction-breakdown-box mt-3">
                <div className="breakdown-row">
                  <span>Required Account Balance:</span>
                  <strong>${minRequiredBalance.toFixed(2)} USDT</strong>
                </div>
                <div className="breakdown-row">
                  <span>Your Current Balance:</span>
                  <span className="text-red-danger font-bold">${userBalance.toFixed(2)} USDT</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-row total">
                  <span>Required Deposit to Unlock:</span>
                  <strong className="text-primary-brand">+${shortfall.toFixed(2)} USDT</strong>
                </div>
              </div>

              <div className="restriction-actions-grid mt-4">
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    onClose();
                    setModalType('deposit');
                  }}
                >
                  <Wallet size={15} />
                  <span>Deposit USDT to Unlock Task (+${shortfall.toFixed(2)})</span>
                </button>
              </div>

              {/* Direct Store Link Action */}
              <div className="task-external-action-bar mt-2">
                <button
                  type="button"
                  className="btn-visit-store-link"
                  onClick={(e) => openProductUrl(currentTask, e)}
                >
                  <ExternalLink size={14} />
                  <span>Open Live Listing on {currentTask.platform} (New Tab)</span>
                </button>
              </div>

              <div className="note-sub-text mt-3 text-center">
                <span>Deposit via TRC20, ERC20 or BEP20 to automatically unlock this campaign task.</span>
              </div>
            </div>
          ) : (
            <>
              <div className="task-preview-card" onClick={(e) => openProductUrl(currentTask, e)} style={{ cursor: 'pointer' }} title={`Click to view live listing on ${currentTask.platform}`}>
                <div className="task-img-wrap">
                  <img
                    src={getProductImage(currentTask)}
                    alt={currentTask.title}
                    className="task-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getProductImage(currentTask);
                    }}
                  />
                  <span className={`platform-badge-pill ${(currentTask?.platform || 'ebay').toLowerCase()}`}>
                    {currentTask?.platform || 'eBay'}
                  </span>
                  <div className="task-img-hover-overlay">
                    <ExternalLink size={16} />
                    <span>View Product ↗</span>
                  </div>
                </div>
                <div className="task-info">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="task-tag-chip">{currentTask.category || 'Promotional Campaign'}</span>
                      <span className="badge-learning">Task #{currentTaskNumber}</span>
                    </div>
                    <span className="live-link-pill">
                      <span>Live Item</span>
                      <ExternalLink size={11} />
                    </span>
                  </div>
                  <h4 className="task-title-clamp">{currentTask.title}</h4>
                  <div className="task-specs-row">
                    <div>
                      <span className="spec-label">Listing Value</span>
                      <strong className="spec-val">${parseFloat(currentTask.price).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="spec-label">Commission Rate</span>
                      <strong className="spec-rate">{commissionRate}%</strong>
                    </div>
                    <div>
                      <span className="spec-label">Net Profit</span>
                      <strong className="spec-profit">+${calculatedCommission.toFixed(2)} USDT</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Store Link Action */}
              <div className="task-external-action-bar mt-2">
                <button
                  type="button"
                  className="btn-visit-store-link"
                  onClick={(e) => openProductUrl(currentTask, e)}
                >
                  <ExternalLink size={14} />
                  <span>Open Live Listing on {currentTask.platform} (New Tab)</span>
                </button>
              </div>

              <div className="daily-quota-banner mt-3">
                <div className="quota-text">
                  <span>Daily Tasks: <strong>{user.dailyCompleted || 0} / {user.dailyQuota || 25}</strong></span>
                  <span className="quota-percent">{Math.round(((user.dailyCompleted || 0) / (user.dailyQuota || 25)) * 100)}% Complete</span>
                </div>
                <div className="quota-bar">
                  <div
                    className="quota-fill"
                    style={{ width: `${Math.min(100, ((user.dailyCompleted || 0) / (user.dailyQuota || 25)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="order-disclaimer mt-3">
                <Shield size={14} />
                <span>Promoting this website listing boosts merchant search visibility. Commission will be instantly released to your wallet.</span>
              </div>

              <button className="btn-primary w-full mt-4" onClick={handleSubmitTask}>
                <span>Submit Rating & Claim +${calculatedCommission.toFixed(2)} USDT</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {step === 'processing' && (
        <div className="task-step-processing py-8 text-center">
          <div className="processing-indicator">
            <RefreshCw size={36} className="spin-icon" color="#2563eb" />
          </div>
          <h4 className="mt-4">Synchronizing with {currentTask.platform} API...</h4>
          <p className="modal-desc">
            Processing promotional score, updating merchant search rank, and crediting commission.
          </p>
          <div className="progress-bar-wrap mt-4">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-label">{progress}% completed</span>
        </div>
      )}

      {step === 'success' && (
        <div className="task-step-success py-4 text-center animate-fade-in">
          <div className="success-badge-large">
            <Star size={42} fill="#ffb703" color="#ffb703" />
          </div>
          <h3 className="mt-3">Task #{currentTaskNumber} Completed!</h3>
          <p className="modal-desc">Your commission has been credited directly to your available balance.</p>

          <div className="profit-highlight-card mt-3">
            <span className="highlight-label">Commission Earned</span>
            <div className="profit-amount">+${(typeof earnedCommission === 'number' ? earnedCommission : parseFloat(earnedCommission || calculatedCommission || 0)).toFixed(2)} <span className="highlight-unit">USDT</span></div>
            <div className="tier-info-sub">
              <span>New Available Balance: <strong>${(Number(user?.balance) || 0).toFixed(2)} USDT</strong></span>
            </div>
          </div>

          {/* Return notice */}
          <div className="mt-4 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/50 text-center">
            <span className="text-xs text-slate-500 font-medium">
              Task completed successfully! Returning to tasks in {countdown}s...
            </span>
          </div>

          <div className="modal-btn-row mt-4">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={onClose}
            >
              <span>Back to Tasks</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mt-3">
            <button
              type="button"
              className="btn-outline text-xs py-2 w-full"
              onClick={() => {
                onClose();
                setCurrentView('dashboard');
                setDashboardTab('records');
              }}
            >
              View in Records
            </button>
            <button
              type="button"
              className="btn-outline text-xs py-2 w-full"
              onClick={onClose}
            >
              Exit to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. ANDROID APK DOWNLOAD MODAL
function ApkModal({ onClose }) {
  return (
    <div className="modal-box apk-modal">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-green">
            <Smartphone size={18} />
          </div>
          <div>
            <h3>Download Android App</h3>
            <span className="sub-text">Ecomxstocks Mobile Task & Wallet APK</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="apk-content-card mt-3">
        <div className="apk-banner">
          <div className="android-robot-icon">🤖</div>
          <div className="apk-version-info">
            <h4>Ecomxstocks Android APK</h4>
            <div className="apk-tags">
              <span className="apk-tag">v2.4.0 Release</span>
              <span className="apk-tag">18.4 MB</span>
              <span className="apk-tag verified">Verified Safe</span>
            </div>
          </div>
        </div>

        <p className="apk-description mt-3">
          Enjoy faster 1-click task grabbing, push notifications for deposits and withdrawals, and biometrics login on your Android device.
        </p>

        <div className="apk-qr-row mt-3">
          <div className="apk-qr-box">
            <QrCode size={90} color="#0f172a" />
            <span>Scan to Install</span>
          </div>
          <div className="apk-steps">
            <div className="step-item">
              <span className="step-num">1</span>
              <span>Download the official <strong>.apk</strong> file</span>
            </div>
            <div className="step-item">
              <span className="step-num">2</span>
              <span>Allow "Install unknown apps" in Android Settings</span>
            </div>
            <div className="step-item">
              <span className="step-num">3</span>
              <span>Launch and log in with your referral code</span>
            </div>
          </div>
        </div>

        <a
          href="#download-apk"
          className="btn-primary w-full mt-4 flex-center"
          onClick={(e) => {
            e.preventDefault();
            alert('Starting download: Ecomxstocks-v2.4.0.apk (18.4MB)');
            onClose();
          }}
        >
          <Download size={18} />
          <span>Download APK File (v2.4.0)</span>
        </a>
      </div>
    </div>
  );
}

// 5. KYC VERIFICATION MODAL
function KycModal({ onClose }) {
  const { user, setUser, addNotification } = useApp();
  const [docType, setDocType] = useState('passport');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser(prev => ({ ...prev, kycStatus: 'Verified' }));
    addNotification('KYC Verified', 'Your identity verification documents were approved.');
    setSubmitted(true);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="modal-box">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-blue">
            <Shield size={18} />
          </div>
          <div>
            <h3>Identity Verification (KYC)</h3>
            <span className="sub-text">Tier 2 AML & Compliance Verification</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <CheckCircle2 size={50} color="#10b981" />
          <h4 className="mt-3">Verification Complete</h4>
          <p className="modal-desc">Your account has been upgraded to KYC Verified status.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="kyc-form mt-3">
          <div className="input-group">
            <label className="input-label">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="text-input-field"
            >
              <option value="passport">International Passport</option>
              <option value="id_card">National Identity Card</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>

          <div className="upload-box mt-3">
            <input type="file" className="file-input" />
            <div className="upload-prompt">
              <Download size={24} color="#2563eb" />
              <span>Click or drag front photo of document</span>
              <span className="text-muted text-xs">JPG, PNG or PDF up to 10MB</span>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4">
            Submit Documents for Instant Review
          </button>
        </form>
      )}
    </div>
  );
}

// 6. AUTH / SIGN IN & ACCOUNT CREATION MODAL
function AuthModal({ onClose, initialRegister = false }) {
  const {
    user,
    registerAccount,
    loginAccount,
    switchUser,
    adminUsers,
    setCurrentView,
    setDashboardTab,
    authMode,
    setAuthMode
  } = useApp();

  const getStoredInviteCode = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('invite') || params.get('code');
      if (urlRef) return urlRef.trim();
      return (sessionStorage.getItem('websynx_ref_code') || localStorage.getItem('websynx_ref_code') || '').trim();
    } catch (e) {
      return '';
    }
  };

  const storedInvite = getStoredInviteCode();

  const [isRegister, setIsRegister] = useState(() => {
    return Boolean(initialRegister || authMode === 'register' || storedInvite);
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState(storedInvite);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegister) {
      if (!name.trim()) {
        setError('Please choose a unique username');
        return;
      }
      if (adminUsers && adminUsers.some(u => (u.name || '').trim().toLowerCase() === name.trim().toLowerCase())) {
        setError(`Username "${name.trim()}" is already taken. Please choose a unique username.`);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }
      const cleanInvite = (inviteCode || '').trim();
      if (!cleanInvite) {
        setError('Please enter a valid invitation / referral code. An invitation code is required to sign up.');
        return;
      }
      if (!agreeTerms) {
        setError('You must agree to the Ecomxstocks Terms of Service');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const finalInvite = inviteCode.trim();
        const newUser = await registerAccount(name.trim(), email.trim(), password, finalInvite);
        setSuccessMsg(`Welcome ${newUser.name}! Your Ecomxstocks account & TRON TRC20 wallet have been created. Redirecting to your dashboard...`);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (err) {}
        setTimeout(() => {
          setLoading(false);
          onClose();
          setCurrentView('dashboard');
          setDashboardTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
      } else {
        await loginAccount(email, password);
        setSuccessMsg('Login successful! Redirecting to your dashboard...');
        setTimeout(() => {
          setLoading(false);
          onClose();
          setCurrentView('dashboard');
          setDashboardTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-box max-w-md auth-modal-box animate-scale-up">
      {/* Header */}
      <div className="modal-header auth-modal-header">
        <div className="header-with-icon">
          <div className="auth-icon-badge">
            {isRegister ? <Sparkles size={20} className="text-primary-brand" /> : <Lock size={20} className="text-primary-brand" />}
          </div>
          <div>
            <h3 className="auth-title">{isRegister ? 'Create New Account' : 'Welcome Back'}</h3>
            <span className="auth-subtitle">
              {isRegister ? 'Auto-generates TRON TRC20 wallet on registration' : 'Sign in to access your dashboard & tasks'}
            </span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
      </div>

      {/* Modern iOS/Fintech Segmented Switcher */}
      <div className="auth-segmented-track mt-4">
        <button
          type="button"
          className={`auth-segment-btn ${!isRegister ? 'active' : ''}`}
          onClick={() => {
            setIsRegister(false);
            if (setAuthMode) setAuthMode('login');
            setError('');
            setSuccessMsg('');
          }}
        >
          <Key size={15} />
          <span>Sign In (Login)</span>
        </button>
        <button
          type="button"
          className={`auth-segment-btn ${isRegister ? 'active' : ''}`}
          onClick={() => {
            setIsRegister(true);
            if (setAuthMode) setAuthMode('register');
            setError('');
            setSuccessMsg('');
            if (!inviteCode) {
              const code = getStoredInviteCode();
              if (code) setInviteCode(code);
            }
          }}
        >
          <Sparkles size={15} />
          <span>Register Account</span>
        </button>
      </div>

      {error && (
        <div className="auth-alert-banner error mt-3 animate-fade-in">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert-banner success mt-3 animate-fade-in">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form mt-4">
        {isRegister && (
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-icon-field-wrap">
              <User size={16} className="input-field-left-icon" />
              <input
                type="text"
                placeholder="e.g. David Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-input-field with-icon"
                required
              />
            </div>
          </div>
        )}

        <div className="input-group mt-3">
          <label className="input-label">Email Address</label>
          <div className="input-icon-field-wrap">
            <Mail size={16} className="input-field-left-icon" />
            <input
              type="email"
              placeholder={isRegister ? "yourname@example.com" : "targetk474@gmail.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-input-field with-icon"
              required
            />
          </div>
        </div>

        <div className="input-group mt-3">
          <label className="input-label">Password</label>
          <div className="input-icon-field-wrap">
            <Lock size={16} className="input-field-left-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input-field with-icon with-right-btn"
              required
            />
            <button
              type="button"
              className="password-toggle-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {isRegister && (
          <>
            <div className="input-group mt-3">
              <label className="input-label">Confirm Password</label>
              <div className="input-icon-field-wrap">
                <Key size={16} className="input-field-left-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-input-field with-icon with-right-btn"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group mt-3">
              <div className="flex items-center justify-between">
                <label className="input-label">Invitation / Referral Code</label>
                <span className="text-xs text-red-500 font-semibold">*Required</span>
              </div>
              <div className="input-icon-field-wrap">
                <Gift size={16} className="input-field-left-icon" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInviteCode(val);
                    if (val && val.trim()) {
                      sessionStorage.setItem('websynx_ref_code', val.trim());
                      localStorage.setItem('websynx_ref_code', val.trim());
                    }
                  }}
                  className="text-input-field with-icon"
                  placeholder="Enter invitation / referral code (e.g. 505282)"
                  required
                />
              </div>
              {inviteCode && inviteCode.trim() && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle size={13} />
                  <span>Invitation code active: <strong>{inviteCode.trim()}</strong></span>
                </div>
              )}
            </div>

            <div className="auth-terms-card mt-3">
              <label className="checkbox-custom-row">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className="checkbox-text">
                  I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} className="text-primary-brand font-semibold hover:underline">Terms of Service</a> & <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-primary-brand font-semibold hover:underline">Platform Policies</a>
                </span>
              </label>
            </div>
          </>
        )}

        <button type="submit" className="btn-primary auth-submit-btn w-full mt-4" disabled={loading}>
          <span>
            {loading
              ? 'Processing...'
              : isRegister
              ? 'Register'
              : 'Sign In to Dashboard'}
          </span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

// 7. REFERRAL & TEAM NETWORK MODAL
function ReferralTeamModal({ onClose }) {
  const { user, userTeam, fetchUserTeam, addNotification, setModalType } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'tiers'
  const [loading, setLoading] = useState(false);

  const isGuest = !user || !user.id || user.isGuest || user.name === 'Guest User';
  const ownCode = user?.referralCode || user?.referral_code || user?.code || '';
  const referralLink = `${window.location.origin}/?ref=${ownCode}`;

  if (isGuest) {
    return (
      <div className="modal-box text-center auth-modal-box animate-scale-up">
        <div className="modal-header">
          <div className="header-with-icon">
            <div className="auth-icon-badge" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 className="auth-title">My Referral Network & Team</h3>
              <span className="auth-subtitle">Sign in to unlock your invitation network</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-6">
          <div className="success-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <Lock size={38} />
          </div>
          <h4 className="mt-4 font-bold text-lg">Account Login Required</h4>
          <p className="modal-desc mt-1">
            Please sign in or register an account to access your personal invitation code, track direct team members, and earn up to 28% multi-tier commissions.
          </p>
          <div className="modal-btn-row mt-6">
            <button className="btn-outline w-full" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary w-full" onClick={() => {
              onClose();
              setModalType('auth');
            }}>
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ownCode);
    setCopiedCode(true);
    if (addNotification) {
      addNotification('Invitation Code Copied', `Invite Code ${ownCode} copied to clipboard!`);
    }
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    if (addNotification) {
      addNotification('Referral Link Copied', 'Your personal referral link is ready to share!');
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Ecomxstocks Platform',
          text: `Use my invitation code ${ownCode} to earn task commissions on Ecomxstocks!`,
          url: referralLink,
        });
      } catch (err) {}
    } else {
      handleCopyLink();
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (fetchUserTeam) {
      await fetchUserTeam(user?.id, ownCode);
    }
    setLoading(false);
  };

  const members = userTeam || [];
  const activeMembersCount = members.filter(m => m.status !== 'Suspended').length;
  const totalTasksCompleted = members.reduce((sum, m) => sum + (Number(m.completedTasks ?? m.completed_tasks ?? 0)), 0);
  const totalTasksPending = members.reduce((sum, m) => sum + (Number(m.pendingTasks ?? m.pending_tasks ?? 0)), 0);

  return (
    <div className="modal-box referral-team-modal-box animate-scale-up">
      {/* Header */}
      <div className="modal-header referral-modal-header">
        <div className="header-with-icon">
          <div className="auth-icon-badge" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
            <Users size={20} />
          </div>
          <div>
            <h3 className="auth-title">My Referral Network & Team</h3>
            <span className="auth-subtitle">Invite friends & earn up to 28% team dividends</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Body Container */}
      <div className="referral-modal-scroll-body">
        {/* 1. Sapphire Invitation Showcase Card */}
        <div className="referral-hero-card">
          <div className="ref-card-header">
            <div className="ref-pill-label">
              <Gift size={13} className="text-amber-300" />
              <span>YOUR INVITATION CODE</span>
            </div>
            <button 
              type="button" 
              className="ref-sync-btn" 
              onClick={handleRefresh} 
              title="Refresh Team List"
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>

          <div className="ref-code-action-row">
            <div className="ref-code-value">{ownCode}</div>
            <button 
              type="button" 
              className="ref-copy-code-btn"
              onClick={handleCopyCode}
            >
              {copiedCode ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="ref-link-box">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="ref-link-input" 
              onClick={(e) => e.target.select()}
            />
            <div className="ref-link-btn-group">
              <button 
                type="button" 
                className="ref-btn-action"
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button 
                type="button" 
                className="ref-btn-action share"
                onClick={handleShare}
                title="Share via device"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Four Stats Grid Cards */}
        <div className="ref-stats-grid">
          <div className="ref-stat-card blue">
            <span className="ref-stat-label">Direct Team</span>
            <div className="ref-stat-num">{members.length} <span className="ref-stat-sub">Members</span></div>
          </div>
          <div className="ref-stat-card green">
            <span className="ref-stat-label">Active Members</span>
            <div className="ref-stat-num">{activeMembersCount} <span className="ref-stat-sub">Active</span></div>
          </div>
          <div className="ref-stat-card amber">
            <span className="ref-stat-label">Team Tasks Done</span>
            <div className="ref-stat-num">{totalTasksCompleted} <span className="ref-stat-sub">Tasks</span></div>
          </div>
          <div className="ref-stat-card purple">
            <span className="ref-stat-label">Pending Tasks</span>
            <div className="ref-stat-num">{totalTasksPending} <span className="ref-stat-sub">Pending</span></div>
          </div>
        </div>

        {/* 3. Segmented Navigation */}
        <div className="ref-segmented-nav">
          <button
            type="button"
            className={`ref-seg-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={14} />
            <span>Invited Members ({members.length})</span>
          </button>
          <button
            type="button"
            className={`ref-seg-btn ${activeTab === 'tiers' ? 'active' : ''}`}
            onClick={() => setActiveTab('tiers')}
          >
            <Award size={14} />
            <span>Commission Structure (Up to 28%)</span>
          </button>
        </div>

        {/* 4. Tab Content */}
        {activeTab === 'members' && (
          <div className="ref-tab-pane">
            {members.length === 0 ? (
              <div className="ref-empty-state">
                <div className="ref-empty-icon-wrap">
                  <Users size={28} />
                </div>
                <h4>No Team Members Joined Yet</h4>
                <p>
                  Share your invitation code <strong className="highlight-code">{ownCode}</strong> with colleagues & network partners to earn instant multi-tier commission dividends!
                </p>
                <button 
                  type="button" 
                  className="ref-empty-cta"
                  onClick={handleCopyLink}
                >
                  <Copy size={14} />
                  <span>Copy My Referral Link</span>
                </button>
              </div>
            ) : (
              <div className="ref-table-wrap">
                <table className="ref-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>VIP Tier</th>
                      <th>Tasks Done</th>
                      <th>Pending</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="ref-user-cell">
                            <div className="ref-avatar">{m.avatar || (m.name ? m.name.charAt(0) : 'U')}</div>
                            <div>
                              <div className="ref-user-name">{m.name}</div>
                              <div className="ref-user-email">ID: #{m.code || m.referralCode || (m.id ? m.id.slice(-6) : 'Verified')}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`vip-tag-small ${(m.vipLevel || m.vip_level || 'ebay').toLowerCase()}`}>
                            {m.vipLevel === 'eBay' || m.vip_level === 'eBay' ? '🔴 eBay' : m.vipLevel === 'Walmart' || m.vip_level === 'Walmart' ? '🔵 Walmart' : m.vipLevel === 'Temu' || m.vip_level === 'Temu' ? '🟠 Temu' : m.vipLevel || m.vip_level || 'eBay'}
                          </span>
                        </td>
                        <td className="text-emerald-600 font-bold">
                          {m.completedTasks ?? m.completed_tasks ?? 0}
                        </td>
                        <td className="text-amber-600 font-bold">
                          {m.pendingTasks ?? m.pending_tasks ?? 0}
                        </td>
                        <td className="text-muted text-xs">
                          {m.joinedDate || (m.created_at ? m.created_at.split('T')[0] : 'Recent')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge-active-pill">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="ref-tab-pane">
            <div className="ref-tiers-card">
              <div className="ref-tiers-title">
                <Award size={16} className="text-amber-500" />
                <span>Multi-Tier Referral Commission Rules</span>
              </div>
              <div className="ref-tiers-list">
                <div className="ref-tier-item tier-1">
                  <div className="tier-badge">1</div>
                  <div className="tier-info">
                    <strong>Level 1 (Direct Referrals)</strong>
                    <p>Users who register directly with your code</p>
                  </div>
                  <div className="tier-yield">16% Yield</div>
                </div>
                <div className="ref-tier-item tier-2">
                  <div className="tier-badge">2</div>
                  <div className="tier-info">
                    <strong>Level 2 (Secondary Referrals)</strong>
                    <p>Users invited by your Level 1 direct team</p>
                  </div>
                  <div className="tier-yield">8% Yield</div>
                </div>
                <div className="ref-tier-item tier-3">
                  <div className="tier-badge">3</div>
                  <div className="tier-info">
                    <strong>Level 3 (Tertiary Referrals)</strong>
                    <p>Users invited by your Level 2 team</p>
                  </div>
                  <div className="tier-yield">4% Yield</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
