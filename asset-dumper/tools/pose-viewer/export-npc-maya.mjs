/**
 * Export Maya animation vertex frames for an NPC model merge.
 *
 * Usage:
 *   node export-npc-maya.mjs --cache <cacheDir> --out <vertsRoot> --models 1,2,3 --sequenceId 10887
 *
 * Writes: <out>/<sequenceId>/verts_{frame}.json (+ ranking.json)
 */
import fs from "fs";
import path from "path";
import { RSCache, IndexType } from "osrscachereader";

function arg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : fallback;
}

async function main() {
  const cacheRoot = arg("cache");
  const outRoot = arg("out");
  const modelsRaw = arg("models", "");
  const sequenceId = Number(arg("sequenceId"));
  if (!cacheRoot || !outRoot || !modelsRaw || !Number.isFinite(sequenceId)) {
    console.error("Required: --cache --out --models id,id --sequenceId N");
    process.exit(2);
  }
  const modelIds = modelsRaw
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);
  if (!modelIds.length) {
    console.error("No model IDs");
    process.exit(2);
  }

  console.log("Loading cache", cacheRoot);
  const cache = new RSCache(cacheRoot);
  await cache.onload;

  let model = null;
  for (const mid of modelIds) {
    const part = await cache.getDef(IndexType.MODELS, mid);
    console.log("loaded model", mid, "verts", part.vertexCount);
    model = model == null ? part : model.mergeWith(part, true);
  }
  console.log("merged verts", model.vertexCount);

  const seqDir = path.join(outRoot, String(sequenceId));
  fs.mkdirSync(seqDir, { recursive: true });
  const anim = await model.loadAnimation(cache, sequenceId, false, false);
  const nFrames = anim.vertexData?.length ?? 0;
  console.log("seq", sequenceId, "maya frames", nFrames);
  if (!nFrames) {
    console.error("No Maya frames for sequence", sequenceId);
    process.exit(1);
  }

  const ranking = [];
  for (let fi = 0; fi < nFrames; fi++) {
    const verts = anim.vertexData[fi];
    const vertexX = verts.map((v) => Math.round(v[0]));
    const vertexY = verts.map((v) => Math.round(v[1]));
    const vertexZ = verts.map((v) => Math.round(v[2]));
    ranking.push({
      frame: fi,
      minY: Math.min(...vertexY),
      maxY: Math.max(...vertexY),
      yExtent: Math.max(...vertexY) - Math.min(...vertexY),
      maxZ: Math.max(...vertexZ),
      minX: Math.min(...vertexX),
      maxX: Math.max(...vertexX),
      xSpan: Math.max(...vertexX) - Math.min(...vertexX),
    });
    fs.writeFileSync(
      path.join(seqDir, `verts_${fi}.json`),
      JSON.stringify({
        frame: fi,
        sequenceId,
        vertexCount: verts.length,
        vertexX,
        vertexY,
        vertexZ,
      })
    );
  }
  fs.writeFileSync(path.join(seqDir, "ranking.json"), JSON.stringify(ranking, null, 2));
  console.log(JSON.stringify({ ok: true, sequenceId, frames: nFrames, vertexCount: model.vertexCount, dir: seqDir }));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
