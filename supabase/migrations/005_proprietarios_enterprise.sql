-- ============================================================
-- 005: Proprietários — campos extras, documentos, N:N imóvel
-- ============================================================

alter table public.proprietarios add column if not exists cpf_cnpj text;
alter table public.proprietarios add column if not exists rg_ie text;
alter table public.proprietarios add column if not exists whatsapp text;
alter table public.proprietarios add column if not exists chave_pix text;
alter table public.proprietarios add column if not exists tipo_chave_pix text;
alter table public.proprietarios add column if not exists banco text;
alter table public.proprietarios add column if not exists agencia text;
alter table public.proprietarios add column if not exists conta text;
alter table public.proprietarios add column if not exists tipo_conta text;
alter table public.proprietarios add column if not exists avatar_url text;
alter table public.proprietarios add column if not exists observacoes text;
alter table public.proprietarios add column if not exists ativo boolean not null default true;

create table if not exists public.proprietario_documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  proprietario_id uuid not null references public.proprietarios (id) on delete cascade,
  nome text not null,
  url text not null,
  tipo text,
  created_at timestamptz not null default now()
);

create index if not exists proprietario_documentos_prop_idx
  on public.proprietario_documentos (proprietario_id);

create table if not exists public.imovel_proprietarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  proprietario_id uuid not null references public.proprietarios (id) on delete cascade,
  percentual numeric(5, 2) not null default 100 check (percentual > 0 and percentual <= 100),
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  unique (imovel_id, proprietario_id)
);

create index if not exists imovel_proprietarios_imovel_idx on public.imovel_proprietarios (imovel_id);

alter table public.proprietario_documentos enable row level security;
alter table public.imovel_proprietarios enable row level security;

drop policy if exists proprietario_documentos_all on public.proprietario_documentos;
create policy proprietario_documentos_all on public.proprietario_documentos
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists imovel_proprietarios_all on public.imovel_proprietarios;
create policy imovel_proprietarios_all on public.imovel_proprietarios
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);
