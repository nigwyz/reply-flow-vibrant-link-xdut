'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, CheckCircle, Loader2, AlertCircle, Clock, X } from 'lucide-react'
import ChannelIcon, { channelLabel } from '../components/ChannelIcon'
import StatusBadge from '../components/StatusBadge'

interface EscalationsProps {
  escalations: any[]
  conversations: any[]
  loading: boolean
  error: string
  onRefresh: () => void
  expandedId: string | null
  setExpandedId: (id: string | null) => void
}

function timeSince(d: any): string {
  if (!d) return ''
  try {
    const ms = Date.now() - new Date(d).getTime()
    if (isNaN(ms)) return ''
    const min = Math.floor(ms / 60000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.floor(hr / 24)
    return `${day}d ago`
  } catch { return '' }
}

function formatTime(d: any): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

export default function Escalations({ escalations, conversations, loading, error, onRefresh, expandedId, setExpandedId }: EscalationsProps) {
  const [filterStatus, setFilterStatus] = useState('pending')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [opError, setOpError] = useState('')
  const [opLoading, setOpLoading] = useState(false)

  const safeEscs = Array.isArray(escalations) ? escalations : []
  const safeConvos = Array.isArray(conversations) ? conversations : []

  const filtered = useMemo(() => {
    return safeEscs.filter((e) => {
      if (filterStatus === 'all') return true
      return e?.status === filterStatus
    })
  }, [safeEscs, filterStatus])

  const expanded = useMemo(() => safeEscs.find((e) => String(e?._id) === String(expandedId)) ?? null, [safeEscs, expandedId])
  const expandedConvo = useMemo(() => safeConvos.find((c) => String(c?._id) === String(expanded?.conversation_id)) ?? null, [safeConvos, expanded])

  async function handleResolve(escId: string) {
    setOpError('')
    setOpLoading(true)
    try {
      const res = await fetch(`/api/escalations/${escId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolution_notes: resolutionNotes }),
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error ?? 'Failed to resolve')
      setResolvingId(null)
      setResolutionNotes('')
      onRefresh()
    } catch (err) {
      setOpError(err instanceof Error ? err.message : 'Failed to resolve escalation')
    } finally {
      setOpLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Escalations
            </CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/15 text-destructive-foreground p-3 text-sm flex items-start gap-2 mb-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No escalations match this filter.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((e) => (
                <div key={e?._id ?? Math.random()} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChannelIcon channel={e?.channel} />
                      <p className="text-sm font-medium text-foreground truncate">{e?.customer_name || 'Unknown'}</p>
                    </div>
                    <StatusBadge status={e?.status} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{e?.reason || '(no reason)'}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeSince(e?.escalated_at)}</span>
                    <span>{channelLabel(e?.channel)}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setExpandedId(String(e?._id ?? ''))}>
                      View Thread
                    </Button>
                    {e?.status === 'pending' && (
                      <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => { setResolvingId(String(e?._id ?? '')); setResolutionNotes(''); setOpError('') }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                  {e?.status === 'resolved' && e?.resolution_notes && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-[11px] text-muted-foreground italic">"{e.resolution_notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!expanded} onOpenChange={(o) => !o && setExpandedId(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <ChannelIcon channel={expanded?.channel} />
              Escalation: {expanded?.customer_name ?? 'Unknown'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-300 font-medium uppercase tracking-wider mb-1">Escalation Reason</p>
              <p className="text-sm text-foreground">{expanded?.reason || '(no reason)'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Conversation Thread</p>
              <ScrollArea className="h-[320px] rounded-lg border border-border p-3">
                {Array.isArray(expandedConvo?.messages) && expandedConvo.messages.length > 0 ? (
                  <div className="space-y-2">
                    {expandedConvo.messages.map((m: any, i: number) => {
                      const isAgent = m?.role === 'agent'
                      return (
                        <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isAgent ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                            <p className="text-xs whitespace-pre-wrap break-words">{m?.content ?? ''}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-8">No conversation thread available.</p>
                )}
              </ScrollArea>
            </div>
            <p className="text-[11px] text-muted-foreground">Escalated {formatTime(expanded?.escalated_at)} · {channelLabel(expanded?.channel)}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolvingId} onOpenChange={(o) => !o && setResolvingId(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight">Resolve Escalation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs">Resolution notes (optional)</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Briefly describe how this was handled..."
              rows={4}
              className="bg-input border-border"
            />
            {opError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/15 text-destructive-foreground p-2 text-xs flex items-start gap-2">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> {opError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolvingId(null)} disabled={opLoading}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button onClick={() => resolvingId && handleResolve(resolvingId)} disabled={opLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {opLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resolving...</> : <><CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
