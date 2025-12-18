import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      order_id,
      amount, 
      currency = 'KES',
      description,
      customer_name,
      customer_email,
      customer_phone,
      callback_url,
      user_id
    } = await req.json();

    console.log('Initiating Pesapal payment:', { amount, currency, customer_email });

    // Get Pesapal access token
    const token = await getAccessToken();
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Failed to authenticate with Pesapal' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Register IPN URL (idempotent operation)
    const ipnId = await registerIPN(token);
    if (!ipnId) {
      console.warn('Could not register IPN, continuing without IPN');
    }

    // Generate unique merchant reference
    const merchantReference = `JUA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id,
        user_id,
        amount,
        currency,
        payment_method: 'pesapal',
        status: 'pending',
        pesapal_merchant_reference: merchantReference,
        description,
        customer_name,
        customer_email,
        customer_phone
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare Pesapal order request
    const orderRequest = {
      id: merchantReference,
      currency,
      amount,
      description: description || `Payment for Order ${order_id || merchantReference}`,
      callback_url: callback_url || `https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/pesapal-ipn`,
      notification_id: ipnId,
      billing_address: {
        email_address: customer_email,
        phone_number: customer_phone,
        first_name: customer_name?.split(' ')[0] || 'Customer',
        last_name: customer_name?.split(' ').slice(1).join(' ') || ''
      }
    };

    console.log('Submitting order to Pesapal:', orderRequest);

    // Submit order to Pesapal
    const orderResponse = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderRequest)
    });

    const orderData = await orderResponse.json();
    console.log('Pesapal order response:', orderData);

    if (orderData.error) {
      // Update payment status to failed
      await supabase.from('payments').update({ 
        status: 'failed',
        metadata: { error: orderData.error }
      }).eq('id', payment.id);

      return new Response(JSON.stringify({ 
        error: orderData.error.message || 'Failed to create Pesapal order' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update payment with Pesapal tracking ID
    await supabase.from('payments').update({
      pesapal_order_tracking_id: orderData.order_tracking_id,
      metadata: { pesapal_order_response: orderData }
    }).eq('id', payment.id);

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      merchant_reference: merchantReference,
      order_tracking_id: orderData.order_tracking_id,
      redirect_url: orderData.redirect_url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Payment initiation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getAccessToken(): Promise<string | null> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');

  if (!consumerKey || !consumerSecret) {
    console.error('Pesapal credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      })
    });

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

async function registerIPN(token: string): Promise<string | null> {
  try {
    // First check for existing IPN registrations
    const listResponse = await fetch('https://pay.pesapal.com/v3/api/URLSetup/GetIpnList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const ipnList = await listResponse.json();
    const ipnUrl = 'https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/pesapal-ipn';
    
    // Check if our IPN is already registered
    if (Array.isArray(ipnList)) {
      const existing = ipnList.find((ipn: any) => ipn.url === ipnUrl);
      if (existing) {
        console.log('Using existing IPN registration:', existing.ipn_id);
        return existing.ipn_id;
      }
    }

    // Register new IPN
    const registerResponse = await fetch('https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'POST'
      })
    });

    const registerData = await registerResponse.json();
    console.log('IPN registration response:', registerData);
    
    return registerData.ipn_id || null;
  } catch (error) {
    console.error('Error registering IPN:', error);
    return null;
  }
}