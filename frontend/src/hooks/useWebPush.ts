import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';

// Build-time hint — used only to determine if push is configured at all.
// The live key is always fetched from the backend at subscribe time so that
// key rotation works without a frontend redeploy.
const VAPID_KEY_HINT = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output.buffer as ArrayBuffer;
}

function arrayBufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return '';
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function getSwReg(timeoutMs = 5000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const timeout = new Promise<null>((res) => setTimeout(() => res(null), timeoutMs));
    const result = await Promise.race([navigator.serviceWorker.ready, timeout]);
    return result as ServiceWorkerRegistration | null;
  } catch {
    return null;
  }
}

// Fetch the live VAPID public key from the backend, falling back to the env
// hint if the request fails (e.g. offline or server error).
async function fetchVapidKey(): Promise<string | null> {
  try {
    const res = await client.get<{ vapid_public_key: string }>('/push/vapid-key/');
    return res.data.vapid_public_key || null;
  } catch {
    return VAPID_KEY_HINT ?? null;
  }
}

export type PushPermission = NotificationPermission | 'unsupported';

export function useWebPush() {
  const supported =
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!VAPID_KEY_HINT;

  const [permission, setPermission] = useState<PushPermission>(
    supported ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize from the actual browser subscription on mount
  useEffect(() => {
    if (!supported) return;
    void (async () => {
      const reg = await getSwReg(3000);
      if (!reg) return;
      const existing = await reg.pushManager.getSubscription();
      setIsSubscribed(!!existing);
    })();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      // Always fetch the live key so key rotation is seamless
      const vapidKey = await fetchVapidKey();
      if (!vapidKey) {
        console.warn('VAPID public key unavailable — push subscription skipped');
        return;
      }

      const reg = await getSwReg(5000);
      if (!reg) {
        console.warn('Service worker not ready — push subscription skipped');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await client.post('/push/subscribe/', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
          auth: arrayBufferToBase64(sub.getKey('auth')),
        },
      });

      setIsSubscribed(true);
    } catch {
      // silent — permission denied or SW error
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setIsLoading(true);
    try {
      const reg = await getSwReg(5000);
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await client.delete('/push/unsubscribe/', { data: { endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
      }
      setIsSubscribed(false);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  return { supported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
// ----
