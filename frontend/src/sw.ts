/// <reference lib="WebWorker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Augment ServiceWorkerGlobalScope with the injected precache manifest
declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  }
}

// ── Share target: intercept POST /report from Android share sheet ─────────────
// Must be registered BEFORE precacheAndRoute so we can call respondWith first.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/report') {
    event.respondWith(
      (async (): Promise<Response> => {
        try {
          const formData = await event.request.formData();
          const imageFile = formData.get('image');
          if (imageFile instanceof File) {
            const shareCache = await caches.open('ptrack-share-target');
            await shareCache.put(
              'shared-image',
              new Response(imageFile, { headers: { 'Content-Type': imageFile.type } })
            );
          }
        } catch {
          // silently ignore — still redirect to the form
        }
        return Response.redirect('/report?shared=true', 303);
      })()
    );
  }
});

// ── Precaching ────────────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── SPA navigation fallback ───────────────────────────────────────────────────
// Without this, navigating to /dashboard or /admin while offline falls through
// to the network (which is down) instead of serving index.html from precache.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  })
);

// ── B: Images — CacheFirst, 100 entries, 30 days ─────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'ptrack-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── C: API GET routes ─────────────────────────────────────────────────────────

// /api/v1/auth/me/ — NetworkFirst, 5 s timeout
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname === '/api/v1/auth/me/',
  new NetworkFirst({
    cacheName: 'ptrack-auth',
    networkTimeoutSeconds: 5,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// /api/v1/leaderboard/ — StaleWhileRevalidate, 5 min
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/v1/leaderboard'),
  new StaleWhileRevalidate({
    cacheName: 'ptrack-leaderboard',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 5 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// /api/v1/recycling-centres/ — CacheFirst, 1 day
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/v1/recycling-centres'),
  new CacheFirst({
    cacheName: 'ptrack-recycling-centres',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// /api/v1/education/ — StaleWhileRevalidate, 1 hour
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/v1/education'),
  new StaleWhileRevalidate({
    cacheName: 'ptrack-education',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Everything else /api/v1/ — NetworkFirst, 3 s timeout
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/v1/'),
  new NetworkFirst({
    cacheName: 'ptrack-api',
    networkTimeoutSeconds: 3,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// ── Push notifications ────────────────────────────────────────────────────────
interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() as PushPayload | undefined;
  const title = data?.title ?? 'pTrack';
  const body = data?.body ?? 'You have a new notification.';
  const url = data?.url ?? '/dashboard';
  const icon = data?.icon ?? '/icons/icon-192.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/badge-96.png',
      data: { url },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifUrl = (event.notification.data as { url?: string }).url ?? '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => 'navigate' in c);
      if (existing && 'navigate' in existing) {
        void (existing as WindowClient).navigate(notifUrl);
        return (existing as WindowClient).focus();
      }
      return self.clients.openWindow(notifUrl);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

self.addEventListener('sync', (event) => {
  const sync = event as SyncEvent;
  if (sync.tag === 'sync-reports') {
    // Notify open clients to flush; they have the auth token
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'FLUSH_QUEUE' }));
      })
    );
  }
});

// ── Skip-waiting on demand ────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
