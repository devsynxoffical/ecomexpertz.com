// Client API Service for WebSynx Website & Task Management Platform
// Seamlessly operates in both Live Backend Mode and Offline / Static FTP Hosting Mode

import { handleLocalApi, subscribeLocalEvents } from './localDb';

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const currentUserId = localStorage.getItem('websynx_current_user_id') || localStorage.getItem('seox_current_user_id') || 'usr_noah_9941';
  headers['x-user-id'] = currentUserId;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    // If backend returned HTML (static server 404 or index.html fallback), route to local DB engine
    if (!contentType.includes('application/json')) {
      return handleLocalApi(endpoint, options);
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  } catch (err) {
    // If network failed or server is offline, fall back directly to local engine
    try {
      return handleLocalApi(endpoint, options);
    } catch (localErr) {
      console.warn(`Local handler error on [${options.method || 'GET'} ${endpoint}]:`, localErr.message);
      throw localErr;
    }
  }
}

export const api = {
  // Auth & Users
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (name, email, password, referralCode) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, referralCode })
    }),

  getMe: () => request('/users/me'),
  getUsers: () => request('/users'),
  updateUser: (id, updates) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  getUserTeam: (userId) => request(`/users/${userId}/team`),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks${query ? `?${query}` : ''}`);
  },

  createTask: (taskData) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    }),

  updateTask: (id, taskData) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    }),

  deleteTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE'
    }),

  submitTask: (taskId, userId) =>
    request('/tasks/submit', {
      method: 'POST',
      body: JSON.stringify({ taskId, userId })
    }),

  // Deposits
  createDeposit: (amount, txHash, network, userId) =>
    request('/deposits', {
      method: 'POST',
      body: JSON.stringify({ amount, txHash, network, userId })
    }),

  claimDummyDeposit: (amount, userId) =>
    request('/deposits/dummy', {
      method: 'POST',
      body: JSON.stringify({ amount, userId })
    }),

  approveDeposit: (id) =>
    request(`/deposits/${id}/approve`, {
      method: 'POST'
    }),

  rejectDeposit: (id) =>
    request(`/deposits/${id}/reject`, {
      method: 'POST'
    }),

  // Withdrawals
  createWithdrawal: (amount, address, network, userId) =>
    request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, address, network, userId })
    }),

  approveWithdrawal: (id) =>
    request(`/withdrawals/${id}/approve`, {
      method: 'POST'
    }),

  rejectWithdrawal: (id) =>
    request(`/withdrawals/${id}/reject`, {
      method: 'POST'
    }),

  // Records & Ledger
  getRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/records${query ? `?${query}` : ''}`);
  },

  // VIP Tiers
  getVipTiers: () => request('/vip-tiers'),
  updateVipTier: (id, updates) =>
    request(`/vip-tiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  // Activity & System
  getActivity: () => request('/activity'),
  broadcast: (message) =>
    request('/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  // Support Chat
  getSupportSettings: () => request('/support/settings'),
  updateSupportSettings: (settings) =>
    request('/support/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getMyChat: (userId) => request(`/support/chat/${userId}`),
  sendSupportMessage: (userId, text) =>
    request(`/support/chat/${userId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  markMyChatRead: (userId) => request(`/support/chat/${userId}/read`, { method: 'POST' }),
  getSupportChats: () => request('/support/chats'),
  replySupportChat: (chatId, text) =>
    request(`/support/chats/${chatId}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
  updateSupportChat: (chatId, updates) =>
    request(`/support/chats/${chatId}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteSupportChat: (chatId) => request(`/support/chats/${chatId}`, { method: 'DELETE' }),

  resetDatabase: () =>
    request('/reset', {
      method: 'POST'
    }),

  // Hybrid Real-Time Event System (SSE when on local server, local storage broadcast on static FTP host)
  subscribeLiveEvents: (onEvent) => {
    // 1. Subscribe to local event bus (cross-tab & intra-tab)
    const unsubLocal = subscribeLocalEvents(onEvent);

    // 2. Only attempt SSE stream if on localhost / dev environment
    let sse = null;
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      try {
        sse = new EventSource('/api/stream');

        sse.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type !== 'connected') {
              onEvent(payload);
            }
          } catch (err) {}
        };

        sse.onerror = () => {
          if (sse) {
            try {
              sse.close();
            } catch (e) {}
          }
        };
      } catch (e) {}
    }

    return () => {
      unsubLocal();
      if (sse) {
        try {
          sse.close();
        } catch (e) {}
      }
    };
  }
};
