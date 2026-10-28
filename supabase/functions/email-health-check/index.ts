import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, reason: 'RESEND_API_KEY not set' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const body = await res.json();
    // Only report non-sensitive status fields, never the raw body (contains ids).
    const domains = Array.isArray(body?.data)
      ? body.data.map((d: any) => ({ name: d.name, status: d.status }))
      : [];
    return new Response(JSON.stringify({
      ok: res.ok,
      keyValid: res.status !== 401 && res.status !== 403,
      domainCount: domains.length,
      domains,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
