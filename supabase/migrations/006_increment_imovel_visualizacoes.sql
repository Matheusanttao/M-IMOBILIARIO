-- ============================================================
-- Contador publico de visualizacoes de imoveis
-- ============================================================
-- Incrementa apenas imoveis disponiveis e nao libera update
-- publico direto na tabela imoveis.

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
