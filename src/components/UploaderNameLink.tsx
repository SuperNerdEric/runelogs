import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Link,
  SxProps,
  Theme,
  Typography,
  TypographyProps,
} from "@mui/material";
import AvatarIcon from "./AvatarIcon";
import { usePublicAvatarId } from "../hooks/usePublicAvatarId";
import { displayUsername } from "../utils/utils";
import { accountTextSx } from "../theme";

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
 */
const UploaderNameLink: React.FC<UploaderNameLinkProps> = ({
  uploaderId,
  to,
  variant = "body1",
  avatarSize = "1em",
  sx,
  typographySx,
}) => {
  const avatarId = usePublicAvatarId(uploaderId);
  const resolvedSize = avatarSize === "1em" ? 24 : avatarSize;

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
      {avatarId && (
        <AvatarIcon
          avatarId={avatarId}
          size={resolvedSize}
          sx={{
            width: avatarSize,
            height: avatarSize,
            flexShrink: 0,
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
