begin;

alter table public.menus
add column if not exists menu_type smallint not null default 1;

alter table public.menus
drop constraint if exists menus_menu_type_check;

alter table public.menus
add constraint menus_menu_type_check check (menu_type in (1, 2, 3));

update public.menus m
set menu_type = case
  when lower(coalesce(m.source_url, '')) similar to '%(dsp_ctgr=c0201|/side|/pastaandside|pastaandside|cate=4)%' then 3
  when lower(coalesce(m.source_url, '')) similar to '%(/parts)%' then 2
  when m.name ~ '(사이드|치즈볼|치즈스틱|감자튀김|프라이|웨지|너겟|텐더|떡볶이|핫도그|브라우니|파스타|스파게티|리조또|샐러드|콜라|사이다|음료|소스|피클|치킨무|콘샐러드|오징어|먹태|닭발|닭똥집|닭껍데기|김말이|멘보샤|오뎅탕|시즈닝|디핑)' then 3
  when bc.slug is not null and mc.slug is not null and bc.slug <> mc.slug then 2
  else 1
end
from public.brands b
left join public.categories bc on bc.id = b.category_id
cross join public.categories mc
where m.brand_id = b.id
  and mc.id = m.category_id;

create index if not exists menus_brand_menu_type_idx
on public.menus(brand_id, menu_type);

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
  coalesce(m.last_checked_at, b.last_checked_at) as last_checked_at,
  m.menu_type
from public.menus m
join public.brands b on m.brand_id = b.id
join public.categories c on m.category_id = c.id
where m.is_active = true
  and b.is_active = true
  and c.is_active = true;

comment on column public.menus.menu_type is
'Menu display group. 1=primary menu, 2=secondary/non-side menu, 3=side menu.';

commit;
