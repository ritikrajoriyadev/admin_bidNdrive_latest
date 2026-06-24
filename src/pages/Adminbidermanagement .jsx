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

const MOCK_BIDERS_ALL = Array.from({ length: 38 }, (_, i) => ({
  _id: `bdr_${i}`,
  businessName: ["TechCorp", "BizHub", "TradeLink", "MarketPro", "SalesEdge", "QuickDeal", "BidMaster", "SwiftTrade"][i % 8],
  firstName: ["Alice", "Bob", "Carol", "David", "Eva", "Frank", "Grace", "Henry", "Iris", "Jake", "Kim", "Leo", "Maya", "Nina"][i % 14],
  lastName: ["Smith", "Jones", "White", "Brown", "Clark", "Lewis", "Hall", "Young", "King", "Scott", "Green", "Adams", "Baker", "Hill"][i % 14],
  email: `user${i + 1}@example.com`,
  phone: `+91 98${String(10000000 + i * 1234567).slice(0, 8)}`,
  status: ["pending", "approved", "approved", "approved", "rejected", "pending"][i % 6],
  is_payment: i % 3 !== 0,
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

// ─── API helper ─────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { headers: getHeaders(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── CSV Export helper ───────────────────────────────────────────────────────
function exportToCSV(
  data,
  filename = "bidders.csv"
) {
  if (!Array.isArray(data) || !data.length) return;

  const headers = [
    "Bidder ID",
    "Business Name",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Status",
    "Payment Status",
    "Registered Date",
  ];

  const rows = data.map((b) => [
    b.bidderCode || "",
    b.businessName || "",
    b.firstName || "",
    b.lastName || "",
    b.email || "",
    b.phone || "",
    b.status || "",
    b.is_payment ? "Paid" : "Unpaid",
    b.createdAt
      ? new Date(b.createdAt).toLocaleDateString(
          "en-IN"
        )
      : "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Avatar gradients ───────────────────────────────────────────────────────
const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500', 'from-teal-500 to-cyan-500',
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accentBg, accentText, sub }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group">
      <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accentBg}`} />
      <div className="flex items-center justify-between mb-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentBg} bg-opacity-10`}>{icon}</span>
        <span className="text-gray-400 text-xs font-medium">{sub}</span>
      </div>
      <p className="text-gray-800 text-2xl font-bold tracking-tight">{value ?? "—"}</p>
      <p className="text-gray-400 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', border: 'border-amber-200' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400', border: 'border-emerald-200' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400', border: 'border-rose-200' },
  };
  const s = map[status] ?? { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
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
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) { setError("Rejection reason is required."); return; }
    onConfirm(reason.trim());
    setReason(""); setError("");
  };
  const handleClose = () => { setReason(""); setError(""); onClose(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-gray-800 font-bold text-lg mb-1">Reject Bider</h3>
        <p className="text-gray-400 text-sm mb-4">Provide a reason — it will be sent to the bider.</p>
        <textarea
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm resize-none min-h-[80px] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
          placeholder="Enter rejection reason…"
          value={reason}
          onChange={e => { setReason(e.target.value); setError(""); }}
        />
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={handleClose} className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleConfirm} className="px-4 py-2 text-sm rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors">Reject</button>
        </div>
      </div>
    </div>
  );
}

function BiderDetailModal({ open, onClose, biderId, biderIdx }) {
  const [bider, setBider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    if (!open || !biderId) return;
    setTab("profile");
    setLoading(true);
    apiFetch(`${BASE_URL}/${biderId}`)
      .then(d => setBider(d.data))
      .catch(() => setBider(MOCK_BIDERS_ALL.find(b => b._id === biderId) ?? null))
      .finally(() => setLoading(false));
  }, [open, biderId]);

  if (!open) return null;

  const fmt = (v) => (v && v !== "" ? v : "—");
  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const Field = ({ label, value }) => (
    <div className="flex justify-between items-start gap-4 border-b border-gray-100 py-2 last:border-0">
      <dt className="text-gray-400 text-xs shrink-0 w-36">{label}</dt>
      <dd className="text-gray-600 text-xs font-medium text-right break-all">{value}</dd>
    </div>
  );

  const DocImage = ({ label, url }) => {
    if (!url || url === "") return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 h-28 gap-2">
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18M3 8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v7.5" />
        </svg>
        <span className="text-gray-300 text-[10px]">{label} not uploaded</span>
      </div>
    );
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
        <img src={url} alt={label} className="w-full h-28 object-cover rounded-xl border border-gray-200 group-hover:border-teal-400 transition-all" />
        <p className="text-gray-400 text-[10px] text-center mt-1 group-hover:text-teal-500 transition-colors">{label} · tap to open</p>
      </a>
    );
  };

  const tabs = [
    { key: "profile", label: "Profile & Business" },
    { key: "kyc", label: "KYC Documents" },
    { key: "bank", label: "Bank Details" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-6 h-6 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-gray-400 text-sm">Loading bider details…</p>
            </div>
          </div>
        ) : bider ? (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar firstName={bider.firstName} lastName={bider.lastName} idx={biderIdx} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{bider.firstName} {bider.lastName || ""}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{bider.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusBadge status={bider.status} />
                      {bider.bidderCode && (
                        <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100">{bider.bidderCode}</span>
                      )}
                      {bider.is_registered && (
                        <span className="text-[10px] font-semibold bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">Registered</span>
                      )}
                      {bider.is_payment && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">Payment Done</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Wallet", value: `₹${(bider.walletAmount ?? 0).toLocaleString("en-IN")}`, cls: "text-emerald-600" },
                  { label: "Phone", value: bider.phone || "—", cls: "text-gray-700" },
                  { label: "District", value: fmt(bider.district), cls: "text-gray-700" },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                    <p className={`text-xs font-semibold truncate ${s.cls}`}>{s.value}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-1 px-5 pt-3 border-b border-gray-100 pb-0">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 text-[11px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${tab === t.key
                    ? "border-teal-500 text-teal-600 bg-teal-50/50"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {tab === "profile" && (
                <>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">Account Info</p>
                    <dl className="space-y-0">
                      <Field label="Full Name" value={`${bider.firstName} ${bider.lastName || ""}`.trim()} />
                      <Field label="Email" value={fmt(bider.email)} />
                      <Field label="Phone" value={fmt(bider.phone)} />
                      <Field label="Role" value={fmt(bider.role)} />
                      <Field label="Active" value={bider.isActive ? "Yes" : "No"} />
                      <Field label="Registered At" value={fmtDate(bider.createdAt)} />
                      <Field label="Last Updated" value={fmtDate(bider.updatedAt)} />
                    </dl>
                  </section>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">Approval Info</p>
                    <dl className="space-y-0">
                      <Field label="Status" value={bider.status} />
                      <Field label="Approved At" value={fmtDate(bider.approvedAt)} />
                      <Field label="Approved By" value={bider.approvedBy ? `${bider.approvedBy.firstName} ${bider.approvedBy.lastName} (${bider.approvedBy.email})` : "—"} />
                      <Field label="Rejection Reason" value={fmt(bider.rejectionReason)} />
                    </dl>
                  </section>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">Business Info</p>
                    <dl className="space-y-0">
                      <Field label="Business Name" value={fmt(bider.businessName)} />
                      <Field label="Business Address" value={fmt(bider.businessAddress)} />
                      <Field label="GST Number" value={fmt(bider.gstNumber)} />
                      <Field label="Udyam Number" value={fmt(bider.udyamNumber)} />
                      <Field label="Bidder Code" value={fmt(bider.bidderCode)} />
                      <Field label="District" value={fmt(bider.district)} />
                    </dl>
                  </section>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">Wallet & Payment</p>
                    <dl className="space-y-0">
                      <Field label="Wallet Amount" value={`₹${(bider.walletAmount ?? 0).toLocaleString("en-IN")}`} />
                      <Field label="Payment Done" value={bider.is_payment ? "Yes" : "No"} />
                      <Field label="Is Registered" value={bider.is_registered ? "Yes" : "No"} />
                    </dl>
                  </section>
                </>
              )}
              {tab === "kyc" && (
                <>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">Identity Numbers</p>
                    <dl className="space-y-0">
                      <Field label="Aadhaar Number" value={fmt(bider.aadhaarNumber)} />
                      <Field label="PAN Number" value={fmt(bider.panNumber)} />
                    </dl>
                  </section>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-3">Aadhaar Card</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DocImage label="Aadhaar Front" url={bider.aadhaarFrontImage} />
                      <DocImage label="Aadhaar Back" url={bider.aadhaarBackImage} />
                    </div>
                  </section>
                  <section>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-3">PAN Card</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DocImage label="PAN Card" url={bider.panCardImage} />
                      <DocImage label="Cancel Cheque" url={bider.cancelChequeImage} />
                    </div>
                  </section>
                </>
              )}
              {tab === "bank" && (
                <section>
                  <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">Bank Account</p>
                  {bider.bankDetails?.accountNumber ? (
                    <>
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900 to-teal-900 p-4 mb-4">
                        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-teal-500/20 blur-2xl" />
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Bank Account</p>
                        <p className="text-white/85 text-base font-bold tracking-widest font-mono">
                          {bider.bankDetails.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
                        </p>
                        <p className="text-white/50 text-xs mt-1">{fmt(bider.bankDetails.accountHolderName)}</p>
                        <div className="flex justify-between items-end mt-4">
                          <div>
                            <p className="text-white/30 text-[9px] uppercase">Bank</p>
                            <p className="text-white/70 text-xs font-semibold">{fmt(bider.bankDetails.bankName)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/30 text-[9px] uppercase">IFSC</p>
                            <p className="text-white/70 text-xs font-mono font-semibold">{fmt(bider.bankDetails.ifscCode)}</p>
                          </div>
                        </div>
                      </div>
                      <dl className="space-y-0">
                        <Field label="Account Holder" value={fmt(bider.bankDetails.accountHolderName)} />
                        <Field label="Bank Name" value={fmt(bider.bankDetails.bankName)} />
                        <Field label="Account Number" value={fmt(bider.bankDetails.accountNumber)} />
                        <Field label="IFSC Code" value={fmt(bider.bankDetails.ifscCode)} />
                        <Field label="Branch Name" value={fmt(bider.bankDetails.branchName)} />
                      </dl>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-gray-100 rounded-xl bg-gray-50">
                      <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      <p className="text-gray-400 text-sm font-medium">No bank details added yet</p>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">Bider not found.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination component ─────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }) {
  // Don't render until we know how many pages there are
  if (totalPages === 0) return null;

  const btnCls = (disabled) =>
    `w-8 h-8 rounded-lg bg-white border flex items-center justify-center transition-all duration-150 ${disabled
      ? "border-gray-100 text-gray-300 cursor-not-allowed opacity-40"
      : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
    }`;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
      <span className="text-gray-400 text-xs hidden sm:block">
        Page {page} of {totalPages}
      </span>

      <div className="flex items-center gap-1 mx-auto sm:mx-0">
        {/* First */}
        <button
          onClick={() => !isFirst && onPageChange(1)}
          disabled={isFirst}
          className={btnCls(isFirst)}
          title="First page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
          </svg>
        </button>

        {/* Prev */}
        <button
          onClick={() => !isFirst && onPageChange(page - 1)}
          disabled={isFirst}
          className={btnCls(isFirst)}
          title="Previous page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-300 text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => p !== page && onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all duration-150 ${p === page
                ? "bg-teal-600 border-teal-600 text-white cursor-default"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => !isLast && onPageChange(page + 1)}
          disabled={isLast}
          className={btnCls(isLast)}
          title="Next page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Last */}
        <button
          onClick={() => !isLast && onPageChange(totalPages)}
          disabled={isLast}
          className={btnCls(isLast)}
          title="Last page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function AdminBiderManagement() {
  const [stats, setStats] = useState(null);
  const [biders, setBiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [rejectModal, setRejectModal] = useState({ open: false, biderId: null });
  const [detailModal, setDetailModal] = useState({ open: false, biderId: null, idx: 0 });
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

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

  const loadBiders = useCallback(
    async (pg = 1, searchText = search) => {
      setLoading(true);
      setSelected(new Set());

      const url =
        `${BASE_URL}/bidder?page=${pg}&limit=${limit}` +
        `${statusFilter ? `&status=${statusFilter}` : ""}` +
        `${searchText ? `&search=${encodeURIComponent(searchText)}` : ""}`;

      try {
        const data = await apiFetch(url);

        setBiders(data.data || []);
        setTotalPages(
          data.pagination?.pages ||
          data.pagination?.totalPages ||
          1
        );
        setTotalCount(
          data.pagination?.total ||
          data.data?.length ||
          0
        );
        setPage(
          data.pagination?.page || pg
        );
      } catch (error) {
        console.error(error);
        setBiders([]);
        setTotalPages(0);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, limit, search]
  );

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBiders(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [statusFilter, limit, search]);

  // Stable page-change handler — always calls the latest loadBiders
  const handlePageChange = (pg) => loadBiders(pg);

  const refresh = () => { loadStats(); loadBiders(page); };

  const filtered = biders;

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
    { key: "", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const tabCounts = {
    "": totalCount,
    pending: MOCK_BIDERS_ALL.filter(b => b.status === "pending").length,
    approved: MOCK_BIDERS_ALL.filter(b => b.status === "approved").length,
    rejected: MOCK_BIDERS_ALL.filter(b => b.status === "rejected").length,
  };

  const GRID = "grid-cols-[40px_120px_180px_180px_240px_140px_110px_110px_120px_180px]";

  const COL_HEADERS = ["", "Bidder ID", "Business Name", "Name", "Email", "Phone", "Payment", "Status", "Registered", "Actions"];

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-6">

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-gray-800 text-xl font-bold">Bider Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">Review, approve, and manage bider registrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Biders" value={stats?.totalBiders} sub="All time"
            accentBg="bg-indigo-500" accentText="text-indigo-400"
            icon={<svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
          />
          <StatCard
            label="Pending" value={stats?.pendingBiders} sub="Awaiting review"
            accentBg="bg-amber-500" accentText="text-amber-400"
            icon={<svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          />
          <StatCard
            label="Approved" value={stats?.approvedBiders} sub="Active biders"
            accentBg="bg-emerald-500" accentText="text-emerald-400"
            icon={<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Approval Rate" value={stats ? `${stats.approvalRate}%` : null} sub="Last 7 days"
            accentBg="bg-teal-500" accentText="text-teal-400"
            icon={<svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>}
          />
        </div>

        {/* Filter tabs + search + limit + export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="w-full sm:w-auto overflow-x-auto pb-1">
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 w-max shadow-sm">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${statusFilter === tab.key
                    ? 'bg-teal-500 text-white shadow-sm shadow-teal-200'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {tabCounts[tab.key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-56">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, bidder code..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-gray-700 text-sm"
              />
            </div>
            <select
              value={limit} onChange={e => setLimit(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 text-sm outline-none focus:border-teal-400 transition-all shadow-sm"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.49-4.49M20 15a9 9 0 01-15.49 4.49" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => {
                exportToCSV(filtered, `biders${statusFilter ? `-${statusFilter}` : ""}.csv`);
                showToast("CSV exported successfully");
              }}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-600 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{selected.size} selected</span>
            <button onClick={bulkApprove} className="ml-2 px-3 py-1 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-xs font-semibold transition-colors">
              Approve selected
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1 border border-teal-300 rounded-lg text-xs text-teal-600 hover:bg-teal-100 transition-colors">
              Clear
            </button>
          </div>
        )}

        {/* ── TABLE CARD ─────────────────────────────────────────────────────────
            FIX: flex flex-col on the card so the footer (row count + pagination)
            is always rendered at the bottom, and overflow-x-auto is scoped only
            to the table area — NOT wrapping the pagination.
        ────────────────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col">

          {/* Scrollable table area — pagination is NOT inside this div */}
          <div className="overflow-x-auto flex-1">
            <div className="min-w-[960px]">

              {/* Column headers */}
              <div className={`grid ${GRID} gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50`}>
                {COL_HEADERS.map((h, i) => (
                  <div key={i} className="flex items-center">
                    {i === 0 ? (
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={e => toggleSelectAll(e.target.checked)}
                        className="rounded accent-teal-500 cursor-pointer"
                      />
                    ) : (
                      <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{h}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Skeleton loader */}
              {loading && (
                <div className="divide-y divide-gray-50">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`grid ${GRID} gap-3 px-5 py-4 items-center animate-pulse`}>
                      <div className="w-4 h-4 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="h-3 bg-gray-100 rounded w-24" />
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-20" />
                      <div className="h-5 bg-gray-100 rounded-full w-14" />
                      <div className="h-5 bg-gray-100 rounded-full w-16" />
                      <div className="h-3 bg-gray-100 rounded w-16" />
                      <div className="flex gap-2">
                        <div className="h-7 bg-gray-100 rounded-lg w-20" />
                        <div className="h-7 bg-gray-100 rounded-lg w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No biders found</p>
                  {statusFilter && (
                    <button onClick={() => setStatusFilter("")} className="mt-3 text-teal-500 text-xs hover:text-teal-400 transition-colors">
                      Show all biders
                    </button>
                  )}
                </div>
              )}

              {/* Data rows */}
              {!loading && filtered.map((b, idx) => {
                const isPending = b.status === "pending";
                const date = new Date(b.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                });
                return (
                  <div
                    key={b._id}
                    className={`grid ${GRID} gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors duration-150 items-center group`}
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
                    <div
                      className="text-gray-700 text-sm font-medium truncate cursor-pointer hover:text-teal-600 transition-colors"
                      onClick={() => setDetailModal({ open: true, biderId: b._id, idx })}
                    >
                      {b.bidderCode || "—"}
                    </div>
                    {/* Business Name */}
                    <div
                      className="text-gray-700 text-sm font-medium truncate cursor-pointer hover:text-teal-600 transition-colors"
                      onClick={() => setDetailModal({ open: true, biderId: b._id, idx })}
                    >
                      {b.businessName || "—"}
                    </div>
                    {/* Avatar + Name */}
                    <button
                      onClick={() => setDetailModal({ open: true, biderId: b._id, idx })}
                      className="flex items-center gap-2 text-left group/name"
                    >
                      <Avatar firstName={b.firstName} lastName={b.lastName} idx={idx} />
                      <span className="text-gray-700 text-sm font-medium group-hover/name:text-teal-600 transition-colors truncate">
                        {b.firstName} {b.lastName}
                      </span>
                    </button>
                    {/* Email */}
                    <div className="text-gray-400 text-sm truncate">{b.email}</div>
                    {/* Phone */}
                    <div className="text-gray-400 text-sm">{b.phone || "—"}</div>
                    {/* Payment */}
                    <div>
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${b.is_payment
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}>
                        {b.is_payment ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    {/* Status */}
                    <div><StatusBadge status={b.status} /></div>
                    {/* Registered date */}
                    <div className="text-gray-400 text-xs">{date}</div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">

                      {/* APPROVE BUTTON */}
                      {(b.status === "pending" ||
                        b.status === "rejected") && (
                          <button
                            onClick={() => approveSingle(b._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200 text-[11px] font-semibold rounded-lg transition-all"
                          >
                            <svg
                              className="w-3 h-3"
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
                            Approve
                          </button>
                        )}

                      {/* REJECT BUTTON */}
                      {(b.status === "pending" ||
                        b.status === "approved") && (
                          <button
                            onClick={() =>
                              setRejectModal({
                                open: true,
                                biderId: b._id,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200 text-[11px] font-semibold rounded-lg transition-all"
                          >
                            <svg
                              className="w-3 h-3"
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
                            Reject
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* ── END scrollable area ── */}

          {/* ── CARD FOOTER: row count + pagination — always at the bottom ──
              These two elements sit OUTSIDE overflow-x-auto, so they:
              - Never get clipped or hidden behind a scroll container
              - Always stick to the bottom edge of the card
              - Remain fully visible on narrow/mobile screens
          ── */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-2 border-t border-gray-100 bg-gray-50/40 flex items-center">
              <span className="text-gray-400 text-xs">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount} biders
                {statusFilter && ` · filtered by "${statusFilter}"`}
              </span>
            </div>
          )}

          {!loading && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}

        </div>
        {/* ── END TABLE CARD ── */}

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

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </div>
  );
}