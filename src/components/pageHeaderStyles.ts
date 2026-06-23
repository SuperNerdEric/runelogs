import {accountTextSx, colors} from '../theme';

export const PAGE_HEADER_ICON_SIZE = 56;

export const pageHeaderContainerSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    mb: 3,
    pt: 1,
} as const;

export const pageHeaderIconBoxSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: PAGE_HEADER_ICON_SIZE,
    height: PAGE_HEADER_ICON_SIZE,
    flexShrink: 0,
    borderRadius: 2,
    bgcolor: colors.background.surfaceAlt,
    border: `1px solid ${colors.border.default}`,
} as const;

export const pageHeaderTitleWrapperSx = {
    display: 'inline-block',
    m: 0,
    fontWeight: 600,
    textTransform: 'capitalize',
    lineHeight: 1.15,
    ...accountTextSx,
} as const;

export const pageHeaderTitleTypographySx = {
    fontWeight: 600,
    fontSize: 'inherit',
    textTransform: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
} as const;

export const pageHeaderSubtitleSx = {
    display: 'block',
    color: colors.text.muted,
    fontSize: '0.875rem',
    lineHeight: 1.15,
    mt: 0,
} as const;

export const pageHeaderSubtitleLinkSx = {
    ...pageHeaderSubtitleSx,
    color: colors.text.link,
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'underline',
        color: colors.text.link,
    },
} as const;
