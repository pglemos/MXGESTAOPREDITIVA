import React from 'react'
import { ConsultingClientDetail, ConsultingVisit } from '@/features/consultoria/types'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  client: ConsultingClientDetail
  visit: ConsultingVisit
  headerBase: any
  quantData?: any
}

export function VisitReportTemplate({ client, visit, headerBase, quantData }: Props) {
  const visitDate = new Date(headerBase.visit_date || visit.scheduled_at)

  return (
    <div className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto text-black font-sans print:p-0">
      {/* Header com Logo */}
      <header className="flex justify-between items-start border-b-2 border-brand-primary pb-6 mb-8">
        <div>
          <img src="/mx-logo.png" alt="MX Performance" className="h-12 mb-2" />
          <Typography variant="tiny" className="text-brand-primary font-black tracking-widest uppercase">
            Sistema de Gestão de Alta Performance
          </Typography>
        </div>
        <div className="text-right">
          <Typography variant="h3" className="text-brand-primary">RELATÓRIO DE AUDITORIA</Typography>
          <Badge className="bg-brand-primary text-white border-none px-4 py-1 rounded-full font-bold">
            VISITA {visit.visit_number}
          </Badge>
        </div>
      </header>

      {/* Dados do Cliente */}
      <section className="grid grid-cols-2 gap-8 mb-8 bg-surface-alt/20 p-6 rounded-2xl border border-border-default">
        <div>
          <Typography variant="tiny" className="text-text-tertiary font-bold uppercase mb-1">Cliente / Loja</Typography>
          <Typography variant="h2" className="text-xl font-black">{client.name.toUpperCase()}</Typography>
          <Typography variant="p" className="text-sm">{client.legal_name || 'Razão Social não informada'}</Typography>
        </div>
        <div className="text-right">
          <Typography variant="tiny" className="text-text-tertiary font-bold uppercase mb-1">Data da Auditoria</Typography>
          <Typography variant="h3">{format(visitDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</Typography>
          <Typography variant="p" className="text-sm">Consultor: {headerBase.consultant_name || 'Consultor MX'}</Typography>
        </div>
      </section>

      {/* Indicadores de Meta */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Meta Mensal', v: headerBase.meta_mensal },
          { l: 'Projeção', v: headerBase.projecao },
          { l: 'Leads no Mês', v: headerBase.leads_mes },
          { l: 'Estoque', v: headerBase.estoque_disponivel }
        ].map(i => (
          <div key={i.l} className="border border-border-default p-4 rounded-xl text-center">
            <Typography variant="tiny" className="font-bold text-text-tertiary block mb-1 uppercase">{i.l}</Typography>
            <Typography variant="h3" className="text-brand-primary font-black">{i.v || '0'}</Typography>
          </div>
        ))}
      </div>

      {/* Resumo Executivo */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
          <Typography variant="h3">Diagnóstico e Relato Executivo</Typography>
        </div>
        <div className="p-6 border border-border-default rounded-2xl bg-white min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-text-primary italic border-dashed">
          {visit.executive_summary || 'Nenhum relato registrado para esta visita.'}
        </div>
      </section>

      {/* Feedback Direto */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-brand-secondary rounded-full" />
          <Typography variant="h3">Pontos de Atenção e Feedback</Typography>
        </div>
        <div className="p-6 border border-brand-secondary/30 rounded-2xl bg-brand-secondary/5 text-sm leading-relaxed">
          {visit.feedback_client || 'Nenhum feedback direto registrado.'}
        </div>
      </section>

      {/* Assinaturas */}
      <footer className="mt-20 pt-8 border-t border-border-subtle grid grid-cols-2 gap-20">
        <div className="text-center">
          <div className="h-px bg-black mb-2 mx-auto w-48" />
          <Typography variant="tiny" className="font-bold">ASSINATURA CONSULTOR</Typography>
          <Typography variant="p" className="text-[10px]">{headerBase.consultant_name}</Typography>
        </div>
        <div className="text-center">
          <div className="h-px bg-black mb-2 mx-auto w-48" />
          <Typography variant="tiny" className="font-bold">ASSINATURA GESTOR DA LOJA</Typography>
          <Typography variant="p" className="text-[10px]">
            {visit.acknowledged_at ? `Assinado em ${format(new Date(visit.acknowledged_at), 'dd/MM/yyyy HH:mm')}` : '(Pendente de Assinatura)'}
          </Typography>
        </div>
      </footer>
      
      <div className="mt-8 text-center">
        <Typography variant="tiny" className="text-[9px] text-text-tertiary">
          Documento gerado eletronicamente via MX PERFORMANCE — A plataforma oficial de gestão preditiva.
        </Typography>
      </div>
    </div>
  )
}
