'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, Link as LinkIcon, Loader2, AlertCircle, CheckCircle, Trash2, Info, MessageCircle, Send, MessageSquare, Instagram, Save } from 'lucide-react'
import { useRAGKnowledgeBase } from '@/lib/ragKnowledgeBase'

interface SettingsProps {
  ragId: string
  ragName: string
  agentName: string
  agentModel: string
}

const STORAGE_KEY_SLACK = 'omni_support_slack_channel'

export default function Settings({ ragId, ragName, agentName, agentModel }: SettingsProps) {
  const { documents, loading: kbLoading, error: kbError, fetchDocuments, uploadDocument, removeDocuments, crawlSite } = useRAGKnowledgeBase()
  const [url, setUrl] = useState('')
  const [crawlLoading, setCrawlLoading] = useState(false)
  const [crawlMsg, setCrawlMsg] = useState('')
  const [uploadMsg, setUploadMsg] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [slackSaved, setSlackSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ragId) fetchDocuments(ragId)
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLACK)
      if (saved) setSlackChannel(saved)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ragId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ragId) return
    setUploadMsg('')
    const result = await uploadDocument(ragId, file)
    if (result?.success) setUploadMsg(`Uploaded ${file.name}`)
    else setUploadMsg(result?.error ?? 'Upload failed')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCrawl() {
    if (!url.trim() || !ragId) return
    setCrawlLoading(true)
    setCrawlMsg('')
    const result = await crawlSite(ragId, url.trim())
    setCrawlLoading(false)
    if (result?.success) {
      setCrawlMsg(`Crawl started for ${url}`)
      setUrl('')
      fetchDocuments(ragId)
    } else {
      setCrawlMsg(result?.error ?? 'Crawl failed')
    }
  }

  async function handleDelete(name: string) {
    if (!ragId || !name) return
    await removeDocuments(ragId, [name])
  }

  function handleSaveSlack() {
    try {
      localStorage.setItem(STORAGE_KEY_SLACK, slackChannel)
      setSlackSaved(true)
      setTimeout(() => setSlackSaved(false), 2000)
    } catch {}
  }

  const safeDocs = Array.isArray(documents) ? documents : []

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold tracking-tight">Knowledge Base</CardTitle>
          <p className="text-xs text-muted-foreground">Upload product docs (PDF/DOCX/TXT) or crawl a website. Source: {ragName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-accent" />
                <p className="text-sm font-medium tracking-tight">Upload Document</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={kbLoading} variant="outline" className="w-full">
                {kbLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Choose file</>}
              </Button>
              {uploadMsg && (
                <p className={`text-xs ${uploadMsg.toLowerCase().includes('upload') && !uploadMsg.toLowerCase().includes('failed') ? 'text-emerald-300' : 'text-destructive-foreground'}`}>{uploadMsg}</p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-accent" />
                <p className="text-sm font-medium tracking-tight">Crawl Website</p>
              </div>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.example.com" className="bg-input border-border" />
              <Button onClick={handleCrawl} disabled={!url.trim() || crawlLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {crawlLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Crawling...</> : <><LinkIcon className="h-4 w-4 mr-2" /> Start Crawl</>}
              </Button>
              {crawlMsg && (
                <p className={`text-xs ${crawlMsg.toLowerCase().includes('start') ? 'text-emerald-300' : 'text-destructive-foreground'}`}>{crawlMsg}</p>
              )}
            </div>
          </div>

          {kbError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/15 text-destructive-foreground p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {kbError}
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Indexed Documents</p>
            <ScrollArea className="h-48 rounded-lg border border-border">
              {safeDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No documents yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {safeDocs.map((doc, i) => (
                    <div key={(doc?.id ?? doc?.fileName ?? i).toString()} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{doc?.fileName ?? 'unnamed'}</p>
                        <p className="text-[10px] text-muted-foreground">{(doc?.fileType ?? '').toUpperCase()} · {doc?.status ?? 'unknown'}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => doc?.fileName && handleDelete(doc.fileName)} className="h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold tracking-tight">Channel Connections</CardTitle>
          <p className="text-xs text-muted-foreground">Configure messaging channels in Lyzr Studio. The agent's tools handle authentication.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChannelCard
              icon={<MessageCircle className="h-5 w-5 text-emerald-400" />}
              name="WhatsApp"
              status="manual"
              instructions="WhatsApp is not part of the agent's built-in tools. Configure a custom MCP server or webhook in Lyzr Studio to bridge incoming/outgoing messages."
            />
            <ChannelCard
              icon={<Send className="h-5 w-5 text-sky-400" />}
              name="Telegram"
              status="connected"
              instructions="Telegram is connected via the agent's TELEGRAM_SEND_MESSAGE and TELEGRAM_GET_UPDATES tools through Lyzr Studio."
            />
            <ChannelCard
              icon={<MessageSquare className="h-5 w-5 text-blue-400" />}
              name="Messenger"
              status="manual"
              instructions="Messenger requires a Meta Webhook + custom tool/MCP. Set up the bridge in Lyzr Studio under Custom Tools."
            />
            <ChannelCard
              icon={<Instagram className="h-5 w-5 text-pink-400" />}
              name="Instagram"
              status="manual"
              instructions="Instagram DMs require Meta Graph API access. Configure a custom tool/MCP server in Lyzr Studio."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold tracking-tight">Escalation Preferences</CardTitle>
          <p className="text-xs text-muted-foreground">UI-only preference for the Slack channel where escalations are posted.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 max-w-md">
            <div className="flex-1">
              <Label className="text-xs">Slack Channel</Label>
              <Input value={slackChannel} onChange={(e) => setSlackChannel(e.target.value)} placeholder="#support-escalations" className="bg-input border-border" />
            </div>
            <Button onClick={handleSaveSlack} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {slackSaved ? <><CheckCircle className="h-4 w-4 mr-2" /> Saved</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold tracking-tight">Agent Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ReadOnlyField label="Agent" value={agentName} />
            <ReadOnlyField label="Model" value={agentModel} />
            <ReadOnlyField label="Tone" value="Professional, warm" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ChannelCard({ icon, name, status, instructions }: { icon: React.ReactNode; name: string; status: 'connected' | 'manual'; instructions: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium tracking-tight">{name}</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-popover border-border w-72 text-xs">{instructions}</PopoverContent>
        </Popover>
      </div>
      <div className="mt-3">
        {status === 'connected' ? (
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15">Connected (via Lyzr Studio)</Badge>
        ) : (
          <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/15">Manual Setup Required</Badge>
        )}
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm mt-1 truncate">{value}</p>
    </div>
  )
}
