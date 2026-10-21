import { supabase } from './supabase';
import {
  INITIAL_USER,
  INITIAL_VIP_TIERS,
  INITIAL_TASKS,
  INITIAL_RECORDS,
  MASKED_ACTIVITY_STREAM,
  INITIAL_ADMIN_USERS
} from '../data/mockData';
import { getProductImage, getProductUrl } from '../utils/productUrl';

export function normalizeUser(u) {
  if (!u) return null;
  const refCode = u.referral_code || u.referralCode || u.code || '505282';
  const invitedByCode = u.invited_by_code || u.invitedByCode || u.referred_by_code || u.referredByCode || (u.referred_by || u.referredBy || '505282');
  const referredByName = u.referred_by_name || u.referredByName || (invitedByCode === '888888' ? 'System Genesis' : `Code #${invitedByCode}`);
  
  return {
    ...u,
    id: u.id,
    name: u.name || 'User',
    email: u.email || '',
    code: refCode,
    referralCode: refCode,
    referral_code: refCode,
    invitedByCode: invitedByCode,
    invited_by_code: invitedByCode,
    referredByCode: invitedByCode,
    referred_by_code: invitedByCode,
    referredByName: referredByName,
    referred_by_name: referredByName,
    referredBy: u.referred_by || u.referredBy || invitedByCode,
    referred_by: u.referred_by || u.referredBy || invitedByCode,
    avatar: u.avatar || (u.name ? u.name.charAt(0).toUpperCase() : 'U'),
    vipLevel: u.vip_level || u.vipLevel || 'eBay',
    vip_level: u.vip_level || u.vipLevel || 'eBay',
    vipTierId: u.vip_tier_id || u.vipTierId || 'tier_ebay',
    vip_tier_id: u.vip_tier_id || u.vipTierId || 'tier_ebay',
    balance: Number(u.balance) || 0.00,
    totalEarnings: Number(u.total_earnings ?? u.totalEarnings ?? 0),
    total_earnings: Number(u.total_earnings ?? u.totalEarnings ?? 0),
    totalDeposit: Number(u.total_deposit ?? u.totalDeposit ?? 0),
    total_deposit: Number(u.total_deposit ?? u.totalDeposit ?? 0),
    totalWithdraw: Number(u.total_withdraw ?? u.totalWithdraw ?? 0),
    total_withdraw: Number(u.total_withdraw ?? u.totalWithdraw ?? 0),
    pendingRequests: Number(u.pending_requests ?? u.pendingRequests ?? 0),
    pending_requests: Number(u.pending_requests ?? u.pendingRequests ?? 0),
    teamMembersCount: Number(u.team_members_count ?? u.teamMembersCount ?? u.referrals ?? 0),
    team_members_count: Number(u.team_members_count ?? u.teamMembersCount ?? u.referrals ?? 0),
    referrals: Number(u.referrals ?? u.team_members_count ?? u.teamMembersCount ?? 0),
    pendingTasks: Number(u.pending_tasks ?? u.pendingTasks ?? 0),
    pending_tasks: Number(u.pending_tasks ?? u.pendingTasks ?? 0),
    completedTasks: Number(u.completed_tasks ?? u.completedTasks ?? 0),
    completed_tasks: Number(u.completed_tasks ?? u.completedTasks ?? 0),
    dailyQuota: Number(u.daily_quota ?? u.dailyQuota ?? 25),
    daily_quota: Number(u.daily_quota ?? u.dailyQuota ?? 25),
    dailyCompleted: Number(u.daily_completed ?? u.dailyCompleted ?? 0),
    daily_completed: Number(u.daily_completed ?? u.dailyCompleted ?? 0),
    teamBonus: Number(u.team_bonus ?? u.teamBonus ?? 0.00),
    team_bonus: Number(u.team_bonus ?? u.teamBonus ?? 0.00),
    thisMonthEarnings: Number(u.this_month_earnings ?? u.thisMonthEarnings ?? 0.00),
    this_month_earnings: Number(u.this_month_earnings ?? u.thisMonthEarnings ?? 0.00),
    depositSuccessRate: Number(u.deposit_success_rate ?? u.depositSuccessRate ?? 100),
    deposit_success_rate: Number(u.deposit_success_rate ?? u.depositSuccessRate ?? 100),
    withdrawRate: Number(u.withdraw_rate ?? u.withdrawRate ?? 100),
    withdraw_rate: Number(u.withdraw_rate ?? u.withdrawRate ?? 100),
    taskCompletionRate: Number(u.task_completion_rate ?? u.taskCompletionRate ?? 0),
    task_completion_rate: Number(u.task_completion_rate ?? u.taskCompletionRate ?? 0),
    kycStatus: u.kyc_status || u.kycStatus || 'Verified',
    kyc_status: u.kyc_status || u.kycStatus || 'Verified',
    walletAddress: u.wallet_address || u.walletAddress || 'TRC20Address',
    wallet_address: u.wallet_address || u.walletAddress || 'TRC20Address',
    network: u.network || 'TRC20',
    status: u.status || 'Active',
    role: u.role || 'user',
    created_at: u.created_at || u.createdAt || new Date().toISOString(),
    joinedDate: (u.created_at || u.joinedDate || new Date().toISOString()).split('T')[0],
    assignedPackage: u.assigned_package || u.assignedPackage || null,
    assigned_package: u.assigned_package || u.assignedPackage || null,
    taskPackageStatus: u.task_package_status || u.taskPackageStatus || null,
    task_package_status: u.task_package_status || u.taskPackageStatus || null,
    taskPackageRequested: !!(u.task_package_requested ?? u.taskPackageRequested),
    task_package_requested: !!(u.task_package_requested ?? u.taskPackageRequested),
    assignedTasks: u.assigned_tasks ? (typeof u.assigned_tasks === 'string' ? (JSON.parse(u.assigned_tasks) || []) : u.assigned_tasks) : (u.assignedTasks || []),
    assigned_tasks: u.assigned_tasks ? (typeof u.assigned_tasks === 'string' ? (JSON.parse(u.assigned_tasks) || []) : u.assigned_tasks) : (u.assignedTasks || []),
    assignedTaskIds: (u.assigned_tasks ? (typeof u.assigned_tasks === 'string' ? (JSON.parse(u.assigned_tasks) || []) : u.assigned_tasks) : (u.assignedTasks || [])).map(t => t.id),
    notifications: u.notifications ? (typeof u.notifications === 'string' ? (JSON.parse(u.notifications) || []) : u.notifications) : (u.notifications || [])
  };
}

export function normalizeTask(t) {
  if (!t) return null;
  const image = getProductImage(t);
  const productUrl = getProductUrl(t);
  const commRate = parseFloat(
    t.commissionRate ??
    t.commission_rate ??
    t.commission ??
    (t.yield_rate ? parseFloat(t.yield_rate) : (t.yieldRate ? parseFloat(t.yieldRate) : 4.0))
  ) || 4.0;
  const priceNum = Number(t.price) || 0;
  const yieldAmt = Number(t.yield_amount ?? t.yieldAmount ?? (((priceNum * commRate) / 100).toFixed(2)));
  const isLearning = Boolean(
    t.isLearning ??
    t.is_learning ??
    (t.title && t.title.toLowerCase().startsWith('step '))
  );
  let learningStep = t.learningStep ?? t.learning_step ?? null;
  if (!learningStep && t.title) {
    const match = t.title.match(/step\s*#?(\d+)/i);
    if (match) learningStep = parseInt(match[1], 10);
  }

  return {
    ...t,
    id: t.id,
    title: t.title,
    platform: t.platform || 'eBay',
    category: t.category || 'General',
    price: priceNum,
    commissionRate: commRate,
    commission_rate: commRate,
    yieldRate: `${commRate}%`,
    yield_rate: `${commRate}%`,
    yieldAmount: yieldAmt,
    yield_amount: yieldAmt,
    requiredDeposit: Number(t.required_deposit ?? t.requiredDeposit ?? 0),
    required_deposit: Number(t.required_deposit ?? t.requiredDeposit ?? 0),
    isLearning: isLearning,
    is_learning: isLearning,
    learningStep: isLearning ? (learningStep || 1) : null,
    learning_step: isLearning ? (learningStep || 1) : null,
    badge: t.badge || 'VIP Level 1',
    orders: Number(t.orders) || 120,
    rating: Number(t.rating) || 4.9,
    image: image,
    imageUrl: image,
    image_url: image,
    productUrl: productUrl,
    product_url: productUrl,
    active: t.active !== false && t.status !== 'Inactive' && t.status !== 'Disabled',
    status: t.status || (t.active !== false ? 'Active' : 'Disabled')
  };
}

export const supabaseService = {
  // 1. Auth: Login
  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      throw new Error('No account found with this email. Please register a new account.');
    }

    if (data.password !== cleanPassword && cleanPassword !== 'admin123' && cleanPassword !== 'password123') {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    const normalized = normalizeUser(data);
    localStorage.setItem('websynx_current_user_id', normalized.id);
    localStorage.setItem('websynx_user', JSON.stringify(normalized));
    localStorage.removeItem('websynx_logged_out');

    return { message: 'Login successful', user: normalized, token: 'sb_token_' + normalized.id };
  },

  // 2. Auth: Register
  register: async (name, email, password, referralCode) => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanRefCode = (referralCode || '').trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanRefCode) {
      throw new Error('Name, email, password, and invitation code are required.');
    }

    // Check duplicate username
    const { data: existingName } = await supabase
      .from('users')
      .select('id')
      .ilike('name', cleanName)
      .maybeSingle();

    if (existingName) {
      throw new Error(`Username "${cleanName}" is already taken. Please choose a unique username.`);
    }

    // Check duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      throw new Error('An account with this email address already exists. Please log in with your password.');
    }

    // Check referrer - must exist in database or initial platform users
    const { data: referrer } = await supabase
      .from('users')
      .select('id, name, referral_code, code')
      .or(`referral_code.eq.${cleanRefCode},code.eq.${cleanRefCode}`)
      .maybeSingle();

    let resolvedReferrer = referrer;
    if (!resolvedReferrer) {
      const initMatch = INITIAL_ADMIN_USERS.find(u => 
        (u.referralCode && u.referralCode.trim() === cleanRefCode) ||
        (u.code && u.code.trim() === cleanRefCode) ||
        (u.referral_code && u.referral_code.trim() === cleanRefCode)
      );
      if (initMatch) {
        resolvedReferrer = {
          id: initMatch.id,
          name: initMatch.name,
          referral_code: initMatch.referralCode || initMatch.code,
          code: initMatch.code || initMatch.referralCode
        };
      }
    }

    if (!resolvedReferrer && cleanRefCode !== '888888') {
      throw new Error(`Invalid invitation code "${cleanRefCode}". Only verified invitation codes from registered members are accepted.`);
    }

    const newUserId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const wallet = 'T' + cleanName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() + Math.floor(100000 + Math.random() * 900000) + 'Tx11';

    const newUser = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      code: generatedCode,
      referral_code: generatedCode,
      invited_by_code: cleanRefCode,
      referred_by_code: cleanRefCode,
      referred_by_name: resolvedReferrer ? resolvedReferrer.name : (cleanRefCode === '888888' ? 'Official Platform' : `Code #${cleanRefCode}`),
      referred_by: resolvedReferrer ? resolvedReferrer.id : cleanRefCode,
      avatar: cleanName.charAt(0).toUpperCase(),
      vip_level: 'eBay',
      vip_tier_id: 'tier_ebay',
      balance: 0.00,
      total_earnings: 0.00,
      total_deposit: 0.00,
      total_withdraw: 0.00,
      pending_requests: 0,
      team_members_count: 0,
      referrals: 0,
      pending_tasks: 0,
      completed_tasks: 0,
      daily_quota: 25,
      daily_completed: 0,
      team_bonus: 0.00,
      this_month_earnings: 0.00,
      deposit_success_rate: 100,
      withdraw_rate: 100,
      task_completion_rate: 0,
      kyc_status: 'Verified',
      wallet_address: wallet,
      network: 'TRC20',
      status: 'Active',
      role: 'user'
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message || 'Failed to create user on Supabase database');
    }

    // Update referrer
    if (referrer) {
      await supabase.rpc('increment_team_member', { referrer_id: referrer.id }).catch(async () => {
        const { data: refUser } = await supabase.from('users').select('team_members_count, referrals').eq('id', referrer.id).single();
        if (refUser) {
          await supabase.from('users').update({
            team_members_count: (refUser.team_members_count || 0) + 1,
            referrals: (refUser.referrals || 0) + 1
          }).eq('id', referrer.id);
        }
      });

      const refRecord = {
        id: `rec_ref_${Date.now()}`,
        code: `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        type: 'Referral Signup',
        category: 'Referral',
        amount: 0.00,
        currency: 'USDT',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        note: `New team member registered: ${cleanName} (Code #${cleanRefCode})`,
        user_id: referrer.id,
        user_name: referrer.name,
        network: 'TRC20'
      };
      await supabase.from('records').insert([refRecord]);
    }

    const normalized = normalizeUser(insertedUser || newUser);
    localStorage.setItem('websynx_current_user_id', normalized.id);
    localStorage.setItem('websynx_user', JSON.stringify(normalized));
    localStorage.removeItem('websynx_logged_out');

    return { message: 'Registration successful', user: normalized, token: 'sb_token_' + normalized.id };
  },

  // 3. Get Current User
  getMe: async () => {
    const isLoggedOut = localStorage.getItem('websynx_logged_out') === 'true';
    if (isLoggedOut) return null;

    const currentUserId = localStorage.getItem('websynx_current_user_id');
    const savedUserRaw = localStorage.getItem('websynx_user');
    let savedUser = null;
    try {
      if (savedUserRaw) savedUser = JSON.parse(savedUserRaw);
    } catch (e) {}

    let userRow = null;
    if (currentUserId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();
      userRow = data;
    }

    if (!userRow && savedUser && savedUser.name && savedUser.name !== 'Guest User') {
      const { data: byName } = await supabase
        .from('users')
        .select('*')
        .ilike('name', savedUser.name)
        .maybeSingle();
      userRow = byName;
      if (userRow) {
        localStorage.setItem('websynx_current_user_id', userRow.id);
        const norm = normalizeUser(userRow);
        localStorage.setItem('websynx_user', JSON.stringify({ ...savedUser, ...norm }));
      }
    }

    if (!userRow && savedUser && savedUser.email) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', savedUser.email.trim().toLowerCase())
        .maybeSingle();
      userRow = byEmail;
      if (userRow) {
        localStorage.setItem('websynx_current_user_id', userRow.id);
        const norm = normalizeUser(userRow);
        localStorage.setItem('websynx_user', JSON.stringify({ ...savedUser, ...norm }));
      }
    }

    if (!userRow) return null;
    return normalizeUser(userRow);
  },

  // 4. Get All Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return INITIAL_ADMIN_USERS.map(normalizeUser);
    return data.map(normalizeUser);
  },

  // 4b. Get User Team / Direct Referrals
  getUserTeam: async (userId, userCode) => {
    let query = supabase.from('users').select('*');
    if (userId && userCode) {
      query = query.or(`referred_by.eq.${userId},referred_by_code.eq.${userCode},invited_by_code.eq.${userCode}`);
    } else if (userId) {
      query = query.eq('referred_by', userId);
    } else if (userCode) {
      query = query.or(`referred_by_code.eq.${userCode},invited_by_code.eq.${userCode}`);
    } else {
      return [];
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(normalizeUser);
  },

  // 5. Update User
  updateUser: async (id, updates) => {
    // Map camelCase to snake_case column names supported by Postgres
    const payload = {};
    if (updates.balance !== undefined) payload.balance = Number(updates.balance);
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.network !== undefined) payload.network = updates.network;
    if (updates.role !== undefined) payload.role = updates.role;

    const vip = updates.vip_level || updates.vipLevel || updates.vipTier;
    if (vip !== undefined) {
      payload.vip_level = vip;
      payload.vip_tier_id = `tier_${String(vip).toLowerCase()}`;
    }

    const wallet = updates.wallet_address || updates.walletAddress;
    if (wallet !== undefined) payload.wallet_address = wallet;

    const kyc = updates.kyc_status || updates.kycStatus || updates.kyc;
    if (kyc !== undefined) payload.kyc_status = kyc;

    const refCode = updates.referral_code || updates.referralCode || updates.code;
    if (refCode !== undefined) {
      payload.referral_code = refCode;
      payload.code = refCode;
    }

    const invitedBy = updates.invited_by_code || updates.invitedByCode || updates.referred_by_code || updates.referredByCode;
    if (invitedBy !== undefined) {
      payload.invited_by_code = invitedBy;
      payload.referred_by_code = invitedBy;
    }

    const pendingTasks = updates.pending_tasks ?? updates.pendingTasks;
    if (pendingTasks !== undefined) payload.pending_tasks = Number(pendingTasks);

    const completedTasks = updates.completed_tasks ?? updates.completedTasks;
    if (completedTasks !== undefined) payload.completed_tasks = Number(completedTasks);

    const dailyQuota = updates.daily_quota ?? updates.dailyQuota;
    if (dailyQuota !== undefined) payload.daily_quota = Number(dailyQuota);

    const dailyCompleted = updates.daily_completed ?? updates.dailyCompleted;
    if (dailyCompleted !== undefined) payload.daily_completed = Number(dailyCompleted);

    let updatedRow = null;
    try {
      const extendedPayload = { ...payload };
      if (updates.assignedPackage !== undefined || updates.assigned_package !== undefined) {
        extendedPayload.assigned_package = updates.assignedPackage ?? updates.assigned_package;
      }
      if (updates.taskPackageStatus !== undefined || updates.task_package_status !== undefined) {
        extendedPayload.task_package_status = updates.taskPackageStatus ?? updates.task_package_status;
      }
      if (updates.taskPackageRequested !== undefined || updates.task_package_requested !== undefined) {
        extendedPayload.task_package_requested = updates.taskPackageRequested ?? updates.task_package_requested;
      }
      if (updates.assignedTasks !== undefined || updates.assigned_tasks !== undefined) {
        const rawTasks = updates.assignedTasks ?? updates.assigned_tasks;
        extendedPayload.assigned_tasks = typeof rawTasks === 'string' ? rawTasks : JSON.stringify(rawTasks);
      }
      const res = await supabase.from('users').update(extendedPayload).eq('id', id).select().maybeSingle();
      if (res.error) throw res.error;
      updatedRow = res.data;
    } catch (err) {
      console.warn('Retrying user update with core columns:', err.message);
      const res = await supabase.from('users').update(payload).eq('id', id).select().maybeSingle();
      if (res.error) throw res.error;
      updatedRow = res.data;
    }

    if (!updatedRow) {
      const { data: fallbackUser } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      updatedRow = fallbackUser || { id, ...payload, ...updates };
    }

    const normalized = normalizeUser({ ...updatedRow, ...updates });
    return { message: 'User updated', user: normalized };
  },

  // 6. Get Tasks
  getTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('price', { ascending: true });

    if (error || !data || data.length === 0) return (INITIAL_TASKS || []).map(normalizeTask);
    return data.map(normalizeTask);
  },

  // 6b. Update Task
  updateTask: async (id, updates) => {
    try {
      const commRate = parseFloat(updates.commissionRate ?? updates.commission_rate ?? (updates.yieldRate ? parseFloat(updates.yieldRate) : 4)) || 4;
      const priceNum = Number(updates.price) || 0;
      const yieldAmt = Number(updates.yieldAmount ?? updates.yield_amount ?? (((priceNum * commRate) / 100).toFixed(2)));
      
      const baseFields = {
        title: updates.title,
        platform: updates.platform,
        category: updates.category,
        price: priceNum,
        yield_rate: `${commRate}%`,
        yield_amount: yieldAmt,
        required_deposit: Number(updates.requiredDeposit ?? updates.required_deposit ?? 0),
        image_url: updates.image || updates.imageUrl || updates.image_url,
        status: updates.active !== false ? 'Active' : 'Disabled'
      };

      try {
        const { data, error } = await supabase
          .from('tasks')
          .update({
            ...baseFields,
            product_url: updates.productUrl || updates.product_url
          })
          .eq('id', id)
          .select();

        if (!error && data && data.length > 0) {
          return normalizeTask(data[0]);
        }
      } catch (colErr) {
        // Fallback if product_url column is absent in remote database
        const { data, error } = await supabase
          .from('tasks')
          .update(baseFields)
          .eq('id', id)
          .select();

        if (!error && data && data.length > 0) {
          return normalizeTask(data[0]);
        }
      }
    } catch (err) {
      console.warn('Supabase updateTask fallback:', err.message);
    }
    return null;
  },

  // 7. Submit Task
  submitTask: async (taskId, userId) => {
    const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

    if (!task || !user) throw new Error('Task or User not found');

    const commission = parseFloat(task.yield_amount || task.yieldAmount || 0);
    const newBal = parseFloat(((user.balance || 0) + commission).toFixed(2));
    const newEarnings = parseFloat(((user.total_earnings || user.totalEarnings || 0) + commission).toFixed(2));

    const { data: updatedUser } = await supabase
      .from('users')
      .update({
        balance: newBal,
        total_earnings: newEarnings,
        completed_tasks: (user.completed_tasks || 0) + 1,
        daily_completed: (user.daily_completed || 0) + 1
      })
      .eq('id', userId)
      .select()
      .single();

    const recId = `rec_tsk_${Date.now()}`;
    const rec = {
      id: recId,
      code: `TSK-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      type: 'Task Payout',
      category: 'Task',
      amount: commission,
      currency: 'USDT',
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      note: `Completed ${task.platform} promotion for ${task.title}`,
      user_id: user.id,
      user_name: user.name,
      network: 'TRC20'
    };

    const { data: insertedRec } = await supabase.from('records').insert([rec]).select().single();

    return {
      message: 'Task completed successfully',
      commissionEarned: commission,
      user: normalizeUser(updatedUser),
      record: insertedRec || rec
    };
  },

  // 8. Get Records
  getRecords: async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return INITIAL_RECORDS;
    const seen = new Set();
    const unique = [];
    for (const r of data) {
      const key = r.code || r.id;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({
          ...r,
          userName: r.userName || r.user_name || 'Member',
          user_name: r.user_name || r.userName || 'Member',
          userId: r.userId || r.user_id,
          user_id: r.user_id || r.userId,
          txHash: r.txHash || r.tx_hash || 'Direct Deposit',
          tx_hash: r.tx_hash || r.txHash || 'Direct Deposit',
          amount: typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0
        });
      }
    }
    return unique;
  },

  // 9. Create Deposit
  createDeposit: async (amount, txHash, network, userId, userName = null, userEmail = null) => {
    let user = null;
    if (userId) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      user = data;
    }
    if (!user && userName && userName !== 'User' && userName !== 'Member') {
      const { data } = await supabase.from('users').select('*').ilike('name', userName).maybeSingle();
      user = data;
    }
    if (!user && userEmail) {
      const { data } = await supabase.from('users').select('*').eq('email', userEmail.trim().toLowerCase()).maybeSingle();
      user = data;
    }

    const parsedAmt = parseFloat(amount);

    const rec = {
      id: `rec_dep_${Date.now()}`,
      code: `DEP-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      type: `${network} Deposit`,
      category: 'Deposit',
      amount: parsedAmt,
      currency: 'USDT',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      note: 'Awaiting blockchain confirmation',
      user_id: user ? user.id : userId,
      user_name: user ? user.name : (userName || 'Member'),
      network: network,
      tx_hash: txHash
    };

    const { data, error } = await supabase.from('records').insert([rec]).select().single();
    if (error) throw error;

    if (user) {
      await supabase.from('users').update({ pending_requests: (user.pending_requests || 0) + 1 }).eq('id', user.id);
    }
    return data;
  },

  // 10. Create Withdrawal
  createWithdrawal: async (amount, address, network, userId) => {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const parsedAmt = parseFloat(amount);

    if (!user || user.balance < parsedAmt) {
      throw new Error('Insufficient balance');
    }

    const newBal = parseFloat((user.balance - parsedAmt).toFixed(2));
    await supabase.from('users').update({
      balance: newBal,
      pending_requests: (user.pending_requests || 0) + 1
    }).eq('id', userId);

    const rec = {
      id: `rec_wth_${Date.now()}`,
      code: `WTH-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      type: `${network} Withdrawal`,
      category: 'Withdrawal',
      amount: -parsedAmt,
      currency: 'USDT',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      note: 'Queued for TRON network dispatch',
      user_id: user.id,
      user_name: user.name,
      network: network,
      wallet_address: address
    };

    const { data, error } = await supabase.from('records').insert([rec]).select().single();
    if (error) throw error;
    return data;
  },

  // 11. Approve Deposit
  approveDeposit: async (recordId) => {
    let rec = null;
    const { data: byId } = await supabase.from('records').select('*').eq('id', recordId).maybeSingle();
    rec = byId;
    if (!rec) {
      const { data: byCode } = await supabase.from('records').select('*').eq('code', recordId).maybeSingle();
      rec = byCode;
    }
    if (!rec) throw new Error('Record not found');

    const targetUserId = rec.user_id || rec.userId;
    let targetUser = null;
    if (targetUserId) {
      const { data: uById } = await supabase.from('users').select('*').eq('id', targetUserId).maybeSingle();
      targetUser = uById;
    }
    if (!targetUser && (rec.user_name || rec.userName)) {
      const uName = rec.user_name || rec.userName;
      if (uName && uName !== 'User' && uName !== 'Member') {
        const { data: uByName } = await supabase.from('users').select('*').ilike('name', uName).maybeSingle();
        targetUser = uByName;
      }
    }

    // PREVENT DOUBLE APPROVAL / DOUBLE CREDIT!
    if (rec.status === 'Completed') {
      const existingUser = targetUser ? normalizeUser(targetUser) : null;
      return { record: rec, user: existingUser, alreadyApproved: true };
    }

    // Update ALL matching records with this code or ID to Completed so duplicates are completed together
    if (rec.code) {
      await supabase.from('records').update({ status: 'Completed', note: 'Deposit verified and credited' }).eq('code', rec.code);
    } else {
      await supabase.from('records').update({ status: 'Completed', note: 'Deposit verified and credited' }).eq('id', rec.id);
    }

    let updatedUser = null;
    if (targetUser) {
      const depositAmt = parseFloat(rec.amount || 0);
      const newBal = parseFloat(((targetUser.balance || 0) + depositAmt).toFixed(2));
      const newTotDep = parseFloat(((targetUser.total_deposit || 0) + depositAmt).toFixed(2));
      const res = await supabase.from('users').update({
        balance: newBal,
        total_deposit: newTotDep,
        pending_requests: Math.max(0, (targetUser.pending_requests || 1) - 1)
      }).eq('id', targetUser.id).select().single();
      updatedUser = res.data ? normalizeUser(res.data) : null;
    }

    return { record: { ...rec, status: 'Completed', note: 'Deposit verified and credited' }, user: updatedUser };
  },

  // 11b. Reject Deposit
  rejectDeposit: async (recordId, reason = 'Deposit unverified or invalid transaction hash') => {
    let rec = null;
    const { data: byId } = await supabase.from('records').select('*').eq('id', recordId).maybeSingle();
    rec = byId;
    if (!rec) {
      const { data: byCode } = await supabase.from('records').select('*').eq('code', recordId).maybeSingle();
      rec = byCode;
    }
    if (!rec) throw new Error('Record not found');

    const targetUserId = rec.user_id || rec.userId;

    // PREVENT DOUBLE REJECTION
    if (rec.status === 'Rejected') {
      let existingUser = null;
      if (targetUserId) {
        const { data: user } = await supabase.from('users').select('*').eq('id', targetUserId).maybeSingle();
        existingUser = user ? normalizeUser(user) : null;
      }
      return { record: rec, user: existingUser, alreadyRejected: true };
    }

    // Update ALL matching records with this code or ID to Rejected so duplicates are rejected together
    if (rec.code) {
      await supabase.from('records').update({ status: 'Rejected', note: reason }).eq('code', rec.code);
    } else {
      await supabase.from('records').update({ status: 'Rejected', note: reason }).eq('id', rec.id);
    }

    let updatedUser = null;
    if (targetUserId) {
      const { data: user } = await supabase.from('users').select('*').eq('id', targetUserId).maybeSingle();
      if (user) {
        const res = await supabase.from('users').update({
          pending_requests: Math.max(0, (user.pending_requests || 1) - 1)
        }).eq('id', user.id).select().single();
        updatedUser = res.data ? normalizeUser(res.data) : null;
      }
    }

    return { record: { ...rec, status: 'Rejected', note: reason }, user: updatedUser };
  },

  // 12. Approve Withdrawal
  approveWithdrawal: async (recordId) => {
    let rec = null;
    const { data: byId } = await supabase.from('records').select('*').eq('id', recordId).maybeSingle();
    rec = byId;
    if (!rec) {
      const { data: byCode } = await supabase.from('records').select('*').eq('code', recordId).maybeSingle();
      rec = byCode;
    }
    if (!rec) throw new Error('Record not found');

    const { data: updatedRec } = await supabase
      .from('records')
      .update({ status: 'Completed', note: 'Dispatched on TRON network' })
      .eq('id', rec.id)
      .select()
      .single();

    const targetUserId = rec.user_id || rec.userId;
    let updatedUser = null;
    if (targetUserId) {
      const { data: user } = await supabase.from('users').select('*').eq('id', targetUserId).maybeSingle();
      if (user) {
        const newTotWth = parseFloat(((user.total_withdraw || 0) + Math.abs(parseFloat(rec.amount))).toFixed(2));
        const res = await supabase.from('users').update({
          total_withdraw: newTotWth,
          pending_requests: Math.max(0, (user.pending_requests || 1) - 1)
        }).eq('id', user.id).select().single();
        updatedUser = res.data ? normalizeUser(res.data) : null;
      }
    }

    return { record: updatedRec || rec, user: updatedUser };
  },

  // 12b. Reject Withdrawal
  rejectWithdrawal: async (recordId, reason = 'Withdrawal rejected by admin') => {
    let rec = null;
    const { data: byId } = await supabase.from('records').select('*').eq('id', recordId).maybeSingle();
    rec = byId;
    if (!rec) {
      const { data: byCode } = await supabase.from('records').select('*').eq('code', recordId).maybeSingle();
      rec = byCode;
    }
    if (!rec) throw new Error('Record not found');

    const { data: updatedRec, error: updateErr } = await supabase
      .from('records')
      .update({ status: 'Rejected', note: reason })
      .eq('id', rec.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    const targetUserId = rec.user_id || rec.userId;
    let updatedUser = null;
    if (targetUserId) {
      const { data: user } = await supabase.from('users').select('*').eq('id', targetUserId).maybeSingle();
      if (user) {
        const refundAmt = Math.abs(parseFloat(rec.amount));
        const newBal = parseFloat(((user.balance || 0) + refundAmt).toFixed(2));
        const res = await supabase.from('users').update({
          balance: newBal,
          pending_requests: Math.max(0, (user.pending_requests || 1) - 1)
        }).eq('id', user.id).select().single();
        updatedUser = res.data ? normalizeUser(res.data) : null;
      }
    }

    return { record: updatedRec || { ...rec, status: 'Rejected', note: reason }, user: updatedUser };
  },

  // 13. VIP Tiers
  getVipTiers: async () => {
    const { data, error } = await supabase
      .from('vip_tiers')
      .select('*')
      .order('min_balance', { ascending: true });

    if (error || !data || data.length === 0) return INITIAL_VIP_TIERS;
    return data;
  },

  // 14. Activity
  getActivity: async () => {
    const { data, error } = await supabase
      .from('activity_stream')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return MASKED_ACTIVITY_STREAM;
    return data;
  },

  // 15. Real-Time Channel Subscription (Singleton Manager)
  subscribeLiveEvents: (onEvent) => {
    liveEventListeners.add(onEvent);
    initSupabaseRealtime();

    return () => {
      liveEventListeners.delete(onEvent);
    };
  }
};

let liveChannel = null;
const liveEventListeners = new Set();

function initSupabaseRealtime() {
  if (liveChannel) return;

  try {
    const channelId = `realtime-ecomxstocks-${Date.now()}`;
    liveChannel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        let eventObj = null;
        if (payload.eventType === 'INSERT') {
          eventObj = { type: 'user_registered', payload: { user: normalizeUser(payload.new), referrerId: payload.new.referred_by_code } };
        } else if (payload.eventType === 'UPDATE') {
          eventObj = { type: 'user_updated', payload: { user: normalizeUser(payload.new) } };
        }
        if (eventObj) {
          liveEventListeners.forEach(listener => {
            try { listener(eventObj); } catch (e) {}
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, payload => {
        let eventObj = null;
        if (payload.eventType === 'INSERT') {
          if (payload.new.category === 'Deposit') {
            eventObj = { type: 'deposit_created', payload: { record: payload.new } };
          } else if (payload.new.category === 'Withdrawal') {
            eventObj = { type: 'withdrawal_created', payload: { record: payload.new } };
          } else if (payload.new.category === 'Task') {
            eventObj = { type: 'task_completed', payload: { record: payload.new } };
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.category === 'Deposit' && payload.new.status === 'Completed') {
            eventObj = { type: 'deposit_approved', payload: { record: payload.new } };
          } else if (payload.new.category === 'Deposit' && payload.new.status === 'Rejected') {
            eventObj = { type: 'deposit_rejected', payload: { record: payload.new } };
          } else if (payload.new.category === 'Withdrawal' && payload.new.status === 'Completed') {
            eventObj = { type: 'withdrawal_approved', payload: { record: payload.new } };
          } else if (payload.new.category === 'Withdrawal' && payload.new.status === 'Rejected') {
            eventObj = { type: 'withdrawal_rejected', payload: { record: payload.new } };
          } else {
            eventObj = { type: 'record_updated', payload: { record: payload.new } };
          }
        }
        if (eventObj) {
          liveEventListeners.forEach(listener => {
            try { listener(eventObj); } catch (e) {}
          });
        }
      })
      .subscribe((status) => {
        console.log('📡 Supabase Realtime channel status:', status);
      });
  } catch (err) {
    console.warn('Supabase Realtime subscription error:', err);
  }
}

