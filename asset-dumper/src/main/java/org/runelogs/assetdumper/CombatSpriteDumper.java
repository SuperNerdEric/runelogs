package org.runelogs.assetdumper;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeSet;
import javax.imageio.ImageIO;
import net.runelite.cache.ConfigType;
import net.runelite.cache.IndexType;
import net.runelite.cache.definitions.HealthBarDefinition;
import net.runelite.cache.definitions.HitSplatDefinition;
import net.runelite.cache.definitions.SpriteDefinition;
import net.runelite.cache.definitions.loaders.HealthBarLoader;
import net.runelite.cache.definitions.loaders.HitSplatLoader;
import net.runelite.cache.definitions.loaders.SpriteLoader;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.ArchiveFiles;
import net.runelite.cache.fs.FSFile;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;

/**
 * Dumps the assets needed to draw OSRS hitsplats and health bars on the replay map, sourced entirely
 * from the game cache:
 *
 * <ul>
 *   <li>Hitsplat background/icon sprites (CONFIGS -&gt; {@link ConfigType#HITSPLAT} -&gt; SPRITES)</li>
 *   <li>Health bar front/back sprites (CONFIGS -&gt; {@link ConfigType#HEALTHBAR} -&gt; SPRITES)</li>
 *   <li>Digit glyphs (0-9 and '-') from the fonts referenced by hitsplat definitions, so damage
 *       numbers can be composited pixel-accurately in the frontend</li>
 * </ul>
 *
 * A single {@code metadata.json} describes every hitsplat (background sprite, text colour, font,
 * fade timing), every health bar (front/back sprite, scale, padding) and every dumped font (ascent
 * plus per-digit glyph geometry and advance), so the frontend never has to hardcode cache internals.
 */
public class CombatSpriteDumper
{
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

	/** Characters we need to render damage/heal numbers: digits plus the minus sign. */
	private static final char[] GLYPH_CHARS = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'};

	/**
	 * Fonts whose digit glyphs we export. Hitsplat definitions carry no font reference (fontType is
	 * -1), so the client draws numbers with a fixed font; we dump the small-font candidates and the
	 * frontend picks the one that matches the game. Names are cache sprite-archive names (see
	 * {@link net.runelite.cache.FontName}).
	 */
	private static final String[] FONT_NAMES = {"p11_full", "p12_full", "b12_full"};

	public static void main(String[] args) throws Exception
	{
		String cacheArg = null;
		String outputArg = "../src/assets/combat";

		for (int i = 0; i < args.length; i++)
		{
			if ("--cache".equals(args[i]) && i + 1 < args.length)
			{
				cacheArg = args[++i];
			}
			else if ("--output".equals(args[i]) && i + 1 < args.length)
			{
				outputArg = args[++i];
			}
			else if ("--help".equals(args[i]) || "-h".equals(args[i]))
			{
				System.out.println("Usage: CombatSpriteDumper [--cache <cacheDir>] [--output ../src/assets/combat]");
				return;
			}
			else if (cacheArg == null)
			{
				cacheArg = args[i];
			}
			else
			{
				throw new IllegalArgumentException("Unknown argument: " + args[i]);
			}
		}

		File cacheDir = CacheOpener.resolveCacheDirectory(cacheArg);
		if (!cacheDir.isDirectory())
		{
			throw new IllegalArgumentException("Cache directory does not exist: " + cacheDir);
		}

		File outputDir = new File(outputArg);
		File hitsplatDir = new File(outputDir, "hitsplats");
		File healthbarDir = new File(outputDir, "healthbars");
		File digitDir = new File(outputDir, "digits");
		hitsplatDir.mkdirs();
		healthbarDir.mkdirs();
		digitDir.mkdirs();

		System.out.println("Writing combat sprites to " + outputDir.getAbsolutePath());

		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("cacheDir", cacheDir.getAbsolutePath());

		try (Store store = CacheOpener.open(cacheDir))
		{
			store.load();
			Storage storage = store.getStorage();
			Index spriteIndex = store.getIndex(IndexType.SPRITES);
			Index configIndex = store.getIndex(IndexType.CONFIGS);
			SpriteLoader spriteLoader = new SpriteLoader();

			TreeSet<Integer> hitsplatSpriteIds = new TreeSet<>();
			TreeSet<Integer> healthbarSpriteIds = new TreeSet<>();

			// --- Hitsplats ---
			// Many "type" ids the client reports (e.g. 16 = DAMAGE_ME) are conditional wrappers with no
			// sprite of their own: they redirect to a themed definition through multihitsplats, selected
			// by the player's hitsplat-skin varbit. We resolve each id to its default (varbit 0) themed
			// definition so the frontend gets a ready-to-draw background sprite per logged id.
			HitSplatLoader hitSplatLoader = new HitSplatLoader();
			Archive hitsplatArchive = configIndex.getArchive(ConfigType.HITSPLAT.getId());
			ArchiveFiles hitsplatFiles = hitsplatArchive.getFiles(storage.loadArchive(hitsplatArchive));
			Map<Integer, HitSplatDefinition> hitsplatDefs = new LinkedHashMap<>();
			for (FSFile file : hitsplatFiles.getFiles())
			{
				hitsplatDefs.put(file.getFileId(), hitSplatLoader.load(file.getContents()));
			}

			Map<String, Object> hitsplatMeta = new LinkedHashMap<>();
			for (Map.Entry<Integer, HitSplatDefinition> e : hitsplatDefs.entrySet())
			{
				int id = e.getKey();
				HitSplatDefinition raw = e.getValue();
				HitSplatDefinition eff = resolveEffective(raw, hitsplatDefs);

				Map<String, Object> meta = new LinkedHashMap<>();
				meta.put("background", eff.getBackgroundSprite());
				meta.put("left", eff.getLeftSprite());
				meta.put("left2", eff.getLeftSprite2());
				meta.put("right", eff.getRightSpriteId());
				meta.put("textColor", eff.getTextColor());
				meta.put("stringFormat", eff.getStringFormat());
				meta.put("displayCycles", eff.getDisplayCycles());
				meta.put("fadeStartCycle", eff.getFadeStartCycle());
				meta.put("textOffsetY", eff.getTextOffsetY());
				// Diagnostics: how the raw definition redirected.
				meta.put("varbitID", raw.getVarbitID());
				meta.put("varpID", raw.getVarpID());
				meta.put("multihitsplats", raw.getMultihitsplats());
				hitsplatMeta.put(Integer.toString(id), meta);

				addIfValid(hitsplatSpriteIds, eff.getBackgroundSprite());
				addIfValid(hitsplatSpriteIds, eff.getLeftSprite());
				addIfValid(hitsplatSpriteIds, eff.getLeftSprite2());
				addIfValid(hitsplatSpriteIds, eff.getRightSpriteId());
			}
			metadata.put("hitsplats", hitsplatMeta);
			System.out.println("Hitsplats: " + hitsplatMeta.size() + " definitions");

			// --- Health bars ---
			Map<String, Object> healthbarMeta = new LinkedHashMap<>();
			HealthBarLoader healthBarLoader = new HealthBarLoader();
			Archive healthbarArchive = configIndex.getArchive(ConfigType.HEALTHBAR.getId());
			ArchiveFiles healthbarFiles = healthbarArchive.getFiles(storage.loadArchive(healthbarArchive));
			for (FSFile file : healthbarFiles.getFiles())
			{
				int id = file.getFileId();
				HealthBarDefinition def = healthBarLoader.load(id, file.getContents());

				Map<String, Object> meta = new LinkedHashMap<>();
				meta.put("front", def.getHealthBarFrontSpriteId());
				meta.put("back", def.getHealthBarBackSpriteId());
				meta.put("scale", def.getHealthScale());
				meta.put("padding", def.getHealthBarPadding());
				healthbarMeta.put(Integer.toString(id), meta);

				addIfValid(healthbarSpriteIds, def.getHealthBarFrontSpriteId());
				addIfValid(healthbarSpriteIds, def.getHealthBarBackSpriteId());
			}
			metadata.put("healthbars", healthbarMeta);
			System.out.println("Health bars: " + healthbarMeta.size() + " definitions");

			// --- Hitsplat/health bar sprites (both live in the SPRITES index) ---
			int hitsplatSpritesWritten = dumpSprites(spriteIndex, storage, spriteLoader, hitsplatSpriteIds, hitsplatDir);
			int healthbarSpritesWritten = dumpSprites(spriteIndex, storage, spriteLoader, healthbarSpriteIds, healthbarDir);
			System.out.println("Sprites written: " + hitsplatSpritesWritten + " hitsplat, "
				+ healthbarSpritesWritten + " health bar");

			// --- Font digit glyphs ---
			Map<String, Object> fontMeta = new LinkedHashMap<>();
			net.runelite.cache.FontManager fontManager = new net.runelite.cache.FontManager(store);
			fontManager.load();
			for (String fontName : FONT_NAMES)
			{
				Map<String, Object> meta = dumpFontDigits(
					storage, spriteIndex, spriteLoader, fontManager, fontName, digitDir);
				if (meta != null)
				{
					fontMeta.put(fontName, meta);
				}
			}
			metadata.put("fonts", fontMeta);
		}

		File metadataFile = new File(outputDir, "metadata.json");
		try (FileWriter writer = new FileWriter(metadataFile))
		{
			GSON.toJson(metadata, writer);
		}
		System.out.println("Wrote metadata to " + metadataFile.getAbsolutePath());
		System.out.println("Done.");
	}

	/**
	 * Follows {@code multihitsplats[0]} (the default hitsplat skin, varbit value 0) until a definition
	 * that actually carries a background sprite is reached. Guards against cycles / missing ids.
	 */
	private static HitSplatDefinition resolveEffective(
		HitSplatDefinition def, Map<Integer, HitSplatDefinition> all)
	{
		HitSplatDefinition current = def;
		for (int depth = 0; depth < 8; depth++)
		{
			if (current.getBackgroundSprite() >= 0)
			{
				return current;
			}
			int[] multi = current.getMultihitsplats();
			if (multi == null || multi.length == 0)
			{
				return current;
			}
			HitSplatDefinition next = all.get(multi[0]);
			if (next == null || next == current)
			{
				return current;
			}
			current = next;
		}
		return current;
	}

	private static int dumpSprites(
		Index spriteIndex, Storage storage, SpriteLoader loader, TreeSet<Integer> spriteIds, File outputDir)
		throws IOException
	{
		int written = 0;
		for (int spriteId : spriteIds)
		{
			SpriteDefinition sprite = loadSprite(spriteIndex, storage, loader, spriteId, 0);
			if (sprite == null || sprite.getWidth() <= 0 || sprite.getHeight() <= 0)
			{
				System.err.println("Skipping unreadable sprite " + spriteId);
				continue;
			}
			ImageIO.write(toImage(sprite), "png", new File(outputDir, spriteId + ".png"));
			written++;
		}
		return written;
	}

	private static void addIfValid(TreeSet<Integer> set, int spriteId)
	{
		if (spriteId >= 0)
		{
			set.add(spriteId);
		}
	}

	/**
	 * Exports the digit glyphs for the named font. The FONTS index definition holds only kerning
	 * metadata (advances/ascent); the glyph pixels live in a SPRITES archive of the same name (frame
	 * == char code). We decode that sprite archive and export the digits/minus we need.
	 */
	private static Map<String, Object> dumpFontDigits(
		Storage storage,
		Index spriteIndex,
		SpriteLoader spriteLoader,
		net.runelite.cache.FontManager fontManager,
		String fontName,
		File digitRoot) throws IOException
	{
		Archive glyphArchive = spriteIndex.findArchiveByName(fontName);
		if (glyphArchive == null)
		{
			System.err.println("No SPRITES archive named " + fontName);
			return null;
		}

		SpriteDefinition[] glyphs = spriteLoader.load(
			glyphArchive.getArchiveId(), glyphArchive.decompress(storage.loadArchive(glyphArchive)));

		net.runelite.cache.definitions.FontDefinition fontDef = fontManager.findFontByName(fontName);

		File fontDir = new File(digitRoot, fontName);
		fontDir.mkdirs();

		Map<String, Object> digitMeta = new LinkedHashMap<>();
		int written = 0;
		for (char c : GLYPH_CHARS)
		{
			SpriteDefinition glyph = findGlyph(glyphs, c);
			if (glyph == null || glyph.getWidth() <= 0 || glyph.getHeight() <= 0)
			{
				continue;
			}

			BufferedImage image = toImage(glyph);
			ImageIO.write(image, "png", new File(fontDir, glyphFileName(c) + ".png"));

			Map<String, Object> g = new LinkedHashMap<>();
			g.put("width", glyph.getWidth());
			g.put("height", glyph.getHeight());
			g.put("offsetX", glyph.getOffsetX());
			g.put("offsetY", glyph.getOffsetY());
			g.put("advance", fontDef != null && fontDef.getAdvances() != null ? fontDef.getAdvances()[c] : glyph.getWidth());
			digitMeta.put(glyphFileName(c), g);
			written++;
		}

		Map<String, Object> meta = new LinkedHashMap<>();
		meta.put("spriteArchive", glyphArchive.getArchiveId());
		meta.put("ascent", fontDef != null ? fontDef.getAscent() : 0);
		meta.put("glyphs", digitMeta);
		System.out.println("Font " + fontName + " (sprite archive " + glyphArchive.getArchiveId()
			+ "): " + written + " glyphs");
		return meta;
	}

	private static SpriteDefinition findGlyph(SpriteDefinition[] glyphs, char c)
	{
		if (glyphs == null)
		{
			return null;
		}
		for (SpriteDefinition glyph : glyphs)
		{
			if (glyph.getFrame() == c)
			{
				return glyph;
			}
		}
		// Fall back to index position if frames are not tagged with the char code.
		return c < glyphs.length ? glyphs[c] : null;
	}

	private static String glyphFileName(char c)
	{
		return c == '-' ? "minus" : Character.toString(c);
	}

	private static SpriteDefinition loadSprite(
		Index spriteIndex, Storage storage, SpriteLoader loader, int spriteId, int frame) throws IOException
	{
		Archive archive = spriteIndex.getArchive(spriteId);
		if (archive == null)
		{
			return null;
		}
		SpriteDefinition[] defs = loader.load(spriteId, archive.decompress(storage.loadArchive(archive)));
		if (defs == null || defs.length == 0)
		{
			return null;
		}
		for (SpriteDefinition def : defs)
		{
			if (def.getFrame() == frame)
			{
				return def;
			}
		}
		return defs[0];
	}

	private static BufferedImage toImage(SpriteDefinition sprite)
	{
		BufferedImage image = new BufferedImage(
			sprite.getWidth(), sprite.getHeight(), BufferedImage.TYPE_INT_ARGB);
		image.setRGB(
			0, 0, sprite.getWidth(), sprite.getHeight(), sprite.getPixels(), 0, sprite.getWidth());
		return image;
	}
}
