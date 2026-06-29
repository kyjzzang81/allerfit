begin;

insert into public.brands (
  category_id,
  slug,
  name,
  data_status,
  display_order,
  is_active
)
values
  ((select id from public.categories where slug = 'chicken'), 'pelicana', '페리카나', 'unverified', 31, true),
  ((select id from public.categories where slug = 'chicken'), 'mexicana', '멕시카나', 'unverified', 32, true)
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  data_status = excluded.data_status,
  display_order = excluded.display_order,
  is_active = true;

commit;
