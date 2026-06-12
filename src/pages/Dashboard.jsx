import React, { useState, useEffect, useCallback } from 'react';
import Greeting from '../components/Greeting';
import analyticsService from '../services/analyticsService';

/* ─────────────────────────────────────────────
   SPARKLINE
───────────────────────────────────────────── */
const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 40, w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-10" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ title, value, change, positive, icon, sparkData, accentBg, accentText, accentRing, loading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-lg hover:shadow-indigo-100 hover:border-indigo-200 transition-all duration-300 group">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${accentBg}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">{title}</p>
        {loading
          ? <Skeleton className="h-8 w-24 mt-1" />
          : <p className="text-slate-800 text-2xl font-bold mt-1 tracking-tight">{value}</p>
        }
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentBg} ${accentText}`}>
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between">
      {loading
        ? <Skeleton className="h-5 w-28" />
        : <>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
              {positive ? '↑' : '↓'} {change}
            </span>
            <Sparkline data={sparkData} color={positive ? '#10b981' : '#f43f5e'} />
          </>
      }
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   ACTIVITY ITEM
───────────────────────────────────────────── */
const ActivityItem = ({ avatar, name, action, time, tag, tagColor }) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-indigo-50/50 -mx-4 px-4 rounded-lg transition-colors duration-150 cursor-pointer">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {avatar}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-600 text-sm font-medium truncate">
        <span className="text-slate-800 font-semibold">{name}</span> {action}
      </p>
      <p className="text-slate-400 text-xs mt-0.5">{time}</p>
    </div>
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${tagColor}`}>{tag}</span>
  </div>
);

/* ─────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────── */
const ProgressBar = ({ label, value, max, color }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <span className="text-slate-600 text-xs font-medium">{label}</span>
      <span className="text-slate-400 text-xs font-semibold">{Math.round((value / max) * 100)}%</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function toSparkline(arr, fallback) {
  if (!arr || arr.length === 0) return fallback;
  const vals = arr.map(d => d.revenue || d.totalRevenue || 0);
  if (vals.length >= 7) return vals.slice(-7);
  return [...Array(7 - vals.length).fill(0), ...vals];
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const [activeTab,   setActiveTab]   = useState('week');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [dashData,    setDashData]    = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [perfData,    setPerfData]    = useState(null);
  const [weeklyData,  setWeeklyData]  = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData,  setYearlyData]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsService.fetchDashboard({ filterType: 'month' }),
      analyticsService.fetchRevenue({ filterType: 'monthly' }),
      analyticsService.fetchPerformance({ filterType: 'month' }),
      analyticsService.fetchWeekly(),
      analyticsService.fetchMonthly(),
      analyticsService.fetchYearly(),
    ])
      .then(([dash, rev, perf, weekly, monthly, yearly]) => {
        setDashData(dash?.data ?? dash);
        setRevenueData(rev);
        setPerfData(perf);
        setWeeklyData(weekly);
        setMonthlyData(monthly);
        setYearlyData(yearly);
      })
      .catch(err => setError(err?.response?.data?.message || err.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const summary     = dashData?.summary   || {};
  const bidding     = dashData?.bidding   || {};
  const revenue     = dashData?.revenue   || {};
  const topBidders  = dashData?.topBiders || [];
  const perfMetrics = perfData?.metrics   || {};
  const totalRev    = revenueData?.summary?.totalRevenue ?? revenue.totalRevenue ?? 0;

  const getBarData = () => {
    const fallback = { day: [40,65,30,80,55,70,45], week: [60,75,50,90,65,85,70], month: [55,80,45,95,70,60,88], year: [70,85,60,75,90,65,80] };
    if (activeTab === 'week'  && weeklyData?.data?.weeklyAuctions?.length)
      return weeklyData.data.weeklyAuctions.slice(-7).map(w => w.totalRevenue || w.totalBids || 0);
    if (activeTab === 'month' && monthlyData?.data?.monthlyAuctions?.length)
      return monthlyData.data.monthlyAuctions.slice(-7).map(m => m.totalRevenue || m.totalBids || 0);
    if (activeTab === 'year'  && yearlyData?.data?.yearlyAuctions?.length)
      return yearlyData.data.yearlyAuctions.slice(-7).map(y => y.totalRevenue || y.totalBids || 0);
    return fallback[activeTab];
  };
  const bars    = getBarData();
  const barsMax = Math.max(...bars, 1);

  const barLabels = {
    day:   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    week:  ['W1','W2','W3','W4','W5','W6','W7'],
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
    year:  ['2018','2019','2020','2021','2022','2023','2024'],
  };

  const revSparkline = toSparkline(revenueData?.data, [30,45,38,60,52,75,82]);

  const stats = [
    {
      title: 'Total Revenue',
      value: loading ? '—' : fmt(totalRev),
      change: `${revenueData?.summary?.totalTransactions ?? 0} txns`,
      positive: true,
      accentBg: 'bg-indigo-100',
      accentText: 'text-indigo-600',
      sparkData: revSparkline,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      title: 'Active Bidders',
      value: loading ? '—' : (summary.activeBiders ?? 0).toLocaleString(),
      change: `${summary.newBiders ?? 0} new this period`,
      positive: true,
      accentBg: 'bg-violet-100',
      accentText: 'text-violet-600',
      sparkData: [50,60,55,70,65,80,90],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      title: 'Total Auctions',
      value: loading ? '—' : (summary.totalAuctions ?? 0).toLocaleString(),
      change: `${summary.activeAuctions ?? 0} active now`,
      positive: (summary.activeAuctions ?? 0) > 0,
      accentBg: 'bg-amber-100',
      accentText: 'text-amber-600',
      sparkData: [80,70,75,60,65,55,50],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      title: 'Total Bids',
      value: loading ? '—' : (bidding.totalBids ?? 0).toLocaleString(),
      change: `avg ${fmt(bidding.averageBidAmount)} per bid`,
      positive: true,
      accentBg: 'bg-emerald-100',
      accentText: 'text-emerald-600',
      sparkData: [20,35,28,50,42,58,64],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
  ];

  const activities = topBidders.length
    ? topBidders.slice(0, 5).map((b, i) => ({
        avatar:   `${b.firstName?.[0] ?? '?'}${b.lastName?.[0] ?? ''}`,
        name:     `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim(),
        action:   `placed ${b.totalBids ?? 0} bids`,
        time:     'this period',
        tag:      `₹${(b.totalAmountBid ?? 0).toLocaleString("en-IN")}`,
        tagColor: i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700',
      }))
    : [
        { avatar:'RK', name:'Rahul Kumar',  action:'placed a new order #4821',  time:'2 min ago',   tag:'Order',     tagColor:'bg-indigo-100 text-indigo-700'  },
        { avatar:'PS', name:'Priya Sharma', action:'submitted an enquiry',       time:'15 min ago',  tag:'Enquiry',   tagColor:'bg-amber-100 text-amber-700'    },
        { avatar:'AM', name:'Amit Mehta',   action:'updated their profile',      time:'1 hour ago',  tag:'User',      tagColor:'bg-violet-100 text-violet-700'  },
        { avatar:'NS', name:'Neha Singh',   action:'cancelled order #4789',      time:'2 hours ago', tag:'Cancelled', tagColor:'bg-rose-100 text-rose-600'      },
        { avatar:'VR', name:'Vikram Rao',   action:'completed onboarding',       time:'3 hours ago', tag:'New User',  tagColor:'bg-emerald-100 text-emerald-700'},
      ];

  const topProducts = (() => {
    if (monthlyData?.data?.monthlyAuctions?.length) {
      const sorted = [...monthlyData.data.monthlyAuctions].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
      const top4   = sorted.slice(0, 4);
      const max    = top4[0]?.totalRevenue || 1;
      const colors = [
        'bg-gradient-to-r from-indigo-500 to-violet-500',
        'bg-gradient-to-r from-violet-500 to-pink-500',
        'bg-gradient-to-r from-amber-400 to-orange-500',
        'bg-gradient-to-r from-emerald-400 to-teal-500',
      ];
      return top4.map((m, i) => ({ name: `Month ${m._id?.month ?? i + 1}`, sales: m.totalRevenue || 0, max, color: colors[i] }));
    }
    return [
      { name: 'Premium Plan', sales: 320, max: 400, color: 'bg-gradient-to-r from-indigo-500 to-violet-500' },
      { name: 'Basic Plan',   sales: 280, max: 400, color: 'bg-gradient-to-r from-violet-500 to-pink-500'   },
      { name: 'Enterprise',   sales: 190, max: 400, color: 'bg-gradient-to-r from-amber-400 to-orange-500'  },
      { name: 'Starter Pack', sales: 140, max: 400, color: 'bg-gradient-to-r from-emerald-400 to-teal-500'  },
    ];
  })();

  const tabs = ['day', 'week', 'month', 'year'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');
        * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        .font-mono-dm { font-family: 'DM Mono', monospace !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .fade-up { animation: fadeUp .4s ease both; }
      `}</style>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center gap-3">
          <span className="text-rose-500">⚠️</span>
          <p className="text-sm text-rose-600">{error} — showing fallback data</p>
          <button onClick={loadAll} className="ml-auto text-xs text-rose-600 border border-rose-300 px-3 py-1 rounded-lg hover:bg-rose-100 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* ── WELCOME BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 p-6 mb-6 flex items-center justify-between fade-up shadow-xl shadow-indigo-200">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 right-24 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <Greeting name="Admin" />
        <div className="relative z-10 hidden sm:flex flex-col items-end gap-1">
          <span className="text-indigo-200 text-xs">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-white text-3xl font-bold font-mono-dm">
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map(s => <StatCard key={s.title} {...s} loading={loading} />)}
      </div>

      {/* ── CHART + PRODUCTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

        {/* Revenue / Auctions bar chart */}
        <div className="xl:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-800 font-semibold text-base">
                {loading ? 'Loading…' : 'Revenue & Auctions Overview'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {activeTab === 'week'  && weeklyData  ? `${weeklyData.data?.weeklyAuctions?.length ?? 0} weeks of data` :
                 activeTab === 'month' && monthlyData ? `${monthlyData.data?.monthlyAuctions?.length ?? 0} months of data` :
                 activeTab === 'year'  && yearlyData  ? `${yearlyData.data?.yearlyAuctions?.length ?? 0} years of data` :
                 'Performance across selected period'}
              </p>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${activeTab === t ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <div className="flex items-end gap-2 h-36">
              {bars.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500 hover:from-indigo-500 hover:to-violet-400 cursor-pointer relative group"
                    style={{ height: `${Math.max((val / barsMax) * 100, 2)}%` }}
                    title={val.toLocaleString("en-IN")}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {val.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span className="text-slate-400 text-[9px] font-medium">{barLabels[activeTab][i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products / monthly auctions */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="text-slate-800 font-semibold text-base mb-1">
            {monthlyData?.data?.monthlyAuctions?.length ? 'Monthly Auctions' : 'Top Products'}
          </h3>
          <p className="text-slate-400 text-xs mb-5">Revenue distribution</p>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topProducts.map(p => (
                <ProgressBar key={p.name} label={p.name} value={p.sales} max={p.max} color={p.color} />
              ))}
            </div>
          )}

          {/* Donut */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad1)" strokeWidth="3.8"
                  strokeDasharray={`${summary.totalAuctions
                    ? Math.round((summary.closedAuctions / summary.totalAuctions) * 100)
                    : 80} ${summary.totalAuctions
                    ? 100 - Math.round((summary.closedAuctions / summary.totalAuctions) * 100)
                    : 20}`}
                  strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-slate-800 text-lg font-bold">
                  {summary.totalAuctions
                    ? `${Math.round((summary.closedAuctions / summary.totalAuctions) * 100)}%`
                    : '80%'}
                </span>
                <span className="text-slate-400 text-[9px]">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY + QUICK STATS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Activity */}
        <div className="xl:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-800 font-semibold text-base">
                {topBidders.length ? 'Top Bidders' : 'Recent Activity'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {topBidders.length ? 'Highest activity this period' : 'Latest actions across the platform'}
              </p>
            </div>
            <button className="text-indigo-600 text-xs font-semibold hover:text-indigo-700 transition-colors">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div>
              {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-slate-800 font-semibold text-base">Quick Stats</h3>
            <p className="text-slate-400 text-xs mt-0.5">Platform snapshot</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            [
              { label: 'Conversion Rate',  value: perfMetrics.conversionRate  ?? '4.6%',                       icon: '📈', color: 'text-emerald-600' },
              { label: 'Avg Bid Amount',   value: fmt(bidding.averageBidAmount),                                icon: '💰', color: 'text-indigo-600'  },
              { label: 'Abandonment Rate', value: perfMetrics.abandonmentRate ?? '28.3%',                      icon: '↩️', color: 'text-amber-600'   },
              { label: 'Winning Bidders',  value: (summary.winningBidders ?? 17).toLocaleString(),              icon: '🏆', color: 'text-violet-600'  },
              { label: 'Total Cars',       value: (summary.totalCars ?? 0).toLocaleString(),                    icon: '🚗', color: 'text-emerald-600' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-slate-500 text-sm">{item.label}</span>
                </div>
                <span className={`text-sm font-bold font-mono-dm ${item.color}`}>{item.value}</span>
              </div>
            ))
          )}

          <button onClick={loadAll}
            className="mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-indigo-300">
            Refresh Data →
          </button>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;