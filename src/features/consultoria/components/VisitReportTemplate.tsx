import React from 'react'
import { ConsultingClientDetail, ConsultingVisit } from '@/features/consultoria/types'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STORAGE_URL = 'https://fbhcmzzgwjdgkctlfvbo.supabase.co/storage/v1/object/public/consulting-attachments/'

interface Props {
  client: ConsultingClientDetail
  visit: ConsultingVisit
  headerBase: any
  quantData?: any
}

export function VisitReportTemplate({ client, visit, headerBase, quantData }: Props) {
  const visitDateRaw = headerBase.visit_date || visit.scheduled_at || new Date().toISOString()
  const visitDate = new Date(visitDateRaw)
  const attachments = (visit as any).attachments || []
  
  const formattedDate = !isNaN(visitDate.getTime()) 
    ? format(visitDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Data não informada'

  return (
    <div className="bg-white p-mx-xl w-[210mm] min-h-[297mm] mx-auto text-black font-sans print:p-0">
      {/* Header com Logo */}
      <header className="flex justify-between items-start border-b-2 border-[#0D3B2E] pb-mx-sm mb-mx-md">
        <div>
          <img src="/mx-logo.png" alt="MX Performance" className="h-mx-12 mb-mx-xs" />
          <Typography variant="tiny" className="text-[#0D3B2E] font-black tracking-widest uppercase">
            Sistema de Gestão de Alta Performance
          </Typography>
        </div>
        <div className="text-right">
          <Typography variant="h3" className="text-[#0D3B2E]">RELATÓRIO DE AUDITORIA</Typography>
          <Badge className="bg-[#0D3B2E] text-white border-none px-mx-sm py-1 rounded-mx-full font-bold">
            VISITA {visit.visit_number}
          </Badge>
        </div>
      </header>

      {/* Dados do Cliente */}
      <section className="grid grid-cols-2 gap-mx-lg mb-mx-md bg-[#f9fafb] p-mx-md rounded-mx-xl border border-border-default text-black">
        <div>
          <Typography variant="tiny" className="text-text-tertiary font-bold uppercase mb-1">Cliente / Loja</Typography>
          <Typography variant="h2" className="text-xl font-black text-black">{client.name.toUpperCase()}</Typography>
          <Typography variant="p" className="text-sm text-black">{client.legal_name || 'Razão Social não informada'}</Typography>
        </div>
        <div className="text-right">
          <Typography variant="tiny" className="text-text-tertiary font-bold uppercase mb-1">Data da Auditoria</Typography>
          <Typography variant="h3" className="text-black">{formattedDate}</Typography>
          <Typography variant="p" className="text-sm text-black">Consultor: {headerBase.consultant_name || 'Consultor MX'}</Typography>
        </div>
      </section>

      {/* Indicadores de Meta */}
      <div className="grid grid-cols-4 gap-mx-sm mb-mx-md">
        {[
          { l: 'Meta Mensal', v: headerBase.meta_mensal },
          { l: 'Projeção', v: headerBase.projecao },
          { l: 'Leads no Mês', v: headerBase.leads_mes },
          { l: 'Estoque', v: headerBase.estoque_disponivel }
        ].map(i => (
          <div key={i.l} className="border border-border-default p-mx-sm rounded-mx-lg text-center text-black bg-white shadow-sm">
            <Typography variant="tiny" className="font-bold text-text-tertiary block mb-1 uppercase">{i.l}</Typography>
            <Typography variant="h3" className="text-[#0D3B2E] font-black">{i.v || '0'}</Typography>
          </div>
        ))}
      </div>

      {/* Resumo Executivo */}
      <section className="mb-mx-md">
        <div className="flex items-center gap-mx-xs mb-mx-sm">
          <div className="w-mx-2 h-mx-6 bg-[#0D3B2E] rounded-mx-full" />
          <Typography variant="h3" className="text-black">Diagnóstico e Relato Executivo</Typography>
        </div>
        <div className="p-mx-md border border-border-default rounded-mx-xl bg-white min-h-[150px] whitespace-pre-wrap text-sm leading-relaxed text-black italic border-dashed">
          {visit.executive_summary || 'Nenhum relato registrado para esta visita.'}
        </div>
      </section>

      {/* Feedback Direto */}
      <section className="mb-mx-md">
        <div className="flex items-center gap-mx-xs mb-mx-sm">
          <div className="w-mx-2 h-mx-6 bg-[#FACC15] rounded-mx-full" />
          <Typography variant="h3" className="text-black">Pontos de Atenção e Feedback</Typography>
        </div>
        <div className="p-mx-md border border-[#FACC15]/30 rounded-mx-xl bg-[#FEFCE8] text-sm leading-relaxed text-black">
          {visit.feedback_client || 'Nenhum feedback direto registrado.'}
        </div>
      </section>

      {/* Objetivo do Próximo Ciclo */}
      <section className="mb-mx-md" style={{ breakInside: 'avoid' }}>
        <div className="flex items-center gap-mx-xs mb-mx-sm">
          <div className="w-mx-2 h-mx-6 bg-[#F59E0B] rounded-mx-full" />
          <Typography variant="h3" className="text-black">Objetivo do Próximo Ciclo (30 dias)</Typography>
        </div>
        <div className="p-mx-md border border-[#F59E0B]/30 rounded-mx-xl bg-[#FFF7ED] text-sm font-bold leading-relaxed text-black">
          {(visit as any).next_cycle_goal || 'A ser definido na próxima auditoria.'}
        </div>
      </section>

      {/* Evidências Fotográficas */}
      {attachments.length > 0 && (
        <section className="mb-mx-md" style={{ breakInside: 'avoid' }}>
          <div className="flex items-center gap-mx-xs mb-mx-sm">
            <div className="w-mx-2 h-mx-6 bg-text-tertiary rounded-mx-full" />
            <Typography variant="h3" className="text-black">Evidências da Visita</Typography>
          </div>
          <div className="grid grid-cols-2 gap-mx-sm">
            {attachments.map((att: any) => (
              <div key={att.id} className="border border-border-default rounded-mx-lg overflow-hidden bg-surface-alt">
                <img 
                  src={`${STORAGE_URL}${att.storage_path}`} 
                  alt={att.filename}
                  className="w-full h-mx-48 object-cover"
                  crossOrigin="anonymous"
                />
                <div className="p-mx-xs text-mx-micro text-text-tertiary truncate bg-white">
                  {att.filename}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assinaturas */}
      <footer className="mt-mx-20 pt-mx-md border-t border-border-subtle grid grid-cols-2 gap-mx-20">
        <div className="text-center text-black">
          <div className="h-px bg-black mb-mx-xs mx-auto w-mx-48" />
          <Typography variant="tiny" className="font-bold">ASSINATURA CONSULTOR</Typography>
          <Typography variant="p" className="text-mx-micro">{headerBase.consultant_name}</Typography>
        </div>
        <div className="text-center text-black">
          <div className="h-px bg-black mb-mx-xs mx-auto w-mx-48" />
          <Typography variant="tiny" className="font-bold">ASSINATURA GESTOR DA LOJA</Typography>
          <Typography variant="p" className="text-mx-micro">
            {visit.acknowledged_at ? `Assinado em ${format(new Date(visit.acknowledged_at), 'dd/MM/yyyy HH:mm')}` : '(Pendente de Assinatura)'}
          </Typography>
        </div>
      </footer>
      
      <div className="mt-mx-md text-center">
        <Typography variant="tiny" className="text-mx-micro text-text-tertiary">
          Documento gerado eletronicamente via MX PERFORMANCE — A plataforma oficial de gestão preditiva.
        </Typography>
      </div>
    </div>
  )
}
