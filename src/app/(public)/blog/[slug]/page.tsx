import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  if (!isServerSupabaseConfigured()) return { title: 'Post' }

  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const cookieStore = await cookies()
  const tenant = cookieStore.get('tenant_slug')?.value ?? 'demo'
  const { data: emp } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', tenant)
    .maybeSingle()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('titulo, seo_titulo, seo_descricao')
    .eq('slug', slug)
    .eq('empresa_id', emp?.id ?? '')
    .eq('publicado', true)
    .maybeSingle()
  if (!post) return { title: 'Post' }
  return {
    title: post.seo_titulo ?? post.titulo,
    description: post.seo_descricao ?? undefined,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  if (!isServerSupabaseConfigured()) notFound()

  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const cookieStore = await cookies()
  const tenant = cookieStore.get('tenant_slug')?.value ?? 'demo'
  const { data: emp } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', tenant)
    .maybeSingle()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('empresa_id', emp?.id ?? '')
    .eq('publicado', true)
    .maybeSingle()
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        Blog
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">{post.titulo}</h1>
      <div
        className="prose prose-invert mt-8 max-w-none prose-a:text-accent"
        dangerouslySetInnerHTML={{ __html: post.conteudo.replace(/\n/g, '<br/>') }}
      />
    </article>
  )
}
