import {
  INITIAL_USER,
  INITIAL_VIP_TIERS,
  INITIAL_TASKS,
  INITIAL_RECORDS,
  MASKED_ACTIVITY_STREAM,
  INITIAL_ADMIN_USERS
} from '../data/mockData';

const DB_KEY = 'websynx_persistent_db_v2';

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

function getLocalDatabase() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading local database, resetting:', e);
  }

  const initial = {
    user: INITIAL_USER,
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
            agentName: 'WebSynx Support',
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
export function handleLocalApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const db = getLocalDatabase();

  const currentUserId = localStorage.getItem('websynx_current_user_id') || 'usr_noah_9941';

  // 1. /users/me
  if (endpoint === '/users/me') {
    const u = db.users?.find((x) => x.id === currentUserId) || db.user || INITIAL_USER;
    return { ...u };
  }

  // 2. /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const targetEmail = (email || '').trim().toLowerCase();
    const found = db.users?.find((u) => (u.email || '').toLowerCase() === targetEmail);
    if (found) {
      localStorage.setItem('websynx_current_user_id', found.id);
      return { message: 'Login successful', user: found, token: 'jwt_local_' + found.id };
    }
    const defaultUser = db.user || INITIAL_USER;
    localStorage.setItem('websynx_current_user_id', defaultUser.id);
    return { message: 'Login successful', user: defaultUser, token: 'jwt_local_' + defaultUser.id };
  }

  // 3. /auth/register
  if (endpoint === '/auth/register' && method === 'POST') {
    const { name, email, password, referralCode } = body;
    if (!referralCode || !referralCode.trim()) {
      throw new Error('An invitation / referral code is required to create an account.');
    }
    const cleanRefCode = referralCode.trim();
    const referrerUser = (db.users || []).find(u => (u.referralCode === cleanRefCode || u.code === cleanRefCode));
    const generatedUserCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      code: generatedUserCode,
      referralCode: generatedUserCode,
      invitedByCode: cleanRefCode,
      referredByCode: cleanRefCode,
      referredByName: referrerUser ? referrerUser.name : `Code #${cleanRefCode}`,
      referredBy: referrerUser ? referrerUser.id : cleanRefCode,
      avatar: name.charAt(0).toUpperCase(),
      vipLevel: 'eBay',
      vipTierId: 'tier_ebay',
      balance: 0.0,
      totalEarnings: 0.0,
      totalDeposit: 0.0,
      totalWithdraw: 0.0,
      pendingRequests: 0,
      teamMembersCount: 0,
      referrals: 0,
      pendingTasks: 25,
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
    db.users.unshift(newUser);
    saveLocalDatabase(db);
    localStorage.setItem('websynx_current_user_id', newUser.id);
    emitLocalEvent('user_registered', { user: newUser, referrerId: referralCode });
    return { message: 'Registration successful', user: newUser, token: 'jwt_local_' + newUser.id };
  }

  // 4. /users
  if (endpoint === '/users' && method === 'GET') {
    return db.users || INITIAL_ADMIN_USERS;
  }

  // 5. /users/:id
  if (endpoint.startsWith('/users/') && method === 'PUT') {
    const id = endpoint.replace('/users/', '');
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...body };
      if (db.user && db.user.id === id) db.user = { ...db.user, ...body };
      saveLocalDatabase(db);
      emitLocalEvent('user_updated', { user: db.users[idx] });
      return { message: 'User updated', user: db.users[idx] };
    }
    return { message: 'User updated', user: body };
  }

  // 6. /tasks
  if (endpoint === '/tasks' || endpoint.startsWith('/tasks?')) {
    if (method === 'GET') {
      return db.tasks || INITIAL_TASKS;
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
    if (method === 'PUT') {
      const idx = db.tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...body };
        saveLocalDatabase(db);
        emitLocalEvent('task_updated', { task: db.tasks[idx] });
        return { message: 'Task updated', task: db.tasks[idx] };
      }
    }
    if (method === 'DELETE') {
      db.tasks = (db.tasks || []).filter((t) => t.id !== id);
      saveLocalDatabase(db);
      emitLocalEvent('task_deleted', { taskId: id });
      return { message: 'Task deleted' };
    }
  }

  // 8. /tasks/submit
  if (endpoint === '/tasks/submit' && method === 'POST') {
    const { taskId, userId } = body;
    const task = db.tasks.find((t) => t.id === taskId) || db.tasks[0];
    const user = db.users.find((u) => u.id === (userId || currentUserId)) || db.user;

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
    const { amount, txHash, network, userId } = body;
    const user = db.users.find((u) => u.id === (userId || currentUserId)) || db.user;
    const record = {
      id: `rec-${Date.now()}`,
      code: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      type: 'Deposit',
      amount: parseFloat(amount),
      currency: 'USDT',
      status: 'Pending',
      channel: `${network} TRON`,
      date: new Date().toISOString(),
      txHash: txHash || `0x${Math.random().toString(36).substring(2, 15)}...`,
      note: 'User submitted blockchain transaction hash for approval'
    };
    user.pendingRequests = (user.pendingRequests || 0) + 1;
    db.records = [record, ...(db.records || [])];
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
    const rec = db.records.find((r) => r.id === id);
    if (rec) {
      rec.status = 'Completed';
      const user = db.users.find((u) => u.id === rec.userId) || db.user;
      user.balance = parseFloat(((user.balance || 0) + rec.amount).toFixed(2));
      user.totalDeposit = parseFloat(((user.totalDeposit || 0) + rec.amount).toFixed(2));
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
      saveLocalDatabase(db);
      emitLocalEvent('deposit_approved', { record: rec, user });
      return { message: 'Deposit approved', record: rec, user };
    }
  }
  if (endpoint.includes('/deposits/') && endpoint.endsWith('/reject')) {
    const id = endpoint.split('/')[2];
    const rec = db.records.find((r) => r.id === id);
    if (rec) {
      rec.status = 'Rejected';
      const user = db.users.find((u) => u.id === rec.userId) || db.user;
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
      saveLocalDatabase(db);
      emitLocalEvent('deposit_rejected', { record: rec, user });
      return { message: 'Deposit rejected', record: rec, user };
    }
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
    const rec = db.records.find((r) => r.id === id);
    if (rec) {
      rec.status = 'Completed';
      const user = db.users.find((u) => u.id === rec.userId) || db.user;
      user.totalWithdraw = parseFloat(((user.totalWithdraw || 0) + Math.abs(rec.amount)).toFixed(2));
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
      saveLocalDatabase(db);
      emitLocalEvent('withdrawal_approved', { record: rec, user });
      return { message: 'Withdrawal approved', record: rec, user };
    }
  }
  if (endpoint.includes('/withdrawals/') && endpoint.endsWith('/reject')) {
    const id = endpoint.split('/')[2];
    const rec = db.records.find((r) => r.id === id);
    if (rec) {
      rec.status = 'Rejected';
      const user = db.users.find((u) => u.id === rec.userId) || db.user;
      user.balance = parseFloat(((user.balance || 0) + Math.abs(rec.amount)).toFixed(2)); // refund
      user.pendingRequests = Math.max(0, (user.pendingRequests || 1) - 1);
      saveLocalDatabase(db);
      emitLocalEvent('withdrawal_rejected', { record: rec, user });
      return { message: 'Withdrawal rejected & refunded', record: rec, user };
    }
  }

  // 14. /records
  if (endpoint === '/records' || endpoint.startsWith('/records?')) {
    return db.records || INITIAL_RECORDS;
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
      return db.supportSettings || DEFAULT_SUPPORT_SETTINGS;
    }
    if (method === 'PUT') {
      db.supportSettings = { ...(db.supportSettings || DEFAULT_SUPPORT_SETTINGS), ...body };
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
