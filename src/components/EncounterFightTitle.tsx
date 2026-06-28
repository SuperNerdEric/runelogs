import React from 'react';
import {Icon} from '@iconify/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {pageHeroTitleClass} from '../theme';
import {BreadcrumbSegment} from './PageBreadcrumbs';
import {cn} from '@/lib/utils';

interface EncounterFightTitleProps {
    fightName: string;
    isNpc?: boolean;
    mainEnemyName?: string;
    fightSelect?: BreadcrumbSegment['select'];
}

interface MobileFightSelectProps {
    fightName: string;
    fightSelect: NonNullable<BreadcrumbSegment['select']>;
}

const MobileFightSelect: React.FC<MobileFightSelectProps> = ({fightName, fightSelect}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Select fight"
                    className="encounter-fight-select-trigger"
                >
                    <span
                        className={cn(pageHeroTitleClass, 'truncate')}
                    >
                        {fightName}
                    </span>
                    <Icon
                        icon="mdi:chevron-down"
                        style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '1.125rem',
                            flexShrink: 0,
                        }}
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[50vh] max-w-[calc(100vw-32px)]">
                {fightSelect.options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        className={cn(
                            'py-1 px-3 min-h-8 text-sm leading-tight whitespace-normal',
                            option.value === fightSelect.value && 'bg-accent',
                        )}
                        onSelect={() => fightSelect.onChange(option.value)}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const EncounterFightTitle: React.FC<EncounterFightTitleProps> = ({
    fightName,
    isNpc,
    mainEnemyName,
    fightSelect,
}) => {
    const title = isNpc && mainEnemyName ? (
        <a
            href={`https://oldschool.runescape.wiki/w/${mainEnemyName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-inherit"
        >
            {fightName}
        </a>
    ) : (
        fightName
    );

    return (
        <div className="run-summary-hero">
            {fightSelect && (
                <div className="encounter-fight-select-mobile">
                    <MobileFightSelect fightName={fightName} fightSelect={fightSelect}/>
                </div>
            )}

            <h1
                className={cn(
                    pageHeroTitleClass,
                    fightSelect && 'encounter-fight-title-desktop',
                )}
            >
                {title}
            </h1>
        </div>
    );
};

export default EncounterFightTitle;
