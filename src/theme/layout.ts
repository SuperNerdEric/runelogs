import {colors, fonts, fontSizes, typography, layout} from './tokens';
export {cssVariables} from './cssVariables';
export {colors, fonts, fontSizes, typography, layout};

export const contentColumnClass = 'content-column';
export const accountTextClass = 'text-account';
export const pageHeroTitleClass = 'page-hero-title';
export const sectionBoxClass = 'section-box';

export function logNameTextClass(hasName: boolean): string {
    return hasName ? 'log-name-text--named' : 'log-name-text--unnamed';
}

export const media = {
    desktopUp: `@media (min-width: ${layout.desktopMinWidth}px)`,
    mobileDown: `@media (max-width: ${layout.desktopMinWidth - 1}px)`,
} as const;

/** @deprecated Prefer `contentColumnClass` */
export const contentColumnSx = {
    width: '100%',
    maxWidth: 'var(--layout-content-max-width)',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
} as const;

/** @deprecated Prefer `accountTextClass` */
export const accountTextSx = {
    color: colors.text.rune,
} as const;

/** @deprecated Prefer `pageHeroTitleClass` */
export const pageHeroTitleSx = {
    color: colors.text.primary,
    fontWeight: 700,
    fontSize: '1.5rem',
    wordBreak: 'break-word',
    [media.desktopUp]: {
        fontSize: '2rem',
    },
} as const;

/** @deprecated Prefer `logNameTextClass` */
export function logNameTextSx(hasName: boolean) {
    return hasName
        ? {color: colors.text.gold, fontStyle: 'normal' as const}
        : {color: colors.text.muted, fontStyle: 'italic' as const};
}
