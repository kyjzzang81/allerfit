# AllerFit DB Table Schema

AllerFit MVP의 DB는 공개 메뉴 데이터와 알레르기 판정 근거를 안정적으로 관리하는 데 집중한다. 사용자 알레르기 선택은 MVP에서 `localStorage`를 기본으로 사용하고, 로그인 기반 저장은 2차 개발 범위로 둔다.

## 설계 방향

- 메뉴별 최종 안전도는 DB에 고정 저장하지 않는다.
- 사용자가 선택한 알레르기 성분 기준으로 `contains`, `may_contain`, `unknown` 데이터를 조합해 화면에서 판정한다.
- 브랜드, 메뉴, 알레르기 성분, 출처/검수 정보를 분리해 데이터 변경 추적이 가능하도록 한다.
- MVP 최소 구성은 `categories`, `brands`, `allergens`, `menus`, `menu_allergens`, `data_sources`를 기준으로 한다.
- 로그인 확장 시 `profiles`, `user_allergens`를 추가한다.

## 1. categories

치킨, 피자 같은 탐색 카테고리를 관리한다.

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

초기 데이터:

```text
chicken / 치킨
pizza / 피자
```

## 2. brands

브랜드 기본 정보와 브랜드 단위 데이터 상태를 관리한다.

```sql
create table brands (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  slug text unique not null,
  name text not null,
  logo_url text,
  official_url text,
  allergen_source_url text,
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
```

`data_status` 값:

```text
official_verified
pdf_verified
delivery_app_checked
user_reported
unverified
no_data
```

## 3. allergens

국내 식품 알레르기 표시 기준에 맞춘 알레르기 성분 마스터 테이블이다.

```sql
create table allergens (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  display_name text not null,
  description text,
  display_order int default 0,
  is_active boolean default true
);
```

초기 성분:

| code | 공식명 | 사용자 표시명 |
|---|---|---|
| egg | 난류 | 계란 |
| milk | 우유 | 우유·유제품 |
| buckwheat | 메밀 | 메밀 |
| peanut | 땅콩 | 땅콩 |
| soybean | 대두 | 대두·콩 |
| wheat | 밀 | 밀·글루텐 |
| mackerel | 고등어 | 고등어 |
| crab | 게 | 게 |
| shrimp | 새우 | 새우 |
| pork | 돼지고기 | 돼지고기 |
| peach | 복숭아 | 복숭아 |
| tomato | 토마토 | 토마토 |
| sulfite | 아황산류 | 아황산류 |
| walnut | 호두 | 호두·견과류 |
| chicken | 닭고기 | 닭고기 |
| beef | 쇠고기 | 소고기 |
| squid | 오징어 | 오징어 |
| shellfish | 조개류 | 조개류 |

## 4. menus

메뉴 기본 정보를 관리한다. 알레르기 성분 정보는 `menu_allergens`에 분리해서 저장한다.

```sql
create table menus (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
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
```

`menu_status` 값:

```text
active
seasonal
discontinued
unknown
```

## 5. menu_allergens

메뉴와 알레르기 성분의 관계를 저장하는 핵심 테이블이다.

```sql
create table menu_allergens (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references menus(id) on delete cascade,
  allergen_id uuid references allergens(id),
  presence_type text not null,
  note text,
  source_id uuid references data_sources(id),
  created_at timestamptz default now(),
  unique(menu_id, allergen_id, presence_type),
  constraint menu_allergens_presence_type_check check (
    presence_type in ('contains', 'may_contain', 'unknown')
  )
);
```

`presence_type` 값:

```text
contains
may_contain
unknown
```

판정 우선순위:

```text
1. contains에 사용자 선택 알레르기 성분이 있으면 avoid
2. may_contain에 사용자 선택 알레르기 성분이 있으면 caution
3. 메뉴 알레르기 데이터가 없으면 unknown
4. 사용자 선택 알레르기와 매칭되는 성분이 없으면 safe_by_public_info
```

## 6. data_sources

브랜드 또는 메뉴 알레르기 정보의 출처와 검수 이력을 관리한다.

```sql
create table data_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
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
```

`source_type` 값:

```text
official_page
pdf
delivery_app
manual_check
```

## 7. profiles

Supabase Auth 기반 로그인 확장을 위한 사용자 프로필 테이블이다. MVP에서는 필수 테이블이 아니다.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 8. user_allergens

로그인 사용자의 알레르기 성분 선택값을 저장한다. MVP에서는 `localStorage`를 우선 사용하고, 2차 개발에서 이 테이블로 동기화한다.

```sql
create table user_allergens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  allergen_id uuid references allergens(id),
  created_at timestamptz default now(),
  unique(user_id, allergen_id)
);
```

## 9. menu_with_brand view

카테고리 상세, 검색, 브랜드 상세 화면에서 공통으로 사용할 조회용 view다.

```sql
create view menu_with_brand as
select
  m.id as menu_id,
  m.name as menu_name,
  m.slug as menu_slug,
  m.image_url,
  m.category_id,
  m.brand_id,
  b.name as brand_name,
  b.slug as brand_slug,
  b.logo_url,
  b.data_status as brand_data_status,
  b.allergen_source_url,
  coalesce(m.last_checked_at, b.last_checked_at) as last_checked_at
from menus m
join brands b on m.brand_id = b.id
where m.is_active = true
  and b.is_active = true;
```

## MVP 권장 구성

MVP에서 먼저 만들 테이블:

```text
categories
brands
allergens
menus
menu_allergens
data_sources
```

2차 개발에서 추가할 테이블:

```text
profiles
user_allergens
```

## RLS 방향

MVP에서는 공개 콘텐츠 데이터는 누구나 읽을 수 있어야 한다.

공개 읽기 대상:

```text
categories
brands
allergens
menus
menu_allergens
data_sources
```

쓰기 권한은 관리자 또는 service role만 허용하는 방향이 적합하다. `profiles`, `user_allergens`는 로그인 사용자 본인 데이터만 읽고 쓸 수 있도록 RLS를 분리한다.
