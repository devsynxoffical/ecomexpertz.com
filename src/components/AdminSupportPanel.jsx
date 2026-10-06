import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  Settings,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Inbox,
  ArrowLeft,
  Save,
  Mail
} from 'lucide-react';
import { api } from '../services/api';

const formatTime = (iso) => {
  try {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const initials = (name = '?') =>
  name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

/** Hook: live list of support chats (used for sidebar badge + inbox) */
export function useSupportChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () =>
    api.getSupportChats()
      .then((list) => setChats(Array.isArray(list) ? list : []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    reload();
    const unsub = api.subscribeLiveEvents((event) => {
      if (event.type === 'support_message') {
        const chat = event.payload.chat;
        setChats((prev) => {
          const rest = prev.filter((c) => c.id !== chat.id);
          return [chat, ...rest].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      }
      if (event.type === 'support_chat_deleted') {
        setChats((prev) => prev.filter((c) => c.id !== event.payload.chatId));
      }
      if (event.type === 'state_reset') reload();
    });
    return () => unsub();
  }, []);

  const unreadTotal = chats.reduce((s, c) => s + (c.unreadByAdmin || 0), 0);
  return { chats, setChats, loading, reload, unreadTotal };
}

export default function AdminSupportPanel({ supportState }) {
  const { chats, setChats, loading, reload } = supportState;
  const [view, setView] = useState('inbox'); // 'inbox' | 'settings'
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | open | resolved
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  const selected = chats.find((c) => c.id === selectedId) || null;

  const filtered = useMemo(() => {
    return chats.filter((c) => {
      if (filter === 'unread' && !(c.unreadByAdmin > 0)) return false;
      if (filter === 'open' && c.status !== 'open') return false;
      if (filter === 'resolved' && c.status !== 'resolved') return false;
      if (query) {
        const q = query.toLowerCase();
        const last = c.messages?.[c.messages.length - 1]?.text || '';
        return (
          c.userName?.toLowerCase().includes(q) ||
          c.userEmail?.toLowerCase().includes(q) ||
          c.userId?.toLowerCase().includes(q) ||
          last.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [chats, filter, query]);

  // Mark selected chat read
  useEffect(() => {
    if (selected && selected.unreadByAdmin > 0) {
      api.updateSupportChat(selected.id, { markRead: true }).catch(() => {});
      setChats((prev) => prev.map((c) => (c.id === selected.id ? { ...c, unreadByAdmin: 0 } : c)));
    }
  }, [selected?.id, selected?.unreadByAdmin]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [selected?.id, selected?.messages?.length]);

  const handleReply = async (e) => {
    e?.preventDefault();
    const text = reply.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      const updated = await api.replySupportChat(selected.id, text);
      setChats((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setReply('');
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleResolved = async () => {
    if (!selected) return;
    const status = selected.status === 'resolved' ? 'open' : 'resolved';
    const updated = await api.updateSupportChat(selected.id, { status }).catch(() => null);
    if (updated) setChats((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete the conversation with ${selected.userName}? This cannot be undone.`)) return;
    await api.deleteSupportChat(selected.id).catch(() => {});
    setChats((prev) => prev.filter((c) => c.id !== selected.id));
    setSelectedId(null);
  };

  const counts = {
    all: chats.length,
    unread: chats.filter((c) => c.unreadByAdmin > 0).length,
    open: chats.filter((c) => c.status === 'open').length,
    resolved: chats.filter((c) => c.status === 'resolved').length
  };

  return (
    <div className="admin-support animate-fade-in">
      <div className="admin-support-topbar">
        <div className="support-view-tabs">
          <button
            id="admin-support-inbox-tab"
            className={`support-view-tab ${view === 'inbox' ? 'active' : ''}`}
            onClick={() => setView('inbox')}
          >
            <Inbox size={15} />
            <span>Inbox</span>
            {counts.unread > 0 && <span className="nav-badge alert">{counts.unread}</span>}
          </button>
          <button
            id="admin-support-settings-tab"
            className={`support-view-tab ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <Settings size={15} />
            <span>Support Settings</span>
          </button>
        </div>
        {view === 'inbox' && (
          <button className="btn-outline support-refresh-btn" onClick={reload} title="Refresh conversations">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {view === 'settings' ? (
        <SupportSettingsForm />
      ) : (
        <div className={`support-inbox-grid ${selected ? 'has-selection' : ''}`}>
          {/* Conversation list */}
          <div className="support-conv-list">
            <div className="support-conv-search">
              <Search size={14} />
              <input
                id="admin-support-search"
                type="text"
                placeholder="Search name, email or message…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="support-filter-row">
              {['all', 'unread', 'open', 'resolved'].map((f) => (
                <button
                  key={f}
                  className={`support-filter-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} <span>{counts[f]}</span>
                </button>
              ))}
            </div>

            <div className="support-conv-scroll">
              {loading && <div className="support-empty">Loading conversations…</div>}
              {!loading && filtered.length === 0 && (
                <div className="support-empty">
                  <MessageCircle size={28} />
                  <strong>No conversations yet</strong>
                  <span>Messages sent by users from the chat button will appear here in real time.</span>
                </div>
              )}
              {filtered.map((c) => {
                const last = c.messages?.[c.messages.length - 1];
                return (
                  <button
                    key={c.id}
                    className={`support-conv-item ${selectedId === c.id ? 'active' : ''} ${c.unreadByAdmin > 0 ? 'unread' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="support-conv-avatar">{initials(c.userName)}</div>
                    <div className="support-conv-meta">
                      <div className="support-conv-top">
                        <strong>{c.userName}</strong>
                        <span>{formatTime(c.updatedAt)}</span>
                      </div>
                      <div className="support-conv-bottom">
                        <span className="support-conv-preview">
                          {last ? `${last.sender === 'admin' ? 'You: ' : ''}${last.text}` : 'No messages'}
                        </span>
                        {c.unreadByAdmin > 0 ? (
                          <span className="support-unread-pill">{c.unreadByAdmin}</span>
                        ) : c.status === 'resolved' ? (
                          <CheckCircle2 size={13} className="support-resolved-icon" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thread */}
          <div className="support-thread">
            {!selected ? (
              <div className="support-thread-empty">
                <MessageCircle size={40} />
                <h4>Select a conversation</h4>
                <p>Choose a user on the left to read their messages and reply.</p>
              </div>
            ) : (
              <>
                <div className="support-thread-header">
                  <button className="support-back-btn" onClick={() => setSelectedId(null)} aria-label="Back to list">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="support-conv-avatar lg">{initials(selected.userName)}</div>
                  <div className="support-thread-user">
                    <strong>{selected.userName}</strong>
                    <span>{selected.userEmail || selected.userId}</span>
                  </div>
                  <div className="support-thread-actions">
                    <span className={`status-pill ${selected.status === 'resolved' ? 'active' : 'pending'}`}>
                      {selected.status === 'resolved' ? 'Resolved' : 'Open'}
                    </span>
                    <button className="btn-action-edit" onClick={toggleResolved}>
                      <CheckCircle2 size={13} />
                      <span>{selected.status === 'resolved' ? 'Reopen' : 'Resolve'}</span>
                    </button>
                    <button className="btn-action-delete" onClick={handleDelete} title="Delete conversation">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="support-thread-body" ref={threadRef}>
                  {(selected.messages || []).map((m) => (
                    <div key={m.id} className={`support-msg-row ${m.sender === 'admin' ? 'user' : 'admin'}`}>
                      <div className={`support-bubble ${m.sender === 'admin' ? 'user' : 'admin'}`}>
                        {m.auto && <span className="support-bubble-agent">Auto-reply</span>}
                        <span className="support-bubble-text">{m.text}</span>
                        <span className="support-bubble-time">{formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form className="support-chat-input admin" onSubmit={handleReply}>
                  <input
                    id="admin-support-reply"
                    type="text"
                    placeholder={`Reply to ${selected.userName}…`}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    autoComplete="off"
                  />
                  <button type="submit" className="support-send-btn" disabled={!reply.trim() || sending} aria-label="Send reply">
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SupportSettingsForm() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSupportSettings().then(setForm).catch(() => setForm({}));
  }, []);

  if (!form) return <div className="support-empty">Loading settings…</div>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSupportSettings(form);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Failed to save support settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ id, label, desc, field }) => (
    <label className="support-toggle-row" htmlFor={id}>
      <div>
        <strong>{label}</strong>
        <span>{desc}</span>
      </div>
      <span className={`support-switch ${form[field] !== false ? 'on' : ''}`}>
        <input
          id={id}
          type="checkbox"
          checked={form[field] !== false}
          onChange={(e) => set(field, e.target.checked)}
        />
        <span className="support-switch-knob"></span>
      </span>
    </label>
  );

  return (
    <form className="support-settings-card" onSubmit={handleSave}>
      <div className="support-settings-section">
        <h4>Chat Widget</h4>
        <Toggle id="support-enabled" field="enabled" label="Show support chat button" desc="Display the floating chat button to all users on the dashboard." />
        <Toggle id="support-online" field="online" label="Agents online" desc="When off, users see the offline message and an 'Offline' status." />
        <Toggle id="support-autoreply" field="autoReply" label="Automatic first reply" desc="Send an instant acknowledgement after a user's first message." />
      </div>

      <div className="support-settings-section">
        <h4>Messages</h4>
        <div className="grid-two-col">
          <div className="input-group">
            <label className="input-label">Agent / Team Display Name</label>
            <input className="text-input-field" value={form.agentName || ''} onChange={(e) => set('agentName', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Working Hours</label>
            <input className="text-input-field" value={form.workingHours || ''} onChange={(e) => set('workingHours', e.target.value)} placeholder="e.g. 9:00–22:00 UTC" />
          </div>
        </div>
        <div className="input-group mt-3">
          <label className="input-label">Welcome Message (online)</label>
          <textarea className="text-input-field support-textarea" rows={2} value={form.welcomeMessage || ''} onChange={(e) => set('welcomeMessage', e.target.value)} />
        </div>
        <div className="input-group mt-3">
          <label className="input-label">Offline Message</label>
          <textarea className="text-input-field support-textarea" rows={2} value={form.offlineMessage || ''} onChange={(e) => set('offlineMessage', e.target.value)} />
        </div>
      </div>

      <div className="support-settings-section">
        <h4>External Contact Channels</h4>
        <div className="grid-two-col">
          <div className="input-group">
            <label className="input-label">Telegram Link</label>
            <input type="url" className="text-input-field" value={form.telegram || ''} onChange={(e) => set('telegram', e.target.value)} placeholder="https://t.me/yourchannel" />
          </div>
          <div className="input-group">
            <label className="input-label">WhatsApp Link</label>
            <input type="url" className="text-input-field" value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="https://wa.me/123456789" />
          </div>
        </div>
        <div className="input-group mt-3">
          <label className="input-label">Support Email</label>
          <div className="input-icon-field-wrap">
            <Mail size={15} className="input-field-left-icon" />
            <input type="email" className="text-input-field with-icon" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="support@example.com" />
          </div>
        </div>
      </div>

      <div className="support-settings-footer">
        {saved && <span className="support-saved-msg"><CheckCircle2 size={14} /> Settings saved & pushed live</span>}
        <button type="submit" className="btn-primary" disabled={saving} id="admin-support-save">
          <Save size={15} />
          <span>{saving ? 'Saving…' : 'Save Support Settings'}</span>
        </button>
      </div>
    </form>
  );
}
