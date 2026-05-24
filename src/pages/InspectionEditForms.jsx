import React, { useState } from 'react';
import { PartEditor, TyreEditor, Toggle, Field, Input, EditToolbar } from './InspectionFormAtoms';
import { buildFormData } from '../hooks/useInspectionEdit';

/**
 * Exterior & Tyres edit form.
 * initialData = car.exterior_tyres (the sub-document from the report).
 */
export default function ExteriorTyresEditForm({ initialData = {}, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(deepClone(initialData));
  const [files, setFiles] = useState({});

  const onFile = (fieldName, fileList) => setFiles(prev => ({ ...prev, [fieldName]: fileList }));

  /* Update a nested path like form.bumper.front */
  const setNested = (path, val) => {
    setForm(prev => {
      const next = deepClone(prev);
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const get = (path) => {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), form);
  };

  const handleSave = () => {
    // Flatten nested objects to the shape the API expects via JSON body fields
    const payload = {};

    // Helper: set a dot-path on an object
    const dp = (obj, path, val) => {
      const keys = path.split('.');
      let o = obj;
      for (let i = 0; i < keys.length - 1; i++) { if (!o[keys[i]]) o[keys[i]] = {}; o = o[keys[i]]; }
      o[keys[keys.length - 1]] = val;
    };

    // Copy all scalar/nested fields
    PART_FIELDS.forEach(({ formPath }) => {
      const val = get(formPath);
      if (val !== undefined) dp(payload, formPath, val);
    });
    TYRE_FIELDS.forEach(({ formPath }) => {
      const val = get(formPath);
      if (val !== undefined) dp(payload, formPath, val);
    });

    if (form.jack_tool_available !== undefined) payload.jack_tool_available = form.jack_tool_available;
    if (form.comments !== undefined) payload.comments = form.comments;

    const fd = buildFormData(payload, files);
    onSave(fd);
  };

  return (
    <div className="space-y-4">
      <GroupBox title="Bumpers">
        <PartEditor label="Front Bumper" path="bumper.front" value={get('bumper.front')} onChange={v => setNested('bumper.front', v)} fileFieldName="bumper_front_images" onFileChange={onFile} />
        <PartEditor label="Rear Bumper" path="bumper.rear" value={get('bumper.rear')} onChange={v => setNested('bumper.rear', v)} fileFieldName="bumper_rear_images" onFileChange={onFile} />
      </GroupBox>

      <GroupBox title="Bonnet & Roof">
        <PartEditor label="Bonnet / Hood" value={get('bonnet_hood')} onChange={v => setNested('bonnet_hood', v)} fileFieldName="bonnet_hood_images" onFileChange={onFile} />
        <PartEditor label="Roof" value={get('roof')} onChange={v => setNested('roof', v)} fileFieldName="roof_images" onFileChange={onFile} />
      </GroupBox>

      <GroupBox title="Fenders">
        <PartEditor label="LHS Fender" value={get('fender.lhs')} onChange={v => setNested('fender.lhs', v)} fileFieldName="fender_lhs_images" onFileChange={onFile} />
        <PartEditor label="RHS Fender" value={get('fender.rhs')} onChange={v => setNested('fender.rhs', v)} fileFieldName="fender_rhs_images" onFileChange={onFile} />
      </GroupBox>

      <GroupBox title="Doors">
        {[
          ['LHS Front Door', 'door.lhs_front', 'door_lhs_front_images'],
          ['LHS Rear Door', 'door.lhs_rear', 'door_lhs_rear_images'],
          ['RHS Front Door', 'door.rhs_front', 'door_rhs_front_images'],
          ['RHS Rear Door', 'door.rhs_rear', 'door_rhs_rear_images'],
        ].map(([lbl, path, field]) => (
          <PartEditor key={path} label={lbl} value={get(path)} onChange={v => setNested(path, v)} fileFieldName={field} onFileChange={onFile} />
        ))}
      </GroupBox>

      <GroupBox title="Pillars">
        {[
          ['LHS A Pillar', 'pillar.lhs_a', 'pillar_lhs_a_images'],
          ['LHS B Pillar', 'pillar.lhs_b', 'pillar_lhs_b_images'],
          ['LHS C Pillar', 'pillar.lhs_c', 'pillar_lhs_c_images'],
          ['RHS A Pillar', 'pillar.rhs_a', 'pillar_rhs_a_images'],
          ['RHS B Pillar', 'pillar.rhs_b', 'pillar_rhs_b_images'],
          ['RHS C Pillar', 'pillar.rhs_c', 'pillar_rhs_c_images'],
        ].map(([lbl, path, field]) => (
          <PartEditor key={path} label={lbl} value={get(path)} onChange={v => setNested(path, v)} fileFieldName={field} onFileChange={onFile} />
        ))}
      </GroupBox>

      <GroupBox title="Quarter Panels & Running Borders">
        {[
          ['Quarter Panel LHS', 'quarter_panel.lhs', 'quarter_panel_lhs_images'],
          ['Quarter Panel RHS', 'quarter_panel.rhs', 'quarter_panel_rhs_images'],
          ['Running Border LHS', 'running_border.lhs', 'running_border_lhs_images'],
          ['Running Border RHS', 'running_border.rhs', 'running_border_rhs_images'],
        ].map(([lbl, path, field]) => (
          <PartEditor key={path} label={lbl} value={get(path)} onChange={v => setNested(path, v)} fileFieldName={field} onFileChange={onFile} />
        ))}
      </GroupBox>

      <GroupBox title="Windshields">
        <PartEditor label="Front Windshield" value={get('windshield.front')} onChange={v => setNested('windshield.front', v)} fileFieldName="windshield_front_images" onFileChange={onFile} />
        <PartEditor label="Rear Windshield" value={get('windshield.rear')} onChange={v => setNested('windshield.rear', v)} fileFieldName="windshield_rear_images" onFileChange={onFile} />
      </GroupBox>

      <GroupBox title="Lights">
        {[
          ['LHS Headlight', 'lights.lhs_headlight', 'lhs_headlight_images'],
          ['RHS Headlight', 'lights.rhs_headlight', 'rhs_headlight_images'],
          ['LHS Taillight', 'lights.lhs_taillight', 'lhs_taillight_images'],
          ['RHS Taillight', 'lights.rhs_taillight', 'rhs_taillight_images'],
        ].map(([lbl, path, field]) => (
          <PartEditor key={path} label={lbl} value={get(path)} onChange={v => setNested(path, v)} fileFieldName={field} onFileChange={onFile} />
        ))}
      </GroupBox>

      <GroupBox title="ORVM & Alloy Wheel">
        <PartEditor label="ORVM LHS" value={get('orvm.lhs')} onChange={v => setNested('orvm.lhs', v)} fileFieldName="orvm_lhs_images" onFileChange={onFile} />
        <PartEditor label="ORVM RHS" value={get('orvm.rhs')} onChange={v => setNested('orvm.rhs', v)} fileFieldName="orvm_rhs_images" onFileChange={onFile} />
        <PartEditor label="Alloy Wheel" value={get('alloy_wheel')} onChange={v => setNested('alloy_wheel', v)} fileFieldName="alloy_wheel_images" onFileChange={onFile} />
      </GroupBox>

      <GroupBox title="Boot & Structural">
        {[
          ['Dicky / Boot Door', 'dicky_boot_door', 'dicky_boot_door_images'],
          ['Boot Floor', 'boot_floor', 'boot_floor_images'],
          ['Apron', 'apron', 'apron_images'],
          ['Firewall', 'firewall', 'firewall_images'],
          ['Cowl Top', 'cowl_top', 'cowl_top_images'],
          ['Lower Cross Member', 'lower_cross_member', 'lower_cross_member_images'],
          ['Upper Cross Member (Bonnet Patti)', 'upper_cross_member', 'upper_cross_member_images'],
          ['Head Light Support', 'head_light_support', 'head_light_support_images'],
          ['Radiator Support', 'radiator_support', 'radiator_support_images'],
        ].map(([lbl, path, field]) => (
          <PartEditor key={path} label={lbl} value={get(path)} onChange={v => setNested(path, v)} fileFieldName={field} onFileChange={onFile} />
        ))}
      </GroupBox>

      <GroupBox title="Tyres">
        {[
          ['LHS Front Tyre', 'tyres.lhs_front', 'tyre_lhs_front_images'],
          ['RHS Front Tyre', 'tyres.rhs_front', 'tyre_rhs_front_images'],
          ['LHS Rear Tyre', 'tyres.lhs_rear', 'tyre_lhs_rear_images'],
          ['RHS Rear Tyre', 'tyres.rhs_rear', 'tyre_rhs_rear_images'],
          ['Spare Tyre', 'tyres.spare', 'tyre_spare_images'],
        ].map(([lbl, path, field]) => (
          <TyreEditor key={path} label={lbl} value={get(path)} onChange={v => setNested(path, v)} fileFieldName={field} onFileChange={onFile} />
        ))}
      </GroupBox>

      <GroupBox title="Misc">
        <Toggle label="Jack Tool Available" checked={!!form.jack_tool_available} onChange={v => setForm(p => ({ ...p, jack_tool_available: v }))} />
        <Field label="Comments">
          <textarea
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 indigo-500/80 text-sm indigo-500 focus:outline-none focus:border-teal-500/50 resize-none transition-all"
            rows={3}
            value={form.comments || ''}
            onChange={e => setForm(p => ({ ...p, comments: e.target.value }))}
            placeholder="Overall exterior comments…"
          />
        </Field>
      </GroupBox>

      <EditToolbar onCancel={onCancel} onSave={handleSave} saving={saving} error={error} />
    </div>
  );
}

const GroupBox = ({ title, children }) => (
  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
    <div className="px-5 py-3 border-b border-white/[0.05]">
      <p className="text-[10px] font-bold tracking-widest uppercase indigo-500/25">{title}</p>
    </div>
    <div className="p-4 space-y-2">{children}</div>
  </div>
);

const deepClone = (o) => JSON.parse(JSON.stringify(o || {}));

// For payload flattening
const PART_FIELDS = [
  'bumper.front', 'bumper.rear', 'bonnet_hood', 'roof', 'fender.lhs', 'fender.rhs',
  'door.lhs_front', 'door.lhs_rear', 'door.rhs_front', 'door.rhs_rear',
  'pillar.lhs_a', 'pillar.lhs_b', 'pillar.lhs_c', 'pillar.rhs_a', 'pillar.rhs_b', 'pillar.rhs_c',
  'quarter_panel.lhs', 'quarter_panel.rhs', 'running_border.lhs', 'running_border.rhs',
  'windshield.front', 'windshield.rear', 'orvm.lhs', 'orvm.rhs',
  'lights.lhs_headlight', 'lights.rhs_headlight', 'lights.lhs_taillight', 'lights.rhs_taillight',
  'alloy_wheel', 'dicky_boot_door', 'boot_floor', 'apron', 'firewall', 'cowl_top',
  'lower_cross_member', 'upper_cross_member', 'head_light_support', 'radiator_support',
].map(p => ({ formPath: p }));

const TYRE_FIELDS = [
  'tyres.lhs_front', 'tyres.rhs_front', 'tyres.lhs_rear', 'tyres.rhs_rear', 'tyres.spare',
].map(p => ({ formPath: p }));