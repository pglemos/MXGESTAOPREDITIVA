import type { ComponentType } from 'react'
import type { UserRole } from '@/types/database'

export type ConfigTabKey =
    | 'perfil'
    | 'seguranca'
    | 'notificacoes'
    | 'equipe-usuarios'
    | 'lojas-rede'
    | 'operacional-loja'
    | 'consultoria-pmr'
    | 'catalogos'
    | 'broadcasts'
    | 'integracoes'
    | 'sistema-mx'
    | 'aparencia'

export interface ConfigTabDefinition {
    key: ConfigTabKey
    label: string
    description: string
    icon: ComponentType<{ size?: number; className?: string }>
    component: ComponentType<TabContext>
    /** Roles autorizados a visualizar a aba */
    roles: UserRole[]
    /** Se true, somente leitura para roles específicos */
    readOnlyRoles?: UserRole[]
    /** Categoria visual no sidebar de abas */
    section: 'pessoal' | 'gestao' | 'mx' | 'sistema'
}

export interface TabContext {
    isReadOnly: boolean
}
