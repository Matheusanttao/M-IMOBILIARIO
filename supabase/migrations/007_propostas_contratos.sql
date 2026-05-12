-- ============================================================
-- 007: Propostas e expansão de contratos
-- ============================================================

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  tipo text not null check (tipo in ('compra', 'locacao')),
  valor_proposto numeric(12, 2) not null,
  condicoes text,
  status text not null default 'pendente'
    check (status in ('pendente', 'aceita', 'contraproposta', 'rejeitada', 'expirada')),
  validade timestamptz,
  observacoes text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists propostas_empresa_id_idx on public.propostas (empresa_id);
create index if not exists propostas_lead_id_idx on public.propostas (lead_id);

alter table public.contratos add column if not exists proposta_id uuid references public.propostas (id) on delete set null;
alter table public.contratos add column if not exists assinatura_digital_url text;
alter table public.contratos add column if not exists assinado_cliente_em timestamptz;
alter table public.contratos add column if not exists assinado_proprietario_em timestamptz;
alter table public.contratos add column if not exists pdf_url text;

alter table public.contratos drop constraint if exists contratos_status_check;
update public.contratos set status = 'rascunho' where status is null;
alter table public.contratos add constraint contratos_status_check
  check (status in (
    'rascunho', 'aguardando_assinatura', 'ativo', 'encerrado', 'cancelado'
  ));

alter table public.propostas enable row level security;

drop policy if exists propostas_all on public.propostas;
create policy propostas_all on public.propostas
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);
