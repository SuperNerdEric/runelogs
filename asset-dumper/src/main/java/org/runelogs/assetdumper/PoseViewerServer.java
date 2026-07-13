package org.runelogs.assetdumper;

import com.google.gson.Gson;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import javax.imageio.ImageIO;
import net.runelite.cache.ConfigType;
import net.runelite.cache.IndexType;
import net.runelite.cache.NpcManager;
import net.runelite.cache.SpriteManager;
import net.runelite.cache.TextureManager;
import net.runelite.cache.definitions.ModelDefinition;
import net.runelite.cache.definitions.NpcDefinition;
import net.runelite.cache.definitions.SequenceDefinition;
import net.runelite.cache.definitions.loaders.ModelLoader;
import net.runelite.cache.definitions.loaders.SequenceLoader;
import net.runelite.cache.definitions.providers.ModelProvider;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.ArchiveFiles;
import net.runelite.cache.fs.FSFile;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;
import net.runelite.cache.item.AnimationFrameUtil;
import net.runelite.cache.item.ModelMergeUtil;
import net.runelite.cache.item.ModelRenderUtil;

/**
 * Generic local Maya pose / camera picker for any NPC with Maya animations.
 *
 * Args: cacheDir vertsRoot [port] [uiHtmlPath]
 *
 * System properties:
 *   pose.exportScript  path to export-npc-maya.mjs (enables on-demand export)
 *   pose.nodeModules   NODE_PATH for osrscachereader
 *
 * vertsRoot may be:
 *   - a sequence folder containing verts_0.json …
 *   - a parent folder containing {sequenceId}/verts_*.json
 *
 * Opens http://127.0.0.1:PORT/
 */
public final class PoseViewerServer
{
	private static final Gson GSON = new Gson();

	static final class Verts
	{
		int frame;
		int sequenceId;
		int vertexCount;
		int[] vertexX;
		int[] vertexY;
		int[] vertexZ;
	}

	static final class SeqInfo
	{
		final int sequenceId;
		final File dir;
		final int maxFrame;
		final int vertexCount;

		SeqInfo(int sequenceId, File dir, int maxFrame, int vertexCount)
		{
			this.sequenceId = sequenceId;
			this.dir = dir;
			this.maxFrame = maxFrame;
			this.vertexCount = vertexCount;
		}
	}

	static final class FaceRange
	{
		final int modelId;
		final int start;
		final int count;

		FaceRange(int modelId, int start, int count)
		{
			this.modelId = modelId;
			this.start = start;
			this.count = count;
		}
	}

	static final class AxisFix
	{
		final boolean flipX;
		final boolean flipY;
		final boolean flipZ;
		final boolean reverseWinding;

		AxisFix(boolean flipX, boolean flipY, boolean flipZ, boolean reverseWinding)
		{
			this.flipX = flipX;
			this.flipY = flipY;
			this.flipZ = flipZ;
			this.reverseWinding = reverseWinding;
		}
	}

	private static final String[] ANIM_SLOT_NAMES = {
		"standing", "idleRotateLeft", "idleRotateRight", "walking",
		"rotate180", "rotateLeft", "rotateRight",
		"run", "runRotate180", "runRotateLeft", "runRotateRight",
		"crawl", "crawlRotate180", "crawlRotateLeft", "crawlRotateRight"
	};

	private final File cacheDir;
	private final File vertsRoot;
	private final File uiHtml;
	private final File exportScript;
	private final File nodeModules;
	private final ConcurrentHashMap<Integer, SeqInfo> sequences = new ConcurrentHashMap<>();
	private final Store store;
	private final NpcManager npcManager;
	private final SpriteManager spriteManager;
	private final TextureManager textureManager;
	private final ModelProvider modelProvider;
	private final Set<Integer> mayaSequenceIds;
	private final ConcurrentHashMap<String, byte[]> pngCache = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Verts> vertsCache = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<Integer, List<FaceRange>> faceRangeCache = new ConcurrentHashMap<>();
	private volatile List<Map<String, Object>> mayaNpcs = List.of();
	private final Object renderLock = new Object();
	private final Object exportLock = new Object();

	private PoseViewerServer(File cacheDir, File vertsRoot, File uiHtml) throws Exception
	{
		this.cacheDir = cacheDir;
		this.vertsRoot = vertsRoot;
		this.uiHtml = uiHtml;
		String exportProp = System.getProperty("pose.exportScript", "");
		String nodeProp = System.getProperty("pose.nodeModules", "");
		this.exportScript = exportProp.isBlank() ? null : new File(exportProp);
		this.nodeModules = nodeProp.isBlank() ? null : new File(nodeProp);
		if (!vertsRoot.isDirectory() && !vertsRoot.mkdirs())
		{
			throw new IllegalStateException("Cannot create verts root: " + vertsRoot.getAbsolutePath());
		}
		rescanSequences();
		this.store = CacheOpener.open(cacheDir);
		this.store.load();
		this.npcManager = new NpcManager(store);
		this.npcManager.load();
		this.spriteManager = new SpriteManager(store);
		this.spriteManager.load();
		this.textureManager = new TextureManager(store);
		this.textureManager.load();
		this.modelProvider = modelId ->
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
		System.out.println("Indexing Maya sequences…");
		this.mayaSequenceIds = loadMayaSequenceIds();
		System.out.println("Maya sequences in cache: " + mayaSequenceIds.size());
		this.mayaNpcs = buildMayaNpcs();
		System.out.println("Maya NPCs: " + mayaNpcs.size()
			+ " (exported sequences on disk: " + sequences.size() + ")");
		if (exportScript != null)
		{
			System.out.println("On-demand export: " + exportScript.getAbsolutePath());
		}
	}

	public static void main(String[] args) throws Exception
	{
		if (args.length < 2)
		{
			System.err.println("Usage: PoseViewerServer cacheDir vertsRoot [port] [uiHtmlPath]");
			System.exit(1);
		}
		File cacheDir = new File(args[0]);
		File vertsRoot = new File(args[1]);
		int port = args.length > 2 ? Integer.parseInt(args[2]) : 8765;
		File uiHtml = args.length > 3
			? new File(args[3])
			: new File("tools/pose-viewer/index.html");

		System.out.println("Loading cache from " + cacheDir.getAbsolutePath() + " …");
		PoseViewerServer viewer = new PoseViewerServer(cacheDir, vertsRoot, uiHtml);
		System.out.println("Verts root: " + vertsRoot.getAbsolutePath()
			+ " (" + viewer.sequences.size() + " exported sequence(s), "
			+ viewer.mayaNpcs.size() + " Maya NPC(s))");

		HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
		server.createContext("/", viewer::handleRoot);
		server.createContext("/api/meta", viewer::handleMeta);
		server.createContext("/api/npc", viewer::handleNpc);
		server.createContext("/api/ensure", viewer::handleEnsure);
		server.createContext("/api/render", viewer::handleRender);
		server.setExecutor(Executors.newFixedThreadPool(4));
		server.start();
		System.out.println("Maya pose viewer: http://127.0.0.1:" + port + "/");
		System.out.println("Ctrl+C to stop.");
	}

	private void rescanSequences()
	{
		Map<Integer, SeqInfo> scanned = scanSequences(vertsRoot);
		sequences.clear();
		sequences.putAll(scanned);
		vertsCache.clear();
		pngCache.clear();
	}

	private static Map<Integer, SeqInfo> scanSequences(File root)
	{
		Map<Integer, SeqInfo> out = new LinkedHashMap<>();
		if (!root.isDirectory())
		{
			return out;
		}
		int directMax = maxFrameIn(root);
		if (directMax >= 0)
		{
			int seqId = guessSeqId(root);
			out.put(seqId, new SeqInfo(seqId, root, directMax, peekVertexCount(root)));
			return out;
		}
		File[] kids = root.listFiles(File::isDirectory);
		if (kids == null)
		{
			return out;
		}
		Arrays.sort(kids, (a, b) -> a.getName().compareToIgnoreCase(b.getName()));
		for (File kid : kids)
		{
			int max = maxFrameIn(kid);
			if (max < 0)
			{
				continue;
			}
			int seqId;
			try
			{
				seqId = Integer.parseInt(kid.getName());
			}
			catch (NumberFormatException e)
			{
				seqId = guessSeqId(kid);
			}
			out.put(seqId, new SeqInfo(seqId, kid, max, peekVertexCount(kid)));
		}
		return out;
	}

	private static int peekVertexCount(File dir)
	{
		File sample = new File(dir, "verts_0.json");
		if (!sample.isFile())
		{
			File[] files = dir.listFiles((d, name) -> name.matches("verts_\\d+\\.json"));
			if (files == null || files.length == 0)
			{
				return -1;
			}
			sample = files[0];
		}
		try (FileReader reader = new FileReader(sample))
		{
			Verts v = GSON.fromJson(reader, Verts.class);
			return v != null ? v.vertexCount : -1;
		}
		catch (Exception e)
		{
			return -1;
		}
	}

	private static int maxFrameIn(File dir)
	{
		File[] files = dir.listFiles((d, name) -> name.matches("verts_\\d+\\.json"));
		if (files == null || files.length == 0)
		{
			return -1;
		}
		int max = -1;
		for (File f : files)
		{
			String n = f.getName();
			int frame = Integer.parseInt(n.substring(6, n.length() - 5));
			if (frame > max)
			{
				max = frame;
			}
		}
		return max;
	}

	private static int guessSeqId(File dir)
	{
		File sample = new File(dir, "verts_0.json");
		if (!sample.isFile())
		{
			File[] files = dir.listFiles((d, name) -> name.matches("verts_\\d+\\.json"));
			if (files != null && files.length > 0)
			{
				sample = files[0];
			}
		}
		if (sample != null && sample.isFile())
		{
			try (FileReader reader = new FileReader(sample))
			{
				Verts v = GSON.fromJson(reader, Verts.class);
				if (v != null && v.sequenceId > 0)
				{
					return v.sequenceId;
				}
			}
			catch (Exception ignored)
			{
			}
		}
		try
		{
			return Integer.parseInt(dir.getName());
		}
		catch (NumberFormatException e)
		{
			return 0;
		}
	}

	private void handleRoot(HttpExchange ex) throws IOException
	{
		if (!"GET".equals(ex.getRequestMethod()))
		{
			send(ex, 405, "text/plain", "GET only");
			return;
		}
		if (!uiHtml.isFile())
		{
			send(ex, 500, "text/plain", "Missing UI: " + uiHtml.getAbsolutePath());
			return;
		}
		byte[] body = Files.readAllBytes(uiHtml.toPath());
		Headers h = ex.getResponseHeaders();
		h.set("Content-Type", "text/html; charset=utf-8");
		h.set("Cache-Control", "no-store");
		ex.sendResponseHeaders(200, body.length);
		try (OutputStream os = ex.getResponseBody())
		{
			os.write(body);
		}
	}

	private void handleMeta(HttpExchange ex) throws IOException
	{
		List<Map<String, Object>> seqs = new ArrayList<>();
		for (SeqInfo s : sequences.values())
		{
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("sequenceId", s.sequenceId);
			row.put("maxFrame", s.maxFrame);
			row.put("vertexCount", s.vertexCount);
			row.put("dir", s.dir.getAbsolutePath());
			seqs.add(row);
		}
		List<Map<String, Object>> npcs = mayaNpcs;
		int defaultNpc = 12821;
		boolean hasDefaultNpc = false;
		for (Map<String, Object> n : npcs)
		{
			if (Integer.valueOf(12821).equals(n.get("id")))
			{
				hasDefaultNpc = true;
				break;
			}
		}
		if (!hasDefaultNpc && !npcs.isEmpty())
		{
			defaultNpc = (Integer) npcs.get(0).get("id");
		}
		// Prefer Sol Heredit grapple telegraph (shipped icon camera).
		int defaultSeq = sequences.containsKey(10884)
			? 10884
			: sequences.containsKey(10887)
				? 10887
				: !sequences.isEmpty() ? sequences.keySet().iterator().next() : -1;
		if (defaultSeq < 0)
		{
			NpcDefinition npc = npcManager.get(defaultNpc);
			List<Integer> slots = npcMayaSequenceIds(npc);
			if (!slots.isEmpty())
			{
				defaultSeq = slots.get(0);
			}
		}
		SeqInfo def = defaultSeq >= 0 ? sequences.get(defaultSeq) : null;
		boolean hereditGrapple = defaultNpc == 12821 && defaultSeq == 10884;

		Map<String, Object> defaults = new LinkedHashMap<>();
		defaults.put("npcId", defaultNpc);
		defaults.put("sequenceId", defaultSeq);
		defaults.put("frame", hereditGrapple ? 33 : 0);
		defaults.put("width", 640);
		defaults.put("height", 640);
		defaults.put("zoom", hereditGrapple ? 565 : 500);
		defaults.put("xan", hereditGrapple ? 75 : 0);
		defaults.put("yan", hereditGrapple ? 1024 : 0);
		defaults.put("rotateX", 0);
		defaults.put("rotateY", hereditGrapple ? 257 : 0);
		defaults.put("shiftX", hereditGrapple ? -142 : 0);
		defaults.put("shiftY", hereditGrapple ? -9 : 0);
		defaults.put("modelsOnTop", hereditGrapple ? "52578,52582" : "");
		defaults.put("flipX", true);
		defaults.put("flipY", true);
		defaults.put("flipZ", false);
		defaults.put("reverseWinding", false);
		defaults.put("ambient", hereditGrapple ? 75 : 64);
		defaults.put("contrast", hereditGrapple ? 20 : 0);

		Map<String, Object> meta = new LinkedHashMap<>();
		meta.put("vertsRoot", vertsRoot.getAbsolutePath());
		meta.put("sequences", seqs);
		meta.put("npcs", npcs);
		meta.put("mayaSequenceCount", mayaSequenceIds.size());
		meta.put("canExport", exportScript != null && exportScript.isFile());
		meta.put("defaultMaxFrame", def != null ? def.maxFrame : 0);
		meta.put("defaults", defaults);
		writeJson(ex, meta);
	}

	private void handleNpc(HttpExchange ex) throws IOException
	{
		try
		{
			Map<String, String> q = query(ex.getRequestURI());
			int npcId = parseInt(q, "id", 12821);
			NpcDefinition npc = npcManager.get(npcId);
			if (npc == null)
			{
				send(ex, 404, "text/plain", "Unknown NPC " + npcId);
				return;
			}
			if (npc.getModels() == null || npc.getModels().length == 0)
			{
				send(ex, 400, "text/plain", "NPC " + npcId + " has no models");
				return;
			}
			List<FaceRange> ranges = faceRangesForNpc(npc);
			int vertexCount = npcVertexCount(npc);
			List<Map<String, Object>> models = new ArrayList<>();
			for (FaceRange r : ranges)
			{
				Map<String, Object> m = new LinkedHashMap<>();
				m.put("modelId", r.modelId);
				m.put("faceStart", r.start);
				m.put("faceCount", r.count);
				models.add(m);
			}

			List<Map<String, Object>> animSlots = new ArrayList<>();
			int[] slotIds = npcAnimSlotIds(npc);
			Set<Integer> seen = new LinkedHashSet<>();
			for (int i = 0; i < slotIds.length; i++)
			{
				int sid = slotIds[i];
				if (sid < 0 || !mayaSequenceIds.contains(sid) || !seen.add(sid))
				{
					continue;
				}
				Map<String, Object> row = new LinkedHashMap<>();
				row.put("sequenceId", sid);
				row.put("slot", ANIM_SLOT_NAMES[i]);
				row.put("maya", true);
				SeqInfo exported = sequences.get(sid);
				row.put("exported", exported != null);
				if (exported != null)
				{
					row.put("maxFrame", exported.maxFrame);
					row.put("vertexCount", exported.vertexCount);
				}
				animSlots.add(row);
			}

			List<Map<String, Object>> compatible = new ArrayList<>();
			for (SeqInfo s : sequences.values())
			{
				if (s.vertexCount == vertexCount)
				{
					Map<String, Object> row = new LinkedHashMap<>();
					row.put("sequenceId", s.sequenceId);
					row.put("maxFrame", s.maxFrame);
					row.put("vertexCount", s.vertexCount);
					row.put("exported", true);
					compatible.add(row);
				}
			}

			Map<String, Object> out = new LinkedHashMap<>();
			out.put("id", npcId);
			out.put("name", cleanNpcName(npc.getName()));
			out.put("ambient", npc.getAmbient());
			out.put("contrast", npc.getContrast());
			out.put("widthScale", npc.getWidthScale());
			out.put("heightScale", npc.getHeightScale());
			out.put("vertexCount", vertexCount);
			out.put("models", models);
			out.put("mayaSequences", animSlots);
			out.put("compatibleSequences", compatible);
			out.put("canExport", exportScript != null && exportScript.isFile());
			writeJson(ex, out);
		}
		catch (Exception e)
		{
			e.printStackTrace();
			send(ex, 500, "text/plain", e.toString());
		}
	}

	private void handleEnsure(HttpExchange ex) throws IOException
	{
		if (!"GET".equals(ex.getRequestMethod()) && !"POST".equals(ex.getRequestMethod()))
		{
			send(ex, 405, "text/plain", "GET or POST");
			return;
		}
		try
		{
			Map<String, String> q = query(ex.getRequestURI());
			int npcId = parseInt(q, "npcId", -1);
			int sequenceId = parseInt(q, "sequenceId", -1);
			boolean force = Boolean.parseBoolean(q.getOrDefault("force", "false"));
			if (npcId < 0 || sequenceId < 0)
			{
				send(ex, 400, "text/plain", "npcId and sequenceId required");
				return;
			}
			NpcDefinition npc = npcManager.get(npcId);
			if (npc == null || npc.getModels() == null || npc.getModels().length == 0)
			{
				send(ex, 404, "text/plain", "Unknown NPC " + npcId);
				return;
			}
			SequenceDefinition seqDef = AnimationFrameUtil.loadSequence(store, sequenceId);
			if (seqDef == null)
			{
				send(ex, 404, "text/plain", "Unknown sequence " + sequenceId);
				return;
			}
			if (seqDef.getAnimMayaID() <= 0)
			{
				send(ex, 400, "text/plain", "Sequence " + sequenceId + " is not a Maya animation");
				return;
			}

			SeqInfo existing = sequences.get(sequenceId);
			if (existing != null && !force)
			{
				Map<String, Object> out = new LinkedHashMap<>();
				out.put("ok", true);
				out.put("exported", true);
				out.put("cached", true);
				out.put("sequenceId", sequenceId);
				out.put("maxFrame", existing.maxFrame);
				out.put("vertexCount", existing.vertexCount);
				writeJson(ex, out);
				return;
			}

			if (exportScript == null || !exportScript.isFile())
			{
				send(ex, 500, "text/plain", "Export script not configured (pose.exportScript)");
				return;
			}

			int needVerts = npcVertexCount(npc);
			synchronized (exportLock)
			{
				existing = sequences.get(sequenceId);
				if (existing != null && !force)
				{
					Map<String, Object> out = new LinkedHashMap<>();
					out.put("ok", true);
					out.put("exported", true);
					out.put("cached", true);
					out.put("sequenceId", sequenceId);
					out.put("maxFrame", existing.maxFrame);
					out.put("vertexCount", existing.vertexCount);
					writeJson(ex, out);
					return;
				}
				System.out.println("Exporting Maya verts: npc=" + npcId + " seq=" + sequenceId + " …");
				runExport(npc, sequenceId);
				rescanSequences();
			}
			existing = sequences.get(sequenceId);
			if (existing == null)
			{
				send(ex, 500, "text/plain", "Export finished but verts not found for sequence " + sequenceId);
				return;
			}
			if (existing.vertexCount != needVerts)
			{
				send(ex, 500, "text/plain",
					"Exported verts (" + existing.vertexCount + ") do not match NPC models (" + needVerts + ")");
				return;
			}
			Map<String, Object> out = new LinkedHashMap<>();
			out.put("ok", true);
			out.put("exported", true);
			out.put("cached", false);
			out.put("sequenceId", sequenceId);
			out.put("maxFrame", existing.maxFrame);
			out.put("vertexCount", existing.vertexCount);
			out.put("dir", existing.dir.getAbsolutePath());
			writeJson(ex, out);
		}
		catch (Exception e)
		{
			e.printStackTrace();
			send(ex, 500, "text/plain", e.toString());
		}
	}

	private void runExport(NpcDefinition npc, int sequenceId) throws IOException, InterruptedException
	{
		StringBuilder models = new StringBuilder();
		for (int i = 0; i < npc.getModels().length; i++)
		{
			if (i > 0)
			{
				models.append(',');
			}
			models.append(npc.getModels()[i]);
		}
		List<String> cmd = new ArrayList<>();
		cmd.add(findNode());
		cmd.add(exportScript.getAbsolutePath());
		cmd.add("--cache");
		cmd.add(cacheDir.getAbsolutePath());
		cmd.add("--out");
		cmd.add(vertsRoot.getAbsolutePath());
		cmd.add("--models");
		cmd.add(models.toString());
		cmd.add("--sequenceId");
		cmd.add(String.valueOf(sequenceId));

		ProcessBuilder pb = new ProcessBuilder(cmd);
		pb.directory(exportScript.getParentFile());
		pb.redirectErrorStream(true);
		if (nodeModules != null && nodeModules.isDirectory())
		{
			String existing = pb.environment().getOrDefault("NODE_PATH", "");
			String path = nodeModules.getAbsolutePath();
			pb.environment().put("NODE_PATH", existing.isBlank() ? path : path + File.pathSeparator + existing);
		}
		Process proc = pb.start();
		String log;
		try (InputStream in = proc.getInputStream())
		{
			log = new String(in.readAllBytes(), StandardCharsets.UTF_8);
		}
		int code = proc.waitFor();
		System.out.println(log);
		if (code != 0)
		{
			throw new IOException("Export failed (exit " + code + "):\n" + log);
		}
	}

	private static String findNode()
	{
		String fromEnv = System.getenv("NODE_BINARY");
		if (fromEnv != null && !fromEnv.isBlank())
		{
			return fromEnv;
		}
		return "node";
	}

	private void handleRender(HttpExchange ex) throws IOException
	{
		long t0 = System.currentTimeMillis();
		try
		{
			Map<String, String> q = query(ex.getRequestURI());
			int npcId = parseInt(q, "npcId", 12821);
			int defaultSeq = sequences.containsKey(10884)
				? 10884
				: sequences.containsKey(10887)
					? 10887
					: (!sequences.isEmpty() ? sequences.keySet().iterator().next() : 0);
			int sequenceId = parseInt(q, "sequenceId", defaultSeq);
			int frame = parseInt(q, "frame", 0);
			int width = parseInt(q, "width", 640);
			int height = parseInt(q, "height", 640);
			int zoom = parseInt(q, "zoom", 500);
			int xan = parseInt(q, "xan", 0);
			int yan = parseInt(q, "yan", 0);
			int rotateX = parseInt(q, "rotateX", 0);
			int rotateY = parseInt(q, "rotateY", 0);
			int shiftX = parseInt(q, "shiftX", 0);
			int shiftY = parseInt(q, "shiftY", 0);
			int ambient = parseInt(q, "ambient", 64);
			int contrast = parseInt(q, "contrast", 0);
			boolean flipX = Boolean.parseBoolean(q.getOrDefault("flipX", "true"));
			boolean flipY = Boolean.parseBoolean(q.getOrDefault("flipY", "true"));
			boolean flipZ = Boolean.parseBoolean(q.getOrDefault("flipZ", "false"));
			boolean reverseWinding = q.containsKey("reverseWinding")
				? Boolean.parseBoolean(q.get("reverseWinding"))
				: ((flipX ? 1 : 0) + (flipY ? 1 : 0) + (flipZ ? 1 : 0)) % 2 == 1;
			boolean nocache = Boolean.parseBoolean(q.getOrDefault("nocache", "false"));
			List<Integer> modelsOnTop = parseIdList(q.getOrDefault("modelsOnTop", ""));

			String key = npcId + "|" + sequenceId + "|" + frame + "|" + width + "x" + height
				+ "|" + zoom + "|" + xan + "|" + yan + "|" + rotateX + "|" + rotateY
				+ "|" + shiftX + "|" + shiftY + "|" + ambient + "|" + contrast
				+ "|" + flipX + "|" + flipY + "|" + flipZ + "|" + reverseWinding
				+ "|" + modelsOnTop;
			byte[] png = nocache ? null : pngCache.get(key);
			if (png == null)
			{
				synchronized (renderLock)
				{
					png = nocache ? null : pngCache.get(key);
					if (png == null)
					{
						AxisFix axis = new AxisFix(flipX, flipY, flipZ, reverseWinding);
						BufferedImage image = render(npcId, sequenceId, frame, width, height, zoom, xan, yan,
							rotateX, rotateY, shiftX, shiftY, ambient, contrast, axis, modelsOnTop);
						ByteArrayOutputStream baos = new ByteArrayOutputStream();
						ImageIO.write(image, "png", baos);
						png = baos.toByteArray();
						if (!nocache)
						{
							pngCache.put(key, png);
						}
					}
				}
			}

			Headers h = ex.getResponseHeaders();
			h.set("Content-Type", "image/png");
			h.set("Cache-Control", "no-store");
			h.set("X-Render-Ms", String.valueOf(System.currentTimeMillis() - t0));
			ex.sendResponseHeaders(200, png.length);
			try (OutputStream os = ex.getResponseBody())
			{
				os.write(png);
			}
		}
		catch (Exception e)
		{
			e.printStackTrace();
			send(ex, 500, "text/plain", e.toString());
		}
	}

	private BufferedImage render(
		int npcId, int sequenceId, int frame, int width, int height, int zoom, int xan, int yan,
		int rotateX, int rotateY, int shiftX, int shiftY, int ambient, int contrast,
		AxisFix axis, List<Integer> modelsOnTop
	) throws Exception
	{
		NpcDefinition npc = npcManager.get(npcId);
		if (npc == null || npc.getModels() == null || npc.getModels().length == 0)
		{
			throw new IllegalStateException("Unknown NPC " + npcId);
		}
		int[] modelIds = npc.getModels();
		int needVerts = npcVertexCount(npc);
		SeqInfo seq = resolveSequence(sequenceId, needVerts);
		if (seq == null)
		{
			throw new IllegalStateException(
				"Sequence " + sequenceId + " not exported for NPC " + npcId
					+ " (vertexCount=" + needVerts + "). Call /api/ensure first."
			);
		}
		if (frame > seq.maxFrame)
		{
			frame = seq.maxFrame;
		}
		Verts verts = loadVerts(seq.sequenceId, frame);
		List<FaceRange> ranges = faceRangesForNpc(npc);

		if (modelsOnTop == null || modelsOnTop.isEmpty())
		{
			ModelDefinition model = buildModel(modelIds, verts, rotateX, rotateY, npc, axis, Collections.emptyList());
			return ModelRenderUtil.renderModel(
				modelProvider, spriteManager, textureManager, model,
				width, height, zoom, xan, yan, 0,
				ambient, contrast, false, shiftX, shiftY
			);
		}

		// Painter's-algorithm fix: hide selected parts on the base pass, redraw them on top.
		List<int[]> baseHide = new ArrayList<>();
		for (Integer mid : modelsOnTop)
		{
			FaceRange r = findRange(ranges, mid);
			if (r != null)
			{
				baseHide.add(new int[] { r.start, r.count });
			}
		}
		ModelDefinition base = buildModel(modelIds, verts, rotateX, rotateY, npc, axis, baseHide);
		BufferedImage out = ModelRenderUtil.renderModel(
			modelProvider, spriteManager, textureManager, base,
			width, height, zoom, xan, yan, 0,
			ambient, contrast, false, shiftX, shiftY
		);
		Graphics2D g = out.createGraphics();
		for (Integer mid : modelsOnTop)
		{
			FaceRange keep = findRange(ranges, mid);
			if (keep == null)
			{
				continue;
			}
			List<int[]> hideOthers = new ArrayList<>();
			for (FaceRange r : ranges)
			{
				if (r.modelId != mid)
				{
					hideOthers.add(new int[] { r.start, r.count });
				}
			}
			ModelDefinition part = buildModel(modelIds, verts, rotateX, rotateY, npc, axis, hideOthers);
			g.drawImage(ModelRenderUtil.renderModel(
				modelProvider, spriteManager, textureManager, part,
				width, height, zoom, xan, yan, 0,
				ambient, contrast, false, shiftX, shiftY
			), 0, 0, null);
		}
		g.dispose();
		return out;
	}

	private SeqInfo resolveSequence(int requested, int vertexCount)
	{
		SeqInfo requestedSeq = sequences.get(requested);
		if (requestedSeq != null && requestedSeq.vertexCount == vertexCount)
		{
			return requestedSeq;
		}
		return null;
	}

	private int npcVertexCount(NpcDefinition npc) throws IOException
	{
		int total = 0;
		for (int modelId : npc.getModels())
		{
			ModelDefinition part = modelProvider.provide(modelId);
			if (part == null)
			{
				throw new IllegalStateException("Missing model " + modelId);
			}
			total += part.vertexCount;
		}
		return total;
	}

	private Set<Integer> loadMayaSequenceIds() throws IOException
	{
		Storage storage = store.getStorage();
		Index configIndex = store.getIndex(IndexType.CONFIGS);
		Archive sequenceArchive = configIndex.getArchive(ConfigType.SEQUENCE.getId());
		ArchiveFiles sequenceFiles = sequenceArchive.getFiles(storage.loadArchive(sequenceArchive));
		SequenceLoader loader = new SequenceLoader();
		Set<Integer> out = new HashSet<>();
		for (FSFile file : sequenceFiles.getFiles())
		{
			SequenceDefinition seq = loader.load(file.getFileId(), file.getContents());
			if (seq != null && seq.getAnimMayaID() > 0)
			{
				out.add(seq.getId());
			}
		}
		return Collections.unmodifiableSet(out);
	}

	private static int[] npcAnimSlotIds(NpcDefinition npc)
	{
		return new int[] {
			npc.getStandingAnimation(),
			npc.getIdleRotateLeftAnimation(),
			npc.getIdleRotateRightAnimation(),
			npc.getWalkingAnimation(),
			npc.getRotate180Animation(),
			npc.getRotateLeftAnimation(),
			npc.getRotateRightAnimation(),
			npc.getRunAnimation(),
			npc.getRunRotate180Animation(),
			npc.getRunRotateLeftAnimation(),
			npc.getRunRotateRightAnimation(),
			npc.getCrawlAnimation(),
			npc.getCrawlRotate180Animation(),
			npc.getCrawlRotateLeftAnimation(),
			npc.getCrawlRotateRightAnimation()
		};
	}

	private List<Integer> npcMayaSequenceIds(NpcDefinition npc)
	{
		if (npc == null)
		{
			return List.of();
		}
		LinkedHashSet<Integer> ids = new LinkedHashSet<>();
		for (int sid : npcAnimSlotIds(npc))
		{
			if (sid >= 0 && mayaSequenceIds.contains(sid))
			{
				ids.add(sid);
			}
		}
		return new ArrayList<>(ids);
	}

	private List<Map<String, Object>> buildMayaNpcs() throws IOException
	{
		Set<Integer> vertCounts = new HashSet<>();
		for (SeqInfo s : sequences.values())
		{
			if (s.vertexCount > 0)
			{
				vertCounts.add(s.vertexCount);
			}
		}
		List<Map<String, Object>> out = new ArrayList<>();
		for (NpcDefinition npc : npcManager.getNpcs())
		{
			int[] models = npc.getModels();
			if (models == null || models.length == 0)
			{
				continue;
			}
			List<Integer> mayaSlots = npcMayaSequenceIds(npc);
			int vertexCount;
			try
			{
				vertexCount = npcVertexCount(npc);
			}
			catch (Exception e)
			{
				continue;
			}
			boolean matchesExport = vertCounts.contains(vertexCount);
			if (mayaSlots.isEmpty() && !matchesExport)
			{
				continue;
			}
			List<Integer> seqIds = new ArrayList<>(mayaSlots);
			for (SeqInfo s : sequences.values())
			{
				if (s.vertexCount == vertexCount && !seqIds.contains(s.sequenceId))
				{
					seqIds.add(s.sequenceId);
				}
			}
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("id", npc.getId());
			row.put("name", cleanNpcName(npc.getName()));
			row.put("vertexCount", vertexCount);
			row.put("sequenceIds", seqIds);
			row.put("mayaSlotCount", mayaSlots.size());
			out.add(row);
		}
		out.sort((a, b) ->
		{
			String na = String.valueOf(a.get("name"));
			String nb = String.valueOf(b.get("name"));
			int c = na.compareToIgnoreCase(nb);
			if (c != 0)
			{
				return c;
			}
			return Integer.compare((Integer) a.get("id"), (Integer) b.get("id"));
		});
		return out;
	}

	private static String cleanNpcName(String name)
	{
		if (name == null || name.isBlank())
		{
			return "Unknown";
		}
		return name.replaceAll("<[^>]+>", "").trim();
	}

	private List<FaceRange> faceRangesForNpc(NpcDefinition npc) throws IOException
	{
		return faceRangeCache.computeIfAbsent(npc.getId(), id ->
		{
			try
			{
				List<FaceRange> ranges = new ArrayList<>();
				int faceOff = 0;
				for (int modelId : npc.getModels())
				{
					ModelDefinition part = modelProvider.provide(modelId);
					if (part == null)
					{
						throw new IllegalStateException("Missing model " + modelId);
					}
					ranges.add(new FaceRange(modelId, faceOff, part.faceCount));
					faceOff += part.faceCount;
				}
				return ranges;
			}
			catch (IOException e)
			{
				throw new RuntimeException(e);
			}
		});
	}

	private static FaceRange findRange(List<FaceRange> ranges, int modelId)
	{
		for (FaceRange r : ranges)
		{
			if (r.modelId == modelId)
			{
				return r;
			}
		}
		return null;
	}

	private ModelDefinition buildModel(
		int[] modelIds, Verts verts, int rotateX, int rotateY, NpcDefinition lightingNpc,
		AxisFix axis, List<int[]> hideRanges
	) throws IOException
	{
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
		applyVerts(model, verts, axis);
		if (lightingNpc.getWidthScale() != 128 || lightingNpc.getHeightScale() != 128)
		{
			model.resize(lightingNpc.getWidthScale(), lightingNpc.getHeightScale(), lightingNpc.getWidthScale());
		}
		if (rotateX != 0)
		{
			rotateModelX(model, rotateX);
		}
		if (rotateY != 0)
		{
			model.rotate(rotateY & 2047);
		}
		hideFaces(model, hideRanges);
		return model;
	}

	private static void applyVerts(ModelDefinition model, Verts verts, AxisFix axis)
	{
		if (model.vertexCount != verts.vertexCount)
		{
			throw new IllegalStateException(
				"vertexCount mismatch model=" + model.vertexCount + " json=" + verts.vertexCount
					+ " (wrong NPC for this sequence?)"
			);
		}
		for (int i = 0; i < verts.vertexCount; i++)
		{
			model.vertexX[i] = axis.flipX ? -verts.vertexX[i] : verts.vertexX[i];
			model.vertexY[i] = axis.flipY ? -verts.vertexY[i] : verts.vertexY[i];
			model.vertexZ[i] = axis.flipZ ? -verts.vertexZ[i] : verts.vertexZ[i];
		}
		if (axis.reverseWinding)
		{
			for (int i = 0; i < model.faceCount; i++)
			{
				int a = model.faceIndices2[i];
				model.faceIndices2[i] = model.faceIndices3[i];
				model.faceIndices3[i] = a;
			}
		}
		model.setFaceNormals(null);
		model.setVertexNormals(null);
	}

	private static void hideFaces(ModelDefinition model, List<int[]> hideRanges)
	{
		if (hideRanges == null || hideRanges.isEmpty())
		{
			return;
		}
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

	private Verts loadVerts(int sequenceId, int frame) throws IOException
	{
		String cacheKey = sequenceId + ":" + frame;
		Verts cached = vertsCache.get(cacheKey);
		if (cached != null)
		{
			return cached;
		}
		SeqInfo seq = sequences.get(sequenceId);
		if (seq == null)
		{
			throw new IOException("Unknown sequence " + sequenceId + " (available: " + sequences.keySet() + ")");
		}
		File file = new File(seq.dir, "verts_" + frame + ".json");
		if (!file.isFile())
		{
			throw new IOException("Missing " + file.getAbsolutePath());
		}
		try (FileReader reader = new FileReader(file))
		{
			Verts verts = GSON.fromJson(reader, Verts.class);
			vertsCache.put(cacheKey, verts);
			return verts;
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

	private static List<Integer> parseIdList(String raw)
	{
		if (raw == null || raw.isBlank())
		{
			return Collections.emptyList();
		}
		List<Integer> out = new ArrayList<>();
		for (String part : raw.split("[,\\s]+"))
		{
			if (part.isEmpty())
			{
				continue;
			}
			out.add(Integer.parseInt(part));
		}
		return out;
	}

	private static Map<String, String> query(URI uri)
	{
		Map<String, String> out = new HashMap<>();
		String raw = uri.getRawQuery();
		if (raw == null || raw.isEmpty())
		{
			return out;
		}
		for (String part : raw.split("&"))
		{
			int eq = part.indexOf('=');
			if (eq < 0)
			{
				out.put(URLDecoder.decode(part, StandardCharsets.UTF_8), "");
			}
			else
			{
				out.put(
					URLDecoder.decode(part.substring(0, eq), StandardCharsets.UTF_8),
					URLDecoder.decode(part.substring(eq + 1), StandardCharsets.UTF_8)
				);
			}
		}
		return out;
	}

	private static int parseInt(Map<String, String> q, String key, int def)
	{
		String v = q.get(key);
		if (v == null || v.isEmpty())
		{
			return def;
		}
		return Integer.parseInt(v);
	}

	private static void writeJson(HttpExchange ex, Object obj) throws IOException
	{
		byte[] body = GSON.toJson(obj).getBytes(StandardCharsets.UTF_8);
		Headers h = ex.getResponseHeaders();
		h.set("Content-Type", "application/json; charset=utf-8");
		h.set("Cache-Control", "no-store");
		ex.sendResponseHeaders(200, body.length);
		try (OutputStream os = ex.getResponseBody())
		{
			os.write(body);
		}
	}

	private static void send(HttpExchange ex, int code, String type, String text) throws IOException
	{
		byte[] body = text.getBytes(StandardCharsets.UTF_8);
		ex.getResponseHeaders().set("Content-Type", type + "; charset=utf-8");
		ex.sendResponseHeaders(code, body.length);
		try (OutputStream os = ex.getResponseBody())
		{
			os.write(body);
		}
	}
}
