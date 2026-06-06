# M. Imobiliário

Plataforma **SaaS multi-tenant** para imobiliárias: site público, painel da imobiliária e painel master, com **Next.js 15 (App Router)**, **Supabase** (Auth + PostgreSQL + RLS), **Cloudinary** e **Tailwind CSS**.

## Stack

- **Next.js 15** + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — `@supabase/ssr`, PostgreSQL, RLS, Realtime (notificações)
- **Cloudinary** — upload com preset **unsigned**
- **React Hook Form** + **Zod**
- **TanStack React Query**, **date-fns**, **lucide-react**, **recharts**
- **pnpm**

## Como rodar

1. Instale dependências:

   ```bash
   pnpm install
   ```

2. **Supabase** — crie um projeto em [supabase.com](https://supabase.com) e aplique as migrations **nesta ordem**:

   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_multi_tenant.sql`
   - `supabase/migrations/003_public_tenant_read.sql`
   - `supabase/migrations/004_enterprise_foundation.sql` — índice MP, papéis estendidos, tabela `permissoes`, RLS captador/atendente
   - `supabase/migrations/005_proprietarios_enterprise.sql` — proprietários N:N, documentos
   - `supabase/migrations/006_crm_pipeline.sql` — pipeline 8 estágios, `lead_comentarios`, `lead_tarefas`, `lead_anexos`
   - `supabase/migrations/007_propostas_contratos.sql` — `propostas`, colunas extras em `contratos`
   - `supabase/migrations/008_financeiro.sql` — categorias e lançamentos
   - `supabase/migrations/009_geo_imoveis.sql` — `localizacao_aproximada`, índice lat/lng
   - `supabase/migrations/010_audit_logs.sql` — colunas extras em `logs`
   - `supabase/migrations/011_saas_cupons.sql` — trial, cupons, afiliados
   - `supabase/migrations/012_realtime_notificacoes.sql` — publication Realtime (opcional)

   Use o CLI (`supabase db push`) ou o SQL Editor.

3. Crie usuários em **Authentication → Users** e associe perfis em `public.usuarios` (com `empresa_id` e `role`: `master`, `admin`, `gerente`, `corretor`, `financeiro`, `captador`, `atendente`).

4. **Cloudinary** — preset de upload **unsigned**; anote cloud name e nome do preset.

5. Copie `.env.example` para `.env.local` e preencha:

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` (ex.: `demo` — empresa seed na migration)
   - `NEXT_PUBLIC_CLOUDINARY_*`, `NEXT_PUBLIC_SITE_URL`
   - Opcional: OpenAI, WhatsApp (ver `.env.example`)

6. Desenvolvimento:

   ```bash
   pnpm dev
   ```

7. Build de produção:

   ```bash
   pnpm run build
   pnpm start
   ```

## Rotas principais

| Área | Caminho |
|------|---------|
| Site público | `/`, `/imoveis`, `/imoveis/[slug]`, `/blog`, `/sobre`, `/contato`, `/corretores`, `/comparar`, `/favoritos` |
| Portais | `/portal/cliente`, `/portal/proprietario` |
| Admin imobiliária | `/admin`, `/admin/imoveis`, `/admin/leads`, `/admin/leads/[id]`, `/admin/proprietarios`, `/admin/financeiro`, `/admin/contratos`, `/admin/mapa`, `/admin/notificacoes`, … |
| Login admin | `/admin/login` |
| Master SaaS | `/master`, `/master/empresas`, `/master/logs`, … |

**Tenant no site público:** o middleware define o cookie `tenant_slug` (subdomínio em produção ou `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` em localhost).

## API / integrações

- `POST /api/ai/descricao` — sugestão de descrição (requer `OPENAI_API_KEY` no servidor)
- `POST /api/ai/chat` — chatbot (site público)
- `POST /api/ai/lead-score` — classificação de lead (score JSON)

## Deploy

- **Frontend:** [Vercel](https://vercel.com) — conectar o repositório, definir as mesmas variáveis de ambiente.
- **Banco:** projeto Supabase já vinculado; aplicar migrations no ambiente remoto.

## Licença

Uso interno / conforme o repositório.
