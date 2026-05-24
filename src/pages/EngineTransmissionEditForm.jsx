import React, { useState, useRef } from 'react';

/* ─── Condition options per sub-part ─────────────────────────────────────── */
const CONDITIONS_MAP = {
  engine: ['oil_leak', 'noise', 'overheating', 'smoke', 'vibration', 'replaced'],
  engine_oil: ['dirty', 'low_level', 'leaking', 'sludge'],
  coolant: ['dirty', 'low_level', 'leaking', 'rusty'],
  battery: ['weak', 'dead', 'acid_leak', 'swollen', 'replaced'],
  clutch: ['slipping', 'hard', 'noise', 'worn', 'replaced'],
  gear_shifting: ['hard', 'slip', 'noise', 'replaced'],
  turbo_charger: ['noise', 'smoke', 'leaking', 'replaced', 'absent'],
  fuel_injector: ['leaking', 'clogged', 'noise', 'replaced'],
  radiator_fan: ['noise', 'not_working', 'replaced'],
  exhaust: ['smoke', 'noise', 'leaking', 'replaced'],
  steering: ['hard', 'noise', 'play', 'replaced'],
  suspension: ['noise', 'worn', 'replaced', 'sagging'],
  brake: ['noise', 'fade', 'vibration', 'replaced', 'low_pad'],
  default: ['damaged', 'replaced', 'noise', 'leaking', 'worn'],
};

const STATUS_OPTIONS = ['ok', 'issue', 'na'];

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

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="indigo-500/40 text-xs">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-rose-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  </div>
);

/* ─── Image upload strip ─────────────────────────────────────────────────── */
const ImageUploadStrip = ({ fieldName, existingImages = [], newFiles, onNewFiles }) => {
  const inputRef = useRef();
  return (
    <div className="mt-2">
      <div className="flex gap-2 flex-wrap">
        {existingImages.map((img, i) => (
          <div key={i} className="relative w-[60px] h-[45px] rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {newFiles && Array.from(newFiles).map((f, i) => (
          <div key={`new-${i}`} className="relative w-[60px] h-[45px] rounded-lg overflow-hidden border border-teal-500/30 flex-shrink-0">
            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-[7px] indigo-500 font-bold">N</span>
            </div>
          </div>
        ))}
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
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => onNewFiles(e.target.files)} />
      </div>
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
        <svg className={`w-4 h-4 indigo-500/20 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN: EngineTransmissionEditForm
   ══════════════════════════════════════════════════════════════════════════ */
const EngineTransmissionEditForm = ({ initialData = {}, onSave, onCancel, saving = false, error = '' }) => {

  const d = initialData; // shorthand

  /* ── Flat state ─────────────────────────────────────────────────────── */
  // Engine
  const [engineStatus, setEngineStatus] = useState(d.engine?.status || 'ok');
  const [engineConditions, setEngineConditions] = useState(d.engine?.conditions || []);
  const [engineNotes, setEngineNotes] = useState(d.engine?.notes || '');
  const [milLight, setMilLight] = useState(d.engine?.mil_light_glowing || false);
  const [wiringDamaged, setWiringDamaged] = useState(d.engine?.electrical_wiring_damaged || false);
  const [airFilterDamaged, setAirFilterDamaged] = useState(d.engine?.air_filter_box_damaged || false);

  // Engine Oil
  const [oilStatus, setOilStatus] = useState(d.engine_oil?.status || 'ok');
  const [oilConditions, setOilConditions] = useState(d.engine_oil?.conditions || []);
  const [oilNotes, setOilNotes] = useState(d.engine_oil?.notes || '');
  const [oilLeakTappet, setOilLeakTappet] = useState(d.engine_oil?.leakage_from_tappet_cover || false);

  // Coolant
  const [coolantStatus, setCoolantStatus] = useState(d.coolant?.status || 'ok');
  const [coolantConditions, setCoolantConditions] = useState(d.coolant?.conditions || []);
  const [coolantNotes, setCoolantNotes] = useState(d.coolant?.notes || '');
  const [coolantDirty, setCoolantDirty] = useState(d.coolant?.dirty || false);
  const [coolantLow, setCoolantLow] = useState(d.coolant?.level_low || false);

  // Battery
  const [batteryStatus, setBatteryStatus] = useState(d.battery?.status || 'ok');
  const [batteryConditions, setBatteryConditions] = useState(d.battery?.conditions || []);
  const [batteryNotes, setBatteryNotes] = useState(d.battery?.notes || '');
  const [batteryAcidLeak, setBatteryAcidLeak] = useState(d.battery?.acid_leakage || false);

  // Transmission
  const [clutchStatus, setClutchStatus] = useState(d.clutch?.status || 'ok');
  const [clutchConditions, setClutchConditions] = useState(d.clutch?.conditions || []);
  const [clutchNotes, setClutchNotes] = useState(d.clutch?.notes || '');

  const [gearStatus, setGearStatus] = useState(d.gear_shifting?.status || 'ok');
  const [gearConditions, setGearConditions] = useState(d.gear_shifting?.conditions || []);
  const [gearNotes, setGearNotes] = useState(d.gear_shifting?.notes || '');

  const [turboStatus, setTurboStatus] = useState(d.turbo_charger?.status || 'ok');
  const [turboConditions, setTurboConditions] = useState(d.turbo_charger?.conditions || []);
  const [turboNotes, setTurboNotes] = useState(d.turbo_charger?.notes || '');

  const [injectorStatus, setInjectorStatus] = useState(d.fuel_injector?.status || 'ok');
  const [injectorConditions, setInjectorConditions] = useState(d.fuel_injector?.conditions || []);
  const [injectorNotes, setInjectorNotes] = useState(d.fuel_injector?.notes || '');

  const [radiatorFanStatus, setRadiatorFanStatus] = useState(d.radiator_fan_motor?.status || 'ok');
  const [radiatorFanConditions, setRadiatorFanConditions] = useState(d.radiator_fan_motor?.conditions || []);
  const [radiatorFanNotes, setRadiatorFanNotes] = useState(d.radiator_fan_motor?.notes || '');

  // Engine sounds & exhaust
  const [engineSoundStatus, setEngineSoundStatus] = useState(d.engine_sound?.status || 'ok');
  const [engineSoundNotes, setEngineSoundNotes] = useState(d.engine_sound?.notes || '');

  const [exhaustStatus, setExhaustStatus] = useState(d.exhaust_smoke?.status || 'ok');
  const [exhaustNotes, setExhaustNotes] = useState(d.exhaust_smoke?.notes || '');

  const [engineMountingStatus, setEngineMountingStatus] = useState(d.engine_mounting?.status || 'ok');
  const [engineMountingNotes, setEngineMountingNotes] = useState(d.engine_mounting?.notes || '');

  // Steering / Suspension / Brakes
  const [steeringStatus, setSteeringStatus] = useState(d.steering_suspension_brakes?.steering?.status || 'ok');
  const [steeringHard, setSteeringHard] = useState(d.steering_suspension_brakes?.steering?.hard || false);
  const [steeringNoise, setSteeringNoise] = useState(d.steering_suspension_brakes?.steering?.abnormal_noise || false);
  const [steeringConditions, setSteeringConditions] = useState(d.steering_suspension_brakes?.steering?.conditions || []);
  const [steeringNotes, setSteeringNotes] = useState(d.steering_suspension_brakes?.steering?.notes || '');

  const [suspensionStatus, setSuspensionStatus] = useState(d.steering_suspension_brakes?.suspension?.status || 'ok');
  const [suspensionNoise, setSuspensionNoise] = useState(d.steering_suspension_brakes?.suspension?.abnormal_noise || false);
  const [suspensionConditions, setSuspensionConditions] = useState(d.steering_suspension_brakes?.suspension?.conditions || []);
  const [suspensionNotes, setSuspensionNotes] = useState(d.steering_suspension_brakes?.suspension?.notes || '');

  const [brakeStatus, setBrakeStatus] = useState(d.steering_suspension_brakes?.brake?.status || 'ok');
  const [brakeNoisy, setBrakeNoisy] = useState(d.steering_suspension_brakes?.brake?.noisy || false);
  const [brakeConditions, setBrakeConditions] = useState(d.steering_suspension_brakes?.brake?.conditions || []);
  const [brakeNotes, setBrakeNotes] = useState(d.steering_suspension_brakes?.brake?.notes || '');

  const [towingRecommended, setTowingRecommended] = useState(d.towing_recommended || false);
  const [comments, setComments] = useState(d.comments || '');

  // New image files state (keyed by multer field name)
  const [newFiles, setNewFiles] = useState({});
  const handleNewFiles = (fieldName, files) => setNewFiles(prev => ({ ...prev, [fieldName]: files }));

  const imgStrip = (fieldName, existingImages = []) => (
    <ImageUploadStrip
      fieldName={fieldName}
      existingImages={existingImages}
      newFiles={newFiles[fieldName]}
      onNewFiles={files => handleNewFiles(fieldName, files)}
    />
  );

  /* ── Build FormData ─────────────────────────────────────────────────── */
  const handleSubmit = () => {
    const fd = new FormData();

    // Engine
    fd.append('engine[status]', engineStatus);
    fd.append('engine[notes]', engineNotes);
    fd.append('engine[mil_light_glowing]', milLight.toString());
    fd.append('engine[electrical_wiring_damaged]', wiringDamaged.toString());
    fd.append('engine[air_filter_box_damaged]', airFilterDamaged.toString());
    engineConditions.forEach(c => fd.append('engine[conditions][]', c));

    // Engine Oil
    fd.append('engine_oil[status]', oilStatus);
    fd.append('engine_oil[notes]', oilNotes);
    fd.append('engine_oil[leakage_from_tappet_cover]', oilLeakTappet.toString());
    oilConditions.forEach(c => fd.append('engine_oil[conditions][]', c));

    // Coolant
    fd.append('coolant[status]', coolantStatus);
    fd.append('coolant[notes]', coolantNotes);
    fd.append('coolant[dirty]', coolantDirty.toString());
    fd.append('coolant[level_low]', coolantLow.toString());
    coolantConditions.forEach(c => fd.append('coolant[conditions][]', c));

    // Battery
    fd.append('battery[status]', batteryStatus);
    fd.append('battery[notes]', batteryNotes);
    fd.append('battery[acid_leakage]', batteryAcidLeak.toString());
    batteryConditions.forEach(c => fd.append('battery[conditions][]', c));

    // Clutch
    fd.append('clutch[status]', clutchStatus);
    fd.append('clutch[notes]', clutchNotes);
    clutchConditions.forEach(c => fd.append('clutch[conditions][]', c));

    // Gear shifting
    fd.append('gear_shifting[status]', gearStatus);
    fd.append('gear_shifting[notes]', gearNotes);
    gearConditions.forEach(c => fd.append('gear_shifting[conditions][]', c));

    // Turbo
    fd.append('turbo_charger[status]', turboStatus);
    fd.append('turbo_charger[notes]', turboNotes);
    turboConditions.forEach(c => fd.append('turbo_charger[conditions][]', c));

    // Fuel injector
    fd.append('fuel_injector[status]', injectorStatus);
    fd.append('fuel_injector[notes]', injectorNotes);
    injectorConditions.forEach(c => fd.append('fuel_injector[conditions][]', c));

    // Radiator fan
    fd.append('radiator_fan_motor[status]', radiatorFanStatus);
    fd.append('radiator_fan_motor[notes]', radiatorFanNotes);
    radiatorFanConditions.forEach(c => fd.append('radiator_fan_motor[conditions][]', c));

    // Engine sound / exhaust / mounting
    fd.append('engine_sound[status]', engineSoundStatus);
    fd.append('engine_sound[notes]', engineSoundNotes);
    fd.append('exhaust_smoke[status]', exhaustStatus);
    fd.append('exhaust_smoke[notes]', exhaustNotes);
    fd.append('engine_mounting[status]', engineMountingStatus);
    fd.append('engine_mounting[notes]', engineMountingNotes);

    // Steering
    fd.append('steering[status]', steeringStatus);
    fd.append('steering[hard]', steeringHard.toString());
    fd.append('steering[abnormal_noise]', steeringNoise.toString());
    fd.append('steering[notes]', steeringNotes);
    steeringConditions.forEach(c => fd.append('steering[conditions][]', c));

    // Suspension
    fd.append('suspension[status]', suspensionStatus);
    fd.append('suspension[abnormal_noise]', suspensionNoise.toString());
    fd.append('suspension[notes]', suspensionNotes);
    suspensionConditions.forEach(c => fd.append('suspension[conditions][]', c));

    // Brakes
    fd.append('brake[status]', brakeStatus);
    fd.append('brake[noisy]', brakeNoisy.toString());
    fd.append('brake[notes]', brakeNotes);
    brakeConditions.forEach(c => fd.append('brake[conditions][]', c));

    // Misc
    fd.append('towing_recommended', towingRecommended.toString());
    fd.append('comments', comments);

    // Append image files (using exact multer field names from your router)
    const fileFields = [
      'engine_images', 'mil_light_images', 'air_filter_box_images',
      'electrical_wiring_images', 'engine_sound_images', 'engine_mounting_images',
      'exhaust_smoke_images', 'engine_oil_images', 'engine_oil_dipstik_images',
      'tappet_cover_images', 'coolant_images', 'battery_images',
      'clutch_images', 'gear_shifting_images', 'turbo_charger_images',
      'fuel_injector_images', 'sump_images', 'radiator_fan_motor_images',
    ];
    fileFields.forEach(fieldName => {
      const files = newFiles[fieldName];
      if (files) Array.from(files).forEach(f => fd.append(fieldName, f));
    });

    onSave(fd);
  };

  return (
    <div className="space-y-2">

      {/* ── ENGINE ──────────────────────────────────────────────────────── */}
      <Section title="Engine" defaultOpen>
        <div className="flex items-center justify-between mb-2">
          <span className="indigo-500/50 text-xs font-medium">Engine Status</span>
          <StatusSelect value={engineStatus} onChange={setEngineStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.engine} selected={engineConditions} onChange={setEngineConditions} />
        <NoteInput value={engineNotes} onChange={setEngineNotes} placeholder="Engine notes…" />
        {imgStrip('engine_images', d.engine?.images)}

        <div className="mt-3 space-y-0 divide-y divide-white/[0.04]">
          <Toggle label="MIL Light Glowing" value={milLight} onChange={setMilLight} />
          <Toggle label="Electrical Wiring Damaged" value={wiringDamaged} onChange={setWiringDamaged} />
          <Toggle label="Air Filter Box Damaged" value={airFilterDamaged} onChange={setAirFilterDamaged} />
        </div>
        {imgStrip('mil_light_images', d.engine?.mil_light_images)}
        {imgStrip('electrical_wiring_images', d.engine?.electrical_wiring_images)}
        {imgStrip('air_filter_box_images', d.engine?.air_filter_box_images)}
      </Section>

      {/* ── ENGINE SOUND / MOUNTING / EXHAUST ───────────────────────────── */}
      <Section title="Engine Sound, Mounting & Exhaust">
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Engine Sound</span>
            <StatusSelect value={engineSoundStatus} onChange={setEngineSoundStatus} />
          </div>
          <NoteInput value={engineSoundNotes} onChange={setEngineSoundNotes} placeholder="Engine sound notes…" />
          {imgStrip('engine_sound_images', d.engine_sound?.images)}
        </div>
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Engine Mounting</span>
            <StatusSelect value={engineMountingStatus} onChange={setEngineMountingStatus} />
          </div>
          <NoteInput value={engineMountingNotes} onChange={setEngineMountingNotes} placeholder="Mounting notes…" />
          {imgStrip('engine_mounting_images', d.engine_mounting?.images)}
        </div>
        <div className="py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Exhaust Smoke</span>
            <StatusSelect value={exhaustStatus} onChange={setExhaustStatus} />
          </div>
          <NoteInput value={exhaustNotes} onChange={setExhaustNotes} placeholder="Exhaust notes…" />
          {imgStrip('exhaust_smoke_images', d.exhaust_smoke?.images)}
        </div>
      </Section>

      {/* ── ENGINE OIL ──────────────────────────────────────────────────── */}
      <Section title="Engine Oil">
        <div className="flex items-center justify-between mb-2">
          <span className="indigo-500/50 text-xs font-medium">Oil Status</span>
          <StatusSelect value={oilStatus} onChange={setOilStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.engine_oil} selected={oilConditions} onChange={setOilConditions} />
        <NoteInput value={oilNotes} onChange={setOilNotes} placeholder="Oil notes…" />
        <Toggle label="Leakage from Tappet Cover" value={oilLeakTappet} onChange={setOilLeakTappet} />
        <div className="space-y-1 mt-2">
          <p className="indigo-500/25 text-[10px] font-bold uppercase tracking-widest">Oil Images</p>
          {imgStrip('engine_oil_images', d.engine_oil?.images)}
          <p className="indigo-500/25 text-[10px] font-bold uppercase tracking-widest mt-2">Dipstick Images</p>
          {imgStrip('engine_oil_dipstik_images', [])}
          <p className="indigo-500/25 text-[10px] font-bold uppercase tracking-widest mt-2">Tappet Cover</p>
          {imgStrip('tappet_cover_images', [])}
        </div>
      </Section>

      {/* ── COOLANT ─────────────────────────────────────────────────────── */}
      <Section title="Coolant">
        <div className="flex items-center justify-between mb-2">
          <span className="indigo-500/50 text-xs font-medium">Coolant Status</span>
          <StatusSelect value={coolantStatus} onChange={setCoolantStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.coolant} selected={coolantConditions} onChange={setCoolantConditions} />
        <NoteInput value={coolantNotes} onChange={setCoolantNotes} placeholder="Coolant notes…" />
        <Toggle label="Dirty" value={coolantDirty} onChange={setCoolantDirty} />
        <Toggle label="Level Low" value={coolantLow} onChange={setCoolantLow} />
        {imgStrip('coolant_images', d.coolant?.images)}
      </Section>

      {/* ── BATTERY ─────────────────────────────────────────────────────── */}
      <Section title="Battery">
        <div className="flex items-center justify-between mb-2">
          <span className="indigo-500/50 text-xs font-medium">Battery Status</span>
          <StatusSelect value={batteryStatus} onChange={setBatteryStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.battery} selected={batteryConditions} onChange={setBatteryConditions} />
        <NoteInput value={batteryNotes} onChange={setBatteryNotes} placeholder="Battery notes…" />
        <Toggle label="Acid Leakage" value={batteryAcidLeak} onChange={setBatteryAcidLeak} />
        {imgStrip('battery_images', d.battery?.images)}
      </Section>

      {/* ── TRANSMISSION ────────────────────────────────────────────────── */}
      <Section title="Transmission — Clutch & Gears">
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Clutch</span>
            <StatusSelect value={clutchStatus} onChange={setClutchStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.clutch} selected={clutchConditions} onChange={setClutchConditions} />
          <NoteInput value={clutchNotes} onChange={setClutchNotes} />
          {imgStrip('clutch_images', d.clutch?.images)}
        </div>
        <div className="py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Gear Shifting</span>
            <StatusSelect value={gearStatus} onChange={setGearStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.gear_shifting} selected={gearConditions} onChange={setGearConditions} />
          <NoteInput value={gearNotes} onChange={setGearNotes} />
          {imgStrip('gear_shifting_images', d.gear_shifting?.images)}
        </div>
      </Section>

      <Section title="Turbo, Injector & Radiator Fan">
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Turbo Charger</span>
            <StatusSelect value={turboStatus} onChange={setTurboStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.turbo_charger} selected={turboConditions} onChange={setTurboConditions} />
          <NoteInput value={turboNotes} onChange={setTurboNotes} />
          {imgStrip('turbo_charger_images', d.turbo_charger?.images)}
        </div>
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Fuel Injector</span>
            <StatusSelect value={injectorStatus} onChange={setInjectorStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.fuel_injector} selected={injectorConditions} onChange={setInjectorConditions} />
          <NoteInput value={injectorNotes} onChange={setInjectorNotes} />
          {imgStrip('fuel_injector_images', d.fuel_injector?.images)}
        </div>
        <div className="py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Radiator Fan Motor</span>
            <StatusSelect value={radiatorFanStatus} onChange={setRadiatorFanStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.radiator_fan} selected={radiatorFanConditions} onChange={setRadiatorFanConditions} />
          <NoteInput value={radiatorFanNotes} onChange={setRadiatorFanNotes} />
          {imgStrip('radiator_fan_motor_images', d.radiator_fan_motor?.images)}
        </div>
      </Section>

      {/* ── STEERING / SUSPENSION / BRAKES ──────────────────────────────── */}
      <Section title="Steering, Suspension & Brakes">
        {/* Steering */}
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Steering</span>
            <StatusSelect value={steeringStatus} onChange={setSteeringStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.steering} selected={steeringConditions} onChange={setSteeringConditions} />
          <NoteInput value={steeringNotes} onChange={setSteeringNotes} />
          <Toggle label="Hard" value={steeringHard} onChange={setSteeringHard} />
          <Toggle label="Abnormal Noise" value={steeringNoise} onChange={setSteeringNoise} />
        </div>
        {/* Suspension */}
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Suspension</span>
            <StatusSelect value={suspensionStatus} onChange={setSuspensionStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.suspension} selected={suspensionConditions} onChange={setSuspensionConditions} />
          <NoteInput value={suspensionNotes} onChange={setSuspensionNotes} />
          <Toggle label="Abnormal Noise" value={suspensionNoise} onChange={setSuspensionNoise} />
        </div>
        {/* Brakes */}
        <div className="py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="indigo-500/40 text-xs">Brakes</span>
            <StatusSelect value={brakeStatus} onChange={setBrakeStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.brake} selected={brakeConditions} onChange={setBrakeConditions} />
          <NoteInput value={brakeNotes} onChange={setBrakeNotes} />
          <Toggle label="Noisy" value={brakeNoisy} onChange={setBrakeNoisy} />
        </div>
      </Section>

      {/* ── MISC ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
        <Label>General</Label>
        <Toggle label="Towing Recommended" value={towingRecommended} onChange={setTowingRecommended} />
        <NoteInput value={comments} onChange={setComments} placeholder="Overall engine/transmission comments…" />
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <p className="text-rose-400 text-xs">{error}</p>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2 sticky bottom-0 pb-2 bg-[#0d1117]">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/[0.08] indigo-500/40 text-sm font-semibold hover:indigo-500/70 hover:border-white/20 transition-all">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-sm font-semibold hover:bg-teal-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {saving
            ? <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving…
            </span>
            : 'Save Engine & Transmission'}
        </button>
      </div>
    </div>
  );
};

export default EngineTransmissionEditForm;