'use client'

import { LayoutDashboard, MessagesSquare, AlertTriangle, Users, Settings, Headset, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export type SectionKey = 'dashboard' | 'conversations' | 'escalations' | 'customers' | 'settings'

interface SidebarProps {
  active: SectionKey
  onChange: (key: SectionKey) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  pendingEscalations: number
}

const items: { key: SectionKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'conversations', label: 'Conversations', icon: MessagesSquare },
  { key: 'escalations', label: 'Escalations', icon: AlertTriangle },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ active, onChange, collapsed, onToggleCollapsed, pendingEscalations }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
          <Headset className="h-5 w-5 text-accent-foreground" />
        </div>
        {!collapsed && (
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground truncate">Omni Support</p>
            <p className="text-[10px] text-muted-foreground truncate">AI Customer Care</p>
          </div>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          const showBadge = item.key === 'escalations' && pendingEscalations > 0
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium tracking-tight transition-colors group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-accent')} />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {showBadge && !collapsed && (
                <Badge className="h-5 min-w-5 px-1.5 bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                  {pendingEscalations}
                </Badge>
              )}
              {showBadge && collapsed && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </button>
          )
        })}
      </nav>
      <button
        onClick={onToggleCollapsed}
        className="h-10 border-t border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
