/* Salon Gérant — service worker
   Cache versionné et atomique : l'app démarre instantanément depuis le cache (même hors-ligne) ;
   une nouvelle version est téléchargée en entier en arrière-plan puis activée d'un coup. */
const CACHE = "salon-gerant-v6";
const FONTS = "salon-gerant-fonts";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./config.js", "./manifest.webmanifest",
  "./js/lib.js", "./js/core.js", "./js/sync.js", "./js/auth.js",
  "./js/views-caisse.js", "./js/views-agenda.js", "./js/views-equipe.js", "./js/views-gestion.js",
  "./js/views-rapports.js", "./js/views-admin.js", "./js/views-start.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png", "./icons/icon-maskable-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(u => fetch(new Request(u, { cache: "reload" })).then(r => {
        if (!r.ok) throw new Error("precache " + u);
        return c.put(u, r);
      }))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin){
    // page de réservation publique : toujours la version en ligne si possible
    if (/reserver\.html$/.test(url.pathname)){
      e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true })));
      return;
    }
    e.respondWith(
      caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        if (req.mode === "navigate") return c.match("./index.html").then(ix => ix || fetch(req));
        return fetch(req);
      }))
    );
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(
      caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      })))
    );
  }
});
