import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BUCKET = 'menus';
const SOURCE_ROOT = path.join(ROOT, 'public', 'assets', 'menus');
const OUTPUT_ROOT = path.join(ROOT, 'public', 'assets', 'menus-optimized');
const MAIN_MAX_EDGE = 1200;
const MAIN_QUALITY = 80;
const THUMB_MAX_EDGE = 480;
const THUMB_QUALITY = 75;

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const FORCE = args.has('--force');
const BRAND_ARG = process.argv.find((arg) => arg.startsWith('--brand='))?.split('=')[1] ?? null;

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

function storagePathFromUrl(value) {
  if (!value) return null;
  const match = String(value).match(/\/storage\/v1\/object\/(?:sign|public)\/menus\/([^?]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function byteSize(filePath) {
  return (await fs.stat(filePath)).size;
}

function formatBytes(value) {
  if (value > 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
  if (value > 1024) return `${Math.round(value / 1024)}KB`;
  return `${value}B`;
}

async function optimizeImage(sourcePath, outputPath, maxEdge, quality) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const py = spawnSync(
    'python3',
    [
      '-',
      sourcePath,
      outputPath,
      String(maxEdge),
      String(quality),
    ],
    {
      input:
        "from PIL import Image\nimport sys\nsrc,dst,max_edge,quality=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])\nimg=Image.open(src)\nif getattr(img,'is_animated',False): img.seek(0)\nimg=img.convert('RGBA')\nw,h=img.size\nscale=min(1.0, max_edge / max(w,h))\nif scale < 1.0:\n    img=img.resize((max(1,round(w*scale)), max(1,round(h*scale))), Image.Resampling.LANCZOS)\nbackground=Image.new('RGB', img.size, (255,255,255))\nif img.mode == 'RGBA':\n    background.paste(img, mask=img.getchannel('A'))\nelse:\n    background.paste(img)\nbackground.save(dst, 'WEBP', quality=quality, method=6)\n",
      encoding: 'utf8',
    },
  );
  if (py.status !== 0) {
    throw new Error(`optimize failed for ${sourcePath}: ${py.stderr || py.stdout}`);
  }
}

async function withRetry(label, task, attempts = 4) {
  let lastError;
  for (let index = 1; index <= attempts; index += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (index === attempts) break;
      const delayMs = 500 * index * index;
      console.warn(`${label} failed (${index}/${attempts}), retrying in ${delayMs}ms: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function uploadWebp(client, storagePath, localPath, bucketIsPublic) {
  await withRetry(`storage upload ${storagePath}`, async () => {
    const { error } = await client.storage.from(BUCKET).upload(storagePath, await fs.readFile(localPath), {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: true,
    });
    if (error) throw new Error(error.message);
  });
  if (bucketIsPublic) return client.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  return withRetry(`storage signed url ${storagePath}`, async () => {
    const { data, error: signedError } = await client.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
    if (signedError) throw new Error(signedError.message);
    return data.signedUrl;
  });
}

async function main() {
  const env = await loadEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Set Supabase URL and service role key before running this script.');

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
  if (bucketsError) throw bucketsError;
  const bucket = buckets.find((item) => item.id === BUCKET || item.name === BUCKET);
  if (!bucket) throw new Error(`Storage bucket "${BUCKET}" does not exist.`);

  let menuQuery = client
    .from('menus')
    .select('id, name, image_url, brands!inner(slug)')
    .eq('is_active', true)
    .not('image_url', 'is', null);
  if (BRAND_ARG) menuQuery = menuQuery.eq('brands.slug', BRAND_ARG);

  const { data: menus, error: menusError } = await menuQuery;
  if (menusError) throw menusError;

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    brands: new Set(),
    scannedMenus: menus.length,
    optimized: 0,
    skipped: [],
    originalBytes: 0,
    mainBytes: 0,
    thumbBytes: 0,
  };

  for (const menu of menus) {
    const brandSlug = menu.brands.slug;
    report.brands.add(brandSlug);
    const storagePath = storagePathFromUrl(menu.image_url);
    if (!storagePath) {
      report.skipped.push({ menu: menu.name, reason: 'unparseable image_url' });
      continue;
    }
    if (!FORCE && path.extname(storagePath).toLowerCase() === '.webp') {
      report.skipped.push({ menu: menu.name, reason: 'already optimized webp' });
      continue;
    }
    const fileName = path.basename(storagePath);
    const sourcePath = path.join(SOURCE_ROOT, brandSlug, fileName);
    if (!(await fileExists(sourcePath))) {
      report.skipped.push({ menu: menu.name, reason: `missing local source ${brandSlug}/${fileName}` });
      continue;
    }

    const baseName = path.basename(fileName, path.extname(fileName));
    const mainLocalPath = path.join(OUTPUT_ROOT, brandSlug, `${baseName}.webp`);
    const thumbLocalPath = path.join(OUTPUT_ROOT, brandSlug, 'thumbs', `${baseName}.webp`);
    await optimizeImage(sourcePath, mainLocalPath, MAIN_MAX_EDGE, MAIN_QUALITY);
    await optimizeImage(sourcePath, thumbLocalPath, THUMB_MAX_EDGE, THUMB_QUALITY);

    const originalSize = await byteSize(sourcePath);
    const mainSize = await byteSize(mainLocalPath);
    const thumbSize = await byteSize(thumbLocalPath);
    report.originalBytes += originalSize;
    report.mainBytes += mainSize;
    report.thumbBytes += thumbSize;
    report.optimized += 1;

    if (APPLY) {
      const mainStoragePath = `${brandSlug}/${baseName}.webp`;
      const thumbStoragePath = `${brandSlug}/thumbs/${baseName}.webp`;
      const imageUrl = await uploadWebp(client, mainStoragePath, mainLocalPath, bucket.public);
      await uploadWebp(client, thumbStoragePath, thumbLocalPath, bucket.public);
      await withRetry(`menus.image_url update ${menu.id}`, async () => {
        const { error: updateError } = await client.from('menus').update({ image_url: imageUrl }).eq('id', menu.id);
        if (updateError) throw updateError;
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        brands: [...report.brands].sort(),
        original: formatBytes(report.originalBytes),
        optimizedMain: formatBytes(report.mainBytes),
        optimizedThumbs: formatBytes(report.thumbBytes),
        mainSavingsPercent:
          report.originalBytes > 0 ? Math.round((1 - report.mainBytes / report.originalBytes) * 1000) / 10 : 0,
        thumbSavingsPercent:
          report.originalBytes > 0 ? Math.round((1 - report.thumbBytes / report.originalBytes) * 1000) / 10 : 0,
        note: APPLY
          ? 'Uploaded optimized WebP originals and thumbnails; menus.image_url now points to optimized originals.'
          : 'Dry run only. Re-run with --apply to upload and update menus.image_url.',
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
