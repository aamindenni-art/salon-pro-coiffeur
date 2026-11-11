/* ===========================================================
   Salon Gérant v6 — prestations, export comptable (Excel / PDF), réglages.
   =========================================================== */
"use strict";

/* =========================== PRESTATIONS =========================== */
VIEWS.prestations = () => {
  const l = DB.services;
  return pageH("Prestations", l.length + " au catalogue", `<button class="btn sm" onclick="svcForm()">${ic("plus", 16)}Prestation</button>`) +
    (l.length ? `<div class="list">${l.map(s => `<button class="row" onclick="svcForm('${s.id}')"><div class="av icn">${ic("scissors", 18)}</div>
      <div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${num(s.duration)} min${s.online ? "" : " · masquée en ligne"}</div></div><div class="amt">${money(s.price)}</div></button>`).join("")}</div>`
      : `<div class="card">${emptyBox("scissors", "Aucune prestation", "Ajoutez vos coupes, barbes, colorations…")}
        <div class="btn-row"><button class="btn" onclick="svcDefaults()">Ajouter des prestations courantes</button></div></div>`);
};
function svcDefaults(){
  DB.services = DB.services.concat(defaultServices());
  save(); render(); toast("Prestations ajoutées — adaptez les prix");
}
function svcForm(id){
  const s = id ? svc(id) : null;
  const d = s || { name: "", price: 0, duration: 30, online: true };
  sheet(`${sheetH(s ? "Modifier la prestation" : "Nouvelle prestation")}
    <label class="f"><span>Nom</span><input class="inp" id="svN" value="${esc(d.name)}" autocomplete="off"></label>
    <div class="f2"><label class="f"><span>Prix (${CUR})</span><input class="inp" id="svP" inputmode="decimal" value="${d.price}"></label>
      <label class="f"><span>Durée (minutes)</span><input class="inp" id="svD" inputmode="numeric" value="${d.duration}"></label></div>
    <label class="sw"><div class="tx"><b>Réservable en ligne</b><span>Proposée sur la page de réservation</span></div><input type="checkbox" id="svO" ${d.online ? "checked" : ""}><i></i></label>
    <div class="btn-row wrapb"><button class="btn ghost" onclick="closeSheet()">Annuler</button>${s ? `<button class="btn danger" onclick="svcDel('${s.id}')">Supprimer</button>` : ""}<button class="btn" onclick="saveSvc('${s ? s.id : ""}')">Enregistrer</button></div>`);
}
function saveSvc(id){
  const name = val("svN"), price = Math.round(nval("svP")), dur = Math.round(nval("svD"));
  if (!name){ toast("Saisissez le nom", "bad"); return; }
  if (dur < 5 || dur > 480){ toast("Durée entre 5 et 480 minutes", "bad"); return; }
  const data = { name, price, duration: dur, online: document.getElementById("svO").checked };
  const s = id ? svc(id) : null;
  if (s) Object.assign(s, data); else DB.services.push(Object.assign({ id: uid() }, data));
  save(); closeSheet(); ticketCheck(); render(); toast(s ? "Prestation modifiée" : "Prestation ajoutée");
}
async function svcDel(id){
  const s = svc(id); if (!s) return;
  if (!await askConfirm("Supprimer " + s.name + " ?", "Les ventes passées restent dans l'historique.", { ok: "Supprimer", danger: true })) return;
  DB.services = DB.services.filter(x => x.id !== id);
  save(); closeSheet(); ticketCheck(); render(); toast("Prestation supprimée");
}

/* ========================== EXPORT COMPTABLE ========================== */
let EXP_YM = todayISO().slice(0, 7);
function expYm(v){ if (/^\d{4}-\d{2}$/.test(v)){ EXP_YM = v; render(); } }

function expData(){
  const r = monthRange(EXP_YM), f = finSummary(r, true);
  const sales = f.sales.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const purchases = DB.purchases.filter(p => inRange(p.date, r)).sort((a, b) => a.date.localeCompare(b.date));
  const debtors = DB.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
  const exp = f.expenses.slice().sort((a, b) => a.date.localeCompare(b.date));
  return { r, f, sales, purchases, debtors, exp };
}
const itemsTxt = s => s.items.map(i => i.name + (i.qty > 1 ? " ×" + i.qty : "")).join(", ");

VIEWS.export = () => {
  const x = expData(), f = x.f;
  const row = (l, v, cls) => `<div class="kv"><span>${l}</span><b class="${cls || ""}">${v}</b></div>`;
  return pageH("Export comptable", "Fin de mois : Excel et PDF") +
    `<label class="f" style="margin-top:0"><span>Mois à exporter</span><input class="inp" type="month" id="expYm" value="${EXP_YM}" onchange="expYm(this.value)"></label>
    <div class="grid g3 mt2">${statBox("cash", "Recettes", mv(f.rec), f.n + " vente" + (f.n > 1 ? "s" : ""), "hero")}${statBox("receipt", "Dépenses & charges", mv(f.charges))}${statBox("wallet", "Bénéfice", `<span class="${f.benef < 0 ? "badc" : ""}">${mv(f.benef)}</span>`)}</div>
    <div class="cols mt2"><div class="card">
      <h3>Contenu du fichier</h3>
      ${row("Ventes détaillées", x.sales.length + " ligne" + (x.sales.length > 1 ? "s" : ""))}${row("Dépenses", x.exp.length + " ligne" + (x.exp.length > 1 ? "s" : ""))}
      ${row("Paie des coiffeurs", f.payroll.length + " coiffeur" + (f.payroll.length > 1 ? "s" : ""))}${row("Achats de stock", x.purchases.length)}${row("Ardoises clients", x.debtors.length)}
      <div class="hint">Le fichier Excel contient 6 feuilles : Synthèse, Ventes, Dépenses, Paie coiffeurs, Achats, Ardoises. Le PDF est un rapport imprimable pour votre comptable.</div>
    </div><div>
      <div class="btn-row wrapb" style="margin-top:0"><button class="btn lg" onclick="expXlsx()">${ic("download", 19)}Excel (.xlsx)</button><button class="btn lg ghost" onclick="expPdf()">${ic("file", 19)}PDF / Imprimer</button></div>
      ${f.n === 0 && x.exp.length === 0 ? `<div class="note mt">${ic("info", 17)}<span>Aucune activité enregistrée sur ce mois.</span></div>` : ""}
    </div></div>`;
};
function expXlsx(){
  const x = expData(), f = x.f, name = DB.salon.name || "Salon";
  try {
    const b = (v) => ({ v, b: true });
    const sheets = [
      { name: "Synthèse", widths: [34, 18], rows: [["Élément", "Montant (" + CUR + ")"], ["Salon", name], ["Période", x.r.label], ["Nombre de ventes", f.n],
        ["Recettes (chiffre d'affaires)", Math.round(f.rec)], ["  dont prestations", Math.round(f.svcCA)], ["  dont produits", Math.round(f.prodCA)],
        ["Dépenses", Math.round(f.dep)], ["Commissions coiffeurs", Math.round(f.com)], ["Salaires fixes", Math.round(f.sal)], ["Primes d'objectif", Math.round(f.primes)],
        [b("Bénéfice"), b(Math.round(f.benef))], ["Encaissements espèces", Math.round(f.byPay.espece)], ["Encaissements carte", Math.round(f.byPay.carte)],
        ["Ventes à crédit (ardoise)", Math.round(f.byPay.credit)], ["Ardoises encaissées", Math.round(f.ardoise)]] },
      { name: "Ventes", widths: [12, 8, 18, 20, 44, 11, 10, 11, 11, 12], rows: [["Date", "Heure", "Coiffeur", "Client", "Articles", "Brut", "Remise", "Net", "Paiement", "Commission"]]
        .concat(x.sales.map(s => [frDate(s.date), s.time, saleEmpName(s), saleCliName(s) || "Passage", itemsTxt(s), Math.round(saleGross(s)), Math.round(N(s.discount)), Math.round(s.total), PAY_LBL[s.payment][0], Math.round(saleCom(s))]))
        .concat(x.sales.length ? [[b("Total"), "", "", "", "", b(Math.round(sum(x.sales, saleGross))), b(Math.round(sum(x.sales, s => s.discount))), b(Math.round(f.rec)), "", b(Math.round(f.com))]] : []) },
      { name: "Dépenses", widths: [12, 36, 20, 14], rows: [["Date", "Libellé", "Catégorie", "Montant"]]
        .concat(x.exp.map(e => [frDate(e.date), e.label, e.category, Math.round(e.amount)]))
        .concat(x.exp.length ? [[b("Total"), "", "", b(Math.round(f.dep))]] : []) },
      { name: "Paie coiffeurs", widths: [20, 9, 14, 13, 14, 14, 12, 16], rows: [["Coiffeur", "Ventes", "CA", "Commission %", "Commission", "Salaire", "Prime", "Total à payer"]]
        .concat(f.payroll.map(p => [p.e.name, p.n, Math.round(p.ca), N(p.e.commission), Math.round(p.com), Math.round(p.salary), Math.round(p.prime), Math.round(p.total)]))
        .concat(f.payroll.length ? [[b("Total"), "", b(Math.round(sum(f.payroll, p => p.ca))), "", b(Math.round(f.com)), b(Math.round(f.sal)), b(Math.round(f.primes)), b(Math.round(sum(f.payroll, p => p.total)))]] : []) },
      { name: "Achats", widths: [12, 24, 52, 14], rows: [["Date", "Fournisseur", "Articles", "Total"]]
        .concat(x.purchases.map(p => [frDate(p.date), (sup(p.supplierId) || {}).name || "", p.items.map(i => ((prod(i.productId) || {}).name || "Produit") + " ×" + i.qty).join(", "), Math.round(p.total)])) },
      { name: "Ardoises", widths: [24, 18, 14], rows: [["Client", "Téléphone", "Reste dû"]]
        .concat(x.debtors.map(c => [c.name, c.phone, Math.round(c.debt)]))
        .concat(x.debtors.length ? [[b("Total"), "", b(Math.round(sum(x.debtors, c => c.debt)))]] : []) },
    ];
    const u8 = GLib.xlsx(sheets);
    const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "Salon";
    shareOrDownload(new Blob([u8], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Comptabilite_" + slug + "_" + EXP_YM + ".xlsx");
    toast("Fichier Excel prêt");
  } catch (e){ console.error(e); toast("Export impossible : " + (e.message || "erreur"), "bad"); }
}
function expPdf(){
  const x = expData(), f = x.f, kv = (l, v, c) => `<div class="kv ${c || ""}"><span>${l}</span><b>${v}</b></div>`;
  printDoc(`<div class="ph"><div><h1>Rapport comptable</h1><small>${esc(DB.salon.name)} — ${esc(x.r.label)}</small></div><small>Édité le ${esc(frDate(todayISO()))}</small></div>
    <h2>Synthèse</h2>
    ${kv("Recettes (" + f.n + " ventes)", money(f.rec))}${kv("dont prestations", money(f.svcCA))}${kv("dont produits", money(f.prodCA))}
    ${kv("Dépenses", "− " + money(f.dep))}${kv("Commissions coiffeurs", "− " + money(f.com))}${kv("Salaires fixes", "− " + money(f.sal))}${kv("Primes d'objectif", "− " + money(f.primes))}
    ${kv("Bénéfice", money(f.benef), "tot")}
    <h2>Encaissements</h2>${PAYS.map(k => kv(PAY_LBL[k][0], money(f.byPay[k]))).join("")}${kv("Ardoises encaissées", money(f.ardoise))}
    <h2>Paie des coiffeurs</h2>
    <table><tr><th>Coiffeur</th><th class="r">Ventes</th><th class="r">CA</th><th class="r">Comm.</th><th class="r">Salaire</th><th class="r">Prime</th><th class="r">Total</th></tr>
    ${f.payroll.map(p => `<tr><td>${esc(p.e.name)}</td><td class="r">${p.n}</td><td class="r">${num(p.ca)}</td><td class="r">${num(p.com)}</td><td class="r">${num(p.salary)}</td><td class="r">${num(p.prime)}</td><td class="r">${num(p.total)}</td></tr>`).join("")}
    <tr class="tot"><td>Total</td><td class="r"></td><td class="r">${num(sum(f.payroll, p => p.ca))}</td><td class="r">${num(f.com)}</td><td class="r">${num(f.sal)}</td><td class="r">${num(f.primes)}</td><td class="r">${num(sum(f.payroll, p => p.total))}</td></tr></table>
    <h2>Dépenses</h2>
    ${x.exp.length ? `<table><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th class="r">Montant</th></tr>${x.exp.map(e => `<tr><td>${esc(frDate(e.date))}</td><td>${esc(e.label)}</td><td>${esc(e.category)}</td><td class="r">${num(e.amount)}</td></tr>`).join("")}<tr class="tot"><td colspan="3">Total</td><td class="r">${num(f.dep)}</td></tr></table>` : "<p>Aucune dépense.</p>"}
    <h2>Détail des ventes</h2>
    ${x.sales.length ? `<table><tr><th>Date</th><th>Coiffeur</th><th>Articles</th><th>Paiement</th><th class="r">Net</th></tr>${x.sales.map(s => `<tr><td>${esc(frDate(s.date))} ${esc(s.time)}</td><td>${esc(saleEmpName(s))}</td><td>${esc(itemsTxt(s))}</td><td>${esc(PAY_LBL[s.payment][0])}</td><td class="r">${num(s.total)}</td></tr>`).join("")}<tr class="tot"><td colspan="4">Total</td><td class="r">${num(f.rec)}</td></tr></table>` : "<p>Aucune vente.</p>"}
    ${x.debtors.length ? `<h2>Ardoises clients à ce jour</h2><table><tr><th>Client</th><th>Téléphone</th><th class="r">Reste dû</th></tr>${x.debtors.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td class="r">${num(c.debt)}</td></tr>`).join("")}</table>` : ""}
    <div class="foot">Document généré par Salon Gérant — ${esc(DB.salon.name)}</div>`);
}

/* ============================= RÉGLAGES ============================= */
function shareBooking(){ shareText("Réservez votre rendez-vous chez " + DB.salon.name + " : " + bookingLink(), "Réservation"); }
const bookingLink = () => location.origin + location.pathname.replace(/[^/]*$/, "") + "reserver.html?s=" + encodeURIComponent(SS.code || "");

VIEWS.reglages = () => {
  if (!isGerant()) return "";
  const s = DB.salon, on = syncOn(), v = syncVisual();
  const onlineEmps = activeEmps().filter(e => e.online).length, onlineSvc = DB.services.filter(x => x.online).length;
  const card = (title, body, icon) => `<div class="section-lbl">${icon ? ic(icon, 14) : ""}${title}</div><div class="card">${body}</div>`;
  const secBody = pinEnabled()
    ? `<div class="flexb"><div><b>Code PIN activé</b><div class="cap">Chaque coiffeur ne voit que ses ventes et ses rendez-vous.</div></div><span class="badge ok">Actif</span></div>
       <div class="btn-row wrapb"><button class="btn ghost sm" onclick="pinSetup()">${ic("key", 15)}Changer mon code</button><button class="btn ghost sm" onclick="rescueRenew()">Nouveau code de secours</button><button class="btn danger sm" onclick="pinDisable()">Désactiver</button></div>
       <div class="hint">Les codes des coiffeurs se définissent dans Équipe › fiche du coiffeur.</div>`
    : `<div class="cap">Protégez l'application par un code à 4 chiffres : le gérant voit tout, chaque coiffeur ne voit que ses propres ventes.</div>
       <button class="btn block mt" onclick="pinSetup()">${ic("lock", 17)}Activer le code PIN</button>`;
  const bookBody = on
    ? `<label class="sw" style="padding-top:0"><div class="tx"><b>Réservation en ligne</b><span>Vos clients réservent un créneau depuis leur téléphone</span></div>
        <input type="checkbox" ${s.booking ? "checked" : ""} onchange="bookingToggle(this.checked)"><i></i></label>
       ${s.booking ? `<div class="lbl mt">Lien à partager avec vos clients</div><div class="code">${esc(bookingLink())}</div>
         <div class="btn-row wrapb"><button class="btn ghost sm" onclick="copyText(bookingLink())">${ic("copy", 15)}Copier</button><button class="btn ghost sm" onclick="shareBooking()">${ic("share", 15)}Partager</button><button class="btn ghost sm" onclick="window.open(bookingLink(),'_blank','noopener')">${ic("globe", 15)}Ouvrir</button></div>
         <div class="hint">${onlineEmps} coiffeur${onlineEmps > 1 ? "s" : ""} et ${onlineSvc} prestation${onlineSvc > 1 ? "s" : ""} proposés en ligne. Les demandes arrivent dans l'Agenda « en attente » pour que vous les confirmiez.</div>` : ""}`
    : `<div class="note">${ic("cloud", 17)}<span>La réservation en ligne a besoin de la synchro cloud : activez-la d'abord ci-dessous.</span></div>`;
  const syncBody = on
    ? `<div class="flexb"><div><b>Salon « ${esc(SS.code)} »</b><div class="cap">${esc(v.l)}</div></div><span class="icbtn ${v.c}" style="pointer-events:none">${ic(v.i, 18)}</span></div>
       <div class="btn-row wrapb"><button class="btn ghost sm" onclick="syncCycle();toast('Synchronisation…','info')">${ic("refresh", 15)}Synchroniser</button><button class="btn danger sm" onclick="syncOff()">Désactiver</button></div>
       <div class="hint">Vos données sont sauvegardées dans le cloud et partagées entre vos appareils (téléphone du gérant, ordinateur du salon…). Tout continue de fonctionner sans internet.</div>`
    : `<div class="cap">Sauvegardez le salon dans le cloud et retrouvez-le sur plusieurs appareils. Choisissez un code salon et un code secret : <b>notez-les bien</b>, ils sont indispensables pour récupérer vos données.</div>
       <label class="f"><span>Code salon (lettres, chiffres, tirets)</span><input class="inp" id="syCode" value="${esc(cleanCode(s.name))}" autocomplete="off" autocapitalize="none"></label>
       <label class="f"><span>Code secret (6 caractères minimum)</span><input class="inp" id="syKey" type="password" autocomplete="new-password"></label>
       <button class="btn block mt" id="syBtn" onclick="syncConnect()">${ic("cloud", 17)}Activer la synchro</button>`;
  return pageH("Réglages", "Salon, sécurité et données") +
    `<div class="cols"><div>
      ${card("Mon salon", `<label class="f" style="margin-top:0"><span>Nom du salon</span><input class="inp" id="stN" value="${esc(s.name)}"></label>
        <label class="f"><span>Slogan</span><input class="inp" id="stT" value="${esc(s.tagline)}"></label>
        <label class="f"><span>Adresse</span><input class="inp" id="stL" value="${esc(s.loc)}"></label>
        <label class="f"><span>WhatsApp du salon</span><input class="inp" id="stW" inputmode="tel" value="${esc(s.whatsapp)}" placeholder="213…"></label>
        <button class="btn block mt" onclick="saveSalon()">Enregistrer</button>`, "settings")}
      ${card("Sécurité", secBody, "shield")}
      ${card("Réservation en ligne", bookBody, "globe")}
    </div><div>
      ${card("Synchro cloud", syncBody, "cloud")}
      ${card("Mes données", `<div class="btn-row wrapb" style="margin-top:0"><button class="btn ghost" onclick="exportJson()">${ic("download", 17)}Sauvegarde (.json)</button><button class="btn ghost" onclick="document.getElementById('impFile').click()">${ic("upload", 17)}Restaurer</button></div>
        <input type="file" id="impFile" accept=".json,application/json" hidden onchange="importJson(this)">
        <button class="btn danger block mt" onclick="resetAll()">${ic("trash", 17)}Tout effacer sur cet appareil</button>`, "file")}
      ${card("À propos", `<div class="kv" style="padding-top:0"><span>Version</span><b>${APP_VERSION}</b></div>
        <div class="btn-row wrapb"><button class="btn ghost sm" onclick="forceUpdate()">${ic("refresh", 15)}Rechercher une mise à jour</button><button class="btn ghost sm" onclick="repairApp()">Réparer l'application</button></div>`, "info")}
    </div></div>`;
};

function saveSalon(){
  const name = val("stN");
  if (!name){ toast("Saisissez le nom du salon", "bad"); return; }
  Object.assign(DB.salon, { name, tagline: val("stT"), loc: val("stL"), whatsapp: val("stW") });
  save(); render(); toast("Informations enregistrées");
}
function bookingToggle(on){
  if (on && !syncOn()){ toast("Activez d'abord la synchro cloud", "bad"); render(); return; }
  DB.salon.booking = !!on; save(); render();
  toast(on ? "Réservation en ligne activée" : "Réservation en ligne désactivée", "info");
}

/* ---------- synchro : connexion ---------- */
let _syBusy = false;
async function syncConnect(){
  if (_syBusy) return;
  const code = cleanCode(val("syCode")), secret = document.getElementById("syKey").value;
  const bad = syncCheckInput(code, secret);
  if (bad){ toast(bad, "bad"); return; }
  _syBusy = true; const btn = document.getElementById("syBtn"); if (btn) btn.disabled = true;
  try {
    let remote;
    try { remote = await rpc("gerant_pull", { p_id: code, p_secret: secret }); }
    catch (e){ toast(e.code === "bad_secret" ? "Code secret incorrect pour ce salon" : isNetErr(e) ? "Pas de connexion internet" : "Erreur : " + (e.message || "inconnue"), "bad"); return; }
    if (!remote || !remote.data){
      if (!await askConfirm("Créer ce salon dans le cloud ?", "Le code « " + code + " » est libre. Les données de cet appareil y seront sauvegardées.", { ok: "Créer" })) return;
      syncStart(code, secret, "new"); render(); toast("Synchro activée"); return;
    }
    const choice = await openDlg(`<h4>Ce salon existe déjà</h4><p>Le code « ${esc(code)} » contient déjà des données. Que faire ?</p>
      <div class="btn-row" style="flex-direction:column"><button class="btn" onclick="closeDlg('load')">Charger les données du cloud</button>
      <button class="btn danger" onclick="closeDlg('replace')">Remplacer le cloud par cet appareil</button><button class="btn ghost" onclick="closeDlg(null)">Annuler</button></div>`);
    if (choice === "load"){
      if (!await askConfirm("Charger depuis le cloud ?", "Les données actuelles de cet appareil seront remplacées.", { ok: "Charger", danger: true })) return;
      syncStart(code, secret, "load", remote); toast("Données chargées"); render();
    } else if (choice === "replace"){
      if (!await askConfirm("Écraser le cloud ?", "Les données du cloud seront remplacées par celles de cet appareil. Action définitive.", { ok: "Remplacer", danger: true })) return;
      syncStart(code, secret, "replace", remote); render(); toast("Cloud mis à jour");
    }
  } finally { _syBusy = false; const b2 = document.getElementById("syBtn"); if (b2) b2.disabled = false; }
}
async function syncOff(){
  if (!await askConfirm("Désactiver la synchro ?", "Les données restent sur cet appareil et dans le cloud. La réservation en ligne cessera de se mettre à jour.", { ok: "Désactiver", danger: true })) return;
  syncStop(); render(); toast("Synchro désactivée", "info");
}

/* ---------- données ---------- */
function exportJson(){
  downloadBlob(new Blob([JSON.stringify(DB, null, 1)], { type: "application/json" }), "salon-gerant-sauvegarde-" + todayISO() + ".json");
  toast("Sauvegarde téléchargée");
}
function importJson(inp){
  const f = inp.files && inp.files[0]; inp.value = "";
  if (!f) return;
  if (f.size > 20 * 1024 * 1024){ toast("Fichier trop volumineux", "bad"); return; }
  const rd = new FileReader();
  rd.onerror = () => toast("Lecture impossible", "bad");
  rd.onload = async () => {
    let d; try { d = JSON.parse(rd.result); } catch (e){ toast("Ce fichier n'est pas une sauvegarde valide", "bad"); return; }
    if (!d || typeof d !== "object" || Array.isArray(d) || !(Array.isArray(d.employes) || Array.isArray(d.sales) || d.salon)){ toast("Ce fichier n'est pas une sauvegarde du salon", "bad"); return; }
    const n = normalize(d);
    if (!await askConfirm("Restaurer cette sauvegarde ?", `${n.salon.name} — ${n.employes.length} coiffeur(s), ${n.clients.length} client(s), ${n.sales.length} vente(s).\nLes données actuelles seront remplacées.`, { ok: "Restaurer", danger: true })) return;
    DB = n; DB.setup = true; REV++; persist(); markDirty(); setSession(null);
    TICKET = newTicket(); saveTicket();
    render(); toast("Sauvegarde restaurée");
  };
  rd.readAsText(f);
}
async function resetAll(){
  if (!await askConfirm("Tout effacer sur cet appareil ?", "Clients, ventes, stock, équipe… tout sera supprimé de cet appareil. Pensez à faire une sauvegarde avant. Les données du cloud ne sont pas supprimées.", { ok: "Continuer", danger: true })) return;
  if (!await askConfirm("Dernière confirmation", "Cette action est irréversible. Effacer définitivement les données de cet appareil ?", { ok: "Tout effacer", danger: true })) return;
  syncStop();
  try { [KEY, SYNC_KEY, BASE_KEY, LOCK_KEY].forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {}
  location.hash = ""; location.reload();
}
async function forceUpdate(){
  toast("Recherche de mise à jour…", "info");
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg){ await reg.update(); if (reg.waiting){ reg.waiting.postMessage("skipWaiting"); return; } }
    toast("Vous utilisez la dernière version (" + APP_VERSION + ")");
  } catch (e){ toast("Mise à jour impossible hors connexion", "bad"); }
}
async function repairApp(){
  if (!await askConfirm("Réparer l'application ?", "Le cache de l'application est vidé puis rechargé. Vos données ne sont pas touchées.", { ok: "Réparer" })) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister()));
    const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k)));
  } catch (e) {}
  location.reload();
}
