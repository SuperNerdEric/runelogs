import React, { useState } from 'react';
import './App.css';
import Dropzone from './Dropzone';
import { Fight, parseFileContent } from './FileParser';
import Instructions from './Instructions';
import DamageDone from './sections/DamageDone';
import { Tabs, Tab } from '@mui/material';
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "./HitsplatNames";

function App() {
    const [parsedResult, setParsedResult] = useState<Fight[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>('DamageDone');

    function setAllLogs(result: Fight[]) {
        let allLogs: Fight = {
            data: [],
            name: 'All',
        };

        result.forEach((fight) => {
            allLogs.data.push(...fight.data);
        });

        setSelectedLogs(allLogs);
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
        }
    };

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedTab(newValue);
    };

    if (!parsedResult) {
        return (
            <div className="App">
                <header className="App-header">
                    <Instructions />
                    <Dropzone onParse={handleParse} />
                </header>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <label>Select Logs:</label>
                <select
                    style={{ width: '200px', padding: '5px', fontSize: '15px' }}
                    onChange={(e) => handleDropdownChange(parseInt(e.target.value))}
                >
                    <option value="-1">All</option>
                    {parsedResult &&
                        parsedResult.map((logs, index) => (
                            <option key={index} value={index}>
                                {logs.name}
                            </option>
                        ))}
                </select>

                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab
                        label="Damage Done"
                        value="DamageDone"
                        style={{
                            color: selectedTab === 'DamageDone' ? 'lightblue' : 'white',
                        }}
                    />
                    <Tab
                        label="Damage Taken"
                        value="DamageTaken"
                        style={{
                            color: selectedTab === 'DamageTaken' ? 'lightblue' : 'white',
                        }}
                    />
                </Tabs>

                {selectedTab === 'DamageDone' && (
                    <DamageDone
                        selectedLogs={{
                            ...selectedLogs!,
                            data: selectedLogs?.data.filter(
                                (log) =>
                                    (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                                        log.hitsplatName === 'BLOCK_ME') &&
                                    log.target === selectedLogs.name
                            )!,
                        }}
                        handleDropdownChange={handleDropdownChange}
                    />
                )}
                {selectedTab === 'DamageTaken' && (
                    <DamageDone
                        selectedLogs={{
                            ...selectedLogs!,
                            data: selectedLogs?.data.filter(
                                (log) =>
                                    (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                                        log.hitsplatName === 'BLOCK_ME') &&
                                    log.target === "Million Pies"
                            )!,
                        }}
                        handleDropdownChange={handleDropdownChange}
                    />
                )}
            </header>
        </div>
    );
}

export default App;
