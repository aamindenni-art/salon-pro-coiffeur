/* =====================================================================
   Salon Pro — application (hors-ligne, données locales)
   Architecture : store (données) · ui (primitives) · views (écrans) · router
   ===================================================================== */
"use strict";

/* ======================= Icônes ======================= */
const ICONS = {
  home:'<path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  cal:'<rect x="4" y="5" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  cash:'<rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M6 9.5v5M18 9.5v5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  users:'<circle cx="9" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3.3 3.3 0 0 1 0 6.3M17 14.3a5.4 5.4 0 0 1 3.5 4.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  wallet:'<path d="M3 7.5A2 2 0 0 1 5 5.5h12v3H5.5v9H19v-3h-4.5a1.5 1.5 0 0 1 0-3H19a1.5 1.5 0 0 1 1.5 1.5v6A2 2 0 0 1 18.5 21h-13A2 2 0 0 1 3 19Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="15.5" cy="13" r="1.1" fill="currentColor"/>',
  scissors:'<circle cx="6" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.3 7.5 20 18M8.3 16.5 20 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  gear:'<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  plus:'<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>',
  search:'<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.4-3.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  edit:'<path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  x:'<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  check:'<path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  bell:'<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10.5 20a1.5 1.5 0 0 0 3 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  sms:'<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  whatsapp:'<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm0 2a7 7 0 1 1-3.6 13l-.4-.2-2.3.6.6-2.2-.2-.4A7 7 0 0 1 12 5Zm-2.3 3.3c-.2 0-.5 0-.7.3-.3.3-.9.9-.9 2s.9 2.3 1 2.5c.2.2 1.8 3 4.5 4 1.1.5 1.6.5 2.2.4.6-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.6-.3-1.4-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2-1.4-.4-.5-.7-1-.8-1.2 0-.2 0-.3.1-.4l.4-.5.2-.4c0-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4Z" fill="currentColor"/>',
  phone:'<path d="M5 4h3.5l1.8 4.5L8 10a11 11 0 0 0 6 6l1.5-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4v4h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  star:'<path d="m12 3.2 2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.2 6.9 18.8l1-5.6-4.1-4 5.7-.8Z" fill="currentColor"/>',
  receipt:'<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8h6M9 12h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  share:'<circle cx="18" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.3 10.8 15.7 6.4M8.3 13.2l7.4 4.4" stroke="currentColor" stroke-width="1.8"/>',
  sun:'<circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  download:'<path d="M12 3v12m0 0 4.2-4.2M12 15l-4.2-4.2M4 19h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  upload:'<path d="M12 21V9m0 0 4.2 4.2M12 9l-4.2 4.2M4 5h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V5a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  chart:'<path d="M4 20V4M4 20h16M8 17v-5M12 17V8M16 17v-8M20 17v-3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  trend:'<path d="M3 17l5-5 3.5 3.5L20 7M20 7h-4.5M20 7v4.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy:'<path d="M7 4h10v4a5 5 0 0 1-10 0ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 15h6M12 13v4M8 20h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" fill="currentColor"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" fill="currentColor"/>',
  back:'<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  install:'<rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v6m0 0 2.3-2.3M12 13l-2.3-2.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  info:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5M12 7.6v.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/>',
  backspace:'<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10l4 4M16 10l-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  clock:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5.2l3.3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  // --- Icônes barbier (prestations) ---
  clipper:'<rect x="7.5" y="8" width="9" height="11" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 8V5M11 8V4M13 8V4M15 8V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 12.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  razor:'<path d="M4 16.5 15.5 5a1.6 1.6 0 0 1 2.3 0 1.6 1.6 0 0 1 0 2.3L6.3 18.8a1.8 1.8 0 0 1-2.3-2.3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 7.5l3.4 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  beard:'<path d="M12 11c-1.4-1.9-2.9-2.4-4.8-2.4-2.4 0-3.9 1.4-3.9 1.4s.9 3.9 4.3 3.9c1.9 0 3.4-1.4 4.4-2.9 1 1.5 2.5 2.9 4.4 2.9 3.4 0 4.3-3.9 4.3-3.9s-1.5-1.4-3.9-1.4c-1.9 0-3.4.5-4.8 2.4Z" fill="currentColor"/>',
  comb:'<path d="M4 8h16v3H4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 11v6M8.5 11v6M11 11v6M13.5 11v6M16 11v6M18 11v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  kid:'<circle cx="12" cy="7" r="3.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8.6 4.2a4.6 4.6 0 0 1 6.8 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  dye:'<path d="M9.5 3h5v3.2l1.3 2.3V19a2 2 0 0 1-2 2h-3.6a2 2 0 0 1-2-2V8.5L9.5 6.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.2 12.5h7.6" stroke="currentColor" stroke-width="1.5"/>',
};

// Choisit une icône barbier d'après le nom/catégorie de la prestation (sinon ciseaux).
function svcIcon(name, category) {
  const t = ((name || "") + " " + (category || "")).toLowerCase();
  if (/(enfant|kid|garç|gar[cç]on|petit)/.test(t)) return "kid";
  if (/(teinture|couleur|colorat|m[èe]che|coloration|henn)/.test(t)) return "dye";
  if (/(barbe|rasage|rasoir|moustache|contour|taille)/.test(t)) return "razor";
  if (/(d[ée]grad|fade|tondeuse|coupe|cheveux|homme)/.test(t)) return "clipper";
  if (/(brushing|coiffage|shampoing|shampooing|soin|lissage|s[èe]chage)/.test(t)) return "comb";
  return "scissors";
}

/* ===================== Réservations en ligne (Supabase) =====================
   Côté coiffeur : les réservations faites sur la page publique rentrent ici.
   Laissez vide = désactivé (rien ne change). Pour activer, renseignez :
     url + anonKey  → les MÊMES que dans reservation/index.html
     secret         → le code choisi dans supabase-schema.sql
   Les 3 valeurs se collent ci-dessous, c'est le seul réglage à faire. */
// Config des réservations en ligne. URL + clé publishable pré-remplies (sans danger,
// comme sur la page publique). Le CODE SECRET reste privé : il n'est JAMAIS dans ce
// fichier public — il se saisit une fois dans Réglages et vit sur le téléphone du coiffeur.
const ONLINE_DEFAULT = { url: "https://uzwbkjpjznduyftkwyrs.supabase.co", anonKey: "sb_publishable_fjvm2tQu1smKQT84-HltqQ_RJ0jW19G" };
function onlineCfg() { const o = (typeof DB !== "undefined" && DB.salon && DB.salon.online) || {}; return { url: o.url || ONLINE_DEFAULT.url, anonKey: o.anonKey || ONLINE_DEFAULT.anonKey, secret: o.secret || "" }; }
function onlineOn() { const c = onlineCfg(); return !!(c.url && c.anonKey && c.secret); }
let _sb = null, _sbKey = "", onlineBookings = [], onlineLoaded = false, onlineErr = "", onlineLoading = false;

async function sbClient() {
  const c = onlineCfg();
  if (_sb && _sbKey === c.url + c.anonKey) return _sb;   // recrée si les clés changent
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
  _sb = createClient(c.url, c.anonKey); _sbKey = c.url + c.anonKey;
  return _sb;
}
// Charge les réservations à venir (en attente + confirmées). Re-render à la fin.
async function loadOnlineBookings(rerender) {
  if (!onlineOn() || onlineLoading) return;
  onlineLoading = true; onlineErr = "";
  try {
    const sb = await sbClient();
    const { data, error } = await sb.rpc("get_bookings", { secret: onlineCfg().secret, from_date: today() });
    if (error) throw error;
    onlineBookings = (data || []).filter((b) => b.status !== "cancelled");
    onlineLoaded = true;
  } catch (e) { onlineErr = (e && e.message) || "Connexion impossible"; console.warn("Réservations en ligne :", e); }
  finally { onlineLoading = false; if (rerender) render(); }
}
function onlinePending() { return onlineBookings.filter((b) => b.status === "pending").length; }
async function setBookingStatus(id, status) {
  const sb = await sbClient();
  const { error } = await sb.rpc("set_booking_status", { secret: onlineCfg().secret, booking_id: id, new_status: status });
  if (error) throw error;
}
const phoneKey = (p) => String(p || "").replace(/\D/g, "").slice(-9);
// Accepter : crée le client + la prestation si besoin, pose le RDV confirmé, puis confirme en ligne.
async function acceptOnline(b) {
  let cl = DB.clients.find((c) => phoneKey(c.phone) && phoneKey(c.phone) === phoneKey(b.client_phone));
  if (!cl) { cl = { id: uid(), createdAt: today(), name: b.client_name || "Client", phone: b.client_phone || "", email: "", notes: "Réservation en ligne" }; DB.clients.push(cl); }
  let sv = DB.services.find((s) => s.name.trim().toLowerCase() === String(b.service_name || "").trim().toLowerCase());
  if (!sv) { sv = { id: uid(), name: b.service_name || "Prestation", price: b.price || 0, duration: b.duration || 30, category: "En ligne" }; DB.services.push(sv); }
  DB.appointments.push({ id: uid(), reminded: false, clientId: cl.id, date: b.date, time: b.time, serviceIds: [sv.id], status: "confirme", online: true, place: b.place || "salon", address: b.address || "" });
  save();
  b.status = "confirmed";   // optimiste : le RDV est dans l'agenda → on sort la carte des « en attente » (pas de double-ajout)
  render();
  try { await setBookingStatus(b.id, "confirmed"); toast("Rendez-vous confirmé ✓"); }
  catch (e) { toast("RDV ajouté à l'agenda (synchro en ligne à refaire)", "info"); }
}
async function refuseOnline(b) {
  try { await setBookingStatus(b.id, "cancelled"); onlineBookings = onlineBookings.filter((x) => x.id !== b.id); toast("Réservation refusée — créneau libéré"); render(); }
  catch (e) { toast("Échec : réessayez", "bad"); }
}
function viewOnline(c) {
  const sub = !onlineOn() ? "Non activé" : (onlineLoading && !onlineLoaded ? "Chargement…" : onlineErr && !onlineLoaded ? "Hors ligne" : `${onlinePending()} en attente`);
  const head = pageHead("Réservations en ligne", sub, onlineOn() ? `<button class="btn primary sm" id="onRefresh">${svg("history")}Actualiser</button>` : "");
  if (!onlineOn()) {
    c.innerHTML = head + `<div class="card"><div class="card-b">${emptyState("cal", "Pas encore activé", "Collez vos clés Supabase (url, anonKey, secret) en haut de app.js : les réservations des clients arriveront ici toutes seules.")}</div></div>`;
    return;
  }
  const row = (b, confirmed) => {
    const lieu = b.place === "home" ? `À domicile — ${esc(b.address || "")}` : "Au salon";
    return `<div class="card on-card"><div class="card-b">
      <div class="row" style="align-items:flex-start">
        <div class="grow"><b>${esc(b.client_name)}</b><span class="sub">${esc(b.service_name)} · ${money(b.price)}</span></div>
        <span class="pill accent display" style="font-size:15px">${esc(b.time)}</span></div>
      <div class="on-meta">${svg("cal")}<span>${fmtDFull(b.date)}</span></div>
      <div class="on-meta">${svg(b.place === "home" ? "home" : "scissors")}<span>${lieu}</span></div>
      <a class="on-meta on-tel" href="tel:${esc(b.client_phone)}">${svg("phone")}<span>${esc(b.client_phone)}</span></a>
      <div class="on-actions">${confirmed
        ? `<span class="pill good" style="padding:8px 12px">${svg("check")} Confirmé</span>`
        : `<button class="btn danger sm" data-refuse="${b.id}">Refuser</button><button class="btn primary sm grow" data-accept="${b.id}">${svg("check")}Accepter</button>`}</div>
    </div></div>`;
  };
  const pend = onlineBookings.filter((b) => b.status === "pending");
  const conf = onlineBookings.filter((b) => b.status === "confirmed");
  let body = "";
  if (onlineErr && !onlineLoaded) body += `<div class="card"><div class="card-b">${emptyState("info", "Connexion impossible", "Vérifiez internet ou les clés Supabase, puis Actualisez.")}</div></div>`;
  else if (!onlineLoaded) body += `<div class="card"><div class="card-b hint" style="text-align:center;padding:24px">Chargement…</div></div>`;
  else {
    body += `<div class="section-lbl">En attente (${pend.length})</div>`;
    body += pend.length ? pend.map((b) => row(b, false)).join("") : `<div class="card"><div class="card-b">${emptyState("check", "Tout est traité", "Aucune réservation en attente.")}</div></div>`;
    if (conf.length) body += `<div class="section-lbl">Confirmées à venir (${conf.length})</div>` + conf.map((b) => row(b, true)).join("");
  }
  c.innerHTML = head + body;
  const rf = $("#onRefresh"); if (rf) rf.onclick = () => { onlineLoaded = false; loadOnlineBookings(true); };
  $$("[data-accept]", c).forEach((el) => el.onclick = () => { const b = onlineBookings.find((x) => x.id === el.dataset.accept); if (b) acceptOnline(b); });
  $$("[data-refuse]", c).forEach((el) => el.onclick = () => { const b = onlineBookings.find((x) => x.id === el.dataset.refuse); if (b) confirmSheet("Refuser cette réservation ?", "Le créneau sera libéré pour d'autres clients.", () => refuseOnline(b)); });
  if (!onlineLoaded && !onlineLoading) loadOnlineBookings(true);
}
function onlineHelpSheet() {
  openSheet("Activer les réservations en ligne", `
    <p style="margin:0 0 10px;font-size:14px;color:var(--muted)">Une seule fois, dans votre compte <b>Supabase</b> (gratuit) :</p>
    <ol style="margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.7">
      <li>Ouvrez le fichier <b>supabase-schema.sql</b> (dossier reservation), remplacez le code secret, puis collez-le dans Supabase → <b>SQL Editor</b> → <b>RUN</b>.</li>
      <li>Allez dans <b>Settings → API</b> et copiez :<br>• <b>Project URL</b><br>• la clé <b>anon public</b></li>
      <li>Collez l'URL, la clé et votre <b>code secret</b> dans les 3 champs, puis <b>Enregistrer</b>.</li>
    </ol>
    <p style="margin:0;font-size:13px;color:var(--muted)">Astuce : appuyez sur <b>Tester</b> pour vérifier la connexion. Mettez aussi l'URL et la clé anon dans la page publique <b>reservation/</b> pour que les créneaux pris se bloquent.</p>`,
    { footer: `<button class="btn primary" data-close>${svg("check")}Compris</button>`, onMount(root) { $("[data-close]", root).onclick = closeSheet; } });
}
function svg(name, cls) { return `<svg viewBox="0 0 24 24" ${cls ? `class="${cls}"` : ""} fill="none" aria-hidden="true">${ICONS[name] || ""}</svg>`; }

// Emblème de marque (ciseaux + rasoir + étoile, noir & or). Réutilisé partout :
// barre du haut, écran de verrouillage, onboarding. id de dégradé unique par appel
// pour éviter les collisions quand plusieurs emblèmes coexistent dans le DOM.
let _bmSeq = 0;
function brandMark(cls) {
  const g = "bm" + (++_bmSeq);
  return `<svg ${cls ? `class="${cls}" ` : ""}viewBox="0 0 160 160" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d290"/><stop offset="1" stop-color="#a07d2b"/></linearGradient></defs>
    <circle cx="80" cy="80" r="62" fill="none" stroke="url(#${g})" stroke-width="1.6" opacity=".55"/>
    <circle cx="80" cy="80" r="52" fill="none" stroke="url(#${g})" stroke-width=".8" opacity=".35"/>
    <g transform="translate(80,82) rotate(-50) scale(3.1) translate(-12,-12)" fill="none" stroke="url(#${g})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.3 7.5 20 18M8.3 16.5 20 6"/></g>
    <g transform="translate(80,82) rotate(50) scale(3.1) translate(-15,-7)" fill="none" stroke="url(#${g})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="5" width="11" height="4" rx="2"/><path d="M12.6 5.2 L27 3.5 a1.4 1.4 0 0 1 1.1 2.1 L13.4 9"/><circle cx="12.7" cy="7" r=".9" fill="url(#${g})"/></g>
    <path d="M80 11 l1.8 4.6 4.9.6-3.5 3.3.9 4.8-4.1-2.3-4.1 2.3.9-4.8-3.5-3.3 4.9-.6z" fill="url(#${g})" opacity=".85"/>
  </svg>`;
}

/* ======================= Utilitaires ======================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const haptic = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ======================= Store (données locales) ======================= */
const KEY = "salonpro";
const SCHEMA = 2;
// Anciens textes par défaut : si l'utilisateur les a gardés tels quels, on les met à jour.
const OLD_REMINDER_DEFAULTS = [
  "Bonjour {client}, petit rappel : vous avez rendez-vous {date} à {heure} chez {salon}. À bientôt !",
];
const OLD_RECEIPT_DEFAULTS = [
  "Merci de votre visite — à bientôt !",
];

const BASE = () => ({
  version: SCHEMA,
  salon: {
    name: "Mon salon", currency: "DA", phone: "", address: "",
    reminderTemplate: "Bonjour {client}, nous vous rappelons votre rendez-vous {date} à {heure} chez {salon}. En cas d'empêchement, merci de nous prévenir.",
    receiptFooter: "Merci ! N'hésitez pas à nous recommander à vos proches.",
    defaultDuration: 30, onboarded: false, pin: "", pinQuestion: "", pinAnswer: "",
  },
  services: [], clients: [], appointments: [], sales: [], expenses: [], reminders: [],
});

let DB = loadDB();

function loadDB() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { console.warn("load", e); }
  return BASE();
}
function migrate(d) {
  const base = BASE();
  d = Object.assign(base, d);
  d.salon = Object.assign(base.salon, d.salon || {});
  // Met à jour les textes par défaut si l'utilisateur a gardé un ancien modèle.
  if (OLD_REMINDER_DEFAULTS.includes(d.salon.reminderTemplate)) d.salon.reminderTemplate = base.salon.reminderTemplate;
  if (OLD_RECEIPT_DEFAULTS.includes(d.salon.receiptFooter)) d.salon.receiptFooter = base.salon.receiptFooter;
  ["services", "clients", "appointments", "sales", "expenses", "reminders"].forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
  d.version = SCHEMA;
  return d;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast("Stockage plein — faites une sauvegarde", "bad"); } }
const cur = () => DB.salon.currency || "DA";

/* --- Données d'exemple (optionnelles, choisies à l'onboarding) --- */
function loadExampleData() {
  const keepName = DB.salon.name, keepCur = DB.salon.currency;
  const d = BASE();
  d.salon.name = keepName && keepName !== "Mon salon" ? keepName : "Salon Prestige";
  d.salon.currency = keepCur || "DA"; d.salon.address = "Alger"; d.salon.onboarded = true;
  const S = [["Coupe homme", 800, 30, "Coupe"], ["Coupe + barbe", 1200, 45, "Coupe"], ["Dégradé", 1000, 40, "Coupe"],
    ["Taille de barbe", 500, 20, "Barbe"], ["Rasage traditionnel", 700, 30, "Barbe"], ["Coupe enfant", 600, 25, "Coupe"],
    ["Coloration", 2500, 90, "Soin"], ["Shampoing + coiffage", 900, 30, "Soin"]];
  d.services = S.map((s) => ({ id: uid(), name: s[0], price: s[1], duration: s[2], category: s[3] }));
  const C = [["Karim Benali", "0661 23 45 67"], ["Yacine Hadj", "0770 11 22 33"], ["Sofiane Meziane", "0555 98 76 54"],
    ["Amine Cherif", "0661 44 55 66"], ["Nabil Saidi", "0770 33 44 55"], ["Riad Belkacem", "0540 12 34 56"],
    ["Walid Ouali", "0661 77 88 99"], ["Toufik Brahimi", "0555 10 20 30"]];
  const now = new Date();
  d.clients = C.map((c, i) => ({ id: uid(), name: c[0], phone: c[1], email: "", notes: i === 0 ? "Préfère dégradé bas, ciseaux" : "", createdAt: isoDate(addDays(now, -(40 - i * 4))) }));
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  for (let day = 45; day >= 0; day--) {
    const date = addDays(now, -day); const n = day < 2 ? rnd(3, 6) : rnd(1, 5);
    for (let k = 0; k < n; k++) {
      const items = []; const main = d.services[rnd(0, 2)]; items.push({ serviceId: main.id, name: main.name, price: main.price, qty: 1 });
      if (Math.random() < .4) { const s = d.services[rnd(3, 4)]; items.push({ serviceId: s.id, name: s.name, price: s.price, qty: 1 }); }
      const total = items.reduce((s, it) => s + it.price * it.qty, 0);
      d.sales.push({ id: uid(), clientId: Math.random() < .78 ? d.clients[rnd(0, d.clients.length - 1)].id : null, date: isoDate(date), items, total, mode: Math.random() < .25 ? "Carte" : "Espèces" });
    }
  }
  const E = [["Loyer du local", 35000, "Loyer"], ["Produits (gel, cire, lames)", 12000, "Produits"], ["Électricité", 6500, "Charges"],
    ["Serviettes & consommables", 4200, "Produits"], ["Publicité réseaux", 3000, "Marketing"]];
  for (let m = 1; m >= 0; m--) E.forEach((e) => d.expenses.push({ id: uid(), label: e[0], amount: e[1], category: e[2], date: isoDate(new Date(now.getFullYear(), now.getMonth() - m, rnd(3, 25))) }));
  const hours = ["09:30", "10:15", "11:00", "14:00", "15:30", "16:45", "17:30"];
  for (let i = 0; i < 6; i++) {
    const date = addDays(now, rnd(0, 5)); const s = d.services[rnd(0, 5)];
    d.appointments.push({ id: uid(), clientId: d.clients[rnd(0, d.clients.length - 1)].id, date: isoDate(date), time: hours[rnd(0, 6)], serviceIds: [s.id], status: i < 2 ? "confirme" : "planifie", reminded: false });
  }
  DB = d; save();
}

/* ======================= Sauvegarde / restauration ======================= */
function backupText() { return JSON.stringify(DB, null, 2); }
function backupFilename() { return `salon-pro-sauvegarde-${isoDate(new Date())}.json`; }
async function shareOrDownloadBackup() {
  const text = backupText(); const name = backupFilename();
  const file = (() => { try { return new File([text], name, { type: "application/json" }); } catch (e) { return null; } })();
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Sauvegarde Salon Pro" }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  // Téléchargement de secours
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); toast("Sauvegarde téléchargée");
  } catch (e) { toast("Impossible de partager ici", "bad"); }
}
function importFromText(txt) {
  const d = JSON.parse(txt);
  if (!d || typeof d !== "object" || !Array.isArray(d.clients)) throw new Error("format");
  DB = migrate(d); save();
}

/* ======================= Format ======================= */
function money(n) { return (Math.round(Number(n) || 0)).toLocaleString("fr-FR").replace(/ | /g, " ") + " " + cur(); }
function moneyShort(n) { n = Number(n) || 0; return Math.abs(n) >= 1000 ? (n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + "k" : String(Math.round(n)); }
function initials(name) { return String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOISL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const JOURSL = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
function parseD(iso) { return new Date(iso + "T00:00"); }
function isoDate(d) { d = new Date(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtD(iso) { const d = parseD(iso); return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtDShort(iso) { const d = parseD(iso); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`; }
function fmtDFull(iso) { const d = parseD(iso); return `${JOURSL[d.getDay()]} ${d.getDate()} ${MOISL[d.getMonth()]}`; }
const today = () => isoDate(new Date());
const monthKey = (iso) => iso.slice(0, 7);
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ======================= Agrégations ======================= */
const clientName = (id) => { const c = DB.clients.find((c) => c.id === id); return c ? c.name : "Client de passage"; };
const clientById = (id) => DB.clients.find((c) => c.id === id);
const serviceById = (id) => DB.services.find((s) => s.id === id);
const revenueOn = (iso) => DB.sales.filter((v) => v.date === iso).reduce((s, v) => s + v.total, 0);
const revenueMonth = (mk) => DB.sales.filter((v) => monthKey(v.date) === mk).reduce((s, v) => s + v.total, 0);
const expenseMonth = (mk) => DB.expenses.filter((e) => monthKey(e.date) === mk).reduce((s, e) => s + Number(e.amount), 0);
const clientSpend = (id) => DB.sales.filter((v) => v.clientId === id).reduce((s, v) => s + v.total, 0);
const clientVisits = (id) => DB.sales.filter((v) => v.clientId === id).length;
const clientLast = (id) => { const ds = DB.sales.filter((v) => v.clientId === id).map((v) => v.date).sort(); return ds.length ? ds[ds.length - 1] : null; };

/* ======================= Thème ======================= */
function themeMode() { try { return localStorage.getItem("salonpro_theme") || "system"; } catch (e) { return "system"; } }
function isDark() { const m = themeMode(); if (m === "dark") return true; if (m === "light") return false; return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; }
function setTheme(m) {
  const root = document.documentElement;
  if (m === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", m);
  try { m === "system" ? localStorage.removeItem("salonpro_theme") : localStorage.setItem("salonpro_theme", m); } catch (e) {}
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = isDark() ? "#1b1a16" : "#9c7619";
  renderChrome();
}
(function () { const m = themeMode(); if (m !== "system") document.documentElement.setAttribute("data-theme", m); })();

/* ======================= Primitives UI ======================= */
let toastTimer;
function toast(msg, kind) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  const ic = kind === "bad" ? "x" : kind === "info" ? "info" : "check";
  t.innerHTML = svg(ic) + `<span>${esc(msg)}</span>`;
  t.style.color = ""; t.style.background = "";
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2600);
  haptic(kind === "bad" ? 30 : 8);
}

/* Bottom-sheet (mobile) / modal centré (bureau) */
function openSheet(title, bodyHTML, opts = {}) {
  closeSheet();
  const root = $("#sheet-root");
  const footer = opts.footer ? `<div class="sheet-f">${opts.footer}</div>` : "";
  root.innerHTML = `<div class="scrim ${opts.center ? "center" : ""}" id="scrim">
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-h"><h3>${esc(title)}</h3><button class="iconbtn sm plain" data-close aria-label="Fermer">${svg("x")}</button></div>
      <div class="sheet-b">${bodyHTML}</div>${footer}
    </div></div>`;
  const scrim = $("#scrim");
  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) closeSheet(); });
  $$("[data-close]", root).forEach((b) => b.onclick = closeSheet);
  document.addEventListener("keydown", escClose);
  if (opts.onMount) opts.onMount(root);
  const first = $(".sheet-b input, .sheet-b select, .sheet-b textarea", root);
  if (first && opts.autofocus !== false && window.matchMedia("(min-width:640px)").matches) setTimeout(() => first.focus(), 60);
  return root;
}
function closeSheet() { const r = $("#sheet-root"); if (r) r.innerHTML = ""; document.removeEventListener("keydown", escClose); }
function escClose(e) { if (e.key === "Escape") closeSheet(); }

function confirmSheet(title, message, onYes, opts = {}) {
  openSheet(title, `<p style="margin:2px 0 4px;color:var(--muted)">${esc(message)}</p>`, {
    center: true,
    footer: `<button class="btn ghost" data-no>Annuler</button><button class="btn ${opts.danger === false ? "primary" : "danger"}" data-yes>${esc(opts.yes || "Confirmer")}</button>`,
    onMount(root) {
      $("[data-no]", root).onclick = closeSheet;
      $("[data-yes]", root).onclick = () => { closeSheet(); onYes(); };
    },
  });
}

function pageHead(title, sub, actions) {
  return `<div class="page-h"><div><div class="h">${title}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ""}</div>${actions ? `<div>${actions}</div>` : ""}</div>`;
}
function emptyState(icon, title, text) {
  return `<div class="empty"><div class="ic">${svg(icon)}</div><h4>${esc(title)}</h4>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
}
const STATUS = { planifie: ["mut", "planifié"], confirme: ["accent", "confirmé"], termine: ["good", "terminé"], annule: ["bad", "annulé"] };
function statusPill(s) { const [k, l] = STATUS[s] || ["mut", s]; return `<span class="pill ${k}">${l}</span>`; }

/* ======================= Graphiques (Chart.js) ======================= */
let charts = [];
function destroyCharts() { charts.forEach((c) => { try { c.destroy(); } catch (e) {} }); charts = []; }
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function hexA(hex, a) { hex = hex.trim(); if (hex.startsWith("rgb")) return hex; if (hex.length === 4) hex = "#" + [...hex.slice(1)].map((c) => c + c).join(""); const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${a})`; }
function palette(base, n) { return Array.from({ length: n }, (_, i) => hexA(base, 1 - i * 0.13)); }
function tooltipCfg(fmt) { return { backgroundColor: cssVar("--fg"), titleColor: hexA("#ffffff", .85), bodyColor: "#fff", padding: 10, cornerRadius: 9, displayColors: false, titleFont: { family: "DM Sans", size: 12 }, bodyFont: { family: "Oswald", size: 14 }, callbacks: { label: (c) => fmt ? fmt(c.parsed.y ?? c.parsed) : c.formattedValue } }; }
function lineChart(ctx, data, fmt) {
  if (!ctx || !window.Chart) return;
  const accent = cssVar("--accent"), text = cssVar("--muted"), grid = cssVar("--border");
  const g = ctx.getContext("2d").createLinearGradient(0, 0, 0, 220); g.addColorStop(0, hexA(accent, .32)); g.addColorStop(1, hexA(accent, 0));
  charts.push(new Chart(ctx, { type: "line", data: { labels: data.map((d) => d.label), datasets: [{ data: data.map((d) => d.value), borderColor: accent, backgroundColor: g, fill: true, tension: .35, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: accent }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipCfg(fmt) }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: text, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } }, y: { grid: { color: grid }, border: { display: false }, beginAtZero: true, ticks: { color: text, font: { size: 11 }, callback: moneyShort, maxTicksLimit: 5 } } } } }));
}
function donutChart(ctx, data, base, fmt) {
  if (!ctx || !window.Chart || !data.length) { if (ctx) ctx.parentElement.innerHTML = `<div class="empty-mini" style="color:var(--muted);text-align:center;padding:24px">Aucune donnée</div>`; return; }
  const color = cssVar(base || "--accent"), text = cssVar("--muted"), surface = cssVar("--surface");
  charts.push(new Chart(ctx, { type: "doughnut", data: { labels: data.map((d) => d.label), datasets: [{ data: data.map((d) => d.value), backgroundColor: palette(color, data.length), borderWidth: 2, borderColor: surface }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { color: text, boxWidth: 10, boxHeight: 10, padding: 10, font: { size: 12 } } }, tooltip: tooltipCfg(fmt) } } }));
}
function barsChart(ctx, data) {
  if (!ctx || !window.Chart) return;
  const accent = cssVar("--accent"), bad = cssVar("--bad"), text = cssVar("--muted"), grid = cssVar("--border");
  charts.push(new Chart(ctx, { type: "bar", data: { labels: data.map((d) => d.label), datasets: [
    { label: "Revenus", data: data.map((d) => d.rev), backgroundColor: accent, borderRadius: 6, maxBarThickness: 22 },
    { label: "Charges", data: data.map((d) => d.exp), backgroundColor: bad, borderRadius: 6, maxBarThickness: 22 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", align: "end", labels: { color: text, boxWidth: 11, boxHeight: 11, padding: 10, font: { size: 12 } } }, tooltip: tooltipCfg(money) }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: text, font: { size: 11 } } }, y: { grid: { color: grid }, border: { display: false }, beginAtZero: true, ticks: { color: text, font: { size: 11 }, callback: moneyShort, maxTicksLimit: 5 } } } } }));
}

/* ======================= Routeur & chrome ======================= */
const NAV = [
  { key: "dash", label: "Accueil", icon: "home" },
  { key: "rdv", label: "Agenda", icon: "cal" },
  { key: "pos", label: "Caisse", icon: "cash" },
  { key: "clients", label: "Clients", icon: "users" },
  { key: "fin", label: "Finances", icon: "wallet" },
];
const VIEWS = { dash: viewDash, rdv: viewRdv, pos: viewPos, clients: viewClients, fin: viewFin, services: viewServices, settings: viewSettings, coupe: viewCoupe, online: viewOnline };
let route = "dash";

function go(key) { if (location.hash.slice(1) === key) render(); else location.hash = key; }
function onHash() { const k = location.hash.slice(1); route = VIEWS[k] ? k : "dash"; render(); }

function renderChrome() {
  const dark = isDark();
  $("#brand").textContent = DB.salon.name || "Salon Pro";
  const lg = $("#logo"); lg.classList.add("has-mark"); lg.innerHTML = brandMark("logo-mark");
  $("#btnTheme").innerHTML = svg(dark ? "sun" : "moon");
  const bl = $("#btnLock"); if (bl) bl.hidden = !DB.salon.pin;
  // nav
  const todayRdv = DB.appointments.filter((r) => r.date === today() && r.status !== "annule").length;
  $("#nav").innerHTML = NAV.map((n) => `<button data-nav="${n.key}" class="${route === n.key ? "active" : ""}">${svg(n.icon)}<span>${n.label}</span>${n.key === "rdv" && todayRdv ? `<span class="dot count">${todayRdv}</span>` : ""}</button>`).join("");
  $$("#nav [data-nav]").forEach((b) => b.onclick = () => { haptic(); go(b.dataset.nav); });
  $("#btnSettings").classList.toggle("active-ghost", route === "settings");
}
function render() {
  destroyCharts();
  if (route !== "pos") { const bar = $("#cartbar"); if (bar) bar.remove(); }
  renderChrome();
  const c = $("#content");
  (VIEWS[route] || viewDash)(c);
  window.scrollTo(0, 0);
}

/* ======================= Vue : Tableau de bord ======================= */
function viewDash(c) {
  const t = today(), mk = monthKey(t);
  const prevMk = monthKey(isoDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)));
  const revToday = revenueOn(t), revMonth = revenueMonth(mk), revPrev = revenueMonth(prevMk);
  const expMonth = expenseMonth(mk), profit = revMonth - expMonth;
  const monthSales = DB.sales.filter((v) => monthKey(v.date) === mk);
  const basket = monthSales.length ? Math.round(revMonth / monthSales.length) : 0;
  const delta = revPrev ? Math.round((revMonth - revPrev) / revPrev * 100) : 0;
  const todayRdv = DB.appointments.filter((r) => r.date === t && r.status !== "annule").sort((a, b) => a.time.localeCompare(b.time));
  // fidélité
  const active = DB.clients.filter((c) => clientVisits(c.id) > 0);
  const loyal = active.filter((c) => clientVisits(c.id) > 1);
  const retention = active.length ? Math.round(loyal.length / active.length * 100) : 0;
  // nouveaux clients ce mois
  const newClients = DB.clients.filter((c) => c.createdAt && monthKey(c.createdAt) === mk).length;
  // meilleur jour (par CA, 60 derniers jours)
  const byWeekday = Array(7).fill(0), cntWeekday = Array(7).fill(0);
  DB.sales.forEach((v) => { const d = parseD(v.date).getDay(); byWeekday[d] += v.total; cntWeekday[d]++; });
  let bestDay = -1, bestVal = -1; for (let i = 0; i < 7; i++) if (byWeekday[i] > bestVal) { bestVal = byWeekday[i]; bestDay = i; }

  const rev14 = []; for (let i = 13; i >= 0; i--) { const d = isoDate(addDays(new Date(), -i)); rev14.push({ label: `${parseD(d).getDate()}/${parseD(d).getMonth() + 1}`, value: revenueOn(d) }); }
  const rev14Total = rev14.reduce((s, x) => s + x.value, 0);
  const topClients = DB.clients.map((c) => ({ c, spend: clientSpend(c.id), v: clientVisits(c.id) })).filter((r) => r.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, 5);

  const kpi = (lab, val, icon, delta, cls = "") => `<div class="kpi"><div class="top"><div class="lab">${lab}</div><div class="ic">${svg(icon)}</div></div><div class="val ${cls}">${val}</div>${delta ? `<div class="delta">${delta}</div>` : ""}</div>`;

  c.innerHTML = pageHead(`Bonjour 👋`, capFirst(fmtDFull(t)),
    `<button class="btn primary sm" id="qnew">${svg("plus")}Vente</button>`) +
    `<div class="kpis" style="margin-bottom:14px">
      ${kpi("Aujourd'hui", money(revToday), "cash", `${todayRdv.length} RDV prévu${todayRdv.length > 1 ? "s" : ""}`)}
      ${kpi("Ce mois", money(revMonth), "chart", `<span class="${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}%</span> vs mois dernier`)}
      ${kpi("Bénéfice (mois)", money(profit), "wallet", `Charges : ${money(expMonth)}`, profit >= 0 ? "" : "down")}
      ${kpi("Panier moyen", money(basket), "receipt", `${monthSales.length} prestations`)}
      ${kpi("Fidélité", retention + "%", "star", `${loyal.length}/${active.length} reviennent`)}
      ${kpi("Clients", String(DB.clients.length), "users", `+${newClients} ce mois`)}
    </div>

    ${bestDay >= 0 && bestVal > 0 ? `<div class="insight"><div class="ic" style="background:var(--accent-soft);color:var(--accent-ink)">${svg("trophy")}</div><div><b>Votre meilleur jour : le ${JOURSL[bestDay]}</b><span>C'est le jour où vous encaissez le plus. Pensez-y pour vos promos et rappels.</span></div></div>` : ""}

    ${onlineOn() ? `<button class="promo" id="goOnline"><div class="ic">${svg("cal")}</div><div class="grow"><b>Réservations en ligne</b><span>${onlineLoaded ? (onlinePending() ? onlinePending() + " en attente de confirmation" : "Aucune en attente") : "Appuyez pour charger"}</span></div>${onlineLoaded && onlinePending() ? `<span class="dot count">${onlinePending()}</span>` : ""}<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>` : ""}

    <button class="promo" id="goCoupe"><div class="ic">${svg("sparkle")}</div><div class="grow"><b>Coupe idéale</b><span>Photo du client → la coupe qui lui va</span></div><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>


    <div class="card"><div class="card-h"><h3>Revenu — 14 jours</h3><span class="mut">${money(rev14Total)}</span></div>
      <div class="card-b"><div class="chart-wrap" style="height:200px"><canvas id="cRev"></canvas></div></div></div>

    <div class="card"><div class="card-h"><h3>Rendez-vous du jour</h3><button class="btn sm ghost" id="goRdv">Agenda</button></div>
      <div class="card-b" style="padding-top:4px">${todayRdv.length ? `<div class="list">${todayRdv.map((r) => {
        const names = r.serviceIds.map((id) => serviceById(id)?.name).filter(Boolean).join(", ");
        return `<div class="row"><span class="pill accent display" style="font-size:14px">${r.time}</span><div class="grow"><b>${esc(clientName(r.clientId))}</b><span class="sub">${esc(names || "—")}</span></div>${statusPill(r.status)}</div>`;
      }).join("")}</div>` : emptyState("cal", "Journée libre", "Aucun rendez-vous aujourd'hui.")}</div></div>

    ${topClients.length ? `<div class="card"><div class="card-h"><h3>Meilleurs clients</h3><span class="mut">par dépense</span></div>
      <div class="card-b" style="padding-top:4px"><div class="list">${topClients.map((r) => `<div class="row" data-client="${r.c.id}"><div class="avatar">${initials(r.c.name)}</div><div class="grow"><b>${esc(r.c.name)}</b><span class="sub">${r.v} visite${r.v > 1 ? "s" : ""}</span></div><b class="display" style="color:var(--accent-ink)">${money(r.spend)}</b></div>`).join("")}</div></div></div>` : ""}`;

  $("#qnew").onclick = () => go("pos");
  const gc = $("#goCoupe"); if (gc) gc.onclick = () => go("coupe");
  const go1 = $("#goOnline"); if (go1) go1.onclick = () => go("online");
  if (onlineOn() && !onlineLoaded && !onlineLoading) loadOnlineBookings(true);
  $("#goRdv").onclick = () => go("rdv");
  $$("[data-client]", c).forEach((el) => el.onclick = () => openClient(el.dataset.client));
  lineChart($("#cRev"), rev14, money);
}

/* ======================= Vue : Coupe idéale ======================= */
const FACE_SHAPES = [
  { key: "ovale", name: "Ovale",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="12" rx="6" ry="8.2"/></svg>`,
    recognize: "Visage équilibré, un peu plus long que large, mâchoire douce. La forme la plus polyvalente.",
    good: ["Dégradé (fade)", "Undercut", "Pompadour", "Quiff", "Crop texturé", "Raie sur le côté"],
    avoid: ["Franges qui couvrent tout le front", "Trop de volume déséquilibré"],
    tip: "Presque tout lui va — garde juste l'équilibre et ne cache pas ce beau visage." },
  { key: "rond", name: "Rond",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7.4"/></svg>`,
    recognize: "Largeur ≈ longueur, joues pleines, menton arrondi. Objectif : allonger le visage.",
    good: ["Pompadour", "Quiff", "Undercut avec volume", "Fade haut (high fade)", "Faux hawk"],
    avoid: ["Franges droites", "Côtés longs / volume sur les côtés", "Coupe courte uniforme arrondie"],
    tip: "Du volume et de la hauteur sur le dessus, côtés courts : ça étire le visage." },
  { key: "carre", name: "Carré",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="14" height="14" rx="3.2"/></svg>`,
    recognize: "Mâchoire marquée et anguleuse, front large. Visage viril et structuré.",
    good: ["Crop texturé", "Buzz cut", "Raie sur le côté", "Pompadour", "Undercut"],
    avoid: ["Coupes très carrées qui durcissent encore la mâchoire"],
    tip: "Assume le côté viril ; un peu de texture sur le dessus adoucit juste ce qu'il faut." },
  { key: "rectangle", name: "Allongé",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6.6" y="3.4" width="10.8" height="17.2" rx="4"/></svg>`,
    recognize: "Visage long et étroit (rectangle). Objectif : ne pas l'allonger davantage.",
    good: ["Frange (fringe)", "Crop français", "Longueur moyenne", "Un peu de volume sur les côtés"],
    avoid: ["Trop de hauteur (pompadour très haut)", "Côtés totalement rasés"],
    tip: "Garde un peu de matière sur les côtés et évite trop de hauteur : ça raccourcit visuellement." },
  { key: "coeur", name: "Cœur",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7.6C5 6 7.6 5 12 5s7 1 7 2.6c0 5.8-3.6 10.4-7 12C8.6 18 5 13.4 5 7.6Z"/></svg>`,
    recognize: "Front large, pommettes hautes, menton fin et pointu. Objectif : équilibrer le bas.",
    good: ["Frange légère / texturée", "Raie sur le côté", "Longueur moyenne", "Un peu de volume en bas"],
    avoid: ["Trop de volume en haut", "Undercut extrême", "Dessus très plaqué"],
    tip: "Adoucis le front avec une frange ou de la texture, et évite d'alourdir le dessus." },
  { key: "triangle", name: "Triangle",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 5.2C8.5 5 10 4.6 12 4.6s3.5.4 3.5.6c.7 4 2 7 3.7 9.6-2.6 2.7-5.2 3.8-7.2 3.8S7.1 17.5 4.8 14.8C6.5 12.2 7.8 9.2 8.5 5.2Z"/></svg>`,
    recognize: "Mâchoire large, front plus étroit. Objectif : élargir le haut pour équilibrer.",
    good: ["Pompadour", "Quiff", "Volume et hauteur sur le dessus", "Côtés plus fournis en haut"],
    avoid: ["Côtés très rasés en bas (élargit la mâchoire)", "Buzz cut"],
    tip: "Mets du volume en haut pour rééquilibrer une mâchoire large." },
];
let coupePhoto = null, coupeShape = null, coupeAuto = null, coupeBusy = false, faceLandmarker = null;
async function shareText(text, title) {
  try { if (navigator.share) { await navigator.share({ title, text }); } else { await navigator.clipboard.writeText(text); toast("Copié"); } }
  catch (e) { if (e.name !== "AbortError") { try { await navigator.clipboard.writeText(text); toast("Copié"); } catch (_) {} } }
}

/* --- Détection automatique de la forme du visage (MediaPipe, sur l'appareil) --- */
const MP_VER = "0.10.18";
async function ensureLandmarker() {
  if (faceLandmarker) return faceLandmarker;
  const v = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`);
  const fileset = await v.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`);
  faceLandmarker = await v.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" },
    runningMode: "IMAGE", numFaces: 1,
  });
  return faceLandmarker;
}
function classifyFace(lm, W, H) {
  const P = (i) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const top = P(10), chin = P(152);
  const fl = P(54), fr = P(284), cl = P(234), cr = P(454), jl = P(172), jr = P(397);
  const L = d(top, chin), Fw = d(fl, fr), Cw = d(cl, cr), Jw = d(jl, jr);
  const r = L / Cw, fR = Fw / Cw, jR = Jw / Cw;
  let shape;
  if (r >= 1.5) shape = "rectangle";
  else if (fR > 1.03 && Fw >= Jw) shape = "coeur";
  else if (jR > 1.0 && Jw > Fw) shape = "triangle";
  else if (r <= 1.12) shape = (jR > 0.9) ? "carre" : "rond";
  else shape = "ovale";
  return { shape, pts: { top, chin, fl, fr, cl, cr, jl, jr } };
}
function drawOverlay(img, pts, nW, nH) {
  const cap = 1000, scale = Math.min(1, cap / Math.max(nW, nH));
  const cw = Math.round(nW * scale), ch = Math.round(nH * scale);
  const cv = $("#coupeCanvas"); if (!cv) return;
  cv.width = cw; cv.height = ch;
  const g = cv.getContext("2d");
  g.drawImage(img, 0, 0, cw, ch);
  const S = (p) => ({ x: p.x * scale, y: p.y * scale });
  const line = (a, b) => { a = S(a); b = S(b); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); };
  g.strokeStyle = "rgba(240,210,144,.95)"; g.fillStyle = "rgba(240,210,144,.95)"; g.lineWidth = Math.max(2, cw * 0.004); g.lineCap = "round";
  g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = cw * 0.01;
  line(pts.top, pts.chin); line(pts.fl, pts.fr); line(pts.cl, pts.cr); line(pts.jl, pts.jr);
  [pts.top, pts.chin, pts.fl, pts.fr, pts.cl, pts.cr, pts.jl, pts.jr].forEach((p) => { p = S(p); g.beginPath(); g.arc(p.x, p.y, Math.max(3, cw * 0.007), 0, 7); g.fill(); });
  cv.classList.remove("hidden"); const im = $("#coupeImg"); if (im) im.classList.add("hidden");
}
async function analyzeFace(c) {
  if (coupeBusy || !coupePhoto) return; coupeBusy = true;
  const btn = $("#coupeAnalyze"); if (btn) { btn.disabled = true; btn.innerHTML = svg("sparkle") + "Analyse en cours…"; }
  try {
    const img = $("#coupeImg"); if (img && img.decode) await img.decode().catch(() => {});
    const fl = await ensureLandmarker();
    const res = fl.detect(img);
    if (!res || !res.faceLandmarks || !res.faceLandmarks.length) { toast("Visage non détecté — choisissez la forme à la main", "bad"); return; }
    const nW = img.naturalWidth || img.width, nH = img.naturalHeight || img.height;
    const out = classifyFace(res.faceLandmarks[0], nW, nH);
    coupeShape = out.shape; coupeAuto = out.shape;
    drawOverlay(img, out.pts, nW, nH);
    haptic(); renderCoupeReco();
    const w = $("#recoWrap"); if (w) w.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (e) { console.warn("analyse visage:", e); toast("Analyse indisponible — vérifiez votre connexion", "bad"); }
  finally { coupeBusy = false; const b = $("#coupeAnalyze"); if (b) { b.disabled = false; b.innerHTML = svg("sparkle") + "Relancer l'analyse"; } }
}
function renderCoupeReco() {
  $$("[data-shape]").forEach((t) => t.classList.toggle("sel", t.dataset.shape === coupeShape));
  const w = $("#recoWrap"); if (!w) return;
  const s = FACE_SHAPES.find((x) => x.key === coupeShape);
  if (!s) { w.innerHTML = `<div class="hint">${svg("sparkle")}<span>Choisissez la forme du visage (ou lancez l'analyse auto) pour voir les coupes conseillées.</span></div>`; return; }
  w.innerHTML = `<div class="card reco"><div class="card-h"><h3>Visage ${s.name.toLowerCase()}</h3>${coupeAuto === s.key ? `<span class="pill good">${svg("sparkle")} Détecté</span>` : ""}</div><div class="card-b">
      <p class="reco-desc">${s.recognize}</p>
      <div class="reco-sec"><div class="reco-t ok">${svg("check")} Coupes qui lui vont</div><div class="tags">${s.good.map((x) => `<span class="tag ok">${x}</span>`).join("")}</div></div>
      <div class="reco-sec"><div class="reco-t no">${svg("x")} À éviter</div><div class="tags">${s.avoid.map((x) => `<span class="tag no">${x}</span>`).join("")}</div></div>
      <div class="reco-tip">${svg("sparkle")}<span><b>Le conseil :</b> ${s.tip}</span></div>
      <button class="btn block" id="coupeShare" style="margin-top:14px">${svg("share")}Partager les conseils</button>
    </div></div>`;
  const sh = $("#coupeShare"); if (sh) sh.onclick = () => shareText(`Coupe idéale — visage ${s.name.toLowerCase()}\n\n✅ Qui lui vont : ${s.good.join(", ")}\n🚫 À éviter : ${s.avoid.join(", ")}\n\n💡 ${s.tip}\n\n— ${DB.salon.name}`, "Coupe idéale");
}
function coupeHelpSheet() {
  openSheet("Trouver la forme du visage", `
    <p style="color:var(--muted);line-height:1.6;font-size:14.5px;margin-bottom:12px">Regardez le client <b>de face</b>, cheveux dégagés du visage. Comparez :</p>
    <div class="list">
      ${FACE_SHAPES.map((s) => `<div class="row"><div class="avatar" style="background:var(--accent-soft);color:var(--accent-ink)">${s.icon}</div><div class="grow"><b>${s.name}</b><span class="sub" style="white-space:normal">${s.recognize}</span></div></div>`).join("")}
    </div>
    <p style="color:var(--muted);line-height:1.6;font-size:13px;margin-top:12px">Astuce : la largeur du front, des pommettes et de la mâchoire + la longueur du visage donnent la forme.</p>`,
    { footer: `<button class="btn primary block" data-close>J'ai compris</button>` });
}
function viewCoupe(c) {
  c.innerHTML = pageHead("Coupe idéale", "La coupe qui met le client en valeur",
    `<button class="iconbtn sm" id="coupeHelp" title="Comment trouver la forme ?">${svg("info")}</button>`) + `
    <div class="card"><div class="card-b">
      <div class="coupe-photo">${coupePhoto ? `<img src="${coupePhoto}" alt="Client" id="coupeImg"><canvas id="coupeCanvas" class="hidden"></canvas>` : `<div class="ph-empty">${svg("users")}<span>Photo du client, de face, cheveux dégagés</span></div>`}</div>
      ${coupePhoto ? `<button class="btn primary block" id="coupeAnalyze" style="margin-top:12px">${svg("sparkle")}Analyser le visage (auto)</button>
        <div class="coupe-note">Estimation automatique — ajustez la forme si besoin.</div>
        <label class="btn block" style="margin-top:8px">${svg("edit")}Changer la photo<input id="coupeFile" type="file" accept="image/*" capture="environment" hidden></label>
        <button class="btn block" id="coupeClear" style="margin-top:8px">${svg("trash")}Retirer la photo</button>`
      : `<label class="btn primary block" style="margin-top:12px">${svg("plus")}Prendre / importer une photo<input id="coupeFile" type="file" accept="image/*" capture="environment" hidden></label>`}
    </div></div>

    <div class="section-lbl">Forme du visage</div>
    <div class="shape-grid">${FACE_SHAPES.map((s) => `<button class="shape-tile ${coupeShape === s.key ? "sel" : ""}" data-shape="${s.key}"><span class="sh-ic">${s.icon}</span><b>${s.name}</b></button>`).join("")}</div>

    <div id="recoWrap"></div>`;

  $("#coupeHelp").onclick = coupeHelpSheet;
  $("#coupeFile").onchange = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { coupePhoto = r.result; coupeAuto = null; viewCoupe(c); }; r.readAsDataURL(f); };
  const cl = $("#coupeClear"); if (cl) cl.onclick = () => { coupePhoto = null; coupeAuto = null; coupeShape = null; viewCoupe(c); };
  const an = $("#coupeAnalyze"); if (an) an.onclick = () => analyzeFace(c);
  $$("[data-shape]", c).forEach((b) => b.onclick = () => { coupeShape = b.dataset.shape; coupeAuto = null; haptic(); renderCoupeReco(); });
  renderCoupeReco();
}

/* ======================= Vue : Clients ======================= */
let clientQuery = "";
function viewClients(c) {
  const q = clientQuery.toLowerCase();
  let rows = DB.clients.map((c) => ({ c, spend: clientSpend(c.id), v: clientVisits(c.id), last: clientLast(c.id) }));
  if (q) rows = rows.filter((r) => r.c.name.toLowerCase().includes(q) || (r.c.phone || "").includes(q));
  rows.sort((a, b) => b.spend - a.spend);
  c.innerHTML = pageHead("Clients", `${DB.clients.length} fiche${DB.clients.length > 1 ? "s" : ""}`, `<button class="btn primary sm" id="add">${svg("plus")}Nouveau</button>`) +
    `<div class="searchbar">${svg("search")}<input id="q" placeholder="Rechercher un nom, un numéro…" value="${esc(clientQuery)}" autocomplete="off"></div>
     <div class="card"><div class="card-b" style="padding-top:6px;padding-bottom:6px">${rows.length ? `<div class="list">${rows.map(clientRow).join("")}</div>` : emptyState("users", q ? "Aucun résultat" : "Aucun client", q ? "Essayez un autre nom." : "Ajoutez votre premier client.")}</div></div>`;
  $("#add").onclick = () => clientForm();
  const qi = $("#q"); qi.oninput = (e) => { clientQuery = e.target.value; const p = qi.selectionStart; viewClients(c); const n = $("#q"); n.focus(); n.setSelectionRange(p, p); };
  $$("[data-open]", c).forEach((el) => el.onclick = () => openClient(el.dataset.open));
}
function clientRow(r) {
  return `<div class="row" data-open="${r.c.id}"><div class="avatar">${initials(r.c.name)}</div>
    <div class="grow"><b>${esc(r.c.name)} ${r.v > 1 ? '<span class="pill accent" style="font-size:10px;padding:1px 6px;vertical-align:1px">fidèle</span>' : ""}</b>
    <span class="sub">${r.v} visite${r.v > 1 ? "s" : ""}${r.last ? " · " + fmtD(r.last) : ""}</span></div>
    <b class="display num" style="color:var(--accent-ink)">${money(r.spend)}</b></div>`;
}
function clientForm(id) {
  const c = id ? clientById(id) : null;
  openSheet(c ? "Modifier le client" : "Nouveau client", `
    <div class="field"><label>Nom complet *</label><input id="f_name" value="${esc(c?.name || "")}" placeholder="Ex : Karim Benali"></div>
    <div class="row2">
      <div class="field"><label>Téléphone</label><input id="f_phone" type="tel" value="${esc(c?.phone || "")}" placeholder="0661 ..."></div>
      <div class="field"><label>Email</label><input id="f_email" type="email" value="${esc(c?.email || "")}" placeholder="(optionnel)"></div>
    </div>
    <div class="field"><label>Notes / préférences</label><textarea id="f_notes" placeholder="Ex : dégradé bas, allergies…">${esc(c?.notes || "")}</textarea></div>`, {
    footer: `${c ? `<button class="btn danger" data-del>${svg("trash")}</button>` : ""}<button class="btn primary" data-save>${svg("check")}Enregistrer</button>`,
    onMount(root) {
      $("[data-save]", root).onclick = () => {
        const name = $("#f_name").value.trim(); if (!name) { toast("Le nom est requis", "bad"); $("#f_name").focus(); return; }
        const data = { name, phone: $("#f_phone").value.trim(), email: $("#f_email").value.trim(), notes: $("#f_notes").value.trim() };
        if (c) Object.assign(c, data); else DB.clients.push({ id: uid(), createdAt: today(), ...data });
        save(); closeSheet(); render(); toast(c ? "Client modifié" : "Client ajouté");
      };
      const del = $("[data-del]", root); if (del) del.onclick = () => confirmSheet("Supprimer ce client ?", "Son historique de ventes sera conservé.", () => {
        DB.clients = DB.clients.filter((x) => x.id !== id); DB.appointments = DB.appointments.filter((a) => a.clientId !== id);
        DB.sales.forEach((v) => { if (v.clientId === id) v.clientId = null; }); save(); closeSheet(); render(); toast("Client supprimé");
      });
    },
  });
}
function openClient(id) {
  const c = clientById(id); if (!c) return;
  const sales = DB.sales.filter((v) => v.clientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const spend = clientSpend(id), v = sales.length;
  const upcoming = DB.appointments.filter((a) => a.clientId === id && a.date >= today() && a.status !== "annule").sort((a, b) => a.date.localeCompare(b.date));
  const kpi = (l, val) => `<div class="kpi" style="box-shadow:none;background:var(--surface-2);padding:11px"><div class="lab">${l}</div><div class="val sm">${val}</div></div>`;
  openSheet(c.name, `
    <div class="row" style="border:none;padding-top:0"><div class="avatar" style="width:52px;height:52px;font-size:20px">${initials(c.name)}</div>
      <div class="grow"><b style="font-size:17px">${esc(c.name)} ${v > 1 ? '<span class="pill accent">fidèle</span>' : ""}</b><span class="sub">${esc(c.phone || "Pas de numéro")}${c.email ? " · " + esc(c.email) : ""}</span></div></div>
    <div style="display:flex;gap:8px;margin:6px 0 12px">
      ${c.phone ? `<a class="btn sm" href="tel:${esc(c.phone.replace(/\s/g, ""))}">${svg("phone")}Appeler</a>
      <a class="btn sm" href="https://wa.me/${telIntl(c.phone)}" target="_blank" rel="noopener">${svg("whatsapp")}WhatsApp</a>` : ""}</div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">${kpi("Total", money(spend))}${kpi("Visites", v)}${kpi("Panier", v ? money(Math.round(spend / v)) : "—")}</div>
    ${c.notes ? `<div class="section-lbl">Préférences</div><div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:11px 13px;margin-bottom:12px;font-size:13.5px">${esc(c.notes)}</div>` : ""}
    ${upcoming.length ? `<div class="section-lbl">Prochain RDV</div>${upcoming.map((r) => `<div class="row"><span class="pill accent">${fmtDShort(r.date)} · ${r.time}</span><span class="grow sub" style="white-space:normal">${r.serviceIds.map((i) => serviceById(i)?.name).filter(Boolean).join(", ")}</span></div>`).join("")}` : ""}
    <div class="section-lbl">Historique (${v})</div>
    ${v ? `<div class="list" style="max-height:34vh;overflow:auto">${sales.map((s) => `<div class="row"><div class="grow"><b style="white-space:normal">${esc(s.items.map((it) => it.name + (it.qty > 1 ? "×" + it.qty : "")).join(", "))}</b><span class="sub">${fmtD(s.date)} · ${s.mode}</span></div><b class="display num">${money(s.total)}</b></div>`).join("")}</div>` : emptyState("receipt", "Aucune visite", "")}`, {
    footer: `<button class="btn" data-edit>${svg("edit")}Modifier</button><button class="btn primary" data-sell>${svg("cash")}Encaisser</button>`,
    onMount(root) {
      $("[data-edit]", root).onclick = () => { closeSheet(); clientForm(id); };
      $("[data-sell]", root).onclick = () => { closeSheet(); posPreset = { clientId: id, serviceIds: [] }; go("pos"); };
    },
  });
}

/* ======================= Vue : Agenda ======================= */
let rdvScope = "a_venir";
function viewRdv(c) {
  const t = today();
  let list = DB.appointments.slice();
  if (rdvScope === "jour") list = list.filter((r) => r.date === t);
  else if (rdvScope === "a_venir") list = list.filter((r) => r.date >= t);
  else list = list.filter((r) => r.date < t);
  list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) * (rdvScope === "passe" ? -1 : 1));
  const groups = {}; list.forEach((r) => (groups[r.date] = groups[r.date] || []).push(r));
  c.innerHTML = pageHead("Agenda", "Vos rendez-vous", `<button class="iconbtn sm" id="hist" title="Historique des rappels">${svg("history")}</button>`) +
    `<div class="seg" style="margin-bottom:14px" id="scope">
      <button data-s="jour" class="${rdvScope === "jour" ? "active" : ""}">Aujourd'hui</button>
      <button data-s="a_venir" class="${rdvScope === "a_venir" ? "active" : ""}">À venir</button>
      <button data-s="passe" class="${rdvScope === "passe" ? "active" : ""}">Passés</button>
    </div>
    ${Object.keys(groups).length ? Object.entries(groups).map(([date, rs]) => `
      <div class="section-lbl">${date === t ? "Aujourd'hui · " : ""}${fmtDShort(date)}</div>
      <div class="card"><div class="card-b" style="padding-top:4px;padding-bottom:4px"><div class="list">${rs.sort((a, b) => a.time.localeCompare(b.time)).map(rdvRow).join("")}</div></div></div>`).join("")
      : `<div class="card"><div class="card-b">${emptyState("cal", "Aucun rendez-vous", "Appuyez sur + pour en planifier un.")}</div></div>`}`;
  $("#hist").onclick = historySheet;
  $$("#scope [data-s]").forEach((b) => b.onclick = () => { rdvScope = b.dataset.s; viewRdv(c); });
  $$("[data-edit]", c).forEach((el) => el.onclick = () => rdvForm(el.dataset.edit));
  $$("[data-remind]", c).forEach((el) => el.onclick = (e) => { e.stopPropagation(); remindSheet(el.dataset.remind); });
  $$("[data-done]", c).forEach((el) => el.onclick = (e) => { e.stopPropagation(); encaisserRdv(el.dataset.done); });
  // FAB
  c.insertAdjacentHTML("beforeend", `<button class="fab" id="fab" aria-label="Nouveau rendez-vous">${svg("plus")}</button>`);
  $("#fab").onclick = () => rdvForm();
}
function rdvRow(r) {
  const names = r.serviceIds.map((id) => serviceById(id)?.name).filter(Boolean);
  const dur = r.serviceIds.reduce((s, id) => s + (serviceById(id)?.duration || 0), 0);
  const price = r.serviceIds.reduce((s, id) => s + (serviceById(id)?.price || 0), 0);
  const cl = clientById(r.clientId);
  const canRemind = cl && (cl.phone || cl.email) && r.status !== "termine" && r.status !== "annule";
  return `<div class="row">
    <div style="text-align:center;min-width:46px;flex:none"><div class="display" style="font-size:18px">${r.time}</div><div style="font-size:10.5px;color:var(--muted)">${dur || "—"} min</div></div>
    <div class="grow"><b>${esc(clientName(r.clientId))}</b><span class="sub">${esc(names.join(", ") || "—")}${price ? " · " + money(price) : ""}</span>
      <div class="tag" style="margin-top:6px">${r.reminded ? '<span class="pill good">Rappelé</span>' : ""}${statusPill(r.status)}</div></div>
    <div style="display:flex;gap:6px;flex:none">
      ${canRemind ? `<button class="iconbtn sm" data-remind="${r.id}" title="Rappeler">${svg("bell")}</button>` : ""}
      ${r.status !== "termine" ? `<button class="iconbtn sm" data-done="${r.id}" title="Encaisser">${svg("check")}</button>` : ""}
      <button class="iconbtn sm" data-edit="${r.id}" title="Modifier">${svg("edit")}</button></div></div>`;
}
function rdvForm(id) {
  const r = id ? DB.appointments.find((x) => x.id === id) : null;
  if (!DB.clients.length) { toast("Ajoutez d'abord un client", "info"); go("clients"); return; }
  const clientOpts = DB.clients.map((c) => `<option value="${c.id}" ${r?.clientId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  const svcChecks = DB.services.length ? DB.services.map((s) => `<label class="check"><input type="checkbox" value="${s.id}" ${r?.serviceIds?.includes(s.id) ? "checked" : ""}><span class="grow">${esc(s.name)}</span><b class="display" style="color:var(--accent-ink)">${money(s.price)}</b></label>`).join("") : `<div class="field hint">Aucune prestation — ajoutez-en dans Réglages → Services.</div>`;
  openSheet(r ? "Modifier le rendez-vous" : "Nouveau rendez-vous", `
    <div class="field"><label>Client *</label><select id="f_client"><option value="">— Choisir —</option>${clientOpts}</select></div>
    <div class="row2"><div class="field"><label>Date *</label><input type="date" id="f_date" value="${r?.date || today()}"></div>
      <div class="field"><label>Heure *</label><input type="time" id="f_time" value="${r?.time || "10:00"}"></div></div>
    <div class="field"><label>Prestations</label><div style="max-height:36vh;overflow:auto">${svcChecks}</div></div>
    <div class="field"><label>Statut</label><select id="f_status">${Object.keys(STATUS).map((s) => `<option value="${s}" ${r?.status === s ? "selected" : ""}>${STATUS[s][1]}</option>`).join("")}</select></div>`, {
    footer: `${r ? `<button class="btn danger" data-del>${svg("trash")}</button>` : ""}<button class="btn primary" data-save>${svg("check")}Enregistrer</button>`,
    onMount(root) {
      $("[data-save]", root).onclick = () => {
        const clientId = $("#f_client").value; if (!clientId) { toast("Choisissez un client", "bad"); return; }
        const serviceIds = $$(".sheet-b input[type=checkbox]:checked", root).map((x) => x.value);
        const data = { clientId, date: $("#f_date").value, time: $("#f_time").value, serviceIds, status: $("#f_status").value };
        if (r) { if (data.date !== r.date || data.time !== r.time) r.reminded = false; Object.assign(r, data); }
        else DB.appointments.push({ id: uid(), reminded: false, ...data });
        save(); closeSheet(); render(); toast(r ? "Rendez-vous modifié" : "Rendez-vous créé");
      };
      const del = $("[data-del]", root); if (del) del.onclick = () => { DB.appointments = DB.appointments.filter((x) => x.id !== id); save(); closeSheet(); render(); toast("Rendez-vous supprimé"); };
    },
  });
}
function encaisserRdv(id) {
  const r = DB.appointments.find((x) => x.id === id); if (!r) return;
  r.status = "termine"; save();
  posPreset = { clientId: r.clientId, serviceIds: r.serviceIds.slice() };
  go("pos"); toast("Prestations chargées — validez");
}

/* ======================= Rappels (appuyer pour envoyer) ======================= */
function telIntl(tel) { let s = String(tel || "").replace(/[^\d+]/g, ""); if (s.startsWith("+")) return s.slice(1); if (s.startsWith("00")) return s.slice(2); if (s.startsWith("0")) return "213" + s.slice(1); if (s.startsWith("213")) return s; return s ? "213" + s : ""; }
function fillTemplate(t, map) { return String(t || "").replace(/\{(\w+)\}/g, (m, k) => map[k] != null ? map[k] : m); }
function reminderMessage(r) { const c = clientById(r.clientId); return fillTemplate(DB.salon.reminderTemplate, { client: c ? c.name.split(" ")[0] : "", salon: DB.salon.name, date: fmtDShort(r.date), heure: r.time }); }
function logReminder(r, channel, dest) {
  r.reminded = true; r.remindedAt = new Date().toISOString();
  DB.reminders.unshift({ id: uid(), clientName: clientName(r.clientId), channel, dest, at: new Date().toISOString(), rdvDate: r.date, rdvTime: r.time });
  if (DB.reminders.length > 300) DB.reminders.length = 300;
  save();
}
function remindSheet(id) {
  const r = DB.appointments.find((x) => x.id === id); if (!r) return;
  const c = clientById(r.clientId); const msg = reminderMessage(r);
  openSheet("Rappeler " + (c ? c.name : ""), `
    <div class="field"><label>Message</label><textarea id="r_msg" style="min-height:100px">${esc(msg)}</textarea>
      <div class="hint">Choisissez un canal : l'app s'ouvre avec le message déjà écrit, vous n'avez plus qu'à appuyer sur Envoyer.</div></div>
    <div style="display:flex;flex-direction:column;gap:9px">
      ${c?.phone ? `<button class="btn lg chan" data-ch="whatsapp" style="background:#25d366;border-color:#25d366;color:#fff">${svg("whatsapp")}Envoyer par WhatsApp</button>` : ""}
      ${c?.phone ? `<button class="btn lg chan" data-ch="sms">${svg("sms")}Envoyer par SMS</button>` : ""}
      ${c?.email ? `<button class="btn lg chan" data-ch="email">${svg("mail")}Envoyer par Email</button>` : ""}
      ${!c?.phone && !c?.email ? `<div class="empty">${emptyState("phone", "Aucun contact", "Ajoutez un numéro ou un email dans la fiche du client.")}</div>` : ""}
    </div>`, {
    onMount(root) {
      $$(".chan", root).forEach((b) => b.onclick = () => {
        const ch = b.dataset.ch, text = $("#r_msg").value || msg; let url, dest;
        if (ch === "whatsapp") { dest = c.phone; url = "https://wa.me/" + telIntl(c.phone) + "?text=" + encodeURIComponent(text); }
        else if (ch === "sms") { dest = c.phone; url = "sms:+" + telIntl(c.phone) + "?body=" + encodeURIComponent(text); }
        else { dest = c.email; url = "mailto:" + encodeURIComponent(c.email) + "?subject=" + encodeURIComponent("Rappel rendez-vous — " + DB.salon.name) + "&body=" + encodeURIComponent(text); }
        if (ch === "whatsapp") window.open(url, "_blank", "noopener"); else window.location.href = url;
        logReminder(r, ch, dest); haptic(15); closeSheet(); render();
        toast("Rappel ouvert dans " + (ch === "whatsapp" ? "WhatsApp" : ch === "sms" ? "Messages" : "Email"));
      });
    },
  });
}
function historySheet() {
  const rows = DB.reminders || [];
  const label = (c) => c === "whatsapp" ? "WhatsApp" : c === "email" ? "Email" : "SMS";
  const kind = (c) => c === "whatsapp" ? "good" : c === "email" ? "accent" : "mut";
  openSheet("Historique des rappels", rows.length ? `<div class="list" style="max-height:70vh;overflow:auto">${rows.map((x) => `<div class="row"><div class="grow"><b>${esc(x.clientName)}</b><span class="sub">${new Date(x.at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${x.rdvDate ? " · RDV " + fmtDShort(x.rdvDate) + " " + (x.rdvTime || "") : ""}</span></div><span class="pill ${kind(x.channel)}">${label(x.channel)}</span></div>`).join("")}</div>` : emptyState("history", "Aucun rappel envoyé", "Les rappels envoyés apparaîtront ici."), { footer: `<button class="btn" data-close>Fermer</button>` });
}

/* ======================= Vue : Caisse (POS) ======================= */
let cart = [], cartClient = "", cartMode = "Espèces";
let cartDiscount = 0, cartDiscountType = "amount", cartTip = 0, cartPaid = 0;
let posPreset = null, posQuery = "";
function viewPos(c) {
  if (posPreset) {
    cartClient = posPreset.clientId ? String(posPreset.clientId) : "";
    if (posPreset.serviceIds.length) { cart = []; posPreset.serviceIds.forEach((sid) => { const s = serviceById(sid); if (s) addToCart(s); }); }
    posPreset = null;
  }
  c.innerHTML = pageHead("Caisse", "Encaisser une prestation", `<button class="iconbtn sm" id="mng" title="Gérer les services">${svg("scissors")}</button>`) +
    (DB.services.length
      ? `<div class="searchbar">${svg("search")}<input id="posq" placeholder="Rechercher une prestation…" value="${esc(posQuery)}" autocomplete="off"></div>
         <div id="svcWrap">${posGridHTML()}</div>
         <button class="btn block" id="freeItem" style="margin-top:14px">${svg("plus")}Article libre (prix au choix)</button>`
      : `<div class="card"><div class="card-b">${emptyState("scissors", "Aucune prestation", "Ajoutez vos services et tarifs pour encaisser.")}<button class="btn primary block" id="addsvc">${svg("plus")}Ajouter une prestation</button></div></div>`);
  $("#mng").onclick = () => go("services");
  const as = $("#addsvc"); if (as) as.onclick = () => serviceForm();
  const fi = $("#freeItem"); if (fi) fi.onclick = freeItemSheet;
  const pq = $("#posq");
  if (pq) pq.oninput = (e) => { posQuery = e.target.value; const w = $("#svcWrap"); if (w) { w.innerHTML = posGridHTML(); bindAdds(w); } };
  bindAdds(c);
  renderCartBar();
}
function posGridHTML() {
  const q = posQuery.trim().toLowerCase();
  const list = DB.services.filter((s) => !q || (s.name || "").toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q));
  if (!list.length) return `<div class="card"><div class="card-b">${emptyState("search", "Aucune prestation trouvée", "Essayez un autre mot, ou utilisez « Article libre ».")}</div></div>`;
  const cats = [...new Set(list.map((s) => s.category || "Autres"))];
  return cats.map((cat) => `<div class="section-lbl">${esc(cat)}</div><div class="svc-grid">${list.filter((s) => (s.category || "Autres") === cat).map((s) => `<button class="svc-tile" data-add="${s.id}"><div class="svc-ic">${svg(svcIcon(s.name, s.category))}</div><div class="n">${esc(s.name)}</div><div class="p">${money(s.price)}</div><div class="d">${s.duration} min</div></button>`).join("")}</div>`).join("");
}
function bindAdds(scope) {
  $$("[data-add]", scope).forEach((el) => el.onclick = () => { addToCart(serviceById(el.dataset.add)); haptic(); renderCartBar(); });
}
function freeItemSheet() {
  openSheet("Article libre", `
    <div class="field"><label>Désignation</label><input id="fi_name" placeholder="Ex : Coupe enfant, Soin…" autocomplete="off"></div>
    <div class="field"><label>Prix (${cur()})</label><input id="fi_price" inputmode="numeric" placeholder="0" autocomplete="off"></div>`, {
    footer: `<button class="btn primary block" data-add>${svg("plus")}Ajouter au panier</button>`,
    onMount(root) {
      setTimeout(() => { const n = $("#fi_name", root); if (n) n.focus(); }, 60);
      $("[data-add]", root).onclick = () => {
        const name = $("#fi_name", root).value.trim() || "Article";
        const price = Math.max(0, Math.round(Number($("#fi_price", root).value) || 0));
        cart.push({ serviceId: null, name, price, qty: 1 });
        closeSheet(); haptic(); renderCartBar(); toast("Ajouté au panier ✓");
      };
    },
  });
}
function addToCart(s) { if (!s) return; const ex = cart.find((l) => l.serviceId === s.id); if (ex) ex.qty++; else cart.push({ serviceId: s.id, name: s.name, price: s.price, qty: 1 }); }
function cartSubtotal() { return cart.reduce((s, l) => s + l.price * l.qty, 0); }
function discountValue(sub) { const d = cartDiscountType === "percent" ? sub * (Number(cartDiscount) || 0) / 100 : (Number(cartDiscount) || 0); return Math.min(Math.max(0, Math.round(d)), sub); }
function cartTotal() { const sub = cartSubtotal(); return Math.max(0, sub - discountValue(sub) + Math.max(0, Number(cartTip) || 0)); }
function renderCartBar() {
  let bar = $("#cartbar");
  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);
  if (route !== "pos") { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement("div"); bar.id = "cartbar"; bar.className = "cart-bar"; document.body.appendChild(bar); }
  bar.classList.toggle("hidden-bar", cart.length === 0);
  bar.innerHTML = `<div class="sum"><div class="c">${cart.reduce((s, l) => s + l.qty, 0)} article${cart.reduce((s, l) => s + l.qty, 0) > 1 ? "s" : ""}</div><div class="t">${money(total)}</div></div><button class="btn primary" id="checkout">${svg("cash")}Encaisser</button>`;
  $("#checkout").onclick = checkoutSheet;
}
function checkoutSheet() {
  if (!cart.length) return;
  const clientOpts = DB.clients.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => `<option value="${c.id}" ${cartClient === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  openSheet("Encaissement", `
    <div class="field"><label>Client</label><select id="c_client"><option value="">Client de passage</option>${clientOpts}</select></div>
    <div id="c_lines"></div>
    <div class="co-extra">
      <div class="co-row"><label>Remise</label>
        <div class="co-disc">
          <div class="seg sm" id="c_dtype"><button data-dt="amount" class="${cartDiscountType === "amount" ? "active" : ""}">${cur()}</button><button data-dt="percent" class="${cartDiscountType === "percent" ? "active" : ""}">%</button></div>
          <input id="c_disc" inputmode="numeric" placeholder="0" value="${cartDiscount || ""}" autocomplete="off">
        </div>
      </div>
      <div class="co-row"><label>Pourboire</label><input id="c_tip" inputmode="numeric" placeholder="0" value="${cartTip || ""}" autocomplete="off"></div>
    </div>
    <div class="co-tot" id="c_totals"></div>
    <div class="field" style="margin-top:14px"><label>Mode de paiement</label><div class="seg" id="c_mode">${["Espèces", "Carte", "Virement", "Crédit"].map((m) => `<button data-m="${m}" class="${cartMode === m ? "active" : ""}">${m}</button>`).join("")}</div></div>
    <div id="c_cash" class="co-cash"></div>`, {
    footer: `<button class="btn primary block" data-pay></button>`,
    onMount(root) {
      const drawLines = () => {
        $("#c_lines", root).innerHTML = cart.map((l, i) => `<div class="ticket-line"><div class="grow"><b style="font-weight:600">${esc(l.name)}</b><span class="sub">${money(l.price)}${l.serviceId === null ? " · libre" : ""}</span></div><div class="qty"><button data-dec="${i}">−</button><span>${l.qty}</span><button data-inc="${i}">+</button></div><b class="display num" style="min-width:66px;text-align:right">${money(l.price * l.qty)}</b></div>`).join("");
        $$("[data-inc]", root).forEach((b) => b.onclick = () => { cart[b.dataset.inc].qty++; drawLines(); recompute(); });
        $$("[data-dec]", root).forEach((b) => b.onclick = () => { const i = b.dataset.dec; if (cart[i].qty > 1) cart[i].qty--; else cart.splice(i, 1); if (!cart.length) { closeSheet(); renderCartBar(); return; } drawLines(); recompute(); });
      };
      const updateChange = () => {
        const el = $("#c_change", root); if (!el) return;
        const paid = Number(cartPaid) || 0, change = paid - cartTotal();
        el.innerHTML = paid > 0 ? `<div class="tl grand ${change < 0 ? "neg" : "chg"}"><b>${change >= 0 ? "À rendre" : "Manque"}</b><b class="display">${money(Math.abs(change))}</b></div>` : "";
      };
      const buildCash = () => {
        const wrap = $("#c_cash", root);
        if (cartMode !== "Espèces") { wrap.innerHTML = ""; return; }
        const tot = cartTotal();
        const chips = [...new Set([tot, Math.ceil(tot / 100) * 100, Math.ceil(tot / 500) * 500, Math.ceil(tot / 1000) * 1000])].filter((v) => v > 0).slice(0, 4);
        wrap.innerHTML = `<div class="field" style="margin-top:12px"><label>Montant reçu</label><input id="c_paid" inputmode="numeric" placeholder="0" value="${cartPaid || ""}" autocomplete="off"></div>
          <div class="cash-chips">${chips.map((v) => `<button data-cash="${v}">${money(v)}</button>`).join("")}</div>
          <div id="c_change"></div>`;
        const pi = $("#c_paid", root); if (pi) pi.oninput = (e) => { cartPaid = Number(e.target.value) || 0; updateChange(); };
        $$("[data-cash]", wrap).forEach((b) => b.onclick = () => { cartPaid = Number(b.dataset.cash) || 0; const p = $("#c_paid", root); if (p) p.value = cartPaid; updateChange(); });
        updateChange();
      };
      const recompute = () => {
        const sub = cartSubtotal(), disc = discountValue(sub), tip = Math.max(0, Number(cartTip) || 0), tot = Math.max(0, sub - disc + tip);
        $("#c_totals", root).innerHTML =
          `<div class="tl"><span>Sous-total</span><span class="num">${money(sub)}</span></div>` +
          (disc > 0 ? `<div class="tl minus"><span>Remise${cartDiscountType === "percent" ? " " + (Number(cartDiscount) || 0) + "%" : ""}</span><span class="num">− ${money(disc)}</span></div>` : "") +
          (tip > 0 ? `<div class="tl plus"><span>Pourboire</span><span class="num">+ ${money(tip)}</span></div>` : "") +
          `<div class="tl grand"><b>TOTAL</b><b class="display">${money(tot)}</b></div>`;
        $("[data-pay]", root).innerHTML = svg("check") + "Encaisser " + money(tot);
        buildCash();
      };
      drawLines(); recompute();
      $("#c_client", root).onchange = (e) => cartClient = e.target.value;
      $("#c_disc", root).oninput = (e) => { cartDiscount = Number(e.target.value) || 0; recompute(); };
      $$("#c_dtype [data-dt]", root).forEach((b) => b.onclick = () => { cartDiscountType = b.dataset.dt; $$("#c_dtype [data-dt]", root).forEach((x) => x.classList.toggle("active", x === b)); recompute(); });
      $("#c_tip", root).oninput = (e) => { cartTip = Number(e.target.value) || 0; recompute(); };
      $$("#c_mode [data-m]", root).forEach((b) => b.onclick = () => { cartMode = b.dataset.m; $$("#c_mode [data-m]", root).forEach((x) => x.classList.toggle("active", x === b)); recompute(); });
      $("[data-pay]", root).onclick = () => {
        const sub = cartSubtotal(), disc = discountValue(sub), tip = Math.max(0, Number(cartTip) || 0), tot = Math.max(0, sub - disc + tip);
        const sale = { id: uid(), clientId: cartClient || null, date: today(), items: cart.map((l) => ({ ...l })), subtotal: sub, discount: disc, tip, total: tot, mode: cartMode };
        DB.sales.push(sale); save();
        cart = []; cartClient = ""; cartMode = "Espèces"; cartDiscount = 0; cartDiscountType = "amount"; cartTip = 0; cartPaid = 0;
        closeSheet(); render(); haptic(20); receiptSheet(sale); toast("Vente encaissée ✓");
      };
    },
  });
}
function receiptText(sale) {
  const L = [DB.salon.name, DB.salon.address, "", `${fmtDFull(sale.date)}`, `Client : ${clientName(sale.clientId)}`, "—"];
  sale.items.forEach((it) => L.push(`${it.name}${it.qty > 1 ? " x" + it.qty : ""} : ${money(it.price * it.qty)}`));
  L.push("—");
  if (sale.discount > 0 || sale.tip > 0) {
    L.push(`Sous-total : ${money(sale.subtotal != null ? sale.subtotal : sale.items.reduce((s, it) => s + it.price * it.qty, 0))}`);
    if (sale.discount > 0) L.push(`Remise : -${money(sale.discount)}`);
    if (sale.tip > 0) L.push(`Pourboire : +${money(sale.tip)}`);
  }
  L.push(`TOTAL : ${money(sale.total)}`, `Payé par ${sale.mode}`);
  if (DB.salon.receiptFooter) L.push("", DB.salon.receiptFooter);
  return L.filter((x) => x !== undefined).join("\n");
}
function receiptSheet(sale) {
  const c = clientById(sale.clientId);
  openSheet("Reçu", `
    <div class="receipt">
      <div class="brand"><div class="n">${esc(DB.salon.name)}</div><div class="m">${esc(DB.salon.address || "")}${DB.salon.phone ? " · " + esc(DB.salon.phone) : ""}</div></div>
      <div class="sep"></div>
      <div class="m" style="font-size:12.5px;color:var(--muted);margin-bottom:8px">${fmtDFull(sale.date)} · ${esc(clientName(sale.clientId))}</div>
      ${sale.items.map((it) => `<div class="ln"><span>${esc(it.name)}${it.qty > 1 ? " × " + it.qty : ""}</span><span class="num">${money(it.price * it.qty)}</span></div>`).join("")}
      <div class="sep"></div>
      ${(sale.discount > 0 || sale.tip > 0) ? `<div class="ln mut"><span>Sous-total</span><span class="num">${money(sale.subtotal != null ? sale.subtotal : sale.items.reduce((s, it) => s + it.price * it.qty, 0))}</span></div>${sale.discount > 0 ? `<div class="ln mut"><span>Remise</span><span class="num">− ${money(sale.discount)}</span></div>` : ""}${sale.tip > 0 ? `<div class="ln mut"><span>Pourboire</span><span class="num">+ ${money(sale.tip)}</span></div>` : ""}` : ""}
      <div class="tot"><b style="font-size:15px">TOTAL</b><b>${money(sale.total)}</b></div>
      <div class="m" style="font-size:12.5px;color:var(--muted);margin-top:3px">Payé par ${esc(sale.mode)}</div>
      ${DB.salon.receiptFooter ? `<div style="text-align:center;margin-top:14px;font-size:12.5px;color:var(--muted)">${esc(DB.salon.receiptFooter)}</div>` : ""}
    </div>`, {
    footer: `${c?.phone ? `<button class="btn" data-wa>${svg("whatsapp")}WhatsApp</button>` : ""}<button class="btn primary" data-share>${svg("share")}Partager</button>`,
    onMount(root) {
      const txt = receiptText(sale);
      const share = $("[data-share]", root); if (share) share.onclick = async () => { try { if (navigator.share) { await navigator.share({ title: "Reçu — " + DB.salon.name, text: txt }); } else { await navigator.clipboard.writeText(txt); toast("Reçu copié"); } } catch (e) { if (e.name !== "AbortError") { try { await navigator.clipboard.writeText(txt); toast("Reçu copié"); } catch (_) {} } } };
      const wa = $("[data-wa]", root); if (wa) wa.onclick = () => window.open("https://wa.me/" + telIntl(c.phone) + "?text=" + encodeURIComponent(txt), "_blank", "noopener");
    },
  });
}

/* ======================= Vue : Services ======================= */
function viewServices(c) {
  const cats = [...new Set(DB.services.map((s) => s.category || "Autres"))];
  c.innerHTML = pageHead("Services & tarifs", `${DB.services.length} prestation${DB.services.length > 1 ? "s" : ""}`, `<button class="btn primary sm" id="add">${svg("plus")}Ajouter</button>`) +
    (DB.services.length ? cats.map((cat) => `<div class="section-lbl">${esc(cat)}</div><div class="card"><div class="card-b" style="padding-top:6px;padding-bottom:6px"><div class="list">${DB.services.filter((s) => (s.category || "Autres") === cat).map((s) => `<div class="row" data-edit="${s.id}"><div class="svc-ic sm">${svg(svcIcon(s.name, s.category))}</div><div class="grow"><b>${esc(s.name)}</b><span class="sub">${s.duration} min</span></div><b class="display" style="color:var(--accent-ink)">${money(s.price)}</b>${svg("edit", "")}</div>`).join("")}</div></div></div>`).join("")
      : `<div class="card"><div class="card-b">${emptyState("scissors", "Aucune prestation", "Créez votre catalogue : coupe, barbe, couleur…")}</div></div>`);
  $("#add").onclick = () => serviceForm();
  $$("[data-edit]", c).forEach((el) => el.onclick = () => serviceForm(el.dataset.edit));
}
function serviceForm(id) {
  const s = id ? serviceById(id) : null;
  const cats = [...new Set([...DB.services.map((x) => x.category), "Coupe", "Barbe", "Soin", "Couleur", "Autres"])].filter(Boolean);
  openSheet(s ? "Modifier la prestation" : "Nouvelle prestation", `
    <div class="field"><label>Nom *</label><input id="s_name" value="${esc(s?.name || "")}" placeholder="Ex : Coupe + barbe"></div>
    <div class="row2"><div class="field"><label>Prix (${cur()}) *</label><input type="number" inputmode="numeric" id="s_price" value="${s?.price ?? ""}" min="0"></div>
      <div class="field"><label>Durée (min)</label><input type="number" inputmode="numeric" id="s_dur" value="${s?.duration ?? DB.salon.defaultDuration}" min="0"></div></div>
    <div class="field"><label>Catégorie</label><input id="s_cat" list="cats" value="${esc(s?.category || "Coupe")}"><datalist id="cats">${cats.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></div>`, {
    footer: `${s ? `<button class="btn danger" data-del>${svg("trash")}</button>` : ""}<button class="btn primary" data-save>${svg("check")}Enregistrer</button>`,
    onMount(root) {
      $("[data-save]", root).onclick = () => {
        const name = $("#s_name").value.trim(), price = Number($("#s_price").value); if (!name) { toast("Le nom est requis", "bad"); return; }
        const data = { name, price: price || 0, duration: Number($("#s_dur").value) || 0, category: $("#s_cat").value.trim() || "Autres" };
        if (s) Object.assign(s, data); else DB.services.push({ id: uid(), ...data });
        save(); closeSheet(); render(); toast(s ? "Prestation modifiée" : "Prestation ajoutée");
      };
      const del = $("[data-del]", root); if (del) del.onclick = () => confirmSheet("Supprimer cette prestation ?", "Les ventes passées ne changent pas.", () => { DB.services = DB.services.filter((x) => x.id !== id); save(); closeSheet(); render(); toast("Prestation supprimée"); });
    },
  });
}

/* ======================= Vue : Finances ======================= */
function viewFin(c) {
  const mk = monthKey(today());
  const rev = revenueMonth(mk), exp = expenseMonth(mk), profit = rev - exp, margin = rev ? Math.round(profit / rev * 100) : 0;
  const expByCat = {}; DB.expenses.forEach((e) => expByCat[e.category] = (expByCat[e.category] || 0) + Number(e.amount));
  const donut = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  const months = []; const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const k = isoDate(d).slice(0, 7); months.push({ label: MOIS[d.getMonth()], rev: revenueMonth(k), exp: expenseMonth(k) }); }
  const kpi = (l, v, sub, cls) => `<div class="kpi"><div class="lab">${l}</div><div class="val sm ${cls || ""}">${v}</div><div class="delta">${sub}</div></div>`;
  c.innerHTML = pageHead("Finances", "Revenus, charges & bénéfice", `<button class="btn primary sm" id="add">${svg("plus")}Charge</button>`) +
    `<div class="kpis" style="grid-template-columns:1fr 1fr;margin-bottom:14px">
      ${kpi("Revenus (mois)", money(rev), capFirst(MOISL[new Date().getMonth()]))}
      ${kpi("Charges (mois)", money(exp), DB.expenses.filter((e) => monthKey(e.date) === mk).length + " dépenses")}
      ${kpi("Bénéfice net", money(profit), "Revenus − charges", profit >= 0 ? "up" : "down")}
      ${kpi("Marge", margin + "%", profit >= 0 ? "Rentable" : "En perte", profit >= 0 ? "up" : "down")}
    </div>
    <div class="card"><div class="card-h"><h3>Revenus vs charges</h3><span class="mut">6 mois</span></div><div class="card-b"><div class="chart-wrap" style="height:220px"><canvas id="cBars"></canvas></div></div></div>
    <div class="card"><div class="card-h"><h3>Répartition des charges</h3></div><div class="card-b"><div class="chart-wrap" style="height:230px"><canvas id="cDep"></canvas></div></div></div>
    <div class="card"><div class="card-h"><h3>Charges & dépenses</h3></div><div class="card-b" style="padding-top:4px">${DB.expenses.length ? `<div class="list">${DB.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).map((e) => `<div class="row" data-edit="${e.id}"><div class="grow"><b>${esc(e.label)}</b><span class="sub"><span class="pill mut" style="font-size:10px">${esc(e.category)}</span> ${fmtD(e.date)}</span></div><b class="display num" style="color:var(--bad)">− ${money(e.amount)}</b></div>`).join("")}</div>` : emptyState("wallet", "Aucune charge", "Ajoutez vos dépenses (loyer, produits…).")}</div></div>`;
  $("#add").onclick = () => expenseForm();
  $$("[data-edit]", c).forEach((el) => el.onclick = () => expenseForm(el.dataset.edit));
  barsChart($("#cBars"), months);
  donutChart($("#cDep"), donut, "--bad", money);
}
function expenseForm(id) {
  const e = id ? DB.expenses.find((x) => x.id === id) : null;
  const cats = ["Loyer", "Produits", "Charges", "Salaires", "Matériel", "Marketing", "Taxes", "Autres"];
  openSheet(e ? "Modifier la charge" : "Nouvelle charge", `
    <div class="field"><label>Libellé *</label><input id="e_label" value="${esc(e?.label || "")}" placeholder="Ex : Loyer du local"></div>
    <div class="row2"><div class="field"><label>Montant (${cur()}) *</label><input type="number" inputmode="numeric" id="e_amt" value="${e?.amount ?? ""}" min="0"></div>
      <div class="field"><label>Date</label><input type="date" id="e_date" value="${e?.date || today()}"></div></div>
    <div class="field"><label>Catégorie</label><select id="e_cat">${cats.map((x) => `<option ${e?.category === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>`, {
    footer: `${e ? `<button class="btn danger" data-del>${svg("trash")}</button>` : ""}<button class="btn primary" data-save>${svg("check")}Enregistrer</button>`,
    onMount(root) {
      $("[data-save]", root).onclick = () => {
        const label = $("#e_label").value.trim(), amount = Number($("#e_amt").value); if (!label || !amount) { toast("Libellé et montant requis", "bad"); return; }
        const data = { label, amount, date: $("#e_date").value, category: $("#e_cat").value };
        if (e) Object.assign(e, data); else DB.expenses.push({ id: uid(), ...data });
        save(); closeSheet(); render(); toast(e ? "Charge modifiée" : "Charge ajoutée");
      };
      const del = $("[data-del]", root); if (del) del.onclick = () => confirmSheet("Supprimer cette charge ?", "Action définitive.", () => { DB.expenses = DB.expenses.filter((x) => x.id !== id); save(); closeSheet(); render(); toast("Charge supprimée"); });
    },
  });
}

/* ======================= Vue : Réglages ======================= */
function viewSettings(c) {
  const s = DB.salon; const mode = themeMode(); const oc = onlineCfg();
  c.innerHTML = pageHead("Réglages", "Votre salon & l'application") +
    `<div class="card"><div class="card-h"><h3>Mon salon</h3></div><div class="card-b">
      <div class="field"><label>Nom du salon</label><input id="s_name" value="${esc(s.name)}"></div>
      <div class="row2"><div class="field"><label>Devise</label><input id="s_cur" value="${esc(s.currency)}"></div>
        <div class="field"><label>Téléphone</label><input id="s_phone" type="tel" value="${esc(s.phone || "")}"></div></div>
      <div class="field"><label>Adresse</label><input id="s_addr" value="${esc(s.address || "")}"></div>
      <button class="btn primary block" id="saveSalon">${svg("check")}Enregistrer</button></div></div>

    <div class="card"><div class="card-h"><h3>Rappels & reçus</h3></div><div class="card-b">
      <div class="field"><label>Message de rappel</label><textarea id="s_tmpl">${esc(s.reminderTemplate)}</textarea>
        <div class="hint">Variables : {client}, {salon}, {date}, {heure}.</div></div>
      <div class="field"><label>Bas de page du reçu</label><input id="s_foot" value="${esc(s.receiptFooter || "")}"></div>
      <div class="field"><label>Durée par défaut (min)</label><input type="number" inputmode="numeric" id="s_dur" value="${s.defaultDuration}" style="max-width:120px"></div>
      <button class="btn primary block" id="saveMsg">${svg("check")}Enregistrer</button></div></div>

    <div class="card"><div class="card-h"><h3>Apparence</h3></div><div class="card-b">
      <div class="seg" id="theme">${[["system", "Système"], ["light", "Clair"], ["dark", "Sombre"]].map(([k, l]) => `<button data-t="${k}" class="${mode === k ? "active" : ""}">${l}</button>`).join("")}</div></div></div>

    <div class="card"><div class="card-h"><h3>Sécurité</h3>${s.pin ? '<span class="pill good">Activé</span>' : '<span class="pill mut">Désactivé</span>'}</div><div class="card-b">
      <label class="check" style="justify-content:space-between;cursor:pointer;margin-bottom:6px">
        <span style="font-weight:600">Verrouiller par code</span>
        <span class="switch"><input type="checkbox" id="pinToggle" ${s.pin ? "checked" : ""}><span class="track"></span></span>
      </label>
      <div class="hint" style="margin-bottom:${s.pin ? "12px" : "0"}">Un code à 4 chiffres sera demandé à chaque ouverture de l'application.</div>
      ${s.pin ? `<div style="display:flex;gap:9px"><button class="btn sm" id="pinChange">${svg("edit")}Changer le code</button><button class="btn sm" id="pinLock">${svg("lock")}Verrouiller</button></div>` : ""}
    </div></div>

    <div class="card"><div class="card-h"><h3>Réservations en ligne</h3>${onlineOn() ? '<span class="pill good">Activé</span>' : '<span class="pill mut">Désactivé</span>'}</div><div class="card-b">
      <p style="margin:0 0 12px;font-size:13px;color:var(--muted)">Collez vos 3 valeurs Supabase : les réservations des clients arriveront toutes seules dans l'app. <a href="#" id="onHelp" style="color:var(--accent-ink)">Où les trouver ?</a></p>
      <div class="field"><label>Project URL</label><input id="o_url" placeholder="https://xxxxx.supabase.co" value="${esc(oc.url)}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field"><label>Clé « anon public »</label><input id="o_key" placeholder="eyJhbGci..." value="${esc(oc.anonKey)}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field"><label>Code secret</label><input id="o_sec" placeholder="votre code du schéma SQL" value="${esc(oc.secret)}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div style="display:flex;gap:9px"><button class="btn primary grow" id="saveOnline">${svg("check")}Enregistrer</button><button class="btn" id="testOnline">Tester</button></div></div></div>

    <div class="card"><div class="card-h"><h3>Mes données</h3><span class="mut">${DB.clients.length} clients · ${DB.sales.length} ventes</span></div><div class="card-b">
      <p style="margin:0 0 12px;font-size:13px;color:var(--muted)">Tout est stocké sur ce téléphone. Faites une sauvegarde de temps en temps (fichier à garder ou à vous envoyer).</p>
      <div style="display:flex;flex-direction:column;gap:9px">
        <button class="btn" id="backup">${svg("download")}Sauvegarder (fichier)</button>
        <button class="btn" id="copybk">${svg("copy")}Copier la sauvegarde</button>
        <button class="btn" id="restore">${svg("upload")}Restaurer</button>
        <button class="btn danger" id="reset">${svg("trash")}Tout réinitialiser</button>
      </div></div></div>

    <div id="installCard"></div>
    <div style="text-align:center;color:var(--faint);font-size:12px;margin:18px 0 4px">Salon Pro · application pour coiffeur · 100% sur votre téléphone</div>`;

  $("#saveSalon").onclick = () => { s.name = $("#s_name").value.trim() || "Mon salon"; s.currency = $("#s_cur").value.trim() || "DA"; s.phone = $("#s_phone").value.trim(); s.address = $("#s_addr").value.trim(); save(); render(); toast("Enregistré"); };
  $("#saveMsg").onclick = () => { s.reminderTemplate = $("#s_tmpl").value; s.receiptFooter = $("#s_foot").value.trim(); s.defaultDuration = Number($("#s_dur").value) || 30; save(); toast("Enregistré"); };
  $$("#theme [data-t]").forEach((b) => b.onclick = () => { setTheme(b.dataset.t); viewSettings(c); });
  const tgl = $("#pinToggle"); if (tgl) tgl.onchange = () => {
    if (tgl.checked) setPinSheet((ok) => { if (!ok) tgl.checked = false; viewSettings(c); });
    else confirmSheet("Désactiver le verrouillage ?", "L'application s'ouvrira sans code.", () => { DB.salon.pin = ""; save(); viewSettings(c); toast("Verrouillage désactivé"); }, { yes: "Désactiver" });
  };
  const pc = $("#pinChange"); if (pc) pc.onclick = () => setPinSheet(() => viewSettings(c));
  const pl = $("#pinLock"); if (pl) pl.onclick = lockNow;
  $("#saveOnline").onclick = () => {
    s.online = { url: $("#o_url").value.trim().replace(/\/+$/, ""), anonKey: $("#o_key").value.trim(), secret: $("#o_sec").value.trim() };
    _sb = null; _sbKey = ""; onlineLoaded = false; onlineBookings = []; onlineErr = ""; save(); render(); toast(onlineOn() ? "Réservations en ligne activées ✓" : "Enregistré");
  };
  $("#testOnline").onclick = async () => {
    const o = { url: $("#o_url").value.trim().replace(/\/+$/, ""), anonKey: $("#o_key").value.trim(), secret: $("#o_sec").value.trim() };
    if (!(o.url && o.anonKey && o.secret)) { toast("Remplissez les 3 champs", "info"); return; }
    s.online = o; _sb = null; _sbKey = ""; save(); toast("Test en cours…"); onlineLoaded = false;
    await loadOnlineBookings(false);
    toast(onlineErr ? "Échec : " + onlineErr : `OK — ${onlineBookings.length} réservation(s) lue(s)`, onlineErr ? "bad" : "good");
  };
  const oh = $("#onHelp"); if (oh) oh.onclick = (e) => { e.preventDefault(); onlineHelpSheet(); };
  $("#backup").onclick = shareOrDownloadBackup;
  $("#copybk").onclick = async () => { try { await navigator.clipboard.writeText(backupText()); toast("Sauvegarde copiée"); } catch (e) { restoreSheet(true); } };
  $("#restore").onclick = () => restoreSheet();
  $("#reset").onclick = () => confirmSheet("Tout réinitialiser ?", "Clients, ventes, rendez-vous et charges seront effacés. Faites une sauvegarde avant si besoin.", () => { DB = BASE(); DB.salon.onboarded = true; save(); render(); toast("Données réinitialisées"); });
  // install
  if (deferredPrompt) { $("#installCard").innerHTML = `<div class="card"><div class="card-b"><div class="insight" style="margin:0"><div class="ic" style="background:var(--accent-soft);color:var(--accent-ink)">${svg("install")}</div><div class="grow"><b>Installer l'application</b><span>Ajoutez-la à votre écran d'accueil.</span></div><button class="btn primary sm" id="inst">Installer</button></div></div></div>`; $("#inst").onclick = promptInstall; }
}
function restoreSheet(paste) {
  openSheet("Restaurer des données", `
    <p style="margin:0 0 12px;color:var(--muted);font-size:13.5px">Choisissez un fichier de sauvegarde, ou collez son contenu.</p>
    <div class="field"><input type="file" id="r_file" accept="application/json,.json"></div>
    <div class="field"><label>…ou coller le texte</label><textarea id="r_txt" class="mono" style="min-height:120px;font-size:11.5px" placeholder="Collez la sauvegarde ici"></textarea></div>`, {
    footer: `<button class="btn primary block" data-go>${svg("upload")}Restaurer</button>`,
    onMount(root) {
      const apply = (txt) => { try { importFromText(txt); closeSheet(); render(); toast("Données restaurées ✓"); } catch (e) { toast("Fichier invalide", "bad"); } };
      $("#r_file", root).onchange = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => apply(String(rd.result)); rd.readAsText(f); };
      $("[data-go]", root).onclick = () => { const t = $("#r_txt").value.trim(); if (!t) { toast("Choisissez un fichier ou collez le texte", "bad"); return; } apply(t); };
    },
  });
}

/* ======================= Onboarding ======================= */
function startOnboarding() {
  const root = $("#onb-root");
  const S = DB.salon;
  let step = 0;
  const draw = () => {
    if (step === 0) {
      root.innerHTML = `<div class="onb"><div class="onb-inner">
        ${brandMark("onb-emblem")}
        <h1>Bienvenue sur Salon Pro</h1>
        <p class="lead">L'application pour gérer votre salon : clients, rendez-vous, caisse, finances et rappels — même sans internet, tout reste sur votre téléphone.</p>
        <div class="onb-dots"><i class="on"></i><i></i></div>
        <button class="btn primary lg block" id="start">Commencer</button></div></div>`;
      $("#start").onclick = () => { step = 1; draw(); };
    } else if (step === 1) {
      root.innerHTML = `<div class="onb"><div class="onb-inner">
        <h1 style="margin-top:8px">Votre salon</h1>
        <p class="lead">Deux infos pour commencer (modifiable plus tard).</p>
        <div class="field"><label>Nom du salon</label><input id="o_name" value="${esc(S.name === "Mon salon" ? "" : S.name)}" placeholder="Ex : Salon Karim"></div>
        <div class="field"><label>Devise</label><input id="o_cur" value="${esc(S.currency)}" style="max-width:130px"></div>
        <div class="onb-dots"><i></i><i class="on"></i></div>
        <button class="btn primary lg block" id="next">Continuer</button></div></div>`;
      $("#next").onclick = () => { S.name = $("#o_name").value.trim() || "Mon salon"; S.currency = $("#o_cur").value.trim() || "DA"; step = 2; draw(); };
      setTimeout(() => $("#o_name")?.focus(), 100);
    } else {
      root.innerHTML = `<div class="onb"><div class="onb-inner">
        <h1 style="margin-top:8px">Comment démarrer ?</h1>
        <p class="lead">Vous pourrez tout modifier ensuite.</p>
        <button class="choice" id="c_empty"><div class="ic">${svg("sparkle")}</div><div><b>Démarrer à vide</b><span>Je saisis mes vrais clients et services.</span></div></button>
        <button class="choice" id="c_demo"><div class="ic">${svg("info")}</div><div><b>Charger des exemples</b><span>Voir l'app remplie pour la découvrir, puis effacer.</span></div></button>
        <div class="onb-dots"><i></i><i class="on"></i></div></div></div>`;
      $("#c_empty").onclick = () => { S.onboarded = true; save(); finishOnboarding(); addStarterServices(); };
      $("#c_demo").onclick = () => { loadExampleData(); finishOnboarding(); };
    }
  };
  draw();
}
function addStarterServices() {
  // quelques prestations de base pour ne pas démarrer totalement vide
  [["Coupe homme", 800, 30, "Coupe"], ["Coupe + barbe", 1200, 45, "Coupe"], ["Taille de barbe", 500, 20, "Barbe"]].forEach((x) => DB.services.push({ id: uid(), name: x[0], price: x[1], duration: x[2], category: x[3] }));
  save(); render();
}
function finishOnboarding() { $("#onb-root").innerHTML = ""; renderChrome(); render(); toast("C'est parti 💈"); }

/* ======================= PWA : installation & mises à jour ======================= */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; refreshInstallUI(); });
window.addEventListener("appinstalled", () => { deferredPrompt = null; refreshInstallUI(); });
function refreshInstallUI() { const b = $("#btnInstall"); if (b) b.hidden = !deferredPrompt; if (route === "settings") render(); }
async function promptInstall() { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; refreshInstallUI(); }

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("service-worker.js").then((reg) => {
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing; if (!nw) return;
      nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner(nw); });
    });
  }).catch(() => {});
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (refreshing) return; refreshing = true; location.reload(); });
}
function showUpdateBanner(worker) {
  if ($("#updbanner")) return;
  const b = document.createElement("div"); b.id = "updbanner"; b.className = "update-banner";
  b.innerHTML = `<span class="grow">Nouvelle version disponible</span><button>Mettre à jour</button>`;
  document.body.appendChild(b);
  b.querySelector("button").onclick = () => { worker.postMessage("skipWaiting"); b.remove(); };
}

/* ======================= Initialisation ======================= */
/* ======================= Verrouillage par code PIN ======================= */
let appUnlocked = false;
let pinEntry = "";
function lockNow() { if (!DB.salon.pin) return; appUnlocked = false; haptic(); showLock(); }
function showLock() {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "back"];
  $("#lock-root").innerHTML = `<div class="lock"><div class="lock-inner">
    <div class="lock-logo has-mark">${brandMark()}</div>
    <h2>${esc(DB.salon.name || "Salon Pro")}</h2>
    <p>Entrez votre code</p>
    <div class="dots" id="pdots"><i></i><i></i><i></i><i></i></div>
    <div class="keypad">${keys.map((k) => k === "" ? "<span></span>" : k === "back"
      ? `<button class="kb back" data-k="back" aria-label="Effacer">${svg("backspace")}</button>`
      : `<button class="kb" data-k="${k}">${k}</button>`).join("")}</div>
    <button class="lock-forgot" id="forgot">Code oublié ?</button>
  </div></div>`;
  pinEntry = "";
  $$("#lock-root .kb").forEach((b) => b.onclick = () => b.dataset.k === "back" ? pinBack() : pinAdd(b.dataset.k));
  $("#forgot").onclick = showRecovery;
}
function pinDots() { const d = $("#pdots"); if (d) [...d.children].forEach((x, i) => x.classList.toggle("on", i < pinEntry.length)); }
function pinAdd(d) { if (pinEntry.length >= 4) return; pinEntry += d; haptic(6); pinDots(); if (pinEntry.length === 4) setTimeout(pinCheck, 130); }
function pinBack() { pinEntry = pinEntry.slice(0, -1); haptic(6); pinDots(); }
function pinCheck() {
  if (pinEntry === DB.salon.pin) { appUnlocked = true; $("#lock-root").innerHTML = ""; haptic(12); }
  else { const d = $("#pdots"); if (d) d.classList.add("err"); haptic(60); setTimeout(() => { pinEntry = ""; pinDots(); const d2 = $("#pdots"); if (d2) d2.classList.remove("err"); }, 480); }
}
const normAns = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
function setPinSheet(onDone) {
  openSheet("Code de verrouillage", `
    <p style="margin:0 0 12px;color:var(--muted);font-size:13.5px">Choisissez un code à 4 chiffres. Il sera demandé à chaque ouverture de l'application.</p>
    <div class="row2">
      <div class="field"><label>Nouveau code</label><input id="pin1" inputmode="numeric" maxlength="4" type="password" placeholder="••••"></div>
      <div class="field"><label>Confirmer</label><input id="pin2" inputmode="numeric" maxlength="4" type="password" placeholder="••••"></div>
    </div>
    <div class="section-lbl" style="margin-top:6px">Récupération</div>
    <div class="field"><label>Question secrète</label>
      <input id="pinq" list="pinqs" value="${esc(DB.salon.pinQuestion || "")}" placeholder="Ex : Ville de naissance ?">
      <datalist id="pinqs"><option value="Ville de naissance ?"><option value="Nom de votre premier animal ?"><option value="Nom de jeune fille de votre mère ?"><option value="Prénom de votre meilleur(e) ami(e) ?"><option value="Nom de votre quartier d'enfance ?"></datalist></div>
    <div class="field"><label>Réponse</label><input id="pina" autocomplete="off" placeholder="Votre réponse">
      <div class="hint">Si vous oubliez le code, cette réponse permettra d'en définir un nouveau.</div></div>`, {
    footer: `<button class="btn ghost" data-cancel>Annuler</button><button class="btn primary" data-save>${svg("check")}Enregistrer</button>`,
    onMount(rt) {
      $("[data-cancel]", rt).onclick = () => { closeSheet(); if (onDone) onDone(false); };
      $("[data-save]", rt).onclick = () => {
        const a = $("#pin1").value.trim(), b = $("#pin2").value.trim();
        const q = $("#pinq").value.trim(), ans = $("#pina").value.trim();
        if (!/^\d{4}$/.test(a)) { toast("Entrez 4 chiffres", "bad"); return; }
        if (a !== b) { toast("Les codes ne correspondent pas", "bad"); return; }
        if (!q || !ans) { toast("Ajoutez une question et sa réponse", "bad"); return; }
        DB.salon.pin = a; DB.salon.pinQuestion = q; DB.salon.pinAnswer = normAns(ans);
        appUnlocked = true; save(); closeSheet(); render(); toast("Verrouillage activé ✓"); if (onDone) onDone(true);
      };
    },
  });
}
function showRecovery() {
  const root = $("#lock-root");
  const logo = `<div class="lock-logo has-mark">${brandMark()}</div>`;
  if (!DB.salon.pinQuestion) {
    root.innerHTML = `<div class="lock"><div class="lock-inner">
      ${logo}<h2>Code oublié</h2>
      <p style="text-transform:none;letter-spacing:0;font-family:var(--ff);margin:12px 0 22px;line-height:1.5">Aucune question de récupération n'a été configurée pour ce code. Vous pouvez restaurer une sauvegarde depuis un autre appareil.</p>
      <button class="btn block" id="recBack">Retour</button></div></div>`;
    $("#recBack").onclick = showLock; return;
  }
  root.innerHTML = `<div class="lock"><div class="lock-inner">
    ${logo}<h2>Code oublié</h2>
    <p style="text-transform:none;letter-spacing:0;font-family:var(--ff);margin:12px 0 16px;font-size:16px;color:var(--fg)">${esc(DB.salon.pinQuestion)}</p>
    <input id="recAns" autocomplete="off" placeholder="Votre réponse" style="width:100%;padding:14px;border:1px solid var(--line-2);border-radius:12px;background:var(--surface-2);color:var(--fg);font-size:16px;text-align:center">
    <button class="btn primary block" id="recGo" style="margin-top:12px">${svg("check")}Valider</button>
    <button class="btn ghost block" id="recBack" style="margin-top:8px">Retour</button></div></div>`;
  $("#recBack").onclick = showLock;
  $("#recAns").onkeydown = (e) => { if (e.key === "Enter") $("#recGo").click(); };
  $("#recGo").onclick = () => {
    if (normAns($("#recAns").value) && normAns($("#recAns").value) === DB.salon.pinAnswer) {
      appUnlocked = true; root.innerHTML = ""; haptic(12); go("settings");
      setTimeout(() => { toast("Récupéré — choisissez un nouveau code"); setPinSheet(() => render()); }, 320);
    } else { toast("Réponse incorrecte", "bad"); haptic(50); }
  };
}

function boot() {
  $("#btnSettings").innerHTML = svg("gear");
  $("#btnInstall").innerHTML = svg("install");
  const bl = $("#btnLock"); if (bl) { bl.innerHTML = svg("lock"); bl.onclick = lockNow; }
  $("#logo").onclick = () => go("dash");
  $("#btnSettings").onclick = () => go("settings");
  $("#btnTheme").onclick = () => { setTheme(isDark() ? "light" : "dark"); };
  $("#btnInstall").onclick = promptInstall;
  window.addEventListener("hashchange", () => { closeSheet(); onHash(); });
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (themeMode() === "system") { setTheme("system"); render(); } });
  renderChrome();
  if (!DB.salon.onboarded && !DB.sales.length && !DB.clients.length) startOnboarding();
  onHash();
  if (DB.salon.pin && !appUnlocked) showLock();   // verrouillage par code
  registerSW();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
