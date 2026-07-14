import { TabsEnum } from "../components/Tabs";
import { LogTypes } from "../models/LogLine";
import { ActorFilter, serializeActorFilter } from "./actorFilter";
import { AttackAnimationEvent } from "./attackAnimationBreakdown";
import { serializeAnimationIdFilter } from "./animationIdFilter";
import { DeathEvent } from "./deathEvents";
import { BloatDownEvent } from "./bloatDownEvents";
import { FailureEvent } from "./failureEvents";
import { serializeEventTimeFilter } from "./eventTimeFilter";

function withUpdatedSearchParams(
  baseSearchParams: URLSearchParams,
  update: (params: URLSearchParams) => void,
): string {
  const params = new URLSearchParams(baseSearchParams);
  update(params);
  return params.toString();
}

export function buildDamageDoneSourceSearch(
  baseSearchParams: URLSearchParams,
  filter: ActorFilter,
): string {
  return withUpdatedSearchParams(baseSearchParams, (params) => {
    params.set("tab", TabsEnum.DAMAGE_DONE);
    params.set("source", serializeActorFilter(filter));
  });
}

export function buildDeathEventSearch(
  baseSearchParams: URLSearchParams,
  death: DeathEvent,
): string {
  return withUpdatedSearchParams(baseSearchParams, (params) => {
    params.set("tab", TabsEnum.EVENTS);
    params.set("eventType", LogTypes.DEATH);
    params.set("target", serializeActorFilter(death.target));
    params.set("eventTime", serializeEventTimeFilter(death.fightTimeMs));
  });
}

export function buildBloatDownEventSearch(
  baseSearchParams: URLSearchParams,
  down: BloatDownEvent,
): string {
  return withUpdatedSearchParams(baseSearchParams, (params) => {
    params.set("tab", TabsEnum.EVENTS);
    params.set("eventType", LogTypes.PLAYER_ATTACK_ANIMATION);
    params.set(
      "source",
      serializeActorFilter({
        name: down.source.name,
        id: down.source.id,
        index: down.source.index,
      }),
    );
    params.set("eventTime", serializeEventTimeFilter(down.fightTimeMs));
    // Stomp rows use animationId 0; filtering on that over-matches, so rely on time+source.
    if (down.animationId > 0) {
      params.set("animationId", serializeAnimationIdFilter(down.animationId));
    } else {
      params.delete("animationId");
    }
    params.delete("target");
  });
}

export function buildFailureEventSearch(
  baseSearchParams: URLSearchParams,
  event: FailureEvent,
): string {
  return withUpdatedSearchParams(baseSearchParams, (params) => {
    params.set("tab", TabsEnum.EVENTS);
    params.set(
      "eventType",
      event.eventType ?? LogTypes.PLAYER_ATTACK_ANIMATION,
    );
    params.set("eventTime", serializeEventTimeFilter(event.fightTimeMs));
    if (event.source?.name) {
      params.set(
        "source",
        serializeActorFilter({
          name: event.source.name,
          id: event.source.id,
          index: event.source.index,
        }),
      );
    } else {
      params.delete("source");
    }
    if (event.target?.name) {
      params.set("target", serializeActorFilter(event.target));
    } else {
      params.delete("target");
    }
    if (event.animationId != null && event.animationId > 0) {
      params.set("animationId", serializeAnimationIdFilter(event.animationId));
    } else {
      params.delete("animationId");
    }
  });
}

export function buildAttackEventSearch(
  baseSearchParams: URLSearchParams,
  event: AttackAnimationEvent,
): string {
  return withUpdatedSearchParams(baseSearchParams, (params) => {
    params.set("tab", TabsEnum.EVENTS);
    params.set("eventType", LogTypes.PLAYER_ATTACK_ANIMATION);
    params.set(
      "source",
      serializeActorFilter({
        name: event.playerName,
        id: event.source.id,
        index: event.source.index,
      }),
    );
    params.set("target", serializeActorFilter(event.target));
    params.set("eventTime", serializeEventTimeFilter(event.fightTimeMs));
    params.delete("animationId");
  });
}

export function buildAttackAnimationFilterSearch(
  baseSearchParams: URLSearchParams,
  event: AttackAnimationEvent,
): string {
  return withUpdatedSearchParams(baseSearchParams, (params) => {
    params.set("tab", TabsEnum.EVENTS);
    params.set("eventType", LogTypes.PLAYER_ATTACK_ANIMATION);
    params.set(
      "source",
      serializeActorFilter({
        name: event.playerName,
        id: event.source.id,
        index: event.source.index,
      }),
    );
    params.set("target", serializeActorFilter(event.target));
    params.set("animationId", serializeAnimationIdFilter(event.animationId));
    params.delete("eventTime");
  });
}
