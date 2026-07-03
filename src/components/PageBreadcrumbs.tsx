import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { media } from "../theme/layout";
import ContentLabel from "./ContentLabel";

export type BreadcrumbSelectOption = {
  value: number;
  label: string;
};

export type BreadcrumbSegment = {
  label: React.ReactNode;
  title?: string;
  href?: string;
  spriteKey?: string | null;
  select?: {
    options: BreadcrumbSelectOption[];
    value: number;
    onChange: (index: number) => void;
  };
};

interface PageBreadcrumbsProps {
  segments: BreadcrumbSegment[];
  sx?: object;
}

const breadcrumbTextSx = {
  fontWeight: 600,
  fontSize: "1.1rem",
  lineHeight: 1.4,
} as const;

export const breadcrumbSelectSx = {
  ...breadcrumbTextSx,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  color: "var(--color-text-primary)",
  background: "transparent",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontFamily: "inherit",
  py: 0.25,
  pl: 0.5,
  pr: 2.5,
  maxWidth: "100%",
  transition: "background-color 0.2s",
  "&:hover": {
    backgroundColor: "var(--color-bg-surface)",
  },
  "&:focus": {
    outline: "none",
    backgroundColor: "var(--color-bg-surface)",
  },
  "&:focus-visible": {
    outline: "2px solid var(--color-text-link)",
    outlineOffset: "2px",
  },
} as const;

const ellipsisSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
} as const;

function segmentTitle(segment: BreadcrumbSegment): string | undefined {
  if (segment.title != null) {
    return segment.title;
  }
  return typeof segment.label === "string" ? segment.label : undefined;
}

function renderSegmentLabel(segment: BreadcrumbSegment) {
  if (segment.spriteKey && typeof segment.label === "string") {
    return (
      <ContentLabel
        label={segment.label}
        spriteKey={segment.spriteKey}
        iconHeight="1.25em"
      />
    );
  }
  return segment.label;
}

const chevronRightIcon = (
  <Icon
    icon="mdi:chevron-right"
    style={{
      color: "var(--color-text-muted)",
      fontSize: "1.125rem",
      verticalAlign: "middle",
    }}
  />
);

interface BreadcrumbSelectProps {
  segment: BreadcrumbSegment;
  selectSx?: object;
  ariaLabel?: string;
}

export const BreadcrumbSelect: React.FC<BreadcrumbSelectProps> = ({
  segment,
  selectSx,
  ariaLabel = "Select fight",
}) => {
  const { options, value, onChange } = segment.select!;

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        maxWidth: "100%",
        minWidth: 0,
        flex: 1,
      }}
    >
      <Box
        component="select"
        value={value}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
          onChange(Number(event.target.value));
        }}
        aria-label={ariaLabel}
        sx={{ ...breadcrumbSelectSx, ...selectSx }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Box>
      <Icon
        icon="mdi:chevron-down"
        style={{
          position: "absolute",
          right: 2,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--color-text-muted)",
          fontSize: "1.125rem",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
};

const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({ segments, sx }) => {
  const ancestors = segments.slice(0, -1);
  const parent =
    ancestors.length > 0 ? ancestors[ancestors.length - 1] : undefined;

  return (
    <Box sx={{ width: "100%", ...sx }}>
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={chevronRightIcon}
        sx={{
          display: "none",
          [media.desktopUp]: {
            display: "flex",
          },
          width: "100%",
          mb: 1.5,
          "& .MuiBreadcrumbs-ol": {
            flexWrap: "wrap",
            alignItems: "center",
          },
          "& .MuiBreadcrumbs-li": {
            display: "flex",
            alignItems: "center",
          },
        }}
      >
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const key = segment.select
            ? "breadcrumb-select"
            : `breadcrumb-${index}`;

          if (segment.select) {
            return <BreadcrumbSelect key={key} segment={segment} />;
          }

          if (isLast || !segment.href) {
            return (
              <Typography
                key={key}
                component="span"
                sx={{
                  ...breadcrumbTextSx,
                  color: "var(--color-text-primary)",
                }}
              >
                {renderSegmentLabel(segment)}
              </Typography>
            );
          }

          return (
            <Link
              key={key}
              component={RouterLink}
              to={segment.href}
              underline="hover"
              color="primary"
              sx={{
                fontWeight: 500,
                fontSize: "1.1rem",
                lineHeight: 1.4,
              }}
            >
              {renderSegmentLabel(segment)}
            </Link>
          );
        })}
      </Breadcrumbs>

      {parent && (
        <Box
          component="nav"
          aria-label="breadcrumb"
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            minWidth: 0,
            mb: 1,
            [media.desktopUp]: {
              display: "none",
            },
          }}
        >
          {parent.href ? (
            <Link
              component={RouterLink}
              to={parent.href}
              underline="hover"
              color="primary"
              title={segmentTitle(parent)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                minWidth: 0,
                flex: "1 1 auto",
                fontWeight: 500,
                fontSize: "0.875rem",
                lineHeight: 1.4,
              }}
            >
              <Icon
                icon="mdi:chevron-left"
                style={{
                  fontSize: "1.25rem",
                  flexShrink: 0,
                }}
              />
              <Box component="span" sx={ellipsisSx}>
                {renderSegmentLabel(parent)}
              </Box>
            </Link>
          ) : (
            <Typography
              component="span"
              title={segmentTitle(parent)}
              sx={{
                ...ellipsisSx,
                flex: "1 1 auto",
                fontWeight: 500,
                fontSize: "0.875rem",
                lineHeight: 1.4,
                color: "var(--color-text-muted)",
              }}
            >
              {renderSegmentLabel(parent)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PageBreadcrumbs;
