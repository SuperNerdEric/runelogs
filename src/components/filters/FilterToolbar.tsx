import React from "react";
import { Box, SxProps, Theme } from "@mui/material";
import {
  filterToolbarDividerSx,
  filterToolbarFiltersRowSx,
  filterToolbarSx,
  filterToolbarWithModeSx,
} from "./filterStyles";

interface FilterToolbarProps {
  /** Filters rendered before the mode selector (e.g. content, party size). */
  leadingFilters?: React.ReactNode;
  modeSelector?: React.ReactNode;
  /** Filters rendered after the mode selector (e.g. DPS fight picker). */
  trailingFilters?: React.ReactNode;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

function hasToolbarContent(node?: React.ReactNode): boolean {
  if (node == null || node === false) {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(hasToolbarContent);
  }
  return true;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  leadingFilters,
  modeSelector,
  trailingFilters,
  children,
  sx,
}) => {
  const hasLeading = hasToolbarContent(leadingFilters);
  const hasTrailing = hasToolbarContent(trailingFilters);
  const hasChildren = React.Children.count(children) > 0;
  const hasMode = Boolean(modeSelector);
  const useSplitLayout = hasLeading || hasTrailing;

  if (!hasLeading && !hasMode && !hasTrailing && !hasChildren) {
    return null;
  }

  if (useSplitLayout) {
    const sectionCount = [hasLeading, hasMode, hasTrailing].filter(
      Boolean,
    ).length;
    const useChipLayout = sectionCount >= 2;

    const embeddedModeSelector =
      modeSelector && React.isValidElement(modeSelector)
        ? React.cloneElement(
            modeSelector as React.ReactElement<{ embeddedEndCap?: boolean }>,
            { embeddedEndCap: !hasTrailing },
          )
        : modeSelector;

    return (
      <Box
        sx={[
          useChipLayout ? filterToolbarWithModeSx : filterToolbarSx,
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {hasLeading && (
          <Box sx={filterToolbarFiltersRowSx(useChipLayout)}>
            {leadingFilters}
          </Box>
        )}
        {hasLeading && hasMode && <Box sx={filterToolbarDividerSx} />}
        {embeddedModeSelector}
        {hasMode && hasTrailing && <Box sx={filterToolbarDividerSx} />}
        {hasTrailing && (
          <Box sx={filterToolbarFiltersRowSx(useChipLayout)}>
            {trailingFilters}
          </Box>
        )}
      </Box>
    );
  }

  const hasModeAndFilters = Boolean(modeSelector && hasChildren);

  const embeddedModeSelector =
    modeSelector && React.isValidElement(modeSelector)
      ? React.cloneElement(
          modeSelector as React.ReactElement<{ embeddedEndCap?: boolean }>,
          { embeddedEndCap: !hasChildren },
        )
      : modeSelector;

  return (
    <Box
      sx={[
        hasModeAndFilters ? filterToolbarWithModeSx : filterToolbarSx,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {embeddedModeSelector}
      {hasModeAndFilters && <Box sx={filterToolbarDividerSx} />}
      {hasChildren && (
        <Box sx={filterToolbarFiltersRowSx(hasModeAndFilters)}>{children}</Box>
      )}
    </Box>
  );
};

export default FilterToolbar;
