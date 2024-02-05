import React, {useEffect, useState} from 'react';
import {Fight} from "../FileParser";
import HitDistributionChart from "../charts/HitDistributionChart";
import EventsTable from "../EventsTable";
import {DamageMaxMeHitsplats, DamageMeHitsplats, HitsplatNames} from "../HitsplatNames";
import {calculateDPS} from "../CalculateDPS";
import DPSChart from "../charts/DPSChart";

interface LogsSelectionProps {
    selectedLogs: Fight;
    handleDropdownChange: (index: number) => void;
}

const DamageDone: React.FC<LogsSelectionProps> = ({ selectedLogs, handleDropdownChange }) => {
    const [dps, setDPS] = useState<number>(0);

    const filteredData = selectedLogs.data.filter(
        (log) =>
            (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                log.hitsplatName === 'BLOCK_ME') &&
            log.target === selectedLogs.name
    );
    selectedLogs.data = filteredData;

    useEffect(() => {
        setDPS(calculateDPS(selectedLogs));
    }, [selectedLogs]);


    return (
        <div>
            {filteredData && (
                <div className="logs-container">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400' }}>
                        <HitDistributionChart fight={selectedLogs} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400' }}>
                        <DPSChart fight={selectedLogs} />
                    </div>

                    <p>DPS: {dps.toFixed(3)}</p>
                    <h2></h2>
                    <div className="events-table-container">
                        <EventsTable logs={selectedLogs.data} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DamageDone;
