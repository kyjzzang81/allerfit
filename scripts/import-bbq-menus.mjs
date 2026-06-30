import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getMenuType } from './menu-type.mjs';

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'datas', 'menu_bbq.json');
const IMAGE_ROOT = path.join(ROOT, 'public');
const BUCKET = 'menus';
const BRAND_SLUG = 'bbq';
const CHECKED_AT = '2026-06-30';

function readDotEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((match) => [
        match[1],
        match[2].replace(/^['"]|['"]$/g, ''),
      ]),
  );
}

async function loadEnv() {
  const files = ['.env.local', '.env'];
  const env = {};

  for (const file of files) {
    try {
      Object.assign(env, readDotEnv(await fs.readFile(path.join(ROOT, file), 'utf8')));
    } catch {
      // Optional env files.
    }
  }

  return { ...env, ...process.env };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function toMenuSlug(menu) {
  return `${BRAND_SLUG}-${slugify(menu.englishName || menu.menuName || menu.id)}`;
}

function toCategorySlug(menu) {
  if (menu.sourceCategoryId === 20 && menu.menuName.includes('피자')) {
    return 'pizza';
  }

  return 'chicken';
}

function toMenuType(menu) {
  return getMenuType({
    brandCategorySlug: 'chicken',
    menuCategorySlug: toCategorySlug(menu),
    sourceCategoryId: menu.sourceCategoryId,
    menuName: menu.menuName,
  });
}

function normalizeAllergen(value) {
  return String(value)
    .trim()
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, '');
}

function mapAllergenNameToCode(value) {
  const normalized = normalizeAllergen(value);
  const map = {
    알류: 'egg',
    난류: 'egg',
    계란: 'egg',
    우유: 'milk',
    땅콩: 'peanut',
    대두: 'soybean',
    밀: 'wheat',
    새우: 'shrimp',
    돼지고기: 'pork',
    토마토: 'tomato',
    닭고기: 'chicken',
    쇠고기: 'beef',
    소고기: 'beef',
    조개류: 'shellfish',
    아황산류: 'sulfite',
    오징어: 'squid',
    게: 'crab',
    메밀: 'buckwheat',
    복숭아: 'peach',
    호두: 'walnut',
  };

  return map[normalized] ?? null;
}

function toOriginText(origin) {
  if (!Array.isArray(origin) || origin.length === 0) {
    return null;
  }

  return origin
    .map((item) => `${item.name ?? '원재료'}: ${item.region ?? ''}`.trim())
    .join('; ');
}

async function requireSingle(client, table, query) {
  const { data, error } = await query.single();
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  return data;
}

async function uploadImage(client, menu, bucketIsPublic) {
  const localPath = path.join(IMAGE_ROOT, menu.localImagePath.replace(/^\//, ''));
  const storagePath = `${BRAND_SLUG}/${path.basename(menu.localImagePath)}`;
  const body = await fs.readFile(localPath);

  const { error } = await client.storage.from(BUCKET).upload(storagePath, body, {
    cacheControl: '31536000',
    contentType: 'image/png',
    upsert: true,
  });

  if (error) {
    throw new Error(`storage upload ${storagePath}: ${error.message}`);
  }

  if (bucketIsPublic) {
    return client.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  const { data, error: signedError } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

  if (signedError) {
    throw new Error(`storage signed url ${storagePath}: ${signedError.message}`);
  }

  return data.signedUrl;
}

async function main() {
  const env = await loadEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Set SUPABASE_URL or VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this importer.',
    );
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const menus = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const brand = await requireSingle(
    client,
    'brands',
    client.from('brands').select('id, slug').eq('slug', BRAND_SLUG),
  );

  const { data: categories, error: categoriesError } = await client
    .from('categories')
    .select('id, slug');
  if (categoriesError) {
    throw categoriesError;
  }
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const { data: allergens, error: allergensError } = await client
    .from('allergens')
    .select('id, code');
  if (allergensError) {
    throw allergensError;
  }
  const allergenByCode = new Map(allergens.map((allergen) => [allergen.code, allergen.id]));

  const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
  if (bucketsError) {
    throw bucketsError;
  }

  const bucket = buckets.find((item) => item.name === BUCKET || item.id === BUCKET);
  if (!bucket) {
    throw new Error(`Storage bucket "${BUCKET}" does not exist.`);
  }

  const source = await requireSingle(
    client,
    'data_sources',
    client
      .from('data_sources')
      .upsert(
        {
          brand_id: brand.id,
          title: 'BBQ official menu allergy data',
          source_type: 'official_page',
          url: 'https://bbq.co.kr',
          checked_at: CHECKED_AT,
          note: 'Collected from BBQ menu and product detail API.',
        },
        { onConflict: 'brand_id,source_type,url' },
      )
      .select('id'),
  );

  const menuRows = [];
  const originRows = [];
  const allergenRows = [];

  for (const menu of menus) {
    const imageUrl = await uploadImage(client, menu, bucket.public);
    const categorySlug = toCategorySlug(menu);
    const categoryId = categoryBySlug.get(categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category "${categorySlug}" for ${menu.menuName}`);
    }

    const menuRow = await requireSingle(
      client,
      'menus',
      client
        .from('menus')
        .upsert(
          {
            brand_id: brand.id,
            category_id: categoryId,
            slug: toMenuSlug(menu),
            name: menu.menuName,
            description: menu.description,
            image_url: imageUrl,
            menu_type: toMenuType(menu),
            menu_status: menu.isSoldOut ? 'unknown' : 'active',
            source_url: menu.sourceProductUrl,
            last_checked_at: CHECKED_AT,
            is_active: true,
          },
          { onConflict: 'slug' },
        )
        .select('id, slug'),
    );

    menuRows.push(menuRow);

    const originText = toOriginText(menu.origin);
    if (originText) {
      originRows.push({
        menu_id: menuRow.id,
        ingredient_name: null,
        origin_country: null,
        origin_text: originText,
        source_id: source.id,
        checked_at: CHECKED_AT,
        note: null,
      });
    }

    const allergenCodes = new Set(
      (menu.allergens ?? [])
        .map(mapAllergenNameToCode)
        .filter(Boolean),
    );

    for (const code of allergenCodes) {
      const allergenId = allergenByCode.get(code);
      if (!allergenId) {
        throw new Error(`Missing allergen code "${code}" for ${menu.menuName}`);
      }

      allergenRows.push({
        menu_id: menuRow.id,
        allergen_id: allergenId,
        presence_type: 'contains',
        source_id: source.id,
        note: menu.allergy ?? null,
      });
    }
  }

  const menuIds = menuRows.map((menu) => menu.id);
  await client.from('menu_allergens').delete().in('menu_id', menuIds);
  await client.from('menu_origins').delete().in('menu_id', menuIds);

  if (allergenRows.length > 0) {
    const { error } = await client.from('menu_allergens').insert(allergenRows);
    if (error) {
      throw error;
    }
  }

  if (originRows.length > 0) {
    const { error } = await client.from('menu_origins').insert(originRows);
    if (error) {
      throw error;
    }
  }

  const { error: brandError } = await client
    .from('brands')
    .update({
      allergen_source_url: 'https://bbq.co.kr',
      origin_source_url: 'https://bbq.co.kr',
      data_status: 'official_verified',
      last_checked_at: CHECKED_AT,
    })
    .eq('id', brand.id);

  if (brandError) {
    throw brandError;
  }

  console.log(`Imported ${menuRows.length} BBQ menus.`);
  console.log(`Uploaded ${menus.length} images to storage bucket "${BUCKET}/${BRAND_SLUG}".`);
  console.log(`Inserted ${allergenRows.length} menu allergen rows.`);
  console.log(`Inserted ${originRows.length} menu origin rows.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
