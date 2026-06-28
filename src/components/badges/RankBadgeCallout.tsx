import React from 'react';
import {cn} from '@/lib/utils';

interface RankBadgeCalloutProps {
    children: React.ReactNode;
    className?: string;
}

const RankBadgeCallout: React.FC<RankBadgeCalloutProps> = ({children, className}) => (
    <div className={cn('fight-group-rank-callouts', className)}>
        {children}
    </div>
);

export default RankBadgeCallout;
