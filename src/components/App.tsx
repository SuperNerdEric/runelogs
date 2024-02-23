import React, {useEffect, useMemo, useState} from 'react';
import '../App.css';
import Dropzone from './Dropzone';
import {CircularProgress, Tab, Tabs} from '@mui/material';
import Instructions from "./Instructions";
import Combobox from './Combobox';
import {BoostsTab, DamageDoneTab, DamageTakenTab, EventsTab, GroupDamageTab, TabsEnum} from './Tabs';
import {Fight} from "../models/Fight";
import localforage from "localforage";
import TopBar from "./TopBar";

function App() {
    const fightsStorage = localforage.createInstance({
        name: 'myFightData'
    });

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
            } else if (type === 'item') {
                setSelectedLogs(item);
            }
        };

        return worker;
    });

    const [fightNames, setFightNames] = useState<string[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [selectedTab, setSelectedTab] = useState<TabsEnum>(TabsEnum.DAMAGE_DONE);

    const [parseInProgress, setParseInProgress] = useState<boolean>(false);
    const [parsingProgress, setParsingProgress] = useState<number>(0);
    const [loadingStorage, setLoadingStorage] = useState<boolean>(true);

    const handleParse = async (fileContent: string) => {
        setParseInProgress(true);
        worker.postMessage({type: 'parse', fileContent});
    };


    const handleDropdownChange = (index: number) => {
        worker.postMessage({type: 'getItem', index});
    };

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: TabsEnum) => {
        setSelectedTab(newValue);
    };

    const handleDelete = () => {
        // Delete data from localforage and reset states
        fightsStorage.removeItem('fightData').then(() => {
            setSelectedLogs(null);
            setFightNames(null);
            setLoadingStorage(false); // Reset loading state to trigger re-render
        }).catch(error => {
            console.error("Error deleting fight data from localforage:", error);
        });
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

    useEffect(() => {
        // Check if fight data exists in localforage
        fightsStorage.getItem<Fight[]>('fightData')
            .then((data: Fight[] | null) => {
                if (data) {
                    // If data exists, set it as selectedLogs
                    setSelectedLogs(data[0]);
                    setFightNames(data.map(fight => fight.name));
                }
                setLoadingStorage(false);
            })
            .catch((error: any) => {
                console.error("Error getting fight data from localforage:", error);
                setLoadingStorage(false);
            });
    }, [fightsStorage]);

    if (loadingStorage) {
        return (
            <div className="App">
                <div className="App-body">
                    <TopBar/>
                    <div className="loading-indicator-container">
                        <div className="loading-content">
                            <CircularProgress/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (parseInProgress) {
        return (
            <div className="App">
                <div className="App-body">
                    <TopBar/>
                    <div className="loading-indicator-container">
                        <div className="loading-content">
                            <p>Parsing logs...</p>
                            <CircularProgress/>
                            <p>{Math.floor(parsingProgress)}%</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedLogs) {
        return (
            <div className="App">
                <div className="App-body">
                    <TopBar/>
                    <Instructions/>
                    <Dropzone onParse={handleParse}/>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            <div className="App-body">
                <TopBar onDeleteData={handleDelete}/>
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
                    style={{
                        marginBottom: '20px',
                    }}
                >
                    {Object.values(TabsEnum).map((tab) => (
                        <Tab
                            key={tab}
                            label={tab}
                            value={tab}
                            style={{
                                color: selectedTab === tab ? 'lightblue' : 'white',
                            }}
                        />
                    ))}
                </Tabs>

                {selectedTab === TabsEnum.DAMAGE_DONE && <DamageDoneTab selectedLogs={selectedLogs}/>}
                {selectedTab === TabsEnum.DAMAGE_TAKEN && <DamageTakenTab selectedLogs={selectedLogs}/>}
                {selectedTab === TabsEnum.BOOSTS && <BoostsTab selectedLogs={selectedLogs}/>}
                {selectedTab === TabsEnum.GROUP_DAMAGE && <GroupDamageTab selectedLogs={selectedLogs}/>}
                {selectedTab === TabsEnum.EVENTS && <EventsTab selectedLogs={selectedLogs}/>}
            </div>
        </div>
    );
}

export default App;
