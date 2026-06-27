import React from 'react';
import {Tooltip, TooltipProps} from '@mui/material';

export type AppTooltipProps = TooltipProps & {
    /** Hover-only tooltip for buttons, links, and other primary tap targets. */
    disableTouch?: boolean;
};

const AppTooltip: React.FC<AppTooltipProps> = ({
    enterDelay = 200,
    enterTouchDelay = 0,
    disableTouch = false,
    disableTouchListener,
    ...props
}) => (
    <Tooltip
        enterDelay={enterDelay}
        enterTouchDelay={enterTouchDelay}
        disableTouchListener={disableTouchListener ?? disableTouch}
        {...props}
    />
);

export default AppTooltip;
