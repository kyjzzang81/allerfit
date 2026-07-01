import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'norangtongdak';
const BRAND_NAME = '노랑통닭';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-01';
const BASE_URL = 'https://www.norangtongdak.co.kr';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_norangtongdak.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');
const ALLERGY_TABLE_FILE = path.join(
  '/Users/yongjin/.codex/attachments/589a8ef7-f936-4b73-b5cd-d46f462121b7',
  'pasted-text.txt',
);

const PAGES = [
  {
    url: `${BASE_URL}/menu/chicken_list.html`,
    viewPath: 'chicken_view.html',
    sourceCategory: '치킨',
    categorySlug: 'chicken',
    menuType: 1,
  },
  {
    url: `${BASE_URL}/menu/side.html`,
    viewPath: 'side_view.html',
    sourceCategory: '사이드',
    categorySlug: 'chicken',
    menuType: 3,
  },
];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGY_NAME_ALIASES = {
  '노랑3종치킨': '3종치킨',
  '엄청큰반반치킨': '3종치킨',
  '우도땅콩반반치킨': '우도땅콩치킨',
  '웰빙파닭후라이드': '웰빙파닭후라이드치킨',
  '웰빙파닭반반': '웰빙파닭후라이드치킨',
  '뿌리노랑치킨': '뿌리노랑치킨',
  '칼칼한청양치킨': '칼칼한청양치킨',
  '고추장the한싸이바비큐': '고추장the한싸이바비큐',
  '갈릭인더딥': '갈릭인더딥',
  '맵싸한후라이드치킨': '맵싸한후라이드치킨',
  '맵싸한양념치킨': '맵싸한양념치킨',
  '맵싸한깐풍치킨': '맵싸한깐풍치킨',
  '맵싸한3종치킨': '맵싸한3종치킨',
  '맵싸한반반치킨': '맵싸한양념치킨',
  '바삭누룽지치킨': '바삭누룽지치킨',
  '엄청큰후라이드치킨': '엄청큰후라이드치킨',
  '엄청큰양념치킨': '엄청큰양념치킨',
  '엄청큰깐풍치킨': '엄청큰깐풍치킨',
  '알싸한마늘치킨': '알싸한마늘치킨',
  '떡볶이모둠튀김세트': '떡볶이모둠튀김세트',
  '통살새우튀김': '통새우튀김',
  '노랑파송송떡볶이': '노랑파송송떡볶이',
  '맵싸한특수부위3종': '노랑특수부위콤보',
  '갈릭라이스': '갈릭라이스',
  '매콤직화무뼈닭발': '매콤직화무뼈닭발',
  '노랑칩스': '노랑칩스감자',
  '오리지널치즈볼': '노랑치즈볼',
  '모둠감자튀김': '노랑봉투감자',
  '눈꽃치즈떡볶이': '눈꽃치즈떡볶이',
  '노랑복숭아': '노랑복숭아',
  '부산어묵탕': '부산어묵탕',
  '골뱅이무침': '골뱅이무침',
  '김말이': '김말이',
  '똥집감자튀김': '똥집감자튀김',
  '깐풍똥집감자튀김': '깐풍똥집',
  '먹태': '먹태',
  '얼큰짬뽕이닭': '얼큰짬뽕이닭',
  '바사삭닭껍질튀김': '바사삭닭껍질튀김',
  '맵싸삭닭껍질튀김': '맵싸삭닭껍질튀김',
  '땅콩크림꽈배기': '땅콩크림꽈배기',
  '통통오징어스틱': '통통오징어스틱',
  '모둠튀김': '모둠튀김',
  '3종치즈볼': '3종치즈볼',
  '갈릭인더딥소스': '대파올리브마요소스',
  '대파올리브마요소스': '대파올리브마요소스',
  '토마토칠리소스': '노랑토마토칠리소스',
  '맵싸한디핑소스': '맵싸한디핑소스',
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

function cleanText(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[()（）]/g, '')
    .replace(/\s+/g, '');
}

function allergyKey(value) {
  const key = normalizeName(value);
  return ALLERGY_NAME_ALIASES[key] ?? key;
}

function splitAllergy(value) {
  if (!value || cleanText(value) === '-') return [];
  return String(value)
    .replace(/조개류\s*\(([^)]*)\)/g, '조개류')
    .replace(/알류\s*\(([^)]*)\)/g, '알류')
    .split(',')
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function normalizeAllergen(value) {
  return String(value).trim().replace(/\(.*?\)/g, '').replace(/\s+/g, '');
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
  return new URL(value.replace(/&amp;/g, '&'), BASE_URL).toString();
}

async function fetchText(url) {
  const result = spawnSync('curl', ['-k', '-sL', '-A', HEADERS['user-agent'], url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`curl failed ${url}: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function parseAllergyTable(html) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const map = new Map();
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => cleanText(match[1]));
    if (cells.length < 2 || cells.includes('제품명')) continue;
    const [name, allergy] = cells.length >= 3 ? [cells[cells.length - 2], cells[cells.length - 1]] : cells;
    if (!name) continue;
    map.set(normalizeName(name), allergy || null);
  }
  return map;
}

function parseCards(html, page) {
  const listMatch = html.match(/<ul class="clfix ac mt50 c_list">([\s\S]*?)<!--/);
  const listHtml = listMatch?.[1] ?? html;
  return [
    ...listHtml.matchAll(
      /<li>\s*<a href="([^"]*?p_no=(\d+)[^"]*)">[\s\S]*?background:url\(([^)]+)\)[\s\S]*?<p>([\s\S]*?)<\/p>\s*<div class="ellipsis">([\s\S]*?)<\/div>/g,
    ),
  ].map((match) => {
    const [, href, id, imagePath, name, description] = match;
    const menuName = cleanText(name);
    const englishName = `${BRAND_SLUG}-${slugify(id)}`;
    return {
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode: id,
      sourceCategory: page.sourceCategory,
      sourceCategoryUrl: page.url,
      sourceProductUrl: absoluteUrl(`/menu/${href}`),
      menuName,
      englishName,
      menuImageUrl: absoluteUrl(imagePath),
      localImagePath: `/assets/menus/${BRAND_SLUG}/${englishName}.png`,
      categorySlug: page.categorySlug,
      menuType: page.menuType,
      description: cleanText(description),
    };
  });
}

async function downloadPng(url, dest, slug) {
  const rawPath = path.join(TMP_DIR, `${slug}-raw`);
  const curl = spawnSync('curl', ['-k', '-sL', '-A', HEADERS['user-agent'], '-o', rawPath, url], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (curl.status !== 0) throw new Error(`image curl failed ${url}: ${curl.stderr || curl.stdout}`);
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

  const allergyMap = parseAllergyTable(await fs.readFile(ALLERGY_TABLE_FILE, 'utf8'));
  const byId = new Map();
  for (const page of PAGES) {
    const records = parseCards(await fetchText(page.url), page);
    for (const record of records) byId.set(record.sourceCode, record);
  }
  const records = [...byId.values()].map((record) => {
    const allergy = allergyMap.get(allergyKey(record.menuName)) ?? null;
    return {
      ...record,
      allergy,
      allergens: splitAllergy(allergy),
    };
  });
  if (records.length === 0) throw new Error('No Norang Tongdak menu cards were parsed.');

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
          allergen_source_url: `${BASE_URL}/menu/chicken_list.html`,
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
          title: 'Norang Tongdak official menu allergy data',
          source_type: 'official_page',
          url: `${BASE_URL}/menu/chicken_list.html`,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from official chicken/side pages. Allergy values parsed from the provided official allergen table HTML.',
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
    if (record.allergy === null) missingAllergy.push(record.menuName);

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
  const missing = records.filter((record) => record.allergy === null).map((record) => `${record.menuName} (${allergyKey(record.menuName)})`);
  if (missing.length > 0) console.warn(`Missing allergy mapping: ${missing.join(', ')}`);
  console.log(JSON.stringify(await importToSupabase(records), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
