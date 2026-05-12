import { NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10
const requestLog: number[] = []

function isRateLimited(): boolean {
  const now = Date.now()
  while (requestLog.length && requestLog[0] < now - RATE_LIMIT_WINDOW) {
    requestLog.shift()
  }
  if (requestLog.length >= RATE_LIMIT_MAX) return true
  requestLog.push(now)
  return false
}

interface DescricaoInput {
  titulo?: string
  tipo?: string
  finalidade?: string
  cidade?: string
  bairro?: string
  quartos?: number
  banheiros?: number
  vagas?: number
  area?: number
}

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json(
      {
        error: 'OPENAI_API_KEY não configurada. Adicione a variável de ambiente para usar a geração com IA.',
      },
      { status: 503 },
    )
  }

  if (isRateLimited()) {
    return NextResponse.json(
      { error: 'Limite de requisições atingido. Tente novamente em 1 minuto.' },
      { status: 429 },
    )
  }

  const input: DescricaoInput = await request.json().catch(() => ({}))

  const { titulo, tipo, finalidade, cidade, bairro, quartos, banheiros, vagas, area } = input

  const prompt = [
    `Gere uma descrição profissional e atrativa para um imóvel com as seguintes características:`,
    titulo && `Título: ${titulo}`,
    tipo && `Tipo: ${tipo}`,
    finalidade && `Finalidade: ${finalidade}`,
    cidade && `Cidade: ${cidade}`,
    bairro && `Bairro: ${bairro}`,
    quartos != null && `Quartos: ${quartos}`,
    banheiros != null && `Banheiros: ${banheiros}`,
    vagas != null && `Vagas de garagem: ${vagas}`,
    area != null && `Área: ${area}m²`,
    '',
    'Responda APENAS com JSON no formato: {"descricao": "...", "seo_titulo": "...", "seo_descricao": "..."}',
    'A descricao deve ter 3-5 parágrafos, ser envolvente e profissional em português brasileiro.',
    'O seo_titulo deve ter no máximo 60 caracteres.',
    'A seo_descricao deve ter no máximo 160 caracteres.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
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
              'Você é um copywriter especialista em mercado imobiliário brasileiro. Escreva descrições envolventes, profissionais e otimizadas para SEO. Responda SEMPRE em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[ai/descricao] OpenAI error:', errText)
      return NextResponse.json(
        { error: 'Erro ao chamar a API da OpenAI' },
        { status: 502 },
      )
    }

    const completion = await res.json()
    const content = completion.choices?.[0]?.message?.content ?? ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { descricao: content, seo_titulo: '', seo_descricao: '' },
      )
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      descricao: parsed.descricao ?? content,
      seo_titulo: parsed.seo_titulo ?? '',
      seo_descricao: parsed.seo_descricao ?? '',
    })
  } catch (err) {
    console.error('[ai/descricao] error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao gerar descrição' },
      { status: 500 },
    )
  }
}
