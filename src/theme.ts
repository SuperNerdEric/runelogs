import { createTheme } from '@mui/material';

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
    palette: { mode: 'dark' },

    // The max value is the original default, scaling down to 60% of the original size on smaller screens
    typography: {
        h1: {
            fontSize: 'clamp(3.6rem, 10vw, 6rem)',
        },
        h2: {
            fontSize: 'clamp(2.25rem, 6.25vw, 3.75rem)',
        },
        h3: {
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
        },
        h4: {
            fontSize: 'clamp(1.275rem, 3.5vw, 2.125rem)',
        },
        h5: {
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
        },
        h6: {
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        },
    },

    components: {
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: '50px',
                    '@media (min-width:600px)': {
                        minHeight: '50px', // Adjusted for larger screens
                    },
                },
            },
        },
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
                    boxSizing: 'border-box',
                    '@media (max-width: 768px)': {
                        border: '1px solid grey',
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
                    '&:nth-of-type(odd)': { backgroundColor: '#101010' },
                    '&:nth-of-type(even)': { backgroundColor: '#000000' },
                    '&.MuiTableRow-hover:hover': { backgroundColor: 'rgb(0, 32, 64)' },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    border: '1px solid grey',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    padding: '2px 6px',
                    '@media (max-width: 768px)': {
                        padding: '2px 3px',
                        fontSize: '14px',
                    },
                    fontFamily: 'Avenir, Arial, sans-serif',
                    fontSize: '16px',
                },
                head: {
                    backgroundColor: '#494949',
                    fontWeight: 600,
                },
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
                    root: { backgroundColor: 'transparent', boxShadow: 'none' },
            },
        },
        MuiCircularProgress: { styleOverrides: { root: { color: '#ffffff' } } },
    },
});

export default theme;
