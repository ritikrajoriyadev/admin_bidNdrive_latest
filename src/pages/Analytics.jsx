import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const REVENUE_DATA = {
  "7d":  [42, 58, 37, 81, 63, 95, 74],
  "30d": [30,45,52,38,67,72,55,81,48,90,77,65,88,73,60,95,82,70,87,64,78,93,58,84,71,96,69,88,75,92],
  "90d": [55,62,48,75,83,70,91,65,78,87,72,95,68,80,88,74,92,66,79,85,71,90,63,82,77,94,69,86,73,97,
          60,83,76,91,64,78,88,73,95,67,81,86,70,92,65,79,87,72,94,68,83,77,90,63,85,76,93,70,88,74],
};

const TOP_PAGES = [
  { path: "/shop/sneakers",   views: 14820, bounce: "28%", change: +18 },
  { path: "/checkout",        views: 9310,  bounce: "12%", change: +5  },
  { path: "/collections/new", views: 7640,  bounce: "41%", change: -3  },
  { path: "/about",           views: 4210,  bounce: "55%", change: +2  },
  { path: "/account/orders",  views: 3870,  bounce: "19%", change: +11 },
];

const TRAFFIC_SOURCES = [
  { label: "Organic Search", value: 38, color: "#6366f1", barColor: "bg-indigo-500"  },
  { label: "Direct",         value: 24, color: "#f59e0b", barColor: "bg-amber-400"   },
  { label: "Social",         value: 19, color: "#10b981", barColor: "bg-emerald-500" },
  { label: "Referral",       value: 12, color: "#a78bfa", barColor: "bg-violet-400"  },
  { label: "Email",          value: 7,  color: "#f43f5e", barColor: "bg-rose-500"    },
];

const RECENT_EVENTS = [
  { msg: "New order #ORD-8821 — ₹4,290",      time: "2m ago",  dotClass: "bg-emerald-400" },
  { msg: "New user registered (Priya S.)",     time: "11m ago", dotClass: "bg-indigo-400"  },
  { msg: "Cart abandonment spike +14%",        time: "28m ago", dotClass: "bg-amber-400"   },
  { msg: "New order #ORD-8820 — ₹1,850",      time: "34m ago", dotClass: "bg-emerald-400" },
  { msg: "Bounce rate on /collections raised", time: "1h ago",  dotClass: "bg-rose-400"    },
  { msg: "New user registered (Rohan M.)",     time: "1h ago",  dotClass: "bg-indigo-400"  },
  { msg: "New order #ORD-8819 — ₹9,100",      time: "2h ago",  dotClass: "bg-emerald-400" },
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
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
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
            transform={`rotate(-90 ${cx} ${cy})`} opacity="0.88" />
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - 7} fill="#111318" />
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
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 28 28)" opacity="0.9" />
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
        const pct = (v / max) * 100;
        const last = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex items-end group cursor-pointer"
            title={`₹${(v * 2000).toLocaleString("en-IN")}`}>
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${last
                ? "bg-gradient-to-t from-indigo-600 to-indigo-400 opacity-100"
                : "bg-gradient-to-t from-indigo-700/60 to-indigo-500/25 opacity-60 group-hover:opacity-90"
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
      className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300"
      style={{ animation: `fadeUp 0.5s ease both`, animationDelay: delay }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: color }} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-1.5">{label}</p>
          <p className="text-[26px] font-bold text-white tracking-tight leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
            {value}
          </p>
          {sub && <p className="text-[11px] text-white/35 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${color}1a` }}>
          {icon}
        </div>
      </div>

      {sparkData && (
        <div className="-mx-1 mb-3 relative z-10">
          <Sparkline data={sparkData} color={color} height={38} />
        </div>
      )}

      <div className="relative z-10 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            background: up ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
            color: up ? "#10b981" : "#f43f5e",
          }}
        >
          {up ? "▲" : "▼"} {Math.abs(change)}%
        </span>
        <span className="text-[11px] text-white/25">vs last period</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────── */
function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em]">{children}</h2>
      {action && (
        <button className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer font-semibold">
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
  const [range,     setRange]     = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const chartData = REVENUE_DATA[range];
  const TABS = ["overview", "traffic", "conversions", "realtime"];

  return (
    <div className="min-h-screen bg-[#06070a] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');

        * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        .font-mono { font-family: 'DM Mono', monospace !important; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes livePulse {
          0%,100% { opacity:1; }
          50%     { opacity:.45; }
        }
        .live-pulse { animation: livePulse 2s ease-in-out infinite; }

        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      {/* ──────────── TOP BAR ──────────── */}
      <header className="sticky top-0 z-50 bg-[#06070a]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[15px] font-bold tracking-tight">Analytics</h1>
            <p className="text-[11px] text-white/30 mt-0.5">Real-time store performance</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="live-pulse w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-400">Live</span>
            </div>

            {/* Range tabs */}
            <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] gap-0.5">
              {["7d","30d","90d"].map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    range === r
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-white/40 hover:text-white/70"
                  }`}>
                  {r}
                </button>
              ))}
            </div>

            {/* Export */}
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/50 border border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:text-white/80 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>
      </header>

      {/* ──────────── NAV TABS ──────────── */}
      <nav className="border-b border-white/[0.05] px-6">
        <div className="max-w-[1400px] mx-auto flex gap-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-3.5 text-xs font-semibold capitalize border-b-2 -mb-px transition-all ${
                activeTab === t
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      {/* ──────────── MAIN ──────────── */}
      <main className="max-w-[1400px] mx-auto px-6 py-7 space-y-5">

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue"   value="₹8,42,190" sub="This period"    change={18}   color="#6366f1" icon="💰" sparkData={chartData}          delay="60ms"  />
          <KpiCard label="Active Sessions" value="2,847"     sub="Right now"      change={6}    color="#10b981" icon="👥" sparkData={chartData.slice(-14)} delay="120ms" />
          <KpiCard label="Conversion Rate" value="4.38%"     sub="Orders/visits"  change={-1.2} color="#f59e0b" icon="⚡" sparkData={chartData.slice(-14)} delay="180ms" />
          <KpiCard label="Avg Order Value" value="₹1,924"    sub="Per order"      change={9}    color="#a78bfa" icon="🛒" sparkData={chartData.slice(-14)} delay="240ms" />
        </div>

        {/* REVENUE CHART + TRAFFIC SOURCES */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "150ms" }}>

          {/* Revenue bar chart */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
            <SectionTitle>Revenue Over Time</SectionTitle>
            <div className="flex flex-wrap items-end gap-4 mb-5">
              <p className="text-[28px] font-bold tracking-tight leading-none font-mono">₹8,42,190</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 mb-0.5">
                ▲ 18% vs last period
              </span>
            </div>
            <BarChart data={chartData} />
            <div className="flex justify-between mt-2">
              {(range === "7d"
                ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
                : ["Week 1","Week 2","Week 3","Week 4"]
              ).map(d => (
                <span key={d} className="text-[10px] text-white/20">{d}</span>
              ))}
            </div>
          </div>

          {/* Traffic sources */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
            <SectionTitle>Traffic Sources</SectionTitle>
            <div className="flex justify-center mb-5">
              <div className="relative">
                <Donut data={TRAFFIC_SOURCES} size={148} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg font-bold leading-none font-mono">26.3k</p>
                  <p className="text-[10px] text-white/30 mt-0.5">sessions</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {TRAFFIC_SOURCES.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-white/50 flex-1 min-w-0 truncate">{s.label}</span>
                  <div className="w-20 flex-shrink-0">
                    <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${s.barColor}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold font-mono text-white/60 w-8 text-right">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP PAGES + GEO + EVENTS */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px_270px] gap-5"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "220ms" }}>

          {/* Top pages table */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6 overflow-x-auto">
            <SectionTitle action="View all →">Top Pages</SectionTitle>
            <table className="w-full min-w-[460px]">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {["Page","Views","Bounce","Trend"].map(h => (
                    <th key={h} className="pb-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-widest last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {TOP_PAGES.map((page, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors cursor-pointer group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-white/75 group-hover:text-white/90 transition-colors truncate max-w-[180px]">
                          {page.path}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/50 font-mono">
                      {page.views.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/40">{page.bounce}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs font-semibold ${page.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {page.change >= 0 ? "▲" : "▼"} {Math.abs(page.change)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Geo breakdown */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
            <SectionTitle>By City</SectionTitle>
            <div className="space-y-4">
              {GEO_DATA.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-white/55">{g.city}</span>
                    <span className="text-[11px] text-white/30 font-mono">{g.sessions.toLocaleString()}</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                      style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live events */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
            <SectionTitle>Live Events</SectionTitle>
            <div>
              {RECENT_EVENTS.map((ev, i) => (
                <div key={i}
                  className={`flex gap-3 py-2.5 ${i < RECENT_EVENTS.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                  <div className="pt-[6px] flex-shrink-0">
                    <span className={`block w-1.5 h-1.5 rounded-full ${ev.dotClass}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-white/55 leading-snug">{ev.msg}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW — Devices + Bounce + Session */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4"
          style={{ animation: "fadeUp .5s ease both", animationDelay: "290ms" }}>

          {/* Device cards */}
          {[
            { label: "Mobile",  pct: 61, color: "#6366f1", icon: "📱", textClass: "text-indigo-400" },
            { label: "Desktop", pct: 31, color: "#f59e0b", icon: "🖥️", textClass: "text-amber-400"  },
            { label: "Tablet",  pct: 8,  color: "#10b981", icon: "📲", textClass: "text-emerald-400"},
          ].map(d => (
            <div key={d.label}
              className="rounded-2xl bg-gray-900 border border-white/[0.06] p-5 flex items-center gap-4 hover:border-white/[0.12] transition-all">
              <Ring pct={d.pct} color={d.color} icon={d.icon} />
              <div>
                <p className={`text-xl font-bold leading-none font-mono ${d.textClass}`}>{d.pct}%</p>
                <p className="text-[11px] text-white/30 mt-1">{d.label}</p>
              </div>
            </div>
          ))}

          {/* Bounce rate */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em] mb-2">Bounce Rate</p>
            <p className="text-2xl font-bold font-mono">34.2%</p>
            <div className="-mx-1 my-3">
              <Sparkline data={[52,48,43,40,38,35,34]} color="#10b981" height={28} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              ▼ 8.1% improving
            </span>
          </div>

          {/* Avg session */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em] mb-2">Avg Session</p>
            <p className="text-2xl font-bold font-mono">3m 42s</p>
            <div className="-mx-1 my-3">
              <Sparkline data={[180,195,210,205,225,218,222]} color="#f59e0b" height={28} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
              ▲ 12% this week
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}