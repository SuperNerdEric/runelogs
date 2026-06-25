package org.runelogs.assetdumper;

import java.util.List;

public class AssetDumperConfig
{
	public OutputPaths output;
	public List<AssetEntry> gameObjects;
	public List<GraphicObjectEntry> graphicObjects;
	public RenderConfig render;

	public static class OutputPaths
	{
		public String gameObjects;
		public String graphicObjects;
	}

	public static class AssetEntry
	{
		public int id;
		public String comment;
		public RenderSettings overrides;
	}

	public static class GraphicObjectEntry extends AssetEntry
	{
		public boolean animated = true;
	}

	public static class RenderSettings
	{
		public int width = 384;
		public int height = 384;
		public int zoom = 700;
		public int xan = 512;
		public int yan = 512;
		public int zan = 0;
	}

	public static class RenderConfig
	{
		public RenderSettings gameObject;
		public RenderSettings graphicObject;
	}
}
