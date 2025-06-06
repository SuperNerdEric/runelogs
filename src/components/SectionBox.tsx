import { Box, BoxProps } from '@mui/material';

const SectionBox = (props: BoxProps) => (
    <Box
        {...props}
        sx={{
            p: 4,
            maxWidth: 1000,
            width: '100%',
            bgcolor: '#141414',
            border: '3px solid grey',
            boxSizing: 'border-box',
            borderRadius: 1,
            ...props.sx,
        }}
    />
);

export default SectionBox;
