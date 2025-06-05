import React, {useEffect, useState} from 'react';
import {Fight} from "../models/Fight";
import {calculateDPS} from "../CalculateDPS";
import {Table, TableBody, TableCell, TableContainer, TableRow} from '@mui/material';
import {calculateAccuracy, formatHHmmss} from "../utils/utils";
import {LogLine, LogTypes} from "../models/LogLine";

interface ResultsProps {
    fight: Fight;
}

const Results: React.FC<ResultsProps> = ({fight}) => {
    const [fightDuration, setFightDuration] = useState<string>("");
    const [damage, setDamage] = useState<number>(0);
    const [dps, setDPS] = useState<number>(0);
    const [accuracy, setAccuracy] = useState<number>(0);

    useEffect(() => {
        const fightLengthMs = (fight.metaData.fightDurationTicks ?? 0) * 600;
        setFightDuration(formatHHmmss(fightLengthMs, true));

        const totalDamage = fight.data
            .filter(log => log.type === LogTypes.DAMAGE)
            .reduce((acc, log) => acc + (log as LogLine & { type: LogTypes.DAMAGE }).damageAmount, 0);
        setDamage(totalDamage);

        setDPS(calculateDPS(fight));
        setAccuracy(calculateAccuracy(fight));
    }, [fight]);

    return (
        <div className="results-container">
            <TableContainer>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <strong>Duration</strong>
                            </TableCell>
                            <TableCell>
                                {fightDuration}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <strong>Damage</strong>
                            </TableCell>
                            <TableCell>
                                {damage}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <strong>DPS</strong>
                            </TableCell>
                            <TableCell>
                                {isNaN(dps) || !isFinite(dps) ? 'N/A' : dps.toFixed(3)}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <strong>Accuracy</strong>
                            </TableCell>
                            <TableCell>
                                {accuracy.toFixed(2)}%
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default Results;
