/**
 * Service Worker 注册工具
 *
 * 用法（在客户端组件中）:
 * import { registerServiceWorker } from '@/lib/pwa/sw-register';
 * useEffect(() => { registerServiceWorker(); }, []);
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // 总是检查 SW 更新
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新版本 SW 已就绪，可提示用户刷新
          console.log('[SW] New version available. Refresh to update.');
          window.dispatchEvent(new CustomEvent('sw:update-available'));
        }
      });
    });

    console.log('[SW] Registered:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

/**
 * 注销 Service Worker（用于强制更新或调试）
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  console.log('[SW] All service workers unregistered');
}
