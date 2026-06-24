import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

// ── Geocoding cache + rate-limited queue ──
const geoCache = {};
const geoQueue = [];
let geoTimer = null;

const geocode = (lat, lng) => {
  if (!lat || !lng || (lat === 0 && lng === 0)) return Promise.resolve('');
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geoCache[key] !== undefined) return Promise.resolve(geoCache[key]);
  return new Promise((resolve) => {
    geoQueue.push({ key, lat, lng, resolve });
    if (!geoTimer) scheduleNext();
  });
};

const scheduleNext = () => {
  geoTimer = setTimeout(async () => {
    const item = geoQueue.shift();
    if (!item) { geoTimer = null; return; }
    try {
      const res = await fetch(
        `/nominatim/reverse?lat=${item.lat}&lon=${item.lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const { road, suburb, city, town, village, state } = data.address || {};
      const short = [road, suburb || city || town || village, state]
        .filter(Boolean).join(', ');
      const address = short || data.display_name || '';
      geoCache[item.key] = address;
      item.resolve(address);
    } catch {
      geoCache[item.key] = '';
      item.resolve('');
    }
    if (geoQueue.length > 0) scheduleNext();
    else geoTimer = null;
  }, 1100);
};

// ── Stat Card ──
const StatCard = ({ label, value, icon, accent, change, positive }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>
        {icon}
      </span>
      {change && (
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
          {positive ? '↑' : '↓'} {change}
        </span>
      )}
    </div>
    <p className="text-3xl font-bold tracking-tighter text-gray-800">{value}</p>
    <p className="text-xs font-medium mt-1 tracking-widest uppercase text-gray-400">{label}</p>
  </div>
);

// ── Address Cell ──
const AddressCell = ({ coordinates }) => {
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) return;
    const [lng, lat] = coordinates;
    if (!lat || !lng || (lat === 0 && lng === 0)) { setAddress(''); return; }
    geocode(lat, lng).then(setAddress);
  }, [coordinates]);

  if (!coordinates || coordinates.length < 2) {
    return <div className="text-xs text-gray-400">No location</div>;
  }

  return (
    <div className="text-sm text-gray-600 min-w-0">
      {address === null ? (
        <span className="text-xs text-gray-400 animate-pulse">Fetching...</span>
      ) : address ? (
        <span className="line-clamp-2 leading-snug">{address}</span>
      ) : (
        <span className="text-xs text-gray-400">Unavailable</span>
      )}
    </div>
  );
};

// ── Location helpers ──
const formatLastUpdated = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const openGoogleMaps = (coordinates) => {
  const [lng, lat] = coordinates;
  window.open(`https://www.google.com/maps?q=${lat},${lng}&z=15`, '_blank', 'noopener,noreferrer');
};

const openGoogleMapsNavigation = (coordinates) => {
  const [lng, lat] = coordinates;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
};

// ── Location Section ──
const LocationSection = ({ location }) => {
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (!location?.coordinates || location.coordinates.length < 2) return;
    const [lng, lat] = location.coordinates;
    if (!lat || !lng || (lat === 0 && lng === 0)) { setAddress(''); return; }
    geocode(lat, lng).then(setAddress);
  }, [location]);

  if (!location?.coordinates || location.coordinates.length < 2) {
    return (
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Live Location</p>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Location not available</p>
        </div>
      </div>
    );
  }

  const [lng, lat] = location.coordinates;

  return (
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Live Location</p>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {lat.toFixed(6)}° N, {lng.toFixed(6)}° E
          </p>
          {address === null ? (
            <p className="text-xs text-gray-400 mt-1 animate-pulse">Fetching address...</p>
          ) : address ? (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{address}</p>
          ) : null}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-gray-500">
              {formatLastUpdated(location.lastUpdated)}
              {location.lastUpdated && (
                <span className="text-gray-400 ml-1">
                  · {new Date(location.lastUpdated).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => openGoogleMaps(location.coordinates)}
          className="py-2.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          View on Map
        </button>
        <button
          onClick={() => openGoogleMapsNavigation(location.coordinates)}
          className="py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 border border-blue-500 transition-all flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Navigate
        </button>
      </div>
    </div>
  );
};

// ── Table View ──
const TableView = ({ technicians, statusConfig, onClick }) => (
  <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-white/[0.05] bg-white/[0.02] text-gray-400 text-xs font-semibold tracking-widest uppercase">
      <div>Name</div>
      <div>Contact</div>
      <div>Joined</div>
      <div>Address</div>
      <div>Status</div>
    </div>
    {technicians.length === 0 ? (
      <div className="p-12 text-center text-gray-400">No technicians found</div>
    ) : (
      technicians.map(tech => {
        const sc = statusConfig[tech.status];
        return (
          <div
            key={tech.id}
            onClick={() => onClick(tech)}
            className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-gray-50 transition-colors cursor-pointer items-center group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tech.avatarGrad} flex items-center justify-center text-xs font-bold text-white`}>
                {tech.avatar}
              </div>
              <div>
                <p className="font-medium text-gray-800">{tech.name}</p>
                <p className="text-xs text-gray-400 font-mono">{tech.id}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>{tech.email}</p>
              <p className="text-gray-400 text-xs">{tech.phone}</p>
            </div>
            <div className="text-sm text-gray-500">{tech.joined}</div>
            <AddressCell coordinates={tech.location?.coordinates} />
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
          </div>
        );
      })
    )}
  </div>
);

// ── Grid View ──
const GridView = ({ technicians, statusConfig, onClick }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {technicians.map(tech => {
      const sc = statusConfig[tech.status];
      return (
        <div
          key={tech.id}
          onClick={() => onClick(tech)}
          className="bg-white border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.15] hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tech.avatarGrad} flex items-center justify-center text-lg font-bold text-white`}>
              {tech.avatar}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-0.5 text-gray-800">{tech.name}</h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-1">{tech.email}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>Joined {tech.joined}</div>
            <div className="flex items-center gap-1">
              ⭐ <span className="text-amber-400 font-medium">{tech.rating}</span>
            </div>
          </div>
        </div>
      );
    })}
    {technicians.length === 0 && (
      <div className="col-span-full py-12 text-center text-gray-400">No technicians found</div>
    )}
  </div>
);

// ── Edit Technician Modal ──
const EditTechnicianModal = ({ technician, onClose, onSaved, token }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameParts = technician.name.split(' ');
  const [profileForm, setProfileForm] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: technician.phone?.replace('+91 ', '') || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    try {
      setSaving(true);
      // Admin updates on behalf of the technician via the technician's own endpoint.
      // We pass along the technician ID via a dedicated admin route if available,
      // otherwise we call the profile endpoint with the technician's token.
      // Adjust the URL/headers below to match your actual admin-update-technician route.
      
      
      if (res.data.success) {
        toast.success('Profile updated successfully');
        onSaved();
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = passwordForm;
    if ( !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      setSaving(true);
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians/${technician.id}/update-profile`,
        { newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        toast.success('Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to update password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-all';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-white/[0.08] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-2 bg-gradient-to-r from-violet-500 to-pink-500" />
        <div className="p-6 relative">
          {/* Header */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${technician.avatarGrad} flex items-center justify-center text-lg font-bold text-white`}>
              {technician.avatar}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Edit Technician</h2>
              <p className="text-gray-400 text-sm">{technician.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 border border-gray-200">
            {[
              { key: 'profile', label: 'Profile Info' },
              { key: 'password', label: 'Change Password' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1.5 block">First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={profileForm.firstName}
                    onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={profileForm.lastName}
                    onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">+91</span>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    maxLength={10}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold text-gray-600 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
        
        {/* New Password Field */}
        <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest mb-1.5 block">
                New Password
            </label>
            <div className="relative">
                <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className={inputClass + " pr-12"}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showNewPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5 16.477 5 20.268 7.943 21.542 12 20.268 16.057 16.477 19 12 19 7.523 19 3.732 16.057 2.458 12z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908l3.42 3.42M3 3l18 18" />
                        </svg>
                    )}
                </button>
            </div>
        </div>

        {/* Confirm New Password Field */}
        <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest mb-1.5 block">
                Confirm New Password
            </label>
            <div className="relative">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className={inputClass + " pr-12"}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5 16.477 5 20.268 7.943 21.542 12 20.268 16.057 16.477 19 12 19 7.523 19 3.732 16.057 2.458 12z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908l3.42 3.42M3 3l18 18" />
                        </svg>
                    )}
                </button>
            </div>
        </div>

        {passwordForm.newPassword && passwordForm.confirmPassword && (
            <p className={`text-xs font-medium ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-500' : 'text-rose-400'}`}>
                {passwordForm.newPassword === passwordForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
        )}

        <div className="flex gap-3 pt-2">
            <button
                type="submit"
                disabled={saving || (!!passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
            >
                {saving ? 'Updating...' : 'Update Password'}
            </button>
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold text-gray-600 transition-all text-sm"
            >
                Cancel
            </button>
        </div>
    </form>
)}
        </div>
      </div>
    </div>
  );
};

// ── Technician Modal ──
const TechnicianModal = ({ technician, details, loading, error, onClose, onStatusChange, onEdit }) => {
  const navigate = useNavigate();
  const techData = details?.technician || technician;
  const stats = details?.statistics;
  const assignedEnquiries = details?.assignedEnquiries || [];
  const location = details?.technician?.location || technician?.location || null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-white/[0.08] overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            ✕
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${technician.avatarGrad} flex items-center justify-center text-2xl font-bold text-white`}>
              {technician.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">{technician.name}</h2>
              <p className="text-gray-500 text-sm">{technician.email}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Phone</p>
              <p className="text-gray-700 font-medium">{techData.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Joined</p>
              <p className="text-gray-700 font-medium">{techData.joined}</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest">Rating</p>
                <p className="text-amber-400 font-semibold text-lg">★ {techData.rating || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest">Jobs</p>
                <p className="text-gray-700 font-semibold">{techData.orders ?? 0}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center mb-6">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading technician details...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center mb-6">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          ) : (
            <>
              {details && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Assigned</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats?.totalAssigned ?? assignedEnquiries.length}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Completed</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats?.completed ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats?.inProgress ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Pending</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats?.pending ?? 0}</p>
                  </div>
                </div>
              )}
              <div className="mb-6">
                <LocationSection location={location} />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/technicians/${technician.id}`)}
                className="flex-1 py-3 rounded-2xl font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/15 transition-all border border-indigo-500/10 text-sm"
              >
                View full page
              </button>
              <button
                onClick={() => onEdit(technician)}
                className="flex-1 py-3 rounded-2xl font-medium bg-violet-500/10 text-violet-500 hover:bg-violet-500/15 transition-all border border-violet-500/10 text-sm flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onStatusChange(technician.id, technician.status, 'active')}
                className="flex-1 py-3 rounded-2xl font-medium transition-all border bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-500 text-sm"
              >
                Mark Active
              </button>
              <button
                onClick={() => onStatusChange(technician.id, technician.status, 'inactive')}
                className="flex-1 py-3 rounded-2xl font-medium transition-all border bg-white/5 hover:bg-white/10 border-white/10 text-gray-500 text-sm"
              >
                Mark Inactive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Create Technician Modal ──
const CreateTechnicianModal = ({ formData, setFormData, onSubmit, onClose, creating }) => (
  <div
    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-md bg-white rounded-3xl border border-white/[0.08] overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
      <div className="p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-1 text-gray-800">Create Technician</h2>
        <p className="text-gray-500 text-sm mb-6">Add a new technician to your platform</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-all"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-all"
          />
          <input
            type="tel"
            placeholder="Phone Number (Optional)"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-all"
          />
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
            >
              {creating ? 'Creating...' : 'Create Technician'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold text-gray-600 transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

// ── Main Component ──
const Technicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setStatus] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [technicianDetails, setTechnicianDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [view, setView] = useState('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem('adminToken');
  const toast = useToast();

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const mappedTechnicians = res.data.data.technicians?.map(tech => ({
        id: tech._id,
        name: `${tech.firstName} ${tech.lastName}`.trim(),
        email: tech.email,
        phone: tech.phone ? `+91 ${tech.phone}` : 'N/A',
        status: tech.isActive ? 'active' : 'inactive',
        joined: new Date(tech.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        lastSeen: 'Just now',
        avatar: `${tech.firstName?.[0] || ''}${tech.lastName?.[0] || ''}`.toUpperCase(),
        avatarGrad: 'from-blue-500 to-cyan-500',
        rating: tech.rating || 4.5,
        orders: tech.jobsCompleted || 0,
        location: tech.location || null,
      })) || [];
      setTechnicians(mappedTechnicians);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTechnicians(); }, []);

  const filteredTechnicians = technicians.filter(tech => {
    const matchSearch =
      tech.name.toLowerCase().includes(search.toLowerCase()) ||
      tech.email.toLowerCase().includes(search.toLowerCase()) ||
      tech.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || tech.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    inactive: { label: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-400', dot: 'bg-gray-300' },
  };

  const fetchTechnicianDetails = async (technicianId) => {
    try {
      setDetailsError(null);
      setDetailsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians/${technicianId}/details`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        setTechnicianDetails(res.data.data);
      } else {
        setDetailsError(res.data.message || 'Failed to load technician details.');
      }
    } catch (err) {
      console.error('Error fetching technician details:', err);
      setDetailsError(err.response?.data?.message || 'Failed to fetch technician details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewTechnician = async (technician) => {
    setSelectedTechnician(technician);
    setTechnicianDetails(null);
    await fetchTechnicianDetails(technician.id);
  };

  const handleStatusChange = async (technicianId, currentStatus, targetStatus) => {
    if (currentStatus === targetStatus) { setSelectedTechnician(null); return; }
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians/${technicianId}/toggle-status`,
        { isActive: targetStatus === 'active' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        toast.success(res.data.message || `Technician ${targetStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchTechnicians();
        if (selectedTechnician?.id === technicianId) fetchTechnicianDetails(technicianId);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setCreating(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/technicians`,
        { email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        toast.success('Technician created successfully! 🎉');
        setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '' });
        setShowCreateModal(false);
        fetchTechnicians();
      }
    } catch (err) {
      console.error('Error creating technician:', err);
      toast.error(err.response?.data?.message || 'Failed to create technician');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (technician) => {
    setSelectedTechnician(null); // close the view modal first
    setEditingTechnician(technician);
  };

  const handleEditSaved = () => {
    fetchTechnicians();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading technicians...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen bg-white p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Technicians" value={technicians.length} change="+5%" positive accent="bg-indigo-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>}
        />
        <StatCard
          label="Active Technicians" value={technicians.filter(t => t.status === 'active').length} change="+3%" positive accent="bg-emerald-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
        />
        <StatCard
          label="Avg Rating" value="4.7" change="+0.2" positive accent="bg-amber-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
        />
        <StatCard
          label="Jobs Completed" value="1,247" change="+12%" positive accent="bg-violet-500"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m0-8l-4 4-4-4" /></svg>}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-2xl hover:from-indigo-400 hover:to-violet-400 transition-all shadow-lg shadow-indigo-500/30"
          >
            + Create Technician
          </button>
          <select
            value={filterStatus}
            onChange={e => setStatus(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search technicians..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-11 py-3 text-sm text-gray-700 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
            {['table', 'grid'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all text-sm ${view === v ? 'bg-indigo-600 text-white shadow' : 'hover:bg-gray-200 text-gray-400'}`}
              >
                {v === 'table' ? '≡' : '▦'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <TableView technicians={filteredTechnicians} statusConfig={statusConfig} onClick={handleViewTechnician} />
      ) : (
        <GridView technicians={filteredTechnicians} statusConfig={statusConfig} onClick={handleViewTechnician} />
      )}

      {selectedTechnician && (
        <TechnicianModal
          technician={selectedTechnician}
          details={technicianDetails}
          loading={detailsLoading}
          error={detailsError}
          onClose={() => { setSelectedTechnician(null); setTechnicianDetails(null); setDetailsError(null); }}
          onStatusChange={handleStatusChange}
          onEdit={handleOpenEdit}
        />
      )}

      {editingTechnician && (
        <EditTechnicianModal
          technician={editingTechnician}
          token={token}
          onClose={() => setEditingTechnician(null)}
          onSaved={handleEditSaved}
        />
      )}

      {showCreateModal && (
        <CreateTechnicianModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateTechnician}
          onClose={() => setShowCreateModal(false)}
          creating={creating}
        />
      )}
    </div>
  );
};

export default Technicians;