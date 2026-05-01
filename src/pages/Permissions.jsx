import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Lock, Shield } from 'lucide-react';

const categoryConfig = {
  dashboard: { label: 'Dashboard', bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
  users: { label: 'Users', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  content: { label: 'Content', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  reports: { label: 'Reports', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  settings: { label: 'Settings', bg: 'bg-rose-500/15', text: 'text-rose-400' },
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

/* ─── Permission Form ─────────────────────────────────────────────── */
const PermissionForm = ({ permission, onClose, onSave }) => {
  const [formData, setFormData] = useState(permission || {
    name: '',
    slug: '',
    description: '',
    category: 'dashboard',
  });

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
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Permission Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="e.g., View Dashboard"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Permission Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:outline-none transition-all"
              placeholder="e.g., view_dashboard"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-sm font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] text-white focus:border-indigo-400/50 focus:outline-none transition-all"
            >
              {Object.entries(categoryConfig).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

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
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all"
          >
            {permission ? 'Update Permission' : 'Create Permission'}
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
export default function Permissions() {
  const { addToast } = useToast();
  const [permissions, setPermissions] = useState([]);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch permissions
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API endpoint
      setPermissions([
        {
          id: 1,
          name: 'View Dashboard',
          slug: 'view_dashboard',
          description: 'Access to the main admin dashboard',
          category: 'dashboard',
          createdAt: '2025-12-01',
        },
        {
          id: 2,
          name: 'Create User',
          slug: 'create_user',
          description: 'Ability to create new user accounts',
          category: 'users',
          createdAt: '2025-12-05',
        },
        {
          id: 3,
          name: 'Edit User',
          slug: 'edit_user',
          description: 'Ability to modify user account details',
          category: 'users',
          createdAt: '2025-12-06',
        },
        {
          id: 4,
          name: 'Delete User',
          slug: 'delete_user',
          description: 'Ability to remove user accounts',
          category: 'users',
          createdAt: '2025-12-07',
        },
        {
          id: 5,
          name: 'Manage Content',
          slug: 'manage_content',
          description: 'Full access to manage website content',
          category: 'content',
          createdAt: '2025-12-10',
        },
        {
          id: 6,
          name: 'View Reports',
          slug: 'view_reports',
          description: 'Access to view analytics and reports',
          category: 'reports',
          createdAt: '2025-12-15',
        },
      ]);
      addToast('Permissions loaded successfully', 'success');
    } catch (error) {
      addToast('Error loading permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter permissions
  useEffect(() => {
    let filtered = permissions.filter((perm) => {
      const matchSearch = `${perm.name} ${perm.slug} ${perm.description}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'all' || perm.category === filterCategory;
      return matchSearch && matchCategory;
    });
    setFilteredPermissions(filtered);
  }, [permissions, searchTerm, filterCategory]);

  const handleSave = (formData) => {
    if (editingId) {
      setPermissions(permissions.map(perm =>
        perm.id === editingId ? { ...perm, ...formData } : perm
      ));
      addToast('Permission updated successfully', 'success');
    } else {
      const newPermission = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setPermissions([...permissions, newPermission]);
      addToast('Permission created successfully', 'success');
    }
    resetForm();
  };

  const handleEdit = (perm) => {
    setEditingId(perm.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this permission?')) {
      setPermissions(permissions.filter(perm => perm.id !== id));
      addToast('Permission deleted successfully', 'success');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const totalPermissions = permissions.length;
  const categories = new Set(permissions.map(p => p.category)).size;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Permission Management</h1>
        <p className="text-white/40 text-sm">Create and manage system permissions for fine-grained access control</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Permissions"
          value={totalPermissions}
          icon={<Lock className="w-4 h-4" />}
          accent="bg-indigo-500"
          sub="All"
        />
        <StatCard
          label="Categories"
          value={categories}
          icon={<Shield className="w-4 h-4" />}
          accent="bg-emerald-500"
          sub="Types"
        />
        <StatCard
          label="Active"
          value={totalPermissions}
          icon={<Lock className="w-4 h-4" />}
          accent="bg-violet-500"
          sub="Enabled"
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
        {showForm && !editingId ? 'Cancel' : 'Create Permission'}
      </button>

      {/* Form */}
      {showForm && (
        <PermissionForm
          permission={editingId ? permissions.find(p => p.id === editingId) : null}
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
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] text-white placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(categoryConfig)].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                filterCategory === cat
                  ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300'
                  : 'bg-gray-800 border border-white/[0.06] text-white/40 hover:text-white/60'
              }`}
            >
              {cat === 'all' ? 'All' : categoryConfig[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Table */}
      <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-white/40">
            Loading permissions...
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Permission Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredPermissions.map((perm) => {
                  const catConfig = categoryConfig[perm.category] || categoryConfig.dashboard;

                  return (
                    <tr key={perm.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">{perm.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white/60 text-sm font-mono">{perm.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${catConfig.bg} ${catConfig.text}`}>
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm max-w-xs truncate">{perm.description}</td>
                      <td className="px-6 py-4 text-white/60 text-sm">{perm.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(perm)}
                            className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(perm.id)}
                            className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all"
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
