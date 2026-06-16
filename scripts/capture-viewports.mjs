#!/usr/bin/env node
/**
 * Capture viewport screenshots for responsive design review.
 * Wrapper around the skill script, resolved from project node_modules.
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_VIEWPORTS = [
  { name: '357x667', width: 357, height: 667 },
  { name: '402x874', width: 402, height: 874 },
  { name: '834x1210', width: 834, height: 1210 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1440', width: 2560, height: 1440 },
];

function parseArgs(argv) {
  const args = {
    baseUrl: 'http://localhost:3000',
    url: '',
    slug: '',
    out: '',
    region: '',
    waitMs: 1500,
    headerBreakpoint: 768,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--url':
        args.url = next ?? '';
        i++;
        break;
      case '--base-url':
        args.baseUrl = (next ?? '').replace(/\/$/, '');
        i++;
        break;
      case '--slug':
        args.slug = next ?? '';
        i++;
        break;
      case '--out':
        args.out = next ?? '';
        i++;
        break;
      case '--region':
        args.region = next ?? '';
        i++;
        break;
      case '--wait-ms':
        args.waitMs = Number(next ?? 1500);
        i++;
        break;
      case '--header-breakpoint':
        args.headerBreakpoint = Number(next ?? 768);
        i++;
        break;
      default:
        break;
    }
  }

  if (!args.url) {
    console.error('Error: --url is required');
    process.exit(1);
  }

  const fullUrl = args.url.startsWith('http')
    ? args.url
    : `${args.baseUrl}${args.url.startsWith('/') ? '' : '/'}${args.url}`;

  let slug = args.slug;
  if (!slug) {
    try {
      const pathname = new URL(fullUrl).pathname.replace(/^\//, '').replace(/\//g, '-');
      slug = pathname || 'page';
    } catch {
      slug = 'page';
    }
  }

  const outDir = args.out
    ? path.resolve(args.out)
    : path.join(process.cwd(), '.screenshots');

  return { ...args, fullUrl, slug, outDir };
}

const config = parseArgs(process.argv);

await mkdir(config.outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const saved = [];

for (const vp of DEFAULT_VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(config.fullUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(config.waitMs);

  const file = path.join(config.outDir, `${config.slug}-${vp.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  saved.push(file);
  console.log(`Saved ${file}`);
}

if (config.region) {
  for (const vp of DEFAULT_VIEWPORTS.filter((v) => v.width < config.headerBreakpoint)) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(config.fullUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(Math.min(config.waitMs, 1000));

    const file = path.join(config.outDir, `${config.slug}-region-${vp.name}.png`);
    await page.locator(config.region).screenshot({ path: file });
    saved.push(file);
    console.log(`Saved ${file}`);
  }
}

await browser.close();

console.log(JSON.stringify({ slug: config.slug, url: config.fullUrl, outDir: config.outDir, files: saved }, null, 2));
