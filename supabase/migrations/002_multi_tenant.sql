-- ============================================================
-- Multi-tenant SaaS schema + migração a partir de 001
-- ============================================================

-- Extensões úteis
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Empresas (tenant)
-- ------------------------------------------------------------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  documento text,
  telefone text,
  email text,
  logo_url text,
  endereco text,
  cidade text,
  estado text,
  dominio_customizado text unique,
  cor_primaria text not null default '#1a365d',
  cor_secundaria text not null default '#d4a853',
  whatsapp text,
  instagram text,
  facebook text,
  config jsonb not null default '{}',
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists empresas_slug_idx on public.empresas (slug);
create index if not exists empresas_ativa_idx on public.empresas (ativa);

-- ------------------------------------------------------------
-- Planos / assinaturas (SaaS)
-- ------------------------------------------------------------
create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  preco_mensal numeric(12, 2) not null default 0 check (preco_mensal >= 0),
  limite_imoveis integer,
  limite_corretores integer,
  limite_leads integer,
  recursos jsonb not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  plano_id uuid not null references public.planos (id),
  status text not null default 'trial'
    check (status in ('ativa', 'cancelada', 'inadimplente', 'trial')),
  data_inicio timestamptz not null default now(),
  data_fim timestamptz,
  mercadopago_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assinaturas_empresa_id_idx on public.assinaturas (empresa_id);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  assinatura_id uuid references public.assinaturas (id) on delete set null,
  valor numeric(12, 2) not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'recusado', 'estornado')),
  metodo text,
  mercadopago_payment_id text,
  data_pagamento timestamptz,
  detalhes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists pagamentos_empresa_id_idx on public.pagamentos (empresa_id);

-- ------------------------------------------------------------
-- Usuários (perfil + tenant + role)
-- ------------------------------------------------------------
create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  avatar_url text,
  role text not null default 'corretor'
    check (role in ('master', 'admin', 'gerente', 'corretor')),
  creci text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists usuarios_empresa_id_idx on public.usuarios (empresa_id);
create index if not exists usuarios_role_idx on public.usuarios (role);

-- ------------------------------------------------------------
-- Proprietários
-- ------------------------------------------------------------
create table if not exists public.proprietarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  email text,
  telefone text,
  documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proprietarios_empresa_id_idx on public.proprietarios (empresa_id);

-- ------------------------------------------------------------
-- Renomear tabelas legadas (001) -> modelo novo
-- Só executa se ainda existir "properties"
-- ------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'properties'
  ) then
    alter table public.properties rename to imoveis;
  end if;
end $$;

-- Políticas legadas (001) — remover antes de novas colunas/políticas
drop policy if exists "properties_select_public_or_owner" on public.imoveis;
drop policy if exists "properties_insert_owner" on public.imoveis;
drop policy if exists "properties_update_owner" on public.imoveis;
drop policy if exists "properties_delete_owner" on public.imoveis;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='property_images') then
    execute 'drop policy if exists "property_images_select" on public.property_images';
    execute 'drop policy if exists "property_images_insert_owner" on public.property_images';
    execute 'drop policy if exists "property_images_delete_owner" on public.property_images';
    execute 'drop policy if exists "property_images_update_owner" on public.property_images';
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='imovel_imagens') then
    execute 'drop policy if exists "property_images_select" on public.imovel_imagens';
    execute 'drop policy if exists "property_images_insert_owner" on public.imovel_imagens';
    execute 'drop policy if exists "property_images_delete_owner" on public.imovel_imagens';
    execute 'drop policy if exists "property_images_update_owner" on public.imovel_imagens';
  end if;
end $$;

drop policy if exists "leads_insert_anon" on public.leads;
drop policy if exists "leads_select_owner" on public.leads;
drop policy if exists "leads_delete_owner" on public.leads;

-- Renomear colunas PT (idempotente por coluna)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='title') then
    alter table public.imoveis rename column title to titulo;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='description') then
    alter table public.imoveis rename column description to descricao;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='type') then
    alter table public.imoveis rename column type to tipo;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='purpose') then
    alter table public.imoveis rename column purpose to finalidade;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='price') then
    alter table public.imoveis rename column price to preco;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='city') then
    alter table public.imoveis rename column city to cidade;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='neighborhood') then
    alter table public.imoveis rename column neighborhood to bairro;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='address') then
    alter table public.imoveis rename column address to endereco;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='bedrooms') then
    alter table public.imoveis rename column bedrooms to quartos;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='bathrooms') then
    alter table public.imoveis rename column bathrooms to banheiros;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='parking_spaces') then
    alter table public.imoveis rename column parking_spaces to vagas;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='featured') then
    alter table public.imoveis rename column featured to destaque;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imoveis' and column_name='user_id') then
    alter table public.imoveis rename column user_id to corretor_id;
  end if;
end $$;

-- status legado ativo/inativo -> disponivel/oculto
alter table public.imoveis drop constraint if exists properties_status_check;
alter table public.imoveis drop constraint if exists imoveis_status_check;

update public.imoveis set status = 'disponivel' where status = 'ativo';
update public.imoveis set status = 'oculto' where status = 'inativo';

alter table public.imoveis add constraint imoveis_status_check
  check (status in ('disponivel', 'reservado', 'vendido', 'alugado', 'oculto'));

-- empresa + campos SaaS
alter table public.imoveis add column if not exists empresa_id uuid;
alter table public.imoveis add column if not exists suites integer not null default 0 check (suites >= 0);
alter table public.imoveis add column if not exists slug text;
alter table public.imoveis add column if not exists latitude double precision;
alter table public.imoveis add column if not exists longitude double precision;
alter table public.imoveis add column if not exists video_url text;
alter table public.imoveis add column if not exists tour_virtual_url text;
alter table public.imoveis add column if not exists seo_titulo text;
alter table public.imoveis add column if not exists seo_descricao text;
alter table public.imoveis add column if not exists proprietario_id uuid references public.proprietarios (id) on delete set null;
alter table public.imoveis add column if not exists visualizacoes integer not null default 0 check (visualizacoes >= 0);

update public.imoveis set seo_titulo = coalesce(seo_titulo, titulo);
update public.imoveis set seo_descricao = coalesce(seo_descricao, left(coalesce(descricao, ''), 300));

update public.imoveis set slug =
  coalesce(
    slug,
    trim(both '-' from lower(regexp_replace(titulo, '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || substring(replace(id::text, '-', ''), 1, 8)
  )
where slug is null;

-- Seed empresa demo + amarrar imóveis
insert into public.empresas (nome, slug, email, ativa)
values ('Imobiliária Demo', 'demo', 'contato@demo.local', true)
on conflict (slug) do nothing;

update public.imoveis i
set empresa_id = e.id
from public.empresas e
where e.slug = 'demo' and i.empresa_id is null;

alter table public.imoveis alter column empresa_id set not null;

do $$
begin
  alter table public.imoveis add constraint imoveis_empresa_id_fkey
    foreign key (empresa_id) references public.empresas (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

create unique index if not exists imoveis_empresa_slug_uidx on public.imoveis (empresa_id, slug);
create index if not exists imoveis_empresa_id_idx on public.imoveis (empresa_id);
create index if not exists imoveis_finalidade_idx on public.imoveis (finalidade);
create index if not exists imoveis_cidade_idx on public.imoveis (cidade);

-- plano + assinatura demo
insert into public.planos (nome, slug, preco_mensal, limite_imoveis, limite_corretores, limite_leads, ativo)
values ('Enterprise', 'enterprise', 0, null, null, null, true)
on conflict (slug) do nothing;

insert into public.assinaturas (empresa_id, plano_id, status)
select e.id, p.id, 'ativa'
from public.empresas e
cross join public.planos p
where e.slug = 'demo' and p.slug = 'enterprise'
and not exists (select 1 from public.assinaturas a where a.empresa_id = e.id);

-- Vincular todos os usuários auth existentes à empresa demo como admin (dev/migração)
insert into public.usuarios (id, empresa_id, nome, email, role)
select
  au.id,
  e.id,
  coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.email,
  'admin'
from auth.users au
cross join public.empresas e
where e.slug = 'demo'
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='property_images') then
    alter table public.property_images rename to imovel_imagens;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imovel_imagens' and column_name='property_id') then
    alter table public.imovel_imagens rename column property_id to imovel_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imovel_imagens' and column_name='image_url') then
    alter table public.imovel_imagens rename column image_url to url;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='imovel_imagens' and column_name='is_cover') then
    alter table public.imovel_imagens rename column is_cover to is_capa;
  end if;
end $$;
alter table public.imovel_imagens add column if not exists ordem integer not null default 0;

update public.imovel_imagens x set ordem = s.rn
from (
  select id, row_number() over (partition by imovel_id order by created_at) - 1 as rn
  from public.imovel_imagens
) s
where x.id = s.id;

-- Leads
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='leads' and column_name='property_id') then
    alter table public.leads rename column property_id to imovel_id;
  end if;
end $$;
alter table public.leads add column if not exists empresa_id uuid;
alter table public.leads add column if not exists corretor_id uuid references auth.users (id) on delete set null;
alter table public.leads add column if not exists origem text not null default 'site';
alter table public.leads add column if not exists status text not null default 'novo'
  check (status in ('novo', 'contatado', 'qualificado', 'negociacao', 'convertido', 'perdido'));
alter table public.leads add column if not exists tags jsonb not null default '[]'::jsonb;

update public.leads l
set empresa_id = i.empresa_id
from public.imoveis i
where i.id = l.imovel_id and l.empresa_id is null;

alter table public.leads alter column empresa_id set not null;

do $$
begin
  alter table public.leads add constraint leads_empresa_id_fkey
    foreign key (empresa_id) references public.empresas (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- Preenche empresa_id em inserts públicos (anon) quando omitido
create or replace function public.leads_set_empresa_id()
returns trigger as $$
begin
  if new.empresa_id is null then
    select i.empresa_id into new.empresa_id from public.imoveis i where i.id = new.imovel_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_empresa on public.leads;
create trigger leads_set_empresa
before insert on public.leads
for each row execute function public.leads_set_empresa_id();

create index if not exists leads_empresa_id_idx on public.leads (empresa_id);
create index if not exists leads_status_idx on public.leads (status);

-- ------------------------------------------------------------
-- CRM / operações
-- ------------------------------------------------------------
create table if not exists public.lead_historico (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  tipo text not null check (tipo in ('nota', 'ligacao', 'email', 'whatsapp', 'visita', 'sistema')),
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_historico_lead_id_idx on public.lead_historico (lead_id);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  corretor_id uuid references auth.users (id) on delete set null,
  data_hora timestamptz not null,
  status text not null default 'agendada'
    check (status in ('agendada', 'realizada', 'cancelada')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visitas_empresa_id_idx on public.visitas (empresa_id);
create index if not exists visitas_data_hora_idx on public.visitas (data_hora);

create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  visitor_id text,
  created_at timestamptz not null default now(),
  unique (imovel_id, usuario_id),
  unique (imovel_id, visitor_id),
  check (usuario_id is not null or visitor_id is not null)
);

create index if not exists favoritos_imovel_id_idx on public.favoritos (imovel_id);

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  tipo text not null check (tipo in ('venda', 'aluguel')),
  valor numeric(14, 2) not null,
  data_inicio date,
  data_fim date,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'ativo', 'encerrado', 'cancelado')),
  documento_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contratos_empresa_id_idx on public.contratos (empresa_id);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create index if not exists notificacoes_usuario_id_idx on public.notificacoes (usuario_id);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  autor_id uuid references auth.users (id) on delete set null,
  titulo text not null,
  slug text not null,
  conteudo text not null,
  imagem_capa text,
  publicado boolean not null default false,
  seo_titulo text,
  seo_descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, slug)
);

create index if not exists blog_posts_empresa_id_idx on public.blog_posts (empresa_id);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete set null,
  usuario_id uuid references auth.users (id) on delete set null,
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists logs_empresa_id_idx on public.logs (empresa_id);
create index if not exists logs_created_at_idx on public.logs (created_at desc);

create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  chave text not null,
  valor jsonb not null default '{}',
  unique (empresa_id, chave)
);

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists imoveis_set_updated_at on public.imoveis;
create trigger imoveis_set_updated_at
before update on public.imoveis
for each row execute function public.set_updated_at();

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
before update on public.empresas
for each row execute function public.set_updated_at();

drop trigger if exists usuarios_set_updated_at on public.usuarios;
create trigger usuarios_set_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Helpers RLS (SECURITY DEFINER para ler perfil com RLS ligado)
-- ------------------------------------------------------------
create or replace function public.user_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.empresa_id from public.usuarios u where u.id = auth.uid() limit 1;
$$;

create or replace function public.user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role from public.usuarios u where u.id = auth.uid() limit 1;
$$;

create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'master'
  );
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.planos enable row level security;
alter table public.assinaturas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.usuarios enable row level security;
alter table public.proprietarios enable row level security;
alter table public.imoveis enable row level security;
alter table public.imovel_imagens enable row level security;
alter table public.leads enable row level security;
alter table public.lead_historico enable row level security;
alter table public.visitas enable row level security;
alter table public.favoritos enable row level security;
alter table public.contratos enable row level security;
alter table public.notificacoes enable row level security;
alter table public.blog_posts enable row level security;
alter table public.logs enable row level security;
alter table public.configuracoes enable row level security;

-- Empresas: master vê tudo; tenant vê só a sua
drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas
for select using (public.is_master() or id = public.user_empresa_id());

drop policy if exists empresas_write_master on public.empresas;
create policy empresas_write_master on public.empresas
for all using (public.is_master()) with check (public.is_master());

drop policy if exists empresas_update_tenant_admin on public.empresas;
create policy empresas_update_tenant_admin on public.empresas
for update using (
  not public.is_master()
  and id = public.user_empresa_id()
  and public.user_role() in ('admin', 'gerente')
) with check (
  id = public.user_empresa_id()
);

-- Planos: leitura para autenticados do tenant; master CRUD
drop policy if exists planos_select on public.planos;
create policy planos_select on public.planos
for select using (auth.role() = 'authenticated');

drop policy if exists planos_master on public.planos;
create policy planos_master on public.planos
for all using (public.is_master()) with check (public.is_master());

-- Assinaturas / pagamentos: master ou tenant admin
drop policy if exists assinaturas_select on public.assinaturas;
create policy assinaturas_select on public.assinaturas
for select using (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists assinaturas_master on public.assinaturas;
create policy assinaturas_master on public.assinaturas
for all using (public.is_master()) with check (public.is_master());

drop policy if exists pagamentos_select on public.pagamentos;
create policy pagamentos_select on public.pagamentos
for select using (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists pagamentos_master on public.pagamentos;
create policy pagamentos_master on public.pagamentos
for all using (public.is_master()) with check (public.is_master());

-- Usuários
drop policy if exists usuarios_select on public.usuarios;
create policy usuarios_select on public.usuarios
for select using (
  public.is_master()
  or id = auth.uid()
  or empresa_id = public.user_empresa_id()
);

drop policy if exists usuarios_insert_master on public.usuarios;
create policy usuarios_insert_master on public.usuarios
for insert with check (public.is_master());

drop policy if exists usuarios_insert_admin on public.usuarios;
create policy usuarios_insert_admin on public.usuarios
for insert with check (
  not public.is_master()
  and empresa_id = public.user_empresa_id()
  and public.user_role() in ('admin', 'gerente')
);

drop policy if exists usuarios_update_self_or_admin on public.usuarios;
create policy usuarios_update_self_or_admin on public.usuarios
for update using (
  public.is_master()
  or id = auth.uid()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente')
  )
);

-- Imóveis: leitura pública disponível + empresa ativa; staff do tenant; master
drop policy if exists imoveis_select_public on public.imoveis;
create policy imoveis_select_public on public.imoveis
for select using (
  public.is_master()
  or empresa_id = public.user_empresa_id()
  or (
    status = 'disponivel'
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.ativa)
  )
);

drop policy if exists imoveis_write_staff on public.imoveis;
create policy imoveis_write_staff on public.imoveis
for insert with check (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor')
  )
);

drop policy if exists imoveis_update_staff on public.imoveis;
create policy imoveis_update_staff on public.imoveis
for update using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor')
  )
) with check (
  empresa_id = public.user_empresa_id() or public.is_master()
);

drop policy if exists imoveis_delete_staff on public.imoveis;
create policy imoveis_delete_staff on public.imoveis
for delete using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente')
  )
);

-- Imagens
drop policy if exists imovel_imagens_select on public.imovel_imagens;
create policy imovel_imagens_select on public.imovel_imagens
for select using (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and (
      public.is_master()
      or i.empresa_id = public.user_empresa_id()
      or (
        i.status = 'disponivel'
        and exists (select 1 from public.empresas e where e.id = i.empresa_id and e.ativa)
      )
    )
  )
);

drop policy if exists imovel_imagens_write on public.imovel_imagens;
create policy imovel_imagens_write on public.imovel_imagens
for all using (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and (
      public.is_master()
      or (
        i.empresa_id = public.user_empresa_id()
        and public.user_role() in ('admin', 'gerente', 'corretor')
      )
    )
  )
) with check (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and (
      public.is_master()
      or (
        i.empresa_id = public.user_empresa_id()
        and public.user_role() in ('admin', 'gerente', 'corretor')
      )
    )
  )
);

-- Leads
drop policy if exists leads_insert_anon on public.leads;
create policy leads_insert_anon on public.leads
for insert with check (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and i.empresa_id = empresa_id
    and i.status = 'disponivel'
    and exists (select 1 from public.empresas e where e.id = i.empresa_id and e.ativa)
  )
);

drop policy if exists leads_select_staff on public.leads;
create policy leads_select_staff on public.leads
for select using (
  public.is_master()
  or empresa_id = public.user_empresa_id()
);

drop policy if exists leads_update_staff on public.leads;
create policy leads_update_staff on public.leads
for update using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor')
  )
);

drop policy if exists leads_delete_staff on public.leads;
create policy leads_delete_staff on public.leads
for delete using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente')
  )
);

-- Proprietários / visitas / histórico / favoritos / contratos / notificações / blog / logs / config
drop policy if exists proprietarios_all on public.proprietarios;
create policy proprietarios_all on public.proprietarios
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists visitas_all on public.visitas;
create policy visitas_all on public.visitas
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists lead_historico_select on public.lead_historico;
create policy lead_historico_select on public.lead_historico
for select using (
  exists (
    select 1 from public.leads l
    where l.id = lead_id
    and (public.is_master() or l.empresa_id = public.user_empresa_id())
  )
);

drop policy if exists lead_historico_write on public.lead_historico;
create policy lead_historico_write on public.lead_historico
for insert with check (
  exists (
    select 1 from public.leads l
    where l.id = lead_id
    and (public.is_master() or l.empresa_id = public.user_empresa_id())
  )
);

drop policy if exists favoritos_select on public.favoritos;
create policy favoritos_select on public.favoritos
for select using (usuario_id = auth.uid());

drop policy if exists favoritos_write on public.favoritos;
create policy favoritos_write on public.favoritos
for insert with check (usuario_id = auth.uid());

drop policy if exists favoritos_delete on public.favoritos;
create policy favoritos_delete on public.favoritos
for delete using (usuario_id = auth.uid());

drop policy if exists contratos_all on public.contratos;
create policy contratos_all on public.contratos
for all using (
  public.is_master() or empresa_id = public.user_empresa_id()
) with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists notificacoes_select on public.notificacoes;
create policy notificacoes_select on public.notificacoes
for select using (
  public.is_master()
  or usuario_id = auth.uid()
  or (usuario_id is null and empresa_id = public.user_empresa_id() and public.user_role() in ('admin', 'gerente'))
);

drop policy if exists notificacoes_write on public.notificacoes;
create policy notificacoes_write on public.notificacoes
for insert with check (
  public.is_master() or empresa_id = public.user_empresa_id()
);

drop policy if exists notificacoes_update on public.notificacoes;
create policy notificacoes_update on public.notificacoes
for update using (usuario_id = auth.uid() or public.is_master());

drop policy if exists blog_posts_public on public.blog_posts;
create policy blog_posts_public on public.blog_posts
for select using (
  public.is_master()
  or (publicado and empresa_id in (select id from public.empresas where ativa))
  or empresa_id = public.user_empresa_id()
);

drop policy if exists blog_posts_write on public.blog_posts;
create policy blog_posts_write on public.blog_posts
for all using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor')
  )
) with check (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor')
  )
);

drop policy if exists logs_select on public.logs;
create policy logs_select on public.logs
for select using (
  public.is_master()
  or empresa_id = public.user_empresa_id()
);

drop policy if exists logs_insert on public.logs;
create policy logs_insert on public.logs
for insert with check (true);

drop policy if exists configuracoes_all on public.configuracoes;
create policy configuracoes_all on public.configuracoes
for all using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente')
  )
) with check (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente')
  )
);

-- Realtime (opcional): publication
-- alter publication supabase_realtime add table public.notificacoes;
