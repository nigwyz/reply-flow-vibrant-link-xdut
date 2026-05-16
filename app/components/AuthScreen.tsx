'use client'

import { useState } from 'react'
import { LoginForm, RegisterForm } from 'lyzr-architect/client'
import { Headset } from 'lucide-react'

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <Headset className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Omni Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Unified customer support, powered by AI</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
