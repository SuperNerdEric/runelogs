import { Box, BoxProps } from '@mui/material';

const SectionBox = (props: BoxProps) => (
    <Box
        {...props}
        sx={{
            p: 2,
            maxWidth: 1000,
            width: '100%',
            '@media (max-width: 768px)': {
                maxWidth: '98vw',
                width: '100%',
                overflowX: 'auto',
            },
            bgcolor: '#141414',
            border: '3px solid grey',
            boxSizing: 'border-box',
            marginBottom: '10px',
            borderRadius: 1,
            overflowX: 'auto',
            ...props.sx,
        }}
    />
);

export default SectionBox;
