import React, { useState, useEffect } from 'react';
import axios from 'axios';

/* ─── Status / Priority configs ──────────────────────────────────────────── */
const statusConfig = {
  new:           { label: 'New',         bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  open:          { label: 'Open',        bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  pending:       { label: 'Pending',     bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned:      { label: 'Assigned',    bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  resolved:      { label: 'Resolved',    bg: 'bg-emerald-500/15',text: 'text-emerald-400',dot: 'bg-emerald-400'},
  closed:        { label: 'Closed',      bg: 'bg-gray-500/15',   text: 'text-gray-400',   dot: 'bg-gray-400'   },
  'in-progress': { label: 'In Progress', bg: 'bg-sky-500/15',    text: 'text-sky-400',    dot: 'bg-sky-400'    },
  completed:     { label: 'Completed',   bg: 'bg-teal-500/15',   text: 'text-teal-400',   dot: 'bg-teal-400'   },
};
const STATUS_HEX = {
  new: '#818cf8', open: '#fbbf24', pending: '#a78bfa', assigned: '#60a5fa',
  resolved: '#34d399', closed: '#9ca3af', 'in-progress': '#38bdf8', completed: '#2dd4bf',
};
const PRIORITY_HEX = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };

/* ─── Small UI helpers ────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-3">{children}</p>
);
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-white/[0.04] last:border-0">
    <span className="text-white/35 text-xs">{label}</span>
    <span className="text-white/75 text-xs font-medium text-right max-w-[60%]">{value ?? '—'}</span>
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
const PartRow = ({ label, data }) => {
  if (!data) return null;
  return (
    <div className="py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/50 text-xs capitalize">{label.replace(/_/g, ' ')}</span>
        <ConditionBadge value={data.status} />
      </div>
      {(data.conditions?.length > 0 || data.work_done?.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {data.conditions?.filter(Boolean).map((c, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{c}</span>
          ))}
          {data.work_done?.filter(Boolean).map((w, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{w}</span>
          ))}
        </div>
      )}
      {data.notes && <p className="text-white/30 text-[11px] mt-1 italic">"{data.notes}"</p>}
    </div>
  );
};
const PageSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-64 bg-white/10 rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/[0.04] rounded-xl" />)}</div>
      <div className="lg:col-span-2 space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/[0.04] rounded-xl" />)}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   IMAGE FETCHER — converts a remote URL to a base64 data URL via a CORS proxy
   Falls back silently if the image can't be loaded.
   ══════════════════════════════════════════════════════════════════════════════ */
async function fetchImageAsBase64(url) {
  try {
    // Try direct fetch first (works if CORS allows it)
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // data:image/jpeg;base64,...
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null; // image unavailable — skip gracefully
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   COLLECT ALL IMAGES from carDetails and enquiry attachments
   Returns: [{ url, caption, part, section }]
   ══════════════════════════════════════════════════════════════════════════════ */
function collectAllImages(enq, car) {
  const images = [];

  // Enquiry attachments
  enq?.attachments?.forEach(att => {
    images.push({ url: att.url, caption: att.fileName, part: 'Attachment', section: 'Enquiry' });
  });

  if (!car) return images;

  // car_details.images
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
    const singles = ['alloy_wheel', 'apron', 'bonnet_hood', 'boot_floor', 'cowl_top',
      'dicky_boot_door', 'firewall', 'head_light_support', 'lower_cross_member',
      'radiator_support', 'roof', 'upper_cross_member'];

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

  // Electricals interior images
  car.electricals_interior?.images?.forEach(img => {
    images.push({ url: img.url, caption: img.caption, part: 'Interior', section: 'Interior' });
  });
  car.electricals_interior?.interior?.images?.forEach(img => {
    images.push({ url: img.url, caption: img.caption, part: 'Interior Cabin', section: 'Interior' });
  });

  // Engine images
  ['engine', 'battery'].forEach(key => {
    car.engine_transmission?.[key]?.images?.forEach(img => {
      images.push({ url: img.url, caption: img.caption, part: key, section: 'Engine' });
    });
  });

  return images;
}

/* ══════════════════════════════════════════════════════════════════════════════
   PDF GENERATOR
   ══════════════════════════════════════════════════════════════════════════════ */
async function generateEnquiryPDF(enq, car, onProgress) {
  // ── 1. Load jsPDF ─────────────────────────────────────────────────────────
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210; const PH = 297; const ML = 14; const MR = 14; const CW = PW - ML - MR;

  // ── 2. Pre-fetch all images ────────────────────────────────────────────────
  onProgress?.('Collecting images…');
  const allImages = collectAllImages(enq, car);
  onProgress?.(`Fetching ${allImages.length} image(s)…`);
  const imageDataMap = {};
  await Promise.all(
    allImages.map(async (img) => {
      if (img.url && !imageDataMap[img.url]) {
        imageDataMap[img.url] = await fetchImageAsBase64(img.url);
      }
    })
  );
  onProgress?.('Building PDF…');

  // ── 3. Colour palette ──────────────────────────────────────────────────────
  const C = {
    navy: [15, 28, 60], teal: [45, 212, 191], tealDark: [13, 148, 136],
    white: [255, 255, 255], g50: [248, 250, 252], g100: [241, 245, 249],
    g200: [226, 232, 240], g300: [203, 213, 225], g400: [148, 163, 184],
    g500: [100, 116, 139], g600: [71, 85, 105], g700: [51, 65, 85],
    g800: [30, 41, 59], g900: [15, 23, 42],
    green: [52, 211, 153], red: [248, 113, 113], amber: [251, 191, 36], orange: [249, 115, 22],
  };

  // ── 4. Drawing helpers ─────────────────────────────────────────────────────
  const setF = (...c) => doc.setFillColor(...(c.length === 1 ? c[0] : c));
  const setT = (...c) => doc.setTextColor(...(c.length === 1 ? c[0] : c));
  const setD = (...c) => doc.setDrawColor(...(c.length === 1 ? c[0] : c));
  const lw = (w) => doc.setLineWidth(w);
  const R = (x, y, w, h, s = 'F') => doc.rect(x, y, w, h, s);
  const RR = (x, y, w, h, r, s = 'F') => doc.roundedRect(x, y, w, h, r, r, s);
  const L = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
  const font = (style, size) => { doc.setFont('helvetica', style); doc.setFontSize(size); };
  const write = (text, x, y, opts = {}) => {
    const s = String(text ?? '—');
    const o = {};
    if (opts.align) o.align = opts.align;
    if (opts.maxWidth) o.maxWidth = opts.maxWidth;
    doc.text(s, x, y, Object.keys(o).length ? o : undefined);
  };
  const hexRGB = (h) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [150, 150, 150];
  };
  const lighten = (rgb, amount = 0.88) => rgb.map(v => Math.round(v + (255 - v) * amount));

  // ── 5. Page chrome ────────────────────────────────────────────────────────
  let pageNum = 0;
  const addPage = (sectionTitle = '') => {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    setF(C.navy); R(0, 0, PW, 20);
    setT(C.white); font('bold', 12); write('AutoInspect', ML, 9);
    setF(C.teal); R(ML, 10.5, 26, 0.7);
    setT(C.g400); font('normal', 6.5);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    write(`ENQUIRY REPORT  ·  ${enq?.enquiryId || '—'}  ·  ${dateStr}`, PW - MR, 8, { align: 'right' });
    if (sectionTitle) { setT(C.teal); font('bold', 8); write(sectionTitle.toUpperCase(), ML, 15.5); }
    if (pageNum > 1) { setT(C.g400); font('normal', 6.5); write(`${pageNum}`, PW - MR, 15.5, { align: 'right' }); }
    setF(C.navy); R(0, PH - 9, PW, 9);
    setT(C.g500); font('normal', 5.5);
    write('Confidential  ·  For internal use only  ·  AutoInspect', PW / 2, PH - 3.5, { align: 'center' });
    return 24;
  };

  // ── 6. Layout helpers ─────────────────────────────────────────────────────
  const sectionBar = (label, y, x = ML, w = CW) => {
    setF(C.g100); setD(C.g200); lw(0.15); RR(x, y, w, 6.5, 1.5, 'FD');
    setF(C.teal); R(x, y, 3, 6.5);
    setT(C.g800); font('bold', 7.5); write(label.toUpperCase(), x + 6, y + 4.5);
    return y + 9.5;
  };
  const kvRow = (label, value, x, y, w, alt = false) => {
    const ROW_H = 6;
    if (alt) { setF(C.g50); R(x, y, w, ROW_H, 'F'); }
    setT(C.g400); font('normal', 7); write(label, x + 2, y + 4);
    setT(C.g700); font('bold', 7);
    const val = String(value ?? '—');
    const maxW = w * 0.52;
    const lines = doc.splitTextToSize(val, maxW);
    write(lines[0] + (lines.length > 1 ? '…' : ''), x + w - 2, y + 4, { align: 'right' });
    setD(C.g200); lw(0.1); L(x, y + ROW_H, x + w, y + ROW_H);
    return y + ROW_H;
  };
  const infoBlock = (pairs, x, y, w, title = null) => {
    let cy = title ? sectionBar(title, y, x, w) : y;
    pairs.forEach(([lbl, val], i) => { cy = kvRow(lbl, val, x, cy, w, i % 2 === 1); });
    return cy + 3;
  };
  const statusPill = (status, x, y) => {
    const label = statusConfig[status]?.label || status || 'Unknown';
    const hex = STATUS_HEX[status] || '#9ca3af';
    const rgb = hexRGB(hex);
    setF(lighten(rgb, 0.85)); RR(x, y - 3.5, 26, 5.5, 2.5);
    doc.setFillColor(...rgb); doc.circle(x + 3.8, y, 1.2, 'F');
    setT(rgb); font('bold', 6.5); write(label, x + 6.5, y + 0.8);
  };
  const priorityPill = (priority, x, y) => {
    const label = (priority || '').toUpperCase();
    const hex = PRIORITY_HEX[priority] || '#9ca3af';
    const rgb = hexRGB(hex);
    setF(lighten(rgb, 0.88)); RR(x, y - 3.5, 22, 5.5, 2.5);
    setT(rgb); font('bold', 6.5); write(label, x + 11, y + 0.8, { align: 'center' });
  };
  const inspTable = (rows, x, y, colW, headers) => {
    let cy = y;
    const TW = colW.reduce((a, b) => a + b, 0);
    const ROW_H = 6.5;
    setF(C.g800); R(x, cy, TW, 7);
    setT(C.white); font('bold', 7.5);
    let cx = x;
    headers.forEach((h, i) => { write(h, cx + 2, cy + 4.8); cx += colW[i]; });
    cy += 7;
    rows.forEach((row, ri) => {
      if (cy + ROW_H > PH - 12) {
        cy = addPage('Continued…');
        setF(C.g800); R(x, cy, TW, 7);
        setT(C.white); font('bold', 7.5);
        cx = x; headers.forEach((h, i) => { write(h, cx + 2, cy + 4.8); cx += colW[i]; });
        cy += 7;
      }
      setF(ri % 2 === 0 ? C.white : C.g50); R(x, cy, TW, ROW_H, 'F');
      setD(C.g200); lw(0.1); R(x, cy, TW, ROW_H, 'S');
      cx = x;
      row.forEach((cell, ci) => {
        if (ci === 2) {
          const isOk = cell === '✓';
          setT(isOk ? C.green : C.red); font('bold', 10);
          write(cell, cx + colW[ci] / 2, cy + 4.7, { align: 'center' });
        } else {
          setT(ci === 0 ? C.g700 : C.g500); font(ci === 0 ? 'bold' : 'normal', 7);
          const lines = doc.splitTextToSize(String(cell ?? '—'), colW[ci] - 4);
          write(lines[0] + (lines.length > 1 ? '…' : ''), cx + 2, cy + 4.3);
        }
        cx += colW[ci];
      });
      cy += ROW_H;
    });
    return cy + 3;
  };

  // Helper to add image to PDF safely
  const addImageToPDF = (dataUrl, x, y, w, h) => {
    if (!dataUrl) return false;
    try {
      const fmt = dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(dataUrl, fmt, x, y, w, h, undefined, 'FAST');
      return true;
    } catch { return false; }
  };

  // ── 7. Build pages ────────────────────────────────────────────────────────

  /* ═══ PAGE 1 — COVER ═══════════════════════════════════════════════════ */
  let y = addPage();

  setF(C.g50); setD(C.g200); lw(0.2); RR(ML, y, CW, 30, 2, 'FD');
  setF(C.teal); R(ML, y, 4, 30);
  const titleStr = String(enq?.description || enq?.title || 'Enquiry Report');
  setT(C.g900); font('bold', 13);
  const titleLines = doc.splitTextToSize(titleStr, CW - 30);
  write(titleLines[0] + (titleLines.length > 1 ? '…' : ''), ML + 8, y + 10);
  statusPill(enq?.status, ML + 8, y + 20);
  priorityPill(enq?.priority, ML + 38, y + 20);
  setF(C.navy); RR(PW - MR - 40, y + 3, 38, 8, 2);
  setT(C.teal); font('bold', 7); write(enq?.enquiryId || '—', PW - MR - 2, y + 8.5, { align: 'right' });
  setT(C.g400); font('normal', 6.5); write(new Date(enq?.createdAt).toLocaleString('en-IN'), PW - MR - 2, y + 22, { align: 'right' });
  y += 35;

  const LW = CW * 0.42; const RW = CW - LW - 5; const LX = ML; const RX = ML + LW + 5;

  // Left column
  setF(C.g50); setD(C.g200); lw(0.15); RR(LX, y, LW, 36, 2, 'FD');
  setF(C.teal); doc.circle(LX + 10, y + 10, 7, 'F');
  setT(C.white); font('bold', 9);
  const initials = `${enq?.userId?.firstName?.[0] || ''}${enq?.userId?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  write(initials, LX + 10, y + 12.5, { align: 'center' });
  setT(C.g800); font('bold', 9);
  write(`${enq?.userId?.firstName || ''} ${enq?.userId?.lastName || ''}`.trim() || 'Unknown', LX + 20, y + 8);
  setT(C.g400); font('normal', 6.5);
  write(enq?.userId?.email || '—', LX + 20, y + 14, { maxWidth: LW - 22 });
  write(enq?.userId?.phone || '—', LX + 20, y + 20, { maxWidth: LW - 22 });
  setD(C.g200); lw(0.2); L(LX + 3, y + 24, LX + LW - 3, y + 24);
  setT(C.g500); font('normal', 6.5); write('Contact', LX + 4, y + 30);
  setT(C.g700); font('bold', 7); write(enq?.contactNumber || '—', LX + LW - 3, y + 30, { align: 'right' });
  let leftY = y + 40;

  // Service cost card
  setF(C.g50); setD(C.g200); lw(0.15); RR(LX, leftY, LW, 30, 2, 'FD');
  setT(C.g400); font('bold', 6.5); write('SERVICE COST', LX + 4, leftY + 6);
  setF(C.g100); RR(LX + 3, leftY + 9, LW - 6, 7, 1);
  setT(C.g500); font('normal', 6.5); write('Estimated', LX + 5, leftY + 14);
  setT(C.amber); font('bold', 8);
  write(enq?.estimatedCost > 0 ? `Rs.${Number(enq.estimatedCost).toLocaleString('en-IN')}` : '—', LX + LW - 5, leftY + 14, { align: 'right' });
  const tealBg = lighten(C.teal, 0.92);
  setF(tealBg); RR(LX + 3, leftY + 18, LW - 6, 7, 1);
  setT(C.g500); font('normal', 6.5); write('Actual', LX + 5, leftY + 23);
  setT(C.green); font('bold', 8);
  write(enq?.actualCost > 0 ? `Rs.${Number(enq.actualCost).toLocaleString('en-IN')}` : '—', LX + LW - 5, leftY + 23, { align: 'right' });
  leftY += 34;

  // Additional info box
  if (enq?.additionalInfo) {
    setF(lighten(C.teal, 0.93)); setD(C.g200); lw(0.1); RR(LX, leftY, LW, 16, 2, 'FD');
    setT(C.g500); font('bold', 6); write('ADDITIONAL INFO', LX + 4, leftY + 5);
    setT(C.g700); font('normal', 6.5);
    const aiLines = doc.splitTextToSize(enq.additionalInfo, LW - 8);
    aiLines.slice(0, 2).forEach((line, i) => write(line, LX + 4, leftY + 10 + i * 4));
    leftY += 20;
  }

  // Right column
  let rightY = y;
  const enqPairs = [
    ['Enquiry ID', enq?.enquiryId],
    ['Type', enq?.enquiryType],
    ['Severity', enq?.severity],
    ['Inspection Type', enq?.inspectionType],
    ['Assigned To', enq?.assignedTo || 'Unassigned'],
    ['Schedule Date', enq?.scheduleDate ? new Date(enq.scheduleDate).toLocaleDateString('en-IN') : '—'],
    ['Schedule Time', enq?.scheduleTime || '—'],
    ['Created At', new Date(enq?.createdAt).toLocaleString('en-IN')],
    ['Updated At', new Date(enq?.updatedAt).toLocaleString('en-IN')],
  ];
  rightY = infoBlock(enqPairs, RX, rightY, RW, 'Enquiry Details');

  if (enq?.sellingDetails) {
    const sd = enq.sellingDetails;
    const sellPairs = [
      ['Expected Price', sd.expectedPrice != null ? `Rs.${Number(sd.expectedPrice).toLocaleString('en-IN')}` : '—'],
      ['City', sd.city],
      ['Fuel Type', sd.fuelType],
      ['Transmission', sd.transmission],
      ['Ownership', sd.ownership],
      ['KM Driven', sd.kilometersDriven != null ? Number(sd.kilometersDriven).toLocaleString('en-IN') : '—'],
      ['Accident History', sd.accidentHistory],
      ['Service History', sd.serviceHistoryAvailable ? 'Available' : 'Not Available'],
    ];
    rightY = infoBlock(sellPairs, RX, rightY + 3, RW, 'Selling Details');
  }

  // Notes
  y = Math.max(leftY, rightY) + 4;
  if (enq?.notes?.length > 0) {
    y = sectionBar('Notes', y);
    enq.notes.slice(0, 6).forEach((note) => {
      if (y > PH - 20) { y = addPage('Notes'); }
      setF(C.amber); R(ML, y, 2.5, 9);
      setT(C.g400); font('normal', 6);
      write(`${note.addedBy?.firstName || ''} ${note.addedBy?.lastName || ''}  ·  ${new Date(note.addedAt).toLocaleString('en-IN')}`, ML + 5, y + 4);
      setT(C.g600); font('normal', 7);
      const noteLines = doc.splitTextToSize(String(note.text || ''), CW - 8);
      write(noteLines[0] + (noteLines.length > 1 ? '…' : ''), ML + 5, y + 9);
      y += 14;
    });
  }

  /* ═══ PAGE 2 — CAR DETAILS ════════════════════════════════════════════ */
  if (car) {
    y = addPage('Car Details');
    const cd = car.car_details || {};
    const HW = (CW - 5) / 2;
    const regPairs = [
      ['Make', cd.make],
      ['Model', cd.model],
      ['Variant', cd.variant],
      ['Year of Mfg', cd.year_of_manufacturing],
      ['Mfg Month/Year', `${cd.manufacturing_month || '—'} ${cd.manufacturing_year || ''}`],
      ['Registration No.', cd.registration_number?.toUpperCase()],
      ['Reg Month/Year', `${cd.registration_month || '—'} ${cd.registration_year || ''}`],
      ['Chassis No.', cd.chassis_number],
      ['Chassis Embossing', cd.chassis_embossing],
      ['Odometer', cd.odometer_reading != null ? `${Number(cd.odometer_reading).toLocaleString('en-IN')} km` : '—'],
      ['Fuel Type', cd.fuel_type],
      ['No. of Owners', cd.no_of_owners],
      ['Branch', cd.branch],
      ['Inspection At', cd.inspection_at],
    ];
    infoBlock(regPairs, ML, y, HW, 'Registration & Identity');
    const rtoPairs = [
      ['RTO', cd.rto],
      ['City', cd.reg_city],
      ['State', cd.reg_state || '—'],
      ['Road Tax', cd.road_tax_paid],
      ['Tax Validity', cd.road_tax_validity ? new Date(cd.road_tax_validity).toLocaleDateString('en-IN') : '—'],
      ['Fitness Upto', cd.fitness_upto ? new Date(cd.fitness_upto).toLocaleDateString('en-IN') : '—'],
      ['Insurance', cd.insurance_type],
      ['RC Availability', cd.rc_availability],
      ['RC Condition', cd.rc_condition],
      ['Mismatch in RC', cd.mismatch_in_rc ? 'Yes' : 'No'],
      ['Under Hyp.', cd.under_hypothecation ? 'Yes' : 'No'],
      ['RTO NOC Issued', cd.rto_noc_issued ? 'Yes' : 'No'],
      ['CNG/LPG in RC', cd.cng_lpg_fitment_in_rc ? 'Yes' : 'No'],
      ['Duplicate Key', cd.duplicate_key ? 'Yes' : 'No'],
      ['Source', car.source],
      ['To Be Scrapped', cd.to_be_scrapped ? 'Yes' : 'No'],
    ];
    infoBlock(rtoPairs, ML + HW + 5, y, HW, 'RTO, Tax & Compliance');
  }

  /* ═══ PAGE 3 — EXTERIOR FULL TABLE ════════════════════════════════════ */
  if (car?.exterior_tyres) {
    y = addPage('Exterior Inspection');
    const et = car.exterior_tyres;
    const rows = [];
    const push = (part, sub, data) => {
      if (!data) return;
      const ok = data.status !== 'issue' && data.status !== 'na';
      const cond = [...(data.conditions || []), ...(data.work_done || [])].filter(Boolean).join(', ');
      rows.push([part, sub, ok ? '✓' : '✗', cond || data.notes || '—']);
    };

    // Bumpers
    push('Bumper', 'Front', et.bumper?.front);
    push('Bumper', 'Rear', et.bumper?.rear);
    // Fenders
    push('Fender', 'LHS', et.fender?.lhs);
    push('Fender', 'RHS', et.fender?.rhs);
    // Doors
    ['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear'].forEach(k =>
      push('Door', k.replace(/_/g, ' ').toUpperCase(), et.door?.[k])
    );
    // Pillars
    ['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c'].forEach(k =>
      push('Pillar', k.replace(/_/g, ' ').toUpperCase(), et.pillar?.[k])
    );
    // Running Border
    push('Running Border', 'LHS', et.running_border?.lhs);
    push('Running Border', 'RHS', et.running_border?.rhs);
    // Quarter Panel
    push('Quarter Panel', 'LHS', et.quarter_panel?.lhs);
    push('Quarter Panel', 'RHS', et.quarter_panel?.rhs);
    // Windshield
    push('Windshield', 'Front', et.windshield?.front);
    push('Windshield', 'Rear', et.windshield?.rear);
    // ORVM
    push('ORVM', 'LHS', et.orvm?.lhs);
    push('ORVM', 'RHS', et.orvm?.rhs);
    // Lights
    ['lhs_headlight', 'lhs_taillight', 'rhs_headlight', 'rhs_taillight'].forEach(k =>
      push('Light', k.replace(/_/g, ' ').toUpperCase(), et.lights?.[k])
    );
    // Tyres
    ['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear', 'spare'].forEach(k =>
      push('Tyre', k.replace(/_/g, ' ').toUpperCase(), et.tyres?.[k])
    );
    // Single-panel items
    const singlePanels = ['alloy_wheel', 'apron', 'bonnet_hood', 'boot_floor', 'cowl_top',
      'dicky_boot_door', 'firewall', 'head_light_support', 'lower_cross_member',
      'radiator_support', 'roof', 'upper_cross_member'];
    singlePanels.forEach(k => {
      if (et[k]) push(k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), '—', et[k]);
    });

    const cw = [38, 32, 12, CW - 38 - 32 - 12];
    y = inspTable(rows, ML, y, cw, ['Part', 'Subpart', 'OK?', 'Condition / Work Done']);

    // Extra fields
    const extraPairs = [
      ['Jack Tool Available', et.jack_tool_available ? 'Yes' : 'No'],
    ];
    if (et.comments) extraPairs.push(['Comments', et.comments]);
    if (extraPairs.length > 0 && y < PH - 25) {
      y = sectionBar('Additional Notes', y + 2);
      extraPairs.forEach(([lbl, val]) => {
        setT(C.g500); font('normal', 7); write(lbl + ':', ML + 2, y + 4);
        setT(C.g700); font('bold', 7); write(String(val), ML + 50, y + 4);
        y += 7;
      });
    }
  }

  /* ═══ PAGE 4 — ELECTRICALS + ENGINE ═══════════════════════════════════ */
  y = addPage('Electricals + Engine');
  if (car?.electricals_interior) {
    const ei = car.electricals_interior;
    const isOk = (v) => v && v !== 'issue' && v !== 'na' ? '✓' : '✗';
    const intRows = [
      ['Power Windows',   `${ei.no_of_power_windows || '—'} windows`, isOk(ei.power_windows), '—'],
      ['ABS',             '—', isOk(ei.abs?.status), ei.abs?.warning_light_glowing ? 'Warning Light Glowing' : '—'],
      ['Airbags',         `${ei.no_of_airbags || '—'} airbags`, isOk(ei.airbag_feature), '—'],
      ['Music System',    '—', isOk(ei.music_system?.status), ei.music_system?.conditions?.join(', ') || '—'],
      ['Leather Seat',    '—', isOk(ei.leather_seat?.status), ei.leather_seat?.conditions?.join(', ') || '—'],
      ['Fabric Seat',     '—', isOk(ei.fabric_seat), '—'],
      ['Sunroof',         '—', isOk(ei.sunroof), '—'],
      ['Door Trim',       '—', isOk(ei.door_trim?.status), ei.door_trim?.conditions?.join(', ') || '—'],
      ['Roof Lining',     '—', isOk(ei.roof_lining?.status), ei.roof_lining?.conditions?.join(', ') || '—'],
      ['Rear Defogger',   '—', isOk(ei.rear_defogger), '—'],
      ['Reverse Camera',  '—', isOk(ei.reverse_camera), '—'],
      ['Parking Sensor',  '—', isOk(ei.parking_sensor), '—'],
      ['Navigation Chip', '—', isOk(ei.navigation_chip), '—'],
      ['Steering Audio',  '—', isOk(ei.steering_mounted_audio_control), '—'],
      ['Electrical',      '—', isOk(ei.electrical), '—'],
      ['Remote Key',      ei.remote_key?.available ? 'Available' : 'Not Available', isOk(ei.remote_key?.available ? 'ok' : 'issue'), ei.remote_key?.notes || '—'],
      ['Interior Cabin',  '—', isOk(ei.interior?.status), (ei.interior?.conditions || []).join(', ') || '—'],
    ];
    const cw = [44, 28, 12, CW - 44 - 28 - 12];
    y = inspTable(intRows, ML, y, cw, ['Feature', 'Detail', 'OK?', 'Remarks']);
    y += 5;
  }

  if (car?.engine_transmission) {
    const eng = car.engine_transmission;
    const isOk = (v) => v && v !== 'issue' && v !== 'na' ? '✓' : '✗';
    const joinCond = (data) => {
      const parts = [];
      if (data?.conditions?.length) parts.push(data.conditions.join(', '));
      if (data?.work_done?.length) parts.push(data.work_done.join(', '));
      const bools = [];
      Object.entries(data || {}).forEach(([k, v]) => {
        if (typeof v === 'boolean' && v && k !== 'status') bools.push(k.replace(/_/g, ' '));
      });
      if (bools.length) parts.push(bools.join(', '));
      return parts.join(' | ') || '—';
    };
    const engRows = [
      ['Engine',           '—', isOk(eng.engine?.status),          joinCond(eng.engine)],
      ['Battery',          '—', isOk(eng.battery?.status),          joinCond(eng.battery)],
      ['Engine Oil',       '—', isOk(eng.engine_oil?.status),       joinCond(eng.engine_oil)],
      ['Coolant',          '—', isOk(eng.coolant?.status),          joinCond(eng.coolant)],
      ['Engine Mounting',  '—', isOk(eng.engine_mounting?.status),  joinCond(eng.engine_mounting)],
      ['Engine Sound',     '—', isOk(eng.engine_sound?.status),     eng.engine_sound?.notes || '—'],
      ['Exhaust Smoke',    '—', isOk(eng.exhaust_smoke?.status),    joinCond(eng.exhaust_smoke)],
      ['Clutch',           '—', isOk(eng.clutch?.status),           joinCond(eng.clutch)],
      ['Gear Shifting',    '—', isOk(eng.gear_shifting?.status),    joinCond(eng.gear_shifting)],
      ['Turbo Charger',    '—', isOk(eng.turbo_charger?.status),    eng.turbo_charger?.whistling_noise ? 'Whistling noise' : '—'],
      ['Fuel Injector',    '—', isOk(eng.fuel_injector?.status),    eng.fuel_injector?.noise ? 'Noise present' : '—'],
      ['Sump',             '—', (!eng.sump?.damaged && !eng.sump?.leakage) ? '✓' : '✗', [eng.sump?.damaged ? 'Damaged' : '', eng.sump?.leakage ? 'Leakage' : ''].filter(Boolean).join(', ') || '—'],
      ['Radiator Fan',     '—', isOk(eng.radiator_fan_motor?.status), eng.radiator_fan_motor?.noise ? 'Noise present' : '—'],
    ];
    if (y > PH - 100) { y = addPage('Engine + Transmission'); }
    y = sectionBar('Engine + Transmission', y);
    const cw = [44, 28, 12, CW - 44 - 28 - 12];
    y = inspTable(engRows, ML, y, cw, ['Component', 'Detail', 'OK?', 'Remarks']);

    if (eng.towing_recommended) {
      if (y > PH - 15) { y = addPage('Engine Notes'); }
      setF([254, 242, 211]); RR(ML, y + 2, CW, 8, 2);
      setT(C.orange); font('bold', 8); write('⚠  TOWING RECOMMENDED', ML + 4, y + 7);
      y += 12;
    }
  }

  // Steering / Suspension / Brakes
  if (car?.steering_suspension_brakes) {
    const ssb = car.steering_suspension_brakes;
    const isOk = (v) => v && v !== 'issue' && v !== 'na' ? '✓' : '✗';
    const ssbRows = [
      ['Steering',   '—', isOk(ssb.steering?.status), [ssb.steering?.abnormal_noise ? 'Abnormal noise' : '', ssb.steering?.hard ? 'Hard steering' : ''].filter(Boolean).join(', ') || '—'],
      ['Suspension', '—', isOk(ssb.suspension?.status), ssb.suspension?.abnormal_noise ? 'Abnormal noise' : '—'],
      ['Brakes',     '—', isOk(ssb.brake?.status), ssb.brake?.noisy ? 'Noisy brakes' : '—'],
    ];
    if (y > PH - 50) { y = addPage('Steering, Suspension & Brakes'); }
    y = sectionBar('Steering, Suspension & Brakes', y + 3);
    const cw = [44, 28, 12, CW - 44 - 28 - 12];
    y = inspTable(ssbRows, ML, y, cw, ['Component', 'Detail', 'OK?', 'Remarks']);
    if (ssb.comments) {
      setT(C.g600); font('normal', 7); write(ssb.comments, ML + 2, y + 4);
      y += 8;
    }
  }

  /* ═══ PAGE 5 — PHOTO GALLERY ══════════════════════════════════════════ */
  const imagesWithData = allImages.filter(img => imageDataMap[img.url]);

  if (imagesWithData.length > 0) {
    y = addPage('Photo Gallery');

    // Gallery header banner
    setF(lighten(C.teal, 0.93)); setD(C.g200); lw(0.1);
    RR(ML, y, CW, 10, 2, 'FD');
    setF(C.teal); R(ML, y, 3, 10);
    setT(C.g800); font('bold', 8);
    write(`INSPECTION PHOTOS  (${imagesWithData.length} image${imagesWithData.length !== 1 ? 's' : ''})`, ML + 7, y + 6.5);
    y += 14;

    // Group images by section
    const grouped = {};
    imagesWithData.forEach(img => {
      if (!grouped[img.section]) grouped[img.section] = [];
      grouped[img.section].push(img);
    });

    const IMG_W = (CW - 4) / 3;   // 3 columns
    const IMG_H = IMG_W * 0.70;   // ~16:11 ratio
    const LABEL_H = 8;
    const CELL_H = IMG_H + LABEL_H + 2;
    const COLS = 3;

    for (const [section, imgs] of Object.entries(grouped)) {
      // Section label
      if (y + 10 > PH - 12) { y = addPage('Photo Gallery (Continued)'); }
      setT(C.teal); font('bold', 7.5);
      write(section.toUpperCase(), ML, y + 5);
      setF(C.teal); R(ML, y + 6.5, CW, 0.5);
      y += 10;

      let col = 0;
      for (const img of imgs) {
        if (y + CELL_H > PH - 12) {
          y = addPage('Photo Gallery (Continued)');
          col = 0;
        }

        const x = ML + col * (IMG_W + 2);

        // Image frame
        setF(C.g100); setD(C.g200); lw(0.2);
        RR(x, y, IMG_W, IMG_H, 1.5, 'FD');

        const placed = addImageToPDF(imageDataMap[img.url], x + 0.5, y + 0.5, IMG_W - 1, IMG_H - 1);
        if (!placed) {
          // placeholder if image failed
          setF(C.g200); RR(x + 0.5, y + 0.5, IMG_W - 1, IMG_H - 1, 1);
          setT(C.g400); font('normal', 7);
          write('Image unavailable', x + IMG_W / 2, y + IMG_H / 2, { align: 'center' });
        }

        // Caption below image
        setT(C.g600); font('bold', 6);
        const capText = img.part?.replace(/\b\w/g, c => c.toUpperCase()) || 'Photo';
        const capLines = doc.splitTextToSize(capText, IMG_W - 2);
        write(capLines[0], x + IMG_W / 2, y + IMG_H + 4, { align: 'center' });

        // Status badge on top-right corner if available
        const imgSource = imagesWithData.find(i => i.url === img.url);
        if (imgSource?.section) {
          setF(lighten(C.teal, 0.85)); RR(x + IMG_W - 18, y + 1.5, 16, 4, 1.5);
          setT(C.tealDark); font('bold', 4.5);
          write(imgSource.section.slice(0, 10), x + IMG_W - 10, y + 4.5, { align: 'center' });
        }

        col++;
        if (col >= COLS) { col = 0; y += CELL_H + 3; }
      }
      if (col > 0) { y += CELL_H + 3; col = 0; }
      y += 4;
    }
  } else {
    // No images page note
    y = addPage('Photo Gallery');
    setF(C.g100); setD(C.g200); lw(0.15); RR(ML, y + 10, CW, 20, 2, 'FD');
    setT(C.g400); font('normal', 9);
    write('No inspection photos available for this enquiry.', PW / 2, y + 23, { align: 'center' });
    y += 35;
  }

  /* ═══ PAGE 6 — CUSTOMER JOURNEY ════════════════════════════════════════ */
  if (enq?.customerJourney?.timeline?.length > 0) {
    y = addPage('Customer Journey Timeline');

    // Journey summary card
    setF(C.g50); setD(C.g200); lw(0.15); RR(ML, y, CW, 14, 2, 'FD');
    setF(C.teal); R(ML, y, 3, 14);
    setT(C.g500); font('normal', 7); write('Current Step', ML + 7, y + 5);
    setT(C.g800); font('bold', 9);
    write((enq.customerJourney.currentStep || '—').toUpperCase(), ML + 7, y + 11);
    if (enq.customerJourney.actualCompletion) {
      setT(C.g500); font('normal', 6.5);
      write('Completed: ' + new Date(enq.customerJourney.actualCompletion).toLocaleString('en-IN'), PW - MR - 2, y + 9, { align: 'right' });
    }
    y += 20;

    enq.customerJourney.timeline.forEach((step, i) => {
      if (y > PH - 22) { y = addPage('Timeline Continued'); }
      const hasNext = i < enq.customerJourney.timeline.length - 1;
      setF(C.teal); doc.circle(ML + 4, y + 4, 2.8, 'F');
      if (hasNext) { setD(C.g300); lw(0.4); L(ML + 4, y + 6.8, ML + 4, y + 17); }
      setT(C.g800); font('bold', 8); write(String(step.step || '').toUpperCase(), ML + 10, y + 5);
      setT(C.g500); font('normal', 7);
      const descLines = doc.splitTextToSize(String(step.description || '—'), CW - 14);
      write(descLines[0] + (descLines.length > 1 ? '…' : ''), ML + 10, y + 10.5);
      if (step.timestamp) {
        setT(C.g400); font('normal', 6);
        write(new Date(step.timestamp).toLocaleString('en-IN'), ML + 10, y + 16);
        y += 20;
      } else { y += 15; }
    });
  }

  /* ═══ SAVE ════════════════════════════════════════════════════════════ */
  const fileName = `Enquiry_${enq?.enquiryId || 'Report'}_${Date.now()}.pdf`;
  doc.save(fileName);
}

/* ══════════════════════════════════════════════════════════════════════════════
   REACT COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
const EnquiryDetailPage = ({ enquiryId, onBack }) => {
  const [detail,      setDetail]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  const token      = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    if (!enquiryId) return;
    setLoading(true); setError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/byID/${enquiryId}`, { headers: authHeader() })
      .then(res => setDetail(res.data))
      .catch(err => { console.error(err); setError('Failed to load enquiry details. Please try again.'); })
      .finally(() => setLoading(false));
  }, [enquiryId]);

  // Support both response shapes: { data: enq, carDetails: car } or { data: { carDetails, ...enq } }
  const enq = detail?.data?.enquiryId ? detail.data : detail?.data;
  const car = detail?.carDetails || detail?.data?.carDetails;

  const handleDownloadPDF = async () => {
    if (!enq) return;
    setPdfLoading(true);
    setPdfProgress('Preparing…');
    try {
      await generateEnquiryPDF(enq, car, (msg) => setPdfProgress(msg));
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfProgress('Failed');
    } finally {
      setPdfLoading(false);
      setPdfProgress('');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'car',      label: 'Car Details' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'interior', label: 'Interior' },
    { key: 'engine',   label: 'Engine' },
    { key: 'journey',  label: 'Journey' },
  ];

  // Collect all images for the Photos tab
  const allPhotos = (enq && car) ? collectAllImages(enq, car) : [];

  return (
    <div className="w-full min-h-screen">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.07] text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-all text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          {!loading && enq && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white/20 text-sm">/</span>
              <span className="text-white/40 text-sm font-mono truncate">{enq.enquiryId}</span>
              <StatusDot status={enq.status} />
            </div>
          )}
        </div>

        {!loading && !error && enq && (
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25 hover:border-teal-500/50 active:scale-95 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {pdfLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span className="hidden sm:inline">{pdfProgress || 'Generating PDF…'}</span>
                <span className="sm:hidden">Generating…</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* ── States ──────────────────────────────────────────────────────── */}
      {loading && <PageSkeleton />}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-white/60 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && enq && (
        <>
          <div className="mb-6">
            <h1 className="text-white text-xl font-bold leading-tight">{enq.description || enq.title || 'Enquiry Details'}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <StatusDot status={enq.status} />
              {enq.priority && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                  ${enq.priority === 'high'   ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
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
              <span className="text-white/25 text-xs">{new Date(enq.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] overflow-x-auto w-max max-w-full">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeTab === t.key ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
                }`}>
                {t.label}
              </button>
            ))}
            {allPhotos.length > 0 && (
              <button onClick={() => setActiveTab('photos')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeTab === 'photos' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
                }`}>
                Photos ({allPhotos.length})
              </button>
            )}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-5">
                <Card>
                  <SectionLabel>Customer</SectionLabel>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {enq.userId?.firstName?.[0]}{enq.userId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{enq.userId?.firstName} {enq.userId?.lastName}</p>
                      <p className="text-white/40 text-xs">{enq.userId?.email}</p>
                      <p className="text-white/30 text-xs">{enq.userId?.phone}</p>
                    </div>
                  </div>
                  <InfoRow label="Contact Number" value={enq.contactNumber} />
                  {enq.additionalInfo && <InfoRow label="Address" value={enq.additionalInfo} />}
                </Card>
                <Card>
                  <SectionLabel>Service Cost</SectionLabel>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-white/40 text-xs">Estimated</span>
                      <span className="text-amber-400 font-bold text-sm">{enq.estimatedCost > 0 ? `₹${enq.estimatedCost.toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <span className="text-white/40 text-xs">Actual</span>
                      <span className="text-emerald-400 font-bold text-sm">{enq.actualCost > 0 ? `₹${enq.actualCost.toLocaleString()}` : '—'}</span>
                    </div>
                  </div>
                </Card>
                {enq.sellingDetails && (
                  <Card>
                    <SectionLabel>Selling Details</SectionLabel>
                    <InfoRow label="Expected Price"   value={enq.sellingDetails.expectedPrice != null ? `₹${enq.sellingDetails.expectedPrice.toLocaleString()}` : null} />
                    <InfoRow label="City"             value={enq.sellingDetails.city} />
                    <InfoRow label="Fuel Type"        value={enq.sellingDetails.fuelType} />
                    <InfoRow label="Transmission"     value={enq.sellingDetails.transmission} />
                    <InfoRow label="Ownership"        value={enq.sellingDetails.ownership} />
                    <InfoRow label="KM Driven"        value={enq.sellingDetails.kilometersDriven?.toLocaleString()} />
                    <InfoRow label="Accident History" value={enq.sellingDetails.accidentHistory} />
                    <InfoRow label="Service History"  value={enq.sellingDetails.serviceHistoryAvailable ? 'Available' : 'Not Available'} />
                  </Card>
                )}
              </div>
              <div className="lg:col-span-2 space-y-5">
                <Card>
                  <SectionLabel>Enquiry Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-x-8">
                    <InfoRow label="Enquiry ID"      value={enq.enquiryId} />
                    <InfoRow label="Type"            value={enq.enquiryType} />
                    <InfoRow label="Severity"        value={enq.severity} />
                    <InfoRow label="Inspection Type" value={enq.inspectionType} />
                    <InfoRow label="Assigned To"     value={enq.assignedTo ?? 'Unassigned'} />
                    <InfoRow label="Schedule Date"   value={enq.scheduleDate ? new Date(enq.scheduleDate).toLocaleDateString() : '—'} />
                    <InfoRow label="Schedule Time"   value={enq.scheduleTime || '—'} />
                    <InfoRow label="Created At"      value={new Date(enq.createdAt).toLocaleString()} />
                    <InfoRow label="Updated At"      value={new Date(enq.updatedAt).toLocaleString()} />
                  </div>
                </Card>
                {enq.attachments?.length > 0 && (
                  <Card>
                    <SectionLabel>Attachments ({enq.attachments.length})</SectionLabel>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {enq.attachments.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="group">
                          <img src={att.url} alt={att.fileName} className="w-full h-16 object-cover rounded-lg border border-white/10 group-hover:border-teal-500/50 transition-all" />
                          <p className="text-white/20 text-[9px] mt-0.5 truncate">{att.fileName}</p>
                        </a>
                      ))}
                    </div>
                  </Card>
                )}
                {enq.notes?.length > 0 && (
                  <Card>
                    <SectionLabel>Notes ({enq.notes.length})</SectionLabel>
                    <div className="space-y-4">
                      {enq.notes.map((note, i) => (
                        <div key={i} className="border-l-2 border-amber-500/40 pl-4">
                          <p className="text-white/30 text-[10px]">{note.addedBy?.firstName} {note.addedBy?.lastName} · {new Date(note.addedAt).toLocaleString()}</p>
                          <p className="text-white/70 text-sm mt-0.5">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {enq.description && (
                  <Card>
                    <SectionLabel>Description</SectionLabel>
                    <p className="text-white/60 text-sm leading-relaxed">{enq.description}</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ── Car Details tab ── */}
          {activeTab === 'car' && (
            !car ? <div className="text-center py-16 text-white/30 text-sm">No car details available</div> :
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Registration & Identity</SectionLabel>
                <InfoRow label="Make"              value={car.car_details?.make} />
                <InfoRow label="Model"             value={car.car_details?.model} />
                <InfoRow label="Variant"           value={car.car_details?.variant} />
                <InfoRow label="Year of Mfg"       value={car.car_details?.year_of_manufacturing} />
                <InfoRow label="Mfg Month/Year"    value={`${car.car_details?.manufacturing_month || '—'} ${car.car_details?.manufacturing_year || ''}`} />
                <InfoRow label="Reg No."           value={car.car_details?.registration_number?.toUpperCase()} />
                <InfoRow label="Reg Month/Year"    value={`${car.car_details?.registration_month || '—'} ${car.car_details?.registration_year || ''}`} />
                <InfoRow label="Chassis Number"    value={car.car_details?.chassis_number} />
                <InfoRow label="Chassis Embossing" value={car.car_details?.chassis_embossing} />
                <InfoRow label="Odometer"          value={car.car_details?.odometer_reading != null ? `${car.car_details.odometer_reading.toLocaleString()} km` : null} />
                <InfoRow label="Fuel Type"         value={car.car_details?.fuel_type} />
                <InfoRow label="No. of Owners"     value={car.car_details?.no_of_owners} />
                <InfoRow label="Branch"            value={car.car_details?.branch} />
                <InfoRow label="Inspection At"     value={car.car_details?.inspection_at} />
              </Card>
              <Card>
                <SectionLabel>RTO, Tax & Compliance</SectionLabel>
                <InfoRow label="RTO"              value={car.car_details?.rto} />
                <InfoRow label="City"             value={car.car_details?.reg_city} />
                <InfoRow label="State"            value={car.car_details?.reg_state} />
                <InfoRow label="Road Tax"         value={car.car_details?.road_tax_paid} />
                <InfoRow label="Tax Validity"     value={car.car_details?.road_tax_validity ? new Date(car.car_details.road_tax_validity).toLocaleDateString() : null} />
                <InfoRow label="Fitness Upto"     value={car.car_details?.fitness_upto ? new Date(car.car_details.fitness_upto).toLocaleDateString() : null} />
                <InfoRow label="Insurance"        value={car.car_details?.insurance_type} />
                <InfoRow label="RC Availability"  value={car.car_details?.rc_availability} />
                <InfoRow label="RC Condition"     value={car.car_details?.rc_condition} />
                <InfoRow label="Mismatch in RC"   value={car.car_details?.mismatch_in_rc ? 'Yes' : 'No'} />
                <InfoRow label="Under Hyp."       value={car.car_details?.under_hypothecation ? 'Yes' : 'No'} />
                <InfoRow label="RTO NOC Issued"   value={car.car_details?.rto_noc_issued ? 'Yes' : 'No'} />
                <InfoRow label="CNG/LPG in RC"    value={car.car_details?.cng_lpg_fitment_in_rc ? 'Yes' : 'No'} />
                <InfoRow label="Duplicate Key"    value={car.car_details?.duplicate_key ? 'Yes' : 'No'} />
                <InfoRow label="Source"           value={car.source} />
                <InfoRow label="To Be Scrapped"   value={car.car_details?.to_be_scrapped ? 'Yes' : 'No'} />
              </Card>
              {car.car_details?.images?.length > 0 && (
                <div className="lg:col-span-2">
                  <Card>
                    <SectionLabel>Car Images ({car.car_details.images.length})</SectionLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                      {car.car_details.images.map((img, i) => (
                        <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="group">
                          <img src={img.url} alt={img.caption} className="w-full h-20 object-cover rounded-lg border border-white/10 group-hover:border-teal-500/50 transition-all" />
                          <p className="text-white/30 text-[9px] mt-0.5 truncate">{img.part?.replace(/_/g, ' ')}</p>
                        </a>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ── Exterior tab ── */}
          {activeTab === 'exterior' && (
            !car?.exterior_tyres ? <div className="text-center py-16 text-white/30 text-sm">No exterior data available</div> :
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card><SectionLabel>Bumpers</SectionLabel>
                <PartRow label="Front Bumper" data={car.exterior_tyres.bumper?.front} />
                <PartRow label="Rear Bumper"  data={car.exterior_tyres.bumper?.rear} />
              </Card>
              <Card><SectionLabel>Fenders</SectionLabel>
                <PartRow label="LHS Fender" data={car.exterior_tyres.fender?.lhs} />
                <PartRow label="RHS Fender" data={car.exterior_tyres.fender?.rhs} />
              </Card>
              <Card><SectionLabel>Doors</SectionLabel>
                {['lhs_front','lhs_rear','rhs_front','rhs_rear'].map(k => <PartRow key={k} label={k} data={car.exterior_tyres.door?.[k]} />)}
              </Card>
              <Card><SectionLabel>Pillars</SectionLabel>
                {['lhs_a','lhs_b','lhs_c','rhs_a','rhs_b','rhs_c'].map(k => <PartRow key={k} label={k} data={car.exterior_tyres.pillar?.[k]} />)}
              </Card>
              <Card><SectionLabel>Windshields</SectionLabel>
                <PartRow label="Front" data={car.exterior_tyres.windshield?.front} />
                <PartRow label="Rear"  data={car.exterior_tyres.windshield?.rear} />
              </Card>
              <Card><SectionLabel>Lights</SectionLabel>
                {['lhs_headlight','lhs_taillight','rhs_headlight','rhs_taillight'].map(k => <PartRow key={k} label={k} data={car.exterior_tyres.lights?.[k]} />)}
              </Card>
              <Card><SectionLabel>Tyres</SectionLabel>
                {['lhs_front','lhs_rear','rhs_front','rhs_rear','spare'].map(k => <PartRow key={k} label={k} data={car.exterior_tyres.tyres?.[k]} />)}
              </Card>
              <Card><SectionLabel>Body Panels</SectionLabel>
                {['bonnet_hood','roof','dicky_boot_door','apron','cowl_top','firewall','boot_floor'].map(k =>
                  car.exterior_tyres[k] ? <PartRow key={k} label={k} data={car.exterior_tyres[k]} /> : null
                )}
              </Card>
              <Card><SectionLabel>Structural</SectionLabel>
                {['radiator_support','head_light_support','upper_cross_member','lower_cross_member','alloy_wheel','orvm'].map(k => {
                  const d = car.exterior_tyres[k] || car.exterior_tyres.orvm;
                  if (k === 'orvm') return (
                    <React.Fragment key={k}>
                      <PartRow label="ORVM LHS" data={car.exterior_tyres.orvm?.lhs} />
                      <PartRow label="ORVM RHS" data={car.exterior_tyres.orvm?.rhs} />
                    </React.Fragment>
                  );
                  return car.exterior_tyres[k] ? <PartRow key={k} label={k} data={car.exterior_tyres[k]} /> : null;
                })}
                <InfoRow label="Jack Tool" value={car.exterior_tyres.jack_tool_available ? 'Available' : 'Not Available'} />
              </Card>
              {car.exterior_tyres.comments && (
                <Card><SectionLabel>Exterior Comments</SectionLabel>
                  <p className="text-white/60 text-sm">{car.exterior_tyres.comments}</p>
                </Card>
              )}
            </div>
          )}

          {/* ── Interior tab ── */}
          {activeTab === 'interior' && (
            !car?.electricals_interior ? <div className="text-center py-16 text-white/30 text-sm">No interior data available</div> :
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Electricals & Features</SectionLabel>
                {[
                  ['Power Windows', car.electricals_interior.power_windows, `${car.electricals_interior.no_of_power_windows || '—'} windows`],
                  ['ABS', car.electricals_interior.abs?.status],
                  ['Airbags', car.electricals_interior.airbag_feature, `${car.electricals_interior.no_of_airbags || '—'} airbags`],
                  ['Music System', car.electricals_interior.music_system?.status],
                  ['Sunroof', car.electricals_interior.sunroof],
                  ['Door Trim', car.electricals_interior.door_trim?.status],
                  ['Leather Seat', car.electricals_interior.leather_seat?.status],
                  ['Fabric Seat', car.electricals_interior.fabric_seat],
                  ['Roof Lining', car.electricals_interior.roof_lining?.status],
                  ['Rear Defogger', car.electricals_interior.rear_defogger],
                  ['Reverse Camera', car.electricals_interior.reverse_camera],
                  ['Parking Sensor', car.electricals_interior.parking_sensor],
                  ['Navigation Chip', car.electricals_interior.navigation_chip],
                  ['Steering Audio', car.electricals_interior.steering_mounted_audio_control],
                  ['Electrical', car.electricals_interior.electrical],
                ].map(([lbl, val, extra]) => (
                  <div key={lbl} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                    <div>
                      <span className="text-white/40 text-xs">{lbl}</span>
                      {extra && <span className="text-white/20 text-[10px] ml-2">{extra}</span>}
                    </div>
                    <ConditionBadge value={val} />
                  </div>
                ))}
              </Card>
              <Card>
                <SectionLabel>Interior Cabin</SectionLabel>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-white/40 text-xs">Cabin Status</span>
                  <ConditionBadge value={car.electricals_interior.interior?.status} />
                </div>
                {car.electricals_interior.interior?.conditions?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">Conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {car.electricals_interior.interior.conditions.map((c, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                <InfoRow label="Remote Key"  value={car.electricals_interior.remote_key?.available ? 'Available' : 'Not Available'} />
                {car.electricals_interior.remote_key?.notes && (
                  <InfoRow label="Remote Key Notes" value={car.electricals_interior.remote_key.notes} />
                )}
                {car.electricals_interior.comments && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <SectionLabel>Interior Comments</SectionLabel>
                    <p className="text-white/60 text-sm">{car.electricals_interior.comments}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── Engine tab ── */}
          {activeTab === 'engine' && (
            !car?.engine_transmission ? <div className="text-center py-16 text-white/30 text-sm">No engine data available</div> :
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Engine & Transmission</SectionLabel>
                <InfoRow label="Engine Status"     value={car.engine_transmission.engine?.status} />
                <InfoRow label="MIL Light"         value={car.engine_transmission.engine?.mil_light_glowing ? 'Glowing' : 'OK'} />
                <InfoRow label="Wiring Damaged"    value={car.engine_transmission.engine?.electrical_wiring_damaged ? 'Yes' : 'No'} />
                <InfoRow label="Air Filter Box"    value={car.engine_transmission.engine?.air_filter_box_damaged ? 'Damaged' : 'OK'} />
                <InfoRow label="Battery Status"    value={car.engine_transmission.battery?.status} />
                <InfoRow label="Battery Leakage"   value={car.engine_transmission.battery?.acid_leakage ? 'Yes' : 'No'} />
                <InfoRow label="Oil Status"        value={car.engine_transmission.engine_oil?.status} />
                <InfoRow label="Oil Leakage"       value={car.engine_transmission.engine_oil?.leakage_from_tappet_cover ? 'Yes' : 'No'} />
                <InfoRow label="Coolant Status"    value={car.engine_transmission.coolant?.status} />
                <InfoRow label="Coolant Dirty"     value={car.engine_transmission.coolant?.dirty ? 'Yes' : 'No'} />
                <InfoRow label="Coolant Level"     value={car.engine_transmission.coolant?.level_low ? 'Low' : 'OK'} />
                <InfoRow label="Engine Mounting"   value={car.engine_transmission.engine_mounting?.status} />
                <InfoRow label="Engine Sound"      value={car.engine_transmission.engine_sound?.status} />
                <InfoRow label="Exhaust Smoke"     value={car.engine_transmission.exhaust_smoke?.status} />
                <InfoRow label="Clutch"            value={car.engine_transmission.clutch?.status} />
                <InfoRow label="Gear Shifting"     value={car.engine_transmission.gear_shifting?.status} />
                <InfoRow label="Turbo Charger"     value={car.engine_transmission.turbo_charger?.status} />
                <InfoRow label="Fuel Injector"     value={car.engine_transmission.fuel_injector?.status} />
                <InfoRow label="Radiator Fan"      value={car.engine_transmission.radiator_fan_motor?.status} />
                <InfoRow label="Towing Recommended" value={car.engine_transmission.towing_recommended ? 'Yes' : 'No'} />
              </Card>
              <Card>
                <SectionLabel>Steering, Suspension & Brakes</SectionLabel>
                <InfoRow label="Steering"           value={car.steering_suspension_brakes?.steering?.status} />
                <InfoRow label="Steering Hard"      value={car.steering_suspension_brakes?.steering?.hard ? 'Yes' : 'No'} />
                <InfoRow label="Steering Noise"     value={car.steering_suspension_brakes?.steering?.abnormal_noise ? 'Yes' : 'No'} />
                <InfoRow label="Suspension"         value={car.steering_suspension_brakes?.suspension?.status} />
                <InfoRow label="Suspension Noise"   value={car.steering_suspension_brakes?.suspension?.abnormal_noise ? 'Yes' : 'No'} />
                <InfoRow label="Brakes"             value={car.steering_suspension_brakes?.brake?.status} />
                <InfoRow label="Brakes Noisy"       value={car.steering_suspension_brakes?.brake?.noisy ? 'Yes' : 'No'} />
                {car.steering_suspension_brakes?.comments && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <p className="text-white/60 text-sm">{car.steering_suspension_brakes.comments}</p>
                  </div>
                )}
                {car.engine_transmission.comments && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <SectionLabel>Engine Comments</SectionLabel>
                    <p className="text-white/60 text-sm">{car.engine_transmission.comments}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── Journey tab ── */}
          {activeTab === 'journey' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Enquiry Journey Info</SectionLabel>
                <InfoRow label="Enquiry ID"     value={enq.enquiryId} />
                <InfoRow label="Type"           value={enq.enquiryType} />
                <InfoRow label="Severity"       value={enq.severity} />
                <InfoRow label="Assigned To"    value={enq.assignedTo ?? 'Unassigned'} />
                <InfoRow label="Schedule Date"  value={enq.scheduleDate ? new Date(enq.scheduleDate).toLocaleDateString() : '—'} />
                <InfoRow label="Schedule Time"  value={enq.scheduleTime || '—'} />
                <InfoRow label="Created At"     value={new Date(enq.createdAt).toLocaleString()} />
                <InfoRow label="Updated At"     value={new Date(enq.updatedAt).toLocaleString()} />
                {enq.customerJourney?.actualCompletion && (
                  <InfoRow label="Completed At" value={new Date(enq.customerJourney.actualCompletion).toLocaleString()} />
                )}
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
                        <p className="text-white/35 text-xs mt-1">{step.description}</p>
                        {step.timestamp && <p className="text-white/20 text-[10px] mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── Photos tab ── */}
          {activeTab === 'photos' && (
            allPhotos.length === 0
              ? <div className="text-center py-16 text-white/30 text-sm">No photos available</div>
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
                            <span className="text-white/25 text-[10px] font-bold tracking-widest uppercase">{section}</span>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                            <span className="text-white/20 text-xs">{imgs.length}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {imgs.map((img, i) => (
                              <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="group block">
                                <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] aspect-[4/3]">
                                  <img
                                    src={img.url}
                                    alt={img.caption}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-white/30 text-[10px] mt-1.5 capitalize truncate px-0.5">{img.part}</p>
                              </a>
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