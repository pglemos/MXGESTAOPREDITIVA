import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, CheckCircle2, Circle, Save, FileText, Send,
  AlertCircle, Info, Building2, User2, Calendar
} from 'lucide-react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Textarea } from '@/components/atoms/Textarea'
import { useConsultingClientDetail, useConsultingMethodology } from '@/hooks/useConsultingClients'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function ConsultoriaVisitaExecucao() {
  const { clientId, visitNumber } = useParams<{ clientId: string, visitNumber: string }>()
  const navigate = useNavigate()
  const { client, loading: clientLoading, refetch } = useConsultingClientDetail(clientId)
  const { steps, loading: methodologyLoading } = useConsultingMethodology()
  
  const visitNum = parseInt(visitNumber || '1')
  const step = useMemo(() => steps.find(s => s.visit_number === visitNum), [steps, visitNum])
  const visit = useMemo(() => client?.visits?.find(v => v.visit_number === visitNum), [client, visitNum])

  const [checklist, setChecklist] = useState<Array<{ task: string, completed: boolean }>>([])
  const [feedback, setFeedback] = useState('')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (visit) {
      setChecklist(visit.checklist_data || [])
      setFeedback(visit.feedback_client || '')
      setSummary(visit.executive_summary || '')
    } else if (step) {
      // Initialize checklist from objective text or defaults if empty
      setChecklist([
        { task: 'Realizar abertura da visita e alinhar objetivos', completed: false },
        { task: 'Executar checklist metodológico da etapa', completed: false },
        { task: 'Coletar evidências e feedbacks do cliente', completed: false },
        { task: 'Definir próximas ações e encerrar visita', completed: false }
      ])
    }
  }, [visit, step])

  const toggleTask = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].completed = !newChecklist[index].completed
    setChecklist(newChecklist)
  }

  const handleSave = async (isFinal = false) => {
    if (!clientId) return
    setSubmitting(true)

    try {
      const payload = {
        client_id: clientId,
        visit_number: visitNum,
        checklist_data: checklist,
        feedback_client: feedback,
        executive_summary: summary,
        status: isFinal ? 'concluída' : 'em_andamento',
        updated_at: new Date().toISOString()
      }

      let error
      if (visit?.id) {
        const { error: updateError } = await supabase
          .from('consulting_visits')
          .update(payload)
          .eq('id', visit.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('consulting_visits')
          .insert({
            ...payload,
            scheduled_at: new Date().toISOString(), // Default to now if not scheduled
          })
        error = insertError
      }

      if (error) throw error

      toast.success(isFinal ? 'Visita finalizada e relatório gerado!' : 'Progresso da visita salvo.')
      await refetch()
      if (isFinal) navigate(`/consultoria/clientes/${clientId}`)
    } catch (err: any) {
      toast.error('Erro ao salvar visita: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (clientLoading || methodologyLoading) {
    return <main className="p-mx-lg bg-surface-alt h-full flex items-center justify-center">Carregando...</main>
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="space-y-mx-sm">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to={`/consultoria/clientes/${clientId}`}>
              <ArrowLeft size={16} className="mr-2" />
              VOLTAR PARA O CLIENTE
            </Link>
          </Button>
          <div className="flex items-center gap-mx-sm">
            <Typography variant="h1">Execução: <span className="text-mx-green-700">Visita {visitNum}</span></Typography>
            <Badge variant={visit?.status === 'concluída' ? 'success' : 'warning'} className="rounded-mx-full px-4 py-1">
              {visit?.status?.toUpperCase() || 'NÃO INICIADA'}
            </Badge>
          </div>
          <div className="flex items-center gap-mx-md">
            <div className="flex items-center gap-mx-xs">
              <Building2 size={14} className="text-text-tertiary" />
              <Typography variant="caption" tone="muted">{client?.name}</Typography>
            </div>
            <div className="flex items-center gap-mx-xs">
              <Calendar size={14} className="text-text-tertiary" />
              <Typography variant="caption" tone="muted">{visit?.scheduled_at ? new Date(visit.scheduled_at).toLocaleDateString('pt-BR') : 'Sem agendamento'}</Typography>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-mx-sm">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={submitting}>
            <Save size={16} className="mr-2" /> SALVAR RASCUNHO
          </Button>
          <Button onClick={() => handleSave(true)} disabled={submitting} className="bg-brand-secondary">
            <CheckCircle2 size={16} className="mr-2" /> FINALIZAR VISITA
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
        <div className="xl:col-span-2 space-y-mx-lg">
          <Card className="p-mx-lg border-none shadow-mx-md bg-white">
            <div className="flex items-center gap-mx-sm mb-mx-md">
              <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Info size={20} />
              </div>
              <Typography variant="h3">OBJETIVO DA ETAPA</Typography>
            </div>
            <Typography variant="p" className="text-base leading-relaxed bg-surface-alt p-mx-md rounded-mx-lg border border-border-subtle">
              {step?.objective}
            </Typography>
            <div className="mt-mx-md grid grid-cols-1 md:grid-cols-2 gap-mx-md">
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Alvo</Typography>
                <Typography variant="p" className="font-bold">{step?.target || 'N/A'}</Typography>
              </div>
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Duração Prevista</Typography>
                <Typography variant="p" className="font-bold">{step?.duration || 'N/A'}</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-mx-lg border-none shadow-mx-md bg-white">
            <Typography variant="h3" className="mb-mx-md">CHECKLIST METODOLÓGICO</Typography>
            <div className="space-y-mx-xs">
              {checklist.map((item, index) => (
                <button
                  key={index}
                  onClick={() => toggleTask(index)}
                  className={cn(
                    "w-full flex items-center gap-mx-md p-mx-md rounded-mx-xl border transition-all text-left group",
                    item.completed 
                      ? "bg-status-success-surface/10 border-status-success/20 text-status-success" 
                      : "bg-white border-border-default hover:border-brand-primary/40"
                  )}
                >
                  {item.completed ? <CheckCircle2 size={22} className="shrink-0" /> : <Circle size={22} className="shrink-0 text-border-strong group-hover:text-brand-primary transition-colors" />}
                  <Typography variant="p" className={cn("font-bold", item.completed && "line-through opacity-60")}>
                    {item.task}
                  </Typography>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-mx-lg border-none shadow-mx-md bg-white">
            <Typography variant="h3" className="mb-mx-md">RESUMO EXECUTIVO (PARA O RELATÓRIO)</Typography>
            <Textarea
              placeholder="Descreva as principais descobertas, ações realizadas e orientações passadas ao lojista..."
              className="min-h-mx-48"
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </Card>
        </div>

        <div className="space-y-mx-lg">
          <Card className="p-mx-lg border-none shadow-mx-md bg-white">
            <Typography variant="h3" className="mb-mx-md">FEEDBACK DO CLIENTE</Typography>
            <Typography variant="caption" tone="muted" className="mb-mx-sm block">COMENTÁRIOS E PERCEPÇÃO DO LOJISTA</Typography>
            <Textarea
              placeholder="O que o cliente achou da visita? Algum ponto de atenção?"
              className="min-h-mx-32"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </Card>

          <Card className="p-mx-lg border-none shadow-mx-md bg-white">
            <Typography variant="h3" className="mb-mx-md">EVIDÊNCIAS NECESSÁRIAS</Typography>
            <div className="p-mx-md rounded-mx-lg bg-status-info-surface/10 border border-status-info/20 text-status-info flex gap-mx-sm mb-mx-md">
              <AlertCircle size={18} className="shrink-0" />
              <Typography variant="tiny" className="leading-tight">
                <strong>Requisito:</strong> {step?.evidence_required}
              </Typography>
            </div>
            <div className="flex flex-col gap-mx-sm">
              <Button variant="outline" className="w-full justify-start border-dashed border-2 hover:border-brand-primary h-mx-24">
                <Plus size={20} className="mr-2" /> ANEXAR FOTO / ARQUIVO
              </Button>
              <Typography variant="tiny" tone="muted" className="text-center italic">Até 10MB por arquivo (PDF, PNG, JPG)</Typography>
            </div>
          </Card>

          <Card className="p-mx-lg border-none shadow-mx-md bg-brand-secondary text-white overflow-hidden relative">
            <div className="absolute top-mx-0 right-mx-0 p-mx-md opacity-10">
              <FileText size={80} />
            </div>
            <Typography variant="h3" tone="white" className="mb-mx-sm relative z-10">HANDOFF</Typography>
            <Typography variant="p" tone="white" className="opacity-80 text-xs mb-mx-md relative z-10">
              Ao finalizar, um relatório executivo será gerado automaticamente para o cliente e consultores vinculados.
            </Typography>
            <Button className="w-full bg-white text-brand-secondary hover:bg-white/90 font-black" onClick={() => handleSave(true)}>
              GERAR RELATÓRIO FINAL
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
