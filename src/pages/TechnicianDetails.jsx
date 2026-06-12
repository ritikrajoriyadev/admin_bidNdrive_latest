import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

const statusConfig = {
    active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    inactive: { label: 'Inactive', bg: 'bg-white/[0.06]', text: 'indigo-500/40', dot: 'bg-white/30' },
};

const TechnicianDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [technicianData, setTechnicianData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                setError(null);
                setLoading(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/admin/technicians/${id}/details`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data?.success) {
                    setTechnicianData(response.data.data);
                } else {
                    setError(response.data?.message || 'Unable to load technician details.');
                }
            } catch (err) {
                console.error('Failed to load technician details:', err);
                setError(err.response?.data?.message || 'Unable to load technician details.');
                toast.error(err.response?.data?.message || 'Failed to load technician details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, toast]);

    const technician = technicianData?.technician;
    const assignedEnquiries = technicianData?.assignedEnquiries || [];
    const statistics = technicianData?.statistics || {};

    const formatDate = (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="indigo-500/80">Loading technician details…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/80 px-4 py-2 text-sm font-semibold indigo-500 hover:bg-white transition"
                >
                    ← Back
                </button>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                    <p className="font-semibold">Unable to load technician details.</p>
                    <p className="mt-2 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-2 inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/80 px-4 py-2 text-sm font-semibold indigo-500 hover:bg-white transition"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl font-semibold indigo-500">Technician Profile</h1>
                    <p className="mt-1 text-sm indigo-500/60">Complete technician data for {technician?.firstName || 'Technician'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 border border-white/[0.08] px-4 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${technician?.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {technician?.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">Last Updated</p>
                    <p className="font-semibold text-slate-700">{formatDate(technician?.updatedAt)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/[0.08] bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-3xl font-bold text-white`}>
                                    {`${technician?.firstName?.[0] || ''}${technician?.lastName?.[0] || ''}`.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold indigo-500">{`${technician?.firstName || ''} ${technician?.lastName || ''}`.trim()}</h2>
                                    <p className="text-sm indigo-500/65">{technician?.email || 'No email'}</p>
                                </div>
                            </div>
                            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Role</p>
                                <p className="font-semibold">{technician?.role || '—'}</p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Created</p>
                                <p className="mt-2 font-semibold indigo-500">{formatDate(technician?.createdAt)}</p>
                            </div>
                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Last login</p>
                                <p className="mt-2 font-semibold indigo-500">{formatDate(technician?.lastLogin)}</p>
                            </div>
                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Phone</p>
                                <p className="mt-2 font-semibold indigo-500">{technician?.phone || '—'}</p>
                            </div>
                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Device token</p>
                                <p className="mt-2 font-semibold indigo-500">{technician?.deviceToken || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-3xl border border-white/[0.08] bg-white p-6">
                            <h3 className="text-base font-semibold indigo-500 mb-4">Device information</h3>
                            <div className="space-y-3 text-sm text-slate-700">
                                <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-slate-400">Device</span>
                                    <span>{technician?.deviceInfo?.deviceName || '—'}</span>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-slate-400">Browser</span>
                                    <span>{technician?.deviceInfo?.browser || '—'}</span>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-slate-400">OS</span>
                                    <span>{technician?.deviceInfo?.os || '—'}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-slate-400">IP address</span>
                                    <span>{technician?.deviceInfo?.ip || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/[0.08] bg-white p-6">
                            <h3 className="text-base font-semibold indigo-500 mb-4">Metrics</h3>
                            <div className="space-y-3 text-sm text-slate-700">
                                <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-slate-400">Assigned enquiries</span>
                                    <span>{statistics.totalAssigned ?? assignedEnquiries.length}</span>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-slate-400">Completed</span>
                                    <span>{statistics.completed ?? 0}</span>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-slate-400">In progress</span>
                                    <span>{statistics.inProgress ?? 0}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-slate-400">Pending</span>
                                    <span>{statistics.pending ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/[0.08] bg-white p-6">
                        <h3 className="text-base font-semibold indigo-500 mb-4">Login history</h3>
                        {technician?.loginHistory?.length ? (
                            <div className="space-y-3">
                                {technician.loginHistory.map((item) => (
                                    <div key={item._id || item.loginAt} className="rounded-3xl bg-slate-50 p-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                                            <p className="font-medium indigo-500">{formatDate(item.loginAt)}</p>
                                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.ip}</p>
                                        </div>
                                        <p className="text-sm indigo-500/70">{item.userAgent || 'No user agent'}</p>
                                        <p className="text-sm text-slate-500">Device token: {item.deviceToken || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm indigo-500/70">No login history available.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/[0.08] bg-white p-6">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <h3 className="text-base font-semibold indigo-500">Assigned enquiries</h3>
                                <p className="text-sm indigo-500/60">Complete enquiry details</p>
                            </div>
                            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-500">
                                {assignedEnquiries.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {assignedEnquiries.length === 0 ? (
                                <p className="text-sm indigo-500/70">No enquiries assigned to this technician.</p>
                            ) : (
                                assignedEnquiries.map((enquiry) => (
                                    <div key={enquiry._id} className="rounded-3xl border border-white/[0.08] bg-slate-50 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                                            <div>
                                                <p className="font-semibold indigo-500">{enquiry.carDetails?.make || 'Unknown'} {enquiry.carDetails?.model || ''}</p>
                                                <p className="text-sm indigo-500/70">{enquiry.status?.replace(/-/g, ' ') || 'Unknown status'}</p>
                                            </div>
                                            <div className="text-right text-sm text-slate-500">
                                                <p>{enquiry.enquiryId || enquiry._id}</p>
                                                <p>{enquiry.scheduleDate ? formatDate(enquiry.scheduleDate) : 'No schedule'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                            <div>
                                                <p className="text-slate-400">Customer</p>
                                                <p>{enquiry.userId?.firstName || enquiry.customerName || 'Unknown'} {enquiry.userId?.lastName || ''}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Contact</p>
                                                <p>{enquiry.contactNumber || enquiry.userId?.phone || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">City</p>
                                                <p>{enquiry.sellingDetails?.city || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Price</p>
                                                <p>{enquiry.sellingDetails?.expectedPrice ? `₹${enquiry.sellingDetails.expectedPrice}` : '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/[0.08] bg-white p-6">
                        <h3 className="text-base font-semibold indigo-500 mb-4">Raw technician payload</h3>
                        <pre className="max-h-[360px] overflow-auto rounded-3xl bg-slate-950/95 p-4 text-xs text-slate-100">
                            {JSON.stringify(technicianData, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianDetails;
