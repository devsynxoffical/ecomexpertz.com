import React, { useState } from 'react';
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
  Eye,
  EyeOff,
  Mail,
  Key,
  Gift,
  ExternalLink
} from 'lucide-react';
import { getProductUrl, openProductUrl } from '../utils/productUrl';

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
    setCurrentView
  } = useApp();

  if (!modalType) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => setModalType(null)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {modalType === 'deposit' && <DepositModal onClose={() => setModalType(null)} />}
        {modalType === 'withdraw' && <WithdrawModal onClose={() => setModalType(null)} />}
        {modalType === 'task' && <TaskExecutionModal task={selectedTask} onClose={() => setModalType(null)} />}
        {modalType === 'apk' && <ApkModal onClose={() => setModalType(null)} />}
        {modalType === 'kyc' && <KycModal onClose={() => setModalType(null)} />}
        {modalType === 'auth' && <AuthModal onClose={() => setModalType(null)} />}
      </div>
    </div>
  );
}

// 1. USDT TRC20 DEPOSIT & DUMMY PRACTICE DEPOSIT MODAL
function DepositModal({ onClose }) {
  const { submitDeposit, claimDummyDeposit, user, systemDepositAccounts } = useApp();
  const [depositTab, setDepositTab] = useState('real'); // 'real' | 'demo'
  const [network, setNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('50.00');
  const [demoAmount, setDemoAmount] = useState('300.00');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(null);
  const [demoSuccessMsg, setDemoSuccessMsg] = useState(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const rec = submitDeposit(amount, txHash, network);
      setIsSubmitting(false);
      setSubmittedCode(rec.code);
    }, 600);
  };

  const handleClaimDummy = async (val) => {
    const amt = val || parseFloat(demoAmount);
    if (!amt || amt <= 0) return;
    setIsSubmitting(true);
    try {
      await claimDummyDeposit(amt);
      setIsSubmitting(false);
      setDemoSuccessMsg(`+$${amt.toFixed(2)} Practice Demo USDT successfully added to your account! You can now test and complete all 25 learning tasks.`);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    } catch (err) {
      setIsSubmitting(false);
      alert('Error claiming demo funds: ' + err.message);
    }
  };

  if (demoSuccessMsg) {
    return (
      <div className="modal-box text-center animate-fade-in">
        <div className="modal-header">
          <h3>🎓 Practice Deposit Credited!</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="success-icon-wrap">
          <CheckCircle2 size={54} color="#10b981" />
        </div>
        <h4 className="mt-3">Demo Funds Ready for Learning</h4>
        <p className="modal-desc mt-1">
          {demoSuccessMsg}
        </p>
        <div className="profit-highlight-card mt-3">
          <span className="highlight-label">Updated Available Balance</span>
          <div className="profit-amount">${user.balance.toFixed(2)} <span className="highlight-unit">USDT</span></div>
        </div>
        <div className="alert-box-info mt-3 text-left">
          <AlertCircle size={16} />
          <span>You can now complete all 25 beginner learning tasks (Step 1 to Step 25) and test the deposit restriction system without financial risk!</span>
        </div>
        <button className="btn-primary w-full mt-4" onClick={onClose}>
          Start Learning Tasks Now
        </button>
      </div>
    );
  }

  if (submittedCode) {
    return (
      <div className="modal-box text-center">
        <div className="modal-header">
          <h3>Deposit Submitted</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="success-icon-wrap">
          <CheckCircle2 size={54} color="#10b981" />
        </div>
        <h4 className="mt-3">Deposit Request Queued</h4>
        <p className="modal-desc">
          Your deposit of <strong>{amount} USDT</strong> has been registered under record:
        </p>
        <div className="code-pill mt-2">
          <code>{submittedCode}</code>
        </div>
        <div className="alert-box-info mt-4">
          <AlertCircle size={16} />
          <span>Status: <strong>Awaiting admin approval</strong>. You can inspect and approve it directly in the Admin Panel!</span>
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
    <div className="modal-box max-w-lg">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-blue">
            <Wallet size={18} />
          </div>
          <div>
            <h3>Deposit USDT</h3>
            <span className="sub-text">Top-up balance or claim $300 demo funds for 25 learning tasks</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      {/* Main Mode Toggle: Real vs Demo Learning Deposit */}
      <div className="deposit-mode-tabs mt-3">
        <button
          type="button"
          className={`mode-tab-btn ${depositTab === 'real' ? 'active' : ''}`}
          onClick={() => setDepositTab('real')}
        >
          <Zap size={15} />
          <span>Live TRC20 Gateway</span>
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${depositTab === 'demo' ? 'active highlight' : ''}`}
          onClick={() => setDepositTab('demo')}
        >
          <span>🎓 Practice Demo Funds ($300 Pack)</span>
        </button>
      </div>

      {depositTab === 'demo' ? (
        /* ================= DUMMY / PRACTICE DEPOSIT FOR LEARNING ================= */
        <div className="demo-deposit-section animate-fade-in mt-3">
          <div className="demo-info-banner">
            <div className="demo-banner-icon">
              <span>💡</span>
            </div>
            <div className="demo-banner-text">
              <strong>Learning & Testing Sandbox Mode ($300 Testing Deposit)</strong>
              <p>
                Get instant risk-free demo USDT into your wallet. Use these funds to complete all <strong>25 learning tasks</strong> (from Step 1 requiring $10 deposit up to Step 25 requiring $300), test deposit restriction barriers, and learn the platform mechanics safely.
              </p>
            </div>
          </div>

          <div className="input-group mt-3">
            <label className="input-label">Select Practice Amount Preset</label>
            <div className="quick-amount-row">
              {[
                { val: '10', label: '+$10 (Step 1)' },
                { val: '50', label: '+$50 (Step 5)' },
                { val: '100', label: '+$100' },
                { val: '300', label: '+$300 (25 Tasks Pack ⭐)' },
                { val: '500', label: '+$500 (Walmart Tier)' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  className={`preset-btn ${demoAmount === item.val ? 'selected' : ''}`}
                  onClick={() => setDemoAmount(item.val)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group mt-3">
            <label className="input-label">Or Enter Custom Demo Amount</label>
            <div className="amount-input-wrap">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                step="1"
                min="10"
                value={demoAmount}
                onChange={(e) => setDemoAmount(e.target.value)}
                className="text-input-field"
              />
              <span className="currency-suffix">USDT (Demo)</span>
            </div>
          </div>

          <div className="alert-box-info mt-3">
            <Shield size={15} />
            <span>Practice demo funds simulate real account deposits and allow you to unlock all deposit-restricted tasks.</span>
          </div>

          <button
            type="button"
            className="btn-primary w-full mt-4"
            disabled={isSubmitting || !demoAmount || parseFloat(demoAmount) <= 0}
            onClick={() => handleClaimDummy(parseFloat(demoAmount))}
          >
            {isSubmitting ? 'Crediting Demo Funds...' : `Claim +$${parseFloat(demoAmount || 0).toFixed(2)} Demo USDT for Testing`}
          </button>
        </div>
      ) : (
        /* ================= REAL TRC20 DEPOSIT ================= */
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
              <span className="addr-label">Deposit TRC20 Address</span>
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
                  className={`preset-btn ${amount === val ? 'selected' : ''}`}
                  onClick={() => setAmount(val)}
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
              <span>Send only USDT to this address. Minimum deposit is 10 USDT. Credited immediately upon 1 network confirmation.</span>
            </div>

            <button type="submit" className="btn-primary w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying & Submitting...' : 'Confirm Real TRC20 Deposit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// 2. USDT TRC20 WITHDRAWAL MODAL
function WithdrawModal({ onClose }) {
  const { user, submitWithdrawal } = useApp();
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
          <h3>Withdrawal Queued</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="success-icon-wrap">
          <CheckCircle2 size={54} color="#10b981" />
        </div>
        <h4 className="mt-3">Request Submitted for Review</h4>
        <p className="modal-desc">
          Your request to withdraw <strong>{numAmount} USDT</strong> ({netReceived.toFixed(2)} USDT net) has been registered:
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
  const { user, completeTask, vipTiers, setDashboardTab, setCurrentView, setModalType, claimDummyDeposit } = useApp();
  const [step, setStep] = useState('match'); // 'match' -> 'ready' -> 'processing' -> 'success'
  const [progress, setProgress] = useState(0);
  const [earnedCommission, setEarnedCommission] = useState(0);
  const [claimingDemo, setClaimingDemo] = useState(false);

  // Deposit restriction check
  const requiredDeposit = parseFloat(task?.requiredDeposit || 0);
  const isDepositRestricted = task && requiredDeposit > 0 && user.balance < requiredDeposit && (user.totalDeposit || 0) < requiredDeposit;

  // Auto transition from radar matching to ready
  React.useEffect(() => {
    if (step === 'match') {
      const timer = setTimeout(() => {
        setStep('ready');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Current tier info
  const userVip = (user?.vipLevel || '').toLowerCase();
  const currentTier = vipTiers?.find(t => (t.name || '').toLowerCase() === userVip) || vipTiers?.[0] || { commissionRate: 4.0 };
  const commissionRate = currentTier?.commissionRate || 4.0;
  const calculatedCommission = task ? parseFloat((((Number(task.price) || 0) * commissionRate) / 100).toFixed(2)) : 0;

  const handleSubmitTask = () => {
    if (isDepositRestricted) return;

    setStep('processing');
    setProgress(15);

    const int1 = setTimeout(() => setProgress(45), 350);
    const int2 = setTimeout(() => setProgress(80), 750);
    const int3 = setTimeout(async () => {
      setProgress(100);
      try {
        const earned = await completeTask(task);
        const finalEarned = typeof earned === 'number' ? earned : (parseFloat(earned) || calculatedCommission);
        setEarnedCommission(finalEarned);
        setStep('success');

        // Trigger Confetti!
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
    }, 1200);

    return () => {
      clearTimeout(int1);
      clearTimeout(int2);
      clearTimeout(int3);
    };
  };

  const handleQuickClaimDemo = async () => {
    setClaimingDemo(true);
    try {
      await claimDummyDeposit(Math.max(300, requiredDeposit));
      setClaimingDemo(false);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      setClaimingDemo(false);
      alert('Error claiming practice funds: ' + err.message);
    }
  };

  if (!task) return null;

  return (
    <div className="modal-box task-modal">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="icon-pill-blue">
            <Zap size={18} />
          </div>
          <div>
            <h3>Website Task Engine</h3>
            <span className="sub-text">Website Listing Promotion • {task.platform}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      {/* LEARNING TASK BANNER */}
      {task.isLearning && (
        <div className="learning-task-top-strip mt-2">
          <div className="learning-strip-icon">🎓</div>
          <div className="learning-strip-text">
            <strong>Beginner Learning Campaign (Step #{task.learningStep || 1} of 25)</strong>
            <span>Progressive learning deposit requirement: ${parseFloat(task.requiredDeposit || 0).toFixed(2)} USDT</span>
          </div>
        </div>
      )}

      {step === 'match' && (
        <div className="task-step-matching py-8 text-center">
          <div className="radar-spinner-wrap">
            <div className="radar-circle"></div>
            <div className="radar-circle delay-1"></div>
            <div className="radar-center-icon">
              <TrendingUp size={28} color="#2563eb" />
            </div>
          </div>
          <h4 className="mt-4">Matching Website Campaign Order...</h4>
          <p className="modal-desc">
            Allocating verified website product review from <strong>{task.platform}</strong> merchant network.
          </p>
        </div>
      )}

      {step === 'ready' && (
        <div className="task-step-ready mt-3">
          {/* DEPOSIT RESTRICTION BARRIER SCREEN */}
          {isDepositRestricted ? (
            <div className="deposit-restriction-card animate-fade-in">
              <div className="lock-icon-hero">
                <Lock size={36} color="#d97706" />
              </div>
              <h3 className="mt-2 text-amber-warning font-bold">Deposit Restriction Required</h3>
              <p className="modal-desc mt-1">
                This campaign task requires a minimum deposit of <strong>${requiredDeposit.toFixed(2)} USDT</strong>.
              </p>

              <div className="restriction-breakdown-box mt-3">
                <div className="breakdown-row">
                  <span>Required Deposit / Account Balance:</span>
                  <strong>${requiredDeposit.toFixed(2)} USDT</strong>
                </div>
                <div className="breakdown-row">
                  <span>Your Current Balance:</span>
                  <span className="text-red-danger font-bold">${user.balance.toFixed(2)} USDT</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-row total">
                  <span>Required Top-Up to Unlock:</span>
                  <strong className="text-primary-brand">+${Math.max(0, requiredDeposit - user.balance).toFixed(2)} USDT</strong>
                </div>
              </div>

              <div className="restriction-actions-grid mt-4">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleQuickClaimDemo}
                  disabled={claimingDemo}
                >
                  <Award size={15} />
                  <span>{claimingDemo ? 'Unlocking...' : `Claim $300 Test Deposit (Unlocks All 25 Tasks)`}</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onClose();
                    setModalType('deposit');
                  }}
                >
                  <Wallet size={15} />
                  <span>Deposit TRC20 USDT</span>
                </button>
              </div>

              <div className="note-sub-text mt-3">
                <span>Tip: You can practice risk-free by claiming demo practice funds or top up real USDT.</span>
              </div>
            </div>
          ) : (
            <>
              <div className="task-preview-card" onClick={(e) => openProductUrl(task, e)} style={{ cursor: 'pointer' }} title={`Click to view live listing on ${task.platform}`}>
                <div className="task-img-wrap">
                  <img
                    src={task.image}
                    alt={task.title}
                    className="task-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span className={`platform-badge-pill ${(task?.platform || 'ebay').toLowerCase()}`}>
                    {task?.platform || 'eBay'}
                  </span>
                  <div className="task-img-hover-overlay">
                    <ExternalLink size={16} />
                    <span>View Product ↗</span>
                  </div>
                </div>
                <div className="task-info">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="task-tag-chip">{task.category || 'Promotional Campaign'}</span>
                      {task.isLearning && <span className="badge-learning">🎓 Learning # {task.learningStep || 1}</span>}
                    </div>
                    <span className="live-link-pill">
                      <span>Live Item</span>
                      <ExternalLink size={11} />
                    </span>
                  </div>
                  <h4 className="task-title-clamp">{task.title}</h4>
                  <div className="task-specs-row">
                    <div>
                      <span className="spec-label">Listing Value</span>
                      <strong className="spec-val">${parseFloat(task.price).toFixed(2)}</strong>
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
                  onClick={(e) => openProductUrl(task, e)}
                >
                  <ExternalLink size={14} />
                  <span>Open Live Listing on {task.platform} (New Tab)</span>
                </button>
              </div>

              <div className="daily-quota-banner mt-3">
                <div className="quota-text">
                  <span>Daily Tasks: <strong>{user.dailyCompleted} / {user.dailyQuota}</strong></span>
                  <span className="quota-percent">{Math.round((user.dailyCompleted / user.dailyQuota) * 100)}% Complete</span>
                </div>
                <div className="quota-bar">
                  <div
                    className="quota-fill"
                    style={{ width: `${Math.min(100, (user.dailyCompleted / user.dailyQuota) * 100)}%` }}
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
          <h4 className="mt-4">Synchronizing with {task.platform} API...</h4>
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
          <h3 className="mt-3">Order Completed!</h3>
          <p className="modal-desc">Your commission has been credited directly to your available balance.</p>

          <div className="profit-highlight-card mt-3">
            <span className="highlight-label">Commission Earned</span>
            <div className="profit-amount">+${(typeof earnedCommission === 'number' ? earnedCommission : parseFloat(earnedCommission || calculatedCommission || 0)).toFixed(2)} <span className="highlight-unit">USDT</span></div>
            <div className="tier-info-sub">
              <span>New Available Balance: <strong>${(typeof user?.balance === 'number' ? user.balance : parseFloat(user?.balance || 0)).toFixed(2)} USDT</strong></span>
            </div>
          </div>

          <button
            type="button"
            className="btn-visit-store-success mt-3"
            onClick={(e) => openProductUrl(task, e)}
          >
            <ExternalLink size={14} />
            <span>Inspect Verified Product on {task.platform}</span>
          </button>

          <div className="modal-btn-row mt-4">
            <button className="btn-outline w-full" onClick={() => {
              onClose();
              setCurrentView('dashboard');
              setDashboardTab('records');
            }}>
              View in Records
            </button>
            <button className="btn-primary w-full" onClick={onClose}>
              Continue Tasks
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
            <span className="sub-text">DEVSYNX Mobile Task & Wallet APK</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="apk-content-card mt-3">
        <div className="apk-banner">
          <div className="android-robot-icon">🤖</div>
          <div className="apk-version-info">
            <h4>WebSynx Android APK</h4>
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
            alert('Starting download: WebSynx-v2.4.0.apk (18.4MB)');
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
function AuthModal({ onClose }) {
  const { user, registerAccount, loginAccount, switchUser, adminUsers } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('ref') || '';
    } catch (e) {
      return '';
    }
  });
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
        setError('Please provide your full name');
        return;
      }
      if (!inviteCode || !inviteCode.trim()) {
        setError('Referral / Invitation code is required to register an account');
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
      if (!agreeTerms) {
        setError('You must agree to the WebSynx Terms of Service');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const newUser = await registerAccount(name, email, password, inviteCode.trim());
        setSuccessMsg(`Welcome ${newUser.name}! Your WebSynx account & TRON TRC20 wallet have been created.`);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (err) {}
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 1200);
      } else {
        await loginAccount(email, password);
        setSuccessMsg('Login successful! Redirecting to your dashboard...');
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 600);
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
          onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
        >
          <Key size={15} />
          <span>Sign In (Login)</span>
        </button>
        <button
          type="button"
          className={`auth-segment-btn ${isRegister ? 'active' : ''}`}
          onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
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
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="text-input-field with-icon"
                  placeholder="Enter referral code (e.g. 505282)"
                  required
                />
              </div>
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

