import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, Image, Calendar, Eye, EyeOff, Upload } from 'lucide-react';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, change }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <span className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center indigo-500/60">
        {icon}
      </span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400`}>
        {change}
      </span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/40 text-xs font-medium mt-1 uppercase tracking-widest">{label}</p>
  </div>
);

/* ─── Status Badge ─────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const safeStatus = status || 'inactive';
  const config = {
    'active': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    'inactive': { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
    'scheduled': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
    'archived': { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const cfg = config[safeStatus] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
};

/* ─── Banner Form ─────────────────────────────────────────────────────── */
const BannerForm = ({ banner, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(
    banner || {
      title: '',
      description: '',
      link: '',

      image: null,
      imagePreview: '',
      status: 'active',
      displayOrder: 1,
      startDate: '',
      endDate: '',
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">Banner Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Summer Sale 2024"
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
            required
          />
        </div>

        {/* Placement */}

      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Banner description or call-to-action text"
          rows="3"
          className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">Target Link</label>
        <input
          type="url"
          name="link"
          value={formData.link}
          onChange={handleChange}
          placeholder="https://example.com"
          className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium indigo-500/80 mb-2">Banner Image</label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="imageInput"
          />
          <label
            htmlFor="imageInput"
            className="w-full px-4 py-3 bg-slate-100 border-2 border-dashed border-indigo-500/30 rounded-lg cursor-pointer hover:border-indigo-500/50 transition flex items-center gap-3 indigo-500/60 hover:indigo-500/80"
          >
            <Upload size={20} />
            <div>
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-xs indigo-500/40">PNG, JPG, GIF up to 5MB</p>
            </div>
          </label>
        </div>

        {/* Image Preview */}
        {formData.imagePreview && (
          <div className="mt-3 rounded-lg overflow-hidden border border-white/10 h-40 bg-slate-100">
            <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">Display Order</label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium indigo-500/80 mb-2">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 indigo-500 rounded-lg font-medium transition"
        >
          {loading ? 'Uploading...' : banner ? 'Update Banner' : 'Upload Banner'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-gray-700 indigo-500 rounded-lg font-medium transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Banners() {
  const { addToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [filteredBanners, setFilteredBanners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };


  // Load banners on mount
  useEffect(() => {
    loadBanners();
  }, []);

  // Filter banners based on search and filters
  useEffect(() => {
    let filtered = banners;

    if (searchTerm) {
      filtered = filtered.filter(banner =>
        banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlacement !== 'all') {
      filtered = filtered.filter(banner => banner.placement === filterPlacement);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(banner => banner.status === filterStatus);
    }

    setFilteredBanners(filtered);
  }, [banners, searchTerm, filterPlacement, filterStatus]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/banners`, {
        headers: getAuthHeaders()
      });

      const data = response.data?.data ?? response.data;
      if (Array.isArray(data)) {
        setBanners(data);
      } else if (Array.isArray(data?.banners)) {
        setBanners(data.banners);
      } else {
        setBanners([]);
      }
      addToast('Banners loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading banners:', error);
      addToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = async (formData) => {
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);

      payload.append('status', formData.status);
      payload.append('displayOrder', formData.displayOrder);
      payload.append('startDate', formData.startDate);
      payload.append('endDate', formData.endDate);
      payload.append('position', formData.displayOrder);
      payload.append('link', formData.link || '');
      if (formData.image) {
        payload.append('bannerImage', formData.image);
      }

      const response = await axios.post(`${apiUrl}/api/banners`, payload, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      const createdBanner = response.data?.data ?? response.data;
      const newBanner = createdBanner?.id ? createdBanner : {
        id: Math.max(...banners.map(b => b.id), 0) + 1,
        ...formData,
        image: formData.imagePreview || formData.image,
        views: 0,
        clicks: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setBanners([...banners, newBanner]);
      setShowForm(false);
      addToast('Banner uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading banner:', error);
      addToast('Failed to upload banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBanner = async (formData) => {
    try {
      setLoading(true);
      // Replace with actual API endpoint
      // await axios.put(`${process.env.VITE_API_URL}/api/admin/banners/${editingId}`, formData);

      // Mock update
      setBanners(banners.map(b =>
        b.id === editingId
          ? {
            ...b,
            ...formData,
            imagePreview: undefined,
            image: formData.imagePreview || formData.image || b.image
          }
          : b
      ));

      setEditingId(null);
      setShowForm(false);
      addToast('Banner updated successfully', 'success');
    } catch (error) {
      console.error('Error updating banner:', error);
      addToast('Failed to update banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        const token = localStorage.getItem("adminToken"); // ya jahan tum store karte ho

        await axios.delete(
          `${apiUrl}/api/banners/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        // update UI
        setBanners(prev => prev.filter(b => b.id !== id));
        addToast('Banner deleted successfully', 'success');

      } catch (error) {
        console.error('Error deleting banner:', error);
        addToast('Failed to delete banner', 'error');
      }
    }
  };

  const activeBanners = banners.filter(b => b.status === 'active').length;
  const totalViews = banners.reduce((sum, b) => sum + b.views, 0);
  const totalClicks = banners.reduce((sum, b) => sum + b.clicks, 0);

  return (
    <div className="min-h-screen from-gray-950 via-gray-900 indigo-500 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold indigo-500 mb-1">Banners</h1>
            <p className="indigo-500/60">Manage promotional banners and advertisements</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 indigo-500 rounded-lg font-medium transition"
          >
            <Plus size={20} />
            Upload Banner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Banners" value={banners.length} icon={<Image size={18} />} accentClass="bg-indigo-600" change="+2 this month" />
          <StatCard label="Active Banners" value={activeBanners} icon={<Eye size={18} />} accentClass="bg-emerald-600" change={`${Math.round((activeBanners / banners.length) * 100)}%`} />
          <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={<Eye size={18} />} accentClass="bg-blue-600" change="+5.2%" />
          <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={<Calendar size={18} />} accentClass="bg-purple-600" change="+12%" />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-xl font-bold indigo-500 mb-6">
              {editingId ? 'Edit Banner' : 'Upload New Banner'}
            </h2>
            <BannerForm
              banner={editingId ? banners.find(b => b.id === editingId) : null}
              onSubmit={editingId ? handleUpdateBanner : handleAddBanner}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              loading={loading}
            />
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 indigo-500/40" size={20} />
            <input
              type="text"
              placeholder="Search banners by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-100 border border-white/10 indigo-500 placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>

          <select
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="all">All Placements</option>
            <option value="homepage">Homepage</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
            <option value="popup">Popup</option>
            <option value="sidebar">Sidebar</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-100 border border-white/10 indigo-500 focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Banners Table */}
        <div className="bg-white border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100/50 border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/60 uppercase tracking-wider">Banner</th>

                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/60 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/60 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/60 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/60 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold indigo-500/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredBanners.map((banner, index) => (
                  <tr key={banner?.id || banner?._id || `banner-${index}`} className="hover:bg-slate-100/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={banner?.image?.url || banner?.image} alt={banner.title} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                        <div>
                          <p className="text-sm font-medium indigo-500">{banner.title}</p>
                          <p className="text-xs indigo-500/40">{banner.description.substring(0, 40)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={banner.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm indigo-500/80">{(banner.views ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm indigo-500/80">{(banner.clicks ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm indigo-500/80">{banner.views > 0 ? ((banner.clicks ?? 0) / banner.views * 100).toFixed(2) : '0'}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(banner.id);
                            setShowForm(true);
                          }}
                          className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner._id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBanners.length === 0 && (
            <div className="text-center py-16">
              <Image className="mx-auto mb-4 indigo-500/20" size={48} />
              <p className="indigo-500/60">No banners found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
