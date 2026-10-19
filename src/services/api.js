// Client API Service for Ecomxstocks Platform
// Direct Cloud Database via Supabase PostgreSQL + Local Storage Fallback Engine

import { supabaseService } from './supabaseService';
import { handleLocalApi, subscribeLocalEvents } from './localDb';

export const api = {
  // Auth & Users
  login: async (email, password) => {
    try {
      return await supabaseService.login(email, password);
    } catch (err) {
      console.warn('Supabase login fallback:', err.message);
      return handleLocalApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    }
  },

  register: async (name, email, password, referralCode) => {
    try {
      return await supabaseService.register(name, email, password, referralCode);
    } catch (err) {
      console.warn('Supabase register fallback:', err.message);
      return handleLocalApi('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, referralCode }) });
    }
  },

  getMe: async () => {
    try {
      const u = await supabaseService.getMe();
      if (u) return u;
    } catch (err) {}
    const currentUserId = localStorage.getItem('websynx_current_user_id');
    if (!currentUserId) return null;
    return handleLocalApi('/users/me');
  },

  getUsers: async () => {
    try {
      const users = await supabaseService.getUsers();
      if (users && users.length > 0) return users;
    } catch (err) {}
    return handleLocalApi('/users');
  },

  updateUser: async (id, updates) => {
    try {
      const res = await supabaseService.updateUser(id, updates);
      if (res && res.user) return res;
    } catch (err) {
      console.warn('Supabase updateUser fallback:', err.message);
    }
    return handleLocalApi(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  assignTasksToUser: async (id, tasks, packageName = 'Random 25 Package', resetCompleted = true) => {
    try {
      const payload = {
        tasks,
        package: packageName,
        quota: tasks?.length || 25,
        resetCompleted,
        assignedTasks: tasks,
        assigned_tasks: tasks,
        assignedPackage: packageName,
        assigned_package: packageName,
        taskPackageStatus: 'assigned',
        task_package_status: 'assigned',
        taskPackageRequested: false,
        task_package_requested: 0,
        dailyQuota: tasks?.length || 25,
        daily_quota: tasks?.length || 25,
        pendingTasks: tasks?.length || 25,
        pending_tasks: tasks?.length || 25,
        dailyCompleted: resetCompleted ? 0 : undefined,
        daily_completed: resetCompleted ? 0 : undefined
      };
      try {
        await handleLocalApi(`/users/${id}/assign-tasks`, { method: 'POST', body: JSON.stringify(payload) });
      } catch (err) {}
      try {
        fetch(`/api/users/${id}/assign-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (err) {}
      const userRes = await api.updateUser(id, payload);
      return userRes?.user || { id, ...payload };
    } catch (e) {
      console.warn('assignTasksToUser error:', e);
      return null;
    }
  },

  notifyUser: async (userId, title, message, type = 'info') => {
    try {
      fetch(`/api/users/${userId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type })
      }).catch(() => {});
    } catch (e) {}
  },

  getUserTeam: async (userId, userCode) => {
    try {
      const team = await supabaseService.getUserTeam(userId, userCode);
      if (team && team.length >= 0) return team;
    } catch (err) {}
    return handleLocalApi(`/users/${userId}/team`);
  },

  // Tasks
  getTasks: async () => {
    try {
      const tasks = await supabaseService.getTasks();
      if (tasks && tasks.length > 0) return tasks;
    } catch (err) {}
    return handleLocalApi('/tasks');
  },

  createTask: async (taskData) => {
    try {
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      }).catch(() => {});
    } catch (e) {}
    return handleLocalApi('/tasks', { method: 'POST', body: JSON.stringify(taskData) });
  },

  updateTask: async (id, taskData) => {
    let supaTask = null;
    try {
      supaTask = await supabaseService.updateTask(id, taskData);
    } catch (err) {
      console.warn('updateTask fallback to localApi:', err.message);
    }
    const localRes = await handleLocalApi(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) });
    try {
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      }).catch(() => {});
    } catch (e) {}
    return {
      message: 'Task updated',
      task: { ...(localRes?.task || {}), ...(supaTask || {}), ...taskData }
    };
  },

  deleteTask: async (id) => {
    try {
      fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
    return handleLocalApi(`/tasks/${id}`, { method: 'DELETE' });
  },

  submitTask: async (taskId, userId) => {
    try {
      return await supabaseService.submitTask(taskId, userId);
    } catch (err) {
      console.warn('Supabase submitTask fallback:', err.message);
      return handleLocalApi('/tasks/submit', { method: 'POST', body: JSON.stringify({ taskId, userId }) });
    }
  },

  // Deposits
  createDeposit: async (amount, txHash, network, userId) => {
    let result = null;
    try {
      result = await supabaseService.createDeposit(amount, txHash, network, userId);
    } catch (err) {
      console.warn('Supabase createDeposit fallback:', err.message);
    }
    try {
      const localRec = await handleLocalApi('/deposits', {
        method: 'POST',
        body: JSON.stringify({ amount, txHash, network, userId, record: result })
      });
      if (!result) result = localRec;
    } catch (err) {}
    try {
      fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, txHash, network, userId, tx_hash: txHash })
      }).catch(() => {});
    } catch (e) {}
    return result;
  },

  claimDummyDeposit: async (amount, userId) => {
    return handleLocalApi('/deposits/dummy', { method: 'POST', body: JSON.stringify({ amount, userId }) });
  },

  approveDeposit: async (id) => {
    let result = null;
    try {
      result = await supabaseService.approveDeposit(id);
    } catch (err) {
      console.warn('Supabase approveDeposit fallback:', err.message);
    }
    try {
      const localRes = await handleLocalApi(`/deposits/${id}/approve`, { method: 'POST' });
      if (!result) result = localRes;
    } catch (err) {}
    try {
      fetch(`/api/deposits/${id}/approve`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
    return result;
  },

  rejectDeposit: async (id, reason) => {
    let result = null;
    try {
      result = await supabaseService.rejectDeposit(id, reason);
    } catch (err) {
      console.warn('Supabase rejectDeposit fallback:', err.message);
    }
    try {
      const localRes = await handleLocalApi(`/deposits/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      if (!result) result = localRes;
    } catch (err) {}
    try {
      fetch(`/api/deposits/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      }).catch(() => {});
    } catch (e) {}
    return result;
  },

  // Withdrawals
  createWithdrawal: async (amount, address, network, userId) => {
    let result = null;
    try {
      result = await supabaseService.createWithdrawal(amount, address, network, userId);
    } catch (err) {
      console.warn('Supabase createWithdrawal fallback:', err.message);
    }
    try {
      const localRes = await handleLocalApi('/withdrawals', { method: 'POST', body: JSON.stringify({ amount, address, network, userId }) });
      if (!result) result = localRes;
    } catch (err) {}
    return result;
  },

  approveWithdrawal: async (id) => {
    let result = null;
    try {
      result = await supabaseService.approveWithdrawal(id);
    } catch (err) {
      console.warn('Supabase approveWithdrawal fallback:', err.message);
    }
    try {
      const localRes = await handleLocalApi(`/withdrawals/${id}/approve`, { method: 'POST' });
      if (!result) result = localRes;
    } catch (err) {}
    return result;
  },

  rejectWithdrawal: async (id, reason) => {
    let result = null;
    try {
      result = await supabaseService.rejectWithdrawal(id, reason);
    } catch (err) {
      console.warn('Supabase rejectWithdrawal fallback:', err.message);
    }
    try {
      const localRes = await handleLocalApi(`/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      if (!result) result = localRes;
    } catch (err) {}
    return result;
  },

  // Records & Ledger
  getRecords: async () => {
    let supaRecords = [];
    try {
      const s = await supabaseService.getRecords();
      if (Array.isArray(s)) supaRecords = s;
    } catch (err) {}

    let localRecords = [];
    try {
      const l = await handleLocalApi('/records');
      if (Array.isArray(l)) localRecords = l;
    } catch (err) {}

    if (supaRecords.length > 0 && localRecords.length > 0) {
      const seen = new Set();
      const combined = [];
      for (const r of [...supaRecords, ...localRecords]) {
        if (!r) continue;
        const key = r.code || r.id;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(r);
        }
      }
      return combined;
    }
    return supaRecords.length > 0 ? supaRecords : localRecords;
  },

  // VIP Tiers
  getVipTiers: async () => {
    try {
      const tiers = await supabaseService.getVipTiers();
      if (tiers && tiers.length > 0) return tiers;
    } catch (err) {}
    return handleLocalApi('/vip-tiers');
  },

  updateVipTier: async (id, updates) => {
    return handleLocalApi(`/vip-tiers/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  // Activity & System
  getActivity: async () => {
    try {
      const act = await supabaseService.getActivity();
      if (act && act.length > 0) return act;
    } catch (err) {}
    return handleLocalApi('/activity');
  },

  broadcast: async (message) => {
    return handleLocalApi('/broadcast', { method: 'POST', body: JSON.stringify({ message }) });
  },

  // Support Chat
  getSupportSettings: async () => handleLocalApi('/support/settings'),
  updateSupportSettings: async (settings) => handleLocalApi('/support/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getMyChat: async (userId) => handleLocalApi(`/support/chat/${userId}`),
  sendSupportMessage: async (userId, text) => handleLocalApi(`/support/chat/${userId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  markMyChatRead: async (userId) => handleLocalApi(`/support/chat/${userId}/read`, { method: 'POST' }),
  getSupportChats: async () => handleLocalApi('/support/chats'),
  replySupportChat: async (chatId, text) => handleLocalApi(`/support/chats/${chatId}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
  updateSupportChat: async (chatId, updates) => handleLocalApi(`/support/chats/${chatId}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteSupportChat: async (chatId) => handleLocalApi(`/support/chats/${chatId}`, { method: 'DELETE' }),

  resetDatabase: async () => handleLocalApi('/reset', { method: 'POST' }),

  // Real-Time Event System (Supabase postgres_changes + Local Broadcast)
  subscribeLiveEvents: (onEvent) => {
    const unsubLocal = subscribeLocalEvents(onEvent);
    const unsubSupabase = supabaseService.subscribeLiveEvents(onEvent);

    return () => {
      unsubLocal();
      if (typeof unsubSupabase === 'function') {
        unsubSupabase();
      }
    };
  }
};
