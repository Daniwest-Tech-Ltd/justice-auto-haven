import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const RELATED = [
  'car_activity_logs',
  'car_comments',
  'car_expenses',
  'car_inquiries',
  'car_likes',
  'car_ratings',
  'featured_cars',
  'reviews',
  'vehicle_views',
  'view_tracking',
  'wishlist',
  'test_drive_bookings',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    let days = 60
    let dryRun = false
    try {
      const body = await req.json()
      if (typeof body?.days === 'number' && body.days > 0 && body.days < 3650) days = body.days
      dryRun = body?.dry_run === true
    } catch (_) { /* no body */ }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: cars, error: carsErr } = await admin
      .from('cars')
      .select('id')
      .lt('created_at', cutoff)
    if (carsErr) return json({ error: carsErr.message }, 500)

    let ids = (cars ?? []).map((c: { id: string }) => c.id)

    // Never delete vehicles that are referenced by financial / operational records
    const PROTECTED: [string, string][] = [
      ['sales', 'car_id'],
      ['sales_receipts', 'car_id'],
      ['customer_documents', 'car_id'],
      ['customer_orders', 'car_id'],
      ['job_cards', 'vehicle_id'],
    ]
    const keep = new Set<string>()
    for (const [table, col] of PROTECTED) {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100)
        const { data } = await admin.from(table).select(col).in(col, chunk)
        for (const row of data ?? []) {
          const v = (row as Record<string, string | null>)[col]
          if (v) keep.add(v)
        }
      }
    }
    const skipped = ids.filter((id) => keep.has(id)).length
    ids = ids.filter((id) => !keep.has(id))
    if (ids.length === 0) return json({ deleted_cars: 0, deleted_files: 0, cutoff })

    const idSet = new Set(ids)

    // Collect storage paths: root files named "<carId>_..." and folders "<carId>/..."
    const paths: string[] = []
    const listAll = async (prefix: string) => {
      const out: { name: string; id: string | null }[] = []
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await admin.storage
          .from('car-images')
          .list(prefix, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
        if (error) throw new Error(error.message)
        if (!data || data.length === 0) break
        out.push(...(data as { name: string; id: string | null }[]))
        if (data.length < 1000) break
      }
      return out
    }

    for (const entry of await listAll('')) {
      if (entry.id === null) {
        if (idSet.has(entry.name)) {
          for (const child of await listAll(entry.name)) {
            if (child.id !== null) paths.push(`${entry.name}/${child.name}`)
          }
        }
      } else if (idSet.has(entry.name.split('_')[0])) {
        paths.push(entry.name)
      }
    }

    if (dryRun) return json({ cutoff, cars: ids.length, skipped_protected: skipped, files: paths.length, dry_run: true })

    let deletedFiles = 0
    const fileErrors: string[] = []
    for (let i = 0; i < paths.length; i += 200) {
      const batch = paths.slice(i, i + 200)
      const { data, error } = await admin.storage.from('car-images').remove(batch)
      if (error) fileErrors.push(error.message)
      else deletedFiles += data?.length ?? 0
    }

    const rowCounts: Record<string, number> = {}
    for (const table of RELATED) {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100)
        const { error, count } = await admin
          .from(table)
          .delete({ count: 'exact' })
          .in('car_id', chunk)
        if (!error) rowCounts[table] = (rowCounts[table] ?? 0) + (count ?? 0)
      }
    }

    let deletedCars = 0
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const { error, count } = await admin.from('cars').delete({ count: 'exact' }).in('id', chunk)
      if (error) return json({ error: error.message, deleted_files: deletedFiles }, 500)
      deletedCars += count ?? 0
    }

    return json({ cutoff, deleted_cars: deletedCars, skipped_protected: skipped, deleted_files: deletedFiles, related: rowCounts, file_errors: fileErrors.slice(0, 3) })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
