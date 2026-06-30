import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  fetchBrands,
  fetchCategories,
  fetchMenuAllergenCodes,
  fetchMenus,
} from '../../lib/supabaseQueries';
import type { Database } from '../../types/database';
import {
  brands as mockBrands,
  categories as mockCategories,
  categoryMenus as mockMenus,
  type BrandInfo,
  type CategoryInfo,
  type CategoryMenu,
} from '../categories/categoryData';

interface CatalogData {
  categories: CategoryInfo[];
  brands: BrandInfo[];
  menus: CategoryMenu[];
}

interface CatalogState extends CatalogData {
  isLoading: boolean;
  error: Error | null;
  source: 'supabase' | 'mock';
}

type SupabaseCategory = Database['public']['Tables']['categories']['Row'];
type SupabaseBrand = Database['public']['Tables']['brands']['Row'] & {
  categories?: {
    slug?: string | null;
    name?: string | null;
  } | null;
};
type SupabaseMenu = Database['public']['Views']['menu_with_brand']['Row'];
type SupabaseMenuAllergen =
  Database['public']['Tables']['menu_allergens']['Row'] & {
  allergens?: {
    code?: string | null;
  } | null;
};

const mockCatalog: CatalogData = {
  categories: mockCategories,
  brands: mockBrands,
  menus: mockMenus,
};

const emptyCatalog: CatalogData = {
  categories: [],
  brands: [],
  menus: [],
};

function getCategoryDescription(slug: string, name: string) {
  const existingDescription = mockCategories.find(
    (category) => category.slug === slug,
  )?.description;

  return (
    existingDescription ??
    `선택한 알레르기를 제외하고 먹을 수 있는 ${name} 메뉴를 모았어요.`
  );
}

function getBrandLogoText(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || 'A';
}

function getMenuGraphicText(categorySlug: string | null, menuName: string) {
  if (categorySlug === 'pizza') {
    return '🍕';
  }

  if (menuName.includes('치즈')) {
    return '🧀';
  }

  return '🍗';
}

function mapCatalogData(
  categories: SupabaseCategory[],
  brands: SupabaseBrand[],
  menus: SupabaseMenu[],
  menuAllergens: SupabaseMenuAllergen[],
): CatalogData {
  const categoryList = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    description: getCategoryDescription(category.slug, category.name),
  }));

  const categorySlugById = new Map(
    categoryList.map((category) => [category.slug, category.slug]),
  );
  const categorySlugByBrandSlug = new Map<string, string>();

  menus.forEach((menu) => {
    if (menu.brand_slug && menu.category_slug) {
      categorySlugByBrandSlug.set(menu.brand_slug, menu.category_slug);
    }
  });

  const brandList = brands.map((brand) => ({
    slug: brand.slug,
    name: brand.name,
    logoText: getBrandLogoText(brand.name),
    categorySlug:
      brand.categories?.slug ??
      categorySlugByBrandSlug.get(brand.slug) ??
      categorySlugById.values().next().value ??
      'chicken',
    officialUrl: brand.official_url ?? '#',
    allergenSourceUrl: brand.allergen_source_url ?? brand.official_url ?? '#',
    logoUrl: brand.logo_url,
  }));

  const allergensByMenuId = new Map<
    string,
    {
      contains: string[];
      mayContain: string[];
    }
  >();

  menuAllergens.forEach((item) => {
    const menuId = item.menu_id;
    const allergenCode = item.allergens?.code;

    if (!menuId || !allergenCode) {
      return;
    }

    const current = allergensByMenuId.get(menuId) ?? {
      contains: [],
      mayContain: [],
    };

    if (item.presence_type === 'contains') {
      current.contains.push(allergenCode);
    }

    if (item.presence_type === 'may_contain') {
      current.mayContain.push(allergenCode);
    }

    allergensByMenuId.set(menuId, current);
  });

  const menuList = menus
    .filter((menu) => menu.menu_id && menu.menu_slug)
    .map((menu) => {
      const allergenInfo = allergensByMenuId.get(menu.menu_id ?? '') ?? {
        contains: [],
        mayContain: [],
      };

      return {
        id: menu.menu_slug ?? menu.menu_id ?? '',
        dbId: menu.menu_id ?? undefined,
        categorySlug: menu.category_slug ?? 'chicken',
        brandSlug: menu.brand_slug ?? '',
        brandName: menu.brand_name ?? '브랜드',
        brandLogoText: getBrandLogoText(menu.brand_name ?? '브랜드'),
        menuName: menu.menu_name ?? '메뉴',
        menuGraphicText: getMenuGraphicText(
          menu.category_slug,
          menu.menu_name ?? '',
        ),
        imageUrl: menu.image_url,
        contains: allergenInfo.contains,
        mayContain: allergenInfo.mayContain,
        lastCheckedAt:
          menu.last_checked_at ?? new Date().toISOString().slice(0, 10),
      };
    });

  return {
    categories: categoryList,
    brands: brandList,
    menus: menuList,
  };
}

export function useCatalogData(): CatalogState {
  const hasSupabaseConfig = isSupabaseConfigured();
  const [state, setState] = useState<CatalogState>({
    ...(hasSupabaseConfig ? emptyCatalog : mockCatalog),
    isLoading: hasSupabaseConfig,
    error: null,
    source: hasSupabaseConfig ? 'supabase' : 'mock',
  });

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setState({
        ...mockCatalog,
        isLoading: false,
        error: null,
        source: 'mock',
      });
      return;
    }

    let isMounted = true;

    async function loadCatalog() {
      try {
        const [categories, brands, menus] = await Promise.all([
          fetchCategories(),
          fetchBrands(),
          fetchMenus(),
        ]);
        const typedMenus = menus as SupabaseMenu[];
        const menuIds = typedMenus
          .map((menu) => menu.menu_id)
          .filter((menuId): menuId is string => Boolean(menuId));
        const menuAllergens = await fetchMenuAllergenCodes(menuIds);
        const catalog = mapCatalogData(
          categories as SupabaseCategory[],
          brands as SupabaseBrand[],
          typedMenus,
          menuAllergens as SupabaseMenuAllergen[],
        );

        if (isMounted) {
          setState({
            ...catalog,
            isLoading: false,
            error: null,
            source: 'supabase',
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            ...emptyCatalog,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            source: 'supabase',
          });
        }
      }
    }

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [hasSupabaseConfig]);

  return useMemo(() => state, [state]);
}
