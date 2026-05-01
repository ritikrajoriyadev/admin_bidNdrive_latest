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
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('note'); // 'note' or 'cost'
  const [noteText, setNoteText] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = response.data.data.map(enquiry => ({
        id: enquiry._id,
        name: `${enquiry.userId?.firstName || 'Unknown'} ${enquiry.userId?.lastName || ''}`,
        email: enquiry.userId?.email || 'N/A',
        phone: enquiry.contactNumber,
        subject: enquiry.title,
        message: enquiry.description,
        status: enquiry.status,
        priority: enquiry.priority,
        date: new Date(enquiry.createdAt).toLocaleDateString(),
        avatar: `${enquiry.userId?.firstName?.[0] || 'U'}${enquiry.userId?.lastName?.[0] || ''}`.toUpperCase(),
        sellingDetails: enquiry.sellingDetails,
        attachments: enquiry.attachments,
        notes: enquiry.notes,
        estimatedCost: enquiry.estimatedCost || 0,
        actualCost: enquiry.actualCost || 0
      }));
      setEnquiries(data);
    } catch (err) {
      setError('Failed to fetch enquiries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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



  const openNoteModal = (enquiry) => {
    setAssignTarget(enquiry);
    setNoteText('');
    setActionType('note');
    setActionModalOpen(true);
  };

  const openCostModal = (enquiry) => {
    setAssignTarget(enquiry);
    setEstimatedCost(enquiry.estimatedCost || '');
    setActualCost(enquiry.actualCost || '');
    setActionType('cost');
    setActionModalOpen(true);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return toast.error('Please enter a note');
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/${assignTarget.id}/add-note`, 
        { text: noteText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Note added successfully');
      setActionModalOpen(false);
      fetchEnquiries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCost = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/${assignTarget.id}/cost`, 
        { 
          estimatedCost: Number(estimatedCost) || 0, 
          actualCost: Number(actualCost) || 0 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cost updated successfully');
      setActionModalOpen(false);
      fetchEnquiries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cost');
    } finally {
      setSubmitting(false);
    }
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

      toast.success('Enquiry assigned successfully');
      setAssignModalOpen(false);
      fetchEnquiries();
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
    <div className="w-full">
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
            {/* Status Tabs - scrollable on mobile */}
            <div className="w-full sm:w-auto overflow-x-auto pb-1">
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-max">
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
            {/* Table wrapper with horizontal scroll */}
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
            {/* Table head */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_160px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
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
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_160px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 cursor-pointer items-center group"
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(enq); }}
                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all group/btn relative"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      
                      <button
                        onClick={e => { e.stopPropagation(); openAssignModal(enq); }}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        title="Assign Technician"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6m-3-3h6"/></svg>
                      </button>

                      <button
                        onClick={e => { e.stopPropagation(); openNoteModal(enq); }}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                        title="Add Note"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>

                      <button
                        onClick={e => { e.stopPropagation(); openCostModal(enq); }}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                        title="Set Cost"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
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
            </div>
          </div>

          {/* Action Modal (Note/Cost) */}
          {actionModalOpen && assignTarget && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setActionModalOpen(false)}>
              <div
                className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/[0.08] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${actionType === 'note' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-500'}`} />
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${actionType === 'note' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                        {actionType === 'note' ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold">{actionType === 'note' ? 'Add Note' : 'Set Service Cost'}</h3>
                        <p className="text-white/40 text-xs truncate max-w-[200px]">{assignTarget.subject}</p>
                      </div>
                    </div>
                    <button onClick={() => setActionModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  {actionType === 'note' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Internal Note</label>
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Type your note here..."
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all min-h-[120px] resize-none"
                        />
                      </div>
                      <button
                        onClick={handleAddNote}
                        disabled={submitting || !noteText.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                      >
                        {submitting ? 'Adding...' : 'Add Note →'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Estimated Cost (₹)</label>
                          <input
                            type="number"
                            value={estimatedCost}
                            onChange={e => setEstimatedCost(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Actual Cost (₹)</label>
                          <input
                            type="number"
                            value={actualCost}
                            onChange={e => setActualCost(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleUpdateCost}
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm hover:from-blue-400 hover:to-indigo-400 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                      >
                        {submitting ? 'Updating...' : 'Update Cost →'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assign Modal */}
          {assignModalOpen && assignTarget && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setAssignModalOpen(false)}>
              <div
                className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/[0.08] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border-b border-white/[0.06] px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white text-base font-bold">Assign Enquiry</h3>
                        <p className="text-white/40 text-xs mt-0.5">Choose technician & priority</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAssignModalOpen(false)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  {/* Enquiry info */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <svg className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Enquiry</p>
                      <p className="text-white text-sm font-semibold truncate">{assignTarget.subject}</p>
                      <p className="text-white/40 text-xs mt-0.5">{assignTarget.name}</p>
                    </div>
                  </div>

                  {/* Technician Select */}
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Select Technician</label>
                    <select
                      value={selectedTechId}
                      onChange={e => setSelectedTechId(e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/60 focus:bg-gray-800/80 transition-all appearance-none cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" disabled className="bg-gray-800 text-white/50">Choose a technician...</option>
                      {technicians.map(tech => (
                        <option className="bg-gray-800 text-white" key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                    {technicians.length === 0 && (
                      <p className="text-amber-400/70 text-xs mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        No technicians available
                      </p>
                    )}
                  </div>

                  {/* Priority Select */}
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Priority Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'low', label: 'Low', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20' },
                        { value: 'medium', label: 'Medium', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500/20' },
                        { value: 'high', label: 'High', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', activeBg: 'bg-rose-500/20' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAssignPriority(opt.value)}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 ${
                            assignPriority === opt.value
                              ? `${opt.activeBg} ${opt.border} ${opt.color} shadow-sm`
                              : 'bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-white/50 hover:bg-white/[0.06]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setAssignModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/60 text-sm font-semibold hover:bg-white/[0.10] hover:text-white/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-400 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                    disabled={!selectedTechId}
                  >
                    Assign Now →
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