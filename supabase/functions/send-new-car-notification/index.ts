import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CarNotificationRequest {
  carId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  stockId: string;
  imageUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const carData: CarNotificationRequest = await req.json();
    console.log("Received car notification request:", carData);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check API key - if not configured, return success anyway (non-blocking)
    const apiKey = Deno.env.get("APIWAP_API_KEY");
    if (!apiKey) {
      console.log("APIWAP_API_KEY not configured - skipping WhatsApp notifications");
      return new Response(
        JSON.stringify({ success: true, message: "Notifications skipped - API not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format price in KSh
    const formattedPrice = new Intl.NumberFormat("en-KE").format(carData.price);

    // Build the message
    const message = `🚗 *NEW ARRIVAL at Justice Ultimate Automobiles!*

🔥 *${carData.year} ${carData.make} ${carData.model}*

💰 Price: *KSh ${formattedPrice}*
🏷️ Stock ID: ${carData.stockId}

✅ Quality Assured
✅ Financing Available
✅ Trade-ins Welcome

👉 View Details: https://justiceultimateautomobiles.com/cars/${carData.carId}

📞 Contact Us:
Justice Vincent: 0722827458
Daniel Maina: 0701460110

🌐 www.justiceultimateautomobiles.com`;

    // Get all customer profiles with phone numbers and country codes (active accounts)
    const { data: customers, error: customersError } = await supabase
      .from("profiles")
      .select("phone, full_name, user_id, country_code")
      .eq("account_status", "active")
      .not("phone", "is", null);

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch customers" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${customers?.length || 0} customers to notify`);

    let successCount = 0;
    let failCount = 0;

    // Phone formatting helper function (uses stored country code)
    const formatPhoneNumber = (phone: string, countryCode: string): string => {
      let cleaned = phone.toString().replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      // Remove any existing country code prefix
      const codeDigits = countryCode.replace(/\D/g, '');
      if (cleaned.startsWith(codeDigits)) cleaned = cleaned.substring(codeDigits.length);
      if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
      return countryCode + cleaned;
    };

    // Validate phone number (allow 7-12 digits for various African countries)
    const validatePhone = (phone: string): boolean => {
      let cleaned = phone.toString().replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
      return cleaned.length >= 7 && cleaned.length <= 12;
    };

    // Send to each customer
    for (const customer of customers || []) {
      if (!customer.phone) continue;

      // Validate phone number
      if (!validatePhone(customer.phone)) {
        console.log(`Invalid phone format for customer, skipping: ${customer.phone}`);
        continue;
      }

      // Use stored country code or default to +254
      const customerCountryCode = customer.country_code || '+254';
      const formattedPhone = formatPhoneNumber(customer.phone, customerCountryCode);

      try {
        const response = await fetch("https://api.apiwap.com/api/v1/whatsapp/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            message: message,
            type: "text",
          }),
        });

        if (response.ok) {
          successCount++;
          console.log(`Message sent to ${formattedPhone}`);
        } else {
          failCount++;
          console.error(`Failed to send to ${formattedPhone}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        failCount++;
        console.error(`Error sending to ${formattedPhone}:`, err);
      }
    }

    // Log the notification
    await supabase.from("audit_logs").insert({
      action: "new_car_whatsapp_notification",
      metadata: {
        car_id: carData.carId,
        stock_id: carData.stockId,
        make: carData.make,
        model: carData.model,
        success_count: successCount,
        fail_count: failCount,
      },
    });

    console.log(`Notification complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount} customers`,
        successCount,
        failCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-new-car-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
