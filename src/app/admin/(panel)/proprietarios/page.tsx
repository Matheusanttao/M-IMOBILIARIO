'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useProprietarios } from '@/hooks/useProprietarios'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDatePt } from '@/lib/utils'
import { PermissionGuard } from '@/components/rbac/PermissionGuard'

export default function AdminProprietariosPage() {
  const [search, setSearch] = useState('')
  const filters = useMemo(() => ({ search, ativo: null as boolean | null }), [search])
  const { rows, loading, error, total, page, setPage } = useProprietarios(filters)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Proprietários</h1>
          <p className="mt-1 text-muted">Cadastro completo, documentos e vínculo com imóveis.</p>
        </div>
        <PermissionGuard modulo="proprietarios" acao="criar">
          <Link href="/admin/proprietarios/novo">
            <Button type="button">Novo proprietário</Button>
          </Link>
        </PermissionGuard>
      </div>

      <div className="mt-8 max-w-md">
        <Input
          label="Buscar por nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Digite para filtrar…"
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
        {loading ? (
          <p className="p-8 text-center text-muted">Carregando…</p>
        ) : error ? (
          <p className="p-8 text-center text-red-600">{error}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">CPF/CNPJ</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-surface/40">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/proprietarios/${p.id}`} className="text-primary hover:underline">
                      {p.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.cpf_cnpj ?? p.documento ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.telefone ?? p.whatsapp ?? p.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.ativo ? 'success' : 'muted'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDatePt(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Total: {total}</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={(page + 1) * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
