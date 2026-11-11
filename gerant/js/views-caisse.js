/* ===========================================================
   Salon Gérant v6 — caisse : ticket, encaissement, reçu, choix du client.
   =========================================================== */
"use strict";

/* ---------- état du ticket (gardé le temps de la session) ---------- */
let TICKET = null, CAISSE_TAB = "service";

function newTicket(){
  const a = activeEmps();
  return { employeId: isGerant() ? (a.length === 1 ? a[0].id : "") : meId(), clientId: "", items: [], dMode: "pct", dVal: 0, rdvId: "" };
}
function loadTicket(){
  try {
    const t = JSON.parse(sessionStorage.getItem(TICKET_KEY));
    if (t && typeof t === "object" && Array.isArray(t.items)) return Object.assign(newTicket(), t);
  } catch (e) {}
  return newTicket();
}
function saveTicket(){ try { sessionStorage.setItem(TICKET_KEY, JSON.stringify(TICKET)); } catch (e) {} }

/* remet le ticket d'aplomb après un changement de données (synchro, profil, suppression…) */
function ticketCheck(){
  if (!TICKET) TICKET = loadTicket();
  const t = TICKET;
  if (!isGerant()) t.employeId = meId();
  else {
    const e = emp(t.employeId);
    if (!e || !e.active) t.employeId = "";
    if (!t.employeId && activeEmps().length === 1) t.employeId = activeEmps()[0].id;
  }
  if (t.clientId && !cli(t.clientId)) t.clientId = "";
  if (t.rdvId && !DB.rdv.some(r => r.id === t.rdvId && r.status !== "fait" && r.status !== "annule")) t.rdvId = "";
  t.items = t.items.filter(i => i && (i.kind === "service" ? svc(i.refId) : prod(i.refId)));
  t.items.forEach(i => {
    const o = i.kind === "service" ? svc(i.refId) : prod(i.refId);
    i.name = o.name; i.price = i.kind === "service" ? N(o.price) : N(o.sell);
    i.qty = Math.max(1, Math.floor(N(i.qty)) || 1);
    if (i.kind === "product") i.qty = Math.min(i.qty, Math.max(0, Math.floor(N(o.qty))));
  });
  t.items = t.items.filter(i => i.qty > 0);
  t.dMode = t.dMode === "amt" ? "amt" : "pct"; t.dVal = Math.max(0, N(t.dVal));
  saveTicket();
}
function tkTotals(){
  const t = TICKET, gross = sum(t.items, i => i.price * i.qty);
  const disc = t.dMode === "pct" ? Math.round(gross * Math.min(100, t.dVal) / 100) : Math.max(0, Math.min(Math.round(t.dVal), gross));
  return { gross, disc, net: gross - disc };
}

/* ---------- actions sur le ticket ---------- */
function tkEmp(id){ TICKET.employeId = id; saveTicket(); render(); }
function caisseTab(t){ CAISSE_TAB = t; render(); }
function ticketAdd(kind, id){
  ticketCheck();
  const o = kind === "service" ? svc(id) : prod(id); if (!o) return;
  const ex = TICKET.items.find(i => i.kind === kind && i.refId === id);
  if (kind === "product" && (ex ? ex.qty : 0) + 1 > N(o.qty)){ toast("Stock insuffisant", "bad"); return; }
  if (ex) ex.qty++;
  else TICKET.items.push({ kind, refId: id, name: o.name, price: kind === "service" ? N(o.price) : N(o.sell), qty: 1 });
  saveTicket(); render();
}
function ticketQty(idx, d){
  const i = TICKET.items[idx]; if (!i) return;
  const q = i.qty + d;
  if (q <= 0) TICKET.items.splice(idx, 1);
  else {
    if (i.kind === "product" && q > N((prod(i.refId) || {}).qty)){ toast("Stock insuffisant", "bad"); return; }
    i.qty = q;
  }
  saveTicket(); render();
}
async function tkClear(){
  if (!await askConfirm("Vider le ticket ?", "Les articles seront retirés.", { ok: "Vider", danger: true })) return;
  const e = TICKET.employeId; TICKET = newTicket(); if (e) TICKET.employeId = e;
  saveTicket(); render();
}
async function tkDiscount(){
  const t = TICKET;
  const cur = t.dVal > 0 ? (t.dMode === "pct" ? t.dVal + "%" : String(t.dVal)) : "";
  const v = await askValue("Remise", { msg: "Montant en " + CUR + " ou pourcentage (ex : 10%)", label: "Remise", inputmode: "text", value: cur, placeholder: "ex : 100 ou 10%", ok: "Appliquer" });
  if (v === null) return;
  const raw = v.replace(",", ".").replace(/\s/g, "");
  if (!raw){ t.dVal = 0; }
  else if (/%$/.test(raw)){
    const p = parseFloat(raw);
    if (!isFinite(p) || p < 0 || p > 100){ toast("Pourcentage entre 0 et 100", "bad"); return; }
    t.dMode = "pct"; t.dVal = p;
  } else {
    const a = parseFloat(raw);
    if (!isFinite(a) || a < 0){ toast("Montant invalide", "bad"); return; }
    t.dMode = "amt"; t.dVal = a;
  }
  saveTicket(); render();
}

/* ---------- page Caisse ---------- */
VIEWS.caisse = () => {
  ticketCheck();
  const t = TICKET, tot = tkTotals(), gerant = isGerant(), emps = activeEmps();
  const m = me();
  if (!DB.services.length && !DB.products.some(p => p.sell > 0))
    return pageH("Caisse") + `<div class="card">${emptyBox("scissors", "Aucune prestation", "Ajoutez vos prestations pour commencer à encaisser.")}
      ${gerant ? `<div class="btn-row"><button class="btn" onclick="go('prestations')">Ajouter des prestations</button></div>` : ""}</div>`;
  if (gerant && !emps.length)
    return pageH("Caisse") + `<div class="card">${emptyBox("users", "Aucun coiffeur", "Ajoutez au moins un coiffeur pour enregistrer des ventes.")}
      <div class="btn-row"><button class="btn" onclick="go('employes')">Ajouter un coiffeur</button></div></div>`;

  const empBar = gerant
    ? `<div class="chips mb">${emps.map(e => `<button class="chip ${e.id === t.employeId ? "on" : ""}" onclick="tkEmp('${e.id}')">${esc(e.name)}</button>`).join("")}</div>`
    : `<div class="flex mb">${m ? empAv(m, "sm") : ""}<div><div class="b">${esc(m ? m.name : "")}</div><div class="cap">Votre caisse</div></div></div>`;

  const inTk = (k, id) => { const i = t.items.find(x => x.kind === k && x.refId === id); return i ? i.qty : 0; };
  const hasProd = DB.products.some(p => p.sell > 0);
  if (!hasProd && CAISSE_TAB === "product") CAISSE_TAB = "service";
  const list = CAISSE_TAB === "product" ? DB.products.filter(p => p.sell > 0) : DB.services;
  const tiles = list.length ? list.map(o => {
    const k = CAISSE_TAB === "product" ? "product" : "service", n = inTk(k, o.id);
    const price = k === "service" ? o.price : o.sell;
    const sub = k === "service" ? `${N(o.duration)} min` : (o.qty > 0 ? `Stock : ${num(o.qty)}` : "Épuisé");
    return `<button class="tile ${k === "product" && o.qty <= 0 ? "out" : ""}" onclick="ticketAdd('${k}','${o.id}')">
      <span class="n">${esc(o.name)}</span><span><span class="p">${money(price)}</span><br><span class="q">${sub}</span></span>
      ${n ? `<span class="cnt">${n}</span>` : ""}</button>`;
  }).join("") : emptyBox(CAISSE_TAB === "product" ? "box" : "scissors", "Rien à afficher", CAISSE_TAB === "product" ? "Aucun produit à vendre (prix de vente à renseigner dans le stock)." : "Aucune prestation.");

  const c = cli(t.clientId), rdv = t.rdvId ? DB.rdv.find(r => r.id === t.rdvId) : null;
  const lines = t.items.map((i, idx) => `<div class="tk-line">
      <div class="grow"><div class="b trunc">${esc(i.name)}</div><div class="cap">${money(i.price)}${i.kind === "product" ? " · produit" : ""}</div></div>
      <div class="qty"><button onclick="ticketQty(${idx},-1)" aria-label="Moins">${ic("minus", 15)}</button><b>${i.qty}</b><button onclick="ticketQty(${idx},1)" aria-label="Plus">${ic("plus", 15)}</button></div>
      <b class="nowrap" style="min-width:64px;text-align:right">${money(i.price * i.qty)}</b></div>`).join("");

  const ticket = `<div class="card sticky" id="tkCard">
    <div class="flexb"><h3>Ticket</h3>${t.items.length ? `<button class="link" onclick="tkClear()">Vider</button>` : ""}</div>
    ${rdv ? `<div class="note mt">${ic("calendar", 16)}<span>Rendez-vous de ${esc(rdv.time)} — ${esc(rdv.clientName)}</span></div>` : ""}
    <button class="pill-sum mt" style="width:100%" onclick="clientPick()"><span class="flex">${ic("user", 17)}<span class="muted">Client</span></span>
      <span class="flex"><b class="trunc">${c ? esc(c.name) : "Passage"}</b>${c && c.debt > 0 ? `<span class="badge warn">Ardoise ${money(c.debt)}</span>` : ""}${ic("chevR", 16)}</span></button>
    <div class="mt">${lines || emptyBox("receipt", "Ticket vide", "Touchez une prestation pour l'ajouter.")}</div>
    ${t.items.length ? `<div class="hr"></div>
      ${tot.disc > 0 ? `<div class="kv"><span>Sous-total</span><b>${money(tot.gross)}</b></div>` : ""}
      <div class="kv"><span><button class="link" onclick="tkDiscount()">${tot.disc > 0 ? "Modifier la remise" : "Ajouter une remise"}</button></span>${tot.disc > 0 ? `<b class="okc">− ${money(tot.disc)}</b>` : `<b class="faint">—</b>`}</div>
      <div class="kv tot"><span>Total</span><b>${money(tot.net)}</b></div>` : ""}
  </div>`;

  const tabs = hasProd ? `<div class="seg mb"><button class="${CAISSE_TAB === "service" ? "on" : ""}" onclick="caisseTab('service')">Prestations</button><button class="${CAISSE_TAB === "product" ? "on" : ""}" onclick="caisseTab('product')">Produits</button></div>` : "";

  const nbArt = sum(t.items, i => i.qty);
  const bar = t.items.length ? `<div class="paybar"><div class="tot"><span>${nbArt} article${nbArt > 1 ? "s" : ""}</span><b>${money(tot.net)}</b></div>
      <button class="btn lg" onclick="payOpen()">Encaisser</button></div>` : "";

  return pageH("Caisse", longDate(todayISO())) + `<div class="cols"><div>${empBar}${tabs}<div class="tiles">${tiles}</div></div><div class="mt2" style="margin-top:0">${ticket}${bar}</div></div>`;
};

/* ---------- encaissement ---------- */
function payOpen(){
  ticketCheck();
  const t = TICKET;
  if (!t.items.length){ toast("Le ticket est vide", "bad"); return; }
  if (!t.employeId){ toast("Choisissez le coiffeur", "bad"); return; }
  const tot = tkTotals(), c = cli(t.clientId);
  sheet(`${sheetH("Encaisser")}
    <div class="pill-sum"><span class="muted">Total à payer</span><b class="xb gold" style="font-size:24px">${money(tot.net)}</b></div>
    <label class="f"><span>Montant reçu (facultatif, pour le rendu)</span>
      <input class="inp" id="recv" inputmode="decimal" placeholder="ex : 2000" oninput="recvCalc()" autocomplete="off"></label>
    <div class="hint" id="recvOut" style="min-height:20px"></div>
    <div class="paym mt">
      <button onclick="finalizeSale('espece')">${ic("cash", 24)}Espèces</button>
      <button onclick="finalizeSale('carte')">${ic("card", 24)}Carte</button>
      <button onclick="finalizeSale('credit')">${ic("book", 24)}Crédit</button>
    </div>
    <div class="hint center mt">${c ? "Le crédit sera ajouté à l'ardoise de " + esc(c.name) + "." : "Le crédit nécessite de choisir un client."}</div>`);
}
function recvCalc(){
  const t = TICKET ? tkTotals().net : 0, v = nval("recv"), el = document.getElementById("recvOut");
  if (!el) return;
  el.innerHTML = v >= t && v > 0 ? `Rendu à la caisse : <b class="gold">${money(v - t)}</b>` : (v > 0 ? `<span class="warnc">Il manque ${money(t - v)}</span>` : "");
}
function finalizeSale(payment){
  ticketCheck();
  const t = TICKET;
  if (!t.items.length){ closeSheet(); return; }
  if (!PAYS.includes(payment)) return;
  const e = emp(t.employeId);
  if (!e){ toast("Choisissez le coiffeur", "bad"); return; }
  const c = cli(t.clientId);
  if (payment === "credit" && !c){ toast("Choisissez un client pour une vente à crédit", "bad"); return; }
  for (const i of t.items){
    if (i.kind !== "product") continue;
    const p = prod(i.refId);
    if (!p || p.qty < i.qty){ toast("Stock insuffisant : " + i.name, "bad"); return; }
  }
  const tot = tkTotals();
  const sale = {
    id: uid(), date: todayISO(), time: nowHM(), employeId: e.id, clientId: c ? c.id : "",
    items: t.items.map(i => ({ kind: i.kind, refId: i.refId, name: i.name, price: i.price, qty: i.qty })),
    total: tot.net, discount: tot.disc, payment,
    employeName: e.name, comPct: N(e.commission), clientName: c ? c.name : "",
  };
  t.items.forEach(i => { if (i.kind === "product"){ const p = prod(i.refId); p.qty = Math.max(0, p.qty - i.qty); } });
  if (c){
    sale.pts = Math.round(tot.net / 100);
    c.points = N(c.points) + sale.pts; c.visits = N(c.visits) + 1;
    if (payment === "credit") c.debt = N(c.debt) + tot.net;
  }
  const r = t.rdvId && DB.rdv.find(x => x.id === t.rdvId);
  if (r) r.status = "fait";
  DB.sales.push(sale);
  const keep = t.employeId;
  TICKET = newTicket(); if (isGerant() && keep) TICKET.employeId = keep;
  saveTicket(); save();
  closeSheet(); render();
  saleDone(sale.id);
}

/* ---------- reçu ---------- */
function receiptText(s){
  const L = [];
  L.push("*" + (DB.salon.name || "Salon") + "*");
  L.push(frDate(s.date) + " · " + s.time);
  const cn = saleCliName(s); if (cn) L.push("Client : " + cn);
  L.push("");
  s.items.forEach(i => L.push("• " + i.name + (i.qty > 1 ? " ×" + i.qty : "") + " : " + money(i.price * i.qty)));
  if (N(s.discount) > 0) L.push("Remise : − " + money(s.discount));
  L.push("*Total : " + money(s.total) + "* (" + (PAY_LBL[s.payment] || PAY_LBL.espece)[0] + ")");
  if (N(s.pts) > 0){ const c = cli(s.clientId); if (c) L.push("Fidélité : +" + s.pts + " pts (total " + num(c.points) + ")"); }
  L.push(""); L.push("Merci de votre visite !");
  return L.join("\n");
}
function ticketHtml(s){
  const rows = s.items.map(i => `<tr><td>${esc(i.name)}${i.qty > 1 ? " ×" + i.qty : ""}</td><td class="r">${num(i.price * i.qty)}</td></tr>`).join("");
  return `<h1>${esc(DB.salon.name)}</h1><div class="c">${esc(DB.salon.loc)}<br>${frDate(s.date)} · ${esc(s.time)}</div>
    ${saleCliName(s) ? `<div class="c">Client : ${esc(saleCliName(s))}</div>` : ""}
    <table style="margin-top:8pt">${rows}</table>
    ${N(s.discount) > 0 ? `<div class="kv"><span>Remise</span><b>− ${num(s.discount)}</b></div>` : ""}
    <div class="kv tot"><span>Total</span><b>${money(s.total)}</b></div>
    <div class="c">${(PAY_LBL[s.payment] || PAY_LBL.espece)[0]}</div><div class="foot">Merci de votre visite !</div>`;
}
function saleDone(id){
  const s = DB.sales.find(x => x.id === id); if (!s) return;
  sheet(`${sheetH("Vente enregistrée")}
    <div class="center" style="padding:6px 0 2px">
      <div class="av lg" style="margin:0 auto 12px;color:var(--ok);background:var(--ok-soft);border-color:transparent">${ic("check", 28)}</div>
      <div class="big-num gold">${money(s.total)}</div>
      <div class="cap mt">${esc(saleEmpName(s))} · ${(PAY_LBL[s.payment] || PAY_LBL.espece)[0]}</div></div>
    <div class="btn-row wrapb"><button class="btn ghost" onclick="sendTicket('${s.id}')">${ic("chat", 18)}Ticket WhatsApp</button>
      <button class="btn ghost" onclick="printTicket('${s.id}')">${ic("printer", 18)}Imprimer</button></div>
    <button class="btn block lg mt" onclick="closeSheet()">Nouvelle vente</button>`);
}
function sendTicket(id){
  const s = DB.sales.find(x => x.id === id); if (!s) return;
  const c = cli(s.clientId), txt = receiptText(s);
  if (c && phoneDigits(c.phone)) openWa(c.phone, txt); else shareText(txt, DB.salon.name);
}
function printTicket(id){
  const s = DB.sales.find(x => x.id === id); if (!s) return;
  printDoc(ticketHtml(s), "ticket");
}

/* ---------- choix du client ---------- */
function cliFilter(q){
  q = S(q).trim().toLowerCase();
  const d = q.replace(/\D/g, "");
  return DB.clients.filter(c => !q || c.name.toLowerCase().includes(q) || (d.length >= 3 && c.phone.replace(/\D/g, "").includes(d)))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
function clientPick(){
  sheet(`${sheetH("Client")}
    <div class="search">${ic("search", 18)}<input class="inp" id="cpQ" placeholder="Rechercher un nom ou un numéro" oninput="cpList()" autocomplete="off"></div>
    <div class="list mt" id="cpList"></div>
    <div class="hr"></div><div class="lbl">Nouveau client</div>
    <div class="f2"><input class="inp" id="cpN" placeholder="Nom" autocomplete="off"><input class="inp" id="cpP" inputmode="tel" placeholder="Téléphone" autocomplete="off"></div>
    <button class="btn block mt" onclick="cpNew()">${ic("plus", 18)}Ajouter et choisir</button>`);
  cpList();
}
function cpList(){
  const el = document.getElementById("cpList"); if (!el) return;
  const l = cliFilter(val("cpQ")).slice(0, 40);
  el.innerHTML = `<button class="row" onclick="cpSet('')"><div class="av icn">${ic("user", 18)}</div><div class="grow"><div class="t">Passage</div><div class="s">Sans fiche client</div></div>${!TICKET.clientId ? ic("check", 18) : ""}</button>` +
    l.map(c => `<button class="row" onclick="cpSet('${c.id}')"><div class="av">${esc(initials(c.name))}</div>
      <div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.phone || "Pas de numéro")}</div></div>
      ${c.debt > 0 ? `<span class="badge warn">${money(c.debt)}</span>` : ""}${c.id === TICKET.clientId ? ic("check", 18) : ""}</button>`).join("");
}
function cpSet(id){ TICKET.clientId = id; saveTicket(); closeSheet(); render(); }
function cpNew(){
  const name = val("cpN"), phone = val("cpP");
  if (!name){ toast("Saisissez le nom", "bad"); return; }
  const same = phoneDigits(phone).length >= 8 && DB.clients.find(c => phoneDigits(c.phone) === phoneDigits(phone));
  if (same){ toast("Ce numéro existe déjà : " + same.name, "info"); cpSet(same.id); return; }
  const c = { id: uid(), name, phone, note: "", points: 0, visits: 0, debt: 0, created: todayISO() };
  DB.clients.push(c); save();
  cpSet(c.id);
}

TICKET = loadTicket();
