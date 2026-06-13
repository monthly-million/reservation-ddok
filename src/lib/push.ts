import { createBrowserClient } from "@/lib/supabase/client";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export async function subscribeToPush(shopId: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const sub = subscription.toJSON();
  const supabase = createBrowserClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      shop_id: shopId,
      endpoint: subscription.endpoint,
      p256dh: sub.keys!.p256dh,
      auth_key: sub.keys!.auth,
    },
    { onConflict: "endpoint" }
  );

  return !error;
}

export async function unsubscribeFromPush(shopId: string): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return true;

  await subscription.unsubscribe();

  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("shop_id", shopId)
    .eq("endpoint", subscription.endpoint);

  return !error;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
