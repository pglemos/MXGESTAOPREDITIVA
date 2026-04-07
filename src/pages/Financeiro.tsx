import { AlertTriangle } from 'lucide-react'

export default function Financeiro() {
    return (
        <div className="p-10 flex flex-col items-center justify-center text-center h-full">
            <AlertTriangle className="text-amber-500 w-16 h-16 mb-4" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Módulo Descontinuado</h2>
            <p className="text-slate-500 mt-2">O módulo financeiro foi movido para o ambiente legado conforme diretrizes da Metodologia MX.</p>
        </div>
    )
}
