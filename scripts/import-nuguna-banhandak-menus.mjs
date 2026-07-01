import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'nuguna-banhandak';
const BRAND_NAME = '누구나홀딱반한닭';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-01';
const BASE_URL = 'https://www.nuguna-banhandak.co.kr';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_nuguna_banhandak.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  { caId: '03', category: '베이크치킨', menuType: 1 },
  { caId: '04', category: '로스트치킨', menuType: 1 },
  { caId: '05', category: '쌈닭메뉴', menuType: 1 },
  { caId: '06', category: '피자메뉴', menuType: 2 },
  { caId: '07', category: '풍미메뉴', menuType: 2 },
  { caId: '08', category: '미니메뉴', menuType: 3 },
];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGY_BY_NAME = {
  바사칸닭: '밀, 대두, 닭고기, 우유, 난류',
  크런킹: '밀, 대두, 닭고기, 쇠고기, 우유, 난류',
  간장에반한닭: '밀, 대두, 닭고기, 우유, 난류',
  쏘핫레드홀릭: '밀, 대두, 닭고기, 쇠고기, 우유, 난류, 토마토, 조개류',
  양념간장에반한닭: '밀, 대두, 닭고기, 우유, 난류, 토마토',
  양념에반한닭: '밀, 대두, 닭고기, 우유, 난류, 토마토',
  촉촉칸닭: '밀, 대두, 닭고기, 우유, 난류',
  촉촉칸파닭: '밀, 대두, 닭고기, 우유, 난류',
  갈릭로스트: '밀, 대두, 닭고기, 쇠고기, 우유, 난류, 이황산류',
  쏘핫레드그릴: '밀, 대두, 닭고기, 쇠고기, 우유, 난류, 토마토, 조개류',
  불고기그릴: '밀, 대두, 닭고기, 우유, 난류',
  불고기레드그릴: '밀, 대두, 닭고기, 쇠고기, 우유, 난류, 토마토',
  갈릭레드그릴: '밀, 대두, 닭고기, 쇠고기, 우유, 난류, 토마토, 이황산류',
  후레쉬쌈닭: '밀, 대두, 닭고기, 이황산류',
  바베큐쌈닭: '밀, 대두, 닭고기, 쇠고기, 난류, 조개류, 이황산류',
  쌈닭화히타: '밀, 대두, 닭고기, 쇠고기, 돼지고기, 우유, 조개류, 토마토',
  쌈닭파이팅: '밀, 대두, 닭고기, 우유, 난류, 아황산류',
  페퍼로니피자: '밀, 대두, 우유, 돼지고기, 난류, 토마토',
  마르게리타피자: '밀, 대두, 우유, 닭고기, 쇠고기, 난류, 토마토, 조개류',
  고르곤졸라피자: '밀, 대두, 우유, 닭고기, 쇠고기, 돼지고기, 난류, 토마토',
  시실리안치킨퀘사디아: '밀, 대두, 우유, 닭고기, 쇠고기, 토마토, 난류, 땅콩, 이황산류, 메밀, 호두, 잣',
  불고기치킨퀘사디아: '밀, 대두, 우유, 닭고기, 쇠고기, 난류, 땅콩, 메밀, 호두, 잣',
  쫄뱅이: '밀, 대두, 우유, 쇠고기, 오징어',
  치쫄면: '밀, 대두, 우유, 닭고기, 쇠고기, 오징어',
  무뼈불닭발: '밀, 대두, 우유, 쇠고기, 닭고기',
  오도독오돌뼈: '밀, 대두, 우유, 쇠고기, 돼지고기',
  셀프주먹밥: null,
  해물짬뽕탕: '밀, 대두, 우유, 쇠고기, 오징어, 조개류, 새우, 게, 이산화황',
  듬뿍어묵탕: '밀, 대두, 게',
  해물누룽지탕: '밀, 대두, 우유, 닭고기, 조개류, 오징어, 새우, 게, 이산화황',
  백합조개탕: '밀, 대두, 우유, 쇠고기, 조개류, 오징어, 새우, 게',
  로제떡볶이: '밀, 대두, 쇠고기, 난류',
  국물떡볶이: '밀, 대두, 우유, 쇠고기',
  국물쫄볶이: '밀, 대두, 우유, 쇠고기',
  치빵치킨샐러드: '밀, 대두, 닭고기, 쇠고기, 토마토, 우유, 난류, 이황산류',
  오다리튀김: '밀, 대두, 우유, 쇠고기, 난류, 오징어',
  야시장새우깡: '밀, 대두, 쇠고기, 난류, 새우',
  똥집강정: '밀, 대두, 우유, 닭고기, 쇠고기, 난류',
  매운똥집강정: '밀, 대두, 우유, 닭고기, 쇠고기, 난류, 토마토, 조개류',
  멕시칸치즈나쵸: '밀, 대두, 우유, 난류',
  바삭쥐포튀김: '밀',
  모짜치즈볼: '밀, 대두, 우유',
  샤베트3종: '우유, 이산화황',
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
    아황산류: 'sulfite',
    이황산류: 'sulfite',
    이산화황: 'sulfite',
  };
  return map[normalizeAllergen(value)] ?? null;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
  return [...html.matchAll(/<li>\s*[\s\S]*?data-pop-href="\/popup\/product_view\?wm_id=(\d+)"[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?background-image:url\('([^']+)'\)[\s\S]*?<span class="tit">([\s\S]*?)<\/span>[\s\S]*?<span class="txt">([\s\S]*?)<\/span>[\s\S]*?<\/li>/g)].map(
    (match) => {
      const [, id, linkName, imageUrl, title, description] = match;
      const menuName = cleanText(title || linkName);
      const key = allergyKey(menuName);
      const allergy = Object.hasOwn(ALLERGY_BY_NAME, key) ? ALLERGY_BY_NAME[key] : null;
      const englishName = `${BRAND_SLUG}-${slugify(id)}`;
      return {
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        sourceCode: id,
        sourceCategoryId: page.caId,
        sourceCategory: page.category,
        sourceCategoryUrl: `${BASE_URL}/product/list?ca_id=${page.caId}`,
        sourceProductUrl: `${BASE_URL}/popup/product_view?wm_id=${id}`,
        menuName,
        englishName,
        menuImageUrl: imageUrl,
        localImagePath: `/assets/menus/${BRAND_SLUG}/${englishName}.png`,
        categorySlug: page.caId === '06' ? 'pizza' : 'chicken',
        menuType: page.menuType,
        description: cleanText(description),
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

  const byId = new Map();
  for (const page of PAGES) {
    const records = parseCards(await fetchText(`${BASE_URL}/product/list?ca_id=${page.caId}`), page);
    for (const record of records) byId.set(record.sourceCode, record);
  }
  const records = [...byId.values()];
  if (records.length === 0) throw new Error('No Nuguna Banhandak menu cards were parsed.');

  for (const record of records) {
    await downloadPng(record.menuImageUrl, path.join(ROOT, 'public', record.localImagePath.replace(/^\//, '')), record.englishName);
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
          allergen_source_url: `${BASE_URL}/product/list`,
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
          title: 'Nuguna Banhandak official menu allergy data',
          source_type: 'official_page',
          url: `${BASE_URL}/product/list`,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from official category pages. Allergy values transcribed from the provided official allergen table images.',
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
