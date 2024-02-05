import React, { useState } from 'react';
import '../App.css';
import Dropzone from './Dropzone';
import {Fight, LogLine, parseFileContent} from '../FileParser';
import DamageDone from './sections/DamageDone';
import { Tabs, Tab } from '@mui/material';
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "../HitsplatNames";
import EventsTable from './EventsTable';
import Instructions from "./Instructions";
import {convertTimeToMillis} from "./charts/DPSChart";

export const PLAYER_NAME = "Million Pies";

function App() {
    const [parsedResult, setParsedResult] = useState<Fight[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>('DamageDone');
    const [fightDuration, setFightDuration] = useState<string>("");

    const calculateFightDuration = (logs: LogLine[]) => {
        if (logs.length === 0) {
            return 0;
        }

        const startTime = convertTimeToMillis(logs[0].time);
        const endTime = convertTimeToMillis(logs[logs.length - 1].time);

        return endTime - startTime;
    };
    function getFightDuration(selectedLog: Fight) {
        const fightDurationMilliseconds = calculateFightDuration(selectedLog!.data);
        const duration = new Date(Date.UTC(0, 0, 0, 0, 0, 0, fightDurationMilliseconds));
        const minutes = duration.getUTCMinutes();
        const seconds = duration.getUTCSeconds();
        const milliseconds = duration.getUTCMilliseconds();

        const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
        return formattedDuration;
    }

    function setAllLogs(result: Fight[]) {
        let allLogs: Fight = {
            data: [],
            name: 'All',
        };

        result.forEach((fight) => {
            allLogs.data.push(...fight.data);
        });

        setSelectedLogs(allLogs);
        const formattedDuration = getFightDuration(allLogs);
        setFightDuration(formattedDuration);
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
            const formattedDuration = getFightDuration(selectedLog);
            setFightDuration(formattedDuration);
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
                    <Tab
                        label="Events"
                        value="Events"
                        style={{
                            color: selectedTab === 'Events' ? 'lightblue' : 'white',
                        }}
                    />
                </Tabs>

                <div>
                    <p>Fight Duration: {fightDuration}</p>
                </div>
                {selectedTab === 'DamageDone' && (
                    <DamageDone
                        selectedLogs={{
                            ...selectedLogs!,
                            data: selectedLogs?.data.filter(
                                (log) =>
                                    (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                                        log.hitsplatName === 'BLOCK_ME') &&
                                    log.target !== PLAYER_NAME
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
                                    log.target === PLAYER_NAME
                            )!,
                        }}
                        handleDropdownChange={handleDropdownChange}
                    />
                )}
                {selectedTab === 'Events' && (
                    <EventsTable logs={selectedLogs?.data || []} height={"80vh"} showSource={true}/>
                )}
            </header>
        </div>
    );
}

export default App;
