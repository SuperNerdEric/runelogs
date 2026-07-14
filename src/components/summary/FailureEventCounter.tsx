import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { FailureEvent, FailureEventSeries } from "../../utils/failureEvents";
import { formatHHmmss } from "../../utils/utils";

interface FailureEventCounterProps {
  series: FailureEventSeries;
  getEventLinkSearch?: (event: FailureEvent) => string;
}

/**
 * Expandable summary counter for interchangeable “failure” event series
 * (Verzik melees today; other log lines / icons later via {@link FailureEventSeries}).
 */
const FailureEventCounter: React.FC<FailureEventCounterProps> = ({
  series,
  getEventLinkSearch,
}) => {
  const [expanded, setExpanded] = useState(false);
  const count = series.events.length;
  if (count === 0) {
    return null;
  }

  const expandable = count > 0;
  const label = count === 1 ? series.singularLabel : series.pluralLabel;

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
            src={series.iconUrl}
            alt=""
            width={24}
            height={24}
            className="summary-death-counter__icon"
          />
          <Typography component="span" className="summary-death-counter__count">
            {count}
          </Typography>
        </Box>
        <Box className="summary-death-counter__label-wrap">
          <Typography className="summary-death-counter__label">
            {label}
          </Typography>
          <Icon
            icon="mdi:chevron-down"
            className={`summary-death-counter__chevron${expanded ? " summary-death-counter__chevron--expanded" : ""}`}
          />
        </Box>
      </Box>

      {expanded && (
        <Box className="summary-death-counter__timeline">
          {series.events.map((event, index) => {
            const linkSearch = getEventLinkSearch?.(event);
            const entryClassName = `summary-death-counter__entry${linkSearch ? " summary-death-counter__entry--clickable" : ""}`;
            const entryContent = (
              <>
                <Typography className="summary-death-counter__entry-time">
                  {formatHHmmss(event.fightTimeMs, true)}
                </Typography>
                <Box className="summary-death-counter__entry-name-wrap">
                  <img
                    src={series.iconUrl}
                    alt=""
                    width={16}
                    height={16}
                    className="summary-death-counter__entry-icon"
                  />
                  <Typography className="summary-death-counter__entry-name">
                    {event.subjectLabel}
                  </Typography>
                </Box>
              </>
            );

            if (linkSearch) {
              return (
                <Link
                  key={`${series.id}-${event.fightTimeMs}-${event.subjectLabel}-${index}`}
                  to={{ search: `?${linkSearch}` }}
                  className={entryClassName}
                >
                  {entryContent}
                </Link>
              );
            }

            return (
              <Box
                key={`${series.id}-${event.fightTimeMs}-${event.subjectLabel}-${index}`}
                className={entryClassName}
              >
                {entryContent}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default FailureEventCounter;
