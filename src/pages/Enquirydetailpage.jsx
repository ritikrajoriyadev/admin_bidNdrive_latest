import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import generateInspectionPDF from '../utls/Generateinspectionpdf';
import PhotoEditorModal from './Photoeditormodal';
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

/* ─── Image grid ─────────────────────────────────────────────────────────── */
const ImageGrid = ({ images, cols = 3, onEditPhoto, section = '' }) => {
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
          <a href={img.url} target="_blank" rel="noopener noreferrer" className="block">
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
            </div>
          </a>
          {onEditPhoto && <EditBtn onClick={() => onEditPhoto({ ...img, section })} />}
        </div>
      ))}
    </div>
  );
};

/* ─── Horizontal image strip ─────────────────────────────────────────────── */
const ImageStrip = ({ images, onEditPhoto, section = '' }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
      {images.map((img, i) => (
        <div key={i} className="group relative flex-shrink-0">
          <a href={img.url} target="_blank" rel="noopener noreferrer" className="block">
            <div className="relative w-[72px] h-[54px] rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.03]">
              <img
                src={img.url}
                alt={img.caption || ''}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-3 h-3 indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          </a>
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

const PartRow = ({ label, data, onEditPhoto, section = '' }) => {
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
      <ImageStrip images={imgs} onEditPhoto={onEditPhoto} section={section} />
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
    <div className="relative w-full max-w-2xl bg-[#0d1117] border-l border-white/[0.08] flex flex-col h-full shadow-2xl">
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
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
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

  // Per-image photo editor
  const [editingPhoto, setEditingPhoto] = useState(null);

  // Section edit panel: null | 'exterior' | 'engine' | 'carDetails' | 'interior'
  const [editSection, setEditSection] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const token = () => localStorage.getItem('adminToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  /* ── Fetch enquiry detail ────────────────────────────────────────────── */
  useEffect(() => {
    if (!enquiryId) return;
    setLoading(true);
    setError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/enquiries/byID/${enquiryId}`, { headers: authHeader() })
      .then(res => setDetail(res.data))
      .catch(err => { console.error(err); setError('Failed to load enquiry details. Please try again.'); })
      .finally(() => setLoading(false));
  }, [enquiryId]);

  const enq = detail?.data?.enquiryId ? detail.data : detail?.data;
  const car = detail?.carDetails || detail?.data?.carDetails;

  /* ── PDF download ───────────────────────────────────────────────────── */
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

  /* ── Per-photo editor ───────────────────────────────────────────────── */
  const handleEditPhoto = useCallback((photo) => setEditingPhoto(photo), []);

  const handlePhotoUpload = useCallback(async (blob, photo) => {
    const form = new FormData();
    form.append('enquiryId', enquiryId);

    // ── Section → endpoint ──────────────────────────────────────────
    const endpointMap = {
      'Car Details': `assigned-enquiries/admin/${car?._id}/car-details`,
      'Exterior': `assigned-enquiries/admin/${car?._id}/exterior-tyres`,
      'Interior': `assigned-enquiries/admin/${car?._id}/electricals-interior`,
      'Engine': `assigned-enquiries/admin/${car?._id}/engine-transmission`,
    };

    // ── Part string → multer field name ─────────────────────────────
    const resolveField = (section, part) => {
      const p = (part || '').toLowerCase().replace(/\s+/g, '_');
      if (section === 'Car Details') return 'car_details_images';
      if (section === 'Interior') return 'electricals_interior_images';
      if (section === 'Engine') return p.includes('battery') ? 'battery_images' : 'engine_images';
      if (section === 'Exterior') {
        // Exact field names the backend expects (matches your route definition)
        const fieldMap = {
          'bumper_front': 'bumper_front_images',
          'bumper_rear': 'bumper_rear_images',
          'fender_lhs': 'fender_lhs_images',
          'fender_rhs': 'fender_rhs_images',
          'door_lhs_front': 'door_lhs_front_images',
          'door_lhs_rear': 'door_lhs_rear_images',
          'door_rhs_front': 'door_rhs_front_images',
          'door_rhs_rear': 'door_rhs_rear_images',
          'pillar_lhs_a': 'pillar_lhs_a_images',
          'pillar_lhs_b': 'pillar_lhs_b_images',
          'pillar_lhs_c': 'pillar_lhs_c_images',
          'pillar_rhs_a': 'pillar_rhs_a_images',
          'pillar_rhs_b': 'pillar_rhs_b_images',
          'pillar_rhs_c': 'pillar_rhs_c_images',
          'running_border_lhs': 'running_border_lhs_images',
          'running_border_rhs': 'running_border_rhs_images',
          'quarter_panel_lhs': 'quarter_panel_lhs_images',
          'quarter_panel_rhs': 'quarter_panel_rhs_images',
          'windshield_front': 'windshield_front_images',
          'windshield_rear': 'windshield_rear_images',
          'lhs_headlight': 'lhs_headlight_images',
          'rhs_headlight': 'rhs_headlight_images',
          'lhs_taillight': 'lhs_taillight_images',
          'rhs_taillight': 'rhs_taillight_images',
          'orvm_lhs': 'orvm_lhs_images',
          'orvm_rhs': 'orvm_rhs_images',
          'tyre_lhs_front': 'tyre_lhs_front_images',
          'tyre_rhs_front': 'tyre_rhs_front_images',
          'tyre_lhs_rear': 'tyre_lhs_rear_images',
          'tyre_rhs_rear': 'tyre_rhs_rear_images',
          'tyre_spare': 'tyre_spare_images',
          'bonnet_hood': 'bonnet_hood_images',
          'roof': 'roof_images',
          'dicky_boot_door': 'dicky_boot_door_images',
          'apron': 'apron_images',
          'cowl_top': 'cowl_top_images',
          'firewall': 'firewall_images',
          'boot_floor': 'boot_floor_images',
          'radiator_support': 'radiator_support_images',
          'head_light_support': 'head_light_support_images',
          'upper_cross_member': 'upper_cross_member_images',
          'lower_cross_member': 'lower_cross_member_images',
          'alloy_wheel': 'alloy_wheel_images',
        };
        // Try exact match, then partial match
        if (fieldMap[p]) return fieldMap[p];
        const key = Object.keys(fieldMap).find(k => p.includes(k) || k.includes(p));
        return key ? fieldMap[key] : 'exterior_tyres_images';
      }
      return null;
    };

    const endpoint = endpointMap[photo.section];
    const fieldName = resolveField(photo.section, photo.part || photo.caption);

    // Enquiry attachments have no car-section endpoint — skip edit for now
    if (!endpoint || !fieldName) {
      throw new Error(`Photo editing not supported for section: "${photo.section}"`);
    }

    form.append(fieldName, blob, `edited_${Date.now()}.jpg`);
    if (photo.url) form.append('replaceUrl', photo.url);

    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/cj/${endpoint}`,
      form,
      { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
    );

    const newUrl =
      res.data?.updatedUrl ||
      res.data?.data?.url ||
      res.data?.url ||
      photo.url;

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

  /* ── Section save (all 4 sections) ─────────────────────────────────── */
  const handleSectionSave = useCallback(async (section, formData) => {
    setEditSaving(true);
    setEditError('');

    const endpointMap = {
      exterior: `assigned-enquiries/admin/${car?._id}/exterior-tyres`,
      carDetails: `assigned-enquiries/admin/${car?._id}/car-details`,
      interior: `assigned-enquiries/admin/${car?._id}/electricals-interior`,
      engine: `assigned-enquiries/admin/${car?._id}/engine-transmission`,
    };

    const endpoint = endpointMap[section];
    if (!endpoint) {
      setEditError('Unknown section');
      setEditSaving(false);
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/cj/${endpoint}`,
        formData,
        { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
      );

      setDetail(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));

        // Full car replacement if API returns entire carDetails
        const updatedCar = res.data?.carDetails || res.data?.data?.carDetails;
        if (updatedCar) {
          if (next.carDetails) next.carDetails = updatedCar;
          if (next.data?.carDetails) next.data.carDetails = updatedCar;
          return next;
        }

        // Partial sub-document merge
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

        return next;
      });

      setEditSection(null);
    } catch (err) {
      console.error('Save failed:', err);
      setEditError(err.response?.data?.message || 'Save failed — please try again.');
    } finally {
      setEditSaving(false);
    }
  }, [car]);

  const closePanel = () => { setEditSection(null); setEditError(''); };

  /* ── Tabs ───────────────────────────────────────────────────────────── */
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'car', label: 'Car Details' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'interior', label: 'Interior' },
    { key: 'engine', label: 'Engine' },
    { key: 'journey', label: 'Journey' },
  ];

  const allPhotos = (enq && car) ? collectAllImages(enq, car) : [];

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="w-full min-h-screen">

      {/* ── Per-photo editor modal ─────────────────────────────────────── */}
      {editingPhoto && (
        <PhotoEditorModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaveSuccess={handlePhotoSaveSuccess}
          uploadFn={handlePhotoUpload}
        />
      )}

      {/* ── Exterior edit panel ────────────────────────────────────────── */}
      {editSection === 'exterior' && car?.exterior_tyres && (
        <EditPanel title="Edit Exterior & Tyres" onClose={closePanel}>
          <ExteriorTyresEditForm
            initialData={car.exterior_tyres}
            onSave={(fd) => handleSectionSave('exterior', fd)}
            onCancel={closePanel}
            saving={editSaving}
            error={editError}
          />
        </EditPanel>
      )}

      {/* ── Engine edit panel ──────────────────────────────────────────── */}
      {editSection === 'engine' && car?.engine_transmission && (
        <EditPanel title="Edit Engine & Transmission" onClose={closePanel}>
          <EngineTransmissionEditForm
            initialData={car.engine_transmission}
            onSave={(fd) => handleSectionSave('engine', fd)}
            onCancel={closePanel}
            saving={editSaving}
            error={editError}
          />
        </EditPanel>
      )}

      {/* ── Car Details edit panel ─────────────────────────────────────── */}
      {editSection === 'carDetails' && car?.car_details && (
        <EditPanel title="Edit Car Details" onClose={closePanel}>
          <CarDetailsEditForm
            initialData={car.car_details}
            onSave={(fd) => handleSectionSave('carDetails', fd)}
            onCancel={closePanel}
            saving={editSaving}
            error={editError}
          />
        </EditPanel>
      )}

      {/* ── Interior edit panel ────────────────────────────────────────── */}
      {editSection === 'interior' && car?.electricals_interior && (
        <EditPanel title="Edit Interior & Electricals" onClose={closePanel}>
          <InteriorElectricalsEditForm
            initialData={car.electricals_interior}
            onSave={(fd) => handleSectionSave('interior', fd)}
            onCancel={closePanel}
            saving={editSaving}
            error={editError}
          />
        </EditPanel>
      )}

      {/* ── Top bar ────────────────────────────────────────────────────── */}
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
        {!loading && !error && enq && (
          <button
            onClick={handleDownloadPDF}
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
                Download PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* ── States ─────────────────────────────────────────────────────── */}
      {loading && <PageSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
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
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === t.key
                  ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30'
                  : 'indigo-500/35 hover:indigo-500/60 hover:bg-white/[0.04]'
                  }`}
              >
                {t.label}
              </button>
            ))}
            {allPhotos.length > 0 && (
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === 'photos'
                  ? 'bg-teal-500 indigo-500 shadow-lg shadow-teal-500/30'
                  : 'indigo-500/35 hover:indigo-500/60 hover:bg-white/[0.04]'
                  }`}
              >
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
                      <span className="text-amber-400 font-bold text-sm">
                        {enq.estimatedCost > 0 ? `₹${enq.estimatedCost.toLocaleString()}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <span className="indigo-500/40 text-xs">Actual</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {enq.actualCost > 0 ? `₹${enq.actualCost.toLocaleString()}` : '—'}
                      </span>
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
                    />
                  </Card>
                )}

                {enq.notes?.length > 0 && (
                  <Card>
                    <SectionLabel>Notes ({enq.notes.length})</SectionLabel>
                    <div className="space-y-4">
                      {enq.notes.map((note, i) => (
                        <div key={i} className="border-l-2 border-amber-500/40 pl-4">
                          <p className="indigo-500/30 text-[10px]">
                            {note.addedBy?.firstName} {note.addedBy?.lastName} · {new Date(note.addedAt).toLocaleString()}
                          </p>
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
                        <SectionLabel>Registration & Identity</SectionLabel>
                        <SectionEditBtn onClick={() => setEditSection('carDetails')} />
                      </div>
                      <InfoRow label="Make" value={car.car_details?.make} />
                      <InfoRow label="Model" value={car.car_details?.model} />
                      <InfoRow label="Variant" value={car.car_details?.variant} />
                      <InfoRow label="Year of Mfg" value={car.car_details?.year_of_manufacturing} />
                      <InfoRow label="Mfg Month/Year" value={`${car.car_details?.manufacturing_month || '—'} ${car.car_details?.manufacturing_year || ''}`} />
                      {/* <InfoRow label="Reg No."           value={car.car_details?.registration_number?.toUpperCase()} /> */}
                      <InfoRow label="Reg Month/Year" value={`${car.car_details?.registration_month || '—'} ${car.car_details?.registration_year || ''}`} />
                      <InfoRow label="Chassis Number" value={car.car_details?.chassis_number} />
                      <InfoRow label="Chassis Embossing" value={car.car_details?.chassis_embossing} />
                      <InfoRow label="Odometer" value={car.car_details?.odometer_reading != null ? `${car.car_details.odometer_reading.toLocaleString()} km` : null} />
                      <InfoRow label="Fuel Type" value={car.car_details?.fuel_type} />
                      <InfoRow label="No. of Owners" value={car.car_details?.no_of_owners} />
                      <InfoRow label="Branch" value={car.car_details?.branch} />
                      <InfoRow label="Inspection At" value={car.car_details?.inspection_at} />
                    </Card>

                    <Card>
                      <SectionLabel>RTO, Tax & Compliance</SectionLabel>
                      <InfoRow label="RTO" value={car.car_details?.rto} />
                      <InfoRow label="City" value={car.car_details?.reg_city} />
                      <InfoRow label="State" value={car.car_details?.reg_state} />
                      <InfoRow label="Road Tax" value={car.car_details?.road_tax_paid} />
                      <InfoRow label="Tax Validity" value={car.car_details?.road_tax_validity ? new Date(car.car_details.road_tax_validity).toLocaleDateString() : null} />
                      <InfoRow label="Fitness Upto" value={car.car_details?.fitness_upto ? new Date(car.car_details.fitness_upto).toLocaleDateString() : null} />
                      <InfoRow label="Insurance" value={car.car_details?.insurance_type} />
                      <InfoRow label="RC Availability" value={car.car_details?.rc_availability} />
                      <InfoRow label="RC Condition" value={car.car_details?.rc_condition} />
                      <InfoRow label="Mismatch in RC" value={car.car_details?.mismatch_in_rc ? 'Yes' : 'No'} />
                      <InfoRow label="Under Hyp." value={car.car_details?.under_hypothecation ? 'Yes' : 'No'} />
                      <InfoRow label="RTO NOC Issued" value={car.car_details?.rto_noc_issued ? 'Yes' : 'No'} />
                      <InfoRow label="CNG/LPG in RC" value={car.car_details?.cng_lpg_fitment_in_rc ? 'Yes' : 'No'} />
                      <InfoRow label="Duplicate Key" value={car.car_details?.duplicate_key ? 'Yes' : 'No'} />
                      <InfoRow label="Source" value={car.source} />
                      <InfoRow label="To Be Scrapped" value={car.car_details?.to_be_scrapped ? 'Yes' : 'No'} />
                    </Card>
                  </div>

                  {car.car_details?.images?.length > 0 && (
                    <Card>
                      <SectionLabel>Car Photos ({car.car_details.images.length})</SectionLabel>
                      <ImageGrid
                        images={car.car_details.images}
                        cols={5}
                        onEditPhoto={handleEditPhoto}
                        section="Car Details"
                      />
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
                      <PartRow label="Front Bumper" data={car.exterior_tyres.bumper?.front} onEditPhoto={handleEditPhoto} section="Exterior" />
                      <PartRow label="Rear Bumper" data={car.exterior_tyres.bumper?.rear} onEditPhoto={handleEditPhoto} section="Exterior" />
                    </Card>
                    <Card>
                      <SectionLabel>Fenders</SectionLabel>
                      <PartRow label="LHS Fender" data={car.exterior_tyres.fender?.lhs} onEditPhoto={handleEditPhoto} section="Exterior" />
                      <PartRow label="RHS Fender" data={car.exterior_tyres.fender?.rhs} onEditPhoto={handleEditPhoto} section="Exterior" />
                    </Card>
                    <Card>
                      <SectionLabel>Doors</SectionLabel>
                      {['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.door?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Pillars</SectionLabel>
                      {['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.pillar?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Windshields</SectionLabel>
                      <PartRow label="Front" data={car.exterior_tyres.windshield?.front} onEditPhoto={handleEditPhoto} section="Exterior" />
                      <PartRow label="Rear" data={car.exterior_tyres.windshield?.rear} onEditPhoto={handleEditPhoto} section="Exterior" />
                    </Card>
                    <Card>
                      <SectionLabel>Lights</SectionLabel>
                      {['lhs_headlight', 'lhs_taillight', 'rhs_headlight', 'rhs_taillight'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.lights?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Tyres</SectionLabel>
                      {['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear', 'spare'].map(k => (
                        <PartRow key={k} label={k} data={car.exterior_tyres.tyres?.[k]} onEditPhoto={handleEditPhoto} section="Exterior" />
                      ))}
                    </Card>
                    <Card>
                      <SectionLabel>Body Panels</SectionLabel>
                      {['bonnet_hood', 'roof', 'dicky_boot_door', 'apron', 'cowl_top', 'firewall', 'boot_floor'].map(k =>
                        car.exterior_tyres[k]
                          ? <PartRow key={k} label={k} data={car.exterior_tyres[k]} onEditPhoto={handleEditPhoto} section="Exterior" />
                          : null
                      )}
                    </Card>
                    <Card>
                      <SectionLabel>Structural</SectionLabel>
                      {['radiator_support', 'head_light_support', 'upper_cross_member', 'lower_cross_member', 'alloy_wheel'].map(k =>
                        car.exterior_tyres[k]
                          ? <PartRow key={k} label={k} data={car.exterior_tyres[k]} onEditPhoto={handleEditPhoto} section="Exterior" />
                          : null
                      )}
                      <PartRow label="ORVM LHS" data={car.exterior_tyres.orvm?.lhs} onEditPhoto={handleEditPhoto} section="Exterior" />
                      <PartRow label="ORVM RHS" data={car.exterior_tyres.orvm?.rhs} onEditPhoto={handleEditPhoto} section="Exterior" />
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
                    <Card>
                      <SectionLabel>Electricals & Features</SectionLabel>
                      {[
                        ['Power Windows', car.electricals_interior.power_windows, `${car.electricals_interior.no_of_power_windows || '—'} windows`],
                        ['ABS', car.electricals_interior.abs?.status, null],
                        ['Airbags', car.electricals_interior.airbag_feature, `${car.electricals_interior.no_of_airbags || '—'} airbags`],
                        ['Music System', car.electricals_interior.music_system?.status, null],
                        ['Sunroof', car.electricals_interior.sunroof, null],
                        ['Door Trim', car.electricals_interior.door_trim?.status, null],
                        ['Leather Seat', car.electricals_interior.leather_seat?.status, null],
                        ['Fabric Seat', car.electricals_interior.fabric_seat, null],
                        ['Roof Lining', car.electricals_interior.roof_lining?.status, null],
                        ['Rear Defogger', car.electricals_interior.rear_defogger, null],
                        ['Reverse Camera', car.electricals_interior.reverse_camera, null],
                        ['Parking Sensor', car.electricals_interior.parking_sensor, null],
                        ['Navigation', car.electricals_interior.navigation_chip, null],
                        ['Steering Audio', car.electricals_interior.steering_mounted_audio_control, null],
                        ['Electrical', car.electricals_interior.electrical, null],
                      ].map(([lbl, val, extra]) => (
                        <div key={lbl} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                          <div>
                            <span className="indigo-500/40 text-xs">{lbl}</span>
                            {extra && <span className="indigo-500/20 text-[10px] ml-2">{extra}</span>}
                          </div>
                          <ConditionBadge value={val} />
                        </div>
                      ))}
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
                        {car.electricals_interior.remote_key?.notes && (
                          <InfoRow label="Remote Key Notes" value={car.electricals_interior.remote_key.notes} />
                        )}
                        {car.electricals_interior.comments && (
                          <div className="mt-3 pt-3 border-t border-white/[0.04]">
                            <SectionLabel>Interior Comments</SectionLabel>
                            <p className="indigo-500/60 text-sm">{car.electricals_interior.comments}</p>
                          </div>
                        )}
                      </Card>

                      {(() => {
                        const imgs = [
                          ...(car.electricals_interior?.images || []),
                          ...(car.electricals_interior?.interior?.images || []),
                        ];
                        return imgs.length > 0 ? (
                          <Card>
                            <SectionLabel>Interior Photos ({imgs.length})</SectionLabel>
                            <ImageGrid images={imgs} cols={3} onEditPhoto={handleEditPhoto} section="Interior" />
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
                      <Card>
                        <SectionLabel>Engine & Transmission</SectionLabel>
                        <InfoRow label="Engine Status" value={car.engine_transmission.engine?.status} />
                        <InfoRow label="MIL Light" value={car.engine_transmission.engine?.mil_light_glowing ? 'Glowing' : 'OK'} />
                        <InfoRow label="Wiring Damaged" value={car.engine_transmission.engine?.electrical_wiring_damaged ? 'Yes' : 'No'} />
                        <InfoRow label="Air Filter Box" value={car.engine_transmission.engine?.air_filter_box_damaged ? 'Damaged' : 'OK'} />
                        <InfoRow label="Battery Status" value={car.engine_transmission.battery?.status} />
                        <InfoRow label="Battery Leakage" value={car.engine_transmission.battery?.acid_leakage ? 'Yes' : 'No'} />
                        <InfoRow label="Oil Status" value={car.engine_transmission.engine_oil?.status} />
                        <InfoRow label="Oil Leakage" value={car.engine_transmission.engine_oil?.leakage_from_tappet_cover ? 'Yes' : 'No'} />
                        <InfoRow label="Coolant Status" value={car.engine_transmission.coolant?.status} />
                        <InfoRow label="Coolant Dirty" value={car.engine_transmission.coolant?.dirty ? 'Yes' : 'No'} />
                        <InfoRow label="Coolant Level" value={car.engine_transmission.coolant?.level_low ? 'Low' : 'OK'} />
                        <InfoRow label="Engine Mounting" value={car.engine_transmission.engine_mounting?.status} />
                        <InfoRow label="Engine Sound" value={car.engine_transmission.engine_sound?.status} />
                        <InfoRow label="Exhaust Smoke" value={car.engine_transmission.exhaust_smoke?.status} />
                        <InfoRow label="Clutch" value={car.engine_transmission.clutch?.status} />
                        <InfoRow label="Gear Shifting" value={car.engine_transmission.gear_shifting?.status} />
                        <InfoRow label="Turbo Charger" value={car.engine_transmission.turbo_charger?.status} />
                        <InfoRow label="Fuel Injector" value={car.engine_transmission.fuel_injector?.status} />
                        <InfoRow label="Radiator Fan" value={car.engine_transmission.radiator_fan_motor?.status} />
                        <InfoRow label="Towing Recommended" value={car.engine_transmission.towing_recommended ? '⚠ Yes' : 'No'} />
                      </Card>

                      {(() => {
                        const imgs = [
                          ...(car.engine_transmission?.engine?.images || []),
                          ...(car.engine_transmission?.battery?.images || []),
                        ];
                        return imgs.length > 0 ? (
                          <Card>
                            <SectionLabel>Engine Photos ({imgs.length})</SectionLabel>
                            <ImageGrid images={imgs} cols={3} onEditPhoto={handleEditPhoto} section="Engine" />
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
                      {car.engine_transmission.comments && (
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
                        <p className="indigo-500/35 text-xs mt-1">{step.description}</p>
                        {step.timestamp && (
                          <p className="indigo-500/20 text-[10px] mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>
                        )}
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
                              <a href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                                <div className="relative overflow-hidden rounded-xl border indigo-500 bg-white/[0.03] aspect-[4/3]">
                                  <img
                                    src={img.url}
                                    alt={img.caption}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2.5">
                                    <p className="indigo-500 text-[10px] capitalize truncate w-full">{img.part}</p>
                                  </div>
                                  {img.part && (
                                    <div className="absolute top-2 left-2">
                                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full indigo-500/50 indigo-500/70 backdrop-blur-sm capitalize">
                                        {img.part}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </a>
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