import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getMenuType } from './menu-type.mjs';

const ROOT = process.cwd();
const BRAND_SLUG = '60chicken';
const BRAND_NAME = '60계치킨';
const BUCKET = 'menus';
const CHECKED_AT = '2026-06-30';
const BASE_URL = 'https://www.60chicken.co.kr';
const MENU_URL = `${BASE_URL}/bbs/content.php?co_id=menu`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_60chicken.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

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
    } catch {
      // Optional env files.
    }
  }
  return { ...env, ...process.env };
}

function section(html, start, end) {
  return html.match(new RegExp(`${start}([\\s\\S]*?)${end}`))?.[1] ?? '';
}

function removeComments(value) {
  return value.replace(/<!--[\s\S]*?-->/g, '');
}

function listItems(value) {
  return [...value.matchAll(/<li(?:\s+class="[^"]*")?>([\s\S]*?)<\/li>/g)].map(
    (match) => match[1],
  );
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

function cleanHtml(value) {
  return decodeEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function cleanText(value) {
  return cleanHtml(value).replace(/\s+/g, ' ').trim();
}

function getInnerHtml(block, className) {
  return block.match(new RegExp(`<p class="${className}">([\\s\\S]*?)<\\/p>`))?.[1] ?? '';
}

function normalizeName(value) {
  return cleanText(value)
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function stripMenuVariant(value) {
  return cleanText(value).replace(/\s*\([^)]*\)\s*$/g, '').trim();
}

function resolveImageUrl(src) {
  if (!src) return null;
  return new URL(src, MENU_URL).toString();
}

function mapAllergenNameToCode(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, '');
  const map = {
    알류: 'egg',
    난류: 'egg',
    나류: 'egg',
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

function allergenNames(value) {
  if (!value || /해당\s*없음|해당\s*없슴/.test(value)) {
    // Some products contain mixed lines, so do not return early.
  }

  const patterns = [
    ['메밀', 'buckwheat'],
    ['땅콩', 'peanut'],
    ['대두', 'soybean'],
    ['밀', 'wheat'],
    ['고등어', 'mackerel'],
    ['게', 'crab'],
    ['새우', 'shrimp'],
    ['돼지고기', 'pork'],
    ['복숭아', 'peach'],
    ['토마토', 'tomato'],
    ['아황산류', 'sulfite'],
    ['이산화황', 'sulfite'],
    ['호두', 'walnut'],
    ['닭고기', 'chicken'],
    ['쇠고기', 'beef'],
    ['소고기', 'beef'],
    ['오징어', 'squid'],
    ['조개류', 'shellfish'],
    ['우유', 'milk'],
    ['달걀', 'egg'],
    ['계란', 'egg'],
    ['난류', 'egg'],
  ];

  const found = [];
  for (const [name, code] of patterns) {
    if (value.includes(name) && !found.some((item) => item.code === code)) {
      found.push({ name, code });
    }
  }
  return found.map((item) => item.name);
}

function slugFromIndex(index) {
  return `${BRAND_SLUG}-${String(index + 1).padStart(3, '0')}`;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.text();
}

async function downloadPng(url, dest, slug) {
  const rawPath = path.join(TMP_DIR, `${slug}-raw`);
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`image ${response.status} ${url}`);
  }

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

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const html = await fetchText(MENU_URL);
  const buttonItems = listItems(
    removeComments(section(html, '<div class="btnlist">', '<!--버튼리스트끝-->')),
  );
  const popupItems = listItems(
    removeComments(section(html, '<div class="popup">', '<!--팝업리스트끝-->')),
  );

  if (buttonItems.length === 0 || buttonItems.length !== popupItems.length) {
    throw new Error(`Unexpected menu page structure: ${buttonItems.length} list items, ${popupItems.length} popups.`);
  }

  const records = [];
  for (let index = 0; index < buttonItems.length; index += 1) {
    const listItem = buttonItems[index];
    const popupItem = popupItems[index];
    const slug = slugFromIndex(index);
    const menuName = stripMenuVariant(getInnerHtml(popupItem, 'name') || getInnerHtml(listItem, 'name'));
    const listName = cleanText(getInnerHtml(listItem, 'name'));
    const description = cleanText(getInnerHtml(popupItem, 'text') || getInnerHtml(listItem, 'text'));
    const allergy = cleanText(getInnerHtml(popupItem, 'stxt')).replace(/^\[주요 알레르기 성분\]\s*/, '');
    const imageSrc = [...listItem.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]).at(-1);
    const menuImageUrl = resolveImageUrl(imageSrc);
    const localImagePath = menuImageUrl ? `/assets/menus/${BRAND_SLUG}/${slug}.png` : null;

    if (!menuName) {
      throw new Error(`Missing menu name at index ${index + 1}.`);
    }

    if (menuImageUrl) {
      await downloadPng(menuImageUrl, path.join(IMAGE_DIR, `${slug}.png`), slug);
    }

    records.push({
      brand: BRAND_SLUG,
      brandName: BRAND_NAME,
      sourceIndex: index + 1,
      sourceCategoryUrl: MENU_URL,
      sourceProductUrl: MENU_URL,
      menuName,
      sourceMenuName: listName,
      englishName: slug,
      menuImageUrl,
      localImagePath,
      categorySlug: 'chicken',
      menuType: getMenuType({
        brandCategorySlug: 'chicken',
        menuCategorySlug: 'chicken',
        menuName,
      }),
      description,
      allergy,
      allergens: allergenNames(allergy),
    });
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  return records;
}

async function requireSingle(client, table, query) {
  const { data, error } = await query.single();
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  return data;
}

async function uploadImage(client, record, bucketIsPublic) {
  if (!record.localImagePath) {
    return null;
  }

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

  const { data: categories, error: categoriesError } = await client
    .from('categories')
    .select('id, slug');
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
          title: '60계치킨 official menu allergy data',
          source_type: 'official_page',
          url: MENU_URL,
          checked_at: CHECKED_AT,
          note: 'Collected from 60계치킨 official menu page and detail layer popups.',
        },
        { onConflict: 'brand_id,source_type,url' },
      )
      .select('id'),
  );

  const { data: allergenRows, error: allergenError } = await client
    .from('allergens')
    .select('id, code');
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
  const unknownAllergens = new Set();

  for (const record of records) {
    const imageUrl = await uploadImage(client, record, bucket.public);
    if (!imageUrl) {
      missingImages.push(record.menuName);
    }

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

    const { error: deleteAllergenError } = await client
      .from('menu_allergens')
      .delete()
      .in('menu_id', uniqueTouchedIds);
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
      allergen_source_url: MENU_URL,
      origin_source_url: `${BASE_URL}/theme/basic/origin.php`,
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
    unknownAllergens: [...unknownAllergens],
  };
}

const records = await collect();
const result = await importToSupabase(records);
console.log(JSON.stringify(result, null, 2));
