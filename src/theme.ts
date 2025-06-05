import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    paddingTop: 8,
                    paddingBottom: 8,
                },
            },
        },

        MuiTableSortLabel: {
            styleOverrides: {
                root: {
                    color: '#ffffff',
                    '&:hover': {
                        color: '#ffffff',
                    },
                    '&.MuiTableSortLabel-active': {
                        color: '#ffffff',
                    },
                },
                icon: {
                    color: '#ffffff !important',
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                },
            },
        },

        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&.MuiTableRow-hover:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)', // subtle highlight on hover
                    },
                },
            },
        },

        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    color: '#ffffff',
                },
            },
        },
    },
});

export default theme;
