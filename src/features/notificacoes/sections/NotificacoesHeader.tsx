import { RefreshCw, CheckCheck } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'

type Props = {
  isRefetching: boolean
  handleRefresh: () => void | Promise<void>
  markAllAsRead: () => void | Promise<void>
}

export function NotificacoesHeader({ isRefetching, handleRefresh, markAllAsRead }: Props) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
      <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
          <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
          <Typography variant="h1">
            Central de <Typography as="span" className="text-brand-primary">Alertas</Typography>
          </Typography>
        </div>
        <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">
          MOTOR DE DISCIPLINA & INTELIGÊNCIA MX
        </Typography>
      </div>

      <div className="flex items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          aria-label="Atualizar"
          className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white"
        >
          <RefreshCw size={20} className={cn(isRefetching && 'animate-spin')} />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void markAllAsRead()
            toast.success('Tudo lido!')
          }}
          className="h-mx-xl px-6 flex-1 lg:flex-none rounded-mx-full shadow-mx-sm uppercase font-black text-xs bg-white tracking-widest"
        >
          <CheckCheck size={18} className="mr-2" /> MARCAR TUDO
        </Button>
      </div>
    </header>
  )
}

export default NotificacoesHeader
