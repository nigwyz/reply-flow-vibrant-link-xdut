'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AuthProvider, ProtectedRoute } from 'lyzr-architect/client'
import Sidebar, { SectionKey } from './components/Sidebar'
import Header from './components/Header'
import AuthScreen from './components/AuthScreen'
import Dashboard from './sections/Dashboard'
import Conversations from './sections/Conversations'
import Escalations from './sections/Escalations'
import Customers from './sections/Customers'
import Settings from './sections/Settings'

const AGENT_ID = '6a07bb3c09d6c4e560047491'
const RAG_ID = '6a07bb07b0cd284a61d6ffb8'
const RAG_NAME = 'productknowledgebasegizp'
const AGENT_NAME = 'Customer Support Agent'
const AGENT_MODEL = 'claude-sonnet-4-6'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const SECTION_TITLES: Record<SectionKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Operational overview across channels' },
  conversations: { title: 'Conversations', subtitle: 'All customer interactions, unified' },
  escalations: { title: 'Escalations', subtitle: 'Queries that need a human touch' },
  customers: { title: 'Customers', subtitle: 'Directory of every contact' },
  settings: { title: 'Settings', subtitle: 'Knowledge base, channels, and preferences' },
}

const SAMPLE_CONVERSATIONS: any[] = [
  {
    _id: 'sample-c1', customer_id: 'sample-cust-1', customer_name: 'Aanya Kapoor', channel: 'whatsapp',
    status: 'active', last_message_preview: 'Yes, the model X1 ships in 2 business days.',
    last_message_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    messages: [
      { role: 'customer', content: 'Hi! How long does shipping take for the X1?', timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
      { role: 'agent', content: 'Yes, the model X1 ships in 2 business days.', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    ],
  },
  {
    _id: 'sample-c2', customer_id: 'sample-cust-2', customer_name: 'Liam Becker', channel: 'telegram',
    status: 'escalated', last_message_preview: 'Forwarding this to our billing specialist.',
    last_message_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    messages: [
      { role: 'customer', content: 'I was double-charged on order #44128.', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
      { role: 'agent', content: 'Forwarding this to our billing specialist.', timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString() },
    ],
  },
  {
    _id: 'sample-c3', customer_id: 'sample-cust-3', customer_name: 'Maya Rosenfeld', channel: 'instagram',
    status: 'resolved', last_message_preview: 'Glad we could help — enjoy the new theme!',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    messages: [
      { role: 'customer', content: 'How do I change the dark mode?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 - 60000).toISOString() },
      { role: 'agent', content: 'Settings → Appearance → Dark. Glad we could help — enjoy the new theme!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
    ],
  },
  {
    _id: 'sample-c4', customer_id: 'sample-cust-4', customer_name: 'Theo Marchetti', channel: 'messenger',
    status: 'active', last_message_preview: 'We support PostgreSQL 14+ and SQLite 3.35+.',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    messages: [
      { role: 'customer', content: 'Which databases do you officially support?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6 - 60000).toISOString() },
      { role: 'agent', content: 'We support PostgreSQL 14+ and SQLite 3.35+.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
    ],
  },
]

const SAMPLE_CUSTOMERS: any[] = [
  { _id: 'sample-cust-1', name: 'Aanya Kapoor', channel: 'whatsapp', channel_id: '+919812345678', total_conversations: 3, first_contact: new Date(Date.now() - 86400000 * 12).toISOString(), last_contact: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { _id: 'sample-cust-2', name: 'Liam Becker', channel: 'telegram', channel_id: '@liambeck', total_conversations: 5, first_contact: new Date(Date.now() - 86400000 * 30).toISOString(), last_contact: new Date(Date.now() - 1000 * 60 * 47).toISOString() },
  { _id: 'sample-cust-3', name: 'Maya Rosenfeld', channel: 'instagram', channel_id: '@maya.r', total_conversations: 2, first_contact: new Date(Date.now() - 86400000 * 6).toISOString(), last_contact: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { _id: 'sample-cust-4', name: 'Theo Marchetti', channel: 'messenger', channel_id: '102841120', total_conversations: 1, first_contact: new Date(Date.now() - 86400000 * 2).toISOString(), last_contact: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
]

const SAMPLE_ESCALATIONS: any[] = [
  { _id: 'sample-e1', conversation_id: 'sample-c2', customer_name: 'Liam Becker', channel: 'telegram', reason: 'Double-charge on order #44128 — needs billing review.', status: 'pending', escalated_at: new Date(Date.now() - 1000 * 60 * 47).toISOString() },
  { _id: 'sample-e2', conversation_id: 'sample-c5', customer_name: 'Priya Shah', channel: 'whatsapp', reason: 'Refund request outside policy window.', status: 'pending', escalated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { _id: 'sample-e3', conversation_id: 'sample-c6', customer_name: 'Noah Kim', channel: 'instagram', reason: 'Custom enterprise pricing inquiry.', status: 'resolved', escalated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), resolution_notes: 'Connected with sales team; quote sent.' },
]

function AppShell() {
  const [section, setSection] = useState<SectionKey>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [sampleData, setSampleData] = useState(false)

  const [conversations, setConversations] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [escalations, setEscalations] = useState<any[]>([])

  const [loadingC, setLoadingC] = useState(false)
  const [loadingCu, setLoadingCu] = useState(false)
  const [loadingE, setLoadingE] = useState(false)

  const [errorC, setErrorC] = useState('')
  const [errorCu, setErrorCu] = useState('')
  const [errorE, setErrorE] = useState('')

  const [openConvoId, setOpenConvoId] = useState<string | null>(null)
  const [expandedEscId, setExpandedEscId] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setLoadingC(true); setErrorC('')
    try {
      const res = await fetch('/api/conversations')
      const data = await res.json()
      if (data?.success) setConversations(Array.isArray(data?.data) ? data.data : [])
      else setErrorC(data?.error ?? 'Failed to load conversations')
    } catch (err) {
      setErrorC(err instanceof Error ? err.message : 'Network error')
    } finally { setLoadingC(false) }
  }, [])

  const fetchCustomers = useCallback(async () => {
    setLoadingCu(true); setErrorCu('')
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data?.success) setCustomers(Array.isArray(data?.data) ? data.data : [])
      else setErrorCu(data?.error ?? 'Failed to load customers')
    } catch (err) {
      setErrorCu(err instanceof Error ? err.message : 'Network error')
    } finally { setLoadingCu(false) }
  }, [])

  const fetchEscalations = useCallback(async () => {
    setLoadingE(true); setErrorE('')
    try {
      const res = await fetch('/api/escalations')
      const data = await res.json()
      if (data?.success) setEscalations(Array.isArray(data?.data) ? data.data : [])
      else setErrorE(data?.error ?? 'Failed to load escalations')
    } catch (err) {
      setErrorE(err instanceof Error ? err.message : 'Network error')
    } finally { setLoadingE(false) }
  }, [])

  const refreshAll = useCallback(() => {
    fetchConversations()
    fetchCustomers()
    fetchEscalations()
  }, [fetchConversations, fetchCustomers, fetchEscalations])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const displayConversations = useMemo(() => {
    if (sampleData && conversations.length === 0) return SAMPLE_CONVERSATIONS
    return conversations
  }, [sampleData, conversations])

  const displayCustomers = useMemo(() => {
    if (sampleData && customers.length === 0) return SAMPLE_CUSTOMERS
    return customers
  }, [sampleData, customers])

  const displayEscalations = useMemo(() => {
    if (sampleData && escalations.length === 0) return SAMPLE_ESCALATIONS
    return escalations
  }, [sampleData, escalations])

  const pendingEscalations = useMemo(
    () => displayEscalations.filter((e) => e?.status === 'pending').length,
    [displayEscalations]
  )

  const titleInfo = SECTION_TITLES[section]

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <Sidebar
        active={section}
        onChange={(k) => { setSection(k); setOpenConvoId(null); setExpandedEscId(null) }}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((p) => !p)}
        pendingEscalations={pendingEscalations}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={titleInfo.title}
          subtitle={titleInfo.subtitle}
          pendingEscalations={pendingEscalations}
          onBellClick={() => setSection('escalations')}
          sampleData={sampleData}
          onToggleSampleData={setSampleData}
        />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {section === 'dashboard' && (
            <Dashboard
              conversations={displayConversations}
              escalations={displayEscalations}
              onOpenConversation={(id) => { setSection('conversations'); setOpenConvoId(id) }}
              onOpenEscalation={(id) => { setSection('escalations'); setExpandedEscId(id) }}
            />
          )}
          {section === 'conversations' && (
            <Conversations
              conversations={displayConversations}
              loading={loadingC}
              error={errorC}
              onRefresh={refreshAll}
              openId={openConvoId}
              setOpenId={setOpenConvoId}
              agentId={AGENT_ID}
            />
          )}
          {section === 'escalations' && (
            <Escalations
              escalations={displayEscalations}
              conversations={displayConversations}
              loading={loadingE}
              error={errorE}
              onRefresh={refreshAll}
              expandedId={expandedEscId}
              setExpandedId={setExpandedEscId}
            />
          )}
          {section === 'customers' && (
            <Customers
              customers={displayCustomers}
              conversations={displayConversations}
              loading={loadingCu}
              error={errorCu}
            />
          )}
          {section === 'settings' && (
            <Settings ragId={RAG_ID} ragName={RAG_NAME} agentName={AGENT_NAME} agentModel={AGENT_MODEL} />
          )}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedRoute unauthenticatedFallback={<AuthScreen />}>
          <AppShell />
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  )
}
