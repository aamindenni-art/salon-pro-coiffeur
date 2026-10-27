// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Tests end-to-end de l'application Salon Pro (PWA coiffeur) et de la page de
 * réservation. Le site est 100 % statique : on le sert avec http-server, puis
 * on le pilote avec un navigateur au format téléphone (l'app est faite pour ça).
 */
module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8097",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // On teste le contenu de l'app, pas son cache : le service worker
    // fausserait les exécutions parallèles (il sert d'anciens fichiers).
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npx --yes http-server -p 8097 -a 127.0.0.1 -c-1 --silent .",
    url: "http://127.0.0.1:8097/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
