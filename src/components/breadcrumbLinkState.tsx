import {
  resolveFightGroupSpriteKey,
  resolveLeaderboardSpriteKey,
} from "../lib/hiscoreSprites";
import { getRunSummaryHref } from "../utils/encounterTableRow";
import LogNameDisplay from "./LogNameDisplay";
import { BreadcrumbSegment } from "./PageBreadcrumbs";

/** Plain data only: this travels in router state, which must be serializable. */
export type RunBreadcrumbInfo = {
  logId: string;
  logName: string | null;
  isLive: boolean;
  runName: string;
  leaderboardName: string | null;
};

export function getRunBreadcrumbSegments({
  logId,
  logName,
  isLive,
  runName,
  leaderboardName,
}: RunBreadcrumbInfo): BreadcrumbSegment[] {
  return [
    {
      label: <LogNameDisplay name={logName} isLive={isLive} />,
      title: logName ?? "Unnamed",
      href: `/log/${logId}`,
    },
    {
      label: runName,
      spriteKey: resolveFightGroupSpriteKey(runName, leaderboardName),
    },
  ];
}

/**
 * Router state for a link to a run page. Lets the page draw its breadcrumbs
 * straight away instead of waiting for its data to load.
 */
export function createRunBreadcrumbLinkState(info: RunBreadcrumbInfo) {
  return { runBreadcrumb: info };
}

export function readRunBreadcrumbInfo(
  state: unknown,
): RunBreadcrumbInfo | null {
  const info = (state as { runBreadcrumb?: Partial<RunBreadcrumbInfo> } | null)
    ?.runBreadcrumb;
  if (typeof info?.logId !== "string" || typeof info.runName !== "string") {
    return null;
  }
  return {
    logId: info.logId,
    logName: info.logName ?? null,
    isLive: Boolean(info.isLive),
    runName: info.runName,
    leaderboardName: info.leaderboardName ?? null,
  };
}

/** Plain data only, for the same reason as {@link RunBreadcrumbInfo}. */
export type EncounterBreadcrumbInfo = {
  logId: string | null;
  logName: string | null;
  isLive: boolean;
  run: {
    id: string;
    name: string;
    leaderboardName: string | null;
  } | null;
  fightId: string;
  fightName: string;
  /** Every fight in the run, in order; offered as a select when more than one. */
  fights: { id: string; name: string }[];
};

/** Router state for a link to an encounter page, like the run page version. */
export function createEncounterBreadcrumbLinkState(
  info: EncounterBreadcrumbInfo,
) {
  return { encounterBreadcrumb: info };
}

/** Returns null unless the state describes the fight with id `fightId`. */
export function readEncounterBreadcrumbInfo(
  state: unknown,
  fightId: string | undefined,
): EncounterBreadcrumbInfo | null {
  const info = (
    state as { encounterBreadcrumb?: EncounterBreadcrumbInfo } | null
  )?.encounterBreadcrumb;
  if (
    !info ||
    info.fightId !== fightId ||
    typeof info.fightName !== "string" ||
    !Array.isArray(info.fights)
  ) {
    return null;
  }
  return info;
}

export function getEncounterBreadcrumbSegments(
  info: EncounterBreadcrumbInfo,
  onSelectFight: (fightId: string, linkState: unknown) => void,
): BreadcrumbSegment[] {
  const { logId, logName, isLive, run, fightId, fightName, fights } = info;
  const segments: BreadcrumbSegment[] = [
    {
      label: <LogNameDisplay name={logName} isLive={isLive} />,
      title: logName ?? "Unnamed",
      href: `/log/${logId}`,
    },
  ];

  if (run) {
    segments.push({
      label: run.name,
      href: getRunSummaryHref(run.id),
      linkState: logId
        ? createRunBreadcrumbLinkState({
            logId,
            logName,
            isLive,
            runName: run.name,
            leaderboardName: run.leaderboardName,
          })
        : undefined,
      spriteKey: resolveLeaderboardSpriteKey(run.leaderboardName),
    });
  }

  segments.push(
    run && fights.length > 1
      ? {
          label: fightName,
          select: {
            options: fights.map((entry, index) => ({
              value: index,
              label: entry.name,
            })),
            value: Math.max(
              0,
              fights.findIndex((entry) => entry.id === fightId),
            ),
            onChange: (index) => {
              const next = fights[index];
              if (next) {
                onSelectFight(
                  next.id,
                  createEncounterBreadcrumbLinkState({
                    ...info,
                    fightId: next.id,
                    fightName: next.name,
                  }),
                );
              }
            },
          },
        }
      : { label: fightName },
  );

  return segments;
}
