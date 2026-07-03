import { Actor } from "../models/Actor";
import { DamageLog } from "../models/LogLine";
import { npcIdMap } from "../lib/npcIdMap";
import { ActorFilter } from "./actorFilter";

export type TargetDrillDownGrouping =
  "monster-name" | "monster-id" | "monster-index" | "leaf";

export function getMonsterCanonicalName(actor: Actor): string {
  if (actor.id !== undefined && npcIdMap[actor.id]) {
    return npcIdMap[actor.id].name;
  }
  return actor.name;
}

export function matchesMonsterTargetFilter(
  target: Actor,
  filter: ActorFilter | null,
): boolean {
  if (!filter) {
    return true;
  }

  const canonicalName = getMonsterCanonicalName(target);
  if (canonicalName !== filter.name && target.name !== filter.name) {
    return false;
  }
  if (filter.id !== undefined && target.id !== filter.id) {
    return false;
  }
  return !(filter.index !== undefined && target.index !== filter.index);
}

const uniqueDefined = <T>(values: (T | undefined)[]): T[] => [
  ...new Set(values.filter((value): value is T => value !== undefined)),
];

export function resolveTargetDrillDownGrouping(
  drillDownLogs: DamageLog[],
  targetFilter: ActorFilter | null,
): TargetDrillDownGrouping {
  const scopedLogs = drillDownLogs.filter((log) =>
    matchesMonsterTargetFilter(log.target, targetFilter),
  );

  if (!targetFilter) {
    return "monster-name";
  }

  if (targetFilter.index !== undefined) {
    return "leaf";
  }

  if (targetFilter.id !== undefined) {
    return "monster-index";
  }

  const ids = uniqueDefined(scopedLogs.map((log) => log.target.id));
  if (ids.length <= 1) {
    return "monster-index";
  }

  return "monster-id";
}

export function getTargetDrillDownGroupKey(
  target: Actor,
  grouping: TargetDrillDownGrouping,
): string {
  const canonicalName = getMonsterCanonicalName(target);

  switch (grouping) {
    case "monster-name":
      return `name:${canonicalName}`;
    case "monster-id":
      return `id:${target.id ?? canonicalName}`;
    case "monster-index":
      return `id:${target.id ?? "unknown"}-index:${target.index ?? "unknown"}`;
    case "leaf":
      return `id:${target.id ?? "unknown"}-index:${target.index ?? "unknown"}`;
  }
}

export function getTargetDrillDownDisplayName(
  actor: Actor,
  grouping: TargetDrillDownGrouping,
): string {
  const canonicalName = getMonsterCanonicalName(actor);

  switch (grouping) {
    case "monster-name":
      return canonicalName;
    case "monster-id":
      return actor.id !== undefined ? String(actor.id) : canonicalName;
    case "monster-index":
    case "leaf":
      return actor.index !== undefined
        ? `${canonicalName} - ${actor.index}`
        : canonicalName;
  }
}

export function getTargetDrillDownRowActor(
  target: Actor,
  grouping: TargetDrillDownGrouping,
): Actor {
  const canonicalName = getMonsterCanonicalName(target);

  switch (grouping) {
    case "monster-name":
      return { name: canonicalName };
    case "monster-id":
      return {
        name: canonicalName,
        ...(target.id !== undefined ? { id: target.id } : {}),
      };
    case "monster-index":
    case "leaf":
      return {
        name: canonicalName,
        ...(target.id !== undefined ? { id: target.id } : {}),
        ...(target.index !== undefined ? { index: target.index } : {}),
      };
  }
}

export function getNextTargetFilter(
  drillDownLogs: DamageLog[],
  rowTarget: Actor,
  grouping: TargetDrillDownGrouping,
): ActorFilter {
  const canonicalName = getMonsterCanonicalName(rowTarget);

  if (grouping === "monster-name") {
    const scoped = drillDownLogs.filter(
      (log) => getMonsterCanonicalName(log.target) === canonicalName,
    );
    const ids = uniqueDefined(scoped.map((log) => log.target.id));

    if (ids.length <= 1) {
      const singleId = ids[0] ?? rowTarget.id;
      return {
        name: canonicalName,
        ...(singleId !== undefined ? { id: singleId } : {}),
      };
    }

    return { name: canonicalName };
  }

  if (grouping === "monster-id") {
    return {
      name: canonicalName,
      ...(rowTarget.id !== undefined ? { id: rowTarget.id } : {}),
    };
  }

  return {
    name: canonicalName,
    ...(rowTarget.id !== undefined ? { id: rowTarget.id } : {}),
    ...(rowTarget.index !== undefined ? { index: rowTarget.index } : {}),
  };
}

export function canDrillDownTargetRow(
  drillDownLogs: DamageLog[],
  targetFilter: ActorFilter | null,
  rowTarget: Actor,
  grouping: TargetDrillDownGrouping,
): boolean {
  if (grouping === "leaf") {
    return false;
  }

  const canonicalName = getMonsterCanonicalName(rowTarget);
  const scopedLogs = drillDownLogs.filter((log) =>
    matchesMonsterTargetFilter(log.target, targetFilter),
  );

  if (grouping === "monster-name") {
    const scoped = scopedLogs.filter(
      (log) => getMonsterCanonicalName(log.target) === canonicalName,
    );
    const ids = uniqueDefined(scoped.map((log) => log.target.id));
    if (ids.length > 1) {
      return true;
    }
    return uniqueDefined(scoped.map((log) => log.target.index)).length >= 1;
  }

  if (grouping === "monster-id" || grouping === "monster-index") {
    return true;
  }

  return false;
}

export function isTargetDrillDownActive(
  type: "damage-done" | "damage-taken",
  sourceFilter: ActorFilter | null,
): boolean {
  return type === "damage-done" && sourceFilter !== null;
}
