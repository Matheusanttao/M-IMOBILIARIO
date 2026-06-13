-- ============================================================
-- Schema unico do M-Imobiliario para Supabase
-- Execute este arquivo uma vez no SQL Editor do Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- SaaS / empresas
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
  financiamento_url text,
  financiamentos jsonb not null default '[]',
  quem_somos_titulo text,
  quem_somos_texto text,
  quem_somos_imagem_url text,
  politica_privacidade_titulo text,
  politica_privacidade_texto text,
  config jsonb not null default '{}',
  ativa boolean not null default true,
  trial_fim timestamptz,
  afiliado_codigo text unique,
  indicado_por uuid references public.empresas (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists empresas_slug_idx on public.empresas (slug);
create index if not exists empresas_ativa_idx on public.empresas (ativa);

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
create unique index if not exists pagamentos_mercadopago_payment_id_uidx
  on public.pagamentos (mercadopago_payment_id)
  where mercadopago_payment_id is not null;

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

-- ------------------------------------------------------------
-- Usuarios / permissoes
-- ------------------------------------------------------------
create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  avatar_url text,
  role text not null default 'corretor'
    check (role in ('master', 'admin', 'gerente', 'corretor', 'financeiro', 'captador', 'atendente')),
  creci text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists usuarios_empresa_id_idx on public.usuarios (empresa_id);
create index if not exists usuarios_role_idx on public.usuarios (role);

create table if not exists public.permissoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  papel text not null,
  modulo text not null,
  acao text not null,
  permitido boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, papel, modulo, acao)
);

create index if not exists permissoes_empresa_id_idx on public.permissoes (empresa_id);

-- ------------------------------------------------------------
-- Imoveis / proprietarios
-- ------------------------------------------------------------
create table if not exists public.proprietarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  email text,
  telefone text,
  documento text,
  cpf_cnpj text,
  rg_ie text,
  whatsapp text,
  chave_pix text,
  tipo_chave_pix text,
  banco text,
  agencia text,
  conta text,
  tipo_conta text,
  avatar_url text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proprietarios_empresa_id_idx on public.proprietarios (empresa_id);

create table if not exists public.imoveis (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  proprietario_id uuid references public.proprietarios (id) on delete set null,
  corretor_id uuid references auth.users (id) on delete set null,
  captador_id uuid references auth.users (id) on delete set null,
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('casa', 'apartamento', 'terreno', 'sala_comercial')),
  finalidade text not null check (finalidade in ('venda', 'aluguel')),
  preco numeric(12, 2) not null check (preco >= 0),
  cep text,
  cidade text not null,
  bairro text not null,
  endereco text,
  quartos integer not null default 0 check (quartos >= 0),
  banheiros integer not null default 0 check (banheiros >= 0),
  vagas integer not null default 0 check (vagas >= 0),
  suites integer not null default 0 check (suites >= 0),
  area numeric(10, 2) check (area is null or area >= 0),
  status text not null default 'disponivel'
    check (status in ('disponivel', 'reservado', 'vendido', 'alugado', 'oculto')),
  destaque boolean not null default false,
  slug text not null,
  latitude double precision,
  longitude double precision,
  localizacao_aproximada boolean not null default false,
  video_url text,
  tour_virtual_url text,
  seo_titulo text,
  seo_descricao text,
  visualizacoes integer not null default 0 check (visualizacoes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, slug)
);

create index if not exists imoveis_empresa_id_idx on public.imoveis (empresa_id);
create index if not exists imoveis_captador_id_idx on public.imoveis (captador_id);
create index if not exists imoveis_finalidade_idx on public.imoveis (finalidade);
create index if not exists imoveis_cidade_idx on public.imoveis (cidade);
create index if not exists imoveis_lat_lng_idx on public.imoveis (latitude, longitude)
  where latitude is not null and longitude is not null;

create table if not exists public.imovel_imagens (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  url text not null,
  public_id text not null,
  is_capa boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists imovel_imagens_imovel_id_idx on public.imovel_imagens (imovel_id);

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

-- ------------------------------------------------------------
-- Leads / CRM
-- ------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  imovel_id uuid references public.imoveis (id) on delete cascade,
  corretor_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text,
  email text,
  message text,
  origem text not null default 'site',
  status text not null default 'novo'
    check (status in ('novo', 'contato', 'visita', 'proposta', 'negociacao', 'contrato', 'convertido', 'perdido')),
  tags jsonb not null default '[]'::jsonb,
  score integer not null default 0,
  origem_utm text,
  assignado_para uuid references auth.users (id) on delete set null,
  ultimo_contato timestamptz,
  proximo_followup timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists leads_empresa_id_idx on public.leads (empresa_id);
create index if not exists leads_imovel_id_idx on public.leads (imovel_id);
create index if not exists leads_status_idx on public.leads (status);

create or replace function public.leads_set_empresa_id()
returns trigger as $$
begin
  if new.empresa_id is null and new.imovel_id is not null then
    select i.empresa_id into new.empresa_id from public.imoveis i where i.id = new.imovel_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_empresa on public.leads;
create trigger leads_set_empresa
before insert on public.leads
for each row execute function public.leads_set_empresa_id();

create table if not exists public.lead_historico (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  tipo text not null check (tipo in ('nota', 'ligacao', 'email', 'whatsapp', 'visita', 'sistema')),
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_historico_lead_id_idx on public.lead_historico (lead_id);

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

-- ------------------------------------------------------------
-- Operacao
-- ------------------------------------------------------------
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

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  proposta_id uuid references public.propostas (id) on delete set null,
  tipo text not null check (tipo in ('venda', 'aluguel')),
  valor numeric(14, 2) not null,
  data_inicio date,
  data_fim date,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aguardando_assinatura', 'ativo', 'encerrado', 'cancelado')),
  documento_url text,
  assinatura_digital_url text,
  assinado_cliente_em timestamptz,
  assinado_proprietario_em timestamptz,
  pdf_url text,
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
  ip text,
  user_agent text,
  dados_anteriores jsonb,
  dados_novos jsonb,
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

-- ------------------------------------------------------------
-- Financeiro
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- updated_at automatico
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
before update on public.empresas
for each row execute function public.set_updated_at();

drop trigger if exists assinaturas_set_updated_at on public.assinaturas;
create trigger assinaturas_set_updated_at
before update on public.assinaturas
for each row execute function public.set_updated_at();

drop trigger if exists usuarios_set_updated_at on public.usuarios;
create trigger usuarios_set_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists proprietarios_set_updated_at on public.proprietarios;
create trigger proprietarios_set_updated_at
before update on public.proprietarios
for each row execute function public.set_updated_at();

drop trigger if exists imoveis_set_updated_at on public.imoveis;
create trigger imoveis_set_updated_at
before update on public.imoveis
for each row execute function public.set_updated_at();

drop trigger if exists visitas_set_updated_at on public.visitas;
create trigger visitas_set_updated_at
before update on public.visitas
for each row execute function public.set_updated_at();

drop trigger if exists propostas_set_updated_at on public.propostas;
create trigger propostas_set_updated_at
before update on public.propostas
for each row execute function public.set_updated_at();

drop trigger if exists contratos_set_updated_at on public.contratos;
create trigger contratos_set_updated_at
before update on public.contratos
for each row execute function public.set_updated_at();

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

drop trigger if exists financeiro_lancamentos_set_updated_at on public.financeiro_lancamentos;
create trigger financeiro_lancamentos_set_updated_at
before update on public.financeiro_lancamentos
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Helpers RLS
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
alter table public.cupons enable row level security;
alter table public.assinatura_cupons enable row level security;
alter table public.usuarios enable row level security;
alter table public.permissoes enable row level security;
alter table public.proprietarios enable row level security;
alter table public.imoveis enable row level security;
alter table public.imovel_imagens enable row level security;
alter table public.proprietario_documentos enable row level security;
alter table public.imovel_proprietarios enable row level security;
alter table public.leads enable row level security;
alter table public.lead_historico enable row level security;
alter table public.lead_comentarios enable row level security;
alter table public.lead_tarefas enable row level security;
alter table public.lead_anexos enable row level security;
alter table public.visitas enable row level security;
alter table public.favoritos enable row level security;
alter table public.propostas enable row level security;
alter table public.contratos enable row level security;
alter table public.notificacoes enable row level security;
alter table public.blog_posts enable row level security;
alter table public.logs enable row level security;
alter table public.configuracoes enable row level security;
alter table public.financeiro_categorias enable row level security;
alter table public.financeiro_lancamentos enable row level security;

drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas
for select using (public.is_master() or id = public.user_empresa_id());

drop policy if exists empresas_select_public_active on public.empresas;
create policy empresas_select_public_active on public.empresas
for select to anon using (ativa = true);

drop policy if exists empresas_write_master on public.empresas;
create policy empresas_write_master on public.empresas
for all using (public.is_master()) with check (public.is_master());

drop policy if exists empresas_update_tenant_admin on public.empresas;
create policy empresas_update_tenant_admin on public.empresas
for update using (
  not public.is_master()
  and id = public.user_empresa_id()
  and public.user_role() in ('admin', 'gerente')
) with check (id = public.user_empresa_id());

drop policy if exists planos_select on public.planos;
create policy planos_select on public.planos
for select using (auth.role() = 'authenticated');

drop policy if exists planos_master on public.planos;
create policy planos_master on public.planos
for all using (public.is_master()) with check (public.is_master());

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

drop policy if exists usuarios_select on public.usuarios;
create policy usuarios_select on public.usuarios
for select using (
  public.is_master()
  or id = auth.uid()
  or empresa_id = public.user_empresa_id()
);

drop policy if exists usuarios_select_public_team on public.usuarios;
create policy usuarios_select_public_team on public.usuarios
for select to anon using (
  ativo = true
  and role in ('corretor', 'gerente', 'admin')
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

drop policy if exists permissoes_select on public.permissoes;
create policy permissoes_select on public.permissoes
for select using (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists permissoes_write on public.permissoes;
create policy permissoes_write on public.permissoes
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
    and public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
  )
);

drop policy if exists imoveis_update_staff on public.imoveis;
create policy imoveis_update_staff on public.imoveis
for update using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
  )
) with check (empresa_id = public.user_empresa_id() or public.is_master());

drop policy if exists imoveis_delete_staff on public.imoveis;
create policy imoveis_delete_staff on public.imoveis
for delete using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente')
  )
);

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
        and public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
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
        and public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
      )
    )
  )
);

drop policy if exists leads_insert_anon on public.leads;
create policy leads_insert_anon on public.leads
for insert with check (
  (
    imovel_id is null
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.ativa)
  )
  or (
    exists (
      select 1 from public.imoveis i
      where i.id = imovel_id
      and i.empresa_id = empresa_id
      and i.status = 'disponivel'
      and exists (select 1 from public.empresas e where e.id = i.empresa_id and e.ativa)
    )
  )
);

drop policy if exists leads_select_staff on public.leads;
create policy leads_select_staff on public.leads
for select using (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists leads_update_staff on public.leads;
create policy leads_update_staff on public.leads
for update using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor', 'captador', 'atendente')
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

drop policy if exists proprietarios_all on public.proprietarios;
create policy proprietarios_all on public.proprietarios
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists proprietario_documentos_all on public.proprietario_documentos;
create policy proprietario_documentos_all on public.proprietario_documentos
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists imovel_proprietarios_all on public.imovel_proprietarios;
create policy imovel_proprietarios_all on public.imovel_proprietarios
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists visitas_all on public.visitas;
create policy visitas_all on public.visitas
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

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

drop policy if exists lead_comentarios_all on public.lead_comentarios;
create policy lead_comentarios_all on public.lead_comentarios
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists lead_tarefas_all on public.lead_tarefas;
create policy lead_tarefas_all on public.lead_tarefas
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists lead_anexos_all on public.lead_anexos;
create policy lead_anexos_all on public.lead_anexos
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists favoritos_select on public.favoritos;
create policy favoritos_select on public.favoritos
for select using (usuario_id = auth.uid());

drop policy if exists favoritos_write on public.favoritos;
create policy favoritos_write on public.favoritos
for insert with check (usuario_id = auth.uid());

drop policy if exists favoritos_delete on public.favoritos;
create policy favoritos_delete on public.favoritos
for delete using (usuario_id = auth.uid());

drop policy if exists propostas_all on public.propostas;
create policy propostas_all on public.propostas
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists contratos_all on public.contratos;
create policy contratos_all on public.contratos
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists notificacoes_select on public.notificacoes;
create policy notificacoes_select on public.notificacoes
for select using (
  public.is_master()
  or usuario_id = auth.uid()
  or (usuario_id is null and empresa_id = public.user_empresa_id() and public.user_role() in ('admin', 'gerente'))
);

drop policy if exists notificacoes_write on public.notificacoes;
create policy notificacoes_write on public.notificacoes
for insert with check (public.is_master() or empresa_id = public.user_empresa_id());

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
for select using (public.is_master() or empresa_id = public.user_empresa_id());

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

drop policy if exists financeiro_categorias_all on public.financeiro_categorias;
create policy financeiro_categorias_all on public.financeiro_categorias
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists financeiro_lancamentos_all on public.financeiro_lancamentos;
create policy financeiro_lancamentos_all on public.financeiro_lancamentos
for all using (public.is_master() or empresa_id = public.user_empresa_id())
with check (public.is_master() or empresa_id = public.user_empresa_id());

-- Realtime para notificacoes. Ignora se a publication nao existir ou se ja tiver sido adicionada.
do $$
begin
  alter publication supabase_realtime add table public.notificacoes;
exception
  when duplicate_object or undefined_object then null;
end $$;

-- ============================================================
-- Consolidado: remocao de seeds/demo
-- ============================================================
delete from public.empresas
where slug = 'demo'
  and nome = 'Imobiliaria Demo'
  and email = 'contato@demo.local';

delete from public.planos
where slug = 'enterprise'
  and nome = 'Enterprise'
  and preco_mensal = 0
  and limite_imoveis is null
  and limite_corretores is null
  and limite_leads is null
  and not exists (
    select 1
    from public.assinaturas a
    where a.plano_id = public.planos.id
  );

-- ============================================================
-- Consolidado: leads de contato sem imovel
-- ============================================================
drop policy if exists leads_insert_anon on public.leads;

create policy leads_insert_anon on public.leads
for insert with check (
  (
    imovel_id is null
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.ativa)
  )
  or (
    exists (
      select 1 from public.imoveis i
      where i.id = imovel_id
      and i.empresa_id = empresa_id
      and i.status = 'disponivel'
      and exists (select 1 from public.empresas e where e.id = i.empresa_id and e.ativa)
    )
  )
);

-- ============================================================
-- Consolidado: endurecimento de policies sensiveis
-- ============================================================
create or replace function public.prevent_usuario_self_privilege_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_master() then
    if new.role is distinct from old.role
      or new.empresa_id is distinct from old.empresa_id
      or new.ativo is distinct from old.ativo then
      raise exception 'Nao e permitido alterar permissao, empresa ou status do proprio usuario.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_usuario_self_privilege_update on public.usuarios;
create trigger prevent_usuario_self_privilege_update
before update on public.usuarios
for each row execute function public.prevent_usuario_self_privilege_update();

drop policy if exists logs_insert on public.logs;
create policy logs_insert on public.logs
for insert to authenticated
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists leads_insert_anon on public.leads;
create policy leads_insert_anon on public.leads
for insert to anon with check (
  (
    imovel_id is null
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.ativa)
  )
  or (
    exists (
      select 1 from public.imoveis i
      where i.id = imovel_id
      and i.empresa_id = empresa_id
      and i.status = 'disponivel'
      and exists (select 1 from public.empresas e where e.id = i.empresa_id and e.ativa)
    )
  )
);

drop policy if exists leads_insert_staff on public.leads;
create policy leads_insert_staff on public.leads
for insert to authenticated
with check (public.is_master() or empresa_id = public.user_empresa_id());

drop policy if exists lead_comentarios_all on public.lead_comentarios;
drop policy if exists lead_comentarios_select on public.lead_comentarios;
drop policy if exists lead_comentarios_insert on public.lead_comentarios;
drop policy if exists lead_comentarios_update on public.lead_comentarios;
drop policy if exists lead_comentarios_delete on public.lead_comentarios;
create policy lead_comentarios_select on public.lead_comentarios
for select using (public.is_master() or empresa_id = public.user_empresa_id());
create policy lead_comentarios_insert on public.lead_comentarios
for insert with check (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
);
create policy lead_comentarios_update on public.lead_comentarios
for update using (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
) with check (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
);
create policy lead_comentarios_delete on public.lead_comentarios
for delete using (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
);

drop policy if exists lead_tarefas_all on public.lead_tarefas;
drop policy if exists lead_tarefas_select on public.lead_tarefas;
drop policy if exists lead_tarefas_insert on public.lead_tarefas;
drop policy if exists lead_tarefas_update on public.lead_tarefas;
drop policy if exists lead_tarefas_delete on public.lead_tarefas;
create policy lead_tarefas_select on public.lead_tarefas
for select using (public.is_master() or empresa_id = public.user_empresa_id());
create policy lead_tarefas_insert on public.lead_tarefas
for insert with check (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
);
create policy lead_tarefas_update on public.lead_tarefas
for update using (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
) with check (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
);
create policy lead_tarefas_delete on public.lead_tarefas
for delete using (
  public.is_master()
  or (empresa_id = public.user_empresa_id() and usuario_id = auth.uid())
);

-- ============================================================
-- Single-tenant: empresa principal e perfil automatico
-- ============================================================
insert into public.empresas (nome, slug, email, ativa)
select 'Imobiliaria Principal', 'principal', 'contato@imobiliaria.local', true
where not exists (select 1 from public.empresas);

create or replace function public.default_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.empresas where ativa order by created_at asc limit 1;
$$;

insert into public.usuarios (id, empresa_id, nome, email, role, ativo)
select
  au.id,
  public.default_empresa_id(),
  coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.email,
  'admin',
  true
from auth.users au
where public.default_empresa_id() is not null
on conflict (id) do update set
  empresa_id = coalesce(public.usuarios.empresa_id, excluded.empresa_id),
  nome = coalesce(nullif(public.usuarios.nome, ''), excluded.nome),
  email = excluded.email,
  ativo = true;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  select public.default_empresa_id() into v_empresa_id;

  if v_empresa_id is null then
    insert into public.empresas (nome, slug, email, ativa)
    values ('Imobiliaria Principal', 'principal', new.email, true)
    on conflict (slug) do update set ativa = true
    returning id into v_empresa_id;
  end if;

  insert into public.usuarios (id, empresa_id, nome, email, role, ativo)
  values (
    new.id,
    v_empresa_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'admin',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ============================================================
-- Consolidado single-tenant e melhorias posteriores
-- ============================================================
-- Este bloco incorpora as antigas migrations:
-- 002_add_imoveis_cep.sql
-- 003_single_tenant_imoveis.sql
-- 004_single_tenant_admin_writes.sql
-- 005_notify_new_leads.sql
-- 006_increment_imovel_visualizacoes.sql

-- Mantem compatibilidade ao aplicar o script sobre bancos existentes.
alter table public.imoveis
  add column if not exists cep text;

alter table public.imoveis
  alter column empresa_id drop not null;

drop policy if exists imoveis_select_public on public.imoveis;
create policy imoveis_select_public on public.imoveis
for select using (
  status = 'disponivel'
  or public.is_master()
  or empresa_id = public.user_empresa_id()
);

drop policy if exists imovel_imagens_select on public.imovel_imagens;
create policy imovel_imagens_select on public.imovel_imagens
for select using (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and (
      i.status = 'disponivel'
      or public.is_master()
      or i.empresa_id = public.user_empresa_id()
    )
  )
);

drop policy if exists leads_insert_anon on public.leads;
create policy leads_insert_anon on public.leads
for insert with check (
  imovel_id is null
  or exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and i.status = 'disponivel'
  )
);

drop policy if exists imoveis_write_staff on public.imoveis;
create policy imoveis_write_staff on public.imoveis
for insert with check (
  public.is_master()
  or public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
);

drop policy if exists imoveis_update_staff on public.imoveis;
create policy imoveis_update_staff on public.imoveis
for update using (
  public.is_master()
  or public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
) with check (
  public.is_master()
  or public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
);

drop policy if exists imoveis_delete_staff on public.imoveis;
create policy imoveis_delete_staff on public.imoveis
for delete using (
  public.is_master()
  or public.user_role() in ('admin', 'gerente')
);

drop policy if exists imovel_imagens_write on public.imovel_imagens;
create policy imovel_imagens_write on public.imovel_imagens
for all using (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and (
      public.is_master()
      or public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
    )
  )
) with check (
  exists (
    select 1 from public.imoveis i
    where i.id = imovel_id
    and (
      public.is_master()
      or public.user_role() in ('admin', 'gerente', 'corretor', 'captador')
    )
  )
);

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_empresa_id uuid;
begin
  target_empresa_id := new.empresa_id;

  if target_empresa_id is null then
    select id
      into target_empresa_id
      from public.empresas
      where ativa
      order by created_at asc
      limit 1;
  end if;

  if target_empresa_id is null then
    return new;
  end if;

  insert into public.notificacoes (
    empresa_id,
    usuario_id,
    tipo,
    titulo,
    mensagem,
    link
  )
  values (
    target_empresa_id,
    null,
    'lead',
    'Novo lead recebido',
    concat('Lead de ', coalesce(new.name, 'cliente'), ' recebido pelo site.'),
    concat('/admin/leads/', new.id)
  );

  return new;
end;
$$;

drop trigger if exists notify_new_lead on public.leads;
create trigger notify_new_lead
after insert on public.leads
for each row execute function public.notify_new_lead();

create or replace function public.increment_imovel_visualizacoes(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.imoveis
  set visualizacoes = visualizacoes + 1
  where id = target_id
    and status = 'disponivel';
end;
$$;

revoke all on function public.increment_imovel_visualizacoes(uuid) from public;
grant execute on function public.increment_imovel_visualizacoes(uuid) to anon;
grant execute on function public.increment_imovel_visualizacoes(uuid) to authenticated;
