import { useState } from 'react'
import { Save, RefreshCw, Building2, Mail } from 'lucide-react'
import { Modal } from '@/components/organisms/Modal'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { toast } from '@/lib/toast'

interface CreateStoreModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (name: string, managerEmail?: string) => Promise<{ error: string | null }>
}

export function CreateStoreModal({ open, onClose, onSubmit }: CreateStoreModalProps) {
    const [name, setName] = useState('')
    const [managerEmail, setManagerEmail] = useState('')
    const [saving, setSaving] = useState(false)

    const reset = () => {
        setName('')
        setManagerEmail('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return toast.error('Nome da loja é obrigatório.')
        setSaving(true)
        const { error } = await onSubmit(name.trim(), managerEmail.trim() || undefined)
        setSaving(false)
        if (error) toast.error(error)
        else {
            toast.success('Loja criada com sucesso!')
            reset()
            onClose()
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => { reset(); onClose() }}
            title="Nova Loja"
            description="Cadastre uma nova unidade na rede MX"
            size="lg"
            footer={
                <>
                    <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }} disabled={saving}>CANCELAR</Button>
                    <Button type="submit" form="create-store-form" disabled={saving}>
                        {saving ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                        CRIAR LOJA
                    </Button>
                </>
            }
        >
            <form id="create-store-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-widest">Nome da Loja</Typography>
                    <div className="relative">
                        <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            id="create-store-name"
                            name="store-name"
                            required
                            value={name}
                            onChange={e => setName(e.target.value.toUpperCase())}
                            placeholder="EX: MX FORTALEZA"
                            className="!pl-12 !h-14 font-black uppercase tracking-widest"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-widest">E-mail do Gestor (opcional)</Typography>
                    <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            id="create-store-manager-email"
                            name="manager-email"
                            type="email"
                            value={managerEmail}
                            onChange={e => setManagerEmail(e.target.value)}
                            placeholder="gestor@unidade.com.br"
                            className="!pl-12 !h-14 font-bold"
                        />
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <Typography variant="tiny" tone="brand" className="font-black uppercase leading-relaxed">
                        Ao criar a loja, o sistema provisiona automaticamente:
                        regras de entrega de e-mails, regras de meta padrão (modo calendário, projeção uniforme),
                        e benchmarks padrão (lead→agend 20%, agend→visita 60%, visita→venda 33%).
                    </Typography>
                </div>
            </form>
        </Modal>
    )
}
