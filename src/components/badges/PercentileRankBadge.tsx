import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import AppTooltip from '../AppTooltip';
import {colors} from '../../theme';
import {getPercentileAccentColor} from '../../utils/percentile';
import {CrownIcon} from '../CrownIcon';
import MedalIcon from '../MedalIcon';
import RankBadgeCategoryIcon, {RankBadgeCategory} from './RankBadgeCategoryIcon';
import {cn} from '@/lib/utils';

export interface PercentileRankBadgeProps {
    rank: number;
    label: string;
    category: RankBadgeCategory;
    percentile?: number;
    compact?: boolean;
    href?: string;
    tooltipFightName?: string;
}

function buildBadgeTooltip(
    category: RankBadgeCategory,
    rank: number,
    label: string,
    tooltipFightName?: string,
): string {
    if (category === 'time') {
        return `Ranked #${rank} on the Time leaderboard`;
    }

    if (category === 'high-score') {
        return `Ranked #${rank} on the Deep Delve leaderboard`;
    }

    if (label.includes('Overall')) {
        const playerName = label.replace(/\s*—\s*Overall$/, '').trim();
        return playerName
            ? `${playerName} — Ranked #${rank} on the overall DPS leaderboard`
            : `Ranked #${rank} on the overall DPS leaderboard`;
    }

    if (label && tooltipFightName) {
        return `${label} — Ranked #${rank} on the ${tooltipFightName} DPS leaderboard`;
    }

    return label
        ? `${label} — Ranked #${rank} on the DPS leaderboard`
        : `Ranked #${rank} on the DPS leaderboard`;
}

const PercentileRankBadge: React.FC<PercentileRankBadgeProps> = ({
    rank,
    label,
    category,
    percentile,
    compact = false,
    href,
    tooltipFightName,
}) => {
    const accentColor = getPercentileAccentColor(percentile);
    const showGlow = !compact && percentile !== undefined && percentile >= 99;
    const categoryIconSize = compact ? 16 : 24;
    const categoryLabel = category === 'time'
        ? 'Time'
        : category === 'high-score'
            ? 'Deep Delve'
            : 'DPS';

    const inner = compact ? (
        <>
            <RankBadgeCategoryIcon category={category} size={categoryIconSize} />
            <span
                className="font-bold leading-tight text-[0.7rem]"
                style={{color: accentColor}}
            >
                #{rank}
            </span>
            {label && (
                <span className="text-[0.65rem] leading-tight" style={{color: colors.text.primary}}>
                    {label}
                </span>
            )}
        </>
    ) : (
        <>
            <RankBadgeCategoryIcon category={category} size={categoryIconSize} />
            <span
                className="font-bold text-base sm:text-[1.15rem]"
                style={{color: accentColor}}
            >
                #{rank}
            </span>
            {rank === 1 && <CrownIcon />}
            {rank === 2 && <MedalIcon color={colors.medal.silver} />}
            {rank === 3 && <MedalIcon color={colors.medal.bronze} />}
            {label && (
                <span className="text-[0.8rem] sm:text-[0.9rem]" style={{color: colors.text.primary}}>
                    {label}
                </span>
            )}
        </>
    );

    const badgeStyle: React.CSSProperties = compact
        ? {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2.8,
            padding: '1.6px 4.8px',
            border: `1px solid ${accentColor}`,
            background: `linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, ${accentColor}22 100%)`,
            verticalAlign: 'middle',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            ...(href ? {
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
            } : {}),
        }
        : {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: `2px solid ${accentColor}`,
            background: `linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, ${accentColor}22 100%)`,
            boxShadow: showGlow ? `0 0 12px ${accentColor}55` : undefined,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            ...(href ? {
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
            } : {}),
        };

    const ariaLabel = label
        ? `${categoryLabel} rank #${rank} — ${label}`
        : `${categoryLabel} rank #${rank}`;

    const badgeClassName = cn(
        'fight-group-rank-badge',
        compact && 'fight-group-rank-badge--compact',
        href && 'hover:brightness-110',
    );

    const badge = !href ? (
        <span className={badgeClassName} aria-label={ariaLabel} style={badgeStyle}>
            {inner}
        </span>
    ) : (
        <RouterLink
            to={href}
            className={badgeClassName}
            aria-label={ariaLabel}
            style={badgeStyle}
        >
            {inner}
        </RouterLink>
    );

    if (compact) {
        return badge;
    }

    return (
        <AppTooltip
            title={buildBadgeTooltip(category, rank, label, tooltipFightName)}
            side="top"
            disableTouch
        >
            <span className="inline-flex">{badge}</span>
        </AppTooltip>
    );
};

export default PercentileRankBadge;
