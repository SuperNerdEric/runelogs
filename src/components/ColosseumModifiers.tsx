import React, {useMemo, useState} from 'react';
import AppTooltip from './AppTooltip';
import {Icon} from '@iconify/react';
import {useIsMobile} from '@/hooks/useMediaQuery';
import {
    ColosseumModifierData,
    getModifierImageUrl,
    getModifierInfo,
    getModifierLevelLabel,
    hasColosseumModifierData,
    longestModifierDescriptionLines,
} from '../utils/colosseumModifiers';

interface ColosseumModifiersProps {
    modifiers: ColosseumModifierData | null | undefined;
}

interface ModifierIconProps {
    modifierId: number;
    dimmed?: boolean;
    size?: number;
    showTooltip?: boolean;
}

const ModifierIcon: React.FC<ModifierIconProps> = ({
    modifierId,
    dimmed = false,
    size = 48,
    showTooltip = true,
}) => {
    const levelLabel = getModifierLevelLabel(modifierId);
    const {name, description} = getModifierInfo(modifierId);

    const icon = (
        <div
            className={`colosseum-modifier-icon${dimmed ? ' colosseum-modifier-icon--dimmed' : ''}`}
            aria-label={name}
        >
            <img
                src={getModifierImageUrl(modifierId)}
                alt=""
                width={size}
                height={size}
                loading="lazy"
            />
            {levelLabel && <span className="colosseum-modifier-icon__level">{levelLabel}</span>}
        </div>
    );

    if (!description || !showTooltip) {
        return icon;
    }

    return (
        <AppTooltip
            title={description}
            side="top"
            className="colosseum-modifier-tooltip"
        >
            <span className="colosseum-modifier-icon__tooltip-anchor">
                {icon}
            </span>
        </AppTooltip>
    );
};

interface ModifierItemProps {
    modifierId: number;
    dimmed?: boolean;
    compact?: boolean;
    showDescription?: boolean;
    showTooltip?: boolean;
}

const ModifierItem: React.FC<ModifierItemProps> = ({
    modifierId,
    dimmed = false,
    compact = false,
    showDescription = false,
    showTooltip = true,
}) => {
    const {name, description} = getModifierInfo(modifierId);

    return (
        <div
            className={`colosseum-modifier-item${dimmed ? ' colosseum-modifier-item--dimmed' : ''}${compact ? ' colosseum-modifier-item--compact' : ''}${showDescription ? ' colosseum-modifier-item--with-description' : ''}`}
        >
            <ModifierIcon
                modifierId={modifierId}
                dimmed={dimmed}
                size={compact ? 40 : 48}
                showTooltip={showTooltip}
            />
            <div className="colosseum-modifier-item__text">
                <span className="colosseum-modifier-item__name">{name}</span>
                {showDescription && description && (
                    <span className="colosseum-modifier-item__description">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
};

const ColosseumModifiers: React.FC<ColosseumModifiersProps> = ({modifiers}) => {
    const [wavesExpanded, setWavesExpanded] = useState(false);
    const isMobile = useIsMobile();
    const waveChoices = modifiers?.waveChoices ?? [];
    const waveDescriptionLines = useMemo(() => {
        if (isMobile || waveChoices.length === 0) {
            return undefined;
        }

        const modifierIds = waveChoices.flatMap((wave) => wave.options);
        return longestModifierDescriptionLines(modifierIds);
    }, [isMobile, waveChoices]);

    if (!hasColosseumModifierData(modifiers)) {
        return null;
    }

    const activeModifiers = modifiers!.activeModifiers;

    return (
        <div className="damage-done-container colosseum-modifiers-section mb-4">
            <div className="encounter-title-bar">
                <span className="encounter-title-bar-name">Modifiers</span>
            </div>

            <div className="colosseum-modifiers-section__body">
                {activeModifiers.length > 0 && (
                    <div className="colosseum-modifiers-active">
                        <div className="colosseum-modifiers-active__grid">
                            {activeModifiers.map((modifierId) => (
                                <ModifierItem key={modifierId} modifierId={modifierId} />
                            ))}
                        </div>
                    </div>
                )}

                {waveChoices.length > 0 && (
                    <div className="colosseum-modifiers-waves">
                        <button
                            type="button"
                            className={`colosseum-modifiers-waves__control${wavesExpanded ? ' colosseum-modifiers-waves__control--expanded' : ''}`}
                            aria-expanded={wavesExpanded}
                            onClick={() => setWavesExpanded((expanded) => !expanded)}
                        >
                            <span className="colosseum-modifiers-waves__chip">
                                <Icon
                                    icon="mdi:view-list"
                                    className="colosseum-modifiers-waves__chip-icon"
                                />
                                <span className="colosseum-modifiers-waves__chip-label">
                                    {wavesExpanded ? 'Less Info' : 'More Info'}
                                </span>
                                <Icon
                                    icon="mdi:chevron-down"
                                    className={`colosseum-modifiers-waves__chip-chevron${wavesExpanded ? ' colosseum-modifiers-waves__chip-chevron--expanded' : ''}`}
                                />
                            </span>
                        </button>
                        {wavesExpanded && (
                            <div
                                className="colosseum-modifiers-waves__list"
                                style={
                                    waveDescriptionLines
                                        ? ({
                                              '--colosseum-modifier-description-lines':
                                                  waveDescriptionLines,
                                          } as React.CSSProperties)
                                        : undefined
                                }
                            >
                                {waveChoices.map((wave, index) => (
                                    <div className="colosseum-modifiers-wave" key={`wave-${index}`}>
                                        <span className="colosseum-modifiers-wave__title">
                                            Wave {index + 1}
                                        </span>
                                        <div className="colosseum-modifiers-wave__options">
                                            {wave.options.map((optionId) => (
                                                <ModifierItem
                                                    key={`${index}-${optionId}`}
                                                    modifierId={optionId}
                                                    dimmed={optionId !== wave.chosen}
                                                    compact
                                                    showDescription={!isMobile}
                                                    showTooltip={isMobile}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColosseumModifiers;
