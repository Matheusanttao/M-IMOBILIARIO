-- Leitura pública de empresas ativas (resolução de tenant no site)
drop policy if exists empresas_select_public_active on public.empresas;
create policy empresas_select_public_active on public.empresas
for select
to anon
using (ativa = true);

-- Diretório de corretores no site público (anon)
drop policy if exists usuarios_select_public_team on public.usuarios;
create policy usuarios_select_public_team on public.usuarios
for select
to anon
using (
  ativo = true
  and role in ('corretor', 'gerente', 'admin')
);
