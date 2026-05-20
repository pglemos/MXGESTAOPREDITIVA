import type { TabNavItem } from '@/components/molecules/TabNav'
import type { Tab } from './types'

export const TABS: TabNavItem<Tab>[] = [
  { key: 'overview',   label: 'Visão Geral' },
  { key: 'visits',     label: 'Agenda/Visitas' },
  { key: 'strategic',  label: 'Estratégico' },
  { key: 'action',     label: 'Plano de Ação' },
  { key: 'financial',  label: 'DRE/Financeiro' },
  { key: 'daily',      label: 'Acomp. Diário' },
  { key: 'monthly',    label: 'Fechamento' },
  { key: 'roi',        label: 'ROI/Choque' },
  { key: 'pdis',       label: 'Plano de Carreira (PDI)' },
  { key: 'files',      label: 'Arquivos' },
]
