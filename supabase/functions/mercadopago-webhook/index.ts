// Deno Edge Function — deploy: supabase functions deploy mercadopago-webhook
// Recomendado: apontar o webhook do Mercado Pago diretamente para
// POST {NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago (Next.js).
// Esta função pode encaminhar o body bruto para a mesma URL se configurar NEXT_PUBLIC_SITE_URL.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const site = Deno.env.get('NEXT_PUBLIC_SITE_URL')?.replace(/\/$/, '')
  const sig = req.headers.get('x-signature')
  const raw = await req.text()

  if (site) {
    try {
      await fetch(`${site}/api/webhooks/mercadopago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sig ? { 'x-signature': sig } : {}),
        },
        body: raw,
      })
    } catch (e) {
      console.error('[mercadopago-webhook] forward error', e)
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
