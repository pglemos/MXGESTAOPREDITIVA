const functionName = 'store-pre-registration'
const timeoutMs = 18_000

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
    },
  })
}

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.VITE_PUBLIC_SUPABASE_URL ||
    ''
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    supabaseAnonKey,
  }
}

async function proxyStorePreRegistration(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store',
      },
    })
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ success: false, error: 'Public registration proxy is misconfigured' }, 500)
  }

  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL(`${supabaseUrl}/functions/v1/${functionName}`)
  incomingUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        Accept: 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        ...(request.method === 'POST' ? { 'Content-Type': request.headers.get('content-type') || 'application/json' } : {}),
      },
      body: request.method === 'POST' ? await request.text() : undefined,
      signal: controller.signal,
    })
    const body = await upstreamResponse.text()

    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError'
    return jsonResponse({
      success: false,
      error: timedOut
        ? 'A conexão com o cadastro demorou mais que o esperado. Tente novamente.'
        : 'Não foi possível conectar ao cadastro da loja. Tente novamente.',
    }, 504)
  } finally {
    clearTimeout(timeout)
  }
}

export default {
  fetch: proxyStorePreRegistration,
}
