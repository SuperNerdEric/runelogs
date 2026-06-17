import { createTheme } from '@mui/material/styles';
import { colors, fonts, fontSizes, typography, layout } from './tokens';

const theme = createTheme({
    breakpoints: {
        values: {
            xs: 0,
            sm: 768,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    palette: {
        mode: 'dark',
        background: {
            default: colors.background.page,
            paper: colors.background.surface,
        },
        text: {
            primary: colors.text.primary,
        },
        game: {
            gold: colors.text.gold,
            player: colors.text.player,
            other: colors.text.other,
            unknown: colors.text.unknown,
            dps: colors.text.dps,
            damage: colors.text.damage,
            heal: colors.text.heal,
            fightSuccess: colors.fight.success,
            fightFailure: colors.fight.failure,
        },
    },

    typography: {
        fontFamily: fonts.body,
        h1: { fontSize: typography.h1, fontWeight: 700, letterSpacing: '-0.025em' },
        h2: { fontSize: typography.h2, fontWeight: 700, letterSpacing: '-0.02em' },
        h3: { fontSize: typography.h3, fontWeight: 600, letterSpacing: '-0.015em' },
        h4: { fontSize: typography.h4, fontWeight: 600, letterSpacing: '-0.01em' },
        h5: { fontSize: typography.h5, fontWeight: 600 },
        h6: { fontSize: typography.h6, fontWeight: 600 },
        body1: { lineHeight: 1.5 },
        body2: { lineHeight: 1.45 },
        button: { textTransform: 'none', fontWeight: 500 },
    },

    components: {
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: '50px',
                    '@media (min-width:600px)': {
                        minHeight: '50px',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.background.surface,
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: colors.background.surface,
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.background.surface,
                    border: `3px solid ${colors.border.default}`,
                    borderRadius: '5px',
                    maxWidth: `${layout.contentMaxWidth}px`,
                    width: '100%',
                    margin: '0 auto 15px',
                    boxSizing: 'border-box',
                    '@media (max-width: 768px)': {
                        border: `1px solid ${colors.border.default}`,
                        maxWidth: '98vw',
                        width: '100%',
                        overflowX: 'auto',
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:nth-of-type(odd)': { backgroundColor: colors.background.rowOdd },
                    '&:nth-of-type(even)': { backgroundColor: colors.background.rowEven },
                    '&.MuiTableRow-hover:hover': { backgroundColor: colors.background.rowHover },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    border: `1px solid ${colors.border.default}`,
                    color: colors.text.primary,
                    borderBottom: `1px solid ${colors.ui.dividerSubtle}`,
                    padding: '2px 6px',
                    '@media (max-width: 768px)': {
                        padding: '2px 3px',
                        fontSize: fontSizes.tableMobile,
                    },
                    fontFamily: fonts.body,
                    fontSize: fontSizes.base,
                },
                head: {
                    backgroundColor: colors.background.tableHead,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                },
            },
        },
        MuiTableSortLabel: {
            styleOverrides: {
                root: {
                    color: colors.text.primary,
                    '&:hover, &.MuiTableSortLabel-active': { color: colors.text.primary },
                },
                icon: { color: `${colors.text.primary} !important` },
            },
        },
        MuiLink: {
            defaultProps: { variant: undefined },
            styleOverrides: {
                root: {
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundColor: colors.background.transparent, boxShadow: 'none' },
            },
        },
        MuiCircularProgress: {
            styleOverrides: {
                root: { color: colors.text.primary },
            },
        },
    },
});

export default theme;
