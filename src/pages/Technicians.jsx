import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

const StatCard = ({ label, value, icon, accent, change, positive }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.replace('bg-', 'bg-')} bg-opacity-20 text-white`}>
        {icon}
      </span>
      {change && (
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
          {positive ? '↑' : '↓'} {change}
        </span>
      )}
    </div>
    <p className="text-white text-3xl font-bold tracking-tighter">{value}</p>
    <p className="text-white/40 text-xs font-medium mt-1 tracking-widest uppercase">{label}</p>
  </div>
);

const Technicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setStatus] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [view, setView] = useState('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("adminToken");
  const toast = useToast();

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Technicians API Response:", res.data);

      const mappedTechnicians = res.data.data.technicians?.map(tech => ({
        id: tech._id,
        name: `${tech.firstName} ${tech.lastName}`.trim(),
        email: tech.email,
        phone: tech.phone ? `+91 ${tech.phone}` : 'N/A',
        status: tech.isActive ? 'active' : 'inactive',
        joined: new Date(tech.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        lastSeen: 'Just now',
        avatar: `${tech.firstName?.[0] || ''}${tech.lastName?.[0] || ''}`.toUpperCase(),
        avatarGrad: 'from-blue-500 to-cyan-500',
        rating: tech.rating || 4.5,
        orders: tech.jobsCompleted || 0,
      })) || [];

      setTechnicians(mappedTechnicians);
    } catch (err) {
      console.error("Error fetching technicians:", err);
      setError("Failed to load technicians. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const filteredTechnicians = technicians.filter(tech => {
    const matchSearch = 
      tech.name.toLowerCase().includes(search.toLowerCase()) ||
      tech.email.toLowerCase().includes(search.toLowerCase()) ||
      tech.id.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || tech.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    inactive: { label: 'Inactive', bg: 'bg-white/[0.06]', text: 'text-white/40', dot: 'bg-white/30' },
  };

  const handleStatusChange = async (technicianId, currentStatus, targetStatus) => {
    // If already in target status, just close
    if (currentStatus === targetStatus) {
      setSelectedTechnician(null);
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians/${technicianId}/toggle-status`,
        { isActive: targetStatus === 'active' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Toggle Status Response:", res.data);

      if (res.data.success) {
        toast.success(res.data.message || `Technician ${targetStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchTechnicians();
        setSelectedTechnician(null);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians`,
        {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.success) {
        toast.success('Technician created successfully! 🎉');
        setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '' });
        setShowCreateModal(false);
        fetchTechnicians(); // Refresh the list
      }
    } catch (err) {
      console.error('Error creating technician:', err);
      toast.error(err.response?.data?.message || 'Failed to create technician');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading technicians...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen bg-gray-950 p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Total Technicians" 
          value={technicians.length} 
          change="+5%" 
          positive 
          accent="bg-indigo-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
        />
        <StatCard 
          label="Active Technicians" 
          value={technicians.filter(t => t.status === 'active').length} 
          change="+3%" 
          positive 
          accent="bg-emerald-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard 
          label="Avg Rating" 
          value="4.7" 
          change="+0.2" 
          positive 
          accent="bg-amber-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        />
        <StatCard 
          label="Jobs Completed" 
          value="1,247" 
          change="+12%" 
          positive 
          accent="bg-violet-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m0-8l-4 4-4-4"/></svg>}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-2xl hover:from-indigo-400 hover:to-violet-400 transition-all shadow-lg shadow-indigo-500/30"
          >
            + Create Technician
          </button>
          <select
            value={filterStatus}
            onChange={e => setStatus(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search technicians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl pl-11 py-3 text-sm focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
            />
          </div>

          <div className="flex bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
            {['table', 'grid'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${view === v ? 'bg-indigo-600 text-white shadow' : 'hover:bg-white/10 text-white/40'}`}
              >
                {v === 'table' ? '≡' : '▦'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Views */}
      {view === 'table' ? (
        <TableView 
          technicians={filteredTechnicians} 
          statusConfig={statusConfig}
          onClick={setSelectedTechnician}
        />
      ) : (
        <GridView 
          technicians={filteredTechnicians} 
          statusConfig={statusConfig}
          onClick={setSelectedTechnician}
        />
      )}

      {/* Modal */}
      {selectedTechnician && (
        <TechnicianModal 
          technician={selectedTechnician} 
          onClose={() => setSelectedTechnician(null)} 
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create Technician Modal */}
      {showCreateModal && (
        <CreateTechnicianModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateTechnician}
          onClose={() => setShowCreateModal(false)}
          creating={creating}
        />
      )}
    </div>
  );
};

// ── Table View ──
const TableView = ({ technicians, statusConfig, onClick }) => (
  <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-white/[0.05] bg-white/[0.02] text-white/40 text-xs font-semibold tracking-widest uppercase">
      <div>Name</div>
      <div>Contact</div>
      <div>Joined</div>
      <div>Status</div>
      <div></div>
    </div>

    {technicians.length === 0 ? (
      <div className="p-12 text-center text-white/40">No technicians found</div>
    ) : (
      technicians.map(tech => {
        const sc = statusConfig[tech.status];
        return (
          <div
            key={tech.id}
            onClick={() => onClick(tech)}
            className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors cursor-pointer items-center group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tech.avatarGrad} flex items-center justify-center text-xs font-bold`}>
                {tech.avatar}
              </div>
              <div>
                <p className="font-medium text-white/90">{tech.name}</p>
                <p className="text-xs text-white/40 font-mono">{tech.id}</p>
              </div>
            </div>

            <div className="text-sm text-white/70">
              <p>{tech.email}</p>
              <p className="text-white/50 text-xs">{tech.phone}</p>
            </div>

            <div className="text-sm text-white/60">{tech.joined}</div>

            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onClick(tech); }}
              className="text-indigo-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-300"
            >
              View →
            </button>
          </div>
        );
      })
    )}
  </div>
);

// ── Grid View ──
const GridView = ({ technicians, statusConfig, onClick }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {technicians.map(tech => {
      const sc = statusConfig[tech.status];
      return (
        <div
          key={tech.id}
          onClick={() => onClick(tech)}
          className="bg-gray-900 border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.15] hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tech.avatarGrad} flex items-center justify-center text-lg font-bold text-white`}>
              {tech.avatar}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
          </div>

          <h3 className="font-semibold text-lg mb-0.5">{tech.name}</h3>
          <p className="text-white/50 text-sm mb-3 line-clamp-1">{tech.email}</p>

          <div className="flex items-center justify-between text-xs text-white/60">
            <div>Joined {tech.joined}</div>
            <div className="flex items-center gap-1">
              ⭐ <span className="text-amber-400 font-medium">{tech.rating}</span>
            </div>
          </div>
        </div>
      );
    })}

    {technicians.length === 0 && (
      <div className="col-span-full py-12 text-center text-white/40">No technicians found</div>
    )}
  </div>
);

// ── Improved Modal ──
const TechnicianModal = ({ technician, onClose, onStatusChange }) => {
  const sc = {
    active: { label: 'Active', color: 'text-emerald-400' },
    inactive: { label: 'Inactive', color: 'text-white/40' },
  }[technician.status];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-gray-900 rounded-3xl border border-white/[0.08] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />

        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${technician.avatarGrad} flex items-center justify-center text-2xl font-bold text-white`}>
              {technician.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{technician.name}</h2>
              <p className="text-white/50">{technician.email}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Phone</p>
              <p className="text-white font-medium">{technician.phone}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Joined</p>
              <p className="text-white font-medium">{technician.joined}</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest">Rating</p>
                <p className="text-amber-400 font-semibold text-lg">★ {technician.rating}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest">Jobs</p>
                <p className="font-semibold">{technician.orders}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => onStatusChange(technician.id, technician.status, 'active')}
              className={`flex-1 py-3 rounded-2xl font-medium transition-all border bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400`}
            >
              Mark Active
            </button>
            <button 
              onClick={() => onStatusChange(technician.id, technician.status, 'inactive')}
              className={`flex-1 py-3 rounded-2xl font-medium transition-all border bg-white/5 hover:bg-white/10 border-white/10 text-white/70`}
            >
              Mark Inactive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Create Technician Modal ──
const CreateTechnicianModal = ({ formData, setFormData, onSubmit, onClose, creating }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-gray-900 rounded-3xl border border-white/[0.08] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />

        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>

          <h2 className="text-2xl font-semibold mb-1">Create Technician</h2>
          <p className="text-white/50 text-sm mb-6">Add a new technician to your platform</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
            />

            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition-all"
            />

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
              >
                {creating ? 'Creating...' : 'Create Technician'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Technicians;