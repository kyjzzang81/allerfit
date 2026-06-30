import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getMenuType } from './menu-type.mjs';

const ROOT = process.cwd();
const BRAND_SLUG = 'dominos';
const BRAND_NAME = '도미노피자';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_dominos.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  { slug: 'pizza', name: '피자', categorySlug: 'pizza', url: 'https://web.dominos.co.kr/goods/list?dsp_ctgr=C0101' },
  { slug: 'side', name: '사이드디시', categorySlug: 'pizza', url: 'https://web.dominos.co.kr/goods/list?dsp_ctgr=C0201' },
];

async function fetchEucKr(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return new TextDecoder('euc-kr').decode(await response.arrayBuffer());
}

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

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .replace(/NEW/g, '')
    .toLowerCase()
    .trim();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function parseRows(tableHtml) {
  const rows = [];
  for (const tr of tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => stripHtml(cell[1]));
    if (cells.length >= 2) {
      rows.push(cells);
    }
  }
  return rows;
}

function parseIngredientTables(html) {
  const origin = new Map();
  const allergy = new Map();
  const nutrition = new Map();

  for (const table of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const tableHtml = table[0];
    const caption = stripHtml(tableHtml.match(/<caption>([\s\S]*?)<\/caption>/)?.[1] ?? '');
    const rows = parseRows(tableHtml);
    const target =
      caption.includes('원산지') ? origin : caption.includes('알레르기') ? allergy : caption.includes('영양성분') ? nutrition : null;
    if (!target) {
      continue;
    }
    for (const row of rows) {
      const name = row[0];
      if (!name || name === '제품명' || name === '피자' || name === '사이드디시') {
        continue;
      }
      target.set(normalizeName(name), row.slice(1).join(' / '));
    }
  }

  return { origin, allergy, nutrition };
}

function parseListPage(html, page) {
  const blocks = html.split(/<li[^>]*>/).slice(1);
  const byCode = new Map();

  for (const block of blocks) {
    const detail = block.match(/getDetailSlide\('([^']+)','([^']+)'\)/);
    const linkCode = block.match(/code_01=([A-Z0-9]+)/);
    const image = block.match(/data-src="(https:\/\/cdn\.dominos\.co\.kr\/admin\/upload\/goods\/[^"]+)"[^>]*alt="([^"]*)"/);
    const code = detail?.[1] ?? linkCode?.[1];
    const detailCategory = detail?.[2] ?? page.url.match(/dsp_ctgr=([^&]+)/)?.[1] ?? '';
    if (!code || !image || byCode.has(code)) {
      continue;
    }

    byCode.set(code, {
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode: code,
      sourceDetailCategory: detailCategory,
      sourceCategory: page.slug,
      sourceCategoryName: page.name,
      sourceCategoryUrl: page.url,
      sourceProductUrl: `https://web.dominos.co.kr/goods/detail?dsp_ctgr=${page.url.match(/dsp_ctgr=([^&]+)/)?.[1] ?? detailCategory}&code_01=${code}`,
      menuName: stripHtml(image[2]),
      englishName: `${BRAND_SLUG}-${code.toLowerCase()}`,
      menuImageUrl: image[1],
      categorySlug: page.categorySlug,
    });
  }

  return [...byCode.values()];
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
    달걀: 'egg',
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
  };
  return map[normalized] ?? null;
}

async function downloadPng(url, dest, slug) {
  const rawPath = path.join(TMP_DIR, `${slug}-raw`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`image ${response.status} ${url}`);
  }
  await fs.writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
  const py = spawnSync('python3', ['-', rawPath, dest], {
    input:
      "from PIL import Image\nimport sys\nimg = Image.open(sys.argv[1])\nif img.mode not in ('RGB', 'RGBA'):\n    img = img.convert('RGBA')\nimg.save(sys.argv[2], 'PNG')\n",
    encoding: 'utf8',
  });
  if (py.status !== 0) {
    throw new Error(`png convert failed for ${slug}: ${py.stderr || py.stdout}`);
  }
}

async function fetchDetail(record) {
  const params = new URLSearchParams({
    code_01: record.sourceCode,
    dsp_ctgr: record.sourceDetailCategory,
  });
  const response = await fetch(`https://web.dominos.co.kr/goods/detailAjax?${params}`);
  if (!response.ok) {
    return {};
  }
  const json = await response.json();
  const detail = json?.resultData?.detail ?? {};
  return {
    description: stripHtml(detail.w_contents ?? detail.topping ?? ''),
    originDetail: stripHtml(detail.origin ?? ''),
  };
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

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const ingredientHtml = await fetchEucKr('https://web.dominos.co.kr/contents/ingredient');
  const tables = parseIngredientTables(ingredientHtml);
  const records = [];

  for (const page of PAGES) {
    const html = await fetchEucKr(page.url);
    for (const record of parseListPage(html, page)) {
      const normalizedName = normalizeName(record.menuName);
      const detail = await fetchDetail(record);
      const imageSlug = slugify(`${BRAND_SLUG}-${record.sourceCode}`);
      const fileName = `${imageSlug}.png`;
      const localImagePath = `/assets/menus/${BRAND_SLUG}/${fileName}`;
      await downloadPng(record.menuImageUrl, path.join(IMAGE_DIR, fileName), imageSlug);

      records.push({
        ...record,
        ...detail,
        sourceAllergenUrl: 'https://web.dominos.co.kr/contents/ingredient',
        localImagePath,
        menuType: getMenuType({
          brandCategorySlug: 'pizza',
          menuCategorySlug: record.categorySlug,
          sourceCategory: record.sourceCategory,
          menuName: record.menuName,
        }),
        originText: tables.origin.get(normalizedName) ?? detail.originDetail ?? null,
        allergy: tables.allergy.get(normalizedName) ?? null,
        allergens: splitAllergy(tables.allergy.get(normalizedName) ?? null),
        nutritionText: tables.nutrition.get(normalizedName) ?? null,
      });
    }
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  return records;
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
          title: 'Domino Pizza official menu allergy data',
          source_type: 'official_page',
          url: 'https://web.dominos.co.kr/contents/ingredient',
          checked_at: CHECKED_AT,
          note: 'Collected from Domino menu pages and official ingredient page.',
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
  const menuOrigins = [];

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    let targets = existingByName.get(normalizeName(record.menuName)) ?? [];
    if (targets.length === 0) {
      const slug = `${BRAND_SLUG}-${record.sourceCode.toLowerCase()}`;
      const row = await requireSingle(
        client,
        'menus',
        client
          .from('menus')
          .upsert(
            {
              brand_id: brand.id,
              category_id: categoryBySlug.get(record.categorySlug),
              slug,
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
          is_active: true,
        })
        .eq('id', target.id);
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

      for (const code of new Set(record.allergens.map(mapAllergenNameToCode).filter(Boolean))) {
        const allergenId = allergenByCode.get(code);
        if (!allergenId) throw new Error(`Missing allergen code "${code}" for ${record.menuName}`);
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
      allergen_source_url: 'https://web.dominos.co.kr/contents/ingredient',
      origin_source_url: 'https://web.dominos.co.kr/contents/ingredient',
      official_url: 'https://web.dominos.co.kr',
      data_status: 'official_verified',
      last_checked_at: CHECKED_AT,
    })
    .eq('id', brand.id);
  if (brandError) throw brandError;

  return {
    records: records.length,
    uploadedImages: records.length,
    touchedMenus: uniqueTouchedIds.length,
    insertedMenus: inserted.length,
    allergenRows: uniqueMenuAllergens.length,
    originRows: menuOrigins.length,
  };
}

const records = await collect();
const result = await importToSupabase(records);
console.log(JSON.stringify(result, null, 2));
