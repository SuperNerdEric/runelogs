import {
  buildRecentEncountersHref,
  isRecentEncountersAllContent,
  resolveBrowsePlayerCount,
  resolveRecentEncountersContent,
} from "./leaderboardContent";
import { DISCOVER_CONTENT_SEO_SNIPPETS } from "./discoverContentSeo";
import { formatPageTitle } from "./pageMetaFormatting";
import { PAGE_META } from "./pageMetaDefaults";

const DEFAULT_RECENT_ENCOUNTERS_META = PAGE_META.recentEncounters;

export function getRecentEncountersPageMeta(searchParams: URLSearchParams) {
  const content = resolveRecentEncountersContent(searchParams.get("content"));
  const playerCount = resolveBrowsePlayerCount(
    content,
    searchParams.get("playerCount"),
  );

  if (isRecentEncountersAllContent(content.value)) {
    return DEFAULT_RECENT_ENCOUNTERS_META;
  }

  const snippet = DISCOVER_CONTENT_SEO_SNIPPETS[content.value];
  if (!snippet) {
    return DEFAULT_RECENT_ENCOUNTERS_META;
  }

  const partyText =
    playerCount !== "any" && content.playerCounts.length > 1
      ? ` (${playerCount}-player)`
      : "";

  const pageParam = searchParams.get("page");
  const page = pageParam != null ? Number.parseInt(pageParam, 10) : undefined;

  const canonicalPath = buildRecentEncountersHref({
    content: content.value,
    playerCount: playerCount !== "any" ? playerCount : undefined,
    page: page != null && Number.isFinite(page) ? page : undefined,
  });

  return {
    title: formatPageTitle(
      `${snippet.titleSuffix} Recent OSRS Combat Logs${partyText}`,
    ),
    description: snippet.description.replace(
      /leaderboard/gi,
      "recent combat log uploads",
    ),
    canonicalPath,
  };
}
