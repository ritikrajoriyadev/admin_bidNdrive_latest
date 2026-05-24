import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, MessageSquare, User, Phone, Mail, Calendar, DollarSign, Car } from 'lucide-react';

const statusConfig = {
  new: { label: 'New', bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  interested: { label: 'Interested', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  negotiating: { label: 'Negotiating', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  test_drive: { label: 'Test Drive', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  sale_pending: { label: 'Sale Pending', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' },
  sold: { label: 'Sold', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
};

const priorityConfig = {
  high: { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  medium: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  low: { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

/* ─── Stat Card ─────────────────────────────────────────────────────── */
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

/* ─── Detail Drawer ─────────────────────────────────────────────────── */
const DetailDrawer = ({ enquiry, onClose, onStatusChange }) => {
  if (!enquiry) return null;

  const sc = statusConfig[enquiry.status] || { label: enquiry.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  const pc = priorityConfig[enquiry.priority] || { label: enquiry.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 indigo-500/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md h-full bg-white border-l indigo-500 flex flex-col shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <p className="indigo-500/30 text-xs font-mono">ID: {enquiry.id}</p>
            <h3 className="indigo-500 font-semibold text-base mt-0.5">{enquiry.carModel}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center indigo-500/40 hover:indigo-500/70 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">

          {/* Car Details */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4">
            <p className="indigo-500/40 text-xs font-medium mb-3 uppercase tracking-wider">Car Information</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="indigo-500/40 text-sm">Make & Model:</span>
                <span className="indigo-500 font-semibold">{enquiry.carMake} {enquiry.carModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="indigo-500/40 text-sm">Year:</span>
                <span className="indigo-500 font-semibold">{enquiry.carYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="indigo-500/40 text-sm">Listed Price:</span>
                <span className="indigo-500 font-semibold text-emerald-400">${enquiry.carPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="indigo-500/40 text-sm">Offered Price:</span>
                <span className="indigo-500 font-semibold">${enquiry.offeredPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <p className="indigo-500/40 text-xs font-medium mb-3 uppercase tracking-wider">Customer Details</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <User className="w-4 h-4 indigo-500/40" />
                <span className="indigo-500/60 text-sm">{enquiry.customerName}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Mail className="w-4 h-4 indigo-500/40" />
                <span className="indigo-500/60 text-sm">{enquiry.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Phone className="w-4 h-4 indigo-500/40" />
                <span className="indigo-500/60 text-sm">{enquiry.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
              {pc.label} Priority
            </span>
            <span className="ml-auto indigo-500/25 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {enquiry.date}
            </span>
          </div>

          {/* Message */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-3">Enquiry Message</p>
            <p className="indigo-500/60 text-sm leading-relaxed">{enquiry.message}</p>
          </div>

          {/* Status Change */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-3">Update Status</p>
            <select
              value={enquiry.status}
              onChange={(e) => onStatusChange(enquiry.id, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/[0.08] indigo-500 text-sm focus:border-indigo-400/50 focus:outline-none"
            >
              {Object.entries(statusConfig).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function SellCarEnquiries() {
  const { addToast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch enquiries
  useEffect(() => {
    const fetchEnquiries = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/car-enquiries/admin/all`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = response.data.data.map((enquiry) => ({
          id: enquiry._id,
          carMake: enquiry.carId?.basicDetails?.make || 'N/A',
          carModel: enquiry.carId?.basicDetails?.model || 'N/A',
          carYear: enquiry.carId?.basicDetails?.year || 'N/A',
          carPrice: enquiry.carId?.sellingDetails?.expectedPrice || 0,
          offeredPrice: enquiry.offeredPrice || 0,
          customerName: `${enquiry.userId?.firstName || ''} ${enquiry.userId?.lastName || ''}`.trim() || enquiry.contactDetails?.name || 'N/A',
          customerEmail: enquiry.userId?.email || enquiry.contactDetails?.email || 'N/A',
          customerPhone: enquiry.userId?.phone || enquiry.contactDetails?.phone || 'N/A',
          message: enquiry.message || 'No message provided',
          status: enquiry.status || 'pending',
          priority: enquiry.priority || 'medium',
          date: new Date(enquiry.createdAt).toLocaleDateString(),
        }));
        setEnquiries(data);
        addToast('Enquiries loaded successfully', 'success');
      } catch (error) {
        console.error('Failed to fetch enquiries:', error);
        addToast(error.response?.data?.message || 'Error loading enquiries', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  // Filter enquiries
  useEffect(() => {
    let filtered = enquiries.filter((enq) => {
      const matchSearch = `${enq.carMake} ${enq.carModel} ${enq.customerName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || enq.status === filterStatus;
      return matchSearch && matchStatus;
    });
    setFilteredEnquiries(filtered);
  }, [enquiries, searchTerm, filterStatus]);

  const handleStatusChange = async (enqId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/car-enquiries/admin/${enqId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setEnquiries(enquiries.map(enq =>
        enq.id === enqId ? { ...enq, status: newStatus } : enq
      ));
      setSelectedEnquiry(null);
      addToast('Status updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      addToast(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Statistics
  const totalEnquiries = enquiries.length;
  const newEnquiries = enquiries.filter(e => e.status === 'new').length;
  const soldEnquiries = enquiries.filter(e => e.status === 'sold').length;
  const avgOfferedPrice = enquiries.length > 0
    ? Math.round(enquiries.reduce((sum, e) => sum + e.offeredPrice, 0) / enquiries.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold indigo-500">Car Sale Enquiries</h1>
        <p className="indigo-500/40 text-sm">Track and manage customer enquiries for vehicles</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Enquiries"
          value={totalEnquiries}
          icon={<MessageSquare className="w-4 h-4" />}
          accent="bg-indigo-500"
          sub="All Time"
        />
        <StatCard
          label="New Enquiries"
          value={newEnquiries}
          icon={<Car className="w-4 h-4" />}
          accent="bg-amber-500"
          sub="Pending Response"
        />
        <StatCard
          label="Sold"
          value={soldEnquiries}
          icon={<DollarSign className="w-4 h-4" />}
          accent="bg-emerald-500"
          sub="Completed"
        />
        <StatCard
          label="Avg Offered"
          value={`$${(avgOfferedPrice / 1000).toFixed(1)}K`}
          icon={<Calendar className="w-4 h-4" />}
          accent="bg-violet-500"
          sub="Customer Offers"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
          <input
            type="text"
            placeholder="Search cars or customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'interested', 'test_drive', 'negotiating', 'sale_pending', 'sold'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${filterStatus === status
                ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-300'
                : 'bg-gray-800 border border-white/[0.06] indigo-500/40 hover:indigo-500/60'
                }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center indigo-500/40">
            Loading enquiries...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-8 flex items-center justify-center indigo-500/40">
            No enquiries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Listed Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Offered Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredEnquiries.map((enq) => {
                  const sc = statusConfig[enq.status] || statusConfig.new;
                  const pc = priorityConfig[enq.priority] || priorityConfig.medium;

                  return (
                    <tr key={enq.id} className="hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer">
                      <td className="px-6 py-4">
                        <div>
                          <p className="indigo-500 font-semibold">{enq.carMake} {enq.carModel}</p>
                          <p className="indigo-500/40 text-xs">Year: {enq.carYear}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="indigo-500 font-semibold text-sm">{enq.customerName}</p>
                          <p className="indigo-500/40 text-xs">{enq.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="indigo-500 font-semibold">${enq.carPrice.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-emerald-400 font-semibold">${enq.offeredPrice.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                          {pc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 indigo-500/60 text-sm">{enq.date}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedEnquiry(enq)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
