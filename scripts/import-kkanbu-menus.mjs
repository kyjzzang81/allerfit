import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'kkanbu';
const BRAND_NAME = '깐부치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-01';
const BASE_URL = 'http://kkanbu.co.kr';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_kkanbu.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  { mid: 8, detailMid: 19, category: 'MAIN', menuType: 1, categorySlug: 'chicken' },
  { mid: 9, detailMid: 20, category: 'SIDE', menuType: 3, categorySlug: 'chicken' },
];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGY_BY_NAME = {
  // Fill from Kkanbu official allergen table when provided.
};

const AI_KKANBU_COMPONENTS = ['바삭한식스팩', '크리스피순살치킨', '치즈스틱'];

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
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function allergyKey(value) {
  return cleanText(value).replace(/\s+/g, '').replace(/[()（）]/g, '');
}

function normalizeName(value) {
  return allergyKey(value).toLowerCase();
}

function splitAllergy(value) {
  if (!value || value === '-') return [];
  return String(value)
    .replace(/조개류\s*\(([^)]*)\)/g, '조개류')
    .split(',')
    .map((item) => item.trim())
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
    오징어: 'squid',
    게: 'crab',
    메밀: 'buckwheat',
    호두: 'walnut',
    잣: 'walnut',
    복숭아: 'peach',
    아황산류: 'sulfite',
    이황산류: 'sulfite',
    이산화황: 'sulfite',
  };
  return map[normalizeAllergen(value)] ?? null;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function absoluteUrl(value) {
  return new URL(value, `${BASE_URL}/home/`).toString();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
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

function parseCards(html, page) {
  return [...html.matchAll(/<li>\s*<a href="sub01\.php\?mid=(\d+)&uid=(\d+)">([\s\S]*?)<\/a>\s*<\/li>/g)].map((match) => {
    const [, detailMid, uid, block] = match;
    const menuName = cleanText(block.match(/<p class="t1">([\s\S]*?)<\/p>/)?.[1]);
    const description = cleanText(block.match(/<p class="t2">([\s\S]*?)<\/p>/)?.[1]);
    const imagePath = block.match(/<div class="img"><img src="([^"]+)"/)?.[1] ?? null;
    const key = allergyKey(menuName);
    const componentAllergies =
      key === 'AI깐부'
        ? [
            ...new Set(
              AI_KKANBU_COMPONENTS.flatMap((component) => splitAllergy(ALLERGY_BY_NAME[component] ?? null)),
            ),
          ]
        : null;
    const allergy =
      componentAllergies && componentAllergies.length > 0
        ? componentAllergies.join(', ')
        : Object.hasOwn(ALLERGY_BY_NAME, key)
          ? ALLERGY_BY_NAME[key]
          : null;
    const englishName = `${BRAND_SLUG}-${slugify(uid)}`;
    return {
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode: uid,
      sourceCategoryId: page.mid,
      sourceCategory: page.category,
      sourceCategoryUrl: `${BASE_URL}/home/sub01.php?mid=${page.mid}`,
      sourceProductUrl: `${BASE_URL}/home/sub01.php?mid=${detailMid}&uid=${uid}`,
      menuName,
      englishName,
      menuImageUrl: imagePath ? absoluteUrl(imagePath) : null,
      localImagePath: imagePath ? `/assets/menus/${BRAND_SLUG}/${englishName}.png` : null,
      categorySlug: page.categorySlug,
      menuType: page.menuType,
      description:
        key === 'AI깐부'
          ? `${description} 구성: 바삭한 식스팩, 크리스피 순살치킨, 치즈스틱`
          : description,
      allergy,
      allergens: splitAllergy(allergy),
    };
  });
}

function maxPage(html) {
  return Math.max(1, ...[...html.matchAll(/mid=\d+&p=(\d+)/g)].map((match) => Number(match[1])));
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const byId = new Map();
  for (const page of PAGES) {
    const firstUrl = `${BASE_URL}/home/sub01.php?mid=${page.mid}`;
    const firstHtml = await fetchText(firstUrl);
    const lastPage = maxPage(firstHtml);
    for (let index = 1; index <= lastPage; index += 1) {
      const html = index === 1 ? firstHtml : await fetchText(`${firstUrl}&p=${index}`);
      for (const record of parseCards(html, page)) byId.set(`${page.mid}:${record.sourceCode}`, record);
    }
  }

  const records = [...byId.values()];
  if (records.length === 0) throw new Error('No Kkanbu menu cards were parsed.');

  for (const record of records) {
    if (record.menuImageUrl && record.localImagePath) {
      await downloadPng(record.menuImageUrl, path.join(ROOT, 'public', record.localImagePath.replace(/^\//, '')), record.englishName);
    }
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  return records;
}

async function requireSingle(client, table, query) {
  const { data, error } = await query.single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function uploadImage(client, record, bucketIsPublic) {
  if (!record.localImagePath) return null;
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
  const client = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
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
          allergen_source_url: `${BASE_URL}/home/sub01.php?mid=8`,
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
          title: 'Kkanbu official menu data',
          source_type: 'official_page',
          url: `${BASE_URL}/home/sub01.php?mid=8`,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from Kkanbu official menu pages. Allergy mapping is pending until official allergen table image is provided.',
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
        client,
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
