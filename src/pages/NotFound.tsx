import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
    const navigate = useNavigate()
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            <p className="text-6xl font-bold text-white/10">404</p>
            <p className="text-white/50 mt-2">Página não encontrada</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition flex items-center gap-2">
                <Home size={16} /> Voltar ao início
            </button>
        </div>
    )
}
