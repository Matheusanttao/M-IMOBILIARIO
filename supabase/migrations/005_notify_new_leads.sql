-- ============================================================
-- Notificacao automatica para novos leads
-- ============================================================

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
