import React, { useState } from 'react';
import Greeting from '../components/Greeting';

// ── Sparkline mini chart ──────────────────────────────────────────
const Sparkline = ({ data, color }) => {
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
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ title, value, change, positive, icon, sparkData, accent }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-all duration-300 group`}>
    {/* Glow blob */}
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />

    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/40 text-xs font-medium tracking-widest uppercase">{title}</p>
        <p className="text-white text-2xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white/80 ${accent} bg-opacity-20`}>
        {icon}
      </div>
    </div>

    <div className="flex items-end justify-between">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
        {positive ? '↑' : '↓'} {change}
      </span>
      <Sparkline data={sparkData} color={positive ? '#34d399' : '#f87171'} />
    </div>
  </div>
);

// ── Recent Activity Item ──────────────────────────────────────────
const ActivityItem = ({ avatar, name, action, time, tag, tagColor }) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] -mx-4 px-4 rounded-lg transition-colors duration-150 cursor-pointer">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {avatar}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/80 text-sm font-medium truncate">
        <span className="text-white font-semibold">{name}</span> {action}
      </p>
      <p className="text-white/30 text-xs mt-0.5">{time}</p>
    </div>
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${tagColor}`}>{tag}</span>
  </div>
);

// ── Progress Bar ─────────────────────────────────────────────────
const ProgressBar = ({ label, value, max, color }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <span className="text-white/60 text-xs font-medium">{label}</span>
      <span className="text-white/40 text-xs">{Math.round((value / max) * 100)}%</span>
    </div>
    <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────

import { useEffect } from 'react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('week');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: '₹8,24,300',
      change: '12.5% this week',
      positive: true,
      accent: 'bg-indigo-500',
      sparkData: [30, 45, 38, 60, 52, 75, 82],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: 'Active Users',
      value: '3,482',
      change: '8.1% this week',
      positive: true,
      accent: 'bg-violet-500',
      sparkData: [50, 60, 55, 70, 65, 80, 90],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      ),
    },
    {
      title: 'New Enquiries',
      value: '128',
      change: '3.2% this week',
      positive: false,
      accent: 'bg-amber-500',
      sparkData: [80, 70, 75, 60, 65, 55, 50],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: 'Orders Today',
      value: '64',
      change: '18.4% today',
      positive: true,
      accent: 'bg-emerald-500',
      sparkData: [20, 35, 28, 50, 42, 58, 64],
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
  ];

  const activities = [
    { avatar: 'RK', name: 'Rahul Kumar', action: 'placed a new order #4821', time: '2 minutes ago', tag: 'Order', tagColor: 'bg-indigo-500/15 text-indigo-400' },
    { avatar: 'PS', name: 'Priya Sharma', action: 'submitted an enquiry', time: '15 minutes ago', tag: 'Enquiry', tagColor: 'bg-amber-500/15 text-amber-400' },
    { avatar: 'AM', name: 'Amit Mehta', action: 'updated their profile', time: '1 hour ago', tag: 'User', tagColor: 'bg-violet-500/15 text-violet-400' },
    { avatar: 'NS', name: 'Neha Singh', action: 'cancelled order #4789', time: '2 hours ago', tag: 'Cancelled', tagColor: 'bg-rose-500/15 text-rose-400' },
    { avatar: 'VR', name: 'Vikram Rao', action: 'completed onboarding', time: '3 hours ago', tag: 'New User', tagColor: 'bg-emerald-500/15 text-emerald-400' },
  ];

  const topProducts = [
    { name: 'Premium Plan', sales: 320, max: 400, color: 'bg-gradient-to-r from-indigo-500 to-violet-500' },
    { name: 'Basic Plan', sales: 280, max: 400, color: 'bg-gradient-to-r from-violet-500 to-pink-500' },
    { name: 'Enterprise', sales: 190, max: 400, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { name: 'Starter Pack', sales: 140, max: 400, color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  ];

  const tabs = ['day', 'week', 'month', 'year'];

  // Simple bar chart data
  const barData = {
    day: [40, 65, 30, 80, 55, 70, 45],
    week: [60, 75, 50, 90, 65, 85, 70],
    month: [55, 80, 45, 95, 70, 60, 88],
    year: [70, 85, 60, 75, 90, 65, 80],
  };
  const bars = barData[activeTab];
  const barLabels = { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], week: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], year: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'] };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-6 mb-6 flex items-center justify-between">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-10 right-24 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <Greeting name="Admin" />
        <div className="relative z-10 hidden sm:flex flex-col items-end gap-1">
          <span className="text-white/60 text-xs">
            {currentTime.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>

          <span className="text-white text-3xl font-bold">
            {currentTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      {/* ── Charts + Activity Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

        {/* Bar Chart */}
        <div className="xl:col-span-2 rounded-2xl bg-gray-900 border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold text-base">Revenue Overview</h3>
              <p className="text-white/30 text-xs mt-0.5">Performance across selected period</p>
            </div>
            <div className="flex gap-1 bg-white/[0.05] rounded-lg p-1">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${activeTab === t ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40 hover:text-white/70'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-2 h-36">
            {bars.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-400 transition-all duration-500 hover:from-indigo-500 hover:to-violet-300 cursor-pointer relative group"
                  style={{ height: `${val}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {val}%
                  </div>
                </div>
                <span className="text-white/25 text-[9px] font-medium">{barLabels[activeTab][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-5">
          <h3 className="text-white font-semibold text-base mb-1">Top Products</h3>
          <p className="text-white/30 text-xs mb-5">Sales distribution this month</p>
          <div className="flex flex-col gap-4">
            {topProducts.map((p) => (
              <ProgressBar key={p.name} label={p.name} value={p.sales} max={p.max} color={p.color} />
            ))}
          </div>

          {/* Donut placeholder */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.8" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad1)" strokeWidth="3.8" strokeDasharray="80 20" strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-lg font-bold">80%</span>
                <span className="text-white/30 text-[9px]">Target</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity + Quick Stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Activity */}
        <div className="xl:col-span-2 rounded-2xl bg-gray-900 border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-base">Recent Activity</h3>
              <p className="text-white/30 text-xs mt-0.5">Latest actions across the platform</p>
            </div>
            <button className="text-indigo-400 text-xs font-semibold hover:text-indigo-300 transition-colors">View all →</button>
          </div>
          <div>
            {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-white font-semibold text-base">Quick Stats</h3>
            <p className="text-white/30 text-xs mt-0.5">Platform snapshot</p>
          </div>

          {[
            { label: 'Conversion Rate', value: '4.6%', icon: '📈', color: 'text-emerald-400' },
            { label: 'Avg. Session Time', value: '3m 42s', icon: '⏱', color: 'text-indigo-400' },
            { label: 'Bounce Rate', value: '28.3%', icon: '↩️', color: 'text-amber-400' },
            { label: 'Open Tickets', value: '17', icon: '🎫', color: 'text-rose-400' },
            { label: 'Server Uptime', value: '99.98%', icon: '🟢', color: 'text-emerald-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{item.icon}</span>
                <span className="text-white/50 text-sm">{item.label}</span>
              </div>
              <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}

          {/* CTA */}
          <button className="mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
            Generate Report →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;