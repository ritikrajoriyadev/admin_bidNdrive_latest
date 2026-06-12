import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import {
  Search, Plus, Trash2, Edit2, DollarSign, Calendar, Zap,
  Upload, X, ChevronLeft, ChevronRight, Eye, MapPin, User,
  Fuel, Settings2, Car, Hash, Phone, Mail, ChevronDown, ChevronUp
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;
const AUTH_TOKEN = localStorage.getItem('adminToken');
const authHeaders = { Authorization: `Bearer ${AUTH_TOKEN}` };

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentClass, change }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <span className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center indigo-500/60">{icon}</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{change}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/40 text-xs font-medium mt-1 uppercase tracking-widest">{label}</p>
  </div>
);

/* ─── Status Badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const config = {
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Active' },
    sold: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', label: 'Sold' },
    pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Pending' },
    available: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Available' },
  };
  const cfg = config[status] || config.active;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/* ─── Pagination ─────────────────────────────────────────────────────────── */
const Pagination = ({ pagination, onPageChange }) => {
  const { page, pages, total, limit } = pagination;
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const getPageNumbers = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '...', pages];
    if (page >= pages - 3) return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, '...', page - 1, page, page + 1, '...', pages];
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1">
      <p className="text-xs text-slate-400">
        Showing <span className="font-semibold text-slate-600">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-600">{total}</span> cars
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : 'bg-slate-100 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400'}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === pages}
          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ─── Car View Modal ─────────────────────────────────────────────────────── */
const CarViewModal = ({ car, onClose }) => {
  const [activeImg, setActiveImg] = useState(0);
  const images = car.images ?? [];

  const bd = car.basicDetails ?? {};
  const sp = car.specifications ?? {};
  const sd = car.sellingDetails ?? {};
  const admin = car.adminId ?? {};

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-400 transition-all">
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* ── Left: Images ── */}
          <div className="p-5 flex flex-col gap-3 bg-slate-50 rounded-tl-2xl rounded-bl-2xl">
            {/* Main image */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 relative">
              {images.length > 0 ? (
                <img src={images[activeImg]?.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Car className="w-16 h-16 opacity-30" />
                </div>
              )}
              {/* Image counter */}
              {images.length > 1 && (
                <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white">
                  {activeImg + 1} / {images.length}
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button key={img._id ?? i} onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Views & date */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {car.viewCount ?? 0} views
              </span>
              <span className="text-xs text-slate-400">
                Listed {new Date(car.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* ── Right: Details ── */}
          <div className="p-6 flex flex-col gap-5 overflow-y-auto">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-800">{bd.make} {bd.model}</h2>
                <StatusBadge status={car.status ?? 'active'} />
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                ₹{Number(sd.expectedPrice ?? 0).toLocaleString('en-IN')}
                {sd.priceNegotiable && <span className="ml-2 text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Negotiable</span>}
              </p>
            </div>

            {/* Basic Details */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Basic Details</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Year" value={bd.year} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Reg. No." value={bd.registrationNumber} />
                <InfoRow icon={<Car className="w-3.5 h-3.5" />} label="Color" value={bd.color} />
                <InfoRow icon={<Settings2 className="w-3.5 h-3.5" />} label="Mileage" value={bd.mileage ? `${Number(bd.mileage).toLocaleString()} km` : null} />
              </div>
            </div>

            {/* Specifications */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Specifications</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<Fuel className="w-3.5 h-3.5" />} label="Fuel Type" value={sp.fuelType} />
                <InfoRow icon={<Settings2 className="w-3.5 h-3.5" />} label="Transmission" value={sp.transmission} />
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Ownership" value={sp.ownership ? `${sp.ownership} owner` : null} />
                <InfoRow icon={<Car className="w-3.5 h-3.5" />} label="Body Type" value={sp.bodyType} />
                <InfoRow icon={<Zap className="w-3.5 h-3.5" />} label="Engine" value={sp.engineCapacity ? `${sp.engineCapacity}cc` : null} />
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Seats" value={sp.seats} />
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Location & Condition</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="City" value={sd.city} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="State" value={sd.state} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Pincode" value={sd.pincode} />
                <InfoRow icon={<Car className="w-3.5 h-3.5" />} label="Condition" value={sd.condition} />
              </div>
            </div>

            {/* Description */}
            {sd.description && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{sd.description}</p>
              </div>
            )}

            {/* Listed by */}
            {admin?.email && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {admin.firstName?.[0] ?? 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Listed By</p>
                  <p className="text-sm font-semibold text-slate-700">{admin.firstName} {admin.lastName}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{admin.email}</span>
                    {admin.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{admin.phone}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty Form State ───────────────────────────────────────────────────── */
const emptyForm = {
  make: '', model: '', year: new Date().getFullYear(),
  registrationNumber: '', color: '', mileage: '',
  fuelType: 'petrol', transmission: 'manual', ownership: 'first',
  bodyType: 'hatchback', engineCapacity: '', seats: 5,
  expectedPrice: '', priceNegotiable: false,
  city: '', state: '', pincode: '', condition: 'good', description: '',
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function SellCars() {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [viewingCar, setViewingCar] = useState(null); // ← new

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  useEffect(() => { fetchCars(1); }, []);

  const fetchCars = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/cars`, {
        headers: authHeaders,
        params: { page, limit: pagination.limit },
      });
      const responseData = data?.data ?? data;
      setCars(responseData?.cars ?? []);
      if (responseData?.pagination) {
        setPagination(prev => ({ ...prev, ...responseData.pagination, page }));
      }
    } catch {
      addToast('Error loading cars', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchCars(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!Array.isArray(cars)) { setFilteredCars([]); return; }
    setFilteredCars(cars.filter(car => {
      const make = car?.basicDetails?.make ?? car?.make ?? '';
      const model = car?.basicDetails?.model ?? car?.model ?? '';
      return `${make} ${model}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterStatus === 'all' || car.status === filterStatus);
    }));
  }, [cars, searchTerm, filterStatus]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('basicDetails', JSON.stringify({ make: formData.make, model: formData.model, year: Number(formData.year), registrationNumber: formData.registrationNumber, color: formData.color, mileage: Number(formData.mileage) }));
      fd.append('specifications', JSON.stringify({ fuelType: formData.fuelType, transmission: formData.transmission, ownership: formData.ownership, bodyType: formData.bodyType, engineCapacity: formData.engineCapacity, seats: Number(formData.seats) }));
      fd.append('sellingDetails', JSON.stringify({ expectedPrice: Number(formData.expectedPrice), priceNegotiable: formData.priceNegotiable, city: formData.city, state: formData.state, pincode: formData.pincode, condition: formData.condition, description: formData.description }));
      imageFiles.forEach(file => fd.append('carImages', file));
      if (editingId) {
        await axios.put(`${API_BASE}/api/admin/cars/${editingId}`, fd, { headers: authHeaders });
        addToast('Car updated successfully', 'success');
      } else {
        await axios.post(`${API_BASE}/api/admin/cars`, fd, { headers: authHeaders });
        addToast('Car listed successfully', 'success');
      }
      resetForm();
      fetchCars(pagination.page);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (car) => {
    setFormData({
      make: car.basicDetails?.make ?? '', model: car.basicDetails?.model ?? '',
      year: car.basicDetails?.year ?? new Date().getFullYear(),
      registrationNumber: car.basicDetails?.registrationNumber ?? '',
      color: car.basicDetails?.color ?? '', mileage: car.basicDetails?.mileage ?? '',
      fuelType: car.specifications?.fuelType ?? 'petrol',
      transmission: car.specifications?.transmission ?? 'manual',
      ownership: car.specifications?.ownership ?? 'first',
      bodyType: car.specifications?.bodyType ?? 'hatchback',
      engineCapacity: car.specifications?.engineCapacity ?? '', seats: car.specifications?.seats ?? 5,
      expectedPrice: car.sellingDetails?.expectedPrice ?? '',
      priceNegotiable: car.sellingDetails?.priceNegotiable ?? false,
      city: car.sellingDetails?.city ?? '', state: car.sellingDetails?.state ?? '',
      pincode: car.sellingDetails?.pincode ?? '', condition: car.sellingDetails?.condition ?? 'good',
      description: car.sellingDetails?.description ?? '',
    });
    setEditingId(car._id ?? car.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/cars/${id}`, { headers: authHeaders });
      const newPage = filteredCars.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      addToast('Car deleted', 'success');
      fetchCars(newPage);
    } catch {
      addToast('Failed to delete car', 'error');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFiles([]);
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setShowForm(false);
    setEditingId(null);
  };

  const totalCars = pagination.total || cars.length;
  const availableCars = Array.isArray(cars) ? cars.filter(c => c.status === 'active').length : 0;
  const totalValue = Array.isArray(cars) ? cars.reduce((sum, car) => sum + (car.sellingDetails?.expectedPrice ?? 0), 0) : 0;

  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-2">
      <label className="indigo-500/60 text-sm font-medium">{label}</label>
      <input type={type} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        placeholder={placeholder} className="px-4 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all" />
    </div>
  );

  const selectField = (label, key, options) => (
    <div className="flex flex-col gap-2">
      <label className="indigo-500/60 text-sm font-medium">{label}</label>
      <select value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        className="px-4 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all">
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* View Modal */}
      {viewingCar && <CarViewModal car={viewingCar} onClose={() => setViewingCar(null)} />}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold indigo-500">Sell Cars</h1>
        <p className="indigo-500/40 text-sm">Manage your vehicle inventory and sales</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Cars" value={totalCars} icon={<Zap className="w-4 h-4" />} accentClass="bg-indigo-500" change={`+${totalCars}`} />
        <StatCard label="Available" value={availableCars} icon={<DollarSign className="w-4 h-4" />} accentClass="bg-emerald-500" change={`+${availableCars}`} />
        <StatCard label="Total Value" value={`₹${(totalValue / 1000).toFixed(1)}K`} icon={<Calendar className="w-4 h-4" />} accentClass="bg-amber-500" change={`+${cars.length}`} />
      </div>

      {/* Toggle button */}
      <button onClick={() => (showForm && !editingId) ? resetForm() : setShowForm(!showForm)}
        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 font-medium text-sm">
        <Plus className="w-4 h-4" />
        {showForm && !editingId ? 'Cancel' : 'Add New Car'}
      </button>

      {/* ── Form ── */}
      {showForm && (
        <div className="rounded-2xl bg-white border border-white/[0.06] p-6">
          <h2 className="text-xl font-bold indigo-500 mb-6">{editingId ? 'Edit Car' : 'Add New Car'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Basic Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Make *', 'make', 'text', 'e.g., Maruti Suzuki')}
                {field('Model *', 'model', 'text', 'e.g., Swift')}
                {/* {field('Variant *', 'variant', 'text', 'e.g., VXI')} */}
                {field('Year *', 'year', 'number')}
                {field('Registration Number *', 'registrationNumber', 'text', 'e.g., CG10AB1234')}
                {field('Color', 'color', 'text', 'e.g., White')}
                {field('Mileage (km)', 'mileage', 'number', '0')}
              </div>
            </section>
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Specifications</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectField('Fuel Type', 'fuelType', [['petrol', 'Petrol'], ['diesel', 'Diesel'], ['electric', 'Electric'], ['hybrid', 'Hybrid'],['cng', 'CNG']])}
                {selectField('Transmission', 'transmission', [['manual', 'Manual'], ['automatic', 'Automatic']])}
                {selectField('Ownership', 'ownership', [['first', 'First'], ['second', 'Second'], ['third', 'Third'], ['fourth', 'Fourth']])}
                {selectField('Body Type', 'bodyType', [['hatchback', 'Hatchback'], ['sedan', 'Sedan'], ['suv', 'SUV'], ['muv', 'MUV'], ['coupe', 'Coupe'], ['convertible', 'Convertible'], ['pickup', 'Pickup']])}
                {field('Engine Capacity', 'engineCapacity', 'text', 'e.g., 1197cc')}
                {field('Seats', 'seats', 'number', '5')}
              </div>
            </section>
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Selling Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Expected Price (₹) *', 'expectedPrice', 'number', '0')}
                <div className="flex flex-col gap-2">
                  <label className="indigo-500/60 text-sm font-medium">Condition</label>
                  <select value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all">
                    {[['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                {field('City', 'city', 'text', 'e.g., Bilaspur')}
                {field('State', 'state', 'text', 'e.g., Chhattisgarh')}
                {field('Pincode', 'pincode', 'text', 'e.g., 495001')}
                <div className="flex items-center gap-3 self-end pb-1">
                  <input id="negotiable" type="checkbox" checked={formData.priceNegotiable}
                    onChange={e => setFormData({ ...formData, priceNegotiable: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500" />
                  <label htmlFor="negotiable" className="indigo-500/60 text-sm font-medium">Price Negotiable</label>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="indigo-500/60 text-sm font-medium">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add car details..." rows="3"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all resize-none" />
                </div>
              </div>
            </section>
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Car Images</p>
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.1] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-400/40 transition-all">
                <Upload className="w-6 h-6 indigo-500/40" />
                <p className="indigo-500/40 text-sm">Click to upload images</p>
                <p className="indigo-500/20 text-xs">PNG, JPG, WEBP supported</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                {submitting ? 'Saving...' : editingId ? 'Update Car' : 'Add Car'}
              </button>
              <button type="button" onClick={resetForm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 font-medium hover:bg-slate-200 transition-all duration-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
          <input type="text" placeholder="Search cars..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'pending', 'sold'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${filterStatus === s ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300' : 'bg-slate-100 border border-white/[0.06] indigo-500/40 hover:indigo-500/60'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cars Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center indigo-500/40">Loading cars...</div>
        ) : filteredCars.length === 0 ? (
          <div className="p-8 flex items-center justify-center indigo-500/40">No cars found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Vehicle', 'Year', 'Price', 'Mileage', 'Specs', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredCars.map((car) => {
                    const id = car._id ?? car.id;
                    const make = car.basicDetails?.make ?? car.make;
                    const model = car.basicDetails?.model ?? car.model;
                    const year = car.basicDetails?.year ?? car.year;
                    const price = car.sellingDetails?.expectedPrice ?? car.expectedPrice ?? 0;
                    const miles = car.basicDetails?.mileage ?? car.mileage ?? 0;
                    const fuel = car.specifications?.fuelType ?? car.fuelType;
                    const trans = car.specifications?.transmission ?? car.transmission;
                    const desc = car.sellingDetails?.description ?? car.description;
                    const status = car.status ?? 'available';
                    const thumb = car.images?.[0]?.url;
                    return (
                      <tr key={id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                              {thumb
                                ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Car className="w-4 h-4 text-slate-300" /></div>
                              }
                            </div>
                            <div>
                              <p className="text-slate-700 font-semibold text-sm">{make} {model}</p>
                              <p className="text-slate-400 text-xs line-clamp-1">{desc}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{year}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold text-sm">₹{Number(price).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{Number(miles).toLocaleString()} km</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 capitalize">{fuel}</span>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 capitalize">{trans}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* ── View button ── */}
                            <button onClick={() => setViewingCar(car)}
                              className="p-2 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-all" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(car)}
                              className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(id)}
                              className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all" title="Delete">
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
            <div className="px-6 py-4 border-t border-white/[0.06]">
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}