import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "phone and otp required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find valid OTP
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
      return new Response(
        JSON.stringify({ error: "인증번호가 만료되었거나 존재하지 않습니다" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Brute-force protection
    if (otpRecord.attempts >= 5) {
      await supabase
        .from("phone_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "시도 횟수 초과. 다시 인증번호를 요청해주세요" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check OTP
    if (otpRecord.otp_code !== otp) {
      await supabase
        .from("phone_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "인증번호가 일치하지 않습니다" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark OTP as used
    await supabase
      .from("phone_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Create or find user (same pattern as dogwithus)
    const phoneDigits = phone.replace(/[^0-9]/g, "");
    const fakeEmail = `${phoneDigits}@phone.reservation-ddok.app`;

    const { data: listData } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    const existingUser = listData?.users?.find((u) => u.email === fakeEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUserData, error: createErr } =
        await supabase.auth.admin.createUser({
          email: fakeEmail,
          email_confirm: true,
          user_metadata: { phone },
        });

      if (createErr || !newUserData?.user) {
        console.error("createUser error:", createErr);
        return new Response(
          JSON.stringify({
            error: `사용자 생성 실패: ${createErr?.message ?? "unknown"}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      userId = newUserData.user.id;

      // Create profile
      await supabase
        .from("profiles")
        .upsert({ id: userId, phone }, { onConflict: "id" });
    }

    // Generate magic link token
    const { data: linkData, error: linkErr } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: fakeEmail,
      });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("generateLink error:", linkErr);
      return new Response(
        JSON.stringify({
          error: `인증 토큰 생성 실패: ${linkErr?.message ?? "unknown"}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        token_hash: linkData.properties.hashed_token,
        user_id: userId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("verify-phone-otp error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
