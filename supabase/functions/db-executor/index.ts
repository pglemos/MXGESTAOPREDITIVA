import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import postgres from 'https://deno.land/x/postgresjs@v3.3.3/mod.js'

const DB_URL = Deno.env.get("DB_URL") // Connection string (postgres://...)

serve(async (req) => {
  const { sql } = await req.json()
  const sql_client = postgres(DB_URL!)

  try {
    const result = await sql_client.unsafe(sql)
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  } finally {
    await sql_client.end()
  }
})
