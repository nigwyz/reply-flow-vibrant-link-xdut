'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Loader2, Send, AlertCircle, X } from 'lucide-react'
import ChannelIcon, { channelLabel } from '../components/ChannelIcon'
import StatusBadge from '../components/StatusBadge'
import { callAIAgent } from '@/lib/aiAgent'

interface ConversationsProps {
  conversations: any[]
  loading: boolean
  error: string
  onRefresh: () => void
  openId: string | null
  setOpenId: (id: string | null) => void
  agentId: string
}

const CHANNELS = ['whatsapp', 'telegram', 'messenger', 'instagram']

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

export default function Conversations({ conversations, loading, error, onRefresh, openId, setOpenId, agentId }: ConversationsProps) {
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [simOpen, setSimOpen] = useState(false)
  const [simForm, setSimForm] = useState({ channel: 'whatsapp', customer_name: '', channel_id: '', message: '' })
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState('')
  const [simSuccess, setSimSuccess] = useState('')

  const safeConvos = Array.isArray(conversations) ? conversations : []

  const filtered = useMemo(() => {
    return safeConvos.filter((c) => {
      if (filterChannel !== 'all' && c?.channel !== filterChannel) return false
      if (filterStatus !== 'all' && c?.status !== filterStatus) return false
      if (search) {
        const s = search.toLowerCase()
        const name = (c?.customer_name ?? '').toLowerCase()
        const preview = (c?.last_message_preview ?? '').toLowerCase()
        if (!name.includes(s) && !preview.includes(s)) return false
      }
      if (dateFrom) {
        const from = new Date(dateFrom).getTime()
        const t = new Date(c?.last_message_at ?? 0).getTime()
        if (t < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000
        const t = new Date(c?.last_message_at ?? 0).getTime()
        if (t > to) return false
      }
      return true
    })
  }, [safeConvos, filterChannel, filterStatus, search, dateFrom, dateTo])

  const openConvo = useMemo(() => safeConvos.find((c) => String(c?._id) === String(openId)) ?? null, [safeConvos, openId])

  async function handleSimulate() {
    setSimError('')
    setSimSuccess('')
    if (!simForm.customer_name.trim() || !simForm.channel_id.trim() || !simForm.message.trim()) {
      setSimError('Please fill in all fields')
      return
    }
    setSimLoading(true)
    try {
      // 1. Call agent
      const agentMessage = `Customer ${simForm.customer_name} (channel: ${simForm.channel}, channel_id: ${simForm.channel_id}) sent: "${simForm.message}". Reply appropriately and indicate if escalation is needed.`
      const result = await callAIAgent(agentMessage, agentId)

      let parsed: any = result?.response?.result ?? {}
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed) } catch { parsed = { reply: parsed } }
      }
      const reply = (parsed?.reply ?? '').toString() || 'I am looking into your request.'
      const status = (parsed?.status ?? '').toString()
      const escalated = parsed?.escalated === true
      const escalationReason = (parsed?.escalation_reason ?? '').toString()
      const replyChannel = (parsed?.channel ?? simForm.channel).toString()
      const replyName = (parsed?.customer_name ?? simForm.customer_name).toString()

      const convoStatus = escalated ? 'escalated' : (status?.toLowerCase().includes('resolved') ? 'resolved' : 'active')

      // 2. Upsert customer
      const custRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: simForm.channel,
          channel_id: simForm.channel_id,
          name: replyName,
          increment: true,
        }),
      })
      const custData = await custRes.json()
      if (!custData?.success) throw new Error(custData?.error ?? 'Failed to upsert customer')

      // 3. Create conversation
      const now = new Date().toISOString()
      const convoRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: String(custData?.data?._id ?? ''),
          channel: simForm.channel,
          customer_name: replyName,
          messages: [
            { role: 'customer', content: simForm.message, timestamp: now },
            { role: 'agent', content: reply, timestamp: now },
          ],
          status: convoStatus,
          last_message_preview: reply.slice(0, 120),
          last_message_at: now,
        }),
      })
      const convoData = await convoRes.json()
      if (!convoData?.success) throw new Error(convoData?.error ?? 'Failed to create conversation')

      // 4. Create escalation if needed
      if (escalated) {
        await fetch('/api/escalations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: String(convoData?.data?._id ?? ''),
            customer_name: replyName,
            channel: replyChannel,
            reason: escalationReason || 'Customer query requires human attention',
            status: 'pending',
          }),
        })
      }

      setSimSuccess(`Reply generated. ${escalated ? 'Conversation escalated.' : 'Conversation logged.'}`)
      setSimForm({ channel: 'whatsapp', customer_name: '', channel_id: '', message: '' })
      onRefresh()
    } catch (err) {
      setSimError(err instanceof Error ? err.message : 'Failed to simulate message')
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-bold tracking-tight">All Conversations</CardTitle>
            <Button onClick={() => { setSimOpen(true); setSimError(''); setSimSuccess('') }} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" /> Simulate Incoming Message
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or message"
                className="pl-9 bg-input border-border"
              />
            </div>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {CHANNELS.map((ch) => <SelectItem key={ch} value={ch}>{channelLabel(ch)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-input border-border" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-input border-border" />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/15 text-destructive-foreground p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No conversations match your filters.
              </div>
            ) : (
              <ScrollArea className="h-[520px]">
                <div className="divide-y divide-border">
                  {filtered.map((c) => (
                    <button
                      key={c?._id ?? Math.random()}
                      onClick={() => c?._id && setOpenId(String(c._id))}
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
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!openConvo} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-card border-border flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <ChannelIcon channel={openConvo?.channel} />
              <span className="truncate">{openConvo?.customer_name ?? 'Conversation'}</span>
              <StatusBadge status={openConvo?.status} />
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{channelLabel(openConvo?.channel)} · {formatTime(openConvo?.last_message_at)}</p>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-3">
            {Array.isArray(openConvo?.messages) && openConvo.messages.length > 0 ? (
              openConvo.messages.map((m: any, i: number) => {
                const isAgent = m?.role === 'agent'
                return (
                  <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isAgent ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m?.content ?? ''}</p>
                      <p className={`text-[10px] mt-1 ${isAgent ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                        {isAgent ? 'Agent' : 'Customer'} · {formatTime(m?.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">No messages in this conversation.</div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={simOpen} onOpenChange={setSimOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight">Simulate Incoming Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Channel</Label>
              <Select value={simForm.channel} onValueChange={(v) => setSimForm((p) => ({ ...p, channel: v }))}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => <SelectItem key={ch} value={ch}>{channelLabel(ch)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Customer Name</Label>
                <Input value={simForm.customer_name} onChange={(e) => setSimForm((p) => ({ ...p, customer_name: e.target.value }))} placeholder="Jane Doe" className="bg-input border-border" />
              </div>
              <div>
                <Label className="text-xs">Channel ID / Handle</Label>
                <Input value={simForm.channel_id} onChange={(e) => setSimForm((p) => ({ ...p, channel_id: e.target.value }))} placeholder="@janedoe or +15551234" className="bg-input border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Customer Message</Label>
              <Textarea
                value={simForm.message}
                onChange={(e) => setSimForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Hi, I have a question about my order #12345..."
                rows={4}
                className="bg-input border-border"
              />
            </div>
            {simError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/15 text-destructive-foreground p-2 text-xs flex items-start gap-2">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> {simError}
              </div>
            )}
            {simSuccess && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 p-2 text-xs">{simSuccess}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimOpen(false)} disabled={simLoading}>
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
            <Button onClick={handleSimulate} disabled={simLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {simLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calling agent...</> : <><Send className="h-4 w-4 mr-2" /> Send to Agent</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
