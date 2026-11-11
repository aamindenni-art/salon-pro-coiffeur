/* ===========================================================
   Salon Gérant v6 — premier lancement, démarrage, mises à jour.
   =========================================================== */
"use strict";

/* ---------- accueil du premier lancement ---------- */
function showOnboarding(){
  if (LOCK_MODE === "onb") return;
  _pendingRender = false; closeSheet(); if (_dlgRes) closeDlg(null);
  LOCK_MODE = "onb";
  onbHome();
}
function onbHome(){
  const n = DB.salon.name || "";
  lockPaint(`<div class="emblem">${ic("scissors", 26)}</div>
    <h2>Bienvenue</h2><p class="sub">Configurons votre salon en une minute.</p>
    <label class="f" style="text-align:left"><span>Nom de votre salon</span><input class="inp" id="onbN" value="${esc(n)}" placeholder="ex : Salon Elegance" autocomplete="off"></label>
    <button class="onb-opt" onclick="onbFinish('empty')">${ic("plus", 22)}<div><b>Commencer avec mon salon</b><span>Je pars de zéro, avec des prestations courantes à adapter.</span></div></button>
    <button class="onb-opt" onclick="onbFinish('demo')">${ic("star", 22)}<div><b>Essayer avec des données d'exemple</b><span>Équipe, stock et clients fictifs pour tout tester.</span></div></button>
    <button class="onb-opt" onclick="onbCloud()">${ic("cloud", 22)}<div><b>Récupérer mon salon depuis le cloud</b><span>J'ai déjà un code salon et un code secret.</span></div></button>`);
}
function onbFinish(mode){
  const name = val("onbN");
  if (!name){ toast("Saisissez le nom de votre salon", "bad"); return; }
  DB.salon.name = name;
  if (mode === "demo") demoData(DB); else DB.services = defaultServices();
  DB.setup = true;
  LOCK_MODE = "";
  save(); render();
  toast(mode === "demo" ? "Données d'exemple chargées" : "Votre salon est prêt");
}
function onbCloud(){
  lockPaint(`<div class="emblem">${ic("cloud", 26)}</div>
    <h2>Récupérer mon salon</h2><p class="sub">Saisissez les codes choisis lors de l'activation de la synchro.</p>
    <label class="f" style="text-align:left"><span>Code salon</span><input class="inp" id="onbC" autocomplete="off" autocapitalize="none"></label>
    <label class="f" style="text-align:left"><span>Code secret</span><input class="inp" id="onbK" type="password" autocomplete="off"></label>
    <button class="btn block lg mt2" id="onbGo" onclick="onbPull()">Récupérer</button>
    <button class="btn block ghost mt" onclick="onbHome()">Retour</button>`);
}
let _onbBusy = false;
async function onbPull(){
  if (_onbBusy) return;
  const code = cleanCode(val("onbC")), secret = document.getElementById("onbK").value;
  const bad = syncCheckInput(code, secret);
  if (bad){ toast(bad, "bad"); return; }
  _onbBusy = true; const b = document.getElementById("onbGo"); if (b) b.disabled = true;
  try {
    const remote = await rpc("gerant_pull", { p_id: code, p_secret: secret });
    if (!remote || !remote.data){ toast("Aucun salon avec ce code", "bad"); return; }
    LOCK_MODE = "";
    syncStart(code, secret, "load", remote);
    render(); toast("Salon récupéré");
  } catch (e){
    toast(e.code === "bad_secret" ? "Code secret incorrect" : isNetErr(e) ? "Pas de connexion internet" : "Erreur : " + (e.message || "inconnue"), "bad");
  } finally { _onbBusy = false; const b2 = document.getElementById("onbGo"); if (b2) b2.disabled = false; }
}

/* ---------- mises à jour de l'application ---------- */
function showUpdBar(){
  const b = $("#updBar"); if (!b) return;
  b.innerHTML = `<span>Nouvelle version disponible</span><button class="btn sm" onclick="location.reload()">Mettre à jour</button>`;
  b.hidden = false;
}
function registerSW(){
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  const booted = Date.now();
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!had){ had = true; return; }          // première installation : rien à recharger
    const a = document.activeElement;
    const busy = _sheetOpen || !$("#dlgBg").hidden || LOCK_MODE || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    if (Date.now() - booted < 8000 && !busy){ location.reload(); return; }
    showUpdBar();
  });
  navigator.serviceWorker.register("./service-worker.js").then(reg => {
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}

/* ---------- démarrage ---------- */
initSync();
render();
registerSW();
