// RCVerification.jsx
import { useState } from "react";
import axios from "axios";

const RCVerification = () => {
  const [rcNumber, setRcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("vehicle");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const verify = async () => {
    if (!rcNumber.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    setCreated(false);
    try {
      const res = await axios.post(
        "https://api.bidndrive.in/api/cj/rc-varification",
        { id_number: rcNumber.toLowerCase() }
      );
      if (!res.data.success || !res.data.response?.data) {
        throw new Error(res.data.message || "Verification failed");
      }
      setData(res.data.response.data);
      setActiveTab("vehicle");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to verify RC");
    } finally {
      setLoading(false);
    }
  };

  const createEnquiry = async () => {
  if (!data) return;
  setCreating(true);
  setCreated(false);
  const token = localStorage.getItem("adminToken");

  try {
    const fd = new FormData();

    // Basic fields
    fd.append("enquiryType", "status");
    fd.append("title", `RC Check - ${data.rc_number}`);
    fd.append("description", `RC Verification enquiry for ${data.maker_model || "vehicle"} (${data.rc_number}). Owner: ${(data.owner_name || "").trim()}. RC Status: ${data.rc_status || "Unknown"}. Insurance: ${data.insurance_company || "N/A"} valid till ${data.insurance_upto || "N/A"}.`);
    fd.append("priority", "medium");
    fd.append("severity", "low");
    fd.append("inspectionType", "center");

    // Contact number from RC data
    if (data.mobile_number) {
      fd.append("contactNumber", data.mobile_number);
    }

    // Customer name from RC owner
    if (data.owner_name) {
      fd.append("customerName", (data.owner_name || "").trim());
    }

    // Car Details - complete data
    const carDetails = {
      make: data.maker_description || "",
      model: data.maker_model || "",
      year: data.manufacturing_date_formatted?.split("-")[0] || "",
      color: data.color || "",
      mileage: "",
      registrationNumber: data.rc_number || "",
      chassisNumber: data.vehicle_chasi_number || "",
      engineNumber: data.vehicle_engine_number || "",
      fuelType: data.fuel_type || "",
      bodyType: data.body_type || "",
      category: data.vehicle_category_description || "",
      seatCapacity: data.seat_capacity || "",
      grossWeight: data.vehicle_gross_weight || "",
      cubicCapacity: data.cubic_capacity || "",
      emissionNorm: data.norms_type || "",
      wheelbase: data.wheelbase || "",
      manufacturingDate: data.manufacturing_date_formatted || "",
      registrationDate: data.registration_date || "",
      registeredAt: data.registered_at || "",
    };
    fd.append("carDetails", JSON.stringify(carDetails));

    // Selling Details - compliance + insurance info
    const sellingDetails = {
      fuelType: (data.fuel_type || "").toLowerCase(),
      ownership: data.owner_number ? `${data.owner_number === "1" ? "first" : data.owner_number === "2" ? "second" : data.owner_number === "3" ? "third" : "fourth_or_more"}` : "",
      accidentHistory: "none",
      serviceHistoryAvailable: false,
      city: data.present_address?.split(",").slice(-3, -1).join(",").trim() || "",

      // Extra compliance fields as additionalInfo
      rcStatus: data.rc_status || "",
      fitUpto: data.fit_up_to || "",
      taxUpto: data.tax_upto || "",
      puccNumber: data.pucc_number || "",
      puccUpto: data.pucc_upto || "",
      insuranceCompany: data.insurance_company || "",
      insurancePolicyNumber: data.insurance_policy_number || "",
      insuranceUpto: data.insurance_upto || "",
      blacklistStatus: data.blacklist_status || "Clear",
      financed: data.financed || false,
      financer: data.financer || "",
    };
    fd.append("sellingDetails", JSON.stringify(sellingDetails));

    // Additional Info - full RC summary
    const additionalInfo = `
RC Number: ${data.rc_number || "—"}
Owner: ${(data.owner_name || "").trim()}
RC Status: ${data.rc_status || "—"}
Fitness Upto: ${data.fit_up_to || "—"}
Tax Upto: ${data.tax_upto || "—"}
Insurance: ${data.insurance_company || "—"} | Policy: ${data.insurance_policy_number || "—"} | Valid till: ${data.insurance_upto || "—"}
PUCC: ${data.pucc_number || "—"} | Upto: ${data.pucc_upto || "—"}
Blacklist: ${data.blacklist_status || "Clear"}
Financed: ${data.financed ? `Yes - ${data.financer}` : "No"}
Permit: ${data.permit_number || "None"}
Address: ${data.present_address || "—"}
    `.trim();
    fd.append("additionalInfo", additionalInfo);

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/enquiries/admin`,
      fd,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setCreated(true);
  } catch (err) {
    console.error("Create enquiry failed", err);
    alert("Failed to create enquiry");
  } finally {
    setCreating(false);
  }
};

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const isExpired = (d) => d && new Date(d) < new Date();

  const Badge = ({ expired }) =>
    expired ? (
      <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
        Expired
      </span>
    ) : (
      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
        Valid
      </span>
    );

  const Field = ({ label, value, mono }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
        {label}
      </span>
      {value ? (
        <span className={`text-sm font-medium text-gray-700 ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </span>
      ) : (
        <span className="text-sm text-gray-300 italic font-normal">Not available</span>
      )}
    </div>
  );

  const tabs = [
    { key: "vehicle", label: "Vehicle" },
    { key: "owner", label: "Owner" },
    { key: "compliance", label: "Compliance" },
    { key: "insurance", label: "Insurance" },
  ];

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={rcNumber}
          onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          placeholder="e.g. MP08CA3176"
          className="flex-1 h-10 border border-gray-200 rounded-xl px-4 text-sm font-mono uppercase tracking-widest outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 bg-white text-gray-800"
        />
        <button
          onClick={verify}
          disabled={loading || !rcNumber.trim()}
          className="h-10 px-5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
          {loading ? "Verifying…" : "Verify RC"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {data && (
        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          
          {/* Hero */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 border-b border-gray-100 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{data.maker_model || "Unknown vehicle"}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {data.rc_number} · {data.color} · {data.fuel_type}
              </p>
            </div>

            {/* RC Status badge */}
            <span
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                (data.rc_status || "").toLowerCase().includes("expired")
                  ? "bg-rose-500/10 text-rose-500"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {data.rc_status || "Active"}
            </span>

            {/* Create Enquiry button */}
            <button
              onClick={createEnquiry}
              disabled={creating || created}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                created
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {creating ? (
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : created ? (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              {creating ? "Creating…" : created ? "Enquiry Created" : "Create Enquiry"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === t.key
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">

            {/* Vehicle Tab */}
            {activeTab === "vehicle" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Make" value={data.maker_description} />
                <Field label="Model" value={data.maker_model} />
                <Field label="Color" value={data.color} />
                <Field label="Fuel type" value={data.fuel_type} />
                <Field label="Category" value={data.vehicle_category_description} />
                <Field label="Seats" value={data.seat_capacity} />
                <Field
                  label="Cubic capacity"
                  value={data.cubic_capacity ? `${parseFloat(data.cubic_capacity).toFixed(0)} cc` : null}
                />
                <Field
                  label="Gross weight"
                  value={data.vehicle_gross_weight ? `${data.vehicle_gross_weight} kg` : null}
                />
                <Field label="Emission norm" value={data.norms_type} />
                <Field label="Chassis no." value={data.vehicle_chasi_number} mono />
                <Field label="Engine no." value={data.vehicle_engine_number} mono />
                <Field label="Registered at" value={data.registered_at} />
                <Field label="Reg. date" value={fmt(data.registration_date)} />
                <Field label="Mfg. date" value={data.manufacturing_date_formatted} />
                <Field label="Wheelbase" value={data.wheelbase ? `${data.wheelbase} mm` : null} />
              </div>
            )}

            {/* Owner Tab */}
            {activeTab === "owner" && (
              <div>
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                    {(data.owner_name || "U")
                      .trim()
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{(data.owner_name || "").trim()}</p>
                    <p className="text-xs text-gray-400">Owner #{data.owner_number || "1"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Present address" value={data.present_address} />
                  <Field label="Permanent address" value={data.permanent_address} />
                  <Field label="Mobile" value={data.mobile_number || null} />
                  <Field label="Father's name" value={data.father_name || null} />
                </div>
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === "compliance" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Fitness upto</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center flex-wrap gap-1.5">
                    {fmt(data.fit_up_to)}
                    <Badge expired={isExpired(data.fit_up_to)} />
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Tax upto</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center flex-wrap gap-1.5">
                    {fmt(data.tax_upto)}
                    <Badge expired={isExpired(data.tax_upto)} />
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">PUCC upto</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center flex-wrap gap-1.5">
                    {fmt(data.pucc_upto)}
                    <Badge expired={isExpired(data.pucc_upto)} />
                  </span>
                </div>
                <Field label="PUCC number" value={data.pucc_number} mono />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Blacklist</span>
                  {data.blacklist_status ? (
                    <span className="text-xs font-semibold text-rose-500">{data.blacklist_status}</span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-500">Clear</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Financed</span>
                  {data.financed ? (
                    <span className="text-xs font-semibold text-amber-500">{data.financer || "Yes"}</span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-500">No</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">RC Status</span>
                  <span className={`text-xs font-semibold ${(data.rc_status || "").toLowerCase().includes("expired") ? "text-rose-500" : "text-emerald-500"}`}>
                    {data.rc_status || "—"}
                  </span>
                </div>
                <Field label="Tax paid upto" value={fmt(data.tax_paid_upto)} />
                <Field label="Latest by" value={fmt(data.latest_by)} />
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === "insurance" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Insurer</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {data.insurance_company || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Policy no.</p>
                    <p className="text-xs font-mono text-gray-600 mt-0.5">
                      {data.insurance_policy_number || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Valid upto</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    {fmt(data.insurance_upto)}
                    <Badge expired={isExpired(data.insurance_upto)} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RCVerification;