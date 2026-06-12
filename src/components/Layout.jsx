import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import EnquiryDetailPage from '../pages/Enquirydetailpage';
const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const navigate = useNavigate();
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setSearched(false);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/search`,
        {
          params: { query: searchQuery.trim() },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const results = response.data?.data || [];
      setSearchResults(results);
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') closeSearch();
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchResults([]);
    setSearchQuery('');
    setFocused(false);
    setSearched(false);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);
  if (selectedEnquiryId) {
  console.log('Selected Enquiry ID:', selectedEnquiryId);
  return (
    <EnquiryDetailPage
      enquiryId={selectedEnquiryId}
      onBack={() => setSelectedEnquiryId(null)}
    />
  );
}

  return (
    <div className="flex min-h-screen bg-white">
      <style>{`
        .search-overlay {
          animation: overlayIn 0.18s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .search-panel {
          animation: panelIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .result-card {
          animation: slideUp 0.18s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shimmer-light {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9eaf0 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .result-arrow { opacity: 0; transform: translateX(-4px); transition: all 0.15s; }
        .result-card:hover .result-arrow { opacity: 1; transform: translateX(0); }
        .search-input-ring:focus-within {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f9fafb; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div
          ref={overlayRef}
          className="search-overlay fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-start justify-center pt-[8vh] px-4"
          onClick={(e) => e.target === overlayRef.current && closeSearch()}
        >
          <div className="search-panel w-full max-w-[600px]">

            {/* Search input box */}
            <div className={`search-input-ring flex items-center gap-3 bg-white border-2 rounded-2xl px-4 h-[58px] transition-all duration-150 shadow-xl shadow-gray-200/80 ${focused ? 'border-indigo-500' : 'border-gray-200'}`}>
              {loading ? (
                <svg className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}

              <input
                ref={inputRef}
                type="text"
                placeholder="Search vehicle number, owner name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearched(false); }}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="flex-1 bg-transparent outline-none text-[15px] text-gray-800 placeholder:text-gray-400 font-medium"
              />

              <div className="flex items-center gap-2 flex-shrink-0">
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setSearched(false); inputRef.current?.focus(); }}
                    className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                  >
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold transition"
                >
                  Search
                </button>
                <kbd className="hidden sm:flex text-[10px] px-2 py-1 rounded-md bg-gray-100 text-gray-400 border border-gray-200 font-mono">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Results panel */}
            {(loading || searched) && (
              <div className="mt-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/40">

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Results</span>
                    {!loading && searched && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100 font-semibold">
                        {searchResults.length} found
                      </span>
                    )}
                  </div>
                  <button
                    onClick={closeSearch}
                    className="text-[11px] px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 transition font-mono cursor-pointer"
                  >
                    ESC
                  </button>
                </div>

                {/* Loading skeletons */}
                {loading && (
                  <div className="p-3 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                        <div className="shimmer-light w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="shimmer-light h-3 w-28 rounded-full" />
                          <div className="shimmer-light h-2.5 w-44 rounded-full" />
                        </div>
                        <div className="shimmer-light h-5 w-14 rounded-full" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Results list */}
                {!loading && searchResults.length > 0 && (
                  <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          setSelectedEnquiryId(item._id);
                        }}
                        className="result-card group flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50/60 cursor-pointer transition-all duration-150 border border-transparent hover:border-indigo-100"
                        style={{ animationDelay: `${idx * 0.04}s` }}
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4.5 h-4.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                            <line x1="12" y1="12" x2="12" y2="16" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-gray-800 truncate leading-snug">
                            {item.carDetails?.registrationNumber || '—'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-gray-400">
                            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="truncate">{item.userId?.firstName} {item.userId?.lastName}</span>
                            {item.title && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="truncate text-gray-400">{item.title}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="result-arrow flex-shrink-0">
                          <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!loading && searched && searchResults.length === 0 && (
                  <div className="py-10 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-500">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different vehicle number or owner name</p>
                  </div>
                )}

                {/* Footer */}
                {!loading && searchResults.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                      <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200">↵</kbd> open
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono ml-auto">
                      <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200">ESC</kbd> close
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar onCloseMobile={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[68px] transition-all duration-300 w-full min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-40 h-[60px] md:h-[68px] flex items-center justify-between px-4 md:px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md flex-shrink-0">

          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="flex flex-col">
              <h1 className="text-gray-800 text-[15px] md:text-[17px] font-semibold tracking-tight leading-tight">
                Dashboard
              </h1>
              <p className="text-gray-400 text-[10px] font-medium tracking-wide uppercase hidden sm:block">
                Overview
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">

            {/* Search trigger */}
            <button
              onClick={openSearch}
              className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 group"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-[12px] font-medium">Search vehicle no...</span>
              <kbd className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-400 font-mono group-hover:border-gray-300 transition">
                ⌘K
              </kbd>
            </button>

            {/* Mobile search */}
            <button
              onClick={openSearch}
              className="sm:hidden w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div
              onClick={() => (window.location.href = '/profile')}
              className="relative cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className=" mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;