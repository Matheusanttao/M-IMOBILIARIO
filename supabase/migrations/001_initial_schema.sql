-- Tabela de imóveis
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('casa', 'apartamento', 'terreno', 'sala_comercial')),
  purpose text not null check (purpose in ('venda', 'aluguel')),
  price numeric(12, 2) not null check (price >= 0),
  city text not null,
  neighborhood text not null,
  address text,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  parking_spaces integer not null default 0 check (parking_spaces >= 0),
  area numeric(10, 2) check (area is null or area >= 0),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  featured boolean not null default false,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Imagens
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  public_id text not null,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists property_images_property_id_idx on public.property_images (property_id);

-- Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists leads_property_id_idx on public.leads (property_id);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

-- RLS
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.leads enable row level security;

-- properties: leitura pública de ativos OU dono vê os seus (inclusive inativos)
drop policy if exists "properties_select_public_or_owner" on public.properties;
create policy "properties_select_public_or_owner"
on public.properties for select
using (
  status = 'ativo'
  or (auth.uid() is not null and auth.uid() = user_id)
);

drop policy if exists "properties_insert_owner" on public.properties;
create policy "properties_insert_owner"
on public.properties for insert
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "properties_update_owner" on public.properties;
create policy "properties_update_owner"
on public.properties for update
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "properties_delete_owner" on public.properties;
create policy "properties_delete_owner"
on public.properties for delete
using (auth.uid() is not null and auth.uid() = user_id);

-- property_images: visível se o imóvel for público (ativo) ou pertencer ao usuário
drop policy if exists "property_images_select" on public.property_images;
create policy "property_images_select"
on public.property_images for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id
    and (p.status = 'ativo' or (auth.uid() is not null and p.user_id = auth.uid()))
  )
);

drop policy if exists "property_images_insert_owner" on public.property_images;
create policy "property_images_insert_owner"
on public.property_images for insert
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_id and auth.uid() = p.user_id
  )
);

drop policy if exists "property_images_delete_owner" on public.property_images;
create policy "property_images_delete_owner"
on public.property_images for delete
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and auth.uid() = p.user_id
  )
);

drop policy if exists "property_images_update_owner" on public.property_images;
create policy "property_images_update_owner"
on public.property_images for update
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and auth.uid() = p.user_id
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_id and auth.uid() = p.user_id
  )
);

-- leads: qualquer um pode enviar; dono do imóvel pode ler
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
on public.leads for insert
with check (true);

drop policy if exists "leads_select_owner" on public.leads;
create policy "leads_select_owner"
on public.leads for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and auth.uid() = p.user_id
  )
);

drop policy if exists "leads_delete_owner" on public.leads;
create policy "leads_delete_owner"
on public.leads for delete
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and auth.uid() = p.user_id
  )
);
