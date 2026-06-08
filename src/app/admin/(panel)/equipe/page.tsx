'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Users,
  Info,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TeamMember {
  id: string
  nome: string
  email: string
  role: UserRole
  creci: string | null
  telefone: string | null
  ativo: boolean
}

interface MemberFormData {
  nome: string
  email: string
  role: UserRole
  creci: string
  telefone: string
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'corretor', label: 'Corretor' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'captador', label: 'Captador' },
  { value: 'atendente', label: 'Atendente' },
]

const ROLE_BADGE: Record<UserRole, 'default' | 'accent' | 'success' | 'muted'> = {
  master: 'default',
  admin: 'default',
  gerente: 'accent',
  corretor: 'success',
  financeiro: 'accent',
  captador: 'success',
  atendente: 'muted',
}

const EMPTY_FORM: MemberFormData = {
  nome: '',
  email: '',
  role: 'corretor',
  creci: '',
  telefone: '',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminEquipePage() {
  const supabase = useMemo(() => createClient(), [])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MemberFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MemberFormData, string>>>({})
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* ---------- fetch ---------- */

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nome,email,role,creci,telefone,ativo')
      .order('nome')

    if (error) {
      setFeedback({ type: 'error', message: error.message })
    } else {
      setMembers((data as TeamMember[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  /* ---------- helpers ---------- */

  function flash(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  function openAddModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEditModal(member: TeamMember) {
    setEditingId(member.id)
    setForm({
      nome: member.nome,
      email: member.email,
      role: member.role,
      creci: member.creci ?? '',
      telefone: member.telefone ?? '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof MemberFormData, string>> = {}
    if (!form.nome.trim()) errs.nome = 'Obrigatório'
    if (!form.email.trim()) errs.email = 'Obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'E-mail inválido'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ---------- save (add / edit) ---------- */

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      role: form.role,
      creci: form.creci.trim() || null,
      telefone: form.telefone.trim() || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        flash('error', error.message)
        setSaving(false)
        return
      }
      flash('success', 'Membro atualizado!')
    } else {
      const res = await fetch('/api/admin/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        flash('error', body?.error ?? 'Não foi possível adicionar o membro.')
        setSaving(false)
        return
      }
      flash('success', 'Convite enviado e membro adicionado!')
    }

    setSaving(false)
    setModalOpen(false)
    fetchMembers()
  }

  /* ---------- toggle ativo ---------- */

  async function toggleAtivo(member: TeamMember) {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !member.ativo })
      .eq('id', member.id)

    if (error) {
      flash('error', error.message)
      return
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, ativo: !m.ativo } : m)),
    )
    flash('success', member.ativo ? 'Membro desativado.' : 'Membro ativado.')
  }

  /* ---------- delete ---------- */

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      flash('error', error.message)
      setDeleting(false)
      return
    }

    flash('success', 'Membro removido.')
    setDeleting(false)
    setDeleteTarget(null)
    fetchMembers()
  }

  /* ---------- render ---------- */

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Equipe
          </h1>
          <p className="mt-2 text-muted">
            Gerencie corretores, captadores e permissões do seu time.
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="size-4" />
          Adicionar membro
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Table */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 shadow-md">
          <Users className="size-10 text-slate-300" />
          <p className="text-muted">Nenhum membro na equipe.</p>
          <Button variant="secondary" size="sm" onClick={openAddModal}>
            Adicionar primeiro membro
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface/80 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">CRECI</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((m) => (
                <tr
                  key={m.id}
                  className={
                    m.ativo
                      ? 'transition-colors hover:bg-slate-50'
                      : 'bg-slate-50/60 text-slate-400 transition-colors'
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {m.nome}
                  </td>
                  <td className="px-4 py-3">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_BADGE[m.role]}>
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{m.creci ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleAtivo(m)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                        m.ativo
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className={`size-2 rounded-full ${
                          m.ativo ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5"
                        onClick={() => openEditModal(m)}
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteTarget(m)}
                        title="Remover"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Membro' : 'Adicionar Membro'}
      >
        <div className="space-y-4">
          {!editingId && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                O usuário precisa já estar cadastrado no Supabase Auth. Aqui
                você vincula o perfil ao seu time.
              </span>
            </div>
          )}

          <Input
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            error={formErrors.nome}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={formErrors.email}
            readOnly={!!editingId}
            className={editingId ? 'cursor-not-allowed bg-slate-50 text-slate-500' : ''}
          />
          <Select
            label="Papel"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as UserRole })
            }
          />
          <Input
            label="CRECI"
            value={form.creci}
            onChange={(e) => setForm({ ...form, creci: e.target.value })}
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar exclusão"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">
                Remover {deleteTarget?.nome}?
              </p>
              <p className="mt-1">
                Essa ação não poderá ser desfeita. Todos os dados vinculados a
                este membro poderão ser afetados.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              Sim, remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
