import React from 'react';
import {Box, SxProps, Theme} from '@mui/material';
import {getHiscoreSpriteUrl} from '../lib/hiscoreSprites';

interface HiscoreSpriteIconProps {
    spriteKey?: string | null;
    /** Match adjacent text height; width follows aspect ratio. */
    height?: number | string;
    alt?: string;
    className?: string;
    sx?: SxProps<Theme>;
}

const HiscoreSpriteIcon: React.FC<HiscoreSpriteIconProps> = ({
    spriteKey,
    height = '1em',
    alt = '',
    className,
    sx,
}) => {
    const src = getHiscoreSpriteUrl(spriteKey);
    if (!src) {
        return null;
    }

    return (
        <Box
            component="img"
            src={src}
            alt={alt}
            className={className}
            draggable={false}
            sx={{
                height,
                width: 'auto',
                flexShrink: 0,
                display: 'block',
                imageRendering: 'pixelated',
                ...sx,
            }}
        />
    );
};

export default HiscoreSpriteIcon;
