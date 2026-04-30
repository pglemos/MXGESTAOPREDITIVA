import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { parseStrictBody, sendFeedbackSchema } from "../_shared/schemas.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { feedbackId } = await parseStrictBody(req, sendFeedbackSchema);

    const { data: f, error: fError } = await supabaseClient
      .from("devolutivas")
      .select("*, seller:usuarios!devolutivas_vendedor_id_fkey(name), manager:usuarios!devolutivas_gerente_id_fkey(name), lojas(name, id)")
      .eq("id", feedbackId)
      .single();

    if (fError || !f) throw new Error("Devolutiva não encontrada");

    const { data: storeMembers, error: mError } = await supabaseClient
      .from("vinculos_loja")
      .select("users:usuarios(email, name)")
      .eq("store_id", f.store_id)
      .in("role", ["gerente", "dono"]);

    const recipients = storeMembers?.map((m: any) => m.users.email).filter(Boolean) || [];
    if (recipients.length === 0) throw new Error("No recipients found for this store");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("Missing RESEND_API_KEY");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #f3f4f6; pb: 10px;">Devolutiva Oficial: ${f.seller.name}</h2>
        <p style="font-size: 14px; color: #6b7280; font-weight: bold;">Referencia: ${f.week_reference}</p>

        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Meta de Compromisso (Vendas)</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: 800; color: #1e293b;">${f.meta_compromisso} Vendas</p>
        </div>

        <h3 style="color: #059669; font-size: 14px; text-transform: uppercase;">Pontos Positivos</h3>
        <p style="background: #ecfdf5; padding: 10px; border-radius: 6px; font-size: 14px; font-style: italic;">"${f.positives}"</p>

        <h3 style="color: #dc2626; font-size: 14px; text-transform: uppercase;">Pontos de Atencao</h3>
        <p style="background: #fef2f2; padding: 10px; border-radius: 6px; font-size: 14px; font-style: italic;">"${f.attention_points}"</p>

        <h3 style="color: #4f46e5; font-size: 14px; text-transform: uppercase;">Plano de Acao</h3>
        <p style="background: #f5f3ff; padding: 10px; border-radius: 6px; font-size: 14px; font-weight: bold;">${f.action}</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 10px; color: #94a3b8;">
          <p>Enviado por: ${f.manager.name} &bull; Unidade: ${f.lojas.name}</p>
          <p>Sistema MX PERFORMANCE SaaS</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `MX PERFORMANCE <${Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@mxperformance.com.br"}>`,
        to: recipients,
        subject: `[Devolutiva MX] Auditoria de Performance: ${f.seller.name}`,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Resend API Error: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao processar envio." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
