import { useEffect, useState } from 'react'
import { AlertTriangle, Building2, Mail, RefreshCw, Save } from 'lucide-react'
import { Modal } from '@/components/organisms/Modal'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import type { Store } from '@/types/database'
import type { StoreUpdateFields } from '@/hooks/useTeam'

interface StoreEditModalProps {
  open: boolean
  store: Store | null
  saving?: boolean
  onClose: () => void
  onSubmit: (id: string, updates: Partial<StoreUpdateFields>) => Promise<void>
}

export function StoreEditModal({ open, store, saving = false, onClose, onSubmit }: StoreEditModalProps) {
  const [form, setForm] = useState<StoreUpdateFields>({
    name: '',
    manager_email: null,
    active: true,
  })

  useEffect(() => {
    if (!store) return
    setForm({
      name: store.name,
      manager_email: store.manager_email || '',
      active: store.active,
    })
  }, [store])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!store) return

    if (store.active && !form.active) {
      const confirmed = window.confirm('Arquivar esta loja? Gerentes e vendedores podem perder visibilidade operacional.')
      if (!confirmed) return
    }

    await onSubmit(store.id, {
      name: form.name,
      manager_email: form.manager_email || null,
      active: form.active,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Loja"
      description={store ? `Unidade ${store.name}` : 'Atualize os dados cadastrais da unidade'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>CANCELAR</Button>
          <Button type="submit" form="store-edit-form" disabled={saving || !store} className="bg-brand-secondary">
            {saving ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            SALVAR
          </Button>
        </>
      }
    >
      <form id="store-edit-form" onSubmit={handleSubmit} className="space-y-mx-lg">
        <div className="space-y-mx-xs">
          <Typography as="label" htmlFor="edit-store-name" variant="caption" className="font-black uppercase tracking-widest text-text-tertiary">
            Nome da Loja
          </Typography>
          <div className="relative">
            <Building2 size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
            <Input
              id="edit-store-name"
              required
              autoFocus
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value.toUpperCase() }))}
              className="!pl-14 !h-14 font-black uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="space-y-mx-xs">
          <div className="flex items-center justify-between">
            <Typography as="label" htmlFor="edit-store-manager-email" variant="caption" className="font-black uppercase tracking-widest text-text-tertiary">
              E-mail do Gestor
            </Typography>
            <Badge variant="outline" className="text-mx-micro font-black uppercase">Opcional</Badge>
          </div>
          <div className="relative">
            <Mail size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
            <Input
              id="edit-store-manager-email"
              type="email"
              value={form.manager_email || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, manager_email: event.target.value }))}
              placeholder="gestor@unidade.com.br"
              className="!pl-14 !h-14 font-bold"
            />
          </div>
        </div>

        <label htmlFor="edit-store-active" className="flex items-start gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-md cursor-pointer">
          <input
            id="edit-store-active"
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
            className="mt-1 h-mx-sm w-mx-sm accent-brand-primary"
          />
          <span className="flex-1">
            <span className="block text-sm font-black uppercase tracking-widest text-text-primary">Loja ativa</span>
            <span className="block text-xs font-bold text-text-tertiary mt-1">
              Desmarcar arquiva a unidade sem excluir dados historicos.
            </span>
          </span>
        </label>

        {!form.active && (
          <div className="flex items-start gap-mx-sm rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-md text-status-warning">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <Typography variant="tiny" className="font-bold">
              A loja arquivada sai da lista de unidades ativas. Os registros historicos continuam preservados.
            </Typography>
          </div>
        )}
      </form>
    </Modal>
  )
}
