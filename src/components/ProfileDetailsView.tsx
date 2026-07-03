import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PublicUserProfile } from "../utils/avatars";
import {
  CONTACT_FIELDS,
  getContactDisplayText,
  getContactLinkHref,
  isContactLink,
} from "../utils/profile";
import { colors, fontSizes } from "../theme";

const sectionTitleSx = {
  color: colors.text.primary,
  fontWeight: 600,
  fontSize: fontSizes.lg,
  mb: 1.5,
} as const;

const readOnlyFieldSx = {
  backgroundColor: colors.background.tableHead,
  border: `1px solid ${colors.border.default}`,
  borderRadius: 1,
  boxSizing: "border-box",
  cursor: "default",
  userSelect: "text",
  WebkitUserSelect: "text",
} as const;

const readOnlyTextSx = {
  fontSize: fontSizes.base,
  lineHeight: 1.5,
  color: colors.text.primary,
  cursor: "default",
  userSelect: "text",
  WebkitUserSelect: "text",
} as const;

const contactIconContainerSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  flexShrink: 0,
  userSelect: "none",
  WebkitUserSelect: "none",
} as const;

const contactTextSx = {
  fontSize: fontSizes.base,
  lineHeight: 1,
} as const;

const PUBLIC_BIO_PLACEHOLDER = "This user hasn't added a bio yet.";

interface ProfileDetailsViewProps {
  profile: PublicUserProfile;
}

const ProfileDetailsView: React.FC<ProfileDetailsViewProps> = ({ profile }) => {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}
    >
      <Box sx={{ width: "100%" }}>
        <Typography sx={sectionTitleSx}>Bio</Typography>
        <Box
          sx={{
            ...readOnlyFieldSx,
            px: 1.75,
            py: 1.5,
            minHeight: 118,
          }}
        >
          {profile.bio ? (
            <Typography
              component="p"
              sx={{
                ...readOnlyTextSx,
                m: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {profile.bio}
            </Typography>
          ) : (
            <Typography
              sx={{
                ...readOnlyTextSx,
                color: colors.text.muted,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {PUBLIC_BIO_PLACEHOLDER}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ width: "100%", maxWidth: 560 }}>
        <Typography sx={sectionTitleSx}>Contact</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {CONTACT_FIELDS.map((field) => {
            const value = profile[field.key];
            const href = value ? getContactLinkHref(field.key, value) : "";
            const label = value ? getContactDisplayText(field.key, value) : "";
            const isRsn = field.key === "rsn";
            const isLink = !!value && isContactLink(field.key, value);

            return (
              <Box
                key={field.key}
                sx={{
                  ...readOnlyFieldSx,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.75,
                  minHeight: 56,
                }}
              >
                {field.imageSrc ? (
                  <Box
                    component="img"
                    src={field.imageSrc}
                    alt=""
                    sx={{
                      ...contactIconContainerSx,
                      borderRadius: "4px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box sx={contactIconContainerSx}>
                    <Icon
                      icon={field.icon!}
                      style={{
                        width: 22,
                        height: 22,
                      }}
                    />
                  </Box>
                )}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    cursor: "default",
                    userSelect: "text",
                    WebkitUserSelect: "text",
                  }}
                >
                  {isLink ? (
                    isRsn ? (
                      <Link
                        component={RouterLink}
                        to={href}
                        underline="hover"
                        sx={{
                          ...contactTextSx,
                          color: colors.text.link,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </Link>
                    ) : (
                      <Link
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{
                          ...contactTextSx,
                          color: colors.text.link,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </Link>
                    )
                  ) : value ? (
                    <Typography
                      sx={{
                        ...contactTextSx,
                        ...readOnlyTextSx,
                        lineHeight: 1,
                      }}
                    >
                      {label}
                    </Typography>
                  ) : (
                    <Typography
                      sx={{
                        ...contactTextSx,
                        color: colors.text.muted,
                        cursor: "default",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    >
                      {field.placeholder}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileDetailsView;
