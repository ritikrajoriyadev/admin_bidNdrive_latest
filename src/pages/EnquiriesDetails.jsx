import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import EnquiryDetailPage from './Enquirydetailpage';

const statusConfig = {
  new:         { label: 'New',         bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open:        { label: 'Open',        bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  pending:     { label: 'Pending',     bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned:    { label: 'Assigned',    bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  resolved:    { label: 'Resolved',    bg: 'bg-emerald-500/15',text: 'text-emerald-400',dot: 'bg-emerald-400'},
  closed:      { label: 'Closed',      bg: 'bg-gray-500/15',   text: 'text-gray-400',   dot: 'bg-gray-400'   },
  'in-progress':{ label: 'In Progress',bg: 'bg-sky-500/15',   text: 'text-sky-400',    dot: 'bg-sky-400'    },
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

/* ─── Completed statuses ──────────────────────────────────────────────────── */
const COMPLETED_STATUSES = new Set(['resolved', 'closed', 'completed']);

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
  avatar:        `${raw.userId?.firstName?.[0] || 'U'}${raw.userId?.lastName?.[0] || ''}`.toUpperCase(),
  estimatedCost: raw.estimatedCost || 0,
  actualCost:    raw.actualCost || 0,
  enquiryId:     raw.enquiryId || raw._id || raw.id || `idx-${idx}`,
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

/* ─── Main Component ─────────────────────────────────────────────────────── */
const EnquiriesDetails = () => {
  const [enquiries,    setEnquiries]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilter]       = useState('all');
  /* Instead of a drawer, navigate to a detail page */
  const [selectedId,   setSelectedId]   = useState(null);
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

      /* ── FILTER: keep only completed enquiries ── */
      const completed = list.filter(r => COMPLETED_STATUSES.has(r.status));
      setEnquiries(completed.map(normalizeEnquiry));
    } catch (err) {
      console.error('fetchEnquiries error', err);
      toast.error?.('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnquiries(); }, []);

  /* ── Counts ─────────────────────────────────────────────────────────────── */
  const counts = {
    all:      enquiries.length,
    resolved: enquiries.filter(e => e.status === 'resolved').length,
    closed:   enquiries.filter(e => e.status === 'closed').length,
    completed:enquiries.filter(e => e.status === 'completed').length,
  };

  /* ── Filtered list ───────────────────────────────────────────────────────── */
  const filtered = enquiries.filter(e => {
    const hay         = `${e.name} ${e.subject} ${e.id} ${e.email} ${e.enquiryId}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filterTabs = [
    { key: 'all',       label: 'All Completed' },
    { key: 'resolved',  label: 'Resolved'      },
    { key: 'closed',    label: 'Closed'         },
    { key: 'completed', label: 'Completed'      },
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
        <h1 className="text-white text-xl font-bold">Completed Enquiries</h1>
        <p className="text-white/35 text-sm mt-0.5">All resolved, closed and completed enquiries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Completed" value={counts.all}       sub="All time" accent="bg-teal-500"
          icon={<svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>} />
        <StatCard label="Resolved"        value={counts.resolved}  sub="Fixed"    accent="bg-emerald-500"
          icon={<svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
        <StatCard label="Closed"          value={counts.closed}    sub="Archived" accent="bg-gray-500"
          icon={<svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>} />
        <StatCard label="Completed"       value={counts.completed} sub="Done"     accent="bg-indigo-500"
          icon={<svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
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
          <div className="min-w-[700px]">
            {/* Headers */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              {['Sender', 'Subject', 'Priority', 'Status', 'Cost', 'Action'].map(h => (
                <span key={h} className="text-white/25 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="divide-y divide-white/[0.04]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-4 items-center animate-pulse">
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm font-medium">No completed enquiries found</p>
                <p className="text-white/15 text-xs mt-1">
                  {filterStatus !== 'all'
                    ? `No "${filterStatus}" enquiries${search ? ' matching your search' : ''}`
                    : 'No completed enquiries yet'}
                </p>
                {filterStatus !== 'all' && (
                  <button onClick={() => setFilter('all')} className="mt-3 text-teal-400 text-xs hover:text-teal-300 transition-colors">
                    Show all completed
                  </button>
                )}
              </div>
            )}

            {/* Rows */}
            {!loading && filtered.map((enq, idx) => {
              const sc   = statusConfig[enq.status] || { label: enq.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
              const pc   = priorityConfig[enq.priority] || { label: enq.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
              const grad = avatarGradients[idx % avatarGradients.length];

              return (
                <div
                  key={enq.id}
                  onClick={() => setSelectedId(enq.id)}
                  className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 cursor-pointer items-center group"
                >
                  {/* Sender */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {enq.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/85 text-sm font-medium truncate">{enq.name}</p>
                      <p className="text-white/30 text-xs truncate">{enq.email}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="min-w-0">
                    <p className="text-white/70 text-sm truncate">{enq.subject}</p>
                    <p className="text-white/25 text-xs mt-0.5">{enq.date}</p>
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

                  {/* View button */}
                  <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedId(enq.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-xs font-semibold transition-all group-hover:bg-teal-500/15"
                      title="View Full Details"
                    >
                      View
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
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
                  Showing {filtered.length} of {enquiries.length} completed enquiries
                  {filterStatus !== 'all' && ` · filtered by "${filterStatus}"`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiriesDetails;