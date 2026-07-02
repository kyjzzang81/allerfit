import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'cheogajip';
const BRAND_NAME = '처갓집양념치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-02';
const BASE_URL = 'https://www.cheogajip.co.kr';
const ALLERGY_URL = `${BASE_URL}/bbs/content.php?co_id=allergy`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_cheogajip.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');
const MENU_PAGES = [
  {
    sourceId: 'whole',
    sourceCategory: '한마리메뉴',
    menuType: 1,
    url: `${BASE_URL}/bbs/board.php?bo_table=allmenu&sca=%ED%95%9C%EB%A7%88%EB%A6%AC%EB%A9%94%EB%89%B4`,
  },
  {
    sourceId: 'parts',
    sourceCategory: '다리.날개메뉴',
    menuType: 1,
    url: `${BASE_URL}/bbs/board.php?bo_table=allmenu&sca=%EB%8B%A4%EB%A6%AC.%EB%82%A0%EA%B0%9C%EB%A9%94%EB%89%B4`,
  },
  {
    sourceId: 'side',
    sourceCategory: '사이드메뉴',
    menuType: 3,
    url: `${BASE_URL}/bbs/board.php?bo_table=allmenu&sca=%EC%82%AC%EC%9D%B4%EB%93%9C%EB%A9%94%EB%89%B4`,
  },
];

const CACHE_BY_URL = new Map([
  [MENU_PAGES[0].url, '/private/tmp/cheogajip_menu1.html'],
  [MENU_PAGES[1].url, '/private/tmp/cheogajip_menu2.html'],
  [MENU_PAGES[2].url, '/private/tmp/cheogajip_side.html'],
  [ALLERGY_URL, '/private/tmp/cheogajip_allergy.html'],
]);

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGY_ALIASES = {
  K마라양념치킨: '처갓집K마라양념치킨',
  꼬꼬뱅슈프림양념치킨: '처갓집꼬꼬뱅슈프림양념치킨',
  슈프림양념치킨블랙라벨: '처갓집슈프림양념치킨블랙라벨',
  치킨치즈볼골드: '처갓집치킨치즈볼골드세트',
  치킨치즈볼레드: '처갓집치킨치즈볼레드세트',
  치킨치즈볼9개: '처갓집치킨치즈볼오리지날',
  치킨치즈볼: '처갓집치킨치즈볼오리지날',
  '100청양산고추치킨': '처갓집100청양산우리고추치킨',
  트러플슈프림양념치킨: '처갓집트러플슈프림양념치킨',
  후라이드치킨: '처갓집후라이드치킨',
  다리후라이드치킨: '처갓집후라이드치킨',
  날개후라이드치킨: '처갓집후라이드치킨',
  허니올리고당야채양념치킨: '처갓집허니올리고당야채양념치킨',
  다리허니올리고당야채양념치킨: '처갓집허니올리고당야채양념치킨',
  날개허니올리고당야채양념치킨: '처갓집허니올리고당야채양념치킨',
  매운불양념치킨: '처갓집매운양념치킨',
  슈프림양념치킨: '처갓집슈프림양념치킨',
  핫슈프림양념치킨: '처갓집핫슈프림양념치킨',
  치즈슈프림양념치킨: '처갓집치즈슈프림양념치킨',
  슈프림골드양념치킨: '처갓집슈프림골드양념치킨',
  훈제치킨: '처갓집훈제치킨',
  와락치킨: '처갓집와락치킨',
  와락윙: '처갓집와락윙',
  핫불훈제치킨: '처갓집핫불훈제치킨',
  순살닭강정: '처갓집닭강정',
  근위후라이드: '근위후라이드',
  후렌치후라이: '감자튀김',
  슈프림골드치즈볼: '처갓집라이스치즈볼슈프림골드',
  처갓집라이스슈프림: '처갓집슈프림라이스',
  처갓집라이스핫슈프림: '처갓집핫슈프림라이스',
  처갓집라이스와락: '처갓집와락라이스',
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

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripComments(value) {
  return String(value ?? '').replace(/<!--[\s\S]*?-->/g, '');
}

function cleanText(value) {
  return decodeEntities(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return cleanText(value)
    .replace(/^처갓집\s*/g, '처갓집')
    .replace(/치킨\s*무/g, '치킨무')
    .replace(/100%\s*/g, '100')
    .replace(/[-\s().・·]/g, '');
}

function allergyKey(value) {
  return normalizeName(value);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function mapAllergenNameToCode(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, '');
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
    굴: 'shellfish',
    조개류: 'shellfish',
    아황산류: 'sulfite',
    오징어: 'squid',
    게: 'crab',
    메밀: 'buckwheat',
    복숭아: 'peach',
    호두: 'walnut',
    고등어: 'mackerel',
  };
  return map[normalized] ?? null;
}

function splitAllergy(value) {
  if (!value || /페닐알나린/.test(value)) return [];
  return String(value)
    .replace(/[.]/g, ',')
    .replace(/조개류\s*\(([^)]*)\)/g, '조개류')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.text();
  } catch (error) {
    const cachePath = CACHE_BY_URL.get(url);
    if (cachePath) {
      return fs.readFile(cachePath, 'utf8');
    }
    throw error;
  }
}

async function downloadPng(url, dest, slug) {
  if (process.env.CHEOGAJIP_SKIP_DOWNLOAD === '1') {
    return;
  }
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

function parseAllergyRows(html) {
  const rows = [...html.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)];
  const byKey = new Map();
  for (const [, type, name, allergy] of rows) {
    const cleanName = cleanText(name);
    const cleanAllergy = cleanText(allergy);
    if (!cleanName || cleanName === '제품명') continue;
    byKey.set(allergyKey(cleanName), {
      type: cleanText(type),
      name: cleanName,
      allergy: cleanAllergy,
      allergens: splitAllergy(cleanAllergy),
    });
  }
  return byKey;
}

function parseCards(html, page) {
  const cards = [...stripComments(html).matchAll(/<li class="gall_li[\s\S]*?(?=<li class="gall_li|<\/ul>\s*<\/div>)/g)];
  return cards.map((match, index) => {
    const block = match[0];
    const menuName = cleanText(block.match(/<li class="gall_text_href"[^>]*>([\s\S]*?)<hr/)?.[1]);
    const description = cleanText(block.match(/<h3>\s*<p>([\s\S]*?)<\/p>/)?.[1]) || null;
    const imageUrl = block.match(/<img src="([^"]+)"/)?.[1] ?? null;
    const sourceCode = `${page.sourceId}-${index + 1}`;
    const englishName = `${BRAND_SLUG}-${sourceCode}`;
    return {
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode,
      sourceCategory: page.sourceCategory,
      sourceCategoryUrl: page.url,
      sourceProductUrl: page.url,
      menuName,
      englishName,
      menuImageUrl: imageUrl,
      localImagePath: imageUrl ? `/assets/menus/${BRAND_SLUG}/${englishName}.png` : null,
      categorySlug: 'chicken',
      menuType: page.menuType,
      description,
    };
  });
}

function attachAllergy(record, allergyByKey) {
  const key = allergyKey(record.menuName);
  const alias = ALLERGY_ALIASES[key] ?? key;
  const row = allergyByKey.get(alias);
  return {
    ...record,
    allergySourceName: row?.name ?? null,
    allergy: row?.allergy ?? null,
    allergens: row?.allergens ?? [],
  };
}

function dedupeRecords(records) {
  const byName = new Map();
  for (const record of records) {
    const key = normalizeName(record.menuName);
    const existing = byName.get(key);
    if (!existing || record.menuType > existing.menuType) {
      byName.set(key, record);
    }
  }
  return [...byName.values()];
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const allergyByKey = parseAllergyRows(await fetchText(ALLERGY_URL));
  const records = dedupeRecords(
    (
      await Promise.all(
        MENU_PAGES.map(async (page) =>
          parseCards(await fetchText(page.url), page).map((record) => attachAllergy(record, allergyByKey)),
        ),
      )
    ).flat(),
  );

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
  if (!url || !serviceKey) throw new Error('Set Supabase URL and service role key before running this importer.');

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: categories, error: categoriesError } = await client.from('categories').select('id, slug');
  if (categoriesError) throw categoriesError;
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const brand = await requireSingle(
    client,
    'brands',
    client
      .from('brands')
      .upsert(
        {
          slug: BRAND_SLUG,
          name: BRAND_NAME,
          category_id: categoryBySlug.get('chicken'),
          official_url: BASE_URL,
          allergen_source_url: ALLERGY_URL,
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
          title: '처갓집양념치킨 official menu allergy data',
          source_type: 'official_page',
          url: ALLERGY_URL,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from official allmenu category pages. Allergens collected from official allergy table.',
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
  const missingImages = [];
  const missingAllergies = [];
  const unknownAllergens = new Set();

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    if (!imageUrl) missingImages.push(record.menuName);

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
              slug: record.englishName,
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

    if (!record.allergy && record.allergens.length === 0) {
      missingAllergies.push(record.menuName);
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
        const allergenId = code ? allergenByCode.get(code) : null;
        if (!allergenId) {
          unknownAllergens.add(allergen);
          continue;
        }
        menuAllergens.push({
          menu_id: target.id,
          allergen_id: allergenId,
          presence_type: 'contains',
          note: record.allergy || null,
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

  const { error: brandError } = await client
    .from('brands')
    .update({
      official_url: BASE_URL,
      allergen_source_url: ALLERGY_URL,
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
    missingAllergies: [...new Set(missingAllergies)],
    unknownAllergens: [...unknownAllergens],
  };
}

const records = await collect();
if (process.env.CHEOGAJIP_SKIP_IMPORT === '1') {
  const missingAllergies = records
    .filter((record) => !record.allergy && record.allergens.length === 0)
    .map((record) => record.menuName);
  console.log(
    JSON.stringify(
      {
        records: records.length,
        images: records.filter((record) => record.localImagePath).length,
        typeCounts: records.reduce(
          (acc, record) => ((acc[record.menuType] = (acc[record.menuType] ?? 0) + 1), acc),
          {},
        ),
        missingAllergies,
      },
      null,
      2,
    ),
  );
} else {
  const result = await importToSupabase(records);
  console.log(JSON.stringify(result, null, 2));
}
