export default function Privacy() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
            <div className="max-w-2xl text-white/80">
                <h1 className="text-2xl font-bold text-white mb-4">Política de Privacidade</h1>
                <p className="mb-4">MX Gestão Preditiva respeita a privacidade dos seus usuários. Esta política descreve como coletamos, usamos e protegemos seus dados pessoais.</p>
                <h2 className="text-lg font-semibold text-white mt-6 mb-2">Dados Coletados</h2>
                <p>Coletamos dados de performance comercial (vendas, agendamentos, visitas, leads) inseridos voluntariamente pelos usuários para fins de gestão e análise.</p>
                <h2 className="text-lg font-semibold text-white mt-6 mb-2">Uso dos Dados</h2>
                <p>Os dados são utilizados exclusivamente para geração de relatórios, ranking, e diagnósticos de performance dentro do sistema.</p>
                <h2 className="text-lg font-semibold text-white mt-6 mb-2">Segurança</h2>
                <p>Utilizamos criptografia e políticas de segurança no nível de linha (RLS) para proteger seus dados.</p>
                <p className="mt-8 text-white/40 text-sm">MX Consultoria © {new Date().getFullYear()}</p>
            </div>
        </div>
    )
}
