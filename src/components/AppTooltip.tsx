import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {cn} from '@/lib/utils';

export type AppTooltipProps = {
    title: React.ReactNode;
    children: React.ReactElement;
    disableTouch?: boolean;
    className?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
};

const AppTooltip: React.FC<AppTooltipProps> = ({
    title,
    children,
    disableTouch = false,
    className,
    side = 'top',
    align = 'center',
}) => {
    if (!title) {
        return children;
    }

    return (
        <Tooltip disableHoverableContent={disableTouch}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side={side} align={align} className={cn(className)}>
                {title}
            </TooltipContent>
        </Tooltip>
    );
};

export default AppTooltip;
