'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { BlogPostRow } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatDatePt } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

type PostDraft = {
  titulo: string
  slug: string
  conteudo: string
  imagem_capa: string
  publicado: boolean
  seo_titulo: string
  seo_descricao: string
}

const emptyDraft: PostDraft = {
  titulo: '',
  slug: '',
  conteudo: '',
  imagem_capa: '',
  publicado: false,
  seo_titulo: '',
  seo_descricao: '',
}

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function AdminBlogPage() {
  const supabase = useMemo(() => createClient(), [])

  const [posts, setPosts] = useState<BlogPostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PostDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else {
      setPosts((data as BlogPostRow[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  function openNew() {
    setEditingId(null)
    setDraft(emptyDraft)
    setSaveError(null)
    setEditorOpen(true)
  }

  function openEdit(post: BlogPostRow) {
    setEditingId(post.id)
    setDraft({
      titulo: post.titulo,
      slug: post.slug,
      conteudo: post.conteudo,
      imagem_capa: post.imagem_capa ?? '',
      publicado: post.publicado,
      seo_titulo: '',
      seo_descricao: '',
    })
    setSaveError(null)
    setEditorOpen(true)
  }

  function updateDraft<K extends keyof PostDraft>(field: K, value: PostDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'titulo' && !editingId) {
        next.slug = slugify(value as string)
      }
      return next
    })
  }

  async function save() {
    setSaving(true)
    setSaveError(null)

    const payload = {
      titulo: draft.titulo.trim(),
      slug: draft.slug.trim() || slugify(draft.titulo),
      conteudo: draft.conteudo,
      imagem_capa: draft.imagem_capa.trim() || null,
      publicado: draft.publicado,
    }

    if (!payload.titulo) {
      setSaveError('Título é obrigatório.')
      setSaving(false)
      return
    }

    if (editingId) {
      const { error: err } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', editingId)
      if (err) {
        setSaveError(err.message)
        setSaving(false)
        return
      }
    } else {
      const { error: err } = await supabase.from('blog_posts').insert(payload)
      if (err) {
        setSaveError(err.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setEditorOpen(false)
    fetchPosts()
  }

  async function togglePublicado(post: BlogPostRow) {
    const { error: err } = await supabase
      .from('blog_posts')
      .update({ publicado: !post.publicado })
      .eq('id', post.id)
    if (!err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, publicado: !p.publicado } : p,
        ),
      )
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('blog_posts').delete().eq('id', deleteId)
    setDeleting(false)
    setDeleteId(null)
    fetchPosts()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Blog</h1>
          <p className="mt-1 text-muted">Gerencie artigos e publicações.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Novo artigo
        </Button>
      </div>

      {/* Posts list */}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-surface/80 text-xs uppercase text-muted">
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  Nenhum artigo encontrado. Crie o primeiro!
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-b border-slate-50 transition hover:bg-surface/40"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  <button
                    type="button"
                    className="text-left hover:text-primary hover:underline"
                    onClick={() => openEdit(post)}
                  >
                    {post.titulo}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-500">{post.slug}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => togglePublicado(post)}>
                    <Badge variant={post.publicado ? 'success' : 'muted'}>
                      {post.publicado ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDatePt(post.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(post)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(post.id)}
                      aria-label="Excluir"
                      className="text-red-600 hover:bg-red-50"
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

      {/* Editor modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Editar artigo' : 'Novo artigo'}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={draft.titulo}
            onChange={(e) => updateDraft('titulo', e.target.value)}
          />
          <Input
            label="Slug"
            value={draft.slug}
            onChange={(e) => updateDraft('slug', e.target.value)}
            placeholder="gerado-automaticamente"
          />
          <Textarea
            label="Conteúdo"
            rows={10}
            value={draft.conteudo}
            onChange={(e) => updateDraft('conteudo', e.target.value)}
          />
          <Input
            label="URL da imagem de capa"
            value={draft.imagem_capa}
            onChange={(e) => updateDraft('imagem_capa', e.target.value)}
            placeholder="https://..."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="SEO — Título"
              value={draft.seo_titulo}
              onChange={(e) => updateDraft('seo_titulo', e.target.value)}
              placeholder="Título para buscadores"
            />
            <Input
              label="SEO — Descrição"
              value={draft.seo_descricao}
              onChange={(e) => updateDraft('seo_descricao', e.target.value)}
              placeholder="Descrição curta para buscadores"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.publicado}
              onChange={(e) => updateDraft('publicado', e.target.checked)}
              className="size-4 rounded border-slate-300 text-primary focus:ring-accent"
            />
            Publicar artigo
          </label>

          {saveError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editingId ? 'Salvar alterações' : 'Criar artigo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Excluir artigo"
      >
        <p className="text-sm text-slate-600">
          Tem certeza que deseja excluir este artigo? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleting}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
