'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessagesSquare, AlertTriangle, CheckCircle, Activity, ChevronRight } from 'lucide-react'
import ChannelIcon, { channelLabel } from '../components/ChannelIcon'
import StatusBadge from '../components/StatusBadge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DashboardProps {
  conversations: any[]
  escalations: any[]
  onOpenConversation: (id: string) => void
  onOpenEscalation: (id: string) => void
}

function formatTime(d: any): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function StatCard({ title, value, icon: Icon, accent }: { title: string; value: number; icon: any; accent: string }) {
  return (
    <Card className="bg-card border-border shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground mt-2">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard({ conversations, escalations, onOpenConversation, onOpenEscalation }: DashboardProps) {
  const safeConvos = Array.isArray(conversations) ? conversations : []
  const safeEscs = Array.isArray(escalations) ? escalations : []
  const total = safeConvos.length
  const active = safeConvos.filter((c) => c?.status === 'active').length
  const escalated = safeEscs.filter((e) => e?.status === 'pending').length
  const resolved = safeConvos.filter((c) => c?.status === 'resolved').length

  const recentConvos = safeConvos.slice(0, 8)
  const recentEscs = safeEscs.slice(0, 6)

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Conversations" value={total} icon={MessagesSquare} accent="bg-emerald-500/15 text-emerald-300" />
        <StatCard title="Active" value={active} icon={Activity} accent="bg-sky-500/15 text-sky-300" />
        <StatCard title="Escalated (Pending)" value={escalated} icon={AlertTriangle} accent="bg-amber-500/15 text-amber-300" />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle} accent="bg-emerald-500/15 text-emerald-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 bg-card border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold tracking-tight">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              {recentConvos.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No conversations yet. Use the Conversations tab to simulate one.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentConvos.map((c) => (
                    <button
                      key={c?._id ?? Math.random()}
                      onClick={() => c?._id && onOpenConversation(String(c._id))}
                      className="w-full text-left px-5 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-3"
                    >
                      <ChannelIcon channel={c?.channel} className="h-5 w-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{c?.customer_name || 'Unknown'}</p>
                          <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(c?.last_message_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c?.last_message_preview || '(no messages)'}</p>
                      </div>
                      <StatusBadge status={c?.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 bg-card border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Recent Escalations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              {recentEscs.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No escalations. Great work!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentEscs.map((e) => (
                    <button
                      key={e?._id ?? Math.random()}
                      onClick={() => e?._id && onOpenEscalation(String(e._id))}
                      className="w-full text-left px-5 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <ChannelIcon channel={e?.channel} />
                          <p className="text-sm font-medium text-foreground truncate">{e?.customer_name || 'Unknown'}</p>
                        </div>
                        <StatusBadge status={e?.status} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{e?.reason || '(no reason)'}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{channelLabel(e?.channel)} · {formatTime(e?.escalated_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold tracking-tight">Powered by</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
            <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Customer Support Agent</p>
              <p className="text-[11px] text-muted-foreground truncate">claude-sonnet-4-6 · Slack + Telegram tools · Product knowledge base</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
