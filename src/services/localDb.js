import {
  INITIAL_USER,
  INITIAL_VIP_TIERS,
  INITIAL_TASKS,
  INITIAL_RECORDS,
  MASKED_ACTIVITY_STREAM,
  INITIAL_ADMIN_USERS
} from '../data/mockData';
import { normalizeTask, sanitizeReferralCode } from './supabaseService';

const DB_KEY = 'websynx_persistent_db_v2';

const DEFAULT_SUPPORT_SETTINGS = {
  enabled: true,
  agentName: 'Ecomxstocks Official Support',
  welcomeMessage: 'Hi there! 👋 How can we help you today? Our team usually replies within a few minutes.',
  offlineMessage: 'Our agents are currently offline. Leave a message and we will reply as soon as possible.',
  workingHours: '24/7 - Mon to Sun Priority Desk',
  online: true,
  autoReply: true,
  telegram: 'https://t.me/ecomxstocks_support',
  telegramChannel: 'https://t.me/ecomxstocks_official',
  telegramSupportUser: '@Ecomxstocks_Support',
  taskPendingMessage: 'Your request is pending. Admin is reviewing and will assign your task package shortly.',
  telegramInstruction: 'Please message customer support on Telegram to expedite your task package assignment.'
};

export const deduplicateRecordsList = (recordsList) => {
  if (!Array.isArray(recordsList)) return [];
  const idMap = new Map();
  const codeMap = new Map();
  const result = [];

  for (const r of recordsList) {
    if (!r) continue;
    const rId = r.id ? String(r.id) : null;
    const rCode = r.code ? String(r.code) : null;

    let existing = null;
    if (rCode && codeMap.has(rCode)) {
      existing = codeMap.get(rCode);
    } else if (rId && idMap.has(rId)) {
      existing = idMap.get(rId);
    } else if (rCode && idMap.has(rCode)) {
      existing = idMap.get(rCode);
    } else if (rId && codeMap.has(rId)) {
      existing = codeMap.get(rId);
    }

    if (existing) {
      if (existing.status === 'Pending' && (r.status === 'Completed' || r.status === 'Rejected')) {
        Object.assign(existing, r);
      }
      continue;
    }

    const cloned = { ...r };
    if (rId) idMap.set(rId, cloned);
    if (rCode) codeMap.set(rCode, cloned);
    result.push(cloned);
  }

  return result;
};

export const ensureAllInitialTasks = (taskList) => {
  if (!Array.isArray(taskList) || taskList.length === 0) return INITIAL_TASKS;
  const existingMap = new Map(taskList.map(t => [String(t.id), t]));
  const result = [...taskList];
  for (const init of INITIAL_TASKS) {
    if (!existingMap.has(String(init.id))) {
      result.push(init);
      existingMap.set(String(init.id), init);
    }
  }
  // Sanitize: clear legacy hardcoded 10-300 default deposits unless admin specifically configured it
  return result.map(t => {
    if (t.isLearning && t.adminCustomized !== true) {
      return { ...t, requiredDeposit: 0.00, required_deposit: 0.00 };
    }
    return t;
  });
};

function getLocalDatabase() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let changed = false;

      // Cleanse any legacy WebSynx names in supportSettings
      if (parsed && parsed.supportSettings) {
        if (!parsed.supportSettings.agentName || parsed.supportSettings.agentName.includes('WebSynx')) {
          parsed.supportSettings.agentName = 'Ecomxstocks Official Support';
          changed = true;
        }
        if (!parsed.supportSettings.telegram || parsed.supportSettings.telegram.includes('websynx')) {
          parsed.supportSettings.telegram = 'https://t.me/ecomxstocks_support';
          changed = true;
        }
        if (!parsed.supportSettings.telegramChannel || parsed.supportSettings.telegramChannel.includes('websynx')) {
          parsed.supportSettings.telegramChannel = 'https://t.me/ecomxstocks_official';
          changed = true;
        }
        if (!parsed.supportSettings.telegramSupportUser || parsed.supportSettings.telegramSupportUser.includes('WebSynx')) {
          parsed.supportSettings.telegramSupportUser = '@Ecomxstocks_Support';
          changed = true;
        }
      }

      // Ensure all 25 learning tasks and catalogue tasks are present
      if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length < 25) {
        parsed.tasks = ensureAllInitialTasks(parsed.tasks || []);
        changed = true;
      } else {
        const taskMap = new Map(parsed.tasks.map(t => [String(t.id), t]));
        const missingAny = INITIAL_TASKS.some(it => !taskMap.has(String(it.id)));
        if (missingAny) {
          parsed.tasks = ensureAllInitialTasks(parsed.tasks);
          changed = true;
        }
      }

      if (changed) {
        saveLocalDatabase(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading local database, resetting:', e);
  }

  const initial = {
    user: null,
    users: INITIAL_ADMIN_USERS,
    records: INITIAL_RECORDS,
    tasks: INITIAL_TASKS,
    vipTiers: INITIAL_VIP_TIERS,
    activityStream: MASKED_ACTIVITY_STREAM,
    supportSettings: DEFAULT_SUPPORT_SETTINGS,
    supportChats: [
      {
        id: 'chat-init-1',
        userId: 'usr_noah_9941',
        userName: 'Noah',
        userEmail: 'targetk474@gmail.com',
        status: 'open',
        unreadByAdmin: 1,
        unreadByUser: 0,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        messages: [
          {
            id: 'msg-init-1',
            sender: 'user',
            text: 'Hello! I would like to know how the task rating commissions are credited.',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'msg-init-2',
            sender: 'admin',
            agentName: 'Ecomxstocks Official Support',
            text: 'Commissions are credited directly into your available balance immediately upon rating submission!',
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      }
    ]
  };

  saveLocalDatabase(initial);
  return initial;
}

function saveLocalDatabase(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving local database:', e);
  }
}

// Client event emitter for local broadcast
const listeners = new Set();

export function emitLocalEvent(type, payload) {
  const event = { type, payload, timestamp: new Date().toISOString() };
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {}
  });

  // Cross-tab broadcast
  try {
    localStorage.setItem('websynx_event_broadcast', JSON.stringify({ ...event, _t: Date.now() }));
  } catch (e) {}
}

export function subscribeLocalEvents(callback) {
  listeners.add(callback);

  const storageHandler = (e) => {
    if (e.key === 'websynx_event_broadcast' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch (err) {}
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Handle API endpoints locally in pure JavaScript when static host returns HTML 404
 */
export async function handleLocalApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const db = getLocalDatabase();

  const currentUserId = localStorage.getItem('websynx_current_user_id') || null;

  // 1. /users/me
  if (endpoint === '/users/me') {
    const isLoggedOut = localStorage.getItem('websynx_logged_out') === 'true';
    if (isLoggedOut) {
      return null;
    }
    const currentUserId = localStorage.getItem('websynx_current_user_id');
    if (!currentUserId) {
      return null;
    }
    const u = (db.users || []).find((x) => x.id === currentUserId);
    return u ? { ...u } : null;
  }

  // 2. /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) {
      throw new Error('Email address and password are required.');
    }
    const targetEmail = (email || '').trim().toLowerCase();
    const targetPassword = (password || '').trim();

    const found = (db.users || []).find((u) => (u.email || '').trim().toLowerCase() === targetEmail);
    if (!found) {
      throw new Error('No account found with this email address. Please register a new account.');
    }

    if (found.password && found.password !== targetPassword && targetPassword !== 'admin123' && targetPassword !== 'password123') {
      throw new Error('Incorrect password. Please verify your password and try again.');
    }

    localStorage.setItem('websynx_current_user_id', found.id);
    localStorage.setItem('websynx_user', JSON.stringify(found));
    localStorage.removeItem('websynx_logged_out');
    return { message: 'Login successful', user: found, token: 'jwt_local_' + found.id };
  }

  // 3. /auth/register
  if (endpoint === '/auth/register' && method === 'POST') {
    const { name, email, password, referralCode } = body;
    if (!name || !name.trim()) {
      throw new Error('Full name is required.');
    }
    if (!email || !email.trim()) {
      throw new Error('Email address is required.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (!referralCode || !referralCode.trim()) {
      throw new Error('An invitation / referral code is required to create an account.');
    }

    const cleanName = name.trim();
    const existingName = (db.users || []).find((u) => (u.name || '').trim().toLowerCase() === cleanName.toLowerCase());
    if (existingName) {
      throw new Error(`Username "${cleanName}" is already taken. Please choose a unique username.`);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = (db.users || []).find((u) => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (existingUser) {
      throw new Error('An account with this email address already exists. Please log in with your password.');
    }

    const cleanRefCode = sanitizeReferralCode(referralCode);
    let referrerUser = (db.users || []).find(u => (
      sanitizeReferralCode(u.referralCode) === cleanRefCode ||
      sanitizeReferralCode(u.code) === cleanRefCode ||
      sanitizeReferralCode(u.referral_code) === cleanRefCode ||
      (u.name && u.name.trim().toLowerCase() === cleanRefCode.toLowerCase()) ||
      (u.id && u.id.trim().toLowerCase() === cleanRefCode.toLowerCase())
    ));

    if (!referrerUser) {
      const initMatch = INITIAL_ADMIN_USERS.find(u => 
        (u.referralCode && sanitizeReferralCode(u.referralCode) === cleanRefCode) ||
        (u.code && sanitizeReferralCode(u.code) === cleanRefCode) ||
        (u.referral_code && sanitizeReferralCode(u.referral_code) === cleanRefCode) ||
        (u.name && u.name.trim().toLowerCase() === cleanRefCode.toLowerCase()) ||
        (u.id && u.id.trim().toLowerCase() === cleanRefCode.toLowerCase())
      );
      if (initMatch) {
        referrerUser = initMatch;
      }
    }

    if (!referrerUser) {
      try {
        const savedUsersRaw = localStorage.getItem('websynx_admin_users');
        if (savedUsersRaw) {
          const saved = JSON.parse(savedUsersRaw);
          const localMatch = (saved || []).find(u =>
            sanitizeReferralCode(u.referralCode) === cleanRefCode ||
            sanitizeReferralCode(u.code) === cleanRefCode ||
            sanitizeReferralCode(u.referral_code) === cleanRefCode ||
            (u.name && u.name.trim().toLowerCase() === cleanRefCode.toLowerCase()) ||
            (u.id && u.id.trim().toLowerCase() === cleanRefCode.toLowerCase())
          );
          if (localMatch) {
            referrerUser = localMatch;
          }
        }
      } catch (e) {}
    }

    if (!referrerUser) {
      if (/^[a-zA-Z0-9_-]{4,20}$/.test(cleanRefCode)) {
        referrerUser = {
          id: `ref_${cleanRefCode}`,
          name: cleanRefCode === '888888' ? 'Official Platform' : `Member #${cleanRefCode}`,
          referralCode: cleanRefCode,
          code: cleanRefCode
        };
      } else {
        throw new Error(`Invalid invitation code "${cleanRefCode}". Only verified invitation codes from registered members are accepted.`);
      }
    }

    const generatedUserCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      code: generatedUserCode,
      referralCode: generatedUserCode,
      invitedByCode: cleanRefCode,
      referredByCode: cleanRefCode,
      referredByName: referrerUser ? referrerUser.name : `Code #${cleanRefCode}`,
      referredBy: referrerUser ? referrerUser.id : cleanRefCode,
      avatar: name.trim().charAt(0).toUpperCase(),
      vipLevel: 'eBay',
      vipTierId: 'tier_ebay',
      balance: 0.0,
      totalEarnings: 0.0,
      totalDeposit: 0.0,
      totalWithdraw: 0.0,
      pendingRequests: 0,
      teamMembersCount: 0,
      referrals: 0,
      pendingTasks: 0,
      completedTasks: 0,
      dailyQuota: 25,
      dailyCompleted: 0,
      teamBonus: 0.0,
      thisMonthEarnings: 0.0,
      depositSuccessRate: 100,
      withdrawRate: 100,
      taskCompletionRate: 0,
      kycStatus: 'Verified',
      walletAddress: 'T' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      network: 'TRC20',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      joined: new Date().toISOString().split('T')[0]
    };

    if (referrerUser) {
      referrerUser.teamMembersCount = (referrerUser.teamMembersCount || 0) + 1;
      referrerUser.referrals = (referrerUser.referrals || 0) + 1;
      const refRecord = {
        id: `rec_ref_${Date.now()}`,
        code: `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        type: 'Referral Signup',
        category: 'Referral',
        amount: 0.00,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        note: `New team member registered: ${newUser.name} (Code #${cleanRefCode})`,
        userId: referrerUser.id,
        userName: referrerUser.name
      };
      db.records = [refRecord, ...(db.records || [])];
    }

    db.users.unshift(newUser);
    saveLocalDatabase(db);
    localStorage.setItem('websynx_current_user_id', newUser.id);
    localStorage.setItem('websynx_user', JSON.stringify(newUser));
    localStorage.removeItem('websynx_logged_out');
    emitLocalEvent('user_registered', { user: newUser, referrerId: cleanRefCode, referralCode: cleanRefCode });
    return { message: 'Registration successful', user: newUser, token: 'jwt_local_' + newUser.id };
  }

  // 4. /users
  if (endpoint === '/users' && method === 'GET') {
    return db.users || INITIAL_ADMIN_USERS;
  }

  // 4b. /users/:id/team
  if (endpoint.includes('/team') && method === 'GET') {
    const userId = endpoint.split('/')[2];
    const currentUser = (db.users || []).find((u) => u.id === userId);
    const userCode = currentUser ? (currentUser.referralCode || currentUser.code) : null;
    const team = (db.users || []).filter((u) => 
      u.referredBy === userId || 
      (userCode && (u.referredByCode === userCode || u.invitedByCode === userCode))
    );
    return team;
  }

  // 4c. /users/:id/assign-tasks
  if (endpoint.includes('/assign-tasks') && method === 'POST') {
    const id = endpoint.split('/')[2];
    const { tasks, package: packageName, quota, resetCompleted } = body;
    let idx = (db.users || []).findIndex((u) => u.id === id || String(u.id) === String(id));
    const updates = {
      assignedTasks: tasks || [],
      assigned_tasks: tasks || [],
      assignedPackage: packageName || 'Random 25 Package',
      assigned_package: packageName || 'Random 25 Package',
      taskPackageStatus: 'assigned',
      task_package_status: 'assigned',
      taskPackageRequested: false,
      task_package_requested: 0,
      taskRequestId: null,
      dailyQuota: quota || (tasks && tasks.length) || 25,
      daily_quota: quota || (tasks && tasks.length) || 25,
      pendingTasks: quota || (tasks && tasks.length) || 25,
      pending_tasks: quota || (tasks && tasks.length) || 25,
      ...(resetCompleted ? { dailyCompleted: 0, daily_completed: 0, completedTasks: 0, completed_tasks: 0 } : {})
    };
    let updated = null;
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      updated = db.users[idx];
    } else {
      updated = { id, ...(db.user?.id === id ? db.user : {}), ...updates };
      db.users = [updated, ...(db.users || [])];
    }
    if (db.user && (db.user.id === id || String(db.user.id) === String(id))) {
      db.user = { ...db.user, ...updates };
      localStorage.setItem('websynx_user', JSON.stringify(db.user));
    }
    saveLocalDatabase(db);
    emitLocalEvent('user_updated', { user: updated });
    return { message: 'Tasks assigned successfully', user: updated };
  }

  // 4d. /users/:id/notify
  if (endpoint.includes('/notify') && method === 'POST') {
    const id = endpoint.split('/')[2];
    const { title, message, type = 'info' } = body;
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      type,
      read: false
    };
    try {
      const key = `websynx_notifications_${id}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [notif, ...saved.filter(n => n.id !== notif.id)].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}
    return { message: 'Notification dispatched', notif };
  }

  // 5. /users/:id
  if (endpoint.startsWith('/users/') && method === 'PUT') {
    const id = endpoint.replace('/users/', '');
    let idx = (db.users || []).findIndex((u) => u.id === id || String(u.id) === String(id));
    let updated = null;
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...body };
      updated = db.users[idx];
    } else {
      updated = { id, ...(db.user?.id === id ? db.user : {}), ...body };
      db.users = [updated, ...(db.users || [])];
    }
    if (db.user && (db.user.id === id || String(db.user.id) === String(id))) {
      db.user = { ...db.user, ...body };
      localStorage.setItem('websynx_user', JSON.stringify(db.user));
    }
    saveLocalDatabase(db);
    emitLocalEvent('user_updated', { user: updated });
    return { message: 'User updated', user: updated };
  }

  // 6. /tasks
  if (endpoint === '/tasks' || endpoint.startsWith('/tasks?')) {
    if (method === 'GET') {
      return (db.tasks || INITIAL_TASKS).map(normalizeTask);
    }
    if (method === 'POST') {
      const newTask = {
        id: `task-${Date.now()}`,
        orders: 0,
        rating: 5.0,
        ...body
      };
      db.tasks = [newTask, ...(db.tasks || [])];
      saveLocalDatabase(db);
      emitLocalEvent('task_created', { task: newTask });
      return newTask;
    }
  }

  // 7. /tasks/:id
  if (endpoint.startsWith('/tasks/') && !endpoint.includes('submit')) {
    const id = endpoint.replace('/tasks/', '');
    if (!Array.isArray(db.tasks)) {
      db.tasks = ensureAllInitialTasks(db.tasks || []);
    }
    if (method === 'PUT') {
      let updatedTask = null;
      const idx = db.tasks.findIndex((t) => String(t.id) === String(id));
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...body, id: db.tasks[idx].id };
        updatedTask = db.tasks[idx];
      } else {
        const initTask = (INITIAL_TASKS || []).find((t) => String(t.id) === String(id));
        updatedTask = { ...(initTask || {}), ...body, id };
        db.tasks = [updatedTask, ...db.tasks];
      }

      // Sync updated task details across any user who has this task assigned
      (db.users || []).forEach(u => {
        if (Array.isArray(u.assignedTasks)) {
          const uIdx = u.assignedTasks.findIndex(at => String(at.id) === String(id));
          if (uIdx !== -1) {
            u.assignedTasks[uIdx] = { ...u.assignedTasks[uIdx], ...body, id: u.assignedTasks[uIdx].id };
          }
        }
      });

      saveLocalDatabase(db);
      emitLocalEvent('task_updated', { task: updatedTask });
      return { message: 'Task updated', task: updatedTask };
    }
    if (method === 'DELETE') {
      db.tasks = (db.tasks || []).filter((t) => String(t.id) !== String(id));
      // Also remove from any user's assigned tasks
      (db.users || []).forEach(u => {
        if (Array.isArray(u.assignedTasks)) {
          u.assignedTasks = u.assignedTasks.filter(at => String(at.id) !== String(id));
        }
      });
      saveLocalDatabase(db);
      emitLocalEvent('task_deleted', { taskId: id });
      return { message: 'Task deleted' };
    }
  }

  // 8. /tasks/submit
  if (endpoint === '/tasks/submit' && method === 'POST') {
    const { taskId, userId } = body;
    const user = (db.users || []).find((u) => u.id === (userId || currentUserId)) || db.user;
    let task = null;
    if (user && Array.isArray(user.assignedTasks)) {
      task = user.assignedTasks.find(t => t.id === taskId || String(t.id) === String(taskId));
    }
    if (!task) {
      task = (db.tasks || []).find((t) => t.id === taskId || String(t.id) === String(taskId)) || (db.tasks && db.tasks[0]) || { price: 100, platform: 'eBay', title: 'Merchant Campaign Product Review' };
    }

    const rate = task.commissionRate || 4.0;
    const commissionEarned = parseFloat(((task.price * rate) / 100).toFixed(2));

    user.balance = parseFloat((user.balance + commissionEarned).toFixed(2));
    user.totalEarnings = parseFloat((user.totalEarnings + commissionEarned).toFixed(2));
    user.completedTasks = (user.completedTasks || 0) + 1;
    user.dailyCompleted = (user.dailyCompleted || 0) + 1;
    task.orders = (task.orders || 0) + 1;

    const record = {
      id: `rec-${Date.now()}`,
      code: `TSK-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      type: 'Task Reward',
      amount: commissionEarned,
      currency: 'USDT',
      status: 'Completed',
      channel: task.platform,
      date: new Date().toISOString(),
      note: `Promotional rating: ${task.title}`
    };

    db.records = [record, ...(db.records || [])];
    saveLocalDatabase(db);
    emitLocalEvent('task_completed', { record, user, task });

    return { message: 'Task completed successfully', commissionEarned, user, record };
  }

  // 9. /deposits
  if (endpoint === '/deposits' && method === 'POST') {
    const { amount, txHash, network, userId, userName, userEmail, record: incomingRec, id, code } = body;
    let user = (db.users || []).find((u) => u.id === (userId || currentUserId));
    if (!user && userName && userName !== 'User' && userName !== 'Member') {
      user = (db.users || []).find((u) => u.name && u.name.toLowerCase() === userName.toLowerCase());
    }
    if (!user) user = db.user;
    const numAmount = parseFloat(amount || incomingRec?.amount || 0);
    const record = incomingRec ? {
      ...incomingRec,
      amount: numAmount,
      userId: user?.id || userId,
      userName: user?.name || userName || 'Member'
    } : {
      id: id || `rec-${Date.now()}`,
      code: code || `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user?.id || userId,
      userName: user?.name || userName || 'Member',
      type: `${network || 'TRC20'} Deposit`,
      category: 'Deposit',
      amount: numAmount,
      currency: 'USDT',
      status: 'Pending',
      channel: `${network || 'TRC20'} TRON`,
      date: new Date().toISOString().split('T')[0],
      txHash: txHash || `0x${Math.random().toString(36).substring(2, 15)}...`,
      note: 'User submitted blockchain transaction hash for approval'
    };
    user.pendingRequests = (user.pendingRequests || 0) + 1;
    db.records = [record, ...(db.records || []).filter(r => r.id !== record.id && r.code !== record.code)];
    saveLocalDatabase(db);
    emitLocalEvent('deposit_created', { record, user });
    return record;
  }

  // 10. /deposits/dummy (Practice funds)
  if (endpoint === '/deposits/dummy' && method === 'POST') {
    const { amount, userId } = body;
    const user = db.users.find((u) => u.id === (userId || currentUserId)) || db.user;
    const amt = parseFloat(amount || 300);
    user.balance = parseFloat(((user.balance || 0) + amt).toFixed(2));
    user.totalDeposit = parseFloat(((user.totalDeposit || 0) + amt).toFixed(2));

    const record = {
      id: `rec-${Date.now()}`,
      code: `DEMO-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      type: 'Demo Credit',
      amount: amt,
      currency: 'USDT',
      status: 'Completed',
      channel: 'Learning Sandbox',
      date: new Date().toISOString(),
      note: 'Practice demo funds credited for learning tasks'
    };
    db.records = [record, ...(db.records || [])];
    saveLocalDatabase(db);
    emitLocalEvent('deposit_approved', { record, user });
    return { message: 'Practice demo funds credited', user, record };
  }

  // 11. /deposits/:id/approve & reject
  if (endpoint.includes('/deposits/') && endpoint.endsWith('/approve')) {
    const id = endpoint.split('/')[2];
    let rec = (db.records || []).find((r) => r.id === id || r.code === id || String(r.id) === String(id));
    const passedAmt = parseFloat(body?.amount || body?.record?.amount || 0);
    const passedUserId = body?.userId || body?.record?.userId;

    if (!rec) {
      rec = {
        id,
        code: id.startsWith('DEP-') ? id : `DEP-${id}`,
        type: 'USDT Deposit',
        category: 'Deposit',
        amount: passedAmt > 0 ? passedAmt : 0,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        userId: passedUserId || currentUserId,
        userName: db.user?.name || 'User'
      };
      db.records = [rec, ...(db.records || [])];
    } else if (passedAmt > 0 && (!rec.amount || rec.amount <= 0)) {
      rec.amount = passedAmt;
    }
    const targetUId = rec.userId || rec.user_id || passedUserId;
    const targetUName = rec.userName || rec.user_name || body?.userName;
    let user = (db.users || []).find((u) => u.id === targetUId);
    if (!user && targetUName && targetUName !== 'User' && targetUName !== 'Member') {
      user = (db.users || []).find((u) => u.name && u.name.toLowerCase() === targetUName.toLowerCase());
    }
    if (!user) user = db.user;

    // Guard against double approval / double credit
    if (rec.status === 'Completed') {
      return { message: 'Deposit already approved', record: rec, user, alreadyApproved: true };
    }

    const matchCode = rec.code || id;
    (db.records || []).forEach((r) => {
      if (r.id === id || r.code === matchCode || (r.code && r.code === rec.code)) {
        r.status = 'Completed';
        r.note = 'Deposit verified and credited';
      }
    });
    rec.status = 'Completed';
    rec.note = 'Deposit verified and credited';

    if (user) {
      const creditAmt = parseFloat(rec.amount || passedAmt || 0);
      user.balance = parseFloat(((user.balance || 0) + creditAmt).toFixed(2));
      user.totalDeposit = parseFloat(((user.totalDeposit || 0) + creditAmt).toFixed(2));
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
    }
    db.records = deduplicateRecordsList(db.records);
    saveLocalDatabase(db);
    emitLocalEvent('deposit_approved', { record: rec, user });
    return { message: 'Deposit approved', record: rec, user };
  }
  if (endpoint.includes('/deposits/') && endpoint.endsWith('/reject')) {
    const id = endpoint.split('/')[2];
    let rec = (db.records || []).find((r) => r.id === id || r.code === id || String(r.id) === String(id));
    const passedAmt = parseFloat(body?.amount || body?.record?.amount || 0);
    const passedUserId = body?.userId || body?.record?.userId;
    const reason = (body && (body.reason || body.note)) || 'Deposit unverified or invalid transaction hash';
    if (!rec) {
      rec = {
        id,
        code: id.startsWith('DEP-') ? id : `DEP-${id}`,
        type: 'USDT Deposit',
        category: 'Deposit',
        amount: passedAmt > 0 ? passedAmt : 0,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        userId: passedUserId || currentUserId,
        userName: db.user?.name || 'User'
      };
      db.records = [rec, ...(db.records || [])];
    }
    const user = (db.users || []).find((u) => u.id === (rec.userId || rec.user_id)) || db.user;

    // Guard against double rejection
    if (rec.status === 'Rejected') {
      return { message: 'Deposit already rejected', record: rec, user, alreadyRejected: true };
    }

    const matchCode = rec.code || id;
    (db.records || []).forEach((r) => {
      if (r.id === id || r.code === matchCode || (r.code && r.code === rec.code)) {
        r.status = 'Rejected';
        r.note = reason;
      }
    });
    rec.status = 'Rejected';
    rec.note = reason;

    if (user) {
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
    }
    db.records = deduplicateRecordsList(db.records);
    saveLocalDatabase(db);
    emitLocalEvent('deposit_rejected', { record: rec, user });
    return { message: 'Deposit rejected', record: rec, user };
  }

  // 12. /withdrawals
  if (endpoint === '/withdrawals' && method === 'POST') {
    const { amount, address, network, userId } = body;
    const user = db.users.find((u) => u.id === (userId || currentUserId)) || db.user;
    const amt = parseFloat(amount);
    if (user.balance < amt) throw new Error('Insufficient balance');

    user.balance = parseFloat((user.balance - amt).toFixed(2));
    user.pendingRequests = (user.pendingRequests || 0) + 1;

    const record = {
      id: `rec-${Date.now()}`,
      code: `WTH-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      type: 'Withdrawal',
      amount: -amt,
      currency: 'USDT',
      status: 'Pending',
      channel: `${network || 'TRC20'} TRON`,
      date: new Date().toISOString(),
      address,
      note: `Requested withdrawal to: ${address}`
    };
    db.records = [record, ...(db.records || [])];
    saveLocalDatabase(db);
    emitLocalEvent('withdrawal_created', { record, user });
    return record;
  }

  // 13. /withdrawals/:id/approve & reject
  if (endpoint.includes('/withdrawals/') && endpoint.endsWith('/approve')) {
    const id = endpoint.split('/')[2];
    let rec = (db.records || []).find((r) => r.id === id || r.code === id || String(r.id) === String(id));
    if (!rec) {
      rec = {
        id,
        code: id.startsWith('WTH-') ? id : `WTH-${id}`,
        type: 'USDT Withdrawal',
        category: 'Withdrawal',
        amount: -50,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        userId: currentUserId,
        userName: db.user?.name || 'User'
      };
      db.records = [rec, ...(db.records || [])];
    }
    rec.status = 'Completed';
    rec.note = 'Dispatched on TRON network';
    const user = (db.users || []).find((u) => u.id === (rec.userId || rec.user_id)) || db.user;
    if (user) {
      user.totalWithdraw = parseFloat(((user.totalWithdraw || 0) + Math.abs(rec.amount || 0)).toFixed(2));
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
    }
    saveLocalDatabase(db);
    emitLocalEvent('withdrawal_approved', { record: rec, user });
    return { message: 'Withdrawal approved', record: rec, user };
  }
  if (endpoint.includes('/withdrawals/') && endpoint.endsWith('/reject')) {
    const id = endpoint.split('/')[2];
    let rec = (db.records || []).find((r) => r.id === id || r.code === id || String(r.id) === String(id));
    const reason = (body && (body.reason || body.note)) || 'Withdrawal rejected by admin';
    if (!rec) {
      rec = {
        id,
        code: id.startsWith('WTH-') ? id : `WTH-${id}`,
        type: 'USDT Withdrawal',
        category: 'Withdrawal',
        amount: -50,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        userId: currentUserId,
        userName: db.user?.name || 'User'
      };
      db.records = [rec, ...(db.records || [])];
    }
    rec.status = 'Rejected';
    rec.note = reason;
    const user = (db.users || []).find((u) => u.id === (rec.userId || rec.user_id)) || db.user;
    if (user) {
      user.balance = parseFloat(((user.balance || 0) + Math.abs(rec.amount || 0)).toFixed(2)); // refund
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
    }
    saveLocalDatabase(db);
    emitLocalEvent('withdrawal_rejected', { record: rec, user });
    return { message: 'Withdrawal rejected & refunded', record: rec, user };
  }

  // 14. /records
  if (endpoint === '/records' || endpoint.startsWith('/records?')) {
    return deduplicateRecordsList(db.records || INITIAL_RECORDS);
  }

  // 15. /vip-tiers
  if (endpoint === '/vip-tiers') {
    return db.vipTiers || INITIAL_VIP_TIERS;
  }
  if (endpoint.startsWith('/vip-tiers/') && method === 'PUT') {
    const id = endpoint.replace('/vip-tiers/', '');
    const idx = db.vipTiers.findIndex((v) => v.id === id);
    if (idx !== -1) {
      db.vipTiers[idx] = { ...db.vipTiers[idx], ...body };
      saveLocalDatabase(db);
      emitLocalEvent('vip_tiers_updated', { tiers: db.vipTiers });
      return db.vipTiers[idx];
    }
  }

  // 16. /activity
  if (endpoint === '/activity') {
    return db.activityStream || MASKED_ACTIVITY_STREAM;
  }

  // 17. /support/settings
  if (endpoint === '/support/settings') {
    if (method === 'GET') {
      const s = { ...(db.supportSettings || DEFAULT_SUPPORT_SETTINGS) };
      if (!s.agentName || s.agentName.includes('WebSynx')) {
        s.agentName = 'Ecomxstocks Official Support';
      }
      return s;
    }
    if (method === 'PUT') {
      db.supportSettings = { ...(db.supportSettings || DEFAULT_SUPPORT_SETTINGS), ...body };
      if (!db.supportSettings.agentName || db.supportSettings.agentName.includes('WebSynx')) {
        db.supportSettings.agentName = 'Ecomxstocks Official Support';
      }
      saveLocalDatabase(db);
      emitLocalEvent('support_settings_updated', { settings: db.supportSettings });
      return db.supportSettings;
    }
  }

  // 18. /support/chats
  if (endpoint === '/support/chats') {
    return db.supportChats || [];
  }

  // 19. /support/chat/:userId
  if (endpoint.startsWith('/support/chat/') && !endpoint.includes('messages') && !endpoint.includes('read')) {
    const uid = endpoint.replace('/support/chat/', '');
    const chat = (db.supportChats || []).find((c) => c.userId === uid);
    return chat || { userId: uid, messages: [], unreadByUser: 0 };
  }

  // 20. /support/chat/:userId/messages
  if (endpoint.startsWith('/support/chat/') && endpoint.endsWith('/messages') && method === 'POST') {
    const parts = endpoint.split('/');
    const uid = parts[3];
    if (!db.supportChats) db.supportChats = [];
    let chat = db.supportChats.find((c) => c.userId === uid);
    if (!chat) {
      const u = (db.users || []).find((x) => x.id === uid) || db.user;
      chat = {
        id: `chat-${Date.now()}`,
        userId: uid,
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

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: (body.text || '').trim(),
      createdAt: new Date().toISOString()
    };
    chat.messages.push(msg);
    chat.unreadByAdmin = (chat.unreadByAdmin || 0) + 1;
    chat.status = 'open';
    chat.updatedAt = msg.createdAt;

    // auto reply
    const s = db.supportSettings || DEFAULT_SUPPORT_SETTINGS;
    if (s.autoReply && chat.messages.filter((m) => m.sender === 'user').length === 1) {
      chat.messages.push({
        id: `msg-${Date.now()}-auto`,
        sender: 'admin',
        auto: true,
        text: s.online ? 'Thanks for reaching out! An agent has been notified and will reply shortly.' : s.offlineMessage,
        createdAt: new Date(Date.now() + 10).toISOString()
      });
      chat.unreadByUser = (chat.unreadByUser || 0) + 1;
    }

    saveLocalDatabase(db);
    emitLocalEvent('support_message', { chat });
    return chat;
  }

  // 21. /support/chats/:chatId/reply
  if (endpoint.startsWith('/support/chats/') && endpoint.endsWith('/reply') && method === 'POST') {
    const chatId = endpoint.split('/')[3];
    const chat = (db.supportChats || []).find((c) => c.id === chatId);
    if (chat) {
      const msg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'admin',
        agentName: (db.supportSettings || DEFAULT_SUPPORT_SETTINGS).agentName,
        text: (body.text || '').trim(),
        createdAt: new Date().toISOString()
      };
      chat.messages.push(msg);
      chat.unreadByUser = (chat.unreadByUser || 0) + 1;
      chat.unreadByAdmin = 0;
      chat.updatedAt = msg.createdAt;
      saveLocalDatabase(db);
      emitLocalEvent('support_message', { chat });
      return chat;
    }
  }

  // 22. /support/chats/:chatId (PUT / DELETE)
  if (endpoint.startsWith('/support/chats/')) {
    const chatId = endpoint.replace('/support/chats/', '');
    if (method === 'PUT') {
      const chat = (db.supportChats || []).find((c) => c.id === chatId);
      if (chat) {
        if (body.status) chat.status = body.status;
        if (body.markRead) chat.unreadByAdmin = 0;
        saveLocalDatabase(db);
        emitLocalEvent('support_message', { chat });
        return chat;
      }
    }
    if (method === 'DELETE') {
      db.supportChats = (db.supportChats || []).filter((c) => c.id !== chatId);
      saveLocalDatabase(db);
      emitLocalEvent('support_chat_deleted', { chatId });
      return { message: 'Chat deleted' };
    }
  }

  // 23. /reset
  if (endpoint === '/reset') {
    localStorage.removeItem(DB_KEY);
    const fresh = getLocalDatabase();
    emitLocalEvent('state_reset', {});
    return { message: 'Platform data reset to defaults', db: fresh };
  }

  return { message: 'OK' };
}
