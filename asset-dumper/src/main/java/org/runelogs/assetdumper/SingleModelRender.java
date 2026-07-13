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
import net.runelite.cache.item.ModelRenderUtil;

/**
 * Render a single model id from cache (no NPC merge).
 *
 * Args: cacheDir modelId outPng [w h zoom xan yan crop shiftY [modelRotateX [npcIdForLighting]]]
 */
public final class SingleModelRender
{
	public static void main(String[] args) throws Exception
	{
		File cacheDir = new File(args[0]);
		int modelId = Integer.parseInt(args[1]);
		File outFile = new File(args[2]);
		int width = args.length > 3 ? Integer.parseInt(args[3]) : 512;
		int height = args.length > 4 ? Integer.parseInt(args[4]) : 512;
		int zoom = args.length > 5 ? Integer.parseInt(args[5]) : 900;
		int xan = args.length > 6 ? Integer.parseInt(args[6]) : 100;
		int yan = args.length > 7 ? Integer.parseInt(args[7]) : 1;
		boolean crop = args.length <= 8 || Boolean.parseBoolean(args[8]);
		int shiftY = args.length > 9 ? Integer.parseInt(args[9]) : 0;
		int modelRotateX = args.length > 10 ? Integer.parseInt(args[10]) : 0;
		int npcId = args.length > 11 ? Integer.parseInt(args[11]) : 14707;

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

			ModelDefinition model = modelProvider.provide(modelId);
			if (model == null)
			{
				throw new IllegalStateException("Missing model " + modelId);
			}

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
				throw new IllegalStateException("render returned null for model " + modelId);
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
				+ " model=" + modelId
				+ " verts=" + model.vertexCount
				+ " size=" + image.getWidth() + "x" + image.getHeight()
				+ " zoom=" + zoom + " xan=" + xan + " yan=" + yan
				+ " rotateX=" + modelRotateX);
		}
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
