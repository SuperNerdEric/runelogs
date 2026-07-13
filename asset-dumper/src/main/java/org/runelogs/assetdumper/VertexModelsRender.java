package org.runelogs.assetdumper;

import com.google.gson.Gson;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileReader;
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
 * Like VertexOverrideRender but with an explicit model id list (for spear-only / no-spear layers).
 *
 * Args: cacheDir vertsJson outPng w h zoom xan yan crop shiftY lightingNpcId modelRotateX shiftX modelRotateY modelId...
 */
public final class VertexModelsRender
{
	static final class Verts
	{
		int frame;
		int sequenceId;
		int vertexCount;
		int[] vertexX;
		int[] vertexY;
		int[] vertexZ;
	}

	public static void main(String[] args) throws Exception
	{
		File cacheDir = new File(args[0]);
		File vertsFile = new File(args[1]);
		File outFile = new File(args[2]);
		int width = Integer.parseInt(args[3]);
		int height = Integer.parseInt(args[4]);
		int zoom = Integer.parseInt(args[5]);
		int xan = Integer.parseInt(args[6]);
		int yan = Integer.parseInt(args[7]);
		boolean crop = Boolean.parseBoolean(args[8]);
		int shiftY = Integer.parseInt(args[9]);
		int lightingNpcId = Integer.parseInt(args[10]);
		int modelRotateX = Integer.parseInt(args[11]);
		int shiftX = Integer.parseInt(args[12]);
		int modelRotateY = Integer.parseInt(args[13]);
		java.util.List<Integer> modelIdList = new java.util.ArrayList<>();
		java.util.List<int[]> hideRanges = new java.util.ArrayList<>();
		for (int i = 14; i < args.length; i++)
		{
			if (args[i].startsWith("hide:"))
			{
				String[] parts = args[i].substring(5).split(":");
				hideRanges.add(new int[] { Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) });
			}
			else
			{
				modelIdList.add(Integer.parseInt(args[i]));
			}
		}
		int[] modelIds = modelIdList.stream().mapToInt(Integer::intValue).toArray();

		Verts verts = new Gson().fromJson(new FileReader(vertsFile), Verts.class);

		try (Store store = CacheOpener.open(cacheDir))
		{
			store.load();
			NpcManager npcManager = new NpcManager(store);
			npcManager.load();
			SpriteManager spriteManager = new SpriteManager(store);
			spriteManager.load();
			TextureManager textureManager = new TextureManager(store);
			textureManager.load();

			ModelProvider modelProvider = modelId ->
			{
				Storage storage = store.getStorage();
				Index index = store.getIndex(IndexType.MODELS);
				Archive archive = index.getArchive(modelId);
				if (archive == null)
				{
					return null;
				}
				byte[] data = archive.decompress(storage.loadArchive(archive));
				return new ModelLoader().load(modelId, data);
			};

			ModelDefinition[] parts = new ModelDefinition[modelIds.length];
			for (int i = 0; i < modelIds.length; i++)
			{
				parts[i] = modelProvider.provide(modelIds[i]);
				if (parts[i] == null)
				{
					throw new IllegalStateException("Missing model " + modelIds[i]);
				}
			}
			ModelDefinition model = ModelMergeUtil.merge(parts);
			if (model.vertexCount != verts.vertexCount)
			{
				throw new IllegalStateException(
					"vertexCount mismatch model=" + model.vertexCount + " json=" + verts.vertexCount
				);
			}

			System.arraycopy(verts.vertexX, 0, model.vertexX, 0, verts.vertexCount);
			for (int i = 0; i < verts.vertexCount; i++)
			{
				model.vertexX[i] = -verts.vertexX[i];
				model.vertexY[i] = -verts.vertexY[i];
			}
			System.arraycopy(verts.vertexZ, 0, model.vertexZ, 0, verts.vertexCount);
			model.setFaceNormals(null);
			model.setVertexNormals(null);

			NpcDefinition npc = npcManager.get(lightingNpcId);
			if (npc.getWidthScale() != 128 || npc.getHeightScale() != 128)
			{
				model.resize(npc.getWidthScale(), npc.getHeightScale(), npc.getWidthScale());
			}
			if (modelRotateX != 0)
			{
				rotateModelX(model, modelRotateX);
			}
			if (modelRotateY != 0)
			{
				model.rotate(modelRotateY & 2047);
			}

			if (!hideRanges.isEmpty())
			{
				// Remove faces entirely (transparency still writes depth in the soft rasterizer).
				boolean[] hide = new boolean[model.faceCount];
				for (int[] range : hideRanges)
				{
					int end = Math.min(model.faceCount, range[0] + range[1]);
					for (int i = range[0]; i < end; i++)
					{
						hide[i] = true;
					}
				}
				int keep = 0;
				for (boolean h : hide)
				{
					if (!h)
					{
						keep++;
					}
				}
				int[] f1 = new int[keep];
				int[] f2 = new int[keep];
				int[] f3 = new int[keep];
				short[] colors = model.faceColors == null ? null : new short[keep];
				byte[] alphas = model.faceTransparencies == null ? null : new byte[keep];
				byte[] prios = model.faceRenderPriorities == null ? null : new byte[keep];
				byte[] types = model.faceRenderTypes == null ? null : new byte[keep];
				short[] textures = model.faceTextures == null ? null : new short[keep];
				int o = 0;
				for (int i = 0; i < model.faceCount; i++)
				{
					if (hide[i])
					{
						continue;
					}
					f1[o] = model.faceIndices1[i];
					f2[o] = model.faceIndices2[i];
					f3[o] = model.faceIndices3[i];
					if (colors != null)
					{
						colors[o] = model.faceColors[i];
					}
					if (alphas != null)
					{
						alphas[o] = model.faceTransparencies[i];
					}
					if (prios != null)
					{
						prios[o] = model.faceRenderPriorities[i];
					}
					if (types != null)
					{
						types[o] = model.faceRenderTypes[i];
					}
					if (textures != null)
					{
						textures[o] = model.faceTextures[i];
					}
					o++;
				}
				model.faceCount = keep;
				model.faceIndices1 = f1;
				model.faceIndices2 = f2;
				model.faceIndices3 = f3;
				if (colors != null)
				{
					model.faceColors = colors;
				}
				if (alphas != null)
				{
					model.faceTransparencies = alphas;
				}
				if (prios != null)
				{
					model.faceRenderPriorities = prios;
				}
				if (types != null)
				{
					model.faceRenderTypes = types;
				}
				if (textures != null)
				{
					model.faceTextures = textures;
				}
				model.setFaceNormals(null);
				model.setVertexNormals(null);
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
				shiftX,
				shiftY
			);
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
				+ " models=" + java.util.Arrays.toString(modelIds)
				+ " size=" + image.getWidth() + "x" + image.getHeight()
				+ " rotateY=" + modelRotateY);
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

	private static BufferedImage cropToOpaque(BufferedImage image, int pad)
	{
		int width = image.getWidth();
		int height = image.getHeight();
		int minX = width;
		int minY = height;
		int maxX = -1;
		int maxY = -1;
		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
				if (((image.getRGB(x, y) >> 24) & 0xFF) > 8)
				{
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
				}
			}
		}
		if (maxX < minX)
		{
			return image;
		}
		minX = Math.max(0, minX - pad);
		minY = Math.max(0, minY - pad);
		maxX = Math.min(width - 1, maxX + pad);
		maxY = Math.min(height - 1, maxY + pad);
		return image.getSubimage(minX, minY, maxX - minX + 1, maxY - minY + 1);
	}
}
