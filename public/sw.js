/**
 * 优服佳 PWA Service Worker
 *
 * 策略:
 * - App Shell (HTML/CSS/JS): Cache-First（优先缓存，背景更新）
 * - API 请求 (/api/*): Network-First（优先网络，失败时降级缓存）
 * - 静态资源 (_next/static/*): Cache-First + 永久缓存
 * - 图片: Stale-While-Revalidate（立即返回缓存，后台更新）
 *
 * 离线支持: /app/offline 页面
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `shell-${CACHE_VERSION}`;
const API_CACHE     = `api-${CACHE_VERSION}`;
const IMAGE_CACHE   = `images-${CACHE_VERSION}`;
const STATIC_CACHE  = `static-${CACHE_VERSION}`;

// App Shell — 预缓存的关键资源
const SHELL_URLS = [
  '/',
  '/app',
  '/app/feed',
  '/app/services',
  '/app/forum',
  '/app/offline',
  '/manifest.json',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_URLS).catch((err) => {
        console.warn('[SW] Shell pre-cache partial failure:', err);
      })
    ).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, API_CACHE, IMAGE_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源 GET 请求
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 1. 静态资源 (_next/static/) — Cache-First 永久缓存
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. 图片 — Stale-While-Revalidate
  if (request.destination === 'image' || url.pathname.startsWith('/icons/')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 3. API 请求 — Network-First（离线时返回缓存或 503）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 4. HTML 页面 — Network-First，离线时返回 App Shell
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
});

// ── Push 通知处理 ────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: '优服佳', body: event.data.text(), url: '/app' };
  }

  const { title = '优服佳', body = '', icon = '/icons/icon-192x192.png', url = '/app', tag } = payload;

  const options = {
    body,
    icon,
    badge:   '/icons/icon-72x72.png',
    tag:     tag ?? 'youfujia-notification',
    data:    { url },
    actions: [
      { action: 'open',    title: '查看' },
      { action: 'dismiss', title: '关闭' },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── 通知点击处理 ──────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url ?? '/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 如果已有同 URL 的窗口，聚焦之
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      return clients.openWindow(targetUrl);
    })
  );
});

// ── 缓存策略实现 ──────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached ?? (await networkPromise) ?? new Response('', { status: 503 });
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response(JSON.stringify({ success: false, message: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 降级到离线页面
    const offline = await cache.match('/app/offline');
    return offline ?? new Response('<h1>您当前处于离线状态</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
