import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { Search, MessageSquare, User, Phone, Mail, Calendar, DollarSign, Car, RefreshCw, Trophy, X, AlertTriangle } from 'lucide-react';
import EnquiryDetailPage from './Enquirydetailpage';

const REFRESH_INTERVAL = 10_000;

const statusConfig = {
  open: { label: 'Open', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  live_auction: { label: 'Live Now', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400 animate-pulse' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  new: { label: 'New', bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  sold: { label: 'Sold', bg: 'bg-teal-500/15', text: 'text-teal-400', dot: 'bg-teal-400' },
};

const fuelIcon = { petrol: '⛽', diesel: '🛢️', electric: '⚡', hybrid: '🔋' };

const avatarColors = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-purple-500',
];

const auctionTypes = [
  {
    key: 'live_auction',
    label: 'Live Auction',
    desc: 'Real-time bidding, highest bid wins',
    icon: '🔴',
    badge: 'Live',
    dot: true,
    activeCard: 'border-rose-500/50 bg-rose-500/10',
    badgeCls: 'bg-rose-500/15 text-rose-400',
    bar: 'bg-rose-500',
  },
  {
    key: 'bnb',
    label: 'BNB',
    desc: 'Buy now, negotiate & buy',
    icon: '🤝',
    badge: 'BNB',
    dot: false,
    activeCard: 'border-indigo-500/50 bg-indigo-500/10',
    badgeCls: 'bg-indigo-500/15 text-indigo-400',
    bar: 'bg-indigo-500',
  },
  {
    key: 'click_buy',
    label: 'Click & Buy',
    desc: 'Fixed price, instant purchase',
    icon: '⚡',
    badge: 'Fixed',
    dot: false,
    activeCard: 'border-emerald-500/50 bg-emerald-500/10',
    badgeCls: 'bg-emerald-500/15 text-emerald-400',
    bar: 'bg-emerald-500',
  },
];

/* ─── Normalize ──────────────────────────────────────────────────────────── */
const normalize = (auction) => {
  const enq = auction.enquiryId || {};
  const car = enq.carDetails || {};
  const sell = enq.sellingDetails || {};
  const user = enq.userId || {};
  const thumb = enq.attachments?.[0]?.url || null;
  const bids = auction.bids || [];
  const topBid = bids.length ? Math.max(...bids.map(b => b.amount)) : 0;

  return {
    id: auction._id,
    enquiryDocId: enq._id || auction._id,
    enquiryId: enq.enquiryId || enq._id || '—',
    carMake: car.make || 'N/A',
    carModel: car.model || 'N/A',
    carYear: car.year || '—',
    regNumber: car.registrationNumber || '—',
    color: car.color || '—',
    mileage: car.mileage || 0,
    thumb,
    expectedPrice: sell.expectedPrice || 0,
    fuelType: sell.fuelType || '—',
    transmission: sell.transmission || '—',
    ownership: sell.ownership || '—',
    kmsDriven: sell.kilometersDriven || 0,
    city: sell.city || '—',
    startingPrice: auction.startingPrice || 0,
    reservePrice: auction.reservePrice || 0,
    bidsCount: bids.length,
    topBid,
    bids,
    isLive: auction.isLive,
    status: auction.isLive ? 'live_auction' : (auction.status || 'pending'),
    isClosed: auction.status === 'closed',
    winner: auction.winner || null,
    startDate: auction.startDate
      ? new Date(auction.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
    customerEmail: user.email || 'N/A',
    customerPhone: user.phone || 'N/A',
    description: enq.description || '',
    priority: enq.priority || 'medium',
    remainingTime: auction.remainingTime || null,
    remainingTimestamp: auction.remainingTimestamp || 0,
  };
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20 indigo-500/60`}>{icon}</span>
      <span className="indigo-500/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Pagination ─────────────────────────────────────────────────────────── */
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const delta = 1, range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) range.push(i);
    if (page - delta > 2) range.unshift('...');
    if (page + delta < pages - 1) range.push('...');
    range.unshift(1);
    if (pages > 1) range.push(pages);
    const out = []; let prev = null;
    for (const r of range) { if (r !== prev) out.push(r); prev = r; }
    return out;
  };

  return (
    <div className="px-6 py-3 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.01]">
      <span className="indigo-500/25 text-xs order-2 sm:order-1">
        Showing <span className="indigo-500/45 font-medium">{from}–{to}</span> of{' '}
        <span className="indigo-500/45 font-medium">{total}</span> auctions
      </span>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] indigo-500/40 hover:bg-white/[0.09] hover:indigo-500/70 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`d${i}`} className="w-8 h-8 flex items-center justify-center indigo-500/20 text-xs">···</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page ? 'bg-indigo-500 indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-white/[0.05] indigo-500/40 hover:bg-white/[0.09] hover:indigo-500/70'}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] indigo-500/40 hover:bg-white/[0.09] hover:indigo-500/70 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
};

/* ─── Close Auction Confirm Modal ────────────────────────────────────────── */
const CloseAuctionModal = ({ auction, selectedBidId, onClose, onConfirm, loading }) => {
  if (!auction) return null;
  const selectedBid = auction.bids.find(b => b._id === selectedBidId);
  const isNotTop = selectedBid && selectedBid.amount !== auction.topBid;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center indigo-500/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="indigo-500 font-bold text-lg text-center mb-1">Close Auction?</h3>
        <p className="indigo-500/40 text-sm text-center mb-4">
          {selectedBid ? 'Confirm the winning bid below.' : 'The highest bid will be set as winner automatically.'}
          {' '}This cannot be undone.
        </p>

        {selectedBid && (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 mb-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="indigo-500/35">Winner</span>
              <span className="indigo-500/70 font-semibold">{selectedBid.bider?.firstName} {selectedBid.bider?.lastName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="indigo-500/35">Winning Bid</span>
              <span className="text-emerald-400 font-bold">₹{selectedBid.amount.toLocaleString()}</span>
            </div>
            {isNotTop && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.05]">
                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-amber-400 text-[10px]">Not the highest bid (₹{auction.topBid.toLocaleString()})</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] indigo-500/60 text-sm font-semibold hover:bg-white/[0.08] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 indigo-500 text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Closing…</>
            ) : (
              <><X className="w-4 h-4" />Close Auction</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Detail Drawer ──────────────────────────────────────────────────────── */
const DetailDrawer = ({ auction, onClose, onCloseAuction }) => {
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => { setSelectedBidId(null); setShowConfirm(false); }, [auction?.id]);

  if (!auction) return null;

  const sc = statusConfig[auction.status] || statusConfig.new;
  const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);
  const canClose = !auction.isClosed && (auction.isLive || auction.status === 'open' || auction.status === 'live_auction');

  const handleConfirm = async () => {
    setClosing(true);
    try {
      await onCloseAuction(auction.enquiryDocId, selectedBidId || null);
      setShowConfirm(false);
    } catch (_) {
      // error toast handled in parent
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
        <div className="absolute inset-0 indigo-500/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg h-full bg-white border-l indigo-500 flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="min-w-0">
              <p className="indigo-500/30 text-xs font-mono">{auction.enquiryId}</p>
              <h3 className="indigo-500 font-semibold text-base mt-0.5 truncate">
                {auction.carYear} {auction.carMake} {auction.carModel}
              </h3>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center indigo-500/40 hover:indigo-500/70 transition-all flex-shrink-0 ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

            {/* Photo */}
            {auction.thumb && (
              <div className="w-full h-44 rounded-xl overflow-hidden border border-white/[0.06] flex-shrink-0">
                <img src={auction.thumb} alt="Car" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Winner banner */}
            {auction.isClosed && auction.winner && (
              <div className="rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/25 p-4 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Auction Winner</p>
                  <p className="indigo-500 font-semibold text-sm mt-0.5">
                    {auction.winner.firstName} {auction.winner.lastName}
                  </p>
                  <p className="indigo-500/40 text-xs">{auction.winner.email} · {auction.winner.phone}</p>
                </div>
              </div>
            )}

            {/* Car Info grid */}
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4">
              <p className="indigo-500/40 text-xs font-bold mb-3 uppercase tracking-wider">Car Information</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ['Make', auction.carMake],
                  ['Model', auction.carModel],
                  ['Year', auction.carYear],
                  ['Color', auction.color],
                  ['Reg No.', auction.regNumber],
                  ['Fuel', `${fuelIcon[auction.fuelType] || ''} ${auction.fuelType}`],
                  ['Transmission', auction.transmission],
                  ['Ownership', auction.ownership],
                  ['KMs Driven', `${auction.kmsDriven.toLocaleString()} km`],
                  ['City', auction.city],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="indigo-500/25 text-[10px] uppercase tracking-wider">{k}</p>
                    <p className="indigo-500/80 text-xs font-medium capitalize mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing row */}
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
              <p className="indigo-500/40 text-xs font-bold mb-3 uppercase tracking-wider">Pricing</p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="indigo-500/25 text-[10px] uppercase tracking-wider">Expected</p>
                  <p className="indigo-500 font-bold text-base mt-0.5">₹{auction.expectedPrice.toLocaleString()}</p>
                </div>
                <div className="flex-1">
                  <p className="indigo-500/25 text-[10px] uppercase tracking-wider">Top Bid</p>
                  <p className={`font-bold text-base mt-0.5 ${auction.topBid > 0 ? 'text-rose-400' : 'indigo-500/20'}`}>
                    {auction.topBid > 0 ? `₹${auction.topBid.toLocaleString()}` : 'None'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="indigo-500/25 text-[10px] uppercase tracking-wider">Total Bids</p>
                  <p className="text-indigo-400 font-bold text-base mt-0.5">{auction.bidsCount}</p>
                </div>
              </div>
            </div>

            {/* Bidders List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="indigo-500/40 text-xs font-bold uppercase tracking-wider">
                  Bidders ({sortedBids.length})
                </p>
                {canClose && sortedBids.length > 0 && (
                  <p className="indigo-500/20 text-[10px]">Tap a bid to select as winner</p>
                )}
              </div>

              {sortedBids.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.08] py-8 flex flex-col items-center gap-2">
                  <DollarSign className="w-5 h-5 indigo-500/15" />
                  <p className="indigo-500/25 text-sm">No bids placed yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedBids.map((bid, idx) => {
                    const isTop = bid.amount === auction.topBid && idx === 0;
                    const isSelected = selectedBidId === bid._id;
                    const grad = avatarColors[idx % avatarColors.length];
                    const initials = `${bid.bider?.firstName?.[0] || '?'}${bid.bider?.lastName?.[0] || ''}`.toUpperCase();
                    const timeStr = bid.createdAt
                      ? new Date(bid.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—';

                    return (
                      <div key={bid._id}
                        onClick={() => canClose && setSelectedBidId(isSelected ? null : bid._id)}
                        className={`relative rounded-xl border p-3 transition-all duration-150 ${canClose ? 'cursor-pointer' : ''} ${isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/40'
                          : isTop
                            ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/35'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                          }`}>

                        {isTop && (
                          <span className="absolute -top-2 right-3 text-[9px] font-bold bg-rose-500 indigo-500 px-2 py-0.5 rounded-full">
                            HIGHEST
                          </span>
                        )}

                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center indigo-500 text-xs font-bold flex-shrink-0`}>
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="indigo-500/85 text-sm font-semibold truncate">
                              {bid.bider?.firstName} {bid.bider?.lastName}
                            </p>
                            <p className="indigo-500/30 text-xs truncate">{bid.bider?.email}</p>
                            <p className="indigo-500/20 text-[10px] mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> {bid.bider?.phone}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className={`font-bold text-sm ${isTop ? 'text-rose-400' : 'indigo-500/70'}`}>
                              ₹{bid.amount.toLocaleString()}
                            </p>
                            <p className="indigo-500/20 text-[10px] mt-0.5">{timeStr}</p>
                            {bid.note && (
                              <p className="indigo-500/25 text-[10px] truncate max-w-[90px]">{bid.note}</p>
                            )}
                          </div>

                          {canClose && (
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ml-1 transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seller */}
            <div>
              <p className="indigo-500/40 text-xs font-bold mb-3 uppercase tracking-wider">Seller Details</p>
              <div className="space-y-2">
                {[
                  [<User key="u" className="w-4 h-4 indigo-500/40" />, auction.customerName],
                  [<Mail key="m" className="w-4 h-4 indigo-500/40" />, auction.customerEmail],
                  [<Phone key="p" className="w-4 h-4 indigo-500/40" />, auction.customerPhone],
                ].map(([icon, val], i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    {icon}
                    <span className="indigo-500/60 text-sm">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
              <span className="ml-auto indigo-500/25 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {auction.startDate}
              </span>
            </div>

            {auction.description && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-2">Description</p>
                <p className="indigo-500/60 text-sm leading-relaxed">{auction.description}</p>
              </div>
            )}
          </div>

          {/* Footer — Close Auction CTA */}
          {canClose && (
            <div className="p-5 border-t border-white/[0.06] flex-shrink-0 bg-white">
              {selectedBidId ? (
                <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                  <span className="text-indigo-300 text-xs font-semibold">
                    Winner: {auction.bids.find(b => b._id === selectedBidId)?.bider?.firstName}
                    {' '}— ₹{auction.bids.find(b => b._id === selectedBidId)?.amount.toLocaleString()}
                  </span>
                  <button onClick={() => setSelectedBidId(null)} className="indigo-500/30 hover:indigo-500/60 transition-colors ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <p className="indigo-500/20 text-xs mb-3 text-center">
                  {sortedBids.length > 0
                    ? 'No bid selected — highest bid will win automatically'
                    : 'Auction will close with no winner'}
                </p>
              )}
              <button onClick={() => setShowConfirm(true)}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 indigo-500 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                <X className="w-4 h-4" />
                Close Auction
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <CloseAuctionModal
          auction={auction}
          selectedBidId={selectedBidId}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          loading={closing}
        />
      )}
    </>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function AuctionCars() {
  const { addToast } = useToast();

  const [auctions, setAuctions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [auctionType, setAuctionType] = useState('live_auction');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const currentPage = pagination.page;
  const timerRef = useRef(null);
  const countRef = useRef(null);

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const fetchAuctions = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/auction`, {
        headers: authHeader(),
        params: {
          page,
          limit: pagination.limit,
          auctionType,
          ...(filterStatus !== 'all' && { status: filterStatus }),
          ...(searchTerm && { search: searchTerm }),
        },
      });
      const rawList = res.data?.data ?? [];
      const rawPag = res.data?.pagination ?? null;
      const normalizedList = rawList.map(normalize);
      setAuctions(normalizedList);
      if (rawPag) setPagination(rawPag);
      setSelectedAuction(prev =>
        prev ? (normalizedList.find(a => a.id === prev.id) ?? prev) : null
      );
      setLastRefreshed(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err) {
      console.error('fetchAuctions error', err);
      if (!silent) addToast(err.response?.data?.message || 'Error loading auctions', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filterStatus, searchTerm, auctionType, pagination.limit]);

  useEffect(() => { fetchAuctions(1); }, [filterStatus, searchTerm, auctionType]);

  useEffect(() => {
    clearInterval(timerRef.current);
    clearInterval(countRef.current);
    timerRef.current = setInterval(() => fetchAuctions(currentPage, true), REFRESH_INTERVAL);
    countRef.current = setInterval(() => setCountdown(c => c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(countRef.current); };
  }, [fetchAuctions, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchAuctions(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Close Auction ──────────────────────────────────────────────────────── */
  const handleCloseAuction = async (enquiryDocId, winnerBidId = null) => {
    const payload = winnerBidId ? { winnerBidId } : {};
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${enquiryDocId}/close-auction`,
      payload,
      { headers: authHeader() }
    );
    addToast('Auction closed successfully!', 'success');
    setSelectedAuction(null);
    fetchAuctions(currentPage);
  };

  if (selectedEnquiryId) {
    return (
      <EnquiryDetailPage
        enquiryId={selectedEnquiryId}
        onBack={() => setSelectedEnquiryId(null)}
      />
    );
  }

  /* ── Stats ──────────────────────────────────────────────────────────────── */
  const totalAuctions = pagination.total;
  const liveCount = auctions.filter(a => a.isLive).length;
  const totalBids = auctions.reduce((s, a) => s + a.bidsCount, 0);
  const highestBid = auctions.reduce((s, a) => Math.max(s, a.topBid), 0);

  const filterTabs = ['all', 'open', 'live_auction', 'closed', 'sold'];

  /* ── Active type meta ───────────────────────────────────────────────────── */
  const activeType = auctionTypes.find(t => t.key === auctionType);

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold indigo-500">Auction Cars</h1>
          <p className="indigo-500/40 text-sm mt-1">Track and manage all live and upcoming vehicle auctions</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button onClick={() => fetchAuctions(currentPage)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border indigo-500 indigo-500/40 hover:indigo-500/70 hover:bg-white/[0.08] transition-all text-xs font-medium">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {lastRefreshed && (
            <span className="indigo-500/20 text-[10px]">
              Next in <span className="indigo-500/35 font-semibold tabular-nums">{countdown}s</span>
              {' '}· Last {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Auction Type Selector ─────────────────────────────────────────── */}
      <div>
        <p className="indigo-500/25 text-[10px] font-bold uppercase tracking-widest mb-3">Auction Type</p>
        <div className="grid grid-cols-3 gap-3">
          {auctionTypes.map(({ key, label, desc, icon, badge, dot, activeCard, badgeCls, bar }) => {
            const isActive = auctionType === key;
            return (
              <button
                key={key}
                onClick={() => { setAuctionType(key); setFilterStatus('all'); }}
                className={`relative text-left rounded-2xl border p-4 transition-all duration-200 focus:outline-none ${isActive
                  ? `${activeCard} shadow-lg`
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                  }`}
              >
                {/* Badge */}
                <span className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
                  {dot && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                  {badge}
                </span>

                {/* Icon */}
                <span className="text-2xl mb-2 block">{icon}</span>

                {/* Text */}
                <p className={`text-sm font-semibold transition-colors ${isActive ? 'indigo-500' : 'indigo-500/60'}`}>
                  {label}
                </p>
                <p className="indigo-500/30 text-xs mt-0.5 leading-snug">{desc}</p>

                {/* Active indicator bar */}
                <div className={`h-0.5 rounded-full mt-3 transition-all duration-300 ${isActive ? bar : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Auctions" value={totalAuctions} icon={<Car className="w-4 h-4" />} accent="bg-indigo-500" sub="All Time" />
        <StatCard label="Live Auctions" value={liveCount} icon={<MessageSquare className="w-4 h-4" />} accent="bg-rose-500" sub="Active Now" />
        <StatCard label="Total Bids" value={totalBids} icon={<DollarSign className="w-4 h-4" />} accent="bg-emerald-500" sub="This Page" />
        <StatCard label="Highest Bid"
          value={highestBid > 0 ? `₹${(highestBid / 100000).toFixed(1)}L` : '—'}
          icon={<Trophy className="w-4 h-4" />} accent="bg-violet-500" sub="This Page" />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
          <input
            type="text"
            placeholder={`Search in ${activeType?.label ?? 'auctions'}…`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/30 focus:border-indigo-400/50 focus:outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] overflow-x-auto">
          {filterTabs.map(tab => (
            <button key={tab} onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${filterStatus === tab ? 'bg-indigo-500 indigo-500 shadow-lg shadow-indigo-500/30' : 'indigo-500/35 hover:indigo-500/60'
                }`}>
              {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 px-6 py-4 items-center animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                  <div className="h-2.5 bg-white/[0.06] rounded w-1/4" />
                </div>
                <div className="h-4 bg-white/10 rounded w-20" />
                <div className="h-4 bg-white/10 rounded w-20" />
                <div className="h-5 bg-white/10 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <Car className="w-5 h-5 indigo-500/20" />
            </div>
            <p className="indigo-500/30 text-sm font-medium">No {activeType?.label} auctions found</p>
            <p className="indigo-500/15 text-xs mt-1">Try adjusting your filters or switching auction type</p>
          </div>
        ) : (
          <>
            {/* Type indicator strip */}
            <div className={`px-5 py-2 border-b border-white/[0.04] flex items-center gap-2 ${auctionType === 'live_auction' ? 'bg-rose-500/5' :
              auctionType === 'bnb' ? 'bg-indigo-500/5' :
                'bg-emerald-500/5'
              }`}>
              <span className="text-lg">{activeType?.icon}</span>
              <span className={`text-xs font-bold ${auctionType === 'live_auction' ? 'text-rose-400' :
                auctionType === 'bnb' ? 'text-indigo-400' :
                  'text-emerald-400'
                }`}>
                {activeType?.label}
              </span>
              <span className="indigo-500/20 text-xs">·</span>
              <span className="indigo-500/25 text-xs">{pagination.total} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap min-w-[960px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['Vehicle', 'Seller', 'Remaining Time', 'Expected Price', 'Top Bid / Bids', 'Fuel · Trans', 'KMs · Year', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold indigo-500/25 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {auctions.map(a => {
                    const sc = statusConfig[a.status] || statusConfig.new;
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.025] transition-colors duration-150">

                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {a.thumb ? (
                              <img src={a.thumb} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.08] flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                                <Car className="w-4 h-4 indigo-500/25" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="indigo-500 text-sm font-semibold truncate max-w-[130px]" title={`${a.carMake} ${a.carModel}`}>
                                {a.carMake} {a.carModel}
                              </p>
                              <p className="indigo-500/30 text-xs">{a.color}</p>
                            </div>
                          </div>
                        </td>

                        {/* Seller */}
                        <td className="px-4 py-3">
                          <p className="indigo-500/80 text-sm font-medium">{a.customerName}</p>
                          <p className="indigo-500/30 text-xs">{a.customerPhone}</p>
                        </td>

                        {/* Remaining Time */}
                        <td className="px-4 py-3">
                          {a.isClosed ? (
                            <span className="indigo-500/20 text-xs">Ended</span>
                          ) : a.remainingTime ? (
                            <p className="text-amber-400 font-semibold text-sm tabular-nums">
                              {String(a.remainingTime.hours).padStart(2, '0')}h{' '}
                              {String(a.remainingTime.minutes).padStart(2, '0')}m{' '}
                              {String(a.remainingTime.seconds).padStart(2, '0')}s
                            </p>
                          ) : (
                            <span className="indigo-500/20 text-xs">—</span>
                          )}
                        </td>

                        {/* Expected Price */}
                        <td className="px-4 py-3">
                          <p className="indigo-500 font-semibold text-sm">₹{a.expectedPrice.toLocaleString()}</p>
                        </td>

                        {/* Top Bid / Bids */}
                        <td className="px-4 py-3">
                          {a.topBid > 0 ? (
                            <p className="text-rose-400 font-bold text-sm">₹{a.topBid.toLocaleString()}</p>
                          ) : (
                            <p className="indigo-500/20 text-xs">No bids</p>
                          )}
                          <p className="text-indigo-400 text-xs font-semibold mt-0.5">{a.bidsCount} bid{a.bidsCount !== 1 ? 's' : ''}</p>
                        </td>

                        {/* Fuel · Trans */}
                        <td className="px-4 py-3">
                          <p className="indigo-500/60 text-xs capitalize">{fuelIcon[a.fuelType] || ''} {a.fuelType}</p>
                          <p className="indigo-500/35 text-xs capitalize mt-0.5">{a.transmission}</p>
                        </td>

                        {/* KMs · Year */}
                        <td className="px-4 py-3">
                          <p className="indigo-500/60 text-xs">{a.kmsDriven.toLocaleString()} km</p>
                          <p className="indigo-500/35 text-xs mt-0.5">{a.carYear}</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 indigo-500/40 text-xs">{a.startDate}</td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedAuction(a)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all text-xs font-semibold">
                            Details
                          </button>
                          <button
                            onClick={() => setSelectedEnquiryId(a.enquiryDocId)}
                            className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-all text-xs font-semibold ml-1">
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        )}
      </div>

      <DetailDrawer
        auction={selectedAuction}
        onClose={() => setSelectedAuction(null)}
        onCloseAuction={handleCloseAuction}
      />
    </div>
  );
}