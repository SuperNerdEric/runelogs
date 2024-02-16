import React from 'react';
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {DamageMaxMeHitsplats, DamageMeHitsplats, DamageOtherHitsplats} from "../../HitsplatNames";
import {Fight} from "../../models/Fight";
import {filterByType, LogTypes} from "../../models/LogLine";

interface GroupDamagePieChartProps {
    selectedLogs: Fight;
}

const CustomTooltip: React.FC<any> = ({active, payload, label}) => {
    if (active && payload && payload.length) {
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
                <p style={{margin: '0'}}>
                    <strong>{label}</strong>
                </p>
                {payload.map((entry: any, index: any) => (
                    <p key={`tooltip-entry-${index}`} style={{margin: '0'}}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

const GroupDamagePieChart: React.FC<GroupDamagePieChartProps> = ({selectedLogs}) => {
    const calculateDamageByMeAndOthers = () => {
        let damageByMe = 0;
        let damageByOthers = 0;

        const filteredLogs = filterByType(selectedLogs.data, LogTypes.DAMAGE);
        filteredLogs.forEach((log) => {
            if ((Object.values(DamageMeHitsplats).includes(log.hitsplatName!) || Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!))) {
                damageByMe += log.damageAmount || 0;
            } else if (Object.values(DamageOtherHitsplats).includes(log.hitsplatName!)) {
                damageByOthers += log.damageAmount || 0;
            }
        });

        return {damageByMe, damageByOthers};
    };

    const {damageByMe, damageByOthers} = calculateDamageByMeAndOthers();

    const data = [
        {name: selectedLogs.loggedInPlayer, value: damageByMe},
        {name: 'Others', value: damageByOthers},
    ];

    const COLORS = ['tan', 'grey'];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                    ))}
                </Pie>
                <Tooltip
                    content={(props) => <CustomTooltip {...props} />}
                    cursor={{fill: '#3c3226'}}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default GroupDamagePieChart;
