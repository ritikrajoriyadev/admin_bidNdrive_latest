import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, change, positive }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <span className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
        {icon}
      </span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {change}
      </span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/40 text-xs font-medium mt-1 uppercase tracking-widest">{label}</p>
  </div>
);

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Avatar = ({ initials, grad, size = 'sm' }) => {
  const sz = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold indigo-500 flex-shrink-0`}>
      {initials}
    </div>
  );
};

/* ─── Badge helpers ──────────────────────────────────────────────────────── */
const roleConfig = {
  'super-admin': { label: 'Super Admin', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' },
  admin: { label: 'Admin', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/25' },
  manager: { label: 'Manager', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25' },
  user: { label: 'User', bg: 'bg-white/[0.05]', text: 'indigo-500/40', border: 'border-white/[0.08]' },
};

const statusConfig = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', bg: 'bg-white/[0.06]', text: 'indigo-500/40', dot: 'bg-white/30' },
};

const RoleBadge = ({ role }) => {
  const cfg = roleConfig[role] ?? roleConfig.user;
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] ?? statusConfig.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const IconUsers = () => (
  <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconShield = () => (
  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4 indigo-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconTable = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" /><line x1="15" y1="9" x2="15" y2="21" />
  </svg>
);
const IconGrid = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconX = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─── Table View ─────────────────────────────────────────────────────────── */
const TableView = ({ users, onUserClick }) => (
  <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white">
    <table className="w-full min-w-[640px]">
      <thead>
        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
          {['User', 'Contact', 'Role', 'Status', 'Joined', ''].map((h, i) => (
            <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold indigo-500/35 uppercase tracking-widest">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.04]">
        {users.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-5 py-10 text-center text-sm indigo-500/30">
              No users found
            </td>
          </tr>
        ) : users.map(user => (
          <tr
            key={user.id}
            onClick={() => onUserClick(user)}
            className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
          >
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar initials={user.avatar} grad={user.avatarGrad} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold indigo-500/90 truncate">{user.name}</p>
                  <p className="text-[11px] indigo-500/35 font-mono truncate">{user.id.slice(0, 14)}…</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-3.5">
              <p className="text-sm indigo-500/65 truncate max-w-[180px]">{user.email}</p>
              <p className="text-[11px] indigo-500/35">{user.phone}</p>
            </td>
            <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
            <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
            <td className="px-5 py-3.5 text-xs indigo-500/40">{user.joined}</td>
            <td className="px-5 py-3.5">
              <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                View →
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─── Grid View ──────────────────────────────────────────────────────────── */
const GridView = ({ users, onUserClick }) => (
  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
    {users.length === 0 && (
      <div className="col-span-full py-10 text-center text-sm indigo-500/30">No users found</div>
    )}
    {users.map(user => (
      <div
        key={user.id}
        onClick={() => onUserClick(user)}
        className="rounded-2xl border border-white/[0.06] bg-white p-5 hover:border-white/[0.12] hover:bg-white/[0.03] cursor-pointer transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar initials={user.avatar} grad={user.avatarGrad} />
            <div className="min-w-0">
              <p className="font-semibold indigo-500/90 truncate text-sm leading-tight">{user.name}</p>
              <p className="text-[11px] indigo-500/40 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
          <StatusBadge status={user.status} />
        </div>
        <div className="flex items-center justify-between">
          <RoleBadge role={user.role} />
          <span className="text-[11px] indigo-500/30">{user.joined}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex justify-between items-center">
          <span className="text-[11px] indigo-500/30">{user.phone}</span>
          <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
            View →
          </span>
        </div>
      </div>
    ))}
  </div>
);

/* ─── User Modal ─────────────────────────────────────────────────────────── */
const UserModal = ({ user, onClose, onStatusChange }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 indigo-500/60 backdrop-blur-sm"
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div className="w-full max-w-md rounded-2xl bg-white border border-white/[0.10] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center indigo-500/40 hover:indigo-500 hover:bg-white/[0.06] transition-all"
        >
          <IconX />
        </button>
        <div className="flex items-center gap-4">
          <Avatar initials={user.avatar} grad={user.avatarGrad} size="lg" />
          <div>
            <h3 className="indigo-500 font-semibold text-lg leading-tight">{user.name}</h3>
            <p className="indigo-500/50 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 space-y-3">
        {[
          { label: 'Phone', value: user.phone },
          { label: 'User ID', value: user.id, mono: true },
          { label: 'Joined', value: user.joined },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-xs indigo-500/35 uppercase tracking-wide">{label}</span>
            <span className={`text-sm indigo-500/70 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-2">
        <button
          onClick={() => onStatusChange(user.id, 'active')}
          className="flex-1 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-semibold rounded-xl transition-colors border border-emerald-500/20"
        >
          Set Active
        </button>
        <button
          onClick={() => onStatusChange(user.id, 'inactive')}
          className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] indigo-500/60 text-sm font-semibold rounded-xl transition-colors border border-white/[0.08]"
        >
          Set Inactive
        </button>
      </div>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setRole] = useState('all');
  const [filterStatus, setStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView] = useState('table');

  const token = localStorage.getItem('adminToken');
  const toast = useToast();

  const getAvatarGradient = (role) => {
    switch (role?.toLowerCase()) {
      case 'super-admin': return 'from-purple-500 to-violet-600';
      case 'admin': return 'from-indigo-500 to-blue-600';
      case 'manager': return 'from-emerald-500 to-teal-500';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const mapped = res.data.data.users.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        phone: u.phone ? `+91 ${u.phone}` : 'N/A',
        role: u.role || 'user',
        status: u.isActive ? 'active' : 'inactive',
        joined: new Date(u.createdAt).toLocaleDateString('en-IN'),
        avatar: `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase(),
        avatarGrad: getAvatarGradient(u.role),
      }));
      setUsers(mapped);
    } catch (err) {
      console.error(err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleStatusChange = async (userId, newStatus) => {
    toast.info(`Status updated to ${newStatus}`);
    setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
    fetchUsers();
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="indigo-500/50 text-sm">Loading users…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchUsers} className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold indigo-500">
          Retry
        </button>
      </div>
    </div>
  );

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-white indigo-500">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={users.length}
            change="+12%"
            positive
            accentClass="bg-indigo-500"
            icon={<IconUsers />}
          />
          <StatCard
            label="Active Users"
            value={users.filter(u => u.status === 'active').length}
            change="+5%"
            positive
            accentClass="bg-emerald-500"
            icon={<IconCheck />}
          />
          <StatCard
            label="Admins"
            value={users.filter(u => ['admin', 'super-admin'].includes(u.role)).length}
            change="+2"
            positive
            accentClass="bg-violet-500"
            icon={<IconShield />}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Role filter tabs */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-fit flex-wrap">
            {['all', 'super-admin', 'admin', 'manager', 'user'].map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${filterRole === r
                  ? 'bg-indigo-600 indigo-500 shadow'
                  : 'indigo-500/45 hover:indigo-500/80'
                  }`}
              >
                {r === 'all' ? 'All Roles' : r === 'super-admin' ? 'Super Admin' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Row 2: Search, Status, View toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search name, email or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm indigo-500 placeholder:indigo-500/30 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setStatus(e.target.value)}
              className="bg-white/[0.04] border indigo-500 rounded-xl px-4 py-2.5 text-sm indigo-500/70 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* View toggle */}
            <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] self-start sm:self-auto">
              {[
                { v: 'table', icon: <IconTable /> },
                { v: 'grid', icon: <IconGrid /> },
              ].map(({ v, icon }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${view === v ? 'bg-indigo-600 indigo-500' : 'indigo-500/40 hover:indigo-500/70'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs indigo-500/30">
          Showing <span className="indigo-500/50 font-medium">{filteredUsers.length}</span> of {users.length} users
        </p>

        {/* Table / Grid */}
        {view === 'table'
          ? <TableView users={filteredUsers} onUserClick={setSelectedUser} />
          : <GridView users={filteredUsers} onUserClick={setSelectedUser} />
        }
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default User;