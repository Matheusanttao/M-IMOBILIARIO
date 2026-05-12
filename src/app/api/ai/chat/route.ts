import { NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQ = 20
const hits = new Map<string, number[]>()

function rateOk(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => t > now - WINDOW_MS)
  if (arr.length >= MAX_REQ) return false
  arr.push(now)
  hits.set(ip, arr)
  return true
}

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!rateOk(ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  const { messages } = (await request.json()) as {
    messages?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages obrigatório' }, { status: 400 })
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Você é assistente imobiliário do M. Imobiliário: respostas curtas, profissionais, em português do Brasil.',
        },
        ...messages.slice(-12),
      ],
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    console.error('[ai/chat]', t)
    return NextResponse.json({ error: 'OpenAI error' }, { status: 502 })
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = body.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ reply: text })
}
