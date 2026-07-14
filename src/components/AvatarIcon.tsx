import React from "react";
import { Box, SxProps, Theme } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { colors } from "../theme";
import { AvatarId, AVATAR_IMAGES, isCrownAvatar } from "../utils/avatars";
import { CrownIcon } from "./CrownIcon";

const avatarTextureBackground = `
    radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.04) 0%, transparent 45%),
    radial-gradient(circle at 75% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
    repeating-linear-gradient(
        135deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.012) 2px,
        rgba(255, 255, 255, 0.012) 3px
    ),
    ${colors.background.surfaceAlt}
`;

export interface AvatarIconProps {
  avatarId: AvatarId;
  size?: number;
  locked?: boolean;
  selected?: boolean;
  sx?: SxProps<Theme>;
}

const AvatarIcon: React.FC<AvatarIconProps> = ({
  avatarId,
  size = 40,
  locked = false,
  selected = false,
  sx,
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "50%",
      border: selected
        ? `2px solid ${colors.upload.dragActive}`
        : `1px solid ${colors.border.default}`,
      boxSizing: "border-box",
      position: "relative",
      ...sx,
    }}
  >
    <Box
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: avatarTextureBackground,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        filter: locked ? "grayscale(1) brightness(0.55)" : "none",
        opacity: locked ? 0.75 : 1,
      }}
    >
      {isCrownAvatar(avatarId) ? (
        <Box
          sx={{
            width: "78%",
            height: "78%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& > svg": { width: "100%", height: "100%" },
          }}
        >
          <CrownIcon size={Math.round(size * 0.78)} />
        </Box>
      ) : (
        <Box
          component="img"
          src={AVATAR_IMAGES[avatarId]}
          alt=""
          sx={{
            width: "78%",
            height: "78%",
            objectFit: "contain",
            imageRendering: "pixelated",
          }}
        />
      )}
    </Box>
    {locked && (
      <LockIcon
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: Math.round(size * 0.38),
          color: colors.text.primary,
          pointerEvents: "none",
        }}
      />
    )}
  </Box>
);

export default AvatarIcon;
