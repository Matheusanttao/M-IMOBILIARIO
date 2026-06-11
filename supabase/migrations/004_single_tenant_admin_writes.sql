-- ============================================================
-- Single-tenant: escrita do admin sem depender de empresa_id
-- ============================================================
-- Depois da simplificacao para uma unica imobiliaria, alguns imoveis
-- podem estar sem empresa_id ou com empresa_id diferente do perfil logado.
-- As policies antigas bloqueavam update/imagens nesses casos.

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
