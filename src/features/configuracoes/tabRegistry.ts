import {
    User as UserIcon,
    Lock,
    Bell,
    Users,
    Building2,
    SlidersHorizontal,
    Sparkles,
    FolderTree,
    Megaphone,
    Plug,
    Server,
    Palette,
} from 'lucide-react'
import type { ConfigTabDefinition } from './types'
import type { UserRole } from '@/types/database'
import { PerfilTab } from './components/tabs/PerfilTab'
import { SegurancaTab } from './components/tabs/SegurancaTab'
import { NotificacoesTab } from './components/tabs/NotificacoesTab'
import { EquipeUsuariosTab } from './components/tabs/EquipeUsuariosTab'
import { LojasRedeTab } from './components/tabs/LojasRedeTab'
import { OperacionalLojaTab } from './components/tabs/OperacionalLojaTab'
import { ConsultoriaPmrTab } from './components/tabs/ConsultoriaPmrTab'
import { CatalogosTab } from './components/tabs/CatalogosTab'
import { BroadcastsTab } from './components/tabs/BroadcastsTab'
import { IntegracoesTab } from './components/tabs/IntegracoesTab'
import { SistemaMxTab } from './components/tabs/SistemaMxTab'
import { AparenciaTab } from './components/tabs/AparenciaTab'

export const TAB_REGISTRY: ConfigTabDefinition[] = [
    {
        key: 'perfil',
        label: 'Perfil',
        description: 'Dados pessoais e avatar',
        icon: UserIcon,
        component: PerfilTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor'],
        section: 'pessoal',
    },
    {
        key: 'seguranca',
        label: 'Segurança',
        description: 'Senha, sessões e 2FA',
        icon: Lock,
        component: SegurancaTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor'],
        section: 'pessoal',
    },
    {
        key: 'notificacoes',
        label: 'Notificações',
        description: 'Canais e tópicos',
        icon: Bell,
        component: NotificacoesTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor'],
        section: 'pessoal',
    },
    {
        key: 'equipe-usuarios',
        label: 'Equipe & Usuários',
        description: 'Gerenciar integrantes',
        icon: Users,
        component: EquipeUsuariosTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente'],
        readOnlyRoles: ['consultor_mx'],
        section: 'gestao',
    },
    {
        key: 'lojas-rede',
        label: 'Lojas & Rede',
        description: 'Unidades operacionais',
        icon: Building2,
        component: LojasRedeTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono'],
        readOnlyRoles: ['consultor_mx', 'dono'],
        section: 'gestao',
    },
    {
        key: 'operacional-loja',
        label: 'Operacional',
        description: 'Parâmetros por loja',
        icon: SlidersHorizontal,
        component: OperacionalLojaTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono'],
        readOnlyRoles: ['consultor_mx'],
        section: 'gestao',
    },
    {
        key: 'consultoria-pmr',
        label: 'Consultoria PMR',
        description: 'Parâmetros, métricas, programas',
        icon: Sparkles,
        component: ConsultoriaPmrTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx'],
        section: 'mx',
    },
    {
        key: 'catalogos',
        label: 'Catálogos',
        description: 'Treinamentos, produtos e PDI',
        icon: FolderTree,
        component: CatalogosTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx'],
        section: 'mx',
    },
    {
        key: 'broadcasts',
        label: 'Comunicados',
        description: 'Broadcasts oficiais MX',
        icon: Megaphone,
        component: BroadcastsTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx'],
        section: 'mx',
    },
    {
        key: 'integracoes',
        label: 'Integrações',
        description: 'Calendar, webhooks, APIs',
        icon: Plug,
        component: IntegracoesTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx'],
        section: 'mx',
    },
    {
        key: 'sistema-mx',
        label: 'Sistema MX',
        description: 'Auditoria, logs, operações',
        icon: Server,
        component: SistemaMxTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx'],
        readOnlyRoles: ['consultor_mx'],
        section: 'sistema',
    },
    {
        key: 'aparencia',
        label: 'Aparência',
        description: 'Tema, densidade e branding',
        icon: Palette,
        component: AparenciaTab,
        roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor'],
        section: 'sistema',
    },
]

export const SECTION_LABELS: Record<ConfigTabDefinition['section'], string> = {
    pessoal: 'Pessoal',
    gestao: 'Gestão da Rede',
    mx: 'Operações MX',
    sistema: 'Sistema',
}

export function getVisibleTabs(role: string | null | undefined): ConfigTabDefinition[] {
    if (!role) return TAB_REGISTRY.filter(t => t.roles.includes('vendedor'))
    return TAB_REGISTRY.filter(t => t.roles.includes(role as UserRole))
}
