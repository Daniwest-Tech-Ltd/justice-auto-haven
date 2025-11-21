import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's TOTP settings
    const { data: totpData, error: totpError } = await supabase
      .from("user_totp")
      .select("*")
      .eq("user_id", userId)
      .eq("enabled", true)
      .single();

    if (totpError || !totpData) {
      throw new Error("TOTP not enabled for this user");
    }

    // Check if it's a backup code
    const backupCodes = totpData.backup_codes as string[];
    if (backupCodes && backupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      const updatedCodes = backupCodes.filter(c => c !== code.toUpperCase());
      await supabase
        .from("user_totp")
        .update({ backup_codes: updatedCodes })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true, message: "Backup code verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify TOTP code
    const verified = await verifyTOTP(totpData.secret_key, code);

    if (verified) {
      return new Response(
        JSON.stringify({ success: true, message: "TOTP code verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
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
  
  for (let i = -1; i <= 1; i++) {
    const calculatedToken = await generateTOTP(secret, time + i);
    if (calculatedToken === token) {
      return true;
    }
  }
  
  return false;
}

async function generateTOTP(secret: string, time: number): Promise<string> {
  const key = base32Decode(secret);
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBuffer);
  const signatureArray = new Uint8Array(signature);
  
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