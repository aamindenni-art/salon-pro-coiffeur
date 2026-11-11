/* ===========================================================
   Salon Gérant v6 — finances, clôture de caisse, statistiques, planning.
   =========================================================== */
"use strict";

/* ============================ FINANCES ============================ */
const FIN = { period: "mois" };
function finPeriod(p){ FIN.period = p; render(); }

VIEWS.finances = () => {
  const p = FIN.period, r = range(p), f = finSummary(r, p === "mois");
  const row = (label, v, cls) => `<div class="kv"><span>${label}</span><b class="${cls || ""}">${v}</b></div>`;
  const exp = f.expenses.slice().sort((a, b) => b.date.localeCompare(a.date));
  return pageH("Finances", r.label, `<button class="btn sm" onclick="expenseForm()">${ic("plus", 16)}Dépense</button>`) +
    `<div class="seg mb"><button class="${p === "jour" ? "on" : ""}" onclick="finPeriod('jour')">Jour</button><button class="${p === "semaine" ? "on" : ""}" onclick="finPeriod('semaine')">Semaine</button><button class="${p === "mois" ? "on" : ""}" onclick="finPeriod('mois')">Mois</button></div>
    <div class="grid g3">
      ${statBox("wallet", "Bénéfice", `<span class="${f.benef < 0 ? "badc" : ""}">${mv(f.benef)}</span>`, "", "hero")}
      ${statBox("cash", "Recettes", mv(f.rec), f.n + " vente" + (f.n > 1 ? "s" : ""))}
      ${statBox("receipt", "Dépenses & charges", mv(f.charges))}
    </div>
    <div class="cols"><div>
      <div class="section-lbl">Résultat</div>
      <div class="card">${row("Recettes", money(f.rec))}${row("Dépenses", "− " + money(f.dep))}${row("Commissions", "− " + money(f.com))}
        ${p === "mois" ? row("Salaires fixes", "− " + money(f.sal)) + row("Primes d'objectif", "− " + money(f.primes)) : ""}
        <div class="kv tot"><span>Bénéfice</span><b class="${f.benef < 0 ? "badc" : ""}">${money(f.benef)}</b></div>
        ${p !== "mois" ? `<div class="hint">Les salaires fixes et primes ne sont comptés que sur la vue « Mois ».</div>` : ""}</div>
      <div class="section-lbl">Par coiffeur</div>
      <div class="card pad0 scroll-x"><table class="tbl"><tr><th>Coiffeur</th><th class="r">Ventes</th><th class="r">CA</th><th class="r">Commission</th></tr>
        ${f.payroll.map(x => `<tr><td>${esc(x.e.name)}</td><td class="r">${x.n}</td><td class="r">${num(x.ca)}</td><td class="r">${num(x.com)}</td></tr>`).join("") || `<tr><td colspan="4" class="cap">Aucune vente</td></tr>`}</table></div>
    </div><div>
      <div class="section-lbl">Encaissements</div>
      <div class="card">${PAYS.map(k => row(PAY_LBL[k][0], money(f.byPay[k]))).join("")}${row("Ardoises encaissées", money(f.ardoise), "okc")}</div>
      <div class="section-lbl">Origine des recettes</div>
      <div class="card">${row("Prestations", money(f.svcCA))}${row("Produits", money(f.prodCA))}</div>
    </div></div>
    <div class="section-lbl">Dépenses de la période<span class="sp"></span><a href="#cloture">Clôture</a><a href="#export">Export</a></div>
    ${exp.length ? `<div class="list">${exp.map(x => `<div class="row"><div class="av icn">${ic("receipt", 17)}</div><div class="grow"><div class="t trunc">${esc(x.label || "Dépense")}</div><div class="s">${esc(x.category || "Divers")} · ${esc(frDate(x.date))}</div></div>
      <div class="amt">${num(x.amount)}</div><button class="icbtn bad" onclick="expenseDel('${x.id}')" aria-label="Supprimer">${ic("trash", 16)}</button></div>`).join("")}</div>`
      : `<div class="card">${emptyBox("receipt", "Aucune dépense", "Loyer, électricité, matériel… enregistrez vos dépenses ici.")}</div>`}`;
};
function expenseForm(){
  const cats = ["Loyer", "Électricité / eau", "Matériel", "Produits", "Publicité", "Transport", "Autre"];
  sheet(`${sheetH("Nouvelle dépense")}
    <label class="f"><span>Libellé</span><input class="inp" id="exL" placeholder="ex : Loyer novembre" autocomplete="off"></label>
    <div class="f2"><label class="f"><span>Montant (${CUR})</span><input class="inp" id="exA" inputmode="decimal" placeholder="0"></label>
      <label class="f"><span>Date</span><input class="inp" type="date" id="exD" value="${todayISO()}"></label></div>
    <label class="f"><span>Catégorie</span><input class="inp" id="exC" list="exCl" placeholder="Choisir ou saisir" autocomplete="off"></label>
    <datalist id="exCl">${cats.map(c => `<option value="${esc(c)}">`).join("")}</datalist>
    <div class="btn-row"><button class="btn ghost" onclick="closeSheet()">Annuler</button><button class="btn" onclick="saveExpense()">Enregistrer</button></div>`);
}
function saveExpense(){
  const label = val("exL"), amount = Math.round(nval("exA")), date = val("exD");
  if (amount <= 0){ toast("Saisissez un montant", "bad"); return; }
  if (!isISO(date)){ toast("Date invalide", "bad"); return; }
  DB.expenses.push({ id: uid(), date, label: label || "Dépense", category: val("exC") || "Divers", amount });
  save(); closeSheet(); render(); toast("Dépense enregistrée");
}
async function expenseDel(id){
  if (!await askConfirm("Supprimer cette dépense ?", "", { ok: "Supprimer", danger: true })) return;
  DB.expenses = DB.expenses.filter(x => x.id !== id);
  save(); render(); toast("Dépense supprimée");
}

/* ======================== CLÔTURE DE CAISSE ======================== */
const CLO = { date: todayISO() };
function cloDate(v){ if (isISO(v)){ CLO.date = v; render(); } }
function cloData(){
  const d = CLO.date, f = finSummary({ from: d, to: d }, false);
  const esp = f.byPay.espece, pay = f.ardoise, dep = f.dep;
  return { d, f, esp, pay, dep, cash: esp + pay - dep };
}
function cloText(){
  const c = cloData(), f = c.f;
  const L = ["*Clôture de caisse — " + (DB.salon.name || "Salon") + "*", longDate(c.d), "",
    "Ventes : " + f.n + " — " + money(f.rec)];
  PAYS.forEach(k => L.push("  • " + PAY_LBL[k][0] + " : " + money(f.byPay[k])));
  if (c.pay) L.push("Ardoises encaissées : " + money(c.pay));
  if (c.dep) L.push("Dépenses : − " + money(c.dep));
  L.push("*Espèces en caisse : " + money(c.cash) + "*", "");
  f.payroll.filter(x => x.n).forEach(x => L.push(x.e.name + " : " + money(x.ca) + " (" + x.n + " vente" + (x.n > 1 ? "s" : "") + ")"));
  return L.join("\n");
}
function cloPrint(){
  const c = cloData(), f = c.f;
  printDoc(`<div class="ph"><div><h1>Clôture de caisse</h1><small>${esc(DB.salon.name)} — ${esc(longDate(c.d))}</small></div><small>Édité le ${esc(frDate(todayISO()))} à ${esc(nowHM())}</small></div>
    <h2>Encaissements</h2>
    ${PAYS.map(k => `<div class="kv"><span>${PAY_LBL[k][0]}</span><b>${money(f.byPay[k])}</b></div>`).join("")}
    <div class="kv tot"><span>Total des ventes (${f.n})</span><b>${money(f.rec)}</b></div>
    <h2>Caisse espèces</h2>
    <div class="kv"><span>Ventes en espèces</span><b>${money(c.esp)}</b></div>
    <div class="kv"><span>Ardoises encaissées</span><b>${money(c.pay)}</b></div>
    <div class="kv"><span>Dépenses du jour</span><b>− ${money(c.dep)}</b></div>
    <div class="kv tot"><span>Espèces attendues en caisse</span><b>${money(c.cash)}</b></div>
    <h2>Par coiffeur</h2>
    <table><tr><th>Coiffeur</th><th class="r">Ventes</th><th class="r">CA</th></tr>${f.payroll.filter(x => x.n).map(x => `<tr><td>${esc(x.e.name)}</td><td class="r">${x.n}</td><td class="r">${num(x.ca)}</td></tr>`).join("")}</table>
    <div class="foot">Document généré par Salon Gérant</div>`);
}
VIEWS.cloture = () => {
  const c = cloData(), f = c.f, row = (l, v, cls) => `<div class="kv"><span>${l}</span><b class="${cls || ""}">${v}</b></div>`;
  return pageH("Clôture de caisse", longDate(c.d)) +
    `<div class="flex mb"><button class="icbtn" onclick="cloDate(addDays(CLO.date,-1))" aria-label="Jour précédent">${ic("chevL", 18)}</button>
      <input class="inp" type="date" value="${c.d}" onchange="cloDate(this.value)" style="flex:1;min-height:42px">
      <button class="icbtn" onclick="cloDate(addDays(CLO.date,1))" aria-label="Jour suivant">${ic("chevR", 18)}</button></div>
    <div class="grid g3">${statBox("cash", "Ventes", mv(f.rec), f.n + " vente" + (f.n > 1 ? "s" : ""), "hero")}${statBox("wallet", "Espèces en caisse", mv(c.cash), "ventes + ardoises − dépenses")}${statBox("receipt", "Dépenses", mv(c.dep))}</div>
    <div class="cols"><div>
      <div class="section-lbl">Encaissements</div>
      <div class="card">${PAYS.map(k => row(PAY_LBL[k][0], money(f.byPay[k]))).join("")}<div class="kv tot"><span>Total</span><b>${money(f.rec)}</b></div></div>
      <div class="section-lbl">Caisse espèces</div>
      <div class="card">${row("Ventes en espèces", money(c.esp))}${row("Ardoises encaissées", money(c.pay))}${row("Dépenses du jour", "− " + money(c.dep))}<div class="kv tot"><span>Espèces attendues</span><b>${money(c.cash)}</b></div></div>
    </div><div>
      <div class="section-lbl">Par coiffeur</div>
      <div class="card pad0 scroll-x"><table class="tbl"><tr><th>Coiffeur</th><th class="r">Ventes</th><th class="r">CA</th></tr>
        ${f.payroll.filter(x => x.n).map(x => `<tr><td>${esc(x.e.name)}</td><td class="r">${x.n}</td><td class="r">${num(x.ca)}</td></tr>`).join("") || `<tr><td colspan="3" class="cap">Aucune vente ce jour</td></tr>`}</table></div>
    </div></div>
    <div class="btn-row wrapb mt2"><button class="btn ghost" onclick="shareText(cloText(),'Clôture de caisse')">${ic("share", 17)}Partager</button><button class="btn" onclick="cloPrint()">${ic("printer", 17)}Imprimer / PDF</button></div>`;
};

/* ============================ STATISTIQUES ============================ */
VIEWS.stats = () => {
  const t = todayISO(), rm = range("mois"), sm = salesIn(rm), ca = sum(sm, s => s.total);
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const vals = days.map(d => sum(DB.sales.filter(s => s.date === d), s => s.total)), max = Math.max(1, ...vals);
  const chart = `<div class="chart">${days.map((d, i) => `<div class="col ${d === t ? "today" : ""}" title="${esc(longDate(d))} : ${money(vals[i])}">
      <span class="vl">${vals[i] ? num(vals[i]) : ""}</span><div class="bx" style="height:calc((100% - 46px) * ${(vals[i] / max).toFixed(3)})"></div><span class="lb">${WD[wdOf(d)]}</span></div>`).join("")}</div>`;
  const svcMap = {};
  sm.forEach(s => s.items.filter(i => i.kind === "service").forEach(i => { const o = svcMap[i.name] = svcMap[i.name] || { n: 0, ca: 0 }; o.n += i.qty; o.ca += i.price * i.qty; }));
  const tops = Object.keys(svcMap).map(k => Object.assign({ name: k }, svcMap[k])).sort((a, b) => b.n - a.n).slice(0, 6);
  const topMax = Math.max(1, ...tops.map(x => x.n));
  const pr = payroll(rm, false).filter(x => x.n).sort((a, b) => b.ca - a.ca), prMax = Math.max(1, ...pr.map(x => x.ca));
  const f = finSummary(rm, false);
  const clients = new Set(sm.map(s => s.clientId).filter(Boolean)).size;
  const newCli = DB.clients.filter(c => c.created >= rm.from).length;
  const discounts = sum(sm, s => s.discount);
  const pays = PAYS.map(k => ({ k, v: f.byPay[k] }));
  return pageH("Statistiques", rm.label) +
    `<div class="card"><div class="flexb"><h3>7 derniers jours</h3><span class="cap">${money(sum(vals, v => v))}</span></div>${chart}</div>
    <div class="grid g4 mt2">
      ${statBox("receipt", "Ticket moyen", mv(sm.length ? ca / sm.length : 0), sm.length + " vente" + (sm.length > 1 ? "s" : ""))}
      ${statBox("user", "Clients servis", String(clients), "fiches distinctes")}
      ${statBox("plus", "Nouveaux clients", String(newCli), "ce mois-ci")}
      ${statBox("percent", "Remises accordées", mv(discounts))}
    </div>
    <div class="cols"><div>
      <div class="section-lbl">Prestations les plus vendues</div>
      <div class="card">${tops.length ? tops.map(x => `<div style="margin-bottom:12px"><div class="flexb"><b class="trunc">${esc(x.name)}</b><span class="cap nowrap">${x.n} × · ${num(x.ca)} ${CUR}</span></div><div class="bar mt"><i style="width:${Math.round(x.n / topMax * 100)}%"></i></div></div>`).join("") : emptyBox("scissors", "Pas encore de données")}</div>
    </div><div>
      <div class="section-lbl">Classement des coiffeurs</div>
      <div class="card">${pr.length ? pr.map(x => `<div style="margin-bottom:12px"><div class="flexb"><b class="trunc">${esc(x.e.name)}</b><span class="cap nowrap">${num(x.ca)} ${CUR}</span></div><div class="bar info mt"><i style="width:${Math.round(x.ca / prMax * 100)}%"></i></div></div>`).join("") : emptyBox("users", "Pas encore de données")}</div>
      <div class="section-lbl">Modes de paiement</div>
      <div class="card">${f.rec ? pays.map(x => `<div style="margin-bottom:12px"><div class="flexb"><b>${PAY_LBL[x.k][0]}</b><span class="cap nowrap">${num(x.v)} ${CUR} · ${Math.round(x.v / f.rec * 100)} %</span></div><div class="bar ${x.k === "carte" ? "violet" : x.k === "credit" ? "" : "ok"} mt"><i style="width:${Math.round(x.v / f.rec * 100)}%"></i></div></div>`).join("") : emptyBox("card", "Pas encore de données")}</div>
    </div></div>`;
};

/* ============================ PLANNING ============================ */
const PL = { date: todayISO() };
function plStep(n){ PL.date = addDays(PL.date, n * 7); render(); }
function plToday(){ PL.date = todayISO(); render(); }

VIEWS.planning = () => {
  const mon = addDays(PL.date, -((wdOf(PL.date) + 6) % 7)), days = Array.from({ length: 7 }, (_, i) => addDays(mon, i)), t = todayISO();
  const emps = DB.employes.filter(e => e.active);
  const cell = (e, d) => {
    if (onLeave(e.id, d)) return `<span class="badge warn">Congé</span>`;
    if (isOff(e, d)) return `<span class="badge">Repos</span>`;
    const att = DB.attendance.filter(a => a.employeId === e.id && a.date === d);
    return `<div class="b">${esc(e.hStart)}–${esc(e.hEnd)}</div>` + att.map(a => `<div class="cap okc">${esc(a.in)}–${esc(a.out || "…")}</div>`).join("");
  };
  const leaves = DB.leaves.filter(l => l.to >= t).sort((a, b) => a.from.localeCompare(b.from));
  const wk = longDate(days[0]).split(" ").slice(1).join(" ") + " → " + longDate(days[6]).split(" ").slice(1).join(" ");
  return pageH("Planning", "Semaine du " + wk, `<button class="btn sm" onclick="leavePick()">${ic("plus", 16)}Congé</button>`) +
    `<div class="flex mb"><button class="icbtn" onclick="plStep(-1)" aria-label="Semaine précédente">${ic("chevL", 18)}</button><div class="grow center b">${esc(wk)}</div>
      <button class="icbtn" onclick="plStep(1)" aria-label="Semaine suivante">${ic("chevR", 18)}</button>${mon !== addDays(t, -((wdOf(t) + 6) % 7)) ? `<button class="btn sm ghost" onclick="plToday()">Cette semaine</button>` : ""}</div>
    ${emps.length ? `<div class="card pad0 scroll-x"><table class="tbl"><tr><th>Coiffeur</th>${days.map(d => `<th class="${d === t ? "gold" : ""}">${WD[wdOf(d)]} ${d.slice(8)}</th>`).join("")}</tr>
      ${emps.map(e => `<tr><td><button class="link" onclick="empSheet('${e.id}')">${esc(e.name)}</button></td>${days.map(d => `<td style="min-width:92px">${cell(e, d)}</td>`).join("")}</tr>`).join("")}</table></div>`
      : `<div class="card">${emptyBox("users", "Aucun coiffeur", "Ajoutez votre équipe pour voir le planning.")}</div>`}
    <div class="section-lbl">Congés à venir</div>
    ${leaves.length ? `<div class="list">${leaves.map(l => `<div class="row"><div class="grow"><div class="t">${esc(empName(l.employeId))} — ${esc(l.type || "Congé")}</div><div class="s">${esc(frDate(l.from))}${l.to !== l.from ? " → " + esc(frDate(l.to)) : ""}</div></div>
      <button class="icbtn bad" onclick="leaveDel('${l.id}')" aria-label="Supprimer">${ic("trash", 16)}</button></div>`).join("")}</div>` : `<div class="card">${emptyBox("calendar", "Aucun congé prévu")}</div>`}`;
};
function leavePick(){
  const l = activeEmps();
  if (!l.length){ toast("Aucun coiffeur actif", "bad"); return; }
  sheet(`${sheetH("Congé pour…")}<div class="list">${l.map(e => `<button class="row" onclick="leaveForm('${e.id}')">${empAv(e)}<div class="grow"><div class="t">${esc(e.name)}</div></div>${ic("chevR", 16)}</button>`).join("")}</div>`);
}
