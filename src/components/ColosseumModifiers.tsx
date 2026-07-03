import React, { useMemo, useState } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import AppTooltip from "./AppTooltip";
import { Icon } from "@iconify/react";
import {
  ColosseumModifierData,
  getModifierImageUrl,
  getModifierInfo,
  getModifierLevelLabel,
  hasColosseumModifierData,
  longestModifierDescriptionLines,
} from "../utils/colosseumModifiers";

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
  const { name, description } = getModifierInfo(modifierId);

  const icon = (
    <Box
      className={`colosseum-modifier-icon${dimmed ? " colosseum-modifier-icon--dimmed" : ""}`}
      aria-label={name}
    >
      <img
        src={getModifierImageUrl(modifierId)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
      />
      {levelLabel && (
        <span className="colosseum-modifier-icon__level">{levelLabel}</span>
      )}
    </Box>
  );

  if (!description || !showTooltip) {
    return icon;
  }

  return (
    <AppTooltip
      title={description}
      placement="top"
      arrow
      slotProps={{
        tooltip: {
          className: "colosseum-modifier-tooltip",
        },
      }}
    >
      <Box component="span" className="colosseum-modifier-icon__tooltip-anchor">
        {icon}
      </Box>
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
  const { name, description } = getModifierInfo(modifierId);

  return (
    <Box
      className={`colosseum-modifier-item${dimmed ? " colosseum-modifier-item--dimmed" : ""}${compact ? " colosseum-modifier-item--compact" : ""}${showDescription ? " colosseum-modifier-item--with-description" : ""}`}
    >
      <ModifierIcon
        modifierId={modifierId}
        dimmed={dimmed}
        size={compact ? 40 : 48}
        showTooltip={showTooltip}
      />
      <Box className="colosseum-modifier-item__text">
        <Typography className="colosseum-modifier-item__name">
          {name}
        </Typography>
        {showDescription && description && (
          <Typography className="colosseum-modifier-item__description">
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ColosseumModifiers: React.FC<ColosseumModifiersProps> = ({
  modifiers,
}) => {
  const [wavesExpanded, setWavesExpanded] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");
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
    <Box
      className="damage-done-container colosseum-modifiers-section"
      sx={{ mb: 2 }}
    >
      <Box className="encounter-title-bar">
        <span className="encounter-title-bar-name">Modifiers</span>
      </Box>

      <Box className="colosseum-modifiers-section__body">
        {activeModifiers.length > 0 && (
          <Box className="colosseum-modifiers-active">
            <Box className="colosseum-modifiers-active__grid">
              {activeModifiers.map((modifierId) => (
                <ModifierItem key={modifierId} modifierId={modifierId} />
              ))}
            </Box>
          </Box>
        )}

        {waveChoices.length > 0 && (
          <Box className="colosseum-modifiers-waves">
            <Box
              component="button"
              type="button"
              className={`colosseum-modifiers-waves__control${wavesExpanded ? " colosseum-modifiers-waves__control--expanded" : ""}`}
              aria-expanded={wavesExpanded}
              onClick={() => setWavesExpanded((expanded) => !expanded)}
            >
              <Box component="span" className="colosseum-modifiers-waves__chip">
                <Icon
                  icon="mdi:view-list"
                  className="colosseum-modifiers-waves__chip-icon"
                />
                <Typography
                  component="span"
                  className="colosseum-modifiers-waves__chip-label"
                >
                  {wavesExpanded ? "Less Info" : "More Info"}
                </Typography>
                <Icon
                  icon="mdi:chevron-down"
                  className={`colosseum-modifiers-waves__chip-chevron${wavesExpanded ? " colosseum-modifiers-waves__chip-chevron--expanded" : ""}`}
                />
              </Box>
            </Box>
            {wavesExpanded && (
              <Box
                className="colosseum-modifiers-waves__list"
                style={
                  waveDescriptionLines
                    ? ({
                        "--colosseum-modifier-description-lines":
                          waveDescriptionLines,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                {waveChoices.map((wave, index) => (
                  <Box
                    className="colosseum-modifiers-wave"
                    key={`wave-${index}`}
                  >
                    <Typography className="colosseum-modifiers-wave__title">
                      Wave {index + 1}
                    </Typography>
                    <Box className="colosseum-modifiers-wave__options">
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
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ColosseumModifiers;
