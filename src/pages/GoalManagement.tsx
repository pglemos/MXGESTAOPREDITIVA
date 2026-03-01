import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { toast } from 'sonner'
import { Target, Save } from 'lucide-react'

export default function GoalManagement() {
    const { storeGoal, sellerGoals, upsertGoal, currentMonth, currentYear, loading } = useGoals()
    const { sellers } = useTeam()
    const { storeId } = useAuth()
    const [storeMeta, setStoreMeta] = useState<number>(storeGoal?.target || 0)
    const [sellerMetas, setSellerMetas] = useState<Record<string, number>>({})
    const [saving, setSaving] = useState(false)

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    const getSellerGoal = (userId: string) => sellerMetas[userId] ?? sellerGoals.find(g => g.user_id === userId)?.target ?? 0
    const totalIndividual = sellers.reduce((s, v) => s + getSellerGoal(v.id), 0)
    const autoMeta = sellers.length > 0 ? Math.round((storeGoal?.target || storeMeta) / sellers.length) : 0

    const handleSave = async () => {
        if (!storeId) return
        setSaving(true)
        await upsertGoal({ store_id: storeId, user_id: null, month: currentMonth, year: currentYear, target: storeMeta })
        for (const s of sellers) {
            const val = getSellerGoal(s.id)
            if (val > 0) await upsertGoal({ store_id: storeId, user_id: s.id, month: currentMonth, year: currentYear, target: val })
        }
        setSaving(false)
        toast.success('Metas salvas!')
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center"><Target size={20} className="text-white" /></div>
                <div><h1 className="text-xl font-bold text-white">Metas</h1><p className="text-white/40 text-sm">{new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p></div>
            </div>

            {/* Store goal */}
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Meta da Loja</label>
                <input type="number" value={storeMeta || storeGoal?.target || 0} min={0}
                    onChange={e => setStoreMeta(parseInt(e.target.value) || 0)}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-bold focus:outline-none focus:border-blue-500/50" />
            </div>

            {/* Individual */}
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Metas Individuais</label>
                    <span className={`text-xs ${totalIndividual === (storeMeta || storeGoal?.target || 0) ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Soma: {totalIndividual} / {storeMeta || storeGoal?.target || 0}
                    </span>
                </div>
                {sellers.map(s => (
                    <div key={s.id} className="flex items-center gap-3">
                        <span className="text-white text-sm flex-1 truncate">{s.name}</span>
                        <input type="number" value={getSellerGoal(s.id)} min={0} placeholder={String(autoMeta)}
                            onChange={e => setSellerMetas(prev => ({ ...prev, [s.id]: parseInt(e.target.value) || 0 }))}
                            className="w-24 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold text-center focus:outline-none focus:border-blue-500/50" />
                    </div>
                ))}
            </div>

            <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-violet-500 transition disabled:opacity-50">
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Salvar Metas</>}
            </button>
        </div>
    )
}
