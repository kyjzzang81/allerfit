import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getMenuType } from './menu-type.mjs';

const ROOT = process.cwd();
const BRAND_SLUG = 'seooreung-pizza';
const BRAND_NAME = '서오릉피자';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const BASE_URL = 'https://seooreungpizza.com';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_seooreung.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  {
    slug: 'pizza',
    name: '한판피자',
    categorySlug: 'pizza',
    url: `${BASE_URL}/sub/menu/list.html?cate=1`,
  },
  {
    slug: 'side',
    name: '사이드 메뉴',
    categorySlug: 'pizza',
    url: `${BASE_URL}/sub/menu/list.html?cate=4`,
  },
];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
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
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
}

function absoluteUrl(value) {
  return new URL(value, BASE_URL).href;
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

async function fetchHtml(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.text();
}

function parseListPage(html, page) {
  const records = [];
  const itemPattern = /<li class="[^"]*">\s*<a onclick="goView\('([0-9]+)'\)[\s\S]*?<\/a>\s*<\/li>/g;

  for (const match of html.matchAll(itemPattern)) {
    const block = match[0];
    const id = match[1];
    const menuName = cleanText(block.match(/<strong>([\s\S]*?)<\/strong>/)?.[1]);
    const imagePath = block.match(/<img src=['"]([^'"]+)['"]/i)?.[1];
    if (!id || !menuName || !imagePath) {
      continue;
    }
    const imageSlug = slugify(`${BRAND_SLUG}-${id}`);
    records.push({
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode: id,
      sourceCategory: page.slug,
      sourceCategoryName: page.name,
      sourceCategoryUrl: page.url,
      sourceProductUrl: `${BASE_URL}/sub/menu/view.html?dataSeq=${id}`,
      menuName,
      englishName: imageSlug,
      menuImageUrl: absoluteUrl(imagePath),
      categorySlug: page.categorySlug,
      menuType: getMenuType({
        brandCategorySlug: 'pizza',
        menuCategorySlug: page.categorySlug,
        sourceCategory: page.slug,
        menuName,
      }),
      localImagePath: `/assets/menus/${BRAND_SLUG}/${imageSlug}.png`,
    });
  }

  return records;
}

function parseNutritionText(html) {
  const table = html.match(/<strong>\s*제품 영양 성분표\s*<\/strong>[\s\S]*?<table>([\s\S]*?)<\/table>/)?.[1];
  if (!table) return null;
  const rows = [];
  for (const tr of table.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((cell) => cleanText(cell[1]));
    if (cells.length > 0) rows.push(cells.join(': '));
  }
  return rows.join(' / ');
}

async function fetchDetail(record) {
  const html = await fetchHtml(record.sourceProductUrl);
  const allergy = cleanText(
    html.match(/<strong>\s*알레르기 표시 요약\s*<\/strong>[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1],
  );
  const topping = cleanText(html.match(/<strong>\s*주요 토핑\s*<\/strong>[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1]);
  const detailImage = html.match(/<div class="pizza">[\s\S]*?<img src=["']([^"']+)["']/)?.[1];
  return {
    ...record,
    description: topping ? `주요 토핑: ${topping}` : '',
    menuImageUrl: detailImage ? absoluteUrl(detailImage) : record.menuImageUrl,
    allergy,
    allergens: splitAllergy(allergy),
    nutritionText: parseNutritionText(html),
  };
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

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const records = [];
  for (const page of PAGES) {
    const html = await fetchHtml(page.url);
    for (const record of parseListPage(html, page)) {
      const detailed = await fetchDetail(record);
      await downloadPng(
        detailed.menuImageUrl,
        path.join(IMAGE_DIR, path.basename(detailed.localImagePath)),
        detailed.englishName,
      );
      records.push(detailed);
    }
  }

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
  const pizzaCategoryId = categoryBySlug.get('pizza');

  const brand = await requireSingle(
    client,
    'brands',
    client
      .from('brands')
      .upsert(
        {
          slug: BRAND_SLUG,
          name: BRAND_NAME,
          category_id: pizzaCategoryId,
          official_url: BASE_URL,
          allergen_source_url: `${BASE_URL}/sub/menu/list.html?cate=1`,
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
          title: 'Seooreung Pizza official menu allergy data',
          source_type: 'official_page',
          url: `${BASE_URL}/sub/menu/list.html?cate=1`,
          checked_at: CHECKED_AT,
          note: 'Collected from Seooreung Pizza menu list and detail pages.',
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
  const menuAllergens = [];
  const unknownAllergens = new Set();

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
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
              slug: `${BRAND_SLUG}-${record.sourceCode}`,
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
      const { error } = await client
        .from('menus')
        .update({
          description: record.description,
          image_url: imageUrl,
          menu_type: record.menuType,
          source_url: record.sourceProductUrl,
          last_checked_at: CHECKED_AT,
          menu_status: 'active',
          is_active: true,
        })
        .eq('id', target.id);
      if (error) throw error;
      touchedIds.push(target.id);

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

  const { error: brandError } = await client
    .from('brands')
    .update({
      official_url: BASE_URL,
      allergen_source_url: `${BASE_URL}/sub/menu/list.html?cate=1`,
      origin_source_url: null,
      data_status: 'official_verified',
      last_checked_at: CHECKED_AT,
    })
    .eq('id', brand.id);
  if (brandError) throw brandError;

  return {
    records: records.length,
    uploadedImages: records.length,
    touchedMenus: uniqueTouchedIds.length,
    deactivatedStaleMenus: Math.max(0, existingMenus.length + inserted.length - uniqueTouchedIds.length),
    insertedMenus: inserted.length,
    allergenRows: uniqueMenuAllergens.length,
    unknownAllergens: [...unknownAllergens],
  };
}

const records = await collect();
const result = await importToSupabase(records);
console.log(JSON.stringify(result, null, 2));
