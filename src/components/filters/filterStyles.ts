import { SxProps, Theme } from "@mui/material";
import { SystemStyleObject } from "@mui/system";
import { colors } from "../../theme";

// ── Size tokens ──────────────────────────────────────────────────────────────

export const FILTER_CONTROL_HEIGHT = 50;
export const FILTER_CONTROL_HEIGHT_MOBILE = 39;

export const FILTER_CONTROL_FONT_SIZE = "1rem";
export const FILTER_CONTROL_FONT_SIZE_MOBILE = "0.84375rem";

export const FILTER_FIELD_ICON_SIZE = 31;
export const FILTER_FIELD_ICON_SIZE_MOBILE = 24;
/** Space before prefix icon and between icon and select (matched for symmetry). */
export const FILTER_DROPDOWN_PREFIX_INSET = { xs: 0.9375, sm: 1.25 } as const;
/** Selected-value sprite beside a filter dropdown (closed state). */
export const FILTER_DROPDOWN_SELECTED_SPRITE_SIZE = 40;
export const FILTER_DROPDOWN_SELECTED_SPRITE_SIZE_MOBILE = 32;
/** Sprite height in open dropdown menu rows. */
export const FILTER_DROPDOWN_MENU_SPRITE_HEIGHT = "1.4em";
/** Space between icon and label in open dropdown menu rows. */
export const FILTER_DROPDOWN_MENU_LABEL_GAP = 1;
export const FILTER_TAB_ICON_SIZE = FILTER_FIELD_ICON_SIZE;
export const FILTER_TAB_ICON_SIZE_MOBILE = FILTER_FIELD_ICON_SIZE_MOBILE;

export const FILTER_TOOLBAR_RADIUS = "6px";
export const FILTER_TOOLBAR_RADIUS_MOBILE = "5px";

export const FILTER_CONTROL_HORIZONTAL_PADDING = 1.625;
export const FILTER_CONTROL_HORIZONTAL_PADDING_MOBILE = 1.125;

export const FILTER_TOOLBAR_SECTION_GAP = { xs: 0.625, sm: 1.25 } as const;
export const FILTER_FIELDS_GAP = { xs: 0.625, sm: 1.5 } as const;

// ── Responsive shorthands (xs = mobile, sm+ = desktop chip) ─────────────────

const radius = {
  xs: FILTER_TOOLBAR_RADIUS_MOBILE,
  sm: FILTER_TOOLBAR_RADIUS,
} as const;
const controlHeight = {
  xs: FILTER_CONTROL_HEIGHT_MOBILE,
  sm: FILTER_CONTROL_HEIGHT,
} as const;
const controlFontSize = {
  xs: FILTER_CONTROL_FONT_SIZE_MOBILE,
  sm: FILTER_CONTROL_FONT_SIZE,
} as const;
const controlPaddingX = {
  xs: FILTER_CONTROL_HORIZONTAL_PADDING_MOBILE,
  sm: FILTER_CONTROL_HORIZONTAL_PADDING,
} as const;

// ── Surface & border ─────────────────────────────────────────────────────────

export const FILTER_TOOLBAR_SURFACE = colors.background.surface;
export const FILTER_TOOLBAR_BORDER = `1px solid ${colors.ui.dividerSubtle}`;
export const FILTER_TOOLBAR_SHADOW = "0 2px 6px rgba(1, 4, 9, 0.2)";

const FILTER_CONTROL_SURFACE_BG = colors.background.rowOdd;
const FILTER_CONTROL_SURFACE_BG_HOVER = colors.background.rowHover;

export const FILTER_CONTROL_SURFACE_GRADIENT = `radial-gradient(ellipse 110% 100% at 50% 50%, ${FILTER_CONTROL_SURFACE_BG} 42%, ${FILTER_TOOLBAR_SURFACE} 100%)`;

export const FILTER_CONTROL_SURFACE_GRADIENT_HOVER = `radial-gradient(ellipse 110% 100% at 50% 50%, ${FILTER_CONTROL_SURFACE_BG_HOVER} 48%, ${FILTER_TOOLBAR_SURFACE} 100%)`;

const FILTER_CONTROL_SURFACE_GRADIENT_FOCUS = `radial-gradient(ellipse 110% 100% at 50% 50%, rgba(56, 139, 253, 0.12) 48%, ${FILTER_TOOLBAR_SURFACE} 100%)`;

const chipShellSx: SxProps<Theme> = {
  bgcolor: FILTER_TOOLBAR_SURFACE,
  border: FILTER_TOOLBAR_BORDER,
  boxShadow: FILTER_TOOLBAR_SHADOW,
  overflow: "hidden",
  "& .MuiOutlinedInput-root": {
    border: "none",
  },
};

const toolbarShellSx: SxProps<Theme> = {
  display: "inline-flex",
  flexWrap: "wrap",
  gap: FILTER_TOOLBAR_SECTION_GAP,
  mb: { xs: 0.9375, sm: 1.25 },
  maxWidth: "100%",
};

// ── Toolbar layouts ──────────────────────────────────────────────────────────

/** Chip toolbar — mode-only or filters-only. */
export const filterToolbarSx: SxProps<Theme> = {
  ...toolbarShellSx,
  ...chipShellSx,
  flexDirection: "row",
  alignItems: "stretch",
  minHeight: controlHeight,
  width: "fit-content",
  borderRadius: radius,
};

/** Mode + filters — stacked on xs, chip on sm+. */
export const filterToolbarWithModeSx: SxProps<Theme> = {
  ...toolbarShellSx,
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "flex-start", sm: "stretch" },
  minHeight: { xs: 0, sm: FILTER_CONTROL_HEIGHT },
  width: { xs: "100%", sm: "fit-content" },
  borderRadius: { xs: 0, sm: FILTER_TOOLBAR_RADIUS },
  bgcolor: { xs: "transparent", sm: FILTER_TOOLBAR_SURFACE },
  border: { xs: "none", sm: FILTER_TOOLBAR_BORDER },
  boxShadow: { xs: "none", sm: FILTER_TOOLBAR_SHADOW },
  overflow: { xs: "visible", sm: "hidden" },
};

const filterToolbarFlushEndSx: SxProps<Theme> = {
  "& > *:last-child .MuiOutlinedInput-root": {
    borderTopRightRadius: FILTER_TOOLBAR_RADIUS,
    borderBottomRightRadius: FILTER_TOOLBAR_RADIUS,
  },
};

const filterFieldsRowSx: SxProps<Theme> = {
  display: "inline-flex",
  flexWrap: "wrap",
  alignItems: "center",
  alignSelf: "stretch",
  gap: FILTER_FIELDS_GAP,
  minWidth: 0,
  ...filterToolbarFlushEndSx,
};

/** Filter row — pass `fullWidthOnMobile` when paired with a mode selector. */
export const filterToolbarFiltersRowSx = (
  fullWidthOnMobile = false,
): SxProps<Theme> => ({
  ...filterFieldsRowSx,
  ...(fullWidthOnMobile ? { width: { xs: "100%", sm: "auto" } } : undefined),
});

export const filterFieldCompactSx: SxProps<Theme> = {
  flex: "0 0 auto",
};

export const filterToolbarDividerSx: SxProps<Theme> = {
  display: { xs: "none", sm: "block" },
  alignSelf: "center",
  flexShrink: 0,
  width: "1px",
  height: {
    xs: FILTER_CONTROL_HEIGHT_MOBILE - 14,
    sm: FILTER_CONTROL_HEIGHT - 16,
  },
  borderRadius: "999px",
  bgcolor: colors.ui.dividerSubtle,
};

// ── Dropdowns ────────────────────────────────────────────────────────────────

export const filterSelectSx: SxProps<Theme> = {
  minHeight: controlHeight,
  height: controlHeight,
  background: FILTER_CONTROL_SURFACE_GRADIENT,
  borderRadius: radius,
  border: { xs: FILTER_TOOLBAR_BORDER, sm: "none" },
  boxSizing: "border-box",
  color: colors.text.primary,
  fontWeight: 600,
  fontSize: controlFontSize,
  transition: "background 0.2s ease",
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&:hover": {
    background: FILTER_CONTROL_SURFACE_GRADIENT_HOVER,
  },
  "&.Mui-focused": {
    background: FILTER_CONTROL_SURFACE_GRADIENT_FOCUS,
  },
  "& .MuiSelect-select": {
    py: 0,
    px: { xs: 0.9375, sm: 1.25 },
    pr: { xs: "1.875rem !important", sm: "2.25rem !important" },
    minHeight: {
      xs: `${FILTER_CONTROL_HEIGHT_MOBILE}px !important`,
      sm: `${FILTER_CONTROL_HEIGHT}px !important`,
    },
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": {
    color: colors.text.muted,
    right: { xs: 5, sm: 6 },
    fontSize: { xs: "1.0625rem", sm: "1.25rem" },
  },
};

export const filterSelectCompactSx: SxProps<Theme> = {
  ...filterSelectSx,
  minWidth: { xs: 60, sm: 72 },
};

export const filterMenuPaperSx: SxProps<Theme> = {
  mt: 0.75,
  bgcolor: colors.background.surfaceAlt,
  border: `1px solid ${colors.border.default}`,
  borderRadius: FILTER_TOOLBAR_RADIUS,
  boxShadow: "0 12px 32px rgba(1, 4, 9, 0.45)",
  "& .MuiMenuItem-root": {
    fontWeight: 600,
    fontSize: "0.875rem",
    py: 0.75,
    px: 1.25,
    "&.Mui-selected": {
      bgcolor: colors.background.surfaceSelected,
      color: colors.text.lightblue,
    },
    "&.Mui-selected:hover": {
      bgcolor: colors.background.hover,
    },
  },
};

// ── Mode tabs (embedded in toolbar) ──────────────────────────────────────────

export const filterModeTabsContainerSx: SxProps<Theme> = {
  display: "flex",
  flexShrink: 0,
  alignSelf: { xs: "flex-start", sm: "stretch" },
  alignItems: "stretch",
  p: 0,
  gap: 0,
  height: "auto",
  borderRadius: { xs: FILTER_TOOLBAR_RADIUS_MOBILE, sm: 0 },
  border: { xs: FILTER_TOOLBAR_BORDER, sm: "none" },
  bgcolor: { xs: FILTER_TOOLBAR_SURFACE, sm: "transparent" },
  overflow: { xs: "hidden", sm: "visible" },
};

export const filterModeTabsSx: SxProps<Theme> = {
  flex: "0 0 auto",
  minHeight: { xs: FILTER_CONTROL_HEIGHT_MOBILE, sm: "100%" },
  height: { xs: "auto", sm: "100%" },
  minWidth: 0,
  overflow: "visible",
  alignSelf: { xs: "flex-start", sm: "stretch" },
  "& .MuiTabs-scroller": {
    overflow: "visible !important",
  },
  "& .MuiTabs-flexContainer": {
    height: { xs: "auto", sm: "100%" },
    gap: "2px",
    width: "auto",
  },
  "& .MuiTabs-indicator": {
    display: "none",
  },
};

export const filterModeTabSx: SxProps<Theme> = {
  color: "white",
  fontSize: controlFontSize,
  fontWeight: 600,
  textTransform: "none",
  transition: "background 0.2s ease, color 0.15s ease",
  flex: "0 0 auto",
  minWidth: "0 !important",
  minHeight: {
    xs: `${FILTER_CONTROL_HEIGHT_MOBILE}px !important`,
    sm: "100% !important",
  },
  height: { xs: `${FILTER_CONTROL_HEIGHT_MOBILE}px`, sm: "100%" },
  alignSelf: { xs: "flex-start", sm: "stretch" },
  py: 0,
  px: controlPaddingX,
  borderRadius: radius,
  overflow: "hidden",
  "&:first-of-type": {
    borderTopLeftRadius: radius,
    borderBottomLeftRadius: radius,
  },
};

export const filterModeTabEndCapSx: SxProps<Theme> = {
  "&:last-of-type": {
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
  },
};

export const filterModeTabLabelSx: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  gap: { xs: 0.3125, sm: 0.5 },
};

export const filterModeTabStateSx = (
  selected: boolean,
): SystemStyleObject<Theme> => ({
  color: selected ? colors.text.primary : colors.text.muted,
  background: selected ? FILTER_CONTROL_SURFACE_GRADIENT : "transparent",
  "&.Mui-selected": {
    color: colors.text.primary,
    background: FILTER_CONTROL_SURFACE_GRADIENT,
  },
  "&:hover": {
    background: selected
      ? FILTER_CONTROL_SURFACE_GRADIENT_HOVER
      : "rgba(255, 255, 255, 0.04)",
    color: colors.text.primary,
  },
  "&.Mui-selected:hover": {
    color: colors.text.primary,
    background: FILTER_CONTROL_SURFACE_GRADIENT_HOVER,
  },
});
