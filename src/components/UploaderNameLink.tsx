import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Link,
  Skeleton,
  SxProps,
  Theme,
  Typography,
  TypographyProps,
} from "@mui/material";
import AvatarIcon from "./AvatarIcon";
import { usePublicAvatarId } from "../hooks/usePublicAvatarId";
import { displayUsername } from "../utils/utils";
import { accountTextSx, colors } from "../theme";

interface UploaderNameLinkProps {
  uploaderId: string;
  to: string;
  variant?: TypographyProps["variant"];
  /** Pixel size, or "1em" to match the name font size. */
  avatarSize?: number | "1em";
  sx?: SxProps<Theme>;
  typographySx?: SxProps<Theme>;
}

/**
 * Linked uploader name with a text-sized avatar to the left.
 * Always reserves avatar space (skeleton while loading) to avoid layout shift.
 */
const UploaderNameLink: React.FC<UploaderNameLinkProps> = ({
  uploaderId,
  to,
  variant = "body1",
  avatarSize = "1em",
  sx,
  typographySx,
}) => {
  const { avatarId, loading } = usePublicAvatarId(uploaderId);
  const resolvedSize = avatarSize === "1em" ? 24 : avatarSize;
  const avatarSlotSx = {
    width: avatarSize,
    height: avatarSize,
    flexShrink: 0,
  } as const;

  return (
    <Link
      component={RouterLink}
      to={to}
      underline="hover"
      variant={variant}
      sx={{
        textTransform: "capitalize",
        ...accountTextSx,
        ...sx,
        // Keep avatar+name layout after caller sx so display is not overridden.
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35em",
        minWidth: 0,
      }}
    >
      {loading ? (
        <Skeleton
          variant="circular"
          width={avatarSize}
          height={avatarSize}
          animation="wave"
          sx={{
            ...avatarSlotSx,
            bgcolor: colors.background.surfaceAlt,
          }}
        />
      ) : avatarId ? (
        <AvatarIcon avatarId={avatarId} size={resolvedSize} sx={avatarSlotSx} />
      ) : (
        <Box
          aria-hidden
          sx={{
            ...avatarSlotSx,
            borderRadius: "50%",
            border: `1px solid ${colors.border.default}`,
            boxSizing: "border-box",
            bgcolor: colors.background.surfaceAlt,
          }}
        />
      )}
      <Typography
        component="span"
        variant={variant}
        sx={{
          fontSize: "inherit",
          fontWeight: "inherit",
          lineHeight: "inherit",
          color: "inherit",
          textTransform: "inherit",
          minWidth: 0,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          ...typographySx,
        }}
      >
        {displayUsername(uploaderId)}
      </Typography>
    </Link>
  );
};

export default UploaderNameLink;
