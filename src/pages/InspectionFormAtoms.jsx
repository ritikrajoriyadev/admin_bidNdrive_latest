import React, { useRef, useState } from 'react';

/* ─────────────────────────────────────────────
   Primitives
───────────────────────────────────────────── */

export const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold tracking-widest uppercase indigo-500/30">{label}</label>
    {children}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2
      indigo-500/80 text-sm indigo-500
      focus:outline-none focus:border-teal-500/50 transition-all ${className}`}
    {...props}
  />
);

export const Select = ({ children, className = '', ...props }) => (
  <select
    className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2
      indigo-500/80 text-sm focus:outline-none focus:border-teal-500/50 transition-all ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm indigo-500/60">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none
        ${checked ? 'bg-teal-500' : 'bg-white/10'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
          transform transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

/* ─────────────────────────────────────────────
   EditToolbar
───────────────────────────────────────────── */

export const EditToolbar = ({ onCancel, onSave, saving, error }) => (
  <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3
    bg-[#0d1117]/90 backdrop-blur border-t border-white/[0.06] px-5 py-3 -mx-1 rounded-b-xl">
    {error && <p className="text-red-400 text-xs flex-1">{error}</p>}
    {!error && <span />}
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-1.5 text-sm rounded-lg border border-white/10 indigo-500/50
          hover:indigo-500/80 hover:border-white/20 transition-all"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-1.5 text-sm rounded-lg bg-teal-500/20 border border-teal-500/30
          text-teal-300 hover:bg-teal-500/30 disabled:opacity-40 transition-all"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   ImageEditStrip — shows existing images + delete
   Props:
     images      : string[]  — current image URLs from the server
     onDelete    : (url) => void — called when user marks an image for removal
     deletedUrls : Set<string>  — already-marked-for-deletion
───────────────────────────────────────────── */

export const ImageEditStrip = ({ images = [], onDelete, deletedUrls = new Set() }) => {
  const [lightbox, setLightbox] = useState(null);

  if (!images.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {images.map((url, i) => {
          const deleted = deletedUrls.has(url);
          return (
            <div
              key={url}
              className={`relative group rounded-md overflow-hidden border transition-all
                ${deleted
                  ? 'border-red-500/50 opacity-40'
                  : 'border-white/10 hover:border-white/25'}`}
              style={{ width: 52, height: 52 }}
            >
              {/* Thumbnail */}
              <img
                src={url}
                alt={`img-${i}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => !deleted && setLightbox(url)}
              />

              {/* Delete overlay */}
              {!deleted ? (
                <button
                  type="button"
                  onClick={() => onDelete(url)}
                  className="absolute inset-0 flex items-center justify-center
                    indigo-500/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(url)}   /* toggle back */
                  className="absolute inset-0 flex items-center justify-center indigo-500/40"
                  title="Undo remove"
                >
                  <svg className="w-4 h-4 indigo-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center indigo-500/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="preview"
            className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 indigo-500/60 hover:indigo-500"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

/* ─────────────────────────────────────────────
   FileUploadArea — new file picker
   Props:
     label       : string
     fieldName   : string
     multiple    : bool
     onChange    : (fieldName, FileList) => void
     newFiles    : File[]   — already-staged new files (for preview)
───────────────────────────────────────────── */

export const FileUploadArea = ({ label, fieldName, multiple = true, onChange, newFiles = [] }) => {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    onChange(fieldName, files);

    // local object-URL previews
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]
          bg-white/[0.04] border border-white/[0.08] border-dashed indigo-500/40
          hover:indigo-500/70 hover:border-white/20 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {label || (multiple ? 'Add photos' : 'Add photo')}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />

      {/* New-file previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {previews.map((url, i) => (
            <div key={i} className="relative rounded-md overflow-hidden border border-teal-500/30"
              style={{ width: 52, height: 52 }}>
              <img src={url} alt={`new-${i}`} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-teal-500/70 text-[8px] text-center py-0.5 indigo-500">
                NEW
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PartEditor
   value shape: { condition, paint_type, remarks, images }
   New props:
     existingImages  : string[]   — URLs already saved
     deletedUrls     : Set
     onDeleteImage   : (url) => void
───────────────────────────────────────────── */

const CONDITION_OPTS = ['ok', 'minor_scratch', 'major_scratch', 'dent', 'rust', 'broken', 'replaced', 'repainted'];
const PAINT_OPTS = ['original', 'repainted', 'wrapped', 'not_applicable'];

export const PartEditor = ({
  label,
  value = {},
  onChange,
  fileFieldName,
  onFileChange,
  existingImages = [],
  deletedUrls = new Set(),
  onDeleteImage,
}) => {
  const v = value || {};

  const update = (key, val) => onChange({ ...v, [key]: val });

  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3 space-y-2">
      <p className="text-[11px] font-semibold indigo-500/50">{label}</p>

      <div className="grid grid-cols-2 gap-2">
        {/* Condition */}
        <div>
          <p className="text-[9px] uppercase tracking-widest indigo-500/25 mb-1">Condition</p>
          <Select value={v.condition || ''} onChange={e => update('condition', e.target.value)}>
            <option value="">—</option>
            {CONDITION_OPTS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </Select>
        </div>

        {/* Paint type */}
        <div>
          <p className="text-[9px] uppercase tracking-widest indigo-500/25 mb-1">Paint</p>
          <Select value={v.paint_type || ''} onChange={e => update('paint_type', e.target.value)}>
            <option value="">—</option>
            {PAINT_OPTS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </Select>
        </div>
      </div>

      {/* Remarks */}
      <input
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md px-2 py-1.5
          indigo-500/70 text-xs indigo-500 focus:outline-none focus:border-teal-500/40 transition-all"
        placeholder="Remarks…"
        value={v.remarks || ''}
        onChange={e => update('remarks', e.target.value)}
      />

      {/* Existing images */}
      <ImageEditStrip
        images={existingImages}
        deletedUrls={deletedUrls}
        onDelete={onDeleteImage}
      />

      {/* Upload new */}
      <FileUploadArea
        fieldName={fileFieldName}
        multiple
        onChange={onFileChange}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   TyreEditor
   value shape: { condition, tread_depth, brand, remarks, images }
───────────────────────────────────────────── */

const TYRE_COND = ['good', 'average', 'poor', 'bald', 'punctured', 'replaced'];

export const TyreEditor = ({
  label,
  value = {},
  onChange,
  fileFieldName,
  onFileChange,
  existingImages = [],
  deletedUrls = new Set(),
  onDeleteImage,
}) => {
  const v = value || {};
  const update = (key, val) => onChange({ ...v, [key]: val });

  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3 space-y-2">
      <p className="text-[11px] font-semibold indigo-500/50">{label}</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-widest indigo-500/25 mb-1">Condition</p>
          <Select value={v.condition || ''} onChange={e => update('condition', e.target.value)}>
            <option value="">—</option>
            {TYRE_COND.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest indigo-500/25 mb-1">Tread depth (mm)</p>
          <Input
            type="number"
            min="0" max="12" step="0.5"
            value={v.tread_depth ?? ''}
            onChange={e => update('tread_depth', e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <input
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md px-2 py-1.5
          indigo-500/70 text-xs indigo-500 focus:outline-none focus:border-teal-500/40 transition-all"
        placeholder="Brand / remarks…"
        value={v.remarks || ''}
        onChange={e => update('remarks', e.target.value)}
      />

      <ImageEditStrip images={existingImages} deletedUrls={deletedUrls} onDelete={onDeleteImage} />
      <FileUploadArea fieldName={fileFieldName} multiple onChange={onFileChange} />
    </div>
  );
};