import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'hosigi';
const BRAND_NAME = '호식이두마리치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const DATA_FILE = path.join(ROOT, 'datas', 'menu_hosigi.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const PAGES = [
  { slug: 'chicken', name: '치킨 메뉴', url: 'https://www.9922.co.kr/chicken' },
  { slug: 'side', name: '사이드 메뉴', url: 'https://www.9922.co.kr/side' },
  { slug: 'parts', name: '부위별 메뉴', url: 'https://www.9922.co.kr/parts' },
];

const ENGLISH_NAMES = {
  딥블랙갈릭치킨: 'deep-black-garlic-chicken',
  깐쇼킹치킨: 'kkansho-king-chicken',
  맵시크치킨: 'map-chic-chicken',
  크리스피골드: 'crispy-gold',
  수라깐풍치킨: 'sura-kkanpung-chicken',
  요거치즈닝치킨: 'yogurt-cheese-seasoning-chicken',
  타코마요치킨: 'taco-mayo-chicken',
  레몬크림탕슈: 'lemon-cream-tangsu',
  간장치킨: 'soy-sauce-chicken',
  매운간장치킨: 'spicy-soy-sauce-chicken',
  후라이드치킨: 'fried-chicken',
  양념치킨: 'yangnyeom-chicken',
  매운양념치킨: 'spicy-yangnyeom-chicken',
  청양고추마요치킨: 'cheongyang-mayo-chicken',
  '쉬림프미니튀김(칠리)': 'shrimp-mini-fry-chili',
  '쉬림프미니튀김(레몬크림)': 'shrimp-mini-fry-lemon-cream',
  체다마요감자튀김: 'cheddar-mayo-fries',
  치폴레감자튀김: 'chipotle-fries',
  크리스피치킨넥: 'crispy-chicken-neck',
  통살가득텐더킹: 'tender-king',
  똥집미니튀김: 'mini-fried-gizzard',
  감자볼튀김: 'potato-ball-fry',
  치즈볼2종세트: 'two-cheese-ball-set',
  허니갈릭치즈볼: 'honey-garlic-cheese-ball',
  트리플치즈볼: 'triple-cheese-ball',
  마늘떡볶이: 'garlic-tteokbokki',
  로제비엔나떡볶이: 'rose-vienna-tteokbokki',
  감자튀김: 'fries',
  치킨무: 'pickled-radish',
  '플라윙세트(윙+봉)': 'flawing-set-wing-bong',
  똥집튀김: 'fried-gizzard',
  닭발튀김: 'fried-chicken-feet',
  '다리(스틱)': 'drumstick',
  '윙+다리': 'wing-and-drumstick',
  호식이안심텐더: 'hosigi-tender',
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
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(value) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/치킨$/g, '치킨')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .trim();
}

function allergenLookupName(value) {
  const normalized = normalizeName(value)
    .replace(/\(안심순살\)/g, '')
    .replace(/\(칠리\)/g, '-칠리')
    .replace(/\(레몬크림\)/g, '-레몬크림')
    .replace(/^호식이안심텐더$/g, '안심텐더')
    .replace(/^똥집미니튀김$/g, '똥집미니튀김(핫소스)');
  return normalized;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function splitAllergy(value) {
  if (!value || String(value).includes('페닐알라닌')) {
    return [];
  }
  return String(value)
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
    나류: 'egg',
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
    홍합: 'shellfish',
    전복: 'shellfish',
    굴: 'shellfish',
    아황산류: 'sulfite',
    아황산: 'sulfite',
    오징어: 'squid',
    게: 'crab',
    메밀: 'buckwheat',
    복숭아: 'peach',
    호두: 'walnut',
    고등어: 'mackerel',
  };
  return map[normalized] ?? null;
}

function parseMenuItems(html, page) {
  return html
    .split(/<div class="_item item_gallary "[^>]*>/)
    .slice(1)
    .map((block) => {
      const h4 = block.match(/<h4>([\s\S]*?)<\/h4>/)?.[1];
      if (!h4) return null;

      const rawName = stripHtml(h4.replace(/<span[\s\S]*$/i, ''));
      const canonicalName = normalizeName(rawName);
      const note = stripHtml(h4.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? '');
      const description = stripHtml(block.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '');
      const href = block.match(/<a[^>]+href="([^"]+)"/)?.[1] ?? '';
      const imageUrl = block.match(/data-src="([^"]+)"/)?.[1] ?? '';

      return {
        pageSlug: page.slug,
        pageName: page.name,
        sourcePageUrl: page.url,
        sourceProductUrl: href.startsWith('http') ? href : `https://www.9922.co.kr${href}`,
        menuName: canonicalName,
        displayName: rawName,
        englishName: ENGLISH_NAMES[canonicalName] ?? slugify(canonicalName),
        description,
        note: note || null,
        menuImageUrl: imageUrl,
      };
    })
    .filter(Boolean);
}

function parseAllergens(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const allergenRe =
    /(메밀|밀|대두|호두|땅콩|복숭아|토마토|돼지고기|난류|나류|계란|우유|닭고기|쇠고기|새우|고등어|홍합|전복|굴|조개류|게|오징어|아황산|잣|페닐알라닌)/;
  const skip = new Set(['메뉴명', '분류', '치', '킨', '사', '이', '드', '기', '타']);
  const result = new Map();

  for (let index = 0; index < text.length - 1; index += 1) {
    const menuName = text[index];
    const allergy = text[index + 1];
    if (
      skip.has(menuName) ||
      allergenRe.test(menuName) ||
      !allergenRe.test(allergy) ||
      menuName.includes('알레르기') ||
      menuName.includes('유발')
    ) {
      continue;
    }

    result.set(normalizeName(menuName), allergy);
  }

  // The current table has a duplicated first row label; keep the older explicit row for this item.
  if (!result.has('딥블랙갈릭치킨')) {
    result.set('딥블랙갈릭치킨', '밀, 대두, 닭고기');
  }

  return result;
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

async function requireSingle(client, table, query) {
  const { data, error } = await query.single();
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  return data;
}

async function uploadImage(client, menu, bucketIsPublic) {
  const localPath = path.join(ROOT, 'public', menu.localImagePath.replace(/^\//, ''));
  const storagePath = `${BRAND_SLUG}/${path.basename(menu.localImagePath)}`;
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

  const pageHtml = await Promise.all(PAGES.map(async (page) => [page, await (await fetch(page.url)).text()]));
  const allergyHtml = await (await fetch('https://www.9922.co.kr/allergenic-component')).text();
  const allergyByName = parseAllergens(allergyHtml);

  const records = [];
  const usedSlugs = new Set();
  for (const [page, html] of pageHtml) {
    for (const item of parseMenuItems(html, page)) {
      const lookup = allergenLookupName(item.menuName);
      const allergy = allergyByName.get(lookup) ?? null;
      item.englishName =
        ENGLISH_NAMES[item.menuName] ??
        ENGLISH_NAMES[lookup] ??
        slugify(item.menuName);
      let imageSlug = slugify(`${BRAND_SLUG}-${item.englishName}`);
      if (usedSlugs.has(imageSlug)) {
        imageSlug = `${imageSlug}-${page.slug}`;
      }
      usedSlugs.add(imageSlug);

      const fileName = `${imageSlug}.png`;
      const localImagePath = `/assets/menus/${BRAND_SLUG}/${fileName}`;
      await downloadPng(item.menuImageUrl, path.join(IMAGE_DIR, fileName), imageSlug);

      records.push({
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        ...item,
        sourceAllergenUrl: 'https://www.9922.co.kr/allergenic-component',
        localImagePath,
        allergy,
        allergens: splitAllergy(allergy),
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
  const category = await requireSingle(
    client,
    'categories',
    client.from('categories').select('id, slug').eq('slug', 'chicken'),
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
          title: 'Hosigi official menu allergy data',
          source_type: 'official_page',
          url: 'https://www.9922.co.kr/allergenic-component',
          checked_at: CHECKED_AT,
          note: 'Collected from Hosigi menu pages and official allergen page.',
        },
        { onConflict: 'brand_id,source_type,url' },
      )
      .select('id'),
  );

  const { data: allergens, error: allergensError } = await client.from('allergens').select('id, code');
  if (allergensError) throw allergensError;
  const allergenByCode = new Map(allergens.map((allergen) => [allergen.code, allergen.id]));

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
  const updated = [];
  const allergenRows = [];

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    const lookupKeys = [
      normalizeName(record.menuName),
      allergenLookupName(record.menuName),
      normalizeName(record.menuName).replace(/^호식이/, ''),
    ];
    const matches = [
      ...new Map(
        lookupKeys
          .flatMap((key) => existingByName.get(key) ?? [])
          .map((row) => [row.id, row]),
      ).values(),
    ];

    let targetRows = matches;
    if (targetRows.length === 0) {
      const slugBase = `${BRAND_SLUG}-${slugify(record.englishName || record.menuName)}`;
      const row = await requireSingle(
        client,
        'menus',
        client
          .from('menus')
          .upsert(
            {
              brand_id: brand.id,
              category_id: category.id,
              slug: slugBase,
              name: record.menuName,
              description: record.description,
              image_url: imageUrl,
              menu_status: 'active',
              source_url: record.sourceProductUrl,
              last_checked_at: CHECKED_AT,
              is_active: true,
            },
            { onConflict: 'slug' },
          )
          .select('id, slug, name'),
      );
      targetRows = [row];
      inserted.push(row.slug);
    }

    for (const row of targetRows) {
      const { error } = await client
        .from('menus')
        .update({
          description: record.description,
          image_url: imageUrl,
          source_url: record.sourceProductUrl,
          last_checked_at: CHECKED_AT,
          is_active: true,
        })
        .eq('id', row.id);
      if (error) throw error;
      touchedIds.push(row.id);
      updated.push(row.slug);

      const codes = new Set(record.allergens.map(mapAllergenNameToCode).filter(Boolean));
      for (const code of codes) {
        const allergenId = allergenByCode.get(code);
        if (!allergenId) throw new Error(`Missing allergen code "${code}" for ${record.menuName}`);
        allergenRows.push({
          menu_id: row.id,
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
  }
  const uniqueAllergenRows = [
    ...new Map(
      allergenRows.map((row) => [
        `${row.menu_id}:${row.allergen_id}:${row.presence_type}`,
        row,
      ]),
    ).values(),
  ];

  if (uniqueAllergenRows.length > 0) {
    const { error } = await client.from('menu_allergens').insert(uniqueAllergenRows);
    if (error) throw error;
  }

  const { error: brandError } = await client
    .from('brands')
    .update({
      allergen_source_url: 'https://www.9922.co.kr/allergenic-component',
      official_url: 'https://www.9922.co.kr',
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
    allergenRows: uniqueAllergenRows.length,
  };
}

const records = await collect();
const result = await importToSupabase(records);
console.log(JSON.stringify(result, null, 2));
