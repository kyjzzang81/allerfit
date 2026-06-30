import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'bhc';
const BRAND_NAME = 'BHC';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const BASE_URL = 'https://www.bhc.co.kr';
const API_BASE = `${BASE_URL}/api/v1/web`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_bhc.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  { categoryId: 1, cate: '후라이드', menuType: 1 },
  { categoryId: 1, cate: '양념', menuType: 1 },
  { categoryId: 1, cate: '뿌링클', menuType: 1 },
  { categoryId: 1, cate: '킹', menuType: 1 },
  { categoryId: 1, cate: '핫', menuType: 1 },
  { categoryId: 47, cate: '콜팝', menuType: 2 },
  { categoryId: 47, cate: '제주동화마을한정', menuType: 2 },
  { categoryId: 50, cate: '사이드', menuType: 3 },
  { categoryId: 50, cate: '기타', menuType: 3 },
];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  'content-type': 'application/json',
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
    .replace(/\r?\n/g, ' ')
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

async function fetchJson(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.json();
}

function splitAllergy(value) {
  if (!value || value === '-' || value.includes('해당사항 없음')) {
    return [];
  }
  return String(value)
    .replace(/조개류\s*\(([^)]*)\)/g, '조개류')
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
    나류: 'egg',
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
    닭: 'chicken',
    쇠고기: 'beef',
    소고기: 'beef',
    조개류: 'shellfish',
    굴: 'shellfish',
    홍합: 'shellfish',
    전복: 'shellfish',
    아황산류: 'sulfite',
    이산화황: 'sulfite',
    이황산류: 'sulfite',
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

function nutritionText(nutrition) {
  if (!nutrition) return null;
  const pairs = [
    ['열량', nutrition.calories],
    ['당류', nutrition.sugars],
    ['단백질', nutrition.proteins],
    ['포화지방', nutrition.saturatedFat],
    ['나트륨', nutrition.sodium],
  ].filter(([, value]) => value != null && value !== '');
  return pairs.map(([label, value]) => `${label}: ${value}`).join(' / ');
}

function originText(detail) {
  const values = [
    detail.origin,
    ...(detail.optionList ?? []).map((option) => option.origin),
  ]
    .map(cleanText)
    .filter(Boolean);
  return [...new Set(values)].join(' / ');
}

function allergyText(allergenInfo) {
  return (allergenInfo ?? [])
    .filter((row) => cleanText(row.allergen))
    .map((row) => {
      const item = cleanText(row.item);
      const allergen = cleanText(row.allergen);
      return item ? `${item}: ${allergen}` : allergen;
    })
    .join(' / ');
}

function allergenNames(allergenInfo) {
  return [
    ...new Set(
      (allergenInfo ?? [])
        .flatMap((row) => splitAllergy(row.allergen))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function pickImage(listItem, detail) {
  return (
    detail.mainImg ||
    listItem.mainImg ||
    detail.optionList?.find((option) => option.optionImg)?.optionImg ||
    null
  );
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

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const byCode = new Map();
  for (const page of PAGES) {
    const list = await fetchJson(`${API_BASE}/categories/${page.categoryId}/products`);
    const products = (list.body ?? []).filter((product) => product.cateNm?.includes(page.cate));

    for (const product of products) {
      const existing = byCode.get(product.productCd);
      if (existing && existing.menuType <= page.menuType) {
        existing.sourceCategories.push(page.cate);
        continue;
      }

      const detail = (await fetchJson(`${API_BASE}/products/${product.productCd}`)).body;
      const menuName = cleanText(detail.productNm || product.productNm);
      const englishName = `${BRAND_SLUG}-${slugify(product.productCd)}`;
      const menuImageUrl = pickImage(product, detail);
      const localImagePath = menuImageUrl ? `/assets/menus/${BRAND_SLUG}/${englishName}.png` : null;

      if (menuImageUrl) {
        await downloadPng(menuImageUrl, path.join(IMAGE_DIR, `${englishName}.png`), englishName);
      }

      byCode.set(product.productCd, {
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        sourceCode: product.productCd,
        sourceCategoryId: page.categoryId,
        sourceCategory: page.cate,
        sourceCategories: [page.cate],
        sourceCategoryUrl: `${BASE_URL}/menu/${page.categoryId}?cate=${encodeURIComponent(page.cate)}`,
        sourceProductUrl: `${BASE_URL}/menu/${page.categoryId}?cate=${encodeURIComponent(page.cate)}`,
        menuName,
        englishName,
        menuImageUrl,
        localImagePath,
        categorySlug: 'chicken',
        menuType: page.menuType,
        description: cleanText(detail.mobileDetailDescription || detail.description || product.description),
        allergy: allergyText(detail.allergenInfo),
        allergens: allergenNames(detail.allergenInfo),
        originText: originText(detail),
        nutritionText: nutritionText(detail.mainNutrition),
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

  const { data: categories, error: categoriesError } = await client.from('categories').select('id, slug');
  if (categoriesError) throw categoriesError;
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const chickenCategoryId = categoryBySlug.get('chicken');

  const brand = await requireSingle(
    client,
    'brands',
    client
      .from('brands')
      .upsert(
        {
          slug: BRAND_SLUG,
          name: BRAND_NAME,
          category_id: chickenCategoryId,
          official_url: BASE_URL,
          allergen_source_url: `${BASE_URL}/menu/1`,
          data_status: 'official_verified',
          last_checked_at: CHECKED_AT,
          is_active: true,
        },
        { onConflict: 'slug' },
      )
      .select('id, slug, name'),
  );

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
          title: 'BHC official menu allergy data',
          source_type: 'official_page',
          url: `${BASE_URL}/menu/1`,
          checked_at: CHECKED_AT,
          note: 'Collected from BHC official menu APIs.',
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
  const menuAllergens = [];
  const menuOrigins = [];
  const unknownAllergens = new Set();

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
        menu_status: 'active',
        is_active: true,
      };
      if (imageUrl) update.image_url = imageUrl;

      const { error } = await client.from('menus').update(update).eq('id', target.id);
      if (error) throw error;
      touchedIds.push(target.id);

      if (record.originText) {
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

    const { error: deleteAllergenError } = await client.from('menu_allergens').delete().in('menu_id', uniqueTouchedIds);
    if (deleteAllergenError) throw deleteAllergenError;
    const { error: deleteOriginError } = await client.from('menu_origins').delete().in('menu_id', uniqueTouchedIds);
    if (deleteOriginError) throw deleteOriginError;
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
      official_url: BASE_URL,
      allergen_source_url: `${BASE_URL}/menu/1`,
      origin_source_url: `${BASE_URL}/menu/1`,
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
