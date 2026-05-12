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

function mapMpPaymentStatusToDb(
  status: string | undefined,
): 'pendente' | 'aprovado' | 'recusado' | 'estornado' {
  const s = (status ?? '').toLowerCase()
  if (s === 'approved') return 'aprovado'
  if (s === 'refunded' || s === 'charged_back') return 'estornado'
  if (s === 'rejected' || s === 'cancelled') return 'recusado'
  return 'pendente'
}

async function handlePayment(dataId: string) {
  const payment = await fetchMPPayment(dataId)
  const db = supabaseAdmin()

  const empresaId = payment.metadata?.empresa_id as string | undefined
  const assinaturaId = payment.metadata?.assinatura_id as string | undefined
  if (!empresaId) {
    console.warn('[mercadopago] payment missing empresa_id in metadata', payment.id)
    return
  }

  const row = {
    mercadopago_payment_id: String(payment.id),
    status: mapMpPaymentStatusToDb(payment.status),
    valor: Number(payment.transaction_amount ?? 0),
    metodo: payment.payment_method_id != null ? String(payment.payment_method_id) : null,
    empresa_id: empresaId,
    assinatura_id: assinaturaId ?? null,
    detalhes: payment as unknown as Record<string, unknown>,
    data_pagamento:
      payment.status === 'approved' && payment.date_approved
        ? String(payment.date_approved)
        : null,
  }

  const { error } = await db.from('pagamentos').upsert(row, {
    onConflict: 'mercadopago_payment_id',
  })
  if (error) {
    console.error('[mercadopago] pagamentos upsert error:', error)
    throw error
  }

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

  const mpStatus = (sub.status as string | undefined)?.toLowerCase()
  let statusAssinatura: 'ativa' | 'cancelada' | 'inadimplente' | 'trial' = 'trial'
  if (mpStatus === 'authorized') statusAssinatura = 'ativa'
  else if (mpStatus === 'cancelled') statusAssinatura = 'cancelada'
  else if (mpStatus === 'paused') statusAssinatura = 'inadimplente'

  const payload = {
    status: statusAssinatura,
    mercadopago_subscription_id: String(sub.id),
    updated_at: new Date().toISOString(),
  }

  const { data: updatedRows, error: err1 } = await db
    .from('assinaturas')
    .update(payload)
    .eq('mercadopago_subscription_id', String(sub.id))
    .select('id')

  if (err1) {
    console.error('[mercadopago] assinaturas update error:', err1)
    throw err1
  }

  if (!updatedRows?.length && typeof sub.external_reference === 'string') {
    try {
      const ref = JSON.parse(sub.external_reference) as { empresa_id?: string }
      if (ref.empresa_id) {
        const { error: err2 } = await db
          .from('assinaturas')
          .update(payload)
          .eq('empresa_id', ref.empresa_id)
        if (err2) console.error('[mercadopago] assinaturas update by empresa error:', err2)
      }
    } catch {
      /* ignore */
    }
  }

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
