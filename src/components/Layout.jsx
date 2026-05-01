import React from 'react';
import Sidebar from '../components/Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content — offset by sidebar collapsed width */}
      <div className="flex-1 flex flex-col min-h-screen ml-[68px] transition-all duration-300">

        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 h-[68px] flex items-center justify-between px-6 border-b border-white/5 bg-gray-950/80 backdrop-blur-md flex-shrink-0">
          {/* Page title area */}
          <div className="flex flex-col">
            <h1 className="text-white text-[17px] font-semibold tracking-tight leading-tight">Dashboard</h1>
            <p className="text-white/30 text-[11px] font-medium tracking-wide uppercase">Overview</p>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="flex items-center gap-2 px-3 h-9 rounded-lg bg-white/5 border border-white/8 text-white/40 text-sm hover:bg-white/8 hover:text-white/60 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="hidden sm:inline text-xs">Search...</span>
              <span className="hidden sm:inline text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/30 font-mono">⌘K</span>
            </button>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:bg-white/8 hover:text-white/70 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-gray-950" />
            </button>

            {/* Avatar */}
            <div className="relative cursor-pointer group">
              <div  onClick={() => (window.location.href = '/profile')} className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow duration-200">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-950" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;