import { BLOG_POSTS, BlogPost, getBlogPostPlainText } from "../data/blogPosts";

import { PageMetaOptions } from "./pageMeta";
import { stripRunelogsTitlePrefix } from "./pageMetaFormatting";

function buildBlogPostDescription(post: BlogPost): string {
  const firstParagraph = post.body.paragraphs[0] ?? "";

  const fullText = getBlogPostPlainText(post.body);

  if (fullText.length <= 160) {
    return fullText;
  }

  if (firstParagraph.length <= 160) {
    return firstParagraph;
  }

  const truncated = firstParagraph.slice(0, 157);

  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("."),
  );

  if (lastSentenceEnd >= 100) {
    return truncated.slice(0, lastSentenceEnd + 1).trimEnd();
  }

  return `${truncated.trimEnd()}...`;
}

function getBlogPostMetaTitle(post: BlogPost): string {
  if (post.category === "runelogs") {
    return `${stripRunelogsTitlePrefix(post.title)} | Runelogs Blog`;
  }

  return `${post.title} | Combat Logger Blog`;
}

export function getBlogPostPageMeta(post: BlogPost): PageMetaOptions {
  return {
    title: getBlogPostMetaTitle(post),
    description: buildBlogPostDescription(post),
    canonicalPath: `/blog/${post.slug}`,
  };
}

export function buildBlogSitemapUrls(siteUrl: string): string[] {
  return BLOG_POSTS.map((post) => `${siteUrl}/blog/${post.slug}`);
}
