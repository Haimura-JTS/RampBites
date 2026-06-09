const CACHE_NAME = 'ramp-bites-control-panel-v0.16.0';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/icon-maskable.svg',
  './src/main.js',
  './src/auth.js',
  './src/constants.js',
  './src/calculations.js',
  './src/exporters.js',
  './src/html.js',
  './src/models.js',
  './src/reports.js',
  './src/router.js',
  './src/seed.js',
  './src/storage.js',
  './src/sync.js',
  './src/validators.js',
  './src/apiClient.js',
  './src/services/businessService.js',
  './src/views/clientsView.js',
  './src/views/dashboardView.js',
  './src/views/expiryView.js',
  './src/views/kitchenView.js',
  './src/views/lotsView.js',
  './src/views/ordersView.js',
  './src/views/placeholderView.js',
  './src/views/priceHistoryView.js',
  './src/views/productsView.js',
  './src/views/productionView.js',
  './src/views/purchasesView.js',
  './src/views/recipesView.js',
  './src/views/reportsView.js',
  './src/views/settingsView.js',
  './src/views/simulatorView.js',
  './src/views/stockView.js',
  './src/views/suppliersView.js',
  './src/styles/base.css',
  './src/styles/components.css',
  './src/styles/layout.css',
  './src/styles/theme.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    })
  );
});
