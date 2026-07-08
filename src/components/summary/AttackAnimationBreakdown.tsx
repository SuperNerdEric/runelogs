import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { Fight } from "../../models/Fight";
import { getPlayerNameTextClass } from "../../utils/actorUtils";
import {
  AttackAnimationEvent,
  getAttackAnimationBreakdown,
  hasAttackAnimationBreakdown,
} from "../../utils/attackAnimationBreakdown";
import { getItemImageUrl } from "../replay/PlayerEquipment";
import AppTooltip from "../AppTooltip";
import AttackTooltip, {
  ATTACK_TOOLTIP_SLOT_PROPS,
  attackEventToTooltipDetails,
} from "../AttackTooltip";
import SummarySection from "./SummarySection";
import { COLUMN_TOOLTIPS } from "../../utils/columnTooltips";
import { formatHHmmss } from "../../utils/utils";

interface AttackAnimationBreakdownProps {
  fight: Fight;
  onSelectAttackEvent?: (event: AttackAnimationEvent) => void;
  getAttackEventLinkSearch?: (event: AttackAnimationEvent) => string;
}

const SPECIAL_ATTACK_ORB_URL = "/images/special-attack-orb-140.png";

const formatPercent = (value: number): string =>
  value % 1 === 0 ? `${value.toFixed(0)}%` : `${value.toFixed(1)}%`;

const getWeaponKey = (playerName: string, itemId: number): string =>
  `${playerName}-${itemId}`;

const SpecialAttackOrb: React.FC = () => (
  <img
    src={SPECIAL_ATTACK_ORB_URL}
    alt="Special attack"
    className="summary-attack-breakdown__special-attack-icon"
    width={140}
    height={140}
    loading="lazy"
  />
);

interface WeaponUsageStatsProps {
  percent: number;
  count: number;
  maxCount: number;
}

const WeaponUsageStats: React.FC<WeaponUsageStatsProps> = ({
  percent,
  count,
  maxCount,
}) => (
  <>
    <Typography
      component="span"
      className="summary-attack-breakdown__usage-percent"
    >
      {formatPercent(percent)}
    </Typography>
    <Box className="summary-attack-breakdown__usage-bar" aria-hidden="true">
      <Box
        className="summary-attack-breakdown__usage-bar-fill"
        style={{
          width: maxCount > 0 ? `${(count / maxCount) * 100}%` : "0%",
        }}
      />
    </Box>
    <Typography
      component="span"
      className="summary-attack-breakdown__usage-count"
    >
      {count}
    </Typography>
  </>
);

const AttackAnimationBreakdown: React.FC<AttackAnimationBreakdownProps> = ({
  fight,
  onSelectAttackEvent,
  getAttackEventLinkSearch,
}) => {
  const [expandedWeapons, setExpandedWeapons] = useState<
    Record<string, boolean>
  >({});

  if (!hasAttackAnimationBreakdown(fight)) {
    return null;
  }

  const breakdown = getAttackAnimationBreakdown(fight);

  return (
    <SummarySection
      title="Attacks"
      titleTooltip={COLUMN_TOOLTIPS.attackAnimations}
      className="summary-attack-breakdown-section"
    >
      <Box className="summary-attack-breakdown">
        {breakdown.map((player) => {
          const maxCount = Math.max(
            ...player.weapons.map((weapon) => weapon.count),
          );

          return (
            <Box
              key={player.playerName}
              className="summary-attack-breakdown__player"
            >
              <Box className="summary-attack-breakdown__player-header">
                <Typography
                  className={`summary-attack-breakdown__player-name ${getPlayerNameTextClass(player.playerName, fight.loggedInPlayer)}`}
                >
                  {player.playerName}
                </Typography>
                <Typography className="summary-attack-breakdown__player-total">
                  {player.totalAttacks} attacks
                </Typography>
              </Box>

              <Box className="summary-attack-breakdown__weapons">
                {player.weapons.map((weapon) => {
                  const weaponKey = getWeaponKey(
                    player.playerName,
                    weapon.itemId,
                  );
                  const expandable = weapon.events.length > 0;
                  const expanded = Boolean(expandedWeapons[weaponKey]);

                  return (
                    <Box
                      key={weaponKey}
                      className="summary-attack-breakdown__weapon-block"
                    >
                      <Box
                        component={expandable ? "button" : "div"}
                        type={expandable ? "button" : undefined}
                        className={`summary-attack-breakdown__weapon${expandable ? " summary-attack-breakdown__weapon--expandable" : ""}${expanded ? " summary-attack-breakdown__weapon--expanded" : ""}`}
                        aria-expanded={expandable ? expanded : undefined}
                        onClick={
                          expandable
                            ? () =>
                                setExpandedWeapons((current) => ({
                                  ...current,
                                  [weaponKey]: !current[weaponKey],
                                }))
                            : undefined
                        }
                      >
                        <Box className="summary-attack-breakdown__chevron-slot">
                          {expandable && (
                            <Icon
                              icon="mdi:chevron-down"
                              className={`summary-attack-breakdown__chevron${expanded ? " summary-attack-breakdown__chevron--expanded" : ""}`}
                            />
                          )}
                        </Box>
                        <Box className="summary-attack-breakdown__weapon-icon">
                          <img
                            src={getItemImageUrl(weapon.itemId)}
                            alt=""
                            className="osrs-item-icon osrs-item-icon--28"
                            loading="lazy"
                          />
                        </Box>
                        <Typography className="summary-attack-breakdown__weapon-name">
                          {weapon.name}
                        </Typography>
                        <WeaponUsageStats
                          percent={weapon.percent}
                          count={weapon.count}
                          maxCount={maxCount}
                        />
                      </Box>

                      {expanded && expandable && (
                        <Box className="summary-attack-breakdown__timeline">
                          {weapon.events.map((event, eventIndex) => {
                            const eventLinkSearch =
                              getAttackEventLinkSearch?.(event);
                            const isClickable =
                              Boolean(eventLinkSearch) ||
                              Boolean(onSelectAttackEvent);
                            const entryContent = (
                              <Box className="summary-attack-breakdown__entry-content">
                                <Typography className="summary-attack-breakdown__entry-time">
                                  {formatHHmmss(event.fightTimeMs, true)}
                                </Typography>
                                {event.isSpecialAttack && <SpecialAttackOrb />}
                              </Box>
                            );

                            const linkedContent = eventLinkSearch ? (
                              <Link
                                to={{ search: `?${eventLinkSearch}` }}
                                className="summary-attack-breakdown__entry-event-link"
                              >
                                {entryContent}
                              </Link>
                            ) : onSelectAttackEvent ? (
                              <Box
                                component="button"
                                type="button"
                                className="summary-attack-breakdown__entry-event-link"
                                onClick={() => onSelectAttackEvent(event)}
                              >
                                {entryContent}
                              </Box>
                            ) : (
                              entryContent
                            );

                            return (
                              <Box
                                key={`${event.fightTimeMs}-${event.animationId}-${eventIndex}`}
                                className="summary-attack-breakdown__entry"
                              >
                                <AppTooltip
                                  placement="top"
                                  arrow
                                  disableTouch
                                  title={
                                    <AttackTooltip
                                      attack={attackEventToTooltipDetails(
                                        event,
                                      )}
                                    />
                                  }
                                  slotProps={ATTACK_TOOLTIP_SLOT_PROPS}
                                >
                                  {isClickable ? linkedContent : entryContent}
                                </AppTooltip>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </SummarySection>
  );
};

export default AttackAnimationBreakdown;
