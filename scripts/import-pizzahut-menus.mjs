import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getMenuType } from './menu-type.mjs';

const ROOT = process.cwd();
const BRAND_SLUG = 'pizzahut';
const BRAND_NAME = '피자헛';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const STORE_CODE = '0996';
const BASE_URL = 'https://www.pizzahut.co.kr';
const IMAGE_ROOT = 'https://akamai.pizzahut.co.kr/2020pizzahut-prod/public/img/menu';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_pizzahut.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  {
    slug: 'cheesefesta',
    name: '치즈페스타',
    categorySlug: 'pizza',
    url: `${BASE_URL}/menu/pizza/cheesefesta`,
    apiPath: `/api/menu/${STORE_CODE}/list/cheesefesta/DELIVERY`,
  },
  {
    slug: 'premium',
    name: '프리미엄',
    categorySlug: 'pizza',
    url: `${BASE_URL}/menu/pizza/premium`,
    apiPath: `/api/menu/${STORE_CODE}/list/premium/DELIVERY`,
  },
  {
    slug: 'usoriginal',
    name: 'US 오리지널',
    categorySlug: 'pizza',
    url: `${BASE_URL}/menu/pizza/usoriginal`,
    apiPath: `/api/menu/${STORE_CODE}/list/usoriginal/DELIVERY`,
  },
  {
    slug: 'flatzz',
    name: '플래츠',
    categorySlug: 'pizza',
    url: `${BASE_URL}/menu/flatzz/flatzz`,
    apiPath: `/api/menu/${STORE_CODE}/list/npanflatzz`,
  },
  {
    slug: 'pastaandside',
    name: '파스타&사이드',
    categorySlug: 'pizza',
    url: `${BASE_URL}/menu/pastaandside`,
    apiPath: `/api/menu/${STORE_CODE}/list/pastaAndSide`,
  },
];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  accept: 'application/json, text/plain, */*',
  referer: `${BASE_URL}/menu/pizza/cheesefesta`,
};

function readDotEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, '')]),
  );
}

async function loadEnv() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    try {
      Object.assign(env, readDotEnv(await fs.readFile(path.join(ROOT, file), 'utf8')));
    } catch {
      // Optional env files.
    }
  }
  return { ...env, ...process.env };
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return cleanText(value)
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function fetchJson(pathOrUrl, options = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE_URL}${pathOrUrl}`;
  const response = await fetch(url, { headers: HEADERS, ...options });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.json();
}

function representativeItem(menu) {
  if (menu.items?.length) {
    return menu.items.find((item) => item.sizeKind === '01') ?? menu.items[0];
  }
  return menu;
}

function sourceProductUrl(menu, page) {
  if (menu.mclass === 'PZ' && menu.sclass === 'FZ') {
    return `${BASE_URL}/menu/flatzz/flatzz/${menu.digitalKey}`;
  }
  if (menu.mclass === 'PZ' && menu.sclass === 'US') {
    return `${BASE_URL}/menu/pizza/usoriginal/${menu.digitalKey}`;
  }
  if (menu.mclass === 'PZ' && menu.sclass === 'PM') {
    return `${BASE_URL}/menu/pizza/premium/${menu.digitalKey}`;
  }
  return page.url;
}

function candidateImageUrls(menu, item) {
  const keys = [menu.digitalKey, item.digitalKey, item.menuCd, menu.rpstMenuCd].filter(Boolean);
  const sizes = menu.sclass === 'FZ' ? ['npan', 's', 'l'] : ['s', 'l', 'b'];
  const urls = [];
  for (const key of [...new Set(keys)]) {
    for (const size of sizes) {
      const normalizedSize = size === 'npan' ? 's' : size;
      urls.push(`${IMAGE_ROOT}/${key}_${normalizedSize}.png`);
      urls.push(`${IMAGE_ROOT}/${key}_${normalizedSize}.gif`);
    }
  }
  return [...new Set(urls)];
}

async function firstAvailableImageUrl(menu, item) {
  for (const url of candidateImageUrls(menu, item)) {
    const response = await fetch(url, { method: 'HEAD', headers: HEADERS });
    if (response.ok) {
      return url;
    }
  }
  return null;
}

function splitAllergy(value) {
  if (!value || value === '-') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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
    달걀: 'egg',
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
    굴: 'shellfish',
    홍합: 'shellfish',
    전복: 'shellfish',
    아황산류: 'sulfite',
    이산화황: 'sulfite',
    오징어: 'squid',
    게: 'crab',
    메밀: 'buckwheat',
    복숭아: 'peach',
    호두: 'walnut',
    고등어: 'mackerel',
    잣: 'pine_nut',
  };
  return map[normalized] ?? null;
}

async function downloadPng(url, dest, slug) {
  const rawPath = path.join(TMP_DIR, `${slug}-raw`);
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`image ${response.status} ${url}`);
  }
  await fs.writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
  const py = spawnSync('python3', ['-', rawPath, dest], {
    input:
      "from PIL import Image\nimport sys\nimg = Image.open(sys.argv[1])\nif getattr(img, 'is_animated', False):\n    img.seek(0)\nif img.mode not in ('RGB', 'RGBA'):\n    img = img.convert('RGBA')\nimg.save(sys.argv[2], 'PNG')\n",
    encoding: 'utf8',
  });
  if (py.status !== 0) {
    throw new Error(`png convert failed for ${slug}: ${py.stderr || py.stdout}`);
  }
}

async function fetchNutrition(menuCd) {
  const response = await fetch(`${BASE_URL}/api/menu/nutritions`, {
    method: 'POST',
    headers: { ...HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify([menuCd]),
  });
  if (!response.ok) {
    return null;
  }
  const rows = await response.json();
  return (
    rows?.find((row) => cleanText(row.allergy) && cleanText(row.allergy) !== '-') ??
    rows?.find((row) => row.kcal != null && row.kcal !== '') ??
    rows?.[0] ??
    null
  );
}

function nutritionText(row) {
  if (!row) return null;
  const pairs = [
    ['총중량', row.totalWeight],
    ['열량', row.kcal],
    ['당류', row.sugar],
    ['단백질', row.protein],
    ['포화지방', row.saturatedFat],
    ['나트륨', row.sodium],
  ].filter(([, value]) => value != null && value !== '');
  return pairs.map(([label, value]) => `${label}: ${value}`).join(' / ');
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const byCode = new Map();
  for (const page of PAGES) {
    const menus = await fetchJson(page.apiPath);
    for (const menu of menus) {
      const item = representativeItem(menu);
      const sourceCode = menu.rpstMenuCd ?? menu.digitalKey ?? item.menuCd;
      if (!sourceCode || byCode.has(sourceCode)) {
        continue;
      }
      const menuName = cleanText(menu.rpstName ?? menu.name ?? item.name);
      const imageSlug = slugify(`${BRAND_SLUG}-${sourceCode}`);
      const fileName = `${imageSlug}.png`;
      const localImagePath = `/assets/menus/${BRAND_SLUG}/${fileName}`;
      const menuImageUrl = await firstAvailableImageUrl(menu, item);
      if (menuImageUrl) {
        await downloadPng(menuImageUrl, path.join(IMAGE_DIR, fileName), imageSlug);
      }
      const nutrition = await fetchNutrition(item.menuCd);
      byCode.set(sourceCode, {
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        sourceCode,
        sourceMenuCode: item.menuCd,
        sourceCategory: page.slug,
        sourceCategoryName: page.name,
        sourceCategoryUrl: page.url,
        sourceProductUrl: sourceProductUrl(menu, page),
        menuName,
        englishName: imageSlug,
        menuImageUrl,
        categorySlug: page.categorySlug,
        menuType: getMenuType({
          brandCategorySlug: 'pizza',
          menuCategorySlug: page.categorySlug,
          sourceCategory: page.slug,
          menuName,
        }),
        description: cleanText(menu.rpstDesc ?? ''),
        sourceAllergenUrl: `${BASE_URL}/menu/pizza/cheesefesta`,
        localImagePath: menuImageUrl ? localImagePath : null,
        originText: cleanText(nutrition?.origin ?? ''),
        allergy: cleanText(nutrition?.allergy ?? ''),
        allergens: splitAllergy(nutrition?.allergy),
        nutritionText: nutritionText(nutrition),
      });
    }
  }

  const records = [...byCode.values()];
  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  return records;
}

async function requireSingle(client, table, query) {
  const { data, error } = await query.single();
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  return data;
}

async function uploadImage(client, record, bucketIsPublic) {
  if (!record.localImagePath) {
    return null;
  }
  const localPath = path.join(ROOT, 'public', record.localImagePath.replace(/^\//, ''));
  const storagePath = `${BRAND_SLUG}/${path.basename(record.localImagePath)}`;
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

async function importToSupabase(records) {
  const env = await loadEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Set Supabase URL and service role key before running this importer.');
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const brand = await requireSingle(
    client,
    'brands',
    client.from('brands').select('id, slug').eq('slug', BRAND_SLUG),
  );
  const { data: categories, error: categoriesError } = await client.from('categories').select('id, slug');
  if (categoriesError) throw categoriesError;
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
  if (bucketsError) throw bucketsError;
  const bucket = buckets.find((item) => item.id === BUCKET || item.name === BUCKET);
  if (!bucket) throw new Error(`Storage bucket "${BUCKET}" does not exist.`);

  const source = await requireSingle(
    client,
    'data_sources',
    client
      .from('data_sources')
      .upsert(
        {
          brand_id: brand.id,
          title: 'Pizza Hut official menu nutrition data',
          source_type: 'official_page',
          url: `${BASE_URL}/menu/pizza/cheesefesta`,
          checked_at: CHECKED_AT,
          note: 'Collected from Pizza Hut menu APIs and nutrition API.',
        },
        { onConflict: 'brand_id,source_type,url' },
      )
      .select('id'),
  );

  const { data: allergenRows, error: allergenError } = await client.from('allergens').select('id, code');
  if (allergenError) throw allergenError;
  const allergenByCode = new Map(allergenRows.map((allergen) => [allergen.code, allergen.id]));

  const { data: existingMenus, error: existingError } = await client
    .from('menus')
    .select('id, slug, name')
    .eq('brand_id', brand.id);
  if (existingError) throw existingError;
  const existingByName = new Map();
  for (const menu of existingMenus) {
    const key = normalizeName(menu.name);
    const list = existingByName.get(key) ?? [];
    list.push(menu);
    existingByName.set(key, list);
  }

  const touchedIds = [];
  const inserted = [];
  const missingImages = [];
  const unknownAllergens = new Set();
  const menuAllergens = [];
  const menuOrigins = [];

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    if (!imageUrl) {
      missingImages.push(record.menuName);
    }

    let targets = existingByName.get(normalizeName(record.menuName)) ?? [];
    if (targets.length === 0) {
      const row = await requireSingle(
        client,
        'menus',
        client
          .from('menus')
          .upsert(
            {
              brand_id: brand.id,
              category_id: categoryBySlug.get(record.categorySlug),
              slug: `${BRAND_SLUG}-${record.sourceCode.toLowerCase()}`,
              name: record.menuName,
              description: record.description,
              image_url: imageUrl,
              menu_type: record.menuType,
              menu_status: 'active',
              source_url: record.sourceProductUrl,
              last_checked_at: CHECKED_AT,
              is_active: true,
            },
            { onConflict: 'slug' },
          )
          .select('id, slug, name'),
      );
      targets = [row];
      inserted.push(row.slug);
    }

    for (const target of targets) {
      const update = {
        description: record.description,
        menu_type: record.menuType,
        source_url: record.sourceProductUrl,
        last_checked_at: CHECKED_AT,
        is_active: true,
      };
      if (imageUrl) {
        update.image_url = imageUrl;
      }
      const { error } = await client.from('menus').update(update).eq('id', target.id);
      if (error) throw error;
      touchedIds.push(target.id);

      if (record.originText && record.originText !== '-') {
        menuOrigins.push({
          menu_id: target.id,
          ingredient_name: null,
          origin_country: null,
          origin_text: record.originText,
          source_id: source.id,
          checked_at: CHECKED_AT,
          note: null,
        });
      }

      for (const allergen of new Set(record.allergens)) {
        const code = mapAllergenNameToCode(allergen);
        if (!code) {
          unknownAllergens.add(allergen);
          continue;
        }
        const allergenId = allergenByCode.get(code);
        if (!allergenId) {
          unknownAllergens.add(allergen);
          continue;
        }
        menuAllergens.push({
          menu_id: target.id,
          allergen_id: allergenId,
          presence_type: 'contains',
          note: record.allergy,
          source_id: source.id,
        });
      }
    }
  }

  const uniqueTouchedIds = [...new Set(touchedIds)];
  if (uniqueTouchedIds.length > 0) {
    const { error: deactivateError } = await client
      .from('menus')
      .update({ is_active: false, menu_status: 'discontinued', last_checked_at: CHECKED_AT })
      .eq('brand_id', brand.id)
      .not('id', 'in', `(${uniqueTouchedIds.join(',')})`);
    if (deactivateError) throw deactivateError;

    await client.from('menu_allergens').delete().in('menu_id', uniqueTouchedIds);
    await client.from('menu_origins').delete().in('menu_id', uniqueTouchedIds);
  }

  const uniqueMenuAllergens = [
    ...new Map(
      menuAllergens.map((row) => [`${row.menu_id}:${row.allergen_id}:${row.presence_type}`, row]),
    ).values(),
  ];
  if (uniqueMenuAllergens.length > 0) {
    const { error } = await client.from('menu_allergens').insert(uniqueMenuAllergens);
    if (error) throw error;
  }
  if (menuOrigins.length > 0) {
    const { error } = await client.from('menu_origins').insert(menuOrigins);
    if (error) throw error;
  }

  const { error: brandError } = await client
    .from('brands')
    .update({
      allergen_source_url: `${BASE_URL}/menu/pizza/cheesefesta`,
      origin_source_url: `${BASE_URL}/menu/pizza/cheesefesta`,
      official_url: BASE_URL,
      data_status: 'official_verified',
      last_checked_at: CHECKED_AT,
    })
    .eq('id', brand.id);
  if (brandError) throw brandError;

  return {
    records: records.length,
    uploadedImages: records.filter((record) => record.localImagePath).length,
    missingImages,
    touchedMenus: uniqueTouchedIds.length,
    deactivatedStaleMenus: Math.max(0, existingMenus.length + inserted.length - uniqueTouchedIds.length),
    insertedMenus: inserted.length,
    allergenRows: uniqueMenuAllergens.length,
    originRows: menuOrigins.length,
    unknownAllergens: [...unknownAllergens],
  };
}

const records = await collect();
const result = await importToSupabase(records);
console.log(JSON.stringify(result, null, 2));
