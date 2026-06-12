import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../hooks/useToast';

const statusConfig = {
  new: { label: 'New', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  open: { label: 'Open', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  pending: { label: 'Pending', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  assigned: { label: 'Assigned', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'in-progress': { label: 'In Progress', bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  transferred: { label: 'Transferred', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  completed: { label: 'Completed', bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  'assign-to-team': { label: 'Assign to Team', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const auctionStatusConfig = {
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  live: { label: 'Live', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  upcoming: { label: 'Upcoming', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

const priorityConfig = {
  high: { label: 'High', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  low: { label: 'Low', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

const avatarGradients = [
  'from-indigo-400 to-violet-500', 'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500', 'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500', 'from-teal-400 to-cyan-500',
];

/**
 * Maps the auction-enquiry API shape to the normalised shape the UI consumes.
 *
 * Raw shape key fields:
 *  enquiryId, enquiryCode, assignedRa, user,
 *  auctionId, auctionStatus, winner, winningAmount, lastFiveBidders,
 *  createdAt, updatedAt, carDetails { make, model, year, registrationNumber, color, mileage }
 */
const normalizeEnquiry = (raw, idx) => {
  const ra = raw.assignedRa || null;
  const user = raw.user || null;
  const car = raw.carDetails || null;

  const vehicleLabel = car
    ? `${car.make?.split(' ')[0] ?? ''} ${car.model ?? ''}`.trim()
    : raw.enquiryCode ?? `Enquiry ${idx + 1}`;

  return {
    /* identity */
    id: raw.enquiryId ?? `idx-${idx}`,
    enquiryId: raw.enquiryId ?? `idx-${idx}`,
    enquiryCode: raw.enquiryCode ?? '—',

    /* display helpers */
    subject: vehicleLabel || raw.enquiryCode,
    avatar: car?.make?.[0]?.toUpperCase() ?? 'C',
    message: raw.description ?? '',
    additionalInfo: raw.additionalInfo ?? '',

    /* status / priority — derive sensible defaults from auction data */
    status: raw.status ?? (raw.auctionStatus === 'closed' ? 'closed' : 'new'),
    priority: raw.priority ?? 'medium',

    /* dates */
    date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : '—',
    time: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',

    /* assigned RA */
    assignedTo: ra ? `${ra.firstName} ${ra.lastName}` : null,
    assignedRa: ra,

    /* customer / user */
    user,
    name: user ? `${user.firstName} ${user.lastName}` : '—',
    email: user?.email ?? '—',
    phone: user?.phone ?? '—',

    /* vehicle */
    carDetails: car,

    /* auction */
    auctionId: raw.auctionId ?? null,
    auctionStatus: raw.auctionStatus ?? null,
    winner: raw.winner ?? null,
    winningAmount: raw.winningAmount ?? null,
    lastFiveBidders: raw.lastFiveBidders ?? [],

    /* financials */
    estimatedCost: raw.sellingDetails?.expectedPrice ?? 0,
    actualCost: raw.winningAmount ?? 0,

    /* misc */
    scheduleDate: raw.scheduleDate ?? null,
    scheduleTime: raw.scheduleTime ?? '',
    inspectionType: raw.inspectionType ?? '',
    sellingDetails: raw.sellingDetails ?? null,
    attachments: raw.attachments ?? [],
    notes: raw.notes ?? [],
    enquiryType: raw.enquiryType ?? '',
    severity: raw.severity ?? '',
    customerJourney: raw.customerJourney ?? null,

    _raw: raw,
  };
};

/* ─── Shared atoms ─────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-400 text-xs shrink-0 mr-3">{label}</span>
    <span className="text-gray-700 text-xs font-medium text-right">{value ?? '—'}</span>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3">{children}</p>
);

const StatusBadge = ({ status, config = statusConfig }) => {
  const s = config[status] || { label: status || 'Unknown', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentBg, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentBg}`}>{icon}</span>
      <span className="text-gray-400 text-xs font-medium">{sub}</span>
    </div>
    <p className="text-gray-900 text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-gray-400 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Status Update Modal ──────────────────────────────────────────────── */
const StatusUpdateModal = ({ enquiry, onClose, onUpdate }) => {
  const [newStatus, setNewStatus] = useState(enquiry.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try { await onUpdate(enquiry.id, newStatus, note); onClose(); }
    catch (err) { console.error('Status update failed', err); }
    finally { setLoading(false); }
  };

  const availableStatuses = [
    {
      key: 'accept-bid',
      label: 'Accept Bid'
    },
    {
      key: 'reauction-reject',
      label: 'Re-Auction Reject'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-gray-900 font-bold text-lg mb-1">Update Status</h3>
        <p className="text-gray-400 text-sm mb-4">Enquiry #{enquiry.enquiryCode}</p>
        <div className="space-y-3 mb-4">
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block">New Status</label>
          <div className="grid grid-cols-2 gap-3">
            {availableStatuses.map((s) => (
              <button
                key={s.key}
                onClick={() => setNewStatus(s.key)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${newStatus === s.key
                  ? s.key === 'accept-bid'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25'
                    : 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex flex-col items-center gap-1">
                  {s.key === 'accept-bid' ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Accept Bid</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Re-Auction Reject</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 mb-6">
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block">Note (Optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none h-20 placeholder:text-gray-300" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
          <button
            onClick={handleUpdate}
            disabled={loading || !newStatus}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
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

/* ─── Reschedule Modal ─────────────────────────────────────────────────── */
const RescheduleModal = ({ enquiry, onClose, onReschedule }) => {
  const [date, setDate] = useState(enquiry.scheduleDate ? enquiry.scheduleDate.slice(0, 10) : '');
  const [time, setTime] = useState(enquiry.scheduleTime || '');
  const [type, setType] = useState(enquiry.inspectionType || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try { await onReschedule(enquiry.id, { scheduleDate: date, scheduleTime: time, inspectionType: type }); onClose(); }
    catch (err) { console.error('Reschedule failed', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900 font-bold text-lg">Reschedule Inspection</h3>
            <p className="text-gray-400 text-sm">#{enquiry.enquiryCode}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100">
              <option value="">Select type…</option>
              <option value="Home Inspection">Home Inspection</option>
              <option value="Center Inspection">Center Inspection</option>
              <option value="Virtual Inspection">Virtual Inspection</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || !date}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Full Enquiry Detail Modal ────────────────────────────────────────── */
const EnquiryDetailModal = ({ enquiry, onClose, onReschedule, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showReschedule, setShowReschedule] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const pc = priorityConfig[enquiry.priority] || { label: enquiry.priority, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'customer', label: 'Customer' },
    { key: 'car', label: 'Vehicle' },
    { key: 'auction', label: 'Auction' },
  ];
  if (enquiry.attachments?.length > 0) tabs.push({ key: 'photos', label: `Photos (${enquiry.attachments.length})` });
  if (enquiry.notes?.length > 0) tabs.push({ key: 'notes', label: `Notes (${enquiry.notes.length})` });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl max-h-[92vh]" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-gray-400 text-xs font-mono">{enquiry.enquiryCode}</span>
                <StatusBadge status={enquiry.status} />
                {enquiry.auctionStatus && (
                  <StatusBadge status={enquiry.auctionStatus} config={auctionStatusConfig} />
                )}
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>{pc.label}</span>
              </div>
              <h2 className="text-gray-900 font-bold text-base leading-tight truncate">{enquiry.subject}</h2>
              <p className="text-gray-400 text-xs mt-0.5">{enquiry.date} at {enquiry.time}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* <button onClick={() => setShowReschedule(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Reschedule
              </button> */}
              <button onClick={() => setShowStatusUpdate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Update
              </button>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* RA Strip */}
          {enquiry.assignedRa && (
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {enquiry.assignedRa.firstName?.[0]}{enquiry.assignedRa.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs">
                  <span className="text-gray-400">Assigned RA: </span>
                  <span className="text-teal-600 font-semibold">{enquiry.assignedRa.firstName} {enquiry.assignedRa.lastName}</span>
                  <span className="text-gray-400"> · {enquiry.assignedRa.email}</span>
                </p>
              </div>
              {enquiry.winningAmount && (
                <div className="text-right shrink-0">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider">Winning Bid</p>
                  <p className="text-emerald-600 text-xs font-bold">₹{Number(enquiry.winningAmount).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-5 py-2.5 border-b border-gray-100 overflow-x-auto shrink-0">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.key ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <SectionLabel>Enquiry Info</SectionLabel>
                    <InfoRow label="Enquiry Code" value={enquiry.enquiryCode} />
                    <InfoRow label="Enquiry ID" value={enquiry.enquiryId} />
                    <InfoRow label="Status" value={enquiry.status} />
                    <InfoRow label="Auction Status" value={enquiry.auctionStatus ?? '—'} />
                    <InfoRow label="Auction ID" value={enquiry.auctionId ?? '—'} />
                    <InfoRow label="Created" value={`${enquiry.date} ${enquiry.time}`} />
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <SectionLabel>Financials</SectionLabel>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 border border-amber-100 mb-2">
                      <span className="text-gray-500 text-xs">Expected Price</span>
                      <span className="text-amber-600 font-bold text-sm">
                        {enquiry.estimatedCost > 0 ? `₹${Number(enquiry.estimatedCost).toLocaleString()}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <span className="text-gray-500 text-xs">Winning Bid</span>
                      <span className="text-emerald-600 font-bold text-sm">
                        {enquiry.winningAmount ? `₹${Number(enquiry.winningAmount).toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned RA details */}
                {enquiry.assignedRa && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <SectionLabel>Retail Associate</SectionLabel>
                    <InfoRow label="Name" value={`${enquiry.assignedRa.firstName} ${enquiry.assignedRa.lastName}`} />
                    <InfoRow label="Email" value={enquiry.assignedRa.email} />
                    <InfoRow label="Role" value={enquiry.assignedRa.role} />
                  </div>
                )}
              </div>
            )}

            {/* CUSTOMER */}
            {activeTab === 'customer' && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                {enquiry.user ? (
                  <>
                    <SectionLabel>Customer Details</SectionLabel>
                    <InfoRow label="Name" value={`${enquiry.user.firstName} ${enquiry.user.lastName}`} />
                    <InfoRow label="Email" value={enquiry.user.email} />
                    <InfoRow label="Phone" value={enquiry.user.phone} />
                    <InfoRow label="User ID" value={enquiry.user._id} />
                  </>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No customer details available</p>
                )}
              </div>
            )}

            {/* VEHICLE */}
            {activeTab === 'car' && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                {enquiry.carDetails ? (
                  <>
                    <SectionLabel>Vehicle Details</SectionLabel>
                    <InfoRow label="Make" value={enquiry.carDetails.make} />
                    <InfoRow label="Model" value={enquiry.carDetails.model} />
                    <InfoRow label="Year" value={enquiry.carDetails.year} />
                    <InfoRow label="Color" value={enquiry.carDetails.color} />
                    <InfoRow label="Registration No." value={enquiry.carDetails.registrationNumber || '—'} />
                    <InfoRow label="Mileage" value={enquiry.carDetails.mileage != null ? `${Number(enquiry.carDetails.mileage).toLocaleString()} km` : null} />
                  </>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No vehicle details available</p>
                )}
              </div>
            )}

            {/* AUCTION */}
            {activeTab === 'auction' && (
              <div className="space-y-4">
                {/* Auction summary */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <SectionLabel>Auction Summary</SectionLabel>
                  <InfoRow label="Auction ID" value={enquiry.auctionId ?? '—'} />
                  <InfoRow label="Auction Status" value={enquiry.auctionStatus ?? '—'} />
                  <InfoRow label="Winning Amount" value={enquiry.winningAmount ? `₹${Number(enquiry.winningAmount).toLocaleString()}` : '—'} />
                </div>

                {/* Winner card */}
                {enquiry.winner && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <SectionLabel>Winner</SectionLabel>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {enquiry.winner.firstName?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm font-semibold">{enquiry.winner.firstName} {enquiry.winner.lastName}</p>
                        <p className="text-gray-400 text-xs">{enquiry.winner.email}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-emerald-600 font-bold text-base">₹{Number(enquiry.winningAmount).toLocaleString()}</p>
                        <p className="text-gray-400 text-[10px]">Winning bid</p>
                      </div>
                    </div>
                    <InfoRow label="Phone" value={enquiry.winner.phone} />
                  </div>
                )}

                {/* Bid history */}
                {enquiry.lastFiveBidders?.length > 0 && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <SectionLabel>Last {enquiry.lastFiveBidders.length} Bids</SectionLabel>
                    <div className="space-y-2">
                      {enquiry.lastFiveBidders.map((b, i) => (
                        <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${i === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-gray-100'}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-gray-700 text-xs font-semibold truncate">{b.bidder?.firstName} {b.bidder?.lastName}</p>
                              <p className="text-gray-400 text-[10px] truncate">{b.bidder?.phone}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className={`text-sm font-bold ${i === 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                              ₹{Number(b.bidAmount).toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-[10px]">
                              {new Date(b.bidTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!enquiry.auctionId && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                    <p className="text-gray-400 text-sm py-4">No auction linked to this enquiry</p>
                  </div>
                )}
              </div>
            )}

            {/* PHOTOS */}
            {activeTab === 'photos' && (
              <div>
                {enquiry.attachments?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {enquiry.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 block">
                        <img src={att.url} alt={att.fileName || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-white text-[10px] truncate">{att.fileName}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : <p className="text-gray-400 text-sm text-center py-8">No attachments</p>}
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                {enquiry.notes?.length > 0 ? enquiry.notes.map((note, i) => (
                  <div key={i} className="border-l-2 border-amber-400 pl-4 py-1">
                    <p className="text-gray-400 text-[10px] mb-0.5">
                      {note.addedBy?.firstName} {note.addedBy?.lastName} · {note.addedAt ? new Date(note.addedAt).toLocaleString() : ''}
                    </p>
                    <p className="text-gray-700 text-sm">{note.text}</p>
                  </div>
                )) : <p className="text-gray-400 text-sm text-center py-8">No notes added</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50 rounded-b-2xl">
            <span className="text-gray-400 text-xs font-mono">{enquiry.enquiryCode}</span>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-semibold transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              Close
            </button>
          </div>
        </div>
      </div>

      {showReschedule && (
        <RescheduleModal enquiry={enquiry} onClose={() => setShowReschedule(false)}
          onReschedule={async (...args) => { await onReschedule(...args); setShowReschedule(false); }} />
      )}
      {showStatusUpdate && (
        <StatusUpdateModal enquiry={enquiry} onClose={() => setShowStatusUpdate(false)}
          onUpdate={async (...args) => { await onStatusUpdate(...args); setShowStatusUpdate(false); onClose(); }} />
      )}
    </>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const RaDashboard = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [detailModal, setDetailModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const toast = useToast();

  const token = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/RA/assigned`, {
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      /* API returns { success, count, data: [...] } */
      const rawList = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(rawList) ? rawList : [];
      setEnquiries(list.map(normalizeEnquiry));
    } catch (err) {
      console.error('fetchEnquiries error', err);
      toast.error?.('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnquiries(); }, []);
  const handleStatusUpdate = async (enquiryId, newStatus, note) => {
    try {
      let url = '';

      // decide API based on selected action
      if (newStatus === 'accept-bid') {
        url = `${import.meta.env.VITE_API_URL}/api/admin/auction/${enquiryId}/accept-bid`;
      } else if (newStatus === 'reauction-reject') {
        url = `${import.meta.env.VITE_API_URL}/api/admin/auction/${enquiryId}/reauction`;
      } else {
        toast.error?.('Invalid action selected');
        return;
      }

      const res = await axios.put(
        url,
        { note }, // optional note
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }
      );

      toast.success?.(
        res?.data?.message ||
        (newStatus === 'accept-bid'
          ? 'Bid accepted & car sold successfully'
          : 'Auction rejected and re-auction started')
      );

      // refresh table
      fetchEnquiries();
    } catch (err) {
      console.error('Status update error', err);

      toast.error?.(
        err?.response?.data?.message ||
        'Failed to update auction status'
      );

      throw err;
    }
  };

  const handleReschedule = async (enquiryId, { scheduleDate, scheduleTime, inspectionType }) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/schedule/${enquiryId}`,
        { scheduleDate, scheduleTime, inspectionType },
        { headers: { 'Content-Type': 'application/json', ...authHeader() } }
      );
      toast.success?.('Schedule updated successfully');
      fetchEnquiries();
    } catch (err) {
      console.error('Reschedule error', err);
      toast.error?.('Failed to update schedule');
      throw err;
    }
  };

  /* Counts — derive status from auctionStatus when raw status is absent */
  const statusOf = e => e.status;
  const counts = {
    all: enquiries.length,
    pending: enquiries.filter(e => statusOf(e) === 'pending').length,
    'assign-to-team': enquiries.filter(e => statusOf(e) === 'assign-to-team').length,
    new: enquiries.filter(e => statusOf(e) === 'new').length,
    open: enquiries.filter(e => statusOf(e) === 'open').length,
    assigned: enquiries.filter(e => statusOf(e) === 'assigned').length,
    transferred: enquiries.filter(e => statusOf(e) === 'transferred').length,
    'in-progress': enquiries.filter(e => statusOf(e) === 'in-progress').length,
    closed: enquiries.filter(e => statusOf(e) === 'closed').length,
  };

  const filtered = enquiries.filter(e => {
    const hay = `${e.subject} ${e.enquiryId} ${e.enquiryCode} ${e.assignedTo ?? ''} ${e.name} ${e.email} ${e.carDetails?.registrationNumber ?? ''}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || statusOf(e) === filterStatus;
    return matchSearch && matchStatus;
  });

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'open', label: 'Open' },
    { key: 'pending', label: 'Pending' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'assign-to-team', label: 'Assign to Team' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'transferred', label: 'Transferred' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 text-xl font-bold">RA Assigned Enquiries</h1>
        <p className="text-gray-400 text-sm mt-0.5">View and manage all enquiries assigned to Retail Associates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Assigned" value={counts.all} sub="All RAs" accentBg="bg-indigo-100"
          icon={<svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
        <StatCard label="Pending" value={counts.pending} sub="Awaiting" accentBg="bg-violet-100"
          icon={<svg className="w-4 h-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
        <StatCard label="Closed" value={counts.closed} sub="Auctioned" accentBg="bg-gray-100"
          icon={<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>} />
        <StatCard label="In Progress" value={counts['in-progress']} sub="Active" accentBg="bg-sky-100"
          icon={<svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterStatus === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search by vehicle, code, customer…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-gray-700 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all placeholder:text-gray-300" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1020px]">

            {/* Headers */}
            <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_1fr_160px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
              {['Vehicle / Code', 'Customer', 'Assigned RA', 'Auction', 'Status', 'Winning Bid', 'Actions'].map(h => (
                <span key={h} className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="divide-y divide-gray-50">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_1fr_160px] gap-4 px-5 py-4 items-center animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                      <div className="space-y-1.5 flex-1"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2.5 bg-gray-100 rounded w-1/2" /></div>
                    </div>
                    {[...Array(5)].map((__, j) => (
                      <div key={j} className="h-5 bg-gray-200 rounded w-24" />
                    ))}
                    <div className="flex gap-2"><div className="h-7 bg-gray-200 rounded-lg w-16" /><div className="h-7 bg-gray-200 rounded-lg w-14" /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">No enquiries found</p>
                {filterStatus !== 'all' && (
                  <button onClick={() => setFilter('all')} className="mt-3 text-teal-500 text-xs hover:text-teal-600 transition-colors">Show all</button>
                )}
              </div>
            )}

            {/* Rows */}
            {!loading && filtered.map((enq, idx) => {
              const sc = statusConfig[enq.status] || { label: enq.status || 'Unknown', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
              const asc = auctionStatusConfig[enq.auctionStatus] || null;
              const grad = avatarGradients[idx % avatarGradients.length];

              return (
                <div key={enq.id} className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_1fr_160px] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors duration-150 items-center">

                  {/* Vehicle / Code */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {enq.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-800 text-sm font-semibold truncate">{enq.subject}</p>
                      <p className="text-gray-400 text-xs truncate font-mono">{enq.enquiryCode}</p>
                      {enq.carDetails?.registrationNumber && (
                        <p className="text-gray-400 text-[10px] truncate">{enq.carDetails.year} · {enq.carDetails.registrationNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="min-w-0 cursor-pointer" onClick={() => setDetailModal(enq)}>
                    <p className="text-gray-700 text-sm font-medium truncate hover:text-teal-600 transition-colors">{enq.name}</p>
                    <p className="text-gray-400 text-xs truncate">{enq.email}</p>
                    <p className="text-gray-400 text-[10px] truncate">{enq.phone}</p>
                  </div>

                  {/* Assigned RA */}
                  <div className="min-w-0">
                    {enq.assignedRa ? (
                      <div>
                        <p className="text-teal-600 text-xs font-semibold truncate">{enq.assignedRa.firstName} {enq.assignedRa.lastName}</p>
                        <p className="text-gray-400 text-[10px] truncate">{enq.assignedRa.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs italic">Unassigned</span>
                    )}
                  </div>

                  {/* Auction status */}
                  <div>
                    {asc ? (
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${asc.bg} ${asc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${asc.dot}`} />
                        {asc.label}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </div>

                  {/* Enquiry status */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Winning bid */}
                  <div className="min-w-0">
                    {enq.winningAmount ? (
                      <div>
                        <p className="text-emerald-600 text-sm font-bold">₹{Number(enq.winningAmount).toLocaleString()}</p>
                        {enq.winner && (
                          <p className="text-gray-400 text-[10px] truncate">{enq.winner.firstName} {enq.winner.lastName}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-300 text-xs">—</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <button onClick={() => setDetailModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 text-[11px] font-semibold transition-all shadow-sm">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                    <button onClick={() => setStatusModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 text-[11px] font-semibold transition-all shadow-sm">
                      Update
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-gray-400 text-xs">
                  Showing {filtered.length} of {enquiries.length} enquiries
                  {filterStatus !== 'all' && ` · filtered by "${filterStatus}"`}
                </span>
                <button onClick={fetchEnquiries} className="text-gray-400 hover:text-gray-600 transition-colors text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                  </svg>
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {detailModal && (
        <EnquiryDetailModal
          enquiry={detailModal}
          onClose={() => setDetailModal(null)}
          onReschedule={handleReschedule}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
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

export default RaDashboard;