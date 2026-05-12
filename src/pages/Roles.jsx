import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Lock, Users, ShieldCheck } from 'lucide-react';

/* ─── API Helper ─────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: API_URL });

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

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

/* ─── Role Form ─────────────────────────────────────────────────────────── */
const RoleForm = ({ role, onClose, onSave, saving, permissions }) => {
  const [formData, setFormData] = useState(
    role
      ? {
          name: role.name,
          description: role.description || '',
          // permissions may be populated objects or plain IDs
          permissions: (role.permissions || []).map((p) => (typeof p === 'object' ? p._id : p)),
        }
      : { name: '', description: '', permissions: [] }
  );

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
    <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        {role ? 'Edit Role' : 'Create New Role'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Role Name *</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="e.g., Content Manager"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all resize-none"
              rows="3"
              placeholder="Describe the purpose of this role..."
            />
          </div>
        </div>

        {/* Permissions */}
        <div className="flex flex-col gap-3">
          <label className="text-white/60 text-sm font-medium">
            Assign Permissions
            <span className="ml-2 text-indigo-400 font-semibold">
              ({formData.permissions.length} selected)
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-800/30 border border-white/[0.06]">
            {permissions.map((perm) => (
              <label key={perm.id || perm._id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(perm.id || perm._id)}
                  onChange={() => togglePermission(perm.id || perm._id)}
                  className="w-4 h-4 mt-1 rounded bg-gray-800 border border-white/[0.08] checked:bg-indigo-500 checked:border-indigo-400 focus:outline-none cursor-pointer"
                />
                <div>
                  <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                    {perm.module}{perm.action && `: ${perm.action}`}
                  </p>
                  <p className="text-white/40 text-xs">{perm.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : role ? 'Update Role' : 'Create Role'}
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

/* ─── Permission Pills (inline remove) ──────────────────────────────────── */
const PermissionPills = ({ role, permissions, onRemove, removing }) => {
  const populated = (role.permissions || []).map((p) => {
    if (typeof p === 'object') return p;
    // match by id from the master permissions list
    return permissions.find((x) => (x.id || x._id) === p) || { _id: p, module: p };
  });

  if (populated.length === 0)
    return <span className="text-white/20 text-xs italic">None</span>;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {populated.map((perm) => {
        const id = perm.id || perm._id;
        const isRemoving = removing === id;
        return (
          <span
            key={id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-medium"
          >
            {perm.module}{perm.action && `:${perm.action}`}
            <button
              onClick={() => onRemove(role._id, id)}
              disabled={isRemoving}
              title="Remove permission"
              className="ml-0.5 text-indigo-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {isRemoving ? '…' : '×'}
            </button>
          </span>
        );
      })}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Roles() {
  const { addToast } = useToast();
  const [roles, setRoles]                   = useState([]);
  const [filteredRoles, setFilteredRoles]   = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [showForm, setShowForm]             = useState(false);
  const [editingRole, setEditingRole]       = useState(null);
  const [permissions, setPermissions]       = useState([]);
  const [removingPerm, setRemovingPerm]     = useState(null); // permissionId being removed
  const [expandedRole, setExpandedRole]     = useState(null); // roleId whose pills are visible

  /* ── Fetch roles ───────────────────────────────────────────────────────── */
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

  /* ── Fetch permissions ─────────────────────────────────────────────────── */
  const fetchPermissions = async () => {
    try {
      const { data } = await api.get('/api/admin/roles-permissions/permissions', { headers: getAuthHeaders() });
      setPermissions(data.data || []);
    } catch (error) {
      addToast(error?.response?.data?.message || 'Error loading permissions', 'error');
    }
  };

  useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

  /* ── Filter ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    setFilteredRoles(
      roles.filter((r) =>
        `${r.name} ${r.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [roles, searchTerm]);

  /* ── Create role ───────────────────────────────────────────────────────── */
  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      // 1. Create the role (without permissions in body if your route ignores them,
      //    or keep them — the assignPermissions call below will authoratively set them)
      const { data } = await api.post(
        '/api/admin/roles-permissions/roles',
        { name: formData.name, description: formData.description },
        { headers: getAuthHeaders() }
      );
      const newRole = data.data;

      // 2. If permissions were selected, assign them via the dedicated endpoint
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

  /* ── Update role ───────────────────────────────────────────────────────── */
  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      // 1. Update name / description
      const { data } = await api.put(
        `/api/admin/roles-permissions/roles/${editingRole._id}`,
        { name: formData.name, description: formData.description },
        { headers: getAuthHeaders() }
      );
      let updatedRole = data.data;

      // 2. Sync permissions via PUT /:roleId/permissions (replaces all)
      //    Always call this so removing all permissions is also handled.
      if (formData.permissions.length > 0) {
        const { data: assigned } = await api.put(
          `/api/admin/roles-permissions/${editingRole._id}/permissions`,
          { permissions: formData.permissions },
          { headers: getAuthHeaders() }
        );
        updatedRole = assigned.data;
      } else {
        // If all permissions deselected, remove them one by one
        const existingPerms = (editingRole.permissions || []).map((p) =>
          typeof p === 'object' ? p._id : p
        );
        for (const permId of existingPerms) {
          await api.delete(
            `/api/admin/roles-permissions/roles/${editingRole._id}/permissions/${permId}`,
            { headers: getAuthHeaders() }
          );
        }
        // Refetch to get clean state
        const { data: fresh } = await api.get('/api/admin/roles-permissions/roles', { headers: getAuthHeaders() });
        const refreshed = (fresh.data || []).find((r) => r._id === editingRole._id);
        if (refreshed) updatedRole = refreshed;
      }

      setRoles((prev) =>
        prev.map((r) => (r._id === editingRole._id ? updatedRole : r))
      );
      addToast('Role updated successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete role ───────────────────────────────────────────────────────── */
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

  /* ── Remove single permission from role  DELETE /:roleId/permissions/:permId ── */
  const handleRemovePermission = async (roleId, permissionId) => {
    setRemovingPerm(permissionId);
    try {
      const { data } = await api.delete(
        `/api/admin/roles-permissions/${roleId}/permissions/${permissionId}`,
        { headers: getAuthHeaders() }
      );
      // Backend returns updated role — sync local state
      const updatedRole = data.data;
      setRoles((prev) =>
        prev.map((r) => (r._id === roleId ? updatedRole : r))
      );
      addToast('Permission removed successfully', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to remove permission', 'error');
    } finally {
      setRemovingPerm(null);
    }
  };

  /* ── Assign permissions bulk  PUT /:roleId/permissions ───────────────── */
  // Exposed so you can call it standalone if needed (e.g. a "Manage Permissions" button)
  const handleAssignPermissions = async (roleId, permissionIds) => {
    try {
      const { data } = await api.put(
        `/api/admin/roles-permissions/${roleId}/permissions`,
        { permissions: permissionIds },
        { headers: getAuthHeaders() }
      );
      const updatedRole = data.data;
      setRoles((prev) =>
        prev.map((r) => (r._id === roleId ? updatedRole : r))
      );
      addToast('Permissions assigned successfully', 'success');
      return updatedRole;
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to assign permissions', 'error');
      return null;
    }
  };

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const handleSave    = (formData) => editingRole ? handleUpdate(formData) : handleCreate(formData);
  const resetForm     = () => { setShowForm(false); setEditingRole(null); };
  const openEdit      = (role) => { setEditingRole(role); setShowForm(true); };
  const openCreate    = () => {
    if (showForm && !editingRole) { resetForm(); return; }
    setEditingRole(null);
    setShowForm(true);
  };

  /* ── Derived stats ──────────────────────────────────────────────────────── */
  const totalRoles      = roles.length;
  const avgPermissions  = roles.length
    ? Math.round(roles.reduce((s, r) => s + (r.permissions?.length || 0), 0) / roles.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Role Management</h1>
        <p className="text-white/40 text-sm">Create and configure roles with custom permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Roles"     value={totalRoles}         icon={<Lock className="w-4 h-4" />}        accent="bg-indigo-500"  sub="Active"      />
        <StatCard label="Avg Permissions" value={avgPermissions}     icon={<Users className="w-4 h-4" />}       accent="bg-emerald-500" sub="Per Role"    />
        <StatCard label="Available"       value={permissions.length} icon={<ShieldCheck className="w-4 h-4" />} accent="bg-violet-500"  sub="Permissions" />
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] text-white placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-white/40">Loading roles…</div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-white/40">No roles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Role Name', 'Description', 'Permissions', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredRoles.map((role) => (
                  <React.Fragment key={role._id}>
                    <tr className="hover:bg-white/[0.02] transition-colors duration-150">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">{role.name}</p>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-white/60 text-sm max-w-xs truncate">
                        {role.description || <span className="text-white/20 italic">No description</span>}
                      </td>

                      {/* Permissions count + expand toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedRole(expandedRole === role._id ? null : role._id)}
                          className="px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/25 transition-all"
                          title="Toggle permissions"
                        >
                          {role.permissions?.length || 0} perms
                        </button>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {role.createdAt
                          ? new Date(role.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
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

                    {/* Expandable permissions row with inline remove buttons */}
                    {expandedRole === role._id && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                            Permissions — click × to remove individually
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