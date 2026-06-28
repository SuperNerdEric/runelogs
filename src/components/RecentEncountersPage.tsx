import React from 'react';
import {History} from 'lucide-react';
import OverallRecentEncounters from './OverallRecentEncounters';
import {
    pageHeaderClass,
    pageHeaderIconClass,
    pageHeaderTitleClass,
} from './pageHeaderStyles';
import {colors, contentColumnClass} from '../theme';
import {cn} from '@/lib/utils';

const RecentEncountersPage: React.FC = () => {
    return (
        <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
            <div className={pageHeaderClass}>
                <div className={pageHeaderIconClass}>
                    <History size={32} style={{color: colors.text.rune}} aria-hidden/>
                </div>
                <h1 className={pageHeaderTitleClass}>Recent Encounters</h1>
            </div>

            <OverallRecentEncounters entriesPerPage={50}/>
        </div>
    );
};

export default RecentEncountersPage;
