import {
  buildLeaderboardHref,
  getLeaderboardModeLabel,
  LEADERBOARD_CONTENT_OPTIONS,
  LeaderboardMode,
  resolveLeaderboardStateFromSearchParams,
} from "./leaderboardContent";

const LEADERBOARD_SEO_SNIPPETS: Record<
  string,
  { titleSuffix: string; description: string }
> = {
  "Theatre of Blood": {
    titleSuffix: "Theatre of Blood (TOB)",
    description:
      "Theatre of Blood leaderboard for Old School RuneScape. Compare TOB run times and boss DPS from Combat Logger uploads on Runelogs.",
  },
  "Theatre of Blood: Hard Mode": {
    titleSuffix: "Theatre of Blood Hard Mode (TOB HM)",
    description:
      "Theatre of Blood Hard Mode leaderboard for OSRS. Track TOB HM raid times and per-boss DPS on Runelogs.",
  },
  "Tombs of Amascut": {
    titleSuffix: "Tombs of Amascut (TOA)",
    description:
      "Tombs of Amascut leaderboard for Old School RuneScape. Compare TOA raid times and boss DPS from uploaded combat logs.",
  },
  "Tombs of Amascut: Expert Mode": {
    titleSuffix: "Tombs of Amascut Expert (TOA EM)",
    description:
      "Tombs of Amascut Expert Mode leaderboard for OSRS. Track TOA EM run times and Wardens DPS on Runelogs.",
  },
  "Fight Caves": {
    titleSuffix: "Fight Caves",
    description:
      "Fight Caves leaderboard for Old School RuneScape. Compare TzTok-Jad fight times from Combat Logger logs on Runelogs.",
  },
  "The Inferno": {
    titleSuffix: "The Inferno",
    description:
      "Inferno leaderboard for OSRS. Compare TzKal-Zuk fight times and full Inferno run durations on Runelogs.",
  },
  "Fortis Colosseum": {
    titleSuffix: "Fortis Colosseum",
    description:
      "Fortis Colosseum leaderboard for Old School RuneScape. Compare Sol Heredit DPS and Colosseum run times on Runelogs.",
  },
  "The Gauntlet": {
    titleSuffix: "The Gauntlet",
    description:
      "The Gauntlet leaderboard for OSRS. Compare Gauntlet run times from Combat Logger uploads on Runelogs.",
  },
  "Corrupted Gauntlet": {
    titleSuffix: "Corrupted Gauntlet (CG)",
    description:
      "Corrupted Gauntlet leaderboard for Old School RuneScape. Track CG run times on Runelogs.",
  },
  "Doom of Mokhaiotl": {
    titleSuffix: "Doom of Mokhaiotl",
    description:
      "Doom of Mokhaiotl leaderboard for OSRS. Compare delve times, Deep Delve high-scores, and fight DPS on Runelogs.",
  },
  Yama: {
    titleSuffix: "Yama",
    description:
      "Yama leaderboard for Old School RuneScape. Compare solo and duo Yama DPS from Combat Logger logs on Runelogs.",
  },
  "Maggot King": {
    titleSuffix: "Maggot King",
    description:
      "Maggot King leaderboard for Old School RuneScape. Compare solo Maggot King kill times and DPS from Combat Logger logs on Runelogs.",
  },
};

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
  const snippet = LEADERBOARD_SEO_SNIPPETS[content.value];

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
    title: `${snippet.titleSuffix} ${modeText} Leaderboard${partyText}${fightText} | Runelogs`,
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
