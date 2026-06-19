// ponytail: static asset list — bump CACHE when deploy changes.
const CACHE = "more-ducks-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/main.css",
  "./assets/icon.svg",
  "./src/main.js",
  "./src/data/ducks.js",
  "./src/data/eras.js",
  "./src/data/producers.js",
  "./src/data/quackmarks.js",
  "./src/data/quacks.js",
  "./src/data/questions.js",
  "./src/data/upgrades.js",
  "./src/data/research.js",
  "./src/data/hype.js",
  "./src/game/achievements.js",
  "./src/game/dex.js",
  "./src/game/dexMods.js",
  "./src/game/economy.js",
  "./src/game/format.js",
  "./src/game/meta.js",
  "./src/game/progression.js",
  "./src/game/quack.js",
  "./src/game/quackmarks.js",
  "./src/game/save.js",
  "./src/game/score.js",
  "./src/game/sfx.js",
  "./src/game/upgrades.js",
  "./src/game/market.js",
  "./src/game/hype.js",
  "./src/game/feed.js",
  "./src/game/answerdex.js",
  "./src/game/capacity.js",
  "./src/game/regions.js",
  "./src/game/endings.js",
  "./src/data/regions.js",
  "./src/data/endings.js",
  "./src/ui/chat.js",
  "./src/ui/answerdex.js",
  "./src/ui/regions.js",
  "./src/ui/shell.js",
  "./src/ui/dex.js",
  "./src/ui/ending.js",
  "./src/ui/modal.js",
  "./src/ui/quackmarks.js",
  "./src/ui/render.js",
  "./src/ui/settings.js",
  "./src/ui/shop.js",
  "./src/ui/hype.js",
  "./src/ui/toast.js",
  "./src/ui/upgrades.js",
  "./src/engine/engine.js",
  "./src/engine/currency.js",
  "./src/engine/entity.js",
  "./src/engine/eventemitter.js",
  "./src/engine/producer.js",
  "./src/engine/resource.js",
  "./src/engine/modifier.js",
  "./src/engine/reactor.js",
  "./src/engine/formatters/number_abstract.js",
  "./src/engine/formatters/number_dictionary.js",
  "./src/engine/formatters/number_scientific.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok && url.origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
