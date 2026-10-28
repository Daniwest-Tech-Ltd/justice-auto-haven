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
    const result: Record<string, unknown> = {
      ok: res.ok,
      keyValid: res.status !== 401 && res.status !== 403,
      domainCount: domains.length,
      domains,
      records,
    };

    // Optional test send: only when the caller explicitly asks for it.
    let payload: any = null;
    try { payload = await req.json(); } catch { /* no body */ }
    if (payload?.test_to && typeof payload.test_to === 'string' && payload.test_to.includes('@')) {
      const sres = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>',
          to: [payload.test_to],
          subject: 'Test email — new Resend SMTP check',
          html: '<p>This is a test email confirming the new Resend account is sending for Justice Ultimate Automobiles.</p>',
        }),
      });
      const sbody = await sres.json();
      result.testSend = {
        status: sres.status,
        accepted: sres.ok,
        // Never surface error bodies verbatim; they can contain ids. Status only.
        errorType: sres.ok ? null : (sbody?.name ?? 'unknown'),
      };
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
