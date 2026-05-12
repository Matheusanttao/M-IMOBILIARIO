-- ============================================================
-- 011: SaaS — trial por empresa, cupons, afiliados
-- ============================================================

alter table public.empresas add column if not exists trial_fim timestamptz;
alter table public.empresas add column if not exists afiliado_codigo text unique;
alter table public.empresas add column if not exists indicado_por uuid references public.empresas (id) on delete set null;

create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  descricao text,
  percentual_desconto numeric(5, 2) check (percentual_desconto >= 0 and percentual_desconto <= 100),
  valor_desconto numeric(12, 2),
  ativo boolean not null default true,
  valido_ate timestamptz,
  uso_maximo integer,
  usos integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.assinatura_cupons (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas (id) on delete cascade,
  cupom_id uuid not null references public.cupons (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.cupons enable row level security;
alter table public.assinatura_cupons enable row level security;

drop policy if exists cupons_master on public.cupons;
create policy cupons_master on public.cupons
for all using (public.is_master()) with check (public.is_master());

drop policy if exists cupons_select_anon on public.cupons;
create policy cupons_select_anon on public.cupons
for select using (ativo = true);

drop policy if exists assinatura_cupons_master on public.assinatura_cupons;
create policy assinatura_cupons_master on public.assinatura_cupons
for all using (public.is_master()) with check (public.is_master());

drop policy if exists assinatura_cupons_tenant on public.assinatura_cupons;
create policy assinatura_cupons_tenant on public.assinatura_cupons
for select using (
  exists (
    select 1 from public.assinaturas a
    where a.id = assinatura_id
    and a.empresa_id = public.user_empresa_id()
  )
);
