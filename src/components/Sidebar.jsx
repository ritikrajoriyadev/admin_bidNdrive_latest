import React, { useState } from 'react';
import { usePermissions } from '../context/PermissionsContext';
import { NavLink } from 'react-router-dom';

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Users',
    path: '/user',
    // badge: 12,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'new_enquiries',
    label: 'new-enquiries',
    path: '/telecaller',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'assigned_enquiries',
    label: 'Assigned Enquiries',
    path: '/enquiries',
    // badge: 4,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'qc',
    label: 'QC',
    path: '/enquiries-details',
    // badge: 4,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'auction_cars',
    label: 'Auction Cars',
    path: '/auction-cars',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },

  {
    id: 'bnb_tnb',
    label: 'ReAution',
    path: '/bnb-tnb',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },
  {
    id: 'winner_bids',
    label: 'Winner Bids',
    path: '/auction-winners',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },
  {
    id: 'CLOSED_DEALS',
    label: 'Closed Deals',
    path: '/closed-deals',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },
  {
    id: 'bidders',
    label: 'Bidders',
    path: '/bidders',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'pdi',
    label: 'PDI',
    path: '/pdi',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18M3 12h12M3 17h18" />
        <path d="M14 4l7 7-7 7" />
      </svg>
    ),
  },
  {
    id: 'loans',
    label: 'Loans',
    path: '/loans',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18M3 12h12M3 17h18" />
        <path d="M14 4l7 7-7 7" />
      </svg>
    ),
  },
  {
    id: 'sell_cars',
    label: 'Sell Cars',
    path: '/sell-cars',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        <ellipse cx="10" cy="4" rx="3" ry="3" /><path d="M4 15h14M7 13v4m8-4v4" />
      </svg>
    ),
  },
  {
    id: 'sell_car_enquiries',
    label: 'Car Enquiries',
    path: '/sell-car-enquiries',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },

  {
    id: 'RA_assigned_enquiries',
    label: 'RA Assigned Enquiries',
    path: '/ra-assigned-enquiries',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },

  {
    id: 'sales_team',
    label: 'Sales Team',
    path: '/sales-team',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="16" cy="11" r="1" />
      </svg>
    ),
  },
  {
    id: 'technicians',
    label: 'Technicians',
    path: '/technicians',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },


  {
    id: 'subadmin',
    label: 'SubAdmin',
    path: '/subadmin',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'retail-associate',
    label: 'Retail Associate',
    path: '/retail-associate',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'roles',
    label: 'Roles',
    path: '/roles',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: 'permissions',
    label: 'Permissions',
    path: '/permissions',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },

  {
    id: 'banners',
    label: 'Banners',
    path: '/banners',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="12" rx="2" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  // {
  //   id: 'ads-popups',
  //   label: 'Ads & Popups',
  //   path: '/ads-popups',
  //   icon: (
  //     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M21 2H3v16h5v4l4-4h5l4-4V2z"/>
  //       <line x1="9" y1="9" x2="9" y2="9.01"/>
  //       <line x1="15" y1="9" x2="15" y2="9.01"/>
  //       <line x1="9" y1="13" x2="15" y2="13"/>
  //     </svg>
  //   ),
  // },
  // {
  //   id: 'settings',
  //   label: 'Settings',
  //   path: '/settings',
  //   icon: (
  //     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <circle cx="12" cy="12" r="3"/>
  //       <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  //     </svg>
  //   ),
  // },
];

// Reusable nav item using NavLink
const NavItem = ({ item, open }) => (
  <div className="relative group">
    <NavLink
      to={item.path}
      className={({ isActive }) => `
        relative w-full flex items-center gap-3 px-3 h-11 rounded-xl
        border transition-all duration-200 overflow-hidden whitespace-nowrap
        ${isActive
          ? 'bg-indigo-500/15 border-indigo-400/25 text-indigo-300'
          : 'border-transparent indigo-500/40 hover:indigo-500/75 hover:bg-white/5'}
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active left pill */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
          )}

          {/* Icon */}
          <span className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]' : ''}`}>
            {item.icon}
          </span>

          {/* Label */}
          <span className={`text-sm font-medium flex-1 text-left transition-all duration-200 ${open ? 'opacity-100 translate-x-0 delay-75' : 'opacity-0 -translate-x-2'}`}>
            {item.label}
          </span>

          {/* Badge */}
          {item.badge && (
            <span className={`ml-auto text-[10px] font-bold indigo-500 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 min-w-[20px] flex items-center justify-center transition-all duration-200 ${open ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-75'}`}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>

    {/* Tooltip — visible only when sidebar is collapsed */}
    {!open && (
      <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 bg-white text-violet-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-500/30 shadow-xl shadow-black/40 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[999]">
        <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 border-t-[5px] border-b-[5px] border-r-[5px] border-t-transparent border-b-transparent border-r-indigo-500/30" />
        {item.label}
      </div>
    )}
  </div>
);

const Sidebar = ({ onCloseMobile }) => {
  const [open, setOpen] = useState(false);
  const { permissions, loading, isSuperAdmin } = usePermissions();

  // Helper to check if user has permission for a module
  const hasModulePermission = (module) => {
    if (isSuperAdmin) return true;
    if (!permissions || permissions.length === 0) return false;
    return permissions.some((perm) => perm.module === module);
  };

  // Map navItems to their required module (by convention: id or label lowercase, or add a 'module' field to navItems if needed)
  const getModuleFromNavItem = (item) => {
    // If you want to be more explicit, add a 'module' property to navItems
    // For now, use id for module name if matches API
    // Example: 'users', 'enquiries', etc.
    return item.id.replace(/-.*/, ''); // e.g. 'enquiries-details' -> 'enquiries'
  };

  const mainNav = navItems.slice(0, 6).filter((item) => hasModulePermission(getModuleFromNavItem(item)));
  const systemNav = navItems.slice(6).filter((item) => hasModulePermission(getModuleFromNavItem(item)));

  // Optionally, show loading state
  if (loading) {
    return (
      <div className="fixed left-0 top-0 h-screen w-[68px] z-50 flex items-center justify-center bg-white border-r border-white/5">
        <span className="indigo-500/40 text-xs animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col bg-white border-r border-white/5 transition-all duration-300 ease-in-out overflow-hidden ${open ? 'w-60 shadow-2xl shadow-black/50' : 'w-[68px]'}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Glowing right edge */}
      <div className={`pointer-events-none absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-[15px] h-[68px] border-b border-white/5 flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] min-w-[38px] rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-200 ${open ? 'opacity-100 translate-x-0 delay-75' : 'opacity-0 -translate-x-2'}`}>
            <span className="indigo-500 text-[15px] font-bold tracking-tight leading-tight">AdminPanel</span>
            <span className="indigo-500/30 text-[10px] font-medium tracking-widest uppercase">Control Suite</span>
          </div>
        </div>
        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center indigo-500/40 hover:indigo-500/70 flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2.5 py-3 overflow-y-auto sidebar-scroll">

        {/* Main Menu label */}
        <p className={`indigo-500/20 text-[9.5px] font-bold tracking-widest uppercase px-2 whitespace-nowrap transition-all duration-300 overflow-hidden ${open ? 'max-h-8 opacity-100 pb-1 pt-2' : 'max-h-0 opacity-0 py-0'}`}>
          Main Menu
        </p>

        {mainNav.map((item) => (
          <NavItem key={item.id} item={item} open={open} />
        ))}

        {/* Divider */}
        <div className="h-px bg-white/5 my-2 flex-shrink-0" />

        {/* System label */}
        <p className={`indigo-500/20 text-[9.5px] font-bold tracking-widest uppercase px-2 whitespace-nowrap transition-all duration-300 overflow-hidden ${open ? 'max-h-8 opacity-100 pb-1 pt-2' : 'max-h-0 opacity-0 py-0'}`}>
          System
        </p>

        {systemNav.map((item) => (
          <NavItem key={item.id} item={item} open={open} />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="p-2.5 border-t border-white/5 flex-shrink-0">
        <NavLink
          to="/profile"
          className="flex items-center gap-2.5 p-2.5 rounded-xl overflow-hidden whitespace-nowrap bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-indigo-400/20 transition-all duration-200"
        >
          <div className="relative flex-shrink-0">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center indigo-500 text-sm font-bold shadow-lg shadow-indigo-500/30">
              A
            </div>
            <span className="absolute -bottom-px -right-px w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-950" />
          </div>
          <div className={`flex flex-col overflow-hidden transition-all duration-200 ${open ? 'opacity-100 translate-x-0 delay-75' : 'opacity-0 -translate-x-2'}`}>
            <span className="text-slate-200 text-[13px] font-semibold leading-tight">Admin User</span>
            <span className="indigo-500/30 text-[11px]">Super Admin</span>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;