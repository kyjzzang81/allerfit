import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'jadam';
const BRAND_NAME = '자담치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-02';
const BASE_URL = 'https://www.ejadam.co.kr';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_jadam.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  {
    url: `${BASE_URL}/bbs/board.php?bo_table=menuChicken&sca=%EC%B9%98%ED%82%A8%EB%A9%94%EB%89%B4`,
    sourceCategory: '치킨메뉴',
    categorySlug: 'chicken',
    menuType: 1,
  },
  {
    url: `${BASE_URL}/bbs/board.php?bo_table=menuPizza`,
    sourceCategory: '피자/파스타',
    categorySlug: 'pizza',
    menuType: 2,
  },
  {
    url: `${BASE_URL}/bbs/board.php?bo_table=menuEtc`,
    sourceCategory: '사이드메뉴',
    categorySlug: 'chicken',
    menuType: 3,
  },
];

const ALLERGY_FALLBACK_BY_NAME = {
  찹쌀볼: '계란, 밀, 우유, 대두',
};

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
    } catch {}
  }
  return { ...env, ...process.env };
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/\s+/g, '');
}

function normalizeAllergen(value) {
  return String(value)
    .trim()
    .replace(/.*:\s*/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/함유/g, '')
    .replace(/\s+/g, '');
}

function splitAllergy(value) {
  if (!value || cleanText(value) === '-') return [];
  return String(value)
    .replace(/알레르기\s*유발물질\s*:/g, '')
    .replace(/[^,\n]*?:\s*/g, '')
    .replace(/조개류\s*\(([^)]*)\)/g, '조개류')
    .split(',')
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function mapAllergenNameToCode(value) {
  const map = {
    알류: 'egg',
    난류: 'egg',
    계란: 'egg',
    달걀: 'egg',
    우유: 'milk',
    메밀: 'buckwheat',
    땅콩: 'peanut',
    대두: 'soybean',
    밀: 'wheat',
    고등어: 'mackerel',
    게: 'crab',
    새우: 'shrimp',
    돼지고기: 'pork',
    복숭아: 'peach',
    토마토: 'tomato',
    아황산류: 'sulfite',
    이황산류: 'sulfite',
    이산화황: 'sulfite',
    호두: 'walnut',
    잣: 'walnut',
    닭고기: 'chicken',
    쇠고기: 'beef',
    소고기: 'beef',
    오징어: 'squid',
    조개류: 'shellfish',
  };
  return map[normalizeAllergen(value)] ?? null;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function absoluteUrl(value) {
  return new URL(decodeHtml(value), BASE_URL).toString();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function extractAllergy(infoHtml) {
  const spans = [...infoHtml.matchAll(/<span>([\s\S]*?)<\/span>/g)].map((match) => cleanText(match[1]));
  const index = spans.findIndex((text) => text.includes('[알레르기 유발 식품 표시]'));
  if (index >= 0 && spans[index + 1]) return spans[index + 1].replace(/^알레르기\s*유발물질\s*:\s*/, '').trim();
  const fallback = spans.find((text) => text.includes('알레르기 유발물질'));
  return fallback ? fallback.replace(/^알레르기\s*유발물질\s*:\s*/, '').trim() : null;
}

function extractDescription(infoHtml) {
  const spans = [...infoHtml.matchAll(/<span>([\s\S]*?)<\/span>/g)].map((match) => cleanText(match[1]));
  const index = spans.findIndex((text) => text.includes('[알레르기 유발 식품 표시]'));
  const candidates = index >= 0 ? spans.slice(0, index) : spans;
  return candidates.filter((text) => text && !text.includes('알레르기 유발물질')).join(' ');
}

function parseCards(html, page) {
  const gridHtml = html.match(/<ul id="grid"[\s\S]*?<\/ul>/)?.[0] ?? '';
  const cardMatches = [
    ...gridHtml.matchAll(
      /<li>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?href="#info(\d+)"[\s\S]*?<img src="([^"]+)"/g,
    ),
  ];
  const infoById = new Map(
    [...html.matchAll(/<li id="info(\d+)">([\s\S]*?)(?=<li id="info\d+">|<\/ul>\s*<\/div>)/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );

  return cardMatches.map((match) => {
    const [, rawName, infoId, thumbUrl] = match;
    const infoHtml = infoById.get(infoId) ?? '';
    const detailImage = infoHtml.match(/<div class="info-modal">[\s\S]*?<img src="([^"]+)"/)?.[1] ?? thumbUrl;
    const sourceCode =
      `${page.sourceCategory}-${infoId}-${path.basename(decodeHtml(detailImage)).replace(/^thumb-/, '').replace(/\.[^.]+$/, '')}`;
    const menuName = cleanText(rawName);
    const allergy = extractAllergy(infoHtml) ?? ALLERGY_FALLBACK_BY_NAME[menuName] ?? null;
    const englishName = `${BRAND_SLUG}-${slugify(sourceCode)}`;
    return {
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode,
      sourceCategory: page.sourceCategory,
      sourceCategoryUrl: page.url,
      sourceProductUrl: `${page.url}#info${infoId}`,
      menuName,
      englishName,
      menuImageUrl: absoluteUrl(detailImage),
      localImagePath: `/assets/menus/${BRAND_SLUG}/${englishName}.png`,
      categorySlug: page.categorySlug,
      menuType: page.menuType,
      description: extractDescription(infoHtml),
      allergy,
      allergens: splitAllergy(allergy),
    };
  });
}

async function downloadPng(url, dest, slug) {
  const rawPath = path.join(TMP_DIR, `${slug}-raw`);
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`image ${response.status} ${url}`);
  await fs.writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
  const py = spawnSync('python3', ['-', rawPath, dest], {
    input:
      "from PIL import Image\nimport sys\nimg = Image.open(sys.argv[1])\nif getattr(img, 'is_animated', False): img.seek(0)\nif img.mode not in ('RGB', 'RGBA'): img = img.convert('RGBA')\nimg.save(sys.argv[2], 'PNG')\n",
    encoding: 'utf8',
  });
  if (py.status !== 0) throw new Error(`png convert failed for ${slug}: ${py.stderr || py.stdout}`);
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const byCode = new Map();
  for (const page of PAGES) {
    const records = parseCards(await fetchText(page.url), page);
    for (const record of records) byCode.set(record.sourceCode, record);
  }
  const records = [...byCode.values()];
  if (records.length === 0) throw new Error('No Jadam menu cards were parsed.');

  for (const record of records) {
    await downloadPng(record.menuImageUrl, path.join(ROOT, 'public', record.localImagePath.replace(/^\//, '')), record.englishName);
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  return records;
}

async function requireSingle(table, query) {
  const { data, error } = await query.single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function uploadImage(client, record, bucketIsPublic) {
  const localPath = path.join(ROOT, 'public', record.localImagePath.replace(/^\//, ''));
  const storagePath = `${BRAND_SLUG}/${path.basename(record.localImagePath)}`;
  const { error } = await client.storage.from(BUCKET).upload(storagePath, await fs.readFile(localPath), {
    cacheControl: '31536000',
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw new Error(`storage upload ${storagePath}: ${error.message}`);
  if (bucketIsPublic) return client.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  const { data, error: signedError } = await client.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
  if (signedError) throw new Error(`storage signed url ${storagePath}: ${signedError.message}`);
  return data.signedUrl;
}

async function importToSupabase(records) {
  const env = await loadEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Set Supabase URL and service role key before running this script.');
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: categories, error: categoriesError } = await client.from('categories').select('id, slug');
  if (categoriesError) throw categoriesError;
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const chickenCategoryId = categoryBySlug.get('chicken');

  const brand = await requireSingle(
    'brands',
    client
      .from('brands')
      .upsert(
        {
          slug: BRAND_SLUG,
          name: BRAND_NAME,
          category_id: chickenCategoryId,
          official_url: BASE_URL,
          allergen_source_url: `${BASE_URL}/bbs/content.php?co_id=nutrition`,
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
    'data_sources',
    client
      .from('data_sources')
      .upsert(
        {
          brand_id: brand.id,
          title: 'Jadam official menu allergy data',
          source_type: 'official_page',
          url: `${BASE_URL}/bbs/board.php?bo_table=menuChicken`,
          checked_at: CHECKED_AT,
          note: 'Menu, images, and allergen values collected from official menu list modal HTML. User-provided nutrition image was used as a visual reference.',
        },
        { onConflict: 'brand_id,source_type,url' },
      )
      .select('id'),
  );

  const { data: allergenRows, error: allergenError } = await client.from('allergens').select('id, code');
  if (allergenError) throw allergenError;
  const allergenByCode = new Map(allergenRows.map((allergen) => [allergen.code, allergen.id]));

  const { data: existingMenus, error: existingError } = await client.from('menus').select('id, name').eq('brand_id', brand.id);
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
  const missingAllergy = [];
  const menuAllergens = [];
  const unknownAllergens = new Set();

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    if (!imageUrl) missingImages.push(record.menuName);
    if (!record.allergy) missingAllergy.push(record.menuName);

    let targets = existingByName.get(normalizeName(record.menuName)) ?? [];
    if (targets.length === 0) {
      const row = await requireSingle(
        'menus',
        client
          .from('menus')
          .upsert(
            {
              brand_id: brand.id,
              category_id: categoryBySlug.get(record.categorySlug) ?? chickenCategoryId,
              slug: `${BRAND_SLUG}-${slugify(record.sourceCode)}`,
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
          .select('id, name'),
      );
      targets = [row];
      inserted.push(row.name);
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

      for (const allergen of new Set(record.allergens)) {
        const code = mapAllergenNameToCode(allergen);
        if (!code || !allergenByCode.has(code)) {
          unknownAllergens.add(allergen);
          continue;
        }
        menuAllergens.push({
          menu_id: target.id,
          allergen_id: allergenByCode.get(code),
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
    ...new Map(menuAllergens.map((row) => [`${row.menu_id}:${row.allergen_id}:${row.presence_type}`, row])).values(),
  ];
  if (uniqueMenuAllergens.length > 0) {
    const { error } = await client.from('menu_allergens').insert(uniqueMenuAllergens);
    if (error) throw error;
  }

  return {
    records: records.length,
    touchedMenus: uniqueTouchedIds.length,
    insertedMenus: inserted.length,
    missingImages,
    missingAllergy,
    allergenRows: uniqueMenuAllergens.length,
    unknownAllergens: [...unknownAllergens],
  };
}

async function main() {
  const records = await collect();
  const missing = records.filter((record) => !record.allergy).map((record) => record.menuName);
  if (missing.length > 0) console.warn(`Missing allergy mapping: ${missing.join(', ')}`);
  console.log(JSON.stringify(await importToSupabase(records), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
