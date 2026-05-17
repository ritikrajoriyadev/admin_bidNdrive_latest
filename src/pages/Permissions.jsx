import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Lock, Shield, LayoutGrid, X } from 'lucide-react';

/* ─── API Helper ─────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

/* ─── Constants ──────────────────────────────────────────────────────────── */
const MODULES = [
  'dashboard', 'analytics', 'users', 'enquiries', 'pdi', 'loans',
  'sell_cars', 'car_enquiries', 'auction_cars', 'technicians',
  'telecaller', 'subadmin', 'roles', 'permissions', 'banner', 'notifications',
];

const ACTIONS = ['create', 'read', 'update', 'delete'];

const MODULE_COLORS = {
  dashboard:      { bg: 'bg-indigo-500/15',  text: 'text-indigo-400'  },
  users:          { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  cars:           { bg: 'bg-violet-500/15',  text: 'text-violet-400'  },
  reports:        { bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  settings:       { bg: 'bg-rose-500/15',    text: 'text-rose-400'    },
  technicians:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400'    },
  enquiries:      { bg: 'bg-pink-500/15',    text: 'text-pink-400'    },
  roles:          { bg: 'bg-orange-500/15',  text: 'text-orange-400'  },
};

const MODULE_DOT_COLORS = {
  dashboard:      '#6366F1', analytics:  '#22C55E', users:        '#10B981',
  enquiries:      '#EC4899', pdi:        '#8B5CF6', loans:        '#F59E0B',
  sell_cars:      '#3B82F6', car_enquiries:'#14B8A6',auction_cars:'#F97316',
  technicians:    '#06B6D4', telecaller: '#D946EF', subadmin:     '#64748B',
  roles:          '#EF4444', permissions:'#A855F7', banner:       '#0EA5E9',
  notifications:  '#84CC16',
};

const getModuleStyle = (module = '') =>
  MODULE_COLORS[module.toLowerCase()] || { bg: 'bg-gray-500/15', text: 'text-gray-400' };

const permKey = (mod, act) => `${mod}::${act}`;

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

/* ─── Single Permission Form ─────────────────────────────────────────────── */
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
            <label className="text-white/60 text-sm font-medium">Module *</label>
            <select
              required
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white focus:border-indigo-400/50 focus:outline-none transition-all"
            >
              <option value="">Select Module</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Action *</label>
            <select
              required
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white focus:border-indigo-400/50 focus:outline-none transition-all"
            >
              <option value="">Select Action</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
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

/* ─── Bulk Permission Form ───────────────────────────────────────────────── */
const BulkPermissionForm = ({ onClose, onSave, saving }) => {
  const [selected, setSelected] = useState(new Set());
  const [description, setDescription] = useState('');

  const toggle = (mod, act) => {
    const k = permKey(mod, act);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const toggleRow = (mod) => {
    const keys = ACTIONS.map((a) => permKey(mod, a));
    const allOn = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleCol = (act) => {
    const keys = MODULES.map((m) => permKey(m, act));
    const allOn = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleAll = () => {
    const allKeys = MODULES.flatMap((m) => ACTIONS.map((a) => permKey(m, a)));
    const allOn = allKeys.every((k) => selected.has(k));
    setSelected(allOn ? new Set() : new Set(allKeys));
  };

  const removePill = (k) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(k);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    const permissions = [...selected].map((k) => {
      const [module, action] = k.split('::');
      return { module, action, description };
    });
    onSave(permissions);
  };

  const selectedList = [...selected].map((k) => {
    const [mod, act] = k.split('::');
    return { k, mod, act };
  });

  const allKeys = MODULES.flatMap((m) => ACTIONS.map((a) => permKey(m, a)));
  const allSelected = allKeys.every((k) => selected.has(k));

  return (
    <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6 space-y-5">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bulk Create Permissions</h2>
          <p className="text-white/40 text-sm mt-0.5">Select module × action combinations to create all at once</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg bg-gray-800 text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-white/[0.06] bg-gray-800/60">
              {/* top-left: select-all */}
              <th className="px-4 py-3 text-left w-44">
                <button
                  onClick={toggleAll}
                  className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              </th>
              {ACTIONS.map((act) => (
                <th key={act} className="px-3 py-3 text-center border-l border-white/[0.06]">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider capitalize">{act}</span>
                    <button
                      onClick={() => toggleCol(act)}
                      className="text-[10px] text-white/30 hover:text-white/60 bg-white/5 hover:bg-white/10 rounded-md px-2 py-0.5 transition-all"
                    >
                      all
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {MODULES.map((mod) => {
              const rowKeys = ACTIONS.map((a) => permKey(mod, a));
              const rowAllOn = rowKeys.every((k) => selected.has(k));
              const rowSomeOn = rowKeys.some((k) => selected.has(k));
              return (
                <tr key={mod} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Module label */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: MODULE_DOT_COLORS[mod] || '#888' }}
                      />
                      <span className="text-sm text-white font-medium capitalize">{mod.replace('_', ' ')}</span>
                      <button
                        onClick={() => toggleRow(mod)}
                        className={`ml-auto text-[10px] rounded-md px-2 py-0.5 transition-all opacity-0 group-hover:opacity-100 ${
                          rowAllOn
                            ? 'text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25'
                            : 'text-white/40 bg-white/5 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {rowAllOn ? 'clear' : rowSomeOn ? 'all' : 'all'}
                      </button>
                    </div>
                  </td>

                  {/* Action checkboxes */}
                  {ACTIONS.map((act) => {
                    const k = permKey(mod, act);
                    const checked = selected.has(k);
                    return (
                      <td key={act} className="px-3 py-3 text-center border-l border-white/[0.04]">
                        <button
                          onClick={() => toggle(mod, act)}
                          aria-label={`${mod} ${act}`}
                          aria-checked={checked}
                          role="checkbox"
                          className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-all duration-150 ${
                            checked
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'bg-gray-800 border-white/[0.12] hover:border-indigo-400/40'
                          }`}
                        >
                          {checked && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4L4.5 7.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected pills */}
      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedList.slice(0, 14).map(({ k, mod, act }) => (
            <span
              key={k}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 border border-white/[0.08] text-xs"
            >
              <span className="text-white font-medium capitalize">{mod.replace('_', ' ')}</span>
              <span className="text-white/30">:</span>
              <span className="text-white/60 capitalize">{act}</span>
              <button
                onClick={() => removePill(k)}
                className="ml-0.5 text-white/30 hover:text-white/70 transition-colors"
                aria-label={`Remove ${mod} ${act}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {selectedList.length > 14 && (
            <span className="px-2.5 py-1 rounded-full bg-gray-800 border border-white/[0.08] text-xs text-white/40 italic">
              +{selectedList.length - 14} more
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-white/60 text-sm font-medium">
          Description
          <span className="text-white/30 font-normal ml-1">(applies to all created permissions)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all resize-none"
          rows="2"
          placeholder="Describe what these permissions allow..."
        />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-white/[0.06]">
          <Lock className="w-3.5 h-3.5 text-white/40" />
          <span className="text-sm text-white/60">
            <span className="text-white font-semibold">{selected.size}</span> selected
          </span>
        </div>

        <button
          onClick={() => setSelected(new Set())}
          className="px-4 py-2 rounded-xl bg-gray-800 border border-white/[0.06] text-white/50 text-sm font-medium hover:text-white hover:bg-gray-700 transition-all"
        >
          Clear all
        </button>

        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || saving}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-4 h-4" />
          {saving
            ? 'Creating…'
            : `Create ${selected.size > 0 ? selected.size : ''} permission${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Permissions() {
  const { addToast } = useToast();
  const [permissions, setPermissions]                 = useState([]);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [searchTerm, setSearchTerm]                   = useState('');
  const [filterModule, setFilterModule]               = useState('all');
  const [loading, setLoading]                         = useState(false);
  const [saving, setSaving]                           = useState(false);

  // 'none' | 'single' | 'bulk'
  const [formMode, setFormMode]                       = useState('none');
  const [editingPermission, setEditingPermission]     = useState(null);

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchPermissions = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  /* ── Filter ─────────────────────────────────────────────────────────────── */
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

  /* ── Create single ──────────────────────────────────────────────────────── */
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

  /* ── Bulk create ─────────────────────────────────────────────────────────── */
  const handleBulkCreate = async (permissionsList) => {
    setSaving(true);
    const results = await Promise.allSettled(
      permissionsList.map((p) =>
        api.post('/api/admin/roles-permissions/permissions', p, { headers: getAuthHeaders() })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed    = results.filter((r) => r.status === 'rejected');

    if (succeeded.length > 0) {
      const newPerms = succeeded.map((r) => r.value.data.data);
      setPermissions((prev) => [...prev, ...newPerms]);
    }

    if (failed.length === 0) {
      addToast(`${succeeded.length} permission${succeeded.length !== 1 ? 's' : ''} created successfully`, 'success');
    } else if (succeeded.length === 0) {
      addToast('Failed to create permissions', 'error');
    } else {
      addToast(`${succeeded.length} created, ${failed.length} failed`, 'error');
    }

    setSaving(false);
    resetForm();
  };

  /* ── Update ─────────────────────────────────────────────────────────────── */
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

  /* ── Delete ─────────────────────────────────────────────────────────────── */
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

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  const handleSingleSave = (formData) =>
    editingPermission ? handleUpdate(formData) : handleCreate(formData);

  const resetForm = () => {
    setFormMode('none');
    setEditingPermission(null);
  };

  const openEdit = (perm) => {
    setEditingPermission(perm);
    setFormMode('single');
  };

  const openSingle = () => {
    if (formMode === 'single' && !editingPermission) { resetForm(); return; }
    setEditingPermission(null);
    setFormMode('single');
  };

  const openBulk = () => {
    if (formMode === 'bulk') { resetForm(); return; }
    setFormMode('bulk');
    setEditingPermission(null);
  };

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

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={openSingle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
            formMode === 'single' && !editingPermission
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-indigo-500/15 border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25'
          }`}
        >
          <Plus className="w-4 h-4" />
          {formMode === 'single' && !editingPermission ? 'Cancel' : 'Create Permission'}
        </button>

        <button
          onClick={openBulk}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
            formMode === 'bulk'
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-violet-500/15 border-violet-400/25 text-violet-300 hover:bg-violet-500/25'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          {formMode === 'bulk' ? 'Cancel' : 'Bulk Create'}
        </button>
      </div>

      {/* Forms */}
      {formMode === 'single' && (
        <PermissionForm
          permission={editingPermission}
          onClose={resetForm}
          onSave={handleSingleSave}
          saving={saving}
        />
      )}

      {formMode === 'bulk' && (
        <BulkPermissionForm
          onClose={resetForm}
          onSave={handleBulkCreate}
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
          <div className="p-8 flex items-center justify-center text-white/40">Loading permissions…</div>
        ) : filteredPermissions.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-white/40">No permissions found</div>
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
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${style.bg} ${style.text}`}>
                          {perm.module}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold font-mono text-sm">{perm.action}</p>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm max-w-xs truncate">
                        {perm.description || <span className="text-white/20 italic">No description</span>}
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {perm.createdAt
                          ? new Date(perm.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : '—'}
                      </td>
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