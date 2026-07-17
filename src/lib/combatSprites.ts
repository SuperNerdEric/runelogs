/**
 * Loads the cache-dumped hitsplat and health-bar assets (see asset-dumper/CombatSpriteDumper) and
 * composites them for the replay map:
 *   - hitsplats: the resolved background sprite stretched behind the pixel-accurate damage number,
 *     drawn from the game's own font glyphs (white text + soft shadow, like the client).
 *   - health bars: the default green front sprite clipped over the red back sprite by HP fraction.
 *
 * Composited results are returned as data URLs (cached) so they can be rendered as plain Leaflet
 * ImageOverlays and scale with the map like every other entity.
 */
import metadata from "../assets/combat/metadata.json";

interface HitsplatMeta {
  background: number;
  left: number;
  left2: number;
  right: number;
  textColor: number;
  stringFormat: string;
  displayCycles: number;
  fadeStartCycle: number;
  textOffsetY: number;
}

interface GlyphMeta {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  advance: number;
}

interface FontMeta {
  spriteArchive: number;
  ascent: number;
  glyphs: { [char: string]: GlyphMeta };
}

interface HealthBarMeta {
  front: number;
  back: number;
  scale: number;
  padding: number;
}

interface CombatMetadata {
  hitsplats: { [id: string]: HitsplatMeta };
  healthbars: { [id: string]: HealthBarMeta };
  fonts: { [name: string]: FontMeta };
}

const META = metadata as unknown as CombatMetadata;

/** Font used to draw hitsplat numbers (bold 12, matching the client's damage text). */
const HITSPLAT_FONT = "b12_full";
/** Default health bar (green/red, scale 30) — the bar used by players and most NPCs. */
const DEFAULT_HEALTHBAR_ID = "0";

/**
 * Logged hitsplat name -> RuneLite hitsplat type id, mirroring the combat-logger HitSplatUtil map.
 * These ids index the cache HITSPLAT definitions we dumped (metadata.hitsplats).
 */
const HITSPLAT_NAME_TO_ID: { [name: string]: number } = {
  CORRUPTION: 0,
  DISEASE: 4,
  VENOM: 5,
  HEAL: 6,
  CYAN_UP: 11,
  BLOCK_ME: 12,
  BLOCK_OTHER: 13,
  CYAN_DOWN: 15,
  DAMAGE_ME: 16,
  DAMAGE_OTHER: 17,
  DAMAGE_ME_CYAN: 18,
  DAMAGE_OTHER_CYAN: 19,
  DAMAGE_ME_ORANGE: 20,
  DAMAGE_OTHER_ORANGE: 21,
  DAMAGE_ME_YELLOW: 22,
  DAMAGE_OTHER_YELLOW: 23,
  DAMAGE_ME_WHITE: 24,
  DAMAGE_OTHER_WHITE: 25,
  DAMAGE_MAX_ME: 43,
  DAMAGE_MAX_ME_CYAN: 44,
  DAMAGE_MAX_ME_ORANGE: 45,
  DAMAGE_MAX_ME_YELLOW: 46,
  DAMAGE_MAX_ME_WHITE: 47,
  DAMAGE_ME_POISE: 53,
  DAMAGE_OTHER_POISE: 54,
  DAMAGE_MAX_ME_POISE: 55,
  PRAYER_DRAIN: 60,
  POISON: 65,
  BLEED: 67,
  SANITY_DRAIN: 71,
  SANITY_RESTORE: 72,
  DOOM: 73,
  BURN: 74,
  DAMAGE_BOAT: 79,
};

function resolveHitsplatId(name: string): number | null {
  if (name in HITSPLAT_NAME_TO_ID) {
    return HITSPLAT_NAME_TO_ID[name];
  }
  // Plugin encodes unmapped hitsplats as "Unknown_<id>".
  const unknown = /^Unknown_(\d+)$/.exec(name);
  if (unknown) {
    return Number(unknown[1]);
  }
  // Party enrichment can produce "_OTHER" variants that have no dedicated sprite; fall back to the
  // matching "_ME" splat so the damage still shows.
  if (name.includes("_OTHER")) {
    const meVariant = name
      .replace("MAX_OTHER", "MAX_ME")
      .replace("OTHER", "ME");
    if (meVariant in HITSPLAT_NAME_TO_ID) {
      return HITSPLAT_NAME_TO_ID[meVariant];
    }
  }
  return null;
}

// --- Asset URLs (bundled by Vite) ---
const hitsplatUrls = import.meta.glob<string>(
  "../assets/combat/hitsplats/*.png",
  { eager: true, import: "default" },
);
const healthbarUrls = import.meta.glob<string>(
  "../assets/combat/healthbars/*.png",
  { eager: true, import: "default" },
);
const digitUrls = import.meta.glob<string>("../assets/combat/digits/**/*.png", {
  eager: true,
  import: "default",
});

function spriteUrl(
  urls: Record<string, string>,
  folder: string,
  spriteId: number,
): string | undefined {
  return urls[`../assets/combat/${folder}/${spriteId}.png`];
}

function digitUrl(font: string, char: string): string | undefined {
  return digitUrls[`../assets/combat/digits/${font}/${char}.png`];
}

function glyphFileName(char: string): string {
  return char === "-" ? "minus" : char;
}

// --- Image preloading + readiness ---
const imageCache = new Map<string, HTMLImageElement>();
let ready = false;
const readyListeners = new Set<() => void>();

function loadImage(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

function collectPreloadUrls(): string[] {
  const urls = new Set<string>();
  for (const url of Object.values(hitsplatUrls)) {
    urls.add(url);
  }
  const bar = META.healthbars[DEFAULT_HEALTHBAR_ID];
  if (bar) {
    const front = spriteUrl(healthbarUrls, "healthbars", bar.front);
    const back = spriteUrl(healthbarUrls, "healthbars", bar.back);
    if (front) urls.add(front);
    if (back) urls.add(back);
  }
  const font = META.fonts[HITSPLAT_FONT];
  if (font) {
    for (const char of Object.keys(font.glyphs)) {
      const url = digitUrl(HITSPLAT_FONT, char);
      if (url) urls.add(url);
    }
  }
  return Array.from(urls);
}

if (typeof window !== "undefined" && typeof Image !== "undefined") {
  Promise.all(collectPreloadUrls().map(loadImage)).then(() => {
    ready = true;
    readyListeners.forEach((listener) => listener());
  });
}

export function subscribeCombatSpritesReady(listener: () => void): () => void {
  readyListeners.add(listener);
  return () => {
    readyListeners.delete(listener);
  };
}

export function areCombatSpritesReady(): boolean {
  return ready;
}

// --- Compositing ---
export interface CompositeSprite {
  url: string;
  /** width / height of the composited image, so callers can size map bounds without distortion. */
  aspect: number;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  return canvas;
}

const hitsplatCache = new Map<string, CompositeSprite | null>();

/**
 * Composites a hitsplat: the background splat stretched to fit the number, with the number drawn
 * from cache font glyphs (white with a soft shadow, centred).
 */
export function getHitsplatSprite(
  hitsplatName: string,
  amount: number,
): CompositeSprite | null {
  if (!ready) {
    return null;
  }

  const id = resolveHitsplatId(hitsplatName);
  if (id === null) {
    return null;
  }
  const meta = META.hitsplats[String(id)];
  if (!meta || meta.background < 0) {
    return null;
  }

  const cacheKey = `${id}:${amount}`;
  const cached = hitsplatCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const bg = imageCache.get(
    spriteUrl(hitsplatUrls, "hitsplats", meta.background) ?? "",
  );
  const font = META.fonts[HITSPLAT_FONT];
  if (!bg || !font) {
    hitsplatCache.set(cacheKey, null);
    return null;
  }

  const text = String(amount);
  const chars = text.split("");
  let textWidth = 0;
  for (const char of chars) {
    const glyph = font.glyphs[glyphFileName(char)];
    if (glyph) {
      textWidth += glyph.advance;
    }
  }

  const bgWidth = bg.naturalWidth;
  const bgHeight = bg.naturalHeight;
  const canvasWidth = Math.max(bgWidth, textWidth + 6);
  const canvasHeight = bgHeight;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    hitsplatCache.set(cacheKey, null);
    return null;
  }

  // Stretch the splat horizontally to fit wide numbers (the client widens splats similarly).
  ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

  const textTop =
    Math.round((canvasHeight - font.ascent) / 2) + meta.textOffsetY;
  const drawGlyphs = (offsetX: number, offsetY: number, shadow: boolean) => {
    let penX = Math.round((canvasWidth - textWidth) / 2);
    ctx.filter = shadow ? "brightness(0)" : "none";
    for (const char of chars) {
      const glyph = font.glyphs[glyphFileName(char)];
      const glyphImage = imageCache.get(
        digitUrl(HITSPLAT_FONT, glyphFileName(char)) ?? "",
      );
      if (glyph && glyphImage) {
        ctx.drawImage(
          glyphImage,
          penX + glyph.offsetX + offsetX,
          textTop + glyph.offsetY + offsetY,
        );
        penX += glyph.advance;
      }
    }
    ctx.filter = "none";
  };

  drawGlyphs(1, 1, true); // shadow
  drawGlyphs(0, 0, false); // white text

  const result: CompositeSprite = {
    url: canvas.toDataURL(),
    aspect: canvasWidth / canvasHeight,
  };
  hitsplatCache.set(cacheKey, result);
  return result;
}

const hpTextCache = new Map<string, CompositeSprite | null>();

/**
 * Composites a "current / max" hitpoints label from the cache font digits, with a drawn slash
 * separator (the digit set has no slash glyph). White text with a soft shadow, matching the
 * hitsplat numbers. Used for the single authoritative boss bar where exact points are known.
 */
export function getHpTextSprite(
  current: number,
  max: number,
): CompositeSprite | null {
  if (!ready) {
    return null;
  }

  const font = META.fonts[HITSPLAT_FONT];
  if (!font) {
    return null;
  }

  const cacheKey = `${current}/${max}`;
  const cached = hpTextCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const leftChars = String(Math.max(0, Math.round(current))).split("");
  const rightChars = String(Math.max(0, Math.round(max))).split("");

  const measure = (chars: string[]): number =>
    chars.reduce((sum, char) => {
      const glyph = font.glyphs[glyphFileName(char)];
      return sum + (glyph ? glyph.advance : 0);
    }, 0);

  const slashGap = 2;
  const slashWidth = Math.max(3, Math.round(font.ascent * 0.45));
  const leftWidth = measure(leftChars);
  const rightWidth = measure(rightChars);
  const textWidth = leftWidth + slashGap + slashWidth + slashGap + rightWidth;

  const canvasWidth = textWidth + 2;
  const canvasHeight = font.ascent + 3;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    hpTextCache.set(cacheKey, null);
    return null;
  }

  const textTop = 1;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "white";

  const drawText = (offsetX: number, offsetY: number, shadow: boolean) => {
    ctx.filter = shadow ? "brightness(0)" : "none";
    let penX = 1;

    const drawDigits = (chars: string[]) => {
      for (const char of chars) {
        const glyph = font.glyphs[glyphFileName(char)];
        const glyphImage = imageCache.get(
          digitUrl(HITSPLAT_FONT, glyphFileName(char)) ?? "",
        );
        if (glyph && glyphImage) {
          ctx.drawImage(
            glyphImage,
            penX + glyph.offsetX + offsetX,
            textTop + glyph.offsetY + offsetY,
          );
          penX += glyph.advance;
        }
      }
    };

    drawDigits(leftChars);
    penX += slashGap;
    ctx.beginPath();
    ctx.moveTo(penX + offsetX, textTop + font.ascent + offsetY);
    ctx.lineTo(penX + slashWidth + offsetX, textTop + offsetY);
    ctx.stroke();
    penX += slashWidth + slashGap;
    drawDigits(rightChars);

    ctx.filter = "none";
  };

  drawText(1, 1, true); // shadow
  drawText(0, 0, false); // white text

  const result: CompositeSprite = {
    url: canvas.toDataURL(),
    aspect: canvasWidth / canvasHeight,
  };
  hpTextCache.set(cacheKey, result);
  return result;
}

const percentTextCache = new Map<string, CompositeSprite | null>();

/**
 * Composites a "NN%" label from the cache font digits, with a drawn percent sign (the digit set has
 * no '%' glyph). White text with a soft shadow, matching the hitsplat numbers.
 */
export function getPercentTextSprite(percent: number): CompositeSprite | null {
  if (!ready) {
    return null;
  }

  const font = META.fonts[HITSPLAT_FONT];
  if (!font) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const cacheKey = `${clamped}%`;
  const cached = percentTextCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const chars = String(clamped).split("");
  const digitsWidth = chars.reduce((sum, char) => {
    const glyph = font.glyphs[glyphFileName(char)];
    return sum + (glyph ? glyph.advance : 0);
  }, 0);

  const signGap = 2;
  const signWidth = Math.max(5, Math.round(font.ascent * 0.7));
  const dotRadius = Math.max(1, Math.round(font.ascent * 0.13));
  const textWidth = digitsWidth + signGap + signWidth;

  const canvasWidth = textWidth + 2;
  const canvasHeight = font.ascent + 3;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    percentTextCache.set(cacheKey, null);
    return null;
  }

  // Vertically centre the digit ink (including the 1px drop shadow) within the canvas so the label
  // sits centred inside the health bar rather than hugging the bottom.
  let inkTop = Infinity;
  let inkBottom = -Infinity;
  for (const char of chars) {
    const glyph = font.glyphs[glyphFileName(char)];
    if (!glyph) {
      continue;
    }
    inkTop = Math.min(inkTop, glyph.offsetY);
    inkBottom = Math.max(inkBottom, glyph.offsetY + glyph.height);
  }
  if (!Number.isFinite(inkTop)) {
    inkTop = 0;
    inkBottom = font.ascent;
  }
  inkBottom += 1; // account for the drop shadow drawn 1px below
  const textTop = Math.round((canvasHeight - (inkTop + inkBottom)) / 2);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";

  const drawText = (offsetX: number, offsetY: number, shadow: boolean) => {
    ctx.filter = shadow ? "brightness(0)" : "none";
    let penX = 1;

    for (const char of chars) {
      const glyph = font.glyphs[glyphFileName(char)];
      const glyphImage = imageCache.get(
        digitUrl(HITSPLAT_FONT, glyphFileName(char)) ?? "",
      );
      if (glyph && glyphImage) {
        ctx.drawImage(
          glyphImage,
          penX + glyph.offsetX + offsetX,
          textTop + glyph.offsetY + offsetY,
        );
        penX += glyph.advance;
      }
    }

    // Percent sign: a diagonal stroke with a dot at each end.
    penX += signGap;
    const left = penX + offsetX;
    const top = textTop + offsetY;
    const bottom = textTop + font.ascent + offsetY;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(left + signWidth, top);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(left + dotRadius, top + dotRadius, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      left + signWidth - dotRadius,
      bottom - dotRadius,
      dotRadius,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.filter = "none";
  };

  drawText(1, 1, true); // shadow
  drawText(0, 0, false); // white text

  const result: CompositeSprite = {
    url: canvas.toDataURL(),
    aspect: canvasWidth / canvasHeight,
  };
  percentTextCache.set(cacheKey, result);
  return result;
}

const healthBarCache = new Map<string, CompositeSprite | null>();

/** Composites the default health bar filled to `fraction` (0-1) of its width. */
export function getHealthBarSprite(fraction: number): CompositeSprite | null {
  if (!ready) {
    return null;
  }

  const bar = META.healthbars[DEFAULT_HEALTHBAR_ID];
  if (!bar) {
    return null;
  }
  const back = imageCache.get(
    spriteUrl(healthbarUrls, "healthbars", bar.back) ?? "",
  );
  const front = imageCache.get(
    spriteUrl(healthbarUrls, "healthbars", bar.front) ?? "",
  );
  if (!back || !front) {
    return null;
  }

  const width = back.naturalWidth;
  const height = back.naturalHeight;
  const clamped = Math.max(0, Math.min(1, fraction));
  const filledWidth = Math.round(width * clamped);

  const cacheKey = `${filledWidth}/${width}`;
  const cached = healthBarCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    healthBarCache.set(cacheKey, null);
    return null;
  }

  ctx.drawImage(back, 0, 0);
  if (filledWidth > 0) {
    const srcWidth = Math.max(1, Math.round(front.naturalWidth * clamped));
    ctx.drawImage(
      front,
      0,
      0,
      srcWidth,
      front.naturalHeight,
      0,
      0,
      filledWidth,
      height,
    );
  }

  const result: CompositeSprite = {
    url: canvas.toDataURL(),
    aspect: width / height,
  };
  healthBarCache.set(cacheKey, result);
  return result;
}
