import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { visitId } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Buscar dados da visita e cliente
    const { data: visit, error: visitError } = await supabase
      .from('visitas_consultoria')
      .select('*, client:clientes_consultoria(*)')
      .eq('id', visitId)
      .single()

    if (visitError || !visit) throw new Error('Visita não encontrada')

    // 2. Buscar contatos do cliente (para enviar o e-mail)
    const { data: contacts } = await supabase
      .from('consulting_client_contacts')
      .select('email')
      .eq('client_id', visit.client_id)
      .eq('is_primary', true)

    const recipientEmails = contacts?.map(c => c.email).filter(Boolean) || []
    if (recipientEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum contato primário com e-mail encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 3. Template HTML simplificado (enquanto não geramos PDF no server)
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #0D3B2E;">Relatório de Visita MX Performance</h2>
        <p>Olá, o relatório da <strong>Visita ${visit.visit_number}</strong> para a loja <strong>${visit.client.name}</strong> já está disponível.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>Resumo Executivo:</strong></p>
        <blockquote style="font-style: italic; color: #666;">${visit.executive_summary || 'Nenhum relato inserido.'}</blockquote>
        <p><strong>Status:</strong> ${visit.status.toUpperCase()}</p>
        <p><strong>Data:</strong> ${new Date(visit.effective_visit_date || visit.scheduled_at).toLocaleDateString('pt-BR')}</p>
        <br />
        <a href="https://mxperformance.vercel.app/consultoria/clientes/${visit.client.slug}/visitas/${visit.visit_number}" 
           style="background-color: #0D3B2E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          VER RELATÓRIO COMPLETO NO CRM
        </a>
        <p style="font-size: 10px; color: #999; margin-top: 40px;">Este é um e-mail automático. Não responda.</p>
      </div>
    `

    // 4. Enviar via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MX PERFORMANCE <consultoria@mxgestaopreditiva.com.br>',
        to: recipientEmails,
        subject: `📍 Relatório de Visita: ${visit.client.name} (Visita ${visit.visit_number})`,
        html,
      }),
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
