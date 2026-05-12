import { NextResponse } from 'next/server'

/** Stub IA — mover lógica para Supabase Edge Function com OPENAI_API_KEY. */
export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json(
      {
        descricao:
          'Configure OPENAI_API_KEY no ambiente Vercel para gerar descrições com IA.',
      },
      { status: 200 },
    )
  }
  const { titulo } = (await request.json().catch(() => ({}))) as { titulo?: string }
  return NextResponse.json({
    descricao: `Descrição sugerida para: ${titulo ?? 'imóvel'}. (Conecte o modelo OpenAI aqui.)`,
  })
}
