import React, {useEffect, useId, useMemo, useState} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {FightMetaData} from '../../models/Fight';
import {EncounterMetaData} from '../../models/LogLine';
import {isFightGroupMetadata} from '../../models/FightGroup';
import {isLeaderboardFightGroup, inferLeaderboardFightGroupName} from '../../utils/leaderboardContent';
import {resolveFightGroupSpriteKey} from '../../lib/hiscoreSprites';
import HiscoreSpriteIcon from '../HiscoreSpriteIcon';
import {Typography, Box} from '@mui/material';
import {colors} from '../../theme';
import {formatHHmmss, ticksToTime} from '../../utils/utils';
import {
    buildFightGridCompactContainerQueryCss,
    FamilyTileLayout,
    formatFightDurationLabel,
    getFightGroupFamilyName,
    longestLabelCh,
    resolveFamilyTileLayouts,
} from '../../utils/fightTileLayout';
import FightTileRankBadges, {FightTileRankBadge} from '../badges/FightTileRankBadges';

interface FightTileProps {
    title: string;
    fightDurationTicks: number;
    startTime: string;
    success: boolean;
    href?: string;
    onClick?: () => void;
    showGoldStar?: boolean;
    rankBadges?: FightTileRankBadge[];
}

const FightTile: React.FC<FightTileProps> = ({
    title,
    fightDurationTicks,
    startTime,
    success,
    href,
    onClick,
    showGoldStar = false,
    rankBadges = [],
}) => {
    const date = new Date(startTime);
    const formattedTime = date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
    const nameColor = success ? colors.fight.success : colors.fight.failure;
    const formattedDuration = formatHHmmss(fightDurationTicks * 600, false);

    const content = (
        <>
            <div className="fight-tile-primary" style={{color: nameColor}}>
                <span className="fight-tile-title">{title}</span>
                <span className="fight-tile-duration"> ({formattedDuration})</span>
            </div>
            <div className="fight-tile-start-time">{formattedTime}</div>
            {showGoldStar && (
                <div className="gold-star">&#9733;</div>
            )}
            <FightTileRankBadges badges={rankBadges} />
        </>
    );

    const className = `fight-tile${showGoldStar ? ' fight-tile--has-star' : ''}`;

    if (href) {
        return (
            <RouterLink to={href} className={className}>
                {content}
            </RouterLink>
        );
    }

    return (
        <div className={className} onClick={onClick}>
            {content}
        </div>
    );
};

export interface FightTileGridItem {
    key: string;
    title: string;
    fightDurationTicks: number;
    startTime: string;
    success: boolean;
    href?: string;
    onClick?: () => void;
    showGoldStar?: boolean;
    rankBadges?: FightTileRankBadge[];
}

export interface FightTileGridProps {
    tiles: FightTileGridItem[];
    labelCh?: number;
}

function fightGridContainerName(reactId: string): string {
    return `fight-grid${reactId.replace(/:/g, '')}`;
}

export const FightTileGrid: React.FC<FightTileGridProps> = ({tiles, labelCh: labelChProp}) => {
    const containerName = fightGridContainerName(useId());
    const labelCh = labelChProp ?? longestLabelCh(
        tiles.map((tile) => formatFightDurationLabel(tile.title, tile.fightDurationTicks)),
    );
    const compactLayoutCss = buildFightGridCompactContainerQueryCss(containerName, tiles.length, labelCh);

    return (
        <>
            <style>{compactLayoutCss}</style>
            <div
                className={`fight-list-container fight-list-container--${containerName}`}
                style={{
                    containerType: 'inline-size',
                    containerName,
                    '--fight-tile-label-ch': labelCh,
                } as React.CSSProperties}
            >
                <div className="fight-list">
                    {tiles.map((tile) => (
                        <FightTile
                            key={tile.key}
                            title={tile.title}
                            fightDurationTicks={tile.fightDurationTicks}
                            startTime={tile.startTime}
                            success={tile.success}
                            href={tile.href}
                            onClick={tile.onClick}
                            showGoldStar={tile.showGoldStar}
                            rankBadges={tile.rankBadges}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export interface FightGroupFightRow {
    fight: FightMetaData;
    index: number;
    fightGroupIndex: number;
    href?: string;
    rankBadges?: FightTileRankBadge[];
}

export interface FightGroupFightRowsProps {
    fights: FightGroupFightRow[];
    onSelectFight?: (index: number, fightGroupIndex: number) => void;
    labelCh?: number;
}

export const FightGroupFightRows: React.FC<FightGroupFightRowsProps> = ({
    fights,
    onSelectFight,
    labelCh,
}) => (
    <FightTileGrid
        labelCh={labelCh}
        tiles={fights.map((row, i) => ({
            key: `${row.index}-${row.fightGroupIndex}-${i}`,
            title: row.fight.name,
            fightDurationTicks: row.fight.fightDurationTicks ?? 0,
            startTime: row.fight.startTime,
            success: row.fight.success,
            href: row.href,
            onClick: row.href ? undefined : () => onSelectFight?.(row.index, row.fightGroupIndex),
            rankBadges: row.rankBadges,
        }))}
    />
);

export interface EncounterTitleBarProps {
    name: string;
    leaderboardName?: string | null;
    officialDurationTicks?: number;
    success?: boolean;
    href?: string;
    onClick?: () => void;
}

export const EncounterTitleBar: React.FC<EncounterTitleBarProps> = ({
    name,
    leaderboardName,
    officialDurationTicks,
    success,
    href,
    onClick,
}) => {
    const className = `encounter-title-bar${href || onClick ? ' encounter-title-bar--clickable' : ''}`;
    const durationColor = success ? colors.fight.success : colors.fight.failure;
    const spriteKey = resolveFightGroupSpriteKey(name, leaderboardName);
    const content = (
        <>
            <span className="encounter-title-bar-heading">
                <HiscoreSpriteIcon spriteKey={spriteKey} height="1em" alt="" />
                <span className="encounter-title-bar-name">{name}</span>
            </span>
            {officialDurationTicks != null && (
                <Typography component="span" variant="body2" sx={{color: durationColor}} display="block">
                    Overall - ({ticksToTime(officialDurationTicks)})
                </Typography>
            )}
        </>
    );

    if (href) {
        return (
            <RouterLink to={href} className={className}>
                {content}
            </RouterLink>
        );
    }

    return (
        <div className={className} onClick={onClick}>
            {content}
        </div>
    );
};

type FightGroupMap = {
    [name: string]: {
        isRaid: boolean;
        officialDurationTicks?: number;
        success?: boolean;
        fightGroupId?: string;
        isLeaderboardContent?: boolean;
        leaderboardName?: string | null;
        fights: {
            fight: FightMetaData;
            index: number;
            fightGroupIndex?: number;
        }[];
    };
};

export interface LogFightListProps {
    fights: EncounterMetaData[];
    getFightHref?: (encounterIndex: number, fightGroupIndex?: number) => string | undefined;
    onSelectFight?: (index: number, fightGroupIndex?: number) => void;
    getFightGroupHref?: (fightGroupId: string) => string;
    onSelectFightGroup?: (fightGroupId: string) => void;
    onSelectAggregateFight?: (indices: number[]) => void;
}

function buildGroupLabels(group: FightGroupMap[string]): string[] {
    if (group.isRaid) {
        return group.fights.map((fight) => formatFightDurationLabel(
            fight.fight.name,
            fight.fight.fightDurationTicks ?? 0,
        ));
    }

    return group.fights.map((fight, index) => formatFightDurationLabel(
        String(index + 1),
        fight.fight.fightDurationTicks ?? 0,
    ));
}

const LogFightList: React.FC<LogFightListProps> = ({
    fights,
    getFightHref,
    onSelectFight,
    getFightGroupHref,
    onSelectFightGroup,
    onSelectAggregateFight,
}) => {
    const [groupedFights, setGroupedFights] = useState<FightGroupMap>({});

    useEffect(() => {
        const tempGroupedFights: FightGroupMap = {};

        fights.forEach((fight, index) => {
            if (isFightGroupMetadata(fight)) {
                const resolvedLeaderboardName = fight.leaderboardName
                    ?? inferLeaderboardFightGroupName(fight.name);
                tempGroupedFights[fight.name] = {
                    isRaid: true,
                    officialDurationTicks: fight.officialDurationTicks,
                    success: fight.success,
                    fightGroupId: fight.id,
                    leaderboardName: resolvedLeaderboardName,
                    isLeaderboardContent: isLeaderboardFightGroup(resolvedLeaderboardName),
                    fights: fight.fights.map((f, i) => ({fight: f, index, fightGroupIndex: i})),
                };
            } else {
                if (!tempGroupedFights[fight.name]) {
                    tempGroupedFights[fight.name] = {isRaid: false, fights: []};
                }
                tempGroupedFights[fight.name].fights.push({fight, index});
            }
        });

        setGroupedFights(tempGroupedFights);
    }, [fights]);

    const familyTileLayouts = useMemo(() => resolveFamilyTileLayouts(
        Object.entries(groupedFights).map(([groupName, group]) => ({
            groupName,
            success: group.success,
            labels: buildGroupLabels(group),
        })),
    ), [groupedFights]);

    return (
        <div className="fight-selector">
            {Object.keys(groupedFights).map((name) => {
                const fightGroup = groupedFights[name];
                const familyName = getFightGroupFamilyName(name);
                const familyLayout = familyTileLayouts.get(familyName);
                const labelCh = familyLayout?.labelCh;

                if (fightGroup.isRaid) {
                    const fightGroupHref = fightGroup.isLeaderboardContent && fightGroup.fightGroupId
                        ? (getFightGroupHref?.(fightGroup.fightGroupId) ?? undefined)
                        : undefined;
                    const handleTitleClick = !fightGroupHref && fightGroup.isLeaderboardContent && fightGroup.fightGroupId && onSelectFightGroup
                        ? () => onSelectFightGroup(fightGroup.fightGroupId!)
                        : undefined;

                    return (
                        <div className="damage-done-container" key={name}>
                            <EncounterTitleBar
                                name={name}
                                leaderboardName={fightGroup.leaderboardName}
                                officialDurationTicks={fightGroup.officialDurationTicks}
                                success={fightGroup.success}
                                href={fightGroupHref}
                                onClick={handleTitleClick}
                            />
                            <FightGroupFightRows
                                labelCh={labelCh}
                                fights={fightGroup.fights.map((fight) => ({
                                    fight: fight.fight,
                                    index: fight.index,
                                    fightGroupIndex: fight.fightGroupIndex!,
                                    href: getFightHref?.(fight.index, fight.fightGroupIndex),
                                }))}
                                onSelectFight={onSelectFight}
                            />
                        </div>
                    );
                }

                let shortestTime: number | undefined;

                fightGroup.fights.forEach((fight) => {
                    if (fight.fight.success) {
                        if (!shortestTime || fight.fight.fightDurationTicks < shortestTime) {
                            shortestTime = fight.fight.fightDurationTicks;
                        }
                    }
                });

                const handleBannerClick = () => {
                    if (onSelectAggregateFight) {
                        onSelectAggregateFight(fightGroup.fights.map((fight) => fight.index));
                    }
                };

                return (
                    <div className="damage-done-container" key={name}>
                        <EncounterTitleBar name={name} onClick={handleBannerClick}/>
                        <FightTileGrid
                            labelCh={labelCh}
                            tiles={fightGroup.fights.map((fight, index) => ({
                                key: `${fight.index}-${index}`,
                                title: String(index + 1),
                                fightDurationTicks: fight.fight.fightDurationTicks ?? 0,
                                startTime: fight.fight.startTime,
                                success: fight.fight.success,
                                href: getFightHref?.(fight.index),
                                onClick: getFightHref?.(fight.index)
                                    ? undefined
                                    : () => onSelectFight?.(fight.index),
                                showGoldStar: fight.fight.fightDurationTicks === shortestTime,
                            }))}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default LogFightList;
