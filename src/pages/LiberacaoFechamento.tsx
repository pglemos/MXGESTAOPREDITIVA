import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ShieldCheck, Calendar, Clock, User, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

interface Solicitacao {
  id: string
  vendedorId: string
  vendedorNome: string
  gerenteId: string
  gerenteNome: string
  dataFechamento: string
  dataHoraSolicitacao: string
  statusSolicitacao: 'Pendente' | 'Liberado'
  tipoSolicitacao: string
}

export function LiberacaoFechamento() {
  const { profile, role } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const solicitacaoId = searchParams.get('id')

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const allowedRoles = ['gerente', 'supervisor', 'administrador', 'dono', 'administrador_geral', 'administrador_mx']
  const hasPermission = allowedRoles.includes(role || '')

  useEffect(() => {
    if (!solicitacaoId) return
    const list = JSON.parse(localStorage.getItem('mx-fechamento-solicitacoes') || '[]')
    const found = list.find((s: Solicitacao) => s.id === solicitacaoId)
    if (found) {
      setSolicitacao(found)
    }
  }, [solicitacaoId])

  const handleLiberar = async () => {
    if (!solicitacao || !profile) return
    setLoading(true)

    try {
      // 1. Update request status in localStorage
      const list = JSON.parse(localStorage.getItem('mx-fechamento-solicitacoes') || '[]')
      const updatedList = list.map((s: Solicitacao) => {
        if (s.id === solicitacao.id) {
          return { ...s, statusSolicitacao: 'Liberado' as const }
        }
        return s
      })
      localStorage.setItem('mx-fechamento-solicitacoes', JSON.stringify(updatedList))

      // 2. Grant late closing permission in localStorage
      const approvedKey = `mx-fechamento-liberados:${solicitacao.vendedorId}:${solicitacao.dataFechamento}`
      localStorage.setItem(approvedKey, 'true')

      // 3. Register log
      const log = {
        id: crypto.randomUUID(),
        solicitacaoId: solicitacao.id,
        liberadoPorId: profile.id,
        liberadoPorNome: profile.name || 'Gerente',
        vendedorId: solicitacao.vendedorId,
        vendedorNome: solicitacao.vendedorNome,
        dataFechamento: solicitacao.dataFechamento,
        dataHoraLiberacao: new Date().toISOString(),
        motivoLiberacao: motivo.trim() || 'Liberação padrão pelo gestor.',
      }
      const logs = JSON.parse(localStorage.getItem('mx-fechamento-liberacao-logs') || '[]')
      logs.push(log)
      localStorage.setItem('mx-fechamento-liberacao-logs', JSON.stringify(logs))

      setSolicitacao(prev => prev ? { ...prev, statusSolicitacao: 'Liberado' } : null)
      toast.success('Fechamento liberado com sucesso.')
    } catch (e) {
      toast.error('Erro ao liberar fechamento.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasPermission) {
    return (
      <main className="h-screen w-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50">
        <ShieldCheck size={64} className="text-red-500/20 mb-6" />
        <Typography variant="h2" className="mb-2 text-red-600 font-extrabold uppercase">
          Acesso Restrito
        </Typography>
        <Typography variant="p" tone="muted" className="max-w-md mx-auto text-xs font-semibold leading-relaxed">
          Apenas gestores, supervisores, administradores ou donos de loja podem aprovar a liberação de fechamentos diários atrasados.
        </Typography>
        <Button onClick={() => navigate('/home')} className="mt-6 bg-brand-primary text-white font-bold">
          Voltar para Início
        </Button>
      </main>
    )
  }

  if (!solicitacao) {
    return (
      <main className="h-screen w-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50">
        <AlertTriangle size={64} className="text-amber-500/20 mb-6" />
        <Typography variant="h2" className="mb-2 text-text-primary font-extrabold uppercase">
          Solicitação Não Encontrada
        </Typography>
        <Typography variant="p" tone="muted" className="max-w-md mx-auto text-xs font-semibold leading-relaxed">
          O link de liberação é inválido ou a solicitação expirou. Confirme o link enviado pelo vendedor.
        </Typography>
        <Button onClick={() => navigate('/home')} className="mt-6 bg-brand-primary text-white font-bold">
          Voltar para Início
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <Card className="w-full max-w-lg bg-white rounded-2xl border border-border-default p-6 shadow-xl space-y-6">
        <header className="border-b border-border-default pb-4 flex items-center justify-between">
          <div>
            <Typography variant="h1" className="!text-lg !font-black text-brand-primary uppercase">
              Liberação de Fechamento
            </Typography>
            <Typography variant="p" tone="muted" className="text-xs font-semibold mt-1">
              Aprove o fechamento operacional retroativo para o vendedor.
            </Typography>
          </div>
          <ShieldCheck size={32} className="text-brand-primary shrink-0" />
        </header>

        <div className="space-y-4 text-xs leading-relaxed text-text-secondary">
          {/* Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-border-subtle space-y-3 shadow-inner">
            <div className="flex items-center gap-2">
              <User size={15} className="text-brand-primary" />
              <span className="font-bold text-text-primary">Vendedor:</span>
              <span className="font-semibold">{solicitacao.vendedorNome}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-brand-primary" />
              <span className="font-bold text-text-primary">Data do Fechamento:</span>
              <span className="font-extrabold text-brand-primary">
                {solicitacao.dataFechamento.split('-').reverse().join('/')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-brand-primary" />
              <span className="font-bold text-text-primary">Data/Hora Solicitação:</span>
              <span className="font-semibold">
                {new Date(solicitacao.dataHoraSolicitacao).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-brand-primary" />
              <span className="font-bold text-text-primary">Status:</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                solicitacao.statusSolicitacao === 'Liberado'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
              }`}>
                {solicitacao.statusSolicitacao.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Action Input */}
          {solicitacao.statusSolicitacao === 'Pendente' ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="motivo-liberacao" className="font-bold text-text-primary">
                Motivo da Liberação (Opcional)
              </label>
              <textarea
                id="motivo-liberacao"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Vendedor teve problemas com a conexão ou ausência justificada..."
                className="h-20 w-full resize-none rounded-xl border border-border-default p-3 text-xs text-text-primary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all"
              />
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-black text-xs uppercase">Fechamento Liberado</p>
                <p className="font-semibold mt-1">
                  Este fechamento já foi liberado e o vendedor já pode preencher e finalizar os dados.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between pt-4 border-t border-border-default">
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            className="h-9 px-4 text-xs font-bold border-border-default text-text-secondary hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Cockpit
          </Button>
          {solicitacao.statusSolicitacao === 'Pendente' && (
            <Button
              onClick={handleLiberar}
              disabled={loading}
              className="h-9 px-6 text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary/90 rounded-lg shadow-md"
            >
              {loading ? 'Processando...' : 'Liberar Fechamento'}
            </Button>
          )}
        </footer>
      </Card>
    </main>
  )
}

export default LiberacaoFechamento
