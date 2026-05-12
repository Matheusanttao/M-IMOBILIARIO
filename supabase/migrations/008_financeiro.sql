-- ============================================================
-- 008: Financeiro — categorias e lançamentos
-- ============================================================

create table if not exists public.financeiro_categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  cor text,
  created_at timestamptz not null default now()
);

create index if not exists financeiro_categorias_empresa_idx
  on public.financeiro_categorias (empresa_id);

create table if not exists public.financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  categoria_id uuid references public.financeiro_categorias (id) on delete set null,
  contrato_id uuid references public.contratos (id) on delete set null,
  proprietario_id uuid references public.proprietarios (id) on delete set null,
  descricao text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  subtipo text,
  valor numeric(12, 2) not null,
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente'
    check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  comprovante_url text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financeiro_lancamentos_empresa_idx
  on public.financeiro_lancamentos (empresa_id);
create index if not exists financeiro_lancamentos_venc_idx
  on public.financeiro_lancamentos (data_vencimento);

alter table public.financeiro_categorias enable row level security;
alter table public.financeiro_lancamentos enable row level security;

drop policy if exists financeiro_categorias_all on public.financeiro_categorias;
create policy financeiro_categorias_all on public.financeiro_categorias
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists financeiro_lancamentos_all on public.financeiro_lancamentos;
create policy financeiro_lancamentos_all on public.financeiro_lancamentos
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);
