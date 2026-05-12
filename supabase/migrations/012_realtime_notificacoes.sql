-- Habilita Realtime para notificações (pode falhar se já estiver na publication)
do $$
begin
  alter publication supabase_realtime add table public.notificacoes;
exception
  when duplicate_object then null;
end $$;
