import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
}

export default async function BlogPage() {
  let posts: { id: string; titulo: string; slug: string; created_at: string }[] = []

  if (isServerSupabaseConfigured()) {
    const cookieStore = await cookies()
    const slug = cookieStore.get('tenant_slug')?.value ?? 'demo'
    const supabase = await createServerSupabaseClient()
    const { data: emp } = await supabase
      .from('empresas')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    const { data } = await supabase
      .from('blog_posts')
      .select('id,titulo,slug,created_at')
      .eq('empresa_id', emp?.id ?? '')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(20)

    posts = data ?? []
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        Conteúdo
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">Blog</h1>
      <p className="mt-2 text-white/60">Artigos e novidades do mercado imobiliário.</p>
      <ul className="mt-10 space-y-4">
        {(posts ?? []).length === 0 ? (
          <li className="text-white/55">Nenhum post publicado ainda.</li>
        ) : (
          (posts ?? []).map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/${p.slug}`}
                className="font-medium text-white transition hover:text-accent"
              >
                {p.titulo}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
