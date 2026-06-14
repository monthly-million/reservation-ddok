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
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: "phone and otp required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find latest unused, non-expired OTP for this phone
    const { data: otpRecord, error: fetchError } = await supabase
      .from("phone_otps")
      .select("*")
      .eq("phone", phone)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(JSON.stringify({ error: "no_valid_otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Brute-force protection: max 5 attempts
    if (otpRecord.attempts >= 5) {
      await supabase
        .from("phone_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);

      return new Response(JSON.stringify({ error: "too_many_attempts" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check OTP
    if (otpRecord.otp_code !== otp) {
      await supabase
        .from("phone_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      return new Response(JSON.stringify({ error: "invalid_otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as used
    await supabase
      .from("phone_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Create or find user via magic link generation
    const phoneDigits = phone.replace(/\D/g, "");
    const email = `${phoneDigits}@phone.reservation-ddok.app`;

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      throw new Error(`generateLink failed: ${linkError?.message}`);
    }

    // Extract token_hash from the generated link
    const url = new URL(linkData.properties.action_link);
    const tokenHash = url.searchParams.get("token_hash");

    if (!tokenHash) {
      throw new Error("token_hash not found in generated link");
    }

    return new Response(JSON.stringify({ token_hash: tokenHash }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
