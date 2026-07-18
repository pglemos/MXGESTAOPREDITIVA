import type { ReactElement, ReactNode, ElementType } from 'react'
export type MxNavigationItem = { key?: string; label: string; path: string; icon?: ElementType | ReactElement; badge?: string; activePaths?: string[] }
export type MxNavigationSection = { key?: string; label: string; items: MxNavigationItem[] }
export declare function SidebarBrandHeader(props: { title?: string; subtitle?: string; collapsed?: boolean }): ReactElement
export declare function SidebarAccountMenu(props: { initials: string; avatarUrl?: string | null; name: string; role: string; items: Array<{ key?: string; label: string; icon?: ElementType | ReactElement; onSelect?: () => void }>; collapsed?: boolean }): ReactElement
export declare function AppShell(props: { sections: MxNavigationSection[]; pathname: string; onNavigate(path: string): void; sidebarAccount?: ReactElement; mobileTitle?: string; children: ReactNode }): ReactElement
export declare function MxPanel(props: { as?: ElementType; className?: string; children?: ReactNode; [key: string]: unknown }): ReactElement
export declare function MxBadge(props: { className?: string; children?: ReactNode; [key: string]: unknown }): ReactElement
export declare function cn(...values: unknown[]): string
