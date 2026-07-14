import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fight } from "../../models/Fight";
import { DamageLog, filterByType, LogTypes } from "../../models/LogLine";
import {
  getBloatDownWindows,
  BloatDownWindow,
} from "../../utils/bloatDownEvents";
import { resolveNpcAttackImageUrl } from "../../utils/npcAttackAnimationNames";
import { colors } from "../../theme";
import AppTooltip from "../AppTooltip";
import {
  CHART_SERIES_ACCENT_COLOR,
  ChartTooltip,
  ChartTooltipDivider,
  ChartTooltipTime,
  resolveChartTooltipStatColor,
} from "./ChartTooltip";

interface DPSChartProps {
  fight: Fight;
  /** Full fight (including NPC attack lines) used for Down start/end markers. */
  eventFight?: Fight;
  height?: number;
}

type DpsChartPoint = {
  timestamp: number;
  dps: number;
  bloatMarkerLabel?: string;
};

const BLOAT_NPC_ID = 8359;
const BLOAT_DOWN_ICON_URL = resolveNpcAttackImageUrl(8082, BLOAT_NPC_ID);
const BLOAT_MARKER_ICON_SIZE = 28;
/** Extra gap between the icon bottom and the top of the reference line. */
const BLOAT_MARKER_LINE_GAP = 10;

interface BloatMarkerLabelProps {
  viewBox?: { x: number; y: number; height: number };
  iconUrl: string;
  title: string;
}

const BloatMarkerLabel: React.FC<BloatMarkerLabelProps> = ({
  viewBox,
  iconUrl,
  title,
}) => {
  if (!viewBox || viewBox.x == null) {
    return null;
  }

  const hitSize = BLOAT_MARKER_ICON_SIZE + 12;

  return (
    <foreignObject
      x={viewBox.x - hitSize / 2}
      y={(viewBox.y ?? 0) - hitSize - BLOAT_MARKER_LINE_GAP}
      width={hitSize}
      height={hitSize}
      style={{ overflow: "visible", pointerEvents: "all" }}
    >
      <div
        {...({
          xmlns: "http://www.w3.org/1999/xhtml",
        } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <AppTooltip
          title={title}
          placement="top"
          arrow
          slotProps={{ popper: { sx: { zIndex: 1500 } } }}
        >
          <span className="dps-chart-bloat-icon-wrap">
            <img
              src={iconUrl}
              alt=""
              width={BLOAT_MARKER_ICON_SIZE}
              height={BLOAT_MARKER_ICON_SIZE}
              className="boosts-chart-attack-icon"
            />
          </span>
        </AppTooltip>
      </div>
    </foreignObject>
  );
};

const CustomTooltip: React.FC<{
  active?: boolean;
  // Recharts tooltip payload typing is looser than our densified chart points.
  payload?: Array<{
    value?: number;
    color?: string;
    payload?: DpsChartPoint;
  }>;
  label?: number | string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const labelDate = new Date(label ?? NaN);
  if (isNaN(labelDate.getTime())) {
    return null;
  }

  const isoTimeString = labelDate.toISOString().substr(11, 12);
  const markerLabel = payload[0]?.payload?.bloatMarkerLabel;

  return (
    <ChartTooltip>
      <ChartTooltipTime>{isoTimeString}</ChartTooltipTime>
      <ChartTooltipDivider />
      {markerLabel && (
        <div className="chart-tooltip__missed-label">{markerLabel}</div>
      )}
      {payload.map((entry, index) => {
        if (typeof entry.value !== "number") {
          return null;
        }
        return (
          <div
            key={`tooltip-entry-${index}`}
            className="chart-tooltip__stat-value"
            style={{
              color:
                resolveChartTooltipStatColor(entry.color) ??
                CHART_SERIES_ACCENT_COLOR,
              textAlign: "center",
            }}
          >
            {entry.value.toFixed(2)} DPS
          </div>
        );
      })}
    </ChartTooltip>
  );
};

export const calculateDPSByInterval = (
  data: DamageLog[],
  interval: number,
  startTime: number,
  endTime: number,
) => {
  const dpsData: { timestamp: number; dps: number }[] = [];

  if (startTime >= endTime) {
    return dpsData;
  }

  let currentIntervalStart = startTime;

  for (
    let timestamp = startTime + interval;
    timestamp <= endTime + interval;
    timestamp += interval
  ) {
    const intervalEnd = Math.min(timestamp, endTime);
    let currentIntervalTotalDamage = 0;

    for (let i = 0; i < data.length; i++) {
      const log = data[i];
      const logTimestamp = log.fightTimeMs!;
      const totalDamage = log.damageAmount !== undefined ? log.damageAmount : 0;

      if (logTimestamp >= currentIntervalStart && logTimestamp < intervalEnd) {
        currentIntervalTotalDamage += totalDamage;
      }
    }

    const intervalDuration = intervalEnd - currentIntervalStart;
    const dps =
      intervalDuration > 0
        ? (currentIntervalTotalDamage / intervalDuration) * 1000
        : 0;
    dpsData.push({
      timestamp: intervalEnd,
      dps: Number.isFinite(dps) ? dps : 0,
    });

    currentIntervalStart = intervalEnd;
    if (currentIntervalStart >= endTime) {
      break;
    }
  }

  return dpsData;
};

/** One OSRS game tick — densified so tooltip can land on every tick. */
const TICK_DURATION_MS = 600;

/**
 * Fritsch–Carlson monotone cubic slopes (same family as recharts `monotone`).
 * Softens corners when coarse samples are expanded for hover selection.
 */
function buildMonotoneSlopes(xs: number[], ys: number[]): number[] {
  const n = xs.length;
  const deltas = new Array<number>(n - 1);
  const slopes = new Array<number>(n);

  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    deltas[i] = dx === 0 ? 0 : (ys[i + 1] - ys[i]) / dx;
  }

  slopes[0] = deltas[0];
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      slopes[i] = 0;
    } else {
      slopes[i] = (deltas[i - 1] + deltas[i]) / 2;
    }
  }
  slopes[n - 1] = deltas[n - 2] ?? 0;

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(deltas[i]) < 1e-12) {
      slopes[i] = 0;
      slopes[i + 1] = 0;
      continue;
    }
    const alpha = slopes[i] / deltas[i];
    const beta = slopes[i + 1] / deltas[i];
    const magnitude = Math.hypot(alpha, beta);
    if (magnitude > 3) {
      const scale = 3 / magnitude;
      slopes[i] = scale * alpha * deltas[i];
      slopes[i + 1] = scale * beta * deltas[i];
    }
  }

  return slopes;
}

function interpolateMonotone(
  xs: number[],
  ys: number[],
  slopes: number[],
  x: number,
): number {
  if (x <= xs[0]) {
    return ys[0];
  }
  if (x >= xs[xs.length - 1]) {
    return ys[ys.length - 1];
  }

  let i = 0;
  while (i < xs.length - 2 && xs[i + 1] < x) {
    i += 1;
  }

  const x0 = xs[i];
  const x1 = xs[i + 1];
  const y0 = ys[i];
  const y1 = ys[i + 1];
  const dx = x1 - x0;
  if (dx === 0) {
    return y0;
  }

  const t = (x - x0) / dx;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * y0 + h10 * dx * slopes[i] + h01 * y1 + h11 * dx * slopes[i + 1];
}

/** Expand coarse DPS samples to one point per tick for hover selection. */
export const densifyDpsToTicks = (
  samples: { timestamp: number; dps: number }[],
  startTime: number,
  endTime: number,
  tickMs: number = TICK_DURATION_MS,
): { timestamp: number; dps: number }[] => {
  if (samples.length === 0 || startTime >= endTime || tickMs <= 0) {
    return [];
  }

  const anchors =
    samples[0].timestamp <= startTime
      ? samples
      : [{ timestamp: startTime, dps: samples[0].dps }, ...samples];

  const xs = anchors.map((point) => point.timestamp);
  const ys = anchors.map((point) => point.dps);
  const slopes = buildMonotoneSlopes(xs, ys);

  const densified: { timestamp: number; dps: number }[] = [];

  for (let timestamp = startTime; timestamp <= endTime; timestamp += tickMs) {
    densified.push({
      timestamp,
      dps: interpolateMonotone(xs, ys, slopes, timestamp),
    });
  }

  const last = densified[densified.length - 1];
  if (!last || last.timestamp !== endTime) {
    densified.push({
      timestamp: endTime,
      dps: interpolateMonotone(xs, ys, slopes, endTime),
    });
  }

  return densified;
};

function snapFightTimeToTick(
  fightTimeMs: number,
  startTime: number,
  endTime: number,
  tickMs: number,
): number {
  const snapped =
    startTime + Math.round((fightTimeMs - startTime) / tickMs) * tickMs;
  return Math.max(startTime, Math.min(endTime, snapped));
}

function attachBloatMarkerLabels(
  points: { timestamp: number; dps: number }[],
  windows: BloatDownWindow[],
  startTime: number,
  endTime: number,
  tickMs: number,
): DpsChartPoint[] {
  if (windows.length === 0) {
    return points;
  }

  const labelsByTimestamp = new Map<number, string>();
  for (const window of windows) {
    const startTs = snapFightTimeToTick(
      window.startFightTimeMs,
      startTime,
      endTime,
      tickMs,
    );
    labelsByTimestamp.set(startTs, `Down ${window.downNumber} Start`);

    // Only label End when the full Down cycle completed.
    if (!window.endsWithStomp) {
      continue;
    }

    const endTs = snapFightTimeToTick(
      window.endFightTimeMs,
      startTime,
      endTime,
      tickMs,
    );
    if (endTs !== startTs) {
      labelsByTimestamp.set(endTs, `Down ${window.downNumber} End`);
    }
  }

  return points.map((point) => {
    const bloatMarkerLabel = labelsByTimestamp.get(point.timestamp);
    return bloatMarkerLabel ? { ...point, bloatMarkerLabel } : point;
  });
}

const BLOAT_DOWN_LINE_COLOR = colors.text.damage;

const DPSChart: React.FC<DPSChartProps> = ({
  fight,
  eventFight,
  height = 200,
}) => {
  const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);

  const fightLengthMs = (fight.metaData.fightDurationTicks ?? 0) * 600;
  const interval = Math.min(Math.max(fightLengthMs / 4, 600), 6000);

  const startTime = fight.firstLine.fightTimeMs ?? 0;
  const endTime = fight.lastLine.fightTimeMs ?? startTime;

  const markerSource = eventFight ?? fight;
  const bloatDownWindows = useMemo(
    () => getBloatDownWindows(markerSource),
    [markerSource],
  );

  const dpsData = useMemo(() => {
    const coarse = calculateDPSByInterval(
      filteredLogs,
      interval,
      startTime,
      endTime,
    );
    const densified = densifyDpsToTicks(
      coarse,
      startTime,
      endTime,
      TICK_DURATION_MS,
    );
    return attachBloatMarkerLabels(
      densified,
      bloatDownWindows,
      startTime,
      endTime,
      TICK_DURATION_MS,
    );
  }, [filteredLogs, interval, startTime, endTime, bloatDownWindows]);

  const axisLabelEvery = Math.max(1, Math.ceil(dpsData.length / 5));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={dpsData}
        margin={{
          top: bloatDownWindows.length > 0 ? 44 : 16,
          left: 40,
          bottom: height <= 150 ? -4 : 0,
        }}
      >
        <XAxis
          type="number"
          dataKey="timestamp"
          domain={[startTime, endTime]}
          allowDataOverflow
          tickFormatter={(tick, index) =>
            index % axisLabelEvery === 0
              ? new Date(tick).toISOString().substr(11, 8)
              : ""
          }
        />
        <YAxis
          dataKey="dps"
          label={{
            value: "DPS",
            position: "insideLeft",
            angle: -90,
            offset: -20,
            style: { textAnchor: "middle" },
          }}
          width={35}
          tickFormatter={(tick) => (tick !== 0 ? tick : "")}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              label={props.label}
              payload={props.payload?.map((entry) => ({
                value:
                  typeof entry.value === "number" ? entry.value : undefined,
                color: entry.color,
                payload: entry.payload as DpsChartPoint | undefined,
              }))}
            />
          )}
          cursor={{ stroke: "#888888", strokeWidth: 1 }}
          isAnimationActive={false}
        />

        <Area
          type="linear"
          dataKey="dps"
          stroke="black"
          fill="tan"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive={false}
        />

        {bloatDownWindows.map((window) => (
          <React.Fragment key={`bloat-down-${window.downNumber}`}>
            <ReferenceLine
              x={window.startFightTimeMs}
              stroke={BLOAT_DOWN_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="6 3"
              ifOverflow="visible"
              label={
                <BloatMarkerLabel
                  iconUrl={BLOAT_DOWN_ICON_URL}
                  title={`Down ${window.downNumber} Start`}
                />
              }
            />
            {window.endsWithStomp && (
              <ReferenceLine
                x={window.endFightTimeMs}
                stroke={BLOAT_DOWN_LINE_COLOR}
                strokeWidth={2}
                strokeOpacity={0.75}
                strokeDasharray="2 4"
                ifOverflow="visible"
                label={
                  <BloatMarkerLabel
                    iconUrl={BLOAT_DOWN_ICON_URL}
                    title={`Down ${window.downNumber} End`}
                  />
                }
              />
            )}
          </React.Fragment>
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DPSChart;
