import { api } from "@/services/api";

const webPushSubscriptionKey = "@minha-receita:web-push-subscription";

export async function getWebPushPublicKey() {
  const { data } = await api.get<{ available: boolean; publicKey: string }>("/push-notifications/web/public-key");
  return data;
}

export async function registerWebPushSubscription(subscription: PushSubscription) {
  const token = JSON.stringify(subscription.toJSON());
  await api.post("/push-notifications/tokens", {
    token,
    platform: "WEB",
    deviceName: navigator.userAgent || "Navegador",
  });
  localStorage.setItem(webPushSubscriptionKey, token);
  return token;
}

export async function unregisterWebPushSubscription() {
  const token = localStorage.getItem(webPushSubscriptionKey);
  if (!token) return;
  try {
    await api.delete("/push-notifications/tokens", { data: { token } });
  } finally {
    localStorage.removeItem(webPushSubscriptionKey);
  }
}

