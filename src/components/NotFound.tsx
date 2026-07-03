import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import lumbridgeGuide from "../assets/lumbridge-guide.png";
import lumbridgeHomeTeleport from "../assets/lumbridge-home-teleport.png";
import { colors, centeredPageStateSx, fonts, media } from "../theme";
import { usePageMeta } from "../hooks/usePageMeta";

const pixelIconSx = {
  width: 20,
  height: 20,
  imageRendering: "pixelated",
  flexShrink: 0,
} as const;

/** Shrinks the whole 404 block on short viewports (top bar + footer + main padding). */
const notFoundZoom = "clamp(0.62, calc((100svh - 20rem) / 24rem), 1)";

const NotFound: React.FC = () => {
  const location = useLocation();
  const canonicalPath = `${location.pathname}${location.search}`;
  const requestedPath = canonicalPath || "/";

  usePageMeta({
    title: "Page Not Found | Runelogs",
    description:
      "The page you requested does not exist on Runelogs. Return to the homepage or visit Help for OSRS combat log upload instructions.",
    canonicalPath,
    noIndex: true,
  });

  return (
    <Box
      data-testid="not-found-page"
      sx={{
        ...centeredPageStateSx,
        position: "relative",
        flex: 1,
        minHeight: 0,
        px: 2,
        py: { xs: 0.5, sm: 1 },
        mb: { xs: -2.5, sm: -3.5 },
        textAlign: "center",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "min(85vw, 22rem)",
          height: "min(85vw, 22rem)",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(229, 204, 128, 0.12) 0%, rgba(56, 139, 253, 0.06) 45%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 560,
          mx: "auto",
          zoom: notFoundZoom,
        }}
      >
        <Box
          component="img"
          src={lumbridgeGuide}
          alt="Lumbridge Guide"
          sx={{
            display: "block",
            width: {
              xs: "clamp(5.25rem, 14vh, 6.75rem)",
              sm: "clamp(8rem, 20vh, 11rem)",
            },
            height: "auto",
            mx: "auto",
            mb: { xs: 0, sm: "0.25rem" },
            filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.4))",
          }}
        />

        <Typography
          component="p"
          sx={{
            m: 0,
            fontFamily: fonts.mono,
            fontWeight: 700,
            fontSize: { xs: "2.5rem", sm: "clamp(2.75rem, 7vh, 4.25rem)" },
            lineHeight: 0.95,
            letterSpacing: "-0.06em",
            background: `linear-gradient(180deg, ${colors.text.gold} 0%, ${colors.text.rune} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </Typography>

        <Typography
          component="h1"
          sx={{
            mt: { xs: 0.25, sm: "clamp(0.25rem, 1vh, 0.75rem)" },
            mb: { xs: 0.5, sm: "clamp(0.5rem, 1.25vh, 1rem)" },
            fontWeight: 700,
            fontSize: { xs: "1.1rem", sm: "clamp(1.2rem, 3.2vh, 1.85rem)" },
            lineHeight: 1.15,
            color: colors.text.primary,
          }}
        >
          You&apos;ve wandered off the map
        </Typography>

        <Typography
          component="code"
          sx={{
            display: "inline-block",
            px: 1.25,
            py: 0.5,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: fonts.mono,
            fontSize: { xs: "0.7rem", sm: "clamp(0.7rem, 1.6vh, 0.85rem)" },
            color: colors.text.rune,
            bgcolor: "rgba(255, 255, 255, 0.04)",
            border: `1px dashed ${colors.border.default}`,
            borderRadius: 1.5,
          }}
        >
          {requestedPath}
        </Typography>

        <Box
          sx={{
            mt: { xs: 0.75, sm: "clamp(0.75rem, 2vh, 1.5rem)" },
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1 },
            [media.mobileDown]: {
              "& .MuiButton-root": { minWidth: 0, flex: "1 1 auto" },
            },
          }}
        >
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            color="primary"
            size="small"
            sx={{
              [media.mobileDown]: { px: 1.5, py: 0.75, fontSize: "0.8rem" },
            }}
            startIcon={
              <Box
                component="img"
                src={lumbridgeHomeTeleport}
                alt=""
                aria-hidden
                sx={pixelIconSx}
              />
            }
          >
            Back Home
          </Button>
          <Button
            component={RouterLink}
            to="/help"
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              [media.mobileDown]: { px: 1.5, py: 0.75, fontSize: "0.8rem" },
            }}
          >
            Get help
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default NotFound;
