import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ─── Tool Config ─────────────────────────────────────────────────────── */
const TOOLS = {
  draw:   { label: 'Draw',   icon: '✏️' },
  line:   { label: 'Line',   icon: '╱' },
  rect:   { label: 'Rect',   icon: '▭' },
  circle: { label: 'Circle', icon: '○' },
  arrow:  { label: 'Arrow',  icon: '↗' },
  text:   { label: 'Text',   icon: 'T' },
  erase:  { label: 'Erase',  icon: '⌫' },
};

const COLORS = ['#FF4444','#FF9F00','#FFE500','#44FF88','#44CCFF','#8B5CF6','#FFFFFF','#000000'];
const SIZES  = [2, 4, 8, 14, 22];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

function drawArrow(ctx, x1, y1, x2, y2, size) {
  const angle  = Math.atan2(y2 - y1, x2 - x1);
  const hs     = size * 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(angle - Math.PI / 6), y2 - hs * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - hs * Math.cos(angle + Math.PI / 6), y2 - hs * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

/* ══════════════════════════════════════════════════════════════════════════
   PHOTO EDITOR MODAL
   ══════════════════════════════════════════════════════════════════════════ */
const PhotoEditorModal = ({ photo, onClose, onSaveSuccess, uploadFn }) => {
  const canvasRef      = useRef(null);
  const overlayRef     = useRef(null);  // shape-preview canvas
  const imgRef         = useRef(null);
  const historyRef     = useRef([]);
  const redoRef        = useRef([]);
  const isDrawingRef   = useRef(false);
  const startPt        = useRef(null);

  const [tool,       setTool]       = useState('draw');
  const [color,      setColor]      = useState('#FF4444');
  const [size,       setSize]       = useState(4);
  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');

  // Text tool state
  const [textMode,   setTextMode]   = useState(false);
  const [textPos,    setTextPos]    = useState(null);
  const [textVal,    setTextVal]    = useState('');
  const [fontSize,   setFontSize]   = useState(20);
  const textInputRef = useRef(null);

  /* ── Load image onto canvas ─────────────────────────────────────────── */
  useEffect(() => {
    if (!photo?.url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const canvas  = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;

      // Cap size at 1600px wide
      const MAX = 1600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }

      canvas.width  = overlay.width  = w;
      canvas.height = overlay.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      historyRef.current = [ctx.getImageData(0, 0, w, h)];
      setImgLoaded(true);
    };
    img.onerror = () => { setSaveMsg('⚠ Image failed to load (CORS?)'); setImgLoaded(true); };
    img.src = photo.url;
  }, [photo]);

  /* ── Keyboard shortcuts ─────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ── Undo / Redo ────────────────────────────────────────────────────── */
  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoRef.current = [];
  };

  const undo = () => {
    if (historyRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    redoRef.current.push(historyRef.current.pop());
    ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
  };

  const redo = () => {
    if (!redoRef.current.length) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const snap   = redoRef.current.pop();
    historyRef.current.push(snap);
    ctx.putImageData(snap, 0, 0);
  };

  /* ── Drawing helpers ────────────────────────────────────────────────── */
  const applyStyle = (ctx, erase = false) => {
    ctx.strokeStyle = erase ? '#000000' : color;
    ctx.fillStyle   = erase ? '#000000' : color;
    ctx.lineWidth   = erase ? size * 4 : size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    if (erase) ctx.globalCompositeOperation = 'destination-out';
    else       ctx.globalCompositeOperation = 'source-over';
  };

  /* ── Pointer events ─────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e) => {
    if (tool === 'text') return;          // text handled by click
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pt     = getPos(e, canvas);
    isDrawingRef.current = true;
    startPt.current      = pt;

    if (tool === 'draw' || tool === 'erase') {
      saveSnapshot();
      applyStyle(ctx, tool === 'erase');
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    }
  }, [tool, color, size]);

  const onPointerMove = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx     = canvas.getContext('2d');
    const octx    = overlay.getContext('2d');
    const pt      = getPos(e, canvas);

    if (tool === 'draw' || tool === 'erase') {
      applyStyle(ctx, tool === 'erase');
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      return;
    }

    // Shape preview on overlay
    octx.clearRect(0, 0, overlay.width, overlay.height);
    applyStyle(octx, false);
    const sp = startPt.current;

    if (tool === 'line') {
      octx.beginPath();
      octx.moveTo(sp.x, sp.y);
      octx.lineTo(pt.x, pt.y);
      octx.stroke();
    } else if (tool === 'rect') {
      octx.strokeRect(sp.x, sp.y, pt.x - sp.x, pt.y - sp.y);
    } else if (tool === 'circle') {
      const rx = Math.abs(pt.x - sp.x) / 2;
      const ry = Math.abs(pt.y - sp.y) / 2;
      const cx = sp.x + (pt.x - sp.x) / 2;
      const cy = sp.y + (pt.y - sp.y) / 2;
      octx.beginPath();
      octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      octx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(octx, sp.x, sp.y, pt.x, pt.y, size);
    }
  }, [tool, color, size]);

  const onPointerUp = useCallback((e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx     = canvas.getContext('2d');
    const octx    = overlay.getContext('2d');
    const pt      = getPos(e, canvas);
    const sp      = startPt.current;

    if (tool === 'draw' || tool === 'erase') {
      ctx.closePath();
      saveSnapshot();
      return;
    }

    octx.clearRect(0, 0, overlay.width, overlay.height);
    saveSnapshot();
    applyStyle(ctx, false);

    if (tool === 'line') {
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(sp.x, sp.y, pt.x - sp.x, pt.y - sp.y);
    } else if (tool === 'circle') {
      const rx = Math.abs(pt.x - sp.x) / 2;
      const ry = Math.abs(pt.y - sp.y) / 2;
      const cx = sp.x + (pt.x - sp.x) / 2;
      const cy = sp.y + (pt.y - sp.y) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(ctx, sp.x, sp.y, pt.x, pt.y, size);
    }
    saveSnapshot();
  }, [tool, color, size]);

  /* ── Text tool ──────────────────────────────────────────────────────── */
  const onCanvasClick = useCallback((e) => {
    if (tool !== 'text') return;
    const canvas = canvasRef.current;
    const pt     = getPos(e, canvas);
    setTextPos(pt);
    setTextVal('');
    setTextMode(true);
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, [tool]);

  const commitText = () => {
    if (!textVal.trim() || !textPos) { setTextMode(false); return; }
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    saveSnapshot();
    ctx.globalCompositeOperation = 'source-over';
    ctx.font      = `bold ${fontSize}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textVal, textPos.x, textPos.y);
    saveSnapshot();
    setTextMode(false);
    setTextVal('');
  };

  /* ── Save / Upload ──────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!uploadFn) { setSaveMsg('⚠ No upload function provided'); return; }
    setSaving(true);
    setSaveMsg('Uploading…');
    try {
      const canvas = canvasRef.current;
      const blob   = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas export failed')), 'image/jpeg', 0.92)
      );
      const result = await uploadFn(blob, photo);
      const newUrl = result?.url || result?.data?.url || result?.fileUrl;
      setSaveMsg('✓ Saved!');
      setTimeout(() => { onSaveSuccess && onSaveSuccess(newUrl); }, 800);
    } catch (err) {
      console.error('Upload error:', err);
      setSaveMsg(`✗ Upload failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── Download locally ───────────────────────────────────────────────── */
  const handleDownload = () => {
    const canvas = canvasRef.current;
    const a = document.createElement('a');
    a.download = `edited_${Date.now()}.jpg`;
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.click();
  };

  /* ── Cursor style ───────────────────────────────────────────────────── */
  const cursorStyle = {
    draw:   'crosshair',
    erase:  'cell',
    text:   'text',
    line:   'crosshair',
    rect:   'crosshair',
    circle: 'crosshair',
    arrow:  'crosshair',
  }[tool] || 'crosshair';

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: 'min(96vw, 1100px)', maxHeight: '96vh' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">Photo Editor</p>
              <p className="text-white/30 text-[10px] truncate max-w-[280px]">{photo?.caption || photo?.part || 'Edit Photo'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveMsg && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${saveMsg.startsWith('✓') ? 'bg-emerald-500/15 text-emerald-400' : saveMsg.startsWith('✗') || saveMsg.startsWith('⚠') ? 'bg-rose-500/15 text-rose-400' : 'bg-white/5 text-white/40'}`}>
                {saveMsg}
              </span>
            )}
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-all text-xs font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            {uploadFn && (
              <button onClick={handleSave} disabled={saving || !imgLoaded}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25 hover:border-teal-500/50 transition-all text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Saving…</>
                ) : (
                  <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Save & Upload</>
                )}
              </button>
            )}
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] flex-shrink-0 bg-white/[0.01]">

          {/* Tools */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {Object.entries(TOOLS).map(([key, { label, icon }]) => (
              <button key={key} onClick={() => setTool(key)} title={label}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all ${
                  tool === key ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                }`}>
                {icon}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} title={c}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
              />
            ))}
            {/* Custom color */}
            <label className="w-5 h-5 rounded-full border-2 border-white/20 overflow-hidden cursor-pointer hover:border-white/50 transition-all" title="Custom color">
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-8 h-8 -ml-1 -mt-1 cursor-pointer opacity-0 absolute" />
              <div className="w-full h-full flex items-center justify-center text-white/40 text-[8px] font-bold bg-white/10">+</div>
            </label>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Brush size */}
          <div className="flex items-center gap-1.5">
            {SIZES.map(s => (
              <button key={s} onClick={() => setSize(s)} title={`${s}px`}
                className={`rounded-full transition-all border-2 ${size === s ? 'border-teal-400' : 'border-transparent hover:border-white/20'}`}
                style={{ width: Math.max(s + 4, 10), height: Math.max(s + 4, 10), backgroundColor: size === s ? color : 'rgba(255,255,255,0.3)' }}
              />
            ))}
          </div>

          {/* Text font size (only when text tool active) */}
          {tool === 'text' && (
            <>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Size</span>
                {[14, 20, 28, 40].map(s => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${fontSize === s ? 'bg-teal-500 text-white' : 'bg-white/[0.05] text-white/40 hover:text-white/70'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button onClick={undo} title="Undo (Ctrl+Z)"
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
            </button>
            <button onClick={redo} title="Redo (Ctrl+Shift+Z)"
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Section badge ── */}
        {photo?.section && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.015] border-b border-white/[0.04] flex-shrink-0">
            <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Section</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400">{photo.section}</span>
            {photo.part && <span className="text-white/20 text-[10px] capitalize">{photo.part?.replace(/_/g, ' ')}</span>}
          </div>
        )}

        {/* ── Canvas area ── */}
        <div className="flex-1 overflow-auto bg-[#080a0e] flex items-center justify-center p-4 min-h-0">
          {!imgLoaded && (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-white/20 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <p className="text-white/30 text-xs">Loading image…</p>
            </div>
          )}
          <div className="relative" style={{ display: imgLoaded ? 'block' : 'none' }}>
            {/* Main drawing canvas */}
            <canvas
              ref={canvasRef}
              style={{ cursor: cursorStyle, display: 'block', maxWidth: '100%', maxHeight: 'calc(96vh - 220px)' }}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={(e) => { if (isDrawingRef.current) onPointerUp(e); }}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
              onClick={onCanvasClick}
            />
            {/* Overlay for shape preview */}
            <canvas
              ref={overlayRef}
              style={{
                position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
                maxWidth: '100%', maxHeight: 'calc(96vh - 220px)',
              }}
            />
            {/* Text input overlay */}
            {textMode && textPos && (
              <div style={{
                position: 'absolute',
                left: `${(textPos.x / (canvasRef.current?.width || 1)) * 100}%`,
                top:  `${(textPos.y / (canvasRef.current?.height || 1)) * 100}%`,
                transform: 'translateY(-100%)',
                zIndex: 20,
              }}>
                <div className="bg-black/80 backdrop-blur-sm rounded-xl border border-teal-500/40 p-2 flex items-center gap-2 shadow-2xl">
                  <input
                    ref={textInputRef}
                    value={textVal}
                    onChange={e => setTextVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextMode(false); }}
                    placeholder="Type text, Enter to place…"
                    className="bg-transparent text-white placeholder-white/30 text-sm outline-none min-w-[180px]"
                    style={{ color, fontSize: `${Math.min(fontSize, 20)}px` }}
                  />
                  <button onClick={commitText}
                    className="px-2 py-1 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-semibold hover:bg-teal-500/30 transition-all">
                    Place
                  </button>
                  <button onClick={() => setTextMode(false)}
                    className="text-white/30 hover:text-white/60 text-xs">✕</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer hint ── */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.05] flex-shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <span className="text-white/20 text-[10px]">
              {tool === 'text' ? 'Click on image to place text' :
               tool === 'erase' ? 'Drag to erase' :
               tool === 'draw' ? 'Drag to freehand draw' :
               'Click and drag to draw shape'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/15 text-[10px]">
            <span>Ctrl+Z Undo</span>
            <span>Ctrl+Shift+Z Redo</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditorModal;