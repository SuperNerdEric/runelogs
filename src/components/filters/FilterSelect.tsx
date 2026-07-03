import React from "react";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  Theme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ContentLabel from "../ContentLabel";
import HiscoreSpriteIcon from "../HiscoreSpriteIcon";
import {
  FILTER_DROPDOWN_MENU_LABEL_GAP,
  FILTER_DROPDOWN_MENU_SPRITE_HEIGHT,
  FILTER_DROPDOWN_PREFIX_INSET,
  FILTER_DROPDOWN_SELECTED_SPRITE_SIZE,
  FILTER_DROPDOWN_SELECTED_SPRITE_SIZE_MOBILE,
  FILTER_FIELD_ICON_SIZE,
  FILTER_FIELD_ICON_SIZE_MOBILE,
  filterMenuPaperSx,
  filterSelectCompactSx,
  filterSelectSx,
} from "./filterStyles";
import FilterFieldIcon, { FilterFieldKind } from "./FilterFieldIcon";

export interface FilterSelectOption<T extends string | number> {
  value: T;
  label: string;
  spriteKey?: string | null;
}

const FIELD_LABELS: Record<FilterFieldKind, string> = {
  content: "Content",
  fight: "Fight",
  team: "Team size",
};

interface FilterSelectProps<T extends string | number> {
  field?: FilterFieldKind;
  value: T;
  options: FilterSelectOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
  /** Overrides the auto-selected sprite icon beside the closed select. */
  prefix?: React.ReactNode;
  sx?: SxProps<Theme>;
}

function FilterSelect<T extends string | number>({
  field,
  value,
  options,
  onChange,
  compact = false,
  prefix,
  sx,
}: FilterSelectProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fieldIconSize = isMobile
    ? FILTER_FIELD_ICON_SIZE_MOBILE
    : FILTER_FIELD_ICON_SIZE;
  const selectedSpriteSize = isMobile
    ? FILTER_DROPDOWN_SELECTED_SPRITE_SIZE_MOBILE
    : FILTER_DROPDOWN_SELECTED_SPRITE_SIZE;
  const accessibleLabel = field ? FIELD_LABELS[field] : undefined;
  const selectedOption = options.find((option) => option.value === value);

  const prefixNode =
    prefix ??
    (selectedOption?.spriteKey ? (
      <HiscoreSpriteIcon
        spriteKey={selectedOption.spriteKey}
        height={selectedSpriteSize}
        alt=""
      />
    ) : field === "team" ? (
      <Box
        component="span"
        title={FIELD_LABELS.team}
        sx={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
      >
        <FilterFieldIcon field="team" size={fieldIconSize} />
      </Box>
    ) : undefined);

  const select = (
    <Select
      value={value}
      onChange={(event: SelectChangeEvent<T>) =>
        onChange(event.target.value as T)
      }
      size="small"
      inputProps={
        accessibleLabel ? { "aria-label": accessibleLabel } : undefined
      }
      renderValue={() => selectedOption?.label ?? String(value)}
      MenuProps={{ PaperProps: { sx: filterMenuPaperSx } }}
      sx={
        [
          compact ? filterSelectCompactSx : filterSelectSx,
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ] as SxProps<Theme>
      }
    >
      {options.map((option) => (
        <MenuItem key={String(option.value)} value={option.value}>
          {option.spriteKey ? (
            <ContentLabel
              label={option.label}
              spriteKey={option.spriteKey}
              iconHeight={FILTER_DROPDOWN_MENU_SPRITE_HEIGHT}
              gap={FILTER_DROPDOWN_MENU_LABEL_GAP}
            />
          ) : (
            option.label
          )}
        </MenuItem>
      ))}
    </Select>
  );

  if (!prefixNode) {
    return select;
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        pl: FILTER_DROPDOWN_PREFIX_INSET,
        gap: FILTER_DROPDOWN_PREFIX_INSET,
      }}
    >
      {prefixNode}
      {select}
    </Box>
  );
}

export default FilterSelect;
