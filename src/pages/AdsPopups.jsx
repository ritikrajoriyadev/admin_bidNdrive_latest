import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import {
  Search, Plus, Trash2, Edit2, Eye, EyeOff, Upload,
  MousePointerClick, LayoutTemplate, Megaphone, X, Calendar,
} from 'lucide-react';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, change }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/6 p-5 hover:border-white/10 transition-all duration-300">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <span className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center text-white/60">{icon}</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{change}</span>
    </div>
    <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">{label}</p>
  </div>
);

/* ─── Status Badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = {
    active:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    inactive:  { bg: 'bg-gray-500/15',    text: 'text-gray-400',    dot: 'bg-gray-400'    },
    scheduled: { bg: 'bg-blue-500/15',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
    archived:  { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400'     },
  }[status] || { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/* ─── Type Badge ─────────────────────────────────────────────────────────── */
const TypeBadge = ({ type }) => {
  const cfg = {
    popup:   { bg: 'bg-violet-500/15', text: 'text-violet-300' },
    banner:  { bg: 'bg-blue-500/15',   text: 'text-blue-300'   },
    overlay: { bg: 'bg-rose-500/15',   text: 'text-rose-300'   },
    inline:  { bg: 'bg-amber-500/15',  text: 'text-amber-300'  },
    sticky:  { bg: 'bg-cyan-500/15',   text: 'text-cyan-300'   },
  }[type] || { bg: 'bg-gray-500/15', text: 'text-gray-300' };
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${cfg.bg} ${cfg.text}`}>
      {type}
    </span>
  );
};

/* ─── Preview Modal ──────────────────────────────────────────────────────── */
const PreviewModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-indigo-400" />
            <p className="text-sm font-semibold text-white">Preview — {item.title}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={18} /></button>
        </div>

        {/* Simulated device frame */}
        <div className="p-5">
          <div className="rounded-xl bg-gray-950 border border-white/6 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border-b border-white/6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="flex-1 mx-3 h-5 rounded bg-gray-700 text-[10px] text-white/30 px-2 flex items-center">bidndrive.com</span>
            </div>

            {/* Page simulation */}
            <div className="relative h-56 bg-gray-900 flex items-center justify-center">
              {/* Fake page content */}
              <div className="absolute inset-0 p-4 space-y-2 opacity-20">
                <div className="h-3 bg-white/20 rounded w-3/4" />
                <div className="h-3 bg-white/20 rounded w-1/2" />
                <div className="h-3 bg-white/20 rounded w-5/6" />
                <div className="h-3 bg-white/20 rounded w-2/3" />
              </div>

              {/* Popup / Ad overlay */}
              {item.type === 'popup' || item.type === 'overlay' ? (
                <div className="relative z-10 bg-gray-800 border border-indigo-500/30 rounded-xl shadow-xl p-4 w-64 text-center">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-full h-24 object-cover rounded-lg mb-3" />
                  )}
                  <p className="text-white text-sm font-bold">{item.title}</p>
                  <p className="text-white/50 text-xs mt-1">{item.description}</p>
                  {item.ctaLabel && (
                    <button className="mt-3 w-full py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                      {item.ctaLabel}
                    </button>
                  )}
                </div>
              ) : item.type === 'sticky' ? (
                <div className="absolute bottom-0 inset-x-0 z-10 bg-indigo-900/90 border-t border-indigo-500/30 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-bold">{item.title}</p>
                    <p className="text-white/50 text-[10px]">{item.description}</p>
                  </div>
                  {item.ctaLabel && (
                    <button className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-semibold shrink-0 ml-3">
                      {item.ctaLabel}
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative z-10 w-full px-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-24 object-cover rounded-xl border border-white/10" />
                  ) : (
                    <div className="w-full h-24 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex flex-col items-center justify-center gap-1">
                      <Megaphone size={22} className="text-indigo-400" />
                      <p className="text-white text-xs font-bold">{item.title}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Type', value: item.type },
              { label: 'Placement', value: item.placement },
              { label: 'Status', value: item.status },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 rounded-xl px-3 py-2 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-widest">{label}</p>
                <p className="text-white text-xs font-semibold mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Ad / Popup Form ────────────────────────────────────────────────────── */
const AdForm = ({ item, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(item || {
    title: '', description: '', type: 'popup', placement: 'homepage',
    ctaLabel: '', ctaUrl: '', image: null, imagePreview: '',
    status: 'active', priority: '1',
    trigger: 'onload', delay: '3', frequency: 'once',
    startDate: '', endDate: '',
  });

  const handle = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, image: file, imagePreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inp = 'w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition';

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Title">
          <input name="title" value={form.title} onChange={handle} placeholder="e.g. Flash Sale Popup" className={inp} required />
        </Field>
        <Field label="Type">
          <select name="type" value={form.type} onChange={handle} className={inp}>
            <option value="popup">Popup</option>
            <option value="overlay">Full Overlay</option>
            <option value="banner">Inline Banner</option>
            <option value="sticky">Sticky Bar</option>
            <option value="inline">Inline Ad</option>
          </select>
        </Field>
      </div>

      <Field label="Description / Body Text">
        <textarea name="description" value={form.description} onChange={handle} rows="3" placeholder="Short message or offer details..." className={`${inp} resize-none`} />
      </Field>

      {/* Image Upload */}
      <Field label="Creative Image (optional)">
        <label htmlFor="adImage" className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-2 border-dashed border-indigo-500/25 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-white/50 hover:text-white/70">
          <Upload size={18} />
          <span className="text-sm">Click to upload — PNG, JPG up to 5 MB</span>
          <input id="adImage" type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </label>
        {form.imagePreview && (
          <div className="mt-2 rounded-lg overflow-hidden border border-white/10 h-28">
            <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}
      </Field>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="CTA Label">
          <input name="ctaLabel" value={form.ctaLabel} onChange={handle} placeholder="e.g. Shop Now" className={inp} />
        </Field>
        <Field label="CTA URL">
          <input name="ctaUrl" type="url" value={form.ctaUrl} onChange={handle} placeholder="https://..." className={inp} />
        </Field>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Placement">
          <select name="placement" value={form.placement} onChange={handle} className={inp}>
            <option value="homepage">Homepage</option>
            <option value="listing">Listing Page</option>
            <option value="detail">Car Detail</option>
            <option value="checkout">Checkout</option>
            <option value="all">All Pages</option>
          </select>
        </Field>
        <Field label="Status">
          <select name="status" value={form.status} onChange={handle} className={inp}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" value={form.priority} onChange={handle} className={inp}>
            {['1','2','3','4','5'].map(p => <option key={p} value={p}>Priority {p}</option>)}
          </select>
        </Field>
      </div>

      {/* Popup-specific trigger settings */}
      {(form.type === 'popup' || form.type === 'overlay') && (
        <div className="grid md:grid-cols-3 gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <Field label="Trigger">
            <select name="trigger" value={form.trigger} onChange={handle} className={inp}>
              <option value="onload">On Page Load</option>
              <option value="scroll">On Scroll (50%)</option>
              <option value="exit_intent">Exit Intent</option>
              <option value="click">On Button Click</option>
            </select>
          </Field>
          <Field label="Delay (seconds)">
            <input name="delay" type="number" min="0" max="60" value={form.delay} onChange={handle} className={inp} />
          </Field>
          <Field label="Show Frequency">
            <select name="frequency" value={form.frequency} onChange={handle} className={inp}>
              <option value="once">Once per session</option>
              <option value="once_day">Once per day</option>
              <option value="always">Every visit</option>
            </select>
          </Field>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Start Date">
          <input name="startDate" type="date" value={form.startDate} onChange={handle} className={inp} />
        </Field>
        <Field label="End Date">
          <input name="endDate" type="date" value={form.endDate} onChange={handle} className={inp} />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
          <Megaphone size={16} />
          {loading ? 'Saving...' : item ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition">
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function AdsPopups() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const mockData = [
    {
      id: 1, title: 'Flash Sale — 30% Off SUVs', description: 'Limited time offer on all SUV models. Offer ends Sunday midnight!',
      type: 'popup', placement: 'homepage', ctaLabel: 'Grab the Deal', ctaUrl: '#',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
      status: 'active', priority: '1', trigger: 'onload', delay: '3', frequency: 'once_day',
      startDate: '2024-06-01', endDate: '2024-07-31', views: 14200, clicks: 3850, createdAt: '2024-05-28',
    },
    {
      id: 2, title: 'Newsletter Subscribe', description: 'Get exclusive deals delivered to your inbox.',
      type: 'overlay', placement: 'all', ctaLabel: 'Subscribe Now', ctaUrl: '#',
      image: '', status: 'active', priority: '2', trigger: 'scroll', delay: '0', frequency: 'once',
      startDate: '2024-06-01', endDate: '', views: 9600, clicks: 1240, createdAt: '2024-06-01',
    },
    {
      id: 3, title: 'Exchange Your Car', description: 'Trade-in offer — get up to ₹1 lakh extra.',
      type: 'sticky', placement: 'listing', ctaLabel: 'Know More', ctaUrl: '#',
      image: '', status: 'active', priority: '1', trigger: 'onload', delay: '0', frequency: 'always',
      startDate: '2024-06-10', endDate: '2024-08-10', views: 22000, clicks: 5100, createdAt: '2024-06-08',
    },
    {
      id: 4, title: 'Featured Car — Tata Nexon EV', description: 'Drive electric. Exclusively available this month.',
      type: 'inline', placement: 'homepage', ctaLabel: 'View Car', ctaUrl: '#',
      image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=80',
      status: 'inactive', priority: '3', trigger: 'onload', delay: '0', frequency: 'always',
      startDate: '2024-05-01', endDate: '2024-05-31', views: 8300, clicks: 900, createdAt: '2024-04-25',
    },
    {
      id: 5, title: 'Year-End Mega Sale', description: 'Biggest car sale of the year — up to 40% off.',
      type: 'popup', placement: 'all', ctaLabel: 'Shop Now', ctaUrl: '#',
      image: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&q=80',
      status: 'scheduled', priority: '1', trigger: 'exit_intent', delay: '0', frequency: 'once_day',
      startDate: '2024-12-15', endDate: '2024-12-31', views: 0, clicks: 0, createdAt: '2024-06-15',
    },
    {
      id: 6, title: 'Google Ads — Budget Segment', description: 'Targeted ad for budget car searchers.',
      type: 'banner', placement: 'listing', ctaLabel: 'Explore Now', ctaUrl: '#',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
      status: 'active', priority: '2', trigger: 'onload', delay: '0', frequency: 'always',
      startDate: '2024-06-01', endDate: '', views: 31000, clicks: 7400, createdAt: '2024-05-30',
    },
  ];

  useEffect(() => { setItems(mockData); }, []);

  useEffect(() => {
    let result = items;
    if (activeTab !== 'all') result = result.filter(i => i.type === activeTab);
    if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
    if (search) result = result.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [items, activeTab, filterStatus, search]);

  const handleCreate = (form) => {
    setLoading(true);
    setTimeout(() => {
      const newItem = {
        ...form,
        id: Math.max(...items.map(i => i.id), 0) + 1,
        image: form.imagePreview || form.image,
        imagePreview: undefined,
        views: 0, clicks: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setItems(prev => [newItem, ...prev]);
      setShowForm(false);
      setLoading(false);
      addToast('Ad / Popup created successfully', 'success');
    }, 500);
  };

  const handleUpdate = (form) => {
    setLoading(true);
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === editingId
        ? { ...i, ...form, image: form.imagePreview || form.image || i.image, imagePreview: undefined }
        : i
      ));
      setShowForm(false);
      setEditingId(null);
      setLoading(false);
      addToast('Updated successfully', 'success');
    }, 500);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this ad/popup?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    addToast('Deleted successfully', 'success');
  };

  const toggleStatus = (id) => {
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' }
      : i
    ));
  };

  const totalActive  = items.filter(i => i.status === 'active').length;
  const totalPopups  = items.filter(i => i.type === 'popup' || i.type === 'overlay').length;
  const totalViews   = items.reduce((s, i) => s + i.views, 0);
  const totalClicks  = items.reduce((s, i) => s + i.clicks, 0);
  const avgCTR       = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

  const tabs = [
    { id: 'all',     label: 'All' },
    { id: 'popup',   label: 'Popups' },
    { id: 'overlay', label: 'Overlays' },
    { id: 'sticky',  label: 'Sticky Bar' },
    { id: 'banner',  label: 'Banners' },
    { id: 'inline',  label: 'Inline Ads' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Ads & Popups</h1>
            <p className="text-white/50">Manage promotional popups, sticky bars, overlays and inline ads</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setShowForm(v => !v); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> New Ad / Popup
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Items"    value={items.length}              icon={<LayoutTemplate size={18}/>} accentClass="bg-indigo-600"  change={`${totalActive} active`} />
          <StatCard label="Popups"         value={totalPopups}               icon={<MousePointerClick size={18}/>} accentClass="bg-violet-600" change="modal / overlay" />
          <StatCard label="Total Views"    value={totalViews.toLocaleString()} icon={<Eye size={18}/>}         accentClass="bg-blue-600"   change="+8.4%" />
          <StatCard label="Avg CTR"        value={`${avgCTR}%`}              icon={<Megaphone size={18}/>}    accentClass="bg-emerald-600" change={`${totalClicks.toLocaleString()} clicks`} />
        </div>

        {/* ── Create / Edit Form ── */}
        {showForm && (
          <div className="bg-gray-900 border border-white/6 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">
              {editingId ? 'Edit Ad / Popup' : 'Create New Ad / Popup'}
            </h2>
            <AdForm
              item={editingId ? items.find(i => i.id === editingId) : null}
              onSubmit={editingId ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingId(null); }}
              loading={loading}
            />
          </div>
        )}

        {/* ── Type Tabs ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60">
                ({tab.id === 'all' ? items.length : items.filter(i => i.type === tab.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* ── Card Grid View ── */}
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-white/6 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
            <Megaphone size={44} className="text-white/15" />
            <p className="text-white/40 text-sm">No ads or popups found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(item => {
              const ctr = item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(1) : '0.0';
              return (
                <div key={item.id} className="group bg-gray-900 border border-white/6 rounded-2xl overflow-hidden hover:border-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                  {/* Creative thumbnail */}
                  <div className="relative h-36 bg-gray-800 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-violet-900/30">
                        <Megaphone size={36} className="text-indigo-400/40" />
                      </div>
                    )}
                    {/* Overlay badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <TypeBadge type={item.type} />
                    </div>
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={item.status} />
                    </div>
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingId(item.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                      {/* Quick status toggle */}
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition ${
                          item.status === 'active'
                            ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-gray-700/50 border-white/10 text-white/30 hover:text-white/60'
                        }`}
                        title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {item.status === 'active' ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Views',  value: item.views.toLocaleString()  },
                        { label: 'Clicks', value: item.clicks.toLocaleString() },
                        { label: 'CTR',    value: `${ctr}%`                    },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-800/60 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-white/35 text-[9px] uppercase tracking-widest">{label}</p>
                          <p className="text-white text-xs font-bold mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1 text-white/30 text-[10px]">
                        <Calendar size={10} />
                        {item.startDate || '—'}
                        {item.endDate ? ` → ${item.endDate}` : ''}
                      </div>
                      <span className="text-[10px] text-white/25 capitalize">
                        P{item.priority} · {item.placement}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}
