import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import {
  Search,
  RefreshCcw,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

// ✅ Backend-aligned statuses
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

// 🎨 Status UI styles
const statusStyles = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

// 📅 Format date
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

// 🎯 Status badge
const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || statusStyles.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
      {status}
    </span>
  );
};

// 🔄 Normalize API data
const normalizeLoan = (item) => ({
  id: item._id,
  name: item.user_id?.name || 'Unknown',
  email: item.user_id?.email || '-',
  amount: item.amount,
  car_type: item.car_type,
  tenure: item.tenure_months,
  purpose: item.purpose,
  status: item.status || 'pending',
  createdAt: item.createdAt,
});

export default function Loan() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('approved');
  const [updating, setUpdating] = useState(false);

  const { addToast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('adminToken');

  // 🚀 Fetch Loans
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/loans/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data || [];
      setLoans(data.map(normalizeLoan));
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch loans', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // 🔍 Filter + Search
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchStatus =
        filterStatus === 'all' || loan.status === filterStatus;

      const term = search.toLowerCase();

      return (
        matchStatus &&
        `${loan.name} ${loan.email} ${loan.amount} ${loan.car_type}`
          .toLowerCase()
          .includes(term)
      );
    });
  }, [loans, search, filterStatus]);

  // 🔄 Update Status
  const updateStatus = async () => {
    if (!selectedLoan) return;

    setUpdating(true);
    try {
      await axios.put(
        `${apiUrl}/api/loans/update/${selectedLoan.id}`,
        { status: statusUpdate },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      addToast('Status updated successfully');
      setSelectedLoan(null);
      fetchLoans();
    } catch (err) {
      console.error(err);
      addToast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 indigo-500">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Loan Requests</h1>
        <button
          onClick={fetchLoans}
          className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Search..."
          className="flex-1 p-2 bg-white rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="p-2 bg-white rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All</option>
          {VALID_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : filteredLoans.length === 0 ? (
        <p>No loans found</p>
      ) : (
        filteredLoans.map((loan) => (
          <div
            key={loan.id}
            className="flex justify-between items-center border-b border-gray-700 py-4"
          >
            <div>
              <p className="font-semibold">{loan.purpose}</p>
              <p className="text-sm text-gray-400">
                ₹{loan.amount} • {loan.car_type} • {loan.tenure} months
              </p>
              <p className="text-xs text-gray-500">
                {loan.name} • {loan.email}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <StatusBadge status={loan.status} />
              <button onClick={() => setSelectedLoan(loan)}>
                <ArrowRight />
              </button>
            </div>
          </div>
        ))
      )}

      {/* MODAL */}
      {selectedLoan && (
        <div className="mt-6 bg-white p-4 rounded">
          <h2 className="mb-4 font-semibold">Update Loan Status</h2>

          <select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            className="p-2 bg-gray-800 rounded mb-3"
          >
            {VALID_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={updateStatus}
            disabled={updating}
            className="bg-green-500 px-4 py-2 rounded flex items-center gap-2"
          >
            {updating ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}