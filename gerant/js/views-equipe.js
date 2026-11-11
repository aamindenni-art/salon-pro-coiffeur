/* ===========================================================
   Salon Gérant v6 — accueil (gérant / coiffeur), équipe, pointage,
   congés, menu « Plus ».
   =========================================================== */
"use strict";

const mv = n => num(n) + `<small>${CUR}</small>`;
const statBox = (icon, label, value, d, cls) => `<div class="stat ${cls || ""}"><div class="l">${ic(icon, 15)}${label}</div><div class="v">${value}</div>${d ? `<div class="d">${d}</div>` : ""}</div>`;
const greeting = () => new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";
const openShift = id => DB.attendance.find(x => x.employeId === id && x.date === todayISO() && x.in && !x.out);
const workedToday = id => DB.attendance.some(x => x.employeId === id && x.date === todayISO());

VIEWS.dash = () => isGerant() ? dashGerant() : dashEmp();

function webPendingBlock(list){
  if (!list.length) return "";
  return `<div class="section-lbl">${ic("globe", 14)}Réservations en ligne à confirmer<span class="sp"></span></div>
    <div class="list">${list.slice(0, 8).map(r => `<div class="row">
      <div class="time">${esc(frDay(r.date) + " " + r.date.slice(8))}<br><span style="font-size:12px">${esc(r.time)}</span></div>
      <button class="grow" style="text-align:left" onclick="rdvSheet('${r.id}')"><div class="t">${esc(r.clientName)}</div><div class="s">${esc(r.serviceName || "Prestation")} · ${esc(empName(r.employeId))}</div></button>
      <button class="icbtn ok" onclick="webConfirm('${r.id}')" aria-label="Confirmer">${ic("check", 18)}</button>
      <button class="icbtn bad" onclick="webRefuse('${r.id}')" aria-label="Refuser">${ic("x", 18)}</button></div>`).join("")}</div>`;
}

function dashGerant(){
  const t = todayISO(), rd = range("jour"), rm = range("mois");
  const sj = salesIn(rd), caJ = sum(sj, s => s.total);
  const fm = finSummary(rm, true);
  const rdvJ = DB.rdv.filter(r => r.date === t && r.status !== "annule").sort((a, b) => a.time.localeCompare(b.time));
  const todo = rdvJ.filter(r => r.status !== "fait").length;
  if (!DB.employes.length)
    return pageH(greeting(), longDate(t)) + `<div class="card glow">${emptyBox("users", "Constituez votre équipe", "Ajoutez vos coiffeurs pour suivre leurs ventes, commissions et présences.")}
      <div class="btn-row"><button class="btn" onclick="empForm()">${ic("plus", 18)}Ajouter un coiffeur</button></div></div>`;

  const team = activeEmps().map(e => {
    const ca = sum(sj.filter(s => s.employeId === e.id), s => s.total);
    const st = onLeave(e.id, t) ? `<span class="badge warn">Congé</span>` : isOff(e, t) ? `<span class="badge">Repos</span>`
      : openShift(e.id) ? `<span class="badge ok">Présent</span>` : workedToday(e.id) ? `<span class="badge info">Parti</span>` : `<span class="badge">Absent</span>`;
    return `<button class="row" onclick="empSheet('${e.id}')">${empAv(e)}<div class="grow"><div class="t">${esc(e.name)}</div><div class="s">${esc(e.role || "Coiffeur")}</div></div>${st}<div class="amt right" style="min-width:74px">${ca ? num(ca) : "—"}</div></button>`;
  }).join("");

  const low = lowStock(), debtors = DB.clients.filter(c => c.debt > 0), debt = sum(debtors, c => c.debt);
  const alerts = (low.length ? `<button class="row" onclick="go('stock')"><div class="av icn warnc">${ic("box", 18)}</div><div class="grow"><div class="t">${low.length} produit${low.length > 1 ? "s" : ""} à réapprovisionner</div><div class="s trunc">${esc(low.slice(0, 3).map(p => p.name).join(", "))}</div></div>${ic("chevR", 16)}</button>` : "") +
    (debtors.length ? `<button class="row" onclick="go('clients')"><div class="av icn warnc">${ic("book", 18)}</div><div class="grow"><div class="t">Ardoises clients : ${money(debt)}</div><div class="s">${debtors.length} client${debtors.length > 1 ? "s" : ""} doivent de l'argent</div></div>${ic("chevR", 16)}</button>` : "");

  return pageH(greeting(), longDate(t), `<button class="btn sm" onclick="go('caisse')">${ic("cash", 16)}Nouvelle vente</button>`) +
    `<div class="grid g4">
      ${statBox("cash", "Chiffre du jour", mv(caJ), sj.length + " vente" + (sj.length > 1 ? "s" : ""), "hero")}
      ${statBox("calendar", "RDV du jour", String(rdvJ.length), todo + " à venir")}
      ${statBox("trend", "CA du mois", mv(fm.rec), fm.n + " ventes")}
      ${statBox("wallet", "Bénéfice estimé", `<span class="${fm.benef < 0 ? "badc" : ""}">${mv(fm.benef)}</span>`, "salaires du mois inclus")}
    </div>
    ${webPendingBlock(pendingWeb())}
    <div class="cols"><div>
      <div class="section-lbl">Rendez-vous du jour<span class="sp"></span><a href="#agenda">Agenda</a></div>
      ${rdvJ.length ? `<div class="list">${rdvJ.map(r => rdvRow(r)).join("")}</div>` : `<div class="card">${emptyBox("calendar", "Aucun rendez-vous aujourd'hui")}</div>`}
    </div><div>
      <div class="section-lbl">Équipe aujourd'hui<span class="sp"></span><a href="#employes">Gérer</a></div>
      <div class="list">${team || ""}</div>
      ${alerts ? `<div class="section-lbl">À surveiller</div><div class="list">${alerts}</div>` : ""}
    </div></div>`;
}

function dashEmp(){
  const e = me(); if (!e) return pageH(greeting()) + `<div class="card">${emptyBox("lock", "Session expirée", "Reconnectez-vous avec votre code.")}</div>`;
  const t = todayISO(), mine = DB.sales.filter(s => s.employeId === e.id);
  const sj = mine.filter(s => s.date === t), sm = salesIn(range("mois")).filter(s => s.employeId === e.id);
  const caJ = sum(sj, s => s.total), caM = sum(sm, s => s.total), comJ = sum(sj, saleCom), comM = sum(sm, saleCom);
  const goal = N(e.goal), pct = goal > 0 ? Math.min(100, Math.round(caM / goal * 100)) : 0;
  const shift = openShift(e.id);
  const rdvJ = DB.rdv.filter(r => r.date === t && r.status !== "annule" && rdvAccess(r)).sort((a, b) => a.time.localeCompare(b.time));
  return pageH(greeting() + " " + e.name, longDate(t), `<button class="btn sm" onclick="go('caisse')">${ic("cash", 16)}Nouvelle vente</button>`) +
    `<div class="grid g4">
      ${statBox("cash", "Mon chiffre du jour", mv(caJ), sj.length + " vente" + (sj.length > 1 ? "s" : ""), "hero")}
      ${statBox("award", "Ma commission du jour", mv(comJ), N(e.commission) + " % des prestations")}
      ${statBox("trend", "Mon CA du mois", mv(caM), sm.length + " ventes")}
      ${statBox("wallet", "Ma commission du mois", mv(comM))}
    </div>
    ${goal > 0 ? `<div class="card mt2"><div class="flexb"><b>${ic("target", 16)} Objectif du mois</b><span class="cap">${num(caM)} / ${num(goal)} ${CUR}</span></div>
      <div class="bar mt"><i style="width:${pct}%"></i></div>
      <div class="cap mt">${pct >= 100 ? "Objectif atteint — bravo !" : pct + " % de l'objectif"}${N(e.prime) > 0 ? " · prime de " + money(e.prime) : ""}</div></div>` : ""}
    <button class="btn block ${shift ? "danger" : "soft"} mt2" onclick="togglePointage('${e.id}')">${ic("clock", 18)}${shift ? "Pointer mon départ (arrivé à " + esc(shift.in) + ")" : "Pointer mon arrivée"}</button>
    ${webPendingBlock(pendingWeb())}
    <div class="section-lbl">Mes rendez-vous du jour</div>
    ${rdvJ.length ? `<div class="list">${rdvJ.map(r => rdvRow(r)).join("")}</div>` : `<div class="card">${emptyBox("calendar", "Aucun rendez-vous aujourd'hui")}</div>`}`;
}

/* ---------- équipe ---------- */
VIEWS.employes = () => {
  if (!isGerant()) return "";
  const rm = range("mois"), pr = payroll(rm, false), t = todayISO();
  const card = e => {
    const p = pr.find(x => x.e === e) || { ca: 0, com: 0, n: 0 };
    const goal = N(e.goal), pct = goal > 0 ? Math.min(100, Math.round(p.ca / goal * 100)) : 0;
    const st = !e.active ? `<span class="badge">Désactivé</span>` : onLeave(e.id, t) ? `<span class="badge warn">Congé</span>` : isOff(e, t) ? `<span class="badge">Repos</span>` : openShift(e.id) ? `<span class="badge ok">Présent</span>` : "";
    return `<button class="card" style="text-align:left;${e.active ? "" : "opacity:.6"}" onclick="empSheet('${e.id}')">
      <div class="flex">${empAv(e, "lg")}<div class="grow"><div class="b trunc" style="font-size:16px">${esc(e.name)}</div><div class="cap trunc">${esc(e.role || "Coiffeur")} · ${N(e.commission)} %</div></div>${st}</div>
      <div class="grid g3 mt" style="gap:8px"><div><div class="cap">CA du mois</div><b>${num(p.ca)}</b></div><div><div class="cap">Commission</div><b>${num(p.com)}</b></div><div><div class="cap">Ventes</div><b>${p.n}</b></div></div>
      ${goal > 0 ? `<div class="bar mt"><i style="width:${pct}%"></i></div>` : ""}</button>`;
  };
  const list = DB.employes.slice().sort((a, b) => (b.active - a.active));
  return pageH("Équipe", activeEmps().length + " coiffeur" + (activeEmps().length > 1 ? "s" : "") + " actif" + (activeEmps().length > 1 ? "s" : ""), `<button class="btn sm" onclick="empForm()">${ic("plus", 16)}Ajouter</button>`) +
    (list.length ? `<div class="grid md2 lg3">${list.map(card).join("")}</div>` : `<div class="card">${emptyBox("users", "Aucun coiffeur", "Ajoutez votre premier coiffeur.")}</div>`);
};

function empSheet(id){
  const e = emp(id); if (!e || !isGerant()) return;
  const rm = range("mois"), p = payroll(rm, true).find(x => x.e === e) || { ca: 0, com: 0, n: 0, salary: 0, prime: 0, total: 0 };
  const shift = openShift(e.id), t = todayISO();
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const off = e.offDays.length ? e.offDays.slice().sort().map(d => days[d]).join(", ") : "aucun";
  const leaves = DB.leaves.filter(l => l.employeId === e.id && l.to >= t).sort((a, b) => a.from.localeCompare(b.from));
  const pinBlock = pinEnabled()
    ? `<div class="section-lbl">Accès à l'application</div>
       <div class="kv"><span>Code PIN personnel</span><b>${e.pinHash ? `<span class="badge ok">Actif</span>` : `<span class="badge">Non défini</span>`}</b></div>
       <div class="btn-row wrapb"><button class="btn ghost sm" onclick="empPinSet('${e.id}')">${ic("key", 15)}${e.pinHash ? "Changer le code" : "Définir un code"}</button>${e.pinHash ? `<button class="btn danger sm" onclick="empPinClear('${e.id}')">Retirer</button>` : ""}</div>`
    : `<div class="note mt">${ic("shield", 17)}<span>Pour donner un code PIN à ce coiffeur, activez d'abord le code du gérant dans Réglages › Sécurité.</span></div>`;
  sheet(`${sheetH(e.name)}
    <div class="flex">${empAv(e, "lg")}<div class="grow"><div class="b">${esc(e.role || "Coiffeur")}</div><div class="cap">${esc(e.phone || "Pas de téléphone")}</div></div>${e.active ? "" : `<span class="badge">Désactivé</span>`}</div>
    <div class="grid g3 mt" style="gap:8px">
      <div class="pill-sum" style="display:block"><div class="cap">CA du mois</div><b>${num(p.ca)}</b></div>
      <div class="pill-sum" style="display:block"><div class="cap">Commission</div><b>${num(p.com)}</b></div>
      <div class="pill-sum" style="display:block"><div class="cap">Ventes</div><b>${p.n}</b></div></div>
    <div class="mt"><div class="kv"><span>Commission</span><b>${N(e.commission)} % des prestations</b></div>
      <div class="kv"><span>Salaire fixe</span><b>${money(e.salary)}</b></div>
      <div class="kv"><span>Objectif / prime</span><b>${e.goal > 0 ? money(e.goal) + " / " + money(e.prime) : "—"}</b></div>
      <div class="kv"><span>Horaires</span><b>${esc(e.hStart)} – ${esc(e.hEnd)}</b></div>
      <div class="kv"><span>Repos</span><b>${off}</b></div></div>
    ${e.active ? `<button class="btn block ${shift ? "danger" : "soft"} mt" onclick="togglePointage('${e.id}',true)">${ic("clock", 17)}${shift ? "Pointer le départ (arrivé à " + esc(shift.in) + ")" : "Pointer l'arrivée"}</button>` : ""}
    <label class="sw mt"><div class="tx"><b>Réservable en ligne</b><span>Les clients peuvent le choisir sur la page de réservation</span></div>
      <input type="checkbox" ${e.online ? "checked" : ""} onchange="empFlag('${e.id}','online',this.checked)"><i></i></label>
    <div class="section-lbl">Congés et absences<span class="sp"></span><button onclick="leaveForm('${e.id}')">+ Ajouter</button></div>
    ${leaves.length ? `<div class="list">${leaves.map(l => `<div class="row"><div class="grow"><div class="t">${esc(l.type || "Congé")}</div><div class="s">${esc(frDate(l.from))}${l.to !== l.from ? " → " + esc(frDate(l.to)) : ""}</div></div>
      <button class="icbtn bad" onclick="leaveDel('${l.id}','${e.id}')" aria-label="Supprimer">${ic("trash", 16)}</button></div>`).join("")}</div>` : `<div class="cap">Aucun congé prévu.</div>`}
    ${pinBlock}
    <div class="btn-row wrapb mt2"><button class="btn ghost" onclick="empForm('${e.id}')">${ic("edit", 17)}Modifier</button>
      <button class="btn ghost" onclick="empToggle('${e.id}')">${e.active ? "Désactiver" : "Réactiver"}</button>
      <button class="btn danger" onclick="empDel('${e.id}')">${ic("trash", 17)}Supprimer</button></div>`);
}
function empFlag(id, k, v){ const e = emp(id); if (!e) return; e[k] = !!v; save(); }
function empToggle(id){
  const e = emp(id); if (!e) return;
  e.active = !e.active; save(); closeSheet(); ticketCheck(); render();
  toast(e.active ? e.name + " réactivé" : e.name + " désactivé");
}
async function empDel(id){
  const e = emp(id); if (!e) return;
  const hist = DB.sales.some(s => s.employeId === id) || DB.attendance.some(a => a.employeId === id) || DB.rdv.some(r => r.employeId === id);
  if (hist){
    if (!await askConfirm("Désactiver " + e.name + " ?", "Il a un historique (ventes, présences ou rendez-vous) : il est conservé pour vos comptes, mais n'apparaîtra plus dans la caisse ni l'agenda.", { ok: "Désactiver" })) return;
    e.active = false; delete e.pinHash;
    save(); closeSheet(); ticketCheck(); render(); toast(e.name + " désactivé"); return;
  }
  if (!await askConfirm("Supprimer " + e.name + " ?", "Cette action est définitive.", { ok: "Supprimer", danger: true })) return;
  DB.employes = DB.employes.filter(x => x.id !== id);
  DB.leaves = DB.leaves.filter(l => l.employeId !== id);
  save(); closeSheet(); ticketCheck(); render(); toast("Coiffeur supprimé");
}
function empForm(id){
  if (!isGerant()) return;
  const e = id ? emp(id) : null;
  const d = e || { name: "", phone: "", role: "Coiffeur", commission: 30, salary: 0, goal: 0, prime: 0, hStart: "09:00", hEnd: "19:00", offDays: [5], online: true, active: true };
  const days = [[1, "Lun"], [2, "Mar"], [3, "Mer"], [4, "Jeu"], [5, "Ven"], [6, "Sam"], [0, "Dim"]];
  sheet(`${sheetH(e ? "Modifier " + e.name : "Nouveau coiffeur")}
    <label class="f"><span>Nom</span><input class="inp" id="emN" value="${esc(d.name)}" autocomplete="off"></label>
    <div class="f2"><label class="f"><span>Téléphone</span><input class="inp" id="emP" inputmode="tel" value="${esc(d.phone)}"></label>
      <label class="f"><span>Fonction</span><input class="inp" id="emR" value="${esc(d.role)}"></label></div>
    <div class="f2"><label class="f"><span>Commission (%)</span><input class="inp" id="emC" inputmode="decimal" value="${d.commission}"></label>
      <label class="f"><span>Salaire fixe (${CUR})</span><input class="inp" id="emS" inputmode="decimal" value="${d.salary}"></label></div>
    <div class="f2"><label class="f"><span>Objectif mensuel (${CUR})</span><input class="inp" id="emG" inputmode="decimal" value="${d.goal}"></label>
      <label class="f"><span>Prime si atteint (${CUR})</span><input class="inp" id="emPr" inputmode="decimal" value="${d.prime}"></label></div>
    <div class="f2"><label class="f"><span>Début de journée</span><input class="inp" type="time" id="emH1" value="${d.hStart}"></label>
      <label class="f"><span>Fin de journée</span><input class="inp" type="time" id="emH2" value="${d.hEnd}"></label></div>
    <div class="f"><span>Jours de repos</span><div class="chips wrapc" id="emOff">${days.map(x => `<button type="button" class="chip ${d.offDays.includes(x[0]) ? "on" : ""}" data-d="${x[0]}" onclick="this.classList.toggle('on')">${x[1]}</button>`).join("")}</div></div>
    <label class="sw"><div class="tx"><b>Réservable en ligne</b><span>Visible sur la page de réservation</span></div><input type="checkbox" id="emOn" ${d.online ? "checked" : ""}><i></i></label>
    <div class="btn-row"><button class="btn ghost" onclick="closeSheet()">Annuler</button><button class="btn" onclick="saveEmp('${e ? e.id : ""}')">Enregistrer</button></div>`);
}
function saveEmp(id){
  const e = id ? emp(id) : null;
  const name = val("emN");
  if (!name){ toast("Saisissez le nom", "bad"); return; }
  const com = nval("emC");
  if (com > 100){ toast("Commission entre 0 et 100 %", "bad"); return; }
  const h1 = val("emH1"), h2 = val("emH2");
  if (!isHM(h1) || !isHM(h2) || hmToMin(h2) <= hmToMin(h1)){ toast("Horaires invalides", "bad"); return; }
  const data = {
    name, phone: val("emP"), role: val("emR") || "Coiffeur", commission: com, salary: nval("emS"), goal: nval("emG"), prime: nval("emPr"),
    hStart: h1, hEnd: h2, offDays: $$("#emOff .chip.on").map(b => N(b.dataset.d)), online: document.getElementById("emOn").checked,
  };
  if (e) Object.assign(e, data);
  else DB.employes.push(Object.assign({ id: uid(), active: true }, data));
  save(); closeSheet(); ticketCheck(); render(); toast(e ? "Modifications enregistrées" : "Coiffeur ajouté");
}

/* ---------- pointage & congés ---------- */
function togglePointage(id, fromSheet){
  if (!(isGerant() || id === meId())) return;
  const e = emp(id); if (!e || !e.active) return;
  const a = openShift(id);
  if (a){ a.out = nowHM(); toast("Départ pointé à " + a.out); }
  else { DB.attendance.push({ id: uid(), employeId: id, date: todayISO(), in: nowHM(), out: "" }); toast("Arrivée pointée à " + nowHM()); }
  save(); render();
  if (fromSheet && _sheetOpen) empSheet(id);
}
function leaveForm(empId){
  const e = emp(empId); if (!e) return;
  const t = todayISO();
  sheet(`${sheetH("Congé — " + e.name)}
    <label class="f"><span>Type</span><select class="inp" id="lvT">${["Congé", "Maladie", "Absence", "Autre"].map(x => opt(x, x, "Congé")).join("")}</select></label>
    <div class="f2"><label class="f"><span>Du</span><input class="inp" type="date" id="lvF" value="${t}"></label>
      <label class="f"><span>Au</span><input class="inp" type="date" id="lvTo" value="${t}"></label></div>
    <label class="f"><span>Note</span><input class="inp" id="lvN" placeholder="Facultatif"></label>
    <div class="btn-row"><button class="btn ghost" onclick="empSheet('${e.id}')">Retour</button><button class="btn" onclick="saveLeave('${e.id}')">Enregistrer</button></div>`);
}
function saveLeave(empId){
  const f = val("lvF"), t = val("lvTo");
  if (!isISO(f) || !isISO(t)){ toast("Dates invalides", "bad"); return; }
  if (t < f){ toast("La fin doit suivre le début", "bad"); return; }
  DB.leaves.push({ id: uid(), employeId: empId, from: f, to: t, type: val("lvT"), note: val("lvN") });
  save(); render(); empSheet(empId); toast("Congé enregistré");
}
async function leaveDel(id, empId){
  if (!await askConfirm("Supprimer ce congé ?", "", { ok: "Supprimer", danger: true })) return;
  DB.leaves = DB.leaves.filter(l => l.id !== id);
  save(); render();
  if (empId) empSheet(empId);
}

/* ---------- menu « Plus » ---------- */
VIEWS.more = () => {
  const it = (r, icon, t, s) => `<a href="#${r}"><span class="mi">${ic(icon, 20)}</span><span>${t}<small>${s}</small></span></a>`;
  return pageH("Plus", DB.salon.name) + `<div class="menu">
    ${it("ventes", "receipt", "Ventes", "Journal et annulations")}
    ${it("planning", "clock", "Planning", "Horaires, présences, congés")}
    ${it("clients", "user", "Clients", "Fiches, fidélité, ardoises")}
    ${it("prestations", "scissors", "Prestations", "Tarifs et durées")}
    ${it("stock", "box", "Stock", "Produits et fournisseurs")}
    ${it("finances", "wallet", "Finances", "Bénéfice et dépenses")}
    ${it("stats", "chart", "Statistiques", "Tendances et classements")}
    ${it("cloture", "file", "Clôture de caisse", "Rapport du jour")}
    ${it("export", "sheet", "Export comptable", "Excel et PDF du mois")}
    ${it("reglages", "settings", "Réglages", "Salon, sécurité, réservation")}
    ${pinEnabled() ? `<button onclick="lockNow()"><span class="mi">${ic("lock", 20)}</span><span>Verrouiller<small>Quitter la session</small></span></button>` : ""}
  </div>`;
};
