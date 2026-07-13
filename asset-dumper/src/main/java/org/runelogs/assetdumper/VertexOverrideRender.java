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
 * One-off: apply Maya-posed vertex overrides from JSON and render via ModelRenderUtil.
 *
 * Args: cacheDir vertsJson outPng [w h zoom xan yan crop shiftY [npcId [modelRotateX [shiftX [tx ty tz [digitalZoom [focusX focusY [modelRotateY]]]]]]]]
 * shiftX/shiftY are screen-space pixels (positive = model right / lower on canvas).
 * tx/ty/tz are model-space vertex translates applied after Maya Y-flip (use to center a point of interest).
 * digitalZoom (>=2) renders at zoom*size with scaled shifts, then crops w×h around focusX/focusY (base-canvas pixels; default = center).
 * npcId defaults to 12817 (Javelin Colossus); pass 14707 for Doom of Mokhaiotl.
 * modelRotateX is OSRS angle units (e.g. 1664 tips burrowed Doom face toward camera).
 * modelRotateY is OSRS yaw units applied via ModelDefinition.rotate (turn model toward camera without changing cam yan).
 */
public final class VertexOverrideRender
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
		int width = args.length > 3 ? Integer.parseInt(args[3]) : 384;
		int height = args.length > 4 ? Integer.parseInt(args[4]) : 512;
		int zoom = args.length > 5 ? Integer.parseInt(args[5]) : 900;
		int xan = args.length > 6 ? Integer.parseInt(args[6]) : 100;
		int yan = args.length > 7 ? Integer.parseInt(args[7]) : 1;
		boolean crop = args.length <= 8 || Boolean.parseBoolean(args[8]);
		int shiftY = args.length > 9 ? Integer.parseInt(args[9]) : 0;
		int npcId = args.length > 10 ? Integer.parseInt(args[10]) : 12817;
		int modelRotateX = args.length > 11 ? Integer.parseInt(args[11]) : 0;
		int shiftX = args.length > 12 ? Integer.parseInt(args[12]) : 0;
		int tx = args.length > 13 ? Integer.parseInt(args[13]) : 0;
		int ty = args.length > 14 ? Integer.parseInt(args[14]) : 0;
		int tz = args.length > 15 ? Integer.parseInt(args[15]) : 0;
		int digitalZoom = args.length > 16 ? Integer.parseInt(args[16]) : 1;
		if (digitalZoom < 1)
		{
			digitalZoom = 1;
		}
		int focusX = args.length > 17 ? Integer.parseInt(args[17]) : width / 2;
		int focusY = args.length > 18 ? Integer.parseInt(args[18]) : height / 2;
		int modelRotateY = args.length > 19 ? Integer.parseInt(args[19]) : 0;

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

			NpcDefinition npc = npcManager.get(npcId);
			ModelDefinition[] parts = new ModelDefinition[npc.getModels().length];
			for (int i = 0; i < npc.getModels().length; i++)
			{
				parts[i] = modelProvider.provide(npc.getModels()[i]);
			}
			ModelDefinition model = ModelMergeUtil.merge(parts);
			if (model.vertexCount != verts.vertexCount)
			{
				throw new IllegalStateException(
					"vertexCount mismatch model=" + model.vertexCount + " json=" + verts.vertexCount
				);
			}

			System.arraycopy(verts.vertexX, 0, model.vertexX, 0, verts.vertexCount);
			// Maya verts from osrscachereader: flip Y for ModelRenderUtil AND flip X so
			// handedness matches in-game (spear in right hand). Two axis flips
			// preserve triangle winding (no reverse needed).
			for (int i = 0; i < verts.vertexCount; i++)
			{
				model.vertexX[i] = -verts.vertexX[i];
				model.vertexY[i] = -verts.vertexY[i];
			}
			System.arraycopy(verts.vertexZ, 0, model.vertexZ, 0, verts.vertexCount);
			model.setFaceNormals(null);
			model.setVertexNormals(null);

			if (tx != 0 || ty != 0 || tz != 0)
			{
				for (int i = 0; i < model.vertexCount; i++)
				{
					model.vertexX[i] += tx;
					model.vertexY[i] += ty;
					model.vertexZ[i] += tz;
				}
			}

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

			// digitalZoom > 1: crop a 1/digitalZoom window around focus, then scale up to w×h.
			// (OSRS zoom is camera-distance in absolute pixels; enlarging the canvas alone does not magnify.)
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

			if (digitalZoom > 1)
			{
				int cropW = Math.max(1, width / digitalZoom);
				int cropH = Math.max(1, height / digitalZoom);
				int x0 = Math.max(0, Math.min(width - cropW, focusX - cropW / 2));
				int y0 = Math.max(0, Math.min(height - cropH, focusY - cropH / 2));
				BufferedImage cropped = image.getSubimage(x0, y0, cropW, cropH);
				BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
				java.awt.Graphics2D g = scaled.createGraphics();
				g.setRenderingHint(
					java.awt.RenderingHints.KEY_INTERPOLATION,
					java.awt.RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR
				);
				g.drawImage(cropped, 0, 0, width, height, null);
				g.dispose();
				image = scaled;
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
				+ " frame=" + verts.frame
				+ " size=" + image.getWidth() + "x" + image.getHeight()
				+ " shiftX=" + shiftX
				+ " shiftY=" + shiftY
				+ " t=[" + tx + "," + ty + "," + tz + "]"
				+ " digitalZoom=" + digitalZoom
				+ " focus=[" + focusX + "," + focusY + "]"
				+ " rotateX=" + modelRotateX
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
