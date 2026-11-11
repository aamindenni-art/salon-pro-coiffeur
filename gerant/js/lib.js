/* ===========================================================
   Salon Gérant — fonctions pures (sans DOM) : fusion de synchro
   à 3 voies + export Excel. Testables sous Node (tests/lib.test.js).
   =========================================================== */
(function (root) {
"use strict";

const COLS = ["employes","clients","services","products","suppliers","rdv","sales",
              "expenses","attendance","leaves","purchases","payments"];
// Champs « compteurs » : fusionnés par différence (2 appareils qui vendent le même produit)
const COUNTERS = { products:["qty"], clients:["points","visits","debt"] };
const n = v => Number(v) || 0;
const arr = v => Array.isArray(v) ? v : [];

/* JSON canonique (clés triées) : le cloud (jsonb) ne garde pas l'ordre des clés */
function canon(v){
  if (v === null || v === undefined || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().filter(k => v[k] !== undefined)
    .map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
}
function hashStr(s){
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++){
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}
function recHash(rec, counters){
  if (!counters.length) return hashStr(canon(rec));
  const o = Object.assign({}, rec); counters.forEach(c => { delete o[c]; });
  return hashStr(canon(o));
}

/* Empreinte compacte du document au moment de la dernière synchro réussie */
function snapshot(db){
  const c = {};
  COLS.forEach(col => {
    const cn = COUNTERS[col] || [], m = {};
    arr(db && db[col]).forEach(r => { if (r && r.id) m[r.id] = [recHash(r, cn)].concat(cn.map(k => n(r[k]))); });
    c[col] = m;
  });
  return { salon: hashStr(canon((db && db.salon) || {})), c };
}

/* Fusion à 3 voies : rejoue les changements locaux (depuis `base`) sur `remote`.
   - ajout local        → conservé
   - modif locale       → la version locale gagne
   - suppression (locale ou distante) → la suppression gagne
   - compteurs          → valeur distante + variation locale */
function merge3(local, remote, base){
  const out = {};
  Object.keys(remote || {}).forEach(k => { out[k] = remote[k]; });
  Object.keys(local || {}).forEach(k => { if (!(k in out)) out[k] = local[k]; });
  const B = (base && base.c) || {};
  const salonChanged = !base || hashStr(canon(local.salon || {})) !== base.salon;
  out.salon = (salonChanged && base) ? local.salon : ((remote && remote.salon) || local.salon);
  COLS.forEach(col => {
    const L = arr(local[col]), R = arr(remote && remote[col]), b = B[col] || {}, cn = COUNTERS[col] || [];
    const lIds = new Set(L.map(x => x.id));
    const rIdx = new Map(R.map((x, i) => [x.id, i]));
    const res = R.slice(), drop = new Set();
    Object.keys(b).forEach(id => { if (!lIds.has(id)) drop.add(id); });
    L.forEach(l => {
      const bl = b[l.id];
      if (!bl){ if (!rIdx.has(l.id)) res.push(l); return; }
      if (!rIdx.has(l.id)) return;
      const i = rIdx.get(l.id), r = R[i];
      const m = Object.assign({}, recHash(l, cn) !== bl[0] ? l : r);
      cn.forEach((c, k) => { m[c] = Math.max(0, n(r[c]) + n(l[c]) - n(bl[k + 1])); });
      res[i] = m;
    });
    out[col] = res.filter(x => !drop.has(x.id));
  });
  return out;
}

/* ---------------- Export Excel (.xlsx) sans dépendance ---------------- */
let _crcT = null;
function crc32(u8){
  if (!_crcT){ _crcT = new Uint32Array(256);
    for (let i = 0; i < 256; i++){ let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; _crcT[i] = c >>> 0; } }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = _crcT[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipStore(files){
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  const hdr = (sig, f, extra) => {
    const b = new Uint8Array(extra), v = new DataView(b.buffer);
    v.setUint32(0, sig, true); return [b, v];
  };
  files.forEach(f => {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const [lh, lv] = hdr(0x04034b50, f, 30);
    lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true); lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    parts.push(lh, name, data);
    const [ch, cv] = hdr(0x02014b50, f, 46);
    cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true); cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, off, true);
    central.push(ch, name);
    off += 30 + name.length + data.length;
  });
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const [eh, ev] = hdr(0x06054b50, null, 22);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, off, true);
  const all = parts.concat(central, [eh]);
  const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
  let p = 0; all.forEach(b => { out.set(b, p); p += b.length; });
  return out;
}
const xesc = s => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function colName(i){ let s = ""; i++; while (i > 0){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }

/* sheets : [{ name, widths:[..], rows:[[cell…]] }] — cell : texte | nombre | {v, b:true} | null
   La 1re ligne de chaque feuille est mise en forme comme en-tête. */
function xlsx(sheets){
  const enc = new TextEncoder();
  const used = new Set();
  const names = sheets.map((s, i) => {
    let nm = String(s.name || "Feuille" + (i + 1)).replace(/[\[\]:*?\/\\]/g, " ").slice(0, 31) || "Feuille" + (i + 1);
    while (used.has(nm.toLowerCase())) nm = nm.slice(0, 28) + "_" + (i + 1);
    used.add(nm.toLowerCase()); return nm;
  });
  const sheetXml = s => {
    const cols = arr(s.widths).length ? "<cols>" + s.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("") + "</cols>" : "";
    const rows = arr(s.rows).map((row, ri) => "<row r=\"" + (ri + 1) + "\">" + arr(row).map((cell, ci) => {
      if (cell === null || cell === undefined || cell === "") return "";
      const ref = colName(ci) + (ri + 1);
      const bold = ri === 0 || (typeof cell === "object" && cell.b);
      const v = typeof cell === "object" ? cell.v : cell;
      if (typeof v === "number" && isFinite(v)) return `<c r="${ref}" s="${ri === 0 ? 4 : bold ? 3 : 2}"><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr" s="${ri === 0 ? 4 : bold ? 1 : 0}"><is><t xml:space="preserve">${xesc(v)}</t></is></c>`;
    }).join("") + "</row>").join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${rows}</sheetData></worksheet>`;
  };
  const files = [
    { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>` },
    { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((nm, i) => `<sheet name="${xesc(nm)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/styles.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F1F24"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="3" fontId="2" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/></cellXfs></styleSheet>` },
  ].concat(sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) })));
  return zipStore(files.map(f => ({ name: f.name, data: enc.encode(f.data) })));
}

/* ---------------- SHA-256 (synchrone, pour les codes PIN) ---------------- */
let _K = null, _H0 = null;
function _shaInit(){
  _K = []; _H0 = []; const comp = {}; let k = 0;
  for (let c = 2; k < 64; c++){
    if (comp[c]) continue;
    for (let i = c * c; i < 320; i += c) comp[i] = true;
    if (k < 8) _H0[k] = (Math.pow(c, 0.5) * 4294967296) | 0;
    _K[k++] = (Math.pow(c, 1 / 3) * 4294967296) | 0;
  }
}
function sha256(str){
  if (!_K) _shaInit();
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const bytes = Array.from(new TextEncoder().encode(String(str)));
  const bitLen = bytes.length * 8;
  bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
  const hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
  for (let s = 24; s >= 0; s -= 8) bytes.push((hi >>> s) & 255);
  for (let s = 24; s >= 0; s -= 8) bytes.push((lo >>> s) & 255);
  const H = _H0.slice(), w = new Array(64);
  for (let o = 0; o < bytes.length; o += 64){
    for (let i = 0; i < 16; i++) w[i] = (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
    for (let i = 16; i < 64; i++){
      const a = w[i - 15], b = w[i - 2];
      w[i] = (w[i - 16] + (rr(a, 7) ^ rr(a, 18) ^ (a >>> 3)) + w[i - 7] + (rr(b, 17) ^ rr(b, 19) ^ (b >>> 10))) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++){
      const t1 = (h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + _K[i] + w[i]) | 0;
      const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

const GLib = { COLS, COUNTERS, canon, hashStr, snapshot, merge3, xlsx, crc32, sha256 };
if (typeof module !== "undefined" && module.exports) module.exports = GLib;
else root.GLib = GLib;
})(typeof window !== "undefined" ? window : globalThis);
