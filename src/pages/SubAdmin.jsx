import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Shield, Users, Lock } from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';

const statusConfig = {
  active:    { label: 'Active',    bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inactive:  { label: 'Inactive',  bg: 'bg-gray-500/15',    text: 'text-gray-400',    dot: 'bg-gray-400'    },
  suspended: { label: 'Suspended', bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400'     },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const normalizeAdmin = (admin = {}) => {
  const firstName = admin.firstName || admin.name?.split(' ')[0] || '';
  const lastName  = admin.lastName  || admin.name?.split(' ').slice(1).join(' ') || '';
  return {
    id:          admin._id || admin.id || '',
    firstName,
    lastName,
    name:        `${firstName} ${lastName}`.trim() || admin.name || 'Unknown',
    email:       admin.email || '',
    phone:       admin.phone || admin.contactNumber || '',
    // role may be a populated object or a plain ID string
    role:        admin.role?._id || admin.role || '',
    roleName:    admin.role?.name || '',
    permissions: admin.permissions || [],
    status:      admin.status || 'active',
    createdAt:   admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '',
  };
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
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

/* ─── SubAdmin Form ──────────────────────────────────────────────────────── */
const SubAdminForm = ({ admin, onClose, onSave, saving, roles }) => {
  const [formData, setFormData] = useState(() => admin || {
    firstName:  '',
    lastName:   '',
    email:      '',
    password:   '',
    phone:      '',
    role:       '',   // will hold a DB role _id
    permissions: [],
    status:     'active',
  });

  // When switching to edit a different admin reset the form
  useEffect(() => {
    setFormData(admin || {
      firstName:  '',
      lastName:   '',
      email:      '',
      password:   '',
      phone:      '',
      role:       '',
      permissions: [],
      status:     'active',
    });
  }, [admin]);

  const handlePermissionToggle = (permId) =>
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

  // Build a simple permission list from the selected role object (if available)
  const selectedRole    = roles.find((r) => (r._id || r.id) === formData.role);
  const rolePermissions = selectedRole?.permissions || [];

  return (
    <div className="rounded-2xl bg-gray-900 border border-white/[0.06] p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        {admin ? 'Edit SubAdmin' : 'Create New SubAdmin'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'First Name *', key: 'firstName', type: 'text',     ph: 'John',             required: true  },
            { label: 'Last Name *',  key: 'lastName',  type: 'text',     ph: 'Doe',              required: true  },
            { label: 'Email *',      key: 'email',     type: 'email',    ph: 'john@example.com', required: true  },
          ].map(({ label, key, type, ph, required }) => (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-white/60 text-sm font-medium">{label}</label>
              <input
                type={type}
                required={required}
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
                placeholder={ph}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="+1-555-0000"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">
              Password {admin ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="Enter a secure password"
              required={!admin}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white focus:border-indigo-400/50 focus:outline-none transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Role Selection — pulled from DB */}
        <div className="flex flex-col gap-3">
          <label className="text-white/60 text-sm font-medium">
            Assign Role *
            {formData.role && selectedRole && (
              <span className="ml-2 text-indigo-400 font-semibold">{selectedRole.name}</span>
            )}
          </label>

          {roles.length === 0 ? (
            <p className="text-white/30 text-sm">Loading roles…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((role) => {
                const rid = role._id || role.id;
                return (
                  <button
                    key={rid}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: rid })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.role === rid
                        ? 'bg-indigo-500/15 border-indigo-400/50'
                        : 'bg-gray-800/50 border-white/[0.08] hover:border-white/[0.12]'
                    }`}
                  >
                    <p className="text-white font-medium text-sm">{role.name}</p>
                    {role.description && (
                      <p className="text-white/40 text-xs mt-0.5 truncate">{role.description}</p>
                    )}
                    <p className="text-white/30 text-xs mt-1">
                      {role.permissions?.length || 0} permissions
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Show permissions of the selected role (read-only preview) */}
        {selectedRole && rolePermissions.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">
              Permissions included with this role
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-800/30 border border-white/[0.06]">
              {rolePermissions.map((perm) => {
                const label = typeof perm === 'object'
                  ? `${perm.module}${perm.action ? `: ${perm.action}` : ''}`
                  : perm;
                const id = typeof perm === 'object' ? (perm._id || perm.id) : perm;
                return (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-medium"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : admin ? 'Update SubAdmin' : 'Create SubAdmin'}
          </button>
          <button
            type="button"
            onClick={onClose}
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
export default function SubAdmin() {
  const { addToast } = useToast();

  const [subAdmins,      setSubAdmins]      = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [roles,          setRoles]          = useState([]);   // DB roles
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [editingId,      setEditingId]      = useState(null);

  /* ── Fetch subadmins ───────────────────────────────────────────────────── */
  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/list`, { headers: getAuthHeaders() });
      const raw    = data?.data ?? data ?? [];
      const admins = Array.isArray(raw) ? raw : raw.admins ?? raw.users ?? [];
      setSubAdmins(admins.map(normalizeAdmin));
    } catch (error) {
      addToast(error?.response?.data?.message || 'Error loading subadmins', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch DB roles  GET /api/admin/roles-permissions/roles ────────────── */
  const fetchRoles = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/admin/roles-permissions/roles`,
        { headers: getAuthHeaders() }
      );
      setRoles(data.data || []);
    } catch (error) {
      addToast(error?.response?.data?.message || 'Error loading roles', 'error');
    }
  };

  useEffect(() => { fetchSubAdmins(); fetchRoles(); }, []);

  /* ── Filter ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    setFilteredAdmins(
      subAdmins.filter((admin) => {
        const matchSearch = `${admin.name} ${admin.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || admin.status === filterStatus;
        return matchSearch && matchStatus;
      })
    );
  }, [subAdmins, searchTerm, filterStatus]);

  /* ── Assign role to existing user  PUT /:userId/assign-role ────────────── */
  const assignRoleToUser = async (userId, roleId) => {
    const { data } = await axios.put(
      `${API_URL}/api/admin/roles-permissions/${userId}/assign-role`,
      { roleId },
      { headers: getAuthHeaders() }
    );
    return data.data; // populated user returned by backend
  };

  /* ── Create subadmin ───────────────────────────────────────────────────── */
  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        email:     formData.email,
        password:  formData.password,
        firstName: formData.firstName,
        lastName:  formData.lastName,
        phone:     formData.phone,
      };

      // 1. Register the new subadmin
      const { data } = await axios.post(
        `${API_URL}/api/admin/register`,
        payload,
        { headers: getAuthHeaders() }
      );
      let createdAdmin = normalizeAdmin(data?.data ?? data ?? {});

      // 2. If a role was selected, assign it immediately
      if (formData.role) {
        try {
          const updated = await assignRoleToUser(createdAdmin.id, formData.role);
          createdAdmin = normalizeAdmin(updated);
        } catch {
          // Non-fatal — admin is created; role can be assigned later via edit
          addToast('SubAdmin created but role assignment failed. Edit to retry.', 'error');
        }
      }

      setSubAdmins((prev) => [createdAdmin, ...prev]);
      addToast('SubAdmin created successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to create subadmin', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Update subadmin ───────────────────────────────────────────────────── */
  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      // 1. Update profile fields (name, phone, status, etc.)
      //    Adjust the endpoint to whatever your backend exposes for PATCH/PUT admin profile.
      const payload = {
        firstName: formData.firstName,
        lastName:  formData.lastName,
        phone:     formData.phone,
        status:    formData.status,
        ...(formData.password ? { password: formData.password } : {}),
      };

      await axios.put(
        `${API_URL}/api/admin/${editingId}`,
        payload,
        { headers: getAuthHeaders() }
      );

      // 2. Assign role via the dedicated endpoint  PUT /:userId/assign-role
      let updatedAdmin = null;
      if (formData.role) {
        try {
          const updated = await assignRoleToUser(editingId, formData.role);
          updatedAdmin = normalizeAdmin(updated);
        } catch (err) {
          addToast(err?.response?.data?.message || 'Role assignment failed', 'error');
        }
      }

      // 3. Patch local state
      setSubAdmins((prev) =>
        prev.map((a) => {
          if (a.id !== editingId) return a;
          if (updatedAdmin) return updatedAdmin;
          // Fallback: merge form fields locally
          return {
            ...a,
            firstName: formData.firstName,
            lastName:  formData.lastName,
            name:      `${formData.firstName} ${formData.lastName}`.trim(),
            phone:     formData.phone,
            status:    formData.status,
            role:      formData.role || a.role,
            roleName:  roles.find((r) => (r._id || r.id) === formData.role)?.name || a.roleName,
          };
        })
      );

      addToast('SubAdmin updated successfully', 'success');
      resetForm();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to update subadmin', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete subadmin ───────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subadmin?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/admin/${id}`, { headers: getAuthHeaders() });
      setSubAdmins((prev) => prev.filter((a) => a.id !== id));
      addToast('SubAdmin deleted successfully', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to delete subadmin', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const handleSave = (formData) => editingId ? handleUpdate(formData) : handleCreate(formData);

  const resetForm = () => { setShowForm(false); setEditingId(null); };

  const handleEdit = (admin) => { setEditingId(admin.id); setShowForm(true); };

  /* ── Derived stats ──────────────────────────────────────────────────────── */
  const totalAdmins  = subAdmins.length;
  const activeAdmins = subAdmins.filter((a) => a.status === 'active').length;
  // Count admins whose role name includes "manager" (case-insensitive) or match by id
  const managerCount = subAdmins.filter((a) => {
    const rn = (a.roleName || roles.find((r) => (r._id || r.id) === a.role)?.name || '').toLowerCase();
    return rn.includes('manager');
  }).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">SubAdmin Management</h1>
        <p className="text-white/40 text-sm">Create and manage subadmin accounts with roles and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total SubAdmins" value={totalAdmins}  icon={<Users className="w-4 h-4" />}  accent="bg-indigo-500"  sub="All"       />
        <StatCard label="Active"          value={activeAdmins} icon={<Shield className="w-4 h-4" />} accent="bg-emerald-500" sub="Currently" />
        <StatCard label="Managers"        value={managerCount} icon={<Lock className="w-4 h-4" />}   accent="bg-violet-500"  sub="Total"     />
      </div>

      {/* Create button */}
      <button
        onClick={() => {
          if (showForm && !editingId) { resetForm(); return; }
          setShowForm(true);
        }}
        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        {showForm && !editingId ? 'Cancel' : 'Create SubAdmin'}
      </button>

      {/* Form */}
      {showForm && (
        <SubAdminForm
          admin={editingId ? subAdmins.find((a) => a.id === editingId) : null}
          onClose={resetForm}
          onSave={handleSave}
          saving={saving}
          roles={roles}
        />
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search subadmins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] text-white placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive', 'suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                filterStatus === status
                  ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300'
                  : 'bg-gray-800 border border-white/[0.06] text-white/40 hover:text-white/60'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-white/40">Loading subadmins…</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-white/40">No subadmins found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Name', 'Email', 'Role', 'Permissions', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredAdmins.map((admin, idx) => {
                  const sc         = statusConfig[admin.status] || statusConfig.active;
                  const dbRole     = roles.find((r) => (r._id || r.id) === admin.role);
                  const roleLabel  = admin.roleName || dbRole?.name || admin.role || '—';
                  const permCount  = dbRole?.permissions?.length ?? admin.permissions?.length ?? 0;
                  // Fallback key so rows with missing/duplicate id never collide
                  const rowKey     = admin.id || `${admin.email}-${idx}`;

                  return (
                    <tr key={rowKey} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">{admin.name}</p>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">{admin.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold">
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {permCount} permission{permCount !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">{admin.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
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