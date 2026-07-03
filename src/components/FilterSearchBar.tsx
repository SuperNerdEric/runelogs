import React, { useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { ActorFilter } from "../utils/actorFilter";
import { EquipmentFilter } from "../utils/equipmentFilter";
import { PrayerFilter } from "../utils/prayerFilter";
import {
  getDistinctHitsplatAmounts,
  HitsplatFilter,
} from "../utils/hitsplatFilter";
import {
  getDistinctHitsplatTypes,
  HitsplatTypeFilter,
} from "../utils/hitsplatTypeFilter";
import { colors, layout } from "../theme";
import { getActorFromLog } from "../utils/actorUtils";
import { itemIdMap } from "../lib/itemIdMap";
import { prayerIdMap } from "../lib/prayerIdMap";
import { getPrayerImageUrl } from "../lib/prayerImages";
import { getItemImageUrl } from "./replay/PlayerEquipment";

export type FilterOption =
  | { kind: "source"; label: string; filter: ActorFilter }
  | { kind: "target"; label: string; filter: ActorFilter }
  | { kind: "equipment"; label: string; filter: EquipmentFilter }
  | { kind: "prayer"; label: string; filter: PrayerFilter }
  | { kind: "hitsplatType"; label: string; filter: HitsplatTypeFilter }
  | { kind: "hitsplat"; label: string; filter: HitsplatFilter };

export type FilterSearchBarVariant = "default" | "damage";

type FilterCategory = FilterOption["kind"];

type DisplayOption =
  | { type: "category"; category: FilterCategory; label: string }
  | { type: "item"; option: FilterOption; label: string }
  | { type: "back"; label: string };

interface FilterSearchBarProps {
  fight: Fight;
  variant?: FilterSearchBarVariant;
  onSelectSourceFilter?: (filter: ActorFilter) => void;
  onSelectTargetFilter?: (filter: ActorFilter) => void;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onSelectHitsplatTypeFilter?: (filter: HitsplatTypeFilter) => void;
  onSelectHitsplatFilter?: (filter: HitsplatFilter) => void;
}

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  source: "Source",
  target: "Target",
  equipment: "Equipment",
  prayer: "Prayers",
  hitsplatType: "Hitsplat type",
  hitsplat: "Hitsplat amount",
};

const FILTER_ICON_COLUMN_WIDTH = 28;
const FILTER_ICON_MAX_SIZE = 22;

const getCategoryLabel = (option: FilterOption): string =>
  CATEGORY_LABELS[option.kind];

const FilterSearchBar: React.FC<FilterSearchBarProps> = ({
  fight,
  variant = "default",
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onSelectHitsplatTypeFilter,
  onSelectHitsplatFilter,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(
    null,
  );
  const keepOpenRef = useRef(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const itemOptions = useMemo(() => {
    const sourceNames = new Set<string>();
    const targetNames = new Set<string>();
    const equipmentItems = new Map<number, string>();
    const prayerItems = new Map<number, string>();

    for (const log of fight.data) {
      const source = getActorFromLog(log, "source");
      const target = getActorFromLog(log, "target");

      if (source?.name) {
        sourceNames.add(source.name);
      }
      if (target?.name) {
        targetNames.add(target.name);
      }

      if (
        log.type === LogTypes.PLAYER_EQUIPMENT &&
        Array.isArray(log.playerEquipment)
      ) {
        for (const itemIdStr of log.playerEquipment) {
          const id = parseInt(itemIdStr, 10);
          if (id > 0 && !equipmentItems.has(id)) {
            equipmentItems.set(id, itemIdMap[id] || `Item ${id}`);
          }
        }
      }

      if (log.type === LogTypes.PRAYER && Array.isArray(log.prayers)) {
        for (const prayerIdStr of log.prayers) {
          const id = parseInt(prayerIdStr, 10);
          if (id > 0 && !prayerItems.has(id)) {
            prayerItems.set(id, prayerIdMap[id] || `Prayer ${id}`);
          }
        }
      }

      if (
        log.type === LogTypes.OVERHEAD &&
        log.overhead &&
        log.overhead !== "-1"
      ) {
        const id = parseInt(log.overhead, 10);
        if (id > 0 && !prayerItems.has(id)) {
          prayerItems.set(id, prayerIdMap[id] || `Prayer ${id}`);
        }
      }
    }

    const filterOptions: FilterOption[] = [];

    Array.from(sourceNames)
      .sort((a, b) => a.localeCompare(b))
      .forEach((name) => {
        filterOptions.push({
          kind: "source",
          label: name,
          filter: { name },
        });
      });

    Array.from(targetNames)
      .sort((a, b) => a.localeCompare(b))
      .forEach((name) => {
        filterOptions.push({
          kind: "target",
          label: name,
          filter: { name },
        });
      });

    Array.from(equipmentItems.entries())
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
      .forEach(([id, name]) => {
        filterOptions.push({
          kind: "equipment",
          label: name,
          filter: { id, name },
        });
      });

    Array.from(prayerItems.entries())
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
      .forEach(([id, name]) => {
        filterOptions.push({
          kind: "prayer",
          label: name,
          filter: { id, name },
        });
      });

    if (variant === "damage") {
      getDistinctHitsplatTypes(fight.data).forEach((type) => {
        filterOptions.push({
          kind: "hitsplatType",
          label: type,
          filter: { type },
        });
      });
    }

    getDistinctHitsplatAmounts(fight.data).forEach((amount) => {
      filterOptions.push({
        kind: "hitsplat",
        label: String(amount),
        filter: { amount },
      });
    });

    return filterOptions;
  }, [fight.data, variant]);

  const goBackToCategories = () => {
    keepOpenRef.current = true;
    setActiveCategory(null);
    setInputValue("");
    setOpen(true);
  };

  const displayedOptions = useMemo((): DisplayOption[] => {
    const search = inputValue.trim().toLowerCase();

    if (search) {
      return itemOptions
        .filter((option) => option.label.toLowerCase().includes(search))
        .map((option) => ({
          type: "item" as const,
          option,
          label: option.label,
        }));
    }

    if (activeCategory) {
      const items = itemOptions
        .filter((option) => option.kind === activeCategory)
        .map((option) => ({
          type: "item" as const,
          option,
          label: option.label,
        }));

      return [{ type: "back" as const, label: "Back" }, ...items];
    }

    const categories: FilterCategory[] =
      variant === "damage"
        ? [
            "source",
            "target",
            "equipment",
            "prayer",
            "hitsplatType",
            "hitsplat",
          ]
        : ["source", "target", "equipment", "prayer", "hitsplat"];
    return categories
      .filter((category) =>
        itemOptions.some((option) => option.kind === category),
      )
      .map((category) => ({
        type: "category" as const,
        category,
        label: CATEGORY_LABELS[category],
      }));
  }, [activeCategory, inputValue, itemOptions, variant]);

  const applyFilter = (option: FilterOption) => {
    if (option.kind === "source") {
      onSelectSourceFilter?.(option.filter);
    } else if (option.kind === "target") {
      onSelectTargetFilter?.(option.filter);
    } else if (option.kind === "equipment") {
      onSelectEquipmentFilter?.(option.filter);
    } else if (option.kind === "prayer") {
      onSelectPrayerFilter?.(option.filter);
    } else if (option.kind === "hitsplatType") {
      onSelectHitsplatTypeFilter?.(option.filter);
    } else {
      onSelectHitsplatFilter?.(option.filter);
    }
  };

  const resetNavigation = () => {
    setActiveCategory(null);
    setInputValue("");
  };

  if (
    !onSelectSourceFilter &&
    !onSelectTargetFilter &&
    !onSelectEquipmentFilter &&
    !onSelectPrayerFilter &&
    !onSelectHitsplatTypeFilter &&
    !onSelectHitsplatFilter
  ) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: layout.contentMaxWidth, mb: 1 }}>
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={(_, reason) => {
          if (keepOpenRef.current) {
            keepOpenRef.current = false;
            return;
          }
          if (reason === "selectOption") {
            return;
          }
          setOpen(false);
          setActiveCategory(null);
        }}
        options={displayedOptions}
        inputValue={inputValue}
        onInputChange={(_, newValue, reason) => {
          if (reason === "reset") {
            setInputValue("");
            return;
          }
          setInputValue(newValue);
        }}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) =>
          option.type === value.type && option.label === value.label
        }
        filterOptions={(options) => options}
        noOptionsText={activeCategory ? "No options" : "No filter categories"}
        onChange={(_, option) => {
          if (!option) {
            return;
          }

          if (option.type === "back") {
            goBackToCategories();
            return;
          }

          if (option.type === "category") {
            keepOpenRef.current = true;
            setActiveCategory(option.category);
            setInputValue("");
            setOpen(true);
            return;
          }

          applyFilter(option.option);
          resetNavigation();
          setOpen(false);
        }}
        renderOption={(props, option) => {
          if (option.type === "back") {
            const { key, onClick: _onClick, ...optionProps } = props;
            return (
              <Box
                component="li"
                key={key}
                {...optionProps}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goBackToCategories();
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "lightblue",
                  borderBottom: `1px solid ${colors.border.default}`,
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: "lightblue" }}>
                  <ArrowBackIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={option.label} />
              </Box>
            );
          }

          if (option.type === "category") {
            const { key, onClick: _onClick, ...optionProps } = props;
            return (
              <Box
                component="li"
                key={key}
                {...optionProps}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  keepOpenRef.current = true;
                  setActiveCategory(option.category);
                  setInputValue("");
                  setOpen(true);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <ListItemText primary={option.label} />
                <ListItemIcon sx={{ minWidth: "auto", color: "grey" }}>
                  <ChevronRightIcon fontSize="small" />
                </ListItemIcon>
              </Box>
            );
          }

          const showCategory = Boolean(inputValue.trim());
          const isEquipment = option.option.kind === "equipment";
          const isPrayer = option.option.kind === "prayer";
          const filterId =
            option.option.kind === "equipment"
              ? option.option.filter.id
              : option.option.kind === "prayer"
                ? option.option.filter.id
                : undefined;
          const imageUrl = isEquipment
            ? filterId !== undefined
              ? getItemImageUrl(filterId)
              : undefined
            : isPrayer
              ? filterId !== undefined
                ? getPrayerImageUrl(filterId)
                : undefined
              : undefined;

          const showIconColumn = isEquipment || isPrayer;

          return (
            <Box
              component="li"
              {...props}
              key={`${option.option.kind}-${option.label}`}
              sx={{ display: "flex", alignItems: "center" }}
            >
              {showIconColumn && (
                <Box
                  sx={{
                    width: FILTER_ICON_COLUMN_WIDTH,
                    minWidth: FILTER_ICON_COLUMN_WIDTH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mr: 0.75,
                  }}
                >
                  {imageUrl && (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt=""
                      sx={{
                        maxHeight: FILTER_ICON_MAX_SIZE,
                        maxWidth: FILTER_ICON_MAX_SIZE,
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        backgroundColor: isEquipment
                          ? colors.background.tableHeadAlt
                          : "transparent",
                      }}
                    />
                  )}
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {showCategory ? (
                  <ListItemText
                    primary={option.label}
                    secondary={getCategoryLabel(option.option)}
                    secondaryTypographyProps={{
                      sx: { color: "lightblue", fontSize: "0.75rem" },
                    }}
                    sx={{ my: 0 }}
                  />
                ) : (
                  <ListItemText primary={option.label} sx={{ my: 0 }} />
                )}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              activeCategory
                ? `Search ${CATEGORY_LABELS[activeCategory].toLowerCase()}...`
                : isMobile
                  ? "Filter"
                  : "Filter by source, targets, equipment, and more..."
            }
            size="small"
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !inputValue && activeCategory) {
                event.preventDefault();
                goBackToCategories();
              }
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    {activeCategory ? (
                      <ArrowBackIcon
                        sx={{
                          color: "lightblue",
                          cursor: "pointer",
                          fontSize: 20,
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          goBackToCategories();
                        }}
                      />
                    ) : (
                      <FilterListIcon sx={{ color: "grey" }} />
                    )}
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
            sx={{
              "& .MuiInputBase-root": {
                bgcolor: colors.background.surface,
                color: "white",
                borderRadius: "5px",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.border.default,
                borderWidth: "3px",
              },
              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: colors.border.default,
                },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: colors.border.default,
                  borderWidth: "3px",
                },
              "& .MuiSvgIcon-root": {
                color: "grey",
              },
            }}
          />
        )}
        componentsProps={{
          popper: {
            placement: "bottom-start",
            modifiers: [
              {
                name: "flip",
                enabled: true,
                options: {
                  fallbackPlacements: [
                    "bottom-start",
                    "bottom",
                    "top-start",
                    "top",
                  ],
                },
              },
            ],
          },
          paper: {
            sx: {
              bgcolor: colors.background.surface,
              color: "white",
              border: `3px solid ${colors.border.default}`,
              borderRadius: "5px",
              boxShadow: "none",
            },
          },
        }}
        blurOnSelect={false}
        clearOnBlur={false}
        handleHomeEndKeys
        value={null}
      />
    </Box>
  );
};

export default FilterSearchBar;
