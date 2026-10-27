// Tests de la page de réservation en ligne (le client prend rendez-vous).
const { test, expect } = require("@playwright/test");

test.describe("Page de réservation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reservation/");
  });

  test("affiche l'identité du salon et les prestations", async ({ page }) => {
    await expect(page.locator("#sign")).toHaveText(/BARBER BIRKHADEM/i);
    const services = page.locator("[data-svc]");
    await expect(services.first()).toBeVisible();
    expect(await services.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator("body")).toContainText("Coupe");
  });

  test("le bouton d'envoi est bloqué tant que la réservation est incomplète", async ({ page }) => {
    const cta = page.locator("#cta");
    await expect(cta).toBeDisabled();
    await expect(cta).toHaveText(/Choisir une prestation/i);
  });

  test("parcours complet : prestation → jour → heure → coordonnées", async ({ page }) => {
    // 1) prestation
    await page.locator('[data-svc="0"]').click();

    // 2) jour — on prend le 2e (demain) pour éviter les créneaux déjà passés aujourd'hui
    const days = page.locator("[data-day]");
    await expect(days.first()).toBeVisible();
    await days.nth(1).click();

    // 3) un créneau disponible (pas la classe .off)
    const slot = page.locator("[data-slot]:not(.off)").first();
    await expect(slot).toBeVisible();
    await slot.click();

    // Le récapitulatif apparaît avec la bonne prestation
    await expect(page.locator("#summary")).toContainText("Coupe");

    // 4) coordonnées (le bloc contact est révélé après le choix du créneau)
    await page.locator("#cName").fill("Yacine Test");
    await page.locator("#cPhone").fill("0770112233");

    // Le bouton d'envoi WhatsApp est maintenant actif
    const cta = page.locator("#cta");
    await expect(cta).toBeEnabled();
    await expect(cta).toContainText(/Envoyer ma demande/i);
  });
});
