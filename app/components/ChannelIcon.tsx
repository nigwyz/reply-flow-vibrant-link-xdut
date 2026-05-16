'use client'

import { MessageCircle, Send, MessageSquare, Instagram } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChannelIconProps {
  channel?: string
  className?: string
}

export default function ChannelIcon({ channel, className }: ChannelIconProps) {
  const ch = (channel ?? '').toLowerCase()
  const base = 'h-4 w-4'
  if (ch === 'whatsapp') return <MessageCircle className={cn(base, 'text-emerald-400', className)} />
  if (ch === 'telegram') return <Send className={cn(base, 'text-sky-400', className)} />
  if (ch === 'messenger') return <MessageSquare className={cn(base, 'text-blue-400', className)} />
  if (ch === 'instagram') return <Instagram className={cn(base, 'text-pink-400', className)} />
  return <MessageCircle className={cn(base, 'text-muted-foreground', className)} />
}

export function channelLabel(channel?: string): string {
  const ch = (channel ?? '').toLowerCase()
  if (ch === 'whatsapp') return 'WhatsApp'
  if (ch === 'telegram') return 'Telegram'
  if (ch === 'messenger') return 'Messenger'
  if (ch === 'instagram') return 'Instagram'
  return channel ?? 'Unknown'
}
