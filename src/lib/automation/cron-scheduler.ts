import { supabase } from '@/lib/supabase';
import { calcularFunil, somarVendas, calcularProjecao, calcularAtingimento, getDiasInfo } from '../calculations';
import { getMatinalEmailTemplate } from './email/templates/matinal';
import { sendEmailReport } from './email/sender';
import { generateMorningReportXlsx, type MorningReportXlsxRow } from './reports/xlsx-generator';
import { calculateReferenceDate } from '@/hooks/useCheckins';
import { format, parseISO } from 'date-fns';
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

export async function runMatinalWorkflow() {
    console.log('🚀 Iniciando Ciclo Matinal MX (v2)...');

    const referenceDate = calculateReferenceDate();
    const dateLabel = format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR });
    const daysInfo = getDiasInfo(referenceDate);

    // 1. Buscar lojas e suas regras
    const { data: lojas } = await supabase
        .from('lojas')
        .select('*, regras_entrega_loja(*), regras_metas_loja(*)');

    if (!lojas) return;

    for (const store of lojas) {
        console.log(`\n- Processando Loja: ${store.name}`);

        // 2. Buscar dados do mês para esta loja
        const monthStart = format(parseISO(referenceDate), 'yyyy-MM-01')
        let monthCheckins: DailyCheckin[] | null = null
        if (isLancamentosViaRpcEnabled()) {
            const { data } = await supabase.rpc('get_lancamentos_por_loja_periodo', {
                p_store_id: store.id,
                p_start_date: monthStart,
                p_end_date: referenceDate,
                p_scope: 'daily',
            })
            monthCheckins = (data as DailyCheckin[] | null) || []
        } else {
            const { data } = await supabase
                .from('lancamentos_diarios')
                .select('*')
                .eq('store_id', store.id)
                .gte('reference_date', monthStart);
            monthCheckins = data as DailyCheckin[] | null
        }

        if (!monthCheckins) continue;

        // 3. Buscar vendedores
        const { data: members } = await supabase
            .from('vinculos_loja')
            .select('user_id, users:usuarios(name)')
            .eq('store_id', store.id)
            .eq('role', 'vendedor');

        if (!members) continue;

        const ranking: MorningReportXlsxRow[] = [];
        const pendingSellers: string[] = [];

        for (const member of members) {
            const sellerCheckins = (monthCheckins as DailyCheckin[]).filter(c => c.seller_user_id === member.user_id);
            const yesterdayCheckin = sellerCheckins.find(c => c.reference_date === referenceDate);
            const sellerName = getRelationUserName(member.users);
            
            if (!yesterdayCheckin) {
                pendingSellers.push(sellerName);
            }

            const sellerFunnel = calcularFunil(sellerCheckins);
            const totalSales = somarVendas(sellerCheckins);

            ranking.push({
                user_id: member.user_id,
                user_name: sellerName,
                leads: sellerFunnel.leads,
                agd_total: sellerFunnel.agd_total,
                visitas: sellerFunnel.visitas,
                vnd_total: totalSales,
                vnd_yesterday: yesterdayCheckin ? (yesterdayCheckin.vnd_porta_prev_day || 0) + (yesterdayCheckin.vnd_cart_prev_day || 0) + (yesterdayCheckin.vnd_net_prev_day || 0) : 0,
                atingimento: sellerFunnel.vnd_total > 0 ? 100 : 0 // Placeholder simplificado
            });
        }

        const storeSales = somarVendas(monthCheckins as DailyCheckin[]);
        const metaRules = firstRelation(store.regras_metas_loja);
        const deliveryRules = firstRelation(store.regras_entrega_loja);
        const storeGoal = metaRules?.monthly_goal || 0;
        
        const metrics = {
            currentSales: storeSales,
            teamGoal: storeGoal,
            projection: calcularProjecao(storeSales, daysInfo.decorridos, daysInfo.total),
            reaching: calcularAtingimento(storeSales, storeGoal),
            gap: Math.max(0, storeGoal - storeSales),
            pendingSellers
        };

        // 4. Gerar XLSX e Enviar E-mail
        const recipients = deliveryRules?.matinal_recipients;

        if (recipients && recipients.length > 0) {
            try {
                const xlsxBuffer = await generateMorningReportXlsx(store.name, dateLabel, ranking);
                const html = getMatinalEmailTemplate(store.name, dateLabel, metrics, ranking);
                
                await sendEmailReport(
                    recipients, 
                    `📊 Matinal: ${store.name} - Tendência: ${metrics.projection} carros`, 
                    html, 
                    xlsxBuffer
                );
                console.log(`  ✅ Matinal enviado para ${recipients.join(', ')}`);
            } catch (e) {
                console.error(`  ❌ Falha no envio:`, e);
            }
        }
    }

    console.log('\n✨ Ciclo Matinal Finalizado.');
}
