import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import EnquiryDetailPage from './Enquirydetailpage';
import { Factory } from 'lucide-react';

const statusConfig = {
  new: { label: 'New', bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open: { label: 'Open', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  pending: { label: 'Pending', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  'in-progress': { label: 'In Progress', bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-400' },
  completed: { label: 'Completed', bg: 'bg-teal-500/15', text: 'text-teal-400', dot: 'bg-teal-400' },
};

const priorityConfig = {
  high: { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  medium: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  low: { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500', 'from-teal-500 to-cyan-500',
];

const COMPLETED_STATUSES = new Set(['resolved', 'closed', 'completed']);

const normalizeEnquiry = (raw, idx) => ({
  id: raw._id || raw.id || `idx-${idx}`,
  name: [raw.userId?.firstName, raw.userId?.lastName].filter(Boolean).join(' ') || raw.customerName || 'Unknown',
  email: raw.userId?.email || 'N/A',
  phone: raw.contactNumber || raw.userId?.phone || '—',
  subject: raw.title || raw.description || 'No subject',
  message: raw.description || '',
  status: raw.status || 'new',
  priority: raw.priority || 'medium',
  ra_name: raw.assignedRa
    ? `${raw.assignedRa.firstName || ''} ${raw.assignedRa.lastName || ''}`.trim()
    : 'Unassigned',

  assignedRaId: raw.assignedRa?._id || '',

  date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : '—',
  avatar: `${raw.userId?.firstName?.[0] || 'U'}${raw.userId?.lastName?.[0] || ''}`.toUpperCase(),
  estimatedCost: raw.estimatedCost || 0,
  actualCost: raw.actualCost || 0,
  customerName: raw.customerName || '—',
  enquiryId: raw.enquiryId || raw._id || raw.id || `idx-${idx}`,
  auctionStarted: raw.auctionStarted || false,
});


/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
      <span className="indigo-500/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Pagination Component ───────────────────────────────────────────────── */
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page number array with ellipsis logic
  const getPageNumbers = () => {
    const delta = 1; // pages on each side of current
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) range.unshift('...');
    if (page + delta < pages - 1) range.push('...');

    range.unshift(1);
    if (pages > 1) range.push(pages);

    // dedupe
    let prev = null;
    for (const r of range) {
      if (r === prev) continue;
      rangeWithDots.push(r);
      prev = r;
    }
    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-5 py-3 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.01]">
      {/* Info */}
      <span className="indigo-500/25 text-xs order-2 sm:order-1">
        Showing <span className="indigo-500/45 font-medium">{from}–{to}</span> of{' '}
        <span className="indigo-500/45 font-medium">{total}</span> completed enquiries
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] indigo-500/40 hover:bg-white/[0.09] hover:indigo-500/70 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          title="Previous page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center indigo-500/20 text-xs select-none">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page
                ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30'
                : 'bg-white/[0.05] indigo-500/40 hover:bg-white/[0.09] hover:indigo-500/70'
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] indigo-500/40 hover:bg-white/[0.09] hover:indigo-500/70 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          title="Next page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ─── Start Auction Confirm Modal ────────────────────────────────────────── */
const StartAuctionModal = ({ enquiry, onClose, onConfirm, loading }) => {
  if (!enquiry) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center indigo-500/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-teal-500/15 flex items-center justify-center mb-4 mx-auto">
          <svg className="w-6 h-6 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>

        <h3 className="indigo-500 font-bold text-lg text-center mb-1">Start Auction</h3>
        <p className="indigo-500/40 text-sm text-center mb-1">
          You're about to start an auction for:
        </p>
        <p className="text-teal-400 text-sm font-semibold text-center mb-5 truncate px-2">
          {enquiry.subject}
        </p>

        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 mb-5 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="indigo-500/35">Enquiry ID</span>
            <span className="indigo-500/60 font-medium">#{enquiry.enquiryId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="indigo-500/35">Customer</span>
            <span className="indigo-500/60 font-medium">{enquiry.name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="indigo-500/35">Status</span>
            <span className="text-teal-400 font-medium capitalize">{enquiry.status}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="indigo-500/35">RA Name</span>
            <span className="indigo-500/60 font-medium">{enquiry.ra_name}</span>
          </div>
        </div>

        <p className="indigo-500/25 text-xs text-center mb-5">
          This action will notify all eligible bidders. It cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] indigo-500/60 text-sm font-semibold hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 indigo-500 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Auction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const TABLE_GRID ="grid-cols-[120px_240px_220px_110px_120px_180px_180px]";
/* ─── Main Component ─────────────────────────────────────────────────────── */
const EnquiriesDetails = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [auctionModal, setAuctionModal] = useState(null);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [raList, setRaList] = useState([]);
  const [auctionStarted, setAuctionStarted] = useState(new Set());

  // ── Pagination state ──────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  const toast = useToast();

  const token = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  const assignRA = async (enquiryId, raId) => {
    try {
      console.log("Assigning RA:", { enquiryId, raId });

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL
        }/api/admin/RA/${enquiryId}/${raId}`,
        {},
        {
          headers: {
            "Content-Type":
              "application/json",
            ...authHeader(),
          },
        }
      );

      console.log(
        "RA Assigned:",
        res.data
      );

      // Update UI instantly
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === enquiryId
            ? {
              ...item,
              assignedRaId: raId,
            }
            : item
        )
      );

      toast.success?.(
        "RA assigned successfully"
      );

      // Optional refresh from API
      fetchEnquiries(
        pagination.page
      );
    } catch (error) {
      console.error(
        "Assign RA Error:",
        error
      );

      toast.error?.(
        error?.response?.data
          ?.message ||
        "Failed to assign RA"
      );
    }
  };
  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const fetchEnquiries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/completed`,
        {
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          // Pass page + limit as query params; adjust param names to match your API
          params: {
            page,
            limit: pagination.limit,
            ...(filterStatus !== 'all' && { status: filterStatus }),
            ...(search && { search }),
          },
        }
      );


      const rawList = res.data?.data ?? res.data ?? [];
      const rawPagination = res.data?.pagination ?? null;

      const list = Array.isArray(rawList) ? rawList : [];

      // If the API doesn't filter server-side by completed statuses, keep client guard
      const completed = rawPagination
        ? list                                              // trust server filtering
        : list.filter(r => COMPLETED_STATUSES.has(r.status));

      setEnquiries(completed.map(normalizeEnquiry));

      if (rawPagination) {
        setPagination(rawPagination);
      }
    } catch (err) {
      console.error('fetchEnquiries error', err);
      toast.error?.('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, pagination.limit]);

  // Re-fetch when filter or search changes — reset to page 1
  useEffect(() => {
    fetchEnquiries(1);
  }, [filterStatus, search]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchEnquiries(newPage);
    // Scroll table back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Start Auction ──────────────────────────────────────────────────────── */
  const handleStartAuction = async () => {
    if (!auctionModal) return;
    setAuctionLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${auctionModal.id}/start-auction`,
        {},
        { headers: { 'Content-Type': 'application/json', ...authHeader() } }
      );
      setAuctionStarted(prev => new Set([...prev, auctionModal.id]));
      toast.success?.('Auction started successfully!');
      setAuctionModal(null);
    } catch (err) {
      console.error('Start auction error', err);
      const msg = err.response?.data?.message || 'Failed to start auction';
      toast.error?.(msg);
    } finally {
      setAuctionLoading(false);
    }
  };
  const fetchAllRAs = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/ra`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }
      );

      setRaList(res.data?.data || []);
    } catch (err) {
      console.error('RA fetch error:', err);
      toast.error?.('Failed to fetch RAs');
    }
  };
  useEffect(() => {
    fetchAllRAs();
  }, []);
  /* ── Counts (use pagination.total for "all" so it reflects server count) ── */
  const counts = {
    all: pagination.total,
    resolved: enquiries.filter(e => e.status === 'resolved').length,
    closed: enquiries.filter(e => e.status === 'closed').length,
    completed: enquiries.filter(e => e.status === 'completed').length,
  };

  /* ── Client-side filter (only for current page rows) ─────────────────────
     Note: if your API accepts search/status params (recommended), the
     server handles filtering and `filtered` === `enquiries` here.          */
  const filtered = enquiries.filter(e => {
    const hay = `${e.name} ${e.subject} ${e.id} ${e.email} ${e.enquiryId}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filterTabs = [
    { key: 'all', label: 'All Completed' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
    { key: 'completed', label: 'Completed' },
  ];

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
        <h1 className="indigo-500 text-xl font-bold">Completed Enquiries</h1>
        <p className="indigo-500/35 text-sm mt-0.5">All resolved, closed and completed enquiries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Completed" value={counts.all} sub="All time" accent="bg-teal-500"
          icon={<svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>} />
        <StatCard label="Resolved" value={counts.resolved} sub="Fixed" accent="bg-emerald-500"
          icon={<svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
        <StatCard label="Closed" value={counts.closed} sub="Archived" accent="bg-gray-500"
          icon={<svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>} />
        <StatCard label="Completed" value={counts.completed} sub="Done" accent="bg-indigo-500"
          icon={<svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>} />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-max">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterStatus === tab.key ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30' : 'indigo-500/35 hover:indigo-500/60'
                  }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20 indigo-500' : 'bg-white/[0.08] indigo-500/40'}`}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" placeholder="Search enquiries…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border indigo-500 rounded-xl pl-9 pr-4 py-2 indigo-500/70 text-sm indigo-500 outline-none focus:border-teal-500/50 focus:bg-white/[0.06] transition-all duration-200"
          />
        </div>
      </div>

      {/* Table */}
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <div className="min-w-[1320px]">

      {/* Header */}
      <div
        className={`grid ${TABLE_GRID} gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200`}
      >
        {[
          "Enquiry ID",
          "Sender",
          "Subject",
          "Priority",
          "Status",
          
          "RA",
          "Actions",
        ].map((h) => (
          <div
            key={h}
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="divide-y divide-slate-100">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`grid ${TABLE_GRID} gap-4 px-4 py-3 items-center animate-pulse`}
            >
              <div className="h-4 bg-slate-200 rounded w-20" />

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-32" />
                  <div className="h-2 bg-slate-100 rounded w-24" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-40" />
                <div className="h-2 bg-slate-100 rounded w-24" />
              </div>

              <div className="h-6 bg-slate-200 rounded-full w-20" />
              <div className="h-6 bg-slate-200 rounded-full w-24" />
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="h-10 bg-slate-200 rounded-lg w-full" />
              <div className="h-8 bg-slate-200 rounded-lg w-28" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm font-medium text-slate-600">
            No completed enquiries found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {filterStatus !== "all"
              ? `No "${filterStatus}" enquiries found`
              : "No completed enquiries yet"}
          </p>
        </div>
      )}

      {/* Rows */}
      {!loading &&
        filtered.map((enq, idx) => {
          const sc = statusConfig[enq.status] || {
            label: enq.status,
            bg: "bg-gray-100",
            text: "text-gray-600",
            dot: "bg-gray-500",
          };

          const pc = priorityConfig[enq.priority] || {
            label: enq.priority,
            bg: "bg-gray-100",
            text: "text-gray-600",
            border: "border-gray-200",
          };

          const grad =
            avatarGradients[idx % avatarGradients.length];

          const hasAuctionStarted =
            auctionStarted.has(enq.id) ||
            enq.auctionStarted;

          return (
            <div
              key={enq.id}
              className={`grid ${TABLE_GRID} gap-4 px-4 py-3 items-center border-b border-slate-100 hover:bg-slate-50 transition-colors`}
            >
              {/* Enquiry ID */}
              <div
                className="cursor-pointer"
                onClick={() => setSelectedId(enq.id)}
              >
                <p className="font-semibold text-sm text-slate-800">
                  {enq.enquiryId}
                </p>
              </div>

              {/* Sender */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {enq.avatar}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {enq.name || enq.customerName}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {enq.email}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div
                className="cursor-pointer min-w-0"
                onClick={() => setSelectedId(enq.id)}
              >
                <p className="truncate text-sm text-slate-700 hover:text-indigo-600">
                  {enq.subject}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {enq.date}
                </p>
              </div>

              {/* Priority */}
              <div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${pc.bg} ${pc.text} ${pc.border}`}
                >
                  {pc.label}
                </span>
              </div>

              {/* Status */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${sc.bg} ${sc.text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                  />

                  {sc.label}
                </span>
              </div>

              

              {/* RA */}
              <div>
                <select
                  value={enq.assignedRaId || ""}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  onChange={(e) =>
                    assignRA(enq.id, e.target.value)
                  }
                >
                  <option value="">Unassigned</option>

                  {raList.map((ra) => (
                    <option key={ra._id} value={ra._id}>
                      {ra.firstName} {ra.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                {hasAuctionStarted ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
                    Auction Live
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAuctionModal(enq);
                    }}
                    className="rounded-lg bg-teal-50 px-3 py-2 text-[11px] font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    Start Auction
                  </button>
                )}

                <button
                  onClick={() => setSelectedId(enq.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                >
                  👁
                </button>
              </div>
            </div>
          );
        })}

      {!loading && filtered.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  </div>
</div>

      {/* Start Auction Modal */}
      <StartAuctionModal
        enquiry={auctionModal}
        onClose={() => !auctionLoading && setAuctionModal(null)}
        onConfirm={handleStartAuction}
        loading={auctionLoading}
      />
    </div>
  );
};

export default EnquiriesDetails;