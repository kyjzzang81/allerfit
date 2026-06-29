# AllerFit Supabase Setup

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase project values.

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 2. Database Schema

Run this SQL in the Supabase SQL editor:

```text
supabase/migrations/20260629000000_initial_schema.sql
```

The SQL creates:

- categories
- brands
- allergens
- menus
- menu_allergens
- data_sources
- menu_origins
- profiles
- user_allergens
- menu_with_brand view
- public read RLS policies for app data
- authenticated user policies for future profile/allergen sync

## 3. Current App Behavior

The app already creates a typed Supabase client in `src/lib/supabase.ts`.

If environment variables are missing, the app can continue using local mock data.
When the environment variables are present, query helpers in
`src/lib/supabaseQueries.ts` can be used to replace mock data screen by screen.

## 4. Data Import

Collected source files are currently under:

```text
data/collection/brands.csv
data/collection/menu_data.csv
```

Use these as staging inputs before inserting official brand/menu/allergen data
into Supabase.
