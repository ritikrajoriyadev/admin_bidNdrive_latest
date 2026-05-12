import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Lock, Shield } from 'lucide-react';

/* ─── API Helper ─────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

/* ─── Module/Action config for display ──────────────────────────────────── */
const moduleColors = {
  dashboard:   { bg: 'bg-indigo-500/15',  text: 'text-indigo-400'  },
  users:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  cars:        { bg: 'bg-violet-500/15',  text: 'text-violet-400'  },
  reports:     { bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  settings:    { bg: 'bg-rose-500/15',    text: 'text-rose-400'    },
  technicians: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400'    },
  enquiries:   { bg: 'bg-pink-500/15',    text: 'text-pink-400'    },
  roles:       { bg: 'bg-orange-500/15',  text: 'text-orange-400'  },
};

const getModuleStyle = (module = '') => {
  const key = module.toLowerCase();
  return moduleColors[key] || { bg: 'bg-gray-500/15', text: 'text-gray-400' };
};

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20 text-white/60`}>
        {icon}
      </span>
      <span className="text-white/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-white/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Permission Form ────────────────────────────────────────────────────── */
// Backend schema: { module, action, description }
const PermissionForm = ({ permission, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState(
    permission
      ? { module: permission.module, action: permission.action, description: permission.description || '' }
      : { module: '', action: '', description: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        {permission ? 'Edit Permission' : 'Create New Permission'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">

          {/* Module */}
         <div className="flex flex-col gap-2">
  <label className="text-white/60 text-sm font-medium">
    Module *
  </label>

  <select
    required
    value={formData.module}
    onChange={(e) =>
      setFormData({ ...formData, module: e.target.value })
    }
    className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white focus:border-indigo-400/50 focus:outline-none transition-all"
  >
    <option value="">Select Module</option>

    <option value="dashboard">Dashboard</option>
    <option value="analytics">Analytics</option>
    <option value="users">Users</option>
    <option value="enquiries">Enquiries</option>
    <option value="pdi">PDI</option>
    <option value="loans">Loans</option>
    <option value="sell_cars">Sell Cars</option>
    <option value="car_enquiries">Car Enquiries</option>
    <option value="auction_cars">Auction Cars</option>
    <option value="technicians">Technicians</option>
    <option value="subadmin">SubAdmin</option>
    <option value="roles">Roles</option>
    <option value="permissions">Permissions</option>
    <option value="banner">Banner</option>
    <option value="notifications">Notifications</option>
  </select>
</div>

          {/* Action */}
          <div className="flex flex-col gap-2">
  <label className="text-white/60 text-sm font-medium">
    Action *
  </label>

  <select
    required
    value={formData.action}
    onChange={(e) =>
      setFormData({ ...formData, action: e.target.value })
    }
    className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white focus:border-indigo-400/50 focus:outline-none transition-all"
  >
    <option value="">Select Action</option>

    <option value="create">Create</option>
    <option value="read">Read</option>
    <option value="update">Update</option>
    <option value="delete">Delete</option>
    {/* <option value="view">View</option> */}
    {/* <option value="approve">Approve</option>
    <option value="reject">Reject</option>
    <option value="export">Export</option> */}
  </select>
</div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all resize-none"
              rows="3"
              placeholder="Describe what this permission allows..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : permission ? 'Update Permission' : 'Create Permission'}
          </button>
          <button
            type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] text-white font-medium hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Permissions() {
  const { addToast } = useToast();
  const [permissions, setPermissions]               = useState([]);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [searchTerm, setSearchTerm]                 = useState('');
  const [filterModule, setFilterModule]             = useState('all');
  const [loading, setLoading]                       = useState(false);
  const [saving, setSaving]                         = useState(false);
  const [showForm, setShowForm]                     = useState(false);
  const [editingPermission, setEditingPermission]   = useState(null);

  // ── Fetch  GET /permissions ──────────────────────────────────────────────
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/roles-permissions/permissions', {
        headers: getAuthHeaders(),
      });
      setPermissions(data.data || []);
    } catch (error) {
      addToast(error?.response?.data?.message || 'Error loading permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  // ── Filter ───────────────────────────────────────────────────────────────
  const uniqueModules = [...new Set(permissions.map((p) => p.module).filter(Boolean))];

  useEffect(() => {
    setFilteredPermissions(
      permissions.filter((perm) => {
        const matchSearch = `${perm.module} ${perm.action} ${perm.description || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchModule = filterModule === 'all' || perm.module === filterModule;
        return matchSearch && matchModule;
      })
    );
  }, [permissions, searchTerm, filterModule]);

  // ── Create  POST /permissions ────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.post(
        '/api/admin/roles-permissions/permissions',
        formData,
        { headers: getAuthHeaders() }
      );
      setPermissions((prev) => [...prev, data.data]);
      addToast('Permission created successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to create permission', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Update  PUT /permissions/:permissionId ───────────────────────────────
  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.put(
        `/api/admin/roles-permissions/permissions/${editingPermission._id}`,
        formData,
        { headers: getAuthHeaders() }
      );
      setPermissions((prev) =>
        prev.map((p) => (p._id === editingPermission._id ? data.data : p))
      );
      addToast('Permission updated successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to update permission', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete  DELETE /permissions/:permissionId ────────────────────────────
  const handleDelete = async (permission) => {
    if (!window.confirm(`Delete permission "${permission.module}:${permission.action}"? This cannot be undone.`)) return;
    try {
      await api.delete(
        `/api/admin/roles-permissions/permissions/${permission._id}`,
        { headers: getAuthHeaders() }
      );
      setPermissions((prev) => prev.filter((p) => p._id !== permission._id));
      addToast('Permission deleted successfully', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to delete permission', 'error');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleSave = (formData) =>
    editingPermission ? handleUpdate(formData) : handleCreate(formData);

  const resetForm = () => {
    setShowForm(false);
    setEditingPermission(null);
  };

  const openEdit = (perm) => {
    setEditingPermission(perm);
    setShowForm(true);
  };

  const openCreate = () => {
    if (showForm && !editingPermission) { resetForm(); return; }
    setEditingPermission(null);
    setShowForm(true);
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalPermissions = permissions.length;
  const totalModules     = uniqueModules.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Permission Management</h1>
        <p className="text-white/40 text-sm">Create and manage system permissions for fine-grained access control</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Permissions" value={totalPermissions} icon={<Lock className="w-4 h-4" />}   accent="bg-indigo-500"  sub="All"     />
        <StatCard label="Modules"           value={totalModules}     icon={<Shield className="w-4 h-4" />} accent="bg-emerald-500" sub="Groups"  />
        <StatCard label="Active"            value={totalPermissions} icon={<Lock className="w-4 h-4" />}   accent="bg-violet-500"  sub="Enabled" />
      </div>

      {/* Create button */}
      <button
        onClick={openCreate}
        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        {showForm && !editingPermission ? 'Cancel' : 'Create Permission'}
      </button>

      {/* Form */}
      {showForm && (
        <PermissionForm
          permission={editingPermission}
          onClose={resetForm}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Search & Module Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by module, action, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] text-white placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
          />
        </div>

        {/* Dynamic module filter pills */}
        {uniqueModules.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {['all', ...uniqueModules].map((mod) => (
              <button
                key={mod}
                onClick={() => setFilterModule(mod)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 capitalize ${
                  filterModule === mod
                    ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300'
                    : 'bg-gray-800 border border-white/[0.06] text-white/40 hover:text-white/60'
                }`}
              >
                {mod === 'all' ? 'All' : mod}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            Loading permissions…
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            No permissions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Module', 'Action', 'Description', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredPermissions.map((perm) => {
                  const style = getModuleStyle(perm.module);
                  return (
                    <tr key={perm._id} className="hover:bg-white/[0.02] transition-colors duration-150">

                      {/* Module */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${style.bg} ${style.text}`}>
                          {perm.module}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold font-mono text-sm">{perm.action}</p>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-white/60 text-sm max-w-xs truncate">
                        {perm.description || <span className="text-white/20 italic">No description</span>}
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {perm.createdAt
                          ? new Date(perm.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(perm)}
                            className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(perm)}
                            className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}