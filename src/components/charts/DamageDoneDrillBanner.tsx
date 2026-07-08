import React from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { Box, IconButton } from "@mui/material";

import { Link, useSearchParams } from "react-router-dom";

import { ActorFilter } from "../../utils/actorFilter";

import {
  buildDamageDoneDrillSearch,
  getDamageDoneDrillBackAction,
  getDamageDoneDrillSegments,
} from "../../utils/damageDoneDrillDown";

interface DamageDoneDrillBannerProps {
  sourceFilter: ActorFilter | null;

  targetFilter: ActorFilter | null;

  onSelectSourceFilter: (filter: ActorFilter) => void;

  onSelectTargetFilter: (filter: ActorFilter) => void;

  onClearSourceFilter: () => void;

  onClearTargetFilter: () => void;
}

const DamageDoneDrillBanner: React.FC<DamageDoneDrillBannerProps> = ({
  sourceFilter,

  targetFilter,

  onSelectSourceFilter,

  onSelectTargetFilter,

  onClearSourceFilter,

  onClearTargetFilter,
}) => {
  const [searchParams] = useSearchParams();

  if (!sourceFilter) {
    return null;
  }

  const backAction = getDamageDoneDrillBackAction(sourceFilter, targetFilter);
  const segments = getDamageDoneDrillSegments(sourceFilter, targetFilter);

  const handleBack = () => {
    if (!backAction) {
      return;
    }

    if (backAction.param === "source") {
      if (backAction.filter) {
        onSelectSourceFilter(backAction.filter);
      } else {
        onClearSourceFilter();
      }

      return;
    }

    if (backAction.filter) {
      onSelectTargetFilter(backAction.filter);
    } else {
      onClearTargetFilter();
    }
  };

  return (
    <Box
      className="damage-done-drill-banner"

      role="navigation"

      aria-label="Damage done drill-down path"
    >
      <IconButton
        className="damage-done-drill-banner__back"

        size="small"

        aria-label="Go back"

        onClick={handleBack}
      >
        <ArrowBackIcon fontSize="inherit" />
      </IconButton>

      <Box component="span" className="damage-done-drill-banner__chip">
        {segments.map((segment, index) => {
          const isCurrent = index === segments.length - 1;
          const segmentKey = `${segment.label}-${index}`;

          return (
            <React.Fragment key={segmentKey}>
              {index > 0 && (
                <span
                  className="damage-done-drill-banner__separator"
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
              {isCurrent ? (
                <span
                  className="damage-done-drill-banner__segment damage-done-drill-banner__segment--current"
                  aria-current="location"
                >
                  {segment.label}
                </span>
              ) : (
                <Link
                  className="damage-done-drill-banner__segment damage-done-drill-banner__segment--link"
                  to={{
                    search: `?${buildDamageDoneDrillSearch(
                      searchParams,
                      segment.sourceFilter,
                      segment.targetFilter,
                    )}`,
                  }}
                >
                  {segment.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

export default DamageDoneDrillBanner;
