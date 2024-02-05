import React from 'react';
import { Fight } from './FileParser';

interface EventsTableProps {
    logs: Fight['data'];
}

const EventsTable: React.FC<EventsTableProps> = ({ logs }) => {
    return (
        <div className="logs-box" style={{ height: '500px', overflowY: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                <tr>
                    <th style={cellStyle}>Date</th>
                    <th style={cellStyle}>Time</th>
                    <th style={cellStyle}>Timezone</th>
                    <th style={cellStyle}>Target</th>
                    <th style={cellStyle}>HitsplatName</th>
                    <th style={cellStyle}>DamageAmount</th>
                    <th style={cellStyle}>Source</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log, index) => (
                    <tr key={index}>
                        <td style={cellStyle}>{log.date}</td>
                        <td style={cellStyle}>{log.time}</td>
                        <td style={cellStyle}>{log.timezone}</td>
                        <td style={cellStyle}>{log.target}</td>
                        <td style={cellStyle}>{log.hitsplatName}</td>
                        <td style={cellStyle}>{log.damageAmount}</td>
                        <td style={cellStyle}>{log.source}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

const cellStyle: React.CSSProperties = {
    border: '1px solid white',
    padding: '8px',
};

export default EventsTable;
