import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWebPushPublicKey, registerWebPushSubscription } from '@/services/pushNotifications';

function canUseWebPush() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function WebPushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !canUseWebPush()) return;

    let cancelled = false;

    async function register() {
      try {
        const { available, publicKey } = await getWebPushPublicKey();
        if (!available || !publicKey || cancelled) return;

        const permission =
          Notification.permission === 'default'
            ? await Notification.requestPermission()
            : Notification.permission;

        if (permission !== 'granted' || cancelled) return;

        const registration = await navigator.serviceWorker.register('/web-push-sw.js');
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          });
        }

        if (!cancelled) {
          await registerWebPushSubscription(subscription);
        }
      } catch {
        // O polling de lembretes continua funcionando como fallback.
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
}
