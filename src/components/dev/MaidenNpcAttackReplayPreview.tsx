import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import MainReplayComponent from "../replay/MainReplayComponent";
import { colors, contentColumnSx } from "../../theme";
import {
  createNpcAttackIconPreviewFight,
  PREVIEW_ATTACKS_BY_FAMILY,
} from "./maidenNpcAttackPreviewData";
import {
  NPC_ATTACK_ANIMATION_VERSION_1_6_9,
  TRACKED_NPC_ATTACK_NPCS,
} from "../../utils/trackedNpcAttackNpcs";
import { NPC_ATTACK_ANIMATION_META } from "../../utils/npcAttackAnimationNames";

/**
 * Dev preview: one tick-chart row per tracked NPC with every mapped attack icon.
 * Route: /dev/replay/maiden-npc-attacks
 */
const MaidenNpcAttackReplayPreview: React.FC = () => {
  const fight = useMemo(() => createNpcAttackIconPreviewFight(), []);

  const iconCount = Object.keys(NPC_ATTACK_ANIMATION_META).length;
  const rowCount = TRACKED_NPC_ATTACK_NPCS.length;
  const attackCount = Object.values(PREVIEW_ATTACKS_BY_FAMILY).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );

  return (
    <Box sx={{ ...contentColumnSx, py: 3 }}>
      <Typography
        component="h1"
        sx={{
          fontSize: "1.35rem",
          fontWeight: 700,
          color: colors.text.primary,
          mb: 0.5,
        }}
      >
        NPC attack icon tick chart preview
      </Typography>
      <Typography
        sx={{
          fontSize: "0.9rem",
          color: colors.text.muted,
          mb: 2,
          maxWidth: 720,
        }}
      >
        Fake log on Combat Logger {NPC_ATTACK_ANIMATION_VERSION_1_6_9}.{" "}
        {rowCount} NPC rows, {attackCount} attack cells covering {iconCount}{" "}
        animation mappings. Each NPC&apos;s icons start on the first attack tick
        (shared columns for 1st/2nd/… attack).
      </Typography>
      <MainReplayComponent fight={fight} />
    </Box>
  );
};

export default MaidenNpcAttackReplayPreview;
