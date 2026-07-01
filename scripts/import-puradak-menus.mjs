import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BRAND_SLUG = 'puradak';
const BRAND_NAME = '푸라닭';
const BUCKET = 'menus';
const CHECKED_AT = '2026-07-01';
const BASE_URL = 'https://puradakchicken.com';
const CHICKEN_URL = `${BASE_URL}/menu/product.asp?sermode=0`;
const SIDE_URL = `${BASE_URL}/menu/product.asp?sermode=1`;
const DATA_FILE = path.join(ROOT, 'datas', 'menu_puradak.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'menus', BRAND_SLUG);
const TMP_DIR = path.join(IMAGE_DIR, '.tmp');

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
};

const ALLERGEN_LABELS = {
  chicken: '닭고기',
  egg: '알류',
  milk: '우유',
  peanut: '땅콩',
  walnut: '호두',
  soybean: '대두',
  wheat: '밀',
  shrimp: '새우',
  pork: '돼지고기',
  beef: '쇠고기',
  tomato: '토마토',
  buckwheat: '메밀',
  peach: '복숭아',
  sulfite: '아황산류',
  mackerel: '고등어',
  crab: '게',
  squid: '오징어',
  shellfish: '조개류',
};

const A = {
  thin: ['chicken', 'milk', 'soybean', 'wheat', 'shrimp', 'beef', 'sulfite'],
  mayopino: ['chicken', 'egg', 'milk', 'soybean', 'wheat', 'beef'],
  cheeseReason: ['chicken', 'egg', 'milk', 'soybean', 'wheat', 'beef', 'sulfite'],
  blackAglio: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'shellfish'],
  consomazing: ['chicken', 'milk', 'soybean', 'wheat', 'beef'],
  gochuMayo: ['chicken', 'egg', 'milk', 'soybean', 'wheat', 'beef'],
  napoliToowoomba: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato'],
  ilpumKkanpung: ['chicken', 'milk', 'peanut', 'soybean', 'wheat', 'pork', 'beef', 'shellfish'],
  mabulroDevil: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato'],
  mamachi: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'sulfite', 'shellfish'],
  pabulro: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato', 'sulfite', 'shellfish'],
  sweetYangnyeom: ['chicken', 'milk', 'peanut', 'soybean', 'wheat', 'beef', 'tomato'],
  blackMabulro: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato', 'shellfish'],
  blackMayo: ['chicken', 'egg', 'milk', 'soybean', 'wheat', 'beef', 'shellfish'],
  blackToowoomba: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato', 'shellfish'],
  gPie: ['chicken', 'soybean', 'wheat', 'beef', 'sulfite', 'shellfish'],
  tacoBall: ['chicken', 'peanut', 'soybean', 'wheat', 'tomato'],
  detroitPizza: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato'],
  blackCheeseBall: ['chicken', 'egg', 'soybean', 'wheat'],
  creamCheeseBall: ['chicken', 'egg', 'soybean', 'wheat', 'beef', 'squid', 'shellfish'],
  baconPotatoBall: ['chicken', 'milk', 'soybean', 'wheat', 'beef', 'tomato', 'sulfite', 'shellfish'],
  friedJinmichae: ['egg', 'milk', 'soybean', 'wheat'],
  regularCut: ['egg', 'milk', 'soybean', 'wheat', 'squid'],
  shrimpSkewer: ['egg', 'milk', 'soybean', 'wheat', 'pork', 'beef', 'sulfite', 'shellfish'],
  potatoMix: ['soybean', 'wheat', 'beef', 'squid'],
  fishcakeSoup: ['soybean', 'wheat'],
  friedChickenFeet: ['soybean', 'wheat'],
  clamSoup: ['milk', 'soybean', 'wheat', 'shrimp'],
  spicyChickenFeetSoup: ['soybean', 'wheat'],
  kielbasa: ['egg', 'milk', 'soybean', 'wheat', 'pork', 'beef', 'tomato'],
  threeColorSkewer: ['chicken', 'egg', 'milk', 'soybean', 'wheat', 'pork', 'beef', 'shellfish'],
  yellowPeach: ['peach'],
  gochuMayoPollack: ['egg', 'milk', 'peanut', 'walnut', 'soybean', 'wheat', 'pork', 'beef', 'shellfish'],
  bigCheeseStick: ['milk', 'soybean', 'wheat'],
  blackCheeseStick: ['milk', 'soybean', 'wheat', 'beef'],
  oilTteokSweet: ['peanut', 'soybean', 'wheat', 'tomato'],
  oilTteokBlack: ['chicken', 'soybean', 'wheat', 'beef', 'shellfish'],
  oilTteokRed: ['milk', 'soybean', 'wheat', 'beef', 'tomato'],
  oilTteokToowoomba: ['chicken', 'milk', 'soybean', 'wheat', 'tomato'],
  oilTteokKkanpung: ['chicken', 'peanut', 'soybean', 'wheat', 'pork', 'shellfish'],
  yumineTteok: ['milk', 'soybean', 'wheat', 'shrimp', 'beef', 'shellfish'],
  spicySoupTteok: ['egg', 'milk', 'soybean', 'wheat', 'beef'],
  napoliPasta: ['egg', 'milk', 'soybean', 'beef'],
  golbaengiNoodle: ['egg', 'soybean', 'wheat'],
  flyingFishRice: ['milk', 'soybean', 'wheat', 'beef', 'tomato'],
  bottleFries: ['soybean', 'wheat', 'tomato'],
  coleslaw: ['egg', 'milk', 'soybean', 'shellfish'],
  gochuMayoSauce: ['egg', 'milk', 'soybean', 'wheat', 'shellfish'],
};

const ALLERGY_BY_KEY = {
  마마치: A.mamachi,
  마요피뇨: A.mayopino,
  고추마요: A.gochuMayo,
  고추마요치킨: A.gochuMayo,
  파불로: A.pabulro,
  파불로치킨: A.pabulro,
  일품깐풍: A.ilpumKkanpung,
  나폴리투움바: A.napoliToowoomba,
  치즈인이유: A.cheeseReason,
  씬후라이드: A.thin,
  블랙알리오: A.blackAglio,
  콘소메이징: A.consomazing,
  마불로악마: A.mabulroDevil,
  달콤양념치킨: A.sweetYangnyeom,
  달콤양념: A.sweetYangnyeom,
  블랙마요: A.blackMayo,
  블랙투움바: A.blackToowoomba,
  블랙마불로: A.blackMabulro,
  블랙: A.blackAglio,
  파불로에반하다: union(A.pabulro, A.thin, A.gochuMayoSauce),
  마불로악마에반하다: union(A.mabulroDevil, A.thin, A.gochuMayoSauce),
  블랙알리오에반하다: union(A.blackAglio, A.thin, A.gochuMayoSauce),
  푸라닭에반하다: union(A.thin, A.blackAglio, A.gochuMayoSauce),
  지파이: A.gPie,
  디트로이트피자: A.detroitPizza,
  매콤국물떡볶이: A.spicySoupTteok,
  기름떡볶이깐풍: A.oilTteokKkanpung,
  타코볼4구: A.tacoBall,
  블랙치즈스틱4개: A.blackCheeseStick,
  코울슬로: A.coleslaw,
  유미네떡볶이오리지널: A.yumineTteok,
  블랙치즈볼5구: A.blackCheeseBall,
  크림치즈볼5구: A.creamCheeseBall,
  베이컨감자볼5구: A.baconPotatoBall,
  기름떡볶이투움바: A.oilTteokToowoomba,
  기름떡볶이레드블랙달콤: union(A.oilTteokRed, A.oilTteokBlack, A.oilTteokSweet),
  빅치즈스틱1개: A.bigCheeseStick,
  레귤러컷: A.regularCut,
  레귤러컷배달: A.regularCut,
  꼬친새우: A.shrimpSkewer,
  모둠감자: A.potatoMix,
  모둠감자배달: A.potatoMix,
  후라잉닭발배달: A.friedChickenFeet,
  후라잉닭발: A.friedChickenFeet,
  일품백합탕: A.clamSoup,
  일품어묵탕: A.fishcakeSoup,
  매콤국물닭발: A.spicyChickenFeetSoup,
  수제킬바사소시지: A.kielbasa,
  '3색닭꼬치': A.threeColorSkewer,
  땡큐베리황도: A.yellowPeach,
  고추마요먹태믹스넛: A.gochuMayoPollack,
  후라잉진미채: A.friedJinmichae,
  쥐포구이: [],
  고추마요소스보틀240g: A.gochuMayoSauce,
};

function union(...lists) {
  return [...new Set(lists.flat())];
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
    } catch {}
  }
  return { ...env, ...process.env };
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return cleanText(value)
    .replace(/\s+/g, '')
    .replace(/[()（）/&,.]/g, '')
    .replace(/&amp;/g, '')
    .toLowerCase();
}

function allergyKey(value) {
  return cleanText(value)
    .replace(/^순\(다리\)살\s*/, '')
    .replace(/\s*윙콤보$/, '')
    .replace(/\s*\(배달\)$/, '배달')
    .replace(/\s+/g, '')
    .replace(/[()（）/&,.]/g, '')
    .replace(/치킨$/, '치킨');
}

function allergenNames(codes) {
  return (codes ?? []).map((code) => ALLERGEN_LABELS[code]).filter(Boolean);
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

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function resolveUrl(url) {
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
      "from PIL import Image\nimport sys\nimg = Image.open(sys.argv[1])\nif getattr(img, 'is_animated', False): img.seek(0)\nif img.mode not in ('RGB', 'RGBA'): img = img.convert('RGBA')\nimg.save(sys.argv[2], 'PNG')\n",
    encoding: 'utf8',
  });
  if (py.status !== 0) throw new Error(`png convert failed for ${slug}: ${py.stderr || py.stdout}`);
}

function parseCards(html, menuType, page) {
  return [...html.matchAll(/<a href="view\.asp\?idx=(\d+)([^"]*)">([\s\S]*?)<\/a>/g)].map(
    (match) => {
      const [, id, query, block] = match;
      const menuName = cleanText(block.match(/<p class="title one">([\s\S]*?)<\/p>/)?.[1]);
      const englishName = `${BRAND_SLUG}-${slugify(id)}`;
      const imagePath = block.match(/<img src="([^"]+)" class="bg_thumb"/)?.[1] ?? null;
      const codes = ALLERGY_BY_KEY[allergyKey(menuName)] ?? null;
      return {
        brand: BRAND_SLUG,
        brandName: BRAND_NAME,
        sourceCode: id,
        sourcePage: page,
        sourceCategoryUrl: menuType === 1 ? CHICKEN_URL : SIDE_URL,
        sourceProductUrl: resolveUrl(`menu/view.asp?idx=${id}${query}`),
        menuName,
        englishName,
        menuImageUrl: imagePath ? resolveUrl(imagePath) : null,
        localImagePath: imagePath ? `/assets/menus/${BRAND_SLUG}/${englishName}.png` : null,
        categorySlug: 'chicken',
        menuType,
        description: cleanText(block.match(/<p class="txt">([\s\S]*?)<\/p>/)?.[1]) || null,
        allergy: Array.isArray(codes)
          ? codes.length > 0
            ? allergenNames(codes).join(', ')
            : '해당 없음'
          : null,
        allergens: allergenNames(codes),
      };
    },
  );
}

async function collect() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const records = [];
  for (const [menuType, pages] of [
    [1, 5],
    [3, 3],
  ]) {
    for (let page = 1; page <= pages; page += 1) {
      const url = `${BASE_URL}/menu/product.asp?page=${page}&sermode=${menuType === 1 ? 0 : 1}&sermode2=&serdiv=`;
      records.push(...parseCards(await fetchText(url), menuType, page));
    }
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
          official_url: BASE_URL,
          allergen_source_url: CHICKEN_URL,
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
          title: '푸라닭 official menu allergy data',
          source_type: 'official_page',
          url: CHICKEN_URL,
          checked_at: CHECKED_AT,
          note: 'Menu and images collected from official paginated menu pages. Allergens transcribed from attached Puradak allergy table VER.260625C, with duplicate menu variants mapped by base menu.',
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
      allergen_source_url: CHICKEN_URL,
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
const result = await importToSupabase(records);
console.log(JSON.stringify(result, null, 2));
