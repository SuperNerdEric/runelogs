import * as React from 'react';

import {cn} from '@/lib/utils';

const Spinner = ({
    className,
    size = 'default',
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'default' | 'lg';
}) => {
    const sizeClasses = {
        sm: 'size-4 border-2',
        default: 'size-6 border-2',
        lg: 'size-8 border-[3px]',
    };

    return (
        <div
            role="status"
            aria-label="Loading"
            className={cn(
                'animate-spin rounded-full border-[var(--color-text-primary)] border-t-transparent',
                sizeClasses[size],
                className,
            )}
            {...props}
        />
    );
};
Spinner.displayName = 'Spinner';

export {Spinner};
