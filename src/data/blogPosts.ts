export type BlogCategory = "combat-logger" | "runelogs";

export type BlogPostImage = {
  src: string;
  alt: string;
  caption?: string;
  afterParagraph?: number;
};

export type BlogPostHeading = {
  text: string;
  beforeParagraph: number;
};

export type BlogPostBody = {
  paragraphs: string[];
  bullets?: string[];
  images?: BlogPostImage[];
  headings?: BlogPostHeading[];
};

export type BlogPost = {
  date: string;
  title: string;
  slug: string;
  category: BlogCategory;
  body: BlogPostBody;
};

type BlogPostInput = Omit<BlogPost, "slug">;

export function generateBlogSlug(title: string): string {
  let slug = title
    .toLowerCase()
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[^a-z0-9\s.-]/g, "")
    .trim();

  slug = slug.replace(/(\d)\.(\d)/g, "$1-$2").replace(/\./g, "-");
  return slug.replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function getBlogPostPlainText(body: BlogPostBody): string {
  const parts = [...body.paragraphs];
  if (body.headings?.length) {
    parts.push(body.headings.map((heading) => heading.text).join(" "));
  }
  if (body.images?.length) {
    parts.push(
      body.images
        .map((image) => [image.alt, image.caption].filter(Boolean).join(" "))
        .join(" "),
    );
  }
  if (body.bullets?.length) {
    parts.push(body.bullets.join(" "));
  }
  return parts.join(" ");
}

export function getBlogPostSummary(post: BlogPost, maxLength = 220): string {
  const firstParagraph = post.body.paragraphs[0] ?? "";
  if (firstParagraph.length >= maxLength) {
    return `${firstParagraph.slice(0, maxLength - 3).trimEnd()}...`;
  }

  const fullText = getBlogPostPlainText(post.body);
  if (fullText.length <= maxLength) {
    return fullText;
  }

  return firstParagraph;
}

const BLOG_POSTS_RAW: BlogPostInput[] = [
  // — Runelogs —
  {
    date: "2026-07-08",
    title: "Runelogs — Encounter Summaries and Replay Tick Chart Improvements",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs introduces an Encounter Summary tab — a single-page overview at the top of every fight. Open any uploaded or live encounter and Summary is the default view: fight duration, deaths, DPS rank badges, a DPS timeline, a damage done breakdown, an Attacks breakdown, and stat boost tracking in one place. The Attacks breakdown groups each player's hits by weapon and marks special attacks with a special attack orb.",
        "Summary rows and charts link into the rest of the encounter page. Click a player in the damage table to jump to Damage Done with that source filter applied, open a death to land on Events at the right tick, or follow an attack bar into the matching animation events. Live logs use the same layout while data is still streaming, with in-progress styling scoped to the active fight in a group.",
        "The replay tick chart lays out each player's actions tick by tick. Special attacks are detected and marked with a special attack orb on the exact tick they land, so specs are easy to place in the sequence. Hover any tick to see the weapon used, the target, boosted combat stats, and timing.",
        "The chart also flags missed ticks — ticks where your weapon was off cooldown but no attack went out — so dropped DPS is easy to spot at a glance. Tick tooltips are faster and easier to read, and object highlighting makes splats and warnings simpler to follow during playback.",
      ],
      headings: [
        { text: "Encounter Summary", beforeParagraph: 0 },
        { text: "Replay Tick Chart", beforeParagraph: 2 },
        { text: "Other Changes", beforeParagraph: 4 },
      ],
      images: [
        {
          src: "/blog/encounter-summary-maggot-king.png",
          alt: "Encounter Summary tab for a Maggot King fight showing DPS chart, damage done, attacks, and stat boosts",
          caption:
            "Encounter Summary for Maggot King — duration, rank, DPS chart, attacks, and boost tracking on one tab.",
          afterParagraph: 1,
        },
        {
          src: "/blog/replay-tick-chart-special-attack.png",
          alt: "Replay tick chart with an Elder maul special attack tooltip showing target and boosted combat stats",
          caption:
            "Replay tick chart — special attack orbs mark specs, and hovering a tick shows the weapon, target, and boosted stats.",
          afterParagraph: 3,
        },
      ],
      bullets: [
        "Redesigned stat boost charts with horizontal scroll for long fights",
        "Hitsplat and hitsplat-type filtering across Events, Damage Done, and charts",
        "Source and target drill-down in DPS tables to isolate who hit what",
        "Damage Done drill-down banner and Events filters for time and animation ID",
        "Clearer DPS and hitsplat chart tooltips",
        "Live log pages show correct standalone fight names and scoped in-progress styling",
      ],
    },
  },
  {
    date: "2026-07-02",
    title: "Runelogs — Maggot King",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs now supports Maggot King — solo kill times, DPS leaderboards, log parsing, and replay for the new boss fight.",
        "Uploaded Combat Logger logs recognize Maggot King fights and mark them DPS-eligible with official duration timing. The Maggot King leaderboard compares solo kill times and boss DPS, with a hiscore sprite on leaderboard rows and encounter lists.",
        "Replay tooling includes Maggot King mechanics: poison splat game objects (small, medium, and large), dust wave graphics, and shadow warnings. Replay controls add object highlighting so splats and warnings are easier to follow tick by tick.",
      ],
      bullets: [
        "Maggot King DPS leaderboard and personal bests (solo)",
        "Fight parsing and fixture coverage on the backend",
        "Replay assets and object highlighting for poison splats and shadow warnings",
      ],
    },
  },
  {
    date: "2026-07-01",
    title: "Runelogs — Live Log Reliability",
    category: "runelogs",
    body: {
      paragraphs: [
        "Live logging on Runelogs lets friends and clanmates follow a raid or boss fight while it is still happening. This update hardens that experience — especially during heavy parse backlogs when the server is catching up with incoming Combat Logger data.",
        "Log and encounter pages now show a clear live-refresh state while fights are syncing, so a temporarily incomplete page no longer looks like a failed run. Fight tiles that are in progress no longer flash false failure styling during parse backlog, and encounter pages stay stable when a background live refresh fails transiently.",
        "Behind the scenes, the live pipeline is ready for production scale: API and worker processes can run separately, snapshot sync is debounced, encounter IDs are preserved across chunk jobs, and stress tests catch race conditions (including Theatre of Blood fight parity). Spectating a live log should feel closer to watching a normal uploaded log.",
      ],
      bullets: [
        "Live refresh indicators on log and encounter pages",
        "Retry logic for encounter loads while data is syncing",
        "Backend hardening against job races and Prisma transaction limits",
      ],
    },
  },
  {
    date: "2026-06-30",
    title: "Runelogs — About Page, Privacy Policy, and Discoverability",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs covers combat-log viewing, leaderboards, and live logging — and this release adds the public documentation to match. A new About page explains what Runelogs does, how Combat Logger fits in, and common questions about uploads, leaderboards, and live logs.",
        "The About page includes structured FAQ data (JSON-LD) so search engines can show accurate summaries when someone looks up Runelogs. A privacy policy is available at /privacy with contact emails for support and privacy questions, plus a site footer linking legal pages and community resources.",
        "Public pages are easier to find and share: each route has its own title and description, Open Graph previews for pasted links, prerendered HTML so crawlers can read key pages, and an expanded sitemap listing release notes and major sections. Prerendering no longer serves stale HTML on first load or hangs after builds.",
      ],
    },
  },
  {
    date: "2026-06-27",
    title: "Runelogs — Admin Tools, Yama, and Hiscore Sprites",
    category: "runelogs",
    body: {
      paragraphs: [
        "This release adds operational tooling for maintaining the growing log database and polishes how ranks are displayed across the site.",
        "A new admin panel lets authorized users manage logs, trigger bulk reparse jobs with progress tracking, and inspect uploader metadata. Yama joins leaderboards and content filters on both frontend and backend, with parsing support for the new boss encounters.",
        "Hiscore-style rank sprites appear on leaderboards, player pages, and encounter rank badges, giving percentile placements a familiar Old School look. Upload flows gain linear progress indicators and improved log status tracking so you can see when a large file is parsing.",
      ],
      bullets: [
        "Admin panel with bulk reparse and log management",
        "Yama leaderboards and parsing support",
        "Hiscore rank sprites across leaderboards and profiles",
        "Upload progress and log status improvements",
      ],
    },
  },
  {
    date: "2026-06-23",
    title: "Runelogs — ToA Raid Level Tracking",
    category: "runelogs",
    body: {
      paragraphs: [
        "Tombs of Amascut speedrunning often comes down to raid level as much as raw time. Runelogs now records and displays the raid level from your Combat Logger data on individual runs and on ToA leaderboard entries.",
        "Log pages and profile views receive a shared page-header styling pass so raid metadata (including level) is easier to scan. Fight group summaries also expose display duration ticks consistently across log and run views.",
      ],
    },
  },
  {
    date: "2026-06-22",
    title: "Runelogs — Profiles, Avatars, and Colosseum Modifiers",
    category: "runelogs",
    body: {
      paragraphs: [
        "Player identity on Runelogs gets a major upgrade in this release. User profiles support bios, social links, and unlockable avatars earned through boss and leaderboard milestones.",
        "Fortis Colosseum runs display the wave modifier choices you selected, parsed from Combat Logger ColosseumHelper data. Compare strategies on leaderboard entries and shared encounter links at a glance.",
        "Live fights also get better in-progress handling: encounters can show active status with nullable duration until the fight officially completes.",
      ],
    },
  },
  {
    date: "2026-06-16",
    title: "Runelogs — Navigation Refresh and DPS Rank Badges",
    category: "runelogs",
    body: {
      paragraphs: [
        "This UI pass reworks navigation, log browsing, encounter tabs, leaderboards, and run summaries for a more consistent dark-theme experience across the site.",
        "DPS percentile rank badges with category icons appear on encounters and personal bests, making it easy to see how your damage compares within a specific boss or content type. Leaderboards and personal bests gain a duration/DPS mode selector, and prayer filters work across log views for deeper analysis.",
        "Recent encounters on the homepage highlight success state with color coding, and the logs page gains filtering and sorting tools plus a dedicated page header component.",
      ],
    },
  },
  {
    date: "2026-06-15",
    title: "Runelogs — DPS Leaderboards",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs already ranks runs by time — this release adds DPS leaderboards alongside those time rankings. Damage throughput matters for many groups, especially in Theatre of Blood and Tombs of Amascut.",
        "Overall DPS is calculated for multi-fight raid runs so full clear performance is represented, not just a single room. Eligibility rules exclude invalid or incomplete fights and aggregate unknown damage sources fairly.",
        "Uploaded logs can have custom names, and autogenerated titles help identify sessions at a glance when you have not renamed them yet.",
      ],
    },
  },
  {
    date: "2026-06-14",
    title: "Runelogs — Live Logging",
    category: "runelogs",
    body: {
      paragraphs: [
        "Live logging is here: stream combat events from Combat Logger to Runelogs in real time and share a link so others can watch as you play.",
        "Generate an access key in Combat Logger plugin settings, enable live logging, and your encounters appear on Runelogs while the fight is in progress. Spectators see tick charts, damage meters, and fight splits update as new data arrives.",
        "This requires Combat Logger v1.5.0 or newer. The backend stores incremental chunks, refreshes fight JSON to S3, and syncs encounter records so live pages stay consistent with uploaded logs.",
      ],
    },
  },
  {
    date: "2026-06-13",
    title: "Runelogs — Gauntlet Leaderboards and Player Pages",
    category: "runelogs",
    body: {
      paragraphs: [
        "The Gauntlet and Corrupted Gauntlet join the leaderboard and personal-best lineup, including official duration handling from game messages.",
        "Player pages are reworked with avatars and improved log browsing so you can explore someone's history without digging through raw upload lists. Custom log names and upload dropzone improvements make organizing sessions easier.",
      ],
    },
  },
  {
    date: "2026-06-12",
    title: "Runelogs — Site Redesign",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs gets a visual overhaul in this release. A new dark theme spans the homepage, upload flow, log pages, and leaderboards, with wider layouts on desktop and tighter mobile spacing.",
        "The upload page is redesigned with drag-and-drop support and clearer guidance for finding Combat Logger files on disk. Leaderboards, recent encounters, and personal bests gain content icons, and row links jump directly to encounter pages.",
        "Under the hood, the frontend migrates from Create React App to Vite for faster dev builds and simpler environment configuration via VITE_API_URL.",
      ],
    },
  },
  {
    date: "2025-12-04",
    title: "Runelogs — Sailing Levels and Leaderboard Pagination",
    category: "runelogs",
    body: {
      paragraphs: [
        "Old School's sailing skill update requires combat level displays to include sailing level alongside existing combat stats. Runelogs updates player combat level rendering and backend parsing to track sailing in stat logs.",
        "Long leaderboard tables are paginated so top rankings load quickly. A stone background texture refreshes the visual style, and Verzik boat damage is handled more accurately in replays and damage breakdowns.",
      ],
    },
  },
  {
    date: "2025-10-10",
    title: "Runelogs — General Availability",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs leaves beta today. The beta badge comes off the site as uploads, leaderboards, and encounter sharing are ready for everyday use.",
        "Fight replays handle Tornado NPCs more reliably after backend parsing improvements, so Theatre of Blood P3 visualization is less confusing. SessionGuard automatically logs users out when Auth0 tokens expire, avoiding silent API failures mid-session.",
      ],
    },
  },
  {
    date: "2025-06-24",
    title: "Runelogs — Fight Caves, Colosseum, and Rank Badges",
    category: "runelogs",
    body: {
      paragraphs: [
        "Wave-based PvM content expands on Runelogs: Fight Caves and Fortis Colosseum get leaderboard and personal-best pages with official duration tracking.",
        "Rank colors and hiscore-style icons appear on leaderboards, individual encounters, and personal bests so you can spot top placements at a glance. Leaderboard filters support deep linking — share a URL with content, player count, and sort mode baked in, and browser back/forward navigation keeps state in sync.",
      ],
    },
  },
  {
    date: "2025-06-22",
    title: "Runelogs — Inferno Leaderboards",
    category: "runelogs",
    body: {
      paragraphs: [
        "The Inferno joins Runelogs leaderboards and personal bests in this release.",
        "Inferno is set as the default homepage leaderboard to highlight the new support. Backend parsing handles wave-based fight splitting and prevents inactive zero-damage fights from running indefinitely.",
      ],
    },
  },
  {
    date: "2025-06-10",
    title: "Runelogs.com Launch",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs.com is live with a hosted backend for uploading and sharing Combat Logger files. Browse encounters and leaderboards without an account; log in via Auth0 to upload logs and manage your history.",
        "Launch leaderboards cover Theatre of Blood and Tombs of Amascut time rankings with player-count filters and official duration support. The homepage shows a recent encounters feed, and the upload flow tracks progress over XMLHttpRequest so large raid logs do not feel like they vanished.",
        "A help page explains how to find log files on disk and use the ::newlog command in Combat Logger to start a fresh session before a raid.",
      ],
      bullets: [
        "Hosted uploads with Auth0 login",
        "ToB and ToA time leaderboards at launch",
        "Recent encounters feed and help documentation",
      ],
    },
  },
  {
    date: "2025-05-27",
    title: "Runelogs — Fortis Colosseum Support",
    category: "runelogs",
    body: {
      paragraphs: [
        "Fortis Colosseum joins Runelogs parsing in this release. Backend support recognizes wave challenge times and fight groups correctly.",
        "Colosseum runs use official duration handling from in-game challenge time messages, and fight groups combine wave encounters the same way as Fight Caves and Inferno content.",
      ],
    },
  },
  {
    date: "2024-11-17",
    title: "Runelogs — Replay Improvements",
    category: "runelogs",
    body: {
      paragraphs: [
        "The map replay tool gains several quality-of-life improvements for reviewing positioning during bosses and raids.",
        "NPC positions render on the replay map, and party member equipment is visible while stepping through ticks. Prayer overlays and shared combat stats from Combat Logger v1.3.x logs are supported.",
      ],
    },
  },
  {
    date: "2024-11-01",
    title: "Runelogs — Map Replay",
    category: "runelogs",
    body: {
      paragraphs: [
        "Runelogs introduces tick-by-tick map replay for supported encounters — a major step beyond DPS charts and event tables for understanding movement and mechanics.",
        "Replay requires Combat Logger log format v1.2.0 or newer, which logs party member position changes. The parser uses semver-aware version detection so older logs analyze correctly even when replay is unavailable.",
      ],
    },
  },
  {
    date: "2024-02-04",
    title: "Runelogs — Early Prototype",
    category: "runelogs",
    body: {
      paragraphs: [
        "The first Runelogs prototype is live as a browser-based combat log analyzer. Upload a Combat Logger file and explore fights entirely in your browser — no server required.",
        "This release includes DPS charts, paginated event tables, fight splitting, damage done/taken views, and boost tracking. The runelogs.com domain is registered and the app is deployed to GitHub Pages.",
      ],
    },
  },

  // — Combat Logger —
  {
    date: "2026-07-08",
    title: "Combat Logger 1.6.7 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.6.7 logs the player's current region in the opening messages when a session starts. That line is written alongside the logged-in player name and base stats, so the first live chunk Runelogs receives already knows which area the fight is in.",
        "This pairs with recent live-log fixes on Runelogs: Mokhaiotl delve detection when region data was missing at log start, correct standalone boss names on live encounter pages, and more reliable fight grouping as chunks arrive. If you live-stream raids or solo bosses, 1.6.7 helps the site label and group encounters correctly from the first tick.",
      ],
      bullets: [
        "Player region line in initial log messages at login",
        "Improves live log region context before the first combat event",
        "Recommended alongside Runelogs live logging for Mokhaiotl, Yama, and other region-sensitive content",
      ],
    },
  },
  {
    date: "2026-07-02",
    title: "Combat Logger 1.6.6 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.6.6 adds full Maggot King tracking so uploaded and live logs capture the boss fight on Runelogs.",
        "Maggot King and Ur-maggot larvae NPCs are tracked, along with poison splat game objects and dust wave and shadow warning graphics. Maggot King is registered as a boss ID so fight splitting and DPS meters treat the encounter correctly.",
        "Install 1.6.6 before logging Maggot King kills you plan to upload or live-stream — older plugin versions will miss the new NPCs, objects, and graphics that Runelogs replay and leaderboards expect.",
      ],
      bullets: [
        "Maggot King (15742) and Ur-maggot larvae (15743) NPC tracking",
        "Poison splat game objects and dust wave / shadow warning graphics",
        "Boss ID registration for correct fight detection",
      ],
    },
  },
  {
    date: "2026-06-29",
    title: "Combat Logger 1.6.5 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.6.5 updates attack animation IDs for recently released weapons so specials and unique attack styles log correctly in Runelogs DPS meters and replay tooling.",
        "Keeping animation maps current is routine maintenance, but it matters for accuracy — missing animations can make abilities look like idle ticks or splashes in uploaded and live logs.",
      ],
    },
  },
  {
    date: "2026-06-28",
    title: "Combat Logger 1.6.4 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Live logging sessions can run concurrently, and this release ensures each live command includes the current log ID so Runelogs routes events to the correct session.",
        "If you start a new log with ::newlog while live logging is enabled, spectators stay attached to the intended run instead of mixing fights across sessions.",
      ],
    },
  },
  {
    date: "2026-06-28",
    title: "Combat Logger 1.6.3 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Chambers of Xeric raid information is written to combat logs in this release, expanding skilling-combat hybrid content support on Runelogs.",
        "Raid completion and room context help Runelogs group CoX encounters correctly when you upload or live-stream a raid log.",
      ],
    },
  },
  {
    date: "2026-06-28",
    title: "Combat Logger 1.6.2 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Yama boss NPCs are tracked so new PvM encounters appear in Combat Logger and parse on Runelogs leaderboards.",
        "Additional blowpipe variants are added to ranged animation detection, improving accuracy for newer blowpipe skins and variants that reuse different animation IDs.",
      ],
    },
  },
  {
    date: "2026-06-25",
    title: "Combat Logger 1.6.1 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.6.1 extends world object tracking so mechanics that spawn temporary objects — acid pools, rocks, minions, and similar — are captured in logs for replay and analysis.",
        "More tracked objects mean Runelogs can render mechanics overlays and attribute damage to the right phase when those objects participate in a fight.",
      ],
    },
  },
  {
    date: "2026-06-22",
    title: "Combat Logger 1.6.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Fortis Colosseum players can log wave modifier choices via a new ColosseumHelper, which records which upgrades you selected between waves. Runelogs displays these modifiers on Colosseum run summaries and leaderboard entries.",
        "Tombs of Amascut wipe detection is streamlined through ToaHelper and shared RaidWipeUtil logic, making wipe events more reliable in raid logs. A config option can automatically open your Runelogs live log page when live logging starts — handy for streamers sharing a browser source.",
      ],
      bullets: [
        "ColosseumHelper for wave modifier tracking",
        "ToaHelper integration for wipe detection",
        "Optional auto-open Runelogs live page on start",
      ],
    },
  },
  {
    date: "2026-06-15",
    title: "Combat Logger 1.5.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.5.0 introduces live logging: stream combat events to Runelogs in real time using an access key configured in plugin settings. Friends can open your live link and watch DPS and fight splits update during the encounter.",
        "A config option allows enabling live logging with an upfront warning about sharing combat data. This release also fixes a bug where death events could log before final damage was recorded, which affected downstream DPS calculations on Runelogs.",
      ],
    },
  },
  {
    date: "2025-12-08",
    title: "Combat Logger 1.4.5 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Sailing introduced new boat-combat scenarios where damage sources do not behave like standard NPC hits. Combat Logger 1.4.5 improves boat damage handling so Runelogs attributes sailing combat damage correctly.",
      ],
    },
  },
  {
    date: "2025-12-08",
    title: "Combat Logger 1.4.4 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "This patch fixes boosted sailing level logging so combat stat lines reflect temporary boosts accurately.",
        "Correct boost tracking keeps combat level displays on Runelogs aligned with what you had in-game during a fight.",
      ],
    },
  },
  {
    date: "2025-12-04",
    title: "Combat Logger 1.4.3 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger records sailing level in combat stat logs, matching the sailing skill release.",
        "Runelogs uses these stat lines to show updated combat levels on player profiles and encounter pages.",
      ],
    },
  },
  {
    date: "2025-10-10",
    title: "Combat Logger 1.4.2 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Theatre of Blood players get Verzik creeper tracking in 1.4.2 — creeper NPCs are included in tracked boss minions so room damage breakdowns are complete.",
        "This release also adds Doom of Mokhaiotl support (boss NPC, acid blood, and rock objects), improving delves logging on Runelogs.",
      ],
    },
  },
  {
    date: "2025-07-24",
    title: "Combat Logger 1.4.1 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Doom of Mokhaiotl boss encounters are fully tracked, including acid blood and rock objects that matter for understanding phase damage during delves.",
        "Runelogs parses these objects for replay overlays and fight splitting when you upload delve logs.",
      ],
    },
  },
  {
    date: "2025-07-12",
    title: "Combat Logger 1.4.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Log timestamps include timezone offset information, which helps Runelogs display fight times correctly regardless of your local OSRS client settings.",
        "Overlay configuration descriptions are clarified, and community-contributed overlay fixes improve stability when toggling visibility or running without a party.",
      ],
    },
  },
  {
    date: "2025-06-11",
    title: "Combat Logger 1.3.7 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Attack animations are added for the bone dagger and Dorgeshuun crossbow so these weapons register properly in DPS meters.",
        "NPC names in logs no longer include stray tags from the client, making encounter titles cleaner on Runelogs. Overlay fixes from a community contribution also ship in this release.",
      ],
    },
  },
  {
    date: "2025-05-23",
    title: "Combat Logger 1.3.6 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "NPC and animation IDs migrate to the gameval format used by modern RuneLite tooling, reducing breakage when Jagex renumbers IDs between updates.",
        "Yama boss NPC IDs are added to tracked bosses, and NPC names are stripped of markup tags for consistent fight titles in uploaded logs.",
      ],
    },
  },
  {
    date: "2025-04-14",
    title: "Combat Logger 1.3.5 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Fight tracking keys off boss NPC IDs instead of display names, which is more reliable when Jagex renames monsters or adds variant names mid-fight.",
        "Runelogs uses the same boss ID data for leaderboard eligibility and fight grouping, so this change improves consistency across both tools.",
      ],
    },
  },
  {
    date: "2025-04-10",
    title: "Combat Logger 1.3.4 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Some bosses change NPC ID mid-fight — notably forms like Wyrms — which previously could split one encounter into two. Combat Logger 1.3.4 handles ID transitions during an active fight so Runelogs keeps a single encounter timeline.",
      ],
    },
  },
  {
    date: "2025-02-20",
    title: "Combat Logger 1.3.3 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Splash detection is fixed for bosses that do not play splash animations on failed attacks. The plugin combines spell animation with zero HP XP to identify splashes reliably.",
        "The plugin panel gains Runelogs and Discord links for quicker access to upload help and community discussion.",
      ],
    },
  },
  {
    date: "2025-02-13",
    title: "Combat Logger 1.3.2 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Royal Titans are tracked as boss encounters so new PvM content appears in your logs.",
        "Upload Royal Titans logs to Runelogs to split fights and view DPS charts for the encounter.",
      ],
    },
  },
  {
    date: "2025-01-17",
    title: "Combat Logger 1.3.1 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.3.1 is a major party-logging release. Player equipment, overhead prayers, prayer changes, and quiver slot updates are shared with RuneLite party members even if they are not running the plugin themselves.",
        "Party combat stats are synchronized, and graphics objects, game objects, and ground objects are written to logs. Runelogs uses object data for map replay overlays and mechanic visualization on supported bosses.",
      ],
      bullets: [
        "Share equipment, prayers, and stats with party members",
        "Log graphics, game, and ground objects",
        "Track quiver slot and prayer changes",
      ],
    },
  },
  {
    date: "2024-11-15",
    title: "Combat Logger 1.3.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "NPC positions are logged for tracked monsters in this release, enabling map replay on Runelogs for fights where positioning matters.",
        "Each tick records where enemies stand relative to the fight, giving analyzers the spatial data needed for movement review alongside existing damage and event logs.",
      ],
    },
  },
  {
    date: "2024-11-04",
    title: "Combat Logger 1.2.1 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Overlay stability improvements land in 1.2.1: empty lines are removed from the damage meter, the context menu hides when the overlay is not visible, and a player stat cache reduces flicker during busy fights.",
        "Concurrency fixes address rare races when multiple game events update the overlay in the same tick — important for long raids where the meter stays open for hours.",
      ],
    },
  },
  {
    date: "2024-10-29",
    title: "Combat Logger 1.2.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.2.0 reworks the fight manager, sidebar panel, and overlay architecture for a cleaner in-game experience.",
        "Party member position changes are logged for replay support. The overlay is resizable with min/max height, uses party colors, and gains burning claws spec and Noxious halberd animation IDs.",
      ],
      bullets: [
        "Reworked fight manager, panel, and overlay",
        "Party member position logging",
        "Resizable overlay with party color support",
      ],
    },
  },
  {
    date: "2024-08-06",
    title: "Combat Logger 1.1.2 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Animation IDs are updated for Osmumten's Fang and Voidwaker special attacks so these weapons register distinct hits in combat logs.",
        "Accurate spec tracking helps Runelogs attribute burst damage to the correct ticks in DPS charts and phase breakdowns.",
      ],
    },
  },
  {
    date: "2024-07-29",
    title: "Combat Logger 1.1.1 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "You can manually stop the current fight from the plugin — useful when a boss is reset or you want to split practice attempts without restarting the plugin.",
        "Tombs of Amascut path and Wardens encounter handling improves so raid logs group rooms correctly when uploaded to Runelogs.",
      ],
    },
  },
  {
    date: "2024-07-12",
    title: "Combat Logger 1.1.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.1.0 adds a built-in damage meter overlay so you can monitor DPS and taken damage in-game without uploading first.",
        "The overlay sits in the sidebar during fights and logs the same damage events that Runelogs parses into charts, meters, and leaderboards.",
      ],
    },
  },
  {
    date: "2024-07-04",
    title: "Combat Logger 1.0.2 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Raid logging takes a big step forward: Theatre of Blood and Tombs of Amascut wipes are recorded, along with wave counts, duration messages, and challenge time game text.",
        "Damage can be shared with RuneLite party members, helping teams coordinate during learning trips before anyone uploads to Runelogs.",
      ],
      bullets: [
        "Log ToB and ToA wipes",
        "Capture wave, duration, and challenge time messages",
        "Share damage with RuneLite party members",
      ],
    },
  },
  {
    date: "2024-06-23",
    title: "Combat Logger 1.0.1 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "This patch fixes cases where attacks did not fire log lines in some gear setups, and blowpipe animation detection is more reliable.",
        "Additional attack animation IDs are added for newer weapons. Accurate attack logging is essential for Runelogs activity charts and idle-tick analysis.",
      ],
    },
  },
  {
    date: "2024-03-09",
    title: "Combat Logger 1.0.0 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 1.0.0 introduces a structured log format for upload to Runelogs and other analyzers. Each line pairs a game tick and compact timestamp with a tab-separated event body.",
        "New sessions write a `Log Version 1.0.0` header, your player name, and boosted combat levels. Damage entries record source, hitsplat type, target, and amount — NPC targets use stable `id-index` identifiers instead of display names. Player region changes log for instance detection, timestamps use a compact format, and expanded hitsplat and animation IDs improve weapon coverage.",
        "Blowpipe stop detection writes an explicit line when you cease rapid fire, helping distinguish burst windows in DPS charts. Update to 1.0.0 before your next raid if you upload logs to Runelogs.",
      ],
    },
  },
  {
    date: "2024-02-28",
    title: "Combat Logger 0.0.6 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Ammo stack size changes are no longer logged, reducing noise from picking up darts or bolts between fights.",
        "Shutdown cleanup is improved so log files flush correctly when disabling the plugin or closing RuneLite.",
      ],
    },
  },
  {
    date: "2024-02-28",
    title: "Combat Logger 0.0.5 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Player attack animations are logged, including blazing blowpipe variants. The plugin detects when you stop blowpiping and writes an explicit log line.",
        "These events power Runelogs attack-style breakdowns and help identify whether downtime is from movement, eating, or weapon cooldowns.",
      ],
    },
  },
  {
    date: "2024-02-23",
    title: "Combat Logger 0.0.4 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Each time you start the plugin, Combat Logger creates a fresh log file so sessions do not append endlessly to one giant file.",
        "The ::newlog chat command starts a new log on demand — use it before a raid night when you plan to upload to Runelogs.",
      ],
    },
  },
  {
    date: "2024-02-07",
    title: "Combat Logger 0.0.3 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat stat boosts and equipped gear are written to logs, giving Runelogs the data behind boost charts and gear snapshots on encounter pages.",
        "A reminder message appears so you know logging is active — handy when hopping between accounts or after updating RuneLite.",
      ],
    },
  },
  {
    date: "2024-02-05",
    title: "Combat Logger 0.0.2 Release",
    category: "combat-logger",
    body: {
      paragraphs: [
        "Combat Logger 0.0.2 establishes the structured combat event format used in every log file. Each session records the player name, and hitsplats use stable integer identifiers instead of reflection.",
        "Tab-delimited event lines pair a game tick with a timestamp and message body, the pattern analyzers like Runelogs expect when parsing uploads.",
      ],
    },
  },
];

/** Sorted newest-first when rendered. */
export const BLOG_POSTS: BlogPost[] = BLOG_POSTS_RAW.map((post) => ({
  ...post,
  slug: generateBlogSlug(post.title),
}));

export function getBlogPostHref(slug: string): string {
  return `/blog/${slug}`;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatBlogDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Calendar-based recency for date-only blog posts (no publish time). */
export function formatBlogPostRecency(
  isoDate: string,
  now = new Date(),
): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const postDate = parseBlogPostDate(isoDate);
  const daysAgo = Math.round(
    (today.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysAgo === 0) {
    return "Today";
  }
  if (daysAgo === 1) {
    return "Yesterday";
  }
  if (daysAgo <= 6) {
    return `${daysAgo} days ago`;
  }
  return formatBlogDate(isoDate);
}

export const BLOG_POSTS_SORTED = [...BLOG_POSTS].sort(
  (a, b) => b.date.localeCompare(a.date) || b.title.localeCompare(a.title),
);

export const HOME_BLOG_MAX_AGE_DAYS = 14;

const HOME_BLOG_CATEGORY_ORDER: BlogCategory[] = ["runelogs", "combat-logger"];

export function parseBlogPostDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isBlogPostWithinDays(
  post: BlogPost,
  maxAgeDays: number,
  now = new Date(),
): boolean {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  return parseBlogPostDate(post.date) >= cutoff;
}

/** Latest Runelogs and Combat Logger posts for the homepage, at most one per category. */
export function getRecentHomeBlogPosts(
  maxAgeDays = HOME_BLOG_MAX_AGE_DAYS,
  now = new Date(),
): BlogPost[] {
  return HOME_BLOG_CATEGORY_ORDER.flatMap((category) => {
    const post = BLOG_POSTS_SORTED.find(
      (candidate) =>
        candidate.category === category &&
        isBlogPostWithinDays(candidate, maxAgeDays, now),
    );
    return post ? [post] : [];
  });
}

export function getBlogPostShortTitle(post: BlogPost): string {
  if (post.category === "runelogs" && post.title.startsWith("Runelogs — ")) {
    return post.title.slice("Runelogs — ".length);
  }
  if (
    post.category === "combat-logger" &&
    post.title.startsWith("Combat Logger ")
  ) {
    return post.title.slice("Combat Logger ".length);
  }
  return post.title;
}
