import {layout} from './tokens';

export const contentColumnSx = {
    width: '100%',
    maxWidth: 'var(--layout-content-max-width)',
    mx: 'auto',
    boxSizing: 'border-box',
} as const;

/** Fills `.app-main-content` and centers loading/error states vertically and horizontally. */
export const centeredPageStateSx = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
} as const;

export const logNameTextSx = (hasName: boolean) => ({
    color: hasName ? 'var(--color-text-gold)' : 'var(--color-text-muted)',
    fontStyle: hasName ? 'normal' as const : 'italic' as const,
});

export const accountTextSx = {
    color: 'var(--color-text-account)',
} as const;

export const pageHeroTitleSx = {
    color: 'var(--color-text-primary)',
    fontWeight: 700,
    fontSize: {xs: '1.5rem', sm: '2rem'},
    wordBreak: 'break-word',
} as const;

export const media = {
    desktopUp: `@media (min-width: ${layout.desktopMinWidth}px)`,
    mobileDown: `@media (max-width: ${layout.desktopMinWidth - 1}px)`,
} as const;

export {layout};
