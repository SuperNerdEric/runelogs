import { getNpcImageUrl } from "../lib/npcImageOverlay";
import { Actor } from "../models/Actor";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes, NpcChangedLog } from "../models/LogLine";

/*
 * Phase dividers for The Fractured Archive. NPC ids are unique to each boss, so
 * detection keys off ids and never needs the fight name. Every Archive log
 * records health ratios (the raid released after log version 1.7.0), so unlike
 * older raids the HP thresholds below can be read directly from hit lines.
 */

const ARCHIVE_GUARDIAN_FLYING_ID = 16659;
const ARCHIVE_GUARDIAN_GROUNDED_ID = 16660;
const EZEKIEL_ID = 16652;
const BORK_ID = 16640;
const SMORKS_ID = 16641;
const MOIA_ID = 16667;
const DREADNOTH_ID = 16665;
const XARTH_ID = 16684;
const XARTH_PILLAR_ID = 16686;
const OCELLUS_PHASE_1_ID = 16674;
const OCELLUS_PHASE_2_ID = 16675;
const OCELLUS_PHASE_3_ID = 16677;
const DAGONHAI_ELDER_ID = 16643;
const DAGONHAI_ELDER_RITUAL_END_ID = 16644;
/** Elder and both monks before the ritual ends; they share one health bar. */
const DAGONHAI_SHIELDED_IDS: ReadonlySet<number> = new Set([
  DAGONHAI_ELDER_ID,
  16645,
  16647,
]);

/**
 * A depleted Dagon'hai shield refills in one step, so it reads as a hit near
 * empty followed by a hit near full. Depleted hits read at most 16% across 24
 * logged fights, and refilled hits at least 92%.
 */
export const DAGONHAI_SHIELD_DEPLETED_MAX_HP = 20;
export const DAGONHAI_SHIELD_REFILLED_MIN_HP = 80;
/**
 * Hits queued before a refill can still read near empty just after it. Real
 * breaks were at least 35 ticks apart, so anything this close is the same one.
 */
export const DAGONHAI_MIN_TICKS_BETWEEN_BREAKS = 20;

/**
 * The Guardian enters Phase 2 at 33%, but the last grounded hit can read a few
 * percent higher because the hit that crossed the threshold may land on the
 * levitation tick. Across 151 logged kills the final levitation read at most
 * 37%; ordinary Phase 1 levitations read higher than that, or are followed by
 * another one.
 */
export const ARCHIVE_GUARDIAN_PHASE_2_MAX_GROUNDED_HP = 37;
/** "Upon reaching less than 35% of his health" (OSRS Wiki strategies). */
export const EZEKIEL_ENRAGE_HP = 35;
export const MOIA_ENRAGE_HP = 33;
export const DREADNOTH_SLAM_HP_THRESHOLDS = [85, 65, 45] as const;
export const DREADNOTH_ENRAGE_HP = 25;
/** Xarth's Phase 2 starts once all of these pillars have been destroyed. */
export const XARTH_PILLAR_COUNT = 3;
/** Ocellus keeps id 16677 for Phase 4, which starts at 25% of that health bar. */
export const OCELLUS_PHASE_4_HP = 25;

export const ARCHIVE_GUARDIAN_GROUNDED_ICON_URL = getNpcImageUrl(
  ARCHIVE_GUARDIAN_GROUNDED_ID,
);
export const ARCHIVE_GUARDIAN_FLYING_ICON_URL = getNpcImageUrl(
  ARCHIVE_GUARDIAN_FLYING_ID,
);

export interface FracturedArchivePhaseMarker {
  /** Divider caption, e.g. "Phase 2" or "85%". */
  label: string;
  /** Tooltip / hover name, e.g. "Enrage: Bork Dead". */
  title: string;
  fightTimeMs: number;
  tick: number;
  iconUrl: string;
}

export interface ArchiveGuardianGroundedWindow {
  /** 1-based order of this grounded period within the fight. */
  groundedNumber: number;
  startFightTimeMs: number;
  startTick: number;
  /** Levitation time, or fight end when the boss dies grounded. */
  endFightTimeMs: number;
  endTick: number;
  /** False when the fight ended while the boss was still grounded. */
  endsWithLevitation: boolean;
}

interface TimedLog {
  log: LogLine;
  fightTimeMs: number;
  tick: number;
}

interface HealthHit extends TimedLog {
  healthPercent: number;
  healthScale: number;
}

function timedLogs(fight: Fight): TimedLog[] {
  const timed: TimedLog[] = [];
  for (const log of fight.data) {
    if (log.fightTimeMs != null && log.tick != null) {
      timed.push({ log, fightTimeMs: log.fightTimeMs, tick: log.tick });
    }
  }
  return timed.sort((a, b) => a.fightTimeMs - b.fightTimeMs);
}

function actorsInLog(log: LogLine): Actor[] {
  const record = log as unknown as {
    source?: Actor;
    target?: Actor;
    oldNpc?: Actor;
    newNpc?: Actor;
  };
  return [record.source, record.target, record.oldNpc, record.newNpc].filter(
    (actor): actor is Actor => actor != null,
  );
}

/** Hits on `npcIds`, in time order, that carry a usable health bar reading. */
function healthHits(
  logs: TimedLog[],
  npcIds: ReadonlySet<number>,
): HealthHit[] {
  const hits: HealthHit[] = [];
  for (const timed of logs) {
    const record = timed.log as unknown as {
      target?: Actor;
      targetHealthRatio?: number;
      targetHealthScale?: number;
    };
    if (
      record.target?.id == null ||
      !npcIds.has(record.target.id) ||
      record.targetHealthRatio == null ||
      !record.targetHealthScale
    ) {
      continue;
    }
    hits.push({
      ...timed,
      healthPercent:
        (record.targetHealthRatio / record.targetHealthScale) * 100,
      healthScale: record.targetHealthScale,
    });
  }
  return hits;
}

function firstSighting(logs: TimedLog[], npcId: number): TimedLog | undefined {
  return logs.find(({ log }) =>
    actorsInLog(log).some((actor) => actor.id === npcId),
  );
}

function npcChanges(logs: TimedLog[]): (TimedLog & { log: NpcChangedLog })[] {
  return logs.filter(
    (timed): timed is TimedLog & { log: NpcChangedLog } =>
      timed.log.type === LogTypes.NPC_CHANGED,
  );
}

/** Time spans the Archive Guardian spends grounded, from its NPC id changes. */
export function getArchiveGuardianGroundedWindows(
  fight: Fight,
): ArchiveGuardianGroundedWindow[] {
  const windows: ArchiveGuardianGroundedWindow[] = [];
  let open: TimedLog | null = null;

  for (const change of npcChanges(timedLogs(fight))) {
    const { oldNpc, newNpc } = change.log;
    if (!open && newNpc?.id === ARCHIVE_GUARDIAN_GROUNDED_ID) {
      open = change;
    } else if (
      open &&
      oldNpc?.id === ARCHIVE_GUARDIAN_GROUNDED_ID &&
      newNpc?.id !== ARCHIVE_GUARDIAN_GROUNDED_ID
    ) {
      const endsWithLevitation = newNpc?.id === ARCHIVE_GUARDIAN_FLYING_ID;
      windows.push({
        groundedNumber: windows.length + 1,
        startFightTimeMs: open.fightTimeMs,
        startTick: open.tick,
        endFightTimeMs: change.fightTimeMs,
        endTick: change.tick,
        endsWithLevitation,
      });
      open = null;
    }
  }

  if (open) {
    windows.push({
      groundedNumber: windows.length + 1,
      startFightTimeMs: open.fightTimeMs,
      startTick: open.tick,
      endFightTimeMs: fight.lastLine.fightTimeMs ?? open.fightTimeMs,
      endTick: fight.lastLine.tick ?? open.tick,
      endsWithLevitation: false,
    });
  }
  return windows;
}

/**
 * Phase 2 begins with the Guardian's last levitation: below 33% it flies once
 * more for the laser phase, then stays grounded until it dies. A wipe can end
 * on an earlier levitation, so the last grounded hit must also be near 33%.
 */
function getArchiveGuardianMarkers(
  logs: TimedLog[],
): FracturedArchivePhaseMarker[] {
  const levitations = npcChanges(logs).filter(
    ({ log }) =>
      log.oldNpc?.id === ARCHIVE_GUARDIAN_GROUNDED_ID &&
      log.newNpc?.id === ARCHIVE_GUARDIAN_FLYING_ID,
  );
  const phase2 = levitations[levitations.length - 1];
  if (!phase2) {
    return [];
  }
  const groundedHits = healthHits(
    logs,
    new Set([ARCHIVE_GUARDIAN_GROUNDED_ID]),
  ).filter((hit) => hit.fightTimeMs <= phase2.fightTimeMs);
  const lastGroundedHit = groundedHits[groundedHits.length - 1];
  if (
    !lastGroundedHit ||
    lastGroundedHit.healthPercent > ARCHIVE_GUARDIAN_PHASE_2_MAX_GROUNDED_HP
  ) {
    return [];
  }
  return [
    {
      label: "Phase 2",
      title: "Phase 2",
      fightTimeMs: phase2.fightTimeMs,
      tick: phase2.tick,
      iconUrl: ARCHIVE_GUARDIAN_FLYING_ICON_URL,
    },
  ];
}

function getEzekielMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  const enrage = healthHits(logs, new Set([EZEKIEL_ID])).find(
    (hit) => hit.healthPercent < EZEKIEL_ENRAGE_HP,
  );
  return enrage
    ? [
        {
          label: "Enrage",
          title: "Enrage",
          fightTimeMs: enrage.fightTimeMs,
          tick: enrage.tick,
          iconUrl: getNpcImageUrl(EZEKIEL_ID),
        },
      ]
    : [];
}

/**
 * The survivor enrages when either Bork or the Smorks die. The fight's last
 * death ends the encounter, so a death only counts if its partner is still
 * being attacked afterwards.
 */
function getBorkMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  for (const timed of logs) {
    if (timed.log.type !== LogTypes.DEATH) {
      continue;
    }
    const diedId = timed.log.target?.id;
    if (diedId !== BORK_ID && diedId !== SMORKS_ID) {
      continue;
    }
    const partnerId = diedId === BORK_ID ? SMORKS_ID : BORK_ID;
    const partnerStillFought = logs.some((later) => {
      const target = (later.log as unknown as { target?: Actor }).target;
      return (
        later.log.type === LogTypes.DAMAGE &&
        target?.id === partnerId &&
        later.fightTimeMs > timed.fightTimeMs
      );
    });
    if (!partnerStillFought) {
      return [];
    }
    return [
      {
        label: "Enrage",
        title: `Enrage: ${diedId === BORK_ID ? "Bork" : "Smorks"} Dead`,
        fightTimeMs: timed.fightTimeMs,
        tick: timed.tick,
        iconUrl: getNpcImageUrl(partnerId),
      },
    ];
  }
  return [];
}

/**
 * Moia's health bar changes scale (and reads 0) a few ticks after she enrages,
 * so the threshold can first show up on that post-enrage bar. In that case the
 * previous hit is the one that actually crossed 33%.
 */
function getMoiaMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  const hits = healthHits(logs, new Set([MOIA_ID]));
  const index = hits.findIndex((hit) => hit.healthPercent <= MOIA_ENRAGE_HP);
  if (index < 0) {
    return [];
  }
  const crossedOnNewBar =
    index > 0 && hits[index].healthScale !== hits[index - 1].healthScale;
  const enrage = crossedOnNewBar ? hits[index - 1] : hits[index];
  return [
    {
      label: "Enrage",
      title: "Enrage",
      fightTimeMs: enrage.fightTimeMs,
      tick: enrage.tick,
      iconUrl: getNpcImageUrl(MOIA_ID),
    },
  ];
}

function getDreadnothMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  const hits = healthHits(logs, new Set([DREADNOTH_ID]));
  const iconUrl = getNpcImageUrl(DREADNOTH_ID);
  const markers: FracturedArchivePhaseMarker[] = [];
  for (const threshold of DREADNOTH_SLAM_HP_THRESHOLDS) {
    const hit = hits.find((candidate) => candidate.healthPercent <= threshold);
    if (hit) {
      markers.push({
        label: `${threshold}%`,
        title: `${threshold}% Slam`,
        fightTimeMs: hit.fightTimeMs,
        tick: hit.tick,
        iconUrl,
      });
    }
  }
  const enrage = hits.find((hit) => hit.healthPercent <= DREADNOTH_ENRAGE_HP);
  if (enrage) {
    markers.push({
      label: "Enrage",
      title: "Enrage",
      fightTimeMs: enrage.fightTimeMs,
      tick: enrage.tick,
      iconUrl,
    });
  }
  return markers;
}

/** Each pillar is a short-lived NPC, logged once when the blast destroys it. */
function getXarthMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  const pillars = new Map<number, TimedLog>();
  for (const timed of logs) {
    for (const actor of actorsInLog(timed.log)) {
      if (
        actor.id === XARTH_PILLAR_ID &&
        actor.index != null &&
        !pillars.has(actor.index)
      ) {
        pillars.set(actor.index, timed);
      }
    }
  }
  const lastPillar = [...pillars.values()][XARTH_PILLAR_COUNT - 1];
  return lastPillar
    ? [
        {
          label: "Phase 2",
          title: "Phase 2",
          fightTimeMs: lastPillar.fightTimeMs,
          tick: lastPillar.tick,
          iconUrl: getNpcImageUrl(XARTH_ID),
        },
      ]
    : [];
}

/**
 * Each shield break refills the shared health bar. The ritual then ends when
 * all three NPCs change id on about the same tick: on kills that follows four
 * breaks, when the cauldron explodes, but a wipe can reach it with fewer.
 */
function getDagonhaiMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  const markers: FracturedArchivePhaseMarker[] = [];
  const shieldedIcon = getNpcImageUrl(DAGONHAI_ELDER_ID);
  const ritualEnd = npcChanges(logs).find(
    ({ log }) => log.newNpc?.id === DAGONHAI_ELDER_RITUAL_END_ID,
  );
  // The monks can change id a tick after the Elder, so their hits are cut off
  // here rather than by id alone.
  const hits = healthHits(logs, DAGONHAI_SHIELDED_IDS).filter(
    (hit) => !ritualEnd || hit.tick < ritualEnd.tick,
  );
  let breaks = 0;
  let lastBreakTick: number | null = null;
  hits.forEach((hit, index) => {
    const previous = hits[index - 1];
    if (
      previous &&
      previous.healthPercent <= DAGONHAI_SHIELD_DEPLETED_MAX_HP &&
      hit.healthPercent >= DAGONHAI_SHIELD_REFILLED_MIN_HP &&
      (lastBreakTick === null ||
        hit.tick - lastBreakTick >= DAGONHAI_MIN_TICKS_BETWEEN_BREAKS)
    ) {
      breaks += 1;
      lastBreakTick = hit.tick;
      markers.push({
        label: `Shield ${breaks}`,
        title: `Shield ${breaks} Break`,
        fightTimeMs: hit.fightTimeMs,
        tick: hit.tick,
        iconUrl: shieldedIcon,
      });
    }
  });

  if (ritualEnd) {
    markers.push({
      label: "Ritual End",
      title: "Ritual End",
      fightTimeMs: ritualEnd.fightTimeMs,
      tick: ritualEnd.tick,
      iconUrl: getNpcImageUrl(DAGONHAI_ELDER_RITUAL_END_ID),
    });
  }
  return markers;
}

function getOcellusMarkers(logs: TimedLog[]): FracturedArchivePhaseMarker[] {
  const phases: { phase: number; start?: TimedLog; npcId: number }[] = [
    {
      phase: 1,
      start: firstSighting(logs, OCELLUS_PHASE_1_ID),
      npcId: OCELLUS_PHASE_1_ID,
    },
    {
      phase: 2,
      start: firstSighting(logs, OCELLUS_PHASE_2_ID),
      npcId: OCELLUS_PHASE_2_ID,
    },
    {
      phase: 3,
      start: firstSighting(logs, OCELLUS_PHASE_3_ID),
      npcId: OCELLUS_PHASE_3_ID,
    },
    {
      phase: 4,
      start: healthHits(logs, new Set([OCELLUS_PHASE_3_ID])).find(
        (hit) => hit.healthPercent <= OCELLUS_PHASE_4_HP,
      ),
      npcId: OCELLUS_PHASE_3_ID,
    },
  ];
  const markers: FracturedArchivePhaseMarker[] = [];
  for (const { phase, start, npcId } of phases) {
    if (start) {
      markers.push({
        label: `Phase ${phase}`,
        title: `Phase ${phase}`,
        fightTimeMs: start.fightTimeMs,
        tick: start.tick,
        iconUrl: getNpcImageUrl(npcId),
      });
    }
  }
  return markers;
}

/** Point markers for whichever Fractured Archive boss this fight contains. */
export function getFracturedArchivePhaseMarkers(
  fight: Fight,
): FracturedArchivePhaseMarker[] {
  const logs = timedLogs(fight);
  return [
    ...getArchiveGuardianMarkers(logs),
    ...getEzekielMarkers(logs),
    ...getBorkMarkers(logs),
    ...getMoiaMarkers(logs),
    ...getDreadnothMarkers(logs),
    ...getXarthMarkers(logs),
    ...getDagonhaiMarkers(logs),
    ...getOcellusMarkers(logs),
  ];
}
