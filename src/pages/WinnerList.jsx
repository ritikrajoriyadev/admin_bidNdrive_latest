// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useToast } from '../hooks/useToast';
// import { decryptResponse } from '../utls/decryptResponse';
// import {
//   Search, Trophy, User, Phone, Mail, Hash, Car,
//   RefreshCw, DollarSign, Calendar, ChevronDown, ChevronUp
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import EnquiryDetailPage from './Enquirydetailpage';

// /* ─── API ─────────────────────────────────────────────────────────────────── */
// const API_URL = import.meta.env.VITE_API_URL || '';
// const api = axios.create({ baseURL: API_URL });
// const getAuthHeaders = () => ({
//   Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
// });

// const avatarColors = [
//   'from-indigo-500 to-violet-600',
//   'from-pink-500 to-rose-600',
//   'from-amber-500 to-orange-600',
//   'from-emerald-500 to-teal-600',
//   'from-sky-500 to-blue-600',
//   'from-violet-500 to-purple-600',
// ];

// /* ─── Safe name helper ────────────────────────────────────────────────────── */
// const safeName = (obj) =>
//   obj ? `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || 'Unknown' : 'Unknown';

// /* ─── Avatar ─────────────────────────────────────────────────────────────── */
// const Avatar = ({ src, name, size = 'md', colorIdx = 0 }) => {
//   const [err, setErr] = useState(false);
//   const initials = name
//     ? name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
//     : '?';
//   const sz = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
//   const grad = avatarColors[colorIdx % avatarColors.length];

//   if (src && !err) {
//     return (
//       <img
//         src={src}
//         alt={name}
//         onError={() => setErr(true)}
//         className={`${sz} rounded-full object-cover ring-2 ring-white/10 flex-shrink-0`}
//       />
//     );
//   }
//   return (
//     <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 ring-2 ring-white/10`}>
//       <span className="text-white font-bold">{initials}</span>
//     </div>
//   );
// };

// /* ─── Stat Card ──────────────────────────────────────────────────────────── */
// const StatCard = ({ label, value, icon, accent, sub }) => (
//   <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 hover:border-gray-200 transition-all duration-300 group shadow-sm">
//     <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent}`} />
//     <div className="flex items-center justify-between mb-3">
//       <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
//       <span className="text-gray-400 text-xs font-medium">{sub}</span>
//     </div>
//     <p className="text-gray-800 text-2xl font-bold tracking-tight">{value}</p>
//     <p className="text-gray-400 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
//   </div>
// );

// /* ─── Bidder Row ─────────────────────────────────────────────────────────── */
// const BidderRow = ({ bidder, bidAmount, bidTime, rank }) => {
//   const name = safeName(bidder);
//   const time = bidTime
//     ? new Date(bidTime).toLocaleString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       hour: '2-digit',
//       minute: '2-digit',
//     })
//     : '—';
//   return (
//     <div
//       className={`flex items-center gap-3 px-3 py-2 rounded-xl ${rank === 0
//         ? 'bg-amber-50 border border-amber-200'
//         : 'bg-gray-50 border border-gray-100'
//         }`}
//     >
//       <div
//         className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${rank === 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'
//           }`}
//       >
//         {rank + 1}
//       </div>
//       <Avatar name={name} size="sm" colorIdx={rank} />
//       <div className="flex-1 min-w-0">
//         <p className="text-gray-700 text-xs font-semibold truncate">{name}</p>
//         <p className="text-gray-400 text-[10px] truncate">{bidder?.email || '—'}</p>
//         <p className="text-gray-400 text-[10px] truncate">{bidder?.phone || '—'}</p>
//       </div>
//       <div className="text-right flex-shrink-0">
//         <p className={`font-bold text-sm ${rank === 0 ? 'text-amber-500' : 'text-gray-500'}`}>
//           ₹{bidAmount?.toLocaleString() || '—'}
//         </p>
//         <p className="text-gray-300 text-[10px]">{time}</p>
//       </div>
//     </div>
//   );
// };

// /* ─── Winner Card (Grid) ─────────────────────────────────────────────────── */
// const WinnerCard = ({ item, index }) => {
//   const [expanded, setExpanded] = useState(false);
//   const navigate = useNavigate();

//   const winner = item.winner || {};
//   const user = item.user || {};
//   const car = item.carDetails || {};

//   const winnerName = safeName(winner);
//   const ownerName = safeName(user);

//   return (
//     <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-300 shadow-sm">
//       <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

//       <div className="p-5">
//         {/* Rank + Auction ID */}
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-2">
//             <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
//               <span className="text-amber-500 text-xs font-bold">#{index + 1}</span>
//             </div>
//             <span className="text-gray-300 text-[10px] font-mono">
//               {(item.auctionId || '').slice(-8).toUpperCase()}
//             </span>
//           </div>
//           <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold uppercase">
//             {item.status || '—'}
//           </span>
//         </div>

//         {/* Winner */}
//         <div className="flex items-center gap-3 mb-4">
//           <Avatar src={winner.profileImage} name={winnerName} size="lg" colorIdx={index} />
//           <div className="min-w-0">
//             <div className="flex items-center gap-1.5 mb-0.5">
//               <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
//               <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wide">Winner</span>
//             </div>
//             <p className="text-gray-800 font-semibold text-sm truncate">{winnerName}</p>
//             <p className="text-gray-400 text-xs truncate">{winner.email || '—'}</p>
//           </div>
//         </div>

//         {/* Winner contact */}
//         <div className="flex items-center gap-2 mb-4">
//           <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 flex-1 min-w-0">
//             <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
//             <span className="text-gray-500 text-xs truncate">{winner.phone || '—'}</span>
//           </div>
//         </div>

//         {/* Winning amount — uses highestBid (mapped as winningAmount) */}
//         <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
//           <span className="text-gray-500 text-xs font-medium">Winning Bid</span>
//           <span className="text-amber-500 font-bold text-lg">
//             ₹{(item.winningAmount || 0).toLocaleString()}
//           </span>
//         </div>

//         {/* Bid stats */}
//         <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
//           <span className="text-gray-500 text-xs font-medium">Total Bids</span>
//           <span className="text-indigo-600 font-bold text-base">
//             {item.totalBids || 0}
//           </span>
//         </div>

//         {/* Car Details */}
//         <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
//           <div className="flex items-center gap-1.5 mb-3">
//             <Car className="w-3.5 h-3.5 text-indigo-500" />
//             <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Vehicle</span>
//           </div>
//           <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
//             {[
//               ['Make', car.make],
//               ['Model', car.model],
//               ['Year', car.year],
//               ['Color', car.color],
//               ['Reg No.', car.registrationNumber || '—'],
//               ['Mileage', car.mileage != null ? `${car.mileage.toLocaleString()} km` : '—'],
//             ].map(([k, v]) => (
//               <div key={k}>
//                 <p className="text-gray-300 text-[9px] uppercase tracking-wider">{k}</p>
//                 <p className="text-gray-600 text-xs font-medium mt-0.5 truncate" title={v}>{v || '—'}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Car Owner */}
//         <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
//           <div className="flex items-center gap-1.5 mb-2">
//             <User className="w-3.5 h-3.5 text-violet-500" />
//             <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Car Owner</span>
//           </div>
//           <p className="text-gray-700 text-sm font-medium">{ownerName}</p>
//           <p className="text-gray-400 text-xs mt-0.5">{user.phone || '—'}</p>
//           <p className="text-gray-300 text-xs">{user.email || '—'}</p>
//         </div>

//         {/* Meta */}
//         <div className="flex items-center justify-between text-[10px] text-gray-300 mb-3">
//           <span className="flex items-center gap-1">
//             <Calendar className="w-3 h-3" />
//             {item.createdAt
//               ? new Date(item.createdAt).toLocaleDateString('en-IN', {
//                 day: '2-digit',
//                 month: 'short',
//                 year: 'numeric',
//               })
//               : '—'}
//           </span>
//           <span className="font-mono">{(item.enquiryId || '').slice(-8).toUpperCase()}</span>
//         </div>

//         {/* View button */}
//         <button
//           onClick={() => navigate(`/auctions/${item.auctionId}`, { state: item })}
//           className="w-full mb-3 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs font-semibold"
//         >
//           View Details
//         </button>

//         {/* Expand bidders — uses topFiveBidders (mapped as lastFiveBidders) */}
//         {item.lastFiveBidders?.length > 0 && (
//           <button
//             onClick={() => setExpanded(e => !e)}
//             className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-xs font-semibold"
//           >
//             {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
//             {expanded ? 'Hide' : 'Show'} Bidders ({item.lastFiveBidders.length})
//           </button>
//         )}
//       </div>

//       {expanded && item.lastFiveBidders?.length > 0 && (
//         <div className="px-5 pb-5 space-y-2 border-t border-gray-100 pt-4">
//           <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-3">
//             Top {item.lastFiveBidders.length} Bids
//           </p>
//           {item.lastFiveBidders.map((b, i) => (
//             <BidderRow key={i} rank={i} bidder={b.bidder} bidAmount={b.bidAmount} bidTime={b.bidTime} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// /* ─── Table Row Expanded Bidders ─────────────────────────────────────────── */
// const ExpandedBidders = ({ bidders }) => (
//   <tr>
//     <td colSpan={10} className="px-6 pb-4 pt-0">
//       <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
//         <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">
//           Top {bidders.length} Bids
//         </p>
//         <div className="space-y-2">
//           {bidders.map((b, i) => (
//             <BidderRow key={i} rank={i} bidder={b.bidder} bidAmount={b.bidAmount} bidTime={b.bidTime} />
//           ))}
//         </div>
//       </div>
//     </td>
//   </tr>
// );


// /* ─── Main Component ─────────────────────────────────────────────────────── */
// export default function Winners() {
//   const { addToast } = useToast();
//   const [winners, setWinners] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);
//   const [viewMode, setViewMode] = useState('table');
//   const [expandedRows, setExpandedRows] = useState(new Set());
//   const navigate = useNavigate();

//   /* ── Fetch ─────────────────────────────────────────────────────────────── */
//   const fetchWinners = async () => {
//     setLoading(true);
//     try {
//       const { data } = await api.get('/api/admin/enquiries/winners', {
//         headers: getAuthHeaders(),
//       });

//       const firstDecrypt = decryptResponse(data);
//       const secondDecrypt = firstDecrypt?.data?.iv
//         ? decryptResponse(firstDecrypt.data)
//         : firstDecrypt;

//       const list = secondDecrypt?.data || [];

//       // Filter nulls, then map API field names → component field names
//       // API sends: highestBid, topFiveBidders, totalBids
//       const safe = Array.isArray(list)
//         ? list
//           .filter(item => item && item.user && item.carDetails) // removed `item.winner` check
//           .map(item => ({
//             ...item,
//             winningAmount: item.highestBid,
//             lastFiveBidders: item.topFiveBidders,
//           }))
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // ← latest first
//         : [];

//       setWinners(safe);
//     } catch (err) {
//       addToast(err?.response?.data?.message || 'Error loading winners', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchWinners(); }, []);


//   /* ── Filter ────────────────────────────────────────────────────────────── */
//   /* ── Filter ── */
//   useEffect(() => {
//     const t = searchTerm.toLowerCase();
//     setFiltered(
//       winners.filter(item => {
//         const w = item.winner;   // may be null
//         const u = item.user;
//         const c = item.carDetails;
//         return [
//           w?.firstName, w?.lastName, w?.email, w?.phone,   // ← optional chaining
//           u?.firstName, u?.lastName, u?.phone, u?.email,
//           c?.make, c?.model, c?.registrationNumber,
//           item.auctionId, item.enquiryId,
//         ]
//           .filter(Boolean)
//           .join(' ')
//           .toLowerCase()
//           .includes(t);
//       })
//     );
//   }, [winners, searchTerm]);
//    if (selectedId) {
//   return (
//     <EnquiryDetailPage
//       enquiryId={selectedId}
//       onBack={() => setSelectedId(null)}
//     />
//   );
// }

//   /* ── Stats ── */
//   const totalBidAmount = winners.reduce((s, w) => s + (w.winningAmount || 0), 0);
//   const uniqueWinners = new Set(
//     winners.filter(w => w.winner).map(w => w.winner._id)   // ← filter nulls first
//   ).size;
//   const totalBids = winners.reduce((s, w) => s + (w.totalBids || 0), 0);  /* ── Row toggle ────────────────────────────────────────────────────────── */
//   const toggleRow = (id) => {
//     setExpandedRows(prev => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });
//   };

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-800">Auction Winners</h1>
//           <p className="text-gray-400 text-sm mt-1">All closed auction winners and bidding history</p>
//         </div>
//         <button
//           onClick={fetchWinners}
//           className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all text-xs font-medium flex-shrink-0 shadow-sm"
//         >
//           <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
//           Refresh
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         <StatCard
//           label="Total Auctions Won"
//           value={winners.length}
//           icon={<Trophy className="w-4 h-4 text-amber-500" />}
//           accent="bg-amber-500"
//           sub="All Time"
//         />
//         <StatCard
//           label="Unique Winners"
//           value={uniqueWinners}
//           icon={<User className="w-4 h-4 text-indigo-500" />}
//           accent="bg-indigo-500"
//           sub="Distinct"
//         />
//         <StatCard
//           label="Total Bid Amount"
//           value={`₹${(totalBidAmount / 100000).toFixed(1)}L`}
//           icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
//           accent="bg-emerald-500"
//           sub="Combined"
//         />
//         <StatCard
//           label="Bids Tracked"
//           value={totalBids}
//           icon={<Hash className="w-4 h-4 text-violet-500" />}
//           accent="bg-violet-500"
//           sub="Total"
//         />
//       </div>

//       {/* Search + View Toggle */}
//       <div className="flex items-center gap-3">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search winner, owner, car, reg no…"
//             value={searchTerm}
//             onChange={e => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none transition-all text-sm shadow-sm"
//           />
//         </div>
//         <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
//           {['table', 'grid'].map(mode => (
//             <button
//               key={mode}
//               onClick={() => setViewMode(mode)}
//               className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${viewMode === mode
//                 ? 'bg-indigo-500 text-white shadow-sm'
//                 : 'text-gray-400 hover:text-gray-600'
//                 }`}
//             >
//               {mode}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content */}
//       {loading ? (
//         <div className="rounded-2xl bg-white border border-gray-100 p-12 flex items-center justify-center shadow-sm">
//           <div className="flex items-center gap-3 text-gray-400">
//             <RefreshCw className="w-5 h-5 animate-spin" />
//             <span>Loading winners…</span>
//           </div>
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="rounded-2xl bg-white border border-gray-100 p-16 flex flex-col items-center justify-center gap-3 shadow-sm">
//           <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
//             <Trophy className="w-5 h-5 text-gray-300" />
//           </div>
//           <p className="text-gray-400 text-sm font-medium">No winners found</p>
//           <p className="text-gray-300 text-xs">Try adjusting your search</p>
//         </div>
//       ) : viewMode === 'grid' ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filtered.map((item, i) => (
//             <WinnerCard key={item.auctionId} item={item} index={i} />
//           ))}
//         </div>
//       ) : (
//         <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
//           <div className="overflow-x-auto">
//             <table className="w-full whitespace-nowrap min-w-[1000px]">
//               <thead>
//                 <tr className="border-b border-gray-100 bg-gray-50">
//                   {['#','', 'Winner', 'Car Owner', 'Vehicle', 'Reg No.', 'Winning Bid', 'Total Bids', 'Date', 'Action', ''].map(h => (
//                     <th
//                       key={h}
//                       className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {filtered.map((item, index) => {
//                   const winner = item.winner;
//                   const user = item.user;
//                   const car = item.carDetails;
//                   const winnerName = safeName(winner);
//                   const ownerName = safeName(user);
//                   const isExpanded = expandedRows.has(item.auctionId);
//                   const hasBidders = item.lastFiveBidders?.length > 0;

//                   return (
//                     <React.Fragment key={item.auctionId}>
//                       <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50/50' : ''}`}>

//                         {/* Rank */}
//                         <td className="px-4 py-3">
//                           <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
//                             <span className="text-amber-500 text-xs font-bold">{index + 1}</span>
//                           </div>
//                         </td>

//                         {/* Winner */}

//                         <td className="px-4 py-3">
//                           <div className="flex items-center gap-2.5">
//                             <Avatar src={winner?.profileImage} name={winnerName} colorIdx={index} />
//                             <div className="min-w-0">
//                               {winner ? (
//                                 <>
//                                   <div className="flex items-center gap-1 mb-0.5">
//                                     <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
//                                     <p className="text-gray-800 font-semibold text-sm truncate">{winnerName}</p>
//                                   </div>
//                                   <p className="text-gray-400 text-xs truncate max-w-[160px]">{winner.email || '—'}</p>
//                                   <p className="text-gray-300 text-xs">{winner.phone || '—'}</p>
//                                 </>
//                               ) : (
//                                 <span className="text-gray-300 text-xs italic">No winner yet</span>
//                               )}
//                             </div>
//                           </div>
//                         </td>

//                         {/* Car Owner */}
//                         <td className="px-4 py-3">
//                           <p className="text-gray-700 text-sm font-medium">{ownerName}</p>
//                           <p className="text-gray-400 text-xs">{user.phone || '—'}</p>
//                           <p className="text-gray-300 text-xs truncate max-w-[140px]">{user.email || '—'}</p>
//                         </td>

//                         {/* Vehicle */}
//                         <td className="px-4 py-3">
//                           <p className="text-gray-700 text-sm font-medium capitalize truncate max-w-[140px]">{car.make || '—'}</p>
//                           <p className="text-gray-400 text-xs truncate max-w-[140px]">{car.model || '—'}</p>
//                           <p className="text-gray-300 text-xs">{car.year || '—'} · {car.color || '—'}</p>
//                         </td>

//                         {/* Reg No */}
//                         <td className="px-4 py-3">
//                           <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
//                             {car.registrationNumber || '—'}
//                           </span>
//                           <p className="text-gray-300 text-xs mt-1">
//                             {car.mileage != null ? `${car.mileage.toLocaleString()} km` : '—'}
//                           </p>
//                         </td>

//                         {/* Winning Bid — from highestBid mapped as winningAmount */}
//                         <td className="px-4 py-3">
//                           <span className="text-amber-500 font-bold text-base">
//                             ₹{(item.winningAmount || 0).toLocaleString()}
//                           </span>
//                         </td>

//                         {/* Total Bids — from API's totalBids field */}
//                         <td className="px-4 py-3">
//                           <span className="text-indigo-500 font-semibold text-sm">
//                             {item.totalBids || 0}
//                           </span>
//                           <p className="text-gray-300 text-[10px]">total</p>
//                         </td>

//                         {/* Date */}
//                         <td className="px-4 py-3 text-gray-400 text-xs">
//                           {item.createdAt
//                             ? new Date(item.createdAt).toLocaleDateString('en-IN', {
//                               day: '2-digit',
//                               month: 'short',
//                               year: 'numeric',
//                             })
//                             : '—'}
//                         </td>

//                         {/* View Button — fixed: inside its own <td> */}
//                         {console.log('Rendering View button for enquiryId:', item.enquiryId)}   
//                         <td className="px-4 py-3">
//                           <button
//                             onClick={() => setSelectedId(item.enquiryId)}
//                             className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs font-semibold"
//                           >
//                             View
//                           </button>
//                         </td>

//                         {/* Expand Bidders */}
//                         <td className="px-4 py-3">
//                           {hasBidders && (
//                             <button
//                               onClick={() => toggleRow(item.auctionId)}
//                               className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isExpanded
//                                 ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
//                                 : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-100'
//                                 }`}
//                             >
//                               {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
//                               Bids
//                             </button>
//                           )}
//                         </td>
//                       </tr>

//                       {isExpanded && hasBidders && (
//                         <ExpandedBidders bidders={item.lastFiveBidders} />
//                       )}
//                     </React.Fragment>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { decryptResponse } from '../utls/decryptResponse';
import {
  Search, Trophy, User, Phone, Mail, Hash, Car,
  RefreshCw, DollarSign, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnquiryDetailPage from './Enquirydetailpage';

/* ─── API ─────────────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const avatarColors = [
  'from-indigo-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

/* ─── Safe name helper ────────────────────────────────────────────────────── */
const safeName = (obj) =>
  obj ? `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || 'Unknown' : 'Unknown';

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
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        className={`${sz} rounded-full object-cover ring-2 ring-white/10 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 ring-2 ring-white/10`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 hover:border-gray-200 transition-all duration-300 group shadow-sm">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
      <span className="text-gray-400 text-xs font-medium">{sub}</span>
    </div>
    <p className="text-gray-800 text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-gray-400 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Bidder Row ─────────────────────────────────────────────────────────── */
const BidderRow = ({ bidder, bidAmount, bidTime, rank, onAccept, accepting }) => {
  const name = safeName(bidder);
  const time = bidTime
    ? new Date(bidTime).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '—';
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-xl ${rank === 0
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-gray-50 border border-gray-100'
        }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${rank === 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}
      >
        {rank + 1}
      </div>
      <Avatar name={name} size="sm" colorIdx={rank} />
      <div className="flex-1 min-w-0">
        <p className="text-gray-700 text-xs font-semibold truncate">{name}</p>
        <p className="text-gray-400 text-[10px] truncate">{bidder?.email || '—'}</p>
        <p className="text-gray-400 text-[10px] truncate">{bidder?.phone || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0 flex items-center gap-2">
        <div>
          <p className={`font-bold text-sm ${rank === 0 ? 'text-amber-500' : 'text-gray-500'}`}>
            ₹{bidAmount?.toLocaleString() || '—'}
          </p>
          <p className="text-gray-300 text-[10px]">{time}</p>
        </div>
        {onAccept && (
          <button
            onClick={() => onAccept({ bidder, bidAmount, bidTime })}
            disabled={accepting}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {accepting ? '...' : 'Accept'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Winner Card (Grid) ─────────────────────────────────────────────────── */
const WinnerCard = ({ item, index, onAccept, acceptingId }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const winner = item.winner || {};
  const user = item.user || {};
  const car = item.carDetails || {};

  const winnerName = safeName(winner);
  const ownerName = safeName(user);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-300 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

      <div className="p-5">
        {/* Rank + Auction ID */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <span className="text-amber-500 text-xs font-bold">#{index + 1}</span>
            </div>
            <span className="text-gray-300 text-[10px] font-mono">
              {(item.auctionId || '').slice(-8).toUpperCase()}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold uppercase">
            {item.status || '—'}
          </span>
        </div>

        {/* Winner */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={winner.profileImage} name={winnerName} size="lg" colorIdx={index} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wide">Winner</span>
            </div>
            <p className="text-gray-800 font-semibold text-sm truncate">{winnerName}</p>
            <p className="text-gray-400 text-xs truncate">{winner.email || '—'}</p>
          </div>
        </div>

        {/* Winner contact */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 flex-1 min-w-0">
            <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 text-xs truncate">{winner.phone || '—'}</span>
          </div>
        </div>

        {/* Winning amount — uses highestBid (mapped as winningAmount) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
          <span className="text-gray-500 text-xs font-medium">Winning Bid</span>
          <span className="text-amber-500 font-bold text-lg">
            ₹{(item.winningAmount || 0).toLocaleString()}
          </span>
        </div>

        {/* Bid stats */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
          <span className="text-gray-500 text-xs font-medium">Total Bids</span>
          <span className="text-indigo-600 font-bold text-base">
            {item.totalBids || 0}
          </span>
        </div>

        {/* Car Details */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Car className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Vehicle</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {[
              ['Make', car.make],
              ['Model', car.model],
              ['Year', car.year],
              ['Color', car.color],
              ['Reg No.', car.registrationNumber || '—'],
              ['Mileage', car.mileage != null ? `${car.mileage.toLocaleString()} km` : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-gray-300 text-[9px] uppercase tracking-wider">{k}</p>
                <p className="text-gray-600 text-xs font-medium mt-0.5 truncate" title={v}>{v || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Car Owner */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Car Owner</span>
          </div>
          <p className="text-gray-700 text-sm font-medium">{ownerName}</p>
          <p className="text-gray-400 text-xs mt-0.5">{user.phone || '—'}</p>
          <p className="text-gray-300 text-xs">{user.email || '—'}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-gray-300 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              : '—'}
          </span>
          <span className="font-mono">{(item.enquiryId || '').slice(-8).toUpperCase()}</span>
        </div>

        {/* View button */}
        <button
          onClick={() => navigate(`/auctions/${item.auctionId}`, { state: item })}
          className="w-full mb-3 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs font-semibold"
        >
          View Details
        </button>

        {/* Expand bidders — uses topFiveBidders (mapped as lastFiveBidders) */}
        {item.lastFiveBidders?.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-xs font-semibold"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} Bidders ({item.lastFiveBidders.length})
          </button>
        )}
      </div>

      {expanded && item.lastFiveBidders?.length > 0 && (
        <div className="px-5 pb-5 space-y-2 border-t border-gray-100 pt-4">
          <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-3">
            Top {item.lastFiveBidders.length} Bids
          </p>
          {item.lastFiveBidders.map((b, i) => {
            const id = b.bidder?._id || `${item.auctionId}-${i}`;
            return (
              <BidderRow
                key={i}
                rank={i}
                bidder={b.bidder}
                bidAmount={b.bidAmount}
                bidTime={b.bidTime}
                onAccept={onAccept ? (payload) => onAccept(item, b) : undefined}
                accepting={acceptingId === id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Table Row Expanded Bidders ─────────────────────────────────────────── */
const ExpandedBidders = ({ bidders, item, onAccept, acceptingId }) => (
  <tr>
    <td colSpan={10} className="px-6 pb-4 pt-0">
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">
          Top {bidders.length} Bids
        </p>
        <div className="space-y-2">
          {bidders.map((b, i) => {
            const id = b.bidder?._id || `${item.auctionId}-${i}`;
            return (
              <BidderRow
                key={i}
                rank={i}
                bidder={b.bidder}
                bidAmount={b.bidAmount}
                bidTime={b.bidTime}
                onAccept={onAccept ? (payload) => onAccept(item, b) : undefined}
                accepting={acceptingId === id}
              />
            );
          })}
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
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [acceptingId, setAcceptingId] = useState(null);
  const navigate = useNavigate();

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchWinners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/enquiries/winners', {
        headers: getAuthHeaders(),
      });

      const firstDecrypt = decryptResponse(data);
      const secondDecrypt = firstDecrypt?.data?.iv
        ? decryptResponse(firstDecrypt.data)
        : firstDecrypt;

      const list = secondDecrypt?.data || [];

      // Filter nulls, then map API field names → component field names
      // API sends: highestBid, topFiveBidders, totalBids
      const safe = Array.isArray(list)
        ? list
          .filter(item => item && item.user && item.carDetails) // removed `item.winner` check
          .map(item => ({
            ...item,
            winningAmount: item.highestBid,
            lastFiveBidders: item.topFiveBidders,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // ← latest first
        : [];

      setWinners(safe);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error loading winners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWinners(); }, []);

  /* ── Accept Bid ────────────────────────────────────────────────────────── */
  const handleAcceptBid = async (item, bidEntry) => {
    const id = bidEntry.bidder?._id || `${item.auctionId}-${bidEntry.bidAmount}`;
    setAcceptingId(id);
    try {
      await api.post(
        `/api/admin/enquiries/${item.enquiryId}/accept-bid`,
        {
          auctionId: item.auctionId,
          bidderId: bidEntry.bidder?._id,
          bidAmount: bidEntry.bidAmount,
        },
        { headers: getAuthHeaders() }
      );
      addToast('Bid accepted successfully!', 'success');
      fetchWinners();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error accepting bid', 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  /* ── Filter ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = searchTerm.toLowerCase();
    setFiltered(
      winners.filter(item => {
        const w = item.winner;   // may be null
        const u = item.user;
        const c = item.carDetails;
        return [
          w?.firstName, w?.lastName, w?.email, w?.phone,
          u?.firstName, u?.lastName, u?.phone, u?.email,
          c?.make, c?.model, c?.registrationNumber,
          item.auctionId, item.enquiryId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(t);
      })
    );
  }, [winners, searchTerm]);

  if (selectedId) {
    return (
      <EnquiryDetailPage
        enquiryId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  /* ── Stats ── */
  const totalBidAmount = winners.reduce((s, w) => s + (w.winningAmount || 0), 0);
  const uniqueWinners = new Set(
    winners.filter(w => w.winner).map(w => w.winner._id)
  ).size;
  const totalBids = winners.reduce((s, w) => s + (w.totalBids || 0), 0);

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
          <h1 className="text-3xl font-bold text-gray-800">Auction Winners</h1>
          <p className="text-gray-400 text-sm mt-1">All closed auction winners and bidding history</p>
        </div>
        <button
          onClick={fetchWinners}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all text-xs font-medium flex-shrink-0 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Auctions Won"
          value={winners.length}
          icon={<Trophy className="w-4 h-4 text-amber-500" />}
          accent="bg-amber-500"
          sub="All Time"
        />
        <StatCard
          label="Unique Winners"
          value={uniqueWinners}
          icon={<User className="w-4 h-4 text-indigo-500" />}
          accent="bg-indigo-500"
          sub="Distinct"
        />
        <StatCard
          label="Total Bid Amount"
          value={`₹${(totalBidAmount / 100000).toFixed(1)}L`}
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          accent="bg-emerald-500"
          sub="Combined"
        />
        <StatCard
          label="Bids Tracked"
          value={totalBids}
          icon={<Hash className="w-4 h-4 text-violet-500" />}
          accent="bg-violet-500"
          sub="Total"
        />
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search winner, owner, car, reg no…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none transition-all text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
          {['table', 'grid'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${viewMode === mode
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-12 flex items-center justify-center shadow-sm">
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading winners…</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No winners found</p>
          <p className="text-gray-300 text-xs">Try adjusting your search</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <WinnerCard
              key={item.auctionId}
              item={item}
              index={i}
              onAccept={handleAcceptBid}
              acceptingId={acceptingId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['#', '', 'Winner', 'Car Owner', 'Vehicle', 'Reg No.', 'Winning Bid', 'Total Bids', 'Date', 'Action', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item, index) => {
                  const winner = item.winner;
                  const user = item.user;
                  const car = item.carDetails;
                  const winnerName = safeName(winner);
                  const ownerName = safeName(user);
                  const isExpanded = expandedRows.has(item.auctionId);
                  const hasBidders = item.lastFiveBidders?.length > 0;

                  return (
                    <React.Fragment key={item.auctionId}>
                      <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50/50' : ''}`}>

                        {/* Rank */}
                        <td className="px-4 py-3">
                          <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                            <span className="text-amber-500 text-xs font-bold">{index + 1}</span>
                          </div>
                        </td>

                        {/* Winner */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={winner?.profileImage} name={winnerName} colorIdx={index} />
                            <div className="min-w-0">
                              {winner ? (
                                <>
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                    <p className="text-gray-800 font-semibold text-sm truncate">{winnerName}</p>
                                  </div>
                                  <p className="text-gray-400 text-xs truncate max-w-[160px]">{winner.email || '—'}</p>
                                  <p className="text-gray-300 text-xs">{winner.phone || '—'}</p>
                                </>
                              ) : (
                                <span className="text-gray-300 text-xs italic">No winner yet</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Car Owner */}
                        <td className="px-4 py-3">
                          <p className="text-gray-700 text-sm font-medium">{ownerName}</p>
                          <p className="text-gray-400 text-xs">{user?.phone || '—'}</p>
                          <p className="text-gray-300 text-xs truncate max-w-[140px]">{user?.email || '—'}</p>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <p className="text-gray-700 text-sm font-medium capitalize truncate max-w-[140px]">{car?.make || '—'}</p>
                          <p className="text-gray-400 text-xs truncate max-w-[140px]">{car?.model || '—'}</p>
                          <p className="text-gray-300 text-xs">{car?.year || '—'} · {car?.color || '—'}</p>
                        </td>

                        {/* Reg No */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {car?.registrationNumber || '—'}
                          </span>
                          <p className="text-gray-300 text-xs mt-1">
                            {car?.mileage != null ? `${car.mileage.toLocaleString()} km` : '—'}
                          </p>
                        </td>

                        {/* Winning Bid — from highestBid mapped as winningAmount */}
                        <td className="px-4 py-3">
                          <span className="text-amber-500 font-bold text-base">
                            ₹{(item.winningAmount || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Total Bids — from API's totalBids field */}
                        <td className="px-4 py-3">
                          <span className="text-indigo-500 font-semibold text-sm">
                            {item.totalBids || 0}
                          </span>
                          <p className="text-gray-300 text-[10px]">total</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                            : '—'}
                        </td>

                        {/* View Button */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedId(item.enquiryId)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs font-semibold"
                          >
                            View
                          </button>
                        </td>

                        {/* Expand Bidders */}
                        <td className="px-4 py-3">
                          {hasBidders && (
                            <button
                              onClick={() => toggleRow(item.auctionId)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isExpanded
                                ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-100'
                                }`}
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Bids
                            </button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && hasBidders && (
                        <ExpandedBidders
                          bidders={item.lastFiveBidders}
                          item={item}
                          onAccept={handleAcceptBid}
                          acceptingId={acceptingId}
                        />
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