package org.runelogs.assetdumper;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import javax.imageio.ImageIO;
import net.runelite.cache.IndexType;
import net.runelite.cache.definitions.SpriteDefinition;
import net.runelite.cache.definitions.loaders.SpriteLoader;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;

/** Dumps hiscore panel sprites from cache index 8 (archive IDs match RuneLite {@code SpriteID}). */
public class HiscoreSpriteDumper
{
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

	public static void main(String[] args) throws Exception
	{
		String cacheArg = null;
		String configArg = "config/hiscore-sprites.json";

		for (int i = 0; i < args.length; i++)
		{
			if ("--cache".equals(args[i]) && i + 1 < args.length)
			{
				cacheArg = args[++i];
			}
			else if ("--config".equals(args[i]) && i + 1 < args.length)
			{
				configArg = args[++i];
			}
			else if ("--help".equals(args[i]) || "-h".equals(args[i]))
			{
				printUsage();
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

		Path configPath = Paths.get(configArg);
		Path moduleRoot = CacheOpener.resolveModuleRoot(configPath);
		HiscoreSpriteConfig config = loadConfig(moduleRoot.resolve(configPath));

		File cacheDir = CacheOpener.resolveCacheDirectory(cacheArg);
		if (!cacheDir.isDirectory())
		{
			throw new IllegalArgumentException("Cache directory does not exist: " + cacheDir);
		}

		File outputDir = moduleRoot.resolve(config.output).toFile();
		outputDir.mkdirs();
		System.out.println("Writing hiscore sprites to " + outputDir.getAbsolutePath());

		int written = 0;
		int missing = 0;

		try (Store store = CacheOpener.open(cacheDir))
		{
			store.load();
			Storage storage = store.getStorage();
			Index spriteIndex = store.getIndex(IndexType.SPRITES);
			SpriteLoader loader = new SpriteLoader();

			for (HiscoreSpriteConfig.IconEntry entry : config.icons)
			{
				Archive archive = spriteIndex.getArchive(entry.archiveId);
				if (archive == null)
				{
					System.err.println("Missing sprite archive " + entry.archiveId + " (" + entry.name + ")");
					missing++;
					continue;
				}

				byte[] contents = archive.decompress(storage.loadArchive(archive));
				SpriteDefinition[] defs = loader.load(entry.archiveId, contents);
				int frame = entry.frame != null ? entry.frame : 0;
				SpriteDefinition sprite = findFrame(defs, frame);
				if (sprite == null || sprite.getWidth() <= 0 || sprite.getHeight() <= 0)
				{
					System.err.println("Could not load sprite archive " + entry.archiveId
						+ " frame " + frame + " (" + entry.name + ")");
					missing++;
					continue;
				}

				BufferedImage image = toImage(sprite);
				int padToSize = entry.padToSize != null ? entry.padToSize : config.defaults.padToSize;
				int scaleToSize = entry.scaleToSize != null ? entry.scaleToSize : config.defaults.scaleToSize;
				if (padToSize > 0)
				{
					image = padToSquare(image, padToSize);
				}
				if (scaleToSize > 0)
				{
					image = scale(image, scaleToSize, scaleToSize);
				}

				File out = new File(outputDir, entry.name + ".png");
				ImageIO.write(image, "png", out);
				System.out.println("Wrote " + out.getName()
					+ " (" + image.getWidth() + "x" + image.getHeight()
					+ ", archive " + entry.archiveId + ")");
				written++;
			}
		}

		System.out.println("Done: " + written + " written, " + missing + " missing.");
		if (written == 0)
		{
			System.exit(1);
		}
	}

	private static HiscoreSpriteConfig loadConfig(Path configPath) throws IOException
	{
		try (FileReader reader = new FileReader(configPath.toFile()))
		{
			HiscoreSpriteConfig config = GSON.fromJson(reader, HiscoreSpriteConfig.class);
			if (config == null || config.icons == null || config.output == null)
			{
				throw new IllegalArgumentException("Invalid config: " + configPath);
			}
			if (config.defaults == null)
			{
				config.defaults = new HiscoreSpriteConfig.Defaults();
			}
			return config;
		}
	}

	private static SpriteDefinition findFrame(SpriteDefinition[] defs, int frameId)
	{
		if (defs == null || defs.length == 0)
		{
			return null;
		}

		for (SpriteDefinition def : defs)
		{
			if (def.getFrame() == frameId)
			{
				return def;
			}
		}

		return defs[0];
	}

	private static BufferedImage toImage(SpriteDefinition sprite)
	{
		BufferedImage image = new BufferedImage(
			sprite.getWidth(),
			sprite.getHeight(),
			BufferedImage.TYPE_INT_ARGB
		);
		image.setRGB(
			0,
			0,
			sprite.getWidth(),
			sprite.getHeight(),
			sprite.getPixels(),
			0,
			sprite.getWidth()
		);
		return image;
	}

	private static BufferedImage padToSquare(BufferedImage image, int size)
	{
		BufferedImage canvas = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = canvas.createGraphics();
		int x = (size - image.getWidth()) / 2;
		int y = (size - image.getHeight()) / 2;
		graphics.drawImage(image, x, y, null);
		graphics.dispose();
		return canvas;
	}

	private static BufferedImage scale(BufferedImage image, int width, int height)
	{
		BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = scaled.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		graphics.drawImage(image, 0, 0, width, height, null);
		graphics.dispose();
		return scaled;
	}

	private static void printUsage()
	{
		System.out.println("Usage: HiscoreSpriteDumper [--cache <cacheDir>] [--config config/hiscore-sprites.json]");
	}

	static class HiscoreSpriteConfig
	{
		String output;
		Defaults defaults = new Defaults();
		List<IconEntry> icons;

		static class Defaults
		{
			int padToSize = 25;
			int scaleToSize = 20;
		}

		static class IconEntry
		{
			int archiveId;
			String name;
			String comment;
			Integer frame;
			Integer padToSize;
			Integer scaleToSize;
		}
	}
}
