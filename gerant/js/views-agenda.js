/* ===========================================================
   Salon Gérant v6 — agenda et rendez-vous (dont réservations en ligne).
   =========================================================== */
"use strict";

const AG = { date: todayISO(), emp: "" };
const rdvAccess = r => isGerant() || r.employeId === meId() || !r.employeId;

function agDate(iso){ if (!isISO(iso)) return; AG.date = iso; render(); }
function agStep(n){ AG.date = addDays(AG.date, n); render(); }
function agEmp(id){ AG.emp = id; render(); }

function rdvRow(r, showDate){
  const e = emp(r.employeId), s = svc(r.serviceId);
  const sub = [r.serviceName || (s && s.name) || "", e ? e.name : "Non assigné"].filter(Boolean).join(" · ");
  return `<button class="row" style="${r.status === "annule" ? "opacity:.55" : ""}" onclick="rdvSheet('${r.id}')">
    <div class="time">${showDate ? esc(frDay(r.date) + " " + r.date.slice(8)) : esc(r.time)}</div>
    <div class="grow"><div class="t">${esc(r.clientName)}</div><div class="s">${showDate ? esc(r.time) + " · " : ""}${esc(sub)}</div></div>
    ${r.source === "web" ? `<span class="badge gold">${ic("globe", 12)}En ligne</span>` : ""}${stBadge(r.status)}</button>`;
}

VIEWS.agenda = () => {
  const d = AG.date, gerant = isGerant();
  if (AG.emp && !activeEmps().some(e => e.id === AG.emp)) AG.emp = "";
  const wd = (wdOf(d) + 6) % 7, mon = addDays(d, -wd), today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const strip = `<div class="chips mb">${days.map(x => `<button class="chip day ${x === d ? "on" : ""}" onclick="agDate('${x}')"><small>${WD[wdOf(x)]}</small><b>${N(x.slice(8))}</b></button>`).join("")}</div>`;
  const empBar = gerant && activeEmps().length > 1
    ? `<div class="chips mb"><button class="chip ${!AG.emp ? "on" : ""}" onclick="agEmp('')">Tous</button>${activeEmps().map(e => `<button class="chip ${AG.emp === e.id ? "on" : ""}" onclick="agEmp('${e.id}')">${esc(e.name)}</button>`).join("")}</div>` : "";
  const list = DB.rdv.filter(r => r.date === d && rdvAccess(r) && (!AG.emp || r.employeId === AG.emp))
    .sort((a, b) => a.time.localeCompare(b.time));
  const pend = pendingWeb();
  const pendBox = pend.length ? `<div class="note warn mb">${ic("bell", 18)}<span><b>${pend.length}</b> réservation${pend.length > 1 ? "s" : ""} en ligne à confirmer${pend.some(r => r.date !== d) ? " (voir les autres jours)" : ""}.</span></div>` : "";
  return pageH("Agenda", longDate(d), `<button class="btn sm" onclick="rdvForm()">${ic("plus", 16)}Rendez-vous</button>`) +
    `<div class="flex mb"><button class="icbtn" onclick="agStep(-1)" aria-label="Jour précédent">${ic("chevL", 18)}</button>
      <input class="inp" type="date" value="${d}" onchange="agDate(this.value)" style="flex:1;min-height:42px">
      <button class="icbtn" onclick="agStep(1)" aria-label="Jour suivant">${ic("chevR", 18)}</button>
      ${d !== today ? `<button class="btn sm ghost" onclick="agDate('${today}')">Aujourd'hui</button>` : ""}</div>
    ${strip}${empBar}${pendBox}
    ${list.length ? `<div class="list">${list.map(r => rdvRow(r)).join("")}</div>`
      : `<div class="card">${emptyBox("calendar", "Aucun rendez-vous", "Appuyez sur « Rendez-vous » pour en ajouter un.")}</div>`}`;
};

/* ---------- formulaire ---------- */
function nextSlot(){
  const d = new Date(); let m = d.getHours() * 60 + d.getMinutes();
  m = Math.ceil((m + 1) / 30) * 30;
  if (m >= 24 * 60) m = 23 * 60 + 30;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
function rdvForm(id){
  const r = id ? DB.rdv.find(x => x.id === id) : null;
  if (id && (!r || !rdvAccess(r))) return;
  const gerant = isGerant();
  const eid = r ? r.employeId : (gerant ? AG.emp : meId());
  const date = r ? r.date : AG.date;
  const time = r ? r.time : (date === todayISO() ? nextSlot() : "10:00");
  const emps = activeEmps().slice();
  if (r && r.employeId && emp(r.employeId) && !emps.includes(emp(r.employeId))) emps.push(emp(r.employeId));
  const empField = gerant
    ? `<label class="f"><span>Coiffeur</span><select class="inp" id="rdE"><option value="">Non assigné</option>${emps.map(e => opt(e.id, e.name, eid)).join("")}</select></label>`
    : `<div class="f"><span>Coiffeur</span><div class="inp" style="display:flex;align-items:center">${esc(empName(meId()))}</div></div>`;
  sheet(`${sheetH(r ? "Modifier le rendez-vous" : "Nouveau rendez-vous")}
    <label class="f"><span>Client</span><input class="inp" id="rdN" list="rdDl" value="${esc(r ? r.clientName : "")}" placeholder="Nom du client" autocomplete="off" onchange="rdvNameChg()"></label>
    <datalist id="rdDl">${DB.clients.map(c => `<option value="${esc(c.name)}">`).join("")}</datalist>
    <label class="f"><span>Téléphone</span><input class="inp" id="rdP" inputmode="tel" value="${esc(r ? r.clientPhone : "")}" placeholder="05 …" autocomplete="off"></label>
    <div class="f2"><label class="f"><span>Date</span><input class="inp" type="date" id="rdD" value="${date}"></label>
      <label class="f"><span>Heure</span><input class="inp" type="time" id="rdT" value="${time}"></label></div>
    ${empField}
    <label class="f"><span>Prestation</span><select class="inp" id="rdS"><option value="">—</option>${DB.services.map(s => opt(s.id, s.name + " · " + s.duration + " min", r ? r.serviceId : "")).join("")}</select></label>
    ${r ? `<label class="f"><span>Statut</span><select class="inp" id="rdSt">${RDV_ST.map(s => opt(s, ST_LBL[s][0], r.status)).join("")}</select></label>` : ""}
    <label class="f"><span>Note</span><textarea class="inp" id="rdNo" placeholder="Facultatif">${esc(r ? r.note : "")}</textarea></label>
    <div class="btn-row"><button class="btn ghost" onclick="closeSheet()">Annuler</button><button class="btn" onclick="saveRdv('${r ? r.id : ""}')">Enregistrer</button></div>`);
}
function rdvNameChg(){
  const n = val("rdN").toLowerCase(), p = document.getElementById("rdP");
  if (!p || p.value.trim()) return;
  const c = DB.clients.find(x => x.name.toLowerCase() === n);
  if (c && c.phone) p.value = c.phone;
}
async function saveRdv(id){
  const old = id ? DB.rdv.find(x => x.id === id) : null;
  if (id && !old) return;
  const name = val("rdN"), phone = val("rdP"), date = val("rdD"), time = val("rdT");
  if (!name){ toast("Saisissez le nom du client", "bad"); return; }
  if (!isISO(date)){ toast("Date invalide", "bad"); return; }
  if (!isHM(time)){ toast("Heure invalide", "bad"); return; }
  const gerant = isGerant();
  const employeId = gerant ? val("rdE") : meId();
  const sv = svc(val("rdS"));
  const cl = DB.clients.find(c => phoneDigits(phone).length >= 8 && phoneDigits(c.phone) === phoneDigits(phone)) ||
             DB.clients.find(c => c.name.toLowerCase() === name.toLowerCase());
  const r = Object.assign({}, old || { id: uid(), source: "", createdAt: new Date().toISOString() }, {
    clientId: cl ? cl.id : "", clientName: name, clientPhone: phone, date, time, employeId,
    serviceId: sv ? sv.id : "", serviceName: sv ? sv.name : (old ? old.serviceName : ""),
    status: old ? val("rdSt") || old.status : "confirme", note: val("rdNo"),
  });
  if (!r.source) delete r.source;
  if (r.status !== "annule"){
    const issues = rdvIssues(r, r.id);
    if (issues.length && !await askConfirm("Attention", issues.join("\n"), { ok: "Enregistrer quand même" })) return;
  }
  if (old) Object.assign(old, r); else DB.rdv.push(r);
  AG.date = date;
  save(); closeSheet(); render(); toast("Rendez-vous enregistré");
}

/* ---------- fiche rendez-vous ---------- */
function rdvSheet(id){
  const r = DB.rdv.find(x => x.id === id);
  if (!r || !rdvAccess(r)) return;
  const e = emp(r.employeId), gerant = isGerant();
  const b = (cls, fn, icon, lbl) => `<button class="btn ${cls}" onclick="${fn}">${ic(icon, 17)}${lbl}</button>`;
  const acts = [];
  if (r.status === "attente") acts.push(r.source === "web" ? b("okb", `webConfirm('${r.id}')`, "check", "Confirmer") : b("okb", `rdvSet('${r.id}','confirme')`, "check", "Confirmer"));
  if (r.status === "attente" || r.status === "confirme") acts.push(b("", `rdvToSale('${r.id}')`, "cash", "Encaisser"));
  if (r.status === "attente" && r.source === "web") acts.push(b("danger", `webRefuse('${r.id}')`, "x", "Refuser"));
  else if (r.status === "attente" || r.status === "confirme") acts.push(b("danger", `rdvSet('${r.id}','annule')`, "x", "Annuler"));
  if (r.status === "annule") acts.push(b("soft", `rdvSet('${r.id}','confirme')`, "refresh", "Rétablir"));
  sheet(`${sheetH(r.clientName)}
    <div class="flex" style="flex-wrap:wrap;gap:8px">${stBadge(r.status)}${r.source === "web" ? `<span class="badge gold">${ic("globe", 12)}Réservation en ligne</span>` : ""}</div>
    <div class="mt">
      <div class="kv"><span>Date</span><b>${esc(longDate(r.date))}</b></div>
      <div class="kv"><span>Heure</span><b>${esc(r.time)}</b></div>
      <div class="kv"><span>Prestation</span><b>${esc(r.serviceName || "—")}</b></div>
      <div class="kv"><span>Coiffeur</span><b>${esc(e ? e.name : "Non assigné")}</b></div>
      <div class="kv"><span>Téléphone</span><b>${r.clientPhone ? `<a class="link" href="tel:${esc(S(r.clientPhone).replace(/[^\d+]/g, ""))}">${esc(r.clientPhone)}</a>` : "—"}</b></div>
      ${r.note ? `<div class="kv"><span>Note</span><b class="trunc" style="max-width:60%">${esc(r.note)}</b></div>` : ""}
    </div>
    ${acts.length ? `<div class="btn-row wrapb">${acts.join("")}</div>` : ""}
    <div class="btn-row wrapb">
      ${r.clientPhone ? b("ghost", `rdvWa('${r.id}')`, "chat", "WhatsApp") : ""}
      ${b("ghost", `rdvForm('${r.id}')`, "edit", "Modifier")}
      ${gerant ? b("danger", `rdvDel('${r.id}')`, "trash", "Supprimer") : ""}
    </div>`);
}
function rdvSet(id, status){
  const r = DB.rdv.find(x => x.id === id);
  if (!r || !rdvAccess(r) || !RDV_ST.includes(status)) return;
  r.status = status; save(); closeSheet(); render();
  toast(status === "annule" ? "Rendez-vous annulé" : "Rendez-vous mis à jour");
}
function rdvMsg(r, kind){
  const e = emp(r.employeId), s = DB.salon.name || "le salon";
  if (kind === "no") return `Bonjour ${r.clientName}, nous sommes désolés : le créneau du ${longDate(r.date)} à ${r.time} n'est plus disponible chez ${s}. N'hésitez pas à choisir un autre horaire.`;
  return `Bonjour ${r.clientName}, votre rendez-vous chez ${s} est ${kind === "ok" ? "confirmé" : "prévu"} : ${longDate(r.date)} à ${r.time}${r.serviceName ? " (" + r.serviceName + ")" : ""}${e ? " avec " + e.name : ""}. À bientôt !`;
}
async function webConfirm(id){
  const r = DB.rdv.find(x => x.id === id); if (!r) return;
  r.status = "confirme"; save(); closeSheet(); render(); toast("Réservation confirmée");
  if (phoneDigits(r.clientPhone).length >= 8 && await askConfirm("Prévenir le client ?", "Envoyer la confirmation à " + r.clientName + " par WhatsApp.", { ok: "Envoyer", cancel: "Plus tard" }))
    openWa(r.clientPhone, rdvMsg(r, "ok"));
}
async function webRefuse(id){
  const r = DB.rdv.find(x => x.id === id); if (!r) return;
  r.status = "annule"; save(); closeSheet(); render(); toast("Réservation refusée");
  if (phoneDigits(r.clientPhone).length >= 8 && await askConfirm("Prévenir le client ?", "Lui expliquer que le créneau n'est pas disponible.", { ok: "Envoyer", cancel: "Non" }))
    openWa(r.clientPhone, rdvMsg(r, "no"));
}
function rdvWa(id){ const r = DB.rdv.find(x => x.id === id); if (r) openWa(r.clientPhone, rdvMsg(r, r.status === "confirme" ? "ok" : "plan")); }
async function rdvDel(id){
  if (!isGerant()){ denied(); return; }
  if (!await askConfirm("Supprimer ce rendez-vous ?", "Cette action est définitive.", { ok: "Supprimer", danger: true })) return;
  DB.rdv = DB.rdv.filter(x => x.id !== id);
  save(); closeSheet(); render(); toast("Rendez-vous supprimé");
}
function rdvToSale(id){
  const r = DB.rdv.find(x => x.id === id);
  if (!r || !rdvAccess(r) || r.status === "fait" || r.status === "annule") return;
  TICKET = newTicket();
  const eid = isGerant() ? r.employeId : meId();
  if (eid && emp(eid) && emp(eid).active) TICKET.employeId = eid;
  const s = svc(r.serviceId);
  if (s) TICKET.items.push({ kind: "service", refId: s.id, name: s.name, price: N(s.price), qty: 1 });
  TICKET.rdvId = r.id;
  let c = r.clientId && cli(r.clientId);
  const hasPhone = phoneDigits(r.clientPhone).length >= 8;
  if (!c && hasPhone) c = DB.clients.find(x => phoneDigits(x.phone) === phoneDigits(r.clientPhone));
  if (!c && hasPhone && r.clientName){
    c = { id: uid(), name: r.clientName, phone: r.clientPhone, note: "", points: 0, visits: 0, debt: 0, created: todayISO() };
    DB.clients.push(c);
  }
  if (c){ TICKET.clientId = c.id; if (r.clientId !== c.id){ r.clientId = c.id; save(); } }
  saveTicket(); closeSheet(); go("caisse");
}
