import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fight } from "../../models/Fight";
import { filterByType, LogTypes } from "../../models/LogLine";
import { HitsplatFilter } from "../../utils/hitsplatFilter";

const HITSPLAT_BAR_COLOR = "tan";

interface HitDistributionChartProps {
  fight: Fight;
  hitsplatFilter?: HitsplatFilter | null;
  onSelectHitsplatFilter?: (filter: HitsplatFilter) => void;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div>
        <p style={{ margin: "0" }}>
          <strong>{label}</strong>
        </p>
        {payload.map((entry: any, index: any) => (
          <p key={`tooltip-entry-${index}`} style={{ margin: "0" }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const HitDistributionChart: React.FC<HitDistributionChartProps> = ({
  fight,
  hitsplatFilter = null,
  onSelectHitsplatFilter,
}) => {
  const [tooltipSuppressed, setTooltipSuppressed] = useState(false);

  const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);
  const hitsplatAmounts = filteredLogs.map((log) => log.damageAmount);

  const data = hitsplatAmounts.reduce(
    (acc, amount) => {
      acc[amount] = (acc[amount] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const chartData = Object.keys(data).map((key) => ({
    hitsplatAmount: parseInt(key, 10),
    frequency: data[parseInt(key, 10)],
  }));

  const chartKey = useMemo(
    () =>
      `${hitsplatFilter?.amount ?? "all"}:${chartData
        .map((entry) => entry.hitsplatAmount)
        .join(",")}`,
    [chartData, hitsplatFilter?.amount],
  );

  return (
    <div
      onMouseLeave={() => setTooltipSuppressed(false)}
      style={{ width: "100%", height: 180 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          key={chartKey}
          data={chartData}
          margin={{ top: 11, left: 60, bottom: 30 }}
        >
          <XAxis
            dataKey="hitsplatAmount"
            label={{ value: "Hitsplat", position: "insideBottom", offset: -20 }}
          />
          <YAxis
            dataKey="frequency"
            label={{
              value: "Frequency",
              position: "insideLeft",
              angle: -90,
              offset: -25,
              style: { textAnchor: "middle" },
            }}
            width={35}
          />
          <Tooltip
            content={(props) => <CustomTooltip {...props} />}
            active={tooltipSuppressed ? false : undefined}
            cursor={tooltipSuppressed ? false : { fill: "#3c3226" }}
          />

          <Bar
            dataKey="frequency"
            fill={HITSPLAT_BAR_COLOR}
            isAnimationActive={false}
            cursor={onSelectHitsplatFilter ? "pointer" : "default"}
            onClick={(barData) => {
              if (
                !onSelectHitsplatFilter ||
                barData?.hitsplatAmount === undefined
              ) {
                return;
              }
              setTooltipSuppressed(true);
              onSelectHitsplatFilter({ amount: barData.hitsplatAmount });
            }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.hitsplatAmount} fill={HITSPLAT_BAR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HitDistributionChart;
