begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  slug text unique not null,
  name text not null,
  logo_url text,
  official_url text,
  allergen_source_url text,
  origin_source_url text,
  data_status text not null default 'unverified',
  last_checked_at date,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint brands_data_status_check check (
    data_status in (
      'official_verified',
      'pdf_verified',
      'delivery_app_checked',
      'user_reported',
      'unverified',
      'no_data'
    )
  )
);

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create table if not exists public.allergens (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  display_name text not null,
  description text,
  display_order int default 0,
  is_active boolean default true
);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  category_id uuid references public.categories(id),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  menu_status text not null default 'active',
  source_url text,
  last_checked_at date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint menus_menu_status_check check (
    menu_status in ('active', 'seasonal', 'discontinued', 'unknown')
  )
);

drop trigger if exists set_menus_updated_at on public.menus;
create trigger set_menus_updated_at
before update on public.menus
for each row execute function public.set_updated_at();

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  title text not null,
  source_type text not null,
  url text,
  checked_at date not null,
  captured_at timestamptz default now(),
  note text,
  created_at timestamptz default now(),
  constraint data_sources_source_type_check check (
    source_type in ('official_page', 'pdf', 'delivery_app', 'manual_check')
  )
);

create table if not exists public.menu_allergens (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references public.menus(id) on delete cascade,
  allergen_id uuid references public.allergens(id),
  presence_type text not null,
  note text,
  source_id uuid references public.data_sources(id),
  created_at timestamptz default now(),
  unique(menu_id, allergen_id, presence_type),
  constraint menu_allergens_presence_type_check check (
    presence_type in ('contains', 'may_contain', 'unknown')
  )
);

create table if not exists public.menu_origins (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references public.menus(id) on delete cascade,
  ingredient_name text,
  origin_country text,
  origin_text text not null,
  source_id uuid references public.data_sources(id),
  checked_at date,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.user_allergens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  allergen_id uuid references public.allergens(id),
  created_at timestamptz default now(),
  unique(user_id, allergen_id)
);

create index if not exists brands_category_id_idx on public.brands(category_id);
create index if not exists brands_slug_idx on public.brands(slug);
create index if not exists menus_brand_id_idx on public.menus(brand_id);
create index if not exists menus_category_id_idx on public.menus(category_id);
create index if not exists menus_slug_idx on public.menus(slug);
create index if not exists menu_allergens_menu_id_idx on public.menu_allergens(menu_id);
create index if not exists menu_allergens_allergen_id_idx on public.menu_allergens(allergen_id);
create index if not exists menu_origins_menu_id_idx on public.menu_origins(menu_id);
create index if not exists data_sources_brand_id_idx on public.data_sources(brand_id);
create unique index if not exists data_sources_brand_source_url_idx
on public.data_sources(brand_id, source_type, url);
create index if not exists user_allergens_user_id_idx on public.user_allergens(user_id);

create or replace view public.menu_with_brand as
select
  m.id as menu_id,
  m.name as menu_name,
  m.slug as menu_slug,
  m.image_url,
  m.category_id,
  c.slug as category_slug,
  c.name as category_name,
  m.brand_id,
  b.name as brand_name,
  b.slug as brand_slug,
  b.logo_url,
  b.data_status as brand_data_status,
  b.allergen_source_url,
  b.origin_source_url,
  coalesce(m.last_checked_at, b.last_checked_at) as last_checked_at
from public.menus m
join public.brands b on m.brand_id = b.id
join public.categories c on m.category_id = c.id
where m.is_active = true
  and b.is_active = true
  and c.is_active = true;

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.allergens enable row level security;
alter table public.menus enable row level security;
alter table public.data_sources enable row level security;
alter table public.menu_allergens enable row level security;
alter table public.menu_origins enable row level security;
alter table public.profiles enable row level security;
alter table public.user_allergens enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public read brands" on public.brands;
create policy "Public read brands"
on public.brands for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public read allergens" on public.allergens;
create policy "Public read allergens"
on public.allergens for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public read menus" on public.menus;
create policy "Public read menus"
on public.menus for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public read data_sources" on public.data_sources;
create policy "Public read data_sources"
on public.data_sources for select
to anon, authenticated
using (true);

drop policy if exists "Public read menu_allergens" on public.menu_allergens;
create policy "Public read menu_allergens"
on public.menu_allergens for select
to anon, authenticated
using (true);

drop policy if exists "Public read menu_origins" on public.menu_origins;
create policy "Public read menu_origins"
on public.menu_origins for select
to anon, authenticated
using (true);

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users read own allergens" on public.user_allergens;
create policy "Users read own allergens"
on public.user_allergens for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own allergens" on public.user_allergens;
create policy "Users insert own allergens"
on public.user_allergens for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own allergens" on public.user_allergens;
create policy "Users delete own allergens"
on public.user_allergens for delete
to authenticated
using (auth.uid() = user_id);

insert into public.categories (slug, name, display_order)
values
  ('chicken', '치킨', 1),
  ('pizza', '피자', 2)
on conflict (slug) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = true;

insert into public.allergens (code, name, display_name, display_order)
values
  ('egg', '난류', '계란', 1),
  ('milk', '우유', '우유·유제품', 2),
  ('buckwheat', '메밀', '메밀', 3),
  ('peanut', '땅콩', '땅콩', 4),
  ('soybean', '대두', '대두·콩', 5),
  ('wheat', '밀', '밀·글루텐', 6),
  ('mackerel', '고등어', '고등어', 7),
  ('crab', '게', '게', 8),
  ('shrimp', '새우', '새우', 9),
  ('pork', '돼지고기', '돼지고기', 10),
  ('peach', '복숭아', '복숭아', 11),
  ('tomato', '토마토', '토마토', 12),
  ('sulfite', '아황산류', '아황산류', 13),
  ('walnut', '호두', '호두·견과류', 14),
  ('chicken', '닭고기', '닭고기', 15),
  ('beef', '쇠고기', '소고기', 16),
  ('squid', '오징어', '오징어', 17),
  ('shellfish', '조개류', '조개류', 18)
on conflict (code) do update
set
  name = excluded.name,
  display_name = excluded.display_name,
  display_order = excluded.display_order,
  is_active = true;

commit;
