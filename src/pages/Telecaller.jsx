import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import EnquiryDetailPage from './Enquirydetailpage';


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

const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500', 'from-teal-500 to-cyan-500',
];

const ACTIVE_STATUSES = ['new', 'open', 'pending', 'assigned', 'in-progress', 'transferred'];

const normalizeEnquiry = (raw, idx) => ({
  id: raw._id || raw.id || `idx-${idx}`,
  name: [raw.userId?.firstName, raw.userId?.lastName].filter(Boolean).join(' ') || 'Unknown',
  email: raw.userId?.email || 'N/A',
  phone: raw.contactNumber || raw.userId?.phone || '—',
  subject: raw.title || raw.description || 'No subject',
  message: raw.description || '',
  status: raw.status || 'new',
  priority: raw.priority || 'medium',
  date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : '—',
  time: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
  avatar: `${raw.userId?.firstName?.[0] || 'U'}${raw.userId?.lastName?.[0] || ''}`.toUpperCase(),
  estimatedCost: raw.estimatedCost || 0,
  actualCost: raw.actualCost || 0,
  enquiryId: raw.enquiryId || raw._id || raw.id || `idx-${idx}`,
  assignedTo: raw.assignedTo?.name || raw.assignedTo || null,
  scheduleDate: raw.scheduleDate || null,
  scheduleTime: raw.scheduleTime || '',
  inspectionType: raw.inspectionType || '',
  carDetails: raw.carDetails || null,
  sellingDetails: raw.sellingDetails || null,
  attachments: raw.attachments || [],
  notes: raw.notes || [],
  enquiryType: raw.enquiryType || '',
  severity: raw.severity || '',
  customerJourney: raw.customerJourney || null,
  _raw: raw,
});

/* ─── Shared atoms ───────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-white/[0.04] last:border-0">
    <span className="indigo-500/35 text-xs shrink-0 mr-3">{label}</span>
    <span className="indigo-500/75 text-xs font-medium text-right">{value ?? '—'}</span>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-3">{children}</p>
);

const StatusBadge = ({ status }) => {
  const s = statusConfig[status] || { label: status || 'Unknown', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

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

/* ─── Status Update Modal ────────────────────────────────────────────────── */
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
      key: 'assign-to-team',
      label: 'Assign To Team'
    },
    {
      key: 'closed',
      label: 'Close Enquiry'
    }
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center indigo-500/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-white/[0.1] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="indigo-500 font-bold text-lg mb-1">Update Status</h3>
        <p className="indigo-500/40 text-sm mb-4">Enquiry #{enquiry.enquiryId}</p>
        <div className="space-y-3 mb-4">
          <label className="indigo-500/60 text-xs font-semibold uppercase tracking-wider">New Status</label>
          <div className="grid grid-cols-2 gap-2">
            {availableStatuses.map(s => (
              <button key={s.key} onClick={() => setNewStatus(s.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${newStatus === s.key ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/25' : 'bg-white/[0.05] indigo-500/50 hover:bg-white/[0.08]'
                  }`}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2 mb-6">
          <label className="indigo-500/60 text-xs font-semibold uppercase tracking-wider">Note (Optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 indigo-500/70 text-sm indigo-500 outline-none focus:border-teal-500/50 resize-none h-20" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] indigo-500/60 text-sm font-semibold hover:bg-white/[0.08] transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={loading || newStatus === enquiry.status}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 indigo-500 text-sm font-semibold hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Reschedule Modal ───────────────────────────────────────────────────── */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center indigo-500/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-white/[0.1] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="indigo-500 font-bold text-lg">Reschedule Inspection</h3>
            <p className="indigo-500/40 text-sm">#{enquiry.enquiryId}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg indigo-500/40 hover:indigo-500/80 hover:bg-white/[0.06]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="indigo-500/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 indigo-500/70 text-sm outline-none focus:border-teal-500/50 [color-scheme:dark]" />
          </div>
          <div>
            <label className="indigo-500/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 indigo-500/70 text-sm outline-none focus:border-teal-500/50 [color-scheme:dark]" />
          </div>
          <div>
            <label className="indigo-500/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Inspection Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 indigo-500/70 text-sm outline-none focus:border-teal-500/50 [color-scheme:dark]">
              <option value="">Select type...</option>
              <option value="home">Home Inspection</option>
              <option value="center">Center Inspection</option>
              <option value="virtual">Virtual Inspection</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] indigo-500/60 text-sm font-semibold hover:bg-white/[0.08] transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || !date}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 indigo-500 text-sm font-semibold hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Full Enquiry Detail Modal ──────────────────────────────────────────── */
const EnquiryDetailModal = ({ enquiry, onClose, onReschedule, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showReschedule, setShowReschedule] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const sc = statusConfig[enquiry.status] || { label: enquiry.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  const pc = priorityConfig[enquiry.priority] || { label: enquiry.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'car', label: 'Vehicle' },
    { key: 'selling', label: 'Selling' },
    { key: 'journey', label: 'Journey' },
  ];
  if (enquiry.attachments?.length > 0) tabs.push({ key: 'photos', label: `Photos (${enquiry.attachments.length})` });
  if (enquiry.notes?.length > 0) tabs.push({ key: 'notes', label: `Notes (${enquiry.notes.length})` });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center indigo-500/70 backdrop-blur-sm" onClick={onClose}>
        <div
          className="relative w-full max-w-2xl bg-white border border-white/[0.08] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl max-h-[92vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="indigo-500/40 text-xs font-mono">{enquiry.enquiryId}</span>
                <StatusBadge status={enquiry.status} />
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                  {pc.label}
                </span>
              </div>
              <h2 className="indigo-500 font-bold text-base leading-tight truncate">{enquiry.subject}</h2>
              <p className="indigo-500/35 text-xs mt-0.5">{enquiry.date} at {enquiry.time}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowReschedule(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Reschedule
              </button>
              <button
                onClick={() => setShowStatusUpdate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-400 hover:bg-teal-500/20 text-xs font-semibold transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Update
              </button>
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg indigo-500/40 hover:indigo-500/80 hover:bg-white/[0.06] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* ── Customer strip ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.015] shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center indigo-500 text-xs font-bold shrink-0">
              {enquiry.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="indigo-500/80 text-sm font-semibold">{enquiry.name}</p>
              <p className="indigo-500/35 text-xs">{enquiry.email} · {enquiry.phone}</p>
            </div>
            {enquiry.scheduleDate && (
              <div className="text-right shrink-0">
                <p className="indigo-500/25 text-[10px] uppercase tracking-wider">Scheduled</p>
                <p className="text-indigo-400 text-xs font-semibold">
                  {new Date(enquiry.scheduleDate).toLocaleDateString()} {enquiry.scheduleTime && `· ${enquiry.scheduleTime}`}
                </p>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 px-5 py-2.5 border-b border-white/[0.04] overflow-x-auto shrink-0">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.key ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30' : 'indigo-500/35 hover:indigo-500/60 hover:bg-white/[0.04]'
                  }`}>{t.label}</button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <SectionLabel>Enquiry Info</SectionLabel>
                    <InfoRow label="Enquiry ID" value={enquiry.enquiryId} />
                    <InfoRow label="Type" value={enquiry.enquiryType} />
                    <InfoRow label="Severity" value={enquiry.severity} />
                    <InfoRow label="Inspection" value={enquiry.inspectionType || '—'} />
                    <InfoRow label="Assigned To" value={enquiry.assignedTo || 'Unassigned'} />
                    <InfoRow label="Created" value={`${enquiry.date} ${enquiry.time}`} />
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <SectionLabel>Cost</SectionLabel>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] mb-2">
                      <span className="indigo-500/40 text-xs">Estimated</span>
                      <span className="text-amber-400 font-bold text-sm">{enquiry.estimatedCost > 0 ? `₹${enquiry.estimatedCost.toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <span className="indigo-500/40 text-xs">Actual</span>
                      <span className="text-emerald-400 font-bold text-sm">{enquiry.actualCost > 0 ? `₹${enquiry.actualCost.toLocaleString()}` : '—'}</span>
                    </div>
                    {enquiry.scheduleDate && (
                      <div className="mt-3 pt-3 border-t border-white/[0.04]">
                        <SectionLabel>Schedule</SectionLabel>
                        <InfoRow label="Date" value={new Date(enquiry.scheduleDate).toLocaleDateString()} />
                        <InfoRow label="Time" value={enquiry.scheduleTime || '—'} />
                      </div>
                    )}
                  </div>
                </div>
                {enquiry.message && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <SectionLabel>Description</SectionLabel>
                    <p className="indigo-500/60 text-sm leading-relaxed">{enquiry.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* VEHICLE */}
            {activeTab === 'car' && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                {enquiry.carDetails ? (
                  <>
                    <SectionLabel>Vehicle Details</SectionLabel>
                    <InfoRow label="Make" value={enquiry.carDetails.make} />
                    <InfoRow label="Model" value={enquiry.carDetails.model} />
                    <InfoRow label="Year" value={enquiry.carDetails.year} />
                    <InfoRow label="Color" value={enquiry.carDetails.color} />
                    {/* <InfoRow label="Registration No." value={enquiry.carDetails.registrationNumber} /> */}
                    <InfoRow label="Mileage" value={enquiry.carDetails.mileage != null ? `${Number(enquiry.carDetails.mileage).toLocaleString()} km` : null} />
                  </>
                ) : (
                  <p className="indigo-500/30 text-sm text-center py-8">No vehicle details available</p>
                )}
              </div>
            )}

            {/* SELLING */}
            {activeTab === 'selling' && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                {enquiry.sellingDetails ? (
                  <>
                    <SectionLabel>Selling Details</SectionLabel>
                    <InfoRow label="Expected Price" value={enquiry.sellingDetails.expectedPrice != null ? `₹${Number(enquiry.sellingDetails.expectedPrice).toLocaleString()}` : null} />
                    <InfoRow label="City" value={enquiry.sellingDetails.city} />
                    <InfoRow label="Fuel Type" value={enquiry.sellingDetails.fuelType} />
                    <InfoRow label="Transmission" value={enquiry.sellingDetails.transmission} />
                    <InfoRow label="Ownership" value={enquiry.sellingDetails.ownership} />
                    <InfoRow label="KM Driven" value={enquiry.sellingDetails.kilometersDriven != null ? `${Number(enquiry.sellingDetails.kilometersDriven).toLocaleString()} km` : null} />
                    <InfoRow label="Accident History" value={enquiry.sellingDetails.accidentHistory} />
                    <InfoRow label="Service History" value={enquiry.sellingDetails.serviceHistoryAvailable ? 'Available' : 'Not Available'} />
                  </>
                ) : (
                  <p className="indigo-500/30 text-sm text-center py-8">No selling details available</p>
                )}
              </div>
            )}

            {/* JOURNEY */}
            {activeTab === 'journey' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <SectionLabel>Journey Status</SectionLabel>
                  <InfoRow label="Current Step" value={enquiry.customerJourney?.currentStep || '—'} />
                </div>
                {enquiry.customerJourney?.timeline?.length > 0 ? (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <SectionLabel>Timeline</SectionLabel>
                    <div className="relative pl-5">
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                      {enquiry.customerJourney.timeline.map((step, i) => (
                        <div key={i} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-[#bg-white]" />
                          <p className="indigo-500/60 text-xs font-semibold capitalize">{step.step || step.status || '—'}</p>
                          {step.description && <p className="indigo-500/30 text-xs mt-0.5">{step.description}</p>}
                          {step.timestamp && <p className="indigo-500/20 text-[10px] mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                    <p className="indigo-500/30 text-sm py-4">No timeline events yet</p>
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
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03] block">
                        <img src={att.url} alt={att.fileName || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="indigo-500 text-[10px] truncate">{att.fileName}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="indigo-500/30 text-sm text-center py-8">No attachments</p>
                )}
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                {enquiry.notes?.length > 0 ? enquiry.notes.map((note, i) => (
                  <div key={i} className="border-l-2 border-amber-500/40 pl-4 py-1">
                    <p className="indigo-500/25 text-[10px] mb-0.5">
                      {note.addedBy?.firstName} {note.addedBy?.lastName} · {note.addedAt ? new Date(note.addedAt).toLocaleString() : ''}
                    </p>
                    <p className="indigo-500/70 text-sm">{note.text}</p>
                  </div>
                )) : (
                  <p className="indigo-500/30 text-sm text-center py-8">No notes added</p>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between shrink-0 bg-white/[0.01]">
            <span className="indigo-500/20 text-xs">#{enquiry.enquiryId}</span>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] indigo-500/50 hover:indigo-500/80 hover:bg-white/[0.08] text-sm font-semibold transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Nested modals */}
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
const CreateEnquiryModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    contactNumber: '',
    enquiryType: '',
    title: '',
    description: '',
    severity: '',
    priority: 'medium',
    carDetails: {
      make: '', model: '', year: '', color: '', mileage: '', registrationNumber: ''
    },
    sellingDetails: {
      expectedPrice: '', city: '', fuelType: '', transmission: '', ownership: '', kilometersDriven: '', accidentHistory: '', serviceHistoryAvailable: false
    },
    scheduleDate: '',
    scheduleTime: '',
    inspectionType: '',
    additionalInfo: '',
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("adminToken");

  const handleFileChange = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.description) {
      alert('Description is required');
      return;
    }

    const fd = new FormData();

    // simple scalar fields
    const fields = ['customerName', 'customerEmail', 'contactNumber', 'enquiryType', 'title', 'description', 'severity', 'priority', 'scheduleDate', 'scheduleTime', 'inspectionType', 'additionalInfo'];
    fields.forEach(k => { if (form[k]) fd.append(k, form[k]); });

    // nested objects as JSON
    try {
      fd.append('carDetails', JSON.stringify(form.carDetails));
      fd.append('sellingDetails', JSON.stringify(form.sellingDetails));
    } catch (err) {
      // ignore
    }

    // append files
    files.forEach((f) => {
      fd.append('files', f);
    });

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/enquiries/admin`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Let browser set Content-Type with boundary
          }
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create enquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-5">Create New Enquiry</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Email</label>
              <input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number</label>
              <input type="text" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Enquiry Type</label>
              <select value={form.enquiryType} onChange={e => setForm({ ...form, enquiryType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select type</option>
                <option value="status">Status</option>
                <option value="health">Health</option>
                <option value="service">Service</option>
                <option value="maintenance">Maintenance</option>
                <option value="damage">Damage</option>
                <option value="sell">Sell</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 h-24" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inspection Type</label>
              <select value={form.inspectionType} onChange={e => setForm({ ...form, inspectionType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select</option>
                <option value="home">Home</option>
                <option value="center">Center</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-white/[0.02]">
            <p className="text-xs font-semibold mb-2">Vehicle Details (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="text" placeholder="Make" value={form.carDetails.make} onChange={e => setForm({ ...form, carDetails: { ...form.carDetails, make: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Model" value={form.carDetails.model} onChange={e => setForm({ ...form, carDetails: { ...form.carDetails, model: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Year" value={form.carDetails.year} onChange={e => setForm({ ...form, carDetails: { ...form.carDetails, year: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Color" value={form.carDetails.color} onChange={e => setForm({ ...form, carDetails: { ...form.carDetails, color: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Mileage" value={form.carDetails.mileage} onChange={e => setForm({ ...form, carDetails: { ...form.carDetails, mileage: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Registration No." value={form.carDetails.registrationNumber} onChange={e => setForm({ ...form, carDetails: { ...form.carDetails, registrationNumber: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-white/[0.02]">
            <p className="text-xs font-semibold mb-2">Selling Details (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="text" placeholder="Expected Price" value={form.sellingDetails.expectedPrice} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, expectedPrice: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="City" value={form.sellingDetails.city} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, city: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <select value={form.sellingDetails.fuelType} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, fuelType: e.target.value } })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Fuel Type</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="other">Other</option>
              </select>
              <select value={form.sellingDetails.transmission} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, transmission: e.target.value } })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Transmission</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="amt">AMT</option>
                <option value="cvt">CVT</option>
                <option value="dct">DCT</option>
                <option value="other">Other</option>
              </select>
              <select value={form.sellingDetails.ownership} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, ownership: e.target.value } })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Ownership</option>
                <option value="first">First</option>
                <option value="second">Second</option>
                <option value="third">Third</option>
                <option value="fourth_or_more">Fourth or more</option>
                <option value="other">Other</option>
              </select>
              <input type="text" placeholder="KM Driven" value={form.sellingDetails.kilometersDriven} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, kilometersDriven: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" placeholder="Accident History" value={form.sellingDetails.accidentHistory} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, accidentHistory: e.target.value } })} className="w-full border rounded-lg px-3 py-2" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.sellingDetails.serviceHistoryAvailable} onChange={e => setForm({ ...form, sellingDetails: { ...form.sellingDetails, serviceHistoryAvailable: e.target.checked } })} /> <span className="text-sm">Service history available</span></label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Schedule Date</label>
              <input type="date" value={form.scheduleDate} onChange={e => setForm({ ...form, scheduleDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schedule Time</label>
              <input type="time" value={form.scheduleTime} onChange={e => setForm({ ...form, scheduleTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Additional Info</label>
            <textarea value={form.additionalInfo} onChange={e => setForm({ ...form, additionalInfo: e.target.value })} className="w-full border rounded-lg px-3 py-2 h-20" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attachments (images)</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full" />
            {files.length > 0 && <p className="text-xs mt-2 text-indigo-500">{files.length} file(s) selected</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-teal-500 text-white rounded-lg py-2">{loading ? 'Creating...' : 'Create Enquiry'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const Telecaller = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [detailModal, setDetailModal] = useState(null);   // full detail modal
  const [statusModal, setStatusModal] = useState(null);   // quick status update
  const [showCreateModal, setShowCreateModal] = useState(false);
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  const token = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  const fetchEnquiries = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/pending?page=${page}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }
      );

      const rawList = res.data?.data ?? [];
      const paginationData = res.data?.pagination ?? {};

      const active = rawList.filter((r) =>
        ACTIVE_STATUSES.includes(r.status)
      );

      setEnquiries(active.map(normalizeEnquiry));

      setPagination({
        total: paginationData.total || 0,
        page: paginationData.page || 1,
        limit: paginationData.limit || 10,
        pages: paginationData.pages || 1,
      });
    } catch (err) {
      console.error('fetchEnquiries error', err);
      toast.error?.('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [page]);

  const handleStatusUpdate = async (enquiryId, newStatus, note) => {
    try {
      await axios.put(

        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/status/${enquiryId}`,
        { status: newStatus, note },
        { headers: { 'Content-Type': 'application/json', ...authHeader() } }
      );
      toast.success?.('Status updated successfully');
      fetchEnquiries();
    } catch (err) {
      console.error('Status update error', err);
      toast.error?.('Failed to update status');
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
    const hay = `${e.name} ${e.subject} ${e.id} ${e.email} ${e.enquiryId}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filterTabs = [
    { key: 'all', label: 'All Active' },
    { key: 'new', label: 'New Requests' },
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'transferred', label: 'Transferred' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'pending', label: 'Pending' },
  ];

  /* ── Full detail page (separate route-like view) ── */
  if (selectedId) {
    return <EnquiryDetailPage enquiryId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="indigo-500 text-xl font-bold">
            Telecaller Dashboard
          </h1>
          <p className="indigo-500/35 text-sm mt-0.5">
            Manage new requests, transfers, and status updates
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>

          Create New Enquiry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Active" value={counts.all} sub="All active" accent="bg-indigo-500"
          icon={<svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
        <StatCard label="New Requests" value={counts.new} sub="Unread" accent="bg-amber-500"
          icon={<svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" /></svg>} />
        <StatCard label="Transferred" value={counts.transferred} sub="Handovers" accent="bg-orange-500"
          icon={<svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 8V3H12" /><path d="M17 3l-5 5" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /></svg>} />
        <StatCard label="In Progress" value={counts['in-progress']} sub="Working" accent="bg-sky-500"
          icon={<svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-max">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterStatus === tab.key ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30' : 'indigo-500/35 hover:indigo-500/60'
                  }`}>
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
          <input type="text" placeholder="Search enquiries…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border indigo-500 rounded-xl pl-9 pr-4 py-2 indigo-500/70 text-sm indigo-500 outline-none focus:border-teal-500/50 focus:bg-white/[0.06] transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Headers */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_160px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              {['Sender', 'Subject', 'Priority', 'Status', 'Cost', 'Assigned', 'Actions'].map(h => (
                <span key={h} className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="divide-y divide-white/[0.04]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_160px] gap-4 px-5 py-4 items-center animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                      <div className="space-y-1.5 flex-1"><div className="h-3 bg-white/10 rounded w-3/4" /><div className="h-2.5 bg-white/[0.06] rounded w-1/2" /></div>
                    </div>
                    <div className="space-y-1.5"><div className="h-3 bg-white/10 rounded w-4/5" /><div className="h-2.5 bg-white/[0.06] rounded w-1/3" /></div>
                    <div className="h-5 bg-white/10 rounded-full w-16" />
                    <div className="h-5 bg-white/10 rounded-full w-20" />
                    <div className="h-5 bg-white/10 rounded w-20" />
                    <div className="h-5 bg-white/10 rounded w-20" />
                    <div className="flex gap-2"><div className="h-7 bg-white/10 rounded-lg w-16" /><div className="h-7 bg-white/10 rounded-lg w-14" /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 indigo-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="indigo-500/30 text-sm font-medium">No active enquiries found</p>
                {filterStatus !== 'all' && (
                  <button onClick={() => setFilter('all')} className="mt-3 text-teal-400 text-xs hover:text-teal-300 transition-colors">Show all active</button>
                )}
              </div>
            )}

            {/* Rows */}
            {!loading && filtered.map((enq, idx) => {
              const sc = statusConfig[enq.status] || { label: enq.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
              const pc = priorityConfig[enq.priority] || { label: enq.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
              const grad = avatarGradients[idx % avatarGradients.length];
              const isNew = enq.status === 'new';

              return (
                <div key={enq.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_160px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 items-center group">
                  {/* Sender */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center indigo-500 text-xs font-bold shrink-0 relative`}>
                      {enq.avatar}
                      {isNew && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-gray-900" />}
                    </div>
                    <div className="min-w-0">
                      <p className="indigo-500/85 text-sm font-medium truncate flex items-center gap-2">
                        {enq.name}
                        {isNew && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase">New</span>}
                      </p>
                      <p className="indigo-500/30 text-xs truncate">{enq.email}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="min-w-0 cursor-pointer" onClick={() => setDetailModal(enq)}>
                    <p className="indigo-500/70 text-sm truncate hover:text-teal-400 transition-colors">{enq.subject}</p>
                    <p className="indigo-500/25 text-xs mt-0.5">{enq.date} · {enq.time}</p>
                  </div>

                  {/* Priority */}
                  <div>
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>{pc.label}</span>
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
                      <p className="indigo-500/20 text-xs">—</p>
                    )}
                  </div>

                  {/* Assigned To */}
                  <div className="min-w-0">
                    {enq.assignedTo ? (
                      <span className="indigo-500/50 text-xs truncate">{enq.assignedTo}</span>
                    ) : (
                      <span className="indigo-500/20 text-xs italic">Unassigned</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {/* View button */}
                    <button
                      onClick={() => setDetailModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] indigo-500/50 hover:indigo-500/80 hover:bg-white/[0.08] text-[11px] font-semibold transition-all"
                      title="View details"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                    {/* Update Status button */}
                    <button
                      onClick={() => setStatusModal(enq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-[11px] font-semibold transition-all"
                      title="Update Status"
                    >
                      Update
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            {/* Footer + Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-4 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.01]">

                <span className="indigo-500/25 text-xs">
                  Showing page {pagination.page} of {pagination.pages}
                  {' '}· Total {pagination.total} enquiries
                </span>

                <div className="flex items-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={() => setPage(prev => prev - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]
        indigo-500/60 text-xs font-medium hover:bg-white/[0.08]
        disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {[...Array(pagination.pages)].map((_, idx) => {
                    const pageNo = idx + 1;

                    return (
                      <button
                        key={pageNo}
                        onClick={() => setPage(pageNo)}
                        className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all
              ${page === pageNo
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                            : 'bg-white/[0.05] indigo-500/50 hover:bg-white/[0.08]'
                          }`}
                      >
                        {pageNo}
                      </button>
                    );
                  })}

                  {/* Next */}
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page === pagination.pages}
                    className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]
        indigo-500/60 text-xs font-medium hover:bg-white/[0.08]
        disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Detail Modal */}
      {detailModal && (
        <EnquiryDetailModal
          enquiry={detailModal}
          onClose={() => setDetailModal(null)}
          onReschedule={handleReschedule}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Quick Status Update Modal */}
      {statusModal && (
        <StatusUpdateModal
          enquiry={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdate={handleStatusUpdate}
        />
      )}
      {showCreateModal && (
        <CreateEnquiryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchEnquiries();
            toast.success?.("Enquiry created successfully");
          }}
        />
      )}
    </div>
  );
};

export default Telecaller;