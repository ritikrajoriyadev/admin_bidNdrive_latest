/**
 * generateInspectionPDF — Cars24-style inspection report
 *
 * FIXES applied vs original:
 *  1. Added `export default generateInspectionPDF` so the component's
 *     `import generateInspectionPDF from '../generateInspectionPDF'` works.
 *  2. Fixed duplicate `let cx` redeclaration inside inspectionTable's
 *     page-break block (renamed inner one to `hcx`).
 *  3. Fixed photoPageBreak to return `y` AFTER sectionHeading, not a
 *     hardcoded `ny + 12`.
 *  4. Fixed interior conditions double-reference bug in intRows.
 *  5. Fixed engine oil boolStr trailing ", " when conditions is empty.
 *  6. fetchImageAsBase64 kept local (no conflict with component copy).
 */

// ─── Image fetcher ─────────────────────────────────────────────────────────────
async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Collect exterior images ───────────────────────────────────────────────────
function collectExteriorImages(car) {
  const images = [];
  if (!car?.exterior_tyres) return images;
  const et = car.exterior_tyres;

  const addImgs = (imgs, label) =>
    imgs?.forEach((img) => images.push({ url: img.url, caption: label }));

  addImgs(et.bumper?.front?.images, "Bumper - Front");
  addImgs(et.bumper?.rear?.images, "Bumper - Rear");
  addImgs(et.bonnet_hood?.images, "Bonnet/Hood");
  addImgs(et.roof?.images, "Roof");
  addImgs(et.fender?.lhs?.images, "Fender - LHS");
  addImgs(et.fender?.rhs?.images, "Fender - RHS");
  addImgs(et.door?.lhs_front?.images, "Door - LHS Front");
  addImgs(et.door?.lhs_rear?.images, "Door - LHS Rear");
  addImgs(et.door?.rhs_front?.images, "Door - RHS Front");
  addImgs(et.door?.rhs_rear?.images, "Door - RHS Rear");
  addImgs(et.pillar?.lhs_a?.images, "Pillar - LHS A");
  addImgs(et.pillar?.lhs_b?.images, "Pillar - LHS B");
  addImgs(et.pillar?.lhs_c?.images, "Pillar - LHS C");
  addImgs(et.pillar?.rhs_a?.images, "Pillar - RHS A");
  addImgs(et.pillar?.rhs_b?.images, "Pillar - RHS B");
  addImgs(et.pillar?.rhs_c?.images, "Pillar - RHS C");
  addImgs(et.running_border?.lhs?.images, "Running Border - LHS");
  addImgs(et.running_border?.rhs?.images, "Running Border - RHS");
  addImgs(et.quarter_panel?.lhs?.images, "Quarter Panel - LHS");
  addImgs(et.quarter_panel?.rhs?.images, "Quarter Panel - RHS");
  addImgs(et.dicky_boot_door?.images, "Dicky Door / Boot Door");
  addImgs(et.boot_floor?.images, "Boot Floor");
  addImgs(et.apron?.images, "Apron");
  addImgs(et.firewall?.images, "Firewall");
  addImgs(et.cowl_top?.images, "Cowl Top");
  addImgs(et.lower_cross_member?.images, "Lower Cross Member");
  addImgs(et.upper_cross_member?.images, "Upper Cross Member");
  addImgs(et.head_light_support?.images, "Head Light Support");
  addImgs(et.radiator_support?.images, "Radiator Support");
  addImgs(et.windshield?.front?.images, "Windshield - Front");
  addImgs(et.windshield?.rear?.images, "Windshield - Rear");
  addImgs(et.orvm?.lhs?.images, "ORVM - LHS");
  addImgs(et.orvm?.rhs?.images, "ORVM - RHS");
  addImgs(et.lights?.lhs_headlight?.images, "Light - LHS Headlight");
  addImgs(et.lights?.rhs_headlight?.images, "Light - RHS Headlight");
  addImgs(et.lights?.lhs_taillight?.images, "Light - LHS Taillight");
  addImgs(et.lights?.rhs_taillight?.images, "Light - RHS Taillight");
  addImgs(et.alloy_wheel?.images, "Alloy Wheel");
  addImgs(et.tyres?.lhs_front?.images, "LHS Front Tyre");
  addImgs(et.tyres?.rhs_front?.images, "RHS Front Tyre");
  addImgs(et.tyres?.lhs_rear?.images, "LHS Rear Tyre");
  addImgs(et.tyres?.rhs_rear?.images, "RHS Rear Tyre");
  addImgs(et.tyres?.spare?.images, "Spare Tyre");

  return images;
}

function collectEngineImages(car) {
  const images = [];
  const eng = car?.engine_transmission;
  if (!eng) return images;
  eng.engine?.images?.forEach((img) =>
    images.push({ url: img.url, caption: img.caption || "Engine" })
  );
  eng.battery?.images?.forEach((img) =>
    images.push({ url: img.url, caption: img.caption || "Battery" })
  );
  return images;
}

function collectInteriorImages(car) {
  const images = [];
  const ei = car?.electricals_interior;
  if (!ei) return images;
  ei.images?.forEach((img) =>
    images.push({ url: img.url, caption: img.caption || "Interior" })
  );
  return images;
}

// ─── Main function ─────────────────────────────────────────────────────────────
async function generateInspectionPDF(enq, car, onProgress) {
  // 1. Load jsPDF
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;
  const PH = 297;
  const ML = 14;
  const MR = 14;
  const CW = PW - ML - MR; // 182mm

  // ── Colours ─────────────────────────────────────────────────────────────────
  const ORANGE = [255, 102, 0];
  const WHITE  = [255, 255, 255];
  const DARK   = [30, 30, 30];
  const GRAY1  = [248, 248, 248];
  const GRAY2  = [241, 241, 241];
  const GRAY3  = [220, 220, 220];
  const GRAY4  = [150, 150, 150];
  const GRAY5  = [100, 100, 100];
  const GRAY6  = [60, 60, 60];
  const GREEN  = [34, 160, 60];
  const RED    = [220, 50, 50];

  // ── Drawing helpers ──────────────────────────────────────────────────────────
  const setF = (...c) => doc.setFillColor(...(c.length === 1 ? c[0] : c));
  const setT = (...c) => doc.setTextColor(...(c.length === 1 ? c[0] : c));
  const setD = (...c) => doc.setDrawColor(...(c.length === 1 ? c[0] : c));
  const lw   = (w)    => doc.setLineWidth(w);
  const R    = (x, y, w, h, s = "F") => doc.rect(x, y, w, h, s);
  const font = (style, size) => { doc.setFont("helvetica", style); doc.setFontSize(size); };
  const txt  = (text, x, y, opts = {}) => {
    const s = String(text ?? "—");
    const o = {};
    if (opts.align)    o.align    = opts.align;
    if (opts.maxWidth) o.maxWidth = opts.maxWidth;
    doc.text(s, x, y, Object.keys(o).length ? o : undefined);
  };
  const addImg = (dataUrl, x, y, w, h) => {
    if (!dataUrl) return false;
    try {
      const fmt = dataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(dataUrl, fmt, x, y, w, h, undefined, "FAST");
      return true;
    } catch { return false; }
  };
  const fmt     = (v) => String(v ?? "—");
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "—";

  // ── Page chrome ──────────────────────────────────────────────────────────────
  let pageNum = 0;
  const addPage = () => {
    if (pageNum > 0) doc.addPage();
    pageNum++;

    // Header
    setF(28, 63, 94);
    R(0, 0, PW, 16);
    setT(WHITE);
    font("bold", 11);
    txt("BIDNDRIVE", 5, 10.5);
    setT(220, 220, 220);
    font("normal", 7);
    txt("INSPECTION REPORT", PW / 2, 6.5, { align: "center" });
    const cd = car?.car_details || {};
    const regNo = cd.registration_number || enq?.enquiryId || "—";
    font("bold", 7);
    setT(WHITE);
    txt(regNo.toUpperCase(), PW / 2, 12.5, { align: "center" });
    font("normal", 6.5);
    setT(200, 200, 200);
    txt(fmtDate(enq?.createdAt || new Date()), PW - MR, 10.5, { align: "right" });

    // Orange accent line
    setF(ORANGE);
    R(0, 16, PW, 1.2);

    // Footer
    setF(245, 245, 245);
    R(0, PH - 8, PW, 8);
    setD(GRAY3);
    lw(0.2);
    doc.line(0, PH - 8, PW, PH - 8);
    setT(GRAY4);
    font("normal", 5.5);
    txt(
      " BIDNDRIVE PVT. LTD. · www.bidndrive.in · care@bidndrive.com",
      PW / 2,
      PH - 3,
      { align: "center" }
    );

    return 20;
  };

  // ── Section heading ──────────────────────────────────────────────────────────
  const sectionHeading = (label, y) => {
    setT(ORANGE);
    font("bold", 9);
    txt(label, ML, y + 5);
    setD(ORANGE);
    lw(0.6);
    doc.line(ML, y + 6.5, ML + 40, y + 6.5);
    setD(GRAY3);
    lw(0.2);
    doc.line(ML + 40, y + 6.5, ML + CW, y + 6.5);
    return y + 11;
  };

  // ── KV table ─────────────────────────────────────────────────────────────────
  const kvTable = (pairs, x, y, w) => {
    const ROW = 6.8;
    pairs.forEach(([label, value], i) => {
      if (i % 2 === 1) { setF(GRAY1); R(x, y, w, ROW, "F"); }
      setT(GRAY5); font("normal", 7); txt(label, x + 2, y + 4.8);
      setT(GRAY6); font("bold", 7);
      const val   = fmt(value);
      const maxW  = w * 0.5;
      const lines = doc.splitTextToSize(val, maxW);
      txt(lines[0] + (lines.length > 1 ? "…" : ""), x + w - 2, y + 4.8, { align: "right" });
      setD(GRAY3); lw(0.15);
      doc.line(x, y + ROW, x + w, y + ROW);
      y += ROW;
    });
    return y + 2;
  };

  // ── Inspection table ─────────────────────────────────────────────────────────
  // FIX 2: renamed inner `cx` variable inside the page-break header re-draw
  //        from `let cx` → `hcx` to avoid redeclaration in strict mode.
  const inspectionTable = (rows, x, y, colW, headers) => {
    let cy = y;
    const TW  = colW.reduce((a, b) => a + b, 0);
    const ROW = 6.5;

    const drawHeader = (startY) => {
      setF(50, 50, 50);
      R(x, startY, TW, 7.5);
      setT(WHITE); font("bold", 7);
      let hcx = x; // FIX: was `let cx` — redeclaration conflict resolved
      headers.forEach((h, i) => { txt(h, hcx + 2, startY + 5.2); hcx += colW[i]; });
      return startY + 7.5;
    };

    cy = drawHeader(cy);

    rows.forEach((row, ri) => {
      if (cy + ROW > PH - 12) {
        cy = addPage();
        cy = drawHeader(cy);
      }

      setF(ri % 2 === 0 ? WHITE : GRAY1);
      R(x, cy, TW, ROW, "F");
      setD(GRAY3); lw(0.15);
      R(x, cy, TW, ROW, "S");

      let cx = x;
      row.forEach((cell, ci) => {
        if (ci === 2) {
          const isOkCell = cell === true || cell === "ok" || cell === "✓";
          setT(isOkCell ? GREEN : RED);
          font("bold", 8);
          txt(isOkCell ? "✓" : "✗", cx + colW[ci] / 2, cy + 4.5, { align: "center" });
        } else {
          setT(ci === 0 ? GRAY6 : GRAY5);
          font(ci === 0 ? "bold" : "normal", 7);
          const lines = doc.splitTextToSize(fmt(cell), colW[ci] - 4);
          txt(lines[0] + (lines.length > 1 ? "…" : ""), cx + 2, cy + 4.5);
        }
        cx += colW[ci];
      });
      cy += ROW;
    });
    return cy + 3;
  };

  // ── Photo grid ───────────────────────────────────────────────────────────────
  // FIX 3: photoPageBreak now returns the y AFTER sectionHeading is drawn,
  //        instead of the hardcoded `ny + 12` which skipped heading height.
  const photoGrid = (imgs, imgDataMap, x, y, pageBreakFn) => {
    const COLS   = 2;
    const IMG_W  = (CW - 4) / COLS;
    const IMG_H  = IMG_W * 0.72;
    const CAP_H  = 7;
    const CELL_H = IMG_H + CAP_H;

    let col = 0;
    let cy  = y;

    for (const img of imgs) {
      if (cy + CELL_H > PH - 12) {
        cy  = pageBreakFn(); // FIX: pageBreakFn now returns correct y
        col = 0;
      }
      const px = x + col * (IMG_W + 4);

      setF(GRAY2); setD(GRAY3); lw(0.2);
      R(px, cy, IMG_W, IMG_H, "FD");

      const data   = imgDataMap[img.url];
      const placed = addImg(data, px + 0.5, cy + 0.5, IMG_W - 1, IMG_H - 1);
      if (!placed) {
        setT(GRAY4); font("normal", 7);
        txt("Image unavailable", px + IMG_W / 2, cy + IMG_H / 2, { align: "center" });
      }

      setT(GRAY6); font("bold", 6.5);
      const capLines = doc.splitTextToSize(img.caption || "", IMG_W - 2);
      txt(
        capLines[0] + (capLines.length > 1 ? "…" : ""),
        px + IMG_W / 2,
        cy + IMG_H + 5,
        { align: "center" }
      );

      col++;
      if (col >= COLS) { col = 0; cy += CELL_H + 4; }
    }
    if (col > 0) cy += CELL_H + 4;
    return cy;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — CAR OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Building cover page…");
  let y = addPage();

  const cd = car?.car_details || {};

  setT(DARK); font("bold", 14);
  const carTitle =
    `${cd.make || enq?.carDetails?.make || "Vehicle"} ${cd.model || enq?.carDetails?.model || ""}`.trim();
  txt(carTitle, ML, y + 7);
  setT(GRAY5); font("normal", 8);
  const variant = cd.variant
    ? `${cd.variant} [${cd.year_of_manufacturing || ""}]`
    : fmt(cd.year_of_manufacturing);
  txt(variant, ML, y + 13);
  y += 18;

  const LEFT_W  = 74;
  const RIGHT_W = CW - LEFT_W - 5;
  const LEFT_X  = ML;
  const RIGHT_X = ML + LEFT_W + 5;

  // Left: Car image
  setF(GRAY2); setD(GRAY3); lw(0.3);
  R(LEFT_X, y, LEFT_W, 52, "FD");
  let coverImgPlaced = false;
  const coverAttachment = enq?.attachments?.[0];
  if (coverAttachment) {
    onProgress?.("Fetching cover image…");
    const coverData = await fetchImageAsBase64(coverAttachment?.url);
    if (coverData) {
      coverImgPlaced = addImg(coverData, LEFT_X + 1, y + 1, LEFT_W - 2, 50);
    }
  }
  if (!coverImgPlaced) {
    setT(GRAY4); font("normal", 7);
    txt("Vehicle Photo", LEFT_X + LEFT_W / 2, y + 27, { align: "center" });
  }

  // Right: quick-info KV
  const qPairs = [
    ["Year Of Manufacturing",       cd.year_of_manufacturing],
    ["No. Of Owner(s)",             cd.no_of_owners],
    ["Duplicate Key",               cd.duplicate_key ? "Yes" : "No"],
    ["KM",                          cd.odometer_reading != null ? Number(cd.odometer_reading).toLocaleString("en-IN") : "—"],
    ["Fuel Type",                   cd.fuel_type],
    ["Reg. State",                  cd.reg_state],
    ["Reg. City",                   cd.reg_city],
    ["Insurance Type",              cd.insurance_type],
    ["RC Availability",             cd.rc_availability],
    ["Road Tax Paid",               cd.road_tax_paid],
    ["Road Tax Date (Validity)",    cd.road_tax_validity ? fmtDate(cd.road_tax_validity) : "—"],
    ["CNG/LPG Fitment In RC",       cd.cng_lpg_fitment_in_rc ? "Yes" : "—"],
  ];

  const QR = 4.4;
  let qy = y;
  qPairs.forEach(([label, value]) => {
    setT(GRAY5); font("normal", 7); txt(label, RIGHT_X, qy + 3.5);
    setT(GRAY6); font("bold", 7);
    txt(fmt(value), RIGHT_X + RIGHT_W, qy + 3.5, { align: "right" });
    qy += QR;
  });

  y = Math.max(y + 55, qy + 4);

  // Car details table
  y = sectionHeading("Car Details", y + 3);

  const detailPairs = [
    ["Registration Number",         cd.registration_number?.toUpperCase() || "—"],
    ["RTO",                         cd.rto],
    ["City",                        cd.reg_city],
    ["RTO NOC Issued",              cd.rto_noc_issued ? "Yes" : "No"],
    ["Inspection At",               cd.inspection_at],
    ["Under Hypothecation",         cd.under_hypothecation ? "Yes" : "No"],
    ["Branch",                      cd.branch],
    ["Chassis Number Embossing",    cd.chassis_embossing],
    ["To Be Scrapped",              cd.to_be_scrapped ? "Yes" : "No"],
    ["Manufacturing Month",         cd.manufacturing_month],
    ["Registration Year",           cd.registration_year],
    ["Registration Month",          cd.registration_month],
    ["Fitness Upto",                fmtDate(cd.fitness_upto)],
    ["RC Condition",                cd.rc_condition],
    ["Mismatch In RC",              cd.mismatch_in_rc ? "Yes" : "No Mismatch"],
  ];

  const half     = Math.ceil(detailPairs.length / 2);
  const leftPairs  = detailPairs.slice(0, half);
  const rightPairs = detailPairs.slice(half);
  const colW2    = (CW - 4) / 2;

  const yLeft  = kvTable(leftPairs,  ML,             y, colW2);
  const yRight = kvTable(rightPairs, ML + colW2 + 4, y, colW2);
  y = Math.max(yLeft, yRight) + 3;

  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 2 — EXTERIOR TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Building inspection summary…");
  y = addPage();
  y = sectionHeading("Summary", y);

  const exteriorRows = [];
  const et = car?.exterior_tyres;

  const pushRow = (part, subpart, data) => {
    if (!data) return;
    const isOk      = data.status !== "issue" && data.status !== "na";
    const conditions = [...(data.conditions || []), ...(data.work_done || [])]
      .filter(Boolean)
      .join(", ");
    const treadStr = data.tread_depth_mm ? ` (${data.tread_depth_mm} mm)` : "";
    exteriorRows.push([part, subpart, isOk, (conditions || "—") + treadStr]);
  };

  if (et) {
    pushRow("Bumper", "Front", et.bumper?.front);
    pushRow("Bumper", "Rear",  et.bumper?.rear);
    pushRow("Bonnet/Hood", "—", et.bonnet_hood);
    pushRow("Roof",        "—", et.roof);
    pushRow("Fender", "LHS",   et.fender?.lhs);
    pushRow("Fender", "RHS",   et.fender?.rhs);
    pushRow("Door", "LHS Front", et.door?.lhs_front);
    pushRow("Door", "LHS Rear",  et.door?.lhs_rear);
    pushRow("Door", "RHS Front", et.door?.rhs_front);
    pushRow("Door", "RHS Rear",  et.door?.rhs_rear);
    pushRow("Pillar", "LHS A",   et.pillar?.lhs_a);
    pushRow("Pillar", "LHS B",   et.pillar?.lhs_b);
    pushRow("Pillar", "LHS C",   et.pillar?.lhs_c);
    pushRow("Pillar", "RHS A",   et.pillar?.rhs_a);
    pushRow("Pillar", "RHS B",   et.pillar?.rhs_b);
    pushRow("Pillar", "RHS C",   et.pillar?.rhs_c);
    pushRow("Running Border", "LHS", et.running_border?.lhs);
    pushRow("Running Border", "RHS", et.running_border?.rhs);
    pushRow("Quarter Panel",  "LHS", et.quarter_panel?.lhs);
    pushRow("Quarter Panel",  "RHS", et.quarter_panel?.rhs);
    pushRow("Dicky Door / Boot Door", "—", et.dicky_boot_door);
    pushRow("Boot Floor",             "—", et.boot_floor);
    pushRow("Apron",                  "—", et.apron);
    pushRow("Firewall",               "—", et.firewall);
    pushRow("Cowl Top",               "—", et.cowl_top);
    pushRow("Lower Cross Member",     "—", et.lower_cross_member);
    pushRow("Upper Cross Member (Bonnet Patti)", "—", et.upper_cross_member);
    pushRow("Head Light Support",     "—", et.head_light_support);
    pushRow("Radiator Support",       "—", et.radiator_support);
    pushRow("Windshield", "Front",    et.windshield?.front);
    pushRow("Windshield", "Rear",     et.windshield?.rear);
    pushRow("ORVM - Manual / Electrical", "LHS", et.orvm?.lhs);
    pushRow("ORVM - Manual / Electrical", "RHS", et.orvm?.rhs);
    pushRow("Light", "LHS Headlight", et.lights?.lhs_headlight);
    pushRow("Light", "RHS Headlight", et.lights?.rhs_headlight);
    pushRow("Light", "LHS Taillight", et.lights?.lhs_taillight);
    pushRow("Light", "RHS Taillight", et.lights?.rhs_taillight);
    pushRow("Alloy Wheel", "—", et.alloy_wheel);

    ["lhs_front", "rhs_front", "lhs_rear", "rhs_rear", "spare"].forEach((k) => {
      const tyre = et.tyres?.[k];
      if (tyre) {
        const isOk  = tyre.status !== "issue";
        const cond  = (tyre.conditions || []).filter(Boolean).join(", ") || "—";
        const tread = tyre.tread_depth_mm ? tyre.tread_depth_mm + " mm" : "—";
        exteriorRows.push([
          k === "spare"
            ? "Spare Tyre"
            : k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Tyre",
          tread,
          isOk,
          cond,
        ]);
      }
    });

    exteriorRows.push([
      "Jack Tool",
      "—",
      et.jack_tool_available === true,
      et.jack_tool_available ? "Available" : "Not Available",
    ]);
  }

  const colWidths = [52, 30, 12, CW - 52 - 30 - 12];
  y = inspectionTable(exteriorRows, ML, y, colWidths, [
    "Part",
    "Subpart",
    "OK?",
    "Work Done / Current Condition",
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  ELECTRICALS + INTERIOR
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Electricals + Interior", y);

  const ei    = car?.electricals_interior || {};
  // FIX 4 & generic isOk helper (was redefined multiple times in original)
  const isOkV = (v) =>
    v !== undefined && v !== null && v !== "issue" && v !== "na" && v !== false;

  // FIX 4: interior conditions — original had `ei.interior?.conditions` listed
  //        twice; corrected to join conditions array once.
  const intRows = [
    ["No. Of Power Windows",            "—", true,              fmt(ei.no_of_power_windows)],
    ["No. Of Airbags",                  "—", true,              fmt(ei.no_of_airbags)],
    ["Power Windows",                   "—", isOkV(ei.power_windows), "—"],
    ["Electrical",                      "—", isOkV(ei.electrical),    "—"],
    [
      "Interior",
      "—",
      isOkV(ei.interior?.status),
      (ei.interior?.conditions || []).filter(Boolean).join(", ") || "—", // FIX 4
    ],
    ["Airbag Feature",                  "—", isOkV(ei.airbag_feature), "—"],
    [
      "Music System",
      "—",
      isOkV(ei.music_system?.status),
      (ei.music_system?.conditions || []).join(", ") || "—",
    ],
    [
      "Leather Seat",
      "—",
      isOkV(ei.leather_seat?.status),
      (ei.leather_seat?.conditions || []).join(", ") || "—",
    ],
    ["Fabric Seat",                     "—", isOkV(ei.fabric_seat),    "—"],
    ["Sunroof",                         "—", isOkV(ei.sunroof),         "—"],
    ["Steering Mounted Audio Control",  "—", isOkV(ei.steering_mounted_audio_control), "—"],
    [
      "ABS",
      "—",
      isOkV(ei.abs?.status),
      ei.abs?.warning_light_glowing ? "ABS Warning Light Glowing" : "—",
    ],
    ["Rear Defogger",                   "—", isOkV(ei.rear_defogger),    "—"],
    ["Reverse Camera",                  "—", isOkV(ei.reverse_camera),   "—"],
    ["Parking Sensor",                  "—", isOkV(ei.parking_sensor),   "—"],
    ["Navigation Chip",                 "—", isOkV(ei.navigation_chip),  "—"],
  ];

  const intColW = [55, 20, 12, CW - 55 - 20 - 12];
  y = inspectionTable(intRows, ML, y, intColW, [
    "Part", "Subpart", "OK?", "Work Done / Current Condition",
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENGINE + TRANSMISSION
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Engine + Transmission", y);

  const eng = car?.engine_transmission || {};

  // FIX 5: boolStr now filters empty strings before joining, preventing
  //        trailing ", " when conditions array is empty.
  const boolStr = (obj, keys) => {
    const trueParts = keys
      .filter((k) => obj[k] === true)
      .map((k) => k.replace(/_/g, " "));
    return trueParts.join(", ") || "";
  };

  const joinEngCond = (data, boolKeys = []) => {
    const parts = [
      (data?.conditions  || []).filter(Boolean).join(", "),
      boolStr(data || {}, boolKeys),
      (data?.work_done   || []).filter(Boolean).join(", "),
    ].filter((s) => s.length > 0);
    return parts.join(", ") || "—";
  };

  const engRows = [
    [
      "Engine", "—",
      isOkV(eng.engine?.status),
      [
        joinEngCond(eng.engine),
        eng.engine?.mil_light_glowing          ? "MIL light glowing"           : "",
        eng.engine?.electrical_wiring_damaged  ? "Electrical wiring damaged"   : "",
        eng.engine?.air_filter_box_damaged     ? "Air filter box damaged"      : "",
      ].filter(Boolean).join(", ") || "—",
    ],
    [
      "Battery", "—",
      isOkV(eng.battery?.status),
      eng.battery?.acid_leakage ? "Acid leakage" : "—",
    ],
    ["Engine Oil Level Dipstik", "—", true, "—"],
    [
      "Engine Oil", "—",
      isOkV(eng.engine_oil?.status),
      // FIX 5: no more trailing comma
      joinEngCond(eng.engine_oil, ["leakage_from_tappet_cover"]),
    ],
    [
      "Coolant", "—",
      isOkV(eng.coolant?.status),
      [eng.coolant?.dirty ? "Dirty" : "", eng.coolant?.level_low ? "Level Low" : ""]
        .filter(Boolean).join(", ") || "—",
    ],
    [
      "Engine Mounting", "—",
      isOkV(eng.engine_mounting?.status),
      eng.engine_mounting?.excess_vibration ? "Excess Vibration" : "—",
    ],
    [
      "Engine Sound", "—",
      isOkV(eng.engine_sound?.status),
      eng.engine_sound?.notes || "—",
    ],
    [
      "Exhaust Smoke", "—",
      isOkV(eng.exhaust_smoke?.status),
      eng.exhaust_smoke?.silencer_assembly_damaged ? "Silencer assembly damaged" : "—",
    ],
    [
      "Clutch", "—",
      isOkV(eng.clutch?.status),
      joinEngCond(eng.clutch, ["bearing_noise", "hard", "burning_smell"]),
    ],
    [
      "Gear Shifting", "—",
      isOkV(eng.gear_shifting?.status),
      joinEngCond(eng.gear_shifting, [
        "gearbox_oil_leakage", "hard", "front_drive_axle_noise", "not_engaging",
      ]),
    ],
    [
      "Turbo Charger", "—",
      isOkV(eng.turbo_charger?.status),
      eng.turbo_charger?.whistling_noise ? "Turbocharger whistling noise" : "—",
    ],
    [
      "Fuel Injector", "—",
      isOkV(eng.fuel_injector?.status),
      eng.fuel_injector?.noise ? "Fuel Injector noise" : "—",
    ],
  ];

  const engColW = [55, 20, 12, CW - 55 - 20 - 12];
  y = inspectionTable(engRows, ML, y, engColW, [
    "Part", "Subpart", "OK?", "Work Done / Current Condition",
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEERING / SUSPENSION + BRAKES
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Steering/Suspension + Brakes", y);

  const ssb = car?.steering_suspension_brakes || {};
  const ssbRows = [
    [
      "Steering", "—",
      isOkV(ssb.steering?.status),
      [
        ssb.steering?.hard           ? "Hard"           : "",
        ssb.steering?.abnormal_noise ? "Abnormal Noise" : "",
      ].filter(Boolean).join(", ") || "—",
    ],
    [
      "Suspension", "—",
      isOkV(ssb.suspension?.status),
      ssb.suspension?.abnormal_noise ? "Abnormal Noise" : "—",
    ],
    [
      "Brake", "—",
      isOkV(ssb.brake?.status),
      ssb.brake?.noisy ? "Noisy" : "—",
    ],
  ];
  const ssbColW = [55, 20, 12, CW - 55 - 20 - 12];
  y = inspectionTable(ssbRows, ML, y, ssbColW, [
    "Part", "Subpart", "OK?", "Work Done / Current Condition",
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const allComments = [];
  if (et?.comments)   allComments.push(["Exterior + Tyres",                 et.comments]);
  if (eng.comments)   allComments.push(["Engine + Transmission",            eng.comments]);
  if (ssb.comments)   allComments.push(["Steering/Suspension + Brakes",     ssb.comments]);
  if (ei.comments)    allComments.push(["Electricals + Interior",           ei.comments]);
  if (eng.towing_recommended)
    allComments.push(["Engine + Transmission",
      "Car in working condition but towing suggested to avoid damage to engine"]);

  if (allComments.length > 0) {
    if (y > PH - 50) { y = addPage(); } else { y += 6; }
    y = sectionHeading("Comments", y);
    allComments.forEach(([section, comment]) => {
      if (y > PH - 20) { y = addPage(); }
      setT(GRAY6); font("bold", 7.5);
      txt(section, ML + 2, y + 4);
      y += 7;
      setT(GRAY5); font("normal", 7);
      const lines = doc.splitTextToSize(comment, CW - 4);
      lines.forEach((line) => {
        if (y > PH - 12) { y = addPage(); }
        txt("- " + line, ML + 4, y + 3);
        y += 5.5;
      });
      y += 3;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHOTO PAGES
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Collecting photos…");

  const exteriorImgs = collectExteriorImages(car);
  const engineImgs   = collectEngineImages(car);
  const interiorImgs = collectInteriorImages(car);
  const allImgsFlat  = [...exteriorImgs, ...engineImgs, ...interiorImgs];

  onProgress?.(`Fetching ${allImgsFlat.length} image(s)…`);

  const imgDataMap = {};
  await Promise.all(
    allImgsFlat.map(async (img) => {
      if (img.url && !imgDataMap[img.url]) {
        imgDataMap[img.url] = await fetchImageAsBase64(img.url);
      }
    })
  );

  // FIX 3: photoPageBreak returns y AFTER the sectionHeading is rendered,
  //        not a hardcoded offset, so images don't overlap the heading text.
  const makePhotoPageBreak = (sectionLabel) => () => {
    const ny = addPage();
    return sectionHeading(sectionLabel, ny); // returns ny + 11
  };

  const extWithData = exteriorImgs.filter((i) => imgDataMap[i.url]);
  if (extWithData.length > 0) {
    onProgress?.("Adding exterior photos…");
    y = addPage();
    y = sectionHeading("Exterior + Tyres", y);
    y = photoGrid(extWithData, imgDataMap, ML, y, makePhotoPageBreak("Exterior + Tyres"));
  }

  const intWithData = interiorImgs.filter((i) => imgDataMap[i.url]);
  if (intWithData.length > 0) {
    onProgress?.("Adding interior photos…");
    y = addPage();
    y = sectionHeading("Electricals + Interior", y);
    y = photoGrid(intWithData, imgDataMap, ML, y, makePhotoPageBreak("Electricals + Interior"));
  }

  const engWithData = engineImgs.filter((i) => imgDataMap[i.url]);
  if (engWithData.length > 0) {
    onProgress?.("Adding engine photos…");
    if (intWithData.length === 0 || y > PH - 60) {
      y = addPage();
      y = sectionHeading("Engine + Transmission", y);
    } else {
      y += 6;
      y = sectionHeading("Engine + Transmission", y);
    }
    y = photoGrid(engWithData, imgDataMap, ML, y, makePhotoPageBreak("Engine + Transmission"));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SAVE
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Saving PDF…");
  const regNo =
    cd.registration_number?.replace(/[^a-zA-Z0-9]/g, "") ||
    enq?.enquiryId ||
    "InspectionReport";
  const fileName = `Inspection_${regNo}_${Date.now()}.pdf`;
  doc.save(fileName);
}

// FIX 1: default export so `import generateInspectionPDF from '../generateInspectionPDF'` works.
export default generateInspectionPDF;