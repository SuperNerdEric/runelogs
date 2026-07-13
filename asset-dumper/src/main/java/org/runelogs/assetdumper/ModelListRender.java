package org.runelogs.assetdumper;

import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;
import net.runelite.cache.IndexType;
import net.runelite.cache.NpcManager;
import net.runelite.cache.SpriteManager;
import net.runelite.cache.TextureManager;
import net.runelite.cache.definitions.ModelDefinition;
import net.runelite.cache.definitions.NpcDefinition;
import net.runelite.cache.definitions.loaders.ModelLoader;
import net.runelite.cache.definitions.providers.ModelProvider;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;
import net.runelite.cache.item.ModelMergeUtil;
import net.runelite.cache.item.ModelRenderUtil;

/**
 * Render an explicit list of model ids merged together (no NPC model list).
 *
 * Args: cacheDir outPng w h zoom xan yan crop shiftY modelRotateX npcIdForLighting modelSpec...
 * Each modelSpec is modelId or modelId:shiftX (model-space X nudge before merge).
 */
public final class ModelListRender
{
	static final class ModelSpec
	{
		final int id;
		final int shiftX;

		ModelSpec(int id, int shiftX)
		{
			this.id = id;
			this.shiftX = shiftX;
		}
	}

	public static void main(String[] args) throws Exception
	{
		File cacheDir = new File(args[0]);
		File outFile = new File(args[1]);
		int width = Integer.parseInt(args[2]);
		int height = Integer.parseInt(args[3]);
		int zoom = Integer.parseInt(args[4]);
		int xan = Integer.parseInt(args[5]);
		int yan = Integer.parseInt(args[6]);
		boolean crop = Boolean.parseBoolean(args[7]);
		int shiftY = Integer.parseInt(args[8]);
		int modelRotateX = Integer.parseInt(args[9]);
		int npcId = Integer.parseInt(args[10]);

		ModelSpec[] specs = new ModelSpec[args.length - 11];
		for (int i = 0; i < specs.length; i++)
		{
			specs[i] = parseModelSpec(args[11 + i]);
		}

		try (Store store = CacheOpener.open(cacheDir))
		{
			store.load();
			NpcManager npcManager = new NpcManager(store);
			npcManager.load();
			SpriteManager spriteManager = new SpriteManager(store);
			spriteManager.load();
			TextureManager textureManager = new TextureManager(store);
			textureManager.load();

			ModelProvider modelProvider = id ->
			{
				Storage storage = store.getStorage();
				Index index = store.getIndex(IndexType.MODELS);
				Archive archive = index.getArchive(id);
				if (archive == null)
				{
					return null;
				}
				byte[] data = archive.decompress(storage.loadArchive(archive));
				return new ModelLoader().load(id, data);
			};

			ModelDefinition[] parts = new ModelDefinition[specs.length];
			for (int i = 0; i < specs.length; i++)
			{
				parts[i] = modelProvider.provide(specs[i].id);
				if (parts[i] == null)
				{
					throw new IllegalStateException("Missing model " + specs[i].id);
				}
				if (specs[i].shiftX != 0)
				{
					translateModelX(parts[i], specs[i].shiftX);
				}
			}
			ModelDefinition model = ModelMergeUtil.merge(parts);

			NpcDefinition npc = npcManager.get(npcId);
			if (modelRotateX != 0)
			{
				rotateModelX(model, modelRotateX);
			}

			BufferedImage image = ModelRenderUtil.renderModel(
				modelProvider,
				spriteManager,
				textureManager,
				model,
				width,
				height,
				zoom,
				xan,
				yan,
				0,
				npc.getAmbient(),
				npc.getContrast(),
				false,
				shiftY
			);

			if (image == null)
			{
				throw new IllegalStateException("render returned null");
			}

			if (crop)
			{
				image = cropToOpaque(image, 4);
			}

			File parent = outFile.getParentFile();
			if (parent != null)
			{
				parent.mkdirs();
			}
			ImageIO.write(image, "png", outFile);
			System.out.println("Wrote " + outFile.getAbsolutePath()
				+ " specs=" + java.util.Arrays.toString(specs)
				+ " verts=" + model.vertexCount
				+ " size=" + image.getWidth() + "x" + image.getHeight());
		}
	}

	private static ModelSpec parseModelSpec(String token)
	{
		int colon = token.indexOf(':');
		if (colon < 0)
		{
			return new ModelSpec(Integer.parseInt(token), 0);
		}
		return new ModelSpec(
			Integer.parseInt(token.substring(0, colon)),
			Integer.parseInt(token.substring(colon + 1))
		);
	}

	private static void translateModelX(ModelDefinition model, int dx)
	{
		for (int i = 0; i < model.vertexCount; i++)
		{
			model.vertexX[i] += dx;
		}
		model.setVertexNormals(null);
		model.setFaceNormals(null);
	}

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
		model.setVertexNormals(null);
		model.setFaceNormals(null);
	}

	private static BufferedImage cropToOpaque(BufferedImage src, int pad)
	{
		int minX = src.getWidth();
		int minY = src.getHeight();
		int maxX = -1;
		int maxY = -1;
		for (int y = 0; y < src.getHeight(); y++)
		{
			for (int x = 0; x < src.getWidth(); x++)
			{
				if (((src.getRGB(x, y) >>> 24) & 0xFF) > 8)
				{
					if (x < minX)
					{
						minX = x;
					}
					if (y < minY)
					{
						minY = y;
					}
					if (x > maxX)
					{
						maxX = x;
					}
					if (y > maxY)
					{
						maxY = y;
					}
				}
			}
		}
		if (maxX < minX)
		{
			return src;
		}
		minX = Math.max(0, minX - pad);
		minY = Math.max(0, minY - pad);
		maxX = Math.min(src.getWidth() - 1, maxX + pad);
		maxY = Math.min(src.getHeight() - 1, maxY + pad);
		return src.getSubimage(minX, minY, maxX - minX + 1, maxY - minY + 1);
	}
}
