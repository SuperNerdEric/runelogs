package org.runelogs.assetdumper;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import net.runelite.cache.ConfigType;
import net.runelite.cache.IndexType;
import net.runelite.cache.NpcManager;
import net.runelite.cache.ObjectManager;
import net.runelite.cache.SpriteManager;
import net.runelite.cache.TextureManager;
import net.runelite.cache.definitions.ModelDefinition;
import net.runelite.cache.definitions.NpcDefinition;
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
import net.runelite.cache.item.ModelMergeUtil;
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

		File gameOut = resolveOutputDir(moduleRoot, config.output != null ? config.output.gameObjects : null);
		File graphicOut = resolveOutputDir(moduleRoot, config.output != null ? config.output.graphicObjects : null);
		File npcOut = resolveOutputDir(moduleRoot, config.output != null ? config.output.npcs : null);

		Map<String, Object> dumpMetadata = new LinkedHashMap<>();
		dumpMetadata.put("cacheDir", cacheDir.getAbsolutePath());
		dumpMetadata.put("cacheFormat", CacheOpener.detectFormat(cacheDir).name());
		if (gameOut != null)
		{
			dumpMetadata.put("gameObjectsDir", gameOut.getAbsolutePath());
		}
		if (graphicOut != null)
		{
			dumpMetadata.put("graphicObjectsDir", graphicOut.getAbsolutePath());
		}
		if (npcOut != null)
		{
			dumpMetadata.put("npcsDir", npcOut.getAbsolutePath());
		}

		try (Store store = CacheOpener.open(cacheDir))
		{
			store.load();

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

			if (gameOut != null && config.gameObjects != null && !config.gameObjects.isEmpty())
			{
				gameOut.mkdirs();
				System.out.println("Writing game objects to " + gameOut.getAbsolutePath());

				ObjectManager objectManager = new ObjectManager(store);
				objectManager.load();

				AssetDumperConfig.RenderSettings gameRender = config.render != null
					? config.render.gameObject
					: null;
				if (gameRender == null)
				{
					gameRender = new AssetDumperConfig.RenderSettings();
				}
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
			}

			if (graphicOut != null && config.graphicObjects != null && !config.graphicObjects.isEmpty())
			{
				graphicOut.mkdirs();
				System.out.println("Writing graphic objects to " + graphicOut.getAbsolutePath());

				SpotAnimLoader spotAnimLoader = new SpotAnimLoader();
				Storage storage = store.getStorage();
				Index configIndex = store.getIndex(IndexType.CONFIGS);
				Archive spotArchive = configIndex.getArchive(ConfigType.SPOTANIM.getId());
				ArchiveFiles spotFiles = spotArchive.getFiles(storage.loadArchive(spotArchive));

				AssetDumperConfig.RenderSettings graphicRender = config.render != null
					? config.render.graphicObject
					: null;
				if (graphicRender == null)
				{
					graphicRender = new AssetDumperConfig.RenderSettings();
				}
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

			if (npcOut != null && config.npcs != null && !config.npcs.isEmpty())
			{
				npcOut.mkdirs();
				System.out.println("Writing NPC poses to " + npcOut.getAbsolutePath());

				NpcManager npcManager = new NpcManager(store);
				npcManager.load();

				AssetDumperConfig.RenderSettings npcRender = config.render != null
					? config.render.npc
					: null;
				if (npcRender == null)
				{
					npcRender = new AssetDumperConfig.RenderSettings();
					npcRender.width = 512;
					npcRender.height = 512;
					npcRender.zoom = 900;
					npcRender.xan = 512;
					npcRender.yan = 512;
					npcRender.cropToContent = true;
					npcRender.cropPadding = 4;
				}

				Map<String, Map<String, Object>> npcMetadata = new LinkedHashMap<>();
				for (AssetDumperConfig.NpcPoseEntry entry : config.npcs)
				{
					Map<String, Object> meta = dumpNpcPose(
						store,
						npcManager,
						modelProvider,
						spriteManager,
						textureManager,
						npcOut,
						entry,
						mergeRender(npcRender, entry.overrides)
					);
					if (meta != null)
					{
						String key = entry.outputName != null
							? entry.outputName
							: entry.id + "_" + entry.sequenceId;
						npcMetadata.put(key, meta);
					}
				}
				dumpMetadata.put("npcs", npcMetadata);
			}
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
			if (config == null)
			{
				throw new IllegalArgumentException("Invalid config: " + configPath);
			}
			if (config.gameObjects == null)
			{
				config.gameObjects = Collections.emptyList();
			}
			if (config.graphicObjects == null)
			{
				config.graphicObjects = Collections.emptyList();
			}
			if (config.npcs == null)
			{
				config.npcs = Collections.emptyList();
			}
			if (config.gameObjects.isEmpty() && config.graphicObjects.isEmpty() && config.npcs.isEmpty())
			{
				throw new IllegalArgumentException("Config has no assets to dump: " + configPath);
			}
			return config;
		}
	}

	private static File resolveOutputDir(Path moduleRoot, String relative)
	{
		if (relative == null || relative.trim().isEmpty())
		{
			return null;
		}
		return moduleRoot.resolve(relative).toFile();
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
		merged.postRotateDegrees = overrides.postRotateDegrees != null
			? overrides.postRotateDegrees
			: defaults.postRotateDegrees;
		merged.cropToContent = overrides.cropToContent != null
			? overrides.cropToContent
			: defaults.cropToContent;
		merged.cropPadding = overrides.cropPadding != null
			? overrides.cropPadding
			: defaults.cropPadding;
		merged.fitToCanvas = overrides.fitToCanvas != null
			? overrides.fitToCanvas
			: defaults.fitToCanvas;
		merged.shiftY = overrides.shiftY != null
			? overrides.shiftY
			: defaults.shiftY;
		merged.shiftX = overrides.shiftX != null
			? overrides.shiftX
			: defaults.shiftX;
		merged.modelRotateX = overrides.modelRotateX != null
			? overrides.modelRotateX
			: defaults.modelRotateX;
		return merged;
	}

	/** Pitch model around X (OSRS angle units). Mirrors {@link ModelDefinition#rotate(int)} but for Y/Z. */
	private static void rotateModelX(ModelDefinition model, int angle)
	{
		if (angle == 0)
		{
			return;
		}
		int sin = net.runelite.cache.models.CircularAngle.SINE[angle & 2047];
		int cos = net.runelite.cache.models.CircularAngle.COSINE[angle & 2047];
		for (int i = 0; i < model.vertexCount; i++)
		{
			int y = model.vertexY[i];
			int z = model.vertexZ[i];
			model.vertexY[i] = (y * cos - z * sin) >> 16;
			model.vertexZ[i] = (z * cos + y * sin) >> 16;
		}
		// Invalidate cached normals so lighting recomputes after the pitch.
		model.setVertexNormals(null);
		model.setFaceNormals(null);
	}

	private static BufferedImage cropToOpaqueBounds(BufferedImage image, int padding)
	{
		int width = image.getWidth();
		int height = image.getHeight();
		int minX = width;
		int minY = height;
		int maxX = 0;
		int maxY = 0;

		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
				if ((image.getRGB(x, y) >>> 24) != 0)
				{
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x);
					maxY = Math.max(maxY, y);
				}
			}
		}

		if (maxX < minX)
		{
			return image;
		}

		minX = Math.max(0, minX - padding);
		minY = Math.max(0, minY - padding);
		maxX = Math.min(width - 1, maxX + padding);
		maxY = Math.min(height - 1, maxY + padding);

		int cropWidth = maxX - minX + 1;
		int cropHeight = maxY - minY + 1;
		BufferedImage cropped = new BufferedImage(cropWidth, cropHeight, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = cropped.createGraphics();
		graphics.drawImage(
			image,
			0,
			0,
			cropWidth,
			cropHeight,
			minX,
			minY,
			maxX + 1,
			maxY + 1,
			null
		);
		graphics.dispose();
		return cropped;
	}

	private static BufferedImage rotateImageClockwise(BufferedImage image, int degrees)
	{
		int width = image.getWidth();
		int height = image.getHeight();
		BufferedImage rotated = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = rotated.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		graphics.rotate(Math.toRadians(degrees), width / 2.0, height / 2.0);
		graphics.drawImage(image, 0, 0, null);
		graphics.dispose();
		return rotated;
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

		boolean fitToCanvas = render.fitToCanvas == null || render.fitToCanvas;
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
			object.getContrast(),
			fitToCanvas
		);

		if (image == null)
		{
			System.err.println("Could not render object " + entry.id);
			return;
		}

		if (render.postRotateDegrees != null && render.postRotateDegrees != 0)
		{
			image = rotateImageClockwise(image, render.postRotateDegrees);
		}

		if (Boolean.TRUE.equals(render.cropToContent))
		{
			int padding = render.cropPadding != null ? render.cropPadding : 2;
			image = cropToOpaqueBounds(image, padding);
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
		int startFrame = 0;
		if (entry.animated && sequence != null && sequence.frameIDs != null)
		{
			frameCount = sequence.frameIDs.length;
		}
		else if (entry.frame != null)
		{
			startFrame = entry.frame;
			frameCount = 1;
		}

		String baseName = entry.outputName != null && !entry.outputName.trim().isEmpty()
			? entry.outputName.trim()
			: String.valueOf(entry.id);

		System.out.println(entry.id + " modelId=" + spotAnim.modelId
			+ " animationId=" + spotAnim.animationId
			+ " frames=" + (entry.animated ? frameCount : ("[" + startFrame + "]"))
			+ (sequence != null && sequence.frameLengths != null
				? " frameLengths=" + Arrays.toString(sequence.frameLengths) : ""));

		for (int offset = 0; offset < frameCount; offset++)
		{
			int frameIndex = entry.animated ? offset : startFrame;
			ModelDefinition modelDefinition = prepareSpotAnimModel(modelProvider, spotAnim);
			if (modelDefinition == null)
			{
				System.err.println("Could not load model for spotanim " + entry.id);
				break;
			}

			if (sequence != null && (entry.animated || entry.frame != null))
			{
				AnimationFrameUtil.applySequenceFrame(store, modelDefinition, sequence, frameIndex);
			}

			boolean fitToCanvas = render.fitToCanvas == null || render.fitToCanvas;
			int shiftX = render.shiftX != null ? render.shiftX : 0;
			int shiftY = render.shiftY != null ? render.shiftY : 0;
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
				spotAnim.contrast,
				fitToCanvas,
				shiftX,
				shiftY
			);

			if (image == null)
			{
				System.err.println("Could not render spotanim " + entry.id + " frame " + frameIndex);
				continue;
			}

			if (render.postRotateDegrees != null && render.postRotateDegrees != 0)
			{
				image = rotateImageClockwise(image, render.postRotateDegrees);
			}

			if (Boolean.TRUE.equals(render.cropToContent))
			{
				int padding = render.cropPadding != null ? render.cropPadding : 2;
				image = cropToOpaqueBounds(image, padding);
			}

			String fileName;
			if (entry.animated && frameCount > 1)
			{
				fileName = baseName + "_" + frameIndex + ".png";
			}
			else
			{
				fileName = baseName + ".png";
			}
			File out = new File(outputDir, fileName);
			File parent = out.getParentFile();
			if (parent != null)
			{
				parent.mkdirs();
			}
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

	private static Map<String, Object> dumpNpcPose(
		Store store,
		NpcManager npcManager,
		ModelProvider modelProvider,
		SpriteManager spriteManager,
		TextureManager textureManager,
		File outputDir,
		AssetDumperConfig.NpcPoseEntry entry,
		AssetDumperConfig.RenderSettings render
	) throws IOException
	{
		NpcDefinition npc = npcManager.get(entry.id);
		if (npc == null)
		{
			System.err.println("Missing NPC definition " + entry.id);
			return null;
		}

		int sequenceId = entry.sequenceId >= 0 ? entry.sequenceId : npc.getStandingAnimation();
		SequenceDefinition sequence = AnimationFrameUtil.loadSequence(store, sequenceId);
		int frameCount = 1;
		int startFrame = 0;
		if (entry.animated && sequence != null && sequence.frameIDs != null)
		{
			frameCount = sequence.frameIDs.length;
		}
		else if (entry.frame != null)
		{
			startFrame = entry.frame;
			frameCount = 1;
		}

		String baseName = entry.outputName != null && !entry.outputName.trim().isEmpty()
			? entry.outputName.trim()
			: entry.id + "_" + sequenceId;

		System.out.println(entry.id + " name=" + npc.getName()
			+ " models=" + Arrays.toString(npc.getModels())
			+ " sequenceId=" + sequenceId
			+ " frames=" + (entry.animated ? frameCount : ("[" + startFrame + "]")));

		for (int offset = 0; offset < frameCount; offset++)
		{
			int frameIndex = entry.animated ? offset : startFrame;
			ModelDefinition modelDefinition = prepareNpcModel(modelProvider, npc);
			if (modelDefinition == null)
			{
				System.err.println("Could not load model for NPC " + entry.id);
				break;
			}

			if (sequence != null)
			{
				AnimationFrameUtil.applySequenceFrame(store, modelDefinition, sequence, frameIndex);
			}

			if (render.modelRotateX != null && render.modelRotateX != 0)
			{
				rotateModelX(modelDefinition, render.modelRotateX);
			}

			boolean fitToCanvas = render.fitToCanvas == null || render.fitToCanvas;
			int shiftX = render.shiftX != null ? render.shiftX : 0;
			int shiftY = render.shiftY != null ? render.shiftY : 0;
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
				npc.getAmbient(),
				npc.getContrast(),
				fitToCanvas,
				shiftX,
				shiftY
			);

			if (image == null)
			{
				System.err.println("Could not render NPC " + entry.id + " frame " + frameIndex);
				continue;
			}

			if (render.postRotateDegrees != null && render.postRotateDegrees != 0)
			{
				image = rotateImageClockwise(image, render.postRotateDegrees);
			}

			if (Boolean.TRUE.equals(render.cropToContent))
			{
				int padding = render.cropPadding != null ? render.cropPadding : 2;
				image = cropToOpaqueBounds(image, padding);
			}

			String fileName = entry.animated && frameCount > 1
				? baseName + "_" + frameIndex + ".png"
				: baseName + ".png";
			File out = new File(outputDir, fileName);
			File parent = out.getParentFile();
			if (parent != null)
			{
				parent.mkdirs();
			}
			ImageIO.write(image, "png", out);
			System.out.println("Wrote " + out.getAbsolutePath());
		}

		Map<String, Object> meta = new LinkedHashMap<>();
		meta.put("npcId", entry.id);
		meta.put("sequenceId", sequenceId);
		meta.put("frameCount", entry.animated ? frameCount : 1);
		if (entry.frame != null)
		{
			meta.put("frame", entry.frame);
		}
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

	private static ModelDefinition prepareNpcModel(ModelProvider modelProvider, NpcDefinition npc) throws IOException
	{
		int[] modelIds = npc.getModels();
		if (modelIds == null || modelIds.length == 0)
		{
			return null;
		}

		ModelDefinition[] parts = new ModelDefinition[modelIds.length];
		for (int i = 0; i < modelIds.length; i++)
		{
			ModelDefinition part = modelProvider.provide(modelIds[i]);
			if (part == null)
			{
				System.err.println("Missing model " + modelIds[i] + " for NPC " + npc.getId());
				return null;
			}
			parts[i] = part;
		}

		ModelDefinition modelDefinition = ModelMergeUtil.merge(parts);
		if (modelDefinition == null)
		{
			return null;
		}

		if (npc.getWidthScale() != 128 || npc.getHeightScale() != 128)
		{
			modelDefinition.resize(npc.getWidthScale(), npc.getHeightScale(), npc.getWidthScale());
		}

		applyRecolors(modelDefinition, npc.getRecolorToFind(), npc.getRecolorToReplace());
		applyRetextures(modelDefinition, npc.getRetextureToFind(), npc.getRetextureToReplace());

		return modelDefinition;
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
