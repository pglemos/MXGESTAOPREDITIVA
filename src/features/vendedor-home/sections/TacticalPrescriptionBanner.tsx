import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { GraduationCap, Play } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

interface TacticalPrescription {
  gargalo: string
  label: string
  training: { type: string }
}

interface TacticalPrescriptionBannerProps {
  prescription: TacticalPrescription | null | undefined
}

/**
 * Banner "Reciclagem" — recomendação tática de treinamento baseada no maior gap.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function TacticalPrescriptionBanner({ prescription }: TacticalPrescriptionBannerProps) {
  const navigate = useNavigate()
  return (
    <AnimatePresence>
      {prescription && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="shrink-0"
        >
          <Card className="bg-mx-black text-white p-mx-lg md:p-mx-xl border-none shadow-mx-xl relative overflow-hidden group rounded-mx-4xl">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-transparent pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center gap-mx-lg relative z-10">
              <div className="w-mx-20 h-mx-20 rounded-mx-3xl bg-white text-brand-primary flex items-center justify-center shadow-mx-xl group-hover:rotate-6 transition-transform shrink-0 mx-auto lg:mx-0 border-4 border-white/10">
                <GraduationCap size={40} />
              </div>
              <div className="flex-1 space-y-mx-xs text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-mx-xs">
                  <Badge
                    variant="warning"
                    className="px-4 py-1 uppercase font-bold text-mx-nano shadow-sm bg-brand-primary border-none text-white"
                  >
                    Reciclagem
                  </Badge>
                  <Typography
                    variant="tiny"
                    tone="white"
                    className="opacity-60 uppercase font-bold tracking-mx-widest text-mx-nano"
                  >
                    Gap: {prescription.gargalo}
                  </Typography>
                </div>
                <Typography
                  variant="h2"
                  tone="white"
                  className="text-2xl sm:text-4xl tracking-tighter uppercase leading-none font-bold"
                >
                  Domine sua {prescription.training.type}
                </Typography>
                <Typography
                  variant="p"
                  tone="white"
                  className="opacity-80 max-w-2xl text-sm sm:text-lg font-bold italic line-clamp-2"
                >
                  "{prescription.label}"
                </Typography>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/treinamentos')}
                className="rounded-mx-full px-12 h-mx-16 shadow-mx-xl font-bold uppercase tracking-mx-wide text-xs w-full lg:w-auto bg-white text-mx-black hover:bg-brand-primary hover:text-white transition-all border-none"
              >
                <Play size={16} className="fill-current mr-2" /> TREINAR AGORA
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TacticalPrescriptionBanner
