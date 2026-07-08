import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import TableColumnHeaderTooltip from "../TableColumnHeaderTooltip";
import { COLUMN_TOOLTIPS } from "../../utils/columnTooltips";
import { colors } from "../../theme";
import { isUnknownPlayer } from "../../utils/actorUtils";
import { formatParsePercentileDisplay } from "../../utils/percentile";
import { getDpsPercentileColor } from "../../utils/TickActivity";

export interface DamageMeterRow {
  key: string;
  name: React.ReactNode;
  damageDealt: number;
  dps: number;
  dpsColor?: string;
  useDpsTextClass?: boolean;
  nameClassName?: string;
  percentile?: number;
}

interface DamageMeterTableProps {
  rows: DamageMeterRow[];
}

const DamageMeterTable: React.FC<DamageMeterTableProps> = ({ rows }) => {
  const [maxWidth, setMaxWidth] = useState(0);
  const totalDamage = rows.reduce((sum, row) => sum + row.damageDealt, 0);
  const highestDamage = Math.max(...rows.map((row) => row.damageDealt), 0);

  useEffect(() => {
    const handleResize = () => {
      let vwWidth = window.innerWidth * 0.7 - 300;
      if (vwWidth > 540) {
        vwWidth = 540;
      }
      setMaxWidth(vwWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const calculateBarWidth = (damage: number) => {
    if (highestDamage === 0) {
      return "0px";
    }
    return `${(damage / highestDamage) * maxWidth}px`;
  };

  const sortedRows = [...rows].sort((a, b) => b.damageDealt - a.damageDealt);

  return (
    <TableContainer
      sx={{
        "& .MuiTableCell-root": {
          fontSize: "13px",
          "@media (max-width: 768px)": {
            fontSize: "12px",
            padding: "2px 3px",
          },
        },
      }}
    >
      <Table style={{ tableLayout: "auto", width: "100%" }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: "100px", textAlign: "center" }}>
              Name
            </TableCell>
            <TableCell style={{ textAlign: "center", paddingBottom: "2px" }}>
              Amount
            </TableCell>
            <TableCell style={{ width: "70px", textAlign: "center" }}>
              <TableColumnHeaderTooltip
                label="DPS"
                tooltip={COLUMN_TOOLTIPS.dps}
              />
            </TableCell>
            <TableCell style={{ width: "70px", textAlign: "center" }}>
              <TableColumnHeaderTooltip
                label="Percentile"
                tooltip={COLUMN_TOOLTIPS.percentile}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows.map((row, index) => {
            const damagePercentage =
              totalDamage > 0
                ? Number(((row.damageDealt / totalDamage) * 100).toFixed(2))
                : 0;
            const unknown = isUnknownPlayer(row.key);

            return (
              <TableRow
                key={row.key}
                className={index % 2 === 0 ? "even-row" : "odd-row"}
                style={{ cursor: "default" }}
                onMouseEnter={(e) =>
                  e.currentTarget.classList.add("highlighted-row")
                }
                onMouseLeave={(e) =>
                  e.currentTarget.classList.remove("highlighted-row")
                }
              >
                <TableCell
                  style={{ width: "100px", textAlign: "left" }}
                  className={
                    unknown
                      ? "unknown-text"
                      : (row.nameClassName ?? "other-text")
                  }
                >
                  {row.name}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        textAlign: "left",
                        minWidth: "50px",
                        marginRight: "5px",
                      }}
                    >
                      {damagePercentage ? `${damagePercentage}%` : ""}
                    </span>
                    <div
                      style={{
                        backgroundColor: unknown
                          ? colors.text.unknown
                          : colors.dpsMeter.playerHighlight,
                        height: "14px",
                        marginRight: "10px",
                        marginTop: "3px",
                        marginBottom: "3px",
                        width: calculateBarWidth(row.damageDealt),
                      }}
                    />
                    {row.damageDealt}
                  </div>
                </TableCell>
                <TableCell
                  style={{
                    width: "70px",
                    textAlign: "right",
                    color: unknown ? colors.text.unknown : row.dpsColor,
                  }}
                  className={
                    !unknown && row.useDpsTextClass ? "dps-text" : undefined
                  }
                >
                  {row.dps.toFixed(3)}
                </TableCell>
                <TableCell
                  style={{
                    width: "70px",
                    textAlign: "right",
                    color: unknown
                      ? colors.text.unknown
                      : row.percentile !== undefined
                        ? getDpsPercentileColor(row.percentile)
                        : undefined,
                  }}
                >
                  {formatParsePercentileDisplay(row.key, row.percentile)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DamageMeterTable;
