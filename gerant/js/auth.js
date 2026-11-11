/* ===========================================================
   Salon Gérant v6 — rôles & code PIN.
   Gérant : accès complet. Coiffeur : son tableau de bord, sa caisse,
   ses rendez-vous et ses ventes uniquement.
   (Contrôle d'accès de l'application — pas un chiffrement des données.)
   =========================================================== */
"use strict";

let LOCK_MODE = "";          // "" | "lock" (verrouillé) | "pin" (création de code) | "onb" (premier lancement)
let PAD = null;
let SESSION = (() => { try { return JSON.parse(sessionStorage.getItem(SESS_KEY)) || null; } catch (e) { return null; } })();

function setSession(s){
  SESSION = s;
  try { if (s) sessionStorage.setItem(SESS_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SESS_KEY); } catch (e) {}
}
const pinEnabled = () => !!DB.salon.pinHash;
function authOk(){
  if (!pinEnabled()) return true;
  if (!SESSION) return false;
  if (SESSION.role === "gerant") return true;
  const e = emp(SESSION.empId);
  return !!(e && e.active && e.pinHash);
}
const isGerant = () => !pinEnabled() || (!!SESSION && SESSION.role === "gerant");
const meId = () => (pinEnabled() && SESSION && SESSION.role === "emp") ? SESSION.empId : "";
const me = () => emp(meId()) || null;

/* ---------- hachage ---------- */
function randChars(n, alphabet){
  const a = new Uint32Array(n); crypto.getRandomValues(a);
  return Array.from(a, x => alphabet[x % alphabet.length]).join("");
}
const hashG = pin => GLib.sha256(DB.salon.salt + ":" + pin);
const hashE = (id, pin) => GLib.sha256(DB.salon.salt + ":" + id + ":" + pin);
const hashR = code => GLib.sha256(DB.salon.salt + ":rescue:" + S(code).toUpperCase().replace(/[^A-Z0-9]/g, ""));

/* ---------- anti-essais répétés ---------- */
function getAtt(){ try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || {}; } catch (e) { return {}; } }
function saveAtt(a){ try { localStorage.setItem(LOCK_KEY, JSON.stringify(a)); } catch (e) {} }
const lockWait = () => Math.max(0, Math.ceil((N(getAtt().until) - Date.now()) / 1000));
function failAttempt(){
  const a = getAtt(); a.n = N(a.n) + 1;
  if (a.n >= 5){ a.n = 0; a.until = Date.now() + 30000; saveAtt(a); return "Trop d'essais — patientez 30 s"; }
  saveAtt(a);
  return "Code incorrect";
}
const waitMsg = w => "Trop d'essais — patientez " + w + " s";

/* ---------- pavé numérique ---------- */
function lockPaint(html){
  const l = $("#lock");
  l.innerHTML = `<div class="lock-in">${html}</div>`;
  l.hidden = false; l.scrollTop = 0;
}
function padShow(o){
  PAD = { buf: "", busy: false, o };
  lockPaint(`${o.av || `<div class="emblem">${ic("lock", 26)}</div>`}
    <h2>${esc(o.title)}</h2><p class="sub">${esc(o.sub || "")}</p>
    <div class="pin-dots" id="pinDots"><i></i><i></i><i></i><i></i></div>
    <div class="pin-msg" id="pinMsg">${esc(o.msg || "")}</div>
    <div class="pad">
      ${[1,2,3,4,5,6,7,8,9].map(d => `<button type="button" onclick="padKey('${d}')">${d}</button>`).join("")}
      ${o.onCancel ? `<button type="button" class="gh" onclick="padCancel()">${esc(o.cancelLbl || "Retour")}</button>` : "<span></span>"}
      <button type="button" onclick="padKey('0')">0</button>
      <button type="button" class="gh" onclick="padBack()" aria-label="Effacer">${ic("back", 24)}</button>
    </div>${o.extra || ""}`);
}
function padDots(){
  const d = $("#pinDots"); if (!d || !PAD) return;
  $$("i", d).forEach((el, i) => el.classList.toggle("on", i < PAD.buf.length));
}
function padKey(d){
  const P = PAD;
  if (!P || P.busy || P.buf.length >= 4) return;
  const m = $("#pinMsg"); if (m && P.buf.length === 0) m.textContent = "";
  P.buf += d; padDots();
  if (P.buf.length < 4) return;
  P.busy = true;
  setTimeout(() => {
    if (PAD !== P) return;
    const res = P.o.onDone(P.buf);
    if (res === true || PAD !== P) return;
    const dots = $("#pinDots"), msg = $("#pinMsg");
    if (msg) msg.textContent = res || "Code incorrect";
    if (dots) dots.classList.add("err");
    setTimeout(() => { if (PAD !== P) return; P.buf = ""; P.busy = false; if (dots) dots.classList.remove("err"); padDots(); }, 420);
  }, 110);
}
function padBack(){ if (!PAD || PAD.busy) return; PAD.buf = PAD.buf.slice(0, -1); padDots(); }
function padCancel(){ if (PAD && PAD.o.onCancel) PAD.o.onCancel(); }
document.addEventListener("keydown", e => {
  if (!PAD || !LOCK_MODE || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key)){ padKey(e.key); e.preventDefault(); }
  else if (e.key === "Backspace"){ padBack(); e.preventDefault(); }
});

/* ---------- écran de verrouillage ---------- */
function showLock(){
  if (LOCK_MODE === "lock") return;
  _pendingRender = false; closeSheet(); if (_dlgRes) closeDlg(null);
  LOCK_MODE = "lock";
  lockProfiles();
}
function hideLock(){
  LOCK_MODE = ""; PAD = null;
  const l = $("#lock"); if (!l.hidden){ l.hidden = true; l.innerHTML = ""; }
}
function lockProfiles(){
  const emps = activeEmps().filter(e => e.pinHash);
  if (!emps.length){ lockPad("g"); return; }
  PAD = null;
  const row = (arg, av, name, sub) => `<button type="button" onclick="lockPad('${arg}')">${av}<div class="grow"><b>${esc(name)}</b><div class="cap">${esc(sub)}</div></div>${ic("chevR", 18)}</button>`;
  lockPaint(`<div class="emblem">${esc((DB.salon.name || "G").trim().charAt(0).toUpperCase())}</div>
    <h2>${esc(DB.salon.name || "Salon")}</h2><p class="sub">Qui utilise l'application ?</p>
    <div class="profiles">
      ${row("g", `<div class="av icn">${ic("shield")}</div>`, "Gérant", "Accès complet")}
      ${emps.map(e => row(e.id, empAv(e), e.name, e.role || "Coiffeur")).join("")}
    </div>`);
}
function lockPad(who){
  const many = activeEmps().some(e => e.pinHash);
  const e = who === "g" ? null : emp(who);
  if (who !== "g" && !e){ lockProfiles(); return; }
  const w = lockWait();
  padShow({
    av: e ? empAv(e, "lg").replace('class="av', 'style="margin:0 auto 14px" class="av') : null,
    title: e ? e.name : (many ? "Gérant" : (DB.salon.name || "Salon")),
    sub: "Entrez votre code PIN",
    msg: w ? waitMsg(w) : "",
    onCancel: many ? lockProfiles : null,
    onDone: pin => tryUnlock(who, pin),
    extra: who === "g"
      ? `<button type="button" class="link mt2" onclick="rescueForm()">Code oublié ?</button>`
      : `<p class="cap mt2">Code oublié ? Demandez au gérant de le réinitialiser.</p>`,
  });
}
function tryUnlock(who, pin){
  const w = lockWait();
  if (w > 0) return waitMsg(w);
  let ok = false;
  if (who === "g") ok = hashG(pin) === DB.salon.pinHash;
  else { const e = emp(who); ok = !!(e && e.active && e.pinHash && hashE(e.id, pin) === e.pinHash); }
  if (!ok) return failAttempt();
  saveAtt({});
  setSession(who === "g" ? { role: "gerant" } : { role: "emp", empId: who });
  hideLock(); _lastRoute = null; render();
  return true;
}
function lockNow(){
  if (!pinEnabled() || LOCK_MODE === "pin") return;
  setSession(null);
  _pendingRender = false; closeSheet(); if (_dlgRes) closeDlg(null);
  render();
}

/* ---------- code de secours (PIN gérant oublié) ---------- */
function rescueForm(msg){
  PAD = null;
  lockPaint(`<div class="emblem">${ic("key", 26)}</div>
    <h2>Code de secours</h2>
    <p class="sub">Saisissez le code à 8 caractères qui vous a été donné à la création du code PIN.</p>
    <form onsubmit="rescueTry();return false" style="margin-top:22px">
      <input class="inp center" id="rescueInp" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="XXXX-XXXX"
        style="letter-spacing:.18em;font-weight:800;text-transform:uppercase">
      <div class="pin-msg mt" id="pinMsg">${esc(msg || "")}</div>
      <div class="btn-row"><button type="button" class="btn ghost" onclick="lockProfiles()">Retour</button><button class="btn" type="submit">Valider</button></div>
    </form>`);
  $("#rescueInp").focus();
}
function rescueTry(){
  const m = $("#pinMsg"), w = lockWait();
  if (w > 0){ m.textContent = waitMsg(w); return; }
  const code = val("rescueInp");
  if (!DB.salon.rescueHash || hashR(code) !== DB.salon.rescueHash){ m.textContent = failAttempt(); return; }
  saveAtt({});
  pinFlow({ title: "Nouveau code du gérant", cancel: false }, pin => {
    const nc = setGerantPin(pin, true);
    return () => showRescue(nc);
  });
}

/* ---------- création / changement de code ---------- */
function pinFlow(o, cb){
  _pendingRender = false; closeSheet(); if (_dlgRes) closeDlg(null);
  LOCK_MODE = "pin";
  const step1 = msg => padShow({
    av: o.av, title: o.title, sub: "Choisissez un code à 4 chiffres", msg,
    onCancel: o.cancel === false ? null : pinFlowEnd, cancelLbl: "Annuler",
    onDone: p1 => {
      padShow({ av: o.av, title: o.title, sub: "Saisissez-le une seconde fois pour confirmer",
        onCancel: () => step1(""), cancelLbl: "Retour",
        onDone: p2 => {
          if (p2 !== p1){ step1("Les deux codes sont différents — recommencez"); return true; }
          const after = cb(p1);
          pinFlowEnd();
          if (typeof after === "function") after();
          return true;
        } });
      return true;
    },
  });
  step1("");
}
function pinFlowEnd(){
  LOCK_MODE = ""; PAD = null;
  const l = $("#lock"); l.hidden = true; l.innerHTML = "";
  render();
}
function setGerantPin(pin, newRescue){
  if (!DB.salon.salt) DB.salon.salt = randChars(16, "0123456789abcdef");
  DB.salon.pinHash = hashG(pin);
  let code = "";
  if (newRescue || !DB.salon.rescueHash){
    code = randChars(8, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
    DB.salon.rescueHash = hashR(code);
  }
  setSession({ role: "gerant" });
  save();
  return code;
}
function showRescue(code){
  if (!code) return;
  infoBox("Code de secours", `<p>Si vous oubliez votre code PIN, ce code permet d'en créer un nouveau. Notez-le et gardez-le en lieu sûr : il ne sera plus affiché.</p>
    <div class="code center" style="font-size:22px;letter-spacing:.16em;font-weight:800;margin-top:14px">${esc(code.slice(0, 4) + "-" + code.slice(4))}</div>`, "Je l'ai noté");
}
function pinSetup(){
  if (!isGerant()) return denied();
  const first = !pinEnabled();
  pinFlow({ title: first ? "Code PIN du gérant" : "Nouveau code du gérant" }, pin => {
    const code = setGerantPin(pin, first);
    toast("Code PIN enregistré");
    return code ? () => showRescue(code) : null;
  });
}
async function rescueRenew(){
  if (!isGerant() || !pinEnabled()) return denied();
  if (!await askConfirm("Nouveau code de secours ?", "L'ancien code de secours ne fonctionnera plus.", { ok: "Générer" })) return;
  const code = randChars(8, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
  DB.salon.rescueHash = hashR(code); save();
  showRescue(code);
}
async function pinDisable(){
  if (!isGerant()) return denied();
  if (!await askConfirm("Désactiver le code PIN ?", "L'application s'ouvrira sans code, avec l'accès complet. Les codes des coiffeurs seront aussi supprimés.", { ok: "Désactiver", danger: true })) return;
  DB.salon.pinHash = ""; DB.salon.rescueHash = "";
  DB.employes.forEach(e => { delete e.pinHash; });
  setSession(null); save(); render();
  toast("Code PIN désactivé", "info");
}
function empPinSet(id){
  if (!isGerant()) return denied();
  const e = emp(id); if (!e) return;
  if (!pinEnabled()){ toast("Créez d'abord le code PIN du gérant (Réglages → Sécurité)", "info"); return; }
  pinFlow({ title: "Code de " + e.name, av: empAv(e, "lg").replace('class="av', 'style="margin:0 auto 14px" class="av') }, pin => {
    const x = emp(id); if (!x) return null;
    if (hashG(pin) === DB.salon.pinHash) return () => toast("Ce code est déjà celui du gérant — choisissez-en un autre", "bad");
    x.pinHash = hashE(id, pin); save();
    toast(x.name + " a maintenant son propre accès");
    return null;
  });
}
async function empPinClear(id){
  if (!isGerant()) return denied();
  const e = emp(id); if (!e) return;
  if (!await askConfirm("Retirer l'accès de " + e.name + " ?", "Ce coiffeur ne pourra plus ouvrir l'application avec son code.", { ok: "Retirer", danger: true })) return;
  const x = emp(id); if (!x) return;
  delete x.pinHash; save(); closeSheet(); render();
  toast("Accès retiré", "info");
}

/* verrouillage automatique après 5 minutes en arrière-plan */
let _hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden){ _hiddenAt = Date.now(); return; }
  if (pinEnabled() && SESSION && _hiddenAt && Date.now() - _hiddenAt > 5 * 60000) lockNow();
});
