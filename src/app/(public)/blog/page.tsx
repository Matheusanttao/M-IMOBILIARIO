import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Blog',
}

export default async function BlogPage() {
  const cookieStore = await cookies()
  const slug = cookieStore.get('tenant_slug')?.value ?? 'demo'
  const supabase = await createServerSupabaseClient()
  const { data: emp } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id,titulo,slug,created_at')
    .eq('empresa_id', emp?.id ?? '')
    .eq('publicado', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-primary">Blog</h1>
      <p className="mt-2 text-muted">Artigos e novidades do mercado imobiliário.</p>
      <ul className="mt-10 space-y-4">
        {(posts ?? []).length === 0 ? (
          <li className="text-muted">Nenhum post publicado ainda.</li>
        ) : (
          (posts ?? []).map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/${p.slug}`}
                className="font-medium text-primary hover:underline"
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
