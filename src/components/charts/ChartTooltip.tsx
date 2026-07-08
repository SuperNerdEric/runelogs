import React from "react";
import { getItemImageUrl } from "../replay/PlayerEquipment";

export function capitalizeChartLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const CHART_SERIES_ACCENT_COLOR = "var(--color-switch-tan)";

const UNREADABLE_TOOLTIP_STAT_COLORS = new Set([
  "black",
  "#000",
  "#000000",
  "rgb(0,0,0)",
  "rgb(0, 0, 0)",
]);

export function resolveChartTooltipStatColor(
  color?: string,
): string | undefined {
  if (!color) return undefined;

  const normalized = color.replace(/\s/g, "").toLowerCase();
  if (UNREADABLE_TOOLTIP_STAT_COLORS.has(normalized)) {
    return undefined;
  }

  return color;
}

interface ChartTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  children,
  className,
}) => (
  <div className={className ? `chart-tooltip ${className}` : "chart-tooltip"}>
    {children}
  </div>
);

export const ChartTooltipTime: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="chart-tooltip__time">{children}</div>;

export const ChartTooltipDivider: React.FC = () => (
  <div className="chart-tooltip__divider" aria-hidden="true" />
);

interface ChartTooltipAttackRowProps {
  weaponItemId?: number;
  weaponName?: string;
  animationId?: number;
}

export const ChartTooltipAttackRow: React.FC<ChartTooltipAttackRowProps> = ({
  weaponItemId,
  weaponName,
  animationId,
}) => (
  <div className="chart-tooltip__attack">
    {weaponItemId ? (
      <>
        <img
          src={getItemImageUrl(weaponItemId)}
          alt=""
          className="osrs-item-icon chart-tooltip__weapon-icon"
        />
        <span>{weaponName}</span>
      </>
    ) : (
      <span>Animation: {animationId}</span>
    )}
  </div>
);

interface ChartTooltipStatRowProps {
  label: string;
  value: number | string;
  color?: string;
}

export const ChartTooltipStatGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="chart-tooltip__stats">{children}</div>;

export const ChartTooltipStatRow: React.FC<ChartTooltipStatRowProps> = ({
  label,
  value,
  color,
}) => {
  const resolvedColor = resolveChartTooltipStatColor(color);

  return (
    <>
      <span className="chart-tooltip__stat-label">{label}</span>
      <span
        className="chart-tooltip__stat-value"
        style={resolvedColor ? { color: resolvedColor } : undefined}
      >
        {value}
      </span>
    </>
  );
};

interface ChartTooltipTargetRowProps {
  targetName: string;
}

export const ChartTooltipTargetRow: React.FC<ChartTooltipTargetRowProps> = ({
  targetName,
}) => (
  <div className="chart-tooltip__target">
    <span className="chart-tooltip__target-label">Target</span>
    <span className="chart-tooltip__target-value">{targetName}</span>
  </div>
);
