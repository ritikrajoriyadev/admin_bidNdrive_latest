import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Send, Calendar, Users, MessageSquare, Eye, MousePointerClick, Target, Bell, Clock, AlertTriangle, Tag, RefreshCw, Info, User, Box, Car } from 'lucide-react';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, change }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/6 p-5 hover:border-white/12 transition-all duration-300">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <span className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-white/60">
        {icon}
      </span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400`}>
        {change}
      </span>
    </div>
    <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">{label}</p>
  </div>
);

/* ─── Status Badge ─────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const config = {
    'sent': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    'pending': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
    'draft': { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
    'scheduled': { bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
    'failed': { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
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
const NotificationIcon = () => {
  return (
    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-1 shadow-lg shadow-indigo-500/5">
      <Bell size={20} className="drop-shadow-md" />
    </div>
  );
};

/* ─── Target Badge ─────────────────────────────────────────────────────── */
const TargetBadge = ({ target, value }) => {
  const config = {
    'broadcast': { label: 'All Users', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'broadcast-biders': { label: 'All Bidders', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'send-to-user': { label: 'Specific User', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    'send-to-bider': { label: 'Specific Bidder', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    'send-to-multiple': { label: 'Multiple Users', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    'send-to-biders': { label: 'Multiple Bidders', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'all_users': { label: 'All Users', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'buyers': { label: 'Buyers Only', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'car_model': { label: 'By Car Model', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    'category': { label: 'By Category', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    'segment': { label: 'By Segment', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  };
  const cfg = config[target] || config['broadcast'];

  return (
    <div className="flex flex-col gap-2">
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border} w-fit`}>
        <div className={`w-2 h-2 rounded-full bg-current animate-pulse ${cfg.color} shadow-sm`}></div>
        <span className={`text-[13px] font-bold tracking-wide ${cfg.color}`}>{cfg.label}</span>
      </div>
      
      {value && value !== 'All' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg ml-3 relative">
          <div className="absolute -left-3 top-1/2 w-3 h-[1px] bg-white/10"></div>
          <div className="absolute -left-3 -top-2 w-[1px] h-[calc(50%+8px)] bg-white/10"></div>
          <span className="text-xs font-mono text-white/60 truncate max-w-[160px]" title={value}>
            {value}
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Notification Form ─────────────────────────────────────────────────── */
const NotificationForm = ({ notification, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(
    notification || {
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
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title and Type */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Notification Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., New Car Model Launch"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Notification Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
          >
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
        <label className="block text-sm font-medium text-white/80 mb-2">Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Enter your notification message here..."
          rows="4"
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition resize-none"
          required
        />
      </div>

      {/* Target Selection */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Target Audience</label>
        <select
          name="targetType"
          value={formData.targetType}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
        >
          <option value="broadcast">Broadcast to All Users</option>
          <option value="broadcast-biders">Broadcast to All Bidders</option>
          <option value="send-to-user">Specific User</option>
          <option value="send-to-bider">Specific Bidder</option>
          <option value="send-to-multiple">Multiple Users</option>
          <option value="send-to-biders">Multiple Bidders</option>
        </select>
      </div>

      {/* Conditional Target Fields */}
      {(formData.targetType === 'send-to-user' || formData.targetType === 'send-to-bider') && (
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            {formData.targetType === 'send-to-user' ? 'User ID' : 'Bidder ID'}
          </label>
          <input
            type="text"
            name="targetId"
            value={formData.targetId || ''}
            onChange={handleChange}
            placeholder="Enter ID..."
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>
      )}

      {(formData.targetType === 'send-to-multiple' || formData.targetType === 'send-to-biders') && (
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            {formData.targetType === 'send-to-multiple' ? 'User IDs (comma separated)' : 'Bidder IDs (comma separated)'}
          </label>
          <input
            type="text"
            name="targetIds"
            value={formData.targetIds || ''}
            onChange={handleChange}
            placeholder="id1, id2, id3..."
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>
      )}

      {/* Action URL */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Action URL (Optional)</label>
        <input
          type="url"
          name="actionUrl"
          value={formData.actionUrl}
          onChange={handleChange}
          placeholder="https://example.com"
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
        />
      </div>

      {/* Scheduling */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Send</label>
        <select
          name="scheduling"
          value={formData.scheduling}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
        >
          <option value="now">Send Now</option>
          <option value="scheduled">Schedule for Later</option>
          <option value="draft">Save as Draft</option>
        </select>
      </div>

      {/* Scheduled Date & Time */}
      {formData.scheduling === 'scheduled' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Time</label>
            <input
              type="time"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
              required
            />
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {loading ? 'Sending...' : notification ? 'Update' : 'Send Notification'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition"
        >
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

  // Mock data
  const mockNotifications = [
    {
      id: 1,
      title: 'New CJ Model Available',
      message: 'Check out our latest CJ model with enhanced features and better fuel efficiency.',
      type: 'info',
      targetType: 'car_model',
      targetValue: 'CJ',
      status: 'sent',
      totalRecipients: 2450,
      delivered: 2420,
      viewed: 1890,
      clicked: 456,
      sendTime: '2024-06-15 09:30',
      createdAt: '2024-06-14'
    },
    {
      id: 2,
      title: 'Limited Time Offer - 20% Off',
      message: 'Special discount for users who have previously purchased from us. Use code: SAVE20',
      type: 'promotion',
      targetType: 'buyers',
      targetValue: 'All Buyers',
      status: 'sent',
      totalRecipients: 5680,
      delivered: 5620,
      viewed: 3450,
      clicked: 1230,
      sendTime: '2024-06-10 10:00',
      createdAt: '2024-06-09'
    },
    {
      id: 3,
      title: 'SUV Sale Alert',
      message: 'Huge discounts on all SUV models this month. Limited stocks available!',
      type: 'alert',
      targetType: 'category',
      targetValue: 'SUV',
      status: 'sent',
      totalRecipients: 3200,
      delivered: 3180,
      viewed: 2100,
      clicked: 680,
      sendTime: '2024-06-12 14:15',
      createdAt: '2024-06-11'
    },
    {
      id: 4,
      title: 'Premium Segment Launch',
      message: 'Experience luxury with our new premium segment vehicles. Book now!',
      type: 'promotion',
      targetType: 'segment',
      targetValue: 'Premium',
      status: 'pending',
      totalRecipients: 1500,
      delivered: 450,
      viewed: 200,
      clicked: 45,
      sendTime: '2024-06-20 11:00',
      createdAt: '2024-06-15'
    },
    {
      id: 5,
      title: 'Test Notification',
      message: 'This is a test notification for all users.',
      type: 'info',
      targetType: 'all_users',
      targetValue: 'All Users',
      status: 'draft',
      totalRecipients: 0,
      delivered: 0,
      viewed: 0,
      clicked: 0,
      sendTime: null,
      createdAt: '2024-06-18'
    }
  ];

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(notif => notif.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterStatus, filterType]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Replace with actual API endpoint later
      // const response = await axios.get(`${process.env.VITE_API_URL}/api/admin/notifications`);
      // setNotifications(response.data);
      
      setNotifications(mockNotifications);
      // Removed the annoying toast message here
    } catch (error) {
      console.error('Error loading notifications:', error);
      addToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (formData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      let endpoint = '';
      let payload = {
        title: formData.title,
        body: formData.message,
        data: formData.actionUrl ? { actionUrl: formData.actionUrl } : {}
      };

      if (formData.targetType === 'broadcast') {
        endpoint = '/api/notifications/admin/broadcast';
      } else if (formData.targetType === 'broadcast-biders') {
        endpoint = '/api/notifications/admin/broadcast-biders';
      } else if (formData.targetType === 'send-to-user') {
        endpoint = '/api/notifications/admin/send-to-user';
        payload.userId = formData.targetId;
      } else if (formData.targetType === 'send-to-bider') {
        endpoint = '/api/notifications/admin/send-to-bider';
        payload.biderId = formData.targetId;
      } else if (formData.targetType === 'send-to-multiple') {
        endpoint = '/api/notifications/admin/send-to-multiple';
        payload.userIds = formData.targetIds.split(',').map(id => id.trim());
      } else if (formData.targetType === 'send-to-biders') {
        endpoint = '/api/notifications/admin/send-to-biders';
        payload.biderIds = formData.targetIds.split(',').map(id => id.trim());
      }

      await axios.post(`${apiUrl}${endpoint}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Mock update to UI
      const newNotification = {
        id: Math.max(...(notifications.map(n => n.id).length ? notifications.map(n => n.id) : [0])) + 1,
        ...formData,
        status: formData.scheduling === 'now' ? 'sent' : formData.scheduling === 'draft' ? 'draft' : 'scheduled',
        totalRecipients: formData.targetType.includes('broadcast') ? Math.floor(Math.random() * 5000) + 1000 : 1,
        delivered: formData.scheduling === 'now' ? 1 : 0,
        viewed: 0,
        clicked: 0,
        sendTime: formData.scheduling === 'now' ? new Date().toLocaleString() : null,
        createdAt: new Date().toISOString().split('T')[0],
        targetValue: formData.targetId || formData.targetIds || 'All'
      };
      
      setNotifications([newNotification, ...notifications]);
      setShowForm(false);
      addToast(`Notification ${formData.scheduling === 'draft' ? 'saved as draft' : 'sent'} successfully`, 'success');
    } catch (error) {
      console.error('Error sending notification:', error);
      addToast('Failed to send notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        // Replace with actual API endpoint
        // await axios.delete(`${process.env.VITE_API_URL}/api/admin/notifications/${id}`);
        
        setNotifications(notifications.filter(n => n.id !== id));
        addToast('Notification deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting notification:', error);
        addToast('Failed to delete notification', 'error');
      }
    }
  };

  const sentNotifications = notifications.filter(n => n.status === 'sent').length;
  const totalDelivered = notifications.reduce((sum, n) => sum + n.delivered, 0);
  const totalViewed = notifications.reduce((sum, n) => sum + n.viewed, 0);
  const avgCTR = notifications.length > 0
    ? (notifications.reduce((sum, n) => sum + (n.totalRecipients > 0 ? (n.clicked / n.totalRecipients) * 100 : 0), 0) / notifications.length).toFixed(2)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Notifications</h1>
            <p className="text-white/60">Send targeted notifications to users</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg font-medium transition"
          >
            <Plus size={20} />
            New Notification
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Sent" value={sentNotifications} icon={<Send size={18} />} accentClass="bg-indigo-600" change="+3 this week" />
          <StatCard label="Total Delivered" value={totalDelivered.toLocaleString()} icon={<Eye size={18} />} accentClass="bg-emerald-600" change="+12.5%" />
          <StatCard label="Total Viewed" value={totalViewed.toLocaleString()} icon={<MessageSquare size={18} />} accentClass="bg-blue-600" change="+8.3%" />
          <StatCard label="Avg CTR" value={`${avgCTR}%`} icon={<Users size={18} />} accentClass="bg-purple-600" change="+2.1%" />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-900 border border-white/6 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Edit Notification' : 'Create New Notification'}
            </h2>
            <NotificationForm
              notification={editingId ? notifications.find(n => n.id === editingId) : null}
              onSubmit={handleSendNotification}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              loading={loading}
            />
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="promotion">Promotion</option>
            <option value="alert">Alert</option>
            <option value="update">Update</option>
            <option value="reminder">Reminder</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Notifications Table */}
        <div className="bg-gray-900 border border-white/6 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-white/6">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Delivery</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Interactions</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filteredNotifications.map(notif => (
                  <tr key={notif.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <NotificationIcon />
                        <div className="max-w-[260px]">
                          <p className="text-[17px] font-bold text-white tracking-wide truncate" title={notif.title}>
                            {notif.title}
                          </p>
                          <p className="text-sm text-white/50 mt-1 line-clamp-2 leading-relaxed font-medium" title={notif.message}>
                            {notif.message}
                          </p>
                          {notif.sendTime && (
                            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-white/40 font-semibold uppercase tracking-wider">
                              <Clock size={12} className="text-white/30" />
                              <span>{new Date(notif.sendTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TargetBadge target={notif.targetType} value={notif.targetValue} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/80 capitalize font-medium">{notif.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={notif.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full min-w-[120px]">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-xs font-semibold text-white/90">
                            {notif.delivered.toLocaleString()} <span className="text-white/30 font-medium">/ {notif.totalRecipients.toLocaleString()}</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {notif.totalRecipients > 0 ? ((notif.delivered / notif.totalRecipients) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 border border-white/5">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full relative overflow-hidden transition-all duration-500" 
                            style={{ width: `${notif.totalRecipients > 0 ? (notif.delivered / notif.totalRecipients) * 100 : 0}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-lg p-1.5 min-w-[48px] transition cursor-default group" title="Viewed">
                          <Eye size={14} className="text-blue-400/70 group-hover:text-blue-400 mb-0.5 transition-colors" />
                          <span className="text-[10px] font-semibold text-blue-300">{notif.viewed.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-lg p-1.5 min-w-[48px] transition cursor-default group" title="Clicked">
                          <MousePointerClick size={14} className="text-purple-400/70 group-hover:text-purple-400 mb-0.5 transition-colors" />
                          <span className="text-[10px] font-semibold text-purple-300">{notif.clicked.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {notif.status === 'draft' && (
                          <button
                            onClick={() => {
                              setEditingId(notif.id);
                              setShowForm(true);
                            }}
                            className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="mx-auto mb-4 text-white/20" size={48} />
              <p className="text-white/60">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
