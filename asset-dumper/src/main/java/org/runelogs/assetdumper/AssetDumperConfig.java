package org.runelogs.assetdumper;

import java.util.Collections;
import java.util.List;

public class AssetDumperConfig
{
	public OutputPaths output;
	public List<AssetEntry> gameObjects = Collections.emptyList();
	public List<GraphicObjectEntry> graphicObjects = Collections.emptyList();
	public List<NpcPoseEntry> npcs = Collections.emptyList();
	public RenderConfig render;

	public static class OutputPaths
	{
		public String gameObjects;
		public String graphicObjects;
		public String npcs;
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
		/** When set (and animated is false), dump only this frame. */
		public Integer frame;
		/** Output basename without extension (supports {@code subdir/name}). Defaults to {@code id}. */
		public String outputName;
	}

	/**
	 * NPC model posed with an explicit sequence (attack anims are not on NpcDefinition).
	 */
	public static class NpcPoseEntry extends AssetEntry
	{
		/** Sequence / animation ID to apply (e.g. attack pose). */
		public int sequenceId;
		/** When true, dump every frame as {@code outputName_N.png}. */
		public boolean animated = true;
		/** When set (and animated is false), dump only this frame. */
		public Integer frame;
		/** Output basename without extension (supports {@code subdir/name}). Defaults to {@code id_sequenceId}. */
		public String outputName;
	}

	public static class RenderSettings
	{
		public int width = 384;
		public int height = 384;
		public int zoom = 700;
		public int xan = 512;
		public int yan = 512;
		public int zan = 0;
		/** Clockwise rotation applied to the rendered PNG before saving. */
		public Integer postRotateDegrees;
		/** Trim transparent margins after other post-processing. */
		public Boolean cropToContent;
		/** Pixels of padding kept around cropped content (default 2). */
		public Integer cropPadding;
		/**
		 * When true (default), auto-scale the model to fill ~92% of the canvas.
		 * Disable for wide ground FX (e.g. dig circles) that otherwise get clipped.
		 */
		public Boolean fitToCanvas;
		/**
		 * Screen-space vertical offset in pixels applied at render time.
		 * Positive moves the model down on the canvas so lower geometry (cape, base)
		 * can clip off the bottom. Prefer with fitToCanvas false and cropToContent false
		 * so empty space above is preserved. (Model-space translation is cancelled by
		 * camera look-at; this shifts the projection center instead.)
		 */
		public Integer shiftY;
		/**
		 * Screen-space horizontal offset in pixels. Positive moves the projected model
		 * right on the canvas (projection center shifts right).
		 */
		public Integer shiftX;
		/**
		 * Pitch the model around X before render (OSRS angle units, 2048 = 360°).
		 * 512 ≈ 90° — tips an upward-facing plate (e.g. burrowed Mokhaiotl) toward the camera
		 * so mid-angle xan reads as a front face instead of overhead.
		 */
		public Integer modelRotateX;
	}

	public static class RenderConfig
	{
		public RenderSettings gameObject;
		public RenderSettings graphicObject;
		public RenderSettings npc;
	}
}
