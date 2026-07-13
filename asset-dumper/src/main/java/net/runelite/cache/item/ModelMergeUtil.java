package net.runelite.cache.item;

import java.util.Arrays;
import net.runelite.cache.definitions.ModelDefinition;

/**
 * Concatenates multiple {@link ModelDefinition}s into one (NPC multi-part models).
 */
public final class ModelMergeUtil
{
	private ModelMergeUtil()
	{
	}

	public static ModelDefinition merge(ModelDefinition... parts)
	{
		if (parts == null || parts.length == 0)
		{
			return null;
		}
		if (parts.length == 1)
		{
			return parts[0];
		}

		int vertexCount = 0;
		int faceCount = 0;
		int texturedFaceCount = 0;
		boolean hasFacePriorities = false;
		boolean hasFaceTransparencies = false;
		boolean hasFaceTextures = false;
		boolean hasFaceRenderTypes = false;
		boolean hasTextureCoords = false;
		boolean hasPackedVertexGroups = false;
		boolean hasPackedTransparencyVertexGroups = false;

		for (ModelDefinition part : parts)
		{
			if (part == null)
			{
				continue;
			}
			vertexCount += part.vertexCount;
			faceCount += part.faceCount;
			texturedFaceCount += part.numTextureFaces;
			hasFacePriorities |= part.faceRenderPriorities != null;
			hasFaceTransparencies |= part.faceTransparencies != null;
			hasFaceTextures |= part.faceTextures != null;
			hasFaceRenderTypes |= part.faceRenderTypes != null;
			hasTextureCoords |= part.textureCoords != null;
			hasPackedVertexGroups |= part.packedVertexGroups != null;
			hasPackedTransparencyVertexGroups |= part.packedTransparencyVertexGroups != null;
		}

		ModelDefinition merged = new ModelDefinition();
		merged.vertexCount = vertexCount;
		merged.faceCount = faceCount;
		merged.numTextureFaces = texturedFaceCount;
		merged.vertexX = new int[vertexCount];
		merged.vertexY = new int[vertexCount];
		merged.vertexZ = new int[vertexCount];
		merged.faceIndices1 = new int[faceCount];
		merged.faceIndices2 = new int[faceCount];
		merged.faceIndices3 = new int[faceCount];
		merged.faceColors = new short[faceCount];
		if (hasFacePriorities)
		{
			merged.faceRenderPriorities = new byte[faceCount];
			Arrays.fill(merged.faceRenderPriorities, (byte) 0);
		}
		if (hasFaceTransparencies)
		{
			merged.faceTransparencies = new byte[faceCount];
		}
		if (hasFaceTextures)
		{
			merged.faceTextures = new short[faceCount];
			Arrays.fill(merged.faceTextures, (short) -1);
		}
		if (hasFaceRenderTypes)
		{
			merged.faceRenderTypes = new byte[faceCount];
		}
		if (hasTextureCoords)
		{
			merged.textureCoords = new byte[faceCount];
			Arrays.fill(merged.textureCoords, (byte) -1);
		}
		if (texturedFaceCount > 0)
		{
			merged.texIndices1 = new short[texturedFaceCount];
			merged.texIndices2 = new short[texturedFaceCount];
			merged.texIndices3 = new short[texturedFaceCount];
		}
		// Required for classic frame animation (computeAnimationTables → vertexGroups).
		if (hasPackedVertexGroups)
		{
			merged.packedVertexGroups = new int[vertexCount];
		}
		if (hasPackedTransparencyVertexGroups)
		{
			merged.packedTransparencyVertexGroups = new int[faceCount];
		}

		int vertexOffset = 0;
		int faceOffset = 0;
		int texturedOffset = 0;
		for (ModelDefinition part : parts)
		{
			if (part == null)
			{
				continue;
			}

			System.arraycopy(part.vertexX, 0, merged.vertexX, vertexOffset, part.vertexCount);
			System.arraycopy(part.vertexY, 0, merged.vertexY, vertexOffset, part.vertexCount);
			System.arraycopy(part.vertexZ, 0, merged.vertexZ, vertexOffset, part.vertexCount);

			if (merged.packedVertexGroups != null)
			{
				if (part.packedVertexGroups != null)
				{
					System.arraycopy(
						part.packedVertexGroups, 0,
						merged.packedVertexGroups, vertexOffset,
						part.vertexCount
					);
				}
				// else leave zeros (unlabelled verts) for parts without groups
			}

			for (int i = 0; i < part.faceCount; i++)
			{
				merged.faceIndices1[faceOffset + i] = part.faceIndices1[i] + vertexOffset;
				merged.faceIndices2[faceOffset + i] = part.faceIndices2[i] + vertexOffset;
				merged.faceIndices3[faceOffset + i] = part.faceIndices3[i] + vertexOffset;
				merged.faceColors[faceOffset + i] = part.faceColors[i];
				if (merged.faceRenderPriorities != null && part.faceRenderPriorities != null)
				{
					merged.faceRenderPriorities[faceOffset + i] = part.faceRenderPriorities[i];
				}
				if (merged.faceTransparencies != null && part.faceTransparencies != null)
				{
					merged.faceTransparencies[faceOffset + i] = part.faceTransparencies[i];
				}
				if (merged.faceTextures != null && part.faceTextures != null)
				{
					merged.faceTextures[faceOffset + i] = part.faceTextures[i];
				}
				if (merged.faceRenderTypes != null && part.faceRenderTypes != null)
				{
					merged.faceRenderTypes[faceOffset + i] = part.faceRenderTypes[i];
				}
				if (merged.textureCoords != null && part.textureCoords != null)
				{
					byte coord = part.textureCoords[i];
					merged.textureCoords[faceOffset + i] = coord < 0
						? coord
						: (byte) (coord + texturedOffset);
				}
				if (merged.packedTransparencyVertexGroups != null && part.packedTransparencyVertexGroups != null)
				{
					merged.packedTransparencyVertexGroups[faceOffset + i] = part.packedTransparencyVertexGroups[i];
				}
			}

			if (part.numTextureFaces > 0 && merged.texIndices1 != null)
			{
				for (int i = 0; i < part.numTextureFaces; i++)
				{
					merged.texIndices1[texturedOffset + i] = (short) (part.texIndices1[i] + vertexOffset);
					merged.texIndices2[texturedOffset + i] = (short) (part.texIndices2[i] + vertexOffset);
					merged.texIndices3[texturedOffset + i] = (short) (part.texIndices3[i] + vertexOffset);
				}
			}

			vertexOffset += part.vertexCount;
			faceOffset += part.faceCount;
			texturedOffset += part.numTextureFaces;
		}

		return merged;
	}
}
