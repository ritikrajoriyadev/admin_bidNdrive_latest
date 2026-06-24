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

/* ─── Normalize ──────────────────────────────────────────────────────────── */
// Normalize for Auction
const normalizeAuction = (auction) => {
  
  const enq = auction.enquiry || {};
  const car = enq.carDetails || {};
  const sell = enq.sellingDetails || {};
  const user = enq.userId || {}; // null for admin-created enquiries — see fallback below
  const thumb = enq.attachments?.[0]?.url || null;
  const bidsCount = auction.totalBids || 0;
  const topBid = auction.highestBid || 0;

  // FIX: customer details aren't always nested under enquiry.userId.
  // For admin-created enquiries (createdByAdmin: true), userId is null and the
  // customer info instead lives directly on the enquiry object
  // (customerName, customerEmail, contactNumber). Fall back to those.
  const customerName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    enq.customerName ||
    'N/A';
  const customerEmail = user.email || enq.customerEmail || 'N/A';
  const customerPhone = user.phone || enq.contactNumber || 'N/A';

  return {
    id: auction._id,
    enquiryDocId: enq._id || auction.auctionId,
    enquiryId: enq.enquiryId || '—',
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
    // FIX: kilometersDriven isn't always present on sellingDetails — fall back to car.mileage
    kmsDriven: sell.kilometersDriven ?? car.mileage ?? 0,
    city: sell.city || '—',
    startingPrice: auction.startingPrice || 0,
    reservePrice: auction.reservePrice || null,
    bidsCount,
    topBid,
    bids: [],
    isLive: auction.isLive,
    status: auction.isLive ? 'live_auction' : (auction.status || 'pending'),
    isClosed: auction.status === 'closed',
    winner: auction.winner || null,
    winningAmount: auction.winningAmount || 0,
    startDate: auction.startDate
      ? new Date(auction.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    customerName,
    customerEmail,
    customerPhone,
    description: enq.description || '',
    priority: enq.priority || 'medium',
    remainingTime: auction.remainingTime || null,
    remainingTimestamp: auction.remainingTimestamp || 0,
    type: 'auction',
  };
};

// Normalize for BNB (OCB)
const normalizeBNB = (ocb) => {
  const car = ocb.carDetails || {};
  const user = ocb.userId || {};

  return {
    id: ocb._id,
    enquiryDocId: ocb.enquiryId,
    enquiryId: ocb.enquiryId || '—',
    auctionId: ocb.auctionId || null,

    carMake: car.make || 'N/A',
    carModel: car.model || 'N/A',
    carYear: car.year || '—',
    regNumber: car.registrationNumber || '—',
    color: car.color || '—',
    mileage: car.mileage || 0,
    kmsDriven: ocb.kilometersDriven ?? car.mileage ?? 0,

    thumb: ocb.attachments?.[0]?.url || null,

    expectedPrice: ocb.startingPrice || 0,
    startingPrice: ocb.minimumOfferPrice || 0,

    fuelType: car.fuelType || '—',
    transmission: car.transmission || '—',

    bidsCount: ocb.interests?.length || 0,

    topBid:
      ocb.interests?.length > 0
        ? Math.max(...ocb.interests.map(i => i.interestAmount || 0))
        : 0,

    bids:
      ocb.interests?.map(i => ({
        _id: i._id,
        amount: i.interestAmount,
        createdAt: i.createdAt,
        bider: {
          firstName: i.biderId?.firstName,
          lastName: i.biderId?.lastName,
          email: i.biderId?.email,
          phone: i.biderId?.phone,
        },
      })) || [],

    isLive: false,
    status: ocb.status || 'closed',
    isClosed: true,

    winner: ocb.selectedBiderId || null,
    winningAmount: ocb.finalPrice || 0,

    startDate: ocb.createdAt
      ? new Date(ocb.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      : '—',

    customerName:
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      ocb.customerName ||
      'N/A',

    customerEmail: user.email || ocb.customerEmail || 'N/A',
    customerPhone: user.phone || ocb.contactNumber || 'N/A',

    description: ocb.description || '',

    remainingTime: null,
    remainingTimestamp: 0,

    type: 'bnb',
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
/* ─── Convert to BNB Modal ───────────────────────────────────────────────── */
const ConvertBNBModal = ({ auction, onClose, onConfirm, loading }) => {
  const [minimumOfferPrice, setMinimumOfferPrice] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [expiryHours, setExpiryHours] = useState('');
  const [notes, setNotes] = useState('');

  if (!auction) return null;

  const handleSubmit = () => {
    if (
      !minimumOfferPrice ||
      !expiryHours
    ) {
      return;
    }

    onConfirm({
      minimumOfferPrice,
      expiryHours,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center indigo-500/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4 mx-auto">
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="indigo-500 font-bold text-lg text-center mb-1">Convert to BNB</h3>
        <p className="indigo-500/40 text-sm text-center mb-5">
          Set offer details for <span className="indigo-500/60 font-medium">{auction.carMake} {auction.carModel}</span>
        </p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="indigo-500/35 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
              Minimum Offer Price (₹) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              value={minimumOfferPrice}
              onChange={e => setMinimumOfferPrice(e.target.value)}
              placeholder="e.g. 820000"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] indigo-500 text-sm indigo-500 focus:border-emerald-400/50 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="indigo-500/35 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
              Expiry Hours
              <span className="text-rose-400">*</span>
            </label>

            <select
              value={expiryHours}
              onChange={(e) =>
                setExpiryHours(e.target.value)
              }
              className="
    w-full
    px-3
    py-2.5
    rounded-xl
    bg-white/[0.05]
    border
    border-white/[0.1]
    indigo-500
    text-sm
    focus:border-emerald-400/50
    focus:outline-none
    transition-all
    appearance-none
    cursor-pointer
  "
            >
              <option
                value=""
                className=" text-gray-400"
              >
                Select Hours
              </option>

              <option
                value="1"
                className=" text-gray-400"
              >
                1 Hour
              </option>

              <option
                value="2"
                className=" text-gray-400"
              >
                2 Hours
              </option>

              <option
                value="3"
                className=" text-gray-400"
              >
                3 Hours
              </option>

              <option
                value="6"
                className=" indigo-500"
              >
                6 Hours
              </option>

              <option
                value="12"
                className=" text-gray-400"
              >
                12 Hours
              </option>

              <option
                value="24"
                className=" text-gray-400"
              >
                24 Hours
              </option>

              <option
                value="48"
                className="text-gray-400"
              >
                48 Hours
              </option>

              <option
                value="72"
                className="text-gray-400"
              >
                72 Hours
              </option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] indigo-500/60 text-sm font-semibold hover:bg-white/[0.08] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !minimumOfferPrice || !expiryHours}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 indigo-500 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Converting…</>
            ) : (
              <><DollarSign className="w-4 h-4" />Convert to BNB</>
            )}
          </button>
        </div>
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

            {/* ── Bidders List ─────────────────────────────────────────── */}
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
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ml-1 transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'
                              }`}>
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
  const [bnbTarget, setBnbTarget] = useState(null);
  const [bnbLoading, setBnbLoading] = useState(false);
  const [auctions, setAuctions] = useState([]);
  const [bnbList, setBnbList] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [bnbPagination, setBnbPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  // FIX: split the search box into a "draft" value (what the user is typing)
  // and an "applied" value (what's actually sent to the API). Previously
  // there was only one `searchTerm` wired straight to onChange, which fired
  // a network request on every keystroke and had no explicit Search button.
  const [searchInput, setSearchInput] = useState('');   // live text in the box
  const [searchTerm, setSearchTerm] = useState('');     // term actually applied/sent to API

  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [selectedBnb, setSelectedBnb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bnbLoadingList, setBnbLoadingList] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [tab, setTab] = useState('auction'); // 'auction' or 'bnb'

  const currentPage = tab === 'auction' ? pagination.page : bnbPagination.page;
  const timerRef = useRef(null);
  const countRef = useRef(null);

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  // Fetch closed auctions
  const fetchAuctions = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/closed/auctions`, {
        headers: authHeader(),
        params: {
          page,
          limit: pagination.limit,
          ...(filterStatus !== 'all' && { status: filterStatus }),
          ...(searchTerm && { search: searchTerm }),
        },
      });
      const rawList = res.data?.data ?? [];
      const rawPag = res.data?.pagination ?? null;
      const normalizedList = rawList.map(normalizeAuction);
      setAuctions(normalizedList);
      if (rawPag) {
        setPagination(rawPag);
      } else {
        // FIX: some search responses may not include a pagination object
        // (e.g. when the backend just returns the matching rows). Make sure
        // the page number still reflects what we requested so the table/page
        // indicator doesn't go stale.
        setPagination(prev => ({ ...prev, page, total: normalizedList.length, pages: 1 }));
      }
      setSelectedAuction(prev => prev ? (normalizedList.find(a => a.id === prev.id) ?? prev) : null);
      setLastRefreshed(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err) {
      console.error('fetchAuctions error', err);
      if (!silent) addToast(err.response?.data?.message || 'Error loading auctions', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filterStatus, searchTerm, pagination.limit]);

  // Fetch closed BNBs (OCB)
  const fetchBNBs = useCallback(async (page = 1, silent = false) => {
    if (!silent) setBnbLoadingList(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ocb/closed`, {
        headers: authHeader(),
        params: {
          page,
          limit: bnbPagination.limit,
          ...(searchTerm && { search: searchTerm }),
        },
      });
      const rawList = res.data?.data ?? [];
      const rawPag = res.data?.pagination ?? null;
      const normalizedList = rawList.map(normalizeBNB);
      setBnbList(normalizedList);
      if (rawPag) {
        setBnbPagination(rawPag);
      } else {
        setBnbPagination(prev => ({ ...prev, page, total: normalizedList.length, pages: 1 }));
      }
      setSelectedBnb(prev => prev ? (normalizedList.find(a => a.id === prev.id) ?? prev) : null);
      setLastRefreshed(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err) {
      console.error('fetchBNBs error', err);
      if (!silent) addToast(err.response?.data?.message || 'Error loading BNBs', 'error');
    } finally {
      if (!silent) setBnbLoadingList(false);
    }
  }, [searchTerm, bnbPagination.limit]);

  // Tab switch / filter / applied-search effect
  // (this now only re-fires when `searchTerm` — the APPLIED value — changes,
  // i.e. when the Search button or Enter is used, not on every keystroke)
  useEffect(() => {
    if (tab === 'auction') {
      fetchAuctions(1);
    } else {
      fetchBNBs(1);
    }
  }, [tab, filterStatus, searchTerm]);

  // Auto refresh
  useEffect(() => {
    clearInterval(timerRef.current);
    clearInterval(countRef.current);
    if (tab === 'auction') {
      timerRef.current = setInterval(() => fetchAuctions(currentPage, true), REFRESH_INTERVAL);
    } else {
      timerRef.current = setInterval(() => fetchBNBs(currentPage, true), REFRESH_INTERVAL);
    }
    countRef.current = setInterval(() => setCountdown(c => c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(countRef.current); };
  }, [fetchAuctions, fetchBNBs, currentPage, tab]);

  // Pagination change
  const handlePageChange = (newPage) => {
    if (tab === 'auction') {
      if (newPage < 1 || newPage > pagination.pages) return;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchAuctions(newPage);
    } else {
      if (newPage < 1 || newPage > bnbPagination.pages) return;
      setBnbPagination(prev => ({ ...prev, page: newPage }));
      fetchBNBs(newPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // FIX: explicit search handlers wired to the new Search button / Enter key
  const handleSearch = () => {
    const trimmed = searchInput.trim();
    if (trimmed === searchTerm) {
      // Same term as last applied search — searchTerm won't change so the
      // useEffect won't re-fire on its own. Force a manual refetch instead.
      if (tab === 'auction') fetchAuctions(1);
      else fetchBNBs(1);
      return;
    }
    setSearchTerm(trimmed);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  // Close Auction
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

  // Start Auction
  const handleStartAuction = async (enquiryDocId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${enquiryDocId}/start-auction`,
        {},
        {
          headers: authHeader(),
        }
      );
      addToast('Auction started successfully!', 'success');
      fetchAuctions(currentPage);
      if (selectedAuction?.enquiryDocId === enquiryDocId) {
        setSelectedAuction(prev => ({
          ...prev,
          isLive: true,
          status: 'live_auction',
        }));
      }
    } catch (err) {
      console.error('Start auction error:', err);
      addToast(err?.response?.data?.message || 'Failed to start auction', 'error');
    }
  };

  // Start BNB
  const handleStartBNB = async ({ minimumOfferPrice, expiryHours, notes }) => {
    console.log('BNB convert request payload:', {
        auctionId: bnbTarget.auctionId || bnbTarget.id,
        minimumOfferPrice: String(minimumOfferPrice),
        expiryHours: String(expiryHours),
        notes: notes || '',
      });
    if (!bnbTarget) return;
    setBnbLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ocb/convert-auction`,
        {
          auctionId: bnbTarget.auctionId || bnbTarget.id,
          minimumOfferPrice: String(minimumOfferPrice),
          expiryHours: String(expiryHours),
          notes: notes || '',
        },
        { headers: authHeader() }
      );
      
      addToast('Converted to BNB successfully!', 'success');
      setBnbTarget(null);
      fetchAuctions(currentPage);
      if (selectedAuction?.id === bnbTarget.id) {
        setSelectedAuction(prev => ({ ...prev, status: 'sold', isLive: false }));
      }
    } catch (err) {
      console.error('BNB convert error:', err);
      addToast(err?.response?.data?.message || 'Failed to convert to BNB', 'error');
    } finally {
      setBnbLoading(false);
    }
  };

  // BNB/TNB placeholder (future TNB logic)
  const handleStartTNB = (enquiryDocId) => {
    addToast('TNB conversion not implemented yet', 'info');
  };

  if (selectedEnquiryId) {
    return (
      <EnquiryDetailPage
        enquiryId={selectedEnquiryId}
        onBack={() => setSelectedEnquiryId(null)}
      />
    );
  }

  // Stats for current tab
  const list = tab === 'auction' ? auctions : bnbList;
  const pag = tab === 'auction' ? pagination : bnbPagination;
  const isLoading = tab === 'auction' ? loading : bnbLoadingList;
  const totalAuctions = pag.total;
  const liveCount = list.filter(a => a.isLive).length;
  const totalBids = list.reduce((s, a) => s + a.bidsCount, 0);
  const highestBid = list.reduce((s, a) => Math.max(s, a.topBid), 0);

  // Tabs for filter
  const filterTabs = ['all', 'open', 'live_auction', 'closed', 'sold'];

  // Table headers
  const tableHeaders = [
    'Enquiry ID',
    'Vehicle',
    'Seller',
    // tab === 'auction' ? 'Remaining Time' : '—',
    
    tab === 'auction' ? 'Top Bid / Bids' : 'Final Price',
    'Fuel',
    'Year',
    
    'Date',
    'Action',
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold indigo-500">Closed Auctions & BNB Cars</h1>
          <p className="indigo-500/40 text-sm mt-1">Track and manage all closed auctions and BNB (OCB) conversions</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button onClick={() => tab === 'auction' ? fetchAuctions(currentPage) : fetchBNBs(currentPage)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border indigo-500 indigo-500/40 hover:indigo-500/70 hover:bg-white/[0.08] transition-all text-xs font-medium">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
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

      {/* Tabs: Auction / BNB */}
      <div className="flex gap-2 mb-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'auction' ? 'bg-indigo-500 text-white shadow' : 'bg-white/[0.05] indigo-500/60 hover:bg-white/[0.09]'}`}
          onClick={() => setTab('auction')}
        >
          Auctions
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'bnb' ? 'bg-emerald-500 text-white shadow' : 'bg-white/[0.05] indigo-500/60 hover:bg-white/[0.09]'}`}
          onClick={() => setTab('bnb')}
        >
          BNB (OCB)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total" value={totalAuctions} icon={<Car className="w-4 h-4" />} accent="bg-indigo-500" sub="All Time" />
        <StatCard label={tab === 'auction' ? 'Live Auctions' : '—'} value={tab === 'auction' ? liveCount : '—'} icon={<MessageSquare className="w-4 h-4" />} accent="bg-rose-500" sub={tab === 'auction' ? 'Active Now' : ''} />
        <StatCard label={tab === 'auction' ? 'Total Bids' : '—'} value={tab === 'auction' ? totalBids : '—'} icon={<DollarSign className="w-4 h-4" />} accent="bg-emerald-500" sub={tab === 'auction' ? 'This Page' : ''} />
        <StatCard label={tab === 'auction' ? 'Highest Bid' : 'Highest Price'}
          value={highestBid > 0 ? `₹${(highestBid / 100000).toFixed(1)}L` : '—'}
          icon={<Trophy className="w-4 h-4" />} accent="bg-violet-500" sub="This Page" />
      </div>

      {/* Filters + Search (only for auction) */}
      {tab === 'auction' && (
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* FIX: search box now has an explicit Search button + Enter-to-search,
              instead of firing the API on every single keystroke. */}
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
              <input
                type="text"
                placeholder="Search car, seller…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-100 border border-white/[0.06] indigo-500 placeholder-white/30 focus:border-indigo-400/50 focus:outline-none transition-all text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 indigo-500/30 hover:indigo-500/70 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] overflow-x-auto">
            {filterTabs.map(tabName => (
              <button key={tabName} onClick={() => setFilterStatus(tabName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${filterStatus === tabName ? 'bg-indigo-500 indigo-500 shadow-lg shadow-indigo-500/30' : 'indigo-500/35 hover:indigo-500/60'}`}
              >
                {tabName === 'all' ? 'All' : tabName.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        {isLoading ? (
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
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <Car className="w-5 h-5 indigo-500/20" />
            </div>
            <p className="indigo-500/30 text-sm font-medium">No {tab === 'auction' ? 'auctions' : 'BNB'} found</p>
            <p className="indigo-500/15 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap min-w-[960px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {tableHeaders.map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold indigo-500/25 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
               
                  {list.map(a => {
                    const sc = statusConfig[a.status] || statusConfig.new;
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.025] transition-colors duration-150">
                          <td className="px-4 py-3">
                          <p className="indigo-500/80 text-sm font-medium">{a.enquiryId}</p>
                         
                        </td>
                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {/* {a.thumb ? (
                              <img src={a.thumb} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.08] flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                                <Car className="w-4 h-4 indigo-500/25" />
                              </div>
                            )} */}
                            <div className="min-w-0">
                              <p className="indigo-500 text-sm font-semibold truncate max-w-[130px]" title={`${a.carMake} ${a.carModel}`}>
                             {a.carModel}
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
                       
                     
                       
                        {/* Top Bid / Bids (auction) or Final Price (bnb) */}
                        <td className="px-4 py-3">
                          {tab === 'auction' ? (
                            a.topBid > 0 ? (
                              <p className="text-rose-400 font-bold text-sm">₹{a.topBid.toLocaleString()}</p>
                            ) : (
                              <p className="indigo-500/20 text-xs">No bids</p>
                            )
                          ) : (
                            <p className="text-emerald-400 font-bold text-sm">₹{a.winningAmount?.toLocaleString?.() || '—'}</p>
                          )}
                          <p className="text-indigo-400 text-xs font-semibold mt-0.5">
                            {tab === 'auction' ? `${a.bidsCount} bid${a.bidsCount !== 1 ? 's' : ''}` : a.winner ? 'Sold' : '—'}
                          </p>
                        </td>
                        {/* Fuel · Trans */}
                        <td className="px-4 py-3">
                          <p className="indigo-500/60 text-xs capitalize">{fuelIcon[a.fuelType] || ''} {a.fuelType}</p>
                          {/* <p className="indigo-500/35 text-xs capitalize mt-0.5">{a.transmission}</p> */}
                        </td>
                        {/* KMs · Year */}
                        <td className="px-4 py-3">
                          
                          <p className="indigo-500/35 text-xs mt-0.5">{a.carYear}</p>
                        </td>
                       
                        
                        {/* Date */}
                        <td className="px-4 py-3 indigo-500/40 text-xs">{a.startDate}</td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Details */}
                            <button
                              onClick={() => tab === 'auction' ? setSelectedAuction(a) : setSelectedBnb(a)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all text-xs font-semibold"
                            >
                              Details
                            </button>
                            {/* View Enquiry */}
                            <button
                              onClick={() => setSelectedEnquiryId(a.enquiryDocId)}
                              className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-all text-xs font-semibold"
                            >
                              View
                            </button>
                            {/* Start actions */}
                            {tab === 'auction' && <>
                              <button
                                onClick={() => handleStartAuction(a.enquiryDocId)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold"
                              >
                                Start Auction
                              </button>
                            
                              <button
                                onClick={() => setBnbTarget(a)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold"
                              >
                                Start BNB
                              </button>
                              <button
                                onClick={() => handleStartTNB(a.enquiryDocId)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold"
                              >
                                Start TNB
                              </button>
                            </>}
                            {tab === 'bnb' && (
                              <>
                                {a.enquiryDocId && (
                                  <button
                                    onClick={() => handleStartAuction(a.enquiryDocId)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold"
                                  >
                                    Start Auction
                                  </button>
                                )}
                                {a.auctionId && (
                                  <button
                                    onClick={() => setBnbTarget(a)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold"
                                  >
                                    Start BNB
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pag} onPageChange={handlePageChange} />
          </>
        )}
      </div>

      {/* BNB Modal (auction only) */}
      {bnbTarget && (
        <ConvertBNBModal
          auction={bnbTarget}
          onClose={() => setBnbTarget(null)}
          onConfirm={handleStartBNB}
          loading={bnbLoading}
        />
      )}
      {/* Auction Detail Drawer */}
      {tab === 'auction' && (
        <DetailDrawer
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onCloseAuction={handleCloseAuction}
        />
      )}
      {/* BNB Detail Drawer (simple) */}
      {tab === 'bnb' && selectedBnb && (
        <div className="fixed inset-0 z-[200] flex justify-end" onClick={() => setSelectedBnb(null)}>
          <div className="absolute inset-0 indigo-500/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg h-full bg-white border-l indigo-500 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="min-w-0">
                <p className="indigo-500/30 text-xs font-mono">{selectedBnb.enquiryId}</p>
                <h3 className="indigo-500 font-semibold text-base mt-0.5 truncate">
                  {selectedBnb.carYear} {selectedBnb.carMake} {selectedBnb.carModel}
                </h3>
              </div>
              <button onClick={() => setSelectedBnb(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center indigo-500/40 hover:indigo-500/70 transition-all flex-shrink-0 ml-3">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              {selectedBnb.thumb && (
                <div className="w-full h-44 rounded-xl overflow-hidden border border-white/[0.06] flex-shrink-0">
                  <img src={selectedBnb.thumb} alt="Car" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Winner banner */}
              {selectedBnb.winner && (
                <div className="rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/25 p-4 flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">BNB Buyer</p>
                    <p className="indigo-500 font-semibold text-sm mt-0.5">
                      {selectedBnb.winner.firstName} {selectedBnb.winner.lastName}
                    </p>
                    <p className="indigo-500/40 text-xs">{selectedBnb.winner.email} · {selectedBnb.winner.phone}</p>
                  </div>
                </div>
              )}
              {/* Car Info grid */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4">
                <p className="indigo-500/40 text-xs font-bold mb-3 uppercase tracking-wider">Car Information</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ['Make', selectedBnb.carMake],
                    ['Model', selectedBnb.carModel],
                    ['Year', selectedBnb.carYear],
                    ['Color', selectedBnb.color],
                    ['Reg No.', selectedBnb.regNumber],
                    ['Fuel', `${fuelIcon[selectedBnb.fuelType] || ''} ${selectedBnb.fuelType}`],
                    ['Transmission', selectedBnb.transmission],
                    ['Ownership', selectedBnb.ownership],
                    ['KMs Driven', selectedBnb.kmsDriven != null ? `${selectedBnb.kmsDriven.toLocaleString()} km` : '—'],
                    ['City', selectedBnb.city],
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
                    <p className="indigo-500 font-bold text-base mt-0.5">₹{selectedBnb.expectedPrice.toLocaleString()}</p>
                  </div>
                  <div className="flex-1">
                    <p className="indigo-500/25 text-[10px] uppercase tracking-wider">Final Price</p>
                    <p className="text-emerald-400 font-bold text-base mt-0.5">₹{selectedBnb.winningAmount?.toLocaleString?.() || '—'}</p>
                  </div>
                </div>
              </div>
              {/* Seller */}
              <div>
                <p className="indigo-500/40 text-xs font-bold mb-3 uppercase tracking-wider">Seller Details</p>
                <div className="space-y-2">
                  {[
                    [<User key="u" className="w-4 h-4 indigo-500/40" />, selectedBnb.customerName],
                    [<Mail key="m" className="w-4 h-4 indigo-500/40" />, selectedBnb.customerEmail],
                    [<Phone key="p" className="w-4 h-4 indigo-500/40" />, selectedBnb.customerPhone],
                  ].map(([icon, val], i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      {icon}
                      <span className="indigo-500/60 text-sm">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Interests */}
              {selectedBnb.bids && selectedBnb.bids.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="indigo-500/40 text-xs font-bold mb-3 uppercase tracking-wider">
                    Interests ({selectedBnb.bids.length})
                  </p>
                  <div className="space-y-2">
                    {[...selectedBnb.bids]
                      .sort((a, b) => b.amount - a.amount)
                      .map((bid, idx) => {
                        const isTop = idx === 0;
                        const grad = avatarColors[idx % avatarColors.length];
                        const initials = `${bid.bider?.firstName?.[0] || '?'}${bid.bider?.lastName?.[0] || ''}`.toUpperCase();
                        const timeStr = bid.createdAt
                          ? new Date(bid.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                          : '—';
                        return (
                          <div
                            key={bid._id}
                            className={`relative rounded-xl border p-3 transition-all duration-150 ${isTop
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-white/[0.03] border-white/[0.06]'
                              }`}
                          >
                            {isTop && (
                              <span className="absolute -top-2 right-3 text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                                HIGHEST
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                              >
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
                                <p className={`font-bold text-sm ${isTop ? 'text-emerald-400' : 'indigo-500/70'}`}>
                                  ₹{bid.amount.toLocaleString()}
                                </p>
                                <p className="indigo-500/20 text-[10px] mt-0.5">{timeStr}</p>
                                <span
                                  className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bid.status === 'accepted'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : bid.status === 'rejected'
                                      ? 'bg-rose-500/15 text-rose-400'
                                      : 'bg-amber-500/15 text-amber-400'
                                    }`}
                                >
                                  {bid.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selectedBnb.previousInterests && selectedBnb.previousInterests.length > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="indigo-500/40 text-xs font-bold uppercase tracking-wider">
                      Previous Interests ({selectedBnb.previousInterests.length})
                    </p>
                    <span className="text-[10px] text-indigo-500/50">Historical BNB interest records</span>
                  </div>
                  <div className="space-y-2">
                    {[...selectedBnb.previousInterests]
                      .sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime())
                      .map((interest, idx) => {
                        const prevBidder = interest.biderId && typeof interest.biderId === 'object' ? interest.biderId : {};
                        const prevName = interest.bidderName || `${prevBidder.firstName || '?'} ${prevBidder.lastName || ''}`.trim() || 'Unknown bidder';
                        const prevEmail = interest.bidderEmail || prevBidder.email || '—';
                        const prevPhone = interest.bidderPhone || prevBidder.phone || null;
                        const movedAt = interest.movedAt
                          ? new Date(interest.movedAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                          : '—';
                        const status = interest.status || 'pending';
                        const statusBadge = {
                          accepted: 'bg-emerald-100 text-emerald-700',
                          rejected: 'bg-rose-100 text-rose-700',
                          pending: 'bg-amber-100 text-amber-700',
                          countered: 'bg-violet-100 text-violet-700',
                        }[status] || 'bg-slate-100 text-slate-700';
                        const grad = avatarColors[(idx + 1) % avatarColors.length];

                        return (
                          <div key={interest._id || `${movedAt}-${idx}`} className="rounded-xl border border-white/[0.06] bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                >
                                  {prevName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="indigo-500/85 text-sm font-semibold truncate">{prevName}</p>
                                  <p className="indigo-500/30 text-xs truncate">{prevEmail}</p>
                                  {prevPhone && (
                                    <p className="indigo-500/20 text-[10px] mt-0.5 flex items-center gap-1">
                                      <Phone className="w-2.5 h-2.5" /> {prevPhone}
                                    </p>
                                  )}
                                  <p className="indigo-500/20 text-[10px] mt-1">Moved at {movedAt}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-1">
                                <p className="font-bold text-sm text-indigo-500">₹{(interest.interestAmount || 0).toLocaleString()}</p>
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${statusBadge}`}>
                                  {status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Status row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.closed.bg} ${statusConfig.closed.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.closed.dot}`} />
                  Closed
                </span>
                <span className="ml-auto indigo-500/25 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {selectedBnb.startDate}
                </span>
              </div>
              {selectedBnb.description && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-2">Description</p>
                  <p className="indigo-500/60 text-sm leading-relaxed">{selectedBnb.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}