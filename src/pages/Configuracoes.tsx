import { Settings } from 'lucide-react'

export default function Configuracoes() {
    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20]">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-gray-400 rounded-full shadow-[0_0_15px_rgba(156,163,175,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Configurações</h1>
                    </div>
                </div>
            </div>

            <div className="inner-card p-16 text-center relative overflow-hidden group shrink-0">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl z-0 pointer-events-none group-hover:bg-gray-100 transition-all" />

                <div className="relative z-10">
                    <div className="w-24 h-24 rounded-full bg-[#F8FAFC] border border-gray-100 flex items-center justify-center mx-auto mb-6 group-hover:rotate-45 transition-transform duration-500">
                        <Settings size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#1A1D20] mb-2">Em breve</h3>
                    <p className="text-gray-500 font-medium max-w-sm mx-auto">
                        Configurações avançadas do sistema, benchmarks, e automatizações estarão disponíveis nas próximas atualizações.
                    </p>
                </div>
            </div>
        </div>
    )
}
