import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Fight, LogLine } from '../../FileParser';

interface DPSChartProps {
    fight: Fight;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const isoTimeString = new Date(label).toISOString().substr(11, 12);

        return (
            <div
                style={{
                    background: 'white',
                    color: 'black',
                    padding: '1px',
                    border: '1px solid #ccc',
                    borderRadius: '1px',
                }}
            >
                <p style={{ margin: '0' }}>
                    <strong>{isoTimeString}</strong>
                </p>
                {payload.map((entry: any, index: any) => (
                    <p key={`tooltip-entry-${index}`} style={{ margin: '0' }}>
                        {entry.name}: {entry.value.toFixed(2)} DPS
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

export const convertTimeToMillis = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const milliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000;
    return milliseconds;
};

export const calculateDPSByInterval = (data: LogLine[], interval: number) => {
    const dpsData: { timestamp: number; dps: number }[] = [];

    if (data && data.length > 0) {
        let currentIntervalStart = convertTimeToMillis(data[0].time);
        let currentIntervalTotalDamage = 0;
        let endTime = convertTimeToMillis(data[data.length - 1].time);

        for (let timestamp = currentIntervalStart; timestamp <= endTime; timestamp += interval) {
            for (let i = 0; i < data.length; i++) {
                const log = data[i];
                const logTimestamp = convertTimeToMillis(log.time);
                const totalDamage = log.damageAmount !== undefined ? log.damageAmount : 0;

                if (logTimestamp >= currentIntervalStart && logTimestamp < timestamp) {
                    currentIntervalTotalDamage += totalDamage;
                }
            }

            const intervalDuration = timestamp - currentIntervalStart;
            const dps = (currentIntervalTotalDamage / intervalDuration) * 1000;
            if (!isNaN(dps) && isFinite(dps)) {
                dpsData.push({ timestamp, dps });
            }

            // Move to the start of the next interval
            currentIntervalStart = timestamp;
            currentIntervalTotalDamage = 0;
        }
    }

    return dpsData;
};


const DPSChart: React.FC<DPSChartProps> = ({ fight }) => {
    const dpsData = calculateDPSByInterval(fight.data, 6000); // 6 second interval

    const tickInterval = Math.ceil(dpsData.length / 5);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dpsData} margin={{ top: 11, left: 60, bottom: 50 }}>
                <XAxis
                    dataKey="timestamp"
                    tickFormatter={(tick, index) =>
                        index % tickInterval === 0 ? new Date(tick).toISOString().substr(11, 8) : ''
                    }
                    label={{ value: 'Time', position: 'insideBottom', offset: -35 }}
                />
                <YAxis
                    dataKey="dps"
                    label={{
                        value: 'DPS',
                        position: 'insideLeft',
                        angle: -90,
                        offset: -40,
                        style: { textAnchor: 'middle' },
                    }}
                    width={35}
                    tickFormatter={(tick) => (tick !== 0 ? tick : '')}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: '#3c3226' }} />

                <Area type="monotone" dataKey="dps" stroke="black" fill="tan" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default DPSChart;
