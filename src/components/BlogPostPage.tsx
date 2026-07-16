import React, { useMemo } from "react";

import { Link as RouterLink, Navigate, useParams } from "react-router-dom";

import { Box, Chip, Link, Typography } from "@mui/material";

import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { colors, contentColumnSx, fontSizes, media } from "../theme";

import {
  pageHeaderContainerSx,
  pageHeaderIconBoxSx,
  pageHeaderSubtitleSx,
} from "./pageHeaderStyles";

import { usePageMeta } from "../hooks/usePageMeta";

import {
  getBlogPostBySlug,
  formatBlogDate,
  BlogCategory,
} from "../data/blogPosts";

import { getBlogPostPageMeta } from "../utils/blogPageMeta";

import BlogExpandableImage from "./BlogExpandableImage";

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  "combat-logger": "Combat Logger",

  runelogs: "Runelogs",
};

const CATEGORY_CHIP_COLOR: Record<BlogCategory, string> = {
  "combat-logger": colors.text.rune,

  runelogs: colors.text.gold,
};

const paragraphSx = {
  color: colors.text.primary,

  fontSize: fontSizes.base,

  lineHeight: 1.65,

  m: 0,

  "& + &": { mt: 2 },
};

const sectionHeadingSx = {
  color: colors.text.primary,

  fontSize: fontSizes.xl,

  fontWeight: 600,

  lineHeight: 1.25,

  m: 0,

  mt: 3.5,

  mb: 1.5,

  pb: 1,

  borderBottom: `1px solid ${colors.border.default}`,

  "&:first-of-type": { mt: 0 },
};

const listSx = {
  color: colors.text.primary,

  fontSize: fontSizes.base,

  lineHeight: 1.65,

  pl: 3,

  m: 0,

  mt: 2,

  "& li": {
    mb: 0.75,

    "&:last-child": { mb: 0 },
  },
};

const backLinkSx = {
  display: "inline-flex",

  alignItems: "center",

  gap: 0.5,

  color: colors.text.link,

  fontSize: fontSizes.sm,

  textDecoration: "none",

  mb: 2,

  "&:hover": {
    textDecoration: "underline",
  },
};

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const post = slug ? getBlogPostBySlug(slug) : undefined;

  const pageMeta = useMemo(
    () => (post ? getBlogPostPageMeta(post) : null),
    [post],
  );

  usePageMeta(
    pageMeta ?? {
      title: "Blog | Runelogs",
      description: "Runelogs blog and release notes.",
      noIndex: true,
    },
  );

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

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
      <Link component={RouterLink} to="/blog" sx={backLinkSx}>
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to blog
      </Link>

      <Box sx={pageHeaderContainerSx}>
        <Box sx={pageHeaderIconBoxSx}>
          <ArticleOutlinedIcon sx={{ fontSize: 32, color: colors.text.gold }} />
        </Box>

        <Box>
          <Box
            sx={{
              display: "flex",

              flexWrap: "wrap",

              alignItems: "center",

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
            variant="h4"

            component="h1"

            sx={{
              m: 0,
              fontWeight: 600,
              color: colors.text.primary,
              lineHeight: 1.15,
            }}
          >
            {post.title}
          </Typography>

          <Typography component="span" sx={pageHeaderSubtitleSx}>
            {CATEGORY_LABEL[post.category]} release notes
          </Typography>
        </Box>
      </Box>

      <Box
        component="article"

        sx={{
          border: `1px solid ${CATEGORY_CHIP_COLOR[post.category]}44`,

          borderRadius: 2,

          bgcolor: colors.background.surfaceAlt,

          boxShadow: "0 1px 2px rgba(1, 4, 9, 0.24)",

          px: { xs: 2, sm: 3 },

          py: 2.5,
        }}
      >
        {post.body.paragraphs.map((paragraph, index) => (
          <React.Fragment key={paragraph}>
            {post.body.headings
              ?.filter((heading) => heading.beforeParagraph === index)
              .map((heading) => (
                <Typography
                  key={heading.text}
                  component="h2"
                  sx={sectionHeadingSx}
                >
                  {heading.text}
                </Typography>
              ))}

            <Typography component="p" sx={paragraphSx}>
              {paragraph}
            </Typography>

            {post.body.lists
              ?.filter((list) => list.afterParagraph === index)
              .map((list, listIndex) => (
                <Box
                  component="ul"
                  sx={listSx}
                  key={`list-${index}-${listIndex}`}
                >
                  {list.items.map((item) => (
                    <Box component="li" key={item}>
                      {item}
                    </Box>
                  ))}
                </Box>
              ))}

            {post.body.images
              ?.filter((image) => image.afterParagraph === index)
              .map((image) => (
                <BlogExpandableImage
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  caption={image.caption}
                />
              ))}
          </React.Fragment>
        ))}

        {post.body.images
          ?.filter((image) => image.afterParagraph === undefined)
          .map((image) => (
            <BlogExpandableImage
              key={image.src}
              src={image.src}
              alt={image.alt}
              caption={image.caption}
            />
          ))}

        {post.body.headings
          ?.filter(
            (heading) => heading.beforeParagraph >= post.body.paragraphs.length,
          )
          .map((heading) => (
            <Typography key={heading.text} component="h2" sx={sectionHeadingSx}>
              {heading.text}
            </Typography>
          ))}

        {post.body.bullets && post.body.bullets.length > 0 && (
          <Box component="ul" sx={listSx}>
            {post.body.bullets.map((item) => (
              <Box component="li" key={item}>
                {item}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BlogPostPage;
