import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Shield, Users, Lock } from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';

const statusConfig = {
    active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    inactive: { label: 'Inactive', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
    suspended: { label: 'Suspended', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

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
        role: admin.role?._id || admin.role || '',
        roleName: admin.role?.name || '',
        permissions: admin.permissions || [],
        status: admin.status || 'active',
        createdAt: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '',
    };
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
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

/* ─── RA Form ──────────────────────────────────────────────────────── */
const RAForm = ({ admin, onClose, onSave, saving }) => {
    const [formData, setFormData] = useState(() => admin || {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        status: 'active',
    });

    useEffect(() => {
        setFormData(admin || {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
            status: 'active',
        });
    }, [admin]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="rounded-2xl bg-white border border-white/[0.06] p-6">
            <h2 className="text-xl font-bold indigo-500 mb-6">
                {admin ? 'Edit RA' : 'Create New RA'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'First Name *', key: 'firstName', type: 'text', ph: 'John', required: true },
                        { label: 'Last Name *', key: 'lastName', type: 'text', ph: 'Doe', required: true },
                        { label: 'Email *', key: 'email', type: 'email', ph: 'john@example.com', required: true },
                    ].map(({ label, key, type, ph, required }) => (
                        <div key={key} className="flex flex-col gap-2">
                            <label className="indigo-500/60 text-sm font-medium">{label}</label>
                            <input
                                type={type}
                                required={required}
                                value={formData[key]}
                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
                                placeholder={ph}
                            />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="indigo-500/60 text-sm font-medium">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
                            placeholder="+1-555-0000"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="indigo-500/60 text-sm font-medium">
                            Password {admin ? '(leave blank to keep current)' : '*'}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
                            placeholder="Enter a secure password"
                            required={!admin}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="indigo-500/60 text-sm font-medium">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.08] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 indigo-500 font-medium hover:bg-indigo-600 disabled:opacity-50 transition-all"
                    >
                        {saving ? 'Saving…' : admin ? 'Update RA' : 'Create RA'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 font-medium hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function RA() {
    const { addToast } = useToast();

    const [RAs, setRAs] = useState([]);
    const [filteredAdmins, setFilteredAdmins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    /* ── Fetch RAs ─────────────────────────────────────────────────── */
    const fetchRAs = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/RA`, { headers: getAuthHeaders() });
            const raw = data?.data ?? data ?? [];
            const admins = Array.isArray(raw) ? raw : raw.admins ?? raw.users ?? [];
            setRAs(admins.map(normalizeAdmin));
        } catch (error) {
            addToast(error?.response?.data?.message || 'Error loading RAs', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRAs(); }, []);

    /* ── Filter ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        setFilteredAdmins(
            RAs.filter((admin) => {
                const matchSearch = `${admin.name} ${admin.email}`.toLowerCase().includes(searchTerm.toLowerCase());
                const matchStatus = filterStatus === 'all' || admin.status === filterStatus;
                return matchSearch && matchStatus;
            })
        );
    }, [RAs, searchTerm, filterStatus]);

    /* ── Create ──────────────────────────────────────────────────────────── */
    const handleCreate = async (formData) => {
        setSaving(true);
        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            };
            const { data } = await axios.post(
                `${API_URL}/api/admin/create/RA`,
                payload,
                { headers: getAuthHeaders() }
            );
            const createdAdmin = normalizeAdmin(data?.data ?? data ?? {});
            setRAs((prev) => [createdAdmin, ...prev]);
            addToast('RA created successfully', 'success');
            resetForm();
        } catch (error) {
            addToast(error?.response?.data?.message || 'Failed to create RA', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── Update ──────────────────────────────────────────────────────────── */
    const handleUpdate = async (formData) => {
        setSaving(true);
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                status: formData.status,
                ...(formData.password ? { password: formData.password } : {}),
            };
            await axios.put(
                `${API_URL}/api/admin/${editingId}`,
                payload,
                { headers: getAuthHeaders() }
            );
            setRAs((prev) =>
                prev.map((a) =>
                    a.id !== editingId ? a : {
                        ...a,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        name: `${formData.firstName} ${formData.lastName}`.trim(),
                        phone: formData.phone,
                        status: formData.status,
                    }
                )
            );
            addToast('RA updated successfully', 'success');
            resetForm();
        } catch (error) {
            addToast(error?.response?.data?.message || 'Failed to update RA', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── Delete ──────────────────────────────────────────────────────────── */
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this RA?')) return;
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/api/admin/${id}`, { headers: getAuthHeaders() });
            setRAs((prev) => prev.filter((a) => a.id !== id));
            addToast('RA deleted successfully', 'success');
        } catch (error) {
            addToast(error?.response?.data?.message || 'Failed to delete RA', 'error');
        } finally {
            setLoading(false);
        }
    };

    /* ── Helpers ─────────────────────────────────────────────────────────── */
    const handleSave = (formData) => editingId ? handleUpdate(formData) : handleCreate(formData);
    const resetForm = () => { setShowForm(false); setEditingId(null); };
    const handleEdit = (admin) => { setEditingId(admin.id); setShowForm(true); };

    /* ── Derived stats ───────────────────────────────────────────────────── */
    const totalAdmins = RAs.length;
    const activeAdmins = RAs.filter((a) => a.status === 'active').length;
    const managerCount = RAs.filter((a) =>
        (a.roleName || '').toLowerCase().includes('manager')
    ).length;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold indigo-500">RA Management</h1>
                <p className="indigo-500/40 text-sm">Create and manage retail associate accounts with roles and permissions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total RAs" value={totalAdmins} icon={<Users className="w-4 h-4" />} accent="bg-indigo-500" sub="All" />
                <StatCard label="Active" value={activeAdmins} icon={<Shield className="w-4 h-4" />} accent="bg-emerald-500" sub="Currently" />
                <StatCard label="Managers" value={managerCount} icon={<Lock className="w-4 h-4" />} accent="bg-violet-500" sub="Total" />
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
                {showForm && !editingId ? 'Cancel' : 'Create RA'}
            </button>

            {/* Form */}
            {showForm && (
                <RAForm
                    admin={editingId ? RAs.find((a) => a.id === editingId) : null}
                    onClose={resetForm}
                    onSave={handleSave}
                    saving={saving}
                />
            )}

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
                    <input
                        type="text"
                        placeholder="Search RAs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'inactive', 'suspended'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${filterStatus === status
                                ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300'
                                : 'bg-gray-800 border border-white/[0.06] indigo-500/40 hover:indigo-500/60'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
                {loading ? (
                    <div className="p-8 flex items-center justify-center indigo-500/40">Loading RAs…</div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="p-8 flex items-center justify-center indigo-500/40">No RAs found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    {['Name', 'Email', 'Role', 'Permissions', 'Status', 'Joined', 'Actions'].map((h) => (
                                        <th key={h} className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06]">
                                {filteredAdmins.map((admin, idx) => {
                                    const sc = statusConfig[admin.status] || statusConfig.active;
                                    const roleLabel = admin.roleName || admin.role || '—';
                                    const permCount = admin.permissions?.length ?? 0;
                                    const rowKey = admin.id || `${admin.email}-${idx}`;

                                    return (
                                        <tr key={rowKey} className="hover:bg-white/[0.02] transition-colors duration-150">
                                            <td className="px-6 py-4">
                                                <p className="indigo-500 font-semibold">{admin.name}</p>
                                            </td>
                                            <td className="px-6 py-4 indigo-500/60 text-sm">{admin.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold">
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 indigo-500/60 text-sm">
                                                {permCount} permission{permCount !== 1 ? 's' : ''}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 indigo-500/60 text-sm">{admin.createdAt}</td>
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