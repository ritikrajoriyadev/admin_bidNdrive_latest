import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import {
  Search,
  RefreshCcw,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Users,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Constants & helpers
───────────────────────────────────────────────────────────── */
const VALID_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'cancelled',
];

const STATUS_STYLES = {
  approved: { pill: 'bg-emerald-500/15 text-emerald-400' },
  rejected: { pill: 'bg-rose-500/15 text-rose-400' },
  in_progress: { pill: 'bg-amber-500/15 text-amber-400' },
  completed: { pill: 'bg-sky-500/15 text-sky-400' },
  cancelled: { pill: 'bg-slate-500/15 text-slate-400' },
  pending: { pill: 'bg-violet-500/15 text-violet-400' },
  unknown: { pill: 'bg-white/10 indigo-500/60' },
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${cfg.pill}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const normalizeItem = (item) => {
  const userName = item.userId
    ? [item.userId.firstName, item.userId.lastName].filter(Boolean).join(' ')
    : 'Unknown';

  return {
    raw: item,
    id: item._id || item.id || item.pdiId || item.identifier || '',
    createdAt: item.createdAt || item.createdAtAt || item.date || '',
    name: userName,
    email: item.userId?.email || item.email || item.contactEmail || '—',
    phone: item.userId?.phone || item.phone || '—',
    status: item.status || 'pending',
    adminResponse: item.adminResponse || item.adminComment || item.comment || '',
    subject: item.carDetails?.make
      ? `${item.carDetails.make} – ${item.carDetails.model}`
      : 'PDI Request',
    details: item.message || item.description || item.details || item.notes || '—',
    carDetails: item.carDetails || {},
    location: item.location || {},
    preferredDate: item.preferredDate || '',
    preferredTime: item.preferredTime || '',
  };
};

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

/** Floating glass-morphism stat cards at the top */
const StatCard = ({ label, count, colorClass }) => (
  <div className="flex-1 min-w-[110px] rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm px-4 py-3">
    <p className="text-[10px] uppercase tracking-[0.18em] indigo-500/40 mb-1">{label}</p>
    <p className={`text-2xl font-semibold ${colorClass}`}>{count}</p>
  </div>
);

/** Assign-technician modal */
const AssignModal = ({
  item,
  technicians,
  techniciansLoading,
  assigning,
  onClose,
  onAssign,
}) => {
  const [selectedTech, setSelectedTech] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTech) onAssign(selectedTech);
  };

  return (
    /* faux viewport wrapper so the modal contributes layout height */
    <div className="fixed inset-0 z-50 flex items-center justify-center indigo-500/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold indigo-500">Assign PDI to Technician</h3>
            <p className="text-[11px] indigo-500/40 mt-0.5">Select a technician to assign this PDI request</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 indigo-500/40 hover:bg-white/10 hover:indigo-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* PDI detail summary */}
          <div className="rounded-2xl bg-white/4 border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] indigo-500/35 mb-3">PDI Request Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Car', `${item.carDetails?.make || '—'} ${item.carDetails?.model || ''}`],
                ['Registration', item.carDetails?.registrationNumber || 'N/A'],
                ['Location', `${item.location?.city || '—'}, ${item.location?.state || ''}`],
                ['Requester', item.name],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] indigo-500/35 mb-0.5">{label}</p>
                  <p className="indigo-500 font-medium text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technician list */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-[12px] font-medium indigo-500/60">
              <Users size={13} className="inline mr-1.5 align-middle" />
              Select Technician
            </label>

            {techniciansLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <span className="ml-2 text-sm indigo-500/40">Loading technicians…</span>
              </div>
            ) : technicians.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white p-4 text-center text-sm indigo-500/40">
                No technicians available. Please create technicians first.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {technicians.map((tech) => (
                  <label
                    key={tech.id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition ${selectedTech === tech.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/8 bg-white hover:border-white/20'
                      }`}
                  >
                    <input
                      type="radio"
                      name="technician"
                      value={tech.id}
                      checked={selectedTech === tech.id}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center indigo-500 font-semibold text-sm flex-shrink-0">
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="indigo-500 font-medium text-sm truncate">{tech.name}</p>
                      <p className="text-[11px] indigo-500/40 truncate">{tech.email}</p>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tech.isActive ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm font-medium indigo-500/70 hover:bg-white/8 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning || !selectedTech}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold indigo-500 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  <>
                    <Users size={15} />
                    Assign Technician
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
export default function Pdi() {
  const [pdiList, setPdiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedItem, setSelectedItem] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('approved');
  const [adminResponse, setAdminResponse] = useState('');
  const [updating, setUpdating] = useState(false);

  const [technicians, setTechnicians] = useState([]);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const { addToast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('adminToken');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  /* ── Fetch ── */
  const fetchPdiItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${apiUrl}/api/pdi/all`, { headers: authHeaders });
      const rawData = data?.data ?? data ?? [];
      const items = Array.isArray(rawData)
        ? rawData
        : rawData.items ?? rawData.pdi ?? rawData.requests ?? [];
      setPdiList(Array.isArray(items) ? items.map(normalizeItem) : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch PDI requests.');
      addToast('Unable to load PDI requests', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    setTechniciansLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/api/admin/technicians`, { headers: authHeaders });
      const techData = data?.data?.technicians || data?.technicians || [];
      setTechnicians(
        techData.map((t) => ({
          id: t._id,
          name: `${t.firstName} ${t.lastName}`.trim(),
          email: t.email,
          phone: t.phone,
          isActive: t.isActive,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTechniciansLoading(false);
    }
  };

  useEffect(() => { fetchPdiItems(); }, []);
  useEffect(() => {
    if (showAssignDialog && technicians.length === 0) fetchTechnicians();
  }, [showAssignDialog]);

  /* ── Filtered list ── */
  const filteredPdi = useMemo(() => {
    return pdiList.filter((item) => {
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      const term = search.trim().toLowerCase();
      if (!term) return matchStatus;
      const haystack = [item.id, item.name, item.email, item.status, item.subject, item.details, item.adminResponse]
        .filter(Boolean).join(' ').toLowerCase();
      return matchStatus && haystack.includes(term);
    });
  }, [pdiList, filterStatus, search]);

  /* ── Stat counts ── */
  const counts = useMemo(() => {
    const c = { total: pdiList.length };
    VALID_STATUSES.forEach((s) => { c[s] = pdiList.filter((i) => i.status === s).length; });
    return c;
  }, [pdiList]);

  /* ── Update status ── */
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedItem || !VALID_STATUSES.includes(statusUpdate)) {
      addToast('Choose a valid status before updating', { type: 'error' });
      return;
    }
    setUpdating(true);
    try {
      await axios.put(
        `${apiUrl}/api/pdi/status/${selectedItem.id}`,
        { status: statusUpdate, adminResponse },
        { headers: authHeaders }
      );
      addToast('PDI status updated successfully');
      setSelectedItem(null);
      setAdminResponse('');
      fetchPdiItems();
    } catch (err) {
      console.error(err);
      addToast('Failed to update PDI status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  /* ── Assign technician ── */
  const handleAssignTechnician = async (technicianId) => {
    if (!assignTarget || !technicianId) {
      addToast('Please select a technician', { type: 'error' });
      return;
    }
    setAssigning(true);
    try {
      await axios.put(
        `${apiUrl}/api/pdi/assign/${assignTarget.id}`,
        { technicianId, status: 'in_progress' },
        { headers: authHeaders }
      );
      addToast('PDI assigned to technician successfully');
      setShowAssignDialog(false);
      setAssignTarget(null);
      fetchPdiItems();
    } catch (err) {
      console.error(err);
      addToast('Failed to assign PDI to technician', { type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold indigo-500">PDI Requests</h1>
          <p className="text-sm indigo-500/40 mt-1">
            Review all PDI requests and update status from the admin panel.
          </p>
        </div>
        <button
          onClick={fetchPdiItems}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm indigo-500/70 hover:border-white/20 hover:bg-white/10 transition"
        >
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      {/* ── Stat chips ── */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-3">
          <StatCard label="Total" count={counts.total} colorClass="indigo-500" />
          <StatCard label="Pending" count={counts.pending} colorClass="text-violet-400" />
          <StatCard label="Approved" count={counts.approved} colorClass="text-emerald-400" />
          <StatCard label="In Progress" count={counts.in_progress} colorClass="text-amber-400" />
          <StatCard label="Completed" count={counts.completed} colorClass="text-sky-400" />
          <StatCard label="Rejected" count={counts.rejected} colorClass="text-rose-400" />
        </div>
      )}

      {/* ── Search + filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 shadow-sm">
          <Search size={16} className="indigo-500/30 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, email, status…"
            className="flex-1 bg-transparent outline-none indigo-500 text-sm placeholder:indigo-500/25"
          />
          {search && (
            <button onClick={() => setSearch('')} className="indigo-500/30 hover:indigo-500/60 transition">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3">
          <span className="indigo-500/40 text-sm flex-shrink-0">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-white px-3 py-1.5 text-sm indigo-500 outline-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            {VALID_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white p-14 text-center indigo-500/40">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-indigo-400" />
          Loading PDI requests…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-rose-300 text-sm">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lg shadow-black/20">
          {/* Table head — hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.4fr_1fr_1.1fr_auto] gap-4 rounded-t-3xl border-b border-white/10 bg-white px-6 py-3.5 text-[10px] uppercase tracking-[0.18em] indigo-500/35">
            <div>Car Details</div>
            <div>Location</div>
            <div>Requester</div>
            <div>Status</div>
            <div>Date</div>
            <div className="text-right pr-1">Action</div>
          </div>

          {filteredPdi.length === 0 ? (
            <div className="p-10 text-center indigo-500/40 text-sm">No PDI requests found.</div>
          ) : (
            filteredPdi.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 md:grid md:grid-cols-[2fr_1fr_1.4fr_1fr_1.1fr_auto] md:gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition"
              >
                {/* Car */}
                <div className="space-y-0.5">
                  <p className="font-semibold indigo-500 text-sm">{item.carDetails?.make || '—'}</p>
                  <p className="text-[11px] indigo-500/35">
                    {[item.carDetails?.model, item.carDetails?.year, item.carDetails?.carType]
                      .filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-[11px] indigo-500/35">
                    Reg: {item.carDetails?.registrationNumber || 'N/A'}
                  </p>
                </div>

                {/* Location */}
                <div className="text-sm">
                  <p className="indigo-500">{item.location?.city || '—'}</p>
                  <p className="text-[11px] indigo-500/35">{item.location?.state}</p>
                </div>

                {/* Requester */}
                <div>
                  <p className="text-sm font-medium indigo-500">{item.name}</p>
                  <p className="text-[11px] indigo-500/35">{item.email}</p>
                  <p className="text-[11px] indigo-500/35">{item.phone}</p>
                </div>

                {/* Status */}
                <div className="flex items-start">
                  <StatusBadge status={item.status} />
                </div>

                {/* Date */}
                <div>
                  <p className="text-[12px] indigo-500">{formatDate(item.createdAt)}</p>
                  <p className="text-[11px] indigo-500/35">{item.preferredTime}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-start md:justify-end">
                  {/* <button
                    onClick={() => {
                      setSelectedItem(item);
                      setStatusUpdate(
                        VALID_STATUSES.includes(item.status) ? item.status : 'approved'
                      );
                      setAdminResponse(item.adminResponse || '');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-semibold indigo-500 hover:bg-indigo-500 transition"
                  >
                    <ArrowRight size={12} />
                    Update
                  </button> */}
                  <button
                    onClick={() => {
                      setAssignTarget(item);
                      setShowAssignDialog(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-[11px] font-semibold indigo-500 hover:bg-emerald-600 transition"
                  >
                    <Users size={12} />
                    Assign
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Update status panel ── */}
      {selectedItem && (
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-black/20 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] indigo-500/35 mb-1">
                Update status for
              </p>
              <h2 className="text-lg font-semibold indigo-500">{selectedItem.subject}</h2>
              <p className="text-[12px] indigo-500/40 mt-0.5">ID: {selectedItem.id}</p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="self-start inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm indigo-500/50 hover:bg-white/10 transition"
            >
              <X size={14} />
              Cancel
            </button>
          </div>

          <form onSubmit={handleUpdateStatus} className="grid gap-4 md:grid-cols-2">
            {/* Status select */}
            <div className="space-y-2">
              <label className="block text-[12px] font-medium indigo-500/60">Status</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm indigo-500 outline-none cursor-pointer"
              >
                {VALID_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Admin note */}
            <div className="space-y-2">
              <label className="block text-[12px] font-medium indigo-500/60">Admin Response</label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
                placeholder="Add a note for this update…"
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm indigo-500 outline-none resize-none"
              />
            </div>

            {/* Bottom row */}
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              {/* Current details */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] indigo-500/35 mb-2">
                  Current request details
                </p>
                <p className="text-sm indigo-500/60 leading-relaxed">{selectedItem.details}</p>
              </div>

              {/* Preview + save */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] indigo-500/35 mb-2">
                    Selected status
                  </p>
                  <StatusBadge status={statusUpdate} />
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold indigo-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Save status
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Assign modal ── */}
      {showAssignDialog && assignTarget && (
        <AssignModal
          item={assignTarget}
          technicians={technicians}
          techniciansLoading={techniciansLoading}
          assigning={assigning}
          onClose={() => {
            setShowAssignDialog(false);
            setAssignTarget(null);
          }}
          onAssign={handleAssignTechnician}
        />
      )}
    </div>
  );
}