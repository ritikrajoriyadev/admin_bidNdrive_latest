import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

const statusConfig = {
  'assign-to-team': {
    label: 'New',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
  },
  open: { label: 'Open', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  'in-progress': { label: 'In Progress', bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-400' },
};

const priorityConfig = {
  high: { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  medium: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  low: { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const avatarGradients = [
  'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500', 'from-teal-500 to-cyan-500',
];

// ── Helpers ────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const s = statusConfig[status] || { label: status, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
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
      {value?.toUpperCase()}
    </span>
  );
};

const SectionLabel = ({ children }) => (
  <p className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase mb-3">{children}</p>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-1.5 border-b border-white/[0.04] last:border-0">
    <span className="indigo-500/35 text-xs">{label}</span>
    <span className="indigo-500/75 text-xs font-medium text-right max-w-[55%]">{value ?? '—'}</span>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 ${className}`}>{children}</div>
);

// ── Inspection Part Row ────────────────────────────────────────────
const PartRow = ({ label, data }) => {
  if (!data) return null;
  const hasImages = data.images && data.images.length > 0;
  return (
    <div className="py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="indigo-500/50 text-xs capitalize">{label.replace(/_/g, ' ')}</span>
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
      {data.notes && <p className="indigo-500/30 text-[11px] mt-1 italic">"{data.notes}"</p>}
      {hasImages && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          {data.images.map((img, i) => (
            <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
              <img src={img.url} alt={img.caption} className="w-16 h-12 object-cover rounded-lg border border-white/10 hover:border-white/30 transition-all flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Detail Drawer ──────────────────────────────────────────────────
const DetailDrawer = ({ enquiryId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/enquiries/byID/${enquiryId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDetail(res.data);
      } catch (err) {
        console.error('Failed to fetch enquiry details', err);
      } finally {
        setLoading(false);
      }
    };
    if (enquiryId) fetchDetail();
  }, [enquiryId]);

  const enq = detail?.data;
  const car = detail?.carDetails;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'car', label: 'Car Details' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'interior', label: 'Interior' },
    { key: 'engine', label: 'Engine' },
    { key: 'journey', label: 'Journey' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 indigo-500/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg h-full bg-white border-l indigo-500 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="min-w-0">
            {loading ? (
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <p className="indigo-500/30 text-xs font-mono">{enq?.enquiryId}</p>
                <h3 className="indigo-500 font-semibold text-sm mt-0.5 truncate">{enq?.description}</h3>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center indigo-500/40 hover:indigo-500/70 transition-all ml-3 flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 py-2 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.key ? 'bg-indigo-500 indigo-500' : 'indigo-500/35 hover:indigo-500/60 hover:bg-white/[0.04]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : !enq ? (
            <p className="indigo-500/30 text-sm text-center mt-10">Failed to load details</p>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <Card>
                    <SectionLabel>Customer</SectionLabel>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center indigo-500 font-bold text-sm flex-shrink-0">
                        {enq.userId?.firstName?.[0]}{enq.userId?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="indigo-500 font-semibold text-sm">{enq.userId?.firstName} {enq.userId?.lastName}</p>
                        <p className="indigo-500/40 text-xs">{enq.userId?.email}</p>
                        <p className="indigo-500/30 text-xs">{enq.userId?.phone}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <SectionLabel>Status</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      <StatusDot status={enq.status} />
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityConfig[enq.priority]?.bg} ${priorityConfig[enq.priority]?.text} ${priorityConfig[enq.priority]?.border}`}>
                        {enq.priority} Priority
                      </span>
                      <span className="indigo-500/25 text-xs py-1">{new Date(enq.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                  {enq.sellingDetails && (
                    <Card>
                      <SectionLabel>Selling Details</SectionLabel>
                      <InfoRow label="Expected Price" value={`₹${enq.sellingDetails.expectedPrice?.toLocaleString()}`} />
                      <InfoRow label="City" value={enq.sellingDetails.city} />
                      <InfoRow label="Fuel Type" value={enq.sellingDetails.fuelType} />
                      <InfoRow label="Transmission" value={enq.sellingDetails.transmission} />
                      <InfoRow label="Ownership" value={enq.sellingDetails.ownership} />
                      <InfoRow label="Km Driven" value={enq.sellingDetails.kilometersDriven?.toLocaleString()} />
                      <InfoRow label="Accident History" value={enq.sellingDetails.accidentHistory} />
                      <InfoRow label="Service History" value={enq.sellingDetails.serviceHistoryAvailable ? 'Available' : 'Not Available'} />
                    </Card>
                  )}
                  {enq.attachments?.length > 0 && (
                    <Card>
                      <SectionLabel>Attachments</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {enq.attachments.map((att, i) => (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                            <img src={att.url} alt={att.fileName} className="w-20 h-16 object-cover rounded-lg border border-white/10 hover:border-indigo-500/50 transition-all" />
                          </a>
                        ))}
                      </div>
                    </Card>
                  )}
                  {enq.notes?.length > 0 && (
                    <Card>
                      <SectionLabel>Notes</SectionLabel>
                      <div className="space-y-3">
                        {enq.notes.map((note, i) => (
                          <div key={i} className="border-l-2 border-amber-500/40 pl-3">
                            <p className="indigo-500/30 text-[10px]">
                              {note.addedBy?.firstName} {note.addedBy?.lastName} · {new Date(note.addedAt).toLocaleString()}
                            </p>
                            <p className="indigo-500/70 text-sm mt-0.5">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  <div>
                    <SectionLabel>Quick Reply</SectionLabel>
                    <textarea
                      rows={4}
                      placeholder="Type your reply here..."
                      className="w-full bg-white/[0.03] border indigo-500 rounded-xl px-4 py-3 indigo-500/70 text-sm indigo-500 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] resize-none transition-all duration-200"
                    />
                    <button className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 indigo-500 text-sm font-semibold hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-indigo-500/20">
                      Send Reply →
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'car' && car && (
                <div className="space-y-5">
                  <Card>
                    <SectionLabel>Registration & Identity</SectionLabel>
                    <InfoRow label="Make" value={car.car_details?.make} />
                    <InfoRow label="Model" value={car.car_details?.model} />
                    <InfoRow label="Variant" value={car.car_details?.variant} />
                    <InfoRow label="Year" value={car.car_details?.year_of_manufacturing} />
                    <InfoRow label="Mfg Month/Year" value={`${car.car_details?.manufacturing_month} ${car.car_details?.manufacturing_year}`} />
                    <InfoRow label="Reg Month/Year" value={`${car.car_details?.registration_month} ${car.car_details?.registration_year}`} />
                    <InfoRow label="Odometer" value={`${car.car_details?.odometer_reading?.toLocaleString()} km`} />
                    <InfoRow label="Fuel Type" value={car.car_details?.fuel_type} />
                    <InfoRow label="No. of Owners" value={car.car_details?.no_of_owners} />
                  </Card>
                  <Card>
                    <SectionLabel>RTO & Tax Details</SectionLabel>
                    <InfoRow label="RTO" value={car.car_details?.rto} />
                    <InfoRow label="Reg City / State" value={`${car.car_details?.reg_city}, ${car.car_details?.reg_state}`} />
                    <InfoRow label="Road Tax" value={car.car_details?.road_tax_paid} />
                    <InfoRow label="Road Tax Validity" value={car.car_details?.road_tax_validity ? new Date(car.car_details.road_tax_validity).toLocaleDateString() : '—'} />
                    <InfoRow label="Fitness Upto" value={car.car_details?.fitness_upto ? new Date(car.car_details.fitness_upto).toLocaleDateString() : '—'} />
                    <InfoRow label="Insurance Type" value={car.car_details?.insurance_type} />
                    <InfoRow label="Inspection At" value={car.car_details?.inspection_at} />
                  </Card>
                  <Card>
                    <SectionLabel>Flags & Conditions</SectionLabel>
                    {[
                      ['RC Availability', car.car_details?.rc_availability],
                      ['RC Condition', car.car_details?.rc_condition],
                      ['Chassis Embossing', car.car_details?.chassis_embossing],
                      ['Mismatch in RC', car.car_details?.mismatch_in_rc ? 'Yes' : 'No'],
                      ['CNG/LPG in RC', car.car_details?.cng_lpg_fitment_in_rc ? 'Yes' : 'No'],
                      ['Duplicate Key', car.car_details?.duplicate_key ? 'Yes' : 'No'],
                      ['RTO NOC Issued', car.car_details?.rto_noc_issued ? 'Yes' : 'No'],
                      ['Under Hypothecation', car.car_details?.under_hypothecation ? 'Yes' : 'No'],
                      ['To Be Scrapped', car.car_details?.to_be_scrapped ? 'Yes' : 'No'],
                      ['Branch', car.car_details?.branch],
                      ['City', car.car_details?.city],
                    ].map(([label, value]) => (
                      <InfoRow key={label} label={label} value={value} />
                    ))}
                  </Card>
                  {car.car_details?.images?.length > 0 && (
                    <Card>
                      <SectionLabel>Car Images ({car.car_details.images.length})</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {car.car_details.images.map((img, i) => (
                          <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="group relative">
                            <img src={img.url} alt={img.caption} className="w-full h-20 object-cover rounded-lg border border-white/10 group-hover:border-indigo-500/50 transition-all" />
                            <p className="indigo-500/30 text-[9px] mt-0.5 truncate">{img.part?.replace(/_/g, ' ')}</p>
                          </a>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'exterior' && car?.exterior_tyres && (
                <div className="space-y-4">
                  <Card><SectionLabel>Bumpers</SectionLabel><PartRow label="Front Bumper" data={car.exterior_tyres.bumper?.front} /><PartRow label="Rear Bumper" data={car.exterior_tyres.bumper?.rear} /></Card>
                  <Card><SectionLabel>Doors</SectionLabel><PartRow label="LHS Front" data={car.exterior_tyres.door?.lhs_front} /><PartRow label="LHS Rear" data={car.exterior_tyres.door?.lhs_rear} /><PartRow label="RHS Front" data={car.exterior_tyres.door?.rhs_front} /><PartRow label="RHS Rear" data={car.exterior_tyres.door?.rhs_rear} /></Card>
                  <Card><SectionLabel>Pillars</SectionLabel>{['lhs_a', 'lhs_b', 'lhs_c', 'rhs_a', 'rhs_b', 'rhs_c'].map(k => <PartRow key={k} label={k} data={car.exterior_tyres.pillar?.[k]} />)}</Card>
                  <Card><SectionLabel>Fenders & Quarter Panels</SectionLabel><PartRow label="Fender LHS" data={car.exterior_tyres.fender?.lhs} /><PartRow label="Fender RHS" data={car.exterior_tyres.fender?.rhs} /><PartRow label="Quarter Panel LHS" data={car.exterior_tyres.quarter_panel?.lhs} /><PartRow label="Quarter Panel RHS" data={car.exterior_tyres.quarter_panel?.rhs} /></Card>
                  <Card><SectionLabel>Windshield & Glass</SectionLabel><PartRow label="Front Windshield" data={car.exterior_tyres.windshield?.front} /><PartRow label="Rear Windshield" data={car.exterior_tyres.windshield?.rear} /></Card>
                  <Card><SectionLabel>Lights</SectionLabel><PartRow label="LHS Headlight" data={car.exterior_tyres.lights?.lhs_headlight} /><PartRow label="RHS Headlight" data={car.exterior_tyres.lights?.rhs_headlight} /><PartRow label="LHS Taillight" data={car.exterior_tyres.lights?.lhs_taillight} /><PartRow label="RHS Taillight" data={car.exterior_tyres.lights?.rhs_taillight} /></Card>
                  <Card><SectionLabel>Tyres</SectionLabel>{['lhs_front', 'lhs_rear', 'rhs_front', 'rhs_rear', 'spare'].map(k => <PartRow key={k} label={k} data={car.exterior_tyres.tyres?.[k]} />)}</Card>
                  <Card>
                    <SectionLabel>Other Exterior Parts</SectionLabel>
                    <PartRow label="Bonnet / Hood" data={car.exterior_tyres.bonnet_hood} />
                    <PartRow label="Roof" data={car.exterior_tyres.roof} />
                    <PartRow label="Dicky / Boot Door" data={car.exterior_tyres.dicky_boot_door} />
                    <PartRow label="Boot Floor" data={car.exterior_tyres.boot_floor} />
                    <PartRow label="Running Border LHS" data={car.exterior_tyres.running_border?.lhs} />
                    <PartRow label="Running Border RHS" data={car.exterior_tyres.running_border?.rhs} />
                    <PartRow label="ORVM LHS" data={car.exterior_tyres.orvm?.lhs} />
                    <PartRow label="ORVM RHS" data={car.exterior_tyres.orvm?.rhs} />
                    <PartRow label="Alloy Wheel" data={car.exterior_tyres.alloy_wheel} />
                    <PartRow label="Apron" data={car.exterior_tyres.apron} />
                    <PartRow label="Cowl Top" data={car.exterior_tyres.cowl_top} />
                    <PartRow label="Firewall" data={car.exterior_tyres.firewall} />
                    <PartRow label="Head Light Support" data={car.exterior_tyres.head_light_support} />
                    <PartRow label="Lower Cross Member" data={car.exterior_tyres.lower_cross_member} />
                    <PartRow label="Upper Cross Member" data={car.exterior_tyres.upper_cross_member} />
                    <PartRow label="Radiator Support" data={car.exterior_tyres.radiator_support} />
                  </Card>
                  {car.exterior_tyres.comments && (
                    <Card><SectionLabel>Exterior Comments</SectionLabel><p className="indigo-500/60 text-sm">{car.exterior_tyres.comments}</p></Card>
                  )}
                </div>
              )}

              {activeTab === 'interior' && car?.electricals_interior && (
                <div className="space-y-4">
                  <Card>
                    <SectionLabel>Quick Status</SectionLabel>
                    <div className="grid grid-cols-2 gap-x-4">
                      {[
                        ['Electrical', car.electricals_interior.electrical],
                        ['ABS', car.electricals_interior.abs?.status],
                        ['Airbag', car.electricals_interior.airbag_feature],
                        ['Parking Sensor', car.electricals_interior.parking_sensor],
                        ['Reverse Camera', car.electricals_interior.reverse_camera],
                        ['Power Windows', car.electricals_interior.power_windows],
                        ['Rear Defogger', car.electricals_interior.rear_defogger],
                        ['Music System', car.electricals_interior.music_system?.status],
                        ['Navigation Chip', car.electricals_interior.navigation_chip],
                        ['Sunroof', car.electricals_interior.sunroof],
                        ['Door Trim', car.electricals_interior.door_trim?.status],
                        ['Roof Lining', car.electricals_interior.roof_lining?.status],
                        ['Fabric Seat', car.electricals_interior.fabric_seat],
                        ['Leather Seat', car.electricals_interior.leather_seat?.status],
                        ['Steering Audio', car.electricals_interior.steering_mounted_audio_control],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
                          <span className="indigo-500/35 text-xs">{label}</span>
                          <ConditionBadge value={value} />
                        </div>
                      ))}
                    </div>
                  </Card>
                  {car.electricals_interior.abs && (
                    <Card>
                      <SectionLabel>ABS</SectionLabel>
                      <InfoRow label="Status" value={car.electricals_interior.abs.status} />
                      <InfoRow label="Warning Light Glowing" value={car.electricals_interior.abs.warning_light_glowing ? 'Yes' : 'No'} />
                    </Card>
                  )}
                  {car.electricals_interior.remote_key && (
                    <Card>
                      <SectionLabel>Remote Key</SectionLabel>
                      <InfoRow label="Available" value={car.electricals_interior.remote_key.available ? 'Yes' : 'No'} />
                      {car.electricals_interior.remote_key.notes && (
                        <InfoRow label="Notes" value={car.electricals_interior.remote_key.notes} />
                      )}
                    </Card>
                  )}
                  <Card>
                    <SectionLabel>Counts</SectionLabel>
                    <InfoRow label="No. of Airbags" value={car.electricals_interior.no_of_airbags} />
                    <InfoRow label="No. of Power Windows" value={car.electricals_interior.no_of_power_windows} />
                  </Card>
                  {car.electricals_interior.images?.length > 0 && (
                    <Card>
                      <SectionLabel>Interior Images ({car.electricals_interior.images.length})</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {car.electricals_interior.images.map((img, i) => (
                          <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="group">
                            <img src={img.url} alt={img.caption} className="w-full h-20 object-cover rounded-lg border border-white/10 group-hover:border-indigo-500/50 transition-all" />
                            <p className="indigo-500/30 text-[9px] mt-0.5 truncate">{img.part?.replace(/_/g, ' ')}</p>
                          </a>
                        ))}
                      </div>
                    </Card>
                  )}
                  {car.electricals_interior.comments && (
                    <Card><SectionLabel>Interior Comments</SectionLabel><p className="indigo-500/60 text-sm">{car.electricals_interior.comments}</p></Card>
                  )}
                </div>
              )}

              {activeTab === 'engine' && car?.engine_transmission && (() => {
                const et = car.engine_transmission;
                return (
                  <div className="space-y-4">
                    <Card>
                      <SectionLabel>Engine</SectionLabel>
                      <InfoRow label="Status" value={et.engine?.status} />
                      <InfoRow label="MIL Light Glowing" value={et.engine?.mil_light_glowing ? 'Yes' : 'No'} />
                      <InfoRow label="Air Filter Box Damaged" value={et.engine?.air_filter_box_damaged ? 'Yes' : 'No'} />
                      <InfoRow label="Electrical Wiring Damaged" value={et.engine?.electrical_wiring_damaged ? 'Yes' : 'No'} />
                      {et.engine?.conditions?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {et.engine.conditions.map((c, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">{c}</span>
                          ))}
                        </div>
                      )}
                    </Card>
                    <Card>
                      <SectionLabel>Battery</SectionLabel>
                      <InfoRow label="Status" value={et.battery?.status} />
                      <InfoRow label="Acid Leakage" value={et.battery?.acid_leakage ? 'Yes' : 'No'} />
                    </Card>
                    <Card>
                      <SectionLabel>Engine Oil & Coolant</SectionLabel>
                      <InfoRow label="Oil Status" value={et.engine_oil?.status} />
                      <InfoRow label="Leakage from Tappet Cover" value={et.engine_oil?.leakage_from_tappet_cover ? 'Yes' : 'No'} />
                      <InfoRow label="Coolant Status" value={et.coolant?.status} />
                      <InfoRow label="Coolant Dirty" value={et.coolant?.dirty ? 'Yes' : 'No'} />
                      <InfoRow label="Coolant Level Low" value={et.coolant?.level_low ? 'Yes' : 'No'} />
                    </Card>
                    <Card>
                      <SectionLabel>Transmission</SectionLabel>
                      <InfoRow label="Clutch Status" value={et.clutch?.status} />
                      <InfoRow label="Clutch Hard" value={et.clutch?.hard ? 'Yes' : 'No'} />
                      <InfoRow label="Clutch Bearing Noise" value={et.clutch?.bearing_noise ? 'Yes' : 'No'} />
                      <InfoRow label="Burning Smell" value={et.clutch?.burning_smell ? 'Yes' : 'No'} />
                      <InfoRow label="Gear Shifting Status" value={et.gear_shifting?.status} />
                      <InfoRow label="Gear Hard" value={et.gear_shifting?.hard ? 'Yes' : 'No'} />
                      <InfoRow label="Not Engaging" value={et.gear_shifting?.not_engaging ? 'Yes' : 'No'} />
                      <InfoRow label="Gearbox Oil Leakage" value={et.gear_shifting?.gearbox_oil_leakage ? 'Yes' : 'No'} />
                      <InfoRow label="Front Drive Axle Noise" value={et.gear_shifting?.front_drive_axle_noise ? 'Yes' : 'No'} />
                    </Card>
                    <Card>
                      <SectionLabel>Other Engine Parts</SectionLabel>
                      <InfoRow label="Engine Mounting" value={et.engine_mounting?.status} />
                      <InfoRow label="Excess Vibration" value={et.engine_mounting?.excess_vibration ? 'Yes' : 'No'} />
                      <InfoRow label="Engine Sound" value={et.engine_sound?.status} />
                      {et.engine_sound?.notes && <InfoRow label="Sound Notes" value={et.engine_sound.notes} />}
                      <InfoRow label="Exhaust / Smoke" value={et.exhaust_smoke?.status} />
                      <InfoRow label="Silencer Assembly Damaged" value={et.exhaust_smoke?.silencer_assembly_damaged ? 'Yes' : 'No'} />
                      <InfoRow label="Turbo Charger" value={et.turbo_charger?.status} />
                      <InfoRow label="Turbo Whistling Noise" value={et.turbo_charger?.whistling_noise ? 'Yes' : 'No'} />
                      <InfoRow label="Fuel Injector" value={et.fuel_injector?.status} />
                      <InfoRow label="Injector Noise" value={et.fuel_injector?.noise ? 'Yes' : 'No'} />
                      <InfoRow label="Sump Damaged" value={et.sump?.damaged ? 'Yes' : 'No'} />
                      <InfoRow label="Sump Leakage" value={et.sump?.leakage ? 'Yes' : 'No'} />
                      <InfoRow label="Radiator Fan Motor" value={et.radiator_fan_motor?.status} />
                      <InfoRow label="Fan Motor Noise" value={et.radiator_fan_motor?.noise ? 'Yes' : 'No'} />
                    </Card>
                    {car.steering_suspension_brakes && (
                      <Card>
                        <SectionLabel>Steering, Suspension & Brakes</SectionLabel>
                        <InfoRow label="Steering Status" value={car.steering_suspension_brakes.steering?.status} />
                        <InfoRow label="Steering Hard" value={car.steering_suspension_brakes.steering?.hard ? 'Yes' : 'No'} />
                        <InfoRow label="Steering Abnormal Noise" value={car.steering_suspension_brakes.steering?.abnormal_noise ? 'Yes' : 'No'} />
                        <InfoRow label="Suspension Status" value={car.steering_suspension_brakes.suspension?.status} />
                        <InfoRow label="Suspension Abnormal Noise" value={car.steering_suspension_brakes.suspension?.abnormal_noise ? 'Yes' : 'No'} />
                        <InfoRow label="Brake Status" value={car.steering_suspension_brakes.brake?.status} />
                        <InfoRow label="Brakes Noisy" value={car.steering_suspension_brakes.brake?.noisy ? 'Yes' : 'No'} />
                        {car.steering_suspension_brakes.comments && (
                          <InfoRow label="Comments" value={car.steering_suspension_brakes.comments} />
                        )}
                      </Card>
                    )}
                    {et.towing_recommended && (
                      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span className="text-rose-400 text-sm font-semibold">Towing Recommended</span>
                      </div>
                    )}
                    {et.comments && (
                      <Card><SectionLabel>Engine Comments</SectionLabel><p className="indigo-500/60 text-sm">{et.comments}</p></Card>
                    )}
                  </div>
                );
              })()}

              {activeTab === 'journey' && (
                <div className="space-y-4">
                  <Card>
                    <SectionLabel>Customer Journey</SectionLabel>
                    <InfoRow label="Current Step" value={enq.customerJourney?.currentStep} />
                  </Card>
                  {enq.customerJourney?.timeline?.length > 0 && (
                    <Card>
                      <SectionLabel>Timeline</SectionLabel>
                      <div className="relative pl-4">
                        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-white/10" />
                        {enq.customerJourney.timeline.map((step, i) => (
                          <div key={i} className="relative mb-4 last:mb-0">
                            <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-gray-900" />
                            <p className="indigo-500/70 text-sm font-semibold capitalize">{step.step}</p>
                            <p className="indigo-500/35 text-xs mt-0.5">{step.description}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  <Card>
                    <SectionLabel>Enquiry Info</SectionLabel>
                    <InfoRow label="Enquiry ID" value={enq.enquiryId} />
                    <InfoRow label="Type" value={enq.enquiryType} />
                    <InfoRow label="Severity" value={enq.severity} />
                    <InfoRow label="Assigned To" value={enq.assignedTo ?? 'Unassigned'} />
                    <InfoRow label="Schedule Date" value={enq.scheduleDate ? new Date(enq.scheduleDate).toLocaleDateString() : '—'} />
                    <InfoRow label="Schedule Time" value={enq.scheduleTime || '—'} />
                    <InfoRow label="Inspection Type" value={enq.inspectionType || '—'} />
                    <InfoRow label="Created At" value={new Date(enq.createdAt).toLocaleString()} />
                    <InfoRow label="Updated At" value={new Date(enq.updatedAt).toLocaleString()} />
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}>{icon}</span>
      <span className="indigo-500/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

// ── Pagination ─────────────────────────────────────────────────────
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page: currentPage, pages: totalPages, total, limit } = pagination;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    let prev = null;
    const out = [];
    for (const r of range) {
      if (r === prev) continue;
      out.push(r);
      prev = r;
    }
    return out;
  };

  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3">
      <span className="indigo-500/25 text-xs">
        Showing <span className="indigo-500/40 font-medium">{from}–{to}</span> of{' '}
        <span className="indigo-500/40 font-medium">{total}</span> enquiries
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center indigo-500/40 hover:indigo-500/70 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center indigo-500/20 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${p === currentPage
                ? 'bg-indigo-500 border-indigo-500 indigo-500 shadow-lg shadow-indigo-500/25'
                : 'bg-white/[0.04] border-white/[0.06] indigo-500/40 hover:bg-white/[0.08] hover:indigo-500/70'
                }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center indigo-500/40 hover:indigo-500/70 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────
const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('note');
  const [noteText, setNoteText] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // ── Fetch enquiries ──────────────────────────────────────────────
  const fetchEnquiries = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page, limit });

      if (filterStatus === 'new') {
        params.set('status', 'assign-to-team');
      } else if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      if (search.trim()) params.set('search', search.trim());

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries?${params.toString()}`,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      const raw = response.data;
      const dataList = raw.data ?? [];
      const paginationInfo = raw.pagination ?? null;

      const mapped = dataList.map(enquiry => ({
        id: enquiry._id,
        name: `${enquiry.userId?.firstName || 'Unknown'} ${enquiry.userId?.lastName || ''}`,
        email: enquiry.userId?.email || 'N/A',
        phone: enquiry.contactNumber,
        subject: enquiry.title,
        message: enquiry.description,
        status: enquiry.status,
        priority: enquiry.priority,
        enquiryId: enquiry.enquiryId,
        make: enquiry.carDetails?.make,
        model: enquiry.carDetails?.model,
        year: enquiry.carDetails?.year,
        date: new Date(enquiry.createdAt).toLocaleDateString(),
        avatar: `${enquiry.userId?.firstName?.[0] || 'U'}${enquiry.userId?.lastName?.[0] || ''}`.toUpperCase(),
        sellingDetails: enquiry.sellingDetails,
        attachments: enquiry.attachments,
        notes: enquiry.notes,
        estimatedCost: enquiry.estimatedCost || 0,
        actualCost: enquiry.actualCost || 0,
        customerJourney: enquiry.customerJourney ?? null,
      }));

      setEnquiries(mapped);
      setPagination(paginationInfo);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to fetch enquiries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, limit]);

  useEffect(() => { fetchEnquiries(1); }, [filterStatus, limit]);

  useEffect(() => {
    const t = setTimeout(() => fetchEnquiries(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/technicians`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        setTechnicians(
          response.data.data.technicians
            .filter(t => t.isActive)
            .map(t => ({ id: t._id, name: `${t.firstName} ${t.lastName}` }))
        );
      } catch (err) { console.error('Failed to fetch technicians', err); }
    };
    fetchTechnicians();
  }, []);

  // ── Counts ───────────────────────────────────────────────────────
  const counts = {
    all: pagination?.total ?? enquiries.length,
    new: enquiries.filter(e => e.status === 'assign-to-team').length,
    open: enquiries.filter(e => e.status === 'inspection').length,
    assigned: enquiries.filter(e => e.status === 'assigned').length,
    'in-progress': enquiries.filter(e => e.status === 'in-progress').length,
    resolved: enquiries.filter(e => e.status === 'resolved').length,
    closed: enquiries.filter(e => e.status === 'closed').length,
  };

  // ── Handlers ─────────────────────────────────────────────────────
  const openAssignModal = (enquiry) => {
    setAssignTarget(enquiry);
    setSelectedTechId('');
    setAssignPriority('medium');
    setAssignModalOpen(true);
  };

  const openNoteModal = (enquiry) => {
    setAssignTarget(enquiry);
    setNoteText('');
    setActionType('note');
    setActionModalOpen(true);
  };

  const openCostModal = (enquiry) => {
    setAssignTarget(enquiry);
    setEstimatedCost(enquiry.estimatedCost || '');
    setActualCost(enquiry.actualCost || '');
    setActionType('cost');
    setActionModalOpen(true);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return toast.error('Please enter a note');
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${assignTarget.id}/add-note`,
        { text: noteText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Note added successfully');
      setActionModalOpen(false);
      fetchEnquiries(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCost = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${assignTarget.id}/cost`,
        { estimatedCost: Number(estimatedCost) || 0, actualCost: Number(actualCost) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cost updated successfully');
      setActionModalOpen(false);
      fetchEnquiries(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cost');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) return toast.error('No enquiry selected');
    if (!selectedTechId) return toast.error('Please choose a technician');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/enquiries/${assignTarget.id}/assign`,
        { technicianId: selectedTechId, priority: assignPriority },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      toast.success('Enquiry assigned successfully');
      setAssignModalOpen(false);
      fetchEnquiries(currentPage);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign enquiry');
    }
  };

  const handlePageChange = (page) => {
    fetchEnquiries(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ];

  // ── Grid column definition (single source of truth) ──────────────
  const GRID = 'grid-cols-[1fr_1.5fr_1.2fr_1fr_1fr_1fr_180px]';

  return (
    <div className="w-full">
      {loading && enquiries.length === 0 && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-2 indigo-500/40">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading enquiries…
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-rose-400 text-sm">{error}</div>
        </div>
      )}

      {!error && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Enquiries" value={pagination?.total ?? counts.all} sub="All time" accent="bg-indigo-500"
              icon={<svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
            />
            <StatCard
              label="New" value={counts.new} sub="Assign to team" accent="bg-cyan-500"
              icon={<svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
            />
            <StatCard
              label="Open" value={counts.open} sub="Active" accent="bg-violet-500"
              icon={<svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            />
            <StatCard
              label="Resolved" value={counts.resolved} sub="Completed" accent="bg-emerald-500"
              icon={<svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
            />
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="w-full sm:w-auto overflow-x-auto pb-1">
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-max">
                {filterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterStatus === tab.key
                      ? 'bg-indigo-500 indigo-500 shadow-lg shadow-indigo-500/30'
                      : 'indigo-500/35 hover:indigo-500/60'
                      }`}
                  >
                    {tab.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20 indigo-500' : 'bg-white/[0.08] indigo-500/40'}`}>
                      {counts[tab.key] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search enquiries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border indigo-500 rounded-xl pl-9 pr-4 py-2 indigo-500/70 text-sm indigo-500 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">

                {/* Header */}
                <div className={`grid ${GRID} gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]`}>
                  {['Enquiry ID', 'Sender', 'Car Details', 'Subject', 'Priority', 'Status', 'Action'].map(h => (
                    <span key={h} className="indigo-500/25 text-[10px] font-bold tracking-widest uppercase">{h}</span>
                  ))}
                </div>

                {/* Loading skeleton */}
                {loading && (
                  <div className="divide-y divide-white/[0.04]">
                    {[...Array(limit)].map((_, i) => (
                      <div key={i} className={`grid ${GRID} gap-4 px-5 py-4 items-center animate-pulse`}>
                        <div className="space-y-1.5">
                          <div className="h-3 bg-white/10 rounded w-3/4" />
                          <div className="h-2.5 bg-white/[0.06] rounded w-1/2" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3 bg-white/10 rounded w-3/4" />
                            <div className="h-2.5 bg-white/[0.06] rounded w-1/2" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-3 bg-white/10 rounded w-4/5" />
                          <div className="h-2.5 bg-white/[0.06] rounded w-1/3" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-3 bg-white/10 rounded w-4/5" />
                          <div className="h-2.5 bg-white/[0.06] rounded w-1/3" />
                        </div>
                        <div className="h-5 bg-white/10 rounded-full w-16" />
                        <div className="h-5 bg-white/10 rounded-full w-20" />
                        <div className="flex gap-2">
                          <div className="h-7 w-7 bg-white/10 rounded-lg" />
                          <div className="h-7 w-7 bg-white/10 rounded-lg" />
                          <div className="h-7 w-7 bg-white/10 rounded-lg" />
                          <div className="h-7 w-7 bg-white/10 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!loading && enquiries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 indigo-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <p className="indigo-500/30 text-sm font-medium">No enquiries found</p>
                    <p className="indigo-500/15 text-xs mt-1">Try adjusting your search or filters</p>
                  </div>
                )}

                {/* Data rows */}
                {!loading && enquiries.map((enq, idx) => {
                  const pc = priorityConfig[enq.priority] || { label: enq.priority, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
                  const grad = avatarGradients[idx % avatarGradients.length];
                  return (
                    <div
                      key={enq.id}
                      className={`grid ${GRID} gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors duration-150 cursor-pointer items-center group`}
                      onClick={() => setSelectedId(enq.id)}
                    >
                      {/* Enquiry ID */}
                      <div className="min-w-0">
                        <p className="indigo-500/80 text-sm font-medium font-mono truncate">{enq.enquiryId}</p>
                        <p className="indigo-500/25 text-xs mt-0.5">{enq.date}</p>
                      </div>

                      {/* Sender */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center indigo-500 text-xs font-bold flex-shrink-0`}>
                          {enq.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="indigo-500/85 text-sm font-medium truncate">{enq.name}</p>
                          <p className="indigo-500/30 text-xs truncate">{enq.email}</p>
                          <p className="indigo-500/25 text-xs truncate">{enq.phone}</p>
                        </div>
                      </div>

                      {/* Car Details */}
                      <div className="min-w-0">
                        <p className="indigo-500/75 text-sm font-medium truncate">
                          {enq.make} {enq.model}
                        </p>
                        <p className="indigo-500/30 text-xs mt-0.5">{enq.year}</p>
                      </div>

                      {/* Subject */}
                      <div className="min-w-0">
                        <p className="indigo-500/70 text-sm truncate">{enq.subject}</p>
                      </div>

                      {/* Priority */}
                      <div>
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                          {pc.label}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <StatusDot status={enq.status} />
                        {enq.status === 'assigned' && (() => {
                          const assignedStep = enq.customerJourney?.timeline?.find(item => item.step === 'assigned');
                          return assignedStep?.description ? (
                            <div className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 w-fit truncate max-w-[120px]">
                              {assignedStep.description}
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedId(enq.id)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                        <button
                          onClick={() => openAssignModal(enq)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="Assign Technician"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6m-3-3h6" /></svg>
                        </button>
                        <button
                          onClick={() => openNoteModal(enq)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                          title="Add Note"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => openCostModal(enq)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                          title="Set Cost"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            </div>
          </div>

          {/* Action Modal (Note / Cost) */}
          {actionModalOpen && assignTarget && (
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center indigo-500/70 backdrop-blur-sm p-4"
              onClick={() => setActionModalOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white border border-white/[0.08] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${actionType === 'note' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-500'}`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="indigo-500 text-lg font-bold">
                      {actionType === 'note' ? 'Add Note' : 'Set Margin'}
                    </h3>
                    <button
                      onClick={() => setActionModalOpen(false)}
                      className="indigo-500/20 hover:indigo-500 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {actionType === 'note' ? (
                    <div className="space-y-4">
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Type your note here..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 indigo-500 text-sm outline-none focus:border-amber-500/50 transition-all min-h-[120px] resize-none"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={submitting || !noteText.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 indigo-500 font-bold text-sm disabled:opacity-50"
                      >
                        {submitting ? 'Adding...' : 'Add Note →'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold indigo-500/30 uppercase tracking-widest mb-2">
                            Customer Offer (₹)
                          </label>
                          <input
                            type="number"
                            value={estimatedCost}
                            onChange={e => setEstimatedCost(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 indigo-500 text-sm outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold indigo-500/30 uppercase tracking-widest mb-2">
                            Highest Bid (₹)
                          </label>
                          <input
                            type="number"
                            value={actualCost}
                            onChange={e => setActualCost(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 indigo-500 text-sm outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleUpdateCost}
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 indigo-500 font-bold text-sm disabled:opacity-50"
                      >
                        {submitting ? 'Updating...' : 'Update Price →'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assign Modal */}
          {assignModalOpen && assignTarget && (
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center indigo-500/70 backdrop-blur-sm p-4"
              onClick={() => setAssignModalOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white border border-white/[0.08] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border-b border-white/[0.06] px-6 py-5">
                  <div className="flex items-center justify-between">
                    <h3 className="indigo-500 text-base font-bold">Assign Enquiry</h3>
                    <button
                      onClick={() => setAssignModalOpen(false)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center indigo-500/40 hover:indigo-500/70 transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold indigo-500/40 uppercase tracking-widest mb-2">
                      Select Technician
                    </label>
                    <select
                      value={selectedTechId}
                      onChange={e => setSelectedTechId(e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 indigo-500 text-sm outline-none focus:border-indigo-500/60 transition-all appearance-none cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" disabled className="bg-gray-800 indigo-500/50">
                        Choose a technician...
                      </option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id} className="bg-gray-800 indigo-500">
                          {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold indigo-500/40 uppercase tracking-widest mb-2">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'low', label: 'Low', color: 'text-emerald-400', border: 'border-emerald-500/30', activeBg: 'bg-emerald-500/20' },
                        { value: 'medium', label: 'Medium', color: 'text-amber-400', border: 'border-amber-500/30', activeBg: 'bg-amber-500/20' },
                        { value: 'high', label: 'High', color: 'text-rose-400', border: 'border-rose-500/30', activeBg: 'bg-rose-500/20' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAssignPriority(opt.value)}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${assignPriority === opt.value
                            ? `${opt.activeBg} ${opt.border} ${opt.color}`
                            : 'bg-white/[0.03] indigo-500 indigo-500/30 hover:indigo-500/50'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setAssignModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] indigo-500/60 text-sm font-semibold hover:bg-white/[0.10] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedTechId}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 indigo-500 text-sm font-bold disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                  >
                    Assign Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detail Drawer */}
          {selectedId && (
            <DetailDrawer enquiryId={selectedId} onClose={() => setSelectedId(null)} />
          )}
        </>
      )}
    </div>
  );
};

export default Enquiries;