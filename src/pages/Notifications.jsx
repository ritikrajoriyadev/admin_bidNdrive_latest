import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Send, Calendar, Users, MessageSquare, Eye, MousePointerClick, Target, Bell, Clock, AlertTriangle, Tag, RefreshCw, Info, User, Box, Car } from 'lucide-react';

/* ─── API Helper ─────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

/**
 * Maps formData → { endpoint, payload } for each of the 6 admin notification APIs:
 *
 *  POST /api/notifications/admin/broadcast            { title, body, data? }
 *  POST /api/notifications/admin/broadcast-biders     { title, body, data? }
 *  POST /api/notifications/admin/send-to-user         { userId, title, body, data? }
 *  POST /api/notifications/admin/send-to-bider        { biderId, title, body, data? }
 *  POST /api/notifications/admin/send-to-multiple     { userIds[], title, body, data? }
 *  POST /api/notifications/admin/send-to-biders       { biderIds[], title, body, data? }
 */
const buildRequest = (formData) => {
  const base = {
    title: formData.title,
    body: formData.message,
    ...(formData.actionUrl ? { data: { actionUrl: formData.actionUrl } } : {}),
  };

  switch (formData.targetType) {
    case 'broadcast':
      return { endpoint: '/api/notifications/admin/broadcast', payload: base };

    case 'broadcast-biders':
      return { endpoint: '/api/notifications/admin/broadcast-biders', payload: base };

    case 'send-to-user':
      return {
        endpoint: '/api/notifications/admin/send-to-user',
        payload: { ...base, userId: formData.targetId.trim() },
      };

    case 'send-to-bider':
      return {
        endpoint: '/api/notifications/admin/send-to-bider',
        payload: { ...base, biderId: formData.targetId.trim() },
      };

    case 'send-to-multiple':
      return {
        endpoint: '/api/notifications/admin/send-to-multiple',
        payload: {
          ...base,
          userIds: formData.targetIds.split(',').map((id) => id.trim()).filter(Boolean),
        },
      };

    case 'send-to-biders':
      return {
        endpoint: '/api/notifications/admin/send-to-biders',
        payload: {
          ...base,
          biderIds: formData.targetIds.split(',').map((id) => id.trim()).filter(Boolean),
        },
      };

    default:
      throw new Error(`Unknown targetType: ${formData.targetType}`);
  }
};

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, change }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/6 p-5 hover:border-white/12 transition-all duration-300">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <span className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center indigo-500/60">
        {icon}
      </span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
        {change}
      </span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/40 text-xs font-medium mt-1 uppercase tracking-widest">{label}</p>
  </div>
);

/* ─── Status Badge ─────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const config = {
    sent: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    pending: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
    draft: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
    scheduled: { bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const cfg = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/* ─── Notification Icon ────────────────────────────────────────────────── */
const NotificationIcon = () => (
  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-1 shadow-lg shadow-indigo-500/5">
    <Bell size={20} className="drop-shadow-md" />
  </div>
);

/* ─── Target Badge ─────────────────────────────────────────────────────── */
const TargetBadge = ({ target, value }) => {
  const config = {
    broadcast: { label: 'All Users', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'broadcast-biders': { label: 'All Bidders', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'send-to-user': { label: 'Specific User', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    'send-to-bider': { label: 'Specific Bidder', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    'send-to-multiple': { label: 'Multiple Users', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    'send-to-biders': { label: 'Multiple Bidders', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    // Legacy / mock keys kept for display compatibility
    all_users: { label: 'All Users', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    buyers: { label: 'Buyers Only', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    car_model: { label: 'By Car Model', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    category: { label: 'By Category', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    segment: { label: 'By Segment', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  };
  const cfg = config[target] || config.broadcast;

  return (
    <div className="flex flex-col gap-2">
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border} w-fit`}>
        <div className={`w-2 h-2 rounded-full bg-current animate-pulse ${cfg.color} shadow-sm`} />
        <span className={`text-[13px] font-bold tracking-wide ${cfg.color}`}>{cfg.label}</span>
      </div>
      {value && value !== 'All' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg ml-3 relative">
          <div className="absolute -left-3 top-1/2 w-3 h-[1px] bg-white/10" />
          <div className="absolute -left-3 -top-2 w-[1px] h-[calc(50%+8px)] bg-white/10" />
          <span className="text-xs font-mono indigo-500/60 truncate max-w-[160px]" title={value}>
            {value}
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Notification Form ─────────────────────────────────────────────────── */
const EMPTY_FORM = {
  title: '',
  message: '',
  targetType: 'broadcast',
  targetId: '',
  targetIds: '',
  type: 'info',
  scheduling: 'now',
  scheduledDate: '',
  scheduledTime: '',
  actionUrl: '',
};

const NotificationForm = ({ notification, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(notification || EMPTY_FORM);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const needsSingleId = ['send-to-user', 'send-to-bider'].includes(formData.targetType);
  const needsMultipleIds = ['send-to-multiple', 'send-to-biders'].includes(formData.targetType);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title + Type */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">Notification Title</label>
          <input
            type="text" name="title" value={formData.title} onChange={handleChange}
            placeholder="e.g., New Car Model Launch"
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">Notification Type</label>
          <select name="type" value={formData.type} onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition">
            <option value="info">Info</option>
            <option value="promotion">Promotion</option>
            <option value="alert">Alert</option>
            <option value="update">Update</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">Message</label>
        <textarea
          name="message" value={formData.message} onChange={handleChange}
          placeholder="Enter your notification message here..."
          rows="4"
          className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition resize-none"
          required
        />
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">Target Audience</label>
        <select name="targetType" value={formData.targetType} onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition">
          <option value="broadcast">Broadcast to All Users</option>
          <option value="broadcast-biders">Broadcast to All Bidders</option>
          <option value="send-to-user">Specific User</option>
          <option value="send-to-bider">Specific Bidder</option>
          <option value="send-to-multiple">Multiple Users</option>
          <option value="send-to-biders">Multiple Bidders</option>
        </select>
      </div>

      {/* Single ID field */}
      {needsSingleId && (
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">
            {formData.targetType === 'send-to-user' ? 'User ID' : 'Bidder ID'}
          </label>
          <input
            type="text" name="targetId" value={formData.targetId} onChange={handleChange}
            placeholder="Enter ID…"
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>
      )}

      {/* Multiple IDs field */}
      {needsMultipleIds && (
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">
            {formData.targetType === 'send-to-multiple' ? 'User IDs' : 'Bidder IDs'}
            <span className="indigo-500/40 font-normal ml-1">(comma separated)</span>
          </label>
          <input
            type="text" name="targetIds" value={formData.targetIds} onChange={handleChange}
            placeholder="id1, id2, id3…"
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>
      )}

      {/* Action URL */}
      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">
          Action URL <span className="indigo-500/40 font-normal">(Optional — sent in <code className="text-indigo-400 text-xs">data.actionUrl</code>)</span>
        </label>
        <input
          type="url" name="actionUrl" value={formData.actionUrl} onChange={handleChange}
          placeholder="https://example.com"
          className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
        />
      </div>

      {/* Scheduling */}
      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">Send</label>
        <select name="scheduling" value={formData.scheduling} onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition">
          <option value="now">Send Now</option>
          <option value="scheduled">Schedule for Later</option>
          <option value="draft">Save as Draft</option>
        </select>
      </div>

      {/* Scheduled date/time */}
      {formData.scheduling === 'scheduled' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium indigo-500/80 mb-2">Date</label>
            <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
              required />
          </div>
          <div>
            <label className="block text-sm font-medium indigo-500/80 mb-2">Time</label>
            <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
              required />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 indigo-500 rounded-lg font-medium transition flex items-center justify-center gap-2">
          <Send size={18} />
          {loading ? 'Sending…' : notification ? 'Update' : 'Send Notification'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-gray-700 indigo-500 rounded-lg font-medium transition">
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Notifications() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setNotifications([]);
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = notifications;
    if (searchTerm)
      filtered = filtered.filter((n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (filterStatus !== 'all') filtered = filtered.filter((n) => n.status === filterStatus);
    if (filterType !== 'all') filtered = filtered.filter((n) => n.type === filterType);
    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterStatus, filterType]);

  // ── Send / Create ────────────────────────────────────────────────────────
  const handleSendNotification = async (formData) => {
    // Drafts and scheduled notifications are UI-only (no live API call)
    if (formData.scheduling !== 'now') {
      const newNotification = buildOptimisticEntry(formData);
      setNotifications((prev) => [newNotification, ...prev]);
      setShowForm(false);
      setEditingId(null);
      addToast(
        formData.scheduling === 'draft'
          ? 'Notification saved as draft'
          : 'Notification scheduled',
        'success'
      );
      return;
    }

    try {
      setLoading(true);
      const { endpoint, payload } = buildRequest(formData);

      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: getAuthHeaders(),
      });

      const newNotification = buildOptimisticEntry(formData, 'sent');
      setNotifications((prev) => [newNotification, ...prev]);
      setShowForm(false);
      setEditingId(null);
      addToast('Notification sent successfully', 'success');
    } catch (error) {
      console.error('Error sending notification:', error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to send notification';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /** Build a local UI row for immediate feedback while the API is in-flight */
  const buildOptimisticEntry = (formData, overrideStatus) => {
    const status =
      overrideStatus ||
      (formData.scheduling === 'now'
        ? 'sent'
        : formData.scheduling === 'draft'
          ? 'draft'
          : 'scheduled');

    const isBroadcast = formData.targetType.startsWith('broadcast');

    return {
      id: Date.now(),
      title: formData.title,
      message: formData.message,
      type: formData.type,
      targetType: formData.targetType,
      targetValue: formData.targetId || formData.targetIds || 'All',
      status,
      totalRecipients: isBroadcast ? '—' : formData.targetIds
        ? formData.targetIds.split(',').filter(Boolean).length
        : 1,
      delivered: status === 'sent' ? (isBroadcast ? '—' : 1) : 0,
      viewed: 0,
      clicked: 0,
      sendTime: status === 'sent' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString().split('T')[0],
    };
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteNotification = (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    addToast('Notification deleted', 'success');
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const sentNotifications = notifications.filter((n) => n.status === 'sent').length;
  const totalDelivered = notifications.reduce((s, n) => s + (Number(n.delivered) || 0), 0);
  const totalViewed = notifications.reduce((s, n) => s + (Number(n.viewed) || 0), 0);
  const avgCTR = notifications.length
    ? (
      notifications.reduce((s, n) => {
        const r = Number(n.totalRecipients);
        return s + (r > 0 ? (n.clicked / r) * 100 : 0);
      }, 0) / notifications.length
    ).toFixed(2)
    : '0';

  return (
    <div className="min-h-screen  from-gray-950 via-gray-900 indigo-500 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold indigo-500 mb-1">Notifications</h1>
            <p className="indigo-500/60">Send targeted notifications to users</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setShowForm((v) => !v); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 indigo-500 rounded-lg font-medium transition"
          >
            <Plus size={20} />
            New Notification
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Sent" value={sentNotifications} icon={<Send size={18} />} accentClass="bg-indigo-600" change="+3 this week" />
          <StatCard label="Total Delivered" value={totalDelivered.toLocaleString()} icon={<Eye size={18} />} accentClass="bg-emerald-600" change="+12.5%" />
          <StatCard label="Total Viewed" value={totalViewed.toLocaleString()} icon={<MessageSquare size={18} />} accentClass="bg-blue-600" change="+8.3%" />
          <StatCard label="Avg CTR" value={`${avgCTR}%`} icon={<Users size={18} />} accentClass="bg-purple-600" change="+2.1%" />
        </div>

        {/* ── Form ── */}
        {showForm && (
          <div className="bg-white border border-white/6 rounded-2xl p-6">
            <h2 className="text-xl font-bold indigo-500 mb-6">
              {editingId ? 'Edit Notification' : 'Create New Notification'}
            </h2>
            <NotificationForm
              notification={editingId ? notifications.find((n) => n.id === editingId) : null}
              onSubmit={handleSendNotification}
              onCancel={() => { setShowForm(false); setEditingId(null); }}
              loading={loading}
            />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 indigo-500/40" size={20} />
            <input
              type="text" placeholder="Search notifications…" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition">
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="promotion">Promotion</option>
            <option value="alert">Alert</option>
            <option value="update">Update</option>
            <option value="reminder">Reminder</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition">
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* ── Table ── */}

      </div>
    </div>
  );
}