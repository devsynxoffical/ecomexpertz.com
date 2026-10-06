import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DATA } from './data/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-Memory DB with persistent disk sync
let db = {};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      console.log('Loaded database from disk with', db.users?.length, 'users,', db.records?.length, 'records');
    } else {
      db = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveDatabase();
      console.log('Initialized clean database on disk.');
    }
  } catch (err) {
    console.error('Error reading db.json, falling back to initial data:', err);
    db = JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

loadDatabase();

// Server-Sent Events (SSE) Client Pool for Instant Live Updates Across All Tabs
let sseClients = [];

app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

function broadcastEvent(type, payload) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  sseClients.forEach(c => {
    try {
      c.res.write(`data: ${data}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Register new account with referral code capture
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, referralCode } = req.body;

  if (!email || !password || !name || !referralCode) {
    return res.status(400).json({ error: 'Name, email, password, and referral code are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  // Find referrer if code was provided
  let referrer = null;
  if (referralCode) {
    referrer = db.users.find(u => u.referralCode === referralCode.trim());
  }

  const newUserId = `usr_${Date.now()}`;
  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  const randomHex = Math.random().toString(16).substring(2, 8);
  const generatedWallet = `T${name.replace(/[^a-zA-Z]/g, '').substring(0, 4)}99${randomHex}Tx11`;

  const newUser = {
    id: newUserId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    referralCode: generatedCode,
    referredBy: referrer ? referrer.id : null,
    avatar: name.trim().charAt(0).toUpperCase(),
    vipLevel: 'eBay',
    vipTierId: 'tier_ebay',
    balance: 0.00,
    totalEarnings: 0.00,
    totalDeposit: 0.00,
    totalWithdraw: 0.00,
    pendingRequests: 0,
    teamMembersCount: 0,
    pendingTasks: 0,
    completedTasks: 0,
    dailyQuota: 25,
    dailyCompleted: 0,
    teamBonus: 0.00,
    thisMonthEarnings: 0.00,
    depositSuccessRate: 0,
    withdrawRate: 0,
    taskCompletionRate: 0,
    kycStatus: 'Unverified',
    walletAddress: generatedWallet,
    network: 'TRC20',
    twoFactorEnabled: false,
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    role: 'user'
  };

  db.users.push(newUser);

  // If referrer exists, increment their team count and update them
  if (referrer) {
    referrer.teamMembersCount = (referrer.teamMembersCount || 0) + 1;
    // Log referral attribution record
    const refRecord = {
      id: `rec_${Date.now()}`,
      code: `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      type: 'Referral Signup',
      category: 'Referral',
      amount: 0.00,
      currency: 'USDT',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Completed',
      note: `New team member registered: ${newUser.name}`,
      userId: referrer.id,
      userName: referrer.name
    };
    db.records.unshift(refRecord);
  }

  saveDatabase();
  broadcastEvent('user_registered', { user: newUser, referrerId: referrer?.id });

  res.status(201).json({
    message: 'Account created successfully',
    user: newUser,
    token: `token_${newUser.id}`
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({ error: 'Account is suspended. Please contact customer support.' });
  }

  res.json({
    message: 'Login successful',
    user,
    token: `token_${user.id}`
  });
});

// Get current user profile
app.get('/api/users/me', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_noah_9941';
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get all users (Admin)
app.get('/api/users', (req, res) => {
  res.json(db.users);
});

// Admin update user (balance, VIP tier, status)
app.put('/api/users/:id', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { balance, vipLevel, status, kycStatus, teamBonus } = req.body;
  const oldBalance = user.balance;

  if (balance !== undefined) user.balance = parseFloat(parseFloat(balance).toFixed(2));
  if (vipLevel !== undefined) {
    user.vipLevel = vipLevel;
    const tier = db.vipTiers.find(t => t.name.toLowerCase() === vipLevel.toLowerCase());
    if (tier) {
      user.dailyQuota = tier.dailyTasks;
      user.vipTierId = tier.id;
    }
  }
  if (status !== undefined) user.status = status;
  if (kycStatus !== undefined) user.kycStatus = kycStatus;
  if (teamBonus !== undefined) user.teamBonus = parseFloat(teamBonus);

  // If balance was modified, add audit ledger record
  if (balance !== undefined && oldBalance !== user.balance) {
    const diff = user.balance - oldBalance;
    const auditRecord = {
      id: `rec_${Date.now()}`,
      code: `ADJ-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      type: 'Admin Ledger Adjustment',
      category: 'Adjustment',
      amount: diff,
      currency: 'USDT',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Completed',
      note: `Admin modified balance from $${oldBalance} to $${user.balance}`,
      userId: user.id,
      userName: user.name
    };
    db.records.unshift(auditRecord);
  }

  saveDatabase();
  broadcastEvent('user_updated', { user });

  res.json({ message: 'User updated successfully', user });
});

// Get referral team tree for a user
app.get('/api/users/:id/team', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Direct referrals (Level 1)
  const level1 = db.users.filter(u => u.referredBy === user.id);
  const level1Ids = level1.map(u => u.id);

  // Level 2 referrals
  const level2 = db.users.filter(u => level1Ids.includes(u.referredBy));
  const level2Ids = level2.map(u => u.id);

  // Level 3 referrals
  const level3 = db.users.filter(u => level2Ids.includes(u.referredBy));

  res.json({
    referralCode: user.referralCode,
    totalMembers: level1.length + level2.length + level3.length,
    level1: { count: level1.length, members: level1, rate: '16%' },
    level2: { count: level2.length, members: level2, rate: '8%' },
    level3: { count: level3.length, members: level3, rate: '4%' }
  });
});

// ==========================================
// 2. TASK ENGINE & SUBMISSION
// ==========================================

// Get all promotional tasks
app.get('/api/tasks', (req, res) => {
  let list = db.tasks;
  if (req.query.platform) {
    list = list.filter(t => t.platform.toLowerCase() === req.query.platform.toLowerCase());
  }
  if (req.query.category) {
    list = list.filter(t => t.category.toLowerCase() === req.query.category.toLowerCase());
  }
  res.json(list);
});

// Admin add task
app.post('/api/tasks', (req, res) => {
  const { title, platform, category, price, commissionRate, image, tag, description, requiredDeposit, isLearning, learningStep, active, productUrl } = req.body;
  if (!title || !platform || !price) {
    return res.status(400).json({ error: 'Title, platform and price are required' });
  }

  const newTask = {
    id: `task-${Date.now()}`,
    title: title.trim(),
    platform,
    category: category || 'Flash Deals',
    price: parseFloat(price),
    commissionRate: parseFloat(commissionRate || 4.0),
    orders: 0,
    rating: 5.0,
    image: image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
    tag: tag || (isLearning ? 'Learning' : 'Featured'),
    description: description || 'Promotional sponsored product listing.',
    requiredDeposit: parseFloat(requiredDeposit || 0),
    isLearning: Boolean(isLearning),
    learningStep: isLearning ? parseInt(learningStep || 1) : null,
    active: active !== undefined ? Boolean(active) : true,
    productUrl: productUrl ? productUrl.trim() : null
  };

  db.tasks.unshift(newTask);
  saveDatabase();
  broadcastEvent('task_created', { task: newTask });

  res.status(201).json(newTask);
});

// Admin update / edit task
app.put('/api/tasks/:id', (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, platform, category, price, commissionRate, image, tag, description, requiredDeposit, isLearning, learningStep, active, productUrl } = req.body;

  if (title !== undefined) task.title = title.trim();
  if (platform !== undefined) task.platform = platform;
  if (category !== undefined) task.category = category;
  if (price !== undefined) task.price = parseFloat(price);
  if (commissionRate !== undefined) task.commissionRate = parseFloat(commissionRate);
  if (image !== undefined) task.image = image;
  if (tag !== undefined) task.tag = tag;
  if (description !== undefined) task.description = description;
  if (requiredDeposit !== undefined) task.requiredDeposit = parseFloat(requiredDeposit);
  if (isLearning !== undefined) task.isLearning = Boolean(isLearning);
  if (learningStep !== undefined) task.learningStep = isLearning ? parseInt(learningStep) : null;
  if (active !== undefined) task.active = Boolean(active);
  if (productUrl !== undefined) task.productUrl = productUrl ? productUrl.trim() : null;

  saveDatabase();
  broadcastEvent('task_updated', { task });

  res.json({ message: 'Task updated successfully', task });
});

// Admin delete task
app.delete('/api/tasks/:id', (req, res) => {
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  saveDatabase();
  broadcastEvent('task_deleted', { id: req.params.id });
  res.json({ message: 'Task deleted' });
});

// User submit task (Rate promotional listing & earn commission)
app.post('/api/tasks/submit', (req, res) => {
  const { taskId, userId } = req.body;
  const user = db.users.find(u => u.id === (userId || 'usr_noah_9941'));
  const task = db.tasks.find(t => t.id === taskId);

  if (!user || !task) {
    return res.status(404).json({ error: 'User or task not found' });
  }

  // RESTRICTION CHECK: Verify if task has a required min deposit / account balance
  const reqDeposit = parseFloat(task.requiredDeposit || 0);
  if (reqDeposit > 0) {
    const qualifiedBalance = user.balance >= reqDeposit || (user.totalDeposit || 0) >= reqDeposit;
    if (!qualifiedBalance) {
      return res.status(403).json({
        error: `Deposit requirement not met: This task requires a minimum account balance or deposit of $${reqDeposit.toFixed(2)} USDT. Your current balance is $${user.balance.toFixed(2)} USDT.`,
        requiredDeposit: reqDeposit,
        userBalance: user.balance
      });
    }
  }

  // Get current user VIP rate
  const currentTier = db.vipTiers.find(t => t.name.toLowerCase() === user.vipLevel.toLowerCase()) || db.vipTiers[0];
  const commissionPercent = currentTier.commissionRate || 4.0;
  const commissionEarned = parseFloat(((task.price * commissionPercent) / 100).toFixed(2));

  // Update user stats
  user.balance = parseFloat((user.balance + commissionEarned).toFixed(2));
  user.totalEarnings = parseFloat((user.totalEarnings + commissionEarned).toFixed(2));
  user.completedTasks = (user.completedTasks || 0) + 1;
  user.dailyCompleted = (user.dailyCompleted || 0) + 1;
  user.thisMonthEarnings = parseFloat((user.thisMonthEarnings + commissionEarned).toFixed(2));

  const quota = user.dailyQuota || 25;
  user.taskCompletionRate = Math.min(100, Math.round((user.dailyCompleted / quota) * 100));

  // Auto-upgrade VIP tier if balance qualifies
  if (user.balance >= 900 && user.vipLevel !== 'Temu') {
    user.vipLevel = 'Temu';
    user.dailyQuota = 50;
  } else if (user.balance >= 500 && user.vipLevel === 'eBay') {
    user.vipLevel = 'Walmart';
    user.dailyQuota = 35;
  }

  // Increment task orders count
  task.orders = (task.orders || 0) + 1;

  // Add ledger record
  const code = `ORD-${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
  const record = {
    id: `rec_${Date.now()}`,
    code,
    type: task.isLearning ? `🎓 Learning Task #${task.learningStep || 1} Rating` : `${task.platform} Task Rating`,
    category: 'Ad Tasks',
    amount: commissionEarned,
    currency: 'USDT',
    productName: task.title,
    productPrice: task.price,
    commissionRate: commissionPercent,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Completed',
    note: task.isLearning ? `Learning phase task rating completed` : `Successfully rated promotional listing on ${task.platform}`,
    txHash: `INT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    userId: user.id,
    userName: user.name,
    isLearning: Boolean(task.isLearning)
  };
  db.records.unshift(record);

  // Add live masked activity item
  const newActivity = {
    id: `act_${Date.now()}`,
    flag: '🇺🇸',
    name: `${user.name.substring(0, 2)}*${user.name.substring(user.name.length - 1)}`,
    badge: task.isLearning ? 'Completed' : 'Profit',
    action: task.isLearning ? `Learning task #${task.learningStep || 1} completed` : `${task.platform} ${commissionPercent}% task commission`,
    time: 'Just now',
    amount: `+$${commissionEarned.toFixed(2)}`,
    isPositive: true,
    type: 'profit'
  };
  db.activityStream.unshift(newActivity);
  if (db.activityStream.length > 25) db.activityStream.pop();

  saveDatabase();
  broadcastEvent('task_completed', { user, record, task, activity: newActivity });

  res.json({
    message: 'Task completed successfully!',
    commissionEarned,
    newBalance: user.balance,
    record,
    user
  });
});

// ==========================================
// 3. DEPOSITS & DUMMY LEARNING DEPOSIT
// ==========================================

// Dummy / Practice Demo Deposit for Learning Purpose
app.post('/api/deposits/dummy', (req, res) => {
  const { amount, userId } = req.body;
  const demoAmount = parseFloat(amount || 100.00);
  const user = db.users.find(u => u.id === (userId || 'usr_noah_9941'));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.balance = parseFloat((user.balance + demoAmount).toFixed(2));
  user.totalDeposit = parseFloat(((user.totalDeposit || 0) + demoAmount).toFixed(2));
  user.depositSuccessRate = 100;

  const code = `DEMO-DEP-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const depositRecord = {
    id: `rec_${Date.now()}`,
    code,
    type: 'Demo Learning Deposit',
    category: 'Top-up',
    amount: demoAmount,
    currency: 'USDT (Demo)',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Completed',
    note: 'Practice demo funds credited for learning tasks',
    txHash: `DEMO-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    network: 'DEMO-WALLET',
    userId: user.id,
    userName: user.name,
    isDemo: true
  };
  db.records.unshift(depositRecord);
  saveDatabase();
  broadcastEvent('deposit_completed', { user, record: depositRecord });

  res.json({
    message: `Demo learning deposit of $${demoAmount.toFixed(2)} USDT credited!`,
    user,
    record: depositRecord
  });
});
// 3. DEPOSITS & TRC20 GATEWAY
// ==========================================

// Submit USDT deposit request
app.post('/api/deposits', (req, res) => {
  const { amount, txHash, network, userId } = req.body;
  const numAmount = parseFloat(amount);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid deposit amount required' });
  }

  const user = db.users.find(u => u.id === (userId || 'usr_noah_9941'));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const code = `DEP-${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
  const hash = txHash || `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;

  const depositRecord = {
    id: `rec_${Date.now()}`,
    code,
    type: 'USDT Deposit',
    category: 'Deposit',
    amount: numAmount,
    currency: 'USDT',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Pending',
    note: 'Awaiting admin approval',
    txHash: hash,
    network: network || 'TRC20',
    userId: user.id,
    userName: user.name
  };

  user.pendingRequests = (user.pendingRequests || 0) + 1;
  db.records.unshift(depositRecord);

  saveDatabase();
  broadcastEvent('deposit_created', { record: depositRecord, user });

  res.status(201).json(depositRecord);
});

// Admin approve deposit
app.post('/api/deposits/:id/approve', (req, res) => {
  const record = db.records.find(r => r.id === req.params.id && r.category === 'Deposit');
  if (!record) return res.status(404).json({ error: 'Deposit record not found' });

  if (record.status === 'Completed') {
    return res.status(400).json({ error: 'Deposit is already approved' });
  }

  record.status = 'Completed';
  record.note = 'Approved on-chain & credited to user balance';

  // Credit user live balance
  const user = db.users.find(u => u.id === record.userId);
  if (user) {
    user.balance = parseFloat((user.balance + record.amount).toFixed(2));
    user.totalDeposit = parseFloat((user.totalDeposit + record.amount).toFixed(2));
    user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
    user.depositSuccessRate = 100;

    // Auto-promote VIP tier if balance reaches thresholds
    if (user.balance >= 900) {
      user.vipLevel = 'Temu';
      user.dailyQuota = 50;
    } else if (user.balance >= 500) {
      user.vipLevel = 'Walmart';
      user.dailyQuota = 35;
    }
  }

  // Add to live activity feed
  const newActivity = {
    id: `act_${Date.now()}`,
    flag: '🇦🇪',
    name: `${record.userName.substring(0, 2)}*${record.userName.substring(record.userName.length - 1)}`,
    badge: 'Deposit',
    action: `Top-up via USDT (${record.network})`,
    time: 'Just now',
    amount: `+$${record.amount.toFixed(2)}`,
    isPositive: true
  };
  db.activityStream.unshift(newActivity);
  if (db.activityStream.length > 15) db.activityStream.pop();

  saveDatabase();
  broadcastEvent('deposit_approved', { record, user, activity: newActivity });

  res.json({ message: 'Deposit approved & balance credited', record, user });
});

// Admin reject deposit
app.post('/api/deposits/:id/reject', (req, res) => {
  const record = db.records.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  record.status = 'Rejected';
  record.note = 'Deposit rejected by compliance admin';

  const user = db.users.find(u => u.id === record.userId);
  if (user) {
    user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
  }

  saveDatabase();
  broadcastEvent('deposit_rejected', { record, user });

  res.json({ message: 'Deposit rejected', record, user });
});

// ==========================================
// 4. WITHDRAWALS
// ==========================================

// User submit withdrawal request
app.post('/api/withdrawals', (req, res) => {
  const { amount, address, network, userId } = req.body;
  const numAmount = parseFloat(amount);

  if (!numAmount || numAmount < 10) {
    return res.status(400).json({ error: 'Minimum withdrawal is 10.00 USDT' });
  }

  const user = db.users.find(u => u.id === (userId || 'usr_noah_9941'));
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.balance < numAmount) {
    return res.status(400).json({ error: 'Insufficient available balance' });
  }

  const fee = 1.00; // 1 USDT network fee
  const netAmount = numAmount - fee;
  const code = `WTH-${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;

  // Deduct balance into escrow immediately
  user.balance = parseFloat((user.balance - numAmount).toFixed(2));
  user.pendingRequests = (user.pendingRequests || 0) + 1;

  const withdrawalRecord = {
    id: `rec_${Date.now()}`,
    code,
    type: 'USDT Withdrawal',
    category: 'Withdrawal',
    amount: -numAmount,
    netAmount,
    fee,
    currency: 'USDT',
    destination: address,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Pending',
    note: 'Awaiting admin approval & security audit',
    txHash: 'Pending broadcast',
    network: network || 'TRC20',
    userId: user.id,
    userName: user.name
  };

  db.records.unshift(withdrawalRecord);
  saveDatabase();
  broadcastEvent('withdrawal_created', { record: withdrawalRecord, user });

  res.status(201).json(withdrawalRecord);
});

// Admin approve withdrawal (Broadcast on TRON network)
app.post('/api/withdrawals/:id/approve', (req, res) => {
  const record = db.records.find(r => r.id === req.params.id && r.category === 'Withdrawal');
  if (!record) return res.status(404).json({ error: 'Withdrawal record not found' });

  if (record.status === 'Completed') {
    return res.status(400).json({ error: 'Withdrawal already completed' });
  }

  const generatedHash = `0x${Math.random().toString(16).substring(2, 12)}...${Math.random().toString(16).substring(2, 8)}`;
  record.status = 'Completed';
  record.txHash = generatedHash;
  record.note = 'Approved & broadcasted on TRON TRC20 network';

  const user = db.users.find(u => u.id === record.userId);
  if (user) {
    user.totalWithdraw = parseFloat((user.totalWithdraw + Math.abs(record.amount)).toFixed(2));
    user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
    user.withdrawRate = 100;
  }

  // Add to live activity feed
  const newActivity = {
    id: `act_${Date.now()}`,
    flag: '🇺🇸',
    name: `${record.userName.substring(0, 2)}*${record.userName.substring(record.userName.length - 1)}`,
    badge: 'Withdraw',
    action: 'USDT TRC20 Withdrawal',
    time: 'Just now',
    amount: `-$${Math.abs(record.amount).toFixed(2)}`,
    isPositive: false
  };
  db.activityStream.unshift(newActivity);
  if (db.activityStream.length > 15) db.activityStream.pop();

  saveDatabase();
  broadcastEvent('withdrawal_approved', { record, user, activity: newActivity });

  res.json({ message: 'Withdrawal dispatched & TX hash generated', record, user });
});

// Admin reject withdrawal (Refund balance)
app.post('/api/withdrawals/:id/reject', (req, res) => {
  const record = db.records.find(r => r.id === req.params.id && r.category === 'Withdrawal');
  if (!record) return res.status(404).json({ error: 'Withdrawal record not found' });

  const refundAmt = Math.abs(record.amount);
  record.status = 'Rejected';
  record.note = 'Rejected by admin - funds refunded to balance';

  const user = db.users.find(u => u.id === record.userId);
  if (user) {
    user.balance = parseFloat((user.balance + refundAmt).toFixed(2));
    user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
  }

  saveDatabase();
  broadcastEvent('withdrawal_rejected', { record, user });

  res.json({ message: 'Withdrawal rejected & balance refunded', record, user });
});

// ==========================================
// 5. RECORDS & LEDGER
// ==========================================

app.get('/api/records', (req, res) => {
  let list = db.records;
  if (req.query.userId) {
    list = list.filter(r => r.userId === req.query.userId);
  }
  if (req.query.status && req.query.status !== 'All') {
    list = list.filter(r => r.status === req.query.status);
  }
  if (req.query.category) {
    list = list.filter(r => r.category === req.query.category);
  }
  res.json(list);
});

// ==========================================
// 6. VIP TIERS CONFIGURATION
// ==========================================

app.get('/api/vip-tiers', (req, res) => {
  res.json(db.vipTiers);
});

app.put('/api/vip-tiers/:id', (req, res) => {
  const tier = db.vipTiers.find(t => t.id === req.params.id);
  if (!tier) return res.status(404).json({ error: 'Tier not found' });

  const { minBalance, commissionRate, dailyTasks } = req.body;
  if (minBalance !== undefined) tier.minBalance = parseFloat(minBalance);
  if (commissionRate !== undefined) tier.commissionRate = parseFloat(commissionRate);
  if (dailyTasks !== undefined) tier.dailyTasks = parseInt(dailyTasks, 10);

  saveDatabase();
  broadcastEvent('tier_updated', { tier });
  res.json({ message: 'VIP tier updated', tier });
});

// ==========================================
// 7. ACTIVITY STREAM & ANNOUNCEMENTS
// ==========================================

app.get('/api/activity', (req, res) => {
  res.json(db.activityStream);
});

app.post('/api/broadcast', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const ann = {
    id: `ann-${Date.now()}`,
    title: 'Platform Notice',
    message,
    date: new Date().toISOString()
  };
  db.announcements.unshift(ann);
  saveDatabase();
  broadcastEvent('broadcast_posted', { announcement: ann });

  res.json({ message: 'Broadcast sent', announcement: ann });
});

// ==========================================
// 8. LIVE SUPPORT CHAT & SUPPORT SETTINGS
// ==========================================

const DEFAULT_SUPPORT_SETTINGS = {
  enabled: true,
  agentName: 'WebSynx Support',
  welcomeMessage: 'Hi there! 👋 How can we help you today? Our team usually replies within a few minutes.',
  offlineMessage: 'Our agents are currently offline. Leave a message and we will reply as soon as possible.',
  workingHours: '24/7 — Mon to Sun',
  online: true,
  autoReply: true,
  telegram: 'https://t.me/websynx_support',
  whatsapp: 'https://wa.me/10000000000',
  email: 'support@websynx.com'
};

function ensureSupport() {
  if (!db.supportSettings) db.supportSettings = { ...DEFAULT_SUPPORT_SETTINGS };
  if (!Array.isArray(db.supportChats)) db.supportChats = [];
}

function findOrCreateChat(userId) {
  ensureSupport();
  let chat = db.supportChats.find(c => c.userId === userId);
  if (!chat) {
    const u = (db.users || []).find(x => x.id === userId);
    chat = {
      id: `chat-${Date.now()}`,
      userId,
      userName: u?.name || 'Guest User',
      userEmail: u?.email || '',
      status: 'open',
      unreadByAdmin: 0,
      unreadByUser: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    db.supportChats.unshift(chat);
  }
  return chat;
}

// Public support settings
app.get('/api/support/settings', (req, res) => {
  ensureSupport();
  res.json(db.supportSettings);
});

// Admin update support settings
app.put('/api/support/settings', (req, res) => {
  ensureSupport();
  db.supportSettings = { ...db.supportSettings, ...req.body };
  saveDatabase();
  broadcastEvent('support_settings_updated', { settings: db.supportSettings });
  res.json(db.supportSettings);
});

// User: get own chat thread
app.get('/api/support/chat/:userId', (req, res) => {
  ensureSupport();
  const chat = db.supportChats.find(c => c.userId === req.params.userId);
  res.json(chat || { userId: req.params.userId, messages: [], unreadByUser: 0 });
});

// User: send message
app.post('/api/support/chat/:userId/messages', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message text required' });

  const chat = findOrCreateChat(req.params.userId);
  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'user',
    text: text.trim().slice(0, 2000),
    createdAt: new Date().toISOString()
  };
  chat.messages.push(msg);
  chat.unreadByAdmin = (chat.unreadByAdmin || 0) + 1;
  chat.status = 'open';
  chat.updatedAt = msg.createdAt;

  // Move to top
  db.supportChats = [chat, ...db.supportChats.filter(c => c.id !== chat.id)];

  // Auto reply on first message
  const s = db.supportSettings;
  const userMsgCount = chat.messages.filter(m => m.sender === 'user').length;
  if (s.autoReply && userMsgCount === 1) {
    chat.messages.push({
      id: `msg-${Date.now()}-auto`,
      sender: 'admin',
      auto: true,
      text: s.online ? 'Thanks for reaching out! An agent has been notified and will reply shortly.' : s.offlineMessage,
      createdAt: new Date(Date.now() + 1).toISOString()
    });
    chat.unreadByUser = (chat.unreadByUser || 0) + 1;
  }

  saveDatabase();
  broadcastEvent('support_message', { chat });
  res.status(201).json(chat);
});

// User: mark read
app.post('/api/support/chat/:userId/read', (req, res) => {
  ensureSupport();
  const chat = db.supportChats.find(c => c.userId === req.params.userId);
  if (chat) {
    chat.unreadByUser = 0;
    saveDatabase();
  }
  res.json(chat || {});
});

// Admin: list all chats
app.get('/api/support/chats', (req, res) => {
  ensureSupport();
  res.json(db.supportChats);
});

// Admin: reply
app.post('/api/support/chats/:chatId/reply', (req, res) => {
  ensureSupport();
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text required' });
  const chat = db.supportChats.find(c => c.id === req.params.chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'admin',
    agentName: db.supportSettings.agentName,
    text: text.trim().slice(0, 2000),
    createdAt: new Date().toISOString()
  };
  chat.messages.push(msg);
  chat.unreadByUser = (chat.unreadByUser || 0) + 1;
  chat.unreadByAdmin = 0;
  chat.updatedAt = msg.createdAt;
  saveDatabase();
  broadcastEvent('support_message', { chat });
  res.json(chat);
});

// Admin: mark read / change status
app.put('/api/support/chats/:chatId', (req, res) => {
  ensureSupport();
  const chat = db.supportChats.find(c => c.id === req.params.chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const { status, markRead } = req.body;
  if (status) chat.status = status;
  if (markRead) chat.unreadByAdmin = 0;
  saveDatabase();
  broadcastEvent('support_message', { chat });
  res.json(chat);
});

// Admin: delete chat
app.delete('/api/support/chats/:chatId', (req, res) => {
  ensureSupport();
  db.supportChats = db.supportChats.filter(c => c.id !== req.params.chatId);
  saveDatabase();
  broadcastEvent('support_chat_deleted', { chatId: req.params.chatId });
  res.json({ message: 'Chat deleted' });
});

// Reset database to initial state
app.post('/api/reset', (req, res) => {
  db = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveDatabase();
  broadcastEvent('state_reset', {});
  res.json({ message: 'Platform data reset to defaults' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`DEVSYNX WebSynx Platform API Server running on port ${PORT}`);
});
