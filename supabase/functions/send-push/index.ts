import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@reservation-ddok.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  const { shop_id, customer_name, reservation_id } = await req.json();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?shop_id=eq.${shop_id}&select=endpoint,p256dh,auth_key`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  const subscriptions = await res.json();

  const payload = JSON.stringify({
    title: "새 예약이 들어왔어요!",
    body: `${customer_name}님이 예약했습니다.`,
    url: `/dashboard/shop/${shop_id}/reservations`,
  });

  const results = await Promise.allSettled(
    subscriptions.map((row: { endpoint: string; p256dh: string; auth_key: string }) =>
      webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_key } },
        payload
      )
    )
  );

  return new Response(JSON.stringify({ sent: results.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
