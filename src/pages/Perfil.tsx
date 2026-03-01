import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Mail, Store, Shield } from 'lucide-react'

export default function Perfil() {
    const { profile, role, membership, signOut } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => { await signOut(); navigate('/login') }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">{profile?.name?.charAt(0) || '?'}</span>
                </div>
                <h1 className="text-xl font-bold text-white">{profile?.name}</h1>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full capitalize">{role}</span>
            </div>

            <div className="space-y-3">
                {[
                    { icon: Mail, label: 'Email', value: profile?.email },
                    { icon: Shield, label: 'Papel', value: role },
                    { icon: Store, label: 'Loja', value: (membership as any)?.store?.name || 'Sem loja' },
                ].map(item => (
                    <div key={item.label} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                        <item.icon size={18} className="text-white/40" />
                        <div>
                            <p className="text-white/40 text-xs">{item.label}</p>
                            <p className="text-white text-sm">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={handleLogout}
                className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition">
                <LogOut size={18} /> Sair da conta
            </button>
        </div>
    )
}
