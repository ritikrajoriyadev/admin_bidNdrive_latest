import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { decryptResponse } from '../utls/decryptResponse'; // adjust path if needed
import {
  Search, Trophy, User, Phone, Mail, Hash, Car,
  RefreshCw, DollarSign, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';

/* ─── API ─────────────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

/*
  Actual API shape:
  {
    auctionId, enquiryId, status, winningAmount, createdAt, updatedAt,
    winner:  { _id, firstName, lastName, email, phone, profileImage },
    user:    { _id, firstName, lastName, email, phone },          ← car owner
    carDetails: { make, model, year, color, registrationNumber, mileage },
    lastFiveBidders: [{ bidder: {...}, bidAmount, bidTime }]
  }
*/

const fuelBadge = (fuel) =>
  ({ petrol: '⛽', diesel: '🛢️', electric: '⚡', cng: '🔵', hybrid: '🔋' })[fuel?.toLowerCase()] || '🚗';

const avatarColors = [
  'from-indigo-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Avatar = ({ src, name, size = 'md', colorIdx = 0 }) => {
  const [err, setErr] = useState(false);
  const initials = name
    ? name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const sz = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
  const grad = avatarColors[colorIdx % avatarColors.length];

  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        className={`${sz} rounded-full object-cover ring-2 ring-white/10 flex-shrink-0`} />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 ring-2 ring-white/10`}>
      <span className="indigo-500 font-bold">{initials}</span>
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20 indigo-500/60`}>{icon}</span>
      <span className="indigo-500/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Bidder Row (inside expanded section) ───────────────────────────────── */
const BidderRow = ({ bidder, bidAmount, bidTime, rank }) => {
  const name = `${bidder?.firstName || ''} ${bidder?.lastName || ''}`.trim() || 'Unknown';
  const time = bidTime ? new Date(bidTime).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : '—';
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${rank === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${rank === 0 ? 'bg-amber-500 indigo-500' : 'bg-white/10 indigo-500/40'}`}>
        {rank + 1}
      </div>
      <Avatar name={name} size="sm" colorIdx={rank} />
      <div className="flex-1 min-w-0">
        <p className="indigo-500/80 text-xs font-semibold truncate">{name}</p>
        <p className="indigo-500/35 text-[10px] truncate">{bidder?.email}</p>
        <p className="indigo-500/35 text-[10px] truncate">{bidder?.phone}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${rank === 0 ? 'text-amber-400' : 'indigo-500/60'}`}>
          ₹{bidAmount?.toLocaleString()}
        </p>
        <p className="indigo-500/25 text-[10px]">{time}</p>
      </div>
    </div>
  );
};

/* ─── Winner Card (Grid) ─────────────────────────────────────────────────── */
const WinnerCard = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);
  const winnerName = `${item.winner.firstName} ${item.winner.lastName}`.trim() || 'Unknown';
  const ownerName = `${item.user.firstName} ${item.user.lastName}`.trim() || 'Unknown';

  return (
    <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-all duration-300">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

      <div className="p-5">
        {/* Rank + Auction ID */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-400 text-xs font-bold">#{index + 1}</span>
            </div>
            <span className="indigo-500/25 text-[10px] font-mono">
              {item.auctionId.slice(-8).toUpperCase()}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold uppercase">
            {item.status}
          </span>
        </div>

        {/* Winner */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={item.winner.profileImage} name={winnerName} size="lg" colorIdx={index} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wide">Winner</span>
            </div>
            <p className="indigo-500 font-semibold text-sm truncate">{winnerName}</p>
            <p className="indigo-500/40 text-xs truncate">{item.winner.email}</p>
          </div>
        </div>

        {/* Winner contact */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-1 min-w-0">
            <Phone className="w-3 h-3 indigo-500/30 flex-shrink-0" />
            <span className="indigo-500/55 text-xs truncate">{item.winner.phone}</span>
          </div>
        </div>

        {/* Winning amount */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 mb-4">
          <span className="indigo-500/40 text-xs font-medium">Winning Bid</span>
          <span className="text-amber-400 font-bold text-lg">₹{item.winningAmount.toLocaleString()}</span>
        </div>

        {/* Car Details */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Car className="w-3.5 h-3.5 text-indigo-400" />
            <span className="indigo-500/40 text-[10px] font-bold uppercase tracking-wider">Vehicle</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {[
              ['Make', item.carDetails.make],
              ['Model', item.carDetails.model],
              ['Year', item.carDetails.year],
              ['Color', item.carDetails.color],
              ['Reg No.', item.carDetails.registrationNumber],
              ['Mileage', `${item.carDetails.mileage?.toLocaleString()} km`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="indigo-500/25 text-[9px] uppercase tracking-wider">{k}</p>
                <p className="indigo-500/75 text-xs font-medium mt-0.5 truncate" title={v}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Car Owner */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5 text-violet-400" />
            <span className="indigo-500/40 text-[10px] font-bold uppercase tracking-wider">Car Owner</span>
          </div>
          <p className="indigo-500/75 text-sm font-medium">{ownerName}</p>
          <p className="indigo-500/35 text-xs mt-0.5">{item.user.phone}</p>
          <p className="indigo-500/25 text-xs">{item.user.email}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] indigo-500/25 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="font-mono">{item.enquiryId.slice(-8).toUpperCase()}</span>
        </div>

        {/* Expand bidders */}
        {item.lastFiveBidders?.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] indigo-500/40 hover:indigo-500/70 hover:bg-white/[0.07] transition-all text-xs font-semibold"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} Bidders ({item.lastFiveBidders.length})
          </button>
        )}
      </div>

      {expanded && item.lastFiveBidders?.length > 0 && (
        <div className="px-5 pb-5 space-y-2 border-t border-white/[0.06] pt-4">
          <p className="indigo-500/30 text-[10px] font-bold uppercase tracking-widest mb-3">
            Last {item.lastFiveBidders.length} Bids
          </p>
          {item.lastFiveBidders.map((b, i) => (
            <BidderRow key={i} rank={i} bidder={b.bidder} bidAmount={b.bidAmount} bidTime={b.bidTime} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Table Row Expanded Bidders ─────────────────────────────────────────── */
const ExpandedBidders = ({ bidders }) => (
  <tr>
    <td colSpan={8} className="px-6 pb-4 pt-0">
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
        <p className="indigo-500/30 text-[10px] font-bold uppercase tracking-widest mb-3">
          Last {bidders.length} Bids
        </p>
        <div className="space-y-2">
          {bidders.map((b, i) => (
            <BidderRow key={i} rank={i} bidder={b.bidder} bidAmount={b.bidAmount} bidTime={b.bidTime} />
          ))}
        </div>
      </div>
    </td>
  </tr>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Winners() {
  const { addToast } = useToast();
  const [winners, setWinners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [expandedRows, setExpandedRows] = useState(new Set());

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchWinners =
    async () => {
      setLoading(true);

      try {
        const {
          data
        } = await api.get(
          '/api/admin/enquiries/winners',
          {
            headers:
              getAuthHeaders()
          }
        );

        /**
         * First decrypt
         */
        const firstDecrypt =
          decryptResponse(
            data
          );

        console.log(
          'First decrypt:',
          firstDecrypt
        );

        /**
         * Second decrypt
         * because data is encrypted again
         */
        const secondDecrypt =
          firstDecrypt?.data?.iv
            ? decryptResponse(
              firstDecrypt.data
            )
            : firstDecrypt;

        console.log(
          'Final decrypt:',
          secondDecrypt
        );

        const list =
          secondDecrypt
            ?.data || [];

        setWinners(
          Array.isArray(list)
            ? list
            : []
        );
      } catch (err) {
        addToast(
          err?.response?.data
            ?.message ||
          'Error loading winners',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => { fetchWinners(); }, []);

  /* ── Filter ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = searchTerm.toLowerCase();
    setFiltered(
      winners.filter(item => {
        const w = item.winner;
        const u = item.user;
        const c = item.carDetails;
        return [
          w?.firstName, w?.lastName, w?.email, w?.phone,
          u?.firstName, u?.lastName, u?.phone,
          c?.make, c?.model, c?.registrationNumber,
          item.auctionId, item.enquiryId,
        ].join(' ').toLowerCase().includes(t);
      })
    );
  }, [winners, searchTerm]);

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  const totalBidAmount = winners.reduce((s, w) => s + (w.winningAmount || 0), 0);
  const uniqueWinners = new Set(winners.map(w => w.winner._id)).size;
  const totalBids = winners.reduce((s, w) => s + (w.lastFiveBidders?.length || 0), 0);

  /* ── Row toggle ────────────────────────────────────────────────────────── */
  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold indigo-500">Auction Winners</h1>
          <p className="indigo-500/40 text-sm mt-1">All closed auction winners and bidding history</p>
        </div>
        <button
          onClick={fetchWinners}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border indigo-500 indigo-500/40 hover:indigo-500/70 hover:bg-white/[0.08] transition-all text-xs font-medium flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Auctions Won" value={winners.length} icon={<Trophy className="w-4 h-4" />} accent="bg-amber-500" sub="All Time" />
        <StatCard label="Unique Winners" value={uniqueWinners} icon={<User className="w-4 h-4" />} accent="bg-indigo-500" sub="Distinct" />
        <StatCard label="Total Bid Amount" value={`₹${(totalBidAmount / 100000).toFixed(1)}L`} icon={<DollarSign className="w-4 h-4" />} accent="bg-emerald-500" sub="Combined" />
        <StatCard label="Bids Tracked" value={totalBids} icon={<Hash className="w-4 h-4" />} accent="bg-violet-500" sub="Last 5 Each" />
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
          <input
            type="text"
            placeholder="Search winner, owner, car, reg no…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/30 focus:border-indigo-400/50 focus:outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-800 border border-white/[0.06]">
          {['table', 'grid'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${viewMode === mode ? 'bg-indigo-500 indigo-500 shadow-lg shadow-indigo-500/30' : 'indigo-500/40 hover:indigo-500/60'}`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-white/[0.06] p-12 flex items-center justify-center">
          <div className="flex items-center gap-3 indigo-500/40">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading winners…</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-white/[0.06] p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center">
            <Trophy className="w-5 h-5 indigo-500/20" />
          </div>
          <p className="indigo-500/30 text-sm font-medium">No winners found</p>
          <p className="indigo-500/15 text-xs">Try adjusting your search</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <WinnerCard key={item.auctionId} item={item} index={i} />
          ))}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {['#', 'Winner', 'Car Owner', 'Vehicle', 'Reg No.', 'Winning Bid', 'Bids', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold indigo-500/25 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((item, index) => {
                  const winnerName = `${item.winner.firstName} ${item.winner.lastName}`.trim() || 'Unknown';
                  const ownerName = `${item.user.firstName} ${item.user.lastName}`.trim() || 'Unknown';
                  const isExpanded = expandedRows.has(item.auctionId);
                  const hasBidders = item.lastFiveBidders?.length > 0;

                  return (
                    <React.Fragment key={item.auctionId}>
                      <tr className={`hover:bg-white/[0.025] transition-colors ${isExpanded ? 'bg-white/[0.02]' : ''}`}>
                        {/* Rank */}
                        <td className="px-4 py-3">
                          <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                            <span className="text-amber-400 text-xs font-bold">{index + 1}</span>
                          </div>
                        </td>

                        {/* Winner */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={item.winner.profileImage} name={winnerName} colorIdx={index} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <p className="indigo-500 font-semibold text-sm truncate">{winnerName}</p>
                              </div>
                              <p className="indigo-500/35 text-xs truncate max-w-[160px]">{item.winner.email}</p>
                              <p className="indigo-500/25 text-xs">{item.winner.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* Car Owner */}
                        <td className="px-4 py-3">
                          <p className="indigo-500/75 text-sm font-medium">{ownerName}</p>
                          <p className="indigo-500/35 text-xs">{item.user.phone}</p>
                          <p className="indigo-500/25 text-xs truncate max-w-[140px]">{item.user.email}</p>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <p className="indigo-500/80 text-sm font-medium truncate max-w-[140px]" title={item.carDetails.make}>
                            {item.carDetails.make}
                          </p>
                          <p className="indigo-500/45 text-xs truncate max-w-[140px]">{item.carDetails.model}</p>
                          <p className="indigo-500/25 text-xs">{item.carDetails.year} · {item.carDetails.color}</p>
                        </td>

                        {/* Reg No */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs indigo-500/55 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.06]">
                            {item.carDetails.registrationNumber}
                          </span>
                          <p className="indigo-500/25 text-xs mt-1">{item.carDetails.mileage?.toLocaleString()} km</p>
                        </td>

                        {/* Winning Bid */}
                        <td className="px-4 py-3">
                          <span className="text-amber-400 font-bold text-base">
                            ₹{item.winningAmount.toLocaleString()}
                          </span>
                        </td>

                        {/* Bid Count */}
                        <td className="px-4 py-3">
                          <span className="text-indigo-400 font-semibold text-sm">
                            {item.lastFiveBidders?.length || 0}
                          </span>
                          <p className="indigo-500/20 text-[10px]">tracked</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 indigo-500/35 text-xs">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Expand */}
                        <td className="px-4 py-3">
                          {hasBidders && (
                            <button
                              onClick={() => toggleRow(item.auctionId)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isExpanded
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-white/[0.05] indigo-500/40 hover:bg-white/[0.08] hover:indigo-500/60 border border-white/[0.06]'
                                }`}
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Bids
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded bidders row */}
                      {isExpanded && hasBidders && (
                        <ExpandedBidders bidders={item.lastFiveBidders} />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}