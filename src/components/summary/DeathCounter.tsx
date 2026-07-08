import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { DeathEvent } from "../../utils/deathEvents";
import { formatHHmmss } from "../../utils/utils";
import { Actor } from "../../models/Actor";

interface DeathCounterProps {
  deaths: DeathEvent[];
  onSelectDeath?: (death: DeathEvent) => void;
  getDeathLinkSearch?: (death: DeathEvent) => string;
}

const getDeathLabel = (target: Actor): string => {
  if (target.name) {
    return target.name;
  }
  if (target.id != null) {
    return `NPC ${target.id}`;
  }
  return "Unknown";
};

const DeathCounter: React.FC<DeathCounterProps> = ({
  deaths,
  onSelectDeath,
  getDeathLinkSearch,
}) => {
  const [expanded, setExpanded] = useState(false);
  const deathCount = deaths.length;
  const expandable = deathCount > 0;

  return (
    <Box className="summary-death-counter">
      <Box
        component="button"
        type="button"
        className={`summary-death-counter__header${expandable ? " summary-death-counter__header--expandable" : ""}${expanded ? " summary-death-counter__header--expanded" : ""}`}
        aria-expanded={expandable ? expanded : undefined}
        onClick={() => {
          if (expandable) {
            setExpanded((value) => !value);
          }
        }}
      >
        <Box className="summary-death-counter__badge">
          <img
            src="/images/skull-icon.png"
            alt=""
            width={24}
            height={24}
            className="summary-death-counter__icon"
          />
          <Typography component="span" className="summary-death-counter__count">
            {deathCount}
          </Typography>
        </Box>
        <Box className="summary-death-counter__label-wrap">
          <Typography className="summary-death-counter__label">
            {deathCount === 1 ? "Death" : "Deaths"}
          </Typography>
          {expandable && (
            <Icon
              icon="mdi:chevron-down"
              className={`summary-death-counter__chevron${expanded ? " summary-death-counter__chevron--expanded" : ""}`}
            />
          )}
        </Box>
      </Box>

      {expanded && deathCount > 0 && (
        <Box className="summary-death-counter__timeline">
          {deaths.map((death, index) => {
            const linkSearch = getDeathLinkSearch?.(death);
            const entryClassName = `summary-death-counter__entry${linkSearch || onSelectDeath ? " summary-death-counter__entry--clickable" : ""}`;
            const entryContent = (
              <>
                <Typography className="summary-death-counter__entry-time">
                  {formatHHmmss(death.fightTimeMs, true)}
                </Typography>
                <Typography className="summary-death-counter__entry-name">
                  {getDeathLabel(death.target)}
                </Typography>
              </>
            );

            if (linkSearch) {
              return (
                <Link
                  key={`${death.fightTimeMs}-${death.target.name}-${index}`}
                  to={{ search: `?${linkSearch}` }}
                  className={entryClassName}
                >
                  {entryContent}
                </Link>
              );
            }

            return (
              <Box
                key={`${death.fightTimeMs}-${death.target.name}-${index}`}
                component={onSelectDeath ? "button" : "div"}
                type={onSelectDeath ? "button" : undefined}
                className={entryClassName}
                onClick={onSelectDeath ? () => onSelectDeath(death) : undefined}
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

export default DeathCounter;
