import { useState, useMemo } from 'react'
import { TrendingUp, Target, Zap, AlertTriangle, CheckCircle2, RefreshCw, MessageCircle, BarChart3, Mail, Clock, UserX, Users, FileDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/main'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calcularProjecao, getDiasInfo, calcularAtingimento, somarVendas } from '@/lib/calculations'

export default function MorningReport() {
  const { profile, membership } = useAuth()
  const { leads } = useAppStore()
  const { checkins, loading: loadingCheckins } = useCheckins()
  const { storeGoal, loading: loadingGoals } = useGoals()
  const { sellers, loading: loadingTeam } = useTeam()
  const [isRefetching, setIsRefetching] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const daysInfo = useMemo(() => getDiasInfo(), [])
  
  const metrics = useMemo(() => {
    const currentSales = somarVendas(checkins)
    const teamGoal = storeGoal?.target || 1
    const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
    const reaching = calcularAtingimento(currentSales, teamGoal)
    const projectedReaching = calcularAtingimento(projection, teamGoal)
    const gap = Math.max(teamGoal - currentSales, 0)
    
    return {
      currentSales,
      teamGoal,
      projection,
      reaching,
      projectedReaching,
      gap
    }
  }, [checkins, storeGoal, daysInfo])

  const stagnantLeads = useMemo(() => {
    return (leads || []).filter(l => (l.stagnantDays || 0) > 0).sort((a, b) => (b.stagnantDays || 0) - (a.stagnantDays || 0))
  }, [leads])

  const pendingSellers = useMemo(() => {
    return (sellers || []).filter(s => !s.checkin_today)
  }, [sellers])

  const handleWhatsAppIndividual = (name: string, stagnantDays: number) => {
    const message = encodeURIComponent(`Olá ${name}, notamos que seu atendimento está sem atualização há ${stagnantDays} dias. Como podemos ajudar para avançarmos com a negociação?`)
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank')
    toast.success('WhatsApp aberto para ' + name)
  }

  const handleWhatsAppShare = () => {
    const currentSales = metrics.currentSales
    const teamGoal = metrics.teamGoal
    const projection = metrics.projection
    const gap = metrics.gap
    const reaching = metrics.reaching
    
    // Top 3 sellers by sales
    const sellerSales = (sellers || []).map(s => ({
      name: s.name,
      sales: checkins
        .filter(c => c.seller_user_id === s.id)
        .reduce((sum, c) => sum + (c.vnd_total || 0), 0)
    })).sort((a, b) => b.sales - a.sales).slice(0, 3)

    const top3Text = sellerSales.map((s, i) => `${i + 1}º ${s.name} - ${s.sales}v`).join('\n')

    const text = encodeURIComponent(
      `*📊 MATINAL MX - ${membership?.store?.name || 'Loja'}*\n` +
      `📅 Ref: ${format(new Date(), 'dd/MM/yyyy')}\n\n` +
      `🎯 Meta: ${teamGoal}\n` +
      `🔥 Vendido: ${currentSales} (${reaching}%)\n` +
      `📈 Projeção: ${projection}\n` +
      `🚨 Faltam: ${gap}\n\n` +
      `🏆 *Top 3*\n${top3Text}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    toast.success('Resumo formatado para WhatsApp!')
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      const { error } = await supabase.functions.invoke('relatorio-matinal')
      if (error) throw error
      toast.success('Relatório Matinal enviado com sucesso para a diretoria!')
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err)
      toast.error('Erro ao disparar e-mail matinal. Tente novamente.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleExportCSV = () => {
    const header = ['Nome', 'AGD', 'VIS', 'VND', 'Status Registro']
    const rows = (sellers || []).map(seller => {
      const sellerCheckins = checkins.filter(c => c.seller_user_id === seller.id)
      const sales = sellerCheckins.reduce((sum, c) => sum + (c.vnd_total || 0), 0)
      const visits = sellerCheckins.reduce((sum, c) => sum + (c.visit_prev_day || 0), 0)
      const appointments = sellerCheckins.reduce((sum, c) => sum + (c.agd_total || 0), 0)
      const status = seller.checkin_today ? 'OK' : 'FALTA'
      
      return [
        seller.name,
        appointments,
        visits,
        sales,
        status
      ]
    })

    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `matinal_mx_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV exportado com sucesso!')
  }

  if (loadingCheckins || loadingGoals || loadingTeam) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
      <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
      <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase animate-pulse">Consolidando Matinal...</p>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-slate-950 rounded-full shadow-mx-md" />
            <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Relatório Matinal Oficial</h1>
          </div>
          <div className="flex items-center gap-2 pl-mx-md">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 py-1 font-black text-[10px] tracking-widest uppercase">
              <CheckCircle2 size={12} /> STATUS: PRONTO PARA ENVIO
            </Badge>
            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1 py-1 font-black text-[10px] tracking-widest">
              <Clock size={12} /> PROGRAMADO: 10:30
            </Badge>
            <p className="mx-text-caption opacity-60 uppercase tracking-[0.3em] font-black text-[9px]">Metodologia MX • Unidade Operacional</p>
          </div>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button 
            onClick={handleExportCSV}
            className="mx-button-primary bg-white border border-gray-200 text-slate-950 hover:bg-gray-50 flex items-center gap-2 h-12 px-6 rounded-xl shadow-sm transition-all"
          >
            <FileDown size={18} /> Exportar Planilha
          </button>
          <button 
            onClick={handleWhatsAppShare}
            className="mx-button-primary bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 h-12 px-6 rounded-xl shadow-lg transition-all"
          >
            <MessageCircle size={18} /> Resumo WhatsApp
          </button>
          <button 
            onClick={handleSendEmail} 
            disabled={isSendingEmail}
            className="mx-button-primary bg-slate-950 text-white flex items-center gap-2 h-12 px-6 rounded-xl shadow-lg"
          >
            {isSendingEmail ? <RefreshCw size={18} className="animate-spin" /> : <Mail size={18} />}
            {isSendingEmail ? 'DISPARANDO...' : 'DISPARAR E-MAIL'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        {/* Left Column: Projection & Stagnant Leads */}
        <div className="lg:col-span-8 flex flex-col gap-mx-lg">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg transform -rotate-2"><BarChart3 size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Métricas de Performance</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ritmo de Vendas Acumulado</p>
                </div>
              </div>
              <Badge className={cn("text-white border-none font-black text-[10px] px-4 py-2 rounded-full", metrics.projectedReaching >= 100 ? "bg-emerald-600" : "bg-rose-600 shadow-lg shadow-rose-200 animate-pulse")}>
                {metrics.projectedReaching >= 100 ? '✅ NO RITMO' : '⚠️ ABAIXO DA META'}
              </Badge>
            </div>
            
            <div className="p-mx-lg md:p-mx-xl space-y-mx-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                <div className="p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 leading-none">Vendas Atuais</p>
                    <h5 className="font-black text-6xl text-slate-950 tracking-tighter leading-none">{metrics.currentSales}</h5>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 mt-6 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1.5 rounded-lg inline-block w-fit">META: {metrics.teamGoal}</p>
                </div>
                
                <div className="p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 leading-none">Atingimento</p>
                    <h5 className={cn("font-black text-6xl tracking-tighter leading-none", metrics.reaching >= 100 ? "text-emerald-600" : "text-slate-950")}>
                      {metrics.reaching}%
                    </h5>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
                    <div className={cn("h-full transition-all", metrics.reaching >= 100 ? "bg-emerald-500" : "bg-slate-950")} style={{ width: `${Math.min(metrics.reaching, 100)}%` }} />
                  </div>
                </div>

                <div className="p-8 bg-indigo-600 text-white rounded-[2rem] relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-200">
                  <div className="absolute top-2 right-2 text-white opacity-10"><TrendingUp size={80} /></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 leading-none opacity-60">Projeção Final</p>
                    <h5 className="font-black text-6xl tracking-tighter leading-none">{metrics.projection}</h5>
                  </div>
                  <p className="text-[10px] font-black text-white/60 mt-6 uppercase tracking-widest bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg inline-block w-fit relative z-10">ESTIMADO DIA {daysInfo.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-mx-lg md:p-mx-xl shadow-sm">
            <div className="flex items-center justify-between mb-mx-xl">
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Detalhamento por Especialista</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance individual consolidada</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Especialista</th>
                    <th className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">AGD</th>
                    <th className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">VIS</th>
                    <th className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">VND</th>
                    <th className="text-right py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sellers.map((seller) => {
                    const sellerCheckins = checkins.filter(c => c.seller_user_id === seller.id)
                    const sales = sellerCheckins.reduce((sum, c) => sum + (c.vnd_total || 0), 0)
                    const visits = sellerCheckins.reduce((sum, c) => sum + (c.visit_prev_day || 0), 0)
                    const appointments = sellerCheckins.reduce((sum, c) => sum + (c.agd_total || 0), 0)

                    return (
                      <tr key={seller.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black uppercase">
                              {seller.name.substring(0, 2)}
                            </div>
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{seller.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 font-black text-slate-600">{appointments}</td>
                        <td className="text-center py-4 font-black text-slate-600">{visits}</td>
                        <td className="text-center py-4 font-black text-indigo-600">{sales}</td>
                        <td className="text-right py-4">
                          <Badge className={cn(
                            "font-black text-[9px] uppercase tracking-widest px-3 py-1",
                            seller.checkin_today 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          )} variant="outline">
                            {seller.checkin_today ? 'OK' : 'FALTA'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-mx-lg md:p-mx-xl shadow-sm">
            <div className="flex items-center justify-between mb-mx-xl">
              <h4 className="text-[10px] font-black text-slate-950 flex items-center gap-2 uppercase tracking-[0.3em]">
                <Zap size={14} className="text-amber-500" /> Plano de Reativação Imediata
              </h4>
              <Badge variant="outline" className="border-rose-100 text-rose-600 font-black text-[9px] uppercase tracking-widest">{stagnantLeads.length} Leads Estagnados</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-mx-sm">
              {stagnantLeads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                      <UserX size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{lead.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{lead.car} • {lead.stagnantDays} dias parado</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleWhatsAppIndividual(lead.name, lead.stagnantDays || 0)}
                    className="h-10 px-6 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    <MessageCircle size={14} /> Reativar
                  </button>
                </div>
              ))}
              {stagnantLeads.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4 opacity-20" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Nenhum lead estagnado detectado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Focus */}
        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className={cn("mx-card p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group transition-colors", pendingSellers.length > 0 ? "bg-rose-600 text-white shadow-xl shadow-rose-200" : "bg-emerald-600 text-white")}>
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-mx-sm mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-inner">
                  {pendingSellers.length > 0 ? <AlertTriangle size={24} className="text-white" /> : <CheckCircle2 size={24} className="text-white" />}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Status de Registro</h3>
              </div>
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[10px] uppercase font-black opacity-60">Sem Registro</span>
                  <span className="text-4xl font-black tabular-nums">{pendingSellers.length}</span>
                </div>
                {pendingSellers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {pendingSellers.map(s => (
                      <Badge key={s.id} variant="secondary" className="bg-white/10 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                        {s.name.split(' ')[0]}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[9px] font-black leading-relaxed uppercase tracking-[0.2em] opacity-60">
                {pendingSellers.length > 0 ? 'COBRANÇA IMEDIATA NECESSÁRIA' : 'EQUIPE 100% SINCRONIZADA'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] flex-1 p-8 flex flex-col group shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-slate-950 flex items-center justify-center border border-gray-100 shadow-inner"><Target size={24} /></div>
              <div>
                <h3 className="text-lg font-black text-text-primary tracking-tighter uppercase leading-none">Foco Operacional</h3>
                <p className="text-[8px] text-text-tertiary uppercase font-black tracking-widest mt-1">Diretriz MX</p>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              {[
                { label: 'Validação de Agendamentos D-0', icon: Zap, priority: 'Alta' },
                { label: 'Recuperação de Leads Estagnados', icon: Users, priority: 'Alta' },
                { label: 'Auditoria de Vendas Porta D-1', icon: BarChart3, priority: 'Média' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100 group/item hover:bg-white hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <item.icon size={18} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">{item.label}</span>
                  </div>
                  <Badge className="bg-white border-gray-200 text-slate-400 text-[8px] font-black uppercase">{item.priority}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-slate-950 text-white flex items-center gap-4 shadow-xl">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shrink-0 shadow-lg">
                <img src={`https://ui-avatars.com/api/?name=${profile?.name || 'Admin'}&background=6366f1&color=fff`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest truncate">{profile?.name || 'Gestor Unidade'}</p>
                <p className="text-[8px] text-white/40 uppercase font-black">Autoridade Matinal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
