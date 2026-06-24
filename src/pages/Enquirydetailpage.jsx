import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import generateInspectionPDF from '../utls/Generateinspectionpdf';
import PhotoEditorModal from './Photoeditormodal';

// import AirConditioningEditForm        from './AirConditioningEditForm';
import SteeringSuspensionBrakesEditForm from './SteeringSuspensionBrakesEditForm';

import ExteriorTyresEditForm from './ExteriorTyresEditForm';
import EngineTransmissionEditForm from './EngineTransmissionEditForm';
import CarDetailsEditForm from './CarDetailsEditForm';
import InteriorElectricalsEditForm from './Interiorelectricalseditform';

/* ─── Status config ──────────────────────────────────────────────────────── */
const statusConfig = {
  new: { label: 'New', bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open: { label: 'Open', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  pending: { label: 'Pending', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  'in-progress': { label: 'In Progress', bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-400' },
  completed: { label: 'Completed', bg: 'bg-teal-500/15', text: 'text-teal-400', dot: 'bg-teal-400' },
};

/* ─── Small shared atoms ─────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-3">{children}</p>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-white/[0.04] last:border-0">
    <span className="indigo-500/35 text-xs">{label}</span>
    <span className="indigo-500/75 text-xs font-medium text-right max-w-[60%]">{value ?? '—'}</span>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 ${className}`}>{children}</div>
);

const StatusDot = ({ status }) => {
  const s = statusConfig[status] || { label: status || 'Unknown', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const ConditionBadge = ({ value }) => {
  const isIssue = value === 'issue' || value === 'na';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isIssue ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
      {value?.toUpperCase() ?? '—'}
    </span>
  );
};

/* ─── Section-level edit button (header row) ─────────────────────────────── */
const SectionEditBtn = ({ onClick, label = 'Edit' }) => (
  <button
    onClick={onClick}
    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold
      bg-white/[0.04] border indigo-500 indigo-500/30
      hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-400 transition-all"
  >
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
    {label}
  </button>
);

/* ─── Per-photo edit button (hover overlay) ──────────────────────────────── */
const EditBtn = ({ onClick }) => (
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg indigo-500/60 backdrop-blur-sm border border-white/[0.15]
      flex items-center justify-center indigo-500/60 hover:text-teal-400 hover:indigo-500/80 hover:border-teal-500/40
      transition-all opacity-0 group-hover:opacity-100"
    title="Edit photo"
  >
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  </button>
);

/* ─── Tab-level edit bar ─────────────────────────────────────────────────── */
const TabEditBar = ({ label, onClick }) => (
  <div className="flex justify-end mb-4">
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/25
        text-teal-400 hover:bg-teal-500/20 hover:border-teal-500/40 transition-all text-sm font-semibold"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      {label}
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   IMAGE LIGHTBOX — swipe / arrow / keyboard navigation
   ══════════════════════════════════════════════════════════════════════════ */
const ImageLightbox = ({ images, startIndex = 0, onClose, onEditPhoto, section = '' }) => {
  const [current, setCurrent] = useState(startIndex);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right' | null
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const total = images.length;

  const go = useCallback((dir) => {
    setAnimDir(dir);
    setCurrent(prev => dir === 'right'
      ? (prev + 1) % total
      : (prev - 1 + total) % total
    );
    setTimeout(() => setAnimDir(null), 250);
  }, [total]);

  /* keyboard */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') go('right');
      else if (e.key === 'ArrowLeft') go('left');
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onClose]);

  /* body scroll lock */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* touch swipe */
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      go(dx < 0 ? 'right' : 'left');
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const img = images[current];

  const translateClass = animDir === 'right'
    ? 'animate-slide-left'
    : animDir === 'left'
      ? 'animate-slide-right'
      : '';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          {img.section && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 uppercase tracking-wider flex-shrink-0">
              {img.section}
            </span>
          )}
          {(img.part || img.caption) && (
            <span className="text-white/50 text-xs capitalize truncate">
              {(img.part || img.caption || '').replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {/* counter */}
          <span className="text-white/30 text-xs font-mono tabular-nums">
            {current + 1} / {total}
          </span>
          {/* edit */}
          {onEditPhoto && (
            <button
              onClick={() => { onClose(); onEditPhoto({ ...img, section: img.section || section }); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.12]
                text-white/50 hover:text-teal-400 hover:border-teal-500/30 transition-all text-[11px] font-semibold"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit
            </button>
          )}
          {/* download */}
          <a
            href={img.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.12]
              text-white/50 hover:text-teal-400 hover:border-teal-500/30 transition-all text-[11px] font-semibold"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
          {/* close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40
              hover:text-white/80 hover:bg-white/[0.08] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main image area ── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-12 py-4 select-none">

        {/* Prev arrow */}
        {total > 1 && (
          <button
            onClick={() => go('left')}
            className="absolute left-2 z-10 w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.12]
              flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.14]
              active:scale-90 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Image */}
        <div
          key={current}
          className="max-w-full max-h-full flex items-center justify-center"
          style={{
            animation: animDir
              ? `${animDir === 'right' ? 'slideInFromRight' : 'slideInFromLeft'} 220ms cubic-bezier(.22,.68,0,1.2) both`
              : 'none',
          }}
        >
          <img
            src={img.url}
            alt={img.caption || img.part || ''}
            className="max-w-full max-h-[calc(100vh-160px)] rounded-xl object-contain shadow-2xl"
            draggable={false}
          />
        </div>

        {/* Next arrow */}
        {total > 1 && (
          <button
            onClick={() => go('right')}
            className="absolute right-2 z-10 w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.12]
              flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.14]
              active:scale-90 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {total > 1 && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex gap-1.5 overflow-x-auto justify-center pb-1 scrollbar-hide">
            {images.map((thumb, i) => (
              <button
                key={i}
                onClick={() => { setAnimDir(i > current ? 'right' : 'left'); setCurrent(i); setTimeout(() => setAnimDir(null), 250); }}
                className={`flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all duration-150
                  ${i === current
                    ? 'border-teal-400 scale-110 shadow-lg shadow-teal-500/30'
                    : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                <img src={thumb.url} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Swipe hint (shown briefly on first open) ── */}
      {total > 1 && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5
            text-white/20 text-[10px] font-medium pointer-events-none select-none"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          swipe to browse
        </div>
      )}

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(48px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-48px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)     scale(1); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

/* ─── Image grid ─────────────────────────────────────────────────────────── */
const ImageGrid = ({ images, cols = 3, onEditPhoto, section = '', onOpenLightbox }) => {
  if (!images || images.length === 0) return null;
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }[cols] || 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3 mt-4`}>
      {images.map((img, i) => (
        <div key={i} className="group relative">
          <button
            className="block w-full text-left"
            onClick={() => onOpenLightbox ? onOpenLightbox(images, i, section) : window.open(img.url, '_blank')}
          >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
              <img
                src={img.url}
                alt={img.caption || img.part || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                <p className="indigo-500 text-[10px] font-medium truncate w-full">{img.caption || img.part?.replace(/_/g, ' ')}</p>
              </div>
              {(img.part || img.caption) && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full indigo-500/60 indigo-500/80 backdrop-blur-sm capitalize">
                    {(img.part || img.caption || '').replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {/* expand icon hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </span>
              </div>
            </div>
          </button>
          {onEditPhoto && <EditBtn onClick={() => onEditPhoto({ ...img, section })} />}
        </div>
      ))}
    </div>
  );
};

/* ─── Horizontal image strip ─────────────────────────────────────────────── */
const ImageStrip = ({ images, onEditPhoto, section = '', onOpenLightbox }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
      {images.map((img, i) => (
        <div key={i} className="group relative flex-shrink-0">
          <button
            onClick={() => onOpenLightbox ? onOpenLightbox(images, i, section) : window.open(img.url, '_blank')}
            className="block"
          >
            <div className="relative w-[72px] h-[54px] rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.03]">
              <img
                src={img.url}
                alt={img.caption || ''}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </div>
            </div>
          </button>
          {onEditPhoto && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditPhoto({ ...img, section }); }}
              className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full indigo-500/70 border border-white/[0.2]
                flex items-center justify-center indigo-500/60 hover:text-teal-400 hover:border-teal-500/50
                transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const ImgCount = ({ n }) => n > 0 ? (
  <span className="inline-flex items-center gap-0.5 ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
    {n}
  </span>
) : null;

const PartRow = ({ label, data, onEditPhoto, section = '', onOpenLightbox }) => {
  if (!data) return null;
  const imgs = data.images || [];
  return (
    <div className="py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center justify-between">
        <span className="indigo-500/50 text-xs capitalize flex items-center">
          {label.replace(/_/g, ' ')}
          <ImgCount n={imgs.length} />
        </span>
        <ConditionBadge value={data.status} />
      </div>
      {(data.conditions?.length > 0 || data.work_done?.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {data.conditions?.filter(Boolean).map((c, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{c}</span>
          ))}
          {data.work_done?.filter(Boolean).map((w, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{w}</span>
          ))}
        </div>
      )}
      {data.notes && <p className="indigo-500/30 text-[11px] mt-1 italic">"{data.notes}"</p>}
      <ImageStrip images={imgs} onEditPhoto={onEditPhoto} section={section} onOpenLightbox={onOpenLightbox} />
    </div>
  );
};

/* ─── Loading skeleton ───────────────────────────────────────────────────── */
const PageSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-64 bg-white/10 rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/[0.04] rounded-xl" />)}</div>
      <div className="lg:col-span-2 space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/[0.04] rounded-xl" />)}</div>
    </div>
  </div>
);

/* ─── Slide-over edit panel ──────────────────────────────────────────────── */
const EditPanel = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex">
    <div className="flex-1 indigo-500/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-2xl bg-[#bg-white] border-l border-white/[0.08] flex flex-col h-full shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <p className="indigo-500/70 text-sm font-semibold">{title}</p>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center indigo-500/40 hover:indigo-500/80 hover:bg-white/[0.06] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className=" bg-white flex-1 overflow-y-auto ">{children}</div>
    </div>
  </div>
);

/* ─── Collect all images for "All Photos" tab ────────────────────────────── */
function collectAllImages(enq, car) {
  const images = [];
  enq?.attachments?.forEach(att => {
    images.push({ url: att.url, caption: att.fileName, part: 'Attachment', section: 'Enquiry' });
  });
  if (!car) return images;
  car.car_details?.images?.forEach(img => {
    images.push({ url: img.url, caption: img.caption, part: (img.part || '').replace(/_/g, ' '), section: 'Car Details' });
  });
  const et = car.exterior_tyres;
  if (et) {
    const sections = [
      ['bumper', ['front', 'rear']],
      ['fender', ['lhs', 'rhs']],
      ['door', ['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear']],
      ['pillar', ['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c']],
      ['running_border', ['lhs', 'rhs']],
      ['quarter_panel', ['lhs', 'rhs']],
      ['windshield', ['front', 'rear']],
      ['orvm', ['lhs', 'rhs']],
      ['lights', ['lhs_headlight', 'lhs_taillight', 'rhs_headlight', 'rhs_taillight']],
      ['tyres', ['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear', 'spare']],
    ];
    const singles = [
      'alloy_wheel', 'apron', 'bonnet_hood', 'boot_floor', 'cowl_top',
      'dicky_boot_door', 'firewall', 'head_light_support', 'lower_cross_member',
      'radiator_support', 'roof', 'upper_cross_member',
    ];
    sections.forEach(([sec, keys]) => {
      keys.forEach(key => {
        et[sec]?.[key]?.images?.forEach(img => {
          images.push({ url: img.url, caption: img.caption, part: `${sec} ${key}`.replace(/_/g, ' '), section: 'Exterior' });
        });
      });
    });
    singles.forEach(key => {
      et[key]?.images?.forEach(img => {
        images.push({ url: img.url, caption: img.caption, part: key.replace(/_/g, ' '), section: 'Exterior' });
      });
    });
  }
  car.electricals_interior?.images?.forEach(img => {
    images.push({ url: img.url, caption: img.caption, part: 'Interior', section: 'Interior' });
  });
  car.electricals_interior?.interior?.images?.forEach(img => {
    images.push({ url: img.url, caption: img.caption, part: 'Interior Cabin', section: 'Interior' });
  });
  ['engine', 'battery'].forEach(key => {
    car.engine_transmission?.[key]?.images?.forEach(img => {
      images.push({ url: img.url, caption: img.caption, part: key, section: 'Engine' });
    });
  });
  return images;
}

const PDFPreviewModal = ({ blobUrl, regNo, onClose, onDownload }) => {
  const iframeRef = React.useRef(null);
  const urlWithPage = blobUrl ? `${blobUrl}#page=1` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full sm:max-h-[92vh] h-[92vh] flex flex-col
                       bg-[#0f0f13] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
            </svg>
            <span className="text-white/80 text-sm font-semibold">Inspection Report</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-semibold">{regNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30
                          text-teal-400 hover:bg-teal-500/25 transition-all text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 bg-[#1a1a22] overflow-hidden">
          {urlWithPage && (
            <iframe ref={iframeRef} src={urlWithPage} className="w-full h-full border-0" title="PDF Preview" />
          )}
        </div>
      </div>
    </div>
  );
};


/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
const EnquiryDetailPage = ({ enquiryId, onBack }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = React.useState(false);

  /* ── Per-image photo editor ── */
  const [editingPhoto, setEditingPhoto] = useState(null);

  /* ── Lightbox state ── */
  const [lightbox, setLightbox] = useState(null); // { images, index, section } | null

  /* ── Section edit panel ── */
  const [editSection, setEditSection] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const token = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  /* ── Fetch enquiry detail ── */
  const fetchDetail = useCallback(() => {
    if (!enquiryId) return;
    setLoading(true);
    setError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/byID/${enquiryId}`, { headers: authHeader() })
      .then(res => setDetail(res.data))
      .catch(err => { console.error(err); setError('Failed to load enquiry details. Please try again.'); })
      .finally(() => setLoading(false));
  }, [enquiryId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // Derived from state — must be declared before any callback that references them
  const enq = detail?.data?.enquiryId ? detail.data : detail?.data;
  const car = detail?.carDetails || detail?.data?.carDetails;

  /* ── Open lightbox helper — always uses the full allPhotos pool ── */
  const openLightbox = useCallback((images, index, _section) => {
    const clickedUrl = images[index]?.url;
    // Re-derive inside callback so dependency is just `detail` (stable reference)
    const _enq = detail?.data?.enquiryId ? detail.data : detail?.data;
    const _car = detail?.carDetails || detail?.data?.carDetails;
    const globalPhotos = (_enq && _car) ? collectAllImages(_enq, _car) : images;
    const globalIndex = clickedUrl
      ? globalPhotos.findIndex(p => p.url === clickedUrl)
      : index;
    setLightbox({
      images: globalPhotos,
      index: globalIndex >= 0 ? globalIndex : 0,
      section: '',
    });
  }, [detail]);

  /* ── PDF handlers ── */
  const handlePreviewPDF = async () => {
    if (!enq) return;
    setPdfLoading(true);
    setPdfProgress('Generating preview…');
    try {
      const url = await generateInspectionPDF(enq, car, (msg) => setPdfProgress(msg), 'preview');
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(url);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error('PDF preview failed:', err);
      setPdfProgress('Failed');
    } finally {
      setPdfLoading(false);
      setPdfProgress('');
    }
  };

  const handleDownloadFromPreview = () => {
    if (!enq) return;
    generateInspectionPDF(enq, car, () => { }, 'download');
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }
  };

  const handleDownloadPDF = async () => {
    if (!enq) return;
    setPdfLoading(true);
    setPdfProgress('Preparing…');
    try {
      await generateInspectionPDF(enq, car, (msg) => setPdfProgress(msg));
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfProgress('Failed');
    } finally {
      setPdfLoading(false);
      setPdfProgress('');
    }
  };

  /* ── Per-photo editor ── */
  const handleEditPhoto = useCallback((photo) => setEditingPhoto(photo), []);

  const handlePhotoUpload = useCallback(async (blob, photo) => {
    const form = new FormData();
    form.append('enquiryId', enquiryId);

    const endpointMap = {
      'Car Details': `assigned-enquiries/admin/${car?.enquiry_id}/car-details`,
      'Exterior': `assigned-enquiries/admin/${car?.enquiry_id}/exterior-tyres`,
      'Interior': `assigned-enquiries/admin/${car?.enquiry_id}/electricals-interior`,
      'Engine': `assigned-enquiries/admin/${car?.enquiry_id}/engine-transmission`,
    };

    const resolveField = (section, part) => {
      const p = (part || '').toLowerCase().replace(/\s+/g, '_');
      if (section === 'Car Details') return 'car_details_images';
      if (section === 'Interior') return 'electricals_interior_images';
      if (section === 'Engine') return p.includes('battery') ? 'battery_images' : 'engine_images';
      if (section === 'Exterior') {
        const fieldMap = {
          'bumper_front': 'bumper_front_images', 'bumper_rear': 'bumper_rear_images',
          'fender_lhs': 'fender_lhs_images', 'fender_rhs': 'fender_rhs_images',
          'door_lhs_front': 'door_lhs_front_images', 'door_lhs_rear': 'door_lhs_rear_images',
          'door_rhs_front': 'door_rhs_front_images', 'door_rhs_rear': 'door_rhs_rear_images',
          'pillar_lhs_a': 'pillar_lhs_a_images', 'pillar_lhs_b': 'pillar_lhs_b_images',
          'pillar_lhs_c': 'pillar_lhs_c_images', 'pillar_rhs_a': 'pillar_rhs_a_images',
          'pillar_rhs_b': 'pillar_rhs_b_images', 'pillar_rhs_c': 'pillar_rhs_c_images',
          'running_border_lhs': 'running_border_lhs_images', 'running_border_rhs': 'running_border_rhs_images',
          'quarter_panel_lhs': 'quarter_panel_lhs_images', 'quarter_panel_rhs': 'quarter_panel_rhs_images',
          'windshield_front': 'windshield_front_images', 'windshield_rear': 'windshield_rear_images',
          'lhs_headlight': 'lhs_headlight_images', 'rhs_headlight': 'rhs_headlight_images',
          'lhs_taillight': 'lhs_taillight_images', 'rhs_taillight': 'rhs_taillight_images',
          'orvm_lhs': 'orvm_lhs_images', 'orvm_rhs': 'orvm_rhs_images',
          'tyre_lhs_front': 'tyre_lhs_front_images', 'tyre_rhs_front': 'tyre_rhs_front_images',
          'tyre_lhs_rear': 'tyre_lhs_rear_images', 'tyre_rhs_rear': 'tyre_rhs_rear_images',
          'tyre_spare': 'tyre_spare_images', 'bonnet_hood': 'bonnet_hood_images',
          'roof': 'roof_images', 'dicky_boot_door': 'dicky_boot_door_images',
          'apron': 'apron_images', 'cowl_top': 'cowl_top_images',
          'firewall': 'firewall_images', 'boot_floor': 'boot_floor_images',
          'radiator_support': 'radiator_support_images', 'head_light_support': 'head_light_support_images',
          'upper_cross_member': 'upper_cross_member_images', 'lower_cross_member': 'lower_cross_member_images',
          'alloy_wheel': 'alloy_wheel_images',
        };
        if (fieldMap[p]) return fieldMap[p];
        const key = Object.keys(fieldMap).find(k => p.includes(k) || k.includes(p));
        return key ? fieldMap[key] : 'exterior_tyres_images';
      }
      return null;
    };

    const endpoint = endpointMap[photo.section];
    const fieldName = resolveField(photo.section, photo.part || photo.caption);
    if (!endpoint || !fieldName) throw new Error(`Photo editing not supported for section: "${photo.section}"`);

    form.append(fieldName, blob, `edited_${Date.now()}.jpg`);
    if (photo.url) form.append('replaceUrl', photo.url);

    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/cj/${endpoint}`,
      form,
      { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
    );

    const newUrl = res.data?.updatedUrl || res.data?.data?.url || res.data?.url || photo.url;
    return { url: newUrl };
  }, [enquiryId, car]);

  const handlePhotoSaveSuccess = useCallback((result) => {
    const newUrl = typeof result === 'string' ? result : result?.url;
    if (!editingPhoto || !newUrl) return;
    const oldUrl = editingPhoto.url;
    setDetail(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(walk); return; }
        if (obj.url === oldUrl) { obj.url = newUrl; return; }
        Object.values(obj).forEach(walk);
      };
      walk(next);
      return next;
    });
    setEditingPhoto(null);
  }, [editingPhoto]);

  /* ── Section save ── */
  const handleSectionSave = useCallback(async (section, formData) => {
    setEditSaving(true);
    setEditError('');
    const endpointMap = {
      exterior: `assigned-enquiries/admin/${car?.enquiry_id}/exterior-tyres`,
      carDetails: `assigned-enquiries/admin/${car?.enquiry_id}/car-details`,
      interior: `assigned-enquiries/admin/${car?.enquiry_id}/electricals-interior`,
      engine: `assigned-enquiries/admin/${car?.enquiry_id}/engine-transmission`,
      airConditioning: `assigned-enquiries/admin/${car?.enquiry_id}/air-conditioning`,
      steering: `assigned-enquiries/admin/${car?.enquiry_id}/steering`,
    };
    const endpoint = endpointMap[section];
    if (!endpoint) { setEditError('Unknown section'); setEditSaving(false); return; }
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/cj/${endpoint}`,
        formData,
        { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
      );
      setDetail(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        const updatedCar = res.data?.carDetails || res.data?.data?.carDetails;
        if (updatedCar) {
          if (next.carDetails) next.carDetails = updatedCar;
          if (next.data?.carDetails) next.data.carDetails = updatedCar;
          return next;
        }
        const merge = (key, path) => {
          const val = res.data?.[path] || res.data?.data?.[path];
          if (!val) return;
          if (next.carDetails) next.carDetails[key] = val;
          if (next.data?.carDetails) next.data.carDetails[key] = val;
        };
        if (section === 'exterior') merge('exterior_tyres', 'exterior_tyres');
        if (section === 'carDetails') merge('car_details', 'car_details');
        if (section === 'interior') merge('electricals_interior', 'electricals_interior');
        if (section === 'engine') merge('engine_transmission', 'engine_transmission');
        if (section === 'airConditioning')          merge('air_conditioning',          'air_conditioning');
if (section === 'steeringSuspensionBrakes') merge('steering_suspension_brakes','steering_suspension_brakes');
        return next;
      });
      fetchDetail();
      setEditSection(null);
    } catch (err) {
      console.error('Save failed:', err);
      setEditError(err.response?.data?.message || 'Save failed — please try again.');
    } finally {
      setEditSaving(false);
    }
  }, [car]);

  const closePanel = () => { setEditSection(null); setEditError(''); };

  /* ── Tabs ── */
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'car', label: 'Car Details' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'interior', label: 'Interior' },
    { key: 'engine', label: 'Engine' },
    { key: 'air_conditioning', label: 'Air Conditioning' },
    { key: 'steering', label: 'Steering' },
    { key: 'journey', label: 'Journey' },
  ];

  const allPhotos = (enq && car) ? collectAllImages(enq, car) : [];

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="w-full min-h-screen">

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          section={lightbox.section}
          onClose={() => setLightbox(null)}
          onEditPhoto={(photo) => { setLightbox(null); handleEditPhoto(photo); }}
        />
      )}

      {/* ── Per-photo editor modal ── */}
      {editingPhoto && (
        <PhotoEditorModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaveSuccess={handlePhotoSaveSuccess}
          uploadFn={handlePhotoUpload}
        />
      )}

      {/* ── Edit panels ── */}
      {editSection === 'exterior' && car?.exterior_tyres && (
        <EditPanel title="Edit Exterior & Tyres" onClose={closePanel}>
        
          <ExteriorTyresEditForm initialData={car.exterior_tyres} onSave={(fd) => handleSectionSave('exterior', fd)} onCancel={closePanel} saving={editSaving} error={editError} />
        </EditPanel>
      )}
      {editSection === 'engine' && car?.engine_transmission && (
        <EditPanel title="Edit Engine & Transmission" onClose={closePanel}>
          <EngineTransmissionEditForm initialData={car.engine_transmission} onSave={(fd) => handleSectionSave('engine', fd)} onCancel={closePanel} saving={editSaving} error={editError} />
        </EditPanel>
      )}
      {editSection === 'airConditioning' && car?.air_conditioning && (
  <EditPanel title="Edit Air Conditioning" onClose={closePanel}>
    <AirConditioningEditForm
      initialData={car.air_conditioning}
      onSave={(fd) => handleSectionSave('airConditioning', fd)}
      onCancel={closePanel}
      saving={editSaving}
      error={editError}
    />
  </EditPanel>
)}

{editSection === 'steeringSuspensionBrakes' && car?.steering_suspension_brakes && (
  <EditPanel title="Edit Steering, Suspension & Brakes" onClose={closePanel}>
    <SteeringSuspensionBrakesEditForm
      initialData={car.steering_suspension_brakes}
      onSave={(fd) => handleSectionSave('steeringSuspensionBrakes', fd)}
      onCancel={closePanel}
      saving={editSaving}
      error={editError}
    />
  </EditPanel>
)}
      {editSection === 'carDetails' && car?.car_details && (
        <EditPanel title="Edit Car Details" onClose={closePanel}>
          <CarDetailsEditForm initialData={car.car_details} onSave={(fd) => handleSectionSave('carDetails', fd)} onCancel={closePanel} saving={editSaving} error={editError} />
        </EditPanel>
      )}
      {editSection === 'interior' && car?.electricals_interior && (
        <EditPanel title="Edit Interior & Electricals" onClose={closePanel}>
          <InteriorElectricalsEditForm initialData={car.electricals_interior} onSave={(fd) => handleSectionSave('interior', fd)} onCancel={closePanel} saving={editSaving} error={editError} />
        </EditPanel>
      )}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border indigo-500
              indigo-500/50 hover:indigo-500/80 hover:bg-white/[0.08] transition-all text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          {!loading && enq && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="indigo-500/20 text-sm">/</span>
              <span className="indigo-500/40 text-sm font-mono truncate">{enq.enquiryId}</span>
              <StatusDot status={enq.status} />
            </div>
          )}
        </div>
        {pdfPreviewOpen && pdfPreviewUrl && (
          <PDFPreviewModal blobUrl={pdfPreviewUrl} regNo={enq?.enquiryId || 'Report'} onClose={closePdfPreview} onDownload={handleDownloadFromPreview} />
        )}
        {!loading && !error && enq && (
          <button
            onClick={handlePreviewPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30
              text-teal-400 hover:bg-teal-500/25 hover:border-teal-500/50 active:scale-95 transition-all
              text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {pdfLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="hidden sm:inline">{pdfProgress || 'Generating PDF…'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                preview / Download PDF
              </>
            )}
          </button>
        )}
      </div>

      {loading && <PageSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="indigo-500/60 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && enq && (
        <>
          {/* Title row */}
          <div className="mb-6">
            <h1 className="indigo-500 text-xl font-bold leading-tight">
              {enq.description || enq.title || 'Enquiry Details'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <StatusDot status={enq.status} />
              {enq.priority && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                  ${enq.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    enq.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {enq.priority} Priority
                </span>
              )}
              {enq.inspectionType && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {enq.inspectionType}
                </span>
              )}
              <span className="indigo-500/25 text-xs">{new Date(enq.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] overflow-x-auto w-max max-w-full">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === t.key
                  ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30'
                  : 'indigo-500/35 hover:indigo-500/60 hover:bg-white/[0.04]'}`}>
                {t.label}
              </button>
            ))}
            {allPhotos.length > 0 && (
              <button onClick={() => setActiveTab('photos')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'photos'
                  ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30'
                  : 'indigo-500/35 hover:indigo-500/60 hover:bg-white/[0.04]'}`}>
                All Photos ({allPhotos.length})
              </button>
            )}
          </div>

          {/* ════ OVERVIEW ════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-5">
                <Card>
                  <SectionLabel>Customer</SectionLabel>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center indigo-500 font-bold text-sm flex-shrink-0">
                      {enq.userId?.firstName?.[0]}{enq.userId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="indigo-500 font-semibold">{enq.userId?.firstName} {enq.userId?.lastName}</p>
                      <p className="indigo-500/40 text-xs">{enq.userId?.email}</p>
                      <p className="indigo-500/30 text-xs">{enq.userId?.phone}</p>
                    </div>
                  </div>
                  <InfoRow label="Contact Number" value={enq.contactNumber} />
                  {enq.additionalInfo && <InfoRow label="Address" value={enq.additionalInfo} />}
                </Card>
                <Card>
                  <SectionLabel>Service Cost</SectionLabel>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="indigo-500/40 text-xs">Estimated</span>
                      <span className="text-amber-400 font-bold text-sm">{enq.estimatedCost > 0 ? `₹${enq.estimatedCost.toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <span className="indigo-500/40 text-xs">Actual</span>
                      <span className="text-emerald-400 font-bold text-sm">{enq.actualCost > 0 ? `₹${enq.actualCost.toLocaleString()}` : '—'}</span>
                    </div>
                  </div>
                </Card>
                {enq.sellingDetails && (
                  <Card>
                    <SectionLabel>Selling Details</SectionLabel>
                    <InfoRow label="City" value={enq.sellingDetails.city} />
                    <InfoRow label="Fuel Type" value={enq.sellingDetails.fuelType} />
                    <InfoRow label="Transmission" value={enq.sellingDetails.transmission} />
                    <InfoRow label="Ownership" value={enq.sellingDetails.ownership} />
                    <InfoRow label="KM Driven" value={enq.sellingDetails.kilometersDriven?.toLocaleString()} />
                    <InfoRow label="Accident History" value={enq.sellingDetails.accidentHistory} />
                    <InfoRow label="Service History" value={enq.sellingDetails.serviceHistoryAvailable ? 'Available' : 'Not Available'} />
                  </Card>
                )}
              </div>
              <div className="lg:col-span-2 space-y-5">
                <Card>
                  <SectionLabel>Enquiry Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-x-8">
                    <InfoRow label="Enquiry ID" value={enq.enquiryId} />
                    <InfoRow label="Type" value={enq.enquiryType} />
                    <InfoRow label="Severity" value={enq.severity} />
                    <InfoRow label="Inspection Type" value={enq.inspectionType} />
                    <InfoRow label="Assigned To" value={enq.assignedTo ?? 'Unassigned'} />
                    <InfoRow label="Schedule Date" value={enq.scheduleDate ? new Date(enq.scheduleDate).toLocaleDateString() : '—'} />
                    <InfoRow label="Schedule Time" value={enq.scheduleTime || '—'} />
                    <InfoRow label="Created At" value={new Date(enq.createdAt).toLocaleString()} />
                    <InfoRow label="Updated At" value={new Date(enq.updatedAt).toLocaleString()} />
                  </div>
                </Card>
                {enq.attachments?.length > 0 && (
                  <Card>
                    <SectionLabel>Attachments ({enq.attachments.length})</SectionLabel>
                    <ImageGrid
                      images={enq.attachments.map(a => ({ url: a.url, caption: a.fileName }))}
                      cols={4}
                      onEditPhoto={handleEditPhoto}
                      section="Enquiry"
                      onOpenLightbox={openLightbox}
                    />
                  </Card>
                )}
                {enq.notes?.length > 0 && (
                  <Card>
                    <SectionLabel>Notes ({enq.notes.length})</SectionLabel>
                    <div className="space-y-4">
                      {enq.notes.map((note, i) => (
                        <div key={i} className="border-l-2 border-amber-500/40 pl-4">
                          <p className="indigo-500/30 text-[10px]">{note.addedBy?.firstName} {note.addedBy?.lastName} · {new Date(note.addedAt).toLocaleString()}</p>
                          <p className="indigo-500/70 text-sm mt-0.5">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {enq.description && (
                  <Card>
                    <SectionLabel>Description</SectionLabel>
                    <p className="indigo-500/60 text-sm leading-relaxed">{enq.description}</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ════ CAR DETAILS ═════════════════════════════════════════════ */}
          {activeTab === 'car' && (
            !car
              ? <div className="text-center py-16 indigo-500/30 text-sm">No car details available</div>
              : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <div className="flex items-center mb-3">
                        <SectionLabel>Vehicle Details</SectionLabel>
                        <SectionEditBtn onClick={() => setEditSection('carDetails')} />
                      </div>
                      <InfoRow label="Make" value={car.car_details?.make} />
                      <InfoRow label="Model" value={car.car_details?.model} />
                      <InfoRow label="Variant" value={car.car_details?.variant} />
                      <InfoRow label="Body Type" value={car.car_details?.body_type} />
                      <InfoRow label="Color" value={car.car_details?.color} />
                      <InfoRow label="Fuel Type" value={car.car_details?.fuel_type} />
                      <InfoRow label="Cubic Capacity" value={`${car.car_details?.cubic_capacity} CC`} />
                      <InfoRow label="No. of Cylinders" value={car.car_details?.no_cylinders} />
                      <InfoRow label="Seat Capacity" value={car.car_details?.seat_capacity} />
                      <InfoRow label="Vehicle Category" value={car.car_details?.vehicle_category} />
                      <InfoRow label="Vehicle Weight" value={`${car.car_details?.vehicle_gross_weight} Kg`} />
                      <InfoRow label="Unladen Weight" value={`${car.car_details?.unladen_weight} Kg`} />
                      <InfoRow label="Year of Manufacturing" value={car.car_details?.year_of_manufacturing} />
                      <InfoRow label="Manufacturing Date" value={`${car.car_details?.manufacturing_month || "—"} ${car.car_details?.manufacturing_year || ""}`} />
                      <InfoRow label="Registration Date" value={car.car_details?.registration_date ? new Date(car.car_details.registration_date).toLocaleDateString() : null} />
                      <InfoRow label="Registration Month/Year" value={`${car.car_details?.registration_month || "—"} ${car.car_details?.registration_year || ""}`} />
                      <InfoRow label="Odometer Reading" value={car.car_details?.odometer_reading ? `${car.car_details.odometer_reading.toLocaleString()} km` : null} />
                      <InfoRow label="No. of Owners" value={car.car_details?.no_of_owners} />
                      <InfoRow label="Branch" value={car.car_details?.branch} />
                      <InfoRow label="Inspection At" value={car.car_details?.inspection_at} />
                      <InfoRow label="Chassis Embossing" value={car.car_details?.chassis_embossing} />
                    </Card>
                    <Card>
                      <SectionLabel>Insurance & Compliance</SectionLabel>
                      <InfoRow label="Insurance Company" value={car.car_details?.insurance_company} />
                      <InfoRow label="Insurance Type" value={car.car_details?.insurance_type} />
                      <InfoRow label="Insurance Valid Upto" value={car.car_details?.insurance_upto ? new Date(car.car_details.insurance_upto).toLocaleDateString() : null} />
                      <InfoRow label="Fitness Upto" value={car.car_details?.fitness_upto ? new Date(car.car_details.fitness_upto).toLocaleDateString() : null} />
                      <InfoRow label="Road Tax Paid" value={car.car_details?.road_tax_paid} />
                      <InfoRow label="Road Tax Validity" value={car.car_details?.road_tax_validity ? new Date(car.car_details.road_tax_validity).toLocaleDateString() : null} />
                      <InfoRow label="RC Availability" value={car.car_details?.rc_availability} />
                      <InfoRow label="RC Status" value={car.car_details?.rc_status} />
                      <InfoRow label="RC Condition" value={car.car_details?.rc_condition} />
                      <InfoRow label="Financed" value={car.car_details?.financed ? "Yes" : "No"} />
                      <InfoRow label="Financer" value={car.car_details?.financer} />
                      <InfoRow label="Under Hypothecation" value={car.car_details?.under_hypothecation ? "Yes" : "No"} />
                      <InfoRow label="Mismatch In RC" value={car.car_details?.mismatch_in_rc ? "Yes" : "No"} />
                      <InfoRow label="RTO NOC Issued" value={car.car_details?.rto_noc_issued ? "Yes" : "No"} />
                      <InfoRow label="Duplicate Key" value={car.car_details?.duplicate_key ? "Yes" : "No"} />
                      <InfoRow label="CNG/LPG Fitment" value={car.car_details?.cng_lpg_fitment_in_rc ? "Yes" : "No"} />
                      <InfoRow label="To Be Scrapped" value={car.car_details?.to_be_scrapped ? "Yes" : "No"} />
                    </Card>
                    <Card>
                      <SectionLabel>RTO Details</SectionLabel>
                      <InfoRow label="RTO" value={car.car_details?.rto} />
                      <InfoRow label="RTO Code" value={car.car_details?.rto_code} />
                      <InfoRow label="Registration City" value={car.car_details?.reg_city} />
                      <InfoRow label="Registration State" value={car.car_details?.reg_state} />
                      <InfoRow label="Vehicle Category Description" value={car.car_details?.vehicle_category_description} />
                    </Card>
                  </div>
                  {car.car_details?.images?.length > 0 && (
                    <Card>
                      <SectionLabel>Car Photos ({car.car_details.images.length})</SectionLabel>
                      <ImageGrid images={car.car_details.images} cols={5} onEditPhoto={handleEditPhoto} section="Car Details" onOpenLightbox={openLightbox} />
                    </Card>
                  )}
                </div>
              )
          )}

          {/* ════ EXTERIOR ════════════════════════════════════════════════ */}
          {activeTab === 'exterior' && (
            !car?.exterior_tyres
              ? <div className="text-center py-16 indigo-500/30 text-sm">No exterior data available</div>
              : (
                <>
                  <TabEditBar label="Edit Exterior & Tyres" onClick={() => setEditSection('exterior')} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <Card>
                      <SectionLabel>Bumpers</SectionLabel>
                      <PartRow label="Front Bumper" data={car.exterior_tyres.bumper?.front} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      <PartRow label="Rear Bumper" data={car.exterior_tyres.bumper?.rear} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                    </Card>
                    <Card>
                      <SectionLabel>Fenders</SectionLabel>
                      <PartRow label="LHS Fender" data={car.exterior_tyres.fender?.lhs} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      <PartRow label="RHS Fender" data={car.exterior_tyres.fender?.rhs} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                    </Card>
                    <Card>
                      <SectionLabel>Doors</SectionLabel>
                      {['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.door?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Pillars</SectionLabel>
                      {['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.pillar?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Windshields</SectionLabel>
                      <PartRow label="Front" data={car.exterior_tyres.windshield?.front} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      <PartRow label="Rear" data={car.exterior_tyres.windshield?.rear} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                    </Card>
                    <Card>
                      <SectionLabel>Lights</SectionLabel>
                      {['lhs_headlight', 'lhs_taillight', 'rhs_headlight', 'rhs_taillight'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.lights?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Tyres</SectionLabel>
                      {['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear', 'spare'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.tyres?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Body Panels</SectionLabel>
                      {['bonnet_hood', 'roof', 'dicky_boot_door', 'apron', 'cowl_top', 'firewall', 'boot_floor'].map(k =>
                        car.exterior_tyres[k]
                          ? <PartRow key={k} label={k} data={car.exterior_tyres[k]} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                          : null
                      )}
                    </Card>
                    <Card>
                      <SectionLabel>Structural</SectionLabel>
                      {['radiator_support', 'head_light_support', 'upper_cross_member', 'lower_cross_member', 'alloy_wheel'].map(k =>
                        car.exterior_tyres[k]
                          ? <PartRow key={k} label={k} data={car.exterior_tyres[k]} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                          : null
                      )}
                      <PartRow label="ORVM LHS" data={car.exterior_tyres.orvm?.lhs} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      <PartRow label="ORVM RHS" data={car.exterior_tyres.orvm?.rhs} onEditPhoto={handleEditPhoto} section="Exterior" onOpenLightbox={openLightbox} />
                      <InfoRow label="Jack Tool" value={car.exterior_tyres.jack_tool_available ? 'Available' : 'Not Available'} />
                    </Card>
                    {car.exterior_tyres.comments && (
                      <Card>
                        <SectionLabel>Exterior Comments</SectionLabel>
                        <p className="indigo-500/60 text-sm">{car.exterior_tyres.comments}</p>
                      </Card>
                    )}
                  </div>
                </>
              )
          )}

          {/* ════ INTERIOR ════════════════════════════════════════════════ */}
          {activeTab === 'interior' && (
            !car?.electricals_interior
              ? <div className="text-center py-16 indigo-500/30 text-sm">No interior data available</div>
              : (
                <>
                  <TabEditBar label="Edit Interior & Electricals" onClick={() => setEditSection('interior')} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-5">
                      <SectionLabel>Electricals & Features</SectionLabel>
                      <div className="space-y-5 mt-4">
                        {Object.entries(car.electricals_interior || {}).map(([sectionKey, sectionValue]) => {
                          if (sectionKey === "images") return null;
                          if (sectionValue === null || sectionValue === undefined || sectionValue === "") return null;
                          if (typeof sectionValue !== "object" || Array.isArray(sectionValue)) {
                            return (
                              <div key={sectionKey} className="flex justify-between border-b pb-2">
                                <div>
                                  <span className="font-medium capitalize">{sectionKey.replace(/_/g, " ")}</span>
                                  {sectionKey === "power_windows" && <span className="text-xs text-gray-500 ml-2">({car.electricals_interior?.no_of_power_windows || 0} windows)</span>}
                                  {sectionKey === "airbag_feature" && <span className="text-xs text-gray-500 ml-2">({car.electricals_interior?.no_of_airbags || 0} airbags)</span>}
                                </div>
                                <span className="text-gray-700">
                                  {typeof sectionValue === "boolean" ? (sectionValue ? "Yes" : "No") : Array.isArray(sectionValue) ? sectionValue.join(", ") : sectionValue.toString()}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div key={sectionKey} className="border rounded-xl p-4 bg-gray-50">
                              <h3 className="font-semibold text-lg mb-4 capitalize">{sectionKey.replace(/_/g, " ")}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(sectionValue).map(([key, value]) => {
                                  if (key === "images") return null;
                                  return (
                                    <div key={key} className="flex justify-between border-b pb-2">
                                      <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                      <span className="text-sm text-gray-700 text-right">
                                        {Array.isArray(value) ? (value.length ? value.join(", ") : "-") : typeof value === "boolean" ? (value ? "Yes" : "No") : value?.toString() || "-"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                    <div className="space-y-5">
                      <Card>
                        <SectionLabel>Interior Cabin</SectionLabel>
                        <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                          <span className="indigo-500/40 text-xs">Cabin Status</span>
                          <ConditionBadge value={car.electricals_interior.interior?.status} />
                        </div>
                        {car.electricals_interior.interior?.conditions?.length > 0 && (
                          <div className="mt-3">
                            <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-2">Conditions</p>
                            <div className="flex flex-wrap gap-1">
                              {car.electricals_interior.interior.conditions.map((c, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <InfoRow label="Remote Key" value={car.electricals_interior.remote_key?.available ? 'Available' : 'Not Available'} />
                        {car.electricals_interior.remote_key?.notes && <InfoRow label="Remote Key Notes" value={car.electricals_interior.remote_key.notes} />}
                        {car.electricals_interior.comments && (
                          <div className="mt-3 pt-3 border-t border-white/[0.04]">
                            <SectionLabel>Interior Comments</SectionLabel>
                            <p className="indigo-500/60 text-sm">{car.electricals_interior.comments}</p>
                          </div>
                        )}
                      </Card>
                      {(() => {
                        const imgs = [...(car.electricals_interior?.images || []), ...(car.electricals_interior?.interior?.images || [])];
                        return imgs.length > 0 ? (
                          <Card>
                            <SectionLabel>Interior Photos ({imgs.length})</SectionLabel>
                            <ImageGrid images={imgs} cols={3} onEditPhoto={handleEditPhoto} section="Interior" onOpenLightbox={openLightbox} />
                          </Card>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </>
              )
          )}

          {/* ════ ENGINE ══════════════════════════════════════════════════ */}
          {activeTab === 'engine' && (
            !car?.engine_transmission
              ? <div className="text-center py-16 indigo-500/30 text-sm">No engine data available</div>
              : (
                <>
                  <TabEditBar label="Edit Engine & Transmission" onClick={() => setEditSection('engine')} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <Card className="p-5">
                        <SectionLabel>Engine & Transmission</SectionLabel>
                        <div className="space-y-5 mt-4">
                          {Object.entries(car.engine_transmission || {}).map(([sectionKey, sectionValue]) => {
                            if (sectionValue === null || sectionValue === undefined || sectionValue === "") return null;
                            if (typeof sectionValue !== "object") {
                              return (
                                <div key={sectionKey} className="flex justify-between border-b pb-2">
                                  <span className="font-medium capitalize">{sectionKey.replace(/_/g, " ")}</span>
                                  <span className="text-gray-700">{typeof sectionValue === "boolean" ? (sectionValue ? "Yes" : "No") : sectionValue.toString()}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={sectionKey} className="border rounded-xl p-4 bg-gray-50">
                                <h3 className="font-semibold text-lg mb-4 capitalize">{sectionKey.replace(/_/g, " ")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(sectionValue).map(([key, value]) => {
                                    if (key === "images" || key === "videos") return null;
                                    return (
                                      <div key={key} className="flex justify-between border-b pb-2">
                                        <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                        <span className="text-sm text-gray-700 text-right">
                                          {Array.isArray(value) ? (value.length ? value.join(", ") : "-") : typeof value === "boolean" ? (value ? "Yes" : "No") : value?.toString() || "-"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                      {(() => {
                        const videos = [...(car.engine_transmission?.engine?.videos || [])];
                        return videos.length > 0 ? (
                          <Card>
                            <SectionLabel>Engine Videos ({videos.length})</SectionLabel>
                            <div className="grid grid-cols-3 gap-4">
                              {videos.map((video, index) => (
                                <div key={index} className="overflow-hidden rounded-xl border bg-white">
                                  <video controls className="h-48 w-full object-cover">
                                    <source src={video.url} type={video.mime_type || "video/mp4"} />
                                  </video>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ) : null;
                      })()}
                      {(() => {
                        const imgs = [...(car.engine_transmission?.engine?.images || []), ...(car.engine_transmission?.battery?.images || [])];
                        return imgs.length > 0 ? (
                          <Card>
                            <SectionLabel>Engine Photos ({imgs.length})</SectionLabel>
                            <ImageGrid images={imgs} cols={3} onEditPhoto={handleEditPhoto} section="Engine" onOpenLightbox={openLightbox} />
                          </Card>
                        ) : null;
                      })()}
                    </div>
                    <Card className="p-5">
                      <SectionLabel>Steering, Suspension & Brakes</SectionLabel>
                      <div className="space-y-5 mt-4">
                        {Object.entries(car.steering_suspension_brakes || {}).map(([sectionKey, sectionValue]) => {
                          if (sectionKey === "images") return null;
                          if (sectionValue === null || sectionValue === undefined || sectionValue === "") return null;
                          if (typeof sectionValue !== "object") {
                            return (
                              <div key={sectionKey} className="flex justify-between border-b pb-2">
                                <span className="font-medium capitalize">{sectionKey.replace(/_/g, " ")}</span>
                                <span className="text-gray-700">{typeof sectionValue === "boolean" ? (sectionValue ? "Yes" : "No") : sectionValue.toString()}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={sectionKey} className="border rounded-xl p-4 bg-gray-50">
                              <h3 className="font-semibold text-lg mb-4 capitalize">{sectionKey.replace(/_/g, " ")}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(sectionValue).map(([key, value]) => (
                                  <div key={key} className="flex justify-between border-b pb-2">
                                    <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                    <span className="text-sm text-gray-700 text-right">
                                      {Array.isArray(value) ? (value.length ? value.join(", ") : "-") : typeof value === "boolean" ? (value ? "Yes" : "No") : value?.toString() || "-"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </>
              )
          )}

          {/* ════ AIR CONDITIONING ════════════════════════════════════════ */}
          {activeTab === 'air_conditioning' && (
            !car?.air_conditioning
              ? <div className="text-center py-16 indigo-500/30 text-sm">No air conditioning data available</div>
              : (
                <>
                <TabEditBar label="Edit Air Conditioning" onClick={() => setEditSection('airConditioning')} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <Card>
                        <SectionLabel>Air Conditioning</SectionLabel>
                        <InfoRow label="AC Cooling" value={car.air_conditioning?.ac_cooling?.ineffective ? 'Ineffective' : car.air_conditioning?.ac_cooling?.status || 'OK'} />
                        <InfoRow label="Heater" value={car.air_conditioning?.heater?.not_working ? 'Not Working' : car.air_conditioning?.heater?.status || 'OK'} />
                        <InfoRow label="Direction Control Knob" value={car.air_conditioning?.direction_control_knob?.working ? 'Working' : 'Not Working'} />
                        <InfoRow label="AC Vent" value={car.air_conditioning?.ac_vent?.damaged ? 'Damaged' : 'OK'} />
                        <InfoRow label="Blower Motor" value={car.air_conditioning?.blower_motor?.noise ? 'Noise Detected' : 'OK'} />
                        <InfoRow label="Climate Control AC" value={car.air_conditioning?.climate_control_ac || 'N/A'} />
                        <InfoRow label="Comments" value={car.air_conditioning?.comments || 'No Comments'} />
                        {car.air_conditioning?.images?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2">Air Conditioning Images</h4>
                            <ImageGrid images={car.air_conditioning.images} cols={3} onEditPhoto={handleEditPhoto} section="AC" onOpenLightbox={openLightbox} />
                          </div>
                        )}
                      </Card>
                      {(() => {
                        const imgs = [...(car.engine_transmission?.engine?.images || []), ...(car.engine_transmission?.battery?.images || [])];
                        return imgs.length > 0 ? (
                          <Card>
                            <SectionLabel>Engine Photos ({imgs.length})</SectionLabel>
                            <ImageGrid images={imgs} cols={3} onEditPhoto={handleEditPhoto} section="Engine" onOpenLightbox={openLightbox} />
                          </Card>
                        ) : null;
                      })()}
                    </div>
                    <Card>
                      <SectionLabel>Steering, Suspension & Brakes</SectionLabel>
                      <InfoRow label="Steering" value={car.steering_suspension_brakes?.steering?.status} />
                      <InfoRow label="Steering Hard" value={car.steering_suspension_brakes?.steering?.hard ? 'Yes' : 'No'} />
                      <InfoRow label="Steering Noise" value={car.steering_suspension_brakes?.steering?.abnormal_noise ? 'Yes' : 'No'} />
                      <InfoRow label="Suspension" value={car.steering_suspension_brakes?.suspension?.status} />
                      <InfoRow label="Suspension Noise" value={car.steering_suspension_brakes?.suspension?.abnormal_noise ? 'Yes' : 'No'} />
                      <InfoRow label="Brakes" value={car.steering_suspension_brakes?.brake?.status} />
                      <InfoRow label="Brakes Noisy" value={car.steering_suspension_brakes?.brake?.noisy ? 'Yes' : 'No'} />
                      {car.steering_suspension_brakes?.comments && (
                        <div className="mt-3 pt-3 border-t border-white/[0.04]">
                          <p className="indigo-500/60 text-sm">{car.steering_suspension_brakes.comments}</p>
                        </div>
                      )}
                      {car.engine_transmission?.comments && (
                        <div className="mt-3 pt-3 border-t border-white/[0.04]">
                          <SectionLabel>Engine Comments</SectionLabel>
                          <p className="indigo-500/60 text-sm">{car.engine_transmission.comments}</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </>
              )
          )}
          {activeTab === 'steering' && (
  !car?.steering_suspension_brakes
    ? <div className="text-center py-16 text-sm">No steering/brake data available</div>
    : (
      <>
       <TabEditBar
  label="Edit Steering"
  onClick={() => setEditSection("steeringSuspensionBrakes")}
/>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card>
            <SectionLabel>Steering</SectionLabel>
            <InfoRow label="Status"        value={car.steering_suspension_brakes?.steering?.status} />
            <InfoRow label="Hard"          value={car.steering_suspension_brakes?.steering?.hard ? 'Yes' : 'No'} />
            <InfoRow label="Abnormal Noise" value={car.steering_suspension_brakes?.steering?.abnormal_noise ? 'Yes' : 'No'} />
            {car.steering_suspension_brakes?.steering?.conditions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {car.steering_suspension_brakes.steering.conditions.map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{c}</span>
                ))}
              </div>
            )}
            {car.steering_suspension_brakes?.steering?.notes && (
              <p className="text-[11px] mt-2 italic text-white/40">"{car.steering_suspension_brakes.steering.notes}"</p>
            )}
          </Card>

          <Card>
            <SectionLabel>Suspension</SectionLabel>
            <InfoRow label="Status"        value={car.steering_suspension_brakes?.suspension?.status} />
            <InfoRow label="Abnormal Noise" value={car.steering_suspension_brakes?.suspension?.abnormal_noise ? 'Yes' : 'No'} />
            {car.steering_suspension_brakes?.suspension?.conditions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {car.steering_suspension_brakes.suspension.conditions.map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{c}</span>
                ))}
              </div>
            )}
            {car.steering_suspension_brakes?.suspension?.notes && (
              <p className="text-[11px] mt-2 italic text-white/40">"{car.steering_suspension_brakes.suspension.notes}"</p>
            )}
          </Card>

          <Card>
            <SectionLabel>Brakes</SectionLabel>
            <InfoRow label="Status" value={car.steering_suspension_brakes?.brake?.status} />
            <InfoRow label="Noisy"  value={car.steering_suspension_brakes?.brake?.noisy ? 'Yes' : 'No'} />
            {car.steering_suspension_brakes?.brake?.conditions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {car.steering_suspension_brakes.brake.conditions.map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">{c}</span>
                ))}
              </div>
            )}
            {car.steering_suspension_brakes?.brake?.notes && (
              <p className="text-[11px] mt-2 italic text-white/40">"{car.steering_suspension_brakes.brake.notes}"</p>
            )}
            {car.steering_suspension_brakes?.comments && (
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <SectionLabel>Comments</SectionLabel>
                <p className="text-sm text-white/60">{car.steering_suspension_brakes.comments}</p>
              </div>
            )}
          </Card>

        </div>
      </>
    )
)}

          {/* ════ JOURNEY ═════════════════════════════════════════════════ */}
          {activeTab === 'journey' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Enquiry Journey Info</SectionLabel>
                <InfoRow label="Enquiry ID" value={enq.enquiryId} />
                <InfoRow label="Type" value={enq.enquiryType} />
                <InfoRow label="Severity" value={enq.severity} />
                <InfoRow label="Assigned To" value={enq.assignedTo ?? 'Unassigned'} />
                <InfoRow label="Schedule Date" value={enq.scheduleDate ? new Date(enq.scheduleDate).toLocaleDateString() : '—'} />
                <InfoRow label="Schedule Time" value={enq.scheduleTime || '—'} />
                <InfoRow label="Created At" value={new Date(enq.createdAt).toLocaleString()} />
                <InfoRow label="Updated At" value={new Date(enq.updatedAt).toLocaleString()} />
                {enq.customerJourney?.actualCompletion && <InfoRow label="Completed At" value={new Date(enq.customerJourney.actualCompletion).toLocaleString()} />}
              </Card>
              {enq.customerJourney?.timeline?.length > 0 && (
                <Card>
                  <SectionLabel>Timeline</SectionLabel>
                  <div className="relative pl-5">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                    {enq.customerJourney.timeline.map((step, i) => (
                      <div key={i} className="relative mb-5 last:mb-0">
                        <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-gray-900 flex-shrink-0" />
                        <StatusDot status={step.step} />
                        <p className="indigo-500/35 text-xs mt-1">{step.description}</p>
                        {step.timestamp && <p className="indigo-500/20 text-[10px] mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ════ ALL PHOTOS ══════════════════════════════════════════════ */}
          {activeTab === 'photos' && (
            allPhotos.length === 0
              ? <div className="text-center py-16 indigo-500/30 text-sm">No photos available</div>
              : (() => {
                const grouped = {};
                allPhotos.forEach(img => {
                  if (!grouped[img.section]) grouped[img.section] = [];
                  grouped[img.section].push(img);
                });
                return (
                  <div className="space-y-8">
                    {Object.entries(grouped).map(([section, imgs]) => (
                      <div key={section}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase">{section}</span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                          <span className="indigo-500/20 text-xs">{imgs.length}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {imgs.map((img, i) => (
                            <div key={i} className="group relative">
                              <button
                                className="block w-full text-left"
                                onClick={() => openLightbox(imgs, i, section)}
                              >
                                <div className="relative overflow-hidden rounded-xl border indigo-500 bg-white/[0.03] aspect-[4/3]">
                                  <img src={img.url} alt={img.caption} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2.5">
                                    <p className="indigo-500 text-[10px] capitalize truncate w-full">{img.part}</p>
                                  </div>
                                  {img.part && (
                                    <div className="absolute top-2 left-2">
                                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full indigo-500/50 indigo-500/70 backdrop-blur-sm capitalize">{img.part}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                              </button>
                              <EditBtn onClick={() => handleEditPhoto(img)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
          )}
        </>
      )}
    </div>
  );
};

export default EnquiryDetailPage;