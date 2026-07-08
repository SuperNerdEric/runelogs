import { describe, expect, it } from "vitest";
import {
  BLOG_POSTS,
  BLOG_SUMMARY_MAX_LENGTH,
  getBlogPostSummary,
} from "../data/blogPosts";

describe("blog post summaries", () => {
  it("defines a manual summary for every post", () => {
    for (const post of BLOG_POSTS) {
      expect(post.body.summary.trim().length, post.title).toBeGreaterThan(0);
    }
  });

  it("keeps every summary within the max length", () => {
    for (const post of BLOG_POSTS) {
      expect(post.body.summary.length, post.title).toBeLessThanOrEqual(
        BLOG_SUMMARY_MAX_LENGTH,
      );
    }
  });

  it("ends every summary on a complete sentence", () => {
    for (const post of BLOG_POSTS) {
      expect(post.body.summary.trim(), post.title).toMatch(/[.!?]$/);
    }
  });

  it("returns the manual summary from getBlogPostSummary", () => {
    for (const post of BLOG_POSTS) {
      expect(getBlogPostSummary(post)).toBe(post.body.summary);
    }
  });
});
