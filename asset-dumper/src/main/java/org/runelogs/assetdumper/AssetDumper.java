package org.runelogs.assetdumper;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import net.runelite.cache.ConfigType;
import net.runelite.cache.IndexType;
import net.runelite.cache.ObjectManager;
import net.runelite.cache.SpriteManager;
import net.runelite.cache.TextureManager;
import net.runelite.cache.definitions.ModelDefinition;
import net.runelite.cache.definitions.ObjectDefinition;
import net.runelite.cache.definitions.SequenceDefinition;
import net.runelite.cache.definitions.SpotAnimDefinition;
import net.runelite.cache.definitions.loaders.ModelLoader;
import net.runelite.cache.definitions.loaders.SpotAnimLoader;
import net.runelite.cache.definitions.providers.ModelProvider;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.ArchiveFiles;
import net.runelite.cache.fs.FSFile;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;
import net.runelite.cache.item.AnimationFrameUtil;
import net.runelite.cache.item.ModelRenderUtil;

public class AssetDumper
{
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

	public static void main(String[] args) throws Exception
	{
		String cacheArg = null;
		String configArg = "config/assets.json";

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
			else
			{
				if (cacheArg == null)
				{
					cacheArg = args[i];
				}
				else
				{
					throw new IllegalArgumentException("Unknown argument: " + args[i]);
				}
			}
		}

		Path configPath = Paths.get(configArg);
		Path moduleRoot = CacheOpener.resolveModuleRoot(configPath);
		AssetDumperConfig config = loadConfig(moduleRoot.resolve(configPath));

		File cacheDir = CacheOpener.resolveCacheDirectory(cacheArg);
		if (!cacheDir.isDirectory())
		{
			throw new IllegalArgumentException("Cache directory does not exist: " + cacheDir);
		}

		File gameOut = moduleRoot.resolve(config.output.gameObjects).toFile();
		File graphicOut = moduleRoot.resolve(config.output.graphicObjects).toFile();
		gameOut.mkdirs();
		graphicOut.mkdirs();

		System.out.println("Writing game objects to " + gameOut.getAbsolutePath());
		System.out.println("Writing graphic objects to " + graphicOut.getAbsolutePath());

		Map<String, Object> dumpMetadata = new LinkedHashMap<>();
		dumpMetadata.put("cacheDir", cacheDir.getAbsolutePath());
		dumpMetadata.put("cacheFormat", CacheOpener.detectFormat(cacheDir).name());
		dumpMetadata.put("gameObjectsDir", gameOut.getAbsolutePath());
		dumpMetadata.put("graphicObjectsDir", graphicOut.getAbsolutePath());

		try (Store store = CacheOpener.open(cacheDir))
		{
			store.load();

			ObjectManager objectManager = new ObjectManager(store);
			objectManager.load();

			SpriteManager spriteManager = new SpriteManager(store);
			spriteManager.load();

			TextureManager textureManager = new TextureManager(store);
			textureManager.load();

			ModelProvider modelProvider = modelId -> {
				Index models = store.getIndex(IndexType.MODELS);
				Archive archive = models.getArchive(modelId);
				if (archive == null)
				{
					return null;
				}
				byte[] data = archive.decompress(store.getStorage().loadArchive(archive));
				return new ModelLoader().load(modelId, data);
			};

			AssetDumperConfig.RenderSettings gameRender = config.render.gameObject;
			for (AssetDumperConfig.AssetEntry entry : config.gameObjects)
			{
				dumpGameObject(
					objectManager,
					modelProvider,
					spriteManager,
					textureManager,
					gameOut,
					entry,
					mergeRender(gameRender, entry.overrides)
				);
			}

			SpotAnimLoader spotAnimLoader = new SpotAnimLoader();
			Storage storage = store.getStorage();
			Index configIndex = store.getIndex(IndexType.CONFIGS);
			Archive spotArchive = configIndex.getArchive(ConfigType.SPOTANIM.getId());
			ArchiveFiles spotFiles = spotArchive.getFiles(storage.loadArchive(spotArchive));

			AssetDumperConfig.RenderSettings graphicRender = config.render.graphicObject;
			Map<Integer, Map<String, Object>> graphicMetadata = new LinkedHashMap<>();

			for (AssetDumperConfig.GraphicObjectEntry entry : config.graphicObjects)
			{
				Map<String, Object> meta = dumpGraphicObject(
					store,
					modelProvider,
					spriteManager,
					textureManager,
					spotAnimLoader,
					spotFiles,
					graphicOut,
					entry,
					mergeRender(graphicRender, entry.overrides)
				);
				if (meta != null)
				{
					graphicMetadata.put(entry.id, meta);
				}
			}

			dumpMetadata.put("graphicObjects", graphicMetadata);
		}

		File metadataFile = moduleRoot.resolve("config/last-dump.json").toFile();
		try (FileWriter writer = new FileWriter(metadataFile))
		{
			GSON.toJson(dumpMetadata, writer);
		}
		System.out.println("Wrote metadata to " + metadataFile.getAbsolutePath());
	}

	private static AssetDumperConfig loadConfig(Path configPath) throws IOException
	{
		try (FileReader reader = new FileReader(configPath.toFile()))
		{
			AssetDumperConfig config = GSON.fromJson(reader, AssetDumperConfig.class);
			if (config == null || config.gameObjects == null || config.graphicObjects == null)
			{
				throw new IllegalArgumentException("Invalid config: " + configPath);
			}
			return config;
		}
	}

	private static AssetDumperConfig.RenderSettings mergeRender(
		AssetDumperConfig.RenderSettings defaults,
		AssetDumperConfig.RenderSettings overrides
	)
	{
		if (overrides == null)
		{
			return defaults;
		}

		AssetDumperConfig.RenderSettings merged = new AssetDumperConfig.RenderSettings();
		merged.width = overrides.width != 0 ? overrides.width : defaults.width;
		merged.height = overrides.height != 0 ? overrides.height : defaults.height;
		merged.zoom = overrides.zoom != 0 ? overrides.zoom : defaults.zoom;
		merged.xan = overrides.xan != 0 ? overrides.xan : defaults.xan;
		merged.yan = overrides.yan != 0 ? overrides.yan : defaults.yan;
		merged.zan = overrides.zan;
		return merged;
	}

	private static void dumpGameObject(
		ObjectManager objectManager,
		ModelProvider modelProvider,
		SpriteManager spriteManager,
		TextureManager textureManager,
		File outputDir,
		AssetDumperConfig.AssetEntry entry,
		AssetDumperConfig.RenderSettings render
	) throws IOException
	{
		ObjectDefinition object = objectManager.getObject(entry.id);
		if (object == null)
		{
			System.err.println("Missing object definition " + entry.id);
			return;
		}

		System.out.println(entry.id + " name=" + object.getName()
			+ " models=" + Arrays.toString(object.getObjectModels()));

		ModelDefinition modelDefinition = loadObjectModel(modelProvider, object);
		if (modelDefinition == null)
		{
			System.err.println("Could not load model for object " + entry.id);
			return;
		}

		BufferedImage image = ModelRenderUtil.renderModel(
			modelProvider,
			spriteManager,
			textureManager,
			modelDefinition,
			render.width,
			render.height,
			render.zoom,
			render.xan,
			render.yan,
			render.zan,
			object.getAmbient(),
			object.getContrast()
		);

		if (image == null)
		{
			System.err.println("Could not render object " + entry.id);
			return;
		}

		File out = new File(outputDir, entry.id + ".png");
		ImageIO.write(image, "png", out);
		System.out.println("Wrote " + out.getAbsolutePath());
	}

	private static Map<String, Object> dumpGraphicObject(
		Store store,
		ModelProvider modelProvider,
		SpriteManager spriteManager,
		TextureManager textureManager,
		SpotAnimLoader spotAnimLoader,
		ArchiveFiles spotFiles,
		File outputDir,
		AssetDumperConfig.GraphicObjectEntry entry,
		AssetDumperConfig.RenderSettings render
	) throws IOException
	{
		FSFile file = spotFiles.findFile(entry.id);
		if (file == null)
		{
			System.err.println("Missing spotanim definition " + entry.id);
			return null;
		}

		SpotAnimDefinition spotAnim = spotAnimLoader.load(entry.id, file.getContents());
		SequenceDefinition sequence = AnimationFrameUtil.loadSequence(store, spotAnim.animationId);
		int frameCount = 1;
		if (entry.animated && sequence != null && sequence.frameIDs != null)
		{
			frameCount = sequence.frameIDs.length;
		}

		System.out.println(entry.id + " modelId=" + spotAnim.modelId
			+ " animationId=" + spotAnim.animationId
			+ " frames=" + frameCount
			+ (sequence != null && sequence.frameLengths != null
				? " frameLengths=" + Arrays.toString(sequence.frameLengths) : ""));

		for (int frameIndex = 0; frameIndex < frameCount; frameIndex++)
		{
			ModelDefinition modelDefinition = prepareSpotAnimModel(modelProvider, spotAnim);
			if (modelDefinition == null)
			{
				System.err.println("Could not load model for spotanim " + entry.id);
				break;
			}

			if (entry.animated && sequence != null)
			{
				AnimationFrameUtil.applySequenceFrame(store, modelDefinition, sequence, frameIndex);
			}

			BufferedImage image = ModelRenderUtil.renderModel(
				modelProvider,
				spriteManager,
				textureManager,
				modelDefinition,
				render.width,
				render.height,
				render.zoom,
				render.xan,
				render.yan,
				render.zan,
				spotAnim.ambient,
				spotAnim.contrast
			);

			if (image == null)
			{
				System.err.println("Could not render spotanim " + entry.id + " frame " + frameIndex);
				continue;
			}

			String fileName = frameCount > 1
				? entry.id + "_" + frameIndex + ".png"
				: entry.id + ".png";
			File out = new File(outputDir, fileName);
			ImageIO.write(image, "png", out);
			System.out.println("Wrote " + out.getAbsolutePath());
		}

		Map<String, Object> meta = new LinkedHashMap<>();
		meta.put("animationId", spotAnim.animationId);
		meta.put("frameCount", frameCount);
		if (sequence != null && sequence.frameLengths != null)
		{
			List<Integer> lengths = new ArrayList<>();
			for (int length : sequence.frameLengths)
			{
				lengths.add(length);
			}
			meta.put("frameLengths", lengths);
		}
		return meta;
	}

	private static ModelDefinition prepareSpotAnimModel(ModelProvider modelProvider, SpotAnimDefinition spotAnim) throws IOException
	{
		ModelDefinition modelDefinition = modelProvider.provide(spotAnim.modelId);
		if (modelDefinition == null)
		{
			return null;
		}

		if (spotAnim.resizeX != 128 || spotAnim.resizeY != 128)
		{
			modelDefinition.resize(spotAnim.resizeX, spotAnim.resizeY, spotAnim.resizeY);
		}

		applyRecolors(modelDefinition, spotAnim.recolorToFind, spotAnim.recolorToReplace);
		applyRetextures(modelDefinition, spotAnim.textureToFind, spotAnim.textureToReplace);

		if (spotAnim.rotaton != 0)
		{
			modelDefinition.rotate(spotAnim.rotaton);
		}

		return modelDefinition;
	}

	private static ModelDefinition loadObjectModel(ModelProvider modelProvider, ObjectDefinition object) throws IOException
	{
		int[] modelIds = object.getObjectModels();
		if (modelIds == null || modelIds.length == 0)
		{
			return null;
		}

		ModelDefinition modelDefinition = modelProvider.provide(modelIds[0]);
		if (modelDefinition == null)
		{
			return null;
		}

		if (object.getModelSizeX() != 128 || object.getModelSizeY() != 128 || object.getModelSizeHeight() != 128)
		{
			modelDefinition.resize(object.getModelSizeX(), object.getModelSizeHeight(), object.getModelSizeY());
		}

		applyRecolors(modelDefinition, object.getRecolorToFind(), object.getRecolorToReplace());
		applyRetextures(modelDefinition, object.getRetextureToFind(), object.getTextureToReplace());

		return modelDefinition;
	}

	private static void applyRecolors(ModelDefinition modelDefinition, short[] from, short[] to)
	{
		if (from == null || to == null)
		{
			return;
		}

		for (int i = 0; i < from.length && i < to.length; i++)
		{
			modelDefinition.recolor(from[i], to[i]);
		}
	}

	private static void applyRetextures(ModelDefinition modelDefinition, short[] from, short[] to)
	{
		if (from == null || to == null)
		{
			return;
		}

		for (int i = 0; i < from.length && i < to.length; i++)
		{
			modelDefinition.retexture(from[i], to[i]);
		}
	}

	private static void printUsage()
	{
		System.out.println("Usage: asset-dumper [--cache <cacheDir>] [--config config/assets.json]");
		System.out.println();
		System.out.println("  --cache   Path to OSRS cache directory (or set OSRS_CACHE_DIR)");
		System.out.println("  --config  Asset list config (default: config/assets.json)");
		System.out.println();
		System.out.println("PNG output paths come from config output.* (default: ../src/assets/...).");
	}
}
