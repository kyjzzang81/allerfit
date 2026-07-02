import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const DEFAULT_BUCKET = 'brands';
const SOURCE_ROOT = path.join(ROOT, 'public', 'assets', 'brands');
const OUTPUT_ROOT = path.join(ROOT, 'public', 'assets', 'brands-optimized');
const MAIN_MAX_EDGE = 512;
const MAIN_QUALITY = 88;
const THUMB_MAX_EDGE = 160;
const THUMB_QUALITY = 84;

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const FORCE = args.has('--force');
const BRAND_ARG = process.argv.find((arg) => arg.startsWith('--brand='))?.split('=')[1] ?? null;
const BUCKET = process.argv.find((arg) => arg.startsWith('--bucket='))?.split('=')[1] ?? DEFAULT_BUCKET;

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

async function listSourceLogos() {
  const categories = await fs.readdir(SOURCE_ROOT, { withFileTypes: true });
  const logos = [];

  for (const category of categories) {
    if (!category.isDirectory()) continue;

    const categorySlug = category.name;
    const categoryDir = path.join(SOURCE_ROOT, categorySlug);
    const files = await fs.readdir(categoryDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;
      if (!/\.(png|jpe?g|webp)$/i.test(file.name)) continue;

      const brandSlug = path.basename(file.name, path.extname(file.name));
      if (BRAND_ARG && brandSlug !== BRAND_ARG) continue;

      logos.push({
        categorySlug,
        brandSlug,
        fileName: file.name,
        sourcePath: path.join(categoryDir, file.name),
      });
    }
  }

  return logos.sort((a, b) =>
    `${a.categorySlug}/${a.brandSlug}`.localeCompare(
      `${b.categorySlug}/${b.brandSlug}`,
      'ko',
    ),
  );
}

async function optimizeLogo(sourcePath, outputPath, maxEdge, quality) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const py = spawnSync(
    'python3',
    ['-', sourcePath, outputPath, String(maxEdge), String(quality)],
    {
      input:
        "from PIL import Image\nimport sys\nsrc,dst,max_edge,quality=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])\nimg=Image.open(src)\nif getattr(img,'is_animated',False): img.seek(0)\nimg=img.convert('RGBA')\nw,h=img.size\nscale=min(1.0, max_edge / max(w,h))\nif scale < 1.0:\n    img=img.resize((max(1,round(w*scale)), max(1,round(h*scale))), Image.Resampling.LANCZOS)\nimg.save(dst, 'WEBP', quality=quality, method=6)\n",
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

async function uploadWebp(client, bucket, storagePath, localPath, bucketIsPublic) {
  await withRetry(`storage upload ${storagePath}`, async () => {
    const { error } = await client.storage.from(bucket).upload(storagePath, await fs.readFile(localPath), {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: true,
    });
    if (error) throw new Error(error.message);
  });

  if (bucketIsPublic) {
    return client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  }

  return withRetry(`storage signed url ${storagePath}`, async () => {
    const { data, error } = await client.storage.from(bucket).createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  });
}

async function createSupabaseClient() {
  const env = await loadEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Set Supabase URL and service role key before running with --apply.');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getBucket(client) {
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;

  const bucket = buckets.find((item) => item.id === BUCKET || item.name === BUCKET);
  if (!bucket) throw new Error(`Storage bucket "${BUCKET}" does not exist.`);

  return bucket;
}

async function main() {
  if (!(await fileExists(SOURCE_ROOT))) {
    throw new Error(`Missing source directory: ${SOURCE_ROOT}`);
  }

  const logos = await listSourceLogos();
  const client = APPLY ? await createSupabaseClient() : null;
  const bucket = client ? await getBucket(client) : null;

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    bucket: BUCKET,
    scannedLogos: logos.length,
    optimized: 0,
    skipped: [],
    originalBytes: 0,
    mainBytes: 0,
    thumbBytes: 0,
  };

  for (const logo of logos) {
    const mainLocalPath = path.join(OUTPUT_ROOT, logo.categorySlug, `${logo.brandSlug}.webp`);
    const thumbLocalPath = path.join(OUTPUT_ROOT, logo.categorySlug, 'thumbs', `${logo.brandSlug}.webp`);

    if (!FORCE && (await fileExists(mainLocalPath)) && (await fileExists(thumbLocalPath))) {
      report.skipped.push({
        brand: logo.brandSlug,
        reason: 'already optimized local webp',
      });
      continue;
    }

    await optimizeLogo(logo.sourcePath, mainLocalPath, MAIN_MAX_EDGE, MAIN_QUALITY);
    await optimizeLogo(logo.sourcePath, thumbLocalPath, THUMB_MAX_EDGE, THUMB_QUALITY);

    const originalSize = await byteSize(logo.sourcePath);
    const mainSize = await byteSize(mainLocalPath);
    const thumbSize = await byteSize(thumbLocalPath);
    report.originalBytes += originalSize;
    report.mainBytes += mainSize;
    report.thumbBytes += thumbSize;
    report.optimized += 1;

    if (APPLY && client && bucket) {
      const mainStoragePath = `${logo.categorySlug}/${logo.brandSlug}.webp`;
      const thumbStoragePath = `${logo.categorySlug}/thumbs/${logo.brandSlug}.webp`;
      const logoUrl = await uploadWebp(client, BUCKET, mainStoragePath, mainLocalPath, bucket.public);
      await uploadWebp(client, BUCKET, thumbStoragePath, thumbLocalPath, bucket.public);

      await withRetry(`brands.logo_url update ${logo.brandSlug}`, async () => {
        const { error } = await client.from('brands').update({ logo_url: logoUrl }).eq('slug', logo.brandSlug);
        if (error) throw error;
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        original: formatBytes(report.originalBytes),
        optimizedMain: formatBytes(report.mainBytes),
        optimizedThumbs: formatBytes(report.thumbBytes),
        mainSavingsPercent:
          report.originalBytes > 0 ? Math.round((1 - report.mainBytes / report.originalBytes) * 1000) / 10 : 0,
        thumbSavingsPercent:
          report.originalBytes > 0 ? Math.round((1 - report.thumbBytes / report.originalBytes) * 1000) / 10 : 0,
        note: APPLY
          ? 'Uploaded optimized brand WebP logos and thumbnails; brands.logo_url now points to optimized originals.'
          : 'Dry run only. Re-run with --apply to upload and update brands.logo_url.',
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
