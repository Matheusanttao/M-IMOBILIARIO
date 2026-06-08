'use client'

import { useEffect, useState } from 'react'
import { fetchContratos } from '@/services/contratos'
import { Spinner } from '@/components/ui/Spinner'

export default function AdminContratosPage() {
  const [contratos, setContratos] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const c = await fetchContratos()
        if (!cancelled) setContratos(c)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar contratos.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Contratos</h1>
      <p className="mt-1 text-muted">Contratos vinculados aos imóveis.</p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        ) : contratos.length ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-muted">
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Imóvel</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((row) => {
                const r = row as Record<string, unknown>
                return (
                  <tr key={String(r.id)} className="border-b border-slate-50">
                    <td className="px-3 py-2">R$ {Number(r.valor).toLocaleString('pt-BR')}</td>
                    <td className="px-3 py-2">{String(r.tipo)}</td>
                    <td className="px-3 py-2">{String(r.status)}</td>
                    <td className="px-3 py-2">
                      {(r.imoveis as { titulo?: string } | null)?.titulo ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-sm text-muted">Nenhum contrato cadastrado ainda.</p>
        )}
      </div>
    </div>
  )
}
