import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import EnquiryDetailPage from './Enquirydetailpage';

const statusConfig = {
  new:         { label: 'New',         bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open:        { label: 'Open',        bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  pending:     { label: 'Pending',     bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned:    { label: 'Assigned',    bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  'in-progress':{ label: 'In Progress',bg: 'bg-sky-500/15',   text: 'text-sky-400',    dot: 'bg-sky-400'    },
  transferred: { label: 'Transferred', bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  resolved:    { label: 'Resolved',    bg: 'bg-emerald-500/15',text: 'text-emerald-400',dot: 'bg-emerald-400'},
  closed:      { label: 'Closed',      bg: 'bg-gray-500/15',   text: 'text-gray-400',   dot: 'bg-gray-400'   },
  completed:   { label: 'Completed',   bg: 'bg-teal-500/15',   text: 'text-teal-400',   dot: 'bg-teal-400'   },
};

const priorityConfig = {
  high:   { label: 'High',   bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20'    },
  medium: { label: 'Medium', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  low:    { label: 'Low',    bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500',      'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',     'from-teal-500 to-cyan-500',
];

/* ─── Active statuses for Telecaller (NOT completed) ─────────────────────── */
const ACTIVE_STATUSES = ['new', 'open', 'pending', 'assigned', 'in-progress', 'transferred'];

/* ─── Normalize ──────────────────────────────────────────────────────────── */
const normalizeEnquiry = (raw, idx) => ({
  id:            raw._id || raw.id || `idx-${idx}`,
  name:          [raw.userId?.firstName, raw.userId?.lastName].filter(Boolean).join(' ') || 'Unknown',
  email:         raw.userId?.email || 'N/A',
  phone:         raw.contactNumber || raw.userId?.phone || '—',
  subject:       raw.title || raw.description || 'No subject',
  message:       raw.description || '',
  status:        raw.status || 'new',
  priority:      raw.priority || 'medium',
  date:          raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : '—',
  time:          raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
  avatar:        `${raw.userId?.firstName?.[0] || 'U'}${raw.userId?.lastName?.[0] || ''}`.toUpperCase(),
  estimatedCost: raw.estimatedCost || 0,
  actualCost:    raw.actualCost || 0,
  enquiryId:     raw.enquiryId || raw._id || raw.id || `idx-${idx}`,
  assignedTo:    raw.assignedTo?.name || raw.assignedTo || null,
});

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
      <span className="text-white/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-white/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Status Update Modal ────────────────────────────────────────────────── */
const StatusUpdateModal = ({ enquiry, onClose, onUpdate }) => {
  const [newStatus, setNewStatus] = useState(enquiry.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await onUpdate(enquiry.id, newStatus, note);
      onClose();
    } catch (err) {
      console.error('Status update failed', err);
    } finally {
      setLoading(false);
    }
  };

  const availableStatuses = [
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assign to Team' },
    { key: 'transferred', label: 'Transfer Requisition' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'pending', label: 'Pending' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/[0.1] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-1">Update Status</h3>
        <p className="text-white/40 text-sm mb-4">Enquiry #{enquiry.enquiryId}</p>
        
        <div className="space-y-3 mb-4">
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">New Status</label>
          <div className="grid grid-cols-2 gap-2">
            {availableStatuses.map((s) => (
              <button
                key={s.key}
                onClick={() => setNewStatus(s.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  newStatus === s.key 
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25' 
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Note (Optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note about this status change..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none focus:border-teal-500/50 resize-none h-20"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] text-white/60 text-sm font-semibold hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || newStatus === enquiry.status}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const Telecaller = () => {
  const [enquiries,    setEnquiries]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilter]       = useState('all');
  const [selectedId,   setSelectedId]   = useState(null);
  const [statusModal,  setStatusModal]  = useState(null);
  const toast = useToast();

  const token      = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res     = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries`, {
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const rawList = res.data?.data ?? res.data ?? [];
      const list    = Array.isArray(rawList) ? rawList : [];

      /* ── FILTER: keep only ACTIVE enquiries (new, open, pending, etc.) ── */
      const active = list.filter(r => ACTIVE_STATUSES.includes(r.status));
      setEnquiries(active.map(normalizeEnquiry));
    } catch (err) {
      console.error('fetchEnquiries error', err);
      toast.error?.('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnquiries(); }, []);

  /* ── Update Status ──────────────────────────────────────────────────────── */
  const handleStatusUpdate = async (enquiryId, newStatus, note) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${enquiryId}/status`,
        { status: newStatus, note },
        { headers: { 'Content-Type': 'application/json', ...authHeader() } }
      );
      toast.success?.('Status updated successfully');
      fetchEnquiries(); // Refresh list
    } catch (err) {
      console.error('Status update error', err);
      toast.error?.('Failed to update status');
      throw err;
    }
  };

  /* ── Counts ─────────────────────────────────────────────────────────────── */
  const counts = {
    all:         enquiries.length,
    new:         enquiries.filter(e => e.status === 'new').length,
    open:        enquiries.filter(e => e.status === 'open').length,
    pending:     enquiries.filter(e => e.status === 'pending').length,
    assigned:    enquiries.filter(e => e.status === 'assigned').length,
    transferred: enquiries.filter(e => e.status === 'transferred').length,
    'in-progress': enquiries.filter(e => e.status === 'in-progress').length,
  };

  /* ── Filtered list ───────────────────────────────────────────────────────── */
  const filtered = enquiries.filter(e => {
    const hay         = `${e.name} ${e.subject} ${e.id} ${e.email} ${e.enquiryId}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filterTabs = [
    { key: 'all',         label: 'All Active' },
    { key: 'new',         label: 'New Requests' },
    { key: 'open',        label: 'Open' },
    { key: 'assigned',    label: 'Assigned' },
    { key: 'transferred', label: 'Transferred' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'pending',     label: 'Pending' },
  ];

  /* ── If detail page is open, render it full-screen ──────────────────────── */
  if (selectedId) {
    return (
      <EnquiryDetailPage
        enquiryId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold">Telecaller Dashboard</h1>
        <p className="text-white/35 text-sm mt-0.5">Manage new requests, transfers, and status updates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Active" value={counts.all} sub="All active" accent="bg-indigo-500"
          icon={<svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard label="New Requests" value={counts.new} sub="Unread" accent="bg-amber-500"
          icon={<svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>} />
        <StatCard label="Transferred" value={counts.transferred} sub="Handovers" accent="bg-orange-500"
          icon={<svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 8V3H12"/><path d="M17 3l-5 5"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/></svg>} />
        <StatCard label="In Progress" value={counts['in-progress']} sub="Working" accent="bg-sky-500"
          icon={<svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-max">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  filterStatus === tab.key ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-white/35 hover:text-white/60'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/40'}`}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" placeholder="Search enquiries…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-white/70 text-sm placeholder-white/20 outline-none focus:border-teal-500/50 focus:bg-white/[0.06] transition-all duration-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Headers */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              {['Sender', 'Subject', 'Priority', 'Status', 'Cost', 'Assigned', 'Actions'].map(h => (
                <span key={h} className="text-white/25 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="divide-y divide-white/[0.04]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_120px] gap-4 px-5 py-4 items-center animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-white/10 rounded w-3/4" />
                        <div className="h-2.5 bg-white/[0.06] rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-white/10 rounded w-4/5" />
                      <div className="h-2.5 bg-white/[0.06] rounded w-1/3" />
                    </div>
                    <div className="h-5 bg-white/10 rounded-full w-16" />
                    <div className="h-5 bg-white/10 rounded-full w-20" />
                    <div className="h-5 bg-white/10 rounded w-20" />
                    <div className="h-5 bg-white/10 rounded w-20" />
                    <div className="w-8 h-8 bg-white/10 rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <p className="text-white/30 text-sm font-medium">No active enquiries found</p>
                <p className="text-white/15 text-xs mt-1">
                  {filterStatus !== 'all'
                    ? `No "${filterStatus}" enquiries${search ? ' matching your search' : ''}`
                    : 'All enquiries have been resolved'}
                </p>
                {filterStatus !== 'all' && (
                  <button onClick={() => setFilter('all')} className="mt-3 text-teal-400 text-xs hover:text-teal-300 transition-colors">
                    Show all active
                  </button>
                )}
              </div>
            )}

            {/* Rows */}
            {!loading && filtered.map((enq, idx) => {
              const sc   = statusConfig[enq.status] || { label: enq.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
              const pc   = priorityConfig[enq.priority] || { label: enq.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
              const grad = avatarGradients[idx % avatarGradients.length];
              const isNew = enq.status === 'new';

              return (
                <div
                  key={enq.id}
                  className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_120px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 items-center group"
                >
                  {/* Sender */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative`}>
                      {enq.avatar}
                      {isNew && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-gray-900" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/85 text-sm font-medium truncate flex items-center gap-2">
                        {enq.name}
                        {isNew && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase">New</span>}
                      </p>
                      <p className="text-white/30 text-xs truncate">{enq.email}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="min-w-0 cursor-pointer" onClick={() => setSelectedId(enq.id)}>
                    <p className="text-white/70 text-sm truncate hover:text-teal-400 transition-colors">{enq.subject}</p>
                    <p className="text-white/25 text-xs mt-0.5">{enq.date} · {enq.time}</p>
                  </div>

                  {/* Priority */}
                  <div>
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                      {pc.label}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Cost */}
                  <div className="min-w-0">
                    {enq.actualCost > 0 ? (
                      <p className="text-emerald-400 text-sm font-semibold">₹{enq.actualCost.toLocaleString()}</p>
                    ) : enq.estimatedCost > 0 ? (
                      <p className="text-amber-400/70 text-xs">Est. ₹{enq.estimatedCost.toLocaleString()}</p>
                    ) : (
                      <p className="text-white/20 text-xs">—</p>
                    )}
                  </div>

                  {/* Assigned To */}
                  <div className="min-w-0">
                    {enq.assignedTo ? (
                      <span className="text-white/50 text-xs truncate">{enq.assignedTo}</span>
                    ) : (
                      <span className="text-white/20 text-xs italic">Unassigned</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setStatusModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-[11px] font-semibold transition-all"
                      title="Update Status"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setSelectedId(enq.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] text-white/40 hover:bg-white/[0.08] hover:text-white/70 transition-all"
                      title="View Details"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                <span className="text-white/25 text-xs">
                  Showing {filtered.length} of {enquiries.length} active enquiries
                  {filterStatus !== 'all' && ` · filtered by "${filterStatus}"`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModal && (
        <StatusUpdateModal
          enquiry={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default Telecaller;