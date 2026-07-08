import React from "react";

import { Box, Typography } from "@mui/material";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { colors, fontSizes } from "../theme";

export interface BlogExpandableImageProps {
  src: string;
  alt: string;
  caption?: string;
}

const BlogExpandableImage: React.FC<BlogExpandableImageProps> = ({
  src,
  alt,
  caption,
}) => {
  return (
    <Box component="figure" sx={{ m: 0, mt: 2 }}>
      <Box
        component="a"
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open full image in a new tab: ${alt}`}
        sx={{
          display: "block",
          width: "fit-content",
          maxWidth: "100%",
          mx: "auto",
          borderRadius: 2,
          overflow: "hidden",
          cursor: "zoom-in",
          position: "relative",
          lineHeight: 0,
          "&:hover .blog-expandable-image__overlay": {
            opacity: 1,
          },
          "&:focus-visible": {
            outline: `2px solid ${colors.text.link}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          sx={{
            display: "block",
            width: "auto",
            maxWidth: "100%",
            maxHeight: 420,
            objectFit: "contain",
          }}
        />
        <Box
          className="blog-expandable-image__overlay"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            bgcolor: "rgba(0, 0, 0, 0.45)",
            color: colors.text.primary,
            opacity: 0,
            transition: "opacity 0.15s ease",
            pointerEvents: "none",
          }}
        >
          <OpenInNewIcon sx={{ fontSize: 22 }} />
          <Typography
            component="span"
            sx={{ fontSize: fontSizes.sm, fontWeight: 600 }}
          >
            Open full image in a new tab
          </Typography>
        </Box>
      </Box>
      {caption && (
        <Typography
          component="figcaption"
          sx={{
            m: 0,
            mt: 1,
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: fontSizes.sm,
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
};

export default BlogExpandableImage;
