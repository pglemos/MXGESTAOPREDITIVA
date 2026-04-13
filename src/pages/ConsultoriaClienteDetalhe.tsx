import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  ArrowLeft, BriefcaseBusiness, Building2, Mail, Phone, User2, 
  Calendar, CheckCircle2, Clock, DollarSign, TrendingUp, ChevronRight,
  Plus, FileText
} from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { useConsultingClientDetail } from '@/hooks/useConsultingClients'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'visits' | 'financial'

export default function ConsultoriaClienteDetalhe() {
  const { clientId } = useParams<{ clientId: string }>()
  const { client, loading, error, refetch } = useConsultingClientDetail(clientId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const activeAssignments = useMemo(() => {
    return (client?.assignments || []).filter((assignment) => assignment.active)
  }, [client?.assignments])

  if (loading) {
    return (
      <main className="w-full h-full p-mx-lg bg-surface-alt">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="p">Carregando cliente da consultoria...</Typography>
        </Card>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="w-full h-full p-mx-lg bg-surface-alt">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white space-y-mx-sm">
          <Typography variant="h2" tone="error">Cliente não disponível</Typography>
          <Typography variant="p" tone="muted">{error || 'Você não tem acesso a este cliente ou ele não existe.'}</Typography>
          <Button asChild variant="secondary" size="sm">
            <Link to="/consultoria/clientes">VOLTAR</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="space-y-mx-sm">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to="/consultoria/clientes">
              <ArrowLeft size={16} className="mr-2" />
              VOLTAR PARA CLIENTES
            </Link>
          </Button>
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">{client.name}</Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">
            {client.product_name || 'PRODUTO NÃO DEFINIDO'} • {client.status.toUpperCase()}
          </Typography>
        </div>

        <div className="flex items-center gap-mx-sm">
          <nav className="flex items-center gap-mx-tiny bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm">
            {(['overview', 'visits', 'financial'] as Tab[]).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="rounded-mx-full px-6 h-mx-lg uppercase font-black"
              >
                {tab === 'overview' ? 'Visão Geral' : tab === 'visits' ? 'Agenda/Visitas' : 'DRE/Financeiro'}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
            <Card className="p-mx-lg border-none shadow-mx-md bg-white xl:col-span-2">
              <Typography variant="h3" className="mb-mx-md">DADOS CADASTRAIS</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">RAZÃO SOCIAL</Typography>
                  <Typography variant="p">{client.legal_name || 'Não informada'}</Typography>
                </div>
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">CNPJ</Typography>
                  <Typography variant="p">{client.cnpj || 'Não informado'}</Typography>
                </div>
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">PRODUTO</Typography>
                  <Typography variant="p">{client.product_name || 'Não definido'}</Typography>
                </div>
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">CRIADO EM</Typography>
                  <Typography variant="p">{new Date(client.created_at).toLocaleDateString('pt-BR')}</Typography>
                </div>
                <div className="space-y-mx-xs md:col-span-2">
                  <Typography variant="tiny" tone="muted">NOTAS</Typography>
                  <Typography variant="p">{client.notes || 'Sem observações iniciais.'}</Typography>
                </div>
              </div>
            </Card>

            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-mx-md">CONSULTORES</Typography>
              <div className="space-y-mx-sm">
                {activeAssignments.length === 0 && (
                  <Typography variant="p" tone="muted">Nenhum consultor vinculado ainda.</Typography>
                )}
                {activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default space-y-mx-xs">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <div className="flex items-center gap-mx-xs min-w-0">
                        <User2 size={16} className="text-brand-primary shrink-0" />
                        <Typography variant="p" className="truncate">{assignment.user?.name || assignment.user_id}</Typography>
                      </div>
                      <Badge variant="outline" className="rounded-mx-full px-3 py-1">
                        {assignment.assignment_role.toUpperCase()}
                      </Badge>
                    </div>
                    <Typography variant="tiny" tone="muted">{assignment.user?.email || 'Sem e-mail'}</Typography>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-mx-lg">
            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-mx-md">UNIDADES</Typography>
              <div className="space-y-mx-sm">
                {(client.units || []).length === 0 && (
                  <Typography variant="p" tone="muted">Nenhuma unidade cadastrada ainda.</Typography>
                )}
                {(client.units || []).map((unit) => (
                  <div key={unit.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <div className="flex items-center gap-mx-xs min-w-0">
                        <Building2 size={16} className="text-brand-primary shrink-0" />
                        <Typography variant="p" className="truncate">{unit.name}</Typography>
                      </div>
                      {unit.is_primary && (
                        <Badge variant="success" className="rounded-mx-full px-3 py-1 border-none">PRINCIPAL</Badge>
                      )}
                    </div>
                    <Typography variant="tiny" tone="muted">
                      {[unit.city, unit.state].filter(Boolean).join(' / ') || 'Localização não informada'}
                    </Typography>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-mx-md">CONTATOS</Typography>
              <div className="space-y-mx-sm">
                {(client.contacts || []).length === 0 && (
                  <Typography variant="p" tone="muted">Nenhum contato cadastrado ainda.</Typography>
                )}
                {(client.contacts || []).map((contact) => (
                  <div key={contact.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <Typography variant="p">{contact.name}</Typography>
                      {contact.is_primary && (
                        <Badge variant="outline" className="rounded-mx-full px-3 py-1">PRINCIPAL</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-mx-xs mt-mx-xs">
                      <div className="flex items-center gap-mx-xs">
                        <BriefcaseBusiness size={14} className="text-text-tertiary" />
                        <Typography variant="tiny" tone="muted">{contact.role || 'Função não informada'}</Typography>
                      </div>
                      <div className="flex items-center gap-mx-xs">
                        <Mail size={14} className="text-text-tertiary" />
                        <Typography variant="tiny" tone="muted">{contact.email || 'Sem e-mail'}</Typography>
                      </div>
                      <div className="flex items-center gap-mx-xs">
                        <Phone size={14} className="text-text-tertiary" />
                        <Typography variant="tiny" tone="muted">{contact.phone || 'Sem telefone'}</Typography>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}

      {activeTab === 'visits' && (
        <section className="flex flex-col gap-mx-lg">
          <div className="flex items-center justify-between">
            <Typography variant="h3">CRONOGRAMA DE VISITAS (MÉTODO 7 PASSOS)</Typography>
            <Button size="sm" className="rounded-mx-xl">
              <Plus size={16} className="mr-2" /> AGENDAR NOVA VISITA
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-mx-md">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const visit = client.visits?.find(v => v.visit_number === num)
              return (
                <Card key={num} className={cn(
                  "p-mx-md border-none shadow-mx-sm transition-all",
                  visit?.status === 'concluída' ? 'bg-status-success-surface/20' : 'bg-white'
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={visit?.status === 'concluída' ? 'success' : 'outline'} className="rounded-mx-full">
                      VISITA {num}
                    </Badge>
                    {visit?.status === 'concluída' ? <CheckCircle2 size={18} className="text-status-success" /> : <Clock size={18} className="text-text-tertiary opacity-40" />}
                  </div>
                  
                  <div className="min-h-mx-24 mb-6">
                    <Typography variant="p" className="text-xs leading-snug">
                      {visit?.objective || `Aguardando agendamento da etapa ${num}...`}
                    </Typography>
                  </div>

                  <div className="space-y-mx-xs pt-4 border-t border-border-subtle">
                    <div className="flex items-center gap-mx-xs">
                      <Calendar size={12} className="text-text-tertiary" />
                      <Typography variant="tiny" tone="muted">
                        {visit?.scheduled_at ? new Date(visit.scheduled_at).toLocaleDateString('pt-BR') : 'Sem data'}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-mx-xs">
                      <User2 size={12} className="text-text-tertiary" />
                      <Typography variant="tiny" tone="muted" className="truncate">
                        {visit?.consultant?.name || 'Não definido'}
                      </Typography>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-6 rounded-mx-lg text-xs" asChild>
                    <Link to={`/consultoria/clientes/${clientId}/visitas/${num}`}>
                      DETALHES <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </Button>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {activeTab === 'financial' && (
        <section className="flex flex-col gap-mx-lg">
          <div className="flex items-center justify-between">
            <Typography variant="h3">DRE & EVOLUÇÃO FINANCEIRA</Typography>
            <Button size="sm" className="rounded-mx-xl">
              <Plus size={16} className="mr-2" /> LANÇAR MÊS
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-md">
            <Card className="p-mx-lg bg-brand-secondary text-white border-none shadow-mx-xl">
              <Typography variant="caption" tone="white" className="opacity-60 mb-2 block">LUCRO LÍQUIDO (MÊS ATUAL)</Typography>
              <div className="flex items-baseline gap-2">
                <Typography variant="h1" tone="white" className="text-4xl">R$ {(client.financials?.[0]?.net_profit || 0).toLocaleString('pt-BR')}</Typography>
                <Badge variant="success" className="bg-white/20 text-white border-none">+12%</Badge>
              </div>
            </Card>
            <Card className="p-mx-lg bg-white border-none shadow-mx-sm">
              <Typography variant="caption" tone="muted" className="mb-2 block">ROI DA CONSULTORIA</Typography>
              <div className="flex items-baseline gap-2">
                <Typography variant="h1" className="text-4xl">{(client.financials?.[0]?.roi || 0)}x</Typography>
                <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">Retorno</Typography>
              </div>
            </Card>
            <Card className="p-mx-lg bg-white border-none shadow-mx-sm">
              <Typography variant="caption" tone="muted" className="mb-2 block">TAXA DE CONVERSÃO</Typography>
              <div className="flex items-baseline gap-2">
                <Typography variant="h1" className="text-4xl">{(client.financials?.[0]?.conversion_rate || 0)}%</Typography>
                <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">Global</Typography>
              </div>
            </Card>
          </div>

          <Card className="border-none shadow-mx-md bg-white overflow-hidden">
            <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between">
              <Typography variant="h3">HISTÓRICO MENSAL</Typography>
              <Button variant="outline" size="sm" className="rounded-mx-lg">
                <FileText size={16} className="mr-2" /> EXPORTAR PDF
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-alt/50 border-b border-border-default">
                  <tr>
                    <th className="p-4"><Typography variant="tiny" tone="muted">MÊS</Typography></th>
                    <th className="p-4"><Typography variant="tiny" tone="muted">FATURAMENTO</Typography></th>
                    <th className="p-4"><Typography variant="tiny" tone="muted">DESPESAS FIXAS</Typography></th>
                    <th className="p-4"><Typography variant="tiny" tone="muted">MARKETING</Typography></th>
                    <th className="p-4"><Typography variant="tiny" tone="muted">LUCRO</Typography></th>
                    <th className="p-4 text-right"><Typography variant="tiny" tone="muted">AÇÃO</Typography></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {(client.financials || []).map((fin) => (
                    <tr key={fin.id} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="p-4 font-black text-sm">{new Date(fin.reference_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}</td>
                      <td className="p-4 font-bold text-sm">R$ {fin.revenue.toLocaleString('pt-BR')}</td>
                      <td className="p-4 font-bold text-sm">R$ {fin.fixed_expenses.toLocaleString('pt-BR')}</td>
                      <td className="p-4 font-bold text-sm">R$ {fin.marketing_expenses.toLocaleString('pt-BR')}</td>
                      <td className="p-4 font-black text-sm text-brand-primary">R$ {fin.net_profit.toLocaleString('pt-BR')}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm">EDITAR</Button>
                      </td>
                    </tr>
                  ))}
                  {(client.financials || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center opacity-40">Nenhum dado financeiro lançado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </main>
  )
}
