import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Lock, Users } from 'lucide-react';

const defaultPermissions = [
  { id: 'view_dashboard', label: 'View Dashboard', description: 'Access admin dashboard' },
  { id: 'manage_users', label: 'Manage Users', description: 'Create, edit, delete users' },
  { id: 'manage_cars', label: 'Manage Cars', description: 'Add, edit, delete vehicle listings' },
  { id: 'manage_enquiries', label: 'Manage Enquiries', description: 'Handle customer enquiries' },
  { id: 'view_reports', label: 'View Reports', description: 'Access analytics and reports' },
  { id: 'manage_technicians', label: 'Manage Technicians', description: 'Manage technician accounts' },
  { id: 'manage_roles', label: 'Manage Roles', description: 'Create and assign roles' },
  { id: 'manage_permissions', label: 'Manage Permissions', description: 'Configure permissions' },
  { id: 'export_data', label: 'Export Data', description: 'Export reports and data' },
  { id: 'system_settings', label: 'System Settings', description: 'Configure system settings' },
];

/* ─── Stat Card ─────────────────────────────────────────────────────── */
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

/* ─── Role Form ─────────────────────────────────────────────────── */
const RoleForm = ({ role, onClose, onSave }) => {
  const [formData, setFormData] = useState(role || {
    name: '',
    description: '',
    permissions: [],
  });

  const handlePermissionToggle = (permId) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permId)
        ? formData.permissions.filter(p => p !== permId)
        : [...formData.permissions, permId]
    });
  };

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
              type="text"
              required
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
          <label className="text-white/60 text-sm font-medium">Assign Permissions</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-800/30 border border-white/[0.06]">
            {defaultPermissions.map((perm) => (
              <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(perm.id)}
                  onChange={() => handlePermissionToggle(perm.id)}
                  className="w-4 h-4 mt-1 rounded bg-gray-800 border border-white/[0.08] checked:bg-indigo-500 checked:border-indigo-400 focus:outline-none cursor-pointer"
                />
                <div>
                  <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                    {perm.label}
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
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all"
          >
            {role ? 'Update Role' : 'Create Role'}
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

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function Roles() {
  const { addToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API endpoint
      setRoles([
        {
          id: 1,
          name: 'Manager',
          description: 'Full access to user and content management',
          permissions: ['view_dashboard', 'manage_users', 'manage_cars', 'view_reports', 'manage_roles'],
          subAdminCount: 5,
          createdAt: '2025-12-01',
        },
        {
          id: 2,
          name: 'Supervisor',
          description: 'Limited access to manage content and view reports',
          permissions: ['view_dashboard', 'manage_cars', 'view_reports'],
          subAdminCount: 8,
          createdAt: '2025-12-15',
        },
        {
          id: 3,
          name: 'Operator',
          description: 'Basic access for daily operations',
          permissions: ['view_dashboard', 'manage_cars', 'manage_enquiries'],
          subAdminCount: 12,
          createdAt: '2026-01-10',
        },
      ]);
      addToast('Roles loaded successfully', 'success');
    } catch (error) {
      addToast('Error loading roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter roles
  useEffect(() => {
    let filtered = roles.filter((role) => {
      return `${role.name} ${role.description}`.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredRoles(filtered);
  }, [roles, searchTerm]);

  const handleSave = (formData) => {
    if (editingId) {
      setRoles(roles.map(role =>
        role.id === editingId ? { ...role, ...formData } : role
      ));
      addToast('Role updated successfully', 'success');
    } else {
      const newRole = {
        id: Date.now(),
        ...formData,
        subAdminCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setRoles([...roles, newRole]);
      addToast('Role created successfully', 'success');
    }
    resetForm();
  };

  const handleEdit = (role) => {
    setEditingId(role.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== id));
      addToast('Role deleted successfully', 'success');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const totalRoles = roles.length;
  const avgPermissions = roles.length > 0
    ? Math.round(roles.reduce((sum, r) => sum + r.permissions.length, 0) / roles.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Role Management</h1>
        <p className="text-white/40 text-sm">Create and configure roles with custom permissions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Roles"
          value={totalRoles}
          icon={<Lock className="w-4 h-4" />}
          accent="bg-indigo-500"
          sub="Active"
        />
        <StatCard
          label="Avg Permissions"
          value={avgPermissions}
          icon={<Users className="w-4 h-4" />}
          accent="bg-emerald-500"
          sub="Per Role"
        />
        <StatCard
          label="Available"
          value={defaultPermissions.length}
          icon={<Lock className="w-4 h-4" />}
          accent="bg-violet-500"
          sub="Permissions"
        />
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          if (showForm && !editingId) {
            resetForm();
          } else {
            setShowForm(!showForm);
          }
        }}
        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        {showForm && !editingId ? 'Cancel' : 'Create Role'}
      </button>

      {/* Form */}
      {showForm && (
        <RoleForm
          role={editingId ? roles.find(r => r.id === editingId) : null}
          onClose={resetForm}
          onSave={handleSave}
        />
      )}

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] text-white placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
        />
      </div>

      {/* Roles Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            Loading roles...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            No roles found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Role Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">SubAdmins</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold">{role.name}</p>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm max-w-xs truncate">{role.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold">
                          {role.permissions.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm">{role.subAdminCount} users</td>
                    <td className="px-6 py-4 text-white/60 text-sm">{role.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
