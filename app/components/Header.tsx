'use client'

import { Bell } from 'lucide-react'
import { UserMenu } from 'lyzr-architect/client'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface HeaderProps {
  title: string
  subtitle?: string
  pendingEscalations: number
  onBellClick: () => void
  sampleData: boolean
  onToggleSampleData: (v: boolean) => void
}

export default function Header({ title, subtitle, pendingEscalations, onBellClick, sampleData, onToggleSampleData }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div className="min-w-0">
        <h1 className="text-lg font-bold tracking-tight text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="sample-data" checked={sampleData} onCheckedChange={onToggleSampleData} />
          <Label htmlFor="sample-data" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
        </div>
        <button
          onClick={onBellClick}
          className="relative h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {pendingEscalations > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-amber-500 hover:bg-amber-500 text-amber-950 border-0 text-[10px] font-bold">
              {pendingEscalations}
            </Badge>
          )}
        </button>
        <div className="h-8 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  )
}
