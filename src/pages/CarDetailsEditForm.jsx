// ═══════════════════════════════════════════════════════════════════════════
//  CarDetailsEditForm.jsx
//  API endpoint: PUT /api/admin/car/:carId/car-details
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';

/* ─── Shared atoms ───────────────────────────────────────────────────────── */
const Label = ({ children }) => (
  <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-2">{children}</p>
);

const Field = ({ label, children }) => (
  <div className="py-2 border-b border-white/[0.04] last:border-0">
    <p className="indigo-500/30 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder = '' }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/70 text-xs indigo-500 focus:outline-none focus:border-teal-500/40 focus:bg-white/[0.05] transition-all"
  />
);

const SelectInput = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/70 text-xs focus:outline-none focus:border-teal-500/40 transition-all appearance-none"
  >
    <option value="">— Select —</option>
    {options.map(o => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
);

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="indigo-500/40 text-xs">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-teal-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
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
        <div key={`new-${i}`} className="relative w-[60px] h-[45px] rounded-lg overflow-hidden border border-teal-500/30 flex-shrink-0">
          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center">
            <span className="text-[7px] indigo-500 font-bold">N</span>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => inputRef.current?.click()}
        className="w-[60px] h-[45px] rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center gap-0.5 indigo-500/20 hover:border-teal-500/40 hover:text-teal-400/60 transition-all flex-shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="text-[8px] font-bold">ADD</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => onNewFiles(e.target.files)} />
    </div>
  );
};

const Section = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden mb-3">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-all">
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
   CarDetailsEditForm
   ══════════════════════════════════════════════════════════════════════════ */
export const CarDetailsEditForm = ({ initialData: d = {}, onSave, onCancel, saving = false, error = '' }) => {
  const [make, setMake] = useState(d.make || '');
  const [model, setModel] = useState(d.model || '');
  const [variant, setVariant] = useState(d.variant || '');
  const [yearOfMfg, setYearOfMfg] = useState(d.year_of_manufacturing || '');
  const [mfgMonth, setMfgMonth] = useState(d.manufacturing_month || '');
  const [mfgYear, setMfgYear] = useState(d.manufacturing_year || '');
  const [regNumber, setRegNumber] = useState(d.registration_number || '');
  const [regMonth, setRegMonth] = useState(d.registration_month || '');
  const [regYear, setRegYear] = useState(d.registration_year || '');
  const [chassisNumber, setChassisNumber] = useState(d.chassis_number || '');
  const [chassisEmbossing, setChassisEmbossing] = useState(d.chassis_embossing || '');
  const [odometer, setOdometer] = useState(d.odometer_reading ?? '');
  const [fuelType, setFuelType] = useState(d.fuel_type || '');
  const [noOfOwners, setNoOfOwners] = useState(d.no_of_owners ?? '');
  const [branch, setBranch] = useState(d.branch || '');
  const [inspectionAt, setInspectionAt] = useState(d.inspection_at || '');
  const [rto, setRto] = useState(d.rto || '');
  const [regCity, setRegCity] = useState(d.reg_city || '');
  const [regState, setRegState] = useState(d.reg_state || '');
  const [roadTaxPaid, setRoadTaxPaid] = useState(d.road_tax_paid || '');
  const [roadTaxValidity, setRoadTaxValidity] = useState(d.road_tax_validity ? d.road_tax_validity.split('T')[0] : '');
  const [fitnessUpto, setFitnessUpto] = useState(d.fitness_upto ? d.fitness_upto.split('T')[0] : '');
  const [insuranceType, setInsuranceType] = useState(d.insurance_type || '');
  const [rcAvailability, setRcAvailability] = useState(d.rc_availability || '');
  const [rcCondition, setRcCondition] = useState(d.rc_condition || '');
  const [mismatchInRc, setMismatchInRc] = useState(d.mismatch_in_rc || false);
  const [underHypo, setUnderHypo] = useState(d.under_hypothecation || false);
  const [rtoNocIssued, setRtoNocIssued] = useState(d.rto_noc_issued || false);
  const [cngLpgInRc, setCngLpgInRc] = useState(d.cng_lpg_fitment_in_rc || false);
  const [duplicateKey, setDuplicateKey] = useState(d.duplicate_key || false);
  const [toBeScrapped, setToBeScrapped] = useState(d.to_be_scrapped || false);

  const [newFiles, setNewFiles] = useState(null);

  const handleSubmit = () => {
    const fd = new FormData();
    const append = (k, v) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v); };
    append('make', make);
    append('model', model);
    append('variant', variant);
    append('year_of_manufacturing', yearOfMfg);
    append('manufacturing_month', mfgMonth);
    append('manufacturing_year', mfgYear);
    append('registration_number', regNumber.toUpperCase());
    append('registration_month', regMonth);
    append('registration_year', regYear);
    append('chassis_number', chassisNumber);
    append('chassis_embossing', chassisEmbossing);
    append('odometer_reading', odometer);
    append('fuel_type', fuelType);
    append('no_of_owners', noOfOwners);
    append('branch', branch);
    append('inspection_at', inspectionAt);
    append('rto', rto);
    append('reg_city', regCity);
    append('reg_state', regState);
    append('road_tax_paid', roadTaxPaid);
    append('road_tax_validity', roadTaxValidity);
    append('fitness_upto', fitnessUpto);
    append('insurance_type', insuranceType);
    append('rc_availability', rcAvailability);
    append('rc_condition', rcCondition);
    fd.append('mismatch_in_rc', mismatchInRc.toString());
    fd.append('under_hypothecation', underHypo.toString());
    fd.append('rto_noc_issued', rtoNocIssued.toString());
    fd.append('cng_lpg_fitment_in_rc', cngLpgInRc.toString());
    fd.append('duplicate_key', duplicateKey.toString());
    fd.append('to_be_scrapped', toBeScrapped.toString());
    if (newFiles) Array.from(newFiles).forEach(f => fd.append('car_images', f));
    onSave(fd);
  };

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'];
  const INSURANCE = ['Comprehensive', 'Third Party', 'Zero Dep', 'Expired'];
  const years = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="space-y-2">
      <Section title="Vehicle Identity" defaultOpen>
        <Field label="Make"><TextInput value={make} onChange={setMake} placeholder="e.g. Maruti Suzuki" /></Field>
        <Field label="Model"><TextInput value={model} onChange={setModel} placeholder="e.g. Swift" /></Field>
        <Field label="Variant"><TextInput value={variant} onChange={setVariant} placeholder="e.g. ZXi" /></Field>
        <Field label="Year of Manufacturing">
          <SelectInput value={yearOfMfg} onChange={setYearOfMfg} options={years} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Mfg Month">
            <SelectInput value={mfgMonth} onChange={setMfgMonth} options={MONTHS} />
          </Field>
          <Field label="Mfg Year">
            <SelectInput value={mfgYear} onChange={setMfgYear} options={years} />
          </Field>
        </div>
        <Field label="Fuel Type">
          <SelectInput value={fuelType} onChange={setFuelType} options={FUEL_TYPES} />
        </Field>
        <Field label="Chassis Number"><TextInput value={chassisNumber} onChange={setChassisNumber} /></Field>
        <Field label="Chassis Embossing"><TextInput value={chassisEmbossing} onChange={setChassisEmbossing} /></Field>
        <Field label="Odometer (km)">
          <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/70 text-xs focus:outline-none focus:border-teal-500/40 transition-all" />
        </Field>
        <Field label="No. of Owners">
          <input type="number" value={noOfOwners} onChange={e => setNoOfOwners(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/70 text-xs focus:outline-none focus:border-teal-500/40 transition-all" />
        </Field>
      </Section>

      <Section title="Registration">
        <Field label="Reg Number"><TextInput value={regNumber} onChange={v => setRegNumber(v.toUpperCase())} placeholder="MH12AB1234" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Reg Month">
            <SelectInput value={regMonth} onChange={setRegMonth} options={MONTHS} />
          </Field>
          <Field label="Reg Year">
            <SelectInput value={regYear} onChange={setRegYear} options={years} />
          </Field>
        </div>
        <Field label="RTO"><TextInput value={rto} onChange={setRto} /></Field>
        <Field label="City"><TextInput value={regCity} onChange={setRegCity} /></Field>
        <Field label="State"><TextInput value={regState} onChange={setRegState} /></Field>
      </Section>

      <Section title="Compliance & Insurance">
        <Field label="Road Tax">
          <SelectInput value={roadTaxPaid} onChange={setRoadTaxPaid} options={['Paid', 'Not Paid', 'Partial']} />
        </Field>
        <Field label="Road Tax Validity">
          <input type="date" value={roadTaxValidity} onChange={e => setRoadTaxValidity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/70 text-xs focus:outline-none focus:border-teal-500/40 transition-all" />
        </Field>
        <Field label="Fitness Upto">
          <input type="date" value={fitnessUpto} onChange={e => setFitnessUpto(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border indigo-500 indigo-500/70 text-xs focus:outline-none focus:border-teal-500/40 transition-all" />
        </Field>
        <Field label="Insurance Type">
          <SelectInput value={insuranceType} onChange={setInsuranceType} options={INSURANCE} />
        </Field>
        <Field label="RC Availability">
          <SelectInput value={rcAvailability} onChange={setRcAvailability} options={['Available', 'Not Available', 'Duplicate']} />
        </Field>
        <Field label="RC Condition">
          <SelectInput value={rcCondition} onChange={setRcCondition} options={['Good', 'Torn', 'Laminated', 'Damaged']} />
        </Field>
        <Toggle label="Mismatch in RC" value={mismatchInRc} onChange={setMismatchInRc} />
        <Toggle label="Under Hypothecation" value={underHypo} onChange={setUnderHypo} />
        <Toggle label="RTO NOC Issued" value={rtoNocIssued} onChange={setRtoNocIssued} />
        <Toggle label="CNG/LPG in RC" value={cngLpgInRc} onChange={setCngLpgInRc} />
        <Toggle label="Duplicate Key" value={duplicateKey} onChange={setDuplicateKey} />
        <Toggle label="To Be Scrapped" value={toBeScrapped} onChange={setToBeScrapped} />
      </Section>

      <Section title="Inspection Meta">
        <Field label="Branch"><TextInput value={branch} onChange={setBranch} /></Field>
        <Field label="Inspection At"><TextInput value={inspectionAt} onChange={setInspectionAt} /></Field>
      </Section>

      <Section title="Car Photos">
        <ImageUploadStrip
          fieldName="car_images"
          existingImages={d.images || []}
          newFiles={newFiles}
          onNewFiles={files => setNewFiles(files)}
        />
      </Section>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <p className="text-rose-400 text-xs">{error}</p>
        </div>
      )}

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
            : 'Save Car Details'}
        </button>
      </div>
    </div>
  );
};

export default CarDetailsEditForm;