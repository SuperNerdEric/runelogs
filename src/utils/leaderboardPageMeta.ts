import {
  buildLeaderboardHref,
  buildRecentEncountersHref,
  getLeaderboardModeLabel,
  isRecentEncountersAllContent,
  LEADERBOARD_CONTENT_OPTIONS,
  LeaderboardMode,
  RECENT_ENCOUNTERS_CONTENT_OPTIONS,
  resolveLeaderboardStateFromSearchParams,
} from "./leaderboardContent";
import { DISCOVER_CONTENT_SEO_SNIPPETS } from "./discoverContentSeo";
import { formatPageTitle } from "./pageMetaFormatting";

const DEFAULT_LEADERBOARD_META = {
  title: "OSRS Leaderboards - TOB, TOA, Inferno & More | Runelogs",
  description:
    "OSRS combat log leaderboards on Runelogs. Compare run times and boss DPS for Theatre of Blood, Tombs of Amascut, Inferno, Colosseum, Gauntlet, Mokhaiotl, Yama, and Maggot King.",
  canonicalPath: "/leaderboards",
};

function modeLabel(mode: LeaderboardMode, contentValue: string): string {
  if (mode === "time") {
    return "Run Times";
  }
  if (mode === "dps") {
    return "DPS";
  }
  return getLeaderboardModeLabel(contentValue, mode);
}

export function getLeaderboardPageMeta(searchParams: URLSearchParams) {
  const { mode, content, playerCount, selectedFight } =
    resolveLeaderboardStateFromSearchParams(searchParams, []);
  const snippet = DISCOVER_CONTENT_SEO_SNIPPETS[content.value];

  if (!snippet) {
    return DEFAULT_LEADERBOARD_META;
  }

  const modeText = modeLabel(mode, content.value);
  const partyText =
    content.playerCounts.length > 1 ? ` (${playerCount}-player)` : "";
  const fightText =
    mode === "dps" && selectedFight && selectedFight !== "Overall"
      ? ` - ${selectedFight}`
      : "";

  const canonicalPath = buildLeaderboardHref({
    mode,
    leaderboard: content.value,
    playerCount,
    fight: mode === "dps" ? selectedFight : undefined,
  });

  return {
    title: formatPageTitle(
      `${snippet.titleSuffix} ${modeText} Leaderboard${partyText}${fightText}`,
    ),
    description: snippet.description,
    canonicalPath,
  };
}

export function buildLeaderboardSitemapUrls(siteUrl: string): string[] {
  return LEADERBOARD_CONTENT_OPTIONS.map((option) => {
    const path = buildLeaderboardHref({
      mode: "time",
      leaderboard: option.value,
      playerCount: option.defaultPlayerCount,
    });
    return `${siteUrl}${path}`;
  });
}

export function buildRecentEncountersSitemapUrls(siteUrl: string): string[] {
  return RECENT_ENCOUNTERS_CONTENT_OPTIONS.filter(
    (option) => !isRecentEncountersAllContent(option.value),
  ).map((option) => {
    const path = buildRecentEncountersHref({
      content: option.value,
      playerCount: option.defaultPlayerCount,
    });
    return `${siteUrl}${path}`;
  });
}
