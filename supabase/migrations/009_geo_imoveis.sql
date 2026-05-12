-- ============================================================
-- 009: Geo — localização aproximada (lat/lng já existem em 002)
-- ============================================================

alter table public.imoveis add column if not exists localizacao_aproximada boolean not null default false;

create index if not exists imoveis_lat_lng_idx on public.imoveis (latitude, longitude)
  where latitude is not null and longitude is not null;
