import { describe, expect, it } from "vitest";
import { BLOG_POSTS, BlogPost, getBlogPostPlainText } from "../data/blogPosts";

/** Em dash (U+2014) and en dash (U+2013). Use ASCII hyphen-minus instead. */
const UNICODE_DASH = /[\u2014\u2013]/;

function collectBlogText(post: BlogPost): { label: string; text: string }[] {
  const parts: { label: string; text: string }[] = [
    { label: "title", text: post.title },
    { label: "summary", text: post.body.summary },
  ];

  post.body.paragraphs.forEach((paragraph, index) => {
    parts.push({ label: `paragraphs[${index}]`, text: paragraph });
  });

  post.body.bullets?.forEach((bullet, index) => {
    parts.push({ label: `bullets[${index}]`, text: bullet });
  });

  post.body.headings?.forEach((heading, index) => {
    parts.push({ label: `headings[${index}]`, text: heading.text });
  });

  post.body.images?.forEach((image, index) => {
    parts.push({ label: `images[${index}].alt`, text: image.alt });
    if (image.caption) {
      parts.push({ label: `images[${index}].caption`, text: image.caption });
    }
  });

  // Catch-all so new body fields cannot silently skip the dash ban.
  parts.push({ label: "plainText", text: getBlogPostPlainText(post.body) });

  return parts;
}

describe("blog post content", () => {
  it("does not use em dashes or en dashes anywhere", () => {
    for (const post of BLOG_POSTS) {
      for (const { label, text } of collectBlogText(post)) {
        expect(text, `${post.slug} ${label}`).not.toMatch(UNICODE_DASH);
      }
    }
  });

  it("omits redundant category labels already stored on the post", () => {
    for (const post of BLOG_POSTS) {
      if (post.category === "runelogs") {
        expect(post.title, post.slug).not.toMatch(/^Runelogs\s*[—–-]\s*/i);
      }
      if (post.category === "combat-logger") {
        expect(post.title, post.slug).not.toMatch(/^Combat Logger\s+/i);
      }
    }
  });
});
