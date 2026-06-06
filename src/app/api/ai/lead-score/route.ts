import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 503 })
  }

  const { nome, mensagem, origem } = (await request.json()) as {
    nome?: string
    mensagem?: string
    origem?: string
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
            'Classifique o lead imobiliário com um score de 0 a 100 (JSON apenas: {"score":number,"motivo":string}).',
        },
        {
          role: 'user',
          content: `Nome: ${nome ?? ''}\nOrigem: ${origem ?? ''}\nMensagem: ${mensagem ?? ''}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ score: 50, motivo: 'fallback' }, { status: 200 })
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const raw = body.choices?.[0]?.message?.content ?? '{"score":50,"motivo":"indeterminado"}'
  try {
    const parsed = JSON.parse(raw) as { score: number; motivo: string }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ score: 50, motivo: 'parse' })
  }
}
