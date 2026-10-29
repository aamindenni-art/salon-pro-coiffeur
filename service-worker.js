/* Salon Pro — service worker (cache applicatif + hors-ligne)
   Mise à jour AUTOMATIQUE : le nouveau worker s'active tout de suite
   (skipWaiting), les fichiers cœur passent en « réseau d'abord » quand
   on est en ligne → l'app est toujours à jour sans action de l'utilisateur. */
const CACHE = "salonpro-v31";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./vendor/chart.umd.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./icons/icon-maskable-512.png",
];

// Fichiers cœur de l'app : on veut toujours la dernière version quand il y a du réseau.
const CORE = /(\/|\/index\.html|\/app\.js|\/styles\.css|\/manifest\.webmanifest)$/;

self.addEventListener("install", (e) => {
  // Précharge + s'active immédiatement (pas d'attente du bouton « Mettre à jour »).
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });

// Réseau d'abord : on prend le réseau, on met à jour le cache, repli sur le cache si hors-ligne.
function networkFirst(req) {
  return fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")));
}
// Cache d'abord : rapide, réseau en secours (pour les fichiers qui ne changent pas : icônes, vendor).
function cacheFirst(req) {
  return caches.match(req).then((cached) =>
    cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached)
  );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigations → réseau d'abord (toujours la dernière page), repli hors-ligne.
  if (req.mode === "navigate") { e.respondWith(networkFirst(req)); return; }

  if (url.origin === self.location.origin) {
    // Fichiers cœur (app.js, styles.css, …) → réseau d'abord ; le reste → cache d'abord.
    e.respondWith(CORE.test(url.pathname) ? networkFirst(req) : cacheFirst(req));
    return;
  }

  // Autres origines (polices, images) : réseau puis cache.
  e.respondWith(
    fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); return res; })
      .catch(() => caches.match(req))
  );
});
