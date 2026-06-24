import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { decryptResponse } from '../utls/decryptResponse';
import {
  Search, Trophy, User, RefreshCw, DollarSign, LayoutGrid, List,
  ArrowUpRight, Gavel, History, ChevronDown, ChevronUp, Phone, Mail, Car, Tag
} from 'lucide-react';
import EnquiryDetailPage from './Enquirydetailpage';

/* ─── API ─────────────────────────────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const safeName = (obj) =>
  obj ? `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || 'Unknown' : 'Unknown';



const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtTimeShort = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const PALETTES = [
  ['#6366f1', '#8b5cf6'], ['#ec4899', '#f43f5e'], ['#f59e0b', '#f97316'],
  ['#10b981', '#14b8a6'], ['#3b82f6', '#0ea5e9'],
];
const Avatar = ({ src, name, size = 'md', colorIdx = 0 }) => {
  const [err, setErr] = useState(false);
  const initials = name ? name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const dim = { xl: 44, lg: 36, md: 32, sm: 26 }[size] || 32;
  const fs  = { xl: 15, lg: 13, md: 11, sm: 9  }[size] || 11;
  const [c1, c2] = PALETTES[colorIdx % PALETTES.length];
  if (src && !err)
    return <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: dim, height: dim, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${c1},${c2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: fs,
    }}>{initials}</div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color }) => (
  <div style={{
    background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
    padding: '20px', display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: 12, background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {React.cloneElement(icon, { size: 24, color })}
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

/* ─── Shared badge helper ────────────────────────────────────────────────── */
const Badge = ({ children, bg, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
    borderRadius: 999, background: bg, color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
  }}>{children}</span>
);

const ocbBadge = (status) => {
  const map = {
    open:   { bg: '#dbeafe', color: '#1d4ed8' },
    closed: { bg: '#f1f5f9', color: '#64748b' },
    pending:{ bg: '#fef9c3', color: '#a16207' },
  };
  const s = (status || 'closed').toLowerCase();
  const { bg, color } = map[s] || map.closed;
  return <Badge bg={bg} color={color}>{s.toUpperCase()}</Badge>;
};

/* ─── Table styles ───────────────────────────────────────────────────────── */
const tdStyle = { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };
const thStyle = { textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#475569', fontSize: 13, whiteSpace: 'nowrap' };

/* ─── AuctionTableRow ────────────────────────────────────────────────────── */
const AuctionTableRow = ({ item, index, onViewDetails, expanded, onToggle }) => {
  const car    = item.carDetails  || {};
  const winner = item.winner      || null;
  const owner  = item.user        || {};
  const ocb    = item.ocb         || null;

  return (
    <>
      <tr style={{ transition: 'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* # */}
        <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 600 }}>{index + 1}</td>
 <td style={tdStyle}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}> {item.enquiryIdcustom || ''}</div>
       
          
        </td>
        {/* Vehicle */}
        <td style={tdStyle}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}> {car.model || ''}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag size={11} /> {car.registrationNumber || 'No reg.'}
            {car.year && <span style={{ marginLeft: 6, background: '#f1f5f9', borderRadius: 4, padding: '1px 6px' }}>{car.year}</span>}
          </div>
        </td>

        {/* Auction Winner */}
        <td style={tdStyle}>
          {winner ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={safeName(winner)} size="sm" colorIdx={index} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{safeName(winner)}</div>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={10} /> {winner.phone || '—'}
                </div>
              </div>
            </div>
          ) : (
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>No bids</span>
          )}
        </td>

        {/* Winning Bid (Auction) */}
        <td style={tdStyle}>
          <div style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>{(item.winningAmount)}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.totalBids} bid{item.totalBids !== 1 ? 's' : ''}</div>
        </td>

        {/* OCB Status */}
        <td style={tdStyle}>
          {ocb ? ocbBadge(ocb.status) : <span style={{ color: '#cbd5e1' }}>—</span>}
        </td>

        {/* OCB Final Price */}
        <td style={tdStyle}>
          {ocb?.finalPrice
            ? <span style={{ fontWeight: 700, color: '#6366f1' }}>{(ocb.finalPrice)}</span>
            : <span style={{ color: '#cbd5e1' }}>—</span>}
        </td>

        {/* OCB Winner */}
        <td style={tdStyle}>
          {ocb?.winner?.bidder ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={safeName(ocb.winner.bidder)} size="sm" colorIdx={index + 2} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{safeName(ocb.winner.bidder)}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{(ocb.winner.acceptedAmount)}</div>
              </div>
            </div>
          ) : (
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
          )}
        </td>

        {/* Date */}
        <td style={{ ...tdStyle, fontSize: 13, color: '#64748b' }}>{fmtDate(item.createdAt)}</td>

        {/* Actions */}
        <td style={tdStyle}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onViewDetails(item.enquiryId)}
              style={{
                border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
              }}>View</button>
            <button onClick={onToggle}
              style={{
                border: '1px solid #e2e8f0', background: '#fff', padding: '7px 10px',
                borderRadius: 8, cursor: 'pointer', color: '#64748b',
                display: 'flex', alignItems: 'center',
              }}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </td>
      </tr>

      {/* ── Expanded Detail Row ───────────────────────────────────────────── */}
      {expanded && (
        <tr>
          <td colSpan={9} style={{ background: '#f8fafc', padding: 0 }}>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>

              {/* Owner */}
              {/* <Section title="Car Owner">
                <InfoRow label="Name"  value={safeName(owner)} />
                <InfoRow label="Email" value={owner.email || '—'} />
                <InfoRow label="Phone" value={owner.phone || '—'} />
              </Section> */}

              {/* Auction Bids */}
              <Section title={`Current Round · ${item.currentBids?.length || 0} bid(s)`}>
                {item.currentBids?.length ? (
                  <MiniTable
                    rows={item.currentBids}
                    cols={[
                      { label: 'Bidder', render: b => safeName(b.bidder) },
                      { label: 'Phone',  render: b => b.bidder?.phone || '—' },
                      { label: 'Amount', render: b => (b.bidAmount) },
                      { label: 'Time',   render: b => fmtTimeShort(b.bidTime) },
                    ]}
                  />
                ) : <Empty>No bids</Empty>}
              </Section>

              {/* OCB Interests */}
              <Section title={`BNB Interests · ${item.ocb?.currentInterests?.total ?? 0}`}>
                {item.ocb?.currentInterests?.interests?.length ? (
                  <MiniTable
                    rows={item.ocb.currentInterests.interests}
                    cols={[
                      { label: 'Bidder', render: r => r.bidderName || safeName(r.bidder) },
                      { label: 'Phone',  render: r => r.bidder?.phone || '—' },
                      { label: 'Offer',  render: r => (r.interestAmount) },
                      { label: 'Status', render: r => <Badge bg="#fef9c3" color="#a16207">{r.status}</Badge> },
                    ]}
                  />
                ) : <Empty>No interests yet</Empty>}
              </Section>
               {/* OCB Interests */}
            <Section
  title={`BNB Previous Interests · ${item.ocb?.previousInterests?.length || 0}`}
>
  {item.ocb?.previousInterests?.length ? (
    <MiniTable
      rows={item.ocb.previousInterests}
      cols={[
        {
          label: 'Bidder',
          render: r => r.bidderName || safeName(r.bidder),
        },
        {
          label: 'Phone',
          render: r => r.bidderPhone || r.bidder?.phone || '—',
        },
        {
          label: 'Offer',
          render: r => `₹${Number(r.interestAmount || 0).toLocaleString()}`,
        },
        {
          label: 'Status',
          render: r => (
            <Badge bg="#fef9c3" color="#a16207">
              {r.status}
            </Badge>
          ),
        },
        {
          label: 'Moved',
          render: r => fmtDate(r.movedAt),
        },
      ]}
    />
  ) : (
    <Empty>No previous interests</Empty>
  )}
</Section>

              {/* Previous Auction Rounds (full width if present) */}
              {item.previousBidRounds?.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Section title={`Previous Bid Rounds · ${item.previousBidRounds.length}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
                      {item.previousBidRounds.map((round, ri) => (
                        <div key={ri} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Round #{ri + 1}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{fmtDate(round.movedAt)}</div>
                          <MiniTable
                            rows={round.bids || []}
                            cols={[
                              { label: 'Bidder', render: b => safeName(b.bidder) },
                              { label: 'Phone',  render: b => b.bidder?.phone || '—' },
                              { label: 'Amount', render: b => (b.bidAmount) },
                              { label: 'Time',   render: b => fmtTimeShort(b.bidTime) },
                            ]}
                          />
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/* ─── Small helpers for expanded rows ───────────────────────────────────── */
const Section = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
    <span style={{ color: '#94a3b8' }}>{label}</span>
    <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
  </div>
);
const MiniTable = ({ rows, cols }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
    <thead>
      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
        {cols.map(c => <th key={c.label} style={{ textAlign: 'left', padding: '4px 8px', color: '#94a3b8', fontWeight: 600 }}>{c.label}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
          {cols.map(c => <td key={c.label} style={{ padding: '6px 8px', color: '#1e293b' }}>{c.render(row)}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);
const Empty = ({ children }) => (
  <div style={{ color: '#cbd5e1', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>{children}</div>
);
const Chip = ({ children, color }) => (
  <span style={{
    fontSize: 10, padding: '3px 9px', borderRadius: 6,
    background: `${color}18`, color, border: `1px solid ${color}50`,
  }}>{children}</span>
);

const StatMini = ({ label, value, accent, bg, border }) => (
  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 800, color: accent, marginTop: 4 }}>{value}</div>
  </div>
);

const PersonRow = ({ icon, label, name, phone, idx, small }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <Avatar name={name} size={small ? 'sm' : 'sm'} colorIdx={idx} />
    <div>
      <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: small ? 13 : 14 }}>{name}</div>
      {phone && <div style={{ fontSize: 11, color: '#64748b' }}>{phone}</div>}
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Winners() {
  const { addToast } = useToast();
  const [winners,      setWinners]      = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [loading,      setLoading]      = useState(false);
  const [selectedId,   setSelectedId]   = useState(null);
 
  const [expandedRows, setExpandedRows] = useState({});

  /* ── Data fetching & mapping ────────────────────────────────────────── */
  const fetchWinners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/enquiries/winners', { headers: getAuthHeaders() });
      const firstDecrypt  = decryptResponse(data);
      const secondDecrypt = firstDecrypt?.data?.iv ? decryptResponse(firstDecrypt.data) : firstDecrypt;
      const list          = secondDecrypt?.data || [];

      const safe = Array.isArray(list)
        ? list.map((item) => {
            const auction      = item.auction      || {};
            const currentRound = auction.currentRound || {};
            const ocb          = item.ocb          || null;

            // ── Auction winner
            let auctionWinner = auction.winner?.bidder || null;
            if (!auctionWinner && currentRound.topFiveBidders?.length) {
              auctionWinner = currentRound.topFiveBidders[0]?.bidder || null;
            }

            return {
              ...item,
              enquiryId:        item.enquiryId,
              user:             item.user             || {},
              carDetails:       item.carDetails        || {},
              auction:          auction,                          // keep full object for card
              auctionId:        auction.auctionId      || '',
              status:           auction.status         || 'open',
              createdAt:        auction.createdAt,
              winner:           auctionWinner,
              winningAmount:    auction.winner?.winningBidAmount ?? currentRound.highestBid ?? 0,
              totalBids:        currentRound.totalBids  ?? 0,
              highestBid:       currentRound.highestBid ?? 0,
              currentBids:      currentRound.bids        || [],
              topFiveBidders:   currentRound.topFiveBidders || [],
              previousBidRounds: auction.previousBidRounds || [],
              ocb,              // ← full OCB object (includes winner, currentInterests, etc.)
            };
          })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

      setWinners(safe);
      setFiltered(safe);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error loading winners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWinners(); }, []);

  /* ── Search ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(winners.filter(item => {
      const blob = [
        item.carDetails?.make,
        item.carDetails?.model,
        item.carDetails?.registrationNumber,
        safeName(item.winner),
        safeName(item.user),
        item.winner?.phone,
        item.user?.phone,
        item.auctionId,
        item.ocb?.winner?.bidder ? safeName(item.ocb.winner.bidder) : '',
      ].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(term);
    }));
  }, [winners, searchTerm]);

  /* ── Derived stats ──────────────────────────────────────────────────── */
  const totalValue    = winners.reduce((s, w) => s + (w.winningAmount || 0), 0);
  const uniqueWinners = new Set(winners.filter(w => w.winner).map(w => w.winner._id)).size;
  const ocbOpen       = winners.filter(w => w.ocb?.status === 'open').length;
  const ocbClosed     = winners.filter(w => w.ocb?.status === 'closed').length;

  const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  if (selectedId) return <EnquiryDetailPage enquiryId={selectedId} onBack={() => setSelectedId(null)} />;

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a' }}>Auction Winners</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            {winners.length} auctions · {uniqueWinners} unique winners
          </p>
        </div>
        <button onClick={fetchWinners} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff',
          fontWeight: 600, cursor: 'pointer',
        }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
        <StatCard label="Total Auctions"  value={winners.length}          icon={<Trophy />}     color="#f59e0b" />
        <StatCard label="Unique Winners"  value={uniqueWinners}           icon={<User />}       color="#6366f1" />
        <StatCard label="Total Bid Value" value={(totalValue)} icon={<DollarSign />} color="#10b981" />
        <StatCard label="BNB Open"        value={ocbOpen}                 icon={<Gavel />}      color="#3b82f6" />
        <StatCard label="BNB Closed"      value={ocbClosed}               icon={<History />}    color="#64748b" />
      </div>

      {/* Search + Toggle */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 480 }}>
          <Search size={16} color="#94a3b8"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by car, winner, owner, phone, reg…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '11px 12px 11px 44px',
              borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        
      </div>

      {/* Content */}
      {loading ? (
  <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
    <RefreshCw
      size={32}
      style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }}
    />
    <div>Loading auctions…</div>
  </div>
) : filtered.length === 0 ? (
  <div style={{ textAlign: 'center', padding: '120px 20px', color: '#94a3b8' }}>
    <Trophy size={48} strokeWidth={1} />
    <p style={{ marginTop: 16, fontSize: 18 }}>No results found</p>
  </div>
) : (
  <div
    style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #e2e8f0',
      overflowX: 'auto',
    }}
  >
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: 900,
      }}
    >
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <th style={thStyle}>#</th>
          <th style={thStyle}>Enquiry ID</th>
          <th style={thStyle}>Vehicle</th>
          <th style={thStyle}>Auction Winner</th>
          <th style={thStyle}>Bid Amount</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>BNB Price</th>
          <th style={thStyle}>BNB Winner</th>
          <th style={thStyle}>Date</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {filtered.map((item, i) => (
          <AuctionTableRow
            key={item.auctionId || i}
            item={item}
            index={i}
            onViewDetails={id => setSelectedId(id)}
            expanded={!!expandedRows[item.auctionId]}
            onToggle={() => toggleExpand(item.auctionId)}
          />
        ))}
      </tbody>
    </table>
  </div>
)}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        button { transition: all .2s ease; }
        button:hover { opacity: .9; }
      `}</style>
    </div>
  );
}