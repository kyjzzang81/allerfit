import { supabase } from './supabase';
import type { Database } from '../types/database';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface MenuAllergenCodeRow {
  menu_id: string | null;
  presence_type: 'contains' | 'may_contain' | 'unknown';
  allergens: {
    code: string | null;
  } | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }

  return supabase;
}

export async function fetchCategories() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchAllergens() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('allergens')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchBrands(categorySlug?: string) {
  const client = requireSupabase();
  let query = client
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (categorySlug) {
    const { data: category, error: categoryError } = await client
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryError) {
      throw categoryError;
    }

    query = query.eq('category_id', (category as CategoryRow).id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchMenusByCategory(categorySlug: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_with_brand')
    .select('*')
    .eq('category_slug', categorySlug)
    .order('brand_name')
    .order('menu_name');

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchMenusByBrand(brandSlug: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_with_brand')
    .select('*')
    .eq('brand_slug', brandSlug)
    .order('menu_name');

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchMenus() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_with_brand')
    .select('*')
    .order('category_name')
    .order('brand_name')
    .order('menu_name');

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchMenuDetail(menuSlug: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menus')
    .select('*, brands(*), categories(*)')
    .eq('slug', menuSlug)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchMenuAllergenCodes(menuIds: string[]) {
  const client = requireSupabase();

  if (menuIds.length === 0) {
    return [];
  }

  const pageSize = 1000;
  let from = 0;
  const rows: MenuAllergenCodeRow[] = [];
  const menuIdSet = new Set(menuIds);

  while (true) {
    const { data, error } = await client
      .from('menu_allergens')
      .select(
        `
        menu_id,
        presence_type,
        allergens (
          code
        )
      `,
      )
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    rows.push(
      ...(data as MenuAllergenCodeRow[]).filter(
        (row) => row.menu_id && menuIdSet.has(row.menu_id),
      ),
    );

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

export async function fetchMenuAllergens(menuId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_allergens')
    .select(
      `
      presence_type,
      note,
      allergens (
        id,
        code,
        name,
        display_name
      )
    `,
    )
    .eq('menu_id', menuId);

  if (error) {
    throw error;
  }

  return data;
}
