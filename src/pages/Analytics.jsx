import { useState, useEffect, useCallback } from "react";
import analyticsService from '../services/analyticsService';

/* ─────────────────────────────────────────────
   MOCK FALLBACK DATA
───────────────────────────────────────────── */
const REVENUE_DATA = {
  "7d": [42, 58, 37, 81, 63, 95, 74],
  "30d": [30, 45, 52, 38, 67, 72, 55, 81, 48, 90, 77, 65, 88, 73, 60, 95, 82, 70, 87, 64, 78, 93, 58, 84, 71, 96, 69, 88, 75, 92],
  "90d": [55, 62, 48, 75, 83, 70, 91, 65, 78, 87, 72, 95, 68, 80, 88, 74, 92, 66, 79, 85, 71, 90, 63, 82, 77, 94, 69, 86, 73, 97, 60, 83, 76, 91, 64, 78, 88, 73, 95, 67, 81, 86, 70, 92, 65, 79, 87, 72, 94, 68, 83, 77, 90, 63, 85, 76, 93, 70, 88, 74],
};

const TOP_PAGES = [
  { path: "/shop/sneakers", views: 14820, bounce: "28%", change: +18 },
  { path: "/checkout", views: 9310, bounce: "12%", change: +5 },
  { path: "/collections/new", views: 7640, bounce: "41%", change: -3 },
  { path: "/about", views: 4210, bounce: "55%", change: +2 },
  { path: "/account/orders", views: 3870, bounce: "19%", change: +11 },
];

const TRAFFIC_SOURCES = [
  { label: "Organic Search", value: 38, color: "#6366f1", barColor: "bg-indigo-500" },
  { label: "Direct",         value: 24, color: "#f59e0b", barColor: "bg-amber-400"  },
  { label: "Social",         value: 19, color: "#10b981", barColor: "bg-emerald-500"},
  { label: "Referral",       value: 12, color: "#a78bfa", barColor: "bg-violet-400" },
  { label: "Email",          value: 7,  color: "#f43f5e", barColor: "bg-rose-500"   },
];

const RECENT_EVENTS = [
  { msg: "New order #ORD-8821 — ₹4,290",          time: "2m ago",  dotClass: "bg-emerald-500" },
  { msg: "New user registered (Priya S.)",          time: "11m ago", dotClass: "bg-indigo-500" },
  { msg: "Cart abandonment spike +14%",             time: "28m ago", dotClass: "bg-amber-500"  },
  { msg: "New order #ORD-8820 — ₹1,850",           time: "34m ago", dotClass: "bg-emerald-500" },
  { msg: "Bounce rate on /collections raised",      time: "1h ago",  dotClass: "bg-rose-500"   },
  { msg: "New user registered (Rohan M.)",          time: "1h ago",  dotClass: "bg-indigo-500" },
  { msg: "New order #ORD-8819 — ₹9,100",           time: "2h ago",  dotClass: "bg-emerald-500" },
];

const GEO_DATA = [
  { city: "Mumbai",    sessions: 8420, pct: 100 },
  { city: "Delhi",     sessions: 6310, pct: 75  },
  { city: "Bangalore", sessions: 5180, pct: 62  },
  { city: "Hyderabad", sessions: 3240, pct: 38  },
  { city: "Chennai",   sessions: 2090, pct: 25  },
  { city: "Others",    sessions: 1040, pct: 12  },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function buildChartData(revenueArray, range) {
  if (!revenueArray || revenueArray.length === 0) return REVENUE_DATA[range];
  const values = revenueArray.map(d => d.revenue || 0);
  if (values.length === 0) return REVENUE_DATA[range];
  return values;
}

/* ─────────────────────────────────────────────
   SVG SPARKLINE
───────────────────────────────────────────── */
function Sparkline({ data, color = "#6366f1", height = 44 }) {
  const W = 280, H = height;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / rng) * (H - 6) - 3;
    return `${x},${y}`;
  });
  const line = "M " + pts.join(" L ");
  const area = `${line} L ${W},${H} L 0,${H} Z`;
  const id = `spk${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   DONUT
───────────────────────────────────────────── */
function Donut({ data, size = 148 }) {
  const r = 44, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`} opacity="0.9" />
        );
        offset += dash;
        return el;
      })}
      {/* White donut hole */}
      <circle cx={cx} cy={cy} r={r - 7} fill="white" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   RADIAL RING
───────────────────────────────────────────── */
function Ring({ pct, color, icon }) {
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 28 28)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg">{icon}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BAR CHART
───────────────────────────────────────────── */
function BarChart({ data }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[3px] h-28">
      {data.map((v, i) => {
        const pct  = (v / max) * 100;
        const last = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex items-end group cursor-pointer"
            title={`₹${(v * 2000).toLocaleString("en-IN")}`}>
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${
                last
                  ? "bg-gradient-to-t from-indigo-600 to-indigo-400 opacity-100"
                  : "bg-gradient-to-t from-indigo-300 to-indigo-200 opacity-80 group-hover:opacity-100 group-hover:from-indigo-500 group-hover:to-indigo-300"
              }`}
              style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({ label, value, sub, change, color, sparkData, icon, delay }) {
  const up = change >= 0;
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300"
      style={{ animation: `fadeUp 0.5s ease both`, animationDelay: delay }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1.5">{label}</p>
          <p className="text-[26px] font-bold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'DM Mono',monospace" }}>
            {value}
          </p>
          {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${color}18` }}>
          {icon}
        </div>
      </div>
      {sparkData && (
        <div className="-mx-1 mb-3 relative z-10">
          <Sparkline data={sparkData} color={color} height={38} />
        </div>
      )}
      <div className="relative z-10 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            background: up ? "rgba(16,185,129,0.10)" : "rgba(244,63,94,0.10)",
            color:      up ? "#059669"                : "#e11d48",
          }}>
          {up ? "▲" : "▼"} {Math.abs(change)}%
        </span>
        <span className="text-[11px] text-slate-400">vs last period</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 animate-pulse">
      <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
      <div className="h-8 w-32 bg-slate-200 rounded mb-4" />
      <div className="h-10 bg-slate-100 rounded mb-3" />
      <div className="h-4 w-20 bg-slate-200 rounded" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────── */
function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{children}</h2>
      {action && (
        <button className="text-[11px] text-indigo-600 hover:text-indigo-700 transition-colors bg-transparent border-none cursor-pointer font-semibold">
          {action}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANALYTICS PAGE
───────────────────────────────────────────── */
export default function Analytics() {
  const [range,      setRange]      = useState("30d");
  const [activeTab,  setActiveTab]  = useState("overview");
  const [filterType, setFilterType] = useState("month");

  const [dashData,    setDashData]    = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [perfData,    setPerfData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const rangeToFilter = { "7d": "week", "30d": "month", "90d": "year" };

  const loadAll = useCallback((ft) => {
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsService.fetchDashboard({ filterType: ft }),
      analyticsService.fetchRevenue({ filterType: "monthly" }),
      analyticsService.fetchPerformance({ filterType: ft }),
    ])
      .then(([dash, rev, perf]) => {
        setDashData(dash?.data ?? dash);
        setRevenueData(rev);
        setPerfData(perf);
      })
      .catch(err => setError(err?.response?.data?.message || err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ft = rangeToFilter[range] || "month";
    setFilterType(ft);
    loadAll(ft);
  }, [range]); // eslint-disable-line

  const summary     = dashData?.summary || {};
  const bidding     = dashData?.bidding || {};
  const revenue     = dashData?.revenue || {};
  const topBidders  = dashData?.topBiders || [];
  const perfMetrics = perfData?.metrics || {};

  const revArray  = revenueData?.data || [];
  const chartData = revArray.length ? buildChartData(revArray, range) : REVENUE_DATA[range];
  const totalRev  = revenueData?.summary?.totalRevenue ?? revenue.totalRevenue ?? 0;

  const TABS = ["overview", "traffic", "conversions", "realtime"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');
        * { font-family:'DM Sans',system-ui,sans-serif; box-sizing:border-box; }
        .font-mono { font-family:'DM Mono',monospace !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .live-pulse { animation:livePulse 2s ease-in-out infinite; }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-slate-800">Analytics</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time store performance</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Live pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="live-pulse w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-600">Live</span>
            </div>
            {/* Range picker */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 gap-0.5">
              {["7d", "30d", "90d"].map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    range === r
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            {/* Refresh */}
            <button onClick={() => loadAll(filterType)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
            {/* Export */}
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <nav className="border-b border-slate-200 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto flex gap-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-3.5 text-xs font-semibold capitalize border-b-2 -mb-px transition-all ${
                activeTab === t
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="max-w-[1400px] mx-auto px-6 py-7 space-y-5">

        {/* ERROR BANNER */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3">
            <span className="text-rose-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-rose-600">Failed to load analytics</p>
              <p className="text-xs text-slate-400 mt-0.5">{error} — showing cached data</p>
            </div>
            <button onClick={() => loadAll(filterType)}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold border border-rose-200 px-3 py-1.5 rounded-lg transition-colors hover:bg-rose-100">
              Retry
            </button>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KpiCard label="Total Revenue"     value={`₹${totalRev.toLocaleString("en-IN")}`}                       sub="This period"                              change={18} color="#6366f1" icon="💰" sparkData={chartData}          delay="60ms"  />
              <KpiCard label="Active Bidders"    value={(summary.activeBiders ?? 0).toLocaleString()}                  sub={`${summary.totalBiders ?? 0} total`}      change={6}  color="#10b981" icon="👥" sparkData={chartData.slice(-14)} delay="120ms" />
              <KpiCard label="Total Auctions"    value={(summary.totalAuctions ?? 0).toLocaleString()}                 sub={`${summary.activeAuctions ?? 0} active`}  change={4}  color="#f59e0b" icon="🏁" sparkData={chartData.slice(-14)} delay="180ms" />
              <KpiCard label="Avg Auction Price" value={`₹${(bidding.averageAuctionPrice ?? 0).toLocaleString("en-IN")}`} sub={`${bidding.totalBids ?? 0} total bids`} change={9}  color="#a78bfa" icon="🛒" sparkData={chartData.slice(-14)} delay="240ms" />
            </>
          )}
        </div>

        {/* REVENUE CHART + TRAFFIC SOURCES */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "150ms" }}>

          {/* Revenue bar chart */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <SectionTitle>Revenue Over Time</SectionTitle>
            <div className="flex flex-wrap items-end gap-4 mb-5">
              <p className="text-[28px] font-bold tracking-tight leading-none font-mono text-slate-800">
                ₹{totalRev.toLocaleString("en-IN")}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-0.5">
                ▲ {revenueData?.summary?.totalTransactions ?? 0} transactions
              </span>
            </div>
            {loading ? (
              <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <BarChart data={chartData} />
            )}
            <div className="flex justify-between mt-2">
              {(range === "7d"
                ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
                : ["Week 1","Week 2","Week 3","Week 4"]
              ).map(d => <span key={d} className="text-[10px] text-slate-300">{d}</span>)}
            </div>
          </div>

          {/* Traffic sources */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <SectionTitle>Traffic Sources</SectionTitle>
            <div className="flex justify-center mb-5">
              <div className="relative">
                <Donut data={TRAFFIC_SOURCES} size={148} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg font-bold leading-none font-mono text-slate-800">26.3k</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">sessions</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {TRAFFIC_SOURCES.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-slate-500 flex-1 min-w-0 truncate">{s.label}</span>
                  <div className="w-20 flex-shrink-0">
                    <div className="h-[3px] rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${s.barColor}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold font-mono text-slate-500 w-8 text-right">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP BIDDERS + GEO + EVENTS */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px_270px] gap-5"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "220ms" }}>

          {/* Top Bidders / Pages table */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <SectionTitle action="View all →">
              {topBidders.length ? "Top Bidders" : "Top Pages"}
            </SectionTitle>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[460px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    {(topBidders.length
                      ? ["Bidder","Total Bids","Amount Bid","Auctions"]
                      : ["Page","Views","Bounce","Trend"]
                    ).map(h => (
                      <th key={h} className="pb-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topBidders.length
                    ? topBidders.map((bidder, i) => (
                      <tr key={i} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors truncate max-w-[180px]">
                                {bidder.firstName} {bidder.lastName}
                              </p>
                              {bidder.email && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{bidder.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-500 font-mono">{(bidder.totalBids ?? 0).toLocaleString()}</td>
                        <td className="py-3 pr-4 text-sm text-slate-400 font-mono">₹{(bidder.totalAmountBid ?? 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 text-right text-sm text-slate-400 font-mono">{bidder.totalAuctionsParticipated ?? "—"}</td>
                      </tr>
                    ))
                    : TOP_PAGES.map((page, i) => (
                      <tr key={i} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors truncate max-w-[180px]">
                              {page.path}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-500 font-mono">{page.views.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-sm text-slate-400">{page.bounce}</td>
                        <td className="py-3 text-right">
                          <span className={`text-xs font-semibold ${page.change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {page.change >= 0 ? "▲" : "▼"} {Math.abs(page.change)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>

          {/* Geo breakdown */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <SectionTitle>By City</SectionTitle>
            <div className="space-y-4">
              {GEO_DATA.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-600">{g.city}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{g.sessions.toLocaleString()}</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                      style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live events */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <SectionTitle>Live Events</SectionTitle>
            <div>
              {RECENT_EVENTS.map((ev, i) => (
                <div key={i}
                  className={`flex gap-3 py-2.5 ${i < RECENT_EVENTS.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <div className="pt-[6px] flex-shrink-0">
                    <span className={`block w-1.5 h-1.5 rounded-full ${ev.dotClass}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-slate-600 leading-snug">{ev.msg}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW — Performance + Devices + Winning Bidders + Avg Bid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "290ms" }}>

          {/* Performance KPIs */}
          <div className="xl:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <SectionTitle>Performance KPIs</SectionTitle>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Conversion Rate",    value: perfMetrics.conversionRate  ?? "—", icon: "📈", color: "text-emerald-600" },
                  { label: "Abandonment Rate",   value: perfMetrics.abandonmentRate ?? "—", icon: "📉", color: "text-rose-500"    },
                  { label: "Completed Auctions", value: perfMetrics.completedAuctions ?? 0, icon: "✅", color: "text-indigo-600"  },
                  { label: "Peak Hour",          value: perfMetrics.peakUsageHour != null ? `${perfMetrics.peakUsageHour}:00` : "—", icon: "⏰", color: "text-amber-600" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold font-mono ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Device breakdown */}
          {[
            { label: "Mobile",  pct: 61, color: "#6366f1", icon: "📱", textClass: "text-indigo-600"  },
            { label: "Desktop", pct: 31, color: "#f59e0b", icon: "🖥️", textClass: "text-amber-600"  },
            { label: "Tablet",  pct: 8,  color: "#10b981", icon: "📲", textClass: "text-emerald-600" },
          ].map(d => (
            <div key={d.label}
              className="rounded-2xl bg-white border border-slate-200 p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all shadow-sm">
              <Ring pct={d.pct} color={d.color} icon={d.icon} />
              <div>
                <p className={`text-xl font-bold leading-none font-mono ${d.textClass}`}>{d.pct}%</p>
                <p className="text-[11px] text-slate-400 mt-1">{d.label}</p>
              </div>
            </div>
          ))}

          {/* Winning Bidders */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2">Winning Bidders</p>
            <p className="text-2xl font-bold font-mono text-slate-800">{summary.winningBidders ?? "—"}</p>
            <div className="-mx-1 my-3">
              <Sparkline data={[52, 48, 43, 40, 38, 35, 34]} color="#10b981" height={28} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              ▲ closed auctions
            </span>
          </div>

          {/* Avg Bid */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2">Avg Bid</p>
            <p className="text-2xl font-bold font-mono text-slate-800">₹{(bidding.averageBidAmount ?? 0).toLocaleString("en-IN")}</p>
            <div className="-mx-1 my-3">
              <Sparkline data={[180, 195, 210, 205, 225, 218, 222]} color="#f59e0b" height={28} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {bidding.totalBids ?? 0} total bids
            </span>
          </div>
        </div>

        {/* AUCTION SUMMARY ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "340ms" }}>
          {[
            { label: "New Bidders",      value: summary.newBiders      ?? 0, icon: "🆕", color: "#6366f1", bg: "bg-indigo-50",  border: "border-indigo-100"  },
            { label: "Active Auctions",  value: summary.activeAuctions ?? 0, icon: "🔥", color: "#f59e0b", bg: "bg-amber-50",   border: "border-amber-100"   },
            { label: "Closed Auctions",  value: summary.closedAuctions ?? 0, icon: "🔒", color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Total Cars",       value: summary.totalCars      ?? 0, icon: "🚗", color: "#a78bfa", bg: "bg-violet-50",  border: "border-violet-100"  },
          ].map(stat => (
            <div key={stat.label}
              className={`rounded-2xl bg-white border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                <span className={`text-lg w-8 h-8 flex items-center justify-center rounded-lg ${stat.bg} ${stat.border} border`}>{stat.icon}</span>
              </div>
              {loading
                ? <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
                : <p className="text-2xl font-bold font-mono" style={{ color: stat.color }}>
                    {stat.value.toLocaleString()}
                  </p>
              }
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}