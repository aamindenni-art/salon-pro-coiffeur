/* ===========================================================
   Salon Gérant v6 — noyau : config, outils, données, calculs,
   navigation et composants d'interface (feuille, dialogue, toast).
   =========================================================== */
"use strict";

const APP_VERSION = "v6";
const CFG = (typeof window !== "undefined" && window.APP_CONFIG) || {};
const CUR = CFG.currency || "DA";
const KEY = "salon_gerant", SYNC_KEY = "salon_gerant_sync", BASE_KEY = "salon_gerant_base";
const SESS_KEY = "salon_gerant_session", TICKET_KEY = "salon_gerant_ticket", LOCK_KEY = "salon_gerant_lock";

/* ---------- outils ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const N = v => { const x = Number(v); return isFinite(x) ? x : 0; };
const S = v => v == null ? "" : String(v);
const cleanId = v => S(v).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
const num = n => Math.round(N(n)).toLocaleString("fr-FR").replace(/[  ]/g, " ");
const money = n => num(n) + " " + CUR;
const sum = (a, f) => a.reduce((x, y) => x + N(f(y)), 0);
const isoOf = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const todayISO = () => isoOf(new Date());
const isISO = v => /^\d{4}-\d{2}-\d{2}$/.test(S(v));
const isHM = v => /^\d{2}:\d{2}$/.test(S(v));
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return isoOf(d); };
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const hmToMin = hm => { const p = S(hm).split(":"); return N(p[0]) * 60 + N(p[1]); };
const WD = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const WDAY = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const wdOf = iso => new Date(iso + "T12:00:00").getDay();
const frDate = iso => { if (!isISO(iso)) return ""; const p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
const frDay = iso => WD[wdOf(iso)];
const longDate = iso => { const p = iso.split("-"); return WDAY[wdOf(iso)].toLowerCase() + " " + N(p[2]) + " " + MONTHS[N(p[1]) - 1]; };
const initials = n => (S(n).trim() || "?").split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();
const phoneDigits = p => S(p).replace(/\D/g, "").slice(-9);
const telIntl = p => { let d = S(p).replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); if (d.startsWith("213")) return d; if (d.startsWith("0")) d = d.slice(1); return "213" + d; };

/* ---------- icônes (SVG en ligne) ---------- */
const ICONS = {
  home:'<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>', check:'<path d="M20 6 9 17l-5-5"/>',
  chevR:'<path d="m9 18 6-6-6-6"/>', chevL:'<path d="m15 18-6-6 6-6"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>',
  truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  chart:'<path d="M18 20V10M12 20V4M6 20v-6"/>',
  wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>',
  edit:'<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  printer:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  cloud:'<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  cloudOff:'<path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3M1 1l22 22"/>',
  refresh:'<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  alert:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>',
  star:'<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  award:'<circle cx="12" cy="8" r="7"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  tag:'<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  card:'<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  key:'<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  trend:'<path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  back:'<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  sheet:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
};
const ic = (name, size = 20) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

/* ---------- données ---------- */
function BASE(){
  return {
    v: 6,
    salon: { name: CFG.salonName || "Mon salon", tagline: CFG.tagline || "", loc: CFG.location || "", whatsapp: CFG.whatsapp || "",
             booking: false, pinHash: "", salt: "", rescueHash: "" },
    employes: [], clients: [], services: [], products: [], suppliers: [],
    rdv: [], sales: [], expenses: [], attendance: [], leaves: [], purchases: [], payments: [],
    setup: false,
  };
}
const RDV_ST = ["attente","confirme","fait","annule"];
const PAYS = ["espece","carte","credit"];

/* Remet n'importe quel document (ancienne version, import, cloud) dans une forme sûre. */
function normalize(d){
  const b = BASE();
  if (!d || typeof d !== "object" || Array.isArray(d)) return b;
  const o = Object.assign({}, d);
  o.salon = Object.assign(b.salon, (d.salon && typeof d.salon === "object") ? d.salon : {});
  ["name","tagline","loc","whatsapp","pinHash","salt","rescueHash"].forEach(k => { o.salon[k] = S(o.salon[k]); });
  o.salon.booking = o.salon.booking === true;
  GLib.COLS.forEach(c => {
    const seen = new Set();
    o[c] = (Array.isArray(d[c]) ? d[c] : []).filter(x => {
      if (!x || typeof x !== "object") return false;
      x.id = cleanId(x.id) || uid();
      if (seen.has(x.id)) return false;
      seen.add(x.id); return true;
    });
  });
  o.employes.forEach(e => {
    e.name = S(e.name) || "Employé"; e.phone = S(e.phone); e.role = S(e.role);
    e.commission = N(e.commission); e.salary = N(e.salary); e.goal = N(e.goal); e.prime = N(e.prime);
    e.hStart = isHM(e.hStart) ? e.hStart : "09:00"; e.hEnd = isHM(e.hEnd) ? e.hEnd : "19:00";
    e.offDays = Array.isArray(e.offDays) ? e.offDays.map(Number).filter(x => x >= 0 && x <= 6) : [];
    e.active = e.active !== false; e.online = e.online !== false;
  });
  o.clients.forEach(c => {
    c.name = S(c.name) || "Client"; c.phone = S(c.phone); c.note = S(c.note);
    c.points = Math.max(0, N(c.points)); c.visits = Math.max(0, N(c.visits)); c.debt = Math.max(0, N(c.debt));
  });
  o.services.forEach(s => { s.name = S(s.name) || "Prestation"; s.price = N(s.price); s.duration = N(s.duration) || 30; s.online = s.online !== false; });
  o.products.forEach(p => {
    p.name = S(p.name) || "Produit"; p.cat = S(p.cat); p.supplierId = cleanId(p.supplierId);
    p.qty = N(p.qty); p.min = N(p.min); p.cost = N(p.cost); p.sell = N(p.sell);
  });
  o.suppliers.forEach(s => { s.name = S(s.name) || "Fournisseur"; s.phone = S(s.phone); });
  o.rdv.forEach(r => {
    r.clientId = cleanId(r.clientId); r.clientName = S(r.clientName) || "Client"; r.clientPhone = S(r.clientPhone);
    r.date = isISO(r.date) ? r.date : todayISO(); r.time = isHM(r.time) ? r.time : "10:00";
    r.employeId = cleanId(r.employeId); r.serviceId = cleanId(r.serviceId); r.serviceName = S(r.serviceName);
    r.status = RDV_ST.includes(r.status) ? r.status : "attente"; r.note = S(r.note);
  });
  o.sales.forEach(s => {
    s.date = isISO(s.date) ? s.date : todayISO(); s.time = isHM(s.time) ? s.time : "00:00";
    s.employeId = cleanId(s.employeId); s.clientId = cleanId(s.clientId);
    s.items = (Array.isArray(s.items) ? s.items : []).filter(i => i && typeof i === "object");
    s.items.forEach(i => { i.kind = i.kind === "product" ? "product" : "service"; i.refId = cleanId(i.refId); i.name = S(i.name); i.price = N(i.price); i.qty = N(i.qty) || 1; });
    s.total = N(s.total); s.discount = N(s.discount);
    s.payment = PAYS.includes(s.payment) ? s.payment : "espece";
  });
  o.expenses.forEach(x => { x.date = isISO(x.date) ? x.date : todayISO(); x.label = S(x.label); x.category = S(x.category); x.amount = N(x.amount); });
  o.attendance.forEach(a => { a.employeId = cleanId(a.employeId); a.date = isISO(a.date) ? a.date : todayISO(); a.in = S(a.in); a.out = S(a.out); });
  o.leaves.forEach(l => {
    l.employeId = cleanId(l.employeId); l.from = isISO(l.from) ? l.from : todayISO(); l.to = isISO(l.to) ? l.to : l.from;
    l.type = S(l.type); l.note = S(l.note);
  });
  o.purchases.forEach(p => {
    p.date = isISO(p.date) ? p.date : todayISO(); p.supplierId = cleanId(p.supplierId); p.total = N(p.total);
    p.items = (Array.isArray(p.items) ? p.items : []).filter(i => i && typeof i === "object");
    p.items.forEach(i => { i.productId = cleanId(i.productId); i.qty = N(i.qty); i.cost = N(i.cost); });
  });
  o.payments.forEach(p => { p.date = isISO(p.date) ? p.date : todayISO(); p.clientId = cleanId(p.clientId); p.amount = N(p.amount); });
  o.setup = !!(d.setup || d.seeded || o.employes.length || o.sales.length);
  delete o.seeded;
  o.v = 6;
  return o;
}

function load(){
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && typeof r === "object") return normalize(r); } catch (e) {}
  return BASE();
}
let DB = load();
let REV = 0;   // compteur de modifications locales (sert à la synchro)

function persist(){
  try { localStorage.setItem(KEY, JSON.stringify(DB)); return true; }
  catch (e) { toast("Mémoire de l'appareil pleine — faites une sauvegarde dans Réglages", "bad"); return false; }
}
function save(){ REV++; persist(); markDirty(); }

/* Données d'exemple (essai) */
function demoData(db){
  const e = (name, role, com, sal) => ({ id: uid(), name, phone: "", role, commission: com, salary: sal, goal: 0, prime: 0,
    hStart: "09:00", hEnd: "19:00", offDays: [5], active: true, online: true });
  db.employes = [ e("Amine", "Coiffeur", 30, 25000), e("Yacine", "Coiffeur", 30, 25000), e("Sofiane", "Barbier", 25, 20000) ];
  db.services = defaultServices();
  const s1 = { id: uid(), name: "Cosmetic DZ", phone: "" }, s2 = { id: uid(), name: "Pro Coiffure Alger", phone: "" };
  db.suppliers = [s1, s2];
  const p = (name, cat, qty, min, cost, sell, sp) => ({ id: uid(), name, cat, qty, min, cost, sell, supplierId: sp });
  db.products = [
    p("Gel coiffant", "Soin", 12, 5, 250, 500, s1.id), p("Cire mate", "Soin", 3, 5, 400, 800, s1.id),
    p("Shampoing 1L", "Soin", 6, 3, 600, 1100, s2.id), p("Lames rasoir (x10)", "Consommable", 2, 4, 150, 0, s2.id),
    p("Serviettes", "Consommable", 20, 10, 100, 0, s1.id), p("Huile à barbe", "Soin", 8, 3, 500, 1000, s1.id),
  ];
  const c = (name, phone) => ({ id: uid(), name, phone, note: "", points: 0, visits: 0, debt: 0, created: todayISO() });
  db.clients = [ c("Karim B.", "0550112233"), c("Mehdi", "0661445566"), c("Walid", "0770998877") ];
  return db;
}
function defaultServices(){
  const s = (name, price, duration) => ({ id: uid(), name, price, duration, online: true });
  return [ s("Coupe", 500, 30), s("Coupe + Barbe", 800, 45), s("Barbe", 300, 20), s("Dégradé", 600, 35), s("Enfant", 400, 25), s("Coloration", 1500, 60) ];
}

/* ---------- accès rapides ---------- */
const emp  = id => DB.employes.find(x => x.id === id);
const cli  = id => DB.clients.find(x => x.id === id);
const svc  = id => DB.services.find(x => x.id === id);
const prod = id => DB.products.find(x => x.id === id);
const sup  = id => DB.suppliers.find(x => x.id === id);
const empName = id => (emp(id) || {}).name || "—";
const activeEmps = () => DB.employes.filter(e => e.active);
const AVC = ["", "c1", "c2", "c3", "c4"];
const empAv = (e, cls = "") => `<div class="av ${AVC[Math.max(0, DB.employes.indexOf(e)) % 5]} ${cls}">${esc(initials(e ? e.name : "?"))}</div>`;
const svcDur = id => N((svc(id) || {}).duration) || 30;

/* ---------- calculs ---------- */
function range(period){
  const d = new Date(), end = todayISO();
  if (period === "jour") return { from: end, to: end, label: "Aujourd'hui" };
  if (period === "semaine"){ const s = new Date(d); s.setDate(s.getDate() - (s.getDay() + 6) % 7); return { from: isoOf(s), to: end, label: "Cette semaine" }; }
  return { from: end.slice(0, 8) + "01", to: end, label: "Ce mois-ci" };
}
function monthRange(ym){
  const p = ym.split("-").map(Number), last = new Date(p[0], p[1], 0).getDate();
  return { from: ym + "-01", to: ym + "-" + String(last).padStart(2, "0"), label: MONTHS[p[1] - 1] + " " + p[0] };
}
const inRange = (iso, r) => iso >= r.from && iso <= r.to;
const salesIn = r => DB.sales.filter(s => inRange(s.date, r));
const expIn = r => DB.expenses.filter(x => inRange(x.date, r));
const saleGross = s => sum(s.items, i => i.price * i.qty);
const saleSvcGross = s => sum(s.items.filter(i => i.kind === "service"), i => i.price * i.qty);
/* part « prestations » réellement encaissée (remise répartie au prorata) */
function saleSvcNet(s){ const g = saleGross(s); return g > 0 ? saleSvcGross(s) * Math.min(1, N(s.total) / g) : 0; }
const salePct = s => s.comPct != null ? N(s.comPct) : N((emp(s.employeId) || {}).commission);
/* commission = % du coiffeur au moment de la vente × prestations encaissées (produits exclus) */
const saleCom = s => saleSvcNet(s) * salePct(s) / 100;
const saleEmpName = s => S(s.employeName) || (emp(s.employeId) || {}).name || "—";
const saleCliName = s => S(s.clientName) || (cli(s.clientId) || {}).name || "";
function netOf(t){ const g = sum(t.items, i => i.price * i.qty); const d = Math.max(0, Math.min(N(t.discount), g)); return { gross: g, disc: d, net: g - d }; }

/* paie par employé sur une période (fixe = salaire + prime, uniquement sur un mois) */
function payroll(r, fixed){
  const sales = salesIn(r);
  return DB.employes.map(e => {
    const sA = sales.filter(s => s.employeId === e.id);
    const ca = sum(sA, s => s.total), com = sum(sA, saleCom);
    const salary = fixed && e.active ? N(e.salary) : 0;
    const prime = fixed && e.active && e.goal > 0 && ca >= e.goal ? N(e.prime) : 0;
    return { e, n: sA.length, ca, com, salary, prime, total: salary + com + prime };
  }).filter(x => x.e.active || x.n);
}
function finSummary(r, fixed){
  const sA = salesIn(r), ex = expIn(r), pr = payroll(r, fixed);
  const rec = sum(sA, s => s.total), dep = sum(ex, x => x.amount);
  const com = sum(sA, saleCom), sal = sum(pr, x => x.salary), primes = sum(pr, x => x.prime);
  const svcCA = sum(sA, saleSvcNet);
  const byPay = {}; PAYS.forEach(p => { byPay[p] = sum(sA.filter(s => s.payment === p), s => s.total); });
  const ardoise = sum(DB.payments.filter(p => inRange(p.date, r)), p => p.amount);
  const charges = dep + com + sal + primes;
  return { sales: sA, expenses: ex, payroll: pr, n: sA.length, rec, dep, com, sal, primes, charges, benef: rec - charges,
           svcCA, prodCA: rec - svcCA, byPay, ardoise };
}

const onLeave = (empId, iso) => DB.leaves.some(l => l.employeId === empId && iso >= l.from && iso <= l.to);
const isOff = (e, iso) => (e.offDays || []).includes(wdOf(iso));
const lowStock = () => DB.products.filter(p => p.min > 0 && p.qty <= p.min);
const myRdv = () => isGerant() ? DB.rdv : DB.rdv.filter(r => r.employeId === meId());
const pendingWeb = () => myRdv().filter(r => r.source === "web" && r.status === "attente" && r.date >= todayISO());
function rdvIssues(r, selfId){
  const out = [], e = emp(r.employeId);
  if (!e) return out;
  if (isOff(e, r.date)) out.push(e.name + " est en repos le " + WDAY[wdOf(r.date)].toLowerCase() + ".");
  if (onLeave(e.id, r.date)) out.push(e.name + " est en congé ce jour-là.");
  const a = hmToMin(r.time), b = a + svcDur(r.serviceId);
  if (a < hmToMin(e.hStart) || b > hmToMin(e.hEnd)) out.push("En dehors des horaires de " + e.name + " (" + e.hStart + " – " + e.hEnd + ").");
  const clash = DB.rdv.find(x => x.id !== selfId && x.employeId === e.id && x.date === r.date && x.status !== "annule" &&
    a < hmToMin(x.time) + svcDur(x.serviceId) && hmToMin(x.time) < b);
  if (clash) out.push("Chevauche le rendez-vous de " + clash.time + " (" + clash.clientName + ").");
  return out;
}

/* ---------- libellés ---------- */
const PAY_LBL = { espece: ["Espèces", "ok", "cash"], carte: ["Carte", "info", "card"], credit: ["Crédit", "warn", "book"] };
const payBadge = p => { const l = PAY_LBL[p] || PAY_LBL.espece; return `<span class="badge ${l[1]}">${l[0]}</span>`; };
const ST_LBL = { attente: ["En attente", "warn"], confirme: ["Confirmé", "info"], fait: ["Terminé", "ok"], annule: ["Annulé", "bad"] };
const stBadge = s => { const l = ST_LBL[s] || ST_LBL.attente; return `<span class="badge ${l[1]}">${l[0]}</span>`; };
const emptyBox = (icon, title, text = "") => `<div class="empty">${ic(icon, 30)}<b>${esc(title)}</b>${esc(text)}</div>`;
const pageH = (title, sub, acts = "") => `<div class="page-h"><div class="tt"><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div>${acts ? `<div class="acts">${acts}</div>` : ""}</div>`;
const sheetH = title => `<div class="sheet-h"><h3 class="trunc">${esc(title)}</h3><button class="icbtn" onclick="closeSheet()" aria-label="Fermer">${ic("x", 18)}</button></div>`;
const opt = (v, label, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(label)}</option>`;
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
const nval = id => Math.max(0, N(val(id).replace(",", ".")));

/* ---------- navigation ---------- */
const VIEWS = {};
const NAV = [
  { r: "dash",        t: "Accueil",          i: "home",     g: "Quotidien", emp: true },
  { r: "caisse",      t: "Caisse",           i: "cash",     g: "Quotidien", emp: true },
  { r: "agenda",      t: "Agenda",           i: "calendar", g: "Quotidien", emp: true },
  { r: "ventes",      t: "Ventes",           i: "receipt",  g: "Quotidien", emp: true },
  { r: "employes",    t: "Équipe",           i: "users",    g: "Salon" },
  { r: "planning",    t: "Planning",         i: "clock",    g: "Salon" },
  { r: "clients",     t: "Clients",          i: "user",     g: "Salon" },
  { r: "prestations", t: "Prestations",      i: "scissors", g: "Salon" },
  { r: "stock",       t: "Stock",            i: "box",      g: "Salon" },
  { r: "finances",    t: "Finances",         i: "wallet",   g: "Pilotage" },
  { r: "stats",       t: "Statistiques",     i: "chart",    g: "Pilotage" },
  { r: "cloture",     t: "Clôture de caisse", i: "file",    g: "Pilotage" },
  { r: "export",      t: "Export comptable", i: "sheet",    g: "Pilotage" },
  { r: "reglages",    t: "Réglages",         i: "settings", g: "Pilotage" },
];
const EMP_ROUTES = ["dash", "caisse", "agenda", "ventes"];
const TABS_GERANT = ["dash", "caisse", "agenda", "employes", "more"];

const route = () => location.hash.replace(/^#/, "").split("/")[0] || "dash";
function go(r){ if (route() === r) render(); else location.hash = "#" + r; }

let _lastRoute = null, _pendingRender = false, _sheetOpen = false;

function render(){
  if (LOCK_MODE === "pin"){ _pendingRender = true; return; }   // création de code en cours : on ne touche à rien
  _pendingRender = false;
  if (!DB.setup){ showOnboarding(); return; }
  if (!authOk()){ showLock(); return; }
  hideLock();
  let r = route();
  if (!VIEWS[r] || (!isGerant() && !EMP_ROUTES.includes(r))){ r = "dash"; history.replaceState(null, "", "#dash"); }
  const app = $("#app");
  let html;
  try { html = VIEWS[r](); }
  catch (e){
    console.error(e);
    html = `<div class="card">${emptyBox("alert", "Cette page n'a pas pu s'afficher", "Vos données sont intactes.")}
      <div class="btn-row"><button class="btn ghost" onclick="go('dash')">Retour à l'accueil</button><button class="btn" onclick="location.reload()">Recharger</button></div></div>`;
  }
  app.innerHTML = html;
  app.classList.toggle("has-paybar", !!$(".paybar", app));
  if (r !== _lastRoute){
    _lastRoute = r;
    app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter");
    window.scrollTo(0, 0);
  }
  paintChrome(r);
}
/* re-rendu « poli » (après une synchro) : n'interrompt jamais une saisie en cours */
function softRender(){
  const a = document.activeElement;
  const typing = a && $("#app").contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  if (_sheetOpen || !$("#dlgBg").hidden || typing || LOCK_MODE === "onb"){ _pendingRender = true; return; }
  render();
}

function syncVisual(){
  const st = (typeof SYNC !== "undefined" && syncOn()) ? SYNC.status : "off";
  return ({
    off:     { i: "cloudOff", c: "",          l: "Synchro cloud désactivée" },
    ok:      { i: "cloud",    c: "ok",        l: "Synchronisé" },
    sync:    { i: "refresh",  c: "gold spin", l: "Synchronisation…" },
    offline: { i: "cloudOff", c: "warn",      l: "Hors ligne — enregistré sur l'appareil" },
    error:   { i: "alert",    c: "bad",       l: "Erreur de synchro" },
  })[st] || { i: "cloudOff", c: "", l: "" };
}
function paintChrome(r){
  r = r || route();
  const pend = pendingWeb().length, low = isGerant() ? lowStock().length : 0;
  const cnt = n => (n.r === "agenda" && pend) ? `<span class="cnt">${pend}</span>` : (n.r === "stock" && low) ? `<span class="cnt">${low}</span>` : "";
  const items = isGerant() ? NAV : NAV.filter(n => n.emp);
  let h = "", g = "";
  items.forEach(n => {
    if (n.g !== g){ g = n.g; h += `<div class="grp">${g}</div>`; }
    h += `<a href="#${n.r}" class="${n.r === r ? "on" : ""}">${ic(n.i, 19)}<span>${n.t}</span>${cnt(n)}</a>`;
  });
  $("#sideNav").innerHTML = h;
  const tabs = isGerant() ? TABS_GERANT : EMP_ROUTES;
  $("#tabbar").innerHTML = tabs.map(t => {
    const n = t === "more" ? { r: "more", t: "Plus", i: "grid" } : NAV.find(x => x.r === t);
    const on = t === r || (t === "more" && !tabs.includes(r));
    return `<a href="#${n.r}" class="${on ? "on" : ""}">${ic(n.i, 22)}<span>${n.t}</span>${cnt(n)}</a>`;
  }).join("");
  $$("[data-brand-name]").forEach(el => { el.textContent = DB.salon.name || "Salon Gérant"; });
  $$("[data-brand-sub]").forEach(el => { el.textContent = DB.salon.tagline || "Gestion du salon"; });
  $$("[data-emblem]").forEach(el => { el.textContent = (DB.salon.name || "G").trim().charAt(0).toUpperCase() || "G"; });
  document.title = (DB.salon.name || "Salon") + " — Gérant";
  paintStatus();
}
function paintStatus(){
  const v = syncVisual(), m = me();
  const lockBtn = pinEnabled() ? `<button class="icbtn" onclick="lockNow()" title="Verrouiller" aria-label="Verrouiller">${ic("lock", 18)}</button>` : "";
  const syncBtn = `<button class="icbtn ${v.c}" onclick="syncTap()" title="${esc(v.l)}" aria-label="${esc(v.l)}">${ic(v.i, 18)}</button>`;
  $("#topActions").innerHTML = syncBtn + lockBtn;
  $("#sideFoot").innerHTML = `<div class="who">${m ? empAv(m, "sm") : `<div class="av sm">${ic("shield", 16)}</div>`}
      <div class="grow"><b>${esc(m ? m.name : "Gérant")}</b><span>${esc(v.l)}</span></div></div>
    <div class="acts">${syncBtn}${lockBtn}</div>`;
}
function syncTap(){
  if (!syncOn()){ if (isGerant()) go("reglages"); else toast("Synchro cloud désactivée", "info"); return; }
  toast(syncVisual().l, "info"); syncCycle();
}

/* ---------- feuille (modal) ---------- */
function sheet(html){
  const s = $("#sheet");
  s.innerHTML = html; s.scrollTop = 0;
  $("#sheetBg").hidden = false; _sheetOpen = true;
  document.body.style.overflow = "hidden";
}
function closeSheet(){
  if (!_sheetOpen) return;
  $("#sheetBg").hidden = true; $("#sheet").innerHTML = ""; _sheetOpen = false;
  document.body.style.overflow = "";
  if (_pendingRender) render();
}

/* ---------- dialogues (remplacent confirm / prompt) ---------- */
let _dlgRes = null;
function closeDlg(v){
  const bg = $("#dlgBg"); bg.hidden = true; bg.innerHTML = "";
  const r = _dlgRes; _dlgRes = null;
  if (r) r(v);
  if (_pendingRender && !_sheetOpen) setTimeout(softRender, 0);
}
function openDlg(inner){
  if (_dlgRes) closeDlg(null);
  const bg = $("#dlgBg");
  bg.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true">${inner}</div>`;
  bg.hidden = false;
  return new Promise(res => { _dlgRes = res; });
}
function askConfirm(title, msg, o = {}){
  const p = openDlg(`<h4>${esc(title)}</h4>${msg ? `<p>${esc(msg)}</p>` : ""}
    <div class="btn-row"><button class="btn ghost" onclick="closeDlg(false)">${esc(o.cancel || "Annuler")}</button>
    <button class="btn ${o.danger ? "danger" : ""}" id="dlgOk" onclick="closeDlg(true)">${esc(o.ok || "Confirmer")}</button></div>`);
  $("#dlgOk").focus();
  return p.then(v => v === true);
}
function askValue(title, o = {}){
  const p = openDlg(`<h4>${esc(title)}</h4>${o.msg ? `<p>${esc(o.msg)}</p>` : ""}
    <form onsubmit="closeDlg(document.getElementById('dlgInp').value);return false">
    <label class="f"><span>${esc(o.label || "")}</span>
      <input class="inp" id="dlgInp" type="${o.type || "text"}" inputmode="${o.inputmode || "text"}" value="${esc(o.value == null ? "" : o.value)}" placeholder="${esc(o.placeholder || "")}" autocomplete="off"></label>
    ${o.hint ? `<div class="hint">${esc(o.hint)}</div>` : ""}
    <div class="btn-row"><button type="button" class="btn ghost" onclick="closeDlg(null)">Annuler</button>
    <button class="btn" type="submit">${esc(o.ok || "Valider")}</button></div></form>`);
  const inp = $("#dlgInp"); inp.focus(); try { inp.select(); } catch (e) {}
  return p.then(v => (v === null || v === undefined || v === false) ? null : String(v).trim());
}
function infoBox(title, html, ok = "Compris"){
  const p = openDlg(`<h4>${esc(title)}</h4>${html}<div class="btn-row"><button class="btn" id="dlgOk" onclick="closeDlg(true)">${esc(ok)}</button></div>`);
  $("#dlgOk").focus();
  return p;
}

/* ---------- toasts ---------- */
function toast(msg, type = "ok"){
  const box = $("#toasts"); if (!box) return;
  while (box.children.length >= 2) box.firstChild.remove();
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = ic(type === "bad" ? "alert" : type === "info" ? "info" : "check", 17) + "<span>" + esc(msg) + "</span>";
  box.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, type === "bad" ? 3600 : 2400);
}

/* ---------- impression / fichiers / partage ---------- */
function printDoc(html, cls){
  const p = $("#printArea");
  p.className = cls || ""; p.innerHTML = html;
  setTimeout(() => window.print(), 80);
}
function downloadBlob(blob, name){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
/* sur téléphone : feuille de partage (WhatsApp, e-mail, Fichiers…) ; sinon téléchargement */
async function shareOrDownload(blob, name){
  try {
    const f = new File([blob], name, { type: blob.type });
    if (matchMedia("(pointer:coarse)").matches && navigator.canShare && navigator.canShare({ files: [f] })){
      await navigator.share({ files: [f], title: name }); return;
    }
  } catch (e) { if (e && e.name === "AbortError") return; }
  downloadBlob(blob, name);
}
async function shareText(text, title){
  if (navigator.share){ try { await navigator.share({ title: title || DB.salon.name, text }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
}
function openWa(phone, text){
  if (!phoneDigits(phone)){ toast("Pas de numéro de téléphone", "bad"); return; }
  window.open("https://wa.me/" + telIntl(phone) + "?text=" + encodeURIComponent(text || ""), "_blank", "noopener");
}
async function copyText(t){
  try { await navigator.clipboard.writeText(t); toast("Copié"); }
  catch (e){
    const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copié"); } catch (e2) { toast("Copie impossible", "bad"); }
    ta.remove();
  }
}
const denied = () => { toast("Réservé au gérant", "bad"); };

/* ---------- écouteurs globaux ---------- */
window.addEventListener("hashchange", () => { _pendingRender = false; closeSheet(); if (_dlgRes) closeDlg(null); render(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("#dlgBg").hidden) closeDlg(null); else if (_sheetOpen) closeSheet();
});
document.addEventListener("DOMContentLoaded", () => {
  $("#sheetBg").addEventListener("click", e => { if (e.target === e.currentTarget) closeSheet(); });
  $("#dlgBg").addEventListener("click", e => { if (e.target === e.currentTarget) closeDlg(null); });
  $("#app").addEventListener("focusout", () => { if (_pendingRender) setTimeout(() => { if (_pendingRender) softRender(); }, 200); });
});
/* la même app ouverte dans un autre onglet : on recharge les données au lieu de les écraser */
window.addEventListener("storage", e => {
  if (e.key === KEY && e.newValue){ DB = load(); softRender(); }
});
