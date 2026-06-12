async function fetchImageAsBase64(url) {
  try {
    console.log("Fetching:", url);

    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-cache"
    });

    console.log("status:", res.status);
    console.log("headers:", [...res.headers.entries()]);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const blob = await res.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("fetchImageAsBase64 error:", err);
    return null;
  }
}

// ─── Collect car detail overview images ───────────────────────────────────────
function collectCarDetailImages(car) {
  const partLabelMap = {
    front_main: "Front Main",
    front_right_side: "Front Right Side",
    front_left_side: "Front Left Side",
    left_main: "Left Main",
    rear_left_side: "Rear Left Side",
    rear_main: "Rear Main",
    right_main: "Right Main",
    rear_right_side: "Rear Right Side",
  };
  return (car?.car_details?.images || []).map((img) => ({
    url: img.url,
    caption: partLabelMap[img.part] ||
      img.part?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
      img.caption ||
      "Car Detail",
  }));
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
  addImgs(et.upper_cross_member?.images, "Upper Cross Member (Bonnet Patti)");
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
    { num: 1, label: "Front Bumper", x: 50, y: 5, issue: isIssue(et.bumper?.front) },
    { num: 2, label: "Rear Bumper", x: 50, y: 95, issue: isIssue(et.bumper?.rear) },
    { num: 3, label: "LHS Headlight", x: 28, y: 9, issue: isIssue(et.lights?.lhs_headlight) },
    { num: 4, label: "RHS Headlight", x: 72, y: 9, issue: isIssue(et.lights?.rhs_headlight) },
    { num: 5, label: "LHS Taillight", x: 28, y: 91, issue: isIssue(et.lights?.lhs_taillight) },
    { num: 6, label: "RHS Taillight", x: 72, y: 91, issue: isIssue(et.lights?.rhs_taillight) },
    { num: 7, label: "LHS ORVM", x: 18, y: 34, issue: isIssue(et.orvm?.lhs) },
    { num: 8, label: "RHS ORVM", x: 82, y: 34, issue: isIssue(et.orvm?.rhs) },
    { num: 9, label: "LHS Fender", x: 22, y: 20, issue: isIssue(et.fender?.lhs) },
    { num: 10, label: "RHS Fender", x: 78, y: 20, issue: isIssue(et.fender?.rhs) },
    { num: 11, label: "LHS Front Tyre", x: 16, y: 30, issue: et.tyres?.lhs_front?.status === "issue" },
    { num: 12, label: "RHS Front Tyre", x: 84, y: 30, issue: et.tyres?.rhs_front?.status === "issue" },
    { num: 13, label: "LHS Rear Tyre", x: 16, y: 70, issue: et.tyres?.lhs_rear?.status === "issue" },
    { num: 14, label: "RHS Rear Tyre", x: 84, y: 70, issue: et.tyres?.rhs_rear?.status === "issue" },
    { num: 15, label: "LHS A Pillar", x: 24, y: 37, issue: isIssue(et.pillar?.lhs_a) },
    { num: 16, label: "LHS B Pillar", x: 22, y: 52, issue: isIssue(et.pillar?.lhs_b) },
    { num: 17, label: "LHS C Pillar", x: 24, y: 65, issue: isIssue(et.pillar?.lhs_c) },
    { num: 18, label: "RHS A Pillar", x: 76, y: 37, issue: isIssue(et.pillar?.rhs_a) },
    { num: 19, label: "RHS B Pillar", x: 78, y: 52, issue: isIssue(et.pillar?.rhs_b) },
    { num: 20, label: "RHS C Pillar", x: 76, y: 65, issue: isIssue(et.pillar?.rhs_c) },
    { num: 21, label: "RHS Front Door", x: 72, y: 44, issue: isIssue(et.door?.rhs_front) },
    { num: 22, label: "RHS Rear Door", x: 72, y: 58, issue: isIssue(et.door?.rhs_rear) },
    { num: 23, label: "LHS Front Door", x: 28, y: 44, issue: isIssue(et.door?.lhs_front) },
    { num: 24, label: "LHS Rear Door", x: 28, y: 58, issue: isIssue(et.door?.lhs_rear) },
    { num: 25, label: "Roof", x: 50, y: 50, issue: isIssue(et.roof) },
    { num: 26, label: "Front Windshield", x: 50, y: 27, issue: isIssue(et.windshield?.front) },
    { num: 27, label: "Rear Windshield", x: 50, y: 73, issue: isIssue(et.windshield?.rear) },
    { num: 28, label: "LHS Quarter Panel", x: 25, y: 77, issue: isIssue(et.quarter_panel?.lhs) },
    { num: 29, label: "RHS Quarter Panel", x: 75, y: 77, issue: isIssue(et.quarter_panel?.rhs) },
    { num: 30, label: "Bonnet/Hood", x: 50, y: 17, issue: isIssue(et.bonnet_hood) },
    { num: 31, label: "Dicky Door", x: 50, y: 83, issue: isIssue(et.dicky_boot_door) },
  ];
}

// ─── isOkV ────────────────────────────────────────────────────────────────────
const isOkV = (v) => {
  if (v === undefined || v === null || v === "") {
    return "N/A";
  }

  return String(v)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusValue = (status) =>
  isOkV(status);

// ─── Main function ─────────────────────────────────────────────────────────────
async function generateInspectionPDF(enq, car, onProgress, mode = 'download') {
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
  const WHITE = [255, 255, 255];
  const DARK = [30, 30, 30];
  const GRAY1 = [248, 248, 248];
  const GRAY2 = [241, 241, 241];
  const GRAY3 = [220, 220, 220];
  const GRAY4 = [150, 150, 150];
  const GRAY5 = [100, 100, 100];
  const GRAY6 = [60, 60, 60];
  const GREEN = [34, 160, 60];
  const RED = [220, 50, 50];
  const NAVY = [28, 63, 94];

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const setF = (...c) => doc.setFillColor(...(c.length === 1 ? c[0] : c));
  const setT = (...c) => doc.setTextColor(...(c.length === 1 ? c[0] : c));
  const setD = (...c) => doc.setDrawColor(...(c.length === 1 ? c[0] : c));
  const lw = (w) => doc.setLineWidth(w);
  const R = (x, y, w, h, s = "F") => doc.rect(x, y, w, h, s);
  const font = (style, size) => { doc.setFont("helvetica", style); doc.setFontSize(size); };
  const txt = (text, x, y, opts = {}) => {
    const s = String(text ?? "—");
    const o = {};
    if (opts.align) o.align = opts.align;
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
  const fmt = (v) => String(v ?? "—");
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
      const val = fmt(value);
      const lines = doc.splitTextToSize(val, w * 0.5);
      txt(lines[0] + (lines.length > 1 ? "…" : ""), x + w - 2, y + 4.8, { align: "right" });
      setD(GRAY3); lw(0.15);
      doc.line(x, y + ROW, x + w, y + ROW);
      y += ROW;
    });
    return y + 2;
  };

  // ── Inspection table ──────────────────────────────────────────────────────────
  const inspectionTable = (rows, x, y, colW, headers) => {
    let cy = y;
    const TW = colW.reduce((a, b) => a + b, 0);
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
    const COLS = 2;
    const IMG_W = (CW - 4) / COLS;
    const IMG_H = IMG_W * 0.72;
    const CAP_H = 7;
    const CELL_H = IMG_H + CAP_H;
    let col = 0;
    let cy = y;

    for (const img of imgs) {
      if (cy + CELL_H > PH - 12) {
        cy = pageBreakFn();
        col = 0;
      }
      const px = x + col * (IMG_W + 4);
      setF(GRAY2); setD(GRAY3); lw(0.2);
      R(px, cy, IMG_W, IMG_H, "FD");

      const data = imgDataMap[img.url];
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
    const H = 120;
    const cx = x + w / 2;
    const carW = w * 0.38;
    const carH = H * 0.78;
    const carX = cx - carW / 2;
    const carY = y + (H - carH) / 2;

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

    const archR = carW * 0.16;
    const archLX = carX - archR * 0.5;
    const archRX = carX + carW - archR * 0.5;
    const archFY = carY + carH * 0.24;
    const archReY = carY + carH * 0.74;
    setD(GRAY4); setF(GRAY3); lw(0.3);
    [[archLX, archFY], [archRX, archFY], [archLX, archReY], [archRX, archReY]].forEach(([ax, ay]) => {
      doc.circle(ax + archR / 2, ay + archR / 2, archR / 2, "FD");
    });

    const hlW = carW * 0.28;
    const hlH = carH * 0.04;
    setF(255, 240, 180); setD(200, 180, 50); lw(0.2);
    doc.rect(carX + carW * 0.1, carY + carH * 0.02, hlW, hlH, "FD");
    doc.rect(carX + carW * 0.62, carY + carH * 0.02, hlW, hlH, "FD");

    setF(255, 80, 80); setD(180, 30, 30);
    doc.rect(carX + carW * 0.1, carY + carH * 0.94, hlW, hlH, "FD");
    doc.rect(carX + carW * 0.62, carY + carH * 0.94, hlW, hlH, "FD");

    const MRAD = 3.0;
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
    const leftPts = points.filter(p => p.x <= 35).sort((a, b) => a.y - b.y);
    const rightPts = points.filter(p => p.x >= 65).sort((a, b) => a.y - b.y);

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

  const LEFT_W = 74;
  const RIGHT_W = CW - LEFT_W - 5;
  const LEFT_X = ML;
  const RIGHT_X = ML + LEFT_W + 5;

  setF(GRAY2); setD(GRAY3); lw(0.3);
  R(LEFT_X, y, LEFT_W, 52, "FD");
  let coverImgPlaced = false;
  const carDetailImages = car?.car_details?.images || [];
  const coverImgEntry =
    carDetailImages.find((i) => i.part === "front_main") ||
    carDetailImages[0] ||
    (enq?.data?.attachments || [])[0];

  if (coverImgEntry?.url) {
    try {
      onProgress?.("Fetching cover image…");
      const coverData = await fetchImageAsBase64(coverImgEntry.url);
      if (coverData) coverImgPlaced = addImg(coverData, LEFT_X + 1, y + 1, LEFT_W - 2, 50);
    } catch (err) { console.error("Cover image error:", err); }
  }
  if (!coverImgPlaced) {
    setT(GRAY4); font("normal", 7);
    txt("Vehicle Photo", LEFT_X + LEFT_W / 2, y + 27, { align: "center" });
  }

  const qPairs = [
    ["Year Of Manufacturing", cd.year_of_manufacturing],
    ["No. Of Owner(s)", cd.no_of_owners],
    ["Duplicate Key", cd.duplicate_key ? "Yes" : "No"],
    ["KM", cd.odometer_reading != null ? Number(cd.odometer_reading).toLocaleString("en-IN") : "—"],
    ["Fuel Type", cd.fuel_type],
    ["Reg. State", cd.reg_state],
    ["Reg. City", cd.reg_city],
    ["Insurance Type", cd.insurance_type],
    ["RC Availability", cd.rc_availability],
    ["Road Tax Paid", cd.road_tax_paid],
    ["Road Tax Date (Validity)", cd.road_tax_validity ? fmtDate(cd.road_tax_validity) : "—"],
    ["CNG/LPG Fitment In RC", cd.cng_lpg_fitment_in_rc ? "Yes" : "—"],
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
    ["RTO", cd.rto],
    ["City", cd.reg_city],
    ["RTO NOC Issued", cd.rto_noc_issued ? "Yes" : "No"],
    ["Inspection At", cd.inspection_at],
    ["Under Hypothecation", cd.under_hypothecation ? "Yes" : "No"],
    ["Branch", cd.branch],
    ["Chassis Number Embossing", cd.chassis_embossing],
    ["To Be Scrapped", cd.to_be_scrapped ? "Yes" : "No"],
    ["Manufacturing Month", cd.manufacturing_month],
    ["Registration Year", cd.registration_year],
    ["Registration Month", cd.registration_month],
    ["Fitness Upto", fmtDate(cd.fitness_upto)],
    ["RC Condition", cd.rc_condition],
    ["Mismatch In RC", cd.mismatch_in_rc ? "Yes" : "No Mismatch"],
  ];
  const half = Math.ceil(detailPairs.length / 2);
  const colW2 = (CW - 4) / 2;
  const yLeft = kvTable(detailPairs.slice(0, half), ML, y, colW2);
  const yRight = kvTable(detailPairs.slice(half), ML + colW2 + 4, y, colW2);
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
    pushRow("Bumper", "Front", et.bumper?.front);
    pushRow("Bumper", "Rear", et.bumper?.rear);
    pushRow("Bonnet/Hood", "—", et.bonnet_hood);
    pushRow("Roof", "—", et.roof);
    pushRow("Fender", "LHS", et.fender?.lhs);
    pushRow("Fender", "RHS", et.fender?.rhs);
    pushRow("Door", "LHS Front", et.door?.lhs_front);
    pushRow("Door", "LHS Rear", et.door?.lhs_rear);
    pushRow("Door", "RHS Front", et.door?.rhs_front);
    pushRow("Door", "RHS Rear", et.door?.rhs_rear);
    pushRow("Pillar", "LHS A", et.pillar?.lhs_a);
    pushRow("Pillar", "LHS B", et.pillar?.lhs_b);
    pushRow("Pillar", "LHS C", et.pillar?.lhs_c);
    pushRow("Pillar", "RHS A", et.pillar?.rhs_a);
    pushRow("Pillar", "RHS B", et.pillar?.rhs_b);
    pushRow("Pillar", "RHS C", et.pillar?.rhs_c);
    pushRow("Running Border", "LHS", et.running_border?.lhs);
    pushRow("Running Border", "RHS", et.running_border?.rhs);
    pushRow("Quarter Panel", "LHS", et.quarter_panel?.lhs);
    pushRow("Quarter Panel", "RHS", et.quarter_panel?.rhs);
    pushRow("Dicky Door / Boot Door", "—", et.dicky_boot_door);
    pushRow("Boot Floor", "—", et.boot_floor);
    pushRow("Apron", "—", et.apron);
    pushRow("Firewall", "—", et.firewall);
    pushRow("Cowl Top", "—", et.cowl_top);
    pushRow("Lower Cross Member", "—", et.lower_cross_member);
    pushRow("Upper Cross Member (Bonnet Patti)", "—", et.upper_cross_member);
    pushRow("Head Light Support", "—", et.head_light_support);
    pushRow("Radiator Support", "—", et.radiator_support);
    pushRow("Windshield", "Front", et.windshield?.front);
    pushRow("Windshield", "Rear", et.windshield?.rear);
    pushRow("ORVM - Manual / Electrical", "LHS", et.orvm?.lhs);
    pushRow("ORVM - Manual / Electrical", "RHS", et.orvm?.rhs);
    pushRow("Light", "LHS Headlight", et.lights?.lhs_headlight);
    pushRow("Light", "RHS Headlight", et.lights?.rhs_headlight);
    pushRow("Light", "LHS Taillight", et.lights?.lhs_taillight);
    pushRow("Light", "RHS Taillight", et.lights?.rhs_taillight);
    pushRow("Alloy Wheel", "—", et.alloy_wheel);

    ["lhs_front", "rhs_front", "lhs_rear", "rhs_rear", "spare"].forEach((k) => {
      const tyre = et.tyres?.[k];
      if (!tyre) return;
      const label = k === "spare"
        ? "Spare Tyre"
        : k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Tyre";
      const tread = tyre.tread_depth_mm ? `${tyre.tread_depth_mm} mm` : "—";
      const cond = (tyre.conditions || []).filter(Boolean).join(", ") || "—";
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
  //  ENGINE + TRANSMISSION
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) {
    y = addPage();
  } else {
    y += 6;
  }

  y = sectionHeading("Engine + Transmission", y);

  const eng = car?.engine_transmission || {};

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  const engConditions = (
    arr = [],
    flags = {},
    fallbackIfIssue = ""
  ) => {
    const fromArr = arr
      .flatMap((s) => String(s).split(","))
      .map((s) => s.trim())
      .filter(
        (s) =>
          s &&
          s.toLowerCase() !== "okay" &&
          s !== "—"
      )
      .map(
        (s) =>
          s.charAt(0).toUpperCase() +
          s.slice(1)
      );

    const fromFlags = Object.entries(flags)
      .filter(([, v]) => v === true)
      .map(([k]) =>
        k
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) =>
            c.toUpperCase()
          )
      );

    const result = [
      ...fromArr,
      ...fromFlags,
    ].join(", ");

    if (result) return result;

    return fallbackIfIssue || "—";
  };

  const statusValue = (status) =>
    isOkV(status || "na");

  // Better turbo logic
  const isTurboApplicable =
    eng?.turbo_charger &&
    eng?.turbo_charger?.status !== undefined;

  // ─────────────────────────────────────────────────────────────
  // Table rows
  // ─────────────────────────────────────────────────────────────
  const engRows = [
    [
      "Engine",
      "—",
      statusValue(eng.engine?.status),
      engConditions(
        eng.engine?.conditions || [],
        {
          mil_light_glowing:
            eng.engine?.mil_light_glowing,
          air_filter_box_damaged:
            eng.engine?.air_filter_box_damaged,
          electrical_wiring_damaged:
            eng.engine
              ?.electrical_wiring_damaged,
        }
      ),
    ],

    [
      "Engine Oil",
      "—",
      statusValue(eng.engine_oil?.status),
      engConditions(
        eng.engine_oil?.conditions || [],
        {
          leakage_from_tappet_cover:
            eng.engine_oil
              ?.leakage_from_tappet_cover,
        },
        eng.engine_oil?.status === "issue"
          ? "Inspect Further"
          : "—"
      ),
    ],

    [
      "Engine Mounting",
      "—",
      statusValue(
        eng.engine_mounting?.status
      ),
      engConditions(
        [],
        {
          excess_vibration:
            eng.engine_mounting
              ?.excess_vibration,
        },
        eng.engine_mounting?.status ===
          "issue"
          ? "Inspect Further"
          : "—"
      ),
    ],

    [
      "Engine Sound",
      "—",
      statusValue(
        eng.engine_sound?.status
      ),
      eng.engine_sound?.notes?.trim() ||
      "—",
    ],

    [
      "Battery",
      "—",
      statusValue(eng.battery?.status),
      engConditions([], {
        acid_leakage:
          eng.battery?.acid_leakage,
      }),
    ],

    [
      "Coolant",
      "—",
      statusValue(eng.coolant?.status),
      engConditions([], {
        dirty: eng.coolant?.dirty,
        level_low:
          eng.coolant?.level_low,
      }),
    ],

    [
      "Clutch",
      "—",
      statusValue(eng.clutch?.status),
      engConditions(
        [],
        {
          hard: eng.clutch?.hard,
          bearing_noise:
            eng.clutch?.bearing_noise,
          burning_smell:
            eng.clutch?.burning_smell,
        },
        eng.clutch?.status === "issue"
          ? "Inspect Further"
          : "—"
      ),
    ],

    [
      "Gear Shifting",
      "—",
      statusValue(
        eng.gear_shifting?.status
      ),
      engConditions([], {
        hard:
          eng.gear_shifting?.hard,
        not_engaging:
          eng.gear_shifting
            ?.not_engaging,
        front_drive_axle_noise:
          eng.gear_shifting
            ?.front_drive_axle_noise,
        gearbox_oil_leakage:
          eng.gear_shifting
            ?.gearbox_oil_leakage,
      }),
    ],

    [
      "Turbo Charger",
      "—",
      isTurboApplicable
        ? statusValue(
          eng.turbo_charger?.status
        )
        : "N/A",
      isTurboApplicable
        ? engConditions(
          [],
          {
            whistling_noise:
              eng.turbo_charger
                ?.whistling_noise,
          },
          eng.turbo_charger
            ?.status === "issue"
            ? "Inspect Further"
            : "—"
        )
        : "Not Applicable",
    ],

    [
      "Fuel Injector",
      "—",
      statusValue(
        eng.fuel_injector?.status
      ),
      engConditions([], {
        noise:
          eng.fuel_injector?.noise,
      }),
    ],

    [
      "Exhaust Smoke",
      "—",
      statusValue(
        eng.exhaust_smoke?.status
      ),
      engConditions([], {
        silencer_assembly_damaged:
          eng.exhaust_smoke
            ?.silencer_assembly_damaged,
      }),
    ],

    [
      "Radiator Fan Motor",
      "—",
      statusValue(
        eng.radiator_fan_motor
          ?.status
      ),
      engConditions([], {
        noise:
          eng.radiator_fan_motor
            ?.noise,
      }),
    ],

    [
      "Sump",
      "—",
      statusValue(
        eng.sump?.damaged ||
          eng.sump?.leakage
          ? "issue"
          : "ok"
      ),
      engConditions([], {
        damaged:
          eng.sump?.damaged,
        leakage:
          eng.sump?.leakage,
      }),
    ],

    [
      "Blow By (Idle)",
      "—",
      statusValue(
        eng.blow_by_on_idle
          ? "issue"
          : "ok"
      ),
      eng.blow_by_on_idle
        ? "Detected"
        : "—",
    ],

    [
      "Blow By (2000 RPM)",
      "—",
      statusValue(
        eng.blow_by_on_2000_rpm
          ? "issue"
          : "ok"
      ),
      eng.blow_by_on_2000_rpm
        ? "Detected"
        : "—",
    ],

    [
      "Towing Recommended",
      "—",
      statusValue(
        eng.towing_recommended
          ? "issue"
          : "ok"
      ),
      eng.towing_recommended
        ? "Yes — Towing Suggested"
        : "No",
    ],
  ];

  // Comments
  if (eng.comments?.trim()) {
    engRows.push([
      "Comments",
      "—",
      "—",
      eng.comments.trim(),
    ]);
  }

  const engColW = [
    55,
    20,
    18,
    CW - 55 - 20 - 18,
  ];

  y = inspectionTable(
    engRows,
    ML,
    y,
    engColW,
    [
      "Part",
      "Subpart",
      "Status",
      "Work Done / Current Condition",
    ]
  );
  // ═══════════════════════════════════════════════════════════════════════════
  //  STEERING / SUSPENSION + BRAKES
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PH - 50) { y = addPage(); } else { y += 6; }
  y = sectionHeading("Steering/Suspension + Brakes", y);

  const ssb = car?.steering_suspension_brakes || {};
  const ssbRows = [
    ["Steering", "—", isOkV(ssb.steering?.status),
      [ssb.steering?.hard ? "Hard" : "", ssb.steering?.abnormal_noise ? "Abnormal Noise" : ""].filter(Boolean).join(", ") || "—"],
    ["Suspension", "—", isOkV(ssb.suspension?.status), ssb.suspension?.abnormal_noise ? "Abnormal Noise" : "—"],
    ["Brake", "—", isOkV(ssb.brake?.status), ssb.brake?.noisy ? "Noisy" : "—"],
  ];
  const ssbColW = [55, 20, 18, CW - 55 - 20 - 18];
  y = inspectionTable(ssbRows, ML, y, ssbColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  AIR CONDITIONING
  // ═══════════════════════════════════════════════════════════════════════════
  const ac = car?.air_conditioning || {};
  const hasAC = Object.keys(ac).length > 0;
  if (hasAC) {
    if (y > PH - 50) { y = addPage(); } else { y += 6; }
    y = sectionHeading("Air Conditioning", y);
    const acRows = [
      ["AC Cooling", "—", isOkV(ac.ac_cooling?.status), (ac.ac_cooling?.conditions || []).join(", ") || "—"],
      ["Heater", "—", isOkV(ac.heater?.status), (ac.heater?.conditions || []).join(", ") || "—"],
      ["Climate Control AC", "—", isOkV(ac.climate_control?.status), "—"],
    ];
    const acColW = [55, 20, 18, CW - 55 - 20 - 18];
    y = inspectionTable(acRows, ML, y, acColW, ["Part", "Subpart", "Status", "Work Done / Current Condition"]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const allComments = [];
  if (et?.comments) allComments.push(["Exterior + Tyres", et.comments]);
  if (eng.comments) allComments.push(["Engine + Transmission", eng.comments]);
  if (ssb.comments) allComments.push(["Steering/Suspension + Brakes", ssb.comments]);
  // if (ei.comments) allComments.push(["Electricals + Interior", ei.comments]);
  if (ac?.comments) allComments.push(["Air Conditioning", ac.comments]);
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

  const carDetailImgs = collectCarDetailImages(car);
  const exteriorImgs = collectExteriorImages(car);
  const engineImgs = collectEngineImages(car);
  const interiorImgs = collectInteriorImages(car);
  const steeringImgs = collectSteeringImages(car);

  // Combine ALL images into one flat list for a single parallel fetch pass
  const allImgsFlat = [
    ...carDetailImgs,
    ...exteriorImgs,
    ...engineImgs,
    ...interiorImgs,
    ...steeringImgs,
  ];

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

  // ── Car Detail Overview photos (front_main, front_right_side, etc.) ──────────
  const carDetailWithData = carDetailImgs.filter((i) => imgDataMap[i.url]);
  if (carDetailWithData.length > 0) {
    onProgress?.("Adding car detail overview photos…");
    y = addPage();
    y = sectionHeading("Car Detail Overview", y);
    y = photoGrid(carDetailWithData, imgDataMap, ML, y, makePhotoPageBreak("Car Detail Overview"));
  }

  // ── Exterior photos ───────────────────────────────────────────────────────────
  const extWithData = exteriorImgs.filter((i) => imgDataMap[i.url]);
  if (extWithData.length > 0) {
    onProgress?.("Adding exterior photos…");
    y = addPage();
    y = sectionHeading("Exterior + Tyres", y);
    y = photoGrid(extWithData, imgDataMap, ML, y, makePhotoPageBreak("Exterior + Tyres"));
  }

  // ── Interior photos ───────────────────────────────────────────────────────────
  const intWithData = interiorImgs.filter((i) => imgDataMap[i.url]);
  if (intWithData.length > 0) {
    onProgress?.("Adding interior photos…");
    y = addPage();
    y = sectionHeading("Electricals + Interior", y);
    y = photoGrid(intWithData, imgDataMap, ML, y, makePhotoPageBreak("Electricals + Interior"));
  }

  // ── Engine photos ─────────────────────────────────────────────────────────────
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

  // ── Steering / Suspension photos ──────────────────────────────────────────────
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
  if (mode === 'preview') {
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);   // caller must URL.revokeObjectURL() later
  }

  onProgress?.("Saving PDF…");
  const regNo = enq?.enquiryId || "InspectionReport";
  doc.save(`${regNo}.pdf`);
}

export default generateInspectionPDF;
// ─── Generateinspectionpdf.js ─────────────────────────────────────────────────
// Pure utility – NO React hooks, NO JSX component.
// Usage:
  // import generateInspectionPDF from './utls/Generateinspectionpdf';
  // const blobUrl = await generateInspectionPDF(enq, car, setProgress, 'preview');
  // await generateInspectionPDF(enq, car, setProgress, 'download');
// ──────────────────────────────────────────────────────────────────────────────

// ─── CDN loader ───────────────────────────────────────────────────────────────
// ─── Generateinspectionpdf.js ─────────────────────────────────────────────────
// Pure utility – NO React hooks, NO JSX component.
// ──────────────────────────────────────────────────────────────────────────────

// function loadScript(src) {
//   return new Promise((resolve, reject) => {
//     if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
//     const s = document.createElement('script');
//     s.src = src;
//     s.onload = resolve;
//     s.onerror = reject;
//     document.head.appendChild(s);
//   });
// }

// const fmtDate = (d) =>
//   d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// const cap = (s) =>
//   s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

// // ─── Fetch an image URL → base64 data URI (bypasses CORS on canvas) ───────────
// async function toDataUrl(url) {
//   if (!url) return null;
//   try {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`fetch ${res.status}`);
//     const blob = await res.blob();
//     return await new Promise((resolve, reject) => {
//       const r = new FileReader();
//       r.onload = () => resolve(r.result);
//       r.onerror = reject;
//       r.readAsDataURL(blob);
//     });
//   } catch (e) {
//     console.warn('Image fetch failed for', url, e.message);
//     return null;
//   }
// }

// // ─── Replace all image URLs in the data tree with base64 data URIs ────────────
// async function resolveImages(images) {
//   if (!images || images.length === 0) return [];
//   return Promise.all(
//     images.map(async (img) => {
//       const dataUrl = await toDataUrl(img.url);
//       return { ...img, url: dataUrl || img.url, failed: !dataUrl };
//     })
//   );
// }

// const REPORT_STYLES = `
//   * { box-sizing: border-box; margin: 0; padding: 0; }
//   body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #1f2937; }
//   .report { padding: 16px 20px 40px; max-width: 860px; margin: 0 auto; background: #fff; }
//   .rpt-header { background: #1c3f5e; border-radius: 10px; padding: 22px 26px; margin-bottom: 20px; color: #fff; }
//   .rpt-header-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
//   .rpt-eyebrow { font-size: 10px; letter-spacing: .12em; opacity: .55; margin-bottom: 4px; text-transform: uppercase; }
//   .rpt-make { font-size: 22px; font-weight: 700; }
//   .rpt-model { font-size: 16px; opacity: .9; margin-top: 2px; }
//   .rpt-reg { font-size: 12px; opacity: .65; margin-top: 3px; }
//   .rpt-header-right { text-align: right; }
//   .rpt-enq-label { font-size: 10px; opacity: .55; }
//   .rpt-enq-id { font-size: 16px; font-weight: 700; }
//   .rpt-enq-date { font-size: 11px; opacity: .6; margin-top: 2px; }
//   .rpt-issue-badge { margin-top: 10px; background: #ff6600; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 4px; display: inline-block; }
//   .rpt-header-meta { margin-top: 16px; padding-top: 12px; border-top: .5px solid rgba(255,255,255,.2); display: flex; gap: 22px; flex-wrap: wrap; }
//   .rpt-meta-item { font-size: 12px; }
//   .rpt-meta-label { opacity: .5; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
//   .rpt-meta-value { font-weight: 600; }
//   .metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); gap: 10px; margin-bottom: 22px; }
//   .metric-card { background: #f8f9fa; border-radius: 8px; padding: 12px 14px; border: .5px solid #e5e7eb; }
//   .metric-label { font-size: 10px; color: #9ca3af; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }
//   .metric-value { font-size: 19px; font-weight: 700; color: #1c3f5e; }
//   .metric-value.issue { color: #dc2626; }
//   .section-title { display: flex; align-items: center; gap: 8px; margin: 22px 0 10px; padding-bottom: 7px; border-bottom: 2px solid #ff6600; }
//   .section-title span { font-weight: 700; font-size: 12px; color: #1c3f5e; text-transform: uppercase; letter-spacing: .07em; }
//   .kv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 3px 10px; }
//   .kv-row { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 8px; border-radius: 4px; }
//   .kv-row.even { background: #f8f9fa; }
//   .kv-key { color: #6b7280; }
//   .kv-val { font-weight: 600; color: #1f2937; text-align: right; max-width: 58%; }
//   .badge { display: inline-block; padding: 2px 9px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
//   .badge-ok    { background: #dcfce7; color: #166534; }
//   .badge-issue { background: #fee2e2; color: #991b1b; }
//   .badge-na    { background: #f3f4f6; color: #6b7280; }
//   .insp-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
//   .insp-table colgroup col:nth-child(1) { width: 28%; }
//   .insp-table colgroup col:nth-child(2) { width: 18%; }
//   .insp-table colgroup col:nth-child(3) { width: 14%; }
//   .insp-table colgroup col:nth-child(4) { width: 40%; }
//   .insp-table thead tr { background: #1c3f5e; }
//   .insp-table th { padding: 7px 10px; text-align: left; font-weight: 600; color: #fff; font-size: 11px; }
//   .insp-table td { padding: 6px 10px; border-bottom: .5px solid #e5e7eb; word-break: break-word; }
//   .insp-table tr:nth-child(even) td { background: #f8f9fa; }
//   .insp-table td:first-child { font-weight: 600; color: #1f2937; }
//   .insp-table td:nth-child(2) { color: #6b7280; }
//   .insp-table td:last-child { color: #6b7280; font-size: 11px; }
//   .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px,1fr)); gap: 8px; margin-top: 8px; }
//   .photo-cell { border-radius: 6px; overflow: hidden; border: .5px solid #e5e7eb; }
//   .photo-cell img { width: 100%; height: 100px; object-fit: cover; display: block; }
//   .photo-label { padding: 3px 6px; font-size: 10px; color: #6b7280; background: #f9fafb; }
//   .photo-unavail { height: 100px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #9ca3af; font-size: 10px; }
//   .dmg-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 10px; justify-content: center; }
//   .dmg-legend-item { font-size: 10px; display: flex; align-items: center; gap: 3px; }
//   .dmg-dot { width: 13px; height: 13px; border-radius: 50%; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; flex-shrink: 0; }
//   .comment-box { margin-top: 8px; padding: 8px 12px; border-radius: 6px; font-size: 12px; }
//   .comment-orange { background: #fff7ed; border: .5px solid #fb923c; color: #9a3412; }
//   .comment-yellow { background: #fffbeb; border: .5px solid #fcd34d; color: #78350f; }
//   .comment-blue   { background: #eff6ff; border: .5px solid #93c5fd; color: #1e40af; }
//   .photos-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .06em; margin-top: 14px; }
//   .rpt-footer { margin-top: 32px; padding: 14px 20px; background: #f8f9fa; border-top: 2px solid #ff6600; text-align: center; font-size: 11px; color: #9ca3af; border-radius: 0 0 8px 8px; }
//   .section-block { margin-bottom: 24px; }
// `;

// function badgeHtml(status) {
//   const s = String(status || '').toLowerCase();
//   if (s === 'ok')    return `<span class="badge badge-ok">OK</span>`;
//   if (s === 'issue') return `<span class="badge badge-issue">Issue</span>`;
//   if (s === 'na')    return `<span class="badge badge-na">N/A</span>`;
//   return `<span class="badge" style="background:#fff7ed;color:#92400e">${cap(status)}</span>`;
// }

// function kvGridHtml(pairs) {
//   return `<div class="kv-grid">${pairs.map(([k, v], i) => `
//     <div class="kv-row ${i % 2 === 0 ? 'even' : ''}">
//       <span class="kv-key">${k}</span>
//       <span class="kv-val">${v ?? '—'}</span>
//     </div>`).join('')}</div>`;
// }

// function inspTableHtml(rows) {
//   const headers = ['Part', 'Sub-part', 'Status', 'Conditions / Notes'];
//   return `<table class="insp-table">
//     <colgroup><col/><col/><col/><col/></colgroup>
//     <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
//     <tbody>${rows.map(row => `
//       <tr>
//         <td>${row[0]}</td>
//         <td>${row[1]}</td>
//         <td>${badgeHtml(typeof row[2] === 'boolean' ? (row[2] ? 'ok' : 'issue') : row[2])}</td>
//         <td>${row[3] || '—'}</td>
//       </tr>`).join('')}
//     </tbody>
//   </table>`;
// }

// function photoGridHtml(images) {
//   if (!images || images.length === 0) return '';
//   return `<div class="photo-grid">${images.map(img => {
//     if (img.failed || !img.url) {
//       return `<div class="photo-cell"><div class="photo-unavail">Unavailable</div><div class="photo-label">${img.caption || cap(img.part) || 'Photo'}</div></div>`;
//     }
//     return `<div class="photo-cell">
//       <img src="${img.url}" alt="${img.caption || cap(img.part) || 'photo'}" />
//       <div class="photo-label">${img.caption || cap(img.part) || 'Photo'}</div>
//     </div>`;
//   }).join('')}</div>`;
// }

// function damageSchematicHtml(et) {
//   const isIssue = (obj) => obj?.status === 'issue';
//   const pts = [
//     { n: 1,  label: 'Front Bumper',     x: 50, y:  6, issue: isIssue(et.bumper?.front) },
//     { n: 2,  label: 'Rear Bumper',      x: 50, y: 94, issue: isIssue(et.bumper?.rear) },
//     { n: 3,  label: 'LHS Headlight',    x: 28, y: 10, issue: isIssue(et.lights?.lhs_headlight) },
//     { n: 4,  label: 'RHS Headlight',    x: 72, y: 10, issue: isIssue(et.lights?.rhs_headlight) },
//     { n: 5,  label: 'LHS Taillight',    x: 28, y: 90, issue: isIssue(et.lights?.lhs_taillight) },
//     { n: 6,  label: 'RHS Taillight',    x: 72, y: 90, issue: isIssue(et.lights?.rhs_taillight) },
//     { n: 7,  label: 'LHS ORVM',         x: 17, y: 33, issue: isIssue(et.orvm?.lhs) },
//     { n: 8,  label: 'RHS ORVM',         x: 83, y: 33, issue: isIssue(et.orvm?.rhs) },
//     { n: 9,  label: 'LHS Fender',       x: 23, y: 20, issue: isIssue(et.fender?.lhs) },
//     { n: 10, label: 'RHS Fender',       x: 77, y: 20, issue: isIssue(et.fender?.rhs) },
//     { n: 11, label: 'LHS Front Door',   x: 27, y: 42, issue: isIssue(et.door?.lhs_front) },
//     { n: 12, label: 'LHS Rear Door',    x: 27, y: 57, issue: isIssue(et.door?.lhs_rear) },
//     { n: 13, label: 'RHS Front Door',   x: 73, y: 42, issue: isIssue(et.door?.rhs_front) },
//     { n: 14, label: 'RHS Rear Door',    x: 73, y: 57, issue: isIssue(et.door?.rhs_rear) },
//     { n: 15, label: 'Roof',             x: 50, y: 50, issue: isIssue(et.roof) },
//     { n: 16, label: 'Front Windshield', x: 50, y: 27, issue: isIssue(et.windshield?.front) },
//     { n: 17, label: 'Rear Windshield',  x: 50, y: 73, issue: isIssue(et.windshield?.rear) },
//     { n: 18, label: 'LHS Qtr Panel',    x: 24, y: 76, issue: isIssue(et.quarter_panel?.lhs) },
//     { n: 19, label: 'RHS Qtr Panel',    x: 76, y: 76, issue: isIssue(et.quarter_panel?.rhs) },
//     { n: 20, label: 'Bonnet/Hood',      x: 50, y: 17, issue: isIssue(et.bonnet_hood) },
//     { n: 21, label: 'Dicky Door',       x: 50, y: 83, issue: isIssue(et.dicky_boot_door) },
//     { n: 22, label: 'Running B. LHS',   x: 15, y: 50, issue: isIssue(et.running_border?.lhs) },
//     { n: 23, label: 'Running B. RHS',   x: 85, y: 50, issue: isIssue(et.running_border?.rhs) },
//   ];
//   const W = 420, H = 300;
//   const carW = 100, carH = 230, carX = W / 2 - 50, carY = (H - carH) / 2;
//   const wheels = [
//     [carX - 12, carY + 48], [carX + carW - 2, carY + 48],
//     [carX - 12, carY + 138], [carX + carW - 2, carY + 138],
//   ].map(([wx, wy]) =>
//     `<ellipse cx="${wx + 7}" cy="${wy + 16}" rx="9" ry="18" fill="#374151" stroke="#6b7280" stroke-width="0.5"/>`
//   ).join('');
//   const svgPts = pts.map(p => {
//     const px = (p.x / 100) * W, py = (p.y / 100) * H;
//     return `<g>
//       <circle cx="${px}" cy="${py}" r="9.5" fill="${p.issue ? '#ff6600' : '#22a03c'}" stroke="${p.issue ? '#c44400' : '#15692a'}" stroke-width="0.8"/>
//       <text x="${px}" y="${py + 3.5}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#fff">${p.n}</text>
//     </g>`;
//   }).join('');
//   const legend = pts.map(p =>
//     `<span class="dmg-legend-item" style="color:${p.issue ? '#991b1b' : '#6b7280'}">
//       <span class="dmg-dot" style="background:${p.issue ? '#ff6600' : '#22a03c'}">${p.n}</span>
//       ${p.label}
//     </span>`
//   ).join('');
//   return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:500px;display:block;margin:0 auto">
//     <rect x="${carX}" y="${carY}" width="${carW}" height="${carH}" rx="12" fill="#e8eef4" stroke="#94a3b8" stroke-width="0.8"/>
//     <rect x="${carX + 8}" y="${carY + 30}" width="${carW - 16}" height="38" rx="3" fill="#bcd4e8" stroke="#7ba3c0" stroke-width="0.5"/>
//     <rect x="${carX + 8}" y="${carY + carH - 68}" width="${carW - 16}" height="38" rx="3" fill="#bcd4e8" stroke="#7ba3c0" stroke-width="0.5"/>
//     <rect x="${carX + 5}" y="${carY + 68}" width="${carW - 10}" height="${carH - 136}" rx="2" fill="#d1dce8" stroke="#94a3b8" stroke-width="0.4"/>
//     <line x1="${carX + 3}" y1="${carY + carH * 0.5}" x2="${carX + carW - 3}" y2="${carY + carH * 0.5}" stroke="#94a3b8" stroke-width="0.5"/>
//     ${wheels}${svgPts}
//   </svg>
//   <div class="dmg-legend">${legend}</div>`;
// }

// // ─── Collect all image objects from car data ───────────────────────────────────
// function collectAllImages(car) {
//   const cd  = car?.car_details  || {};
//   const et  = car?.exterior_tyres || {};
//   const eng = car?.engine_transmission || {};
//   const ei  = car?.electricals_interior || {};

//   const carOverview   = cd.images || [];
//   const addI = (imgs, label) => (imgs || []).map(img => ({ ...img, caption: label }));

//   const extImgs = [
//     ...addI(et.bumper?.front?.images,        'Bumper Front'),
//     ...addI(et.bumper?.rear?.images,         'Bumper Rear'),
//     ...addI(et.fender?.lhs?.images,          'Fender LHS'),
//     ...addI(et.fender?.rhs?.images,          'Fender RHS'),
//     ...addI(et.door?.lhs_front?.images,      'Door LHS Front'),
//     ...addI(et.door?.lhs_rear?.images,       'Door LHS Rear'),
//     ...addI(et.door?.rhs_front?.images,      'Door RHS Front'),
//     ...addI(et.door?.rhs_rear?.images,       'Door RHS Rear'),
//     ...addI(et.running_border?.lhs?.images,  'Running Border LHS'),
//     ...addI(et.running_border?.rhs?.images,  'Running Border RHS'),
//     ...addI(et.quarter_panel?.lhs?.images,   'Quarter Panel LHS'),
//     ...addI(et.quarter_panel?.rhs?.images,   'Quarter Panel RHS'),
//     ...addI(et.windshield?.front?.images,    'Windshield Front'),
//     ...addI(et.windshield?.rear?.images,     'Windshield Rear'),
//     ...addI(et.orvm?.lhs?.images,            'ORVM LHS'),
//     ...addI(et.orvm?.rhs?.images,            'ORVM RHS'),
//     ...addI(et.alloy_wheel?.images,          'Alloy Wheel'),
//     ...addI(et.bonnet_hood?.images,          'Bonnet/Hood'),
//     ...addI(et.roof?.images,                 'Roof'),
//     ...addI(et.dicky_boot_door?.images,      'Dicky Door'),
//     ...addI(et.boot_floor?.images,           'Boot Floor'),
//   ];

//   const engImgs = [
//     ...(eng.engine?.images  || []),
//     ...(eng.battery?.images || []),
//   ];

//   const intImgs = [
//     ...(ei.interior?.images || []),
//     ...(ei.images           || []),
//   ];

//   return { carOverview, extImgs, engImgs, intImgs };
// }

// // ─── Build HTML (images already resolved to data URIs) ────────────────────────
// function buildReportHTML(enq, car, resolvedImgs) {
//   const cd  = car?.car_details  || {};
//   const et  = car?.exterior_tyres || {};
//   const eng = car?.engine_transmission || {};
//   const ssb = car?.steering_suspension_brakes || {};
//   const ei  = car?.electricals_interior || {};
//   const ac  = car?.air_conditioning || {};

//   const issueCount = [
//     et.bumper?.front, et.bumper?.rear, et.fender?.lhs, et.fender?.rhs,
//     et.door?.lhs_front, et.door?.lhs_rear, et.door?.rhs_front, et.door?.rhs_rear,
//     et.running_border?.lhs, et.running_border?.rhs,
//     et.quarter_panel?.lhs, et.quarter_panel?.rhs,
//     et.windshield?.front, et.alloy_wheel, eng.engine, eng.engine_mounting,
//     ssb.suspension, ssb.brake,
//   ].filter(x => x?.status === 'issue').length;

//   const extRows = [
//     ['Bumper','Front', et.bumper?.front?.status, (et.bumper?.front?.conditions||[]).join(', ')],
//     ['Bumper','Rear',  et.bumper?.rear?.status,  (et.bumper?.rear?.conditions||[]).join(', ')],
//     ['Bonnet/Hood','—', et.bonnet_hood?.status, ''],
//     ['Roof','—', et.roof?.status, ''],
//     ['Fender','LHS', et.fender?.lhs?.status, (et.fender?.lhs?.conditions||[]).join(', ')],
//     ['Fender','RHS', et.fender?.rhs?.status, (et.fender?.rhs?.conditions||[]).join(', ')],
//     ['Door','LHS Front', et.door?.lhs_front?.status, (et.door?.lhs_front?.conditions||[]).join(', ')],
//     ['Door','LHS Rear',  et.door?.lhs_rear?.status,  (et.door?.lhs_rear?.conditions||[]).join(', ')],
//     ['Door','RHS Front', et.door?.rhs_front?.status, (et.door?.rhs_front?.conditions||[]).join(', ')],
//     ['Door','RHS Rear',  et.door?.rhs_rear?.status,  (et.door?.rhs_rear?.conditions||[]).join(', ')],
//     ['Pillar','LHS A/B/C','ok',''], ['Pillar','RHS A/B/C','ok',''],
//     ['Running Border','LHS', et.running_border?.lhs?.status, (et.running_border?.lhs?.conditions||[]).join(', ')],
//     ['Running Border','RHS', et.running_border?.rhs?.status, (et.running_border?.rhs?.conditions||[]).join(', ')],
//     ['Quarter Panel','LHS', et.quarter_panel?.lhs?.status, (et.quarter_panel?.lhs?.conditions||[]).join(', ')],
//     ['Quarter Panel','RHS', et.quarter_panel?.rhs?.status, (et.quarter_panel?.rhs?.conditions||[]).join(', ')],
//     ['Dicky/Boot Door','—', et.dicky_boot_door?.status, ''],
//     ['Boot Floor','—', et.boot_floor?.status, et.boot_floor?.notes||''],
//     ['Windshield','Front', et.windshield?.front?.status, (et.windshield?.front?.conditions||[]).join(', ')],
//     ['Windshield','Rear',  et.windshield?.rear?.status, ''],
//     ['ORVM','LHS', et.orvm?.lhs?.status,''], ['ORVM','RHS', et.orvm?.rhs?.status,''],
//     ['Headlight','LHS', et.lights?.lhs_headlight?.status,''],
//     ['Headlight','RHS', et.lights?.rhs_headlight?.status,''],
//     ['Taillight','LHS', et.lights?.lhs_taillight?.status,''],
//     ['Taillight','RHS', et.lights?.rhs_taillight?.status,''],
//     ['Alloy Wheel','—', et.alloy_wheel?.status, (et.alloy_wheel?.conditions||[]).join(', ')],
//     ['Tyre LHS Front','—',`${et.tyres?.lhs_front?.tread_depth_mm||'—'} mm tread`,'ok'],
//     ['Tyre RHS Front','—',`${et.tyres?.rhs_front?.tread_depth_mm||'—'} mm tread`,'ok'],
//     ['Tyre LHS Rear', '—',`${et.tyres?.lhs_rear?.tread_depth_mm||'—'}  mm tread`,'ok'],
//     ['Tyre RHS Rear', '—',`${et.tyres?.rhs_rear?.tread_depth_mm||'—'}  mm tread`,'ok'],
//     ['Spare Tyre',    '—',`${et.tyres?.spare?.tread_depth_mm||'—'}      mm tread`,'ok'],
//     ['Jack Tool','—', et.jack_tool_available?'ok':'issue', et.jack_tool_available?'Available':'Not available'],
//   ];

//   const engRows = [
//     ['Engine','—', eng.engine?.status, (eng.engine?.conditions||[]).join(', ')],
//     ['Engine Mounting','—', eng.engine_mounting?.status, eng.engine_mounting?.excess_vibration?'Excess vibration':''],
//     ['Engine Oil','—', eng.engine_oil?.status, eng.engine_oil?.leakage_from_tappet_cover?'Leakage from tappet cover':''],
//     ['Engine Sound','—', eng.engine_sound?.status, eng.engine_sound?.notes||''],
//     ['Battery','—', eng.battery?.status, eng.battery?.acid_leakage?'Acid leakage':''],
//     ['Coolant','—', eng.coolant?.status, [eng.coolant?.dirty&&'Dirty',eng.coolant?.level_low&&'Level low'].filter(Boolean).join(', ')||''],
//     ['Clutch','—', eng.clutch?.status, [eng.clutch?.hard&&'Hard',eng.clutch?.bearing_noise&&'Bearing noise',eng.clutch?.burning_smell&&'Burning smell'].filter(Boolean).join(', ')||''],
//     ['Gear Shifting','—', eng.gear_shifting?.status,''],
//     ['Turbo Charger','—', eng.turbo_charger?.status,'Not applicable'],
//     ['Fuel Injector','—', eng.fuel_injector?.status,''],
//     ['Exhaust Smoke','—', eng.exhaust_smoke?.status,''],
//     ['Radiator Fan','—', eng.radiator_fan_motor?.status,''],
//     ['Sump','—', (eng.sump?.damaged||eng.sump?.leakage)?'issue':'ok', [eng.sump?.damaged&&'Damaged',eng.sump?.leakage&&'Leakage'].filter(Boolean).join(', ')||''],
//     ['Blow By (Idle)','—', eng.blow_by_on_idle?'issue':'ok', eng.blow_by_on_idle?'Detected':''],
//     ['Blow By (2000RPM)','—', eng.blow_by_on_2000_rpm?'issue':'ok', eng.blow_by_on_2000_rpm?'Detected':''],
//     ['Towing','—', eng.towing_recommended?'issue':'ok', eng.towing_recommended?'Towing recommended':'Not required'],
//   ];

//   const ssbRows = [
//     ['Steering','—', ssb.steering?.status, [ssb.steering?.hard&&'Hard',ssb.steering?.abnormal_noise&&'Abnormal noise'].filter(Boolean).join(', ')||''],
//     ['Suspension','—', ssb.suspension?.status, ssb.suspension?.abnormal_noise?'Abnormal noise':''],
//     ['Brake','—', ssb.brake?.status, ssb.brake?.noisy?'Noisy':''],
//   ];

//   const intRows = [
//     ['Power Windows','—', ei.power_windows,'Market fitted (aftermarket)'],
//     ['Interior','—', ei.interior?.status,''],
//     ['Music System','—', ei.music_system?.status,''],
//     ['Fabric Seat','—', ei.fabric_seat,''],
//     ['Leather Seat','—', ei.leather_seat?.status,(ei.leather_seat?.conditions||[]).join(', ')],
//     ['Door Trim','—', ei.door_trim?.status,(ei.door_trim?.conditions||[]).join(', ')],
//     ['ABS','—', ei.abs?.status,''],
//     ['Airbag Feature','—', ei.airbag_feature,`${ei.no_of_airbags||0} airbag(s)`],
//     ['Electrical','—', ei.electrical,''],
//     ['Parking Sensor','—', ei.parking_sensor,''],
//     ['Navigation Chip','—', ei.navigation_chip,''],
//     ['Rear Defogger','—', ei.rear_defogger,''],
//     ['Reverse Camera','—', ei.reverse_camera,''],
//     ['Sunroof','—', ei.sunroof,''],
//     ['Remote Key','—', ei.remote_key?.available?'ok':'issue', ei.remote_key?.available?'Available':'Not available'],
//   ];

//   const carKV = [
//     ['Make / Model',`${cd.make||'—'} — ${cd.model||'—'}`],
//     ['Variant', cd.variant],
//     ['Year of Manufacturing', cd.year_of_manufacturing],
//     ['Registration Number', cd.registration_number],
//     ['Chassis Number', cd.chassis_number],
//     ['RTO', cd.rto], ['Branch', cd.branch],
//     ['Reg. Year / Month',`${cd.registration_year||'—'} / ${cd.registration_month||'—'}`],
//     ['Mfg. Month / Year',`${cd.manufacturing_month||'—'} ${cd.manufacturing_year||''}`],
//     ['Fitness Upto', fmtDate(cd.fitness_upto)],
//     ['Road Tax Validity', fmtDate(cd.road_tax_validity)],
//     ['RC Condition', cd.rc_condition], ['RC Availability', cd.rc_availability],
//     ['Road Tax Paid', cd.road_tax_paid], ['Chassis Embossing', cap(cd.chassis_embossing)],
//     ['Under Hypothecation', cd.under_hypothecation?'Yes':'No'],
//     ['Financed', cd.financed?'Yes':'No'], ['Duplicate Key', cd.duplicate_key?'Yes':'No'],
//     ['RTO NOC Issued', cd.rto_noc_issued?'Yes':'No'],
//     ['Mismatch in RC', cd.mismatch_in_rc?'Yes':'No'],
//     ['To Be Scrapped', cd.to_be_scrapped?'Yes':'No'],
//     ['CNG/LPG in RC', cd.cng_lpg_fitment_in_rc?'Yes':'No'],
//     ['Inspection At', cap(cd.inspection_at)], ['City', cd.reg_city],
//   ];

//   return `<!DOCTYPE html>
// <html><head><meta charset="UTF-8"/><style>${REPORT_STYLES}</style></head>
// <body><div class="report">

//   <div class="rpt-header">
//     <div class="rpt-header-top">
//       <div>
//         <div class="rpt-eyebrow">BIDNDRIVE · Inspection Report</div>
//         <div class="rpt-make">${cd.make||'—'}</div>
//         <div class="rpt-model">${cd.model||'—'} · ${cd.variant||'—'}</div>
//         <div class="rpt-reg">${cd.year_of_manufacturing||'—'} · ${cd.registration_number||'—'}</div>
//       </div>
//       <div class="rpt-header-right">
//         <div class="rpt-enq-label">Enquiry ID</div>
//         <div class="rpt-enq-id">${enq.enquiryId||'—'}</div>
//         <div class="rpt-enq-date">${fmtDate(enq.createdAt)}</div>
//         <div style="margin-top:10px"><span class="rpt-issue-badge">${issueCount} Issues Found</span></div>
//       </div>
//     </div>
//     <div class="rpt-header-meta">
//       ${[['Owner',`${enq.userId?.firstName||''} ${enq.userId?.lastName||''}`],
//          ['Phone', enq.userId?.phone||enq.contactNumber||'—'],
//          ['Inspection', enq.inspectionType||'—'],
//          ['Location', enq.additionalInfo||'—'],
//          ['Date',`${fmtDate(enq.scheduleDate)} ${enq.scheduleTime||''}`],
//       ].map(([k,v])=>`<div class="rpt-meta-item"><div class="rpt-meta-label">${k}</div><div class="rpt-meta-value">${v}</div></div>`).join('')}
//     </div>
//   </div>

//   <div class="metrics">
//     ${[['Odometer',`${Number(cd.odometer_reading||0).toLocaleString('en-IN')} km`],
//        ['Fuel Type', cd.fuel_type||'—'],
//        ['No. of Owners', String(cd.no_of_owners||'—')],
//        ['Insurance', cap(cd.insurance_type)],
//        ['RC Status', cd.rc_condition||'—'],
//        ['Issues Found', String(issueCount)],
//     ].map(([k,v])=>`<div class="metric-card"><div class="metric-label">${k}</div><div class="metric-value${k==='Issues Found'&&Number(v)>0?' issue':''}">${v}</div></div>`).join('')}
//   </div>

//   ${resolvedImgs.carOverview.length ? `<div class="section-block"><div class="section-title"><span>📷 Car Overview Photos</span></div>${photoGridHtml(resolvedImgs.carOverview)}</div>` : ''}

//   <div class="section-block"><div class="section-title"><span>📋 Car Details</span></div>${kvGridHtml(carKV)}</div>

//   <div class="section-block"><div class="section-title"><span>🗺️ Damage Map</span></div>${damageSchematicHtml(et)}</div>

//   <div class="section-block">
//     <div class="section-title"><span>🚗 Exterior + Tyres</span></div>
//     ${inspTableHtml(extRows)}
//     ${resolvedImgs.extImgs.length ? `<div class="photos-label">Exterior Photos</div>${photoGridHtml(resolvedImgs.extImgs)}` : ''}
//   </div>

//   <div class="section-block">
//     <div class="section-title"><span>⚙️ Engine + Transmission</span></div>
//     ${inspTableHtml(engRows)}
//     ${eng.comments ? `<div class="comment-box comment-yellow">💬 ${eng.comments}</div>` : ''}
//     ${resolvedImgs.engImgs.length ? `<div class="photos-label">Engine Photos</div>${photoGridHtml(resolvedImgs.engImgs)}` : ''}
//   </div>

//   <div class="section-block">
//     <div class="section-title"><span>🔧 Steering / Suspension + Brakes</span></div>
//     ${inspTableHtml(ssbRows)}
//     ${ssb.comments ? `<div class="comment-box comment-orange">💬 ${ssb.comments}</div>` : ''}
//   </div>

//   <div class="section-block">
//     <div class="section-title"><span>💡 Electricals + Interior</span></div>
//     ${inspTableHtml(intRows)}
//     ${ei.comments ? `<div class="comment-box comment-blue">💬 ${ei.comments}</div>` : ''}
//     ${resolvedImgs.intImgs.length ? `<div class="photos-label">Interior Photos</div>${photoGridHtml(resolvedImgs.intImgs)}` : ''}
//   </div>

//   <div class="section-block">
//     <div class="section-title"><span>❄️ Air Conditioning</span></div>
//     ${inspTableHtml([
//       ['AC Cooling','—', ac.ac_cooling?.status||'ok',''],
//       ['Heater','—', ac.heater?.status||'ok',''],
//       ['Climate Control AC','—', ac.climate_control_ac||'ok',''],
//     ])}
//   </div>

//   <div class="rpt-footer">
//     BIDNDRIVE PVT. LTD. · www.bidndrive.in · care@bidndrive.com<br/>
//     <span style="font-size:10px;opacity:.7">Report ID: ${enq.enquiryId||'—'} · Generated: ${fmtDate(enq.createdAt)}</span>
//   </div>

// </div></body></html>`;
// }

// // ─── Render HTML string → jsPDF using a hidden div (NOT iframe) ───────────────
// // html2canvas is loaded into the PARENT window, so we render into a hidden div.
// async function renderHtmlToPDF(htmlString, onProgress) {
//   onProgress?.('Loading libraries…');
//   await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
//   await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

//   onProgress?.('Rendering report…');

//   // Parse the HTML string and inject just the <body> content into a hidden div
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(htmlString, 'text/html');

//   // Inject the report styles into the parent document (scoped to our container)
//   const styleId = '__rpt_styles__';
//   if (!document.getElementById(styleId)) {
//     const styleEl = document.createElement('style');
//     styleEl.id = styleId;
//     styleEl.textContent = REPORT_STYLES;
//     document.head.appendChild(styleEl);
//   }

//   // Create hidden container in parent document
//   const container = document.createElement('div');
//   container.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;background:#fff;z-index:-1;';
//   container.innerHTML = doc.body.innerHTML;
//   document.body.appendChild(container);

//   // Brief settle
//   await new Promise(r => setTimeout(r, 300));

//   onProgress?.('Capturing pages…');
//   const canvas = await window.html2canvas(container, {
//     scale: 2,
//     useCORS: true,
//     allowTaint: true,          // images are already base64, so taint is fine
//     backgroundColor: '#ffffff',
//     logging: false,
//     windowWidth: 900,
//   });

//   document.body.removeChild(container);

//   // Clean up injected styles
//   document.getElementById(styleId)?.remove();

//   onProgress?.('Building PDF…');
//   const { jsPDF } = window.jspdf;
//   const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

//   const PAGE_W = 210, PAGE_H = 297, MARGIN = 8;
//   const contentW = PAGE_W - MARGIN * 2;
//   const contentH = PAGE_H - MARGIN * 2;
//   const imgW = canvas.width, imgH = canvas.height;
//   const scale = contentW / (imgW / 2);
//   const totalMM = (imgH / 2) * scale;

//   let offsetMM = 0, page = 0;
//   while (offsetMM < totalMM) {
//     if (page > 0) pdf.addPage();
//     const sliceH_mm = Math.min(contentH, totalMM - offsetMM);
//     const srcY_px   = (offsetMM / scale) * 2;
//     const srcH_px   = (sliceH_mm / scale) * 2;
//     const tmp = document.createElement('canvas');
//     tmp.width  = imgW;
//     tmp.height = Math.ceil(srcH_px);
//     tmp.getContext('2d').drawImage(canvas, 0, srcY_px, imgW, srcH_px, 0, 0, imgW, srcH_px);
//     pdf.addImage(tmp.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, MARGIN, contentW, sliceH_mm);
//     offsetMM += sliceH_mm;
//     page++;
//   }

//   return pdf;
// }

// // ─── Public API ───────────────────────────────────────────────────────────────
// export default async function generateInspectionPDF(enq, car, onProgress, mode = 'download') {
//   const progress = msg => onProgress?.(msg);
//   try {
//     // 1. Resolve all S3 images to base64 BEFORE building HTML (avoids CORS in canvas)
//     progress('Fetching images…');
//     const raw = collectAllImages(car);
//     const [carOverview, extImgs, engImgs, intImgs] = await Promise.all([
//       resolveImages(raw.carOverview),
//       resolveImages(raw.extImgs),
//       resolveImages(raw.engImgs),
//       resolveImages(raw.intImgs),
//     ]);
//     const resolvedImgs = { carOverview, extImgs, engImgs, intImgs };

//     // 2. Build HTML with embedded base64 images
//     progress('Building report…');
//     const html = buildReportHTML(enq, car, resolvedImgs);

//     // 3. Render to PDF
//     const pdf = await renderHtmlToPDF(html, progress);
//     const filename = `${enq?.enquiryId || 'Inspection'}_Report.pdf`;

//     if (mode === 'preview') {
//       progress('Generating preview…');
//       return URL.createObjectURL(pdf.output('blob'));
//     } else {
//       progress('Saving PDF…');
//       pdf.save(filename);
//     }
//   } catch (err) {
//     console.error('generateInspectionPDF error:', err);
//     throw err;
//   }
// }