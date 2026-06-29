select 'categories' as table_name, count(*) as row_count from public.categories
union all
select 'brands', count(*) from public.brands
union all
select 'allergens', count(*) from public.allergens
union all
select 'menus', count(*) from public.menus
union all
select 'data_sources', count(*) from public.data_sources
union all
select 'menu_allergens', count(*) from public.menu_allergens
union all
select 'menu_origins', count(*) from public.menu_origins;

select
  b.name as brand_name,
  b.slug as brand_slug,
  count(m.id) as menu_count
from public.brands b
left join public.menus m on m.brand_id = b.id
group by b.id, b.name, b.slug
having count(m.id) > 0
order by menu_count desc, b.name;

select
  b.name as brand_name,
  count(distinct m.id) as menu_count,
  count(ma.id) as allergen_relation_count
from public.brands b
join public.menus m on m.brand_id = b.id
left join public.menu_allergens ma on ma.menu_id = m.id
group by b.id, b.name
order by allergen_relation_count desc;

select
  m.name as menu_name,
  b.name as brand_name,
  string_agg(a.code, ';' order by a.display_order) as allergen_codes,
  string_agg(a.display_name, ', ' order by a.display_order) as allergen_names
from public.menus m
join public.brands b on b.id = m.brand_id
join public.menu_allergens ma on ma.menu_id = m.id
join public.allergens a on a.id = ma.allergen_id
where b.slug in ('pizzahut', 'dominos', 'hosigi')
group by m.id, m.name, b.name
order by b.name, m.name
limit 20;
