import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

export async function POST(request: Request) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' },
        { status: 500 },
      )
    }

    const { plano_id, empresa_id } = await request.json()

    if (!plano_id || !empresa_id) {
      return NextResponse.json(
        { error: 'plano_id e empresa_id são obrigatórios' },
        { status: 400 },
      )
    }

    const db = supabaseAdmin()
    const { data: plano, error: planoErr } = await db
      .from('planos')
      .select('*')
      .eq('id', plano_id)
      .single()

    if (planoErr || !plano) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const subscriptionBody = {
      reason: `M-Imobiliário — ${plano.nome}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plano.preco,
        currency_id: 'BRL',
      },
      back_url: `${siteUrl}/planos/sucesso`,
      external_reference: JSON.stringify({ empresa_id, plano_id }),
      payer_email: '',
      status: 'pending',
    }

    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionBody),
    })

    if (!mpRes.ok) {
      const errBody = await mpRes.text()
      console.error('[mercadopago/checkout] MP error:', errBody)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura no Mercado Pago' },
        { status: 502 },
      )
    }

    const mpData = await mpRes.json()

    return NextResponse.json({
      init_point: mpData.init_point,
      subscription_id: mpData.id,
    })
  } catch (err) {
    console.error('[mercadopago/checkout] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
