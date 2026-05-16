'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status?: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = (status ?? '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground border-muted'
  let label = status ?? 'Unknown'
  if (s === 'active') {
    cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    label = 'Active'
  } else if (s === 'escalated' || s === 'pending') {
    cls = 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    label = s === 'escalated' ? 'Escalated' : 'Pending'
  } else if (s === 'resolved') {
    cls = 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    label = 'Resolved'
  }
  return (
    <Badge variant="outline" className={cn('text-xs font-medium tracking-tight', cls, className)}>
      {label}
    </Badge>
  )
}
