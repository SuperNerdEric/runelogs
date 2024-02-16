import React, {useEffect, useState} from 'react';
import HitDistributionChart from "../charts/HitDistributionChart";
import EventsTable from "../EventsTable";
import {calculateDPS} from "../../CalculateDPS";
import DPSChart from "../charts/DPSChart";
import {Fight} from "../../models/Fight";

interface LogsSelectionProps {
    selectedLogs: Fight;
}

const DamageDone: React.FC<LogsSelectionProps> = ({selectedLogs}) => {
    const [dps, setDPS] = useState<number>(0);

    useEffect(() => {
        setDPS(calculateDPS(selectedLogs));
    }, [selectedLogs]);


    return (
        <div>
            {selectedLogs && (
                <div>
                    <div className="damage-done-container">
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400'}}>
                            {selectedLogs && selectedLogs.data && selectedLogs.data.length > 0 && (
                                <HitDistributionChart fight={selectedLogs}/>
                            )}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400'}}>
                            {selectedLogs && selectedLogs.data && selectedLogs.data.length > 1 && (
                                <DPSChart fight={selectedLogs}/>
                            )}
                        </div>
                        <p>DPS: {isNaN(dps) || !isFinite(dps) ? 'N/A' : dps.toFixed(3)}</p>
                    </div>
                    <EventsTable fight={selectedLogs}/>
                </div>
            )}
        </div>
    );
};

export default DamageDone;
