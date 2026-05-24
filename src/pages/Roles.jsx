import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Lock, Users, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── API Helper ─────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20 indigo-500/60`}>
        {icon}
      </span>
      <span className="indigo-500/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Group permissions by module ────────────────────────────────────────── */
const groupByModule = (permissions) => {
  const map = {};
  for (const perm of permissions) {
    const mod = perm.module || 'General';
    if (!map[mod]) map[mod] = [];
    map[mod].push(perm);
  }
  return map;
};

/* ─── Module Permission Row ──────────────────────────────────────────────── */
const ACTION_ORDER = ['create', 'read', 'update', 'delete'];

const ModulePermissionRow = ({ module, perms, selectedIds, onToggle }) => {
  // Sort actions in consistent order; unknown actions go at end
  const sorted = [...perms].sort((a, b) => {
    const ai = ACTION_ORDER.indexOf((a.action || '').toLowerCase());
    const bi = ACTION_ORDER.indexOf((b.action || '').toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const allSelected = sorted.every((p) => selectedIds.includes(p.id || p._id));
  const someSelected = sorted.some((p) => selectedIds.includes(p.id || p._id));

  const handleSelectAll = () => {
    if (allSelected) {
      sorted.forEach((p) => {
        const id = p.id || p._id;
        if (selectedIds.includes(id)) onToggle(id);
      });
    } else {
      sorted.forEach((p) => {
        const id = p.id || p._id;
        if (!selectedIds.includes(id)) onToggle(id);
      });
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-800/40 border border-white/[0.05] hover:border-white/[0.08] transition-all">
      {/* Module name + select-all checkbox */}
      <div className="flex items-center gap-2.5 min-w-[140px]">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
          onChange={handleSelectAll}
          className="w-4 h-4 rounded bg-gray-700 border border-white/[0.15] checked:bg-indigo-500 checked:border-indigo-400 cursor-pointer accent-indigo-500"
        />
        <span className="indigo-500/80 text-sm font-semibold capitalize tracking-wide">
          {module}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.06]" />

      {/* Action checkboxes */}
      <div className="flex flex-wrap gap-3 flex-1">
        {sorted.map((perm) => {
          const id = perm.id || perm._id;
          const action = (perm.action || '').toLowerCase();
          const isChecked = selectedIds.includes(id);

          const actionColors = {
            create: isChecked ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-gray-800 border-white/[0.08] indigo-500/40',
            read: isChecked ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-gray-800 border-white/[0.08] indigo-500/40',
            update: isChecked ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-gray-800 border-white/[0.08] indigo-500/40',
            delete: isChecked ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-gray-800 border-white/[0.08] indigo-500/40',
          };

          const colorClass = actionColors[action] || (isChecked
            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
            : 'bg-gray-800 border-white/[0.08] indigo-500/40');

          return (
            <label
              key={id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer select-none transition-all duration-150 ${colorClass}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(id)}
                className="sr-only"
              />
              <span className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'currentColor', background: isChecked ? 'currentColor' : 'transparent' }}
              >
                {isChecked && (
                  <svg className="w-2 h-2 text-gray-900" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="capitalize">{action || perm.module}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Role Form ─────────────────────────────────────────────────────────── */
const RoleForm = ({ role, onClose, onSave, saving, permissions }) => {
  const [formData, setFormData] = useState(
    role
      ? {
        name: role.name,
        description: role.description || '',
        permissions: (role.permissions || []).map((p) => (typeof p === 'object' ? p._id : p)),
      }
      : { name: '', description: '', permissions: [] }
  );

  const grouped = groupByModule(permissions);
  const modules = Object.keys(grouped).sort();

  const togglePermission = (permId) =>
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="rounded-2xl bg-white border border-white/[0.06] p-6">
      <h2 className="text-xl font-bold indigo-500 mb-6">
        {role ? 'Edit Role' : 'Create New Role'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="indigo-500/60 text-sm font-medium">Role Name *</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="e.g., Content Manager"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="indigo-500/60 text-sm font-medium">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="Describe the purpose of this role..."
            />
          </div>
        </div>

        {/* Permissions — grouped by module */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="indigo-500/60 text-sm font-medium">
              Module Permissions
            </label>
            <span className="text-indigo-400 text-xs font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              {formData.permissions.length} / {permissions.length} selected
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-1">
            {[
              { action: 'create', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { action: 'read', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
              { action: 'update', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { action: 'delete', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
            ].map(({ action, color }) => (
              <span key={action} className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${color}`}>
                {action}
              </span>
            ))}
          </div>

          {/* Module rows */}
          <div className="space-y-2 p-4 rounded-xl bg-gray-800/20 border border-white/[0.05]">
            {modules.length === 0 ? (
              <p className="indigo-500/30 text-sm text-center py-4">No permissions available</p>
            ) : (
              modules.map((mod) => (
                <ModulePermissionRow
                  key={mod}
                  module={mod}
                  perms={grouped[mod]}
                  selectedIds={formData.permissions}
                  onToggle={togglePermission}
                />
              ))
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 indigo-500 font-medium hover:bg-indigo-600 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : role ? 'Update Role' : 'Create Role'}
          </button>
          <button
            type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 font-medium hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── Permission Pills ───────────────────────────────────────────────────── */
const PermissionPills = ({ role, permissions, onRemove, removing }) => {
  const populated = (role.permissions || []).map((p) => {
    if (typeof p === 'object') return p;
    return permissions.find((x) => (x.id || x._id) === p) || { _id: p, module: p };
  });

  if (populated.length === 0)
    return <span className="indigo-500/20 text-xs italic">None</span>;

  // Group pills by module
  const grouped = {};
  for (const perm of populated) {
    const mod = perm.module || 'General';
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(perm);
  }

  const actionColor = {
    create: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    read: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
    update: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    delete: 'bg-red-500/15 text-red-300 border-red-500/20',
  };

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([mod, perms]) => (
        <div key={mod} className="flex items-center gap-2 flex-wrap">
          <span className="indigo-500/40 text-xs font-semibold capitalize min-w-[80px]">{mod}</span>
          <div className="flex flex-wrap gap-1.5">
            {perms.map((perm) => {
              const id = perm.id || perm._id;
              const action = (perm.action || '').toLowerCase();
              const isRemoving = removing === id;
              const colorClass = actionColor[action] || 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20';
              return (
                <span
                  key={id}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colorClass}`}
                >
                  <span className="capitalize">{action || mod}</span>
                  <button
                    onClick={() => onRemove(role._id, id)}
                    disabled={isRemoving}
                    title="Remove permission"
                    className="ml-0.5 opacity-50 hover:opacity-100 hover:text-red-400 transition-all disabled:opacity-30"
                  >
                    {isRemoving ? '…' : '×'}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Roles() {
  const { addToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [removingPerm, setRemovingPerm] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/roles-permissions/roles', { headers: getAuthHeaders() });
      setRoles(data.data || []);
    } catch (error) {
      addToast(error?.response?.data?.message || 'Error loading roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await api.get('/api/admin/roles-permissions/permissions', { headers: getAuthHeaders() });
      setPermissions(data.data || []);
    } catch (error) {
      addToast(error?.response?.data?.message || 'Error loading permissions', 'error');
    }
  };

  useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

  useEffect(() => {
    setFilteredRoles(
      roles.filter((r) =>
        `${r.name} ${r.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [roles, searchTerm]);

  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.post(
        '/api/admin/roles-permissions/roles',
        { name: formData.name, description: formData.description },
        { headers: getAuthHeaders() }
      );
      const newRole = data.data;
      let finalRole = newRole;
      if (formData.permissions.length > 0) {
        const { data: assigned } = await api.put(
          `/api/admin/roles-permissions/${newRole._id}/permissions`,
          { permissions: formData.permissions },
          { headers: getAuthHeaders() }
        );
        finalRole = assigned.data;
      }
      setRoles((prev) => [...prev, finalRole]);
      addToast('Role created successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to create role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.put(
        `/api/admin/roles-permissions/roles/${editingRole._id}`,
        { name: formData.name, description: formData.description },
        { headers: getAuthHeaders() }
      );
      let updatedRole = data.data;
      if (formData.permissions.length > 0) {
        const { data: assigned } = await api.put(
          `/api/admin/roles-permissions/${editingRole._id}/permissions`,
          { permissions: formData.permissions },
          { headers: getAuthHeaders() }
        );
        updatedRole = assigned.data;
      } else {
        const existingPerms = (editingRole.permissions || []).map((p) =>
          typeof p === 'object' ? p._id : p
        );
        for (const permId of existingPerms) {
          await api.delete(
            `/api/admin/roles-permissions/roles/${editingRole._id}/permissions/${permId}`,
            { headers: getAuthHeaders() }
          );
        }
        const { data: fresh } = await api.get('/api/admin/roles-permissions/roles', { headers: getAuthHeaders() });
        const refreshed = (fresh.data || []).find((r) => r._id === editingRole._id);
        if (refreshed) updatedRole = refreshed;
      }
      setRoles((prev) => prev.map((r) => (r._id === editingRole._id ? updatedRole : r)));
      addToast('Role updated successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/roles-permissions/roles/${role._id}`, { headers: getAuthHeaders() });
      setRoles((prev) => prev.filter((r) => r._id !== role._id));
      addToast('Role deleted successfully', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to delete role', 'error');
    }
  };

  const handleRemovePermission = async (roleId, permissionId) => {
    setRemovingPerm(permissionId);
    try {
      const { data } = await api.delete(
        `/api/admin/roles-permissions/${roleId}/permissions/${permissionId}`,
        { headers: getAuthHeaders() }
      );
      setRoles((prev) => prev.map((r) => (r._id === roleId ? data.data : r)));
      addToast('Permission removed successfully', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to remove permission', 'error');
    } finally {
      setRemovingPerm(null);
    }
  };

  const handleSave = (formData) => editingRole ? handleUpdate(formData) : handleCreate(formData);
  const resetForm = () => { setShowForm(false); setEditingRole(null); };
  const openEdit = (role) => { setEditingRole(role); setShowForm(true); };
  const openCreate = () => {
    if (showForm && !editingRole) { resetForm(); return; }
    setEditingRole(null);
    setShowForm(true);
  };

  const totalRoles = roles.length;
  const avgPermissions = roles.length
    ? Math.round(roles.reduce((s, r) => s + (r.permissions?.length || 0), 0) / roles.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold indigo-500">Role Management</h1>
        <p className="indigo-500/40 text-sm">Create and configure roles with custom permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Roles" value={totalRoles} icon={<Lock className="w-4 h-4" />} accent="bg-indigo-500" sub="Active" />
        <StatCard label="Avg Permissions" value={avgPermissions} icon={<Users className="w-4 h-4" />} accent="bg-emerald-500" sub="Per Role" />
        <StatCard label="Available" value={permissions.length} icon={<ShieldCheck className="w-4 h-4" />} accent="bg-violet-500" sub="Permissions" />
      </div>

      {/* Create button */}
      <button
        onClick={openCreate}
        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        {showForm && !editingRole ? 'Cancel' : 'Create Role'}
      </button>

      {/* Form */}
      {showForm && (
        <RoleForm
          role={editingRole}
          onClose={resetForm}
          permissions={permissions}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center indigo-500/40">Loading roles…</div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 flex items-center justify-center indigo-500/40">No roles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Role Name', 'Description', 'Permissions', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredRoles.map((role) => (
                  <React.Fragment key={role._id}>
                    <tr className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="indigo-500 font-semibold">{role.name}</p>
                      </td>
                      <td className="px-6 py-4 indigo-500/60 text-sm max-w-xs truncate">
                        {role.description || <span className="indigo-500/20 italic">No description</span>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedRole(expandedRole === role._id ? null : role._id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/25 transition-all"
                          title="Toggle permissions"
                        >
                          {role.permissions?.length || 0} perms
                          {expandedRole === role._id
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 indigo-500/60 text-sm">
                        {role.createdAt
                          ? new Date(role.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(role)}
                            className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded permissions — grouped by module */}
                    {expandedRole === role._id && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="indigo-500/40 text-xs mb-3 uppercase tracking-wider font-semibold">
                            Permissions by Module — click × to remove
                          </p>
                          <PermissionPills
                            role={role}
                            permissions={permissions}
                            onRemove={handleRemovePermission}
                            removing={removingPerm}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 