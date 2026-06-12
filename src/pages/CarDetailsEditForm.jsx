// ═══════════════════════════════════════════════════════════════════════════
//  CarDetailsEditForm.jsx
//  API endpoint: PUT /api/admin/car/:carId/car-details
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';

// ─── Shared atoms ────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';

const TextInput = ({ value, onChange, placeholder = '' }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={inputClass}
  />
);

const SelectInput = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={inputClass}
  >
    <option value="">Select</option>
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5 py-3 border-b border-white/5 last:border-none">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {label}
    </label>
    {children}
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-none">
    <span className="text-xs text-slate-400">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
        value ? 'bg-teal-500' : 'bg-white/10'
      }`}
      aria-pressed={value}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
          value ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);

const ImageUploadStrip = ({ existingImages = [], newFiles, onNewFiles }) => {
  const inputRef = useRef();
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {existingImages.map((img, i) => (
        <div
          key={i}
          className="w-[62px] h-[46px] rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0"
        >
          <img src={img.url} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
      {newFiles &&
        Array.from(newFiles).map((f, i) => (
          <div
            key={`new-${i}`}
            className="relative w-[62px] h-[46px] rounded-lg overflow-hidden border border-teal-500/30 flex-shrink-0"
          >
            <img
              src={URL.createObjectURL(f)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">N</span>
            </div>
          </div>
        ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-[62px] h-[46px] rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:border-teal-500/40 hover:text-teal-400/60 transition-all flex-shrink-0"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="text-[8px] font-bold">ADD</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onNewFiles(e.target.files)}
      />
    </div>
  );
};

const Section = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/5 transition"
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-200">
          {title}
        </span>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
};

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'];
const INSURANCE = ['Comprehensive', 'Third Party', 'Zero Dep', 'Expired'];
const RC_AVAILABILITY = ['Available', 'Not Available', 'Duplicate'];
const RC_CONDITION = ['Good', 'Torn', 'Laminated', 'Damaged'];
const ROAD_TAX = ['Paid', 'Not Paid', 'Partial'];
const YEARS = Array.from({ length: 30 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

// ══════════════════════════════════════════════════════════════════════════════
//  CarDetailsEditForm
// ══════════════════════════════════════════════════════════════════════════════

export const CarDetailsEditForm = ({
  initialData: d = {},
  onSave,
  onCancel,
  saving = false,
  error = '',
}) => {
  // Vehicle Identity
  const [make, setMake] = useState(d.make || '');
  const [model, setModel] = useState(d.model || '');
  const [variant, setVariant] = useState(d.variant || '');
  const [yearOfMfg, setYearOfMfg] = useState(d.year_of_manufacturing || '');
  const [mfgMonth, setMfgMonth] = useState(d.manufacturing_month || '');
  const [mfgYear, setMfgYear] = useState(d.manufacturing_year || '');
  const [fuelType, setFuelType] = useState(d.fuel_type || '');
  const [chassisEmbossing, setChassisEmbossing] = useState(d.chassis_embossing || '');
  const [odometer, setOdometer] = useState(d.odometer_reading ?? '');
  const [noOfOwners, setNoOfOwners] = useState(d.no_of_owners ?? '');

  // Registration
  const [regNumber, setRegNumber] = useState(d.registration_number || '');
  const [regMonth, setRegMonth] = useState(d.registration_month || '');
  const [regYear, setRegYear] = useState(d.registration_year || '');
  const [rto, setRto] = useState(d.rto || '');
  const [regCity, setRegCity] = useState(d.reg_city || '');
  const [regState, setRegState] = useState(d.reg_state || '');

  // Compliance & Insurance
  const [roadTaxPaid, setRoadTaxPaid] = useState(d.road_tax_paid || '');
  const [roadTaxValidity, setRoadTaxValidity] = useState(
    d.road_tax_validity ? d.road_tax_validity.split('T')[0] : ''
  );
  const [fitnessUpto, setFitnessUpto] = useState(
    d.fitness_upto ? d.fitness_upto.split('T')[0] : ''
  );
  const [insuranceType, setInsuranceType] = useState(d.insurance_type || '');
  const [rcAvailability, setRcAvailability] = useState(d.rc_availability || '');
  const [rcCondition, setRcCondition] = useState(d.rc_condition || '');
  const [mismatchInRc, setMismatchInRc] = useState(d.mismatch_in_rc || false);
  const [underHypo, setUnderHypo] = useState(d.under_hypothecation || false);
  const [rtoNocIssued, setRtoNocIssued] = useState(d.rto_noc_issued || false);
  const [cngLpgInRc, setCngLpgInRc] = useState(d.cng_lpg_fitment_in_rc || false);
  const [duplicateKey, setDuplicateKey] = useState(d.duplicate_key || false);
  const [toBeScrapped, setToBeScrapped] = useState(d.to_be_scrapped || false);

  // Inspection Meta
  const [branch, setBranch] = useState(d.branch || '');
  const [inspectionAt, setInspectionAt] = useState(d.inspection_at || '');

  // Photos
  const [newFiles, setNewFiles] = useState(null);

  const handleSubmit = () => {
    const fd = new FormData();
    const append = (k, v) => {
      if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
    };

    append('make', make);
    append('model', model);
    append('variant', variant);
    append('year_of_manufacturing', yearOfMfg);
    append('manufacturing_month', mfgMonth);
    append('manufacturing_year', mfgYear);
    append('registration_number', regNumber.toUpperCase());
    append('registration_month', regMonth);
    append('registration_year', regYear);
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
    if (newFiles) Array.from(newFiles).forEach((f) => fd.append('car_images', f));

    onSave(fd);
  };

  return (
    <div className="space-y-2">
      {/* ── Vehicle Identity ── */}
      <Section title="Vehicle Identity" defaultOpen>
        <Field label="Make">
          <TextInput value={make} onChange={setMake} placeholder="e.g. Maruti Suzuki" />
        </Field>
        <Field label="Model">
          <TextInput value={model} onChange={setModel} placeholder="e.g. Swift" />
        </Field>
        <Field label="Variant">
          <TextInput value={variant} onChange={setVariant} placeholder="e.g. ZXi" />
        </Field>
        <Field label="Year of Manufacturing">
          <SelectInput value={yearOfMfg} onChange={setYearOfMfg} options={YEARS} />
        </Field>
        <Field label="Manufacturing Month / Year">
          <div className="grid grid-cols-2 gap-2">
            <SelectInput value={mfgMonth} onChange={setMfgMonth} options={MONTHS} />
            <SelectInput value={mfgYear} onChange={setMfgYear} options={YEARS} />
          </div>
        </Field>
        <Field label="Fuel Type">
          <SelectInput value={fuelType} onChange={setFuelType} options={FUEL_TYPES} />
        </Field>
        <Field label="Chassis Embossing">
          <TextInput value={chassisEmbossing} onChange={setChassisEmbossing} />
        </Field>
        <Field label="Odometer (km)">
          <input
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </Field>
        <Field label="No. of Owners">
          <input
            type="number"
            value={noOfOwners}
            onChange={(e) => setNoOfOwners(e.target.value)}
            className={inputClass}
            placeholder="1"
          />
        </Field>
      </Section>

      {/* ── Registration ── */}
      <Section title="Registration">
        <Field label="Reg Number">
          <TextInput
            value={regNumber}
            onChange={(v) => setRegNumber(v.toUpperCase())}
            placeholder="MH12AB1234"
          />
        </Field>
        <Field label="Registration Month / Year">
          <div className="grid grid-cols-2 gap-2">
            <SelectInput value={regMonth} onChange={setRegMonth} options={MONTHS} />
            <SelectInput value={regYear} onChange={setRegYear} options={YEARS} />
          </div>
        </Field>
        <Field label="RTO">
          <TextInput value={rto} onChange={setRto} />
        </Field>
        <Field label="City">
          <TextInput value={regCity} onChange={setRegCity} />
        </Field>
        <Field label="State">
          <TextInput value={regState} onChange={setRegState} />
        </Field>
      </Section>

      {/* ── Compliance & Insurance ── */}
      <Section title="Compliance & Insurance">
        <Field label="Road Tax">
          <SelectInput value={roadTaxPaid} onChange={setRoadTaxPaid} options={ROAD_TAX} />
        </Field>
        <Field label="Road Tax Validity">
          <input
            type="date"
            value={roadTaxValidity}
            onChange={(e) => setRoadTaxValidity(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Fitness Upto">
          <input
            type="date"
            value={fitnessUpto}
            onChange={(e) => setFitnessUpto(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Insurance Type">
          <SelectInput value={insuranceType} onChange={setInsuranceType} options={INSURANCE} />
        </Field>
        <Field label="RC Availability">
          <SelectInput value={rcAvailability} onChange={setRcAvailability} options={RC_AVAILABILITY} />
        </Field>
        <Field label="RC Condition">
          <SelectInput value={rcCondition} onChange={setRcCondition} options={RC_CONDITION} />
        </Field>

        <div className="pt-1">
          <Toggle label="Mismatch in RC" value={mismatchInRc} onChange={setMismatchInRc} />
          <Toggle label="Under Hypothecation" value={underHypo} onChange={setUnderHypo} />
          <Toggle label="RTO NOC Issued" value={rtoNocIssued} onChange={setRtoNocIssued} />
          <Toggle label="CNG/LPG in RC" value={cngLpgInRc} onChange={setCngLpgInRc} />
          <Toggle label="Duplicate Key" value={duplicateKey} onChange={setDuplicateKey} />
          <Toggle label="To Be Scrapped" value={toBeScrapped} onChange={setToBeScrapped} />
        </div>
      </Section>

      {/* ── Inspection Meta ── */}
      <Section title="Inspection Meta">
        <Field label="Branch">
          <TextInput value={branch} onChange={setBranch} />
        </Field>
        <Field label="Inspection At">
          <TextInput value={inspectionAt} onChange={setInspectionAt} />
        </Field>
      </Section>

      {/* ── Car Photos ── */}
      <Section title="Car Photos">
        <ImageUploadStrip
          existingImages={d.images || []}
          newFiles={newFiles}
          onNewFiles={(files) => setNewFiles(files)}
        />
      </Section>

      {/* ── Error ── */}
      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <p className="text-rose-400 text-xs">{error}</p>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex gap-3 pt-2 sticky bottom-0 pb-2 bg-slate-950">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-semibold hover:text-slate-200 hover:border-white/20 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-sm font-semibold hover:bg-teal-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving…
            </span>
          ) : (
            'Save Car Details'
          )}
        </button>
      </div>
    </div>
  );
};

export default CarDetailsEditForm;