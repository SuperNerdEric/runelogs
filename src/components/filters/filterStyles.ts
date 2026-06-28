import {colors} from '../../theme';

// ── Size tokens ──────────────────────────────────────────────────────────────

export const FILTER_CONTROL_HEIGHT = 50;
export const FILTER_CONTROL_HEIGHT_MOBILE = 39;

export const FILTER_CONTROL_FONT_SIZE = '1rem';
export const FILTER_CONTROL_FONT_SIZE_MOBILE = '0.84375rem';

export const FILTER_FIELD_ICON_SIZE = 31;
export const FILTER_FIELD_ICON_SIZE_MOBILE = 24;
export const FILTER_TAB_ICON_SIZE = FILTER_FIELD_ICON_SIZE;
export const FILTER_TAB_ICON_SIZE_MOBILE = FILTER_FIELD_ICON_SIZE_MOBILE;

export const FILTER_TOOLBAR_RADIUS = '6px';
export const FILTER_TOOLBAR_RADIUS_MOBILE = '5px';

export const FILTER_CONTROL_HORIZONTAL_PADDING = 1.625;
export const FILTER_CONTROL_HORIZONTAL_PADDING_MOBILE = 1.125;

export const FILTER_TOOLBAR_SECTION_GAP = {xs: 0.625, sm: 1.25} as const;
export const FILTER_FIELDS_GAP = {xs: 0.625, sm: 1.5} as const;

// ── Surface & border ─────────────────────────────────────────────────────────

export const FILTER_TOOLBAR_SURFACE = colors.background.surface;
export const FILTER_TOOLBAR_BORDER = `1px solid ${colors.ui.dividerSubtle}`;
export const FILTER_TOOLBAR_SHADOW = '0 2px 6px rgba(1, 4, 9, 0.2)';

const FILTER_CONTROL_SURFACE_BG = colors.background.rowOdd;
const FILTER_CONTROL_SURFACE_BG_HOVER = colors.background.rowHover;

export const FILTER_CONTROL_SURFACE_GRADIENT =
    `radial-gradient(ellipse 110% 100% at 50% 50%, ${FILTER_CONTROL_SURFACE_BG} 42%, ${FILTER_TOOLBAR_SURFACE} 100%)`;

export const FILTER_CONTROL_SURFACE_GRADIENT_HOVER =
    `radial-gradient(ellipse 110% 100% at 50% 50%, ${FILTER_CONTROL_SURFACE_BG_HOVER} 48%, ${FILTER_TOOLBAR_SURFACE} 100%)`;

// ── CSS class names ──────────────────────────────────────────────────────────

export const filterToolbarClass = 'filter-toolbar';
export const filterToolbarWithModeClass = 'filter-toolbar--with-mode';
export const filterFieldCompactClass = 'filter-field-compact';
export const filterToolbarDividerClass = 'filter-toolbar__divider';
export const filterSelectClass = 'filter-select';
export const filterSelectCompactClass = 'filter-select filter-select--compact';
export const filterMenuPaperClass = 'filter-menu-paper';
export const filterModeTabsContainerClass = 'filter-mode-tabs-container';
export const filterModeTabsClass = 'filter-mode-tabs';
export const filterModeTabClass = 'filter-mode-tab';
export const filterModeTabEndCapClass = 'filter-mode-tab--end-cap';
export const filterModeTabLabelClass = 'filter-mode-tab-label';
export const filterFieldWithIconClass = 'filter-field-with-icon';

export const filterToolbarFiltersRowClass = (fullWidthOnMobile = false): string => (
    fullWidthOnMobile
        ? 'filter-toolbar__filters-row filter-toolbar__filters-row--full-width-mobile'
        : 'filter-toolbar__filters-row'
);

export const filterModeTabStateClass = (selected: boolean): string => (
    selected ? 'filter-mode-tab--selected' : 'filter-mode-tab--unselected'
);
