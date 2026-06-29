-- Update brand logo URLs for locally saved public assets
begin;

update public.brands
set logo_url = '/assets/brands/logo_60chicken.png'
where slug = '60chicken';

update public.brands
set logo_url = '/assets/brands/logo_banolim-pizza.png'
where slug = 'banolim-pizza';

update public.brands
set logo_url = '/assets/brands/logo_bhc.png'
where slug = 'bhc';

update public.brands
set logo_url = '/assets/brands/logo_cheogajip.png'
where slug = 'cheogajip';

update public.brands
set logo_url = '/assets/brands/logo_dominos.png'
where slug = 'dominos';

update public.brands
set logo_url = '/assets/brands/logo_goobne.png'
where slug = 'goobne';

update public.brands
set logo_url = '/assets/brands/logo_hochicken.png'
where slug = 'hochicken';

update public.brands
set logo_url = '/assets/brands/logo_hosigi.png'
where slug = 'hosigi';

update public.brands
set logo_url = '/assets/brands/logo_jadam.png'
where slug = 'jadam';

update public.brands
set logo_url = '/assets/brands/logo_ovenmaru.png'
where slug = 'ovenmaru';

update public.brands
set logo_url = '/assets/brands/logo_papajohns.png'
where slug = 'papajohns';

update public.brands
set logo_url = '/assets/brands/logo_pizzahut.png'
where slug = 'pizzahut';

update public.brands
set logo_url = '/assets/brands/logo_puradak.png'
where slug = 'puradak';

commit;
