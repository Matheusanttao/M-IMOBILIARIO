'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'

export function SiteChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim() || loading) return
    const next = [...messages, { role: 'user' as const, content: input.trim() }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? '' }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Não foi possível responder agora. Tente mais tarde.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex w-[min(100vw-2rem,22rem)] flex-col rounded-2xl border border-white/10 bg-card text-white shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="text-sm font-semibold text-white">Assistente</span>
            <button type="button" className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto px-3 py-2 text-sm">
            {messages.map((m, i) => (
              <p
                key={i}
                className={cn(
                  'rounded-lg px-2 py-1',
                  m.role === 'user'
                    ? 'ml-4 bg-accent/15 text-right text-white'
                    : 'mr-4 bg-white/10 text-white/80',
                )}
              >
                {m.content}
              </p>
            ))}
          </div>
          <div className="border-t border-white/10 p-2">
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sua pergunta…"
              className="border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/35"
            />
            <Button type="button" className="mt-2 w-full" size="sm" loading={loading} onClick={() => void send()}>
              Enviar
            </Button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex size-14 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-accent/20"
        aria-label="Abrir chat"
      >
        <MessageCircle className="size-7" />
      </button>
    </div>
  )
}
