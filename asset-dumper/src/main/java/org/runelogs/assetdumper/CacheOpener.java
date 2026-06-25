package org.runelogs.assetdumper;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import net.runelite.cache.fs.Store;
import net.runelite.cache.fs.flat.FlatStorage;

public final class CacheOpener
{
	private CacheOpener()
	{
	}

	public enum CacheFormat
	{
		DISK,
		FLAT_FILE
	}

	public static CacheFormat detectFormat(File cacheDir)
	{
		if (new File(cacheDir, "main_file_cache.dat2").isFile())
		{
			return CacheFormat.DISK;
		}

		File[] entries = cacheDir.listFiles();
		if (entries != null)
		{
			for (File entry : entries)
			{
				if (entry.isFile() && entry.getName().endsWith(".flatcache"))
				{
					return CacheFormat.FLAT_FILE;
				}
			}
		}

		throw new IllegalArgumentException(
			"Unrecognized cache layout in " + cacheDir.getAbsolutePath() + ". "
				+ "Expected Jagex disk cache (main_file_cache.dat2 + main_file_cache.idx*) "
				+ "or OpenRS2 flat-file cache (*.flatcache). "
				+ "See asset-dumper/README.md for download instructions."
		);
	}

	public static Store open(File cacheDir) throws IOException
	{
		CacheFormat format = detectFormat(cacheDir);
		System.out.println("Cache format: " + format + " (" + cacheDir.getAbsolutePath() + ")");

		switch (format)
		{
			case DISK:
				return new Store(cacheDir);
			case FLAT_FILE:
				return new Store(new FlatStorage(cacheDir));
			default:
				throw new IllegalStateException("Unhandled cache format: " + format);
		}
	}

	public static File resolveCacheDirectory(String cacheArg)
	{
		if (cacheArg != null && !cacheArg.isBlank())
		{
			return new File(cacheArg);
		}

		String env = System.getenv("OSRS_CACHE_DIR");
		if (env != null && !env.isBlank())
		{
			return new File(env);
		}

		throw new IllegalArgumentException(
			"Cache directory required. Pass --cache <path> or set OSRS_CACHE_DIR."
		);
	}

	public static Path resolveModuleRoot(Path configPath)
	{
		// config/assets.json -> asset-dumper/
		Path parent = configPath.toAbsolutePath().getParent();
		if (parent == null)
		{
			throw new IllegalArgumentException("Invalid config path: " + configPath);
		}
		return parent.getParent();
	}
}
