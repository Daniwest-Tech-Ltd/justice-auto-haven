import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Handle GET request (Pesapal redirect callback)
    if (req.method === 'GET') {
      const OrderTrackingId = url.searchParams.get('OrderTrackingId');
      const OrderMerchantReference = url.searchParams.get('OrderMerchantReference');
      
      console.log('IPN GET callback received:', { OrderTrackingId, OrderMerchantReference });

      // Log the callback
      await supabase.from('payment_ipn_logs').insert({
        payload: { OrderTrackingId, OrderMerchantReference, method: 'GET' },
        ip_address: ipAddress,
        pesapal_tracking_id: OrderTrackingId,
        pesapal_notification_type: 'callback',
        status: 'received'
      });

      if (OrderTrackingId) {
        // Query Pesapal for transaction status
        const statusResult = await queryPesapalStatus(OrderTrackingId);
        
        if (statusResult.success) {
          // Update payment status
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              status: mapPesapalStatus(statusResult.status_code),
              pesapal_tracking_id: OrderTrackingId,
              completed_at: statusResult.status_code === 1 ? new Date().toISOString() : null,
              metadata: { pesapal_response: statusResult }
            })
            .eq('pesapal_merchant_reference', OrderMerchantReference);

          if (updateError) {
            console.error('Error updating payment:', updateError);
          }
        }
      }

      // Redirect to payment status page
      const redirectUrl = `https://justiceultimateautomobiles.com/payment-status?ref=${OrderMerchantReference}&tracking=${OrderTrackingId}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }

    // Handle POST request (Pesapal IPN notification)
    if (req.method === 'POST') {
      let payload: any;
      
      try {
        payload = await req.json();
      } catch {
        // Try URL encoded
        const text = await req.text();
        payload = Object.fromEntries(new URLSearchParams(text));
      }

      console.log('IPN POST notification received:', payload);

      const OrderTrackingId = payload.OrderTrackingId || payload.orderTrackingId;
      const OrderMerchantReference = payload.OrderMerchantReference || payload.orderMerchantReference;
      const OrderNotificationType = payload.OrderNotificationType || payload.orderNotificationType;

      // Log the IPN
      const { data: ipnLog, error: logError } = await supabase.from('payment_ipn_logs').insert({
        payload,
        ip_address: ipAddress,
        pesapal_tracking_id: OrderTrackingId,
        pesapal_notification_type: OrderNotificationType,
        status: 'received'
      }).select().single();

      if (logError) {
        console.error('Error logging IPN:', logError);
      }

      // Check for duplicate processing
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('pesapal_tracking_id', OrderTrackingId)
        .eq('status', 'completed')
        .single();

      if (existingPayment) {
        console.log('Payment already processed:', OrderTrackingId);
        
        // Update IPN log
        if (ipnLog) {
          await supabase.from('payment_ipn_logs').update({
            status: 'duplicate',
            processed_at: new Date().toISOString()
          }).eq('id', ipnLog.id);
        }

        return new Response(JSON.stringify({ 
          status: 'ok',
          message: 'Already processed' 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Query Pesapal for transaction status
      const statusResult = await queryPesapalStatus(OrderTrackingId);
      
      if (statusResult.success) {
        const newStatus = mapPesapalStatus(statusResult.status_code);
        
        // Update payment status
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: newStatus,
            pesapal_tracking_id: OrderTrackingId,
            completed_at: statusResult.status_code === 1 ? new Date().toISOString() : null,
            metadata: { pesapal_response: statusResult }
          })
          .eq('pesapal_merchant_reference', OrderMerchantReference);

        if (updateError) {
          console.error('Error updating payment:', updateError);
        }

        // Update order status if payment completed
        if (newStatus === 'completed') {
          const { data: payment } = await supabase
            .from('payments')
            .select('order_id')
            .eq('pesapal_merchant_reference', OrderMerchantReference)
            .single();

          if (payment?.order_id) {
            await supabase
              .from('whitelist_orders')
              .update({ status: 'paid' })
              .eq('id', payment.order_id);
          }
        }

        // Update IPN log
        if (ipnLog) {
          await supabase.from('payment_ipn_logs').update({
            status: 'processed',
            processed_at: new Date().toISOString()
          }).eq('id', ipnLog.id);
        }
      } else {
        // Update IPN log with error
        if (ipnLog) {
          await supabase.from('payment_ipn_logs').update({
            status: 'error',
            error_message: statusResult.error,
            processed_at: new Date().toISOString()
          }).eq('id', ipnLog.id);
        }
      }

      return new Response(JSON.stringify({ 
        status: 'ok',
        orderTrackingId: OrderTrackingId
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('IPN Error:', error);
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

async function queryPesapalStatus(orderTrackingId: string): Promise<any> {
  const token = await getAccessToken();
  
  if (!token) {
    return { success: false, error: 'Failed to get access token' };
  }

  try {
    const response = await fetch(
      `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    return { success: true, ...data };
  } catch (error: unknown) {
    console.error('Error querying Pesapal status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function mapPesapalStatus(statusCode: number): string {
  switch (statusCode) {
    case 0: return 'pending';
    case 1: return 'completed';
    case 2: return 'failed';
    case 3: return 'reversed';
    default: return 'pending';
  }
}