import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "invalid phone format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aligoProxyUrl = Deno.env.get("ALIGO_PROXY_URL")!;
    const aligoProxySecret = Deno.env.get("ALIGO_PROXY_SECRET")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: max 5 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("phone_otps")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "too_many_requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cleanup expired OTPs for this phone
    await supabase
      .from("phone_otps")
      .delete()
      .eq("phone", phone)
      .lt("expires_at", new Date().toISOString());

    // Generate 6-digit OTP
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = String(array[0] % 1000000).padStart(6, "0");

    // Store OTP (5 min expiry)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase.from("phone_otps").insert({
      phone,
      otp_code: otp,
      expires_at: expiresAt,
    });

    if (insertError) {
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    // Send SMS via Aligo proxy
    const smsRes = await fetch(`${aligoProxyUrl}/send-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aligoProxySecret}`,
      },
      body: JSON.stringify({
        receiver: phone.replace("+82", "0"),
        msg: `[예약똑] 인증번호: ${otp}`,
      }),
    });

    if (!smsRes.ok) {
      const errBody = await smsRes.text();
      throw new Error(`SMS send failed: ${errBody}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
