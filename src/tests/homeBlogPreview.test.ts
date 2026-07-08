import { describe, expect, it } from "vitest";
import {
  BLOG_POSTS_SORTED,
  formatBlogPostRecency,
  getRecentHomeBlogPosts,
  getBlogPostShortTitle,
  isBlogPostWithinDays,
} from "../data/blogPosts";

describe("getRecentHomeBlogPosts", () => {
  it("returns at most one post per category, newest first within each", () => {
    const posts = getRecentHomeBlogPosts(14, new Date(2026, 6, 8));
    expect(posts).toHaveLength(2);
    expect(posts[0].category).toBe("runelogs");
    expect(posts[0].title).toBe(
      "Runelogs — Encounter Summaries and Replay Tick Chart Improvements",
    );
    expect(posts[1].category).toBe("combat-logger");
    expect(posts[1].title).toBe("Combat Logger 1.6.7 Release");
  });

  it("excludes posts older than the max age", () => {
    const posts = getRecentHomeBlogPosts(14, new Date(2026, 6, 23));
    expect(posts).toHaveLength(0);
  });

  it("includes posts published exactly on the cutoff day", () => {
    const posts = getRecentHomeBlogPosts(14, new Date(2026, 6, 22));
    expect(
      posts.some(
        (post) =>
          post.title ===
          "Runelogs — Encounter Summaries and Replay Tick Chart Improvements",
      ),
    ).toBe(true);
  });

  it("returns only categories with a recent post", () => {
    const posts = getRecentHomeBlogPosts(3, new Date(2026, 6, 2));
    expect(posts.every((post) => post.date >= "2026-06-29")).toBe(true);
  });
});

describe("isBlogPostWithinDays", () => {
  it("uses local calendar days for the cutoff", () => {
    const post = BLOG_POSTS_SORTED.find(
      (entry) =>
        entry.slug ===
        "runelogs-encounter-summaries-and-replay-tick-chart-improvements",
    );
    expect(post).toBeDefined();
    expect(isBlogPostWithinDays(post!, 14, new Date(2026, 6, 22))).toBe(true);
    expect(isBlogPostWithinDays(post!, 14, new Date(2026, 6, 23))).toBe(false);
  });
});

describe("getBlogPostShortTitle", () => {
  it("strips category prefixes for compact homepage cards", () => {
    expect(
      getBlogPostShortTitle({
        date: "2026-07-02",
        title: "Runelogs — Maggot King",
        slug: "runelogs-maggot-king",
        category: "runelogs",
        body: { summary: "", paragraphs: [""] },
      }),
    ).toBe("Maggot King");

    expect(
      getBlogPostShortTitle({
        date: "2026-07-02",
        title: "Combat Logger 1.6.6 Release",
        slug: "combat-logger-1-6-6-release",
        category: "combat-logger",
        body: { summary: "", paragraphs: [""] },
      }),
    ).toBe("1.6.6 Release");
  });
});

describe("formatBlogPostRecency", () => {
  it("uses calendar days instead of time-of-day for date-only posts", () => {
    expect(
      formatBlogPostRecency("2026-07-02", new Date(2026, 6, 2, 18, 20)),
    ).toBe("Today");
    expect(
      formatBlogPostRecency("2026-07-01", new Date(2026, 6, 2, 18, 20)),
    ).toBe("Yesterday");
    expect(
      formatBlogPostRecency("2026-06-29", new Date(2026, 6, 2, 18, 20)),
    ).toBe("3 days ago");
    expect(
      formatBlogPostRecency("2026-06-20", new Date(2026, 6, 2, 18, 20)),
    ).toBe("June 20, 2026");
  });
});
