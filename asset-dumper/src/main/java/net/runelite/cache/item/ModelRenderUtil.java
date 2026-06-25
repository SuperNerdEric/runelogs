package net.runelite.cache.item;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import net.runelite.cache.definitions.ModelDefinition;
import net.runelite.cache.definitions.providers.ModelProvider;
import net.runelite.cache.definitions.providers.SpriteProvider;
import net.runelite.cache.definitions.providers.TextureProvider;
import net.runelite.cache.models.FaceNormal;
import net.runelite.cache.models.JagexColor;
import net.runelite.cache.models.VertexNormal;

public final class ModelRenderUtil
{
	private static final int FIT_PADDING = 4;

	private ModelRenderUtil()
	{
	}

	public static BufferedImage renderModel(
		ModelProvider modelProvider,
		SpriteProvider spriteProvider,
		TextureProvider textureProvider,
		ModelDefinition modelDefinition,
		int width,
		int height,
		int zoom,
		int xan,
		int yan,
		int zan,
		int ambient,
		int contrast
	) throws IOException
	{
		return renderModel(
			modelProvider,
			spriteProvider,
			textureProvider,
			modelDefinition,
			width,
			height,
			zoom,
			xan,
			yan,
			zan,
			ambient,
			contrast,
			true
		);
	}

	public static BufferedImage renderModel(
		ModelProvider modelProvider,
		SpriteProvider spriteProvider,
		TextureProvider textureProvider,
		ModelDefinition modelDefinition,
		int width,
		int height,
		int zoom,
		int xan,
		int yan,
		int zan,
		int ambient,
		int contrast,
		boolean fitToCanvas
	) throws IOException
	{
		if (modelDefinition == null)
		{
			return null;
		}

		Model model = light(modelDefinition, ambient + 64, contrast + 768, -50, -10, -50);
		if (model == null)
		{
			return null;
		}

		model.calculateBoundsCylinder();

		int rasterizerZoom = 512;
		BufferedImage image = drawLitModel(
			spriteProvider,
			textureProvider,
			model,
			width,
			height,
			zoom,
			xan,
			yan,
			zan,
			rasterizerZoom
		);

		if (fitToCanvas)
		{
			ContentBounds bounds = measureContent(image);
			if (bounds.isValid())
			{
				double fill = bounds.fillRatio(width, height);
				if (fill < 0.92)
				{
					rasterizerZoom = (int) Math.min(8192, 512 / fill * 0.92);
					image = drawLitModel(
						spriteProvider,
						textureProvider,
						model,
						width,
						height,
						zoom,
						xan,
						yan,
						zan,
						rasterizerZoom
					);
				}
			}

			return cropAndCenter(image, FIT_PADDING);
		}

		return image;
	}

	private static BufferedImage drawLitModel(
		SpriteProvider spriteProvider,
		TextureProvider textureProvider,
		Model model,
		int width,
		int height,
		int zoom,
		int xan,
		int yan,
		int zan,
		int rasterizerZoom
	)
	{
		RSTextureProvider rsTextureProvider = new RSTextureProvider(textureProvider, spriteProvider);
		rsTextureProvider.brightness = JagexColor.BRIGHTNESS_MAX;

		SpritePixels spritePixels = new SpritePixels(width, height);
		Graphics3D graphics = new Graphics3D(rsTextureProvider);
		graphics.setBrightness(JagexColor.BRIGHTNESS_MAX);
		graphics.setRasterBuffer(spritePixels.pixels, width, height);
		graphics.reset();
		graphics.setRasterClipping();
		graphics.setOffset(width / 2, height / 2);
		graphics.rasterGouraudLowRes = false;
		graphics.Rasterizer3D_zoom = rasterizerZoom;

		int yOffset = zoom * Graphics3D.SINE[xan] >> 16;
		int zOffset = zoom * Graphics3D.COSINE[xan] >> 16;

		model.projectAndDraw(
			graphics,
			0,
			yan,
			zan,
			xan,
			0,
			model.modelHeight / 2 + yOffset,
			zOffset
		);

		graphics.setRasterBuffer(
			graphics.graphicsPixels,
			graphics.graphicsPixelsWidth,
			graphics.graphicsPixelsHeight
		);
		graphics.setRasterClipping();
		graphics.rasterGouraudLowRes = true;

		return spritePixels.toBufferedImage();
	}

	private static ContentBounds measureContent(BufferedImage image)
	{
		int width = image.getWidth();
		int height = image.getHeight();
		ContentBounds bounds = new ContentBounds();
		bounds.minX = width;
		bounds.minY = height;
		bounds.maxX = -1;
		bounds.maxY = -1;

		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
				if ((image.getRGB(x, y) >>> 24) != 0)
				{
					bounds.minX = Math.min(bounds.minX, x);
					bounds.minY = Math.min(bounds.minY, y);
					bounds.maxX = Math.max(bounds.maxX, x);
					bounds.maxY = Math.max(bounds.maxY, y);
				}
			}
		}

		return bounds;
	}

	private static BufferedImage cropAndCenter(BufferedImage image, int padding)
	{
		int width = image.getWidth();
		int height = image.getHeight();
		ContentBounds bounds = measureContent(image);
		if (!bounds.isValid())
		{
			return image;
		}

		int minX = Math.max(0, bounds.minX - padding);
		int minY = Math.max(0, bounds.minY - padding);
		int maxX = Math.min(width - 1, bounds.maxX + padding);
		int maxY = Math.min(height - 1, bounds.maxY + padding);

		int cropWidth = maxX - minX + 1;
		int cropHeight = maxY - minY + 1;
		BufferedImage cropped = image.getSubimage(minX, minY, cropWidth, cropHeight);

		BufferedImage fitted = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = fitted.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);

		if (cropWidth <= width && cropHeight <= height)
		{
			graphics.drawImage(
				cropped,
				(width - cropWidth) / 2,
				(height - cropHeight) / 2,
				null
			);
		}
		else
		{
			double scale = Math.min((double) width / cropWidth, (double) height / cropHeight);
			int scaledWidth = Math.max(1, (int) Math.round(cropWidth * scale));
			int scaledHeight = Math.max(1, (int) Math.round(cropHeight * scale));
			graphics.drawImage(
				cropped,
				(width - scaledWidth) / 2,
				(height - scaledHeight) / 2,
				scaledWidth,
				scaledHeight,
				null
			);
		}

		graphics.dispose();
		return fitted;
	}

	private static final class ContentBounds
	{
		private int minX;
		private int minY;
		private int maxX;
		private int maxY;

		private boolean isValid()
		{
			return maxX >= minX && maxY >= minY;
		}

		private int width()
		{
			return maxX - minX + 1;
		}

		private int height()
		{
			return maxY - minY + 1;
		}

		private double fillRatio(int canvasWidth, int canvasHeight)
		{
			return Math.max((double) width() / canvasWidth, (double) height() / canvasHeight);
		}
	}

	private static Model light(ModelDefinition def, int ambient, int contrast, int x, int y, int z)
	{
		def.computeNormals();
		int somethingMagnitude = (int) Math.sqrt((double) (z * z + x * x + y * y));
		int var7 = somethingMagnitude * contrast >> 8;
		Model litModel = new Model();
		litModel.faceColors1 = new int[def.faceCount];
		litModel.faceColors2 = new int[def.faceCount];
		litModel.faceColors3 = new int[def.faceCount];
		if (def.numTextureFaces > 0 && def.textureCoords != null)
		{
			int[] var9 = new int[def.numTextureFaces];

			int var10;
			for (var10 = 0; var10 < def.faceCount; ++var10)
			{
				if (def.textureCoords[var10] != -1)
				{
					++var9[def.textureCoords[var10] & 255];
				}
			}

			litModel.numTextureFaces = 0;

			for (var10 = 0; var10 < def.numTextureFaces; ++var10)
			{
				if (var9[var10] > 0 && def.textureRenderTypes[var10] == 0)
				{
					++litModel.numTextureFaces;
				}
			}

			litModel.texIndices1 = new int[litModel.numTextureFaces];
			litModel.texIndices2 = new int[litModel.numTextureFaces];
			litModel.texIndices3 = new int[litModel.numTextureFaces];
			var10 = 0;

			for (int i = 0; i < def.numTextureFaces; ++i)
			{
				if (var9[i] > 0 && def.textureRenderTypes[i] == 0)
				{
					litModel.texIndices1[var10] = def.texIndices1[i] & '\uffff';
					litModel.texIndices2[var10] = def.texIndices2[i] & '\uffff';
					litModel.texIndices3[var10] = def.texIndices3[i] & '\uffff';
					var9[i] = var10++;
				}
				else
				{
					var9[i] = -1;
				}
			}

			litModel.textureCoords = new byte[def.faceCount];

			for (int i = 0; i < def.faceCount; ++i)
			{
				if (def.textureCoords[i] != -1)
				{
					litModel.textureCoords[i] = (byte) var9[def.textureCoords[i] & 255];
				}
				else
				{
					litModel.textureCoords[i] = -1;
				}
			}
		}

		for (int faceIdx = 0; faceIdx < def.faceCount; ++faceIdx)
		{
			byte faceType;
			if (def.faceRenderTypes == null)
			{
				faceType = 0;
			}
			else
			{
				faceType = def.faceRenderTypes[faceIdx];
			}

			byte faceAlpha;
			if (def.faceTransparencies == null)
			{
				faceAlpha = 0;
			}
			else
			{
				faceAlpha = def.faceTransparencies[faceIdx];
			}

			short faceTexture;
			if (def.faceTextures == null)
			{
				faceTexture = -1;
			}
			else
			{
				faceTexture = def.faceTextures[faceIdx];
			}

			if (faceAlpha == -2)
			{
				faceType = 3;
			}

			if (faceAlpha == -1)
			{
				faceType = 2;
			}

			VertexNormal vertexNormal;
			int tmp;
			FaceNormal faceNormal;
			if (faceTexture == -1)
			{
				if (faceType != 0)
				{
					if (faceType == 1)
					{
						faceNormal = def.faceNormals[faceIdx];
						tmp = (y * faceNormal.y + z * faceNormal.z + x * faceNormal.x) / (var7 / 2 + var7) + ambient;
						litModel.faceColors1[faceIdx] = method2608(def.faceColors[faceIdx] & '\uffff', tmp);
						litModel.faceColors3[faceIdx] = -1;
					}
					else if (faceType == 3)
					{
						litModel.faceColors1[faceIdx] = 128;
						litModel.faceColors3[faceIdx] = -1;
					}
					else
					{
						litModel.faceColors3[faceIdx] = -2;
					}
				}
				else
				{
					int var15 = def.faceColors[faceIdx] & '\uffff';
					vertexNormal = def.vertexNormals[def.faceIndices1[faceIdx]];

					tmp = (y * vertexNormal.y + z * vertexNormal.z + x * vertexNormal.x) / (var7 * vertexNormal.magnitude) + ambient;
					litModel.faceColors1[faceIdx] = method2608(var15, tmp);
					vertexNormal = def.vertexNormals[def.faceIndices2[faceIdx]];

					tmp = (y * vertexNormal.y + z * vertexNormal.z + x * vertexNormal.x) / (var7 * vertexNormal.magnitude) + ambient;
					litModel.faceColors2[faceIdx] = method2608(var15, tmp);
					vertexNormal = def.vertexNormals[def.faceIndices3[faceIdx]];

					tmp = (y * vertexNormal.y + z * vertexNormal.z + x * vertexNormal.x) / (var7 * vertexNormal.magnitude) + ambient;
					litModel.faceColors3[faceIdx] = method2608(var15, tmp);
				}
			}
			else if (faceType != 0)
			{
				if (faceType == 1)
				{
					faceNormal = def.faceNormals[faceIdx];
					tmp = (y * faceNormal.y + z * faceNormal.z + x * faceNormal.x) / (var7 / 2 + var7) + ambient;
					litModel.faceColors1[faceIdx] = bound2to126(tmp);
					litModel.faceColors3[faceIdx] = -1;
				}
				else
				{
					litModel.faceColors3[faceIdx] = -2;
				}
			}
			else
			{
				vertexNormal = def.vertexNormals[def.faceIndices1[faceIdx]];

				tmp = (y * vertexNormal.y + z * vertexNormal.z + x * vertexNormal.x) / (var7 * vertexNormal.magnitude) + ambient;
				litModel.faceColors1[faceIdx] = bound2to126(tmp);
				vertexNormal = def.vertexNormals[def.faceIndices2[faceIdx]];

				tmp = (y * vertexNormal.y + z * vertexNormal.z + x * vertexNormal.x) / (var7 * vertexNormal.magnitude) + ambient;
				litModel.faceColors2[faceIdx] = bound2to126(tmp);
				vertexNormal = def.vertexNormals[def.faceIndices3[faceIdx]];

				tmp = (y * vertexNormal.y + z * vertexNormal.z + x * vertexNormal.x) / (var7 * vertexNormal.magnitude) + ambient;
				litModel.faceColors3[faceIdx] = bound2to126(tmp);
			}
		}

		litModel.verticesCount = def.vertexCount;
		litModel.verticesX = def.vertexX;
		litModel.verticesY = def.vertexY;
		litModel.verticesZ = def.vertexZ;
		litModel.indicesCount = def.faceCount;
		litModel.indices1 = def.faceIndices1;
		litModel.indices2 = def.faceIndices2;
		litModel.indices3 = def.faceIndices3;
		litModel.facePriorities = def.faceRenderPriorities;
		litModel.faceTransparencies = def.faceTransparencies;
		litModel.faceTextures = def.faceTextures;
		return litModel;
	}

	private static int method2608(int var0, int var1)
	{
		var1 = ((var0 & 127) * var1) >> 7;
		var1 = bound2to126(var1);
		return (var0 & 65408) + var1;
	}

	private static int bound2to126(int var0)
	{
		if (var0 < 2)
		{
			return 2;
		}
		if (var0 > 126)
		{
			return 126;
		}
		return var0;
	}
}
