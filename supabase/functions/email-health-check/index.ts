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
    const domainId: string | undefined = body?.data?.[0]?.id;
    let records: any = null;
    if (domainId) {
      const dres = await fetch(`https://api.resend.com/domains/${domainId}`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      });
      const dbody = await dres.json();
      records = Array.isArray(dbody?.records)
        ? dbody.records.map((r: any) => ({
            name: r.name, type: r.type, status: r.status,
            // DKIM/SPF record values are public DNS entries, safe to show.
            value: String(r.value ?? '').slice(0, 120),
          }))
        : null;
    }
    return new Response(JSON.stringify({
      ok: res.ok,
      keyValid: res.status !== 401 && res.status !== 403,
      domainCount: domains.length,
      domains,
      records,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
