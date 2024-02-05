import React, {useState} from 'react';
import './App.css';
import Dropzone from "./Dropzone";
import {Fight, parseFileContent} from "./FileParser";
import HitDistributionChart from "./HitDistributionChart";
import EventsTable from "./EventsTable";
import {calculateDPS} from "./CalculateDPS";

function App() {

    const [parsedResult, setParsedResult] = useState<Fight[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [dps, setDPS] = useState<number>(0);

    const handleParse = (fileContent: string) => {
        const result = parseFileContent(fileContent);
        console.log(result);
        setParsedResult(result);
    };

    const handleDropdownChange = (index: number) => {
        if (index === -1) {
            setSelectedLogs(null); // Reset selection
        } else if (index === -2) {
            let allLogs: Fight = {
                data: [],
                name: "All"
            }
            parsedResult?.forEach(fight => {
                allLogs.data.push(...fight.data);
            })
            setSelectedLogs(allLogs);
            setDPS(calculateDPS(allLogs));
        } else {
            const selectedLog = parsedResult?.[index]!;
            setSelectedLogs(selectedLog);
            setDPS(calculateDPS(selectedLog));
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <Dropzone onParse={handleParse} />

                {/* Dropdown to choose logs array */}
                <label>Select Logs:</label>
                <select onChange={(e) => handleDropdownChange(parseInt(e.target.value))}>
                    <option value="-1">Choose Logs</option>
                    <option value="-2">All</option>
                    {parsedResult &&
                        parsedResult.map((logs, index) => (
                            <option key={index} value={index}>
                                {logs.name}
                            </option>
                        ))}
                </select>

                {selectedLogs && (
                    <div className="logs-container">
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400' }}>
                            <HitDistributionChart fight={selectedLogs} />
                        </div>

                        <p>DPS: {dps.toFixed(3)}</p>
                        <h2>Selected Logs:</h2>
                        <EventsTable logs={selectedLogs.data} />
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;
