import React, {useMemo, useState} from 'react';
import '../App.css';
import Dropzone from './Dropzone';
import {Fight, LogLine} from '../FileParser';
import DamageDone from './sections/DamageDone';
import {CircularProgress, Tab, Tabs} from '@mui/material';
import {DamageMaxMeHitsplats, DamageMeHitsplats, DamageOtherHitsplats} from "../HitsplatNames";
import EventsTable from './EventsTable';
import Instructions from "./Instructions";
import {convertTimeToMillis} from "./charts/DPSChart";
import GroupDamagePieChart from "./charts/GroupDamagePieChart";
import Combobox from './Combobox';

function App() {
    const [worker] = useState<Worker>(() => {
        const worker = new Worker(new URL("FileParserWorker.ts", import.meta.url));

        worker.onmessage = (event) => {
            const {type, progress, parseResultMessage, item} = event.data;
            if (type === 'progress') {
                setParsingProgress(progress);
            } else if (type === 'parseResult') {
                setFightNames(parseResultMessage.fightNames);
                setSelectedLogs(parseResultMessage.firstResult);
                setParseInProgress(false);
                setFightDuration(getFightDuration(parseResultMessage.firstResult));
            } else if (type === 'item') {
                setSelectedLogs(item);
                setFightDuration(getFightDuration(item));
            }
        };

        return worker;
    });

    const [fightNames, setFightNames] = useState<string[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>('DamageDone');
    const [fightDuration, setFightDuration] = useState<string>("");

    const [parseInProgress, setParseInProgress] = useState<boolean>(false);
    const [parsingProgress, setParsingProgress] = useState<number>(0);

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

    const handleParse = async (fileContent: string) => {
        setParseInProgress(true);
        worker.postMessage({type: 'parse', fileContent});
    };


    const handleDropdownChange = (index: number) => {
        worker.postMessage({type: 'getItem', index});
    };

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedTab(newValue);
    };

    interface Option {
        label: string;
        value: number;
    }

    const options: Option[] = useMemo(() => {
        if (fightNames) {
            return fightNames.map((fightName, index) => ({
                label: fightName,
                value: index,
            }));
        } else {
            return [];
        }
    }, [fightNames]);


    if (parseInProgress) {
        return (
            <div className="App">
                <header className="App-body">
                    <div className="loading-indicator-container">
                        <div className="loading-content">
                            <p>Parsing logs...</p>
                            <CircularProgress/>
                            <p>{Math.floor(parsingProgress)}%</p>
                        </div>
                    </div>
                </header>
            </div>
        );
    }

    if (!selectedLogs) {
        return (
            <div className="App">
                <header className="App-body">
                    <Instructions/>
                    <Dropzone onParse={handleParse}/>
                </header>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-body">
                <label>{selectedLogs.name}</label>
                <Combobox<Option>
                    id="monster-select"
                    items={options}
                    placeholder="Select a fight"
                    onSelectedItemChange={(item) => {
                        if (item) {
                            handleDropdownChange(item!.value)
                        }
                    }}
                />

                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth" // Maybe should be scrollable for mobile as we add more?
                >
                    <Tab
                        label="My Damage"
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
                        label="Group Damage"
                        value="GroupDamage"
                        style={{
                            color: selectedTab === 'GroupDamage' ? 'lightblue' : 'white',
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
                                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!)) &&
                                    log.target !== selectedLogs?.loggedInPlayer
                            )!,
                        }}
                    />
                )}
                {selectedTab === 'DamageTaken' && (
                    <DamageDone
                        selectedLogs={{
                            ...selectedLogs!,
                            data: selectedLogs?.data.filter(
                                (log) =>
                                    (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!)) &&
                                    log.target === selectedLogs?.loggedInPlayer
                            )!,
                        }}
                    />
                )}
                {selectedTab === 'GroupDamage' && (
                    <div>
                        <div className="damage-done-container">
                            <GroupDamagePieChart selectedLogs={selectedLogs!}/>
                        </div>
                        <DamageDone
                            selectedLogs={{
                                ...selectedLogs!,
                                data: selectedLogs?.data.filter(
                                    (log) =>
                                        (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                            Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                                            Object.values(DamageOtherHitsplats).includes(log.hitsplatName!)) &&
                                        selectedLogs.enemies.includes(log.target!)
                                )!,
                            }}
                        />
                    </div>
                )}
                {selectedTab === 'Events' && (
                    <EventsTable logs={selectedLogs?.data || []} height={"80vh"} showSource={true}/>
                )}
            </header>
        </div>
    );
}

export default App;
