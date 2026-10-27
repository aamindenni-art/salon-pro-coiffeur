// Tests de l'application de gestion (PWA du coiffeur).
const { test, expect } = require("@playwright/test");

// L'app garde ses données dans localStorage : on repart toujours de zéro.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (e) {}
  });
});

/** Onboarding express : nom du salon + chargement des données d'exemple. */
async function demarrerAvecExemples(page) {
  await page.goto("/");
  await expect(page.locator("#start")).toBeVisible();
  await page.locator("#start").click();            // étape 0 → 1
  await page.locator("#o_name").fill("Salon Test");
  await page.locator("#next").click();             // étape 1 → 2
  await page.locator("#c_demo").click();           // charge les exemples
  await expect(page.locator("#nav [data-nav]").first()).toBeVisible();
}

test("l'accueil s'affiche après l'onboarding, avec des données", async ({ page }) => {
  await demarrerAvecExemples(page);
  await expect(page.locator(".page-h .h")).toContainText("Bonjour");
  const clients = await page.evaluate(() => DB.clients.length);
  expect(clients).toBeGreaterThan(0);
  const services = await page.evaluate(() => DB.services.length);
  expect(services).toBeGreaterThan(0);
});

test("la navigation ouvre tous les onglets", async ({ page }) => {
  await demarrerAvecExemples(page);
  const onglets = [
    ["rdv", "Agenda"],
    ["pos", "Caisse"],
    ["clients", "Clients"],
    ["fin", "Finances"],
    ["dash", "Bonjour"],
  ];
  for (const [key, titre] of onglets) {
    await page.locator(`#nav [data-nav="${key}"]`).click();
    await expect(page.locator(".page-h .h")).toContainText(titre);
  }
});

test("barre du haut : aucun bouton fantôme vide (install/cadenas masqués)", async ({ page }) => {
  await demarrerAvecExemples(page);
  // Les boutons masqués (install non dispo, cadenas sans code PIN) ne doivent
  // pas apparaître comme des cases vides.
  await expect(page.locator("#btnLock")).toBeHidden();
  await expect(page.locator("#btnSettings")).toBeVisible();
  await expect(page.locator("#btnTheme")).toBeVisible();
  // Chaque bouton visible de la barre a bien une icône (pas de case vide).
  const vides = await page.locator(".topbar-actions .iconbtn:visible").evaluateAll(
    (btns) => btns.filter((b) => !b.querySelector("svg")).length
  );
  expect(vides).toBe(0);
});

test("bascule jour/nuit : le thème et l'icône changent", async ({ page }) => {
  await demarrerAvecExemples(page);
  const theme = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const avant = await theme();
  await page.locator("#btnTheme").click();
  expect(await theme()).not.toBe(avant);                      // le thème a bien changé
  await expect(page.locator("#btnTheme svg")).toBeVisible();  // l'icône se met à jour
  await page.locator("#btnTheme").click();
  expect(await theme()).toBe("light");                        // re-bascule explicite
});

test("caisse : ajouter une prestation et encaisser crée une vente", async ({ page }) => {
  await demarrerAvecExemples(page);
  const avant = await page.evaluate(() => DB.sales.length);

  await page.locator('#nav [data-nav="pos"]').click();
  await page.locator(".svc-tile").first().click();        // ajoute au panier
  await page.locator("#checkout").click();                // ouvre l'encaissement
  await page.locator(".sheet [data-pay]").click();        // valide la vente

  // Le reçu s'affiche
  await expect(page.locator(".sheet-h h3")).toHaveText("Reçu");

  const apres = await page.evaluate(() => DB.sales.length);
  expect(apres).toBe(avant + 1);
});

test("caisse : article libre, remise et rendu de monnaie", async ({ page }) => {
  await demarrerAvecExemples(page);
  await page.locator('#nav [data-nav="pos"]').click();

  // Article libre (prix au choix)
  await page.locator("#freeItem").click();
  await page.locator("#fi_name").fill("Coupe enfant");
  await page.locator("#fi_price").fill("500");
  await page.locator(".sheet [data-add]").click();
  await expect(page.locator("#cartbar")).toBeVisible();

  // Encaissement
  await page.locator("#checkout").click();
  await expect(page.locator("#c_totals")).toContainText("500");

  // Remise de 100 DA → total 400
  await page.locator("#c_disc").fill("100");
  await expect(page.locator("#c_totals")).toContainText("Remise");
  await expect(page.locator("[data-pay]")).toContainText("400");

  // Espèces : montant reçu 500 → à rendre 100
  await page.locator('#c_mode [data-m="Espèces"]').click();
  await page.locator("#c_paid").fill("500");
  await expect(page.locator("#c_change")).toContainText(/rendre/i);
  await expect(page.locator("#c_change")).toContainText("100");

  // Valider → reçu + vente stockée avec la remise
  await page.locator("[data-pay]").click();
  await expect(page.locator(".sheet-h h3")).toHaveText("Reçu");
  const sale = await page.evaluate(() => DB.sales[DB.sales.length - 1]);
  expect(sale.discount).toBe(100);
  expect(sale.total).toBe(400);
});

test("caisse : la recherche filtre les prestations", async ({ page }) => {
  await demarrerAvecExemples(page);
  await page.locator('#nav [data-nav="pos"]').click();
  const tiles = page.locator("#svcWrap .svc-tile");
  const n = await tiles.count();
  expect(n).toBeGreaterThan(1);

  await page.locator("#posq").fill("barbe");
  const filtre = await tiles.count();
  expect(filtre).toBeGreaterThan(0);
  expect(filtre).toBeLessThan(n);

  await page.locator("#posq").fill("zzz_introuvable");
  await expect(page.locator("#svcWrap")).toContainText("Aucune prestation trouvée");

  await page.locator("#posq").fill("");
  await expect(tiles.first()).toBeVisible();
});

test("verrouillage : définir un code, verrouiller, déverrouiller", async ({ page }) => {
  await demarrerAvecExemples(page);

  // Activer le code PIN depuis les réglages
  await page.locator("#btnSettings").click();
  await page.locator("#pinToggle").check({ force: true });
  await page.locator("#pin1").fill("1234");
  await page.locator("#pin2").fill("1234");
  await page.locator("#pinq").fill("Ville de naissance ?");
  await page.locator("#pina").fill("Alger");
  await page.locator(".sheet [data-save]").click();

  // Le cadenas est désormais visible → on verrouille
  const cadenas = page.locator("#btnLock");
  await expect(cadenas).toBeVisible();
  await cadenas.click();
  await expect(page.locator(".lock")).toBeVisible();

  // Mauvais code → reste verrouillé
  for (const d of ["0", "0", "0", "0"]) {
    await page.locator(`.lock .kb[data-k="${d}"]`).click();
  }
  await expect(page.locator(".lock")).toBeVisible();

  // On attend la remise à zéro de la saisie, puis le bon code → déverrouillé
  await page.waitForTimeout(900);
  for (const d of ["1", "2", "3", "4"]) {
    await page.locator(`.lock .kb[data-k="${d}"]`).click();
  }
  await expect(page.locator(".lock")).toHaveCount(0);
});

test("récupération : répondre à la question secrète déverrouille", async ({ page }) => {
  await demarrerAvecExemples(page);

  // Configurer le code + question secrète
  await page.locator("#btnSettings").click();
  await page.locator("#pinToggle").check({ force: true });
  await page.locator("#pin1").fill("4321");
  await page.locator("#pin2").fill("4321");
  await page.locator("#pinq").fill("Ville de naissance ?");
  await page.locator("#pina").fill("Alger");
  await page.locator(".sheet [data-save]").click();

  // Verrouiller puis cliquer « Code oublié ? »
  await page.locator("#btnLock").click();
  await page.locator("#forgot").click();

  // Mauvaise réponse → toujours verrouillé
  await page.locator("#recAns").fill("Oran");
  await page.locator("#recGo").click();
  await expect(page.locator(".lock")).toBeVisible();

  // Bonne réponse (insensible à la casse/espaces) → déverrouillé
  await page.locator("#recAns").fill("  alger ");
  await page.locator("#recGo").click();
  await expect(page.locator(".lock")).toHaveCount(0);
});
