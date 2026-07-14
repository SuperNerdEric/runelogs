import React, { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { BloatDownEvent } from "../../utils/bloatDownEvents";
import { formatHHmmss } from "../../utils/utils";
import {
  BLOAT_STOMP_IMAGE_URL,
  resolveNpcAttackImageUrl,
} from "../../utils/npcAttackAnimationNames";

interface BloatDownCounterProps {
  downs: BloatDownEvent[];
  getDownLinkSearch?: (down: BloatDownEvent) => string;
}

const BLOAT_DOWN_ICON_URL = resolveNpcAttackImageUrl(8082, 8359);
const BLOAT_STOMP_ICON_URL = BLOAT_STOMP_IMAGE_URL;

type TimelineEntry = {
  key: string;
  fightTimeMs: number;
  label: string;
  iconUrl: string;
  /** Omitted for synthesized Stomp rows (no matching Events log line). */
  linkEvent?: BloatDownEvent;
};

function buildTimelineEntries(downs: BloatDownEvent[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const down of downs) {
    entries.push({
      key: `down-${down.downNumber}-${down.fightTimeMs}`,
      fightTimeMs: down.fightTimeMs,
      label: `Down ${down.downNumber}`,
      iconUrl: BLOAT_DOWN_ICON_URL,
      linkEvent: down,
    });

    if (down.stompFightTimeMs == null) {
      continue;
    }

    entries.push({
      key: `stomp-${down.downNumber}-${down.stompFightTimeMs}`,
      fightTimeMs: down.stompFightTimeMs,
      label: "Stomp",
      iconUrl: BLOAT_STOMP_ICON_URL,
      // Synthesized — not present in the Events log.
    });
  }

  return entries;
}

const BloatDownCounter: React.FC<BloatDownCounterProps> = ({
  downs,
  getDownLinkSearch,
}) => {
  const [expanded, setExpanded] = useState(false);
  const downCount = downs.length;
  const expandable = downCount > 0;
  const timelineEntries = useMemo(() => buildTimelineEntries(downs), [downs]);

  if (downCount === 0) {
    return null;
  }

  return (
    <Box className="summary-death-counter">
      <Box
        component="button"
        type="button"
        className={`summary-death-counter__header${expandable ? " summary-death-counter__header--expandable" : ""}${expanded ? " summary-death-counter__header--expanded" : ""}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <Box className="summary-death-counter__badge">
          <img
            src={BLOAT_DOWN_ICON_URL}
            alt=""
            width={24}
            height={24}
            className="summary-death-counter__icon"
          />
          <Typography component="span" className="summary-death-counter__count">
            {downCount}
          </Typography>
        </Box>
        <Box className="summary-death-counter__label-wrap">
          <Typography className="summary-death-counter__label">
            {downCount === 1 ? "Down" : "Downs"}
          </Typography>
          <Icon
            icon="mdi:chevron-down"
            className={`summary-death-counter__chevron${expanded ? " summary-death-counter__chevron--expanded" : ""}`}
          />
        </Box>
      </Box>

      {expanded && (
        <Box className="summary-death-counter__timeline">
          {timelineEntries.map((entry) => {
            const linkSearch =
              entry.linkEvent != null
                ? getDownLinkSearch?.(entry.linkEvent)
                : undefined;
            const entryClassName = `summary-death-counter__entry${linkSearch ? " summary-death-counter__entry--clickable" : ""}`;
            const entryContent = (
              <>
                <Typography className="summary-death-counter__entry-time">
                  {formatHHmmss(entry.fightTimeMs, true)}
                </Typography>
                <Box className="summary-death-counter__entry-name-wrap">
                  <img
                    src={entry.iconUrl}
                    alt=""
                    width={16}
                    height={16}
                    className="summary-death-counter__entry-icon"
                  />
                  <Typography className="summary-death-counter__entry-name">
                    {entry.label}
                  </Typography>
                </Box>
              </>
            );

            if (linkSearch) {
              return (
                <Link
                  key={entry.key}
                  to={{ search: `?${linkSearch}` }}
                  className={entryClassName}
                >
                  {entryContent}
                </Link>
              );
            }

            return (
              <Box key={entry.key} className={entryClassName}>
                {entryContent}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default BloatDownCounter;
