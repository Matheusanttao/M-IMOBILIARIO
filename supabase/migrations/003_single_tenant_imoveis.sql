-- ============================================================
-- Simplificacao para single-tenant (uma unica imobiliaria)
-- Imoveis publicos passam a depender apenas de status = 'disponivel',
-- sem exigir vinculo com uma empresa ativa.
-- Nenhum dado e apagado por esta migration.
-- ============================================================

-- ------------------------------------------------------------
-- 1. empresa_id deixa de ser obrigatorio em imoveis
-- ------------------------------------------------------------
alter table public.imoveis
  alter column empresa_id drop not null;

-- ------------------------------------------------------------
-- 2. Leitura publica de imoveis: qualquer imovel 'disponivel'
-- ------------------------------------------------------------
drop policy if exists imoveis_select_public on public.imoveis;
create policy imoveis_select_public on public.imoveis
for select using (
  status = 'disponivel'
  or public.is_master()
  or empresa_id = public.user_empresa_id()
);

-- ------------------------------------------------------------
-- 3. Leitura publica das imagens dos imoveis 'disponivel'
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 4. Captura de leads do site nao depende mais de empresa ativa
--    (mantem a vinculacao via trigger leads_set_empresa_id)
-- ------------------------------------------------------------
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
