import React, { useState } from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { pageHeroTitleSx, media } from "../theme/layout";
import { BreadcrumbSegment } from "./PageBreadcrumbs";

interface EncounterFightTitleProps {
  fightName: string;
  isNpc?: boolean;
  mainEnemyName?: string;
  fightSelect?: BreadcrumbSegment["select"];
}

interface MobileFightSelectProps {
  fightName: string;
  fightSelect: NonNullable<BreadcrumbSegment["select"]>;
}

const MobileFightSelect: React.FC<MobileFightSelectProps> = ({
  fightName,
  fightSelect,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label="Select fight"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.25,
          maxWidth: "100%",
          border: "none",
          borderRadius: "4px",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          fontFamily: "inherit",
          p: 0,
          m: 0,
          "&:hover": {
            backgroundColor: "var(--color-bg-surface)",
          },
          "&:focus-visible": {
            outline: "2px solid var(--color-text-link)",
            outlineOffset: "2px",
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            ...pageHeroTitleSx,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fightName}
        </Typography>
        <Icon
          icon="mdi:chevron-down"
          style={{
            color: "var(--color-text-muted)",
            fontSize: "1.125rem",
            flexShrink: 0,
          }}
        />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              maxHeight: "50vh",
              maxWidth: "calc(100vw - 32px)",
              bgcolor: "var(--color-bg-surface)",
            },
          },
        }}
        MenuListProps={{
          dense: true,
          sx: { py: 0.5 },
        }}
      >
        {fightSelect.options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === fightSelect.value}
            onClick={() => {
              fightSelect.onChange(option.value);
              setAnchorEl(null);
            }}
            sx={{
              py: 0.5,
              px: 1.5,
              minHeight: 32,
              fontSize: "0.875rem",
              lineHeight: 1.25,
              whiteSpace: "normal",
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const EncounterFightTitle: React.FC<EncounterFightTitleProps> = ({
  fightName,
  isNpc,
  mainEnemyName,
  fightSelect,
}) => {
  const title =
    isNpc && mainEnemyName ? (
      <a
        href={`https://oldschool.runescape.wiki/w/${mainEnemyName}`}
        target="_blank"
        rel="noopener noreferrer"
        className="link"
        style={{ color: "inherit" }}
      >
        {fightName}
      </a>
    ) : (
      fightName
    );

  return (
    <Box
      className="run-summary-hero"
      sx={{ textAlign: "center", mb: 2, alignSelf: "stretch" }}
    >
      {fightSelect && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            [media.desktopUp]: {
              display: "none",
            },
          }}
        >
          <MobileFightSelect fightName={fightName} fightSelect={fightSelect} />
        </Box>
      )}

      <Typography
        component="h1"
        variant="h4"
        sx={{
          ...pageHeroTitleSx,
          ...(fightSelect
            ? {
                display: "none",
                [media.desktopUp]: {
                  display: "block",
                },
              }
            : {}),
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default EncounterFightTitle;
