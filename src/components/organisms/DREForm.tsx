import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { Modal } from '@/components/organisms/Modal'

export interface DREFormSection {
  key: string
  title: string
  fields: { key: string; label: string }[]
}

export interface DREFormComputedPreview {
  gross_profit: number
  total_expenses: number
  net_profit: number
  rentability: number
}

export interface DREFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  sections: DREFormSection[]
  values: Record<string, number | string>
  onChange: (updated: Record<string, number | string>) => void
  onSubmit: () => void
  onDelete?: (id: string) => void
  editingId?: string
  loading?: boolean
  computedPreview?: DREFormComputedPreview
  className?: string
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function pct(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
}

export function DREForm({
  open,
  onOpenChange,
  title,
  sections,
  values,
  onChange,
  onSubmit,
  onDelete,
  editingId,
  loading,
  computedPreview,
  className,
}: DREFormProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const sec of sections) {
      initial[sec.key] = sec.key !== 'receitas' && sec.key !== 'deducoes' && sec.key !== 'indicadores'
    }
    return initial
  })

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleFieldChange = (key: string, rawValue: string) => {
    onChange({ ...values, [key]: Number(rawValue) || 0 })
  }

  const handleClose = () => onOpenChange(false)

  const footer = (
    <>
      <div>
        {editingId && onDelete && (
          <Button variant="ghost" size="sm" className="text-status-error" onClick={() => onDelete(editingId)}>
            <Trash2 size={14} className="mr-1" /> Excluir
          </Button>
        )}
      </div>
      <div className="flex gap-mx-sm">
        <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
        <Button size="sm" className="bg-brand-primary text-white" onClick={onSubmit} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title || (editingId ? 'Editar DRE' : 'Lançar Mês')}
      size="2xl"
      footer={footer}
      className={className}
    >
      <div className="space-y-mx-md mb-mx-lg">
        <div className="max-w-xs">
          <Typography as="label" variant="caption" className="block mb-1 font-black uppercase tracking-widest">Mês de Referência</Typography>
          <Input
            type="month"
            value={values.reference_date || ''}
            onChange={(e) => onChange({ ...values, reference_date: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      {sections.map((sec) => {
        const isCollapsed = collapsed[sec.key] ?? false
        return (
          <div key={sec.key} className="border border-border-default rounded-mx-lg mb-mx-sm overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-mx-md py-mx-sm bg-mx-green-900 text-white hover:bg-mx-green-950 transition-colors"
              onClick={() => toggleSection(sec.key)}
            >
              <span className="font-black text-sm uppercase tracking-wider">{sec.title}</span>
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {!isCollapsed && (
              <div className="p-mx-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-sm">
                {sec.fields.map((f) => (
                  <div key={f.key}>
                    <Typography as="label" variant="caption" className="block mb-1 font-black uppercase tracking-widest">{f.label} (R$)</Typography>
                    <Input
                      type="number"
                      value={values[f.key] || ''}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {computedPreview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm mt-mx-lg p-mx-md bg-brand-primary/5 rounded-mx-lg border border-brand-primary/20">
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase">Lucro Bruto</Typography>
            <Typography variant="h3" className="text-brand-primary font-black">R$ {fmt(computedPreview.gross_profit)}</Typography>
          </div>
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase">Despesas Totais</Typography>
            <Typography variant="h3" className="text-status-error font-black">R$ {fmt(computedPreview.total_expenses)}</Typography>
          </div>
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase">Lucro Líquido</Typography>
            <Typography variant="h3" className={computedPreview.net_profit >= 0 ? 'text-status-success font-black' : 'text-status-error font-black'}>
              R$ {fmt(computedPreview.net_profit)}
            </Typography>
          </div>
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase">Rentabilidade</Typography>
            <Typography variant="h3" className="font-black">{pct(computedPreview.rentability * 100)}</Typography>
          </div>
        </div>
      )}
    </Modal>
  )
}
