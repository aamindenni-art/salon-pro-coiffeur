// Tests de l'application « Salon Gérant » (v6) et de sa page de réservation en ligne.
const { test, expect } = require("@playwright/test");

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  await page.addInitScript(() => { try { if (!sessionStorage.getItem("__keep")) { localStorage.clear(); sessionStorage.setItem("__keep", "1"); } } catch (e) {} });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !/fonts\.g|Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
});
test.afterEach(() => { expect(errors, errors.join("\n")).toEqual([]); });

async function demo(page) {
  await page.goto("/gerant/");
  await page.locator(".onb-opt", { hasText: "données d'exemple" }).click();
  await expect(page.locator("#tabbar a").first()).toBeVisible();
}
const goto = async (page, r) => { await page.evaluate(r => { location.hash = "#" + r; }, r); await page.waitForTimeout(60); };
async function pin(page, code) { for (const d of code) await page.locator(".pad button", { hasText: new RegExp("^" + d + "$") }).click(); await page.waitForTimeout(300); }
const tile = (page, name) => page.locator(".tile").filter({ has: page.locator(".n", { hasText: new RegExp("^" + name + "$") }) });
async function dlgSubmit(page, v) { await page.locator("#dlgInp").fill(v); await page.locator("#dlgBg button[type=submit]").click(); }

test("toutes les pages s'affichent sans erreur", async ({ page }) => {
  await demo(page);
  for (const r of ["dash", "caisse", "agenda", "ventes", "employes", "planning", "clients", "prestations", "stock", "finances", "stats", "export", "cloture", "reglages", "more"]) {
    await goto(page, r);
    const html = await page.locator("#app").innerHTML();
    expect(html.length, r).toBeGreaterThan(100);
    expect(html, r).not.toContain("n'a pas pu s'afficher");
  }
  const n = await page.evaluate(() => [DB.employes.length, DB.services.length, DB.products.length]);
  expect(n).toEqual([3, 6, 6]);
});

test("vente : remise, produit, stock, commission puis annulation", async ({ page }) => {
  await demo(page);
  await goto(page, "caisse");
  await page.locator(".chip", { hasText: "Amine" }).click();
  await tile(page, "Coupe").click();
  await tile(page, "Coupe").click();
  await expect(page.locator(".kv.tot b")).toContainText("1 000");
  await page.getByRole("button", { name: "Ajouter une remise" }).click();
  await dlgSubmit(page, "10%");
  await expect(page.locator(".kv.tot b")).toContainText("900");
  await page.locator(".seg button", { hasText: "Produits" }).click();
  await tile(page, "Gel coiffant").click();
  await expect(page.locator(".kv.tot b")).toContainText("1 350");   // 1500 − 10 %
  await page.locator(".paybar .btn").click();
  await page.locator(".paym button", { hasText: "Espèces" }).click();
  await expect(page.locator("#sheet")).toContainText("Vente enregistrée");
  const s = await page.evaluate(() => ({ n: DB.sales.length, t: DB.sales[0].total, d: DB.sales[0].discount, e: DB.sales[0].employeName, com: saleCom(DB.sales[0]), gel: DB.products.find(p => p.name === "Gel coiffant").qty }));
  expect(s.t).toBe(1350); expect(s.gel).toBe(11);
  expect(Math.round(s.com)).toBe(270); expect(s.d).toBe(150); expect(s.e).toBe("Amine");
  await page.locator("#sheet button", { hasText: "Nouvelle vente" }).click();
  await goto(page, "ventes");
  await page.locator(".row", { hasText: "Coupe" }).first().click();
  await page.getByRole("button", { name: "Annuler cette vente" }).click();
  await page.locator("#dlgOk").click();
  const after = await page.evaluate(() => ({ n: DB.sales.length, gel: DB.products.find(p => p.name === "Gel coiffant").qty }));
  expect(after).toEqual({ n: 0, gel: 12 });
});

test("crédit : ardoise client puis règlement", async ({ page }) => {
  await demo(page);
  await goto(page, "caisse");
  await page.locator(".chip", { hasText: "Yacine" }).click();
  await tile(page, "Barbe").click();
  await page.locator("button.pill-sum").click();
  await page.locator("#cpList .row", { hasText: "Karim" }).click();
  await page.locator(".paybar .btn").click();
  await page.locator(".paym button", { hasText: "Crédit" }).click();
  await page.locator("#sheet button", { hasText: "Nouvelle vente" }).click();
  expect(await page.evaluate(() => cli(DB.sales[0].clientId).debt)).toBe(300);
  await goto(page, "clients");
  await page.locator(".row", { hasText: "Karim" }).click();
  await page.locator("#sheet button", { hasText: "Encaisser un paiement" }).click();
  await dlgSubmit(page, "100");
  expect(await page.evaluate(() => [DB.clients.find(c => c.name === "Karim B.").debt, DB.payments.length])).toEqual([200, 1]);
});

test("code PIN : gérant, coiffeur limité à ses ventes", async ({ page }) => {
  await demo(page);
  await goto(page, "reglages");
  await page.getByRole("button", { name: "Activer le code PIN" }).click();
  await pin(page, "1234"); await pin(page, "1234");
  await page.locator("#dlgOk").click();                       // code de secours noté
  await goto(page, "employes");
  await page.locator(".card", { hasText: "Amine" }).first().click();
  await page.getByRole("button", { name: "Définir un code" }).click();
  await pin(page, "5555"); await pin(page, "5555");
  // vente d'un autre coiffeur injectée pour vérifier le cloisonnement
  await page.evaluate(() => { const y = DB.employes[1]; DB.sales.push({ id: "zz1", date: todayISO(), time: "10:00", employeId: y.id, clientId: "", items: [{ kind: "service", refId: DB.services[0].id, name: "Coupe", price: 500, qty: 1 }], total: 500, discount: 0, payment: "espece", employeName: y.name, comPct: 30 }); save(); });
  await page.locator(".topbar button[title=Verrouiller]").first().click();
  await expect(page.locator("#lock")).toBeVisible();
  await page.locator(".profiles button", { hasText: "Amine" }).click();
  await pin(page, "0000");
  await expect(page.locator("#pinMsg")).toContainText("incorrect");
  await page.waitForTimeout(600);
  await pin(page, "5555");
  await expect(page.locator("#lock")).toBeHidden();
  expect(await page.locator("#tabbar a").count()).toBe(4);
  await goto(page, "reglages");
  await expect(page.locator("#app")).toContainText("Mes rendez-vous");   // renvoyé à l'accueil coiffeur
  await goto(page, "caisse");
  await tile(page, "Barbe").click();
  await page.locator(".paybar .btn").click();
  await page.locator(".paym button", { hasText: "Carte" }).click();
  await page.locator("#sheet button", { hasText: "Nouvelle vente" }).click();
  expect(await page.evaluate(() => DB.sales[DB.sales.length - 1].employeName)).toBe("Amine");
  await goto(page, "ventes");
  await page.locator("button.seg, .seg button", { hasText: "Jour" }).click();
  expect(await page.locator("#app .row").count()).toBe(1);
  // retour gérant : voit tout
  await page.locator(".topbar button[title=Verrouiller]").first().click();
  await page.locator(".profiles button", { hasText: "Gérant" }).click();
  await pin(page, "1234");
  await expect(page.locator("#lock")).toBeHidden();
  await goto(page, "ventes");
  expect(await page.locator("#app .row").count()).toBe(2);
  expect(await page.locator("#tabbar a").count()).toBe(5);
});

test("export comptable : Excel valide et rapport PDF", async ({ page }) => {
  await demo(page);
  await page.evaluate(() => { const e = DB.employes[0]; DB.sales.push({ id: "x1", date: todayISO(), time: "11:00", employeId: e.id, clientId: "", items: [{ kind: "service", refId: DB.services[0].id, name: "Coupe", price: 500, qty: 1 }], total: 500, discount: 0, payment: "espece", employeName: e.name, comPct: 30 });
    DB.expenses.push({ id: "d1", date: todayISO(), label: "Loyer", category: "Loyer", amount: 1000 }); save(); });
  await goto(page, "export");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Excel/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^Comptabilite_.*\.xlsx$/);
  const buf = await require("fs").promises.readFile(await dl.path());
  expect(buf.slice(0, 2).toString()).toBe("PK");
  expect(buf.length).toBeGreaterThan(1500);
  await page.evaluate(() => { window.print = () => { window.__printed = document.querySelector("#printArea").innerText; }; });
  await page.getByRole("button", { name: /PDF/ }).click();
  await page.waitForFunction(() => window.__printed);
  const txt = await page.evaluate(() => window.__printed);
  expect(txt).toContain("Rapport comptable"); expect(txt).toContain("Loyer");
});

test("réservation en ligne reçue : confirmation et rendez-vous", async ({ page }) => {
  await demo(page);
  await page.evaluate(() => { DB.rdv.push({ id: "w1", clientId: "", clientName: "Nadir", clientPhone: "0550123456", date: todayISO(), time: "15:00", employeId: DB.employes[0].id, serviceId: DB.services[0].id, serviceName: DB.services[0].name, status: "attente", note: "", source: "web" }); save(); render(); });
  await expect(page.locator("#app")).toContainText("Réservations en ligne à confirmer");
  await page.locator("button[aria-label=Confirmer]").first().click();
  await page.locator("#dlgBg button", { hasText: "Plus tard" }).click();
  expect(await page.evaluate(() => DB.rdv.find(r => r.id === "w1").status)).toBe("confirme");
  await goto(page, "agenda");
  await page.locator(".row", { hasText: "Nadir" }).click();
  await page.locator("#sheet button", { hasText: "Encaisser" }).click();
  await expect(page.locator("#tkCard")).toContainText("Nadir");
  expect(await page.evaluate(() => [TICKET.rdvId, TICKET.items.length, !!TICKET.clientId])).toEqual(["w1", 1, true]);
});

test("données v5 : anciennes sauvegardes chargées sans erreur", async ({ page }) => {
  await page.goto("/gerant/");
  await page.evaluate(() => {
    localStorage.setItem("salon_gerant", JSON.stringify({ seeded: true, employes: [{ id: "e1", name: "Zaki", commission: 20 }],
      sales: [{ id: "s1", date: new Date().toISOString().slice(0, 10), employeId: "e1", items: [{ kind: "service", refId: "x", name: "Coupe", price: 500, qty: 1 }], total: 500, payment: "espece" }] }));
  });
  await page.reload();
  await expect(page.locator("#app")).toContainText("Zaki");
  expect(await page.evaluate(() => DB.v)).toBe(6);
});

/* ---------- page de réservation publique (API simulée) ---------- */
function info(extra) {
  const d = new Date(), z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return Object.assign({ today: z.toISOString().slice(0, 10), now: "06:00", salon: { name: "Salon Test", tagline: "", loc: "", whatsapp: "213550000000" },
    services: [{ id: "s1", name: "Coupe", price: 500, duration: 30 }],
    employes: [{ id: "e1", name: "Amine", role: "Coiffeur", hStart: "09:00", hEnd: "12:00", offDays: [] }, { id: "e2", name: "Yacine", role: "Barbier", hStart: "09:00", hEnd: "12:00", offDays: [] }],
    leaves: [], busy: [] }, extra);
}
async function mockApi(page, infoDoc, book) {
  const calls = [];
  await page.route("**/rest/v1/rpc/gerant_public_info", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(infoDoc) }));
  await page.route("**/rest/v1/rpc/gerant_book", r => { calls.push(JSON.parse(r.request().postData())); book(r); });
  return calls;
}
test("réservation publique : parcours complet, « peu importe » choisit un coiffeur libre", async ({ page }) => {
  const today = info().today;
  const doc = info({ busy: [{ d: today, t: "09:00", e: "e1", s: "s1" }, { d: addDay(today, 1), t: "09:00", e: "e1", s: "s1" }] });
  const calls = await mockApi(page, doc, r => r.fulfill({ status: 200, contentType: "application/json", body: '"11111111-1111-1111-1111-111111111111"' }));
  await page.goto("/gerant/reserver.html?s=demo");
  await expect(page.locator("h1")).toContainText("Salon Test");
  await page.locator("[data-svc=s1]").click();
  await page.locator("[data-emp=any]").click();
  await page.locator("[data-date]:not(.dis)").first().click();
  await expect(page.locator("[data-time]").first()).toBeVisible();
  await page.locator("[data-time=\"09:00\"]").click();          // e1 occupé → doit partir sur e2
  await page.locator("#fN").fill("Karim");
  await page.locator("#fP").fill("05 50 12 34 56");
  await page.locator("#go").click();
  await expect(page.locator("#root")).toContainText("Demande envoyée");
  expect(calls.length).toBe(1);
  expect(calls[0]).toMatchObject({ p_id: "demo", p_name: "Karim", p_phone: "0550123456", p_time: "09:00", p_svc: "s1" });
  expect(["e1", "e2"]).toContain(calls[0].p_emp);
});
function addDay(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }

test("réservation publique : créneau déjà pris et validations", async ({ page }) => {
  await mockApi(page, info(), r => r.fulfill({ status: 400, contentType: "application/json", body: '{"message":"slot_taken"}' }));
  await page.goto("/gerant/reserver.html?s=demo");
  await page.locator("[data-svc=s1]").click();
  await page.locator("[data-emp=e1]").click();
  await page.locator("[data-date]:not(.dis)").first().click();
  await page.locator("[data-time]").first().click();
  await page.locator("#fN").fill("A");
  await page.locator("#go").click();
  await expect(page.locator("#err")).toContainText("nom");
  await page.locator("#fN").fill("Karim"); await page.locator("#fP").fill("12");
  await page.locator("#go").click();
  await expect(page.locator("#err")).toContainText("téléphone");
  await page.locator("#fP").fill("0550123456");
  await page.locator("#go").click();
  await expect(page.locator("#fN")).toHaveCount(0);              // créneau libéré → retour au choix de l'heure
  await expect(page.locator("[data-time]").first()).toBeVisible();
});

test("réservation publique : lien invalide ou salon fermé", async ({ page }) => {
  await page.goto("/gerant/reserver.html");
  await expect(page.locator("#root")).toContainText("Lien incomplet");
  await page.route("**/rest/v1/rpc/gerant_public_info", r => r.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.goto("/gerant/reserver.html?s=ferme");
  await expect(page.locator("#root")).toContainText("indisponible");
});
