import { TabsEnum } from "../components/Tabs";
import {
  ActorFilter,
  getParentActorFilter,
  serializeActorFilter,
} from "./actorFilter";

export type DamageDoneDrillBackAction =
  | { param: "source"; filter: ActorFilter | null }
  | { param: "target"; filter: ActorFilter | null };

export interface DamageDoneDrillSegment {
  label: string;
  sourceFilter: ActorFilter;
  targetFilter: ActorFilter | null;
}

interface ActorDrillLevel {
  label: string;
  filter: ActorFilter;
}

export function isDamageDoneDrilledIn(
  sourceFilter: ActorFilter | null,
): boolean {
  return sourceFilter !== null;
}

export function getDamageDoneDrillBackAction(
  sourceFilter: ActorFilter | null,
  targetFilter: ActorFilter | null,
): DamageDoneDrillBackAction | null {
  if (!sourceFilter) {
    return null;
  }

  if (targetFilter) {
    const parent = getParentActorFilter(targetFilter);
    return { param: "target", filter: parent };
  }

  const parent = getParentActorFilter(sourceFilter);
  return { param: "source", filter: parent };
}

function getActorDrillLevels(filter: ActorFilter): ActorDrillLevel[] {
  const levels: ActorDrillLevel[] = [
    { label: filter.name, filter: { name: filter.name } },
  ];

  if (filter.id !== undefined) {
    levels.push({
      label: `ID ${filter.id}`,
      filter: { name: filter.name, id: filter.id },
    });
  }

  if (filter.index !== undefined) {
    levels.push({
      label: `Index ${filter.index}`,
      filter: {
        name: filter.name,
        ...(filter.id !== undefined ? { id: filter.id } : {}),
        index: filter.index,
      },
    });
  }

  return levels;
}

export function getDamageDoneDrillSegments(
  sourceFilter: ActorFilter,
  targetFilter: ActorFilter | null,
): DamageDoneDrillSegment[] {
  const segments: DamageDoneDrillSegment[] = getActorDrillLevels(
    sourceFilter,
  ).map((level) => ({
    label: level.label,
    sourceFilter: level.filter,
    targetFilter: null,
  }));

  if (targetFilter) {
    segments.push(
      ...getActorDrillLevels(targetFilter).map((level) => ({
        label: level.label,
        sourceFilter,
        targetFilter: level.filter,
      })),
    );
  }

  return segments;
}

export function buildDamageDoneDrillSearch(
  baseSearchParams: URLSearchParams,
  sourceFilter: ActorFilter,
  targetFilter: ActorFilter | null,
): string {
  const params = new URLSearchParams(baseSearchParams);
  params.set("tab", TabsEnum.DAMAGE_DONE);
  params.set("source", serializeActorFilter(sourceFilter));
  if (targetFilter) {
    params.set("target", serializeActorFilter(targetFilter));
  } else {
    params.delete("target");
  }
  return params.toString();
}

export function formatDamageDoneDrillLabel(
  sourceFilter: ActorFilter | null,
  targetFilter: ActorFilter | null,
): string {
  if (!sourceFilter) {
    return "";
  }

  const labels = getActorDrillLevels(sourceFilter).map((level) => level.label);
  if (targetFilter) {
    labels.push(
      ...getActorDrillLevels(targetFilter).map((level) => level.label),
    );
  }

  return labels.join(" › ");
}
