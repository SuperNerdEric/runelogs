import React, {useState} from 'react';
import './App.css';
import Dropzone from "./Dropzone";
import {Fight, parseFileContent} from "./FileParser";
import HitDistributionChart from "./charts/HitDistributionChart";
import EventsTable from "./EventsTable";
import {calculateDPS} from "./CalculateDPS";
import Instructions from "./Instructions";

function App() {

    const [parsedResult, setParsedResult] = useState<Fight[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [dps, setDPS] = useState<number>(0);

    function setAllLogs(result: Fight[]) {
        let allLogs: Fight = {
            data: [],
            name: "All"
        };

        result.forEach((fight) => {
            allLogs.data.push(...fight.data);
        });

        setSelectedLogs(allLogs);
        setDPS(calculateDPS(allLogs));
    }

    const handleParse = (fileContent: string) => {
        const result = parseFileContent(fileContent);
        console.log(result);
        setParsedResult(result);

        if (result && result.length > 0) {
            setAllLogs(result);
        }
    };

    const handleDropdownChange = (index: number) => {
        if (index === -1) {
            setAllLogs(parsedResult!);
        } else {
            const selectedLog = parsedResult?.[index]!;
            setSelectedLogs(selectedLog);
            setDPS(calculateDPS(selectedLog));
        }
    };

    if (!parsedResult) {
        return (
            <div className="App">
                <header className="App-header">
                    <Instructions/>
                    <Dropzone onParse={handleParse}/>
                </header>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <label>Select Logs:</label>
                <select onChange={(e) => handleDropdownChange(parseInt(e.target.value))}>
                    <option value="-1">All</option>
                    {parsedResult &&
                        parsedResult.map((logs, index) => (
                            <option key={index} value={index}>
                                {logs.name}
                            </option>
                        ))}
                </select>

                {selectedLogs && (
                    <div className="logs-container">
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400'}}>
                            <HitDistributionChart fight={selectedLogs}/>
                        </div>

                        <p>DPS: {dps.toFixed(3)}</p>
                        <h2>Events:</h2>
                        <EventsTable logs={selectedLogs.data}/>
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;
