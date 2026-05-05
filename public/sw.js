/**
 * MelaChow Service Worker
 * 
 * Implements a production-grade caching strategy for a food delivery app:
 * - Cache static assets (JS, CSS, images, fonts)
 * - Network-first for API requests (fresh data priority)
 * - Offline fallback for critical pages
 * - Skip waiting on update (controlled by update manager)
 */

const CACHE_VERSION = 'melachow-v1.1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
];

// Routes that should work offline
const OFFLINE_PAGES = [
    '/',
    '/offline',
];

// API endpoints (use network-first)
const API_ROUTES = [
    '/api/',
    'https://melachow-api.onrender.com/api/',
];

// Static asset patterns (cache-first)
const STATIC_ASSET_PATTERNS = [
    /\.(?:js|css|woff2?|ttf|otf|eot)$/,
    /_next\/static\//,
];

// Image patterns (cache-first with expiration)
const IMAGE_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /res\.cloudinary\.com/,
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Precaching assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        // Delete old caches
                        return cacheName.startsWith('melachow-') && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );

    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Strategy 1: Network-first for API requests (fresh data priority)
    if (isAPIRequest(url)) {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }

    // Strategy 2: Cache-first for images (performance)
    if (isImageRequest(url)) {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000)); // 30 days
        return;
    }

    // Strategy 3: Cache-first for static assets (JS, CSS, fonts)
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // Strategy 4: Network-first for HTML pages (fresh content)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }

    // Default: Network-first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Listen for skip waiting message from update manager
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }
});

// Helper: Check if request is an API call
function isAPIRequest(url) {
    return API_ROUTES.some(route => url.href.includes(route));
}

// Helper: Check if request is for an image
function isImageRequest(url) {
    return IMAGE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Helper: Check if request is for a static asset
function isStaticAsset(url) {
    return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url.href));
}

// Strategy: Network-first (for dynamic content and API)
async function networkFirstStrategy(request, cacheName) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // If HTML request and offline, return offline page
        if (request.headers.get('accept')?.includes('text/html')) {
            const offlinePage = await caches.match('/offline');
            if (offlinePage) {
                return offlinePage;
            }
        }

        // Return error
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Strategy: Cache-first (for static assets and images)
async function cacheFirstStrategy(request, cacheName, maxAge = null) {
    // Try cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Check if cache is expired (if maxAge is set)
        if (maxAge) {
            const cachedDate = new Date(cachedResponse.headers.get('date'));
            const now = new Date();
            const age = now - cachedDate;

            if (age > maxAge) {
                // Cache expired, fetch new version in background
                fetchAndCache(request, cacheName);
            }
        }

        return cachedResponse;
    }

    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Failed to fetch:', request.url);
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Helper: Fetch and cache in background
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response);
        }
    } catch (error) {
        console.log('[SW] Background fetch failed:', request.url);
    }
}

// --- Enhanced Push Notification Handlers ---

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received:', event);

    let notificationData = {
        title: 'MelaChow',
        body: 'You have a new notification',
        icon: '/icon-192x192.png', // Your PWA icon
        badge: '/badge-72x72.png', // Small monochrome icon for notification badge
        tag: 'melachow-notification',
        requireInteraction: false,
        data: {}
    };

    // Parse incoming notification data
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[Service Worker] Notification Payload:', payload);

            // Extract notification details
            notificationData = {
                title: payload.title || 'MelaChow',
                body: payload.body || payload.message || 'You have a new update',
                icon: payload.icon || '/icon-192x192.png',
                badge: payload.badge || '/badge-72x72.png',
                image: payload.image, // Large image (optional)
                tag: payload.tag || `melachow-${Date.now()}`,
                requireInteraction: payload.requireInteraction || false,
                vibrate: payload.vibrate || [200, 100, 200], // Vibration pattern
                timestamp: payload.timestamp || Date.now(),
                data: {
                    url: payload.url || '/',
                    orderId: payload.orderId,
                    type: payload.type, // 'order', 'promo', 'delivery', etc.
                    ...payload.data
                },
                actions: [] // We'll add actions based on notification type
            };

            // Add contextual actions based on notification type
            switch (payload.type) {
                case 'order_placed':
                case 'order_confirmed':
                case 'order_preparing':
                case 'order_ready':
                case 'order_dispatched':
                case 'order_delivered':
                    notificationData.actions = [
                        { action: 'track', title: 'ðŸšš Track Order', icon: '/icons/track.png' },
                        { action: 'view', title: 'ðŸ‘ï¸ View Details', icon: '/icons/view.png' }
                    ];
                    notificationData.tag = `order-${payload.orderId}`;
                    break;

                case 'promo':
                case 'discount':
                    notificationData.actions = [
                        { action: 'browse', title: 'ðŸ” Browse Menu', icon: '/icons/menu.png' },
                        { action: 'dismiss', title: 'âŒ Dismiss', icon: '/icons/close.png' }
                    ];
                    break;

                case 'delivery_nearby':
                    notificationData.actions = [
                        { action: 'track', title: 'ðŸ“ Track Rider', icon: '/icons/location.png' }
                    ];
                    notificationData.requireInteraction = true; // Keep visible
                    break;

                default:
                    notificationData.actions = [
                        { action: 'view', title: 'ðŸ‘ï¸ View', icon: '/icons/view.png' }
                    ];
            }

        } catch (error) {
            console.error('[Service Worker] Error parsing notification:', error);
        }
    }

    // Show the notification
    event.waitUntil(
        Promise.all([
            self.registration.showNotification(notificationData.title, notificationData),
            // Send message to all clients (foreground windows)
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                windowClients.forEach((client) => {
                    client.postMessage({
                        type: 'PUSH_NOTIFICATION',
                        payload: {
                            title: notificationData.title,
                            body: notificationData.body,
                            url: notificationData.data.url
                        }
                    });
                });
            })
        ])
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification clicked:', event);

    event.notification.close();

    const notificationData = event.notification.data;
    const action = event.action;

    let targetUrl = '/';

    // Determine target URL based on action
    switch (action) {
        case 'track':
            targetUrl = notificationData.orderId
                ? `/track-orders/${notificationData.orderId}`
                : '/orders';
            break;

        case 'view':
            targetUrl = notificationData.url || '/notifications';
            break;

        case 'browse':
            targetUrl = '/';
            break;

        case 'dismiss':
            return; // Just close notification

        default:
            // Default click (no action button) - go to notification detail or order
            if (notificationData.url) {
                targetUrl = notificationData.url;
            } else if (notificationData.orderId) {
                targetUrl = `/track-orders/${notificationData.orderId}`;
            } else {
                targetUrl = '/notifications';
            }
    }

    // Navigate to target URL
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Check if app is already open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then(client => {
                            return client.navigate(targetUrl);
                        });
                    }
                }
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

