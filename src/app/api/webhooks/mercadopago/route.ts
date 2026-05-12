import { NextResponse } from 'next/server'

/** Webhook Mercado Pago — validação completa recomendada na Edge Function com service role. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({
        ok: true,
        message: 'MERCADOPAGO_WEBHOOK_SECRET não configurado — noop em dev',
      })
    }
    // eslint-disable-next-line no-console
    console.info('[mercadopago]', body?.type, body?.data?.id)
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
}
