import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Headphones, Mail, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function SupportChatWidget() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [chat, setChat] = useState({ messages: [], unreadByUser: 0 });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;

  const userId = user?.id;

  // Initial load
  useEffect(() => {
    api.getSupportSettings().then((s) => {
      const clean = s ? { ...s } : {};
      if (!clean.agentName || clean.agentName.includes('WebSynx')) {
        clean.agentName = 'Ecomxstocks Official Support';
      }
      if (!clean.telegram || clean.telegram.includes('websynx')) {
        clean.telegram = 'https://t.me/ecomxstocks_support';
      }
      if (!clean.telegramChannel || clean.telegramChannel.includes('websynx')) {
        clean.telegramChannel = 'https://t.me/ecomxstocks_official';
      }
      if (!clean.telegramSupportUser || clean.telegramSupportUser.includes('WebSynx')) {
        clean.telegramSupportUser = '@Ecomxstocks_Support';
      }
      setSettings(clean);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    api.getMyChat(userId).then(setChat).catch(() => {});
  }, [userId]);

  // Live updates
  useEffect(() => {
    if (!userId) return;
    const unsub = api.subscribeLiveEvents((event) => {
      if (event.type === 'support_message' && event.payload?.chat?.userId === userId) {
        const incoming = event.payload.chat;
        setChat(incoming);
        if (openRef.current && incoming.unreadByUser > 0) {
          api.markMyChatRead(userId).catch(() => {});
          setChat((c) => ({ ...c, unreadByUser: 0 }));
        }
      }
      if (event.type === 'support_chat_deleted') {
        api.getMyChat(userId).then(setChat).catch(() => {});
      }
      if (event.type === 'support_settings_updated') {
        const clean = event.payload?.settings ? { ...event.payload.settings } : {};
        if (!clean.agentName || clean.agentName.includes('WebSynx')) {
          clean.agentName = 'Ecomxstocks Official Support';
        }
        setSettings(clean);
      }
    });
    return () => unsub();
  }, [userId]);

  // Mark read when opened
  useEffect(() => {
    if (open && userId && chat.unreadByUser > 0) {
      api.markMyChatRead(userId).catch(() => {});
      setChat((c) => ({ ...c, unreadByUser: 0 }));
    }
  }, [open, userId, chat.unreadByUser]);

  // Auto scroll
  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [open, chat.messages?.length]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || !userId || sending) return;
    setSending(true);
    setError('');
    // optimistic
    const optimistic = { id: `tmp-${Date.now()}`, sender: 'user', text: value, createdAt: new Date().toISOString(), pending: true };
    setChat((c) => ({ ...c, messages: [...(c.messages || []), optimistic] }));
    setText('');
    try {
      const updated = await api.sendSupportMessage(userId, value);
      setChat({ ...updated, unreadByUser: 0 });
      api.markMyChatRead(userId).catch(() => {});
    } catch (err) {
      setError('Message failed to send. Please check your connection.');
      setChat((c) => ({ ...c, messages: (c.messages || []).filter((m) => m.id !== optimistic.id) }));
      setText(value);
    } finally {
      setSending(false);
    }
  };

  if (settings && settings.enabled === false) return null;

  const unread = chat.unreadByUser || 0;
  const messages = chat.messages || [];
  const isOnline = settings?.online !== false;

  return (
    <>
      {open && (
        <div className="support-chat-panel animate-fade-in" role="dialog" aria-label="Support chat">
          <div className="support-chat-header">
            <div className="support-agent">
              <div className="support-agent-avatar">
                <Headphones size={18} />
                <span className={`support-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
              </div>
              <div className="support-agent-info">
                <strong>{settings?.agentName && !settings.agentName.includes('WebSynx') ? settings.agentName : 'Ecomxstocks Official Support'}</strong>
                <span>{isOnline ? 'Online • Typically replies in minutes' : 'Offline • Leave a message'}</span>
              </div>
            </div>
            <button className="support-icon-btn" onClick={() => setOpen(false)} aria-label="Minimize chat" id="support-chat-minimize">
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="support-chat-body" ref={bodyRef}>
            <div className="support-msg-row admin">
              <div className="support-bubble admin">
                {isOnline ? (settings?.welcomeMessage || 'Hi! How can we help you today?') : (settings?.offlineMessage || 'We are offline right now.')}
              </div>
            </div>

            {messages.length === 0 && (
              <div className="support-quick-topics">
                {['Deposit not credited', 'Withdrawal status', 'Task not completing', 'Account / KYC help'].map((q) => (
                  <button key={q} className="support-topic-chip" onClick={() => setText(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`support-msg-row ${m.sender}`}>
                <div className={`support-bubble ${m.sender} ${m.pending ? 'pending' : ''}`}>
                  {m.sender === 'admin' && !m.auto && m.agentName && (
                    <span className="support-bubble-agent">
                      {m.agentName.includes('WebSynx') ? 'Ecomxstocks Official Support' : m.agentName}
                    </span>
                  )}
                  <span className="support-bubble-text">{m.text}</span>
                  <span className="support-bubble-time">{m.pending ? 'Sending…' : formatTime(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="support-chat-error">{error}</div>}

          <form className="support-chat-input" onSubmit={handleSend}>
            <input
              id="support-chat-input"
              type="text"
              placeholder="Type your message…"
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="support-send-btn" disabled={!text.trim() || sending} aria-label="Send message" id="support-chat-send">
              <Send size={16} />
            </button>
          </form>

          {settings?.telegram && (
            <div className="support-chat-footer">
              <a href={settings.telegram} target="_blank" rel="noopener noreferrer">
                Official Telegram Support
              </a>
              {settings?.workingHours && <span className="support-hours">{settings.workingHours}</span>}
            </div>
          )}
        </div>
      )}

      <button
        id="support-chat-toggle"
        className={`support-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
        {!open && unread > 0 && <span className="support-fab-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
    </>
  );
}
