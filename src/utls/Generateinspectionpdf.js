
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

  addImgs(et.bumper?.front?.images,         "Bumper - Front");
  addImgs(et.bumper?.rear?.images,          "Bumper - Rear");
  addImgs(et.bonnet_hood?.images,           "Bonnet/Hood");
  addImgs(et.roof?.images,                  "Roof");
  addImgs(et.fender?.lhs?.images,           "Fender - LHS");
  addImgs(et.fender?.rhs?.images,           "Fender - RHS");
  addImgs(et.door?.lhs_front?.images,       "Door - LHS Front");
  addImgs(et.door?.lhs_rear?.images,        "Door - LHS Rear");
  addImgs(et.door?.rhs_front?.images,       "Door - RHS Front");
  addImgs(et.door?.rhs_rear?.images,        "Door - RHS Rear");
  addImgs(et.pillar?.lhs_a?.images,         "Pillar - LHS A");
  addImgs(et.pillar?.lhs_b?.images,         "Pillar - LHS B");
  addImgs(et.pillar?.lhs_c?.images,         "Pillar - LHS C");
  addImgs(et.pillar?.rhs_a?.images,         "Pillar - RHS A");
  addImgs(et.pillar?.rhs_b?.images,         "Pillar - RHS B");
  addImgs(et.pillar?.rhs_c?.images,         "Pillar - RHS C");
  addImgs(et.running_border?.lhs?.images,   "Running Border - LHS");
  addImgs(et.running_border?.rhs?.images,   "Running Border - RHS");
  addImgs(et.quarter_panel?.lhs?.images,    "Quarter Panel - LHS");
  addImgs(et.quarter_panel?.rhs?.images,    "Quarter Panel - RHS");
  addImgs(et.dicky_boot_door?.images,       "Dicky Door / Boot Door");
  addImgs(et.boot_floor?.images,            "Boot Floor");
  addImgs(et.apron?.images,                 "Apron");
  addImgs(et.firewall?.images,              "Firewall");
  addImgs(et.cowl_top?.images,              "Cowl Top");
  addImgs(et.lower_cross_member?.images,    "Lower Cross Member");
  addImgs(et.upper_cross_member?.images,    "Upper Cross Member (Bonnet Patti)");
  addImgs(et.head_light_support?.images,    "Head Light Support");
  addImgs(et.radiator_support?.images,      "Radiator Support");
  addImgs(et.windshield?.front?.images,     "Windshield - Front");
  addImgs(et.windshield?.rear?.images,      "Windshield - Rear");
  addImgs(et.orvm?.lhs?.images,             "ORVM - LHS");
  addImgs(et.orvm?.rhs?.images,             "ORVM - RHS");
  addImgs(et.lights?.lhs_headlight?.images, "Light - LHS Headlight");
  addImgs(et.lights?.rhs_headlight?.images, "Light - RHS Headlight");
  addImgs(et.lights?.lhs_taillight?.images, "Light - LHS Taillight");
  addImgs(et.lights?.rhs_taillight?.images, "Light - RHS Taillight");
  addImgs(et.alloy_wheel?.images,           "Alloy Wheel");
  addImgs(et.tyres?.lhs_front?.images,      "LHS Front Tyre");
  addImgs(et.tyres?.rhs_front?.images,      "RHS Front Tyre");
  addImgs(et.tyres?.lhs_rear?.images,       "LHS Rear Tyre");
  addImgs(et.tyres?.rhs_rear?.images,       "RHS Rear Tyre");
  addImgs(et.tyres?.spare?.images,          "Spare Tyre");
  return images;
}

// ─── Collect engine images ─────────────────────────────────────────────────────
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

// ─── Collect interior images ───────────────────────────────────────────────────
function collectInteriorImages(car) {
  const images = [];
  const ei = car?.electricals_interior;
  if (!ei) return images;
  ei.interior?.images?.forEach((img) =>
    images.push({ url: img.url, caption: img.caption || img.part || "Interior" })
  );
  ei.images?.forEach((img) => {
    const partLabel = img.part
      ? img.part.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Interior";
    images.push({ url: img.url, caption: img.caption || partLabel });
  });
  return images;
}

// ─── Collect steering images ───────────────────────────────────────────────────
function collectSteeringImages(car) {
  const images = [];
  const ssb = car?.steering_suspension_brakes;
  if (!ssb) return images;
  ssb.images?.forEach((img) =>
    images.push({
      url: img.url,
      caption: img.caption || img.part || "Steering/Suspension/Brakes",
    })
  );
  return images;
}

// ─── Build damage map for schematic ───────────────────────────────────────────
function buildDamagePoints(car) {
  const et = car?.exterior_tyres || {};
  const isIssue = (obj) => obj?.status === "issue";

  return [
    { num: 1,  label: "Front Bumper",      x: 50, y: 5,  issue: isIssue(et.bumper?.front) },
    { num: 2,  label: "Rear Bumper",       x: 50, y: 95, issue: isIssue(et.bumper?.rear) },
    { num: 3,  label: "LHS Headlight",     x: 28, y: 9,  issue: isIssue(et.lights?.lhs_headlight) },
    { num: 4,  label: "RHS Headlight",     x: 72, y: 9,  issue: isIssue(et.lights?.rhs_headlight) },
    { num: 5,  label: "LHS Taillight",     x: 28, y: 91, issue: isIssue(et.lights?.lhs_taillight) },
    { num: 6,  label: "RHS Taillight",     x: 72, y: 91, issue: isIssue(et.lights?.rhs_taillight) },
    { num: 7,  label: "LHS ORVM",          x: 18, y: 34, issue: isIssue(et.orvm?.lhs) },
    { num: 8,  label: "RHS ORVM",          x: 82, y: 34, issue: isIssue(et.orvm?.rhs) },
    { num: 9,  label: "LHS Fender",        x: 22, y: 20, issue: isIssue(et.fender?.lhs) },
    { num: 10, label: "RHS Fender",        x: 78, y: 20, issue: isIssue(et.fender?.rhs) },
    { num: 11, label: "LHS Front Tyre",    x: 16, y: 30, issue: et.tyres?.lhs_front?.status === "issue" },
    { num: 12, label: "RHS Front Tyre",    x: 84, y: 30, issue: et.tyres?.rhs_front?.status === "issue" },
    { num: 13, label: "LHS Rear Tyre",     x: 16, y: 70, issue: et.tyres?.lhs_rear?.status === "issue" },
    { num: 14, label: "RHS Rear Tyre",     x: 84, y: 70, issue: et.tyres?.rhs_rear?.status === "issue" },
    { num: 15, label: "LHS A Pillar",      x: 24, y: 37, issue: isIssue(et.pillar?.lhs_a) },
    { num: 16, label: "LHS B Pillar",      x: 22, y: 52, issue: isIssue(et.pillar?.lhs_b) },
    { num: 17, label: "LHS C Pillar",      x: 24, y: 65, issue: isIssue(et.pillar?.lhs_c) },
    { num: 18, label: "RHS A Pillar",      x: 76, y: 37, issue: isIssue(et.pillar?.rhs_a) },
    { num: 19, label: "RHS B Pillar",      x: 78, y: 52, issue: isIssue(et.pillar?.rhs_b) },
    { num: 20, label: "RHS C Pillar",      x: 76, y: 65, issue: isIssue(et.pillar?.rhs_c) },
    { num: 21, label: "RHS Front Door",    x: 72, y: 44, issue: isIssue(et.door?.rhs_front) },
    { num: 22, label: "RHS Rear Door",     x: 72, y: 58, issue: isIssue(et.door?.rhs_rear) },
    { num: 23, label: "LHS Front Door",    x: 28, y: 44, issue: isIssue(et.door?.lhs_front) },
    { num: 24, label: "LHS Rear Door",     x: 28, y: 58, issue: isIssue(et.door?.lhs_rear) },
    { num: 25, label: "Roof",              x: 50, y: 50, issue: isIssue(et.roof) },
    { num: 26, label: "Front Windshield",  x: 50, y: 27, issue: isIssue(et.windshield?.front) },
    { num: 27, label: "Rear Windshield",   x: 50, y: 73, issue: isIssue(et.windshield?.rear) },
    { num: 28, label: "LHS Quarter Panel", x: 25, y: 77, issue: isIssue(et.quarter_panel?.lhs) },
    { num: 29, label: "RHS Quarter Panel", x: 75, y: 77, issue: isIssue(et.quarter_panel?.rhs) },
    { num: 30, label: "Bonnet/Hood",       x: 50, y: 17, issue: isIssue(et.bonnet_hood) },
    { num: 31, label: "Dicky Door",        x: 50, y: 83, issue: isIssue(et.dicky_boot_door) },
  ];
}

// ─── isOkV ────────────────────────────────────────────────────────────────────
// FIX 1: Moved to top of module scope — was declared mid-function after first use.
// Return values:
//   true   → feature is OK / present       → renders green ✓
//   false  → feature has an issue          → renders red ✗
//   "N/A"  → feature is not applicable     → renders grey N/A (was wrongly → false before)
const isOkV = (v) => {
  if (v === undefined || v === null || v === false) return false;
  if (v === "na" || v === "NA") return "N/A";
  if (v === "issue") return false;
  return true;
};

// ─── Main function ─────────────────────────────────────────────────────────────
async function generateInspectionPDF(enq, car, onProgress) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
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
  const CW = PW - ML - MR;

  // ── Colours ──────────────────────────────────────────────────────────────────
  const ORANGE = [255, 102, 0];
  const WHITE  = [255, 255, 255];
  const DARK   = [30,  30,  30];
  const GRAY1  = [248, 248, 248];
  const GRAY2  = [241, 241, 241];
  const GRAY3  = [220, 220, 220];
  const GRAY4  = [150, 150, 150];
  const GRAY5  = [100, 100, 100];
  const GRAY6  = [60,  60,  60];
  const GREEN  = [34,  160, 60];
  const RED    = [220, 50,  50];
  const NAVY   = [28,  63,  94];

  // ── Helpers ───────────────────────────────────────────────────────────────────
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
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  // ── Page chrome ───────────────────────────────────────────────────────────────
  let pageNum = 0;
  const addPage = () => {
    if (pageNum > 0) doc.addPage();
    pageNum++;

    setF(NAVY);
    R(0, 0, PW, 16);
    setT(WHITE); font("bold", 11);
    txt("BIDNDRIVE", 5, 10.5);
    setT(220, 220, 220); font("normal", 7);
    txt("INSPECTION REPORT", PW / 2, 6.5, { align: "center" });
    const regNo = enq?.enquiryId || "—";
    font("bold", 7); setT(WHITE);
    txt(regNo.toUpperCase(), PW / 2, 12.5, { align: "center" });
    font("normal", 6.5); setT(200, 200, 200);
    txt(fmtDate(enq?.createdAt || new Date()), PW - MR, 10.5, { align: "right" });

    setF(ORANGE);
    R(0, 16, PW, 1.2);

    setF(245, 245, 245);
    R(0, PH - 8, PW, 8);
    setD(GRAY3); lw(0.2);
    doc.line(0, PH - 8, PW, PH - 8);
    setT(GRAY4); font("normal", 5.5);
    txt("BIDNDRIVE PVT. LTD.  ·  www.bidndrive.in  ·  care@bidndrive.com", PW / 2, PH - 3, { align: "center" });

    return 20;
  };

  // ── Section heading ───────────────────────────────────────────────────────────
  const sectionHeading = (label, y) => {
    setT(ORANGE); font("bold", 9);
    txt(label, ML, y + 5);
    setD(ORANGE); lw(0.6);
    doc.line(ML, y + 6.5, ML + 40, y + 6.5);
    setD(GRAY3); lw(0.2);
    doc.line(ML + 40, y + 6.5, ML + CW, y + 6.5);
    return y + 11;
  };

  // ── KV table ──────────────────────────────────────────────────────────────────
  const kvTable = (pairs, x, y, w) => {
    const ROW = 6.8;
    pairs.forEach(([label, value], i) => {
      if (i % 2 === 1) { setF(GRAY1); R(x, y, w, ROW, "F"); }
      setT(GRAY5); font("normal", 7); txt(label, x + 2, y + 4.8);
      setT(GRAY6); font("bold", 7);
      const val   = fmt(value);
      const lines = doc.splitTextToSize(val, w * 0.5);
      txt(lines[0] + (lines.length > 1 ? "…" : ""), x + w - 2, y + 4.8, { align: "right" });
      setD(GRAY3); lw(0.15);
      doc.line(x, y + ROW, x + w, y + ROW);
      y += ROW;
    });
    return y + 2;
  };

  // ── Inspection table ──────────────────────────────────────────────────────────
  // STATUS COLUMN (ci === 2) handles four cases:
  //   true      → green ✓
  //   false     → red ✗
  //   "N/A"     → grey N/A   (not applicable — never shows ✗)
  //   any string → centred plain text (e.g. tread depth "4-5 mm")
  const inspectionTable = (rows, x, y, colW, headers) => {
    let cy = y;
    const TW  = colW.reduce((a, b) => a + b, 0);
    const ROW = 6.5;

    const drawHeader = (startY) => {
      setF(50, 50, 50);
      R(x, startY, TW, 7.5);
      setT(WHITE); font("bold", 7);
      let hcx = x;
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
          if (cell === true) {
            setT(GREEN); font("bold", 7);
            txt("ok", cx + colW[ci] / 2, cy + 4.5, { align: "center" });
          } else if (cell === false) {
            setT(RED); font("bold", 7);
            txt("issue", cx + colW[ci] / 2, cy + 4.5, { align: "center" });
          } else if (cell === "N/A") {
            setT(GRAY4); font("normal", 7);
            txt("N/A", cx + colW[ci] / 2, cy + 4.5, { align: "center" });
          } else {
            setT(GRAY6); font("normal", 7);
            txt(fmt(cell), cx + colW[ci] / 2, cy + 4.5, { align: "center" });
          }
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

  // ── Photo grid ────────────────────────────────────────────────────────────────
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
        cy  = pageBreakFn();
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
      txt(capLines[0] + (capLines.length > 1 ? "…" : ""), px + IMG_W / 2, cy + IMG_H + 5, { align: "center" });

      col++;
      if (col >= COLS) { col = 0; cy += CELL_H + 4; }
    }
    if (col > 0) cy += CELL_H + 4;
    return cy;
  };

  // ── Car schematic ─────────────────────────────────────────────────────────────
  const drawCarSchematic = (x, y, w, points) => {
    const H     = 120;
    const cx    = x + w / 2;
    const carW  = w * 0.38;
    const carH  = H * 0.78;
    const carX  = cx - carW / 2;
    const carY  = y + (H - carH) / 2;

    setD(GRAY4); lw(0.4); setF(GRAY1);
    doc.roundedRect(carX, carY, carW, carH, 6, 6, "FD");

    const wsTop = carY + carH * 0.14;
    const wsBot = carY + carH * 0.28;
    const wsPad = carW * 0.08;
    setD(180, 200, 220); setF(210, 230, 245); lw(0.3);
    doc.rect(carX + wsPad, wsTop, carW - wsPad * 2, wsBot - wsTop, "FD");

    const wrTop = carY + carH * 0.72;
    const wrBot = carY + carH * 0.86;
    doc.rect(carX + wsPad, wrTop, carW - wsPad * 2, wrBot - wrTop, "FD");

    const roofPad = carW * 0.06;
    setD(GRAY3); setF(GRAY2); lw(0.25);
    doc.rect(carX + roofPad, wsBot, carW - roofPad * 2, wrTop - wsBot, "FD");

    const doorMid = carY + carH * 0.5;
    setD(GRAY3); lw(0.2);
    doc.line(carX + 2, doorMid, carX + carW - 2, doorMid);

    const archR   = carW * 0.16;
    const archLX  = carX - archR * 0.5;
    const archRX  = carX + carW - archR * 0.5;
    const archFY  = carY + carH * 0.24;
    const archReY = carY + carH * 0.74;
    setD(GRAY4); setF(GRAY3); lw(0.3);
    [[archLX, archFY], [archRX, archFY], [archLX, archReY], [archRX, archReY]].forEach(([ax, ay]) => {
      doc.circle(ax + archR / 2, ay + archR / 2, archR / 2, "FD");
    });

    const hlW = carW * 0.28;
    const hlH = carH * 0.04;
    setF(255, 240, 180); setD(200, 180, 50); lw(0.2);
    doc.rect(carX + carW * 0.1,  carY + carH * 0.02, hlW, hlH, "FD");
    doc.rect(carX + carW * 0.62, carY + carH * 0.02, hlW, hlH, "FD");

    setF(255, 80, 80); setD(180, 30, 30);
    doc.rect(carX + carW * 0.1,  carY + carH * 0.94, hlW, hlH, "FD");
    doc.rect(carX + carW * 0.62, carY + carH * 0.94, hlW, hlH, "FD");

    const MRAD    = 3.0;
    const FONT_SZ = 5.5;

    points.forEach((p) => {
      const mx = x + (p.x / 100) * w;
      const my = y + (p.y / 100) * H;
      setF(p.issue ? ORANGE : [200, 220, 200]);
      setD(p.issue ? [200, 70, 0] : [100, 160, 100]);
      lw(0.3);
      doc.circle(mx, my, MRAD, "FD");
      setT(p.issue ? WHITE : [30, 100, 30]);
      font("bold", FONT_SZ);
      txt(String(p.num), mx, my + 1.8, { align: "center" });
    });

    const labelFont = 5;
    const leftPts   = points.filter(p => p.x <= 35).sort((a, b) => a.y - b.y);
    const rightPts  = points.filter(p => p.x >= 65).sort((a, b) => a.y - b.y);

    leftPts.forEach((p) => {
      const my = y + (p.y / 100) * H;
      const mx = x + (p.x / 100) * w;
      setD(GRAY4); lw(0.15);
      doc.line(mx - MRAD, my, x + 2, my);
      setT(p.issue ? [200, 70, 0] : GRAY5);
      font(p.issue ? "bold" : "normal", labelFont);
      txt(p.label, x + 1, my + 1.5, { align: "left" });
    });

    rightPts.forEach((p) => {
      const my = y + (p.y / 100) * H;
      const mx = x + (p.x / 100) * w;
      setD(GRAY4); lw(0.15);
      doc.line(mx + MRAD, my, x + w - 2, my);
      setT(p.issue ? [200, 70, 0] : GRAY5);
      font(p.issue ? "bold" : "normal", labelFont);
      txt(p.label, x + w - 1, my + 1.5, { align: "right" });
    });

    points.filter(p => p.y < 20).forEach((p) => {
      const mx = x + (p.x / 100) * w;
      const my = y + (p.y / 100) * H;
      setT(p.issue ? [200, 70, 0] : GRAY5);
      font(p.issue ? "bold" : "normal", labelFont);
      txt(p.label, mx, my - MRAD - 1, { align: "center" });
    });

    points.filter(p => p.y > 80).forEach((p) => {
      const mx = x + (p.x / 100) * w;
      const my = y + (p.y / 100) * H;
      setT(p.issue ? [200, 70, 0] : GRAY5);
      font(p.issue ? "bold" : "normal", labelFont);
      txt(p.label, mx, my + MRAD + 4, { align: "center" });
    });

    return y + H + 4;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — CAR OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Building cover page…");
  let y = addPage();

  const cd = car?.car_details || {};

  setT(DARK); font("bold", 14);
  const carTitle = `${cd.make || enq?.carDetails?.car_details?.make || "Vehicle"} ${cd.model || enq?.carDetails?.car_details?.model || ""}`.trim();
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

  setF(GRAY2); setD(GRAY3); lw(0.3);
  R(LEFT_X, y, LEFT_W, 52, "FD");
  let coverImgPlaced = false;
  const attachments     = enq?.attachments || enq?.data?.attachments || [];
  const coverAttachment = attachments[0];
  if (coverAttachment?.url) {
    try {
      onProgress?.("Fetching cover image…");
      const coverData = await fetchImageAsBase64(coverAttachment.url);
      if (coverData) coverImgPlaced = addImg(coverData, LEFT_X + 1, y + 1, LEFT_W - 2, 50);
    } catch (err) { console.error("Cover image error:", err); }
  }
  if (!coverImgPlaced) {
    setT(GRAY4); font("normal", 7);
    txt("Vehicle Photo", LEFT_X + LEFT_W / 2, y + 27, { align: "center" });
  }

  const qPairs = [
    ["Year Of Manufacturing",    cd.year_of_manufacturing],
    ["No. Of Owner(s)",          cd.no_of_owners],
    ["Duplicate Key",            cd.duplicate_key ? "Yes" : "No"],
    ["KM",                       cd.odometer_reading != null ? Number(cd.odometer_reading).toLocaleString("en-IN") : "—"],
    ["Fuel Type",                cd.fuel_type],
    ["Reg. State",               cd.reg_state],
    ["Reg. City",                cd.reg_city],
    ["Insurance Type",           cd.insurance_type],
    ["RC Availability",          cd.rc_availability],
    ["Road Tax Paid",            cd.road_tax_paid],
    ["Road Tax Date (Validity)", cd.road_tax_validity ? fmtDate(cd.road_tax_validity) : "—"],
    ["CNG/LPG Fitment In RC",    cd.cng_lpg_fitment_in_rc ? "Yes" : "—"],
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

  y = sectionHeading("Car Details", y + 3);
  const detailPairs = [
    ["RTO",                      cd.rto],
    ["City",                     cd.reg_city],
    ["RTO NOC Issued",           cd.rto_noc_issued ? "Yes" : "No"],
    ["Inspection At",            cd.inspection_at],
    ["Under Hypothecation",      cd.under_hypothecation ? "Yes" : "No"],
    ["Branch",                   cd.branch],
    ["Chassis Number Embossing", cd.chassis_embossing],
    ["To Be Scrapped",           cd.to_be_scrapped ? "Yes" : "No"],
    ["Manufacturing Month",      cd.manufacturing_month],
    ["Registration Year",        cd.registration_year],
    ["Registration Month",       cd.registration_month],
    ["Fitness Upto",             fmtDate(cd.fitness_upto)],
    ["RC Condition",             cd.rc_condition],
    ["Mismatch In RC",           cd.mismatch_in_rc ? "Yes" : "No Mismatch"],
  ];
  const half  = Math.ceil(detailPairs.length / 2);
  const colW2 = (CW - 4) / 2;
  const yLeft  = kvTable(detailPairs.slice(0, half),  ML,             y, colW2);
  const yRight = kvTable(detailPairs.slice(half),     ML + colW2 + 4, y, colW2);
  y = Math.max(yLeft, yRight) + 3;

  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 2 — SUMMARY (Schematic + Exterior Table)
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Building inspection summary…");
  y = addPage();
  y = sectionHeading("Summary", y);

  const damagePoints = buildDamagePoints(car);
  y = drawCarSchematic(ML, y, CW, damagePoints);

  y = sectionHeading("Exterior + Tyres", y);

  const exteriorRows = [];
  const et = car?.exterior_tyres;

  // FIX 2: pushRow now maps "na"/"NA" status → "N/A" string so the
  // inspectionTable status cell renders grey N/A instead of red ✗.
  const pushRow = (part, subpart, data) => {
    if (!data) return;
    const status = data.status;
    let statusCell;
    if (status === "na" || status === "NA") {
      statusCell = "N/A";
    } else {
      statusCell = status !== "issue";
    }
    const conditions = [...(data.conditions || []), ...(data.work_done || [])].filter(Boolean).join(", ");
    exteriorRows.push([part, subpart, statusCell, conditions || "—"]);
  };

  if (et) {
    pushRow("Bumper",              "Front",          et.bumper?.front);
    pushRow("Bumper",              "Rear",           et.bumper?.rear);
    pushRow("Bonnet/Hood",         "—",              et.bonnet_hood);
    pushRow("Roof",                "—",              et.roof);
    pushRow("Fender",              "LHS",            et.fender?.lhs);
    pushRow("Fender",              "RHS",            et.fender?.rhs);
    pushRow("Door",                "LHS Front",      et.door?.lhs_front);
    pushRow("Door",                "LHS Rear",       et.door?.lhs_rear);
    pushRow("Door",                "RHS Front",      et.door?.rhs_front);
    pushRow("Door",                "RHS Rear",       et.door?.rhs_rear);
    pushRow("Pillar",              "LHS A",          et.pillar?.lhs_a);
    pushRow("Pillar",              "LHS B",          et.pillar?.lhs_b);
    pushRow("Pillar",              "LHS C",          et.pillar?.lhs_c);
    pushRow("Pillar",              "RHS A",          et.pillar?.rhs_a);
    pushRow("Pillar",              "RHS B",          et.pillar?.rhs_b);
    pushRow("Pillar",              "RHS C",          et.pillar?.rhs_c);
    pushRow("Running Border",      "LHS",            et.running_border?.lhs);
    pushRow("Running Border",      "RHS",            et.running_border?.rhs);
    pushRow("Quarter Panel",       "LHS",            et.quarter_panel?.lhs);
    pushRow("Quarter Panel",       "RHS",            et.quarter_panel?.rhs);
    pushRow("Dicky Door / Boot Door", "—",           et.dicky_boot_door);
    pushRow("Boot Floor",          "—",              et.boot_floor);
    pushRow("Apron",               "—",              et.apron);
    pushRow("Firewall",            "—",              et.firewall);
    pushRow("Cowl Top",            "—",              et.cowl_top);
    pushRow("Lower Cross Member",  "—",              et.lower_cross_member);
    pushRow("Upper Cross Member (Bonnet Patti)", "—", et.upper_cross_member);
    pushRow("Head Light Support",  "—",              et.head_light_support);
    pushRow("Radiator Support",    "—",              et.radiator_support);
    pushRow("Windshield",          "Front",          et.windshield?.front);
    pushRow("Windshield",          "Rear",           et.windshield?.rear);
    pushRow("ORVM - Manual / Electrical", "LHS",     et.orvm?.lhs);
    pushRow("ORVM - Manual / Electrical", "RHS",     et.orvm?.rhs);
    pushRow("Light",               "LHS Headlight",  et.lights?.lhs_headlight);
    pushRow("Light",               "RHS Headlight",  et.lights?.rhs_headlight);
    pushRow("Light",               "LHS Taillight",  et.lights?.lhs_taillight);
    pushRow("Light",               "RHS Taillight",  et.lights?.rhs_taillight);
    pushRow("Alloy Wheel",         "—",              et.alloy_wheel);

    ["lhs_front", "rhs_front", "lhs_rear", "rhs_rear", "spare"].forEach((k) => {
      const tyre = et.tyres?.[k];
      if (!tyre) return;
      const label = k === "spare"
        ? "Spare Tyre"
        : k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Tyre";
      const tread = tyre.tread_depth_mm ? `${tyre.tread_depth_mm} mm` : "—";
      const cond  = (tyre.conditions || []).filter(Boolean).join(", ") || "—";
      exteriorRows.push([label, "—", tread, cond]);
    });

    exteriorRows.push([
      "Jack Tool", "—",
      et.jack_tool_available === true,
      et.jack_tool_available ? "Available" : "Not Available",
    ]);
  }

  const extColW = [52, 30, 18, CW - 52 - 30 - 18];
  y = inspectionTable(exteriorRows, ML, y, extColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  ELECTRICALS + INTERIOR
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Electricals + Interior", y);

  const ei = car?.electricals_interior || {};

  const intRows = [
    ["No. Of Power Windows",           "—", fmt(ei.no_of_power_windows),                   "—"],
    ["No. Of Airbags",                 "—", fmt(ei.no_of_airbags),                          "—"],
    ["Power Windows",                  "—", isOkV(ei.power_windows),                        "—"],
    ["Electrical",                     "—", isOkV(ei.electrical),                           "—"],
    ["Interior",                       "—", isOkV(ei.interior?.status),
      (ei.interior?.conditions || []).filter(Boolean).join(", ") || "—"],
    ["Airbag Feature",                 "—", isOkV(ei.airbag_feature),                       "—"],
    ["Music System",                   "—", isOkV(ei.music_system?.status),
      (ei.music_system?.conditions || []).join(", ") || "—"],
    ["Leather Seat",                   "—", isOkV(ei.leather_seat?.status),
      (ei.leather_seat?.conditions || []).join(", ") || "—"],
    ["Fabric Seat",                    "—", isOkV(ei.fabric_seat),                          "—"],
    ["Sunroof",                        "—", isOkV(ei.sunroof),                               "—"],
    ["Steering Mounted Audio Control", "—", isOkV(ei.steering_mounted_audio_control),        "—"],
    ["ABS",                            "—", isOkV(ei.abs?.status),
      ei.abs?.warning_light_glowing ? "ABS Warning Light Glowing" : "—"],
    ["Rear Defogger",                  "—", isOkV(ei.rear_defogger),                         "—"],
    ["Reverse Camera",                 "—", isOkV(ei.reverse_camera),                        "—"],
    ["Parking Sensor",                 "—", isOkV(ei.parking_sensor),                        "—"],
    ["Navigation Chip",                "—", isOkV(ei.navigation_chip),                       "—"],
  ];
  const intColW = [55, 20, 18, CW - 55 - 20 - 18];
  y = inspectionTable(intRows, ML, y, intColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENGINE + TRANSMISSION
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Engine + Transmission", y);

  const eng = car?.engine_transmission || {};

  const boolStr = (obj, keys) =>
    keys.filter((k) => obj[k] === true).map((k) => k.replace(/_/g, " ")).join(", ");

  const joinEngCond = (data, boolKeys = []) =>
    [
      (data?.conditions  || []).filter(Boolean).join(", "),
      boolStr(data || {}, boolKeys),
      (data?.work_done   || []).filter(Boolean).join(", "),
    ].filter((s) => s.length > 0).join(", ") || "—";

  const engRows = [
    ["Engine", "—", isOkV(eng.engine?.status),
      [joinEngCond(eng.engine),
       eng.engine?.mil_light_glowing         ? "MIL light glowing"         : "",
       eng.engine?.electrical_wiring_damaged ? "Electrical wiring damaged" : "",
       eng.engine?.air_filter_box_damaged    ? "Air filter box damaged"    : ""].filter(Boolean).join(", ") || "—"],
    ["Battery",             "—", isOkV(eng.battery?.status),         eng.battery?.acid_leakage ? "Acid leakage" : "—"],
    ["Engine Oil Level Dipstik", "—", true,                          "—"],
    ["Engine Oil",          "—", isOkV(eng.engine_oil?.status),      joinEngCond(eng.engine_oil, ["leakage_from_tappet_cover"])],
    ["Coolant",             "—", isOkV(eng.coolant?.status),
      [eng.coolant?.dirty ? "Dirty" : "", eng.coolant?.level_low ? "Level Low" : ""].filter(Boolean).join(", ") || "—"],
    ["Engine Mounting",     "—", isOkV(eng.engine_mounting?.status), eng.engine_mounting?.excess_vibration ? "Excess Vibration" : "—"],
    ["Engine Sound",        "—", isOkV(eng.engine_sound?.status),    eng.engine_sound?.notes || "—"],
    ["Exhaust Smoke",       "—", isOkV(eng.exhaust_smoke?.status),   eng.exhaust_smoke?.silencer_assembly_damaged ? "Silencer assembly damaged" : "—"],
    ["Clutch",              "—", isOkV(eng.clutch?.status),          joinEngCond(eng.clutch, ["bearing_noise", "hard", "burning_smell"])],
    ["Gear Shifting",       "—", isOkV(eng.gear_shifting?.status),   joinEngCond(eng.gear_shifting, ["gearbox_oil_leakage", "hard", "front_drive_axle_noise", "not_engaging"])],
    ["Turbo Charger",       "—", isOkV(eng.turbo_charger?.status),   eng.turbo_charger?.whistling_noise ? "Turbocharger whistling noise" : "—"],
    ["Fuel Injector",       "—", isOkV(eng.fuel_injector?.status),   eng.fuel_injector?.noise ? "Fuel Injector noise" : "—"],
  ];
  const engColW = [55, 20, 18, CW - 55 - 20 - 18];
  y = inspectionTable(engRows, ML, y, engColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEERING / SUSPENSION + BRAKES
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Steering/Suspension + Brakes", y);

  const ssb     = car?.steering_suspension_brakes || {};
  const ssbRows = [
    ["Steering",   "—", isOkV(ssb.steering?.status),
      [ssb.steering?.hard ? "Hard" : "", ssb.steering?.abnormal_noise ? "Abnormal Noise" : ""].filter(Boolean).join(", ") || "—"],
    ["Suspension", "—", isOkV(ssb.suspension?.status), ssb.suspension?.abnormal_noise ? "Abnormal Noise" : "—"],
    ["Brake",      "—", isOkV(ssb.brake?.status),      ssb.brake?.noisy ? "Noisy" : "—"],
  ];
  const ssbColW = [55, 20, 18, CW - 55 - 20 - 18];
  y = inspectionTable(ssbRows, ML, y, ssbColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  AIR CONDITIONING
  // ═══════════════════════════════════════════════════════════════════════════
  const ac     = car?.air_conditioning || {};
  const hasAC  = Object.keys(ac).length > 0;
  if (hasAC) {
    if (y > PH - 50) { y = addPage(); } else { y += 6; }
    y = sectionHeading("Air Conditioning", y);
    const acRows = [
      ["AC Cooling",         "—", isOkV(ac.ac_cooling?.status),      (ac.ac_cooling?.conditions || []).join(", ") || "—"],
      ["Heater",             "—", isOkV(ac.heater?.status),          (ac.heater?.conditions || []).join(", ") || "—"],
      ["Climate Control AC", "—", isOkV(ac.climate_control?.status), "—"],
    ];
    const acColW = [55, 20, 18, CW - 55 - 20 - 18];
    y = inspectionTable(acRows, ML, y, acColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const allComments = [];
  if (et?.comments)  allComments.push(["Exterior + Tyres",             et.comments]);
  if (eng.comments)  allComments.push(["Engine + Transmission",        eng.comments]);
  if (ssb.comments)  allComments.push(["Steering/Suspension + Brakes", ssb.comments]);
  if (ei.comments)   allComments.push(["Electricals + Interior",       ei.comments]);
  if (ac?.comments)  allComments.push(["Air Conditioning",             ac.comments]);
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
  const steeringImgs = collectSteeringImages(car);
  const allImgsFlat  = [...exteriorImgs, ...engineImgs, ...interiorImgs, ...steeringImgs];

  onProgress?.(`Fetching ${allImgsFlat.length} image(s)…`);

  const imgDataMap = {};
  await Promise.all(
    allImgsFlat.map(async (img) => {
      if (img.url && !imgDataMap[img.url]) {
        imgDataMap[img.url] = await fetchImageAsBase64(img.url);
      }
    })
  );

  const makePhotoPageBreak = (sectionLabel) => () => {
    const ny = addPage();
    return sectionHeading(sectionLabel, ny);
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

  const ssbWithData = steeringImgs.filter((i) => imgDataMap[i.url]);
  if (ssbWithData.length > 0) {
    onProgress?.("Adding steering/suspension photos…");
    if (y > PH - 60) {
      y = addPage();
      y = sectionHeading("Steering / Suspension + Brakes", y);
    } else {
      y += 6;
      y = sectionHeading("Steering / Suspension + Brakes", y);
    }
    y = photoGrid(ssbWithData, imgDataMap, ML, y, makePhotoPageBreak("Steering / Suspension + Brakes"));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SAVE
  // ═══════════════════════════════════════════════════════════════════════════
  onProgress?.("Saving PDF…");
  const regNo = enq?.enquiryId || "InspectionReport";
  doc.save(`${regNo}.pdf`);
}

export default generateInspectionPDF;