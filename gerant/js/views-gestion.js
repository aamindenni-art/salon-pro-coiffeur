/* ===========================================================
   Salon Gérant v6 — clients, stock (produits, fournisseurs, achats), journal des ventes.
   =========================================================== */
"use strict";

/* =========================== CLIENTS =========================== */
const CL = { q: "", tab: "all" };

function cliListHtml(){
  let l = cliFilter(CL.q);
  if (CL.tab === "debt") l = l.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
  if (!l.length) return emptyBox("user", CL.q || CL.tab === "debt" ? "Aucun résultat" : "Aucun client", CL.q || CL.tab === "debt" ? "" : "Ajoutez votre premier client.");
  return l.slice(0, 200).map(c => `<button class="row" onclick="clientSheet('${c.id}')"><div class="av">${esc(initials(c.name))}</div>
    <div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.phone || "Pas de numéro")} · ${num(c.visits)} visite${c.visits > 1 ? "s" : ""}</div></div>
    ${c.debt > 0 ? `<span class="badge warn">${money(c.debt)}</span>` : (c.points > 0 ? `<span class="badge gold">${ic("star", 12)}${num(c.points)}</span>` : "")}</button>`).join("")
    + (l.length > 200 ? `<div class="cap center" style="padding:10px">Affinez la recherche pour voir les ${l.length - 200} autres.</div>` : "");
}
function cliSearch(v){ CL.q = v; const el = document.getElementById("cliList"); if (el) el.innerHTML = cliListHtml(); }
function cliTab(t){ CL.tab = t; render(); }

VIEWS.clients = () => {
  const debt = sum(DB.clients, c => c.debt), n = DB.clients.filter(c => c.debt > 0).length;
  return pageH("Clients", DB.clients.length + " fiche" + (DB.clients.length > 1 ? "s" : ""), `<button class="btn sm" onclick="clientForm()">${ic("plus", 16)}Client</button>`) +
    `<div class="search mb">${ic("search", 18)}<input class="inp" id="cliQ" value="${esc(CL.q)}" placeholder="Rechercher un nom ou un numéro" oninput="cliSearch(this.value)" autocomplete="off"></div>
    <div class="seg mb"><button class="${CL.tab === "all" ? "on" : ""}" onclick="cliTab('all')">Tous</button><button class="${CL.tab === "debt" ? "on" : ""}" onclick="cliTab('debt')">Ardoises${n ? " (" + n + ")" : ""}</button></div>
    ${CL.tab === "debt" && debt > 0 ? `<div class="pill-sum mb"><span class="muted">Total dû par les clients</span><b class="warnc">${money(debt)}</b></div>` : ""}
    <div class="list" id="cliList">${cliListHtml()}</div>`;
};

function clientSheet(id){
  const c = cli(id); if (!c) return;
  const sales = DB.sales.filter(s => s.clientId === id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const spent = sum(sales, s => s.total), last = sales[0];
  sheet(`${sheetH(c.name)}
    <div class="flex"><div class="av lg">${esc(initials(c.name))}</div><div class="grow"><div class="b">${esc(c.phone || "Pas de numéro")}</div><div class="cap">Client depuis le ${esc(frDate(c.created || todayISO()))}</div></div></div>
    <div class="grid g3 mt" style="gap:8px">
      <div class="pill-sum" style="display:block"><div class="cap">Visites</div><b>${num(c.visits)}</b></div>
      <div class="pill-sum" style="display:block"><div class="cap">Points</div><b>${num(c.points)}</b></div>
      <div class="pill-sum" style="display:block"><div class="cap">Dépensé</div><b>${num(spent)}</b></div></div>
    ${c.debt > 0 ? `<div class="note warn mt">${ic("book", 18)}<span>Ardoise : <b>${money(c.debt)}</b> à encaisser.</span></div>
      <button class="btn block mt" onclick="settleDebt('${c.id}')">${ic("cash", 17)}Encaisser un paiement</button>` : ""}
    ${c.note ? `<div class="kv mt"><span>Note</span><b class="trunc" style="max-width:65%">${esc(c.note)}</b></div>` : ""}
    ${last ? `<div class="kv"><span>Dernière visite</span><b>${esc(frDate(last.date))}</b></div>` : ""}
    <div class="section-lbl">Historique</div>
    ${sales.length ? `<div class="list">${sales.slice(0, 6).map(s => `<div class="row"><div class="grow"><div class="t trunc">${esc(s.items.map(i => i.name).join(", "))}</div><div class="s">${esc(frDate(s.date))} · ${esc(saleEmpName(s))}</div></div><div class="amt">${num(s.total)}</div></div>`).join("")}</div>` : `<div class="cap">Aucune vente enregistrée.</div>`}
    <div class="btn-row wrapb mt2">
      ${phoneDigits(c.phone).length >= 8 ? `<a class="btn ghost" href="tel:${esc(S(c.phone).replace(/[^\d+]/g, ""))}">${ic("phone", 17)}Appeler</a><button class="btn ghost" onclick="openWa(cli('${c.id}').phone,'')">${ic("chat", 17)}WhatsApp</button>` : ""}
      <button class="btn ghost" onclick="clientForm('${c.id}')">${ic("edit", 17)}Modifier</button>
      <button class="btn danger" onclick="clientDel('${c.id}')">${ic("trash", 17)}Supprimer</button></div>`);
}
async function settleDebt(id){
  const c = cli(id); if (!c || c.debt <= 0) return;
  const v = await askValue("Encaisser une ardoise", { msg: "Reste dû : " + money(c.debt), label: "Montant reçu (" + CUR + ")", inputmode: "decimal", value: String(c.debt), ok: "Encaisser" });
  if (v === null) return;
  const a = Math.round(parseFloat(v.replace(",", ".")) || 0);
  if (a <= 0 || a > c.debt){ toast("Montant entre 1 et " + num(c.debt), "bad"); return; }
  c.debt -= a;
  DB.payments.push({ id: uid(), date: todayISO(), clientId: id, amount: a });
  save(); render(); clientSheet(id);
  toast(c.debt > 0 ? "Paiement enregistré — reste " + money(c.debt) : "Ardoise soldée");
}
function clientForm(id){
  const c = id ? cli(id) : null;
  sheet(`${sheetH(c ? "Modifier le client" : "Nouveau client")}
    <label class="f"><span>Nom</span><input class="inp" id="clN" value="${esc(c ? c.name : "")}" autocomplete="off"></label>
    <label class="f"><span>Téléphone</span><input class="inp" id="clP" inputmode="tel" value="${esc(c ? c.phone : "")}" autocomplete="off"></label>
    <label class="f"><span>Note</span><textarea class="inp" id="clNo" placeholder="Préférences, allergies…">${esc(c ? c.note : "")}</textarea></label>
    <div class="btn-row"><button class="btn ghost" onclick="closeSheet()">Annuler</button><button class="btn" onclick="saveClient('${c ? c.id : ""}')">Enregistrer</button></div>`);
}
function saveClient(id){
  const name = val("clN"), phone = val("clP");
  if (!name){ toast("Saisissez le nom", "bad"); return; }
  const dup = phoneDigits(phone).length >= 8 && DB.clients.find(c => c.id !== id && phoneDigits(c.phone) === phoneDigits(phone));
  if (dup){ toast("Ce numéro appartient déjà à " + dup.name, "bad"); return; }
  const c = id ? cli(id) : null;
  if (c){ c.name = name; c.phone = phone; c.note = val("clNo"); }
  else DB.clients.push({ id: uid(), name, phone, note: val("clNo"), points: 0, visits: 0, debt: 0, created: todayISO() });
  save(); closeSheet(); render(); toast(c ? "Client modifié" : "Client ajouté");
}
async function clientDel(id){
  const c = cli(id); if (!c) return;
  if (c.debt > 0){ toast("Ardoise non soldée : encaissez-la d'abord", "bad"); return; }
  if (!await askConfirm("Supprimer " + c.name + " ?", "Ses ventes restent dans l'historique.", { ok: "Supprimer", danger: true })) return;
  DB.clients = DB.clients.filter(x => x.id !== id);
  save(); closeSheet(); ticketCheck(); render(); toast("Client supprimé");
}

/* ============================ STOCK ============================ */
const STK = { tab: "prod" };
function stkTab(t){ STK.tab = t; render(); }
function stockAdd(){ if (STK.tab === "sup") supForm(); else if (STK.tab === "buy") buyForm(); else prodForm(); }

VIEWS.stock = () => {
  const low = lowStock();
  const tabs = `<div class="seg mb"><button class="${STK.tab === "prod" ? "on" : ""}" onclick="stkTab('prod')">Produits</button><button class="${STK.tab === "sup" ? "on" : ""}" onclick="stkTab('sup')">Fournisseurs</button><button class="${STK.tab === "buy" ? "on" : ""}" onclick="stkTab('buy')">Achats</button></div>`;
  let body = "";
  if (STK.tab === "prod"){
    const l = DB.products.slice().sort((a, b) => ((a.min > 0 && a.qty <= a.min) ? 0 : 1) - ((b.min > 0 && b.qty <= b.min) ? 0 : 1) || a.name.localeCompare(b.name, "fr"));
    body = (low.length ? `<div class="note warn mb">${ic("alert", 18)}<span><b>${low.length}</b> produit${low.length > 1 ? "s" : ""} sous le seuil d'alerte.</span></div>` : "") +
      (l.length ? `<div class="list">${l.map(p => {
        const bad = p.qty <= 0, warn = !bad && p.min > 0 && p.qty <= p.min;
        return `<button class="row" onclick="prodSheet('${p.id}')"><div class="av icn">${ic("box", 18)}</div>
          <div class="grow"><div class="t">${esc(p.name)}</div><div class="s">${esc(p.cat || "Sans catégorie")} · ${p.sell > 0 ? "vente " + money(p.sell) : "usage interne"}</div></div>
          <span class="badge ${bad ? "bad" : warn ? "warn" : "ok"}">${num(p.qty)} en stock</span></button>`;
      }).join("")}</div>` : `<div class="card">${emptyBox("box", "Aucun produit", "Ajoutez vos produits pour suivre le stock.")}</div>`);
  } else if (STK.tab === "sup"){
    body = DB.suppliers.length ? `<div class="list">${DB.suppliers.map(s => `<button class="row" onclick="supForm('${s.id}')"><div class="av icn">${ic("truck", 18)}</div>
      <div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${esc(s.phone || "Pas de numéro")} · ${DB.products.filter(p => p.supplierId === s.id).length} produit(s)</div></div>${ic("chevR", 16)}</button>`).join("")}</div>`
      : `<div class="card">${emptyBox("truck", "Aucun fournisseur", "Ajoutez vos fournisseurs.")}</div>`;
  } else {
    const l = DB.purchases.slice().sort((a, b) => b.date.localeCompare(a.date));
    body = l.length ? `<div class="list">${l.slice(0, 100).map(p => {
      const names = p.items.map(i => ((prod(i.productId) || {}).name || "Produit") + " ×" + i.qty).join(", ");
      return `<button class="row" onclick="purchaseSheet('${p.id}')"><div class="av icn">${ic("receipt", 18)}</div>
        <div class="grow"><div class="t trunc">${esc(names)}</div><div class="s">${esc(frDate(p.date))} · ${esc((sup(p.supplierId) || {}).name || "Sans fournisseur")}</div></div><div class="amt">${num(p.total)}</div></button>`;
    }).join("")}</div>` : `<div class="card">${emptyBox("receipt", "Aucun achat", "Les réapprovisionnements apparaîtront ici.")}</div>`;
  }
  return pageH("Stock", DB.products.length + " produit" + (DB.products.length > 1 ? "s" : ""),
    `<button class="btn sm" onclick="stockAdd()">${ic("plus", 16)}${STK.tab === "sup" ? "Fournisseur" : STK.tab === "buy" ? "Achat" : "Produit"}</button>`) + tabs + body;
};

function prodSheet(id){
  const p = prod(id); if (!p) return;
  sheet(`${sheetH(p.name)}
    <div class="flex" style="flex-wrap:wrap;gap:8px"><span class="badge ${p.qty <= 0 ? "bad" : (p.min > 0 && p.qty <= p.min) ? "warn" : "ok"}">${num(p.qty)} en stock</span>${p.cat ? `<span class="badge">${esc(p.cat)}</span>` : ""}</div>
    <div class="mt"><div class="kv"><span>Prix d'achat</span><b>${money(p.cost)}</b></div>
      <div class="kv"><span>Prix de vente</span><b>${p.sell > 0 ? money(p.sell) : "Non vendu"}</b></div>
      ${p.sell > 0 && p.cost > 0 ? `<div class="kv"><span>Marge unitaire</span><b class="okc">${money(p.sell - p.cost)}</b></div>` : ""}
      <div class="kv"><span>Seuil d'alerte</span><b>${p.min > 0 ? num(p.min) : "—"}</b></div>
      <div class="kv"><span>Fournisseur</span><b>${esc((sup(p.supplierId) || {}).name || "—")}</b></div></div>
    <button class="btn block mt" onclick="buyForm('${p.id}')">${ic("truck", 17)}Réapprovisionner</button>
    <div class="btn-row wrapb"><button class="btn ghost" onclick="prodForm('${p.id}')">${ic("edit", 17)}Modifier</button><button class="btn danger" onclick="prodDel('${p.id}')">${ic("trash", 17)}Supprimer</button></div>`);
}
function prodForm(id){
  const p = id ? prod(id) : null;
  const d = p || { name: "", cat: "", supplierId: "", qty: 0, min: 0, cost: 0, sell: 0 };
  sheet(`${sheetH(p ? "Modifier le produit" : "Nouveau produit")}
    <label class="f"><span>Nom</span><input class="inp" id="prN" value="${esc(d.name)}" autocomplete="off"></label>
    <div class="f2"><label class="f"><span>Catégorie</span><input class="inp" id="prC" list="prCl" value="${esc(d.cat)}" autocomplete="off"></label>
      <label class="f"><span>Fournisseur</span><select class="inp" id="prS"><option value="">—</option>${DB.suppliers.map(s => opt(s.id, s.name, d.supplierId)).join("")}</select></label></div>
    <datalist id="prCl">${Array.from(new Set(DB.products.map(x => x.cat).filter(Boolean))).map(c => `<option value="${esc(c)}">`).join("")}</datalist>
    <div class="f2"><label class="f"><span>Quantité en stock</span><input class="inp" id="prQ" inputmode="numeric" value="${d.qty}"></label>
      <label class="f"><span>Seuil d'alerte</span><input class="inp" id="prM" inputmode="numeric" value="${d.min}"></label></div>
    <div class="f2"><label class="f"><span>Prix d'achat (${CUR})</span><input class="inp" id="prCo" inputmode="decimal" value="${d.cost}"></label>
      <label class="f"><span>Prix de vente (${CUR})</span><input class="inp" id="prSe" inputmode="decimal" value="${d.sell}"></label></div>
    <div class="hint">Prix de vente à 0 : produit d'usage interne, absent de la caisse.</div>
    <div class="btn-row"><button class="btn ghost" onclick="closeSheet()">Annuler</button><button class="btn" onclick="saveProd('${p ? p.id : ""}')">Enregistrer</button></div>`);
}
function saveProd(id){
  const name = val("prN");
  if (!name){ toast("Saisissez le nom", "bad"); return; }
  const data = { name, cat: val("prC"), supplierId: val("prS"), qty: Math.floor(nval("prQ")), min: Math.floor(nval("prM")), cost: nval("prCo"), sell: nval("prSe") };
  const p = id ? prod(id) : null;
  if (p) Object.assign(p, data); else DB.products.push(Object.assign({ id: uid() }, data));
  save(); closeSheet(); ticketCheck(); render(); toast(p ? "Produit modifié" : "Produit ajouté");
}
async function prodDel(id){
  const p = prod(id); if (!p) return;
  if (!await askConfirm("Supprimer " + p.name + " ?", "Les ventes passées restent dans l'historique.", { ok: "Supprimer", danger: true })) return;
  DB.products = DB.products.filter(x => x.id !== id);
  save(); closeSheet(); ticketCheck(); render(); toast("Produit supprimé");
}

function supForm(id){
  const s = id ? sup(id) : null;
  sheet(`${sheetH(s ? "Modifier le fournisseur" : "Nouveau fournisseur")}
    <label class="f"><span>Nom</span><input class="inp" id="suN" value="${esc(s ? s.name : "")}" autocomplete="off"></label>
    <label class="f"><span>Téléphone</span><input class="inp" id="suP" inputmode="tel" value="${esc(s ? s.phone : "")}" autocomplete="off"></label>
    <div class="btn-row wrapb"><button class="btn ghost" onclick="closeSheet()">Annuler</button>${s ? `<button class="btn danger" onclick="supDel('${s.id}')">Supprimer</button>` : ""}<button class="btn" onclick="saveSup('${s ? s.id : ""}')">Enregistrer</button></div>`);
}
function saveSup(id){
  const name = val("suN");
  if (!name){ toast("Saisissez le nom", "bad"); return; }
  const s = id ? sup(id) : null;
  if (s){ s.name = name; s.phone = val("suP"); } else DB.suppliers.push({ id: uid(), name, phone: val("suP") });
  save(); closeSheet(); render(); toast(s ? "Fournisseur modifié" : "Fournisseur ajouté");
}
async function supDel(id){
  const s = sup(id); if (!s) return;
  if (!await askConfirm("Supprimer " + s.name + " ?", "Les produits liés resteront sans fournisseur.", { ok: "Supprimer", danger: true })) return;
  DB.suppliers = DB.suppliers.filter(x => x.id !== id);
  DB.products.forEach(p => { if (p.supplierId === id) p.supplierId = ""; });
  save(); closeSheet(); render(); toast("Fournisseur supprimé");
}

function buyForm(productId){
  if (!DB.products.length){ toast("Ajoutez d'abord un produit", "bad"); return; }
  const p = prod(productId) || DB.products[0];
  sheet(`${sheetH("Réapprovisionnement")}
    <label class="f"><span>Produit</span><select class="inp" id="byP" onchange="buyPick()">${DB.products.map(x => opt(x.id, x.name, p.id)).join("")}</select></label>
    <label class="f"><span>Fournisseur</span><select class="inp" id="byS"><option value="">—</option>${DB.suppliers.map(s => opt(s.id, s.name, p.supplierId)).join("")}</select></label>
    <div class="f2"><label class="f"><span>Quantité reçue</span><input class="inp" id="byQ" inputmode="numeric" value="1"></label>
      <label class="f"><span>Prix d'achat unitaire</span><input class="inp" id="byC" inputmode="decimal" value="${p.cost}"></label></div>
    <label class="f"><span>Date</span><input class="inp" type="date" id="byD" value="${todayISO()}"></label>
    <div class="hint">Le montant est enregistré automatiquement dans les dépenses (catégorie « Achat stock »).</div>
    <div class="btn-row"><button class="btn ghost" onclick="closeSheet()">Annuler</button><button class="btn" onclick="saveBuy()">Enregistrer</button></div>`);
}
function buyPick(){
  const p = prod(val("byP")); if (!p) return;
  document.getElementById("byC").value = p.cost; document.getElementById("byS").value = p.supplierId || "";
}
function saveBuy(){
  const p = prod(val("byP")), qty = Math.floor(nval("byQ")), cost = nval("byC"), date = val("byD");
  if (!p){ toast("Choisissez un produit", "bad"); return; }
  if (qty <= 0){ toast("Quantité invalide", "bad"); return; }
  if (!isISO(date)){ toast("Date invalide", "bad"); return; }
  const total = Math.round(qty * cost);
  const pur = { id: uid(), date, supplierId: val("byS"), items: [{ productId: p.id, qty, cost }], total };
  p.qty = N(p.qty) + qty; if (cost > 0) p.cost = cost;
  if (!p.supplierId && pur.supplierId) p.supplierId = pur.supplierId;
  if (total > 0){
    const x = { id: uid(), date, label: "Achat " + p.name, category: "Achat stock", amount: total };
    DB.expenses.push(x); pur.expenseId = x.id;
  }
  DB.purchases.push(pur);
  save(); closeSheet(); render(); toast("Stock mis à jour : " + p.name + " +" + qty);
}
function purchaseSheet(id){
  const p = DB.purchases.find(x => x.id === id); if (!p) return;
  sheet(`${sheetH("Achat du " + frDate(p.date))}
    <div>${p.items.map(i => `<div class="kv"><span>${esc((prod(i.productId) || {}).name || "Produit supprimé")} × ${num(i.qty)}</span><b>${money(i.qty * i.cost)}</b></div>`).join("")}
    <div class="kv tot"><span>Total</span><b>${money(p.total)}</b></div></div>
    <div class="cap mt">Fournisseur : ${esc((sup(p.supplierId) || {}).name || "—")}</div>
    <button class="btn danger block mt2" onclick="purchaseDel('${p.id}')">${ic("trash", 17)}Annuler cet achat</button>`);
}
async function purchaseDel(id){
  const p = DB.purchases.find(x => x.id === id); if (!p) return;
  if (!await askConfirm("Annuler cet achat ?", "Le stock sera diminué et la dépense associée supprimée.", { ok: "Annuler l'achat", cancel: "Garder", danger: true })) return;
  p.items.forEach(i => { const pr = prod(i.productId); if (pr) pr.qty = Math.max(0, N(pr.qty) - N(i.qty)); });
  if (p.expenseId) DB.expenses = DB.expenses.filter(x => x.id !== p.expenseId);
  DB.purchases = DB.purchases.filter(x => x.id !== id);
  save(); closeSheet(); render(); toast("Achat annulé");
}

/* ============================ VENTES ============================ */
const VT = { period: "jour" };
function vtPeriod(p){ VT.period = p; render(); }

VIEWS.ventes = () => {
  const r = range(VT.period), gerant = isGerant();
  const list = salesIn(r).filter(s => gerant || s.employeId === meId()).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const tot = sum(list, s => s.total);
  const groups = {}; list.forEach(s => { (groups[s.date] = groups[s.date] || []).push(s); });
  const body = Object.keys(groups).sort().reverse().map(d => `<div class="section-lbl">${esc(longDate(d))}<span class="sp"></span><span>${money(sum(groups[d], s => s.total))}</span></div>
    <div class="list">${groups[d].map(s => `<button class="row" onclick="saleSheet('${s.id}')"><div class="time">${esc(s.time)}</div>
      <div class="grow"><div class="t trunc">${esc(saleCliName(s) || "Passage")}</div><div class="s">${esc(s.items.map(i => i.name + (i.qty > 1 ? " ×" + i.qty : "")).join(", "))}${gerant ? " · " + esc(saleEmpName(s)) : ""}</div></div>
      <div style="text-align:right"><div class="amt">${num(s.total)}</div>${payBadge(s.payment)}</div></button>`).join("")}</div>`).join("");
  return pageH("Ventes", r.label) +
    `<div class="seg mb"><button class="${VT.period === "jour" ? "on" : ""}" onclick="vtPeriod('jour')">Jour</button><button class="${VT.period === "semaine" ? "on" : ""}" onclick="vtPeriod('semaine')">Semaine</button><button class="${VT.period === "mois" ? "on" : ""}" onclick="vtPeriod('mois')">Mois</button></div>
    <div class="pill-sum"><span class="muted">${list.length} vente${list.length > 1 ? "s" : ""}</span><b class="xb gold">${money(tot)}</b></div>
    ${body || `<div class="card mt">${emptyBox("receipt", "Aucune vente", "Les ventes de la période apparaîtront ici.")}</div>`}`;
};

function saleSheet(id){
  const s = DB.sales.find(x => x.id === id);
  if (!s || !(isGerant() || s.employeId === meId())) return;
  const gerant = isGerant();
  sheet(`${sheetH("Vente de " + s.time)}
    <div class="flex" style="flex-wrap:wrap;gap:8px"><span class="badge">${esc(longDate(s.date))}</span>${payBadge(s.payment)}</div>
    <div class="mt">${s.items.map(i => `<div class="kv"><span>${esc(i.name)}${i.qty > 1 ? " × " + i.qty : ""}</span><b>${money(i.price * i.qty)}</b></div>`).join("")}
      ${N(s.discount) > 0 ? `<div class="kv"><span>Remise</span><b class="okc">− ${money(s.discount)}</b></div>` : ""}
      <div class="kv tot"><span>Total</span><b>${money(s.total)}</b></div></div>
    <div class="mt"><div class="kv"><span>Coiffeur</span><b>${esc(saleEmpName(s))}</b></div>
      <div class="kv"><span>Client</span><b>${esc(saleCliName(s) || "Passage")}</b></div>
      ${gerant ? `<div class="kv"><span>Commission (${N(salePct(s))} %)</span><b>${money(saleCom(s))}</b></div>` : ""}</div>
    <div class="btn-row wrapb"><button class="btn ghost" onclick="sendTicket('${s.id}')">${ic("chat", 17)}WhatsApp</button><button class="btn ghost" onclick="printTicket('${s.id}')">${ic("printer", 17)}Imprimer</button></div>
    ${gerant ? `<button class="btn danger block mt" onclick="cancelSale('${s.id}')">${ic("trash", 17)}Annuler cette vente</button>` : ""}`);
}
async function cancelSale(id){
  if (!isGerant()){ denied(); return; }
  const s = DB.sales.find(x => x.id === id); if (!s) return;
  if (!await askConfirm("Annuler cette vente ?", "Le stock des produits est remis, les points et l'ardoise du client sont corrigés. Cette action est définitive.", { ok: "Annuler la vente", cancel: "Garder", danger: true })) return;
  s.items.forEach(i => { if (i.kind === "product"){ const p = prod(i.refId); if (p) p.qty = N(p.qty) + N(i.qty); } });
  const c = cli(s.clientId);
  if (c){
    c.points = Math.max(0, N(c.points) - (s.pts != null ? N(s.pts) : Math.round(N(s.total) / 100)));
    c.visits = Math.max(0, N(c.visits) - 1);
    if (s.payment === "credit") c.debt = Math.max(0, N(c.debt) - N(s.total));
  }
  DB.sales = DB.sales.filter(x => x.id !== id);
  save(); closeSheet(); render(); toast("Vente annulée");
}
