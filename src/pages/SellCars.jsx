import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Trash2, Edit2, DollarSign, Calendar, Zap, Upload, X } from 'lucide-react';


const API_BASE = import.meta.env.VITE_API_URL;
const AUTH_TOKEN = localStorage.getItem('adminToken');

const authHeaders = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

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

/* ─── Empty Form State ───────────────────────────────────────────────────── */
const emptyForm = {
  // basicDetails
  make: '', model: '', year: new Date().getFullYear(),
  registrationNumber: '', color: '', mileage: '',
  // specifications
  fuelType: 'petrol', transmission: 'manual', ownership: 'first',
  bodyType: 'hatchback', engineCapacity: '', seats: 5,
  // sellingDetails
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
  const [imageFiles, setImageFiles] = useState([]);   // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // string[]

  /* ── Fetch cars list ── */
  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/cars`, { headers: authHeaders });
      // Adjust based on your actual response shape, e.g. data.cars or data.data
      setCars(data?.data?.cars ?? data?.cars ?? []);
    } catch (err) {
      addToast('Error loading cars', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Filter ── */
  useEffect(() => {
    if (!Array.isArray(cars)) {
      setFilteredCars([]);
      return;
    }

    const filtered = cars.filter((car) => {
      const make = car?.basicDetails?.make ?? car?.make ?? "";
      const model = car?.basicDetails?.model ?? car?.model ?? "";

      const matchSearch = `${make} ${model}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchStatus =
        filterStatus === "all" || car.status === filterStatus;

      return matchSearch && matchStatus;
    });

    setFilteredCars(filtered);
  }, [cars, searchTerm, filterStatus]);

  /* ── Image handling ── */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ── Submit (Create) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData();

      // basicDetails
      fd.append('basicDetails', JSON.stringify({
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        registrationNumber: formData.registrationNumber,
        color: formData.color,
        mileage: Number(formData.mileage),
      }));

      // specifications
      fd.append('specifications', JSON.stringify({
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        ownership: formData.ownership,
        bodyType: formData.bodyType,
        engineCapacity: formData.engineCapacity,
        seats: Number(formData.seats),
      }));

      // sellingDetails
      fd.append('sellingDetails', JSON.stringify({
        expectedPrice: Number(formData.expectedPrice),
        priceNegotiable: formData.priceNegotiable,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        condition: formData.condition,
        description: formData.description,
      }));

      // images
      imageFiles.forEach(file => fd.append('carImages', file));

      if (editingId) {
        await axios.put(`${API_BASE}/api/admin/cars/${editingId}`, fd, { headers: authHeaders });
        addToast('Car updated successfully', 'success');
      } else {
        await axios.post(`${API_BASE}/api/admin/cars`, fd, { headers: authHeaders });
        addToast('Car listed successfully', 'success');
      }

      resetForm();
      fetchCars();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = (car) => {
    // Flatten nested API response back into flat formData shape
    setFormData({
      make: car.basicDetails?.make ?? car.make ?? '',
      model: car.basicDetails?.model ?? car.model ?? '',
      year: car.basicDetails?.year ?? car.year ?? new Date().getFullYear(),
      registrationNumber: car.basicDetails?.registrationNumber ?? car.registrationNumber ?? '',
      color: car.basicDetails?.color ?? car.color ?? '',
      mileage: car.basicDetails?.mileage ?? car.mileage ?? '',
      fuelType: car.specifications?.fuelType ?? car.fuelType ?? 'petrol',
      transmission: car.specifications?.transmission ?? car.transmission ?? 'manual',
      ownership: car.specifications?.ownership ?? car.ownership ?? 'first',
      bodyType: car.specifications?.bodyType ?? car.bodyType ?? 'hatchback',
      engineCapacity: car.specifications?.engineCapacity ?? car.engineCapacity ?? '',
      seats: car.specifications?.seats ?? car.seats ?? 5,
      expectedPrice: car.sellingDetails?.expectedPrice ?? car.expectedPrice ?? '',
      priceNegotiable: car.sellingDetails?.priceNegotiable ?? car.priceNegotiable ?? false,
      city: car.sellingDetails?.city ?? car.city ?? '',
      state: car.sellingDetails?.state ?? car.state ?? '',
      pincode: car.sellingDetails?.pincode ?? car.pincode ?? '',
      condition: car.sellingDetails?.condition ?? car.condition ?? 'good',
      description: car.sellingDetails?.description ?? car.description ?? '',
    });
    setEditingId(car._id ?? car.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/cars/${id}`, { headers: authHeaders });
      setCars(prev => prev.filter(c => (c._id ?? c.id) !== id));
      addToast('Car deleted', 'success');
    } catch {
      addToast('Failed to delete car', 'error');
    }
  };

  /* ── Reset ── */
  const resetForm = () => {
    setFormData(emptyForm);
    setImageFiles([]);
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setShowForm(false);
    setEditingId(null);
  };

  /* ── Stats ── */
  const totalCars = cars.length;
  console.log(cars);
  const availableCars = Array.isArray(cars)
    ? cars.filter(c => c.status === "active").length
    : 0;
  const totalValue = Array.isArray(cars)
    ? cars.reduce((sum, car) => {
      const price =
        car.sellingDetails?.expectedPrice ??
        car.expectedPrice ??
        car.price ??
        0;
      return sum + price;
    }, 0)
    : 0;

  /* ── Field helper ── */
  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-2">
      <label className="indigo-500/60 text-sm font-medium">{label}</label>
      <input
        type={type}
        value={formData[key]}
        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        placeholder={placeholder}
        className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
      />
    </div>
  );

  const selectField = (label, key, options) => (
    <div className="flex flex-col gap-2">
      <label className="indigo-500/60 text-sm font-medium">{label}</label>
      <select
        value={formData[key]}
        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
      >
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );

  /* ────────────────────────── RENDER ────────────────────────── */
  return (
    <div className="flex flex-col gap-6">
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
      <button
        onClick={() => (showForm && !editingId) ? resetForm() : setShowForm(!showForm)}
        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        {showForm && !editingId ? 'Cancel' : 'Add New Car'}
      </button>

      {/* ── Form ── */}
      {showForm && (
        <div className="rounded-2xl bg-white border border-white/[0.06] p-6">
          <h2 className="text-xl font-bold indigo-500 mb-6">{editingId ? 'Edit Car' : 'Add New Car'}</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">

            {/* Basic Details */}
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Basic Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Make *', 'make', 'text', 'e.g., Maruti Suzuki')}
                {field('Model *', 'model', 'text', 'e.g., Swift')}
                {field('Year *', 'year', 'number')}
                {field('Registration Number *', 'registrationNumber', 'text', 'e.g., CG10AB1234')}
                {field('Color', 'color', 'text', 'e.g., White')}
                {field('Mileage (km)', 'mileage', 'number', '0')}
              </div>
            </section>

            {/* Specifications */}
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Specifications</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectField('Fuel Type', 'fuelType', [['petrol', 'Petrol'], ['diesel', 'Diesel'], ['electric', 'Electric'], ['hybrid', 'Hybrid']])}
                {selectField('Transmission', 'transmission', [['manual', 'Manual'], ['automatic', 'Automatic']])}
                {selectField('Ownership', 'ownership', [['first', 'First'], ['second', 'Second'], ['third', 'Third'], ['fourth', 'Fourth']])}
                {selectField('Body Type', 'bodyType', [['hatchback', 'Hatchback'], ['sedan', 'Sedan'], ['suv', 'SUV'], ['muv', 'MUV'], ['coupe', 'Coupe'], ['convertible', 'Convertible'], ['pickup', 'Pickup']])}
                {field('Engine Capacity', 'engineCapacity', 'text', 'e.g., 1197cc')}
                {field('Seats', 'seats', 'number', '5')}
              </div>
            </section>

            {/* Selling Details */}
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Selling Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Expected Price (₹) *', 'expectedPrice', 'number', '0')}
                <div className="flex flex-col gap-2">
                  <label className="indigo-500/60 text-sm font-medium">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all"
                  >
                    {[['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                {field('City', 'city', 'text', 'e.g., Bilaspur')}
                {field('State', 'state', 'text', 'e.g., Chhattisgarh')}
                {field('Pincode', 'pincode', 'text', 'e.g., 495001')}
                <div className="flex items-center gap-3 self-end pb-1">
                  <input
                    id="negotiable"
                    type="checkbox"
                    checked={formData.priceNegotiable}
                    onChange={e => setFormData({ ...formData, priceNegotiable: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <label htmlFor="negotiable" className="indigo-500/60 text-sm font-medium">Price Negotiable</label>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="indigo-500/60 text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add car details..."
                    rows="3"
                    className="px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 indigo-500 focus:border-indigo-400/50 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Car Images */}
            <section>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Car Images</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.1] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-400/40 transition-all"
              >
                <Upload className="w-6 h-6 indigo-500/40" />
                <p className="indigo-500/40 text-sm">Click to upload images</p>
                <p className="indigo-500/20 text-xs">PNG, JPG, WEBP supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 rounded-full indigo-500/60 indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 indigo-500 font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Car' : 'Add Car'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 font-medium hover:bg-gray-700 transition-all duration-200"
              >
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
          <input
            type="text"
            placeholder="Search cars..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'pending', 'sold'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${filterStatus === s
                ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300'
                : 'bg-gray-800 border border-white/[0.06] indigo-500/40 hover:indigo-500/60'
                }`}
            >
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
                  const price = car.sellingDetails?.expectedPrice ?? car.expectedPrice ?? car.price ?? 0;
                  const miles = car.basicDetails?.mileage ?? car.mileage ?? 0;
                  const fuel = car.specifications?.fuelType ?? car.fuelType;
                  const trans = car.specifications?.transmission ?? car.transmission;
                  const desc = car.sellingDetails?.description ?? car.description;
                  const status = car.status ?? 'available';
                  return (
                    <tr key={id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="indigo-500 font-semibold">{make} {model}</p>
                        <p className="indigo-500/40 text-xs">{desc}</p>
                      </td>
                      <td className="px-6 py-4 indigo-500">{year}</td>
                      <td className="px-6 py-4 indigo-500 font-semibold">₹{Number(price).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 indigo-500/60">{Number(miles).toLocaleString()} km</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.06] indigo-500/60">{fuel}</span>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.06] indigo-500/60">{trans}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(car)} className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(id)} className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all" title="Delete">
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