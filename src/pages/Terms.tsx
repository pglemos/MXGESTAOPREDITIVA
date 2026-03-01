export default function Terms() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
            <div className="max-w-2xl text-white/80">
                <h1 className="text-2xl font-bold text-white mb-4">Termos de Uso</h1>
                <p className="mb-4">Ao utilizar o MX Gestão Preditiva, você concorda com estes termos de uso.</p>
                <h2 className="text-lg font-semibold text-white mt-6 mb-2">Acesso</h2>
                <p>O acesso ao sistema é restrito a usuários autorizados pela MX Consultoria. Cada usuário é responsável por manter suas credenciais seguras.</p>
                <h2 className="text-lg font-semibold text-white mt-6 mb-2">Responsabilidades</h2>
                <p>Os usuários são responsáveis pela veracidade dos dados inseridos no sistema. Dados falsos podem resultar em análises incorretas.</p>
                <p className="mt-8 text-white/40 text-sm">MX Consultoria © {new Date().getFullYear()}</p>
            </div>
        </div>
    )
}
