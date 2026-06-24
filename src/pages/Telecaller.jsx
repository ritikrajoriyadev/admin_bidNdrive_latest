import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import EnquiryDetailPage from './Enquirydetailpage';
import RCVerification from './RCVerification';

/* ─── Config Maps ─────────────────────────────────────────────────────────── */
const statusConfig = {
  new: { label: 'New', bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open: { label: 'Open', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  pending: { label: 'Pending', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  'in-progress': { label: 'In Progress', bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-400' },
  transferred: { label: 'Transferred', bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  completed: { label: 'Completed', bg: 'bg-teal-500/15', text: 'text-teal-400', dot: 'bg-teal-400' },
};

const priorityConfig = {
  high: { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  medium: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  low: { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const severityConfig = {
  critical: { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  low: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500', 'from-teal-500 to-cyan-500',
];

const ACTIVE_STATUSES = ['new', 'open', 'pending', 'assigned', 'in-progress', 'transferred'];

/* ─── Normalise API Response ──────────────────────────────────────────────── */
const normalizeEnquiry = (raw, idx) => {
  // Support both userId-based and admin-created (userId: null) enquiries
  const firstName = raw.userId?.firstName || raw.customerName?.split(' ')[0] || 'Unknown';
  const lastName = raw.userId?.lastName || raw.customerName?.split(' ').slice(1).join(' ') || '';

  return {
    id: raw._id || raw.id || `idx-${idx}`,
    name: [raw.userId?.firstName, raw.userId?.lastName].filter(Boolean).join(' ')
      || raw.customerName || 'Unknown',
    email: raw.userId?.email || raw.customerEmail || '',
    phone: raw.contactNumber || raw.userId?.phone || '—',
    subject: raw.title || raw.description || 'No subject',
    message: raw.description || '',
    status: raw.status || 'new',
    priority: raw.priority || 'medium',
    severity: raw.severity || '',
    date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : '—',
    time: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    avatar: `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`.toUpperCase(),
    estimatedCost: raw.estimatedCost || 0,
    actualCost: raw.actualCost || 0,
    enquiryId: raw.enquiryId || raw._id || raw.id || `idx-${idx}`,
    assignedTo: raw.assignedTo?.name || raw.assignedTo || null,
    assignedRa: raw.assignedRa || null,
    scheduleDate: raw.scheduleDate || null,
    scheduleTime: raw.scheduleTime || '',
    inspectionType: raw.inspectionType || '',
    enquiryType: raw.enquiryType || '',
    additionalInfo: raw.additionalInfo || '',
    createdByAdmin: raw.createdByAdmin || false,
    carDetails: raw.carDetails || null,
    sellingDetails: raw.sellingDetails || null,
    soldDetails: raw.soldDetails || null,
    attachments: raw.attachments || [],
    notes: raw.notes || [],
    customerJourney: raw.customerJourney
      ? {
        currentStep: raw.customerJourney.currentStep,
        timeline: (raw.customerJourney.timeline || []).map(step => ({
          ...step,
          timestamp: step.timestamp || step.createdAt,
        })),
      }
      : null,
    _raw: raw,
  };
};

/* ─── Shared Atoms ────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-black/[0.04] last:border-0 gap-3">
    <span className="text-gray-400 text-xs shrink-0 min-w-[110px]">{label}</span>
    <span className={`text-xs font-medium text-right break-all ${highlight ? 'text-indigo-600' : 'text-gray-700'}`}>
      {value ?? '—'}
    </span>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3">{children}</p>
);

const StatusBadge = ({ status }) => {
  const s = statusConfig[status] || { label: status || 'Unknown', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const Tag = ({ children, color = 'gray' }) => {
  const map = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, sub }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group`}>
    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${accentClass}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentClass} bg-opacity-10`}>{icon}</span>
      <span className="text-gray-400 text-[10px] font-medium tracking-wide uppercase">{sub}</span>
    </div>
    <p className="text-gray-800 text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-gray-400 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── RC Info Card ────────────────────────────────────────────────────────── */
const RCInfoCard = ({ additionalInfo }) => {
  if (!additionalInfo) return null;

  // Parse key: value lines
  const lines = additionalInfo.split('\n').map(l => l.trim()).filter(Boolean);
  const pairs = lines.map(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return null;
    return { key: line.slice(0, colonIdx).trim(), val: line.slice(colonIdx + 1).trim() };
  }).filter(Boolean);

  if (pairs.length === 0) return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <SectionLabel>Additional Info</SectionLabel>
      <p className="text-gray-600 text-xs whitespace-pre-wrap">{additionalInfo}</p>
    </div>
  );

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <SectionLabel>RC / Registration Details</SectionLabel>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {pairs.map(({ key, val }, i) => (
          <div key={i} className="flex justify-between items-start py-2 border-b border-indigo-100/60 last:border-0 gap-2">
            <span className="text-indigo-400 text-[10px] font-semibold uppercase tracking-wide shrink-0">{key}</span>
            <span className={`text-xs font-medium text-right ${val === 'ACTIVE' || val === 'Clear' ? 'text-emerald-600' :
                val === '—' || val === '' ? 'text-gray-300' :
                  'text-indigo-700'
              }`}>{val || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Status Update Modal ─────────────────────────────────────────────────── */
const StatusUpdateModal = ({ enquiry, onClose, onUpdate }) => {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const availableStatuses = [
    { key: 'assign-to-team', label: 'Assign To Team', icon: '👥', desc: 'Hand off to field team' },
    { key: 'closed', label: 'Close Enquiry', icon: '✓', desc: 'Mark as resolved' },
  ];

  const handleUpdate = async () => {
    if (!newStatus) return;
    setLoading(true);
    try { await onUpdate(enquiry.id, newStatus, note); onClose(); }
    catch (err) { console.error('Status update failed', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-800 font-bold text-base">Update Status</h3>
            <p className="text-gray-400 text-xs">#{enquiry.enquiryId}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block">Choose Action</label>
          {availableStatuses.map(s => (
            <button key={s.key} onClick={() => setNewStatus(s.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border-2 transition-all ${newStatus === s.key
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}>
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${newStatus === s.key ? 'text-teal-700' : 'text-gray-700'}`}>{s.label}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
              {newStatus === s.key && (
                <svg className="w-4 h-4 text-teal-500 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 mb-5">
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block">Note (Optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add context or remarks…"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 text-sm outline-none focus:border-teal-400 focus:bg-white resize-none h-20 transition-colors" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={loading || !newStatus}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : 'Confirm Update'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Reschedule Modal ────────────────────────────────────────────────────── */
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-800 font-bold text-base">Reschedule Inspection</h3>
              <p className="text-gray-400 text-xs">#{enquiry.enquiryId}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['home', 'center', 'virtual'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border-2 transition-all ${type === t || type?.toLowerCase() === t
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || !date}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : 'Save Schedule'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Full Enquiry Detail Modal ───────────────────────────────────────────── */
const EnquiryDetailModal = ({ enquiry, onClose, onReschedule, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showReschedule, setShowReschedule] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const sc = statusConfig[enquiry.status] || { label: enquiry.status, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
  const pc = priorityConfig[enquiry.priority] || { label: enquiry.priority, bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
  const sv = severityConfig[enquiry.severity] || null;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '◈' },
    { key: 'vehicle', label: 'Vehicle', icon: '🚗' },
    { key: 'selling', label: 'Selling', icon: '₹' },
    { key: 'journey', label: 'Journey', icon: '⟳' },
  ];
  if (enquiry.additionalInfo) tabs.push({ key: 'rc', label: 'RC Info', icon: '🪪' });
  if (enquiry.attachments?.length > 0) tabs.push({ key: 'photos', label: `Photos (${enquiry.attachments.length})`, icon: '📷' });
  if (enquiry.notes?.length > 0) tabs.push({ key: 'notes', label: `Notes (${enquiry.notes.length})`, icon: '📝' });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl max-h-[94vh] border border-gray-100" onClick={e => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-gray-400 text-[10px] font-mono bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                  {enquiry.enquiryId}
                </span>
                {enquiry.createdByAdmin && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100">
                    Admin Created
                  </span>
                )}
                <StatusBadge status={enquiry.status} />
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                  {pc.label} Priority
                </span>
                {sv && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${sv.bg} ${sv.color}`}>
                    {sv.label} Severity
                  </span>
                )}
              </div>
              <h2 className="text-gray-800 font-bold text-base leading-snug line-clamp-2">{enquiry.subject}</h2>
              <p className="text-gray-400 text-xs mt-0.5">{enquiry.date} at {enquiry.time}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setShowReschedule(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Reschedule
              </button>
              <button onClick={() => setShowStatusUpdate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 hover:bg-teal-100 text-xs font-semibold transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Update
              </button>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* ── Customer Strip ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {enquiry.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-800 text-sm font-semibold">{enquiry.name}</p>
                {enquiry.enquiryType && <Tag color="indigo">{enquiry.enquiryType}</Tag>}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {enquiry.email && <p className="text-gray-400 text-xs">{enquiry.email}</p>}
                {enquiry.email && enquiry.phone !== '—' && <span className="text-gray-300 text-xs">·</span>}
                {enquiry.phone !== '—' && <p className="text-gray-400 text-xs">{enquiry.phone}</p>}
              </div>
            </div>
            {enquiry.scheduleDate && (
              <div className="text-right shrink-0 bg-indigo-50 rounded-xl px-3 py-2 border border-indigo-100">
                <p className="text-indigo-400 text-[9px] uppercase tracking-widest font-bold">Scheduled</p>
                <p className="text-indigo-600 text-xs font-bold">
                  {new Date(enquiry.scheduleDate).toLocaleDateString()}
                </p>
                {enquiry.scheduleTime && (
                  <p className="text-indigo-400 text-[10px]">{enquiry.scheduleTime}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-0.5 px-4 py-2.5 border-b border-gray-100 overflow-x-auto shrink-0 scrollbar-hide">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.key
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}>
                <span className="text-[13px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Enquiry Info */}
                  <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                    <SectionLabel>Enquiry Info</SectionLabel>
                    <InfoRow label="Enquiry ID" value={enquiry.enquiryId} highlight />
                    <InfoRow label="Type" value={enquiry.enquiryType} />
                    <InfoRow label="Severity" value={enquiry.severity} />
                    <InfoRow label="Inspection" value={enquiry.inspectionType || '—'} />
                    <InfoRow label="Assigned To" value={enquiry.assignedTo || 'Unassigned'} />
                    <InfoRow label="Created By" value={enquiry.createdByAdmin ? 'Admin' : 'Customer'} />
                    <InfoRow label="Created" value={`${enquiry.date} ${enquiry.time}`} />
                  </div>

                  {/* Cost + Schedule */}
                  <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                    <SectionLabel>Cost</SectionLabel>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wide mb-1">Estimated</p>
                        <p className="text-amber-600 font-bold text-sm">
                          {enquiry.estimatedCost > 0 ? `₹${enquiry.estimatedCost.toLocaleString()}` : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wide mb-1">Actual</p>
                        <p className="text-emerald-600 font-bold text-sm">
                          {enquiry.actualCost > 0 ? `₹${enquiry.actualCost.toLocaleString()}` : '—'}
                        </p>
                      </div>
                    </div>
                    {enquiry.scheduleDate && (
                      <>
                        <SectionLabel>Schedule</SectionLabel>
                        <InfoRow label="Date" value={new Date(enquiry.scheduleDate).toLocaleDateString()} />
                        <InfoRow label="Time" value={enquiry.scheduleTime || '—'} />
                        <InfoRow label="Type" value={enquiry.inspectionType || '—'} />
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {enquiry.message && (
                  <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                    <SectionLabel>Description</SectionLabel>
                    <p className="text-gray-600 text-sm leading-relaxed">{enquiry.message}</p>
                  </div>
                )}
              </>
            )}

            {/* VEHICLE */}
            {activeTab === 'vehicle' && (
              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                {enquiry.carDetails ? (
                  <>
                    {/* Vehicle Header Card */}
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-4 mb-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🚗</div>
                        <div>
                          <p className="font-bold text-lg leading-tight">
                            {enquiry.carDetails.make || '—'}
                          </p>
                          <p className="text-blue-100 text-sm">{enquiry.carDetails.model || '—'}</p>
                          {enquiry.carDetails.registrationNumber && (
                            <span className="inline-block mt-1 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md tracking-widest">
                              {enquiry.carDetails.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Year', value: enquiry.carDetails.year, icon: '📅' },
                        { label: 'Color', value: enquiry.carDetails.color, icon: '🎨' },
                        { label: 'Mileage', value: enquiry.carDetails.mileage != null ? `${Number(enquiry.carDetails.mileage).toLocaleString()} km` : null, icon: '📍' },
                        { label: 'Reg. Number', value: enquiry.carDetails.registrationNumber, icon: '🪪' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wide font-bold mb-1">{icon} {label}</p>
                          <p className="text-gray-700 text-sm font-semibold">{value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-2">🚗</span>
                    <p className="text-gray-400 text-sm">No vehicle details available</p>
                  </div>
                )}
              </div>
            )}

            {/* SELLING */}
            {activeTab === 'selling' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                  {enquiry.sellingDetails ? (
                    <>
                      <SectionLabel>Selling Details</SectionLabel>

                      {enquiry.sellingDetails.expectedPrice && (
                        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 mb-4">
                          <p className="text-emerald-500 text-xs font-bold uppercase tracking-wide mb-1">Expected Price</p>
                          <p className="text-emerald-700 text-2xl font-bold">
                            ₹{Number(enquiry.sellingDetails.expectedPrice).toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {[
                          { label: 'City', value: enquiry.sellingDetails.city },
                          { label: 'Fuel Type', value: enquiry.sellingDetails.fuelType },
                          { label: 'Transmission', value: enquiry.sellingDetails.transmission },
                          { label: 'Ownership', value: enquiry.sellingDetails.ownership },
                          { label: 'KM Driven', value: enquiry.sellingDetails.kilometersDriven != null ? `${Number(enquiry.sellingDetails.kilometersDriven).toLocaleString()} km` : null },
                          { label: 'Accident Hist.', value: enquiry.sellingDetails.accidentHistory },
                        ].map(({ label, value }) => (
                          value ? (
                            <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                              <p className="text-gray-400 text-[10px] uppercase tracking-wide font-bold mb-1">{label}</p>
                              <p className="text-gray-700 text-xs font-semibold capitalize">{value}</p>
                            </div>
                          ) : null
                        ))}
                      </div>

                      <div className={`rounded-lg px-3 py-2.5 border flex items-center gap-2 ${enquiry.sellingDetails.serviceHistoryAvailable
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-gray-50 border-gray-100'
                        }`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${enquiry.sellingDetails.serviceHistoryAvailable ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                          {enquiry.sellingDetails.serviceHistoryAvailable ? '✓' : '✕'}
                        </span>
                        <span className={`text-xs font-semibold ${enquiry.sellingDetails.serviceHistoryAvailable ? 'text-emerald-700' : 'text-gray-500'
                          }`}>
                          Service History {enquiry.sellingDetails.serviceHistoryAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="text-4xl mb-2">₹</span>
                      <p className="text-gray-400 text-sm">No selling details available</p>
                    </div>
                  )}
                </div>

                {/* Sold Details */}
                {enquiry.soldDetails?.soldAmount && (
                  <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 p-4">
                    <SectionLabel>Sold Details</SectionLabel>
                    <InfoRow label="Sold Amount" value={`₹${Number(enquiry.soldDetails.soldAmount).toLocaleString()}`} highlight />
                    <InfoRow label="Sold At" value={enquiry.soldDetails.soldAt ? new Date(enquiry.soldDetails.soldAt).toLocaleString() : '—'} />
                  </div>
                )}
              </div>
            )}

            {/* JOURNEY */}
            {activeTab === 'journey' && (
              <div className="space-y-4">
                {/* Current Step */}
                {enquiry.customerJourney?.currentStep && (
                  <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4">
                    <SectionLabel>Current Step</SectionLabel>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-indigo-700 font-semibold text-sm capitalize">
                        {enquiry.customerJourney.currentStep}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                  <SectionLabel>Timeline</SectionLabel>
                  {enquiry.customerJourney?.timeline?.length > 0 ? (
                    <div className="relative pl-5">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-100" />
                      {enquiry.customerJourney.timeline.map((step, i) => (
                        <div key={i} className="relative mb-5 last:mb-0">
                          <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-white shadow-sm" />
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <p className="text-gray-700 text-xs font-bold capitalize mb-0.5">
                              {step.step || step.status || '—'}
                            </p>
                            {step.description && (
                              <p className="text-gray-500 text-xs">{step.description}</p>
                            )}
                            {step.timestamp && (
                              <p className="text-gray-400 text-[10px] mt-1">
                                {new Date(step.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-3xl">⟳</span>
                      <p className="text-gray-400 text-sm mt-2">No timeline events yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RC INFO */}
            {activeTab === 'rc' && (
              <RCInfoCard additionalInfo={enquiry.additionalInfo} />
            )}

            {/* PHOTOS */}
            {activeTab === 'photos' && (
              enquiry.attachments?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {enquiry.attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 block shadow-sm">
                      <img src={att.url} alt={att.fileName || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-[10px] truncate">{att.fileName}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-4xl">📷</span>
                  <p className="text-gray-400 text-sm mt-2">No attachments</p>
                </div>
              )
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                {enquiry.notes?.length > 0 ? enquiry.notes.map((note, i) => (
                  <div key={i} className="border-l-2 border-amber-300 pl-4 py-2 bg-amber-50/50 rounded-r-xl">
                    <p className="text-gray-400 text-[10px] mb-1">
                      {note.addedBy?.firstName} {note.addedBy?.lastName}
                      {note.addedAt && ` · ${new Date(note.addedAt).toLocaleString()}`}
                    </p>
                    <p className="text-gray-700 text-sm">{note.text}</p>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <span className="text-4xl">📝</span>
                    <p className="text-gray-400 text-sm mt-2">No notes added</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
            <span className="text-gray-400 text-xs font-mono">#{enquiry.enquiryId}</span>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-all">
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


/* ─── Main Component ──────────────────────────────────────────────────────── */
const Telecaller = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [showRCModal, setShowRCModal] = useState(false);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const toast = useToast();

  const token = () => localStorage.getItem('adminToken');
  const authHdr = () => ({ Authorization: `Bearer ${token()}` });

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/pending?page=${page}&limit=${limit}`,
        { headers: { 'Content-Type': 'application/json', ...authHdr() } }
      );
      const rawList = res.data?.data ?? [];
      const pag = res.data?.pagination ?? {};
      const active = rawList.filter(r => ACTIVE_STATUSES.includes(r.status));
      setEnquiries(active.map(normalizeEnquiry));
      setPagination({ total: pag.total || 0, page: pag.page || 1, limit: pag.limit || 10, pages: pag.pages || 1 });
    } catch (err) {
      console.error('fetchEnquiries error', err);
      toast.error?.('Failed to fetch enquiries');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEnquiries(); }, [page]);

  const handleStatusUpdate = async (enquiryId, newStatus, note) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/status/${enquiryId}`,
        { status: newStatus, note },
        { headers: { 'Content-Type': 'application/json', ...authHdr() } }
      );
      toast.success?.('Status updated');
      fetchEnquiries();
    } catch (err) { console.error(err); toast.error?.('Failed to update'); throw err; }
  };

  const handleReschedule = async (enquiryId, data) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/schedule/${enquiryId}`,
        data,
        { headers: { 'Content-Type': 'application/json', ...authHdr() } }
      );
      toast.success?.('Schedule updated');
      fetchEnquiries();
    } catch (err) { console.error(err); toast.error?.('Failed to reschedule'); throw err; }
  };

  const counts = {
    all: enquiries.length,
    new: enquiries.filter(e => e.status === 'new').length,
    open: enquiries.filter(e => e.status === 'open').length,
    pending: enquiries.filter(e => e.status === 'pending').length,
    assigned: enquiries.filter(e => e.status === 'assigned').length,
    transferred: enquiries.filter(e => e.status === 'transferred').length,
    'in-progress': enquiries.filter(e => e.status === 'in-progress').length,
  };

  const filtered = enquiries.filter(e => {
    const hay = `${e.name} ${e.subject} ${e.id} ${e.email} ${e.enquiryId} ${e.phone}`.toLowerCase();
    return (!search || hay.includes(search.toLowerCase())) &&
      (filterStatus === 'all' || e.status === filterStatus);
  });

  const filterTabs = [
    { key: 'all', label: 'All Active' },
    { key: 'new', label: 'New' },
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'transferred', label: 'Transferred' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'pending', label: 'Pending' },
  ];

  if (selectedId) return <EnquiryDetailPage enquiryId={selectedId} onBack={() => setSelectedId(null)} />;

  return (
    <div className="w-full">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-gray-800 text-xl font-bold">Telecaller Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage new requests, transfers, and status updates</p>
        </div>
        <RCVerification
          onSuccess={fetchEnquiries}
          onClose={() => setShowRCModal(false)}
        />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Active" value={counts.all} sub="All active" accentClass="bg-indigo-500"
          icon={<svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
        <StatCard label="New Requests" value={counts.new} sub="Unread" accentClass="bg-amber-500"
          icon={<svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" /></svg>} />
        <StatCard label="Transferred" value={counts.transferred} sub="Handovers" accentClass="bg-orange-500"
          icon={<svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 8V3H12" /></svg>} />
        <StatCard label="In Progress" value={counts['in-progress']} sub="Working" accentClass="bg-sky-500"
          icon={<svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100 w-max">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${filterStatus === tab.key
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                  }`}>
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{counts[tab.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search by name, email, ID…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-gray-700 text-sm outline-none focus:border-indigo-400 transition-colors" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">

            {/* Header Row */}
            <div className="grid grid-cols-[2fr_2.5fr_1fr_1fr_1fr_1.2fr_180px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
              {['Sender', 'Subject / Description', 'Priority', 'Status', 'Cost', 'Assigned To', 'Actions'].map(h => (
                <span key={h} className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && [...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_2.5fr_1fr_1fr_1fr_1.2fr_180px] gap-4 px-5 py-4 items-center animate-pulse border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="space-y-1.5 flex-1"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-2.5 bg-gray-100 rounded w-1/2" /></div>
                </div>
                <div className="space-y-1.5"><div className="h-3 bg-gray-100 rounded w-4/5" /><div className="h-2 bg-gray-100 rounded w-1/3" /></div>
                <div className="h-5 bg-gray-100 rounded-full w-14" />
                <div className="h-5 bg-gray-100 rounded-full w-20" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="flex gap-2"><div className="h-7 bg-gray-100 rounded-lg w-16" /><div className="h-7 bg-gray-100 rounded-lg w-20" /></div>
              </div>
            ))}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 text-2xl">📭</div>
                <p className="text-gray-500 text-sm font-medium">No active enquiries found</p>
                <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or search term</p>
                {filterStatus !== 'all' && (
                  <button onClick={() => setFilter('all')} className="mt-3 text-indigo-500 text-xs font-semibold hover:text-indigo-600 transition-colors">
                    Show all active →
                  </button>
                )}
              </div>
            )}

            {/* Rows */}
            {!loading && filtered.map((enq, idx) => {
              const sc = statusConfig[enq.status] || { label: enq.status, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
              const pc = priorityConfig[enq.priority] || { label: enq.priority, bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
              const grad = avatarGradients[idx % avatarGradients.length];
              const isNew = enq.status === 'new';
              const isAdminCreated = enq.createdByAdmin;

              return (
                <div key={enq.id} className="grid grid-cols-[2fr_2.5fr_1fr_1fr_1fr_1.2fr_180px] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors duration-150 items-center group">

                  {/* Sender */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0 relative shadow-sm`}>
                      {enq.avatar}
                      {isNew && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-gray-700 text-sm font-semibold truncate">{enq.name}</p>
                        {isNew && <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">New</span>}
                        {isAdminCreated && <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">Admin</span>}
                      </div>
                      <p className="text-gray-400 text-xs truncate">{enq.email || enq.phone}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="min-w-0 cursor-pointer" onClick={() => setDetailModal(enq)}>
                    <p className="text-gray-700 text-sm truncate group-hover:text-indigo-600 transition-colors font-medium">{enq.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-gray-400 text-xs shrink-0">{enq.date} · {enq.time}</p>
                      {enq.enquiryType && <Tag color="indigo">{enq.enquiryType}</Tag>}
                      {enq.inspectionType && <Tag color="blue">{enq.inspectionType}</Tag>}
                    </div>
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
                  <div>
                    {enq.actualCost > 0 ? (
                      <p className="text-emerald-600 text-sm font-bold">₹{enq.actualCost.toLocaleString()}</p>
                    ) : enq.estimatedCost > 0 ? (
                      <p className="text-amber-500 text-xs">Est. ₹{enq.estimatedCost.toLocaleString()}</p>
                    ) : (
                      <p className="text-gray-300 text-xs">—</p>
                    )}
                  </div>

                  {/* Assigned To */}
                  <div className="min-w-0">
                    {enq.assignedTo
                      ? <span className="text-gray-600 text-xs font-medium truncate">{enq.assignedTo}</span>
                      : <span className="text-gray-300 text-xs italic">Unassigned</span>
                    }
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setDetailModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 text-[11px] font-semibold transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                    <button onClick={() => setStatusModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 hover:bg-teal-100 text-[11px] font-semibold transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Update
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                <span className="text-gray-400 text-xs">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total enquiries
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    ← Previous
                  </button>
                  {[...Array(pagination.pages)].map((_, i) => {
                    const p = i + 1;
                    if (pagination.pages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pagination.pages) {
                      if (p === page - 3 || p === page + 3) return <span key={p} className="text-gray-300 px-1">…</span>;
                      if (Math.abs(p - page) > 3) return null;
                    }
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === p
                            ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailModal && (
        <EnquiryDetailModal enquiry={detailModal} onClose={() => setDetailModal(null)}
          onReschedule={handleReschedule} onStatusUpdate={handleStatusUpdate} />
      )}
      {statusModal && (
        <StatusUpdateModal enquiry={statusModal} onClose={() => setStatusModal(null)} onUpdate={handleStatusUpdate} />
      )}
      {showCreateModal && (
        <CreateEnquiryModal onClose={() => setShowCreateModal(false)}
          onSuccess={() => { fetchEnquiries(); toast.success?.('Enquiry created'); }} />
      )}
    </div>
  );
};

export default Telecaller;