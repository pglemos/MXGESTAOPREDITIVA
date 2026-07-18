import { Building2, Mail, Plus, RefreshCw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'

interface CreateStoreModalProps {
  isOpen: boolean
  modalRef: React.RefObject<HTMLDivElement | null>
  newStore: { name: string; manager_email: string }
  setNewStore: React.Dispatch<React.SetStateAction<{ name: string; manager_email: string }>>
  creating: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

/**
 * Modal "Criar loja" com focus trap, ESC handler e submit.
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 * Focus trap e ESC tratados pelo hook `useLojasPage`.
 */
export function CreateStoreModal({
  isOpen,
  modalRef,
  newStore,
  setNewStore,
  creating,
  onSubmit,
  onClose,
}: CreateStoreModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-store-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg"
          >
            <Card className="p-6 md:p-14 border-none shadow-2xl bg-white overflow-hidden relative rounded-2xl">
              <form onSubmit={onSubmit} className="space-y-8 relative z-10">
                <header className="flex items-center justify-between border-b border-gray-200 pb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner shrink-0">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <Typography id="create-store-title" variant="h3">
                        Criar loja
                      </Typography>
                      <Typography
                        variant="caption"
                        tone="muted"
                        className="mt-1 block uppercase tracking-wide"
                      >
                        Cadastro único da rede MX
                      </Typography>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full w-8 h-8 bg-gray-50 hover:bg-white shadow-sm transition-all"
                    aria-label="Fechar modal"
                  >
                    <X size={24} />
                  </Button>
                </header>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Typography
                      as="label"
                      htmlFor="store-name"
                      variant="caption"
                      className="ml-2 font-black uppercase tracking-widest text-gray-500"
                    >
                      Nome da Unidade
                    </Typography>
                    <Input
                      id="store-name"
                      name="store-name"
                      required
                      placeholder="EX: MX SÃO PAULO - LESTE"
                      value={newStore.name}
                      onChange={e =>
                        setNewStore(p => ({ ...p, name: e.target.value.toUpperCase() }))
                      }
                      className="!h-14 !px-6 font-black uppercase tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-2">
                      <Typography
                        as="label"
                        htmlFor="manager-email"
                        variant="caption"
                        className="font-black uppercase tracking-widest text-gray-500"
                      >
                        E-mail do Gestor
                      </Typography>
                      <Badge variant="outline" className="text-[10px] font-black uppercase">
                        Opcional
                      </Badge>
                    </div>
                    <div className="relative group">
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-600 transition-colors"
                        aria-hidden="true"
                      />
                      <Input
                        id="manager-email"
                        name="manager-email"
                        type="email"
                        placeholder="gestor@unidade.com.br"
                        value={newStore.manager_email}
                        onChange={e =>
                          setNewStore(p => ({ ...p, manager_email: e.target.value }))
                        }
                        className="!h-14 !pl-14 !px-6 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <footer className="pt-10 flex justify-end border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:w-auto h-12 px-12 rounded-full shadow-xl bg-gray-900 font-black uppercase tracking-widest"
                  >
                    {creating ? (
                      <RefreshCw className="animate-spin mr-2" aria-hidden="true" />
                    ) : (
                      <Plus size={20} className="mr-2" aria-hidden="true" />
                    )}
                    Criar loja
                  </Button>
                </footer>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
