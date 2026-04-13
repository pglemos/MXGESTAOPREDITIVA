import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") // callback da function
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state") // Contém user_id ou redirecionamento original

  if (!code) {
    return new Response(JSON.stringify({ error: "No code provided" }), { status: 400 })
  }

  try {
    // 1. Trocar código por tokens no Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()
    if (tokens.error) throw new Error(tokens.error_description || tokens.error)

    // 2. Inicializar Supabase Admin Client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 3. Salvar tokens (associar ao usuário logado via state ou via JWT se o callback permitir)
    // Para simplificar no MVP, assumimos que o state contém o user_id
    const userId = state 

    const { error } = await supabase
      .from("consulting_oauth_tokens")
      .upsert({
        user_id: userId,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: tokens.scope?.split(" "),
      })

    if (error) throw error

    return new Response("Agenda conectada com sucesso! Você pode fechar esta aba.", {
      headers: { "Content-Type": "text/html" },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
