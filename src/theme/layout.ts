import {layout} from './tokens';

export const contentColumnSx = {
    width: '100%',
    maxWidth: 'var(--layout-content-max-width)',
    mx: 'auto',
    boxSizing: 'border-box',
} as const;

export const media = {
    desktopUp: `@media (min-width: ${layout.desktopMinWidth}px)`,
    mobileDown: `@media (max-width: ${layout.desktopMinWidth - 1}px)`,
} as const;

export {layout};
