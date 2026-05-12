-- ============================================================
-- 006: CRM — pipeline 8 estágios, comentários, tarefas, anexos
-- ============================================================

alter table public.leads drop constraint if exists leads_status_check;

update public.leads set status = 'contato' where status = 'contatado';
update public.leads set status = 'visita' where status = 'qualificado';

alter table public.leads add column if not exists score integer not null default 0;
alter table public.leads add column if not exists origem_utm text;
alter table public.leads add column if not exists assignado_para uuid references auth.users (id) on delete set null;
alter table public.leads add column if not exists ultimo_contato timestamptz;
alter table public.leads add column if not exists proximo_followup timestamptz;

alter table public.leads add constraint leads_status_check
  check (status in (
    'novo', 'contato', 'visita', 'proposta', 'negociacao',
    'contrato', 'convertido', 'perdido'
  ));

create table if not exists public.lead_comentarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_comentarios_lead_idx on public.lead_comentarios (lead_id);

create table if not exists public.lead_tarefas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  titulo text not null,
  descricao text,
  prazo timestamptz,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lead_tarefas_lead_idx on public.lead_tarefas (lead_id);

create table if not exists public.lead_anexos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  nome text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_anexos_lead_idx on public.lead_anexos (lead_id);

alter table public.lead_comentarios enable row level security;
alter table public.lead_tarefas enable row level security;
alter table public.lead_anexos enable row level security;

drop policy if exists lead_comentarios_all on public.lead_comentarios;
create policy lead_comentarios_all on public.lead_comentarios
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists lead_tarefas_all on public.lead_tarefas;
create policy lead_tarefas_all on public.lead_tarefas
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists lead_anexos_all on public.lead_anexos;
create policy lead_anexos_all on public.lead_anexos
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);
