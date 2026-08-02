import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { postgres } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

const NEON_CONNECTION_STRING = Deno.env.get('NEON_DATABASE_URL')!

serve(async (req) => {
  try {
    const { table, data, action } = await req.json()
    const client = new postgres.Client(NEON_CONNECTION_STRING)
    await client.connect()

    let query = ""
    let params: any[] = []

    if (action === 'INSERT') {
      const keys = Object.keys(data)
      const values = Object.values(data)
      query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(', ')})`
      params = values
    } else if (action === 'UPDATE') {
      const keys = Object.keys(data).filter(k => k !== 'id')
      const values = keys.map(k => data[k])
      query = `UPDATE ${table} SET ${keys.map((k, i) => k + ' = $' + (i + 1)).join(', ')} WHERE id = $${keys.length + 1}`
      params = [...values, data.id]
    } else if (action === 'DELETE') {
      query = `DELETE FROM ${table} WHERE id = $1`
      params = [data.id]
    }

    await client.queryArray(query, params)
    await client.end()

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
