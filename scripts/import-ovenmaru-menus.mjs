import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'ovenmaru';
const BRAND_NAME = '오븐마루';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-02';
const BASE_URL = 'https://ovenmaru.com';
const OFFICIAL_URL = 'https://www.ovenmaru.com';
const MENU_URL = `${BASE_URL}/html/menu.html`;
const POPUP_URL = `${BASE_URL}/resource/menuPopup.php`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_ovenmaru.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const MENU_SECTIONS = [
  { className: 'menu_2', sourceCategory: '로스트치킨', menuType: 1 },
  { className: 'menu_3', sourceCategory: '베이크치킨', menuType: 1 },
  { className: 'menu_4', sourceCategory: '스페셜메뉴', menuType: 1 },
  { className: 'menu_5', sourceCategory: '사이드 및 기타메뉴', menuType: 3 },
];

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

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
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
    .replace(/\s+/g, '')
    .replace(/[()（）/&,.·・]/g, '')
    .toLowerCase();
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
    조개류: 'shellfish',
    굴: 'shellfish',
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
  if (!value || /정보\s*준비중/.test(value)) return [];
  return String(value)
    .replace(/[|,]/g, '/')
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
}

function absoluteUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, BASE_URL).toString();
}

async function fetchText(url, options = {}) {
  const cachePath = options.cachePath;
  if (process.env.OVENMARU_USE_CACHE === '1' && cachePath) {
    try {
      return await fs.readFile(cachePath, 'utf8');
    } catch {}
  }
  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        ...HEADERS,
        ...(options.method === 'POST'
          ? { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }
          : {}),
      },
      body: options.body,
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    const text = await response.text();
    if (cachePath) await fs.writeFile(cachePath, text, 'utf8');
    return text;
  } catch (error) {
    const curlArgs = ['-sL', url, '-A', HEADERS['user-agent']];
    if (options.method === 'POST') {
      curlArgs.push('--data', options.body ?? '');
    }
    const curl = spawnSync('curl', curlArgs, { encoding: 'utf8' });
    if (curl.status === 0 && curl.stdout) {
      if (cachePath) await fs.writeFile(cachePath, curl.stdout, 'utf8');
      return curl.stdout;
    }
    if (cachePath) {
      try {
        return await fs.readFile(cachePath, 'utf8');
      } catch {}
    }
    throw new Error(`fetch failed for ${url}: ${error.message}`);
  }
}

async function downloadPng(url, dest, slug) {
  if (process.env.OVENMARU_SKIP_DOWNLOAD === '1') return;
  const rawPath = path.join(TMP_DIR, `${slug}-raw`);
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) throw new Error(`image ${response.status} ${url}`);
    await fs.writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
  } catch {
    const curl = spawnSync('curl', ['-sL', url, '-A', HEADERS['user-agent'], '-o', rawPath], {
      encoding: 'utf8',
    });
    if (curl.status !== 0) throw new Error(`image download failed for ${slug}: ${curl.stderr || curl.stdout}`);
  }
  const py = spawnSync('python3', ['-', rawPath, dest], {
    input:
      "from PIL import Image\nimport sys\nimg = Image.open(sys.argv[1])\nif getattr(img, 'is_animated', False): img.seek(0)\nif img.mode not in ('RGB', 'RGBA'): img = img.convert('RGBA')\nimg.save(sys.argv[2], 'PNG')\n",
    encoding: 'utf8',
  });
  if (py.status !== 0) throw new Error(`png convert failed for ${slug}: ${py.stderr || py.stdout}`);
}

function sectionBlock(html, className) {
  const marker = new RegExp(`<div class="${className}\\s+menu_inner[\\s\\S]*?>`);
  const match = marker.exec(html);
  if (!match) return '';
  const afterStart = html.slice(match.index + match[0].length);
  const next = afterStart.search(new RegExp(`<div class="menu_[0-9]+\\s+menu_inner`, 'g'));
  if (next >= 0) return match[0] + afterStart.slice(0, next);
  const end = afterStart.search(/<\/section>/i);
  return match[0] + (end >= 0 ? afterStart.slice(0, end) : afterStart);
}

function parseSection(html, section) {
  const block = sectionBlock(html, section.className);
  const cards = [...block.matchAll(/<a href="#none" class="menuPopupOpen" data-idx="([^"]+)">([\s\S]*?)<\/a>/g)];
  return cards.map(([, idx, card]) => {
    const listImageUrl = absoluteUrl(
      card.match(/background-image:url\(['"]?([^'")]+)['"]?\)/)?.[1] ?? null,
    );
    const menuName = cleanText(card.match(/<p class="menu_name[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1]);
    const englishName = `${BRAND_SLUG}-${idx}`;
    return {
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceCode: idx,
      sourceCategory: section.sourceCategory,
      sourceCategoryUrl: MENU_URL,
      sourceProductUrl: `${MENU_URL}#idx-${idx}`,
      menuName,
      englishName,
      menuImageUrl: listImageUrl,
      popupImageUrls: [],
      localImagePath: listImageUrl ? `/assets/menus/${BRAND_SLUG}/${englishName}.png` : null,
      categorySlug: 'chicken',
      menuType: section.menuType,
      description: null,
      allergy: null,
      allergens: [],
      origin: null,
    };
  });
}

function parsePopup(html) {
  const name = cleanText(html.match(/<p class="menu_list_name">([\s\S]*?)<\/p>/)?.[1]) || null;
  const description = cleanText(html.match(/<p class="menu_txt">([\s\S]*?)<\/p>/)?.[1]) || null;
  const popupImageUrls = [
    ...html.matchAll(/class="menuPopup_img[^"]*"[^>]*background-image:url\(['"]?([^'")]+)['"]?\)/g),
  ].map((match) => absoluteUrl(match[1]));
  const infoTexts = [...html.matchAll(/<p class="menu_info_box_txt">\s*([\s\S]*?)\s*<\/p>/g)].map((match) =>
    cleanText(match[1]),
  );
  const allergy = infoTexts[0] && !/정보\s*준비중/.test(infoTexts[0]) ? infoTexts[0] : null;
  return {
    name,
    description,
    popupImageUrls,
    allergy,
    allergens: splitAllergy(allergy),
    origin: infoTexts[2] && !/정보\s*준비중/.test(infoTexts[2]) ? infoTexts[2] : null,
  };
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const html = await fetchText(MENU_URL, { cachePath: '/private/tmp/ovenmaru_menu.html' });
  const records = MENU_SECTIONS.flatMap((section) => parseSection(html, section)).filter(
    (record) => record.sourceCode && record.menuName,
  );

  for (const record of records) {
    let popupHtml = '';
    try {
      popupHtml = await fetchText(POPUP_URL, {
        method: 'POST',
        body: new URLSearchParams({ idx: record.sourceCode }).toString(),
        cachePath: `/private/tmp/ovenmaru_popup_${record.sourceCode}.html`,
      });
    } catch (error) {
      if (process.env.OVENMARU_ALLOW_MISSING_POPUPS !== '1') throw error;
    }
    if (!popupHtml) continue;
    const popup = parsePopup(popupHtml);
    record.menuName = popup.name || record.menuName;
    record.description = popup.description;
    record.popupImageUrls = popup.popupImageUrls;
    record.menuImageUrl = popup.popupImageUrls[0] ?? record.menuImageUrl;
    record.localImagePath = record.menuImageUrl ? `/assets/menus/${BRAND_SLUG}/${record.englishName}.png` : null;
    record.allergy = popup.allergy;
    record.allergens = popup.allergens;
    record.origin = popup.origin;
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
          official_url: OFFICIAL_URL,
          allergen_source_url: MENU_URL,
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
          title: '오븐마루 official menu allergy data',
          source_type: 'official_page',
          url: MENU_URL,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from the official menu page. Allergens collected from each menu popup allergy panel.',
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
      official_url: OFFICIAL_URL,
      allergen_source_url: MENU_URL,
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
if (process.env.OVENMARU_SKIP_IMPORT === '1') {
  const missingAllergies = records
    .filter((record) => !record.allergy && record.allergens.length === 0)
    .map((record) => record.menuName);
  const unknownAllergens = [
    ...new Set(records.flatMap((record) => record.allergens).filter((name) => !mapAllergenNameToCode(name))),
  ];
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
        unknownAllergens,
      },
      null,
      2,
    ),
  );
} else {
  const result = await importToSupabase(records);
  console.log(JSON.stringify(result, null, 2));
}
