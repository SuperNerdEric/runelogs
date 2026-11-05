import { createContext, useContext } from "react";
import { Fight } from "../../models/Fight";
import { TimeRange } from "../../utils/timeRangeFilter";

/**
 * What the DPS charts need. Kept apart from the filter state, which changes the
 * moment a filter is picked: consuming that here would re-render the charts with
 * the old data before the new data is ready.
 */
export interface EncounterChartContextValue {
  /** The fight before any time range, for phase markers spanning the range edges. */
  fullFight: Fight;
  onSelectTimeRange: (range: TimeRange) => void;
}

export const EncounterChartContext =
  createContext<EncounterChartContextValue | null>(null);

export const useEncounterChart = (): EncounterChartContextValue | null =>
  useContext(EncounterChartContext);

/** Encounter-wide filter state for the filter area on every tab. */
export interface EncounterFilterContextValue {
  fullBounds: TimeRange;
  timeRange: TimeRange | null;
  onSelectTimeRange: (range: TimeRange) => void;
  onClearTimeRange: () => void;
  mechanicHitsplatCount: number;
  showMechanicHitsplats: boolean;
  onToggleMechanicHitsplats: () => void;
}

export const EncounterFilterContext =
  createContext<EncounterFilterContextValue | null>(null);

export const useEncounterFilters = (): EncounterFilterContextValue | null =>
  useContext(EncounterFilterContext);

/** Whether the shared chips (time range, invalid hitsplats toggle) would render. */
export const hasEncounterFilterChips = (
  filters: EncounterFilterContextValue | null,
): boolean =>
  Boolean(filters && (filters.timeRange || filters.mechanicHitsplatCount > 0));
