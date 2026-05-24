import React, { useState, useRef } from 'react';

/* ─── Design tokens (mirrors parent page) ──────────────────────────────── */
const STATUS_OPTIONS = ['ok', 'issue', 'na'];
const CONDITIONS_MAP = {
  bumper: ['dent', 'scratch', 'broken', 'repainted', 'replaced', 'rust'],
  fender: ['dent', 'scratch', 'repainted', 'replaced', 'rust', 'bent'],
  door: ['dent', 'scratch', 'repainted', 'replaced', 'rust', 'alignment_issue'],
  pillar: ['dent', 'scratch', 'repainted', 'replaced', 'bent'],
  quarter_panel: ['dent', 'scratch', 'repainted', 'replaced', 'rust'],
  running_border: ['dent', 'scratch', 'repainted', 'replaced', 'rust'],
  windshield: ['crack', 'chip', 'scratched', 'replaced', 'tinted'],
  orvm: ['broken', 'scratched', 'replaced', 'motor_issue'],
  lights: ['crack', 'condensation', 'replaced', 'not_working'],
  tyres: ['worn', 'puncture', 'bulge', 'replaced', 'mismatched'],
  roof: ['dent', 'scratch', 'repainted', 'rust'],
  bonnet_hood: ['dent', 'scratch', 'repainted', 'replaced', 'rust'],
  default: ['dent', 'scratch', 'repainted', 'replaced', 'rust', 'broken'],
};

/* ─── Atoms ──────────────────────────────────────────────────────────────── */
const Label = ({ children }) => (
  <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-2">{children}</p>
);

const StatusSelect = ({ value, onChange }) => (
  <div className="flex gap-1.5">
    {STATUS_OPTIONS.map(s => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all border ${value === s
          ? s === 'ok'
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : s === 'issue'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              : 'bg-white/10 border-white/20 indigo-500/60'
          : 'bg-transparent indigo-500 indigo-500/25 hover:border-white/20 hover:indigo-500/40'
          }`}
      >
        {s}
      </button>
    ))}
  </div>
);

const ConditionPills = ({ options, selected = [], onChange }) => (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {options.map(c => {
      const active = selected.includes(c);
      return (
        <button
          key={c}
          type="button"
          onClick={() => onChange(active ? selected.filter(x => x !== c) : [...selected, c])}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all capitalize border ${active
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            : 'bg-transparent indigo-500 indigo-500/25 hover:indigo-500/40'
            }`}
        >
          {c.replace(/_/g, ' ')}
        </button>
      );
    })}
  </div>
);

const NoteInput = ({ value, onChange, placeholder = 'Add a note…' }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={2}
    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/60 text-xs indigo-500 focus:outline-none focus:border-teal-500/40 focus:bg-white/[0.05] resize-none transition-all"
  />
);

/* ─── Image upload strip ─────────────────────────────────────────────────── */
const ImageUploadStrip = ({ fieldName, existingImages = [], newFiles, onNewFiles }) => {
  const inputRef = useRef();

  return (
    <div className="mt-2">
      <div className="flex gap-2 flex-wrap">
        {/* Existing images (read-only preview) */}
        {existingImages.map((img, i) => (
          <div key={i} className="relative w-[60px] h-[45px] rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 indigo-500/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="indigo-500/60 text-[8px] font-bold">EXISTING</span>
            </div>
          </div>
        ))}

        {/* New file previews */}
        {newFiles && Array.from(newFiles).map((f, i) => (
          <div key={`new-${i}`} className="relative w-[60px] h-[45px] rounded-lg overflow-hidden border border-teal-500/30 flex-shrink-0">
            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-[7px] indigo-500 font-bold">N</span>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-[60px] h-[45px] rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center gap-0.5 indigo-500/20 hover:border-teal-500/40 hover:text-teal-400/60 transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[8px] font-bold">ADD</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          name={fieldName}
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => onNewFiles(e.target.files)}
        />
      </div>
    </div>
  );
};

/* ─── Part editor block ─────────────────────────────────────────────────── */
const PartEditor = ({ label, partKey, data = {}, imageFieldName, conditionsKey = 'default', formState, onChange, onNewImages }) => {
  const state = formState[partKey] || { status: data.status || 'ok', conditions: data.conditions || [], notes: data.notes || '' };
  const conditionOpts = CONDITIONS_MAP[conditionsKey] || CONDITIONS_MAP.default;
  const existingImgs = data.images || [];
  const newFiles = formState[`__files_${partKey}`];

  return (
    <div className="py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="indigo-500/50 text-xs capitalize font-medium">{label.replace(/_/g, ' ')}</span>
        <StatusSelect value={state.status} onChange={v => onChange(partKey, 'status', v)} />
      </div>

      <ConditionPills
        options={conditionOpts}
        selected={state.conditions}
        onChange={v => onChange(partKey, 'conditions', v)}
      />

      <NoteInput
        value={state.notes}
        onChange={v => onChange(partKey, 'notes', v)}
      />

      {imageFieldName && (
        <ImageUploadStrip
          fieldName={imageFieldName}
          existingImages={existingImgs}
          newFiles={newFiles}
          onNewFiles={files => onNewImages(partKey, files)}
        />
      )}
    </div>
  );
};

/* ─── Collapsible section ────────────────────────────────────────────────── */
const Section = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-all"
      >
        <span className="indigo-500/50 text-xs font-bold tracking-widest uppercase">{title}</span>
        <svg
          className={`w-4 h-4 indigo-500/20 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN: ExteriorTyresEditForm
   ══════════════════════════════════════════════════════════════════════════ */
const ExteriorTyresEditForm = ({ initialData = {}, onSave, onCancel, saving = false, error = '' }) => {

  /* ── state: flat map  partKey → { status, conditions, notes } ─────────── */
  const [form, setForm] = useState({});

  /* misc top-level fields */
  const [jackTool, setJackTool] = useState(initialData.jack_tool_available ?? false);
  const [comments, setComments] = useState(initialData.comments || '');

  const handleChange = (partKey, field, value) => {
    setForm(prev => ({
      ...prev,
      [partKey]: { ...(prev[partKey] || {}), [field]: value },
    }));
  };

  const handleNewImages = (partKey, files) => {
    setForm(prev => ({ ...prev, [`__files_${partKey}`]: files }));
  };

  /* ── Build FormData and call onSave ─────────────────────────────────────*/
  const handleSubmit = () => {
    const fd = new FormData();

    // Helper: get merged value (form state overrides initial)
    const get = (partKey, field) => {
      const s = form[partKey];
      if (s && s[field] !== undefined) return s[field];
      // Navigate initialData for default
      return null;
    };

    // ── Encode a sub-part ─────────────────────────────────────────────────
    const encodePart = (prefix, partKey, imageFieldName) => {
      const s = form[partKey] || {};
      const initial = getInitial(partKey);

      const status = s.status ?? initial?.status ?? 'ok';
      const conditions = s.conditions ?? initial?.conditions ?? [];
      const notes = s.notes ?? initial?.notes ?? '';

      fd.append(`${prefix}[status]`, status);
      fd.append(`${prefix}[notes]`, notes);
      conditions.forEach(c => fd.append(`${prefix}[conditions][]`, c));

      // Append new image files
      const newFiles = form[`__files_${partKey}`];
      if (newFiles) {
        Array.from(newFiles).forEach(f => fd.append(imageFieldName, f));
      }
    };

    // ── Bumpers ──────────────────────────────────────────────────────────
    encodePart('bumper[front]', 'bumper_front', 'bumper_front_images');
    encodePart('bumper[rear]', 'bumper_rear', 'bumper_rear_images');

    // ── Fenders ──────────────────────────────────────────────────────────
    encodePart('fender[lhs]', 'fender_lhs', 'fender_lhs_images');
    encodePart('fender[rhs]', 'fender_rhs', 'fender_rhs_images');

    // ── Doors ────────────────────────────────────────────────────────────
    ['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear'].forEach(k => {
      encodePart(`door[${k}]`, `door_${k}`, `door_${k}_images`);
    });

    // ── Pillars ──────────────────────────────────────────────────────────
    ['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c'].forEach(k => {
      encodePart(`pillar[${k}]`, `pillar_${k}`, `pillar_${k}_images`);
    });

    // ── Quarter panels ───────────────────────────────────────────────────
    encodePart('quarter_panel[lhs]', 'quarter_panel_lhs', 'quarter_panel_lhs_images');
    encodePart('quarter_panel[rhs]', 'quarter_panel_rhs', 'quarter_panel_rhs_images');

    // ── Running borders ──────────────────────────────────────────────────
    encodePart('running_border[lhs]', 'running_border_lhs', 'running_border_lhs_images');
    encodePart('running_border[rhs]', 'running_border_rhs', 'running_border_rhs_images');

    // ── Windshield ───────────────────────────────────────────────────────
    encodePart('windshield[front]', 'windshield_front', 'windshield_front_images');
    encodePart('windshield[rear]', 'windshield_rear', 'windshield_rear_images');

    // ── ORVM ─────────────────────────────────────────────────────────────
    encodePart('orvm[lhs]', 'orvm_lhs', 'orvm_lhs_images');
    encodePart('orvm[rhs]', 'orvm_rhs', 'orvm_rhs_images');

    // ── Lights ───────────────────────────────────────────────────────────
    encodePart('lights[lhs_headlight]', 'lhs_headlight', 'lhs_headlight_images');
    encodePart('lights[rhs_headlight]', 'rhs_headlight', 'rhs_headlight_images');
    encodePart('lights[lhs_taillight]', 'lhs_taillight', 'lhs_taillight_images');
    encodePart('lights[rhs_taillight]', 'rhs_taillight', 'rhs_taillight_images');

    // ── Tyres ────────────────────────────────────────────────────────────
    ['lhs_front', 'rhs_front', 'lhs_rear', 'rhs_rear', 'spare'].forEach(k => {
      encodePart(`tyres[${k}]`, `tyre_${k}`, `tyre_${k}_images`);
    });

    // ── Singles ──────────────────────────────────────────────────────────
    const singles = [
      ['bonnet_hood', 'bonnet_hood', 'bonnet_hood_images'],
      ['roof', 'roof', 'roof_images'],
      ['dicky_boot_door', 'dicky_boot_door', 'dicky_boot_door_images'],
      ['boot_floor', 'boot_floor', 'boot_floor_images'],
      ['apron', 'apron', 'apron_images'],
      ['cowl_top', 'cowl_top', 'cowl_top_images'],
      ['firewall', 'firewall', 'firewall_images'],
      ['alloy_wheel', 'alloy_wheel', 'alloy_wheel_images'],
      ['radiator_support', 'radiator_support', 'radiator_support_images'],
      ['head_light_support', 'head_light_support', 'head_light_support_images'],
      ['upper_cross_member', 'upper_cross_member', 'upper_cross_member_images'],
      ['lower_cross_member', 'lower_cross_member', 'lower_cross_member_images'],
    ];
    singles.forEach(([prefix, partKey, fieldName]) => encodePart(prefix, partKey, fieldName));

    // ── Misc ─────────────────────────────────────────────────────────────
    fd.append('jack_tool_available', jackTool ? 'true' : 'false');
    fd.append('comments', comments);

    onSave(fd);
  };

  /* ── helper to read initial nested data ─────────────────────────────── */
  const getInitial = (partKey) => {
    const d = initialData;
    const map = {
      bumper_front: d.bumper?.front,
      bumper_rear: d.bumper?.rear,
      fender_lhs: d.fender?.lhs,
      fender_rhs: d.fender?.rhs,
      door_lhs_front: d.door?.lhs_front,
      door_lhs_rear: d.door?.lhs_rear,
      door_rhs_front: d.door?.rhs_front,
      door_rhs_rear: d.door?.rhs_rear,
      pillar_lhs_a: d.pillar?.lhs_a,
      pillar_lhs_b: d.pillar?.lhs_b,
      pillar_lhs_c: d.pillar?.lhs_c,
      pillar_rhs_a: d.pillar?.rhs_a,
      pillar_rhs_b: d.pillar?.rhs_b,
      pillar_rhs_c: d.pillar?.rhs_c,
      quarter_panel_lhs: d.quarter_panel?.lhs,
      quarter_panel_rhs: d.quarter_panel?.rhs,
      running_border_lhs: d.running_border?.lhs,
      running_border_rhs: d.running_border?.rhs,
      windshield_front: d.windshield?.front,
      windshield_rear: d.windshield?.rear,
      orvm_lhs: d.orvm?.lhs,
      orvm_rhs: d.orvm?.rhs,
      lhs_headlight: d.lights?.lhs_headlight,
      rhs_headlight: d.lights?.rhs_headlight,
      lhs_taillight: d.lights?.lhs_taillight,
      rhs_taillight: d.lights?.rhs_taillight,
      tyre_lhs_front: d.tyres?.lhs_front,
      tyre_rhs_front: d.tyres?.rhs_front,
      tyre_lhs_rear: d.tyres?.lhs_rear,
      tyre_rhs_rear: d.tyres?.rhs_rear,
      tyre_spare: d.tyres?.spare,
      bonnet_hood: d.bonnet_hood,
      roof: d.roof,
      dicky_boot_door: d.dicky_boot_door,
      boot_floor: d.boot_floor,
      apron: d.apron,
      cowl_top: d.cowl_top,
      firewall: d.firewall,
      alloy_wheel: d.alloy_wheel,
      radiator_support: d.radiator_support,
      head_light_support: d.head_light_support,
      upper_cross_member: d.upper_cross_member,
      lower_cross_member: d.lower_cross_member,
    };
    return map[partKey];
  };

  /* ── Part editor shorthand ──────────────────────────────────────────── */
  const PE = ({ label, partKey, imageField, condKey }) => (
    <PartEditor
      label={label}
      partKey={partKey}
      data={getInitial(partKey) || {}}
      imageFieldName={imageField}
      conditionsKey={condKey || partKey.split('_')[0]}
      formState={form}
      onChange={handleChange}
      onNewImages={handleNewImages}
    />
  );

  return (
    <div className="space-y-2">

      <Section title="Bumpers" defaultOpen>
        <PE label="Front Bumper" partKey="bumper_front" imageField="bumper_front_images" condKey="bumper" />
        <PE label="Rear Bumper" partKey="bumper_rear" imageField="bumper_rear_images" condKey="bumper" />
      </Section>

      <Section title="Bonnet / Hood">
        <PE label="Bonnet / Hood" partKey="bonnet_hood" imageField="bonnet_hood_images" condKey="bonnet_hood" />
      </Section>

      <Section title="Fenders">
        <PE label="LHS Fender" partKey="fender_lhs" imageField="fender_lhs_images" condKey="fender" />
        <PE label="RHS Fender" partKey="fender_rhs" imageField="fender_rhs_images" condKey="fender" />
      </Section>

      <Section title="Doors">
        <PE label="LHS Front" partKey="door_lhs_front" imageField="door_lhs_front_images" condKey="door" />
        <PE label="LHS Rear" partKey="door_lhs_rear" imageField="door_lhs_rear_images" condKey="door" />
        <PE label="RHS Front" partKey="door_rhs_front" imageField="door_rhs_front_images" condKey="door" />
        <PE label="RHS Rear" partKey="door_rhs_rear" imageField="door_rhs_rear_images" condKey="door" />
      </Section>

      <Section title="Pillars">
        {['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c'].map(k => (
          <PE key={k} label={k.replace('_', ' ').toUpperCase()} partKey={`pillar_${k}`} imageField={`pillar_${k}_images`} condKey="pillar" />
        ))}
      </Section>

      <Section title="Quarter Panels">
        <PE label="LHS Quarter Panel" partKey="quarter_panel_lhs" imageField="quarter_panel_lhs_images" condKey="quarter_panel" />
        <PE label="RHS Quarter Panel" partKey="quarter_panel_rhs" imageField="quarter_panel_rhs_images" condKey="quarter_panel" />
      </Section>

      <Section title="Running Borders">
        <PE label="LHS Running Border" partKey="running_border_lhs" imageField="running_border_lhs_images" condKey="running_border" />
        <PE label="RHS Running Border" partKey="running_border_rhs" imageField="running_border_rhs_images" condKey="running_border" />
      </Section>

      <Section title="Roof">
        <PE label="Roof" partKey="roof" imageField="roof_images" condKey="roof" />
      </Section>

      <Section title="Windshields">
        <PE label="Front Windshield" partKey="windshield_front" imageField="windshield_front_images" condKey="windshield" />
        <PE label="Rear Windshield" partKey="windshield_rear" imageField="windshield_rear_images" condKey="windshield" />
      </Section>

      <Section title="ORVM">
        <PE label="ORVM LHS" partKey="orvm_lhs" imageField="orvm_lhs_images" condKey="orvm" />
        <PE label="ORVM RHS" partKey="orvm_rhs" imageField="orvm_rhs_images" condKey="orvm" />
      </Section>

      <Section title="Lights">
        <PE label="LHS Headlight" partKey="lhs_headlight" imageField="lhs_headlight_images" condKey="lights" />
        <PE label="RHS Headlight" partKey="rhs_headlight" imageField="rhs_headlight_images" condKey="lights" />
        <PE label="LHS Taillight" partKey="lhs_taillight" imageField="lhs_taillight_images" condKey="lights" />
        <PE label="RHS Taillight" partKey="rhs_taillight" imageField="rhs_taillight_images" condKey="lights" />
      </Section>

      <Section title="Tyres">
        {['lhs_front', 'rhs_front', 'lhs_rear', 'rhs_rear', 'spare'].map(k => (
          <PE key={k} label={k.replace(/_/g, ' ').toUpperCase()} partKey={`tyre_${k}`} imageField={`tyre_${k}_images`} condKey="tyres" />
        ))}
      </Section>

      <Section title="Structural / Body Panels">
        <PE label="Boot Floor" partKey="boot_floor" imageField="boot_floor_images" condKey="default" />
        <PE label="Dicky / Boot Door" partKey="dicky_boot_door" imageField="dicky_boot_door_images" condKey="default" />
        <PE label="Apron" partKey="apron" imageField="apron_images" condKey="default" />
        <PE label="Cowl Top" partKey="cowl_top" imageField="cowl_top_images" condKey="default" />
        <PE label="Firewall" partKey="firewall" imageField="firewall_images" condKey="default" />
        <PE label="Alloy Wheel" partKey="alloy_wheel" imageField="alloy_wheel_images" condKey="default" />
        <PE label="Radiator Support" partKey="radiator_support" imageField="radiator_support_images" condKey="default" />
        <PE label="Head Light Support" partKey="head_light_support" imageField="head_light_support_images" condKey="default" />
        <PE label="Upper Cross Member" partKey="upper_cross_member" imageField="upper_cross_member_images" condKey="default" />
        <PE label="Lower Cross Member" partKey="lower_cross_member" imageField="lower_cross_member_images" condKey="default" />
      </Section>

      {/* Misc */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-3">
        <Label>Miscellaneous</Label>
        <div className="flex items-center justify-between">
          <span className="indigo-500/40 text-xs">Jack Tool Available</span>
          <button
            type="button"
            onClick={() => setJackTool(v => !v)}
            className={`w-10 h-5 rounded-full transition-all relative ${jackTool ? 'bg-teal-500' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${jackTool ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        <NoteInput value={comments} onChange={setComments} placeholder="Overall exterior comments…" />
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <p className="text-rose-400 text-xs">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2 sticky bottom-0 pb-2 bg-[#0d1117]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/[0.08] indigo-500/40 text-sm font-semibold hover:indigo-500/70 hover:border-white/20 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-sm font-semibold hover:bg-teal-500/30 hover:border-teal-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving…
            </span>
          ) : 'Save Exterior & Tyres'}
        </button>
      </div>
    </div>
  );
};

export default ExteriorTyresEditForm;