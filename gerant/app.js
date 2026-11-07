/* ===========================================================
   Salon Gérant — app du patron / gérant (multi-coiffeurs)
   App 100% hors-ligne (localStorage). Séparée de l'app coiffeur.
   =========================================================== */
"use strict";
const APP_VERSION = "v2";
const KEY = "salon_gerant";
const CFG = (typeof window !== "undefined" && window.APP_CONFIG) || {};
const CUR = CFG.currency || "DA";

/* ---------- helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money = n => (Math.round(Number(n)||0)).toLocaleString("fr-FR") + " " + CUR;
const num = n => (Math.round(Number(n)||0)).toLocaleString("fr-FR");
const todayISO = () => { const d=new Date(); return isoOf(d); };
const isoOf = d => { const z=new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,10); };
const nowHM = () => { const d=new Date(); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
const frDate = iso => { if(!iso) return ""; const [y,m,dd]=iso.split("-"); return `${dd}/${m}/${y}`; };
const frDay  = iso => { const d=new Date(iso+"T12:00"); return ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][d.getDay()]; };
const initials = n => (n||"?").trim().split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase();
const phoneDigits = p => (p||"").replace(/\D/g,"").slice(-9);

/* ---------- state ---------- */
function BASE(){
  return {
    salon: { name: CFG.salonName || "Mon salon", tagline: CFG.tagline || "", loc: CFG.location || "", whatsapp: CFG.whatsapp || "" },
    employes: [], clients: [], services: [], products: [], suppliers: [],
    rdv: [], sales: [], expenses: [], attendance: [], leaves: [], purchases: [], payments: [],
    seeded: false
  };
}
let DB = load();

function load(){
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && typeof r==="object") return Object.assign(BASE(), r); }
  catch(e){}
  return seedDemo();
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e){} }

function seedDemo(){
  const db = BASE();
  db.seeded = true;
  const e = (name, role, com, sal, c2=false) => ({ id:uid(), name, phone:"", role, commission:com, salary:sal, c2, active:true });
  db.employes = [
    e("Amine", "Coiffeur", 30, 25000, false),
    e("Yacine", "Coiffeur", 30, 25000, true),
    e("Sofiane", "Barbier", 25, 20000, false),
  ];
  const s = (name, price, dur) => ({ id:uid(), name, price, duration:dur });
  db.services = [
    s("Coupe", 500, 30), s("Coupe + Barbe", 800, 45), s("Barbe", 300, 20),
    s("Dégradé", 600, 35), s("Enfant", 400, 25), s("Coloration", 1500, 60),
  ];
  const p = (name, cat, qty, min, cost, sell, sup) => ({ id:uid(), name, cat, qty, min, cost, sell, supplierId:sup });
  const sup1 = { id:uid(), name:"Cosmetic DZ", phone:"" };
  const sup2 = { id:uid(), name:"Pro Coiffure Alger", phone:"" };
  db.suppliers = [sup1, sup2];
  db.products = [
    p("Gel coiffant", "Soin", 12, 5, 250, 500, sup1.id),
    p("Cire mate", "Soin", 3, 5, 400, 800, sup1.id),
    p("Shampoing 1L", "Soin", 6, 3, 600, 1100, sup2.id),
    p("Lame rasoir (x10)", "Consommable", 2, 4, 150, 0, sup2.id),
    p("Serviette", "Consommable", 20, 10, 100, 0, sup1.id),
    p("Huile à barbe", "Soin", 8, 3, 500, 1000, sup1.id),
  ];
  const c = (name, phone) => ({ id:uid(), name, phone, note:"", points:0, created:todayISO(), visits:0 });
  db.clients = [ c("Karim B.","0550112233"), c("Mehdi","0661445566"), c("Walid","0770998877") ];
  return db;
}

/* ---------- lookups ---------- */
const emp  = id => DB.employes.find(x=>x.id===id);
const cli  = id => DB.clients.find(x=>x.id===id);
const svc  = id => DB.services.find(x=>x.id===id);
const prod = id => DB.products.find(x=>x.id===id);
const sup  = id => DB.suppliers.find(x=>x.id===id);
const empName  = id => (emp(id)||{}).name  || "—";
const cliName  = id => (cli(id)||{}).name  || "Client";

/* ---------- date ranges ---------- */
function range(period){
  const d = new Date(); const end = todayISO();
  if (period==="jour") return { from: end, to: end, label:"Aujourd'hui" };
  if (period==="semaine"){ const s=new Date(d); const day=(s.getDay()+6)%7; s.setDate(s.getDate()-day); return { from: isoOf(s), to: end, label:"Cette semaine" }; }
  const s=new Date(d.getFullYear(), d.getMonth(), 1); return { from: isoOf(s), to: end, label:"Ce mois-ci" };
}
const inRange = (iso, r) => iso>=r.from && iso<=r.to;
const salesIn = r => DB.sales.filter(s=>inRange(s.date, r));
const expIn   = r => DB.expenses.filter(x=>inRange(x.date, r));
function commissionOfSale(s, empId){
  if (empId && s.employeId!==empId) return 0;
  return s.items.filter(i=>i.kind==="service").reduce((a,i)=>{
    const e = emp(s.employeId); const pct = e ? (e.commission||0) : 0;
    return a + (i.price*i.qty)*pct/100;
  }, 0);
}

/* ---------- router ---------- */
const NAV = [
  { r:"dash",     i:"🏠", t:"Accueil" },
  { r:"caisse",   i:"🧾", t:"Caisse" },
  { r:"agenda",   i:"📅", t:"Agenda" },
  { r:"employes", i:"✂️", t:"Équipe" },
  { r:"more",     i:"⋯",  t:"Plus" },
];
let TICKET = null; // ticket caisse en cours
let AG_DATE = todayISO();
let FIN_PERIOD = "mois";

function currentRoute(){ return (location.hash.replace("#","").split("/")[0]) || "dash"; }
function go(r){ location.hash = "#"+r; }

function render(){
  const r = currentRoute();
  const views = { dash:viewDash, caisse:viewCaisse, agenda:viewAgenda, employes:viewEmployes,
                  more:viewMore, clients:viewClients, stock:viewStock, finances:viewFinances, reglages:viewReglages,
                  ventes:viewVentes };
  const v = views[r] || viewDash;
  const app = $("#app");
  app.innerHTML = v();
  window.scrollTo(0,0);
  // nav active
  $$(".nav a").forEach(a=>{
    const base = ["clients","stock","finances","reglages","ventes"].includes(r) ? "more" : r;
    a.classList.toggle("on", a.dataset.r===base);
  });
  updateFab(r);
}
window.addEventListener("hashchange", render);

/* ---------- nav labels ---------- */
function paintNav(){
  $$(".nav a").forEach(a=>{
    const n = NAV.find(x=>x.r===a.dataset.r);
    if (n) a.innerHTML = `<span class="i">${n.i}</span>${n.t}`;
  });
}

/* ========================================================================
   TABLEAU DE BORD
   ======================================================================== */
function viewDash(){
  const r = range("jour");
  const sTo = salesIn(r);
  const rec = sTo.reduce((a,s)=>a+s.total,0);
  const nbV = sTo.length;
  const pm  = nbV ? rec/nbV : 0;
  const rdvToday = DB.rdv.filter(x=>x.date===todayISO());
  const low = DB.products.filter(p=>p.qty<=p.min);
  // top coiffeurs du jour
  const byEmp = {};
  sTo.forEach(s=>{ byEmp[s.employeId]=(byEmp[s.employeId]||0)+s.total; });
  const tops = Object.entries(byEmp).sort((a,b)=>b[1]-a[1]).slice(0,3);

  return `
  <section class="page">
    <div class="page-h"><div><div class="h">Bonjour 👋</div><div class="d">${esc(DB.salon.name)} · ${frDate(todayISO())}</div></div></div>

    <div class="grid g2">
      <div class="stat gold"><span class="ic">💰</span><div class="lbl">Recette du jour</div><div class="val">${num(rec)}</div><div class="muted" style="font-size:11px">${CUR}</div></div>
      <div class="stat"><span class="ic">🧾</span><div class="lbl">Ventes</div><div class="val">${nbV}</div></div>
      <div class="stat"><span class="ic">📅</span><div class="lbl">RDV aujourd'hui</div><div class="val">${rdvToday.length}</div></div>
      <div class="stat"><span class="ic">📊</span><div class="lbl">Panier moyen</div><div class="val sm">${num(pm)} ${CUR}</div></div>
    </div>

    <div class="section-lbl">Top coiffeurs — aujourd'hui</div>
    <div class="card">
      ${tops.length ? tops.map(([id,v],i)=>`
        <div class="row">
          <div class="av ${emp(id)&&emp(id).c2?"c2":""}">${esc(initials(empName(id)))}</div>
          <div class="main"><div class="t">${i===0?"🥇 ":""}${esc(empName(id))}</div><div class="s">${(byEmp[id]/rec*100||0).toFixed(0)}% de la recette</div></div>
          <div class="end"><div class="t gold">${money(v)}</div></div>
        </div>`).join("")
      : `<div class="empty"><div class="ic">✂️</div>Aucune vente encore aujourd'hui.<br>Ouvre la <b>Caisse</b> pour commencer.</div>`}
    </div>

    <div class="section-lbl">Prochains RDV</div>
    <div class="card">
      ${rdvToday.length ? rdvToday.sort((a,b)=>a.time.localeCompare(b.time)).slice(0,5).map(rdvRow).join("")
        : `<div class="empty"><div class="ic">📅</div>Aucun rendez-vous aujourd'hui.</div>`}
    </div>

    ${low.length ? `
    <div class="section-lbl">⚠️ Stock bas (${low.length})</div>
    <div class="card">
      ${low.slice(0,5).map(p=>`
        <div class="row">
          <div class="av" style="background:rgba(224,106,90,.18);color:var(--bad)">!</div>
          <div class="main"><div class="t">${esc(p.name)}</div><div class="s">Reste ${p.qty} · seuil ${p.min}</div></div>
          <div class="end"><span class="badge b-bad">${p.qty===0?"Rupture":"Bas"}</span></div>
        </div>`).join("")}
      <button class="btn block mt" onclick="go('stock')">Gérer le stock</button>
    </div>` : ""}

    <div class="section-lbl">Raccourcis</div>
    <div class="grid g2">
      <button class="btn" onclick="go('caisse')">🧾 Nouvelle vente</button>
      <button class="btn" onclick="openRdv()">📅 Ajouter RDV</button>
      <button class="btn" onclick="go('finances')">📈 Finances</button>
      <button class="btn" onclick="go('employes')">✂️ Équipe</button>
    </div>
  </section>`;
}
function rdvRow(x){
  const st = { attente:["b-warn","En attente"], confirme:["b-info","Confirmé"], fait:["b-ok","Terminé"], annule:["b-mut","Annulé"] }[x.status] || ["b-mut",x.status];
  return `<div class="row clk" onclick="openRdv('${x.id}')">
    <div class="end" style="width:52px;text-align:center"><div class="t gold">${esc(x.time)}</div><div class="s" style="font-size:11px">${frDay(x.date)}</div></div>
    <div class="main"><div class="t">${esc(x.clientName||cliName(x.clientId))}</div><div class="s">${esc((svc(x.serviceId)||{}).name||x.serviceName||"")} · ${esc(empName(x.employeId))}</div></div>
    <div class="end"><span class="badge ${st[0]}">${st[1]}</span></div>
  </div>`;
}

/* ========================================================================
   CAISSE (point de vente)
   ======================================================================== */
function newTicket(){ return { employeId: (DB.employes[0]||{}).id || "", clientId:"", items:[] }; }
function viewCaisse(){
  if (!TICKET) TICKET = newTicket();
  const t = TICKET;
  const total = t.items.reduce((a,i)=>a+i.price*i.qty,0);
  const active = DB.employes.filter(e=>e.active);
  return `
  <section class="page">
    <div class="page-h"><div><div class="h">Caisse</div><div class="d">Encaisser une prestation</div></div></div>

    <div class="section-lbl">Coiffeur</div>
    <div class="chips">
      ${active.map(e=>`<span class="chip ${t.employeId===e.id?"on":""}" onclick="ticketEmp('${e.id}')">${esc(e.name)}</span>`).join("") || `<span class="muted">Ajoute un coiffeur dans l'Équipe</span>`}
    </div>

    <div class="section-lbl">Client (optionnel)</div>
    <div class="chips">
      <span class="chip ${!t.clientId?"on":""}" onclick="ticketClient('')">Passage</span>
      ${DB.clients.slice(0,12).map(c=>`<span class="chip ${t.clientId===c.id?"on":""}" onclick="ticketClient('${c.id}')">${esc(c.name)}</span>`).join("")}
      <span class="chip" onclick="openClient()">＋ Nouveau</span>
    </div>

    <div class="section-lbl">Prestations</div>
    <div class="grid g2">
      ${DB.services.map(s=>`<button class="btn sm" onclick="ticketAdd('service','${s.id}')">${esc(s.name)}<br><span class="gold" style="font-size:12px">${money(s.price)}</span></button>`).join("")}
    </div>

    <div class="section-lbl">Produits</div>
    <div class="grid g2">
      ${DB.products.filter(p=>p.sell>0).map(p=>`<button class="btn sm" onclick="ticketAdd('product','${p.id}')" ${p.qty<=0?'disabled style="opacity:.4"':''}>${esc(p.name)}<br><span class="gold" style="font-size:12px">${money(p.sell)} · ${p.qty} en stock</span></button>`).join("") || `<span class="muted">Aucun produit en vente</span>`}
    </div>

    <div class="section-lbl">Ticket</div>
    <div class="card">
      ${t.items.length ? t.items.map((i,idx)=>`
        <div class="row">
          <div class="main"><div class="t">${esc(i.name)}</div><div class="s">${money(i.price)} × ${i.qty}</div></div>
          <div class="end" style="display:flex;align-items:center;gap:8px">
            <button class="btn sm ghost" onclick="ticketQty(${idx},-1)">−</button>
            <button class="btn sm ghost" onclick="ticketQty(${idx},1)">＋</button>
            <span class="t gold" style="min-width:66px;text-align:right">${num(i.price*i.qty)}</span>
          </div>
        </div>`).join("") : `<div class="empty"><div class="ic">🧾</div>Touche une prestation ou un produit ci-dessus.</div>`}
      ${t.items.length ? `<div class="hr"></div><div class="pill-sum"><span class="section-lbl" style="margin:0">Total</span><span class="big-num">${num(total)} ${CUR}</span></div>` : ""}
    </div>

    ${t.items.length ? `<button class="btn primary block mt" onclick="ticketPay()">Encaisser ${money(total)}</button>
    <button class="btn ghost block mt" onclick="ticketReset()">Annuler le ticket</button>` : ""}
  </section>`;
}
window.ticketEmp = id => { TICKET.employeId=id; render(); };
window.ticketClient = id => { TICKET.clientId=id; render(); };
window.ticketAdd = (kind,id) => {
  const ref = kind==="service"?svc(id):prod(id);
  if (!ref) return;
  const price = kind==="service"?ref.price:ref.sell;
  const ex = TICKET.items.find(i=>i.kind===kind&&i.refId===id);
  if (ex) ex.qty++; else TICKET.items.push({ kind, refId:id, name:ref.name, price, qty:1 });
  render();
};
window.ticketQty = (idx,d) => { const it=TICKET.items[idx]; if(!it)return; it.qty+=d; if(it.qty<=0)TICKET.items.splice(idx,1); render(); };
window.ticketReset = () => { TICKET=newTicket(); render(); };
window.ticketPay = () => {
  const t = TICKET;
  if (!t.items.length) return;
  if (!t.employeId){ toast("Choisis un coiffeur"); return; }
  const total = t.items.reduce((a,i)=>a+i.price*i.qty,0);
  sheet(`
    <div class="sheet-h"><h3>Encaisser ${money(total)}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <div class="section-lbl">Moyen de paiement</div>
    <div class="grid g3">
      <button class="btn" style="flex-direction:column;height:84px" onclick="finalizeSale('espece')"><span style="font-size:26px">💵</span>Espèces</button>
      <button class="btn" style="flex-direction:column;height:84px" onclick="finalizeSale('carte')"><span style="font-size:26px">💳</span>Carte</button>
      <button class="btn" style="flex-direction:column;height:84px" onclick="finalizeSale('credit')"><span style="font-size:26px">📒</span>Crédit</button>
    </div>
    <div class="muted mt" style="font-size:12.5px">« Crédit » = ardoise : le montant est ajouté à la dette du client (un client est obligatoire).</div>
  `);
};
window.finalizeSale = (payment) => {
  const t = TICKET;
  const total = t.items.reduce((a,i)=>a+i.price*i.qty,0);
  if (payment==="credit" && !t.clientId){ toast("Choisis un client pour le crédit"); closeSheet(); return; }
  // décrémenter le stock produits
  t.items.filter(i=>i.kind==="product").forEach(i=>{ const p=prod(i.refId); if(p) p.qty=Math.max(0,p.qty-i.qty); });
  // points de fidélité + visite (+ ardoise si crédit)
  if (t.clientId){ const c=cli(t.clientId); if(c){ c.points=(c.points||0)+Math.round(total/100); c.visits=(c.visits||0)+1; if(payment==="credit") c.debt=(c.debt||0)+total; } }
  DB.sales.push({ id:uid(), date:todayISO(), time:nowHM(), employeId:t.employeId, clientId:t.clientId,
                  items:JSON.parse(JSON.stringify(t.items)), total, payment });
  save(); TICKET=newTicket(); closeSheet(); toast("Encaissé ✓ "+money(total)); render();
};
const payLabel = p => ({espece:["💵","Espèces","b-ok"],carte:["💳","Carte","b-info"],credit:["📒","Crédit","b-warn"]}[p||"espece"]||["💵","Espèces","b-ok"]);

/* ========================================================================
   AGENDA / RDV
   ======================================================================== */
function viewAgenda(){
  const list = DB.rdv.filter(x=>x.date===AG_DATE).sort((a,b)=>a.time.localeCompare(b.time));
  const d = new Date(AG_DATE+"T12:00");
  const days = [];
  for (let i=-1;i<6;i++){ const dd=new Date(); dd.setDate(dd.getDate()+i); days.push(isoOf(dd)); }
  return `
  <section class="page">
    <div class="page-h"><div><div class="h">Agenda</div><div class="d">${frDay(AG_DATE)} ${frDate(AG_DATE)}</div></div>
      <button class="btn sm primary" onclick="openRdv()">＋ RDV</button></div>
    <div class="chips">
      ${days.map(iso=>`<span class="chip ${iso===AG_DATE?"on":""}" onclick="agDate('${iso}')">${iso===todayISO()?"Auj.":frDay(iso)+" "+iso.slice(8)}</span>`).join("")}
    </div>
    <div class="card mt">
      ${list.length ? list.map(rdvRow).join("") : `<div class="empty"><div class="ic">📅</div>Aucun RDV ce jour.</div>`}
    </div>
  </section>`;
}
window.agDate = iso => { AG_DATE=iso; render(); };

window.openRdv = (id) => {
  const r = id ? DB.rdv.find(x=>x.id===id) : null;
  const act = DB.employes.filter(e=>e.active);
  sheet(`
    <div class="sheet-h"><h3>${r?"Modifier le RDV":"Nouveau RDV"}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Client</span>
      <input class="inp" id="r_cname" placeholder="Nom du client" value="${esc(r?(r.clientName||cliName(r.clientId)):"")}"></label>
    <label class="f"><span class="cap">Téléphone (optionnel)</span>
      <input class="inp" id="r_cphone" inputmode="tel" placeholder="05.." value="${esc(r?(r.clientPhone||((cli(r.clientId)||{}).phone||"")):"")}"></label>
    <div class="f2">
      <label class="f"><span class="cap">Date</span><input class="inp" id="r_date" type="date" value="${r?r.date:AG_DATE}"></label>
      <label class="f"><span class="cap">Heure</span><input class="inp" id="r_time" type="time" value="${r?r.time:"10:00"}"></label>
    </div>
    <label class="f"><span class="cap">Coiffeur</span>
      <select class="inp" id="r_emp">${act.map(e=>`<option value="${e.id}" ${r&&r.employeId===e.id?"selected":""}>${esc(e.name)}</option>`).join("")}</select></label>
    <label class="f"><span class="cap">Prestation</span>
      <select class="inp" id="r_svc"><option value="">—</option>${DB.services.map(s=>`<option value="${s.id}" ${r&&r.serviceId===s.id?"selected":""}>${esc(s.name)} · ${money(s.price)}</option>`).join("")}</select></label>
    <label class="f"><span class="cap">Statut</span>
      <select class="inp" id="r_st">
        ${[["attente","En attente"],["confirme","Confirmé"],["fait","Terminé"],["annule","Annulé"]].map(([v,l])=>`<option value="${v}" ${(r?r.status:"confirme")===v?"selected":""}>${l}</option>`).join("")}
      </select></label>
    <button class="btn primary block mt2" onclick="saveRdv('${id||""}')">Enregistrer</button>
    ${r?`<button class="btn bad block mt" onclick="delRdv('${id}')">Supprimer</button>`:""}
    ${r&&r.status!=="fait"?`<button class="btn block mt" onclick="rdvToSale('${id}')">✓ Marquer fait → Caisse</button>`:""}
  `);
};
window.saveRdv = (id) => {
  const o = {
    clientName: $("#r_cname").value.trim() || "Client",
    clientPhone: $("#r_cphone").value.trim(),
    date: $("#r_date").value || AG_DATE,
    time: $("#r_time").value || "10:00",
    employeId: $("#r_emp").value,
    serviceId: $("#r_svc").value,
    serviceName: ($("#r_svc").selectedOptions[0]||{}).text || "",
    status: $("#r_st").value,
  };
  if (id){ const r=DB.rdv.find(x=>x.id===id); Object.assign(r,o); }
  else { DB.rdv.push(Object.assign({ id:uid(), clientId:"" }, o)); }
  save(); closeSheet(); toast("RDV enregistré"); render();
};
window.delRdv = (id) => { DB.rdv = DB.rdv.filter(x=>x.id!==id); save(); closeSheet(); toast("Supprimé"); render(); };
window.rdvToSale = (id) => {
  const r = DB.rdv.find(x=>x.id===id); if(!r) return;
  r.status="fait"; save(); closeSheet();
  TICKET = newTicket(); TICKET.employeId=r.employeId||TICKET.employeId;
  if (r.serviceId) ticketAddSilent("service", r.serviceId);
  go("caisse");
};
function ticketAddSilent(kind,id){ const ref=kind==="service"?svc(id):prod(id); if(!ref)return;
  TICKET.items.push({kind,refId:id,name:ref.name,price:kind==="service"?ref.price:ref.sell,qty:1}); }

/* ========================================================================
   ÉQUIPE / EMPLOYÉS
   ======================================================================== */
function viewEmployes(){
  const r = range("mois");
  return `
  <section class="page">
    <div class="page-h"><div><div class="h">Équipe</div><div class="d">${DB.employes.filter(e=>e.active).length} coiffeur(s) · perf. du mois</div></div>
      <button class="btn sm primary" onclick="openEmp()">＋</button></div>
    ${DB.employes.length ? DB.employes.map(e=>{
      const sA = salesIn(r).filter(s=>s.employeId===e.id);
      const ca = sA.reduce((a,s)=>a+s.total,0);
      const com = sA.reduce((a,s)=>a+commissionOfSale(s,e.id),0);
      const present = DB.attendance.find(a=>a.employeId===e.id&&a.date===todayISO()&&a.in&&!a.out);
      return `<div class="card" style="padding:0;overflow:hidden">
        <div class="row clk" style="padding:14px" onclick="openEmp('${e.id}')">
          <div class="av ${e.c2?"c2":""}">${esc(initials(e.name))}</div>
          <div class="main"><div class="t">${esc(e.name)} ${present?'<span class="dot" style="background:var(--ok);vertical-align:middle"></span>':''} ${e.active?"":'<span class="badge b-mut">Inactif</span>'}</div>
            <div class="s">${esc(e.role||"Coiffeur")} · commission ${e.commission||0}%</div></div>
          <div class="end"><div class="t gold">${money(ca)}</div><div class="s">CA du mois</div></div>
        </div>
        <div class="flexb" style="padding:10px 14px;border-top:1px solid var(--line);font-size:13px">
          <span class="muted">Commission : <b class="gold">${money(com)}</b></span>
          <button class="btn sm ${present?'bad':'primary'}" onclick="togglePointage('${e.id}')">${present?'⏹ Pointer sortie':'▶ Pointer entrée'}</button>
        </div>
      </div>`;
    }).join("") : `<div class="empty"><div class="ic">✂️</div>Aucun employé. Ajoute ton équipe.</div>`}
  </section>`;
}
window.togglePointage = (id) => {
  let a = DB.attendance.find(x=>x.employeId===id&&x.date===todayISO()&&!x.out);
  if (a){ a.out=nowHM(); toast("Sortie "+a.out); }
  else { DB.attendance.push({ id:uid(), employeId:id, date:todayISO(), in:nowHM(), out:"" }); toast("Entrée pointée"); }
  save(); render();
};
window.openEmp = (id) => {
  const e = id ? emp(id) : null;
  sheet(`
    <div class="sheet-h"><h3>${e?"Fiche employé":"Nouvel employé"}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Nom</span><input class="inp" id="e_name" value="${esc(e?e.name:"")}" placeholder="Prénom"></label>
    <div class="f2">
      <label class="f"><span class="cap">Téléphone</span><input class="inp" id="e_phone" inputmode="tel" value="${esc(e?e.phone:"")}"></label>
      <label class="f"><span class="cap">Rôle</span><input class="inp" id="e_role" value="${esc(e?e.role:"Coiffeur")}"></label>
    </div>
    <div class="f2">
      <label class="f"><span class="cap">Commission %</span><input class="inp" id="e_com" type="number" inputmode="numeric" value="${e?e.commission:30}"></label>
      <label class="f"><span class="cap">Salaire fixe (/mois)</span><input class="inp" id="e_sal" type="number" inputmode="numeric" value="${e?e.salary:0}"></label>
    </div>
    <label class="f" style="display:flex;align-items:center;justify-content:space-between"><span class="cap" style="margin:0">Actif</span>
      <input type="checkbox" id="e_act" ${!e||e.active?"checked":""} style="width:22px;height:22px"></label>
    ${e?`<div class="section-lbl">Ce mois-ci</div>${empStats(e)}
        <div class="section-lbl">Congés</div><div id="leaveBox">${leaveList(e.id)}</div>
        <button class="btn sm block mt" onclick="addLeave('${e.id}')">＋ Ajouter un congé</button>`:""}
    <button class="btn primary block mt2" onclick="saveEmp('${id||""}')">Enregistrer</button>
    ${e?`<button class="btn bad block mt" onclick="delEmp('${id}')">Supprimer</button>`:""}
  `);
};
function empStats(e){
  const r=range("mois"); const sA=salesIn(r).filter(s=>s.employeId===e.id);
  const ca=sA.reduce((a,s)=>a+s.total,0); const com=sA.reduce((a,s)=>a+commissionOfSale(s,e.id),0);
  const paie=(e.salary||0)+com;
  return `<div class="grid g3">
    <div class="stat"><div class="lbl">Ventes</div><div class="val sm">${sA.length}</div></div>
    <div class="stat"><div class="lbl">CA généré</div><div class="val sm">${num(ca)}</div></div>
    <div class="stat gold"><div class="lbl">À payer</div><div class="val sm">${num(paie)}</div></div>
  </div>
  <div class="muted mt" style="font-size:12.5px">Salaire ${money(e.salary||0)} + commission ${money(com)} = <b class="gold">${money(paie)}</b></div>`;
}
function leaveList(id){
  const ls=DB.leaves.filter(l=>l.employeId===id).sort((a,b)=>b.from.localeCompare(a.from));
  if(!ls.length) return `<div class="muted" style="font-size:13px">Aucun congé enregistré.</div>`;
  return ls.map(l=>`<div class="row"><div class="main"><div class="t">${esc(l.type||"Congé")}</div><div class="s">${frDate(l.from)} → ${frDate(l.to)} ${l.note?"· "+esc(l.note):""}</div></div>
    <div class="end"><button class="btn sm ghost" onclick="delLeave('${l.id}')">✕</button></div></div>`).join("");
}
window.addLeave = (id) => {
  const from=prompt("Date de début (AAAA-MM-JJ) :", todayISO()); if(!from)return;
  const to=prompt("Date de fin (AAAA-MM-JJ) :", from)||from;
  const type=prompt("Type (Congé / Maladie / Absence) :","Congé")||"Congé";
  DB.leaves.push({id:uid(),employeId:id,from,to,type,note:""}); save();
  $("#leaveBox").innerHTML=leaveList(id);
};
window.delLeave = (id) => { const l=DB.leaves.find(x=>x.id===id); DB.leaves=DB.leaves.filter(x=>x.id!==id); save(); if(l)$("#leaveBox").innerHTML=leaveList(l.employeId); };
window.saveEmp = (id) => {
  const o={ name:$("#e_name").value.trim(), phone:$("#e_phone").value.trim(), role:$("#e_role").value.trim()||"Coiffeur",
            commission:Number($("#e_com").value)||0, salary:Number($("#e_sal").value)||0, active:$("#e_act").checked };
  if(!o.name){ toast("Nom requis"); return; }
  if(id){ Object.assign(emp(id),o); } else { DB.employes.push(Object.assign({id:uid(),c2:DB.employes.length%2===1},o)); }
  save(); closeSheet(); toast("Enregistré"); render();
};
window.delEmp = (id) => { if(!confirm("Supprimer cet employé ?"))return; DB.employes=DB.employes.filter(e=>e.id!==id); save(); closeSheet(); render(); };

/* ========================================================================
   PLUS (menu)
   ======================================================================== */
function viewMore(){
  const items=[
    ["ventes","🧾","Journal des ventes","Revoir / annuler une vente"],
    ["clients","👤","Clients","Fichier, fidélité & ardoises"],
    ["stock","📦","Stock & produits","Inventaire, fournisseurs, achats"],
    ["finances","📈","Finances","Recettes, charges, bénéfice"],
    ["reglages","⚙️","Réglages","Salon, données, mise à jour"],
  ];
  return `<section class="page">
    <div class="page-h"><div><div class="h">Plus</div><div class="d">Toutes les sections</div></div></div>
    <button class="btn primary block" onclick="openCloture()">🔒 Clôture de caisse (rapport du jour)</button>
    <div class="card mt" style="padding:4px 14px">
      ${items.map(([r,i,t,s])=>`<div class="row clk" onclick="go('${r}')"><div class="av" style="background:var(--card2);color:var(--gold2)">${i}</div>
        <div class="main"><div class="t">${t}</div><div class="s">${s}</div></div><div class="end muted">›</div></div>`).join("")}
    </div>
  </section>`;
}

/* ========================================================================
   JOURNAL DES VENTES (+ annulation / remboursement)
   ======================================================================== */
let VEN_DATE = todayISO();
function viewVentes(){
  const list = DB.sales.filter(s=>s.date===VEN_DATE).sort((a,b)=>b.time.localeCompare(a.time));
  const tot = list.reduce((a,s)=>a+s.total,0);
  const days=[]; for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); days.push(isoOf(d)); }
  return `<section class="page">
    <div class="page-h"><div><div class="h">Ventes</div><div class="d">${frDay(VEN_DATE)} ${frDate(VEN_DATE)} · ${list.length} vente(s)</div></div>
      <div class="right"><div class="big-num" style="font-size:26px">${num(tot)}</div><div class="muted" style="font-size:11px">${CUR}</div></div></div>
    <div class="chips">
      ${days.map(iso=>`<span class="chip ${iso===VEN_DATE?"on":""}" onclick="VEN_DATE='${iso}';render()">${iso===todayISO()?"Auj.":frDay(iso)+" "+iso.slice(8)}</span>`).join("")}
    </div>
    <div class="card mt">
      ${list.length ? list.map(s=>{ const pl=payLabel(s.payment);
        return `<div class="row clk" onclick="saleDetail('${s.id}')">
          <div class="end" style="width:46px;text-align:center"><div class="t gold" style="font-size:13px">${esc(s.time)}</div></div>
          <div class="main"><div class="t">${esc(s.items.map(i=>i.name).join(", "))}</div>
            <div class="s">${esc(empName(s.employeId))} · ${s.clientId?esc(cliName(s.clientId)):"Passage"}</div></div>
          <div class="end"><div class="t gold">${money(s.total)}</div><span class="badge ${pl[2]}">${pl[0]} ${pl[1]}</span></div>
        </div>`; }).join("")
       : `<div class="empty"><div class="ic">🧾</div>Aucune vente ce jour.</div>`}
    </div>
    ${list.length?`<button class="btn block mt" onclick="openCloture('${VEN_DATE}')">🔒 Clôture de ce jour</button>`:""}
  </section>`;
}
window.saleDetail = (id) => {
  const s = DB.sales.find(x=>x.id===id); if(!s) return; const pl=payLabel(s.payment);
  sheet(`<div class="sheet-h"><h3>Vente · ${esc(s.time)}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <div class="muted" style="font-size:13px">${frDate(s.date)} · ${esc(empName(s.employeId))} · ${s.clientId?esc(cliName(s.clientId)):"Passage"} · <span class="badge ${pl[2]}">${pl[0]} ${pl[1]}</span></div>
    <div class="card mt">${s.items.map(i=>`<div class="row"><div class="main"><div class="t">${esc(i.name)}</div><div class="s">${money(i.price)} × ${i.qty}</div></div><div class="end t gold">${money(i.price*i.qty)}</div></div>`).join("")}
      <div class="hr"></div><div class="pill-sum"><span class="section-lbl" style="margin:0">Total</span><span class="big-num">${num(s.total)} ${CUR}</span></div></div>
    <button class="btn bad block mt2" onclick="cancelSale('${s.id}')">↩️ Annuler / rembourser cette vente</button>`);
};
window.cancelSale = (id) => {
  const s = DB.sales.find(x=>x.id===id); if(!s) return;
  if(!confirm("Annuler cette vente ? Le stock et la fidélité seront remis comme avant.")) return;
  s.items.filter(i=>i.kind==="product").forEach(i=>{ const p=prod(i.refId); if(p) p.qty+=i.qty; });
  if(s.clientId){ const c=cli(s.clientId); if(c){ c.points=Math.max(0,(c.points||0)-Math.round(s.total/100)); c.visits=Math.max(0,(c.visits||0)-1); if(s.payment==="credit") c.debt=Math.max(0,(c.debt||0)-s.total); } }
  DB.sales = DB.sales.filter(x=>x.id!==id);
  save(); closeSheet(); toast("Vente annulée"); render();
};

/* ========================================================================
   CLÔTURE DE CAISSE (rapport du jour)
   ======================================================================== */
window.openCloture = (date) => {
  const d = date || todayISO();
  const sA = DB.sales.filter(s=>s.date===d);
  const by = pm => sA.filter(s=>(s.payment||"espece")===pm).reduce((a,s)=>a+s.total,0);
  const esp=by("espece"), car=by("carte"), cre=by("credit"), total=esp+car+cre;
  const ardoise = DB.payments.filter(p=>p.date===d).reduce((a,p)=>a+p.amount,0);
  const dep = DB.expenses.filter(x=>x.date===d).reduce((a,x)=>a+x.amount,0);
  const cash = esp + ardoise - dep;
  const byEmp={}; sA.forEach(s=>byEmp[s.employeId]=(byEmp[s.employeId]||0)+s.total);
  const lines = [
    `CLÔTURE ${DB.salon.name} — ${frDate(d)}`,
    `Ventes : ${sA.length} · Total ${num(total)} ${CUR}`,
    `Espèces ${num(esp)} · Carte ${num(car)} · Crédit ${num(cre)}`,
    `Encaissé ardoises : ${num(ardoise)} · Dépenses : ${num(dep)}`,
    `Espèces en caisse : ${num(cash)} ${CUR}`,
  ].join("\n");
  sheet(`<div class="sheet-h"><h3>🔒 Clôture ${frDate(d)}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <div class="grid g2">
      <div class="stat gold"><div class="lbl">Total du jour</div><div class="val">${num(total)}</div></div>
      <div class="stat"><div class="lbl">Ventes</div><div class="val">${sA.length}</div></div>
    </div>
    <div class="section-lbl">Par moyen de paiement</div>
    <div class="card">
      <div class="pill-sum"><span>💵 Espèces</span><b>${money(esp)}</b></div>
      <div class="pill-sum"><span>💳 Carte</span><b>${money(car)}</b></div>
      <div class="pill-sum"><span>📒 Crédit (ardoise)</span><b>${money(cre)}</b></div>
    </div>
    <div class="section-lbl">Caisse</div>
    <div class="card">
      <div class="pill-sum"><span>➕ Encaissé sur ardoises</span><b class="gold">${money(ardoise)}</b></div>
      <div class="pill-sum"><span>➖ Dépenses du jour</span><b style="color:var(--bad)">${money(dep)}</b></div>
      <div class="hr"></div>
      <div class="pill-sum"><span class="section-lbl" style="margin:0">💰 Espèces en caisse</span><span class="big-num">${num(cash)} ${CUR}</span></div>
    </div>
    ${Object.keys(byEmp).length?`<div class="section-lbl">Par coiffeur</div><div class="card">
      ${Object.entries(byEmp).sort((a,b)=>b[1]-a[1]).map(([id,v])=>`<div class="pill-sum"><span>${esc(empName(id))}</span><b class="gold">${money(v)}</b></div>`).join("")}</div>`:""}
    <div class="btn-row mt2">
      <button class="btn" onclick="window.print()">🖨️ Imprimer</button>
      ${DB.salon.whatsapp?`<button class="btn primary" onclick="window.open('https://wa.me/?text='+encodeURIComponent(${JSON.stringify(lines)}),'_blank')">📤 Partager</button>`:""}
    </div>`);
};

/* ========================================================================
   CLIENTS
   ======================================================================== */
let CLI_Q="";
function viewClients(){
  const q=CLI_Q.toLowerCase();
  const list=DB.clients.filter(c=>!q||c.name.toLowerCase().includes(q)||(c.phone||"").includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name));
  const debtors=DB.clients.filter(c=>c.debt>0).sort((a,b)=>b.debt-a.debt);
  const totalDebt=debtors.reduce((a,c)=>a+c.debt,0);
  return `<section class="page">
    <div class="page-h"><div><div class="h">Clients</div><div class="d">${DB.clients.length} fiche(s)</div></div>
      <button class="btn sm primary" onclick="openClient()">＋</button></div>
    ${debtors.length?`<div class="section-lbl">📒 Ardoises à encaisser (${money(totalDebt)})</div>
    <div class="card">${debtors.map(c=>`<div class="row clk" onclick="openClient('${c.id}')">
      <div class="av" style="background:rgba(224,169,75,.18);color:var(--warn)">📒</div>
      <div class="main"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.phone||"—")}</div></div>
      <div class="end"><div class="t" style="color:var(--warn)">${money(c.debt)}</div></div></div>`).join("")}</div>`:""}
    <div class="section-lbl">Tous les clients</div>
    <input class="inp" placeholder="🔍 Rechercher un client" value="${esc(CLI_Q)}" oninput="CLI_Q=this.value;clearTimeout(window._cq);window._cq=setTimeout(render,250)">
    <div class="card mt">
      ${list.length ? list.map(c=>`<div class="row clk" onclick="openClient('${c.id}')">
        <div class="av c2">${esc(initials(c.name))}</div>
        <div class="main"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.phone||"—")} · ${c.visits||0} visite(s)</div></div>
        <div class="end"><div class="t gold">${c.points||0} pts</div>${c.debt>0?`<div class="s" style="color:var(--warn)">doit ${money(c.debt)}</div>`:""}</div></div>`).join("")
       : `<div class="empty"><div class="ic">👤</div>Aucun client.</div>`}
    </div>
  </section>`;
}
window.openClient = (id) => {
  const c = id ? cli(id) : null;
  const hist = c ? DB.sales.filter(s=>s.clientId===c.id).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)) : [];
  sheet(`
    <div class="sheet-h"><h3>${c?"Fiche client":"Nouveau client"}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Nom</span><input class="inp" id="c_name" value="${esc(c?c.name:"")}"></label>
    <label class="f"><span class="cap">Téléphone</span><input class="inp" id="c_phone" inputmode="tel" value="${esc(c?c.phone:"")}"></label>
    <label class="f"><span class="cap">Note</span><textarea class="inp" id="c_note">${esc(c?c.note:"")}</textarea></label>
    ${c?`<div class="grid g3 mt"><div class="stat gold"><div class="lbl">Points</div><div class="val sm">${c.points||0}</div></div>
         <div class="stat"><div class="lbl">Visites</div><div class="val sm">${c.visits||0}</div></div>
         <div class="stat"><div class="lbl">Dépensé</div><div class="val sm">${num(hist.reduce((a,s)=>a+s.total,0))}</div></div></div>
       ${c.debt>0?`<div class="card mt" style="border-color:rgba(224,169,75,.5)"><div class="flexb"><span>📒 Ardoise (dette)</span><b style="color:var(--warn);font-size:18px">${money(c.debt)}</b></div>
         <button class="btn primary block mt" onclick="settleDebt('${c.id}')">Encaisser l'ardoise</button></div>`:""}
       <div class="section-lbl">Historique</div>
       ${hist.length?hist.slice(0,15).map(s=>`<div class="row"><div class="main"><div class="t">${s.items.map(i=>esc(i.name)).join(", ")}</div><div class="s">${frDate(s.date)} · ${esc(empName(s.employeId))}</div></div><div class="end t gold">${money(s.total)}</div></div>`).join(""):`<div class="muted" style="font-size:13px">Aucune visite.</div>`}
    `:""}
    <button class="btn primary block mt2" onclick="saveClient('${id||""}')">Enregistrer</button>
    ${c?`<button class="btn bad block mt" onclick="delClient('${id}')">Supprimer</button>`:""}
  `);
};
window.saveClient = (id) => {
  const o={ name:$("#c_name").value.trim(), phone:$("#c_phone").value.trim(), note:$("#c_note").value.trim() };
  if(!o.name){ toast("Nom requis"); return; }
  if(id){ Object.assign(cli(id),o); } else { DB.clients.push(Object.assign({id:uid(),points:0,visits:0,created:todayISO()},o)); }
  save(); closeSheet(); toast("Enregistré"); render();
};
window.delClient = (id) => { if(!confirm("Supprimer ce client ?"))return; DB.clients=DB.clients.filter(c=>c.id!==id); save(); closeSheet(); render(); };
window.settleDebt = (id) => {
  const c = cli(id); if(!c || !(c.debt>0)){ toast("Aucune dette"); return; }
  const v = prompt("Montant encaissé (ardoise "+money(c.debt)+") :", c.debt); if(v==null) return;
  const amt = Math.min(Number(v)||0, c.debt); if(amt<=0){ toast("Montant invalide"); return; }
  c.debt -= amt; DB.payments.push({ id:uid(), date:todayISO(), clientId:id, amount:amt });
  save(); toast("Encaissé "+money(amt)); openClient(id);
};

/* ========================================================================
   STOCK & PRODUITS
   ======================================================================== */
let STK_TAB="prod";
function viewStock(){
  const low=DB.products.filter(p=>p.qty<=p.min);
  const val=DB.products.reduce((a,p)=>a+p.qty*p.cost,0);
  return `<section class="page">
    <div class="page-h"><div><div class="h">Stock</div><div class="d">${DB.products.length} produit(s) · valeur ${money(val)}</div></div></div>
    <div class="chips">
      <span class="chip ${STK_TAB==="prod"?"on":""}" onclick="STK_TAB='prod';render()">Produits</span>
      <span class="chip ${STK_TAB==="sup"?"on":""}" onclick="STK_TAB='sup';render()">Fournisseurs</span>
      <span class="chip ${STK_TAB==="buy"?"on":""}" onclick="STK_TAB='buy';render()">Achats</span>
    </div>
    ${STK_TAB==="prod"?stockProducts(low):STK_TAB==="sup"?stockSuppliers():stockPurchases()}
  </section>`;
}
function stockProducts(low){
  return `${low.length?`<div class="card mt" style="border-color:rgba(224,106,90,.4)"><div class="flexb"><b class="muted">⚠️ ${low.length} produit(s) à réapprovisionner</b></div></div>`:""}
    <button class="btn primary block mt" onclick="openProd()">＋ Nouveau produit</button>
    <div class="card mt">
      ${DB.products.length?DB.products.map(p=>{
        const bad=p.qty<=p.min;
        return `<div class="row clk" onclick="openProd('${p.id}')">
          <div class="av" style="background:${bad?'rgba(224,106,90,.18)':'var(--card2)'};color:${bad?'var(--bad)':'var(--gold2)'}">${bad?'!':'📦'}</div>
          <div class="main"><div class="t">${esc(p.name)}</div><div class="s">${esc(p.cat||"")} · ${p.sell>0?"vente "+money(p.sell):"usage interne"}</div></div>
          <div class="end"><div class="t ${bad?'':'gold'}" style="${bad?'color:var(--bad)':''}">${p.qty}</div><div class="s">seuil ${p.min}</div></div>
        </div>`;}).join(""):`<div class="empty"><div class="ic">📦</div>Aucun produit.</div>`}
    </div>`;
}
function stockSuppliers(){
  return `<button class="btn primary block mt" onclick="openSup()">＋ Nouveau fournisseur</button>
    <div class="card mt">${DB.suppliers.length?DB.suppliers.map(s=>`<div class="row clk" onclick="openSup('${s.id}')">
      <div class="av" style="background:var(--card2);color:var(--gold2)">🏭</div>
      <div class="main"><div class="t">${esc(s.name)}</div><div class="s">${esc(s.phone||"—")} · ${DB.products.filter(p=>p.supplierId===s.id).length} produit(s)</div></div>
      <div class="end muted">›</div></div>`).join(""):`<div class="empty"><div class="ic">🏭</div>Aucun fournisseur.</div>`}</div>`;
}
function stockPurchases(){
  const ps=DB.purchases.slice().sort((a,b)=>b.date.localeCompare(a.date));
  return `<button class="btn primary block mt" onclick="openBuy()">＋ Enregistrer un achat</button>
    <div class="card mt">${ps.length?ps.map(p=>`<div class="row"><div class="main"><div class="t">${esc((sup(p.supplierId)||{}).name||"Achat")}</div>
      <div class="s">${frDate(p.date)} · ${p.items.map(i=>esc((prod(i.productId)||{}).name||"?")+" ×"+i.qty).join(", ")}</div></div>
      <div class="end t gold">${money(p.total)}</div></div>`).join(""):`<div class="empty"><div class="ic">🧾</div>Aucun achat enregistré.</div>`}</div>`;
}
window.openProd = (id) => {
  const p=id?prod(id):null;
  sheet(`<div class="sheet-h"><h3>${p?"Produit":"Nouveau produit"}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Nom</span><input class="inp" id="p_name" value="${esc(p?p.name:"")}"></label>
    <div class="f2"><label class="f"><span class="cap">Catégorie</span><input class="inp" id="p_cat" value="${esc(p?p.cat:"")}" placeholder="Soin, consommable..."></label>
      <label class="f"><span class="cap">Fournisseur</span><select class="inp" id="p_sup"><option value="">—</option>${DB.suppliers.map(s=>`<option value="${s.id}" ${p&&p.supplierId===s.id?"selected":""}>${esc(s.name)}</option>`).join("")}</select></label></div>
    <div class="f2"><label class="f"><span class="cap">Quantité</span><input class="inp" id="p_qty" type="number" inputmode="numeric" value="${p?p.qty:0}"></label>
      <label class="f"><span class="cap">Seuil d'alerte</span><input class="inp" id="p_min" type="number" inputmode="numeric" value="${p?p.min:3}"></label></div>
    <div class="f2"><label class="f"><span class="cap">Prix d'achat</span><input class="inp" id="p_cost" type="number" inputmode="numeric" value="${p?p.cost:0}"></label>
      <label class="f"><span class="cap">Prix de vente (0=interne)</span><input class="inp" id="p_sell" type="number" inputmode="numeric" value="${p?p.sell:0}"></label></div>
    <button class="btn primary block mt2" onclick="saveProd('${id||""}')">Enregistrer</button>
    ${p?`<button class="btn bad block mt" onclick="delProd('${id}')">Supprimer</button>`:""}`);
};
window.saveProd = (id) => {
  const o={ name:$("#p_name").value.trim(), cat:$("#p_cat").value.trim(), supplierId:$("#p_sup").value,
    qty:Number($("#p_qty").value)||0, min:Number($("#p_min").value)||0, cost:Number($("#p_cost").value)||0, sell:Number($("#p_sell").value)||0 };
  if(!o.name){ toast("Nom requis"); return; }
  if(id){ Object.assign(prod(id),o); } else { DB.products.push(Object.assign({id:uid()},o)); }
  save(); closeSheet(); toast("Enregistré"); render();
};
window.delProd = (id) => { if(!confirm("Supprimer ce produit ?"))return; DB.products=DB.products.filter(p=>p.id!==id); save(); closeSheet(); render(); };
window.openSup = (id) => {
  const s=id?sup(id):null;
  sheet(`<div class="sheet-h"><h3>${s?"Fournisseur":"Nouveau fournisseur"}</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Nom</span><input class="inp" id="s_name" value="${esc(s?s.name:"")}"></label>
    <label class="f"><span class="cap">Téléphone</span><input class="inp" id="s_phone" inputmode="tel" value="${esc(s?s.phone:"")}"></label>
    <button class="btn primary block mt2" onclick="saveSup('${id||""}')">Enregistrer</button>
    ${s?`<button class="btn bad block mt" onclick="delSup('${id}')">Supprimer</button>`:""}`);
};
window.saveSup = (id) => {
  const o={ name:$("#s_name").value.trim(), phone:$("#s_phone").value.trim() };
  if(!o.name){ toast("Nom requis"); return; }
  if(id){ Object.assign(sup(id),o); } else { DB.suppliers.push(Object.assign({id:uid()},o)); }
  save(); closeSheet(); toast("Enregistré"); render();
};
window.delSup = (id) => { DB.suppliers=DB.suppliers.filter(s=>s.id!==id); save(); closeSheet(); render(); };
window.openBuy = () => {
  if(!DB.products.length){ toast("Ajoute d'abord un produit"); return; }
  sheet(`<div class="sheet-h"><h3>Enregistrer un achat</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Fournisseur</span><select class="inp" id="b_sup"><option value="">—</option>${DB.suppliers.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label>
    <label class="f"><span class="cap">Produit</span><select class="inp" id="b_prod">${DB.products.map(p=>`<option value="${p.id}">${esc(p.name)} (stock ${p.qty})</option>`).join("")}</select></label>
    <div class="f2"><label class="f"><span class="cap">Quantité reçue</span><input class="inp" id="b_qty" type="number" inputmode="numeric" value="1"></label>
      <label class="f"><span class="cap">Coût unitaire</span><input class="inp" id="b_cost" type="number" inputmode="numeric" value="0"></label></div>
    <label class="f"><span class="cap">Date</span><input class="inp" id="b_date" type="date" value="${todayISO()}"></label>
    <button class="btn primary block mt2" onclick="saveBuy()">Ajouter au stock</button>`);
};
window.saveBuy = () => {
  const pid=$("#b_prod").value, qty=Number($("#b_qty").value)||0, cost=Number($("#b_cost").value)||0;
  const p=prod(pid); if(!p||qty<=0){ toast("Quantité invalide"); return; }
  p.qty+=qty; if(cost>0) p.cost=cost;
  const total=qty*cost;
  DB.purchases.push({ id:uid(), date:$("#b_date").value||todayISO(), supplierId:$("#b_sup").value, items:[{productId:pid,qty,cost}], total });
  if(total>0) DB.expenses.push({ id:uid(), date:$("#b_date").value||todayISO(), label:"Achat "+p.name, category:"Achat stock", amount:total });
  save(); closeSheet(); toast("Stock mis à jour"); render();
};

/* ========================================================================
   FINANCES
   ======================================================================== */
function viewFinances(){
  const r=range(FIN_PERIOD);
  const sA=salesIn(r); const rec=sA.reduce((a,s)=>a+s.total,0);
  const exp=expIn(r); const dep=exp.reduce((a,x)=>a+x.amount,0);
  const com=sA.reduce((a,s)=>a+commissionOfSale(s),0);
  const sal=FIN_PERIOD==="mois"?DB.employes.filter(e=>e.active).reduce((a,e)=>a+(e.salary||0),0):0;
  const charges=dep+com+sal;
  const benef=rec-charges;
  // ventilation par coiffeur
  const byEmp={}; sA.forEach(s=>byEmp[s.employeId]=(byEmp[s.employeId]||0)+s.total);
  const empRows=Object.entries(byEmp).sort((a,b)=>b[1]-a[1]);
  // ventilation services vs produits
  let svcCA=0, prodCA=0;
  sA.forEach(s=>s.items.forEach(i=>{ if(i.kind==="service")svcCA+=i.price*i.qty; else prodCA+=i.price*i.qty; }));
  return `<section class="page">
    <div class="page-h"><div><div class="h">Finances</div><div class="d">${range(FIN_PERIOD).label}</div></div></div>
    <div class="chips">
      ${[["jour","Jour"],["semaine","Semaine"],["mois","Mois"]].map(([v,l])=>`<span class="chip ${FIN_PERIOD===v?"on":""}" onclick="FIN_PERIOD='${v}';render()">${l}</span>`).join("")}
    </div>
    <div class="grid g2 mt">
      <div class="stat gold"><span class="ic">💰</span><div class="lbl">Recettes</div><div class="val">${num(rec)}</div></div>
      <div class="stat"><span class="ic">💸</span><div class="lbl">Charges</div><div class="val">${num(charges)}</div></div>
    </div>
    <div class="card mt" style="border-color:${benef>=0?'rgba(89,193,122,.4)':'rgba(224,106,90,.4)'}">
      <div class="flexb"><span class="section-lbl" style="margin:0">Bénéfice net</span>
        <span class="big-num" style="color:${benef>=0?'var(--ok)':'var(--bad)'}">${num(benef)} ${CUR}</span></div>
    </div>

    <div class="section-lbl">Détail des charges</div>
    <div class="card">
      <div class="pill-sum"><span>🧾 Dépenses</span><b>${money(dep)}</b></div>
      <div class="pill-sum"><span>✂️ Commissions coiffeurs</span><b>${money(com)}</b></div>
      ${FIN_PERIOD==="mois"?`<div class="pill-sum"><span>💵 Salaires fixes</span><b>${money(sal)}</b></div>`:`<div class="muted" style="font-size:12px">Les salaires fixes s'affichent sur la vue « Mois ».</div>`}
    </div>

    <div class="section-lbl">Répartition recettes</div>
    <div class="card">
      ${rec?`<div class="pill-sum"><span>Prestations</span><b class="gold">${money(svcCA)}</b></div>
      <div class="bar"><i style="width:${rec?svcCA/rec*100:0}%"></i></div>
      <div class="pill-sum mt"><span>Produits</span><b class="gold">${money(prodCA)}</b></div>
      <div class="bar"><i style="width:${rec?prodCA/rec*100:0}%"></i></div>`:`<div class="muted">Aucune recette sur la période.</div>`}
    </div>

    <div class="section-lbl">Par coiffeur</div>
    <div class="card">
      ${empRows.length?empRows.map(([id,v])=>`<div class="row"><div class="av ${emp(id)&&emp(id).c2?'c2':''}">${esc(initials(empName(id)))}</div>
        <div class="main"><div class="t">${esc(empName(id))}</div><div class="bar mt" style="width:100%"><i style="width:${rec?v/rec*100:0}%"></i></div></div>
        <div class="end t gold">${money(v)}</div></div>`).join(""):`<div class="muted">—</div>`}
    </div>

    <div class="section-lbl">Dépenses</div>
    <button class="btn primary block" onclick="openExp()">＋ Ajouter une dépense</button>
    <div class="card mt">
      ${exp.length?exp.sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="row"><div class="main"><div class="t">${esc(x.label)}</div><div class="s">${esc(x.category||"")} · ${frDate(x.date)}</div></div>
        <div class="end" style="display:flex;align-items:center;gap:8px"><span class="t" style="color:var(--bad)">−${num(x.amount)}</span><button class="btn sm ghost" onclick="delExp('${x.id}')">✕</button></div></div>`).join(""):`<div class="empty"><div class="ic">💸</div>Aucune dépense.</div>`}
    </div>
  </section>`;
}
window.openExp = () => {
  sheet(`<div class="sheet-h"><h3>Nouvelle dépense</h3><button class="icbtn" onclick="closeSheet()">✕</button></div>
    <label class="f"><span class="cap">Libellé</span><input class="inp" id="x_lbl" placeholder="Loyer, électricité, produit..."></label>
    <div class="f2"><label class="f"><span class="cap">Catégorie</span><input class="inp" id="x_cat" placeholder="Charge fixe, achat..." value="Charge"></label>
      <label class="f"><span class="cap">Montant</span><input class="inp" id="x_amt" type="number" inputmode="numeric" value="0"></label></div>
    <label class="f"><span class="cap">Date</span><input class="inp" id="x_date" type="date" value="${todayISO()}"></label>
    <button class="btn primary block mt2" onclick="saveExp()">Enregistrer</button>`);
};
window.saveExp = () => {
  const o={ id:uid(), label:$("#x_lbl").value.trim()||"Dépense", category:$("#x_cat").value.trim(), amount:Number($("#x_amt").value)||0, date:$("#x_date").value||todayISO() };
  if(o.amount<=0){ toast("Montant invalide"); return; }
  DB.expenses.push(o); save(); closeSheet(); toast("Dépense ajoutée"); render();
};
window.delExp = (id) => { DB.expenses=DB.expenses.filter(x=>x.id!==id); save(); render(); };

/* ========================================================================
   RÉGLAGES
   ======================================================================== */
function viewReglages(){
  return `<section class="page">
    <div class="page-h"><div><div class="h">Réglages</div><div class="d">Version ${APP_VERSION}</div></div></div>
    <div class="section-lbl">Mon salon</div>
    <div class="card">
      <label class="f"><span class="cap">Nom du salon</span><input class="inp" id="g_name" value="${esc(DB.salon.name)}"></label>
      <label class="f"><span class="cap">Slogan</span><input class="inp" id="g_tag" value="${esc(DB.salon.tagline)}"></label>
      <label class="f"><span class="cap">Localisation</span><input class="inp" id="g_loc" value="${esc(DB.salon.loc)}"></label>
      <label class="f"><span class="cap">WhatsApp</span><input class="inp" id="g_wa" inputmode="tel" value="${esc(DB.salon.whatsapp)}"></label>
      <button class="btn primary block mt2" onclick="saveSalon()">Enregistrer</button>
    </div>

    <div class="section-lbl">Données</div>
    <div class="card">
      <button class="btn block" onclick="exportData()">⬇️ Exporter mes données (sauvegarde)</button>
      <label class="btn block mt" style="cursor:pointer">⬆️ Importer une sauvegarde
        <input type="file" accept="application/json" style="display:none" onchange="importData(this)"></label>
      <button class="btn bad block mt" onclick="resetData()">🗑️ Réinitialiser (tout effacer)</button>
    </div>

    <div class="section-lbl">Application</div>
    <div class="card">
      <button class="btn block" onclick="forceUpdate()">🔄 Mettre à jour l'application</button>
      <div class="muted center mt" style="font-size:12px">Salon Gérant · ${APP_VERSION}</div>
    </div>
  </section>`;
}
window.saveSalon = () => {
  DB.salon.name=$("#g_name").value.trim()||DB.salon.name;
  DB.salon.tagline=$("#g_tag").value.trim(); DB.salon.loc=$("#g_loc").value.trim(); DB.salon.whatsapp=$("#g_wa").value.trim();
  save(); paintBrand(); toast("Enregistré"); render();
};
window.exportData = () => {
  const blob=new Blob([JSON.stringify(DB,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="salon-gerant-"+todayISO()+".json"; a.click(); URL.revokeObjectURL(a.href);
  toast("Sauvegarde téléchargée");
};
window.importData = (inp) => {
  const f=inp.files[0]; if(!f)return;
  const rd=new FileReader(); rd.onload=()=>{ try{ const d=JSON.parse(rd.result); DB=Object.assign(BASE(),d); save(); toast("Importé ✓"); paintBrand(); render(); }catch(e){ toast("Fichier invalide"); } };
  rd.readAsText(f);
};
window.resetData = () => { if(!confirm("Tout effacer et repartir à zéro ?"))return; localStorage.removeItem(KEY); DB=seedDemo(); save(); paintBrand(); render(); };
window.forceUpdate = async () => {
  try{ if("serviceWorker" in navigator){ const rs=await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r=>r.update())); }
    if(window.caches){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch(e){}
  toast("Mise à jour… rechargement"); setTimeout(()=>location.reload(true),600);
};

/* ========================================================================
   UI : sheet / toast / fab / brand
   ======================================================================== */
function sheet(html){
  closeSheet();
  const bg=document.createElement("div"); bg.className="sheet-bg"; bg.id="sheetBg";
  bg.innerHTML=`<div class="sheet"><div class="sheet-grip"></div>${html}</div>`;
  bg.addEventListener("click",e=>{ if(e.target===bg) closeSheet(); });
  document.body.appendChild(bg);
}
window.closeSheet = () => { const b=$("#sheetBg"); if(b) b.remove(); };
let _toastT;
function toast(msg){ const old=$("#toast"); if(old)old.remove();
  const t=document.createElement("div"); t.className="toast"; t.id="toast"; t.textContent=msg; document.body.appendChild(t);
  clearTimeout(_toastT); _toastT=setTimeout(()=>t.remove(),2200); }
window.toast=toast; window.go=go;

function updateFab(r){
  const fab=$("#fab");
  const map={ agenda:()=>openRdv(), employes:()=>openEmp(), clients:()=>openClient(), stock:()=>openProd(),
              finances:()=>openExp(), dash:()=>go("caisse"), more:()=>go("caisse") };
  if(r==="caisse"){ fab.style.display="none"; return; }
  fab.style.display="grid";
  fab.onclick = map[r] || (()=>go("caisse"));
}
function paintBrand(){ $("#brandName").textContent=DB.salon.name||"Salon Gérant"; $("#brandSub").textContent=DB.salon.tagline||"Gestion du salon"; }

/* ---------- service worker ---------- */
function registerSW(){
  if(!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  let reloaded=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(reloaded)return; reloaded=true; location.reload(); });
}

/* ---------- boot ---------- */
paintNav(); paintBrand();
$("#btnTop").onclick=()=>go("reglages");
if(!location.hash) location.hash="#dash";
render();
registerSW();
