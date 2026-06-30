import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'goobne';
const BRAND_NAME = '굽네치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const BASE_URL = 'https://www.goobne.co.kr';
const LIST_URL = `${BASE_URL}/menu/menu_list_p`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_goobne.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGY_BY_NAME = {
  '고추바사삭가슴살순살': '닭고기, 대두, 밀, 땅콩, 우유',
  오리지널: '닭고기, 대두',
  볼케이노: '닭고기, 우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  갈비천왕: '닭고기, 우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  고추바사삭: '닭고기, 대두, 밀, 땅콩, 우유',
  양념히어로: '닭고기, 우유, 대두, 밀, 토마토, 쇠고기',
  오븐바사삭: '닭고기, 대두, 밀',
  남해마늘바사삭: '닭고기, 대두, 밀',
  굽네장각구이: '닭고기, 우유, 대두, 토마토',
  고추바사삭곱빼기: '닭고기, 대두, 밀, 땅콩, 우유',
  오리지널곱빼기: '닭고기, 대두',
  추추치킨스테이크: '닭고기, 우유, 대두, 밀, 쇠고기, 조개류(굴), 토마토',
  '오리지널+치트킹매콤': '닭고기, 대두, 우유, 밀',
  '반반A볼케이노반반': '닭고기, 우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  '반반B갈비천왕반반': '닭고기, 우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  양념반반: '닭고기, 우유, 대두, 밀, 토마토, 쇠고기',
  폭립: '우유, 대두, 밀, 쇠고기, 돼지고기, 토마토',
  굽네순살시카고피자시리즈: '난류, 우유, 대두, 밀, 토마토, 닭고기, 돼지고기, 쇠고기, 조개류(굴)',
  콤비네이션시카고피자: '밀, 대두, 우유, 계란, 토마토, 닭고기, 돼지고기, 쇠고기',
  시카고딥디쉬피자: '밀, 대두, 우유, 계란, 토마토, 닭고기, 돼지고기, 쇠고기',
  바비큐시카고피자: '밀, 대두, 우유, 계란, 토마토, 쇠고기, 돼지고기',
  페퍼로니시카고피자: '밀, 대두, 우유, 토마토, 돼지고기, 쇠고기',
  바질토마토피자: '밀, 대두, 우유, 계란, 토마토, 닭고기',
  트리플포테이토피자: '밀, 대두, 우유, 계란, 토마토, 닭고기, 돼지고기, 쇠고기',
  치킨베이크: '난류, 우유, 대두, 밀, 돼지고기, 닭고기, 쇠고기',
  웨지감자: '대두, 밀',
  갈릭버터웨지감자: '대두, 밀, 우유',
  콰트로치즈웨지감자: '대두, 밀, 우유',
  모짜치즈볼: '우유, 대두, 밀',
  콰트로모짜치즈볼: '우유, 대두, 밀',
  맵달떡볶이: '우유, 대두, 밀, 쇠고기',
  케이준감자: '대두, 밀',
  갈릭버터케이준감자: '대두, 밀, 우유',
  콰트로치즈케이준감자: '대두, 밀, 우유',
  찍먹커리치킨마크니: '달걀, 우유, 대두, 밀, 토마토, 돼지고기, 닭고기, 쇠고기',
  볼로네제파스타: '대두, 밀, 우유, 토마토, 돼지고기, 쇠고기, 닭고기',
  까르보나라파스타: '대두, 밀, 계란, 우유, 돼지고기, 쇠고기, 닭고기',
  갈릭크림바게트볼: '밀, 대두, 우유, 계란, 아황산류',
  바게트볼: '밀, 대두, 우유, 계란, 아황산류',
  바게트볼2ea: '밀, 대두, 우유, 계란, 아황산류',
  에그타르트: '대두, 계란, 밀, 우유',
  갈비천왕치즈치밥: '쇠고기, 닭고기, 대두, 우유, 조개류(굴), 토마토',
  볼케이노치즈치밥: '쇠고기, 닭고기, 대두, 우유, 조개류(굴), 토마토',
  매콤치즈소떡소떡: '돼지고기, 닭고기, 대두, 밀, 토마토, 쇠고기',
  불닭발: '닭고기, 대두, 밀',
  남해구운마늘: '-',
  추블링살사: '토마토',
  치트킹매콤치즈맛: '대두, 우유, 밀',
  요블링소스: '계란, 우유, 대두',
  고블링소스: '우유, 대두, 밀, 쇠고기, 조개류(굴), 토마토',
  마블링소스: '계란, 우유, 대두, 밀, 돼지고기',
  마그마소스: '우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  왕중왕소스: '우유, 대두, 밀, 토마토, 쇠고기, 조개류(굴)',
  매콤소스: '대두, 밀, 토마토, 아황산류',
  달콤소스: '대두, 밀, 토마토, 아황산류',
  핫소스: '대두, 밀',
  갈릭딥핑소스: '계란, 대두',
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
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function allergyKey(value) {
  return cleanText(value)
    .replace(/\(국내산\)/g, '')
    .replace(/\(5pcs\)/gi, '')
    .replace(/\(2pcs\)/gi, '')
    .replace(/\(1\.5마리\)/g, '')
    .replace(/\(1\.5 SET\)/gi, '')
    .replace(/\(2 SET\)/gi, '')
    .replace(/\(S\)/gi, '')
    .replace(/\(M\)/gi, '')
    .replace(/\(토핑\)/g, '')
    .replace(/\(8알\)/g, '')
    .replace(/[)&]/g, '')
    .replace(/[\s(]/g, '')
    .replace(/바질토마토/g, '바질토마토')
    .replace(/고추바사삭곱빼기.*/, '고추바사삭곱빼기')
    .replace(/오리지널곱빼기.*/, '오리지널곱빼기');
}

function normalizeName(value) {
  return cleanText(value)
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function splitAllergy(value) {
  if (!value || value === '-') return [];
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
    아황산류: 'sulfite',
    오징어: 'squid',
    게: 'crab',
    복숭아: 'peach',
  };
  return map[normalizeAllergen(value)] ?? null;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function inferType(name) {
  if (/피자/.test(name)) return 2;
  if (/소스|살사|치트킹|감자|치즈볼|떡볶이|커리|파스타|바게트|에그타르트|치밥|소떡|닭발|마늘|베이크/.test(name)) return 3;
  return 1;
}

function inferCategorySlug(name) {
  return /피자/.test(name) ? 'pizza' : 'chicken';
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

function parseCards(html) {
  return [...html.matchAll(/<a href="#" onclick="menu_view\(&quot;(\d+)&quot;,\s*0\)" class="item">([\s\S]*?)(?=<\/a>)/g)].map(
    (match) => {
      const [, id, block] = match;
      const menuName = cleanText(block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)?.[1]);
      const imageUrl = block.match(/<img src="([^"]+)"/)?.[1] ?? null;
      const price = cleanText(block.match(/<p class="price">[\s\S]*?<b>([^<]*)<\/b>/)?.[1]);
      const key = allergyKey(menuName);
      const allergy = Object.hasOwn(ALLERGY_BY_NAME, key) ? ALLERGY_BY_NAME[key] : null;
      const englishName = `${BRAND_SLUG}-${slugify(id)}`;
      return {
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        sourceCode: id,
        sourceCategory: inferType(menuName) === 2 ? 'pizza' : inferType(menuName) === 3 ? 'side_or_sauce' : 'chicken',
        sourceCategoryUrl: LIST_URL,
        sourceProductUrl: `${BASE_URL}/menu/menu_view_p?itemId=${id}`,
        menuName,
        englishName,
        menuImageUrl: imageUrl,
        localImagePath: imageUrl ? `/assets/menus/${BRAND_SLUG}/${englishName}.png` : null,
        categorySlug: inferCategorySlug(menuName),
        menuType: inferType(menuName),
        description: null,
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
  const records = parseCards(await fetchText(LIST_URL));
  if (records.length === 0) throw new Error('No Goobne menu cards were parsed.');
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
          title: 'Goobne official menu allergy data',
          source_type: 'official_page',
          url: LIST_URL,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from Goobne official menu page. Allergy values transcribed from the provided official allergen table image.',
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
