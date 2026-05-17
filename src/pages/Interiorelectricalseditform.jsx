// ═══════════════════════════════════════════════════════════════════════════
//  InteriorElectricalsEditForm.jsx
//  API endpoint: PUT /api/admin/car/:carId/electricals-interior
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';

const STATUS_OPTIONS = ['ok', 'issue', 'na'];

const CONDITIONS_MAP = {
  interior: ['torn','stained','faded','replaced','worn','cracked'],
  door_trim: ['torn','scratched','broken','replaced'],
  leather_seat: ['torn','cracked','stained','replaced'],
  roof_lining: ['torn','stained','sagging','replaced'],
  music_system: ['not_working','cracked_screen','replaced','absent'],
  abs: ['fault','light_on','replaced'],
  default: ['damaged','replaced','not_working','absent'],
};

/* ─── Atoms ──────────────────────────────────────────────────────────────── */
const Label = ({ children }) => (
  <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase mb-2">{children}</p>
);

const StatusSelect = ({ value, onChange }) => (
  <div className="flex gap-1.5">
    {STATUS_OPTIONS.map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all border ${
          value === s
            ? s === 'ok'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : s === 'issue'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              : 'bg-white/10 border-white/20 text-white/60'
            : 'bg-transparent border-white/[0.07] text-white/25 hover:border-white/20 hover:text-white/40'
        }`}>{s}</button>
    ))}
  </div>
);

const ConditionPills = ({ options = [], selected = [], onChange }) => (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {options.map(c => {
      const active = selected.includes(c);
      return (
        <button key={c} type="button"
          onClick={() => onChange(active ? selected.filter(x => x !== c) : [...selected, c])}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all capitalize border ${
            active ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-transparent border-white/[0.07] text-white/25 hover:text-white/40'
          }`}>
          {c.replace(/_/g, ' ')}
        </button>
      );
    })}
  </div>
);

const NoteInput = ({ value, onChange, placeholder = 'Add a note…' }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/60 text-xs placeholder-white/20 focus:outline-none focus:border-teal-500/40 focus:bg-white/[0.05] resize-none transition-all" />
);

const Toggle = ({ label, value, onChange, extra = '' }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-white/40 text-xs">{label}{extra && <span className="text-white/20 ml-1 text-[10px]">{extra}</span>}</span>
    <button type="button" onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-teal-500' : 'bg-white/10'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  </div>
);

const NumberInput = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
    <span className="text-white/40 text-xs">{label}</span>
    <input type="number" value={value} onChange={e => onChange(e.target.value)} min={0} max={20}
      className="w-16 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/70 text-xs text-right focus:outline-none focus:border-teal-500/40 transition-all" />
  </div>
);

const ImageUploadStrip = ({ fieldName, existingImages = [], newFiles, onNewFiles }) => {
  const inputRef = useRef();
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {existingImages.map((img, i) => (
        <div key={i} className="w-[60px] h-[45px] rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
          <img src={img.url} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
      {newFiles && Array.from(newFiles).map((f, i) => (
        <div key={`n-${i}`} className="relative w-[60px] h-[45px] rounded-lg overflow-hidden border border-teal-500/30 flex-shrink-0">
          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center">
            <span className="text-[7px] text-white font-bold">N</span>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => inputRef.current?.click()}
        className="w-[60px] h-[45px] rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center gap-0.5 text-white/20 hover:border-teal-500/40 hover:text-teal-400/60 transition-all flex-shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        <span className="text-[8px] font-bold">ADD</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onNewFiles(e.target.files)} />
    </div>
  );
};

const Section = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden mb-3">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-all">
        <span className="text-white/50 text-xs font-bold tracking-widest uppercase">{title}</span>
        <svg className={`w-4 h-4 text-white/20 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   InteriorElectricalsEditForm
   ══════════════════════════════════════════════════════════════════════════ */
const InteriorElectricalsEditForm = ({ initialData: d = {}, onSave, onCancel, saving = false, error = '' }) => {

  // Interior cabin
  const [interiorStatus,       setInteriorStatus]       = useState(d.interior?.status || 'ok');
  const [interiorConditions,   setInteriorConditions]   = useState(d.interior?.conditions || []);
  const [interiorNotes,        setInteriorNotes]        = useState(d.interior?.notes || '');

  // Door trim
  const [doorTrimStatus,       setDoorTrimStatus]       = useState(d.door_trim?.status || 'ok');
  const [doorTrimConditions,   setDoorTrimConditions]   = useState(d.door_trim?.conditions || []);
  const [doorTrimNotes,        setDoorTrimNotes]        = useState(d.door_trim?.notes || '');

  // Seats
  const [leatherStatus,        setLeatherStatus]        = useState(d.leather_seat?.status || 'ok');
  const [leatherConditions,    setLeatherConditions]    = useState(d.leather_seat?.conditions || []);
  const [leatherNotes,         setLeatherNotes]         = useState(d.leather_seat?.notes || '');

  // Roof lining
  const [roofLiningStatus,     setRoofLiningStatus]     = useState(d.roof_lining?.status || 'ok');
  const [roofLiningConditions, setRoofLiningConditions] = useState(d.roof_lining?.conditions || []);
  const [roofLiningNotes,      setRoofLiningNotes]      = useState(d.roof_lining?.notes || '');

  // Electricals
  const [absStatus,            setAbsStatus]            = useState(d.abs?.status || 'ok');
  const [absConditions,        setAbsConditions]        = useState(d.abs?.conditions || []);
  const [musicStatus,          setMusicStatus]          = useState(d.music_system?.status || 'ok');
  const [musicConditions,      setMusicConditions]      = useState(d.music_system?.conditions || []);

  // Toggles
  const [powerWindows,         setPowerWindows]         = useState(d.power_windows || false);
  const [noOfPowerWindows,     setNoOfPowerWindows]     = useState(d.no_of_power_windows ?? 0);
  const [airbagFeature,        setAirbagFeature]        = useState(d.airbag_feature || false);
  const [noOfAirbags,          setNoOfAirbags]          = useState(d.no_of_airbags ?? 0);
  const [sunroof,              setSunroof]              = useState(d.sunroof || false);
  const [fabricSeat,           setFabricSeat]           = useState(d.fabric_seat || false);
  const [rearDefogger,         setRearDefogger]         = useState(d.rear_defogger || false);
  const [reverseCamera,        setReverseCamera]        = useState(d.reverse_camera || false);
  const [parkingSensor,        setParkingSensor]        = useState(d.parking_sensor || false);
  const [navigationChip,       setNavigationChip]       = useState(d.navigation_chip || false);
  const [steeringAudio,        setSteeringAudio]        = useState(d.steering_mounted_audio_control || false);
  const [electricalStatus,     setElectricalStatus]     = useState(d.electrical || 'ok');

  // Remote key
  const [remoteKeyAvailable,   setRemoteKeyAvailable]   = useState(d.remote_key?.available || false);
  const [remoteKeyNotes,       setRemoteKeyNotes]       = useState(d.remote_key?.notes || '');

  const [comments,             setComments]             = useState(d.comments || '');

  // Images
  const [newFiles, setNewFiles] = useState({});
  const handleNewFiles = (field, files) => setNewFiles(prev => ({ ...prev, [field]: files }));

  const imgStrip = (fieldName, existingImages = []) => (
    <ImageUploadStrip
      fieldName={fieldName}
      existingImages={existingImages}
      newFiles={newFiles[fieldName]}
      onNewFiles={files => handleNewFiles(fieldName, files)}
    />
  );

  const handleSubmit = () => {
    const fd = new FormData();

    fd.append('interior[status]',        interiorStatus);
    fd.append('interior[notes]',         interiorNotes);
    interiorConditions.forEach(c => fd.append('interior[conditions][]', c));

    fd.append('door_trim[status]',       doorTrimStatus);
    fd.append('door_trim[notes]',        doorTrimNotes);
    doorTrimConditions.forEach(c => fd.append('door_trim[conditions][]', c));

    fd.append('leather_seat[status]',    leatherStatus);
    fd.append('leather_seat[notes]',     leatherNotes);
    leatherConditions.forEach(c => fd.append('leather_seat[conditions][]', c));

    fd.append('roof_lining[status]',     roofLiningStatus);
    fd.append('roof_lining[notes]',      roofLiningNotes);
    roofLiningConditions.forEach(c => fd.append('roof_lining[conditions][]', c));

    fd.append('abs[status]',             absStatus);
    absConditions.forEach(c => fd.append('abs[conditions][]', c));

    fd.append('music_system[status]',    musicStatus);
    musicConditions.forEach(c => fd.append('music_system[conditions][]', c));

    fd.append('power_windows',                       powerWindows.toString());
    fd.append('no_of_power_windows',                 noOfPowerWindows);
    fd.append('airbag_feature',                      airbagFeature.toString());
    fd.append('no_of_airbags',                       noOfAirbags);
    fd.append('sunroof',                             sunroof.toString());
    fd.append('fabric_seat',                         fabricSeat.toString());
    fd.append('rear_defogger',                       rearDefogger.toString());
    fd.append('reverse_camera',                      reverseCamera.toString());
    fd.append('parking_sensor',                      parkingSensor.toString());
    fd.append('navigation_chip',                     navigationChip.toString());
    fd.append('steering_mounted_audio_control',      steeringAudio.toString());
    fd.append('electrical',                          electricalStatus);

    fd.append('remote_key[available]',   remoteKeyAvailable.toString());
    fd.append('remote_key[notes]',       remoteKeyNotes);

    fd.append('comments',                comments);

    // Image files
    Object.entries(newFiles).forEach(([field, files]) => {
      if (files) Array.from(files).forEach(f => fd.append(field, f));
    });

    onSave(fd);
  };

  return (
    <div className="space-y-2">

      <Section title="Interior Cabin" defaultOpen>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-medium">Cabin Status</span>
          <StatusSelect value={interiorStatus} onChange={setInteriorStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.interior} selected={interiorConditions} onChange={setInteriorConditions} />
        <NoteInput value={interiorNotes} onChange={setInteriorNotes} placeholder="Interior notes…" />
        {imgStrip('interior_images', d.interior?.images)}
      </Section>

      <Section title="Door Trim">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-medium">Door Trim Status</span>
          <StatusSelect value={doorTrimStatus} onChange={setDoorTrimStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.door_trim} selected={doorTrimConditions} onChange={setDoorTrimConditions} />
        <NoteInput value={doorTrimNotes} onChange={setDoorTrimNotes} />
      </Section>

      <Section title="Seats">
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-xs">Leather Seat</span>
            <StatusSelect value={leatherStatus} onChange={setLeatherStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.leather_seat} selected={leatherConditions} onChange={setLeatherConditions} />
          <NoteInput value={leatherNotes} onChange={setLeatherNotes} />
        </div>
        <Toggle label="Fabric Seat" value={fabricSeat} onChange={setFabricSeat} />
      </Section>

      <Section title="Roof Lining">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-medium">Roof Lining Status</span>
          <StatusSelect value={roofLiningStatus} onChange={setRoofLiningStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.roof_lining} selected={roofLiningConditions} onChange={setRoofLiningConditions} />
        <NoteInput value={roofLiningNotes} onChange={setRoofLiningNotes} />
      </Section>

      <Section title="Safety & Electricals">
        <div className="py-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-xs">ABS</span>
            <StatusSelect value={absStatus} onChange={setAbsStatus} />
          </div>
          <ConditionPills options={CONDITIONS_MAP.abs} selected={absConditions} onChange={setAbsConditions} />
        </div>
        <Toggle label="Power Windows" value={powerWindows} onChange={setPowerWindows} />
        {powerWindows && (
          <NumberInput label="Number of Power Windows" value={noOfPowerWindows} onChange={setNoOfPowerWindows} />
        )}
        <Toggle label="Airbags" value={airbagFeature} onChange={setAirbagFeature} />
        {airbagFeature && (
          <NumberInput label="Number of Airbags" value={noOfAirbags} onChange={setNoOfAirbags} />
        )}
        <Toggle label="Sunroof"               value={sunroof}         onChange={setSunroof} />
        <Toggle label="Rear Defogger"         value={rearDefogger}    onChange={setRearDefogger} />
        <Toggle label="Reverse Camera"        value={reverseCamera}   onChange={setReverseCamera} />
        <Toggle label="Parking Sensor"        value={parkingSensor}   onChange={setParkingSensor} />
        <Toggle label="Navigation Chip"       value={navigationChip}  onChange={setNavigationChip} />
        <Toggle label="Steering Audio Control" value={steeringAudio}  onChange={setSteeringAudio} />
        <div className="pt-2 border-t border-white/[0.04] mt-1">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs">Overall Electrical</span>
            <StatusSelect value={electricalStatus} onChange={setElectricalStatus} />
          </div>
        </div>
      </Section>

      <Section title="Music System">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-medium">Music System Status</span>
          <StatusSelect value={musicStatus} onChange={setMusicStatus} />
        </div>
        <ConditionPills options={CONDITIONS_MAP.music_system} selected={musicConditions} onChange={setMusicConditions} />
      </Section>

      <Section title="Remote Key">
        <Toggle label="Remote Key Available" value={remoteKeyAvailable} onChange={setRemoteKeyAvailable} />
        {remoteKeyAvailable && (
          <NoteInput value={remoteKeyNotes} onChange={setRemoteKeyNotes} placeholder="Remote key notes…" />
        )}
      </Section>

      <Section title="Interior Photos">
        {imgStrip('interior_images', d.images || [])}
      </Section>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
        <Label>Comments</Label>
        <NoteInput value={comments} onChange={setComments} placeholder="Overall interior/electricals comments…" />
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <p className="text-rose-400 text-xs">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2 sticky bottom-0 pb-2 bg-[#0d1117]">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-sm font-semibold hover:text-white/70 hover:border-white/20 transition-all">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-sm font-semibold hover:bg-teal-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {saving
            ? <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Saving…
              </span>
            : 'Save Interior & Electricals'}
        </button>
      </div>
    </div>
  );
};

export default InteriorElectricalsEditForm;