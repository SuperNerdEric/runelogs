import {
  buildLeaderboardSitemapUrls,
  buildRecentEncountersSitemapUrls,
} from "../utils/leaderboardPageMeta";
import { LEADERBOARD_CONTENT_OPTIONS } from "../utils/leaderboardContent";
import {
  buildLeaderboardSitemapUrls as buildLeaderboardSitemapUrlsFromScript,
  buildRecentEncountersSitemapUrls as buildRecentEncountersSitemapUrlsFromScript,
  parseLeaderboardContentOptions,
} from "../../scripts/update-discover-sitemap.mjs";

const SITE_URL = "https://www.runelogs.com";

describe("discover sitemap URLs", () => {
  it("includes one default time leaderboard URL per content option", () => {
    const urls = buildLeaderboardSitemapUrls(SITE_URL);

    expect(urls).toHaveLength(LEADERBOARD_CONTENT_OPTIONS.length);
    expect(urls[0]).toBe(
      `${SITE_URL}/leaderboards?mode=time&leaderboard=Theatre+of+Blood&playerCount=4`,
    );
    expect(urls.some((url) => url.includes("Maggot+King"))).toBe(true);
  });

  it("includes one default recent-encounters URL per content option", () => {
    const urls = buildRecentEncountersSitemapUrls(SITE_URL);

    expect(urls).toHaveLength(LEADERBOARD_CONTENT_OPTIONS.length);
    expect(urls[0]).toBe(
      `${SITE_URL}/recent-encounters?content=Theatre+of+Blood&playerCount=4`,
    );
    expect(urls.some((url) => url.includes("Maggot+King"))).toBe(true);
    expect(urls.some((url) => url.includes("content=all"))).toBe(false);
  });

  it("matches the sitemap script parser output", () => {
    const parsedOptions = parseLeaderboardContentOptions();

    expect(parsedOptions).toHaveLength(LEADERBOARD_CONTENT_OPTIONS.length);
    expect(buildLeaderboardSitemapUrlsFromScript(SITE_URL, parsedOptions)).toEqual(
      buildLeaderboardSitemapUrls(SITE_URL),
    );
    expect(
      buildRecentEncountersSitemapUrlsFromScript(SITE_URL, parsedOptions),
    ).toEqual(buildRecentEncountersSitemapUrls(SITE_URL));
  });
});
