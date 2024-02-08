import React from 'react';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { Fight } from '../FileParser';

interface EventsTableProps {
    logs: Fight['data'];
    height?: string;
    showSource?: boolean;
}

const EventsTable: React.FC<EventsTableProps> = ({ logs, height = '500px', showSource = false }) => {
    return (
        <div className="logs-box" style={{ height, overflowY: 'auto' }}>
            <TableContainer>
                <Table style={{ tableLayout: 'auto' }} >
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            {showSource && <TableCell>Source</TableCell>}
                            <TableCell>Target</TableCell>
                            <TableCell>HitsplatName</TableCell>
                            <TableCell>DamageAmount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log, index) => (
                            <TableRow key={index}>
                                <TableCell>{log.date}</TableCell>
                                <TableCell>{log.time}</TableCell>
                                {showSource && <TableCell>{log.source}</TableCell>}
                                <TableCell>{log.target}</TableCell>
                                <TableCell>{log.hitsplatName}</TableCell>
                                <TableCell>{log.damageAmount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default EventsTable;
