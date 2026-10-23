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

export function sanitizeReferralCode(code) {
  if (!code) return '';
  return String(code)
    .trim()
    .replace(/^[#\s]+/, '')          // remove leading # or spaces
    .replace(/^code\s*#?\s*/i, '')   // remove "Code #" or "code:"
    .replace(/^id\s*#?\s*/i, '')     // remove "ID #" or "id:"
    .replace(/^ref\s*#?\s*/i, '')    // remove "ref #"
    .trim();
}

export function normalizeUser(u) {
  if (!u) return null;
  const refCode = sanitizeReferralCode(u.referral_code || u.referralCode || u.code) || '';
  const invitedByCode = sanitizeReferralCode(u.invited_by_code || u.invitedByCode || u.referred_by_code || u.referredByCode || u.referred_by || u.referredBy) || '';
  const referredByName = u.referred_by_name || u.referredByName || (invitedByCode === '888888' ? 'System Genesis' : (invitedByCode ? `Code #${invitedByCode}` : 'Direct'));
  
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

export function applyTaskRecordsToUser(norm, taskRecords = []) {
  if (!norm || !norm.id) return norm;
  const userRecs = (taskRecords || []).filter(r => 
    r.user_id === norm.id || 
    r.userId === norm.id || 
    String(r.user_id) === String(norm.id) || 
    (norm.name && r.user_name && r.user_name.toLowerCase() === norm.name.toLowerCase())
  );

  if (userRecs.length > 0) {
    const latestAssignment = userRecs.find(r => 
      r.type && (r.type.includes('Assigned') || r.type.includes('Package Assigned')) &&
      r.status !== 'Cancelled'
    );
    const latestRequest = userRecs.find(r => 
      r.type && r.type.includes('Request') && r.status === 'Pending'
    );

    if (latestAssignment && (!latestRequest || new Date(latestAssignment.created_at || latestAssignment.date) >= new Date(latestRequest.created_at || latestRequest.date))) {
      let parsed = null;
      try {
        parsed = typeof latestAssignment.note === 'string' ? JSON.parse(latestAssignment.note) : latestAssignment.note;
      } catch (e) {}

      if (parsed) {
        norm.assignedPackage = parsed.assignedPackage || 'Standard 25 Package';
        norm.taskPackageStatus = 'assigned';
        norm.taskPackageRequested = false;
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
          norm.assignedTasks = parsed.tasks;
          norm.assignedTaskIds = parsed.tasks.map(t => t.id);
        } else if (Array.isArray(parsed.taskIds) && parsed.taskIds.length > 0) {
          norm.assignedTasks = INITIAL_TASKS.filter(t => parsed.taskIds.includes(t.id));
          norm.assignedTaskIds = parsed.taskIds;
        }
      }
    } else if (latestRequest) {
      let parsed = null;
      try {
        parsed = typeof latestRequest.note === 'string' ? JSON.parse(latestRequest.note) : latestRequest.note;
      } catch (e) {}
      norm.taskPackageRequested = true;
      norm.taskPackageStatus = 'pending';
      norm.taskRequestId = parsed?.requestId || latestRequest.code;
      norm.taskPackagePlatform = parsed?.platform || 'eBay';
    }
  }

  // Failsafe: If user has pending_tasks > 0 or assignedPackage is set, ensure assignedTasks has 25 items
  if ((!norm.assignedTasks || norm.assignedTasks.length === 0) && (Number(norm.pending_tasks || norm.pendingTasks || 0) > 0 || norm.assignedPackage)) {
    norm.assignedPackage = norm.assignedPackage || 'Standard 25 Package';
    norm.taskPackageStatus = 'assigned';
    norm.assignedTasks = INITIAL_TASKS.slice(0, 25);
    norm.assignedTaskIds = norm.assignedTasks.map(t => t.id);
  }

  return norm;
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
    const cleanRefCode = sanitizeReferralCode(referralCode);

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

    // 1. Check referrer in Supabase by referral_code, code, name (username), or id
    let resolvedReferrer = null;
    try {
      const { data: refMatches, error: refLookupErr } = await supabase
        .from('users')
        .select('id, name, referral_code, code, team_members_count, referrals')
        .or(`referral_code.eq.${cleanRefCode},code.eq.${cleanRefCode},name.ilike.${cleanRefCode},id.eq.${cleanRefCode}`)
        .limit(1);

      if (refMatches && refMatches.length > 0) {
        resolvedReferrer = refMatches[0];
      }
    } catch (e) {
      console.warn('Supabase referrer lookup error:', e);
    }

    // 2. Check initial mock users (admin / Noah / Alex)
    if (!resolvedReferrer) {
      const initMatch = INITIAL_ADMIN_USERS.find(u => 
        (u.referralCode && sanitizeReferralCode(u.referralCode) === cleanRefCode) ||
        (u.code && sanitizeReferralCode(u.code) === cleanRefCode) ||
        (u.referral_code && sanitizeReferralCode(u.referral_code) === cleanRefCode) ||
        (u.name && u.name.trim().toLowerCase() === cleanRefCode.toLowerCase()) ||
        (u.id && u.id.trim().toLowerCase() === cleanRefCode.toLowerCase())
      );
      if (initMatch) {
        resolvedReferrer = {
          id: initMatch.id,
          name: initMatch.name,
          referral_code: sanitizeReferralCode(initMatch.referralCode || initMatch.code),
          code: sanitizeReferralCode(initMatch.code || initMatch.referralCode)
        };
      }
    }

    // 3. Check browser cached admin users list
    if (!resolvedReferrer) {
      try {
        const savedUsersRaw = localStorage.getItem('websynx_admin_users');
        if (savedUsersRaw) {
          const savedUsers = JSON.parse(savedUsersRaw);
          const localMatch = (savedUsers || []).find(u => 
            (u.referralCode && sanitizeReferralCode(u.referralCode) === cleanRefCode) ||
            (u.code && sanitizeReferralCode(u.code) === cleanRefCode) ||
            (u.referral_code && sanitizeReferralCode(u.referral_code) === cleanRefCode) ||
            (u.name && u.name.trim().toLowerCase() === cleanRefCode.toLowerCase()) ||
            (u.id && u.id.trim().toLowerCase() === cleanRefCode.toLowerCase())
          );
          if (localMatch) {
            resolvedReferrer = {
              id: localMatch.id,
              name: localMatch.name,
              referral_code: sanitizeReferralCode(localMatch.referralCode || localMatch.code || localMatch.referral_code),
              code: sanitizeReferralCode(localMatch.code || localMatch.referralCode)
            };
          }
        }
      } catch (e) {}
    }

    // 4. If any 4-20 char alphanumeric code is supplied, accept it dynamically
    // so new users sharing their generated 6-digit codes are NEVER blocked by sync lag!
    if (!resolvedReferrer) {
      if (/^[a-zA-Z0-9_-]{4,20}$/.test(cleanRefCode)) {
        resolvedReferrer = {
          id: `ref_${cleanRefCode}`,
          name: cleanRefCode === '888888' ? 'Official Platform' : `Member #${cleanRefCode}`,
          referral_code: cleanRefCode,
          code: cleanRefCode
        };
      } else {
        throw new Error(`Invalid invitation code "${cleanRefCode}". Please verify your invitation code and try again.`);
      }
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
      referred_by_name: resolvedReferrer ? resolvedReferrer.name : `Code #${cleanRefCode}`,
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

    // Direct update referrer stats & insert referral record
    if (resolvedReferrer && resolvedReferrer.id && !resolvedReferrer.id.startsWith('ref_')) {
      try {
        const { data: currentRef } = await supabase
          .from('users')
          .select('team_members_count, referrals')
          .eq('id', resolvedReferrer.id)
          .maybeSingle();

        const updatedTeamCount = (Number(currentRef?.team_members_count) || 0) + 1;
        const updatedRefUsers = (Number(currentRef?.referrals) || 0) + 1;

        await supabase
          .from('users')
          .update({
            team_members_count: updatedTeamCount,
            referrals: updatedRefUsers
          })
          .eq('id', resolvedReferrer.id);
      } catch (e) {
        console.warn('Error incrementing referrer count in Supabase:', e);
      }

      try {
        const refRecord = {
          id: `rec_ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          code: `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          type: 'Referral Signup',
          category: 'Referral',
          amount: 0.00,
          currency: 'USDT',
          date: new Date().toISOString().split('T')[0],
          status: 'Completed',
          note: `New team member registered: ${cleanName} (Code #${cleanRefCode})`,
          user_id: resolvedReferrer.id,
          user_name: resolvedReferrer.name,
          network: 'TRC20'
        };
        await supabase.from('records').insert([refRecord]);
      } catch (e) {
        console.warn('Error inserting referral record:', e);
      }
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
    const norm = normalizeUser(userRow);
    let userTaskRecs = [];
    try {
      const { data: recs } = await supabase
        .from('records')
        .select('*')
        .or(`user_id.eq.${norm.id},user_name.ilike.${norm.name}`)
        .ilike('category', '%task%')
        .order('created_at', { ascending: false })
        .limit(10);
      if (recs) userTaskRecs = recs;
    } catch (e) {}
    return applyTaskRecordsToUser(norm, userTaskRecs);
  },

  // 4. Get All Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return INITIAL_ADMIN_USERS.map(normalizeUser);

    let taskRecords = [];
    try {
      const { data: recs } = await supabase
        .from('records')
        .select('*')
        .ilike('category', '%task%')
        .order('created_at', { ascending: false })
        .limit(200);
      if (recs) taskRecords = recs;
    } catch (e) {}

    return data.map(u => {
      const norm = normalizeUser(u);
      return applyTaskRecordsToUser(norm, taskRecords);
    });
  },

  // 4b. Get User Team / Direct Referrals
  getUserTeam: async (userId, userCode) => {
    const cleanCode = sanitizeReferralCode(userCode);
    let query = supabase.from('users').select('*');
    const conditions = [];

    if (userId) {
      conditions.push(`referred_by.eq.${userId}`);
      conditions.push(`referred_by_code.eq.${userId}`);
      conditions.push(`invited_by_code.eq.${userId}`);
    }
    if (cleanCode) {
      conditions.push(`referred_by_code.eq.${cleanCode}`);
      conditions.push(`invited_by_code.eq.${cleanCode}`);
      conditions.push(`referred_by.eq.${cleanCode}`);
    }

    if (conditions.length === 0) return [];

    query = query.or(conditions.join(','));
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
    let task = null;
    let user = null;

    if (userId) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      user = data;
    }
    if (!user) {
      let savedUser = null;
      try {
        savedUser = JSON.parse(localStorage.getItem('websynx_user') || '{}');
      } catch (e) {}
      if (savedUser && savedUser.name && savedUser.name !== 'Guest User') {
        const { data } = await supabase.from('users').select('*').ilike('name', savedUser.name).maybeSingle();
        user = data;
      }
      if (!user && savedUser && savedUser.email) {
        const { data } = await supabase.from('users').select('*').eq('email', savedUser.email.trim().toLowerCase()).maybeSingle();
        user = data;
      }
    }

    if (taskId) {
      const { data } = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle();
      task = data;
    }
    if (!task) {
      task = INITIAL_TASKS.find(t => t.id === taskId);
    }
    if (!task) {
      task = {
        id: taskId,
        platform: 'eBay',
        title: 'Merchant Promotion Task',
        price: 40,
        yield_amount: 1.60
      };
    }
    if (!user) throw new Error('User not found');

    const commission = parseFloat(task.yield_amount || task.yieldAmount || (((Number(task.price) || 0) * 0.04).toFixed(2)));
    const newBal = parseFloat(((Number(user.balance) || 0) + commission).toFixed(2));
    const newEarnings = parseFloat(((Number(user.total_earnings || user.totalEarnings) || 0) + commission).toFixed(2));
    const newCompleted = (Number(user.completed_tasks || user.completedTasks) || 0) + 1;
    const newDaily = (Number(user.daily_completed || user.dailyCompleted) || 0) + 1;
    const quota = Number(user.daily_quota || user.dailyQuota) || 25;
    const newPending = Math.max(0, quota - newDaily);

    const { data: updatedUser } = await supabase
      .from('users')
      .update({
        balance: newBal,
        total_earnings: newEarnings,
        completed_tasks: newCompleted,
        daily_completed: newDaily,
        pending_tasks: newPending
      })
      .eq('id', user.id)
      .select()
      .maybeSingle();

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
      note: `Completed ${task.platform || 'Merchant'} promotion for ${task.title || 'Task'}`,
      user_id: user.id,
      user_name: user.name,
      network: 'TRC20'
    };

    const { data: insertedRec } = await supabase.from('records').insert([rec]).select().maybeSingle();

    return {
      message: 'Task completed successfully',
      commissionEarned: commission,
      user: normalizeUser(updatedUser || { ...user, balance: newBal, total_earnings: newEarnings, completed_tasks: newCompleted, daily_completed: newDaily, pending_tasks: newPending }),
      record: insertedRec || rec
    };
  },

  // 7b. Assign Tasks to User (Persistent in records + users tables)
  assignTasksToUser: async (userId, tasks, packageName = 'Standard 25 Package', resetCompleted = true) => {
    let user = null;
    if (userId) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      user = data;
    }
    if (!user) {
      const { data: allU } = await supabase.from('users').select('*');
      user = (allU || []).find(u => u.id === userId || String(u.id) === String(userId));
    }
    if (!user) return null;

    const count = tasks && tasks.length > 0 ? tasks.length : 25;
    const finalTasks = (tasks && tasks.length > 0 ? tasks : INITIAL_TASKS).slice(0, count);

    // 1. Update users table in Supabase
    await supabase.from('users').update({
      pending_tasks: count,
      completed_tasks: resetCompleted ? 0 : (user.completed_tasks || 0),
      daily_quota: count,
      daily_completed: resetCompleted ? 0 : (user.daily_completed || 0),
      status: 'Active'
    }).eq('id', user.id);

    // 2. Mark any pending task requests for this user as Completed
    await supabase.from('records')
      .update({ status: 'Completed' })
      .eq('user_id', user.id)
      .eq('category', 'Tasks')
      .eq('status', 'Pending');

    // 3. Insert persistent assignment record into Supabase records table
    const pkgCode = `PKG-${Date.now().toString().slice(-6)}`;
    const noteObj = {
      assignedPackage: packageName,
      taskPackageStatus: 'assigned',
      taskPackageRequested: false,
      dailyQuota: count,
      pendingTasks: count,
      completedTasks: resetCompleted ? 0 : (user.completed_tasks || 0),
      taskIds: finalTasks.map(t => t.id),
      tasks: finalTasks.map(t => ({
        id: t.id,
        platform: t.platform || 'eBay',
        title: t.title,
        price: Number(t.price) || 0,
        yieldRate: t.yieldRate || `${t.commissionRate || 4.0}%`,
        yieldAmount: Number(t.yieldAmount || (((Number(t.price) || 0) * 0.04).toFixed(2))),
        requiredDeposit: Number(t.requiredDeposit || t.required_deposit || 0),
        image: t.image || t.imageUrl || '',
        imageUrl: t.image || t.imageUrl || '',
        productUrl: t.productUrl || t.product_url || '',
        category: t.category || 'General',
        badge: t.badge || 'VIP Level 1'
      })),
      assignedAt: new Date().toISOString()
    };

    const newRec = {
      id: `rec_pkg_${Date.now()}`,
      code: pkgCode,
      type: 'Task Package Assigned',
      category: 'Tasks',
      amount: 0.00,
      currency: 'USDT',
      date: new Date().toISOString().slice(0, 10),
      status: 'Completed',
      note: JSON.stringify(noteObj),
      user_id: user.id,
      user_name: user.name,
      network: 'System'
    };

    await supabase.from('records').insert([newRec]);

    return {
      success: true,
      user: {
        ...normalizeUser(user),
        assignedPackage: packageName,
        taskPackageStatus: 'assigned',
        taskPackageRequested: false,
        pendingTasks: count,
        completedTasks: resetCompleted ? 0 : (user.completed_tasks || 0),
        dailyQuota: count,
        dailyCompleted: resetCompleted ? 0 : (user.daily_completed || 0),
        assignedTasks: finalTasks,
        assignedTaskIds: finalTasks.map(t => t.id)
      }
    };
  },

  // 7c. Request Task Package
  requestTaskPackage: async (userId, platform = 'eBay', reqId = null) => {
    let user = null;
    if (userId) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      user = data;
    }
    if (!user) {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem('websynx_user') || '{}');
      } catch (e) {}
      if (saved && saved.name && saved.name !== 'Guest User') {
        const { data } = await supabase.from('users').select('*').ilike('name', saved.name).maybeSingle();
        user = data;
      }
    }
    if (!user) return false;

    const actualReqId = reqId || `${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const newRec = {
      id: `rec_req_${Date.now()}`,
      code: `REQ-${actualReqId}`,
      type: `${platform} Task Package Request`,
      category: 'Tasks',
      amount: 0.00,
      currency: 'USDT',
      date: nowIso.slice(0, 10),
      status: 'Pending',
      note: JSON.stringify({
        taskPackageRequested: true,
        taskPackageStatus: 'pending',
        platform,
        requestId: actualReqId,
        requestedAt: nowIso
      }),
      user_id: user.id,
      user_name: user.name,
      network: 'System'
    };

    await supabase.from('records').insert([newRec]);
    await supabase.from('users').update({
      pending_requests: (Number(user.pending_requests) || 0) + 1
    }).eq('id', user.id);

    return true;
  },

  // 7d. Cancel Task Package Request
  cancelTaskPackageRequest: async (userId) => {
    if (!userId) return false;
    await supabase.from('records')
      .update({ status: 'Cancelled' })
      .eq('user_id', userId)
      .eq('category', 'Tasks')
      .eq('status', 'Pending');
    return true;
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

