import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { postgres } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

const NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_tXVWfuM0vDK7@ep-super-violet-aymja3fh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { table, schema, record, old_record, type } = payload

    const client = new postgres.Client(NEON_CONNECTION_STRING)
    await client.connect()

    if (type === 'INSERT') {
      const keys = Object.keys(record)
      const values = Object.values(record)
      const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(', ')})`
      await client.queryArray(query, values)
    } else if (type === 'UPDATE') {
      const keys = Object.keys(record).filter(k => k !== 'id')
      const values = keys.map(k => record[k])
      const query = `UPDATE ${table} SET ${keys.map((k, i) => k + ' = $' + (i + 1)).join(', ')} WHERE id = $${keys.length + 1}`
      await client.queryArray(query, [...values, record.id])
    } else if (type === 'DELETE') {
      await client.queryArray(`DELETE FROM ${table} WHERE id = $1`, [old_record.id])
    }

    await client.end()
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    console.error("Mirror Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
