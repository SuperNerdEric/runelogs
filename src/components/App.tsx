import React, {useEffect, useState} from 'react';
import '../App.css';
import Dropzone from './Dropzone';
import {Button, CircularProgress, Tab, Tabs} from '@mui/material';
import Instructions from "./Instructions";
import {BoostsTab, DamageDoneTab, DamageTakenTab, EventsTab, GroupDamageTab, TabsEnum} from './Tabs';
import {Fight, FightMetaData} from "../models/Fight";
import localforage from "localforage";
import TopBar from "./TopBar";
import {closeSnackbar, SnackbarKey, useSnackbar} from 'notistack';
import FightSelector from "./sections/FightSelector";
import {Icon} from '@iconify/react';

function App() {
    const fightsStorage = localforage.createInstance({
        name: 'myFightData'
    });

    const {enqueueSnackbar} = useSnackbar();

    const action = (snackbarId: SnackbarKey | undefined) => (
        <>
            <Button
                onClick={() => {
                    closeSnackbar(snackbarId);
                }}
                className="dismiss-button"
            >
                Dismiss
            </Button>
        </>
    );

    const [worker] = useState<Worker>(() => {
        const worker = new Worker(new URL("FileParserWorker.ts", import.meta.url));

        worker.onmessage = (event) => {
            const {type, progress, parseResultMessage, item} = event.data;
            if (type === 'progress') {
                setParsingProgress(progress);
            } else if (type === 'parseResult') {
                if (parseResultMessage.firstResult) {
                    setFightMetadata(parseResultMessage.fightMetadata);
                } else {
                    enqueueSnackbar('No fights found in log file', {variant: 'error', action});
                }

                setParseInProgress(false);
            } else if (type === 'item') {
                setSelectedLogs(item);
            }
        };

        return worker;
    });

    const [fightMetadata, setFightMetadata] = useState<FightMetaData[] | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Fight | null>(null);
    const [selectedTab, setSelectedTab] = useState<TabsEnum>(TabsEnum.DAMAGE_DONE);

    const [parseInProgress, setParseInProgress] = useState<boolean>(false);
    const [parsingProgress, setParsingProgress] = useState<number>(0);
    const [loadingStorage, setLoadingStorage] = useState<boolean>(true);

    const handleParse = async (fileContent: string) => {
        setParseInProgress(true);
        worker.postMessage({type: 'parse', fileContent});
    };

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: TabsEnum) => {
        setSelectedTab(newValue);
    };

    const handleDelete = () => {
        // Delete data from localforage and reset states
        fightsStorage.removeItem('fightData').then(() => {
            setSelectedLogs(null);
            setFightMetadata(null);
            setLoadingStorage(false);
        }).catch(error => {
            console.error("Error deleting fight data from localforage:", error);
        });
    };

    const handleSelectFight = (index: number) => {
        worker.postMessage({type: 'getItem', index});
    };

    useEffect(() => {
        // Check if fight data exists in localforage
        fightsStorage.getItem<Fight[]>('fightData')
            .then((data: Fight[] | null) => {
                if (data) {
                    setFightMetadata(data.map(fight => fight.metaData));
                }
                setLoadingStorage(false);
            })
            .catch((error: any) => {
                console.error("Error getting fight data from localforage:", error);
                setLoadingStorage(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="App">
            <div className="App-body">
                <TopBar onDeleteData={handleDelete}
                        showDeleteButton={!loadingStorage && !parseInProgress && (!!selectedLogs || !!fightMetadata)}/>
                {loadingStorage && (
                    <div className="loading-indicator-container">
                        <div className="loading-content">
                            <CircularProgress/>
                        </div>
                    </div>
                )}
                {parseInProgress && (
                    <div className="loading-indicator-container">
                        <div className="loading-content">
                            <p>Parsing logs...</p>
                            <CircularProgress/>
                            <p>{Math.floor(parsingProgress)}%</p>
                        </div>
                    </div>
                )}
                {!loadingStorage && !parseInProgress && !selectedLogs && !fightMetadata && (
                    <div>
                        <Instructions/>
                        <Dropzone onParse={handleParse}/>
                    </div>
                )}
                {!loadingStorage && !parseInProgress && !selectedLogs && fightMetadata && (
                    <div>
                        <FightSelector fights={fightMetadata!} onSelectFight={handleSelectFight}/>
                    </div>
                )}
                {!loadingStorage && !parseInProgress && selectedLogs && (
                    <div className="App-main">
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <div
                                className="back-icon-wrapper"
                                onClick={() => setSelectedLogs(null)}
                            >
                                <Icon icon="ic:round-arrow-back"/>
                            </div>
                            <label>{selectedLogs.name}</label>
                        </div>
                        <Tabs
                            value={selectedTab}
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
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
                )}
            </div>
        </div>
    );
}

export default App;
