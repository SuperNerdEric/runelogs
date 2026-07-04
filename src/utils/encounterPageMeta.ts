import { PageMetaOptions } from "./pageMeta";
import { formatPageTitle } from "./pageMetaFormatting";

const DEFAULT_ENCOUNTER_DESCRIPTION =
  "View an Old School RuneScape combat log on Runelogs with DPS breakdowns, event timelines, and fight replay.";

export function getEncounterFightPageMeta(params: {
  fightName: string;
  runName?: string | null;
  canonicalPath: string;
  isAggregate?: boolean;
}): PageMetaOptions {
  const { fightName, runName, canonicalPath, isAggregate } = params;
  const primary =
    runName && runName !== fightName ? `${runName} - ${fightName}` : fightName;
  const aggregateSuffix = isAggregate ? " (Aggregate)" : "";

  return {
    title: formatPageTitle(`${primary}${aggregateSuffix} - OSRS Combat Log`),
    description: `${primary} combat log on Runelogs. Review DPS, events, and tick-by-tick replay for this OSRS fight.`,
    canonicalPath,
  };
}

export function getRunSummaryPageMeta(params: {
  runName: string;
  canonicalPath: string;
}): PageMetaOptions {
  const { runName, canonicalPath } = params;

  return {
    title: formatPageTitle(`${runName} - OSRS Combat Log`),
    description: `${runName} run summary on Runelogs. Compare player DPS, fight times, and per-boss breakdowns from uploaded OSRS combat logs.`,
    canonicalPath,
  };
}

export function getPlayerPageMeta(params: {
  playerName: string;
  canonicalPath: string;
}): PageMetaOptions {
  const { playerName, canonicalPath } = params;

  return {
    title: formatPageTitle(`${playerName} - OSRS Combat Logs`),
    description: `${playerName}'s Old School RuneScape combat logs on Runelogs. Browse recent uploads, personal bests, and fight history.`,
    canonicalPath,
  };
}

export function getLogPageMeta(params: {
  logName: string | null;
  canonicalPath: string;
}): PageMetaOptions {
  const { logName, canonicalPath } = params;
  const label = logName?.trim() || "Unnamed Combat Log";

  return {
    title: formatPageTitle(`${label} - OSRS Combat Log`),
    description: `${label} on Runelogs. Browse encounters, DPS breakdowns, and fight replays from this uploaded OSRS combat log.`,
    canonicalPath,
  };
}

export function getUploaderLogsPageMeta(params: {
  uploaderName: string;
  canonicalPath: string;
}): PageMetaOptions {
  const { uploaderName, canonicalPath } = params;

  return {
    title: formatPageTitle(`${uploaderName}'s Uploaded OSRS Combat Logs`),
    description: `Combat logs uploaded by ${uploaderName} on Runelogs. Browse recent Old School RuneScape encounters and uploads.`,
    canonicalPath,
  };
}

export function getProfilePageMeta(params: {
  displayName: string;
  canonicalPath: string;
}): PageMetaOptions {
  const { displayName, canonicalPath } = params;

  return {
    title: formatPageTitle(`${displayName} - Profile`),
    description: `${displayName}'s Runelogs profile.`,
    canonicalPath,
    noIndex: true,
  };
}

export const LOGIN_PAGE_META: PageMetaOptions = {
  title: formatPageTitle("Sign In"),
  description:
    "Sign in to Runelogs to upload and manage Old School RuneScape combat logs.",
  canonicalPath: "/login",
  noIndex: true,
};

export const LOGOUT_PAGE_META: PageMetaOptions = {
  title: formatPageTitle("Sign Out"),
  description: "Sign out of your Runelogs account.",
  canonicalPath: "/logout",
  noIndex: true,
};

export const ADMIN_PAGE_META: PageMetaOptions = {
  title: formatPageTitle("Admin"),
  description: "Runelogs administration.",
  canonicalPath: "/admin",
  noIndex: true,
};

export function getLoadingEncounterPageMeta(
  canonicalPath: string,
): PageMetaOptions {
  return {
    title: formatPageTitle("OSRS Combat Log"),
    description: DEFAULT_ENCOUNTER_DESCRIPTION,
    canonicalPath,
  };
}
