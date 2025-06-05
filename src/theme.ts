import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: { mode: 'dark' },

    components: {
        // ------ additions start here ------
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: '#141414',
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#141414',
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    backgroundColor: '#141414',
                    border: '3px solid grey',
                    borderRadius: '1px',
                    maxWidth: '1000px',
                    margin: '0 auto 15px',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:nth-of-type(odd)': { backgroundColor: '#101010' },
                    '&:nth-of-type(even)': { backgroundColor: '#000000' },
                    '&.MuiTableRow-hover:hover': { backgroundColor: 'rgb(0, 32, 64)' },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    padding: '8px 6px',
                    fontFamily: 'Avenir, Arial, sans-serif',
                    fontSize: '13px',
                },
                head: { fontWeight: 600 },
            },
        },
        MuiTableSortLabel: {
            styleOverrides: {
                root: {
                    color: '#ffffff',
                    '&:hover, &.MuiTableSortLabel-active': { color: '#ffffff' },
                },
                icon: { color: '#ffffff !important' },
            },
        },
        MuiLink: {
            defaultProps: { variant: 'body1' },
            styleOverrides: {
                root: {
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                    root: { backgroundColor: 'transparent', boxShadow: 'none' },
            },
        },
        MuiCircularProgress: { styleOverrides: { root: { color: '#ffffff' } } },
    },
});

export default theme;
