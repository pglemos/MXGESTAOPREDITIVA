import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, CheckCircle2, Circle, Save, FileText, Send,
  AlertCircle, Info, Building2, User2, Calendar,
  Plus, Trash2, Download, Loader2, Paperclip, Image
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Textarea } from '@/components/atoms/Textarea'
import { useConsultingClientDetail, useConsultingMethodology } from '@/hooks/useConsultingClients'
import type { ConsultingVisitAttachment } from '@/features/consultoria/types'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.ms-excel',
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageContentType(ct: string) {
  return ct.startsWith('image/')
}

export default function ConsultoriaVisitaExecucao() {
  const { clientId, visitNumber } = useParams<{ clientId: string, visitNumber: string }>()
  const navigate = useNavigate()
  const { client, loading: clientLoading, refetch } = useConsultingClientDetail(clientId)
  const { steps, loading: methodologyLoading } = useConsultingMethodology()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const visitNum = parseInt(visitNumber || '1')
  const step = useMemo(() => steps.find(s => s.visit_number === visitNum), [steps, visitNum])
  const visit = useMemo(() => client?.visits?.find(v => v.visit_number === visitNum), [client, visitNum])

  const [checklist, setChecklist] = useState<Array<{ task: string, completed: boolean }>>([])
  const [feedback, setFeedback] = useState('')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<ConsultingVisitAttachment[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (visit) {
      setChecklist(visit.checklist_data || [])
      setFeedback(visit.feedback_client || '')
      setSummary(visit.executive_summary || '')
      setAttachments((visit as any).attachments || [])
    } else if (step) {
      setChecklist([
        { task: 'Realizar abertura da visita e alinhar objetivos', completed: false },
        { task: 'Executar checklist metodológico da etapa', completed: false },
        { task: 'Coletar evidências e feedbacks do cliente', completed: false },
        { task: 'Definir próximas ações e encerrar visita', completed: false }
      ])
    }
  }, [visit, step])

  const ensureVisitExists = async (): Promise<string | null> => {
    if (visit?.id) return visit.id
    if (!clientId) return null

    const { data, error } = await supabase
      .from('consulting_visits')
      .insert({
        client_id: clientId,
        visit_number: visitNum,
        scheduled_at: new Date().toISOString(),
        status: 'em_andamento',
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao criar visita: ' + error.message)
      return null
    }
    await refetch()
    return data.id
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    const file = files[0]

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande: ${formatFileSize(file.size)}. Limite: 10MB.`)
      e.target.value = ''
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Tipo não permitido: ${file.type || 'desconhecido'}. Use PDF, PNG, JPG, XLSX, DOCX ou CSV.`)
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const visitId = await ensureVisitExists()
      if (!visitId) return

      const ext = file.name.split('.').pop() || 'bin'
      const fileId = crypto.randomUUID()
      const storagePath = `${clientId}/${visitId}/${fileId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('consulting-visit-files')
        .upload(storagePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const newAttachment: ConsultingVisitAttachment = {
        id: fileId,
        filename: file.name,
        storage_path: storagePath,
        content_type: file.type,
        size_bytes: file.size,
        uploaded_at: new Date().toISOString(),
      }

      const updatedAttachments = [...attachments, newAttachment]

      const { error: updateError } = await supabase
        .from('consulting_visits')
        .update({ attachments: updatedAttachments })
        .eq('id', visitId)

      if (updateError) {
        await supabase.storage.from('consulting-visit-files').remove([storagePath])
        throw updateError
      }

      setAttachments(updatedAttachments)
      toast.success(`Arquivo "${file.name}" anexado com sucesso!`)
    } catch (err: any) {
      toast.error('Erro ao enviar arquivo: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAttachment = async (attachment: ConsultingVisitAttachment) => {
    if (!visit?.id) return

    try {
      await supabase.storage.from('consulting-visit-files').remove([attachment.storage_path])

      const updatedAttachments = attachments.filter(a => a.id !== attachment.id)

      const { error } = await supabase
        .from('consulting_visits')
        .update({ attachments: updatedAttachments })
        .eq('id', visit.id)

      if (error) throw error

      setAttachments(updatedAttachments)
      toast.success(`Arquivo "${attachment.filename}" removido.`)
    } catch (err: any) {
      toast.error('Erro ao remover arquivo: ' + err.message)
    }
  }

  const handleDownload = async (attachment: ConsultingVisitAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('consulting-visit-files')
        .download(attachment.storage_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error('Erro ao baixar arquivo: ' + err.message)
    }
  }

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
        attachments,
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
            scheduled_at: new Date().toISOString(),
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
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelect}
      />

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
            <Typography variant="h3" className="mb-mx-md">EVIDÊNCIAS E ANEXOS</Typography>
            {step?.evidence_required && (
              <div className="p-mx-md rounded-mx-lg bg-status-info-surface/10 border border-status-info/20 text-status-info flex gap-mx-sm mb-mx-md">
                <AlertCircle size={18} className="shrink-0" />
                <Typography variant="tiny" className="leading-tight">
                  <strong>Requisito:</strong> {step.evidence_required}
                </Typography>
              </div>
            )}

            <div className="flex flex-col gap-mx-sm mb-mx-md">
              <Button
                variant="outline"
                className="w-full justify-start border-dashed border-2 hover:border-brand-primary h-mx-24"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <Plus size={20} className="mr-2" />
                )}
                {uploading ? 'ENVIANDO...' : 'ANEXAR FOTO / ARQUIVO'}
              </Button>
              <Typography variant="tiny" tone="muted" className="text-center italic">Até 10MB por arquivo (PDF, PNG, JPG, XLSX, DOCX, CSV)</Typography>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">
                  Arquivos anexados ({attachments.length})
                </Typography>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-mx-sm p-mx-sm rounded-mx-lg border border-border-default hover:border-brand-primary/30 transition-colors group"
                  >
                    <div className="p-mx-xs bg-brand-primary/10 rounded-mx-md shrink-0">
                      {isImageContentType(att.content_type) ? (
                        <Image size={16} className="text-brand-primary" />
                      ) : (
                        <Paperclip size={16} className="text-brand-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="caption" className="font-bold text-text-primary block truncate">
                        {att.filename}
                      </Typography>
                      <Typography variant="tiny" tone="muted">
                        {formatFileSize(att.size_bytes)} • {new Date(att.uploaded_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-mx-xs shrink-0">
                      <button
                        onClick={() => handleDownload(att)}
                        className="p-mx-xs rounded hover:bg-surface-alt transition-colors"
                        title="Baixar"
                      >
                        <Download size={14} className="text-text-tertiary hover:text-brand-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att)}
                        className="p-mx-xs rounded hover:bg-status-error-surface transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={14} className="text-text-tertiary hover:text-status-error" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
