import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import {Loader2} from 'lucide-react';

import {cn} from '@/lib/utils';

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({className, value, ...props}, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
            className,
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className="h-full w-full flex-1 bg-primary transition-all"
            style={{transform: `translateX(-${100 - (value || 0)}%)`}}
        />
    </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

const Spinner = ({
    className,
    ...props
}: React.ComponentProps<typeof Loader2>) => (
    <Loader2
        role="status"
        aria-label="Loading"
        className={cn('size-4 animate-spin text-primary', className)}
        {...props}
    />
);
Spinner.displayName = 'Spinner';

export {Progress, Spinner};
