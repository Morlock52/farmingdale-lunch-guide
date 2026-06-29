/**
 * Service Worker for Farmingdale Lunch Guide
 * Provides offline support and asset caching
 */

const CACHE_NAME = 'farmingdale-lunch-guide-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/constants.js',
    '/js/utils.js',
    '/js/storage.js',
    '/js/api.js',
    '/js/data.js',
    '/js/toast.js',
    '/js/ui.js',
    '/js/app.js',
    '/data/restaurants.json'
];

/**
 * Install event - cache assets
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[ServiceWorker] Install complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Install failed:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activate complete');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests (like Unsplash images)
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) {
        // For external images, try network first, then provide fallback
        if (event.request.destination === 'image') {
            event.respondWith(
                fetch(event.request)
                    .catch(() => {
                        // Return a placeholder for failed images
                        return new Response(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180"><rect fill="#ddd" width="400" height="180"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="20">Image unavailable offline</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    })
            );
        }
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    const fetchPromise = fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(() => cachedResponse);

                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[ServiceWorker] Fetch failed:', error);

                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});

/**
 * Message event - handle skip waiting
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
