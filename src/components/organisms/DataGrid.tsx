import { ReactNode, memo } from 'react'
import { AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { SearchX } from 'lucide-react'
import { MotionList, MotionRow, rowVariants } from '@/design/motion'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => ReactNode
  mobileOnly?: boolean
  desktopOnly?: boolean
}

export interface DataGridProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  rowClassName?: string
  onRowClick?: (item: T) => void
  minWidth?: string
  stickyHeader?: boolean
}

function getCellValue<T>(item: T, key: string): ReactNode {
  if (!item || typeof item !== 'object' || !(key in item)) return null
  return (item as Record<string, ReactNode>)[key]
}

function DataGridInner<T extends { id: string | number }>({
  columns,
  data,
  loading,
  emptyMessage = "Nenhum registro localizado na malha.",
  emptyDescription,
  rowClassName,
  onRowClick,
  minWidth = "min-w-[720px]",
  stickyHeader = true
}: DataGridProps<T>) {
  
  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 text-gray-500">
        <SearchX size={48} className="text-gray-500" />
        <Typography variant="caption" className="uppercase font-black tracking-widest max-w-xs mx-auto">
          {emptyMessage}
        </Typography>
        {emptyDescription && (
          <Typography variant="p" tone="muted" className="max-w-md mx-auto">
            {emptyDescription}
          </Typography>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Typography variant="tiny" tone="muted" className="sr-only">
          Se houver colunas fora da área visível, role a tabela horizontalmente.
        </Typography>
        <table className={cn("w-full text-left border-collapse", minWidth)}>
          <thead className={cn(stickyHeader && "sticky top-0 z-20")}>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {columns.filter(col => !col.mobileOnly).map((col) => (
                <th 
                  key={col.key} 
                  scope="col" 
                  className={cn(
                    "py-6 px-4 font-black uppercase tracking-wider text-[9px] text-gray-500",
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.width
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <MotionList as="tbody" className="divide-y divide-border-default bg-white">
            <AnimatePresence mode="popLayout">
              {data.map((item, idx) => (
                <MotionRow
                  as="tr"
                  key={item.id}
                  layout
                  variants={rowVariants}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-colors hover:bg-gray-50/30 h-20",
                    onRowClick && "cursor-pointer",
                    rowClassName
                  )}
                >
                  {columns.filter(col => !col.mobileOnly).map((col) => (
                    <td 
                      key={`${item.id}-${col.key}`} 
                      className={cn(
                        "px-4 py-2 text-sm font-bold text-gray-800 transition-all",
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      {col.render ? col.render(item, idx) : getCellValue(item, col.key)}
                    </td>
                  ))}
                </MotionRow>
              ))}
            </AnimatePresence>
          </MotionList>
        </table>
      </div>

      {/* Mobile Card View */}
      <MotionList className="md:hidden space-y-6 pb-24">
        <AnimatePresence mode="popLayout">
          {data.map((item, idx) => (
            <MotionRow
              key={item.id}
              layout
              variants={rowVariants}
              exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
              onClick={() => onRowClick?.(item)}
            >
              <Card className={cn(
                "p-8 border-none shadow-sm",
                onRowClick && "active:scale-[0.98] transition-all"
              )}>
                <div className="space-y-6">
                  {columns.filter(col => !col.desktopOnly).map((col, cIdx) => (
                    <div 
                      key={`${item.id}-mob-${col.key}`}
                      className={cn(
                        "flex flex-col gap-1",
                        cIdx === 0 && "border-b border-gray-100 pb-4 mb-4"
                      )}
                    >
                      {cIdx > 0 && <Typography variant="tiny" tone="muted" className="uppercase font-black">{col.header}</Typography>}
                      <div className={cn(
                        "text-sm font-bold",
                        cIdx === 0 && "text-lg font-black uppercase tracking-tight"
                      )}>
                        {col.render ? col.render(item, idx) : getCellValue(item, col.key)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </MotionRow>
          ))}
        </AnimatePresence>
      </MotionList>
    </div>
  )
}

export const DataGrid = memo(DataGridInner) as typeof DataGridInner
