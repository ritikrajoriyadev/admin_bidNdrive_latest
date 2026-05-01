import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

const statusConfig = {
  new: { label: 'New', bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open: { label: 'Open', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  pending: { label: 'Pending', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
};

const priorityConfig = {
  high: { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  medium: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  low: { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const avatarGradients = [
  'from-indigo-500 to-violet-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
  'from-teal-500 to-cyan-500',
];

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
      <span className="text-white/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-white/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

// ── Detail Drawer ──────────────────────────────────────────────────
const DetailDrawer = ({ enquiry, onClose, onStatusChange }) => {
  if (!enquiry) return null;
  const sc = statusConfig[enquiry.status] || { label: enquiry.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  const pc = priorityConfig[enquiry.priority] || { label: enquiry.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
  const gradIdx = 0; // enquiries.findIndex(e => e.id === enquiry.id) % avatarGradients.length;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        className="relative w-full max-w-md h-full bg-gray-900 border-l border-white/[0.07] flex flex-col shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <p className="text-white/30 text-xs font-mono">{enquiry.id}</p>
            <h3 className="text-white font-semibold text-base mt-0.5 leading-tight">{enquiry.subject}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all duration-200">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 flex flex-col gap-5">
          {/* Sender info */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradients[gradIdx]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {enquiry.avatar}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{enquiry.name}</p>
              <p className="text-white/40 text-xs">{enquiry.email}</p>
              <p className="text-white/30 text-xs">{enquiry.phone}</p>
            </div>
          </div>

          {/* Status + Priority */}
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
              {pc.label} Priority
            </span>
            <span className="ml-auto text-white/25 text-xs">{enquiry.date}</span>
          </div>

          {/* Message */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Message</p>
            <p className="text-white/70 text-sm leading-relaxed">{enquiry.message}</p>
          </div>

          {/* Selling Details */}
          {enquiry.sellingDetails && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Selling Details</p>
              <div className="grid grid-cols-2 gap-2 text-white/70 text-sm">
                <div><span className="text-white/40">Expected Price:</span> ₹{enquiry.sellingDetails.expectedPrice}</div>
                <div><span className="text-white/40">City:</span> {enquiry.sellingDetails.city}</div>
                <div><span className="text-white/40">Fuel Type:</span> {enquiry.sellingDetails.fuelType}</div>
                <div><span className="text-white/40">Transmission:</span> {enquiry.sellingDetails.transmission}</div>
                <div><span className="text-white/40">Ownership:</span> {enquiry.sellingDetails.ownership}</div>
                <div><span className="text-white/40">Kilometers:</span> {enquiry.sellingDetails.kilometersDriven}</div>
                <div><span className="text-white/40">Accident History:</span> {enquiry.sellingDetails.accidentHistory}</div>
                <div><span className="text-white/40">Service History:</span> {enquiry.sellingDetails.serviceHistoryAvailable ? 'Available' : 'Not Available'}</div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {enquiry.attachments && enquiry.attachments.length > 0 && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Attachments</p>
              <div className="space-y-2">
                {enquiry.attachments.map((att, idx) => (
                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block text-indigo-400 hover:text-indigo-300 text-sm">
                    {att.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {enquiry.notes && enquiry.notes.length > 0 && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Notes</p>
              <div className="space-y-2">
                {enquiry.notes.map((note, idx) => (
                  <div key={idx} className="text-white/70 text-sm">
                    <p className="text-white/40 text-xs">{note.addedBy.firstName} {note.addedBy.lastName} - {new Date(note.addedAt).toLocaleString()}</p>
                    <p>{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Status */}
          <div>
            <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => onStatusChange(enquiry.id, key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${enquiry.status === key ? `${cfg.bg} ${cfg.text} border-current` : 'bg-white/[0.03] text-white/35 border-white/[0.06] hover:bg-white/[0.06]'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reply box */}
          <div>
            <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Quick Reply</p>
            <textarea
              rows={4}
              placeholder="Type your reply here..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-white/70 text-sm placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] resize-none transition-all duration-200"
            />
            <button className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-indigo-500/20">
              Send Reply →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────
const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');
  const toast = useToast();

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = response.data.data.map(enquiry => ({
          id: enquiry._id,
          name: `${enquiry.userId.firstName} ${enquiry.userId.lastName}`,
          email: enquiry.userId.email,
          phone: enquiry.contactNumber,
          subject: enquiry.title,
          message: enquiry.description,
          status: enquiry.status,
          priority: enquiry.priority,
          date: new Date(enquiry.createdAt).toLocaleDateString(),
          avatar: `${enquiry.userId.firstName[0]}${enquiry.userId.lastName[0]}`.toUpperCase(),
          sellingDetails: enquiry.sellingDetails,
          attachments: enquiry.attachments,
          notes: enquiry.notes
        }));
        setEnquiries(data);
      } catch (err) {
        setError('Failed to fetch enquiries');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/technicians`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Technicians response:', response.data);

        const techs = response.data.data.technicians.map(t => ({
          id: t._id,
          name: `${t.firstName} ${t.lastName}`
        }));

        console.log('Mapped technicians:', techs);

        setTechnicians(techs);
      } catch (err) {
        console.error('Failed to fetch technicians', err);
      }
    };
    fetchTechnicians();
  }, []);

  const data = enquiries;

  const counts = {
    all: data.length,
    new: data.filter(e => e.status === 'new').length,
    open: data.filter(e => e.status === 'open').length,
    pending: data.filter(e => e.status === 'pending').length,
    assigned: data.filter(e => e.status === 'assigned').length,
    resolved: data.filter(e => e.status === 'resolved').length,
    closed: data.filter(e => e.status === 'closed').length,
  };

  const filtered = data.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (id, newStatus) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
    toast.success(`Enquiry status updated to ${newStatus}`);
  };

  const openAssignModal = (enquiry) => {
    setAssignTarget(enquiry);
    setSelectedTechId('');
    setAssignPriority('medium');
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!assignTarget) {
      toast.error('No enquiry selected for assignment');
      return;
    }
    if (!selectedTechId) {
      toast.error('Please choose a technician');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/${assignTarget.id}/assign`, {
        technicianId: selectedTechId,
        priority: assignPriority,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setEnquiries(prev => prev.map(e => e.id === assignTarget.id ? { ...e, status: 'assigned', priority: assignPriority } : e));
      setSelected(prev => prev?.id === assignTarget.id ? { ...prev, status: 'assigned', priority: assignPriority } : prev);

      toast.success('Enquiry assigned successfully');
      setAssignModalOpen(false);
      setAssignTarget(null);
    } catch (err) {
      console.error('Assign failed', err);
      toast.error('Failed to assign enquiry');
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'open', label: 'Open' },
    { key: 'pending', label: 'Pending' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading enquiries...</div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-400">{error}</div>
        </div>
      )}
      {!loading && !error && (
        <>



          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Enquiries" value={counts.all} sub="All time" accent="bg-indigo-500"
              icon={<svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
            />
            <StatCard label="New" value={counts.new} sub="Unread" accent="bg-sky-500"
              icon={<svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
            />
            <StatCard label="Pending" value={counts.pending} sub="Awaiting" accent="bg-amber-500"
              icon={<svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            />
            <StatCard label="Resolved" value={counts.resolved} sub="Closed" accent="bg-emerald-500"
              icon={<svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
            />
          </div>

          {/* ── Filters + Search ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterStatus === tab.key
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-white/35 hover:text-white/60'
                    }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/40'}`}>
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search enquiries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-white/70 text-sm placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl bg-gray-900 border border-white/[0.06] overflow-hidden">
            {/* Table head */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              {['Sender', 'Subject', 'Priority', 'Status', 'Action'].map(h => (
                <span key={h} className="text-white/25 text-[10px] font-bold tracking-widest uppercase">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </div>
                <p className="text-white/30 text-sm font-medium">No enquiries found</p>
                <p className="text-white/15 text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filtered.map((enq, idx) => {
                const sc = statusConfig[enq.status] || { label: enq.status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
                const pc = priorityConfig[enq.priority] || { label: enq.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
                const grad = avatarGradients[idx % avatarGradients.length];
                return (
                  <div
                    key={enq.id}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 cursor-pointer items-center group"
                    onClick={() => setSelected(enq)}
                  >
                    {/* Sender */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {enq.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/85 text-sm font-medium truncate">{enq.name}</p>
                        <p className="text-white/30 text-xs truncate">{enq.email}</p>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="min-w-0">
                      <p className="text-white/70 text-sm truncate">{enq.subject}</p>
                      <p className="text-white/25 text-xs mt-0.5">{enq.date}</p>
                    </div>

                    {/* Priority */}
                    <div>
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                        {pc.label}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(enq); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      >
                        View
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openAssignModal(enq); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      >
                        Assign
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Table footer */}
            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                <span className="text-white/25 text-xs">Showing {filtered.length} of {data.length} enquiries</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(p => (
                    <button key={p} className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all duration-150 ${p === 1 ? 'bg-indigo-500 text-white' : 'text-white/30 hover:bg-white/[0.05] hover:text-white/60'}`}>{p}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assign Modal */}
          {assignModalOpen && assignTarget && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4" onClick={() => setAssignModalOpen(false)}>
              <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/[0.07] p-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-semibold">Assign Enquiry</h3>
                  <button onClick={() => setAssignModalOpen(false)} className="text-white/50 hover:text-white">
                    ✕
                  </button>
                </div>
                <p className="text-white/60 mb-4">Enquiry <span className="font-semibold text-white">{assignTarget.subject}</span></p>
                <div className="space-y-3">
                  <label className="block text-sm text-white/60">Technician</label>
                  <select
                    value={selectedTechId}
                    onChange={e => setSelectedTechId(e.target.value)}
                    className="w-full bg-blue/[0.05] border rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="" disabled>Select technician</option>
                    {console.log(technicians)}
                    {technicians.map(tech => (
                      <option  className="text-black" key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3 mt-3">
                  <label className="block text-sm text-white/60">Priority</label>
                  <select
                    value={assignPriority}
                    onChange={e => setAssignPriority(e.target.value)}
                    className="w-full bg-white/[0.05] border rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-white/[0.08] text-white text-sm hover:bg-white/[0.12]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-400"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detail Drawer */}
          {selected && (
            <DetailDrawer
              enquiry={selected}
              onClose={() => setSelected(null)}
              onStatusChange={handleStatusChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Enquiries;