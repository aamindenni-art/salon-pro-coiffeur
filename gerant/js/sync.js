/* ===========================================================
   Salon Gérant v6 — synchro cloud (Supabase) + réservations en ligne.
   Principe : l'appareil reste la référence (tout marche hors-ligne) ;
   on pousse les changements avec contrôle de version, et en cas de
   modification simultanée sur 2 appareils on fusionne (GLib.merge3).
   =========================================================== */
"use strict";

const SYNC = { status: "off", busy: false, again: false, deb: null, timer: null, lastErr: "" };

function loadSync(){
  try { const s = JSON.parse(localStorage.getItem(SYNC_KEY)); if (s && typeof s === "object") return s; } catch (e) {}
  return { on: false };
}
let SS = loadSync();
function saveSync(){ try { localStorage.setItem(SYNC_KEY, JSON.stringify(SS)); } catch (e) {} }
const syncOn = () => !!(SS.on && SS.code && SS.secret && CFG.supabaseUrl && CFG.supabaseAnonKey);
const cred = () => ({ p_id: SS.code, p_secret: SS.secret });

function getBase(){ try { return JSON.parse(localStorage.getItem(BASE_KEY)) || null; } catch (e) { return null; } }
function setBase(b){ try { localStorage.setItem(BASE_KEY, JSON.stringify(b)); } catch (e) {} }
function clearBase(){ try { localStorage.removeItem(BASE_KEY); } catch (e) {} }

function setStatus(st){
  if (SYNC.status === st) return;
  SYNC.status = st;
  if (document.getElementById("topActions")) paintStatus();
}
const isNetErr = e => !e || e instanceof TypeError || e.name === "AbortError";
const sameTs = (a, b) => a === b || (!!a && !!b && Date.parse(a) === Date.parse(b));

async function rpc(fn, args){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(CFG.supabaseUrl + "/rest/v1/rpc/" + fn, {
      method: "POST", signal: ctl.signal, cache: "no-store",
      headers: { apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const txt = await r.text();
    let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok){ const err = new Error((j && j.message) || ("HTTP " + r.status)); err.code = (j && j.message) || "http"; throw err; }
    return j;
  } finally { clearTimeout(t); }
}

/* appelé à chaque enregistrement local */
function markDirty(){
  if (!syncOn()) return;
  if (!SS.dirty){ SS.dirty = true; saveSync(); }
  clearTimeout(SYNC.deb);
  SYNC.deb = setTimeout(syncCycle, 1200);
}

/* pousse l'état local ; en cas de conflit, fusionne et laisse « à pousser » */
async function pushStep(){
  const rev = REV, payload = JSON.parse(JSON.stringify(DB));
  const r = await rpc("gerant_push2", Object.assign(cred(), { p_data: payload, p_base: SS.lastTs || null }));
  if (!syncOn()) return;
  if (r && r.ok){
    SS.lastTs = r.updated_at; setBase(GLib.snapshot(payload));
    if (REV === rev) SS.dirty = false;
    saveSync(); return;
  }
  const remote = normalize(r && r.data);
  DB = normalize(GLib.merge3(DB, remote, getBase()));
  DB.setup = true;
  setBase(GLib.snapshot(remote)); SS.lastTs = r.updated_at; SS.dirty = true; saveSync();
  persist(); afterRemoteApply();
}
async function settle(){ for (let i = 0; i < 4 && SS.dirty && syncOn(); i++) await pushStep(); }

async function pullStep(){
  const r = await rpc("gerant_pull", cred());
  if (!syncOn() || SS.dirty) return;
  if (!r || !r.data){ SS.lastTs = null; SS.dirty = true; saveSync(); return; }
  DB = normalize(r.data); DB.setup = true;
  persist(); setBase(GLib.snapshot(DB)); SS.lastTs = r.updated_at; saveSync();
  afterRemoteApply();
}

/* réservations faites par les clients sur la page publique → rendez-vous « en attente » */
async function importBookings(){
  const list = await rpc("gerant_bookings_pull", cred());
  if (!syncOn() || !Array.isArray(list)) return;
  const ack = new Set(SS.ack || []);
  let added = 0;
  list.forEach(b => {
    const id = cleanId(b && b.id);
    if (!id || ack.has(id)) return;
    if (!DB.rdv.some(r => r.id === id)){
      DB.rdv.push({ id, clientId: "", clientName: S(b.name) || "Client", clientPhone: S(b.phone),
        date: isISO(b.date) ? b.date : todayISO(), time: isHM(b.time) ? b.time : "10:00",
        employeId: cleanId(b.emp), serviceId: cleanId(b.svc), serviceName: S(b.svcName),
        status: "attente", note: S(b.note), source: "web", createdAt: S(b.at) });
      added++;
    }
    ack.add(id);
  });
  SS.ack = Array.from(ack);
  if (added){
    REV++; persist(); SS.dirty = true;
    toast(added > 1 ? added + " nouvelles réservations en ligne" : "Nouvelle réservation en ligne", "info");
  }
  saveSync();
  if (added) afterRemoteApply();
}

async function syncCycle(){
  if (!syncOn()){ setStatus("off"); return; }
  if (SYNC.busy){ SYNC.again = true; return; }
  SYNC.busy = true; SYNC.again = false;
  clearTimeout(SYNC.deb);
  try {
    let pend = false;
    if (SS.dirty){ setStatus("sync"); await settle(); pend = DB.salon.booking; }
    else {
      const p = await rpc("gerant_poll", cred());
      if (!syncOn()) return;
      if (!p){ SS.lastTs = null; SS.dirty = true; saveSync(); await settle(); }
      else {
        if (!sameTs(p.updated_at, SS.lastTs) && !SS.dirty) await pullStep();
        pend = N(p.pending) > 0;
      }
    }
    if (!syncOn()) return;
    if (!SS.dirty && pend) await importBookings();
    if (SS.dirty) await settle();
    // on n'accuse réception qu'une fois les rendez-vous enregistrés dans le cloud (le créneau reste occupé)
    if (syncOn() && !SS.dirty && SS.ack && SS.ack.length){
      await rpc("gerant_bookings_ack", Object.assign(cred(), { p_ids: SS.ack }));
      SS.ack = []; saveSync();
    }
    SYNC.lastErr = "";
    if (syncOn()) setStatus(SS.dirty ? "sync" : "ok");
  } catch (e){
    if (isNetErr(e)) setStatus("offline");
    else {
      const first = SYNC.lastErr !== e.code;
      SYNC.lastErr = e.code || "err";
      setStatus("error");
      if (first) toast(e.code === "bad_secret" ? "Synchro : code secret refusé" : "Synchro : erreur (" + (e.message || "inconnue") + ")", "bad");
      console.warn("sync", e);
    }
  } finally {
    SYNC.busy = false;
    if (!syncOn()) setStatus("off");
    else if (SYNC.again || SS.dirty && SYNC.status === "ok"){ SYNC.again = false; setTimeout(syncCycle, 300); }
  }
}

/* un document distant vient d'être appliqué : on rafraîchit sans gêner l'utilisateur */
function afterRemoteApply(){
  if (!DB.setup) return;
  if (typeof ticketCheck === "function") ticketCheck();
  if (LOCK_MODE === "pin" || LOCK_MODE === "onb"){ _pendingRender = true; return; }
  if (!authOk()){ if (LOCK_MODE !== "lock") render(); return; }
  if (LOCK_MODE === "lock"){ render(); return; }
  paintChrome(); softRender();
}

/* ----- activation / arrêt (appelés depuis Réglages et l'accueil) ----- */
const cleanCode = v => S(v).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
function syncCheckInput(code, secret){
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return "Synchro non configurée sur cette installation";
  if (code.length < 3) return "Code salon : 3 caractères minimum (lettres, chiffres, tirets)";
  if (secret.length < 6) return "Code secret : 6 caractères minimum";
  return "";
}
/* mode : "new" (rien dans le cloud), "load" (prendre le cloud), "replace" (écraser le cloud) */
function syncStart(code, secret, mode, remote){
  SS = { on: true, code, secret, lastTs: remote ? remote.updated_at : null, dirty: mode !== "load", ack: [] };
  if (mode === "load"){
    DB = normalize(remote.data); DB.setup = true; REV++;
    persist(); setBase(GLib.snapshot(DB));
  } else if (mode === "replace") setBase(GLib.snapshot(DB));
  else clearBase();
  saveSync();
  SYNC.lastErr = "";
  setStatus("sync");
  syncCycle();
}
function syncStop(){
  clearTimeout(SYNC.deb);
  SS = { on: false };
  saveSync(); clearBase();
  setStatus("off");
}

function initSync(){
  if (syncOn()){
    // passage v5 → v6 : pas d'empreinte de référence → on pousse (fusion par union si le cloud a bougé)
    if (!getBase() && !SS.dirty){ SS.dirty = true; saveSync(); }
    SYNC.status = "sync";
    setTimeout(syncCycle, 400);
  }
  SYNC.timer = setInterval(() => { if (!document.hidden && syncOn() && navigator.onLine !== false) syncCycle(); }, 15000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && syncOn()) syncCycle(); });
  window.addEventListener("online", () => { if (syncOn()) syncCycle(); });
  window.addEventListener("offline", () => { if (syncOn()) setStatus("offline"); });
}
