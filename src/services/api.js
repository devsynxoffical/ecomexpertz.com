// Client API Service for Ecomxstocks Platform
// Single Authoritative Cloud Database: Supabase PostgreSQL (PostgREST HTTP/2)

import { supabaseService, normalizeUser } from './supabaseService';
import { handleLocalApi } from './localDb';

export const api = {
  // Auth & Users
  login: async (email, password) => {
    return await supabaseService.login(email, password);
  },

  register: async (name, email, password, referralCode) => {
    return await supabaseService.register(name, email, password, referralCode);
  },

  getMe: async () => {
    try {
      const u = await supabaseService.getMe();
      if (u && u.id) return u;
    } catch (err) {
      console.warn('api.getMe error:', err.message);
    }
    return null;
  },

  getUsers: async () => {
    try {
      const users = await supabaseService.getUsers();
      if (Array.isArray(users)) return users;
    } catch (err) {
      console.warn('api.getUsers error:', err.message);
    }
    return [];
  },

  updateUser: async (id, updates) => {
    try {
      const res = await supabaseService.updateUser(id, updates);
      if (res && res.user) return res;
    } catch (err) {
      console.warn('api.updateUser error:', err.message);
    }
    return {
      message: 'User updated',
      user: { id, ...updates }
    };
  },

  deleteUser: async (id) => {
    try {
      await supabaseService.deleteUser(id);
    } catch (err) {
      console.warn('api.deleteUser error:', err.message);
    }
    return { message: 'User deleted', id };
  },

  getGatewaySettings: async () => {
    try {
      const s = await supabaseService.getGatewaySettings();
      if (s) return s;
    } catch (err) {
      console.warn('api.getGatewaySettings error:', err.message);
    }
    return handleLocalApi('/settings/gateway');
  },

  updateGatewaySettings: async (settings) => {
    try {
      return await supabaseService.updateGatewaySettings(settings);
    } catch (err) {
      console.warn('api.updateGatewaySettings error:', err.message);
      return settings;
    }
  },

  checkAccountStatus: async (id) => {
    try {
      return await supabaseService.checkAccountStatus(id);
    } catch (err) {
      return { deleted: false, status: 'Active' };
    }
  },

  assignTasksToUser: async (userId, tasks, packageName = 'Standard 25 Package', resetCompleted = true) => {
    return await supabaseService.assignTasksToUser(userId, tasks, packageName, resetCompleted);
  },

  requestTaskPackage: async (userId, platform = 'eBay', reqId = null) => {
    return await supabaseService.requestTaskPackage(userId, platform, reqId);
  },

  cancelTaskPackageRequest: async (userId) => {
    return await supabaseService.cancelTaskPackageRequest(userId);
  },

  notifyUser: async (userId, title, message, type = 'info') => {
    return handleLocalApi(`/users/${userId}/notify`, {
      method: 'POST',
      body: JSON.stringify({ title, message, type })
    });
  },

  getUserTeam: async (userId, userCode) => {
    try {
      return await supabaseService.getUserTeam(userId, userCode);
    } catch (err) {
      return [];
    }
  },

  // Task Catalog
  getTasks: async () => {
    try {
      const t = await supabaseService.getTasks();
      if (Array.isArray(t) && t.length > 0) return t;
    } catch (err) {
      console.warn('api.getTasks error:', err.message);
    }
    return [];
  },

  createTask: async (taskData) => {
    return handleLocalApi('/tasks', { method: 'POST', body: JSON.stringify(taskData) });
  },

  updateTask: async (id, updates) => {
    return await supabaseService.updateTask(id, updates);
  },

  deleteTask: async (id) => {
    return handleLocalApi(`/tasks/${id}`, { method: 'DELETE' });
  },

  submitTask: async (taskIdOrTask, userId, optionalTask = null) => {
    const taskId = typeof taskIdOrTask === 'object' ? taskIdOrTask.id : taskIdOrTask;
    const taskDetails = typeof taskIdOrTask === 'object' ? taskIdOrTask : optionalTask;
    return await supabaseService.submitTask(taskId, userId, taskDetails);
  },

  // Financial Deposits & Withdrawals
  createDeposit: async (amount, txHash, network = 'TRC20', userId = null, userName = null, userEmail = null) => {
    return await supabaseService.createDeposit(amount, txHash, network, userId, userName, userEmail);
  },

  claimDummyDeposit: async (amount, userId) => {
    return handleLocalApi('/deposits/dummy', { method: 'POST', body: JSON.stringify({ amount, userId }) });
  },

  approveDeposit: async (id, depositData = {}) => {
    return await supabaseService.approveDeposit(id);
  },

  rejectDeposit: async (id, reason = 'Deposit unverified or invalid transaction hash', depositData = {}) => {
    return await supabaseService.rejectDeposit(id, reason);
  },

  createWithdrawal: async (amount, address, network, userId) => {
    return await supabaseService.createWithdrawal(amount, address, network, userId);
  },

  approveWithdrawal: async (id, txHash = '', destinationWallet = '') => {
    return await supabaseService.approveWithdrawal(id, txHash, destinationWallet);
  },

  rejectWithdrawal: async (id, reason = 'Withdrawal rejected by admin') => {
    return await supabaseService.rejectWithdrawal(id, reason);
  },

  // Records & Ledger
  getRecords: async () => {
    try {
      const r = await supabaseService.getRecords();
      if (Array.isArray(r)) return r;
    } catch (err) {
      console.warn('api.getRecords error:', err.message);
    }
    return [];
  },

  // VIP Tiers
  getVipTiers: async () => {
    try {
      const tiers = await supabaseService.getVipTiers();
      if (Array.isArray(tiers) && tiers.length > 0) return tiers;
    } catch (err) {
      console.warn('api.getVipTiers error:', err.message);
    }
    return [];
  },

  createVipTier: async (tierData) => {
    try {
      return await supabaseService.createVipTier(tierData);
    } catch (err) {
      return handleLocalApi('/vip-tiers', { method: 'POST', body: JSON.stringify(tierData) });
    }
  },

  updateVipTier: async (id, updates) => {
    return await supabaseService.updateVipTier(id, updates);
  },

  deleteVipTier: async (id) => {
    try {
      return await supabaseService.deleteVipTier(id);
    } catch (err) {
      return handleLocalApi(`/vip-tiers/${id}`, { method: 'DELETE' });
    }
  },

  // Activity Stream
  getActivity: async () => {
    try {
      const act = await supabaseService.getActivity();
      if (Array.isArray(act) && act.length > 0) return act;
    } catch (err) {
      console.warn('api.getActivity error:', err.message);
    }
    return [];
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

  subscribeEvents: (callback) => {
    return supabaseService.subscribeLiveEvents(callback);
  },
  subscribeLiveEvents: (callback) => {
    return supabaseService.subscribeLiveEvents(callback);
  }
};
