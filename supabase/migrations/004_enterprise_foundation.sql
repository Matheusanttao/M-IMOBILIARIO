-- ============================================================
-- 004: Mercado Pago upsert, papéis estendidos, RBAC permissoes
-- ============================================================

create unique index if not exists pagamentos_mercadopago_payment_id_uidx
  on public.pagamentos (mercadopago_payment_id)
  where mercadopago_payment_id is not null;

alter table public.usuarios drop constraint if exists usuarios_role_check;
alter table public.usuarios add constraint usuarios_role_check
  check (role in (
    'master', 'admin', 'gerente', 'corretor',
    'financeiro', 'captador', 'atendente'
  ));

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

alter table public.permissoes enable row level security;

drop policy if exists permissoes_select on public.permissoes;
create policy permissoes_select on public.permissoes
for select using (
  public.is_master()
  or empresa_id = public.user_empresa_id()
);

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

-- captador pode cadastrar imóveis
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
) with check (
  empresa_id = public.user_empresa_id() or public.is_master()
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

drop policy if exists leads_update_staff on public.leads;
create policy leads_update_staff on public.leads
for update using (
  public.is_master()
  or (
    empresa_id = public.user_empresa_id()
    and public.user_role() in ('admin', 'gerente', 'corretor', 'captador', 'atendente')
  )
);
