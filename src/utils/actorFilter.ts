import { Actor } from "../models/Actor";
import { LogLine } from "../models/LogLine";

export interface ActorFilter {
  name: string;
  id?: number;
  index?: number;
}

const toOptionalNumber = (value: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const serializeActorFilter = (filter: ActorFilter): string => {
  return [filter.name, filter.id ?? "", filter.index ?? ""].join("|");
};

export const deserializeActorFilter = (
  value: string | null,
): ActorFilter | null => {
  if (!value) {
    return null;
  }

  const [name, idValue, indexValue] = value.split("|");
  if (!name) {
    return null;
  }

  return {
    name,
    id: toOptionalNumber(idValue ?? ""),
    index: toOptionalNumber(indexValue ?? ""),
  };
};

export const matchesActorFilter = (
  actor: Actor | undefined,
  filter: ActorFilter | null,
): boolean => {
  if (!filter) {
    return true;
  }
  if (!actor) {
    return false;
  }

  if (actor.name !== filter.name) {
    return false;
  }
  if (filter.id !== undefined && actor.id !== filter.id) {
    return false;
  }
  return !(filter.index !== undefined && actor.index !== filter.index);
};

export const matchesLogActorFilters = (
  log: LogLine,
  sourceFilter: ActorFilter | null,
  targetFilter: ActorFilter | null,
): boolean => {
  const sourceActor = "source" in log ? log.source : undefined;
  const targetActor = "target" in log ? log.target : undefined;

  return (
    matchesActorFilter(sourceActor, sourceFilter) &&
    matchesActorFilter(targetActor, targetFilter)
  );
};
