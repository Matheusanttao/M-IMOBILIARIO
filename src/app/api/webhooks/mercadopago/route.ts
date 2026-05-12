import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const parts = signature.split(',')
  const tsEntry = parts.find((p) => p.startsWith('ts='))
  const v1Entry = parts.find((p) => p.startsWith('v1='))
  if (!tsEntry || !v1Entry) return false

  const ts = tsEntry.replace('ts=', '')
  const hash = v1Entry.replace('v1=', '')
  const manifest = `id:;request-id:;ts:${ts};`
  const hmac = crypto.createHmac('sha256', secret).update(manifest + body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))
}

async function fetchMPPayment(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`MP API error: ${res.status}`)
  return res.json()
}

async function handlePayment(dataId: string) {
  const payment = await fetchMPPayment(dataId)
  const db = supabaseAdmin()

  await db.from('pagamentos').upsert(
    {
      mp_payment_id: String(payment.id),
      status: payment.status,
      valor: payment.transaction_amount,
      metodo: payment.payment_method_id,
      empresa_id: payment.metadata?.empresa_id ?? null,
      assinatura_id: payment.metadata?.assinatura_id ?? null,
      dados_mp: payment,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'mp_payment_id' },
  )

  console.info('[mercadopago] payment upserted:', payment.id, payment.status)
}

async function handleSubscription(dataId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${dataId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`MP subscription API error: ${res.status}`)
  const sub = await res.json()
  const db = supabaseAdmin()

  await db
    .from('assinaturas')
    .update({
      status_mp: sub.status,
      dados_mp: sub,
      atualizado_em: new Date().toISOString(),
    })
    .eq('mp_preapproval_id', String(sub.id))

  console.info('[mercadopago] subscription updated:', sub.id, sub.status)
}

export async function POST(request: Request) {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (!secret) {
      console.warn('[mercadopago] MERCADOPAGO_WEBHOOK_SECRET not configured')
      return NextResponse.json({ received: true })
    }

    const rawBody = await request.text()
    const signature = request.headers.get('x-signature')

    if (!verifySignature(rawBody, signature, secret)) {
      console.warn('[mercadopago] invalid signature')
      return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
    }

    const body = JSON.parse(rawBody)
    const { type, data } = body
    const dataId = data?.id ? String(data.id) : null

    console.info('[mercadopago] event:', type, dataId)

    if (!dataId) {
      return NextResponse.json({ received: true })
    }

    switch (type) {
      case 'payment':
        await handlePayment(dataId)
        break
      case 'subscription_preapproval':
      case 'subscription_authorized_payment':
        await handleSubscription(dataId)
        break
      default:
        console.info('[mercadopago] unhandled event type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[mercadopago] webhook error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
