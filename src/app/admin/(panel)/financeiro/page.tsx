'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { fetchLancamentos, saveLancamento } from '@/services/financeiro'
import type { FinanceiroLancamentoRow } from '@/types'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function parseMoneyBR(value: string) {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  return Number(normalized)
}

function formatCurrencyBRL(value: number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function AdminFinanceiroPage() {
  const [rows, setRows] = useState<FinanceiroLancamentoRow[]>([])
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita')

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: u } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
      if (!cancelled && u?.empresa_id) setEmpresaId(u.empresa_id as string)
      const list = await fetchLancamentos()
      if (!cancelled) setRows(list)
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const chartData = rows.reduce<Record<string, { name: string; receita: number; despesa: number }>>(
    (acc, r) => {
      const key = r.data_vencimento.slice(0, 7)
      if (!acc[key]) acc[key] = { name: key, receita: 0, despesa: 0 }
      if (r.tipo === 'receita') acc[key].receita += Number(r.valor)
      if (r.tipo === 'despesa') acc[key].despesa += Number(r.valor)
      return acc
    },
    {},
  )
  const chart = Object.values(chartData).sort((a, b) => a.name.localeCompare(b.name))

  async function adicionar() {
    if (!empresaId || !desc.trim()) return
    const v = parseMoneyBR(valor)
    if (!Number.isFinite(v) || v <= 0) return
    const hoje = new Date().toISOString().slice(0, 10)
    await saveLancamento({
      empresa_id: empresaId,
      categoria_id: null,
      contrato_id: null,
      proprietario_id: null,
      descricao: desc.trim(),
      tipo,
      subtipo: null,
      valor: v,
      data_vencimento: hoje,
      data_pagamento: null,
      status: 'pendente',
      comprovante_url: null,
      observacoes: null,
    })
    setDesc('')
    setValor('')
    setRows(await fetchLancamentos())
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Financeiro</h1>
      <p className="mt-1 text-muted">Contas a pagar / receber e fluxo mensal por vencimento.</p>

      <div className="mt-8 h-72 rounded-2xl border border-slate-100 bg-white p-4 text-slate-700 shadow-md">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" fontSize={12} stroke="#475569" />
            <YAxis fontSize={12} stroke="#475569" />
            <Tooltip
              formatter={(value) => formatCurrencyBRL(Number(value))}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#0f172a',
              }}
            />
            <Legend wrapperStyle={{ color: '#334155' }} />
            <Bar dataKey="receita" fill="#1a365d" name="Receita" />
            <Bar dataKey="despesa" fill="#d4a853" name="Despesa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-10 grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 text-slate-800 shadow-md md:grid-cols-3">
        <Input label="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Input label="Valor" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'receita' | 'despesa')}
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <Button type="button" onClick={() => void adicionar()}>
            Adicionar lançamento
          </Button>
        </div>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-100 bg-white text-slate-800 shadow-md">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Vencimento</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                <td className="px-3 py-2 font-medium text-slate-900">{r.descricao}</td>
                <td className="px-3 py-2 capitalize text-slate-700">{r.tipo}</td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {formatCurrencyBRL(Number(r.valor))}
                </td>
                <td className="px-3 py-2 text-slate-700">{r.data_vencimento}</td>
                <td className="px-3 py-2 capitalize text-slate-700">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
