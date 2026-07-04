import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "../data/blogPosts";
import { getBlogPostPageMeta } from "../utils/blogPageMeta";
import { getEncounterFightPageMeta } from "../utils/encounterPageMeta";
import {
  formatPageTitle,
  stripRunelogsTitlePrefix,
} from "../utils/pageMetaFormatting";
import { getRecentEncountersPageMeta } from "../utils/recentEncountersPageMeta";

describe("pageMetaFormatting", () => {
  it("formats page titles with the Runelogs suffix", () => {
    expect(formatPageTitle("Upload OSRS Combat Log")).toBe(
      "Upload OSRS Combat Log | Runelogs",
    );
  });

  it("strips a leading Runelogs prefix for SEO titles", () => {
    expect(stripRunelogsTitlePrefix("Runelogs — Maggot King")).toBe(
      "Maggot King",
    );
    expect(stripRunelogsTitlePrefix("Runelogs - Live Logging")).toBe(
      "Live Logging",
    );
  });
});

describe("blogPageMeta", () => {
  it("uses stripped titles for runelogs posts", () => {
    const post = BLOG_POSTS.find(
      (entry) => entry.slug === "runelogs-maggot-king",
    );
    expect(post).toBeDefined();

    expect(getBlogPostPageMeta(post!).title).toBe(
      "Maggot King | Runelogs Blog",
    );
    expect(post!.title).toBe("Runelogs — Maggot King");
  });

  it("uses the Combat Logger blog suffix for plugin posts", () => {
    const post = BLOG_POSTS.find(
      (entry) => entry.slug === "combat-logger-1-6-6-release",
    );
    expect(post).toBeDefined();

    expect(getBlogPostPageMeta(post!).title).toBe(
      "Combat Logger 1.6.6 Release | Combat Logger Blog",
    );
  });
});

describe("recentEncountersPageMeta", () => {
  it("returns a filtered title for content-specific pages", () => {
    const meta = getRecentEncountersPageMeta(
      new URLSearchParams("content=Theatre+of+Blood&playerCount=4"),
    );

    expect(meta.title).toBe(
      "Theatre of Blood (TOB) Recent OSRS Combat Logs (4-player) | Runelogs",
    );
    expect(meta.canonicalPath).toBe(
      "/recent-encounters?content=Theatre+of+Blood&playerCount=4",
    );
  });

  it("returns the default title for the all-content page", () => {
    const meta = getRecentEncountersPageMeta(new URLSearchParams());

    expect(meta.title).toBe("Recent OSRS Combat Log Uploads | Runelogs");
  });
});

describe("encounterPageMeta", () => {
  it("includes run and fight names when both are present", () => {
    const meta = getEncounterFightPageMeta({
      fightName: "Nylocas Vasilias",
      runName: "Theatre of Blood",
      canonicalPath: "/encounter/abc123",
    });

    expect(meta.title).toBe(
      "Theatre of Blood - Nylocas Vasilias - OSRS Combat Log | Runelogs",
    );
  });

  it("marks aggregate encounters in the title", () => {
    const meta = getEncounterFightPageMeta({
      fightName: "Verzik Vitur",
      runName: "Theatre of Blood",
      canonicalPath: "/encounter/aggregate/abc123",
      isAggregate: true,
    });

    expect(meta.title).toBe(
      "Theatre of Blood - Verzik Vitur (Aggregate) - OSRS Combat Log | Runelogs",
    );
  });
});
