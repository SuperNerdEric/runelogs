import React, { useMemo, useState } from "react";
import { Box, Chip, Menu, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Fight } from "../../models/Fight";
import { DamageLog, LogTypes } from "../../models/LogLine";
import { colors, layout } from "../../theme";
import { itemIdMap } from "../../lib/itemIdMap";
import { prayerIdMap } from "../../lib/prayerIdMap";
import { ActorFilter } from "../../utils/actorFilter";
import { getActorSpecificIds, isUnknownPlayer } from "../../utils/actorUtils";
import { EquipmentFilter } from "../../utils/equipmentFilter";
import {
  formatHitsplatFilterLabel,
  HitsplatFilter,
} from "../../utils/hitsplatFilter";
import {
  formatHitsplatTypeFilterLabel,
  HitsplatTypeFilter,
} from "../../utils/hitsplatTypeFilter";
import { PrayerFilter } from "../../utils/prayerFilter";
import {
  formatTargetFilterLabel,
  getDistinctTargetIndexes,
  getDistinctTargetNpcIds,
} from "../../utils/targetDrillDown";
import { formatHHmmss } from "../../utils/utils";
import AppTooltip from "../AppTooltip";
import FilterSearchBar, { FilterSearchBarVariant } from "../FilterSearchBar";
import EncounterFilterChips from "./EncounterFilterChips";
import { filterChipDeleteIconHitArea } from "./filterStyles";
import {
  hasEncounterFilterChips,
  useEncounterFilters,
} from "./EncounterFilterContext";

interface EncounterFilterBarProps {
  fight: Fight;
  variant?: FilterSearchBarVariant;
  sourceFilter?: ActorFilter | null;
  targetFilter?: ActorFilter | null;
  onSelectSourceFilter?: (filter: ActorFilter) => void;
  onSelectTargetFilter?: (filter: ActorFilter) => void;
  onClearSourceFilter?: () => void;
  onClearTargetFilter?: () => void;
  equipmentFilter?: EquipmentFilter | null;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onClearEquipmentFilter?: () => void;
  prayerFilter?: PrayerFilter | null;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onClearPrayerFilter?: () => void;
  hitsplatFilter?: HitsplatFilter | null;
  onSelectHitsplatFilter?: (filter: HitsplatFilter) => void;
  onClearHitsplatFilter?: () => void;
  hitsplatTypeFilter?: HitsplatTypeFilter | null;
  onSelectHitsplatTypeFilter?: (filter: HitsplatTypeFilter) => void;
  onClearHitsplatTypeFilter?: () => void;
  eventTypeFilter?: string | null;
  onSelectEventTypeFilter?: (eventType: string) => void;
  onClearEventTypeFilter?: () => void;
  eventTimeFilter?: number | null;
  onClearEventTimeFilter?: () => void;
  animationIdFilter?: number | null;
  onClearAnimationIdFilter?: () => void;
}

const getFilterTextColor = (
  filter: ActorFilter,
  loggedInPlayer: string,
): string => {
  if (filter.name === loggedInPlayer) {
    return colors.text.player;
  }
  if (isUnknownPlayer(filter.name)) {
    return colors.text.unknown;
  }
  return colors.text.other;
};

const getFilterMenuPaperProps = (anchorEl: HTMLElement | null) => ({
  sx: {
    maxHeight: "200px",
    minWidth: Math.max(anchorEl?.offsetWidth ?? 0, 160),
    bgcolor: colors.background.surface,
    "& .MuiMenuItem-root": {
      whiteSpace: "nowrap",
    },
  },
});

/** The filter dropdown and active filter chips shown at the top of each tab. */
const EncounterFilterBar: React.FC<EncounterFilterBarProps> = ({
  fight,
  variant = "default",
  sourceFilter = null,
  targetFilter = null,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  equipmentFilter = null,
  onSelectEquipmentFilter,
  onClearEquipmentFilter,
  prayerFilter = null,
  onSelectPrayerFilter,
  onClearPrayerFilter,
  hitsplatFilter = null,
  onSelectHitsplatFilter,
  onClearHitsplatFilter,
  hitsplatTypeFilter = null,
  onSelectHitsplatTypeFilter,
  onClearHitsplatTypeFilter,
  eventTypeFilter = null,
  onSelectEventTypeFilter,
  onClearEventTypeFilter,
  eventTimeFilter = null,
  onClearEventTimeFilter,
  animationIdFilter = null,
  onClearAnimationIdFilter,
}) => {
  const loggedInPlayer = fight.loggedInPlayer;
  const logs = fight.data;
  const encounterFilters = useEncounterFilters();
  const [sourceMenuAnchor, setSourceMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [targetMenuAnchor, setTargetMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  const sourceSpecificIds = useMemo(
    () =>
      sourceFilter
        ? getActorSpecificIds(logs, "source", sourceFilter.name)
        : [],
    [logs, sourceFilter],
  );

  const targetMenuNpcIds = useMemo(() => {
    if (!targetFilter) {
      return [];
    }

    const damageLogs = logs.filter(
      (log) => log.type === LogTypes.DAMAGE,
    ) as DamageLog[];
    return getDistinctTargetNpcIds(damageLogs, targetFilter);
  }, [logs, targetFilter]);

  const targetMenuIndexes = useMemo(() => {
    if (!targetFilter || targetFilter.id === undefined) {
      return [];
    }

    const damageLogs = logs.filter(
      (log) => log.type === LogTypes.DAMAGE,
    ) as DamageLog[];
    return getDistinctTargetIndexes(damageLogs, targetFilter);
  }, [logs, targetFilter]);

  return (
    <>
      <FilterSearchBar
        fight={fight}
        variant={variant}
        onSelectEventTypeFilter={onSelectEventTypeFilter}
        onSelectSourceFilter={onSelectSourceFilter}
        onSelectTargetFilter={onSelectTargetFilter}
        onSelectEquipmentFilter={onSelectEquipmentFilter}
        onSelectPrayerFilter={onSelectPrayerFilter}
        onSelectHitsplatTypeFilter={onSelectHitsplatTypeFilter}
        onSelectHitsplatFilter={onSelectHitsplatFilter}
      />
      {(hasEncounterFilterChips(encounterFilters) ||
        sourceFilter ||
        targetFilter ||
        equipmentFilter ||
        prayerFilter ||
        hitsplatTypeFilter ||
        hitsplatFilter ||
        eventTypeFilter ||
        eventTimeFilter != null ||
        animationIdFilter != null) && (
        <Box
          sx={{
            width: "100%",
            maxWidth: `${layout.contentMaxWidth}px`,
            mb: 1,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <EncounterFilterChips />
          {sourceFilter && (
            <>
              <Chip
                label={`Source: ${sourceFilter.name}${sourceFilter.index !== undefined ? ` - ${sourceFilter.index}` : ""}`}
                onDelete={onClearSourceFilter}
                onClick={(e) => setSourceMenuAnchor(e.currentTarget)}
                icon={
                  <ArrowDropDownIcon
                    sx={{
                      color: getFilterTextColor(sourceFilter, loggedInPlayer),
                    }}
                  />
                }
                size="small"
                sx={{
                  bgcolor: colors.background.surface,
                  color: getFilterTextColor(sourceFilter, loggedInPlayer),
                  border: "1px solid grey",
                  borderRadius: "5px",
                  "& .MuiChip-label": {
                    fontSize: "0.9rem",
                    paddingLeft: "10px",
                    paddingRight: "10px",
                  },
                  "& .MuiChip-deleteIcon": {
                    color: getFilterTextColor(sourceFilter, loggedInPlayer),
                    fontSize: "1.05rem",
                    ...filterChipDeleteIconHitArea,
                  },
                  "& .MuiChip-deleteIcon:hover": {
                    color: getFilterTextColor(sourceFilter, loggedInPlayer),
                  },
                }}
              />
              <Menu
                anchorEl={sourceMenuAnchor}
                open={Boolean(sourceMenuAnchor)}
                onClose={() => setSourceMenuAnchor(null)}
                PaperProps={getFilterMenuPaperProps(sourceMenuAnchor)}
              >
                <MenuItem
                  onClick={() => {
                    if (onSelectSourceFilter) {
                      onSelectSourceFilter({ name: sourceFilter.name });
                    }
                    setSourceMenuAnchor(null);
                  }}
                >
                  All IDs
                </MenuItem>
                {sourceSpecificIds.map((specificId) => (
                  <MenuItem
                    key={`source-id-${specificId}`}
                    onClick={() => {
                      if (onSelectSourceFilter) {
                        onSelectSourceFilter({
                          name: sourceFilter.name,
                          index: specificId,
                        });
                      }
                      setSourceMenuAnchor(null);
                    }}
                  >
                    {specificId}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          {targetFilter && (
            <>
              <Chip
                label={formatTargetFilterLabel(targetFilter)}
                onDelete={onClearTargetFilter}
                onClick={(e) => setTargetMenuAnchor(e.currentTarget)}
                icon={
                  <ArrowDropDownIcon
                    sx={{
                      color: getFilterTextColor(targetFilter, loggedInPlayer),
                    }}
                  />
                }
                size="small"
                sx={{
                  bgcolor: colors.background.surface,
                  color: getFilterTextColor(targetFilter, loggedInPlayer),
                  border: "1px solid grey",
                  borderRadius: "5px",
                  "& .MuiChip-label": {
                    fontSize: "0.9rem",
                    paddingLeft: "10px",
                    paddingRight: "10px",
                  },
                  "& .MuiChip-deleteIcon": {
                    color: getFilterTextColor(targetFilter, loggedInPlayer),
                    fontSize: "1.05rem",
                    ...filterChipDeleteIconHitArea,
                  },
                  "& .MuiChip-deleteIcon:hover": {
                    color: getFilterTextColor(targetFilter, loggedInPlayer),
                  },
                }}
              />
              <Menu
                anchorEl={targetMenuAnchor}
                open={Boolean(targetMenuAnchor)}
                onClose={() => setTargetMenuAnchor(null)}
                PaperProps={getFilterMenuPaperProps(targetMenuAnchor)}
              >
                <MenuItem
                  onClick={() => {
                    if (onSelectTargetFilter) {
                      if (targetFilter.index !== undefined) {
                        onSelectTargetFilter({
                          name: targetFilter.name,
                          ...(targetFilter.id !== undefined
                            ? { id: targetFilter.id }
                            : {}),
                        });
                      } else if (targetFilter.id !== undefined) {
                        onSelectTargetFilter({ name: targetFilter.name });
                      }
                    }
                    setTargetMenuAnchor(null);
                  }}
                  disabled={
                    targetFilter.id === undefined &&
                    targetFilter.index === undefined
                  }
                >
                  {targetFilter.index !== undefined ? "All indexes" : "All IDs"}
                </MenuItem>
                {targetFilter.id === undefined &&
                  targetFilter.index === undefined &&
                  targetMenuNpcIds.map((npcId) => (
                    <MenuItem
                      key={`target-npc-id-${npcId}`}
                      onClick={() => {
                        if (onSelectTargetFilter) {
                          onSelectTargetFilter({
                            name: targetFilter.name,
                            id: npcId,
                          });
                        }
                        setTargetMenuAnchor(null);
                      }}
                    >
                      ID {npcId}
                    </MenuItem>
                  ))}
                {targetFilter.id !== undefined &&
                  targetFilter.index === undefined &&
                  targetMenuIndexes.map((index) => (
                    <MenuItem
                      key={`target-index-${index}`}
                      onClick={() => {
                        if (onSelectTargetFilter) {
                          onSelectTargetFilter({
                            name: targetFilter.name,
                            id: targetFilter.id,
                            index,
                          });
                        }
                        setTargetMenuAnchor(null);
                      }}
                    >
                      Index {index}
                    </MenuItem>
                  ))}
                {targetFilter.index !== undefined &&
                  targetMenuIndexes
                    .filter((index) => index !== targetFilter.index)
                    .map((index) => (
                      <MenuItem
                        key={`target-index-${index}`}
                        onClick={() => {
                          if (onSelectTargetFilter) {
                            onSelectTargetFilter({
                              name: targetFilter.name,
                              ...(targetFilter.id !== undefined
                                ? { id: targetFilter.id }
                                : {}),
                              index,
                            });
                          }
                          setTargetMenuAnchor(null);
                        }}
                      >
                        Index {index}
                      </MenuItem>
                    ))}
              </Menu>
            </>
          )}
          {equipmentFilter && (
            <Chip
              label={`Equipment: ${equipmentFilter.name || itemIdMap[equipmentFilter.id] || equipmentFilter.id}`}
              onDelete={onClearEquipmentFilter}
              icon={
                <AppTooltip
                  title="Equipment filter is based on when an event was recorded. However, some actions, such as projectile damage, may have been initiated while different equipment was equipped."
                  arrow
                >
                  <ErrorOutlineIcon
                    sx={{
                      color: "#f44336 !important",
                      fontSize: "1.05rem",
                    }}
                  />
                </AppTooltip>
              }
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-icon": {
                  marginLeft: "8px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {prayerFilter && (
            <Chip
              label={`Prayer: ${prayerFilter.name || prayerIdMap[prayerFilter.id] || prayerFilter.id}`}
              onDelete={onClearPrayerFilter}
              icon={
                <AppTooltip
                  title="Prayer filter is based on when an event was recorded. Active prayers and overhead prayers are tracked separately in the log."
                  arrow
                >
                  <ErrorOutlineIcon
                    sx={{
                      color: "#f44336 !important",
                      fontSize: "1.05rem",
                    }}
                  />
                </AppTooltip>
              }
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-icon": {
                  marginLeft: "8px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {hitsplatTypeFilter && (
            <Chip
              label={formatHitsplatTypeFilterLabel(hitsplatTypeFilter)}
              onDelete={onClearHitsplatTypeFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {hitsplatFilter && (
            <Chip
              label={formatHitsplatFilterLabel(hitsplatFilter)}
              onDelete={onClearHitsplatFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {eventTypeFilter && (
            <Chip
              label={`Type: ${eventTypeFilter}`}
              onDelete={onClearEventTypeFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {eventTimeFilter != null && (
            <Chip
              label={`Time: ${formatHHmmss(eventTimeFilter, true)}`}
              onDelete={onClearEventTimeFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {animationIdFilter != null && (
            <Chip
              label={`Animation: ${animationIdFilter}`}
              onDelete={onClearAnimationIdFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  ...filterChipDeleteIconHitArea,
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
        </Box>
      )}{" "}
    </>
  );
};

export default EncounterFilterBar;
