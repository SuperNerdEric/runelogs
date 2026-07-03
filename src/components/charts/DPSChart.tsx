import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fight } from "../../models/Fight";
import { DamageLog, filterByType, LogTypes } from "../../models/LogLine";

interface DPSChartProps {
  fight: Fight;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const labelDate = new Date(label);
    if (isNaN(labelDate.getTime())) {
      return null;
    }

    const isoTimeString = labelDate.toISOString().substr(11, 12);

    return (
      <div>
        <p style={{ margin: "0" }}>
          <strong>{isoTimeString}</strong>
        </p>
        {payload.map((entry: any, index: any) => (
          <p key={`tooltip-entry-${index}`} style={{ margin: "0" }}>
            {entry.name}: {entry.value.toFixed(2)} DPS
          </p>
        ))}
      </div>
    );
  }

  return null;
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

const DPSChart: React.FC<DPSChartProps> = ({ fight }) => {
  const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);

  const fightLengthMs = (fight.metaData.fightDurationTicks ?? 0) * 600;
  const interval = Math.min(Math.max(fightLengthMs / 4, 600), 6000);

  const startTime = fight.firstLine.fightTimeMs ?? 0;
  const endTime = fight.lastLine.fightTimeMs ?? startTime;
  const dpsData = calculateDPSByInterval(
    filteredLogs,
    interval,
    startTime,
    endTime,
  );

  const tickInterval = Math.ceil(dpsData.length / 5);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={dpsData} margin={{ top: 11, left: 40, bottom: 0 }}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(tick, index) =>
            index % tickInterval === 0
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
          content={(props) => <CustomTooltip {...props} />}
          cursor={{ fill: "#3c3226" }}
        />

        <Area type="monotone" dataKey="dps" stroke="black" fill="tan" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DPSChart;
