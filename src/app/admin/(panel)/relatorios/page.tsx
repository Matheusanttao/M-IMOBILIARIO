'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function AdminRelatoriosPage() {
  const [csv, setCsv] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const supabase = createClient()
      const { data } = await supabase.from('leads').select('name,phone,email,status,created_at')
      if (cancelled || !data) return
      const header = 'nome,telefone,email,status,criado_em'
      const lines = data.map(
        (r: { name: string; phone: string | null; email: string | null; status: string; created_at: string }) =>
          [r.name, r.phone ?? '', r.email ?? '', r.status, r.created_at].join(','),
      )
      setCsv([header, ...lines].join('\n'))
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  function download() {
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Relatórios</h1>
      <p className="mt-2 text-muted">Exportação rápida de leads (CSV).</p>
      <div className="mt-8">
        <Button type="button" onClick={download} disabled={!csv}>
          Baixar leads.csv
        </Button>
      </div>
    </div>
  )
}
