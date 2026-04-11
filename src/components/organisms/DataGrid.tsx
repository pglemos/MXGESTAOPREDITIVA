import React, { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { AlertCircle, SearchX } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => ReactNode
  mobileOnly?: boolean
  desktopOnly?: boolean
}

interface DataGridProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  rowClassName?: string
  onRowClick?: (item: T) => void
  minWidth?: string
  stickyHeader?: boolean
}

export function DataGrid<T extends { id: string | number }>({
  columns,
  data,
  loading,
  emptyMessage = "Nenhum registro localizado na malha.",
  rowClassName,
  onRowClick,
  minWidth = "min-w-mx-table",
  stickyHeader = true
}: DataGridProps<T>) {
  
  if (loading) {
    return (
      <div className="space-y-mx-sm animate-in fade-in duration-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-mx-20 w-full rounded-mx-xl" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-mx-md opacity-40">
        <SearchX size={48} className="text-text-tertiary" />
        <Typography variant="caption" className="uppercase font-black tracking-widest max-w-xs mx-auto">
          {emptyMessage}
        </Typography>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto no-scrollbar">
        <table className={cn("w-full text-left border-collapse", minWidth)}>
          <thead className={cn(stickyHeader && "sticky top-0 z-20")}>
            <tr className="bg-surface-alt/50 border-b border-border-default">
              {columns.filter(col => !col.mobileOnly).map((col) => (
                <th 
                  key={col.key} 
                  scope="col" 
                  className={cn(
                    "py-6 px-4 font-black uppercase tracking-mx-wider text-mx-micro text-text-tertiary",
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.width
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-white">
            <AnimatePresence mode="popLayout">
              {data.map((item, idx) => (
                <motion.tr 
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-colors hover:bg-surface-alt/30 h-mx-20",
                    onRowClick && "cursor-pointer",
                    rowClassName
                  )}
                >
                  {columns.filter(col => !col.mobileOnly).map((col) => (
                    <td 
                      key={`${item.id}-${col.key}`} 
                      className={cn(
                        "px-4 py-2 text-sm font-bold text-text-primary transition-all",
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      {col.render ? col.render(item, idx) : (item as any)[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-mx-md pb-20">
        <AnimatePresence mode="popLayout">
          {data.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onClick={() => onRowClick?.(item)}
            >
              <Card className={cn(
                "p-mx-lg border-none shadow-mx-lg relative overflow-hidden",
                onRowClick && "active:scale-[0.98] transition-all"
              )}>
                <div className="absolute top-mx-0 right-mx-0 w-mx-32 h-mx-32 bg-brand-primary/5 rounded-mx-full blur-2xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                <div className="space-y-mx-md relative z-10">
                  {columns.filter(col => !col.desktopOnly).map((col, cIdx) => (
                    <div 
                      key={`${item.id}-mob-${col.key}`}
                      className={cn(
                        "flex flex-col gap-1",
                        cIdx === 0 && "border-b border-border-default pb-4 mb-4"
                      )}
                    >
                      {cIdx > 0 && <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">{col.header}</Typography>}
                      <div className={cn(
                        "text-sm font-bold",
                        cIdx === 0 && "text-lg font-black uppercase tracking-tight"
                      )}>
                        {col.render ? col.render(item, idx) : (item as any)[col.key]}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
