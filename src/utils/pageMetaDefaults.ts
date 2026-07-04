import { PageMetaOptions } from "./pageMeta";

export const PAGE_META = {
  home: {
    title: "Runelogs - OSRS Combat Log Analysis & DPS Tracking",
    description:
      "Runelogs analyzes Old School RuneScape combat logs from the RuneLite Combat Logger plugin. Upload logs, review DPS, replay fights tick-by-tick, and compare raid leaderboards.",
    canonicalPath: "/",
  },
  about: {
    title: "About - OSRS Combat Log Analysis & Leaderboards | Runelogs",
    description:
      "Runelogs is an OSRS combat log analyzer for RuneLite Combat Logger. Upload logs or live log fights, view DPS meters, tick replays, and leaderboards for Theatre of Blood, Tombs of Amascut, Inferno, Colosseum, and more.",
    canonicalPath: "/about",
  },
  help: {
    title: "Help - Upload OSRS Combat Logs | Runelogs",
    description:
      "How to install Combat Logger on RuneLite, find your OSRS combat log files, upload them to Runelogs, and troubleshoot Unknown damage sources.",
    canonicalPath: "/help",
  },
  privacy: {
    title: "Privacy Policy | Runelogs",
    description:
      "Runelogs privacy policy. How we handle accounts, uploaded combat logs, profile data, and contact information for Old School RuneScape log analysis.",
    canonicalPath: "/privacy",
  },
  blog: {
    title: "Blog & Release Notes | Runelogs",
    description:
      "Release notes and updates for Runelogs and the RuneLite Combat Logger plugin. Site launches, new leaderboards, live logging, and plugin version history.",
    canonicalPath: "/blog",
  },
  upload: {
    title: "Upload OSRS Combat Log | Runelogs",
    description:
      "Upload a Combat Logger text file from RuneLite to Runelogs. Parse OSRS fights into DPS breakdowns, event timelines, replays, and leaderboards.",
    canonicalPath: "/upload",
  },
  liveLog: {
    title: "Live Log OSRS Fights | Runelogs",
    description:
      "Stream Old School RuneScape combat events to Runelogs in real time with Combat Logger live logging. Share a link so others can watch fights as you play.",
    canonicalPath: "/live-log",
  },
  recentEncounters: {
    title: "Recent OSRS Combat Log Uploads | Runelogs",
    description:
      "Browse the latest Old School RuneScape combat log uploads on Runelogs. Filter recent encounters by raid, boss, or party size.",
    canonicalPath: "/recent-encounters",
  },
} satisfies Record<string, PageMetaOptions>;
