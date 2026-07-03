import React from "react";
import { Icon } from "@iconify/react";
import { colors } from "../../theme";

export type RankBadgeCategory = "time" | "dps" | "high-score";

const CATEGORY_ICONS: Record<RankBadgeCategory, string> = {
  time: "mdi:clock-outline",
  dps: "mdi:sword",
  "high-score": "mdi:stairs-down",
};

interface RankBadgeCategoryIconProps {
  category: RankBadgeCategory;
  size: number;
  color?: string;
}

const RankBadgeCategoryIcon: React.FC<RankBadgeCategoryIconProps> = ({
  category,
  size,
  color = colors.text.muted,
}) => (
  <Icon
    icon={CATEGORY_ICONS[category]}
    style={{
      fontSize: size,
      width: size,
      height: size,
      color,
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle",
      ...(category === "high-score" ? { transform: "scaleX(-1)" } : {}),
    }}
    aria-hidden
  />
);

export default RankBadgeCategoryIcon;
