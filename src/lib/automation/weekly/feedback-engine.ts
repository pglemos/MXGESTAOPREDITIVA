import { supabase } from '@/lib/supabase';
import { calcularFunil, gerarDiagnosticoMX, formatStructuredWhatsAppFeedback } from '../../calculations';
import { getWeeklyFeedbackEmailTemplate, type WeeklyFeedbackEmailRow } from '../email/templates/weekly-feedback';
import { sendEmailReport } from '../email/sender';
import { startOfWeek, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailyCheckin } from '@/types/database';
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags';

type NamedUserRelation = { name?: string | null } | { name?: string | null }[] | null | undefined;

function getRelationUserName(users: NamedUserRelation, fallback = 'Vendedor') {
    const user = Array.isArray(users) ? users[0] : users;
    return user?.name || fallback;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
    return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function runWeeklyFeedbackWorkflow() {
    console.log('🚀 Iniciando Ciclo de Devolutiva Semanal MX...');

    // 1. Período: Semana Anterior Fechada
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
    const end = startOfWeek(now, { weekStartsOn: 1 }); // Até o início desta semana
    
    const dateRangeLabel = `${format(start, 'dd/MM', { locale: ptBR })} a ${format(end, 'dd/MM', { locale: ptBR })}`;
    const startKey = format(start, 'yyyy-MM-dd');

    // 2. Buscar lojas e suas regras de entrega
    const { data: lojas, error: storeErr } = await supabase
        .from('lojas')
        .select('*, regras_entrega_loja(*), regras_metas_loja(*)');

    if (storeErr || !lojas) {
        console.error('❌ Erro ao buscar lojas:', storeErr);
        return;
    }

    for (const store of lojas) {
        console.log(`\n- Processando Loja: ${store.name}`);
        
        // 3. Buscar checkins da semana para esta loja
        let checkins: DailyCheckin[] | null = null
        if (isLancamentosViaRpcEnabled()) {
            // RPC usa BETWEEN inclusivo; replicamos limite exclusivo subtraindo 1 dia
            const endExclusive = new Date(now); endExclusive.setDate(endExclusive.getDate() - 1)
            const { data } = await supabase.rpc('get_lancamentos_por_loja_periodo', {
                p_store_id: store.id,
                p_start_date: startKey,
                p_end_date: format(endExclusive, 'yyyy-MM-dd'),
                p_scope: 'daily',
            })
            checkins = (data as DailyCheckin[] | null) || []
        } else {
            const { data } = await supabase
                .from('lancamentos_diarios')
                .select('*')
                .eq('store_id', store.id)
                .gte('reference_date', startKey)
                .lt('reference_date', format(now, 'yyyy-MM-dd'));
            checkins = data as DailyCheckin[] | null
        }

        if (!checkins || checkins.length === 0) {
            console.warn(`  ⚠️ Nenhum checkin localizado para ${store.name}.`);
            continue;
        }

        // 4. Buscar vendedores da loja
        const { data: members } = await supabase
            .from('vinculos_loja')
            .select('user_id, users:usuarios(name)')
            .eq('store_id', store.id)
            .eq('role', 'vendedor');

        if (!members) continue;

        const feedbackData: WeeklyFeedbackEmailRow[] = [];

        for (const member of members) {
            const sellerCheckins = (checkins as DailyCheckin[]).filter(c => c.seller_user_id === member.user_id);
            const funnel = calcularFunil(sellerCheckins);
            const diag = gerarDiagnosticoMX(funnel);
            const sellerName = getRelationUserName(member.users);
            
            // Gerar texto do WhatsApp seguindo o novo padrão
            const whatsappText = formatStructuredWhatsAppFeedback({
                sellerName,
                metrics: funnel,
                diagnostic: diag,
                actions: [diag.sugestao],
                periodLabel: dateRangeLabel
            });

            feedbackData.push({
                seller_id: member.user_id,
                seller_name: sellerName,
                leads: funnel.leads,
                vnd: funnel.vnd_total,
                whatsapp_text: whatsappText
            });
        }

        // 5. Enviar E-mail Consolidado para o Gerente/Dono
        const deliveryRules = firstRelation(store.regras_entrega_loja);
        const recipients = deliveryRules?.weekly_recipients;
        
        if (recipients && recipients.length > 0) {
            try {
                const html = getWeeklyFeedbackEmailTemplate(store.name, dateRangeLabel, feedbackData);
                // Por enquanto sem anexo para simplificar ou gerar um consolidado depois
                await sendEmailReport(recipients, `📊 Devolutiva Semanal: ${store.name}`, html, Buffer.from(''));
                console.log(`  ✅ E-mail enviado para ${recipients.join(', ')}`);
            } catch (e) {
                console.error(`  ❌ Falha no envio:`, e);
            }
        } else {
            console.warn(`  ⚠️ Sem destinatários configurados para ${store.name}.`);
        }
    }

    console.log('\n✨ Ciclo de Devolutiva Finalizado.');
}
