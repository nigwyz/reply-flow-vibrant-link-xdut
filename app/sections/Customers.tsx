'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, AlertCircle, ChevronRight, User } from 'lucide-react'
import ChannelIcon, { channelLabel } from '../components/ChannelIcon'
import StatusBadge from '../components/StatusBadge'

interface CustomersProps {
  customers: any[]
  conversations: any[]
  loading: boolean
  error: string
}

function formatDate(d: any): string {
  if (!d) return '—'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

function formatTime(d: any): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

export default function Customers({ customers, conversations, loading, error }: CustomersProps) {
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [expandedConvo, setExpandedConvo] = useState<string | null>(null)

  const safeCustomers = Array.isArray(customers) ? customers : []
  const safeConvos = Array.isArray(conversations) ? conversations : []

  const filtered = useMemo(() => {
    if (!search) return safeCustomers
    const s = search.toLowerCase()
    return safeCustomers.filter((c) => {
      const name = (c?.name ?? '').toLowerCase()
      const cid = (c?.channel_id ?? '').toLowerCase()
      return name.includes(s) || cid.includes(s)
    })
  }, [safeCustomers, search])

  const openCustomer = useMemo(() => safeCustomers.find((c) => String(c?._id) === String(openId)) ?? null, [safeCustomers, openId])
  const customerConvos = useMemo(() => {
    if (!openCustomer) return []
    return safeConvos.filter((c) => String(c?.customer_id) === String(openCustomer?._id))
  }, [safeConvos, openCustomer])

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold tracking-tight">Customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers"
              className="pl-9 bg-input border-border"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/15 text-destructive-foreground p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No customers yet. They appear once you simulate a conversation.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Channel</TableHead>
                    <TableHead className="text-xs">Channel ID</TableHead>
                    <TableHead className="text-xs">Conversations</TableHead>
                    <TableHead className="text-xs">Last Contact</TableHead>
                    <TableHead className="text-xs w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c?._id ?? Math.random()} className="border-border cursor-pointer hover:bg-secondary/40" onClick={() => c?._id && setOpenId(String(c._id))}>
                      <TableCell className="font-medium text-sm">{c?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <ChannelIcon channel={c?.channel} />
                          {channelLabel(c?.channel)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{c?.channel_id ?? '—'}</TableCell>
                      <TableCell className="text-sm">{c?.total_conversations ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(c?.last_contact)}</TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openCustomer} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <User className="h-4 w-4 text-accent" />
              </div>
              {openCustomer?.name || 'Unknown Customer'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Channel</p>
                <p className="text-sm flex items-center gap-1.5 mt-1">
                  <ChannelIcon channel={openCustomer?.channel} /> {channelLabel(openCustomer?.channel)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Channel ID</p>
                <p className="text-sm font-mono mt-1 truncate">{openCustomer?.channel_id ?? '—'}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">First Contact</p>
                <p className="text-sm mt-1">{formatDate(openCustomer?.first_contact)}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Conversations</p>
                <p className="text-sm mt-1">{openCustomer?.total_conversations ?? 0}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Interaction History</p>
              <ScrollArea className="h-[280px] rounded-lg border border-border">
                {customerConvos.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No conversations recorded.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {customerConvos.map((c) => (
                      <div key={c?._id ?? Math.random()} className="px-4 py-3">
                        <button
                          onClick={() => setExpandedConvo(expandedConvo === String(c?._id) ? null : String(c?._id ?? ''))}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">{formatTime(c?.last_message_at)}</p>
                            <StatusBadge status={c?.status} />
                          </div>
                          <p className="text-sm text-foreground mt-1 truncate">{c?.last_message_preview || '(no preview)'}</p>
                        </button>
                        {expandedConvo === String(c?._id) && Array.isArray(c?.messages) && (
                          <div className="mt-3 space-y-1.5">
                            {c.messages.map((m: any, i: number) => (
                              <div key={i} className={`text-xs p-2 rounded ${m?.role === 'agent' ? 'bg-accent/10 text-accent-foreground/90' : 'bg-secondary/60'}`}>
                                <span className="font-medium">{m?.role === 'agent' ? 'Agent' : 'Customer'}:</span> {m?.content ?? ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
