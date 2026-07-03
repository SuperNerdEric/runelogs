import React, { useMemo, useState } from "react";

import { Link as RouterLink } from "react-router-dom";

import { Box, Chip, Link, Typography } from "@mui/material";

import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";

import { colors, contentColumnSx, fontSizes, media } from "../theme";

import {
  pageHeaderContainerSx,
  pageHeaderIconBoxSx,
  pageHeaderSubtitleSx,
} from "./pageHeaderStyles";

import { usePageMeta } from "../hooks/usePageMeta";

import { BLOG_PAGE_META } from "../utils/seoContent";

import {
  BLOG_POSTS_SORTED,
  BlogCategory,
  BlogPost,
  formatBlogDate,
  getBlogPostHref,
  getBlogPostSummary,
} from "../data/blogPosts";

type FilterOption = "all" | BlogCategory;

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  "combat-logger": "Combat Logger",

  runelogs: "Runelogs",
};

const CATEGORY_CHIP_COLOR: Record<BlogCategory, string> = {
  "combat-logger": colors.text.rune,

  runelogs: colors.text.gold,
};

const titleLinkSx = {
  color: "inherit",

  textDecoration: "none",

  "&:hover": {
    color: colors.text.link,
  },
};

const filterChipSx = (active: boolean) => ({
  cursor: "pointer",

  fontSize: fontSizes.sm,

  height: 28,

  borderColor: active ? colors.text.link : colors.border.default,

  color: active ? colors.text.primary : colors.text.muted,

  bgcolor: active ? "rgba(97, 218, 251, 0.08)" : "transparent",

  "&:hover": {
    borderColor: colors.text.link,

    bgcolor: "rgba(97, 218, 251, 0.06)",
  },
});

function BlogEntry({ post }: { post: BlogPost }) {
  const summary = getBlogPostSummary(post);
  const hasMore =
    post.body.paragraphs.length > 1 || (post.body.bullets?.length ?? 0) > 0;

  return (
    <Box
      component="article"

      sx={{
        py: 2.5,

        borderBottom: `1px solid ${colors.border.default}`,

        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          display: "flex",

          flexWrap: "wrap",

          alignItems: "baseline",

          gap: 1,

          mb: 0.75,
        }}
      >
        <Typography
          component="time"

          dateTime={post.date}

          sx={{
            color: colors.text.muted,

            fontSize: fontSizes.sm,

            flexShrink: 0,
          }}
        >
          {formatBlogDate(post.date)}
        </Typography>

        <Chip
          label={CATEGORY_LABEL[post.category]}

          size="small"

          variant="outlined"

          sx={{
            height: 22,

            fontSize: fontSizes.xs,

            borderColor: colors.border.default,

            color: CATEGORY_CHIP_COLOR[post.category],
          }}
        />
      </Box>

      <Typography
        component="h2"

        sx={{
          m: 0,

          fontSize: fontSizes.lg,

          fontWeight: 600,

          color: colors.text.primary,

          lineHeight: 1.3,
        }}
      >
        <Link
          component={RouterLink}
          to={getBlogPostHref(post.slug)}
          sx={titleLinkSx}
        >
          {post.title}
        </Link>
      </Typography>

      <Typography
        sx={{
          color: colors.text.muted,

          fontSize: fontSizes.sm,

          lineHeight: 1.6,

          mt: 0.75,

          m: 0,
        }}
      >
        {summary}

        {hasMore && (
          <>
            {" "}
            <Link
              component={RouterLink}

              to={getBlogPostHref(post.slug)}

              sx={{
                color: colors.text.link,

                fontSize: "inherit",

                verticalAlign: "baseline",

                "&:hover": { textDecoration: "underline" },
              }}
            >
              Read more
            </Link>
          </>
        )}
      </Typography>
    </Box>
  );
}

const Blog: React.FC = () => {
  usePageMeta(BLOG_PAGE_META);

  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredPosts = useMemo(() => {
    if (filter === "all") return BLOG_POSTS_SORTED;

    return BLOG_POSTS_SORTED.filter((post) => post.category === filter);
  }, [filter]);

  const combatLoggerCount = BLOG_POSTS_SORTED.filter(
    (p) => p.category === "combat-logger",
  ).length;

  const runelogsCount = BLOG_POSTS_SORTED.filter(
    (p) => p.category === "runelogs",
  ).length;

  return (
    <Box
      sx={{
        ...contentColumnSx,
        mt: 2,
        px: 2,
        pb: 4,
        [media.mobileDown]: { px: 1 },
      }}
    >
      <Box sx={pageHeaderContainerSx}>
        <Box sx={pageHeaderIconBoxSx}>
          <ArticleOutlinedIcon sx={{ fontSize: 32, color: colors.text.gold }} />
        </Box>

        <Box>
          <Typography
            variant="h4"

            sx={{
              m: 0,
              fontWeight: 600,
              color: colors.text.primary,
              lineHeight: 1.15,
            }}
          >
            Blog
          </Typography>

          <Typography component="span" sx={pageHeaderSubtitleSx}>
            Release notes for Runelogs and Combat Logger
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",

          flexWrap: "wrap",

          gap: 1,

          mb: 2,
        }}
      >
        <Chip
          label="All"

          size="small"

          variant="outlined"

          onClick={() => setFilter("all")}

          sx={filterChipSx(filter === "all")}
        />

        <Chip
          label={`Runelogs (${runelogsCount})`}

          size="small"

          variant="outlined"

          onClick={() => setFilter("runelogs")}

          sx={filterChipSx(filter === "runelogs")}
        />

        <Chip
          label={`Combat Logger (${combatLoggerCount})`}

          size="small"

          variant="outlined"

          onClick={() => setFilter("combat-logger")}

          sx={filterChipSx(filter === "combat-logger")}
        />
      </Box>

      <Box
        sx={{
          border: `1px solid ${colors.border.default}`,

          borderRadius: 2,

          bgcolor: colors.background.surface,

          px: { xs: 2, sm: 3 },
        }}
      >
        {filteredPosts.map((post) => (
          <BlogEntry key={post.slug} post={post} />
        ))}
      </Box>
    </Box>
  );
};

export default Blog;
