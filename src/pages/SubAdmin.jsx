import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Shield, Users, Lock } from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  suspended: { label: 'Suspended', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
};

const roleOptions = [
  { id: 'manager', label: 'Manager', permissions: ['view_dashboard', 'manage_users', 'view_reports'] },
  { id: 'supervisor', label: 'Supervisor', permissions: ['view_dashboard', 'manage_users', 'manage_cars'] },
  { id: 'operator', label: 'Operator', permissions: ['view_dashboard', 'manage_cars', 'view_enquiries'] },
  { id: 'custom', label: 'Custom Role', permissions: [] },
];

const allPermissions = [
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

const normalizeAdmin = (admin = {}) => {
  const firstName = admin.firstName || admin.name?.split(' ')[0] || '';
  const lastName = admin.lastName || admin.name?.split(' ').slice(1).join(' ') || '';

  return {
    id: admin._id || admin.id || '',
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || admin.name || 'Unknown',
    email: admin.email || '',
    phone: admin.phone || admin.contactNumber || '',
    role: admin.role || 'operator',
    permissions: admin.permissions || [],
    status: admin.status || 'active',
    createdAt: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '',
  };
};

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

/* ─── Add/Edit SubAdmin Form ─────────────────────────────────────── */
const SubAdminForm = ({ admin, onClose, onSave }) => {
  const [formData, setFormData] = useState(admin || {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'operator',
    permissions: [],
    status: 'active',
  });

  useEffect(() => {
    setFormData(admin || {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'operator',
      permissions: [],
      status: 'active',
    });
  }, [admin]);

  const selectedRole = roleOptions.find(r => r.id === formData.role);
  const rolePermissions = selectedRole?.permissions || [];

  const handleRoleChange = (newRole) => {
    const role = roleOptions.find(r => r.id === newRole);
    setFormData({
      ...formData,
      role: newRole,
      permissions: role?.permissions || [],
    });
  };

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
        {admin ? 'Edit SubAdmin' : 'Create New SubAdmin'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="John"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>
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
            <label className="text-white/60 text-sm font-medium">Password {admin ? '(leave blank to keep current)' : '*'}</label>
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

        {/* Role Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-white/60 text-sm font-medium">Assign Role *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  formData.role === role.id
                    ? 'bg-indigo-500/15 border-indigo-400/50'
                    : 'bg-gray-800/50 border-white/[0.08] hover:border-white/[0.12]'
                }`}
              >
                <p className="text-white font-medium text-sm">{role.label}</p>
                {role.id !== 'custom' && (
                  <p className="text-white/40 text-xs mt-1">{role.permissions.length} permissions</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div className="flex flex-col gap-3">
          <label className="text-white/60 text-sm font-medium">Permissions</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-800/30 border border-white/[0.06]">
            {allPermissions.map((perm) => (
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
            {admin ? 'Update SubAdmin' : 'Create SubAdmin'}
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
export default function SubAdmin() {
  const { addToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('adminToken');
  const [subAdmins, setSubAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch subadmins
  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/admin/list`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const rawAdmins = response.data?.data ?? response.data ?? [];
      const admins = Array.isArray(rawAdmins)
        ? rawAdmins
        : rawAdmins.admins ?? rawAdmins.users ?? [];

      setSubAdmins(admins.map(normalizeAdmin));
      addToast('SubAdmins loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading subadmins', error);
      addToast('Error loading subadmins', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter subadmins
  useEffect(() => {
    let filtered = subAdmins.filter((admin) => {
      const matchSearch = `${admin.name} ${admin.email}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || admin.status === filterStatus;
      return matchSearch && matchStatus;
    });
    setFilteredAdmins(filtered);
  }, [subAdmins, searchTerm, filterStatus]);

  const handleSave = async (formData) => {
    const payload = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      role: formData.role,
    };

    if (editingId) {
      setSubAdmins(subAdmins.map(admin =>
        admin.id === editingId ? { ...admin, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim() } : admin
      ));
      addToast('SubAdmin updated locally', 'success');
      resetForm();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/api/admin/register`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const createdAdmin = normalizeAdmin(response.data?.data ?? response.data ?? {});
      setSubAdmins((prev) => [createdAdmin, ...prev]);
      addToast('SubAdmin created successfully', 'success');
      resetForm();
    } catch (error) {
      console.error('Error creating subadmin', error);
      addToast('Failed to create subadmin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subadmin?')) return;

    try {
      setLoading(true);
      await axios.delete(`${apiUrl}/api/admin/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSubAdmins(subAdmins.filter(admin => admin.id !== id));
      addToast('SubAdmin deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting subadmin', error);
      addToast('Failed to delete subadmin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const totalAdmins = subAdmins.length;
  const activeAdmins = subAdmins.filter(a => a.status === 'active').length;
  const managerCount = subAdmins.filter(a => a.role === 'manager').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">SubAdmin Management</h1>
        <p className="text-white/40 text-sm">Create and manage subadmin accounts with roles and permissions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total SubAdmins"
          value={totalAdmins}
          icon={<Users className="w-4 h-4" />}
          accent="bg-indigo-500"
          sub="All"
        />
        <StatCard
          label="Active"
          value={activeAdmins}
          icon={<Shield className="w-4 h-4" />}
          accent="bg-emerald-500"
          sub="Currently"
        />
        <StatCard
          label="Managers"
          value={managerCount}
          icon={<Lock className="w-4 h-4" />}
          accent="bg-violet-500"
          sub="Total"
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
        {showForm && !editingId ? 'Cancel' : 'Create SubAdmin'}
      </button>

      {/* Form */}
      {showForm && (
        <SubAdminForm
          admin={editingId ? subAdmins.find(a => a.id === editingId) : null}
          onClose={resetForm}
          onSave={handleSave}
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

      {/* SubAdmins Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            Loading subadmins...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            No subadmins found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredAdmins.map((admin) => {
                  const sc = statusConfig[admin.status] || statusConfig.active;
                  const role = roleOptions.find(r => r.id === admin.role);

                  return (
                    <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">{admin.name}</p>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">{admin.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold">
                          {role?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/60 text-sm">{admin.permissions.length} permissions</span>
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
                            className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all text-xs font-medium"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all text-xs font-medium"
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
