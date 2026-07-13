package net.runelite.cache.item;

import java.io.IOException;
import net.runelite.cache.ConfigType;
import net.runelite.cache.IndexType;
import net.runelite.cache.definitions.FrameDefinition;
import net.runelite.cache.definitions.FramemapDefinition;
import net.runelite.cache.definitions.ModelDefinition;
import net.runelite.cache.definitions.SequenceDefinition;
import net.runelite.cache.definitions.loaders.FrameLoader;
import net.runelite.cache.definitions.loaders.FramemapLoader;
import net.runelite.cache.definitions.loaders.SequenceLoader;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.ArchiveFiles;
import net.runelite.cache.fs.FSFile;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;

public final class AnimationFrameUtil
{
	private AnimationFrameUtil()
	{
	}

	public static SequenceDefinition loadSequence(Store store, int sequenceId) throws IOException
	{
		if (sequenceId < 0)
		{
			return null;
		}

		Storage storage = store.getStorage();
		Index configIndex = store.getIndex(IndexType.CONFIGS);
		Archive sequenceArchive = configIndex.getArchive(ConfigType.SEQUENCE.getId());
		ArchiveFiles sequenceFiles = sequenceArchive.getFiles(storage.loadArchive(sequenceArchive));
		FSFile file = sequenceFiles.findFile(sequenceId);
		if (file == null)
		{
			return null;
		}

		return new SequenceLoader().load(sequenceId, file.getContents());
	}

	public static FrameDefinition loadFrame(Store store, int frameId) throws IOException
	{
		int archiveId = frameId >>> 16;
		int fileId = frameId & 0xFFFF;

		Storage storage = store.getStorage();
		Index frameIndex = store.getIndex(IndexType.ANIMATIONS);
		Archive frameArchive = frameIndex.getArchive(archiveId);
		if (frameArchive == null)
		{
			return null;
		}

		ArchiveFiles frameFiles = frameArchive.getFiles(storage.loadArchive(frameArchive));
		FSFile frameFile = frameFiles.findFile(fileId);
		if (frameFile == null)
		{
			return null;
		}

		byte[] contents = frameFile.getContents();
		int framemapArchiveId = (contents[0] & 0xFF) << 8 | (contents[1] & 0xFF);

		Index framemapIndex = store.getIndex(IndexType.SKELETONS);
		Archive framemapArchive = framemapIndex.getArchive(framemapArchiveId);
		if (framemapArchive == null)
		{
			return null;
		}

		byte[] framemapContents = framemapArchive.decompress(storage.loadArchive(framemapArchive));
		FramemapDefinition framemap = new FramemapLoader().load(framemapArchive.getArchiveId(), framemapContents);
		return new FrameLoader().load(framemap, frameFile.getFileId(), contents);
	}

	public static void applyFrame(ModelDefinition model, FrameDefinition frame)
	{
		if (frame == null || frame.framemap == null)
		{
			return;
		}

		model.computeAnimationTables();
		if (model.getVertexGroups() == null)
		{
			// Multi-part merges must copy packedVertexGroups; without them animate() NPEs.
			return;
		}
		model.resetAnim();

		for (int i = 0; i < frame.translatorCount; i++)
		{
			int boneIndex = frame.indexFrameIds[i];
			int type = frame.framemap.types[boneIndex];
			int[] frameMap = frame.framemap.frameMaps[boneIndex];
			model.animate(
				type,
				frameMap,
				frame.translator_x[i],
				frame.translator_y[i],
				frame.translator_z[i]
			);
		}
	}

	public static void applySequenceFrame(Store store, ModelDefinition model, SequenceDefinition sequence, int frameIndex) throws IOException
	{
		if (sequence == null || sequence.frameIDs == null || frameIndex < 0 || frameIndex >= sequence.frameIDs.length)
		{
			return;
		}

		FrameDefinition frame = loadFrame(store, sequence.frameIDs[frameIndex]);
		applyFrame(model, frame);
	}
}
