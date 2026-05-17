import { useState, useEffect, useCallback } from "react";

// ─── Config ────────────────────────────────────────────────────────────────
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/admin/biders`;
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken") || "YOUR_TOKEN_HERE"}`,
});

// ─── Mock data ──────────────────────────────────────────────────────────────
const MOCK_STATS = {
  totalBiders: 128,
  pendingBiders: 14,
  approvedBiders: 104,
  rejectedBiders: 10,
  approvalRate: "91.2",
  recentApprovalsLast7Days: 7,
};

const MOCK_BIDERS = Array.from({ length: 14 }, (_, i) => ({
  _id: `bdr_${i}`,
  firstName: ["Alice","Bob","Carol","David","Eva","Frank","Grace","Henry","Iris","Jake","Kim","Leo","Maya","Nina"][i],
  lastName:  ["Smith","Jones","White","Brown","Clark","Lewis","Hall","Young","King","Scott","Green","Adams","Baker","Hill"][i],
  email: `user${i + 1}@example.com`,
  phone: `+91 98${String(10000000 + i * 1234567).slice(0, 8)}`,
  status: ["pending","approved","approved","approved","rejected","pending"][i % 6],
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

// ─── API helper ─────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { headers: getHeaders(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── Avatar gradients (from Telecaller) ────────────────────────────────────
const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500',      'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',     'from-teal-500 to-cyan-500',
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
      <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
      <div className="flex items-center justify-between mb-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
        <span className="text-white/20 text-xs font-medium">{sub}</span>
      </div>
      <p className="text-white text-2xl font-bold tracking-tight">{value ?? "—"}</p>
      <p className="text-white/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
       
    pending:  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
    approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    rejected: { bg: 'bg-rose-500/15',    text: 'text-rose-400',    dot: 'bg-rose-400'    },
  };
  const s = map[status] ?? { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function Avatar({ firstName, lastName, idx = 0 }) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const grad = avatarGradients[idx % avatarGradients.length];
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function Toast({ message, type, visible }) {
  if (!visible) return null;
  const bg = type === "error" ? "bg-rose-500" : "bg-teal-500";
  return (
    <div className={`fixed bottom-5 right-5 z-50 ${bg} text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl transition-all`}>
      {message}
    </div>
  );
}

function RejectModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [error, setError]   = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) { setError("Rejection reason is required."); return; }
    onConfirm(reason.trim());
    setReason(""); setError("");
  };
  const handleClose = () => { setReason(""); setError(""); onClose(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-gray-900 border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-1">Reject Bider</h3>
        <p className="text-white/40 text-sm mb-4">Provide a reason — it will be sent to the bider.</p>
        <textarea
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white/70 text-sm placeholder-white/20 resize-none min-h-[80px] outline-none focus:border-rose-500/50"
          placeholder="Enter rejection reason…"
          value={reason}
          onChange={e => { setReason(e.target.value); setError(""); }}
        />
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={handleClose} className="px-4 py-2 text-sm rounded-xl bg-white/[0.05] text-white/60 hover:bg-white/[0.08] transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 text-sm rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── BiderDetailModal (drop-in replacement) ────────────────────────────────
// Displays ALL fields returned by the API response in a tabbed, sectioned modal.
// Replace the existing BiderDetailModal function in AdminBiderManagement.jsx

function BiderDetailModal({ open, onClose, biderId, biderIdx }) {
  const [bider, setBider]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState("profile"); // "profile" | "kyc" | "bank"

  useEffect(() => {
    if (!open || !biderId) return;
    setTab("profile");
    setLoading(true);
    apiFetch(`${BASE_URL}/${biderId}`)
      .then(d => setBider(d.data))
      .catch(() => setBider(MOCK_BIDERS.find(b => b._id === biderId) ?? null))
      .finally(() => setLoading(false));
  }, [open, biderId]);

  if (!open) return null;

  // ── helpers ──
  const fmt = (v) => (v && v !== "" ? v : "—");
  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const Field = ({ label, value }) => (
    <div className="flex justify-between items-start gap-4 border-b border-white/[0.05] py-2 last:border-0">
      <dt className="text-white/35 text-xs shrink-0 w-36">{label}</dt>
      <dd className="text-white/75 text-xs font-medium text-right break-all">{value}</dd>
    </div>
  );

  const DocImage = ({ label, url }) => {
    if (!url || url === "") return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] h-28 gap-2">
        <svg className="w-5 h-5 text-white/15" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18M3 8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v7.5"/>
        </svg>
        <span className="text-white/20 text-[10px]">{label} not uploaded</span>
      </div>
    );
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
        <img
          src={url} alt={label}
          className="w-full h-28 object-cover rounded-xl border border-white/[0.07] group-hover:border-teal-500/40 transition-all"
        />
        <p className="text-white/30 text-[10px] text-center mt-1 group-hover:text-teal-400 transition-colors">{label} · tap to open</p>
      </a>
    );
  };

  const tabs = [
    { key: "profile", label: "Profile & Business" },
    { key: "kyc",     label: "KYC Documents"      },
    { key: "bank",    label: "Bank Details"        },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-white/[0.1] rounded-2xl w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-6 h-6 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-white/30 text-sm">Loading bider details…</p>
            </div>
          </div>
        ) : bider ? (
          <>
            {/* Header bar */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar firstName={bider.firstName} lastName={bider.lastName} idx={biderIdx} />
                  <div>
                    <p className="font-semibold text-white/90 text-sm leading-tight">
                      {bider.firstName} {bider.lastName || ""}
                    </p>
                    <p className="text-white/35 text-xs mt-0.5">{bider.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusBadge status={bider.status} />
                      {bider.bidderCode && (
                        <span className="text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full">
                          {bider.bidderCode}
                        </span>
                      )}
                      {bider.is_registered && (
                        <span className="text-[10px] font-semibold bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full">
                          Registered
                        </span>
                      )}
                      {bider.is_payment && (
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                          Payment Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Wallet",   value: `₹${(bider.walletAmount ?? 0).toLocaleString("en-IN")}`, accent: "text-emerald-400" },
                  { label: "Phone",    value: bider.phone || "—",              accent: "text-white/70"   },
                  { label: "District", value: fmt(bider.district),             accent: "text-white/70"   },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.05]">
                    <p className={`text-xs font-semibold truncate ${s.accent}`}>{s.value}</p>
                    <p className="text-white/25 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 border-b border-white/[0.06] pb-0">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 text-[11px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                    tab === t.key
                      ? "border-teal-500 text-teal-400 bg-teal-500/5"
                      : "border-transparent text-white/30 hover:text-white/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* ── Profile & Business tab ── */}
              {tab === "profile" && (
                <>
                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">Account Info</p>
                    <dl className="space-y-0">
                      <Field label="Full Name"    value={`${bider.firstName} ${bider.lastName || ""}`.trim()} />
                      <Field label="Email"        value={fmt(bider.email)} />
                      <Field label="Phone"        value={fmt(bider.phone)} />
                      <Field label="Role"         value={fmt(bider.role)} />
                      <Field label="Active"       value={bider.isActive ? "Yes" : "No"} />
                      <Field label="Registered At" value={fmtDate(bider.createdAt)} />
                      <Field label="Last Updated" value={fmtDate(bider.updatedAt)} />
                    </dl>
                  </section>

                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">Approval Info</p>
                    <dl className="space-y-0">
                      <Field label="Status"        value={bider.status} />
                      <Field label="Approved At"   value={fmtDate(bider.approvedAt)} />
                      <Field
                        label="Approved By"
                        value={
                          bider.approvedBy
                            ? `${bider.approvedBy.firstName} ${bider.approvedBy.lastName} (${bider.approvedBy.email})`
                            : "—"
                        }
                      />
                      <Field label="Rejection Reason" value={fmt(bider.rejectionReason)} />
                    </dl>
                  </section>

                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">Business Info</p>
                    <dl className="space-y-0">
                      <Field label="Business Name"    value={fmt(bider.businessName)} />
                      <Field label="Business Address" value={fmt(bider.businessAddress)} />
                      <Field label="GST Number"       value={fmt(bider.gstNumber)} />
                      <Field label="Udyam Number"     value={fmt(bider.udyamNumber)} />
                      <Field label="Bidder Code"      value={fmt(bider.bidderCode)} />
                      <Field label="District"         value={fmt(bider.district)} />
                    </dl>
                  </section>

                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">Wallet & Payment</p>
                    <dl className="space-y-0">
                      <Field label="Wallet Amount"  value={`₹${(bider.walletAmount ?? 0).toLocaleString("en-IN")}`} />
                      <Field label="Payment Done"   value={bider.is_payment ? "Yes" : "No"} />
                      <Field label="Is Registered"  value={bider.is_registered ? "Yes" : "No"} />
                    </dl>
                  </section>
                </>
              )}

              {/* ── KYC Documents tab ── */}
              {tab === "kyc" && (
                <>
                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">Identity Numbers</p>
                    <dl className="space-y-0">
                      <Field label="Aadhaar Number" value={fmt(bider.aadhaarNumber)} />
                      <Field label="PAN Number"     value={fmt(bider.panNumber)} />
                    </dl>
                  </section>

                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-3">Aadhaar Card</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DocImage label="Aadhaar Front" url={bider.aadhaarFrontImage} />
                      <DocImage label="Aadhaar Back"  url={bider.aadhaarBackImage} />
                    </div>
                  </section>

                  <section>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-3">PAN Card</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DocImage label="PAN Card" url={bider.panCardImage} />
                      <DocImage label="Cancel Cheque" url={bider.cancelChequeImage} />
                    </div>
                  </section>
                </>
              )}

              {/* ── Bank Details tab ── */}
              {tab === "bank" && (
                <section>
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">Bank Account</p>
                  {bider.bankDetails?.accountNumber ? (
                    <>
                      {/* Bank card visual */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900/60 to-teal-900/40 border border-white/[0.08] p-4 mb-4">
                        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-teal-500/10 blur-2xl" />
                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Bank Account</p>
                        <p className="text-white/85 text-base font-bold tracking-widest font-mono">
                          {bider.bankDetails.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
                        </p>
                        <p className="text-white/50 text-xs mt-1">{fmt(bider.bankDetails.accountHolderName)}</p>
                        <div className="flex justify-between items-end mt-4">
                          <div>
                            <p className="text-white/25 text-[9px] uppercase">Bank</p>
                            <p className="text-white/60 text-xs font-semibold">{fmt(bider.bankDetails.bankName)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/25 text-[9px] uppercase">IFSC</p>
                            <p className="text-white/60 text-xs font-mono font-semibold">{fmt(bider.bankDetails.ifscCode)}</p>
                          </div>
                        </div>
                      </div>
                      <dl className="space-y-0">
                        <Field label="Account Holder" value={fmt(bider.bankDetails.accountHolderName)} />
                        <Field label="Bank Name"       value={fmt(bider.bankDetails.bankName)} />
                        <Field label="Account Number"  value={fmt(bider.bankDetails.accountNumber)} />
                        <Field label="IFSC Code"       value={fmt(bider.bankDetails.ifscCode)} />
                        <Field label="Branch Name"     value={fmt(bider.bankDetails.branchName)} />
                      </dl>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-white/[0.06] rounded-xl bg-white/[0.02]">
                      <svg className="w-8 h-8 text-white/15 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
                      </svg>
                      <p className="text-white/25 text-sm font-medium">No bank details added yet</p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-xl bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white/70 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-white/30 text-sm">Bider not found.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 text-sm rounded-xl bg-white/[0.05] text-white/50 hover:bg-white/[0.08]">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function AdminBiderManagement() {
  const [stats, setStats]           = useState(null);
  const [biders, setBiders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected]     = useState(new Set());
  const [rejectModal, setRejectModal]   = useState({ open: false, biderId: null });
  const [detailModal, setDetailModal]   = useState({ open: false, biderId: null, idx: 0 });
  const [toast, setToast]           = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch(`${BASE_URL}/stats/overview`);
      setStats(data.data);
    } catch { setStats(MOCK_STATS); }
  }, []);

  const loadBiders = useCallback(async (pg = 1) => {
    setLoading(true);
    setSelected(new Set());
    const url = `${BASE_URL}/bidder?page=${pg}&limit=${limit}${statusFilter ? `&status=${statusFilter}` : ""}`;
    try {
      const data = await apiFetch(url);
      setBiders(data.data ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalCount(data.pagination?.total ?? (data.data?.length ?? 0));
      setPage(pg);
    } catch {
      setBiders(MOCK_BIDERS);
      setTotalPages(1);
      setTotalCount(MOCK_BIDERS.length);
    } finally { setLoading(false); }
  }, [statusFilter, limit]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadBiders(1); }, [statusFilter, limit]);

  const refresh = () => { loadStats(); loadBiders(page); };

  const filtered = biders.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) || b.email.toLowerCase().includes(q);
  });

  const pendingFiltered = filtered.filter(b => b.status === "pending");

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = (checked) =>
    setSelected(checked ? new Set(pendingFiltered.map(b => b._id)) : new Set());

  const approveSingle = async (biderId) => {
    try {
      await apiFetch(`${BASE_URL}/${biderId}/approve`, { method: "PUT" });
      showToast("Bider approved successfully");
      refresh();
    } catch {
      setBiders(prev => prev.map(b => b._id === biderId ? { ...b, status: "approved" } : b));
      showToast("Approved (demo mode)");
    }
  };

  const bulkApprove = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      await apiFetch(`${BASE_URL}/bulk-approve`, { method: "POST", body: JSON.stringify({ biderIds: ids }) });
      showToast(`${ids.length} biders approved`);
      refresh();
    } catch {
      setBiders(prev => prev.map(b => ids.includes(b._id) ? { ...b, status: "approved" } : b));
      setSelected(new Set());
      showToast(`${ids.length} biders approved (demo mode)`);
    }
  };

  const confirmReject = async (reason) => {
    const { biderId } = rejectModal;
    setRejectModal({ open: false, biderId: null });
    try {
      await apiFetch(`${BASE_URL}/${biderId}/reject`, { method: "PUT", body: JSON.stringify({ reason }) });
      showToast("Bider rejected");
      refresh();
    } catch {
      setBiders(prev => prev.map(b => b._id === biderId ? { ...b, status: "rejected" } : b));
      showToast("Rejected (demo mode)");
    }
  };

  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(b => selected.has(b._id));

  const filterTabs = [
    { key: "",         label: "All"      },
    { key: "pending",  label: "Pending"  },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const tabCounts = {
    "":         biders.length,
    pending:    biders.filter(b => b.status === "pending").length,
    approved:   biders.filter(b => b.status === "approved").length,
    rejected:   biders.filter(b => b.status === "rejected").length,
  };

  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold">Bider Management</h1>
        <p className="text-white/35 text-sm mt-0.5">Review, approve, and manage bider registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Biders"   value={stats?.totalBiders}              sub="All time"   accent="bg-indigo-500"
          icon={<svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Pending"        value={stats?.pendingBiders}            sub="Awaiting"   accent="bg-amber-500"
          icon={<svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Approved"       value={stats?.approvedBiders}           sub="Active"     accent="bg-emerald-500"
          icon={<svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard label="Approval Rate"  value={stats ? `${stats.approvalRate}%` : null} sub="Last 7 days" accent="bg-teal-500"
          icon={<svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        />
      </div>

      {/* Filter tabs + search + limit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-max">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/40'
                }`}>
                  {tabCounts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-white/70 text-sm placeholder-white/20 outline-none focus:border-teal-500/50 focus:bg-white/[0.06] transition-all duration-200"
            />
          </div>
          {/* Limit */}
          <select
            value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-white/60 text-sm outline-none focus:border-teal-500/50 transition-all"
          >
            <option value={10} className="bg-gray-900">10 / page</option>
            <option value={25} className="bg-gray-900">25 / page</option>
            <option value={50} className="bg-gray-900">50 / page</option>
          </select>
          {/* Refresh */}
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.49-4.49M20 15a9 9 0 01-15.49 4.49"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-3 text-sm text-teal-400 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="font-semibold">{selected.size} selected</span>
          <button
            onClick={bulkApprove}
            className="ml-2 px-3 py-1 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Approve selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1 border border-teal-500/30 rounded-lg text-xs text-teal-400 hover:bg-teal-500/10 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Headers */}
            <div className="grid grid-cols-[40px_2fr_2fr_1.2fr_1fr_1fr_160px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={e => toggleSelectAll(e.target.checked)}
                  className="rounded accent-teal-500 cursor-pointer"
                />
              </div>
              {['Name', 'Email', 'Phone', "payment_status",'Status', 'Registered', 'Actions'].map(h => (
                <span key={h} className="text-white/25 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="divide-y divide-white/[0.04]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[40px_2fr_2fr_1.2fr_1fr_1fr_160px] gap-4 px-5 py-4 items-center animate-pulse">
                    <div className="w-4 h-4 bg-white/10 rounded" />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="h-3 bg-white/10 rounded w-28" />
                    </div>
                    <div className="h-3 bg-white/10 rounded w-36" />
                    <div className="h-3 bg-white/10 rounded w-24" />
                    <div className="h-5 bg-white/10 rounded-full w-20" />
                    <div className="h-3 bg-white/10 rounded w-20" />
                    <div className="flex gap-2">
                      <div className="h-7 bg-white/10 rounded-lg w-20" />
                      <div className="h-7 bg-white/10 rounded-lg w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="text-white/30 text-sm font-medium">No biders found</p>
                {statusFilter && (
                  <button onClick={() => setStatusFilter("")} className="mt-3 text-teal-400 text-xs hover:text-teal-300 transition-colors">
                    Show all biders
                  </button>
                )}
              </div>
            )}

            {/* Rows */}
            {!loading && filtered.map((b, idx) => {
              const isPending = b.status === "pending";
              const date = new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <div
                  key={b._id}
                  className="grid grid-cols-[40px_2fr_2fr_1.2fr_1fr_1fr_160px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 items-center group"
                >
                  {/* Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      disabled={!isPending}
                      checked={selected.has(b._id)}
                      onChange={() => toggleSelect(b._id)}
                      className="rounded accent-teal-500 cursor-pointer disabled:opacity-30"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <button
                      onClick={() => setDetailModal({ open: true, biderId: b._id, idx })}
                      className="flex items-center gap-2 group/name text-left"
                    >
                      <Avatar firstName={b.firstName} lastName={b.lastName} idx={idx} />
                      <span className="text-white/85 text-sm font-medium group-hover/name:text-teal-400 transition-colors">
                        {b.firstName} {b.lastName}
                      </span>
                    </button>
                  </div>

                  {/* Email */}
                  <div className="text-white/40 text-sm truncate">{b.email}</div>

                  {/* Phone */}
                  <div className="text-white/40 text-sm">{b.phone || "—"}</div>

                  {console.log(b.is_payment)} 
                  {/* Payment Status */}
                  <div className="text-white/30 text-xs"> {b.is_payment} </div>

                  {/* Status */}
                  <div><StatusBadge status={b.status} /></div>

                  {/* Registered */}
                  <div className="text-white/30 text-xs">{date}</div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => approveSingle(b._id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-[11px] font-semibold rounded-lg transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, biderId: b._id })}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-semibold rounded-lg transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-white/20 text-xs italic">
                        {b.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                <span className="text-white/25 text-xs">
                  Showing {filtered.length} of {totalCount} biders
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadBiders(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => loadBiders(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                        p === page
                          ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/25'
                          : 'bg-white/[0.04] border-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => loadBiders(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && totalPages <= 1 && (
              <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
                <span className="text-white/25 text-xs">
                  Showing {filtered.length} of {totalCount} biders
                  {statusFilter && ` · filtered by "${statusFilter}"`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RejectModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, biderId: null })}
        onConfirm={confirmReject}
      />
      <BiderDetailModal
        open={detailModal.open}
        biderId={detailModal.biderId}
        biderIdx={detailModal.idx}
        onClose={() => setDetailModal({ open: false, biderId: null, idx: 0 })}
      />

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </div>
  );
}