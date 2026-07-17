import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceArea,
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
import {
  getMaidenPhaseMarkers,
  MaidenPhaseMarker,
} from "../../utils/maidenPhaseEvents";
import {
  BLOAT_STOMP_IMAGE_URL,
  NYLOCAS_MATOMENOS_IMAGE_URL,
  resolveNpcAttackImageUrl,
} from "../../utils/npcAttackAnimationNames";
import { Popper } from "@mui/material";
import { colors } from "../../theme";
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
  markerLabel?: string;
};

const BLOAT_NPC_ID = 8359;
const BLOAT_DOWN_ICON_URL = resolveNpcAttackImageUrl(8082, BLOAT_NPC_ID);
const PHASE_MARKER_ICON_SIZE = 28;
const PHASE_MARKER_SUBLABEL_HEIGHT = 15;
const PHASE_MARKER_BOX_WIDTH = 60;
/** Extra gap between the marker bottom and the top of the reference line. */
const PHASE_MARKER_LINE_GAP = 8;

interface DpsPointTooltipProps {
  /** Chart timestamp (fight-time ms) to render as the tooltip time. */
  timestamp: number;
  /** Optional context line (e.g. a phase-marker label). */
  markerLabel?: string;
  dpsEntries: Array<{ value: number; color?: string }>;
}

/** Shared DPS-chart tooltip body: time, optional label, and DPS value(s). */
const DpsPointTooltip: React.FC<DpsPointTooltipProps> = ({
  timestamp,
  markerLabel,
  dpsEntries,
}) => {
  const labelDate = new Date(timestamp);
  if (isNaN(labelDate.getTime())) {
    return null;
  }

  const isoTimeString = labelDate.toISOString().substr(11, 12);

  return (
    <ChartTooltip>
      <ChartTooltipTime>{isoTimeString}</ChartTooltipTime>
      <ChartTooltipDivider />
      {markerLabel && (
        <div className="chart-tooltip__missed-label">{markerLabel}</div>
      )}
      {dpsEntries.map((entry, index) => (
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
      ))}
    </ChartTooltip>
  );
};

interface PhaseMarkerLabelProps {
  viewBox?: { x: number; y: number; height: number };
  iconUrl: string;
  title: string;
  /** Fight-time ms of the event, always shown in the tooltip. */
  fightTimeMs: number;
  /** DPS at this point, shown in the tooltip like the chart hover tooltip. */
  dps: number;
  /** Optional caption rendered directly beneath the icon (e.g. "70%"). */
  subLabel?: string;
}

/** Icon (+ optional caption) with tooltip drawn above a phase-divider line. */
const PhaseMarkerLabel: React.FC<PhaseMarkerLabelProps> = ({
  viewBox,
  iconUrl,
  title,
  fightTimeMs,
  dps,
  subLabel,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  if (!viewBox || viewBox.x == null) {
    return null;
  }

  const contentHeight =
    PHASE_MARKER_ICON_SIZE + (subLabel ? PHASE_MARKER_SUBLABEL_HEIGHT : 0);

  return (
    <foreignObject
      x={viewBox.x - PHASE_MARKER_BOX_WIDTH / 2}
      y={(viewBox.y ?? 0) - contentHeight - PHASE_MARKER_LINE_GAP}
      width={PHASE_MARKER_BOX_WIDTH}
      height={contentHeight}
      style={{ overflow: "visible", pointerEvents: "all" }}
    >
      <div
        {...({
          xmlns: "http://www.w3.org/1999/xhtml",
        } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <span
          className="dps-chart-phase-marker"
          onMouseEnter={(event) => setAnchorEl(event.currentTarget)}
          onMouseLeave={() => setAnchorEl(null)}
        >
          <img
            src={iconUrl}
            alt=""
            className="boosts-chart-attack-icon"
            style={{
              maxWidth: PHASE_MARKER_ICON_SIZE,
              maxHeight: PHASE_MARKER_ICON_SIZE,
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
          />
          {subLabel && (
            <span className="dps-chart-phase-marker__caption">{subLabel}</span>
          )}
        </span>
        <Popper
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          placement="top"
          modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
          sx={{ zIndex: 1500, pointerEvents: "none" }}
        >
          <DpsPointTooltip
            timestamp={fightTimeMs}
            markerLabel={title}
            dpsEntries={[{ value: dps }]}
          />
        </Popper>
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

  const dpsEntries = payload
    .filter((entry) => typeof entry.value === "number")
    .map((entry) => ({ value: entry.value as number, color: entry.color }));

  return (
    <DpsPointTooltip
      timestamp={typeof label === "number" ? label : Number(label)}
      markerLabel={payload[0]?.payload?.markerLabel}
      dpsEntries={dpsEntries}
    />
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

function attachMarkerLabels(
  points: { timestamp: number; dps: number }[],
  windows: BloatDownWindow[],
  maidenMarkers: MaidenPhaseMarker[],
  startTime: number,
  endTime: number,
  tickMs: number,
): DpsChartPoint[] {
  if (windows.length === 0 && maidenMarkers.length === 0) {
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

  for (const marker of maidenMarkers) {
    const markerTs = snapFightTimeToTick(
      marker.fightTimeMs,
      startTime,
      endTime,
      tickMs,
    );
    labelsByTimestamp.set(markerTs, `${marker.label} Nylocas Matomenos Spawn`);
  }

  return points.map((point) => {
    // Exact start/end (or Maiden) labels take precedence at their tick.
    const exact = labelsByTimestamp.get(point.timestamp);
    if (exact) {
      return { ...point, markerLabel: exact };
    }
    // Anywhere inside a shaded Down window, report which Down it is.
    const window = windows.find(
      (w) =>
        point.timestamp >= w.startFightTimeMs &&
        point.timestamp <= w.endFightTimeMs,
    );
    return window
      ? { ...point, markerLabel: `Down ${window.downNumber}` }
      : point;
  });
}

/** Shared deep red for all boss phase-divider lines (Bloat downs, Maiden). */
const PHASE_DIVIDER_LINE_COLOR = colors.text.damageDark;

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
  const maidenPhaseMarkers = useMemo(
    () => getMaidenPhaseMarkers(markerSource),
    [markerSource],
  );

  const topMarkerMargin =
    maidenPhaseMarkers.length > 0 ? 54 : bloatDownWindows.length > 0 ? 44 : 16;

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
    return attachMarkerLabels(
      densified,
      bloatDownWindows,
      maidenPhaseMarkers,
      startTime,
      endTime,
      TICK_DURATION_MS,
    );
  }, [
    filteredLogs,
    interval,
    startTime,
    endTime,
    bloatDownWindows,
    maidenPhaseMarkers,
  ]);

  const dpsByTimestamp = useMemo(() => {
    const map = new Map<number, number>();
    for (const point of dpsData) {
      map.set(point.timestamp, point.dps);
    }
    return map;
  }, [dpsData]);

  /** DPS plotted at the tick nearest a marker, matching the chart hover tooltip. */
  const dpsAtFightTime = (fightTimeMs: number): number => {
    const ts = snapFightTimeToTick(
      fightTimeMs,
      startTime,
      endTime,
      TICK_DURATION_MS,
    );
    return dpsByTimestamp.get(ts) ?? 0;
  };

  const axisLabelEvery = Math.max(1, Math.ceil(dpsData.length / 5));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={dpsData}
        margin={{
          top: topMarkerMargin,
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
          <ReferenceArea
            key={`bloat-down-area-${window.downNumber}`}
            x1={window.startFightTimeMs}
            x2={window.endFightTimeMs}
            stroke="none"
            fill={PHASE_DIVIDER_LINE_COLOR}
            fillOpacity={0.18}
            ifOverflow="visible"
          />
        ))}

        {bloatDownWindows.map((window) => (
          <React.Fragment key={`bloat-down-${window.downNumber}`}>
            <ReferenceLine
              x={window.startFightTimeMs}
              stroke={PHASE_DIVIDER_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="6 3"
              ifOverflow="visible"
              label={
                <PhaseMarkerLabel
                  iconUrl={BLOAT_DOWN_ICON_URL}
                  title={`Down ${window.downNumber} Start`}
                  fightTimeMs={window.startFightTimeMs}
                  dps={dpsAtFightTime(window.startFightTimeMs)}
                />
              }
            />
            {window.endsWithStomp && (
              <ReferenceLine
                x={window.endFightTimeMs}
                stroke={PHASE_DIVIDER_LINE_COLOR}
                strokeWidth={2}
                strokeDasharray="6 3"
                ifOverflow="visible"
                label={
                  <PhaseMarkerLabel
                    iconUrl={BLOAT_STOMP_IMAGE_URL}
                    title={`Down ${window.downNumber} End`}
                    fightTimeMs={window.endFightTimeMs}
                    dps={dpsAtFightTime(window.endFightTimeMs)}
                  />
                }
              />
            )}
          </React.Fragment>
        ))}

        {maidenPhaseMarkers.map((marker) => (
          <ReferenceLine
            key={`maiden-phase-${marker.waveNumber}`}
            x={marker.fightTimeMs}
            stroke={PHASE_DIVIDER_LINE_COLOR}
            strokeWidth={2}
            strokeDasharray="6 3"
            ifOverflow="visible"
            label={
              <PhaseMarkerLabel
                iconUrl={NYLOCAS_MATOMENOS_IMAGE_URL}
                title={`${marker.label} Nylocas Matomenos Spawn`}
                fightTimeMs={marker.fightTimeMs}
                dps={dpsAtFightTime(marker.fightTimeMs)}
                subLabel={marker.label}
              />
            }
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DPSChart;
