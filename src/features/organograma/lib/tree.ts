import type { Database } from '@/types/database.generated'

export type OrganogramaNo = Database['public']['Tables']['organograma_nos']['Row']
export type OrganogramaNoInsert = Database['public']['Tables']['organograma_nos']['Insert']
export type CarreiraNivel = Database['public']['Tables']['carreira_niveis']['Row']
export type CarreiraNivelInsert = Database['public']['Tables']['carreira_niveis']['Insert']

export interface OrgNode extends OrganogramaNo {
  children: OrgNode[]
}

/** Monta a árvore hierárquica a partir da lista flat (parent_id). */
export function buildTree(nos: OrganogramaNo[]): OrgNode[] {
  const map = new Map<string, OrgNode>()
  for (const n of nos) map.set(n.id, { ...n, children: [] })
  const roots: OrgNode[] = []
  for (const n of map.values()) {
    if (n.parent_id && map.has(n.parent_id)) map.get(n.parent_id)!.children.push(n)
    else roots.push(n)
  }
  const sortRec = (arr: OrgNode[]) => {
    arr.sort((a, b) => (a.ordem - b.ordem) || a.cargo.localeCompare(b.cargo))
    arr.forEach(c => sortRec(c.children))
  }
  sortRec(roots)
  return roots
}
