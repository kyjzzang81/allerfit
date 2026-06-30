import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'kyochon';
const BRAND_NAME = '교촌치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const BASE_URL = 'https://kyochon.com';
const LIST_URL = `${BASE_URL}/menu/chicken.asp`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_kyochon.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGY_BY_NAME = {
  간장한마리: '닭고기, 대두, 밀',
  간장콤보: '닭고기, 대두, 밀',
  간장윙: '닭고기, 대두, 밀',
  간장스틱: '닭고기, 대두, 밀',
  간장순살: '닭고기, 대두, 밀',
  레드한마리: '닭고기, 대두, 밀, 복숭아',
  레드콤보: '닭고기, 대두, 밀, 복숭아',
  레드윙: '닭고기, 대두, 밀, 복숭아',
  레드스틱: '닭고기, 대두, 밀, 복숭아',
  레드순살: '닭고기, 대두, 밀, 복숭아',
  '반반콤보[간장+레드]': '닭고기, 대두, 밀, 복숭아',
  '반반스틱[간장+레드]': '닭고기, 대두, 밀, 복숭아',
  '반반윙[간장+레드]': '닭고기, 대두, 밀, 복숭아',
  '반반순살[간장+레드]': '닭고기, 대두, 밀, 복숭아',
  '반반순살[레드+허니]': '닭고기, 땅콩, 대두, 밀, 토마토',
  '반반한마리[간장+레드]': '닭고기, 대두, 밀, 복숭아',
  '반반한마리[간장+허니갈릭]': '닭고기, 대두, 밀',
  '반반한마리[레드+허니갈릭]': '닭고기, 대두, 밀, 복숭아',
  '반반한마리[간장+마라레드]': '닭고기, 계란, 대두, 밀, 조개류(굴)',
  '반반한마리[레드+마라레드]': '닭고기, 계란, 대두, 밀, 복숭아, 조개류(굴)',
  '반반한마리[마라레드+허니갈릭]': '닭고기, 계란, 대두, 밀, 조개류(굴)',
  허니한마리: '닭고기, 대두, 밀',
  허니콤보: '닭고기, 대두, 밀',
  허니순살: '닭고기, 대두, 밀',
  후라이드한마리: '닭고기, 땅콩, 대두, 밀',
  양념치킨한마리: '닭고기, 땅콩, 대두, 밀, 토마토',
  후라이드양념반반한마리: '닭고기, 땅콩, 대두, 밀, 토마토',
  후라이드순살: '닭고기, 땅콩, 대두, 밀',
  양념치킨순살: '닭고기, 땅콩, 대두, 밀, 토마토',
  후라이드양념반반순살: '닭고기, 땅콩, 대두, 밀, 토마토',
  살살후라이드: '닭고기, 우유, 대두, 밀, 토마토, 쇠고기',
  파채소이살살: '닭고기, 우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  허니갈릭한마리: '닭고기, 대두, 밀',
  허니옥수수한마리: '닭고기, 계란, 우유, 대두, 밀',
  허니옥수수순살: '닭고기, 계란, 우유, 대두, 밀',
  마라레드한마리: '닭고기, 계란, 대두, 밀, 조개류(굴)',
  간장싱글윙: '닭고기, 대두, 밀',
  허니싱글윙: '닭고기, 대두, 밀',
  레드싱글윙: '닭고기, 대두, 밀, 복숭아',
  후라이드싱글윙: '닭고기, 땅콩, 대두, 밀',
  양념치킨싱글윙: '닭고기, 땅콩, 대두, 밀, 토마토',
  마라레드싱글윙: '닭고기, 계란, 대두, 밀, 조개류(굴)',
  허니갈릭싱글윙: '닭고기, 대두, 밀',
  간장윙박스: '닭고기, 대두, 밀',
  허니윙박스: '닭고기, 대두, 밀',
  레드윙박스: '닭고기, 대두, 밀, 복숭아',
  후라이드윙박스: '닭고기, 땅콩, 대두, 밀',
  양념치킨윙박스: '닭고기, 땅콩, 대두, 밀, 토마토',
  마라레드윙박스: '닭고기, 계란, 대두, 밀, 조개류(굴)',
  허니갈릭윙박스: '닭고기, 대두, 밀',
  '반반윙박스[간장+레드]': '닭고기, 대두, 밀, 복숭아',
  '반반윙박스[간장+마라레드]': '닭고기, 계란, 대두, 밀, 조개류(굴)',
  '반반윙박스[간장+허니갈릭]': '닭고기, 대두, 밀',
  '반반윙박스[레드+마라레드]': '닭고기, 계란, 대두, 밀, 복숭아, 조개류(굴)',
  '반반윙박스[레드+허니갈릭]': '닭고기, 대두, 밀, 복숭아',
  '반반윙박스[마라레드+허니갈릭]': '닭고기, 계란, 대두, 밀, 조개류(굴)',
  '반반윙박스[후라이드+양념]': '닭고기, 땅콩, 대두, 밀, 토마토',
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

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function normalizeAllergyKey(value) {
  return cleanText(value)
    .replace(/\s+/g, '')
    .replace(/\[(.*?)\]/g, '[$1]')
    .replace(/\[S\]/gi, '')
    .replace(/\d+\s*PCS/gi, '');
}

function splitAllergy(value) {
  return String(value ?? '')
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
    오징어: 'squid',
    게: 'crab',
    메밀: 'buckwheat',
    복숭아: 'peach',
    호두: 'walnut',
    잣: 'pine_nut',
  };
  return map[normalized] ?? null;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function absoluteUrl(url) {
  return new URL(url, BASE_URL).toString();
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
      "from PIL import Image\nimport sys\nimg = Image.open(sys.argv[1])\nif getattr(img, 'is_animated', False):\n    img.seek(0)\nif img.mode not in ('RGB', 'RGBA'):\n    img = img.convert('RGBA')\nimg.save(sys.argv[2], 'PNG')\n",
    encoding: 'utf8',
  });
  if (py.status !== 0) {
    throw new Error(`png convert failed for ${slug}: ${py.stderr || py.stdout}`);
  }
}

function parseCards(html) {
  return [...html.matchAll(/<li>\s*<a href="view\.asp\?id=([^"&]+)&cg=([^"]+)">([\s\S]*?)<\/a>\s*<div class="quantity">/g)].map(
    (match) => {
      const [, id, cg, block] = match;
      const menuName = cleanText(block.match(/<dt>([\s\S]*?)<\/dt>/)?.[1]);
      const description = cleanText(block.match(/<dd>([\s\S]*?)<\/dd>/)?.[1]);
      const imagePath = block.match(/<img src="([^"]+)"/)?.[1] ?? null;
      const price = cleanText(block.match(/<p class="money">([\s\S]*?)<\/p>/)?.[1]);
      const sourceProductUrl = `${BASE_URL}/menu/view.asp?id=${id}&cg=${cg}`;
      const allergy = ALLERGY_BY_NAME[normalizeAllergyKey(menuName)] ?? '';

      return {
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        sourceCode: id,
        sourceCategoryId: cg,
        sourceCategory: 'chicken',
        sourceCategoryUrl: LIST_URL,
        sourceProductUrl,
        menuName,
        englishName: `${BRAND_SLUG}-${slugify(id)}`,
        menuImageUrl: imagePath ? absoluteUrl(imagePath) : null,
        localImagePath: imagePath ? `/assets/menus/${BRAND_SLUG}/${BRAND_SLUG}-${slugify(id)}.png` : null,
        categorySlug: 'chicken',
        menuType: 1,
        description,
        price,
        allergy,
        allergens: splitAllergy(allergy),
      };
    },
  );
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const html = await fetchText(LIST_URL);
  const records = parseCards(html);
  if (records.length === 0) {
    throw new Error('No Kyochon menu cards were parsed.');
  }

  for (const record of records) {
    if (record.menuImageUrl && record.localImagePath) {
      await downloadPng(
        record.menuImageUrl,
        path.join(ROOT, 'public', record.localImagePath.replace(/^\//, '')),
        record.englishName,
      );
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
  const body = await fs.readFile(localPath);
  const { error } = await client.storage.from(BUCKET).upload(storagePath, body, {
    cacheControl: '31536000',
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw new Error(`storage upload ${storagePath}: ${error.message}`);
  if (bucketIsPublic) return client.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  const { data, error: signedError } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
  if (signedError) throw new Error(`storage signed url ${storagePath}: ${signedError.message}`);
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
          allergen_source_url: LIST_URL,
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
          title: 'Kyochon official menu allergy data',
          source_type: 'official_page',
          url: LIST_URL,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from Kyochon official chicken menu page. Allergy values transcribed from the provided official allergen table image.',
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
  const missingAllergy = [];
  const menuAllergens = [];
  const unknownAllergens = new Set();

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    if (!imageUrl) missingImages.push(record.menuName);
    if (record.allergens.length === 0) missingAllergy.push(record.menuName);

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
      allergen_source_url: LIST_URL,
      data_status: 'official_verified',
      last_checked_at: CHECKED_AT,
    })
    .eq('id', brand.id);
  if (brandError) throw brandError;

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
  const missing = records.filter((record) => record.allergens.length === 0).map((record) => record.menuName);
  if (missing.length > 0) {
    console.warn(`Missing allergy mapping: ${missing.join(', ')}`);
  }
  const result = await importToSupabase(records);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
