-- ============================================================
-- 010: Auditoria — colunas extras em logs
-- ============================================================

alter table public.logs add column if not exists ip text;
alter table public.logs add column if not exists user_agent text;
alter table public.logs add column if not exists dados_anteriores jsonb;
alter table public.logs add column if not exists dados_novos jsonb;
