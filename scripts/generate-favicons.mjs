#!/usr/bin/env node
/**
 * Bake favicons from CSS (same glow/border techniques as the site UI).
 * Renders a 512px circular master, then downscales to all output sizes.
 */

import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(__dirname, "favicon-template.html");
const PUBLIC = path.join(ROOT, "public");
const TEMPLATE_URL = `file://${TEMPLATE.replace(/\\/g, "/")}`;
const CIRCULAR_RENDER_SIZE = 512;

async function main() {
  await mkdir(PUBLIC, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(TEMPLATE_URL, { waitUntil: "load" });

  await page.setViewportSize({
    width: CIRCULAR_RENDER_SIZE,
    height: CIRCULAR_RENDER_SIZE,
  });
  await page.evaluate((size) => {
    document
      .getElementById("favicon-circular")
      .style.setProperty("--size", `${size}px`);
  }, CIRCULAR_RENDER_SIZE);

  const masterPath = path.join(PUBLIC, "favicon-render-512.png");
  await page.screenshot({
    path: masterPath,
    omitBackground: true,
  });
  console.log(`Wrote ${masterPath}`);

  await browser.close();

  const python = process.platform === "win32" ? "python" : "python3";
  const downscale = spawnSync(
    python,
    [path.join(__dirname, "generate-favicons.py"), "--downscale"],
    { stdio: "inherit", cwd: ROOT },
  );
  if (downscale.status !== 0) {
    process.exit(downscale.status ?? 1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
