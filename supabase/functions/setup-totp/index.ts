import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random base32 secret
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < array.length; i++) {
    secret += chars[array[i] % chars.length];
  }
  return secret;
}

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 8)
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const { action } = body;

    if (action === "generate") {
      // Generate new TOTP secret
      const secret = generateSecret();
      const backupCodes = generateBackupCodes();

      // Store in database
      const { error: insertError } = await supabase
        .from("user_totp")
        .upsert({
          user_id: user.id,
          secret_key: secret,
          backup_codes: backupCodes,
          enabled: false,
        }, { onConflict: 'user_id' });

      if (insertError) throw insertError;

      // Get user email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .single();

      const email = profile?.email || user.email;

      // Generate otpauth URL
      const otpauthUrl = `otpauth://totp/Justice Ultimate Automobiles:${email}?secret=${secret}&issuer=Justice Ultimate Automobiles`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          secret,
          otpauthUrl,
          backupCodes 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "verify") {
      // Verify TOTP code
      const { code } = body;

      const { data: totpData, error: totpError } = await supabase
        .from("user_totp")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (totpError || !totpData) {
        throw new Error("TOTP not set up");
      }

      // Simple TOTP verification (30-second window)
      const verified = await verifyTOTP(totpData.secret_key, code);

      if (verified) {
        // Enable TOTP
        await supabase
          .from("user_totp")
          .update({ enabled: true })
          .eq("user_id", user.id);

        await supabase
          .from("profiles")
          .update({ 
            two_fa_enabled: true,
            preferred_2fa: 'totp'
          })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, message: "TOTP enabled successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else if (action === "disable") {
      // Disable TOTP
      await supabase
        .from("user_totp")
        .delete()
        .eq("user_id", user.id);

      await supabase
        .from("profiles")
        .update({ 
          two_fa_enabled: false,
          preferred_2fa: 'email_otp'
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, message: "TOTP disabled successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000 / 30);
  
  // Check current time window and adjacent windows
  for (let i = -1; i <= 1; i++) {
    const calculatedToken = await generateTOTP(secret, time + i);
    if (calculatedToken === token) {
      return true;
    }
  }
  
  return false;
}

async function generateTOTP(secret: string, time: number): Promise<string> {
  // Decode base32 secret
  const key = base32Decode(secret);
  
  // Create time buffer
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);
  
  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  // Generate HMAC
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBuffer);
  const signatureArray = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = signatureArray[signatureArray.length - 1] & 0x0f;
  const binary = 
    ((signatureArray[offset] & 0x7f) << 24) |
    ((signatureArray[offset + 1] & 0xff) << 16) |
    ((signatureArray[offset + 2] & 0xff) << 8) |
    (signatureArray[offset + 3] & 0xff);
  
  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  encoded = encoded.toUpperCase().replace(/=+$/, '');
  
  const bits: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    const val = alphabet.indexOf(encoded[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    
    for (let j = 4; j >= 0; j--) {
      bits.push((val >> j) & 1);
    }
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  
  return new Uint8Array(bytes);
}