import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'bodram';
const BRAND_NAME = '보드람치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-02';
const BASE_URL = 'http://www.bodram.com';
const START_URL = `${BASE_URL}/m/product.html?branduid=3604370`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_bodram.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
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
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'");
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
  return cleanText(value).toLowerCase().replace(/[()（）/+\s]/g, '');
}

function normalizeAllergen(value) {
  return String(value).trim().replace(/\(.*?\)/g, '').replace(/\s+/g, '');
}

function mapAllergenNameToCode(value) {
  const map = {
    난류: 'egg',
    알류: 'egg',
    계란: 'egg',
    우유: 'milk',
    대두: 'soybean',
    밀: 'wheat',
    닭고기: 'chicken',
    쇠고기: 'beef',
    소고기: 'beef',
    토마토: 'tomato',
    이산화황: 'sulfite',
    아황산류: 'sulfite',
  };
  return map[normalizeAllergen(value)] ?? null;
}

function splitAllergy(value) {
  if (!value) return [];
  const compact = cleanText(value);
  const labelled = [...compact.matchAll(/-\s*[^:]+:\s*([^-]+)/g)].map((match) => match[1]);
  if (labelled.length > 0) {
    return [
      ...new Set(
        labelled
          .filter((text) => !text.includes('없음'))
          .flatMap((text) => text.split(',').map((item) => cleanText(item)))
          .filter(Boolean),
      ),
    ];
  }
  return [
    ...new Set(
      String(value)
        .replace(/<br\s*\/?>/gi, '|')
        .split('|')
        .flatMap((line) => {
          const text = cleanText(line).replace(/^-\s*/, '');
          if (!text || text.includes('없음')) return [];
          const valuePart = text.includes(':') ? text.split(':').slice(1).join(':') : text;
          return valuePart.split(',').map((item) => cleanText(item));
        })
        .filter(Boolean),
    ),
  ];
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

function extractProductIds(html) {
  return [...new Set([...html.matchAll(/branduid=(\d+)/g)].map((match) => match[1]))].sort();
}

function extractDescription(html) {
  const textInfo = html.match(/<div class="text-info"[\s\S]*?<p>([\s\S]*?)<\/p>\s*<p style=/)?.[1];
  return cleanText(textInfo);
}

function extractTabValues(html) {
  const start = html.indexOf('<div id="tab-cont">');
  if (start < 0) return { origin: null, allergy: null };
  const end = html.indexOf('</div>\n                            </div>\n                        </div>', start);
  const part = html.slice(start, end > start ? end : undefined);
  const divs = [...part.matchAll(/<div>([\s\S]*?)<\/div>/g)].map((match) => cleanText(match[1]));
  return { origin: divs[0] ?? null, allergy: divs[1] ?? null };
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const startHtml = await fetchText(START_URL);
  const ids = extractProductIds(startHtml);
  const records = [];
  for (const id of ids) {
    const sourceProductUrl = `${BASE_URL}/m/product.html?branduid=${id}`;
    const html = await fetchText(sourceProductUrl);
    const menuName = cleanText(html.match(/var product_name = '([^']*)'/)?.[1]);
    const schemaImage = html.match(/"image":\s*\[([^\]]+)\]/)?.[1] ?? '';
    const imageUrl =
      schemaImage.match(/"(http[^"]*\/design\/bodram\/img\/[^"]+)"/)?.[1] ??
      html.match(/<div class="thumb"[\s\S]*?<img src="([^"]+)"/)?.[1] ??
      html.match(/"image":\s*\["([^"]+)"/)?.[1];
    const tabs = extractTabValues(html);
    const englishName = `${BRAND_SLUG}-${id}`;
    records.push({
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode: id,
      sourceCategory: '치킨',
      sourceCategoryUrl: START_URL,
      sourceProductUrl,
      menuName,
      englishName,
      menuImageUrl: absoluteUrl(imageUrl),
      localImagePath: `/assets/menus/${BRAND_SLUG}/${englishName}.png`,
      categorySlug: 'chicken',
      menuType: 1,
      description: extractDescription(html),
      origin: tabs.origin,
      allergy: tabs.allergy,
      allergens: splitAllergy(tabs.allergy),
    });
  }
  if (records.length === 0) throw new Error('No Bodram menu records were parsed.');

  for (const record of records) {
    await downloadPng(record.menuImageUrl, path.join(ROOT, 'public', record.localImagePath.replace(/^\//, '')), record.englishName);
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  return records;
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
  const client = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
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
          allergen_source_url: START_URL,
          data_status: 'official_verified',
          last_checked_at: CHECKED_AT,
          is_active: true,
        },
        { onConflict: 'slug' },
      )
      .select('id'),
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
          title: 'Bodram official menu allergy data',
          source_type: 'official_page',
          url: START_URL,
          checked_at: CHECKED_AT,
          note: 'Menu list collected from mobile product carousel. Allergy values collected from product allergy tab text.',
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
  const missingAllergy = [];
  const unknownAllergens = new Set();
  const menuAllergens = [];

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
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
    missingAllergy,
    allergenRows: uniqueMenuAllergens.length,
    unknownAllergens: [...unknownAllergens],
  };
}

async function main() {
  const records = await collect();
  console.log(JSON.stringify(await importToSupabase(records), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
