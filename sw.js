/* Bruv Lifts offline cache. The page itself is network-first (so updates land), everything else cache-first.
   Bump C when sprites or icons change. */
const C = "bruvlifts-v3";
const SEQ = { idle: 6, talk: 4, jump: 5, sad: 8, run: 6, chain: 6, chill: 6, gest: 6 };
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png", "./bruv/flex.png"];
for (const [k, n] of Object.entries(SEQ)) for (let i = 0; i < n; i++) ASSETS.push(`./bruv/${k}_${i}.png`);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), ms))]);
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (r.mode === "navigate") {
    e.respondWith(timeout(fetch(r), 3500).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put("./index.html", cp)); }
      return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
    const u = new URL(r.url);
    if ((res.ok || res.type === "opaque") && (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.host))) {
      const cp = res.clone(); caches.open(C).then(c => c.put(r, cp));
    }
    return res;
  })));
});
