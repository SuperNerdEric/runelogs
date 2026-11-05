import React, { useMemo } from "react";
import { Fight } from "../models/Fight";
import { calculateDPS } from "../CalculateDPS";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import TableColumnHeaderTooltip from "./TableColumnHeaderTooltip";
import { COLUMN_TOOLTIPS } from "../utils/columnTooltips";
import { calculateAccuracy, formatHHmmss } from "../utils/utils";
import { LogLine, LogTypes } from "../models/LogLine";

interface ResultsProps {
  fight: Fight;
}

const Results: React.FC<ResultsProps> = ({ fight }) => {
  const { fightDuration, damage, dps, accuracy } = useMemo(() => {
    const fightLengthMs = (fight.metaData.fightDurationTicks ?? 0) * 600;
    return {
      fightDuration: formatHHmmss(fightLengthMs, true),
      damage: fight.data
        .filter((log) => log.type === LogTypes.DAMAGE)
        .reduce(
          (acc, log) =>
            acc + (log as LogLine & { type: LogTypes.DAMAGE }).damageAmount,
          0,
        ),
      dps: calculateDPS(fight),
      accuracy: calculateAccuracy(fight),
    };
  }, [fight]);

  return (
    <TableContainer>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <strong>Duration</strong>
            </TableCell>
            <TableCell>{fightDuration}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <strong>Damage</strong>
            </TableCell>
            <TableCell>{damage}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <TableColumnHeaderTooltip
                label="DPS"
                tooltip={COLUMN_TOOLTIPS.dps}
              />
            </TableCell>
            <TableCell>
              {isNaN(dps) || !isFinite(dps) ? "N/A" : dps.toFixed(3)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <TableColumnHeaderTooltip
                label="Accuracy"
                tooltip={COLUMN_TOOLTIPS.accuracy}
              />
            </TableCell>
            <TableCell>{accuracy.toFixed(2)}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default React.memo(Results);
