import React from 'react';
import { Fight } from '../FileParser';

interface EventsTableProps {
    logs: Fight['data'];
    height?: string;
    showSource?: boolean;
}

const EventsTable: React.FC<EventsTableProps> = ({ logs, height = '500px', showSource = false  }) => {
    return (
        <div className="logs-box" style={{ height, overflowY: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                <tr>
                    <th style={cellStyle}>Date</th>
                    <th style={cellStyle}>Time</th>
                    {showSource && <th style={cellStyle}>Source</th>}
                    <th style={cellStyle}>Target</th>
                    <th style={cellStyle}>HitsplatName</th>
                    <th style={cellStyle}>DamageAmount</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log, index) => (
                    <tr key={index}>
                        <td style={cellStyle}>{log.date}</td>
                        <td style={cellStyle}>{log.time}</td>
                        {showSource && <td style={cellStyle}>{log.source}</td>}
                        <td style={cellStyle}>{log.target}</td>
                        <td style={cellStyle}>{log.hitsplatName}</td>
                        <td style={cellStyle}>{log.damageAmount}</td>
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
    fontSize: '30px',
};

export default EventsTable;
