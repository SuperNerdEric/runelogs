import React, {useEffect, useState} from 'react';
import '../App.css';
import Dropzone from './Dropzone';
import {Button, CircularProgress, Tab, Tabs} from '@mui/material';
import Instructions from './Instructions';
import {BoostsTab, DamageDoneTab, DamageTakenTab, EventsTab, ReplayTab, TabsEnum} from './Tabs';
import {Fight, isFight} from '../models/Fight';
import localforage from 'localforage';
import {closeSnackbar, SnackbarKey, useSnackbar} from 'notistack';
import FightSelector from './sections/FightSelector';
import {Icon} from '@iconify/react';
import TickActivity from './performance/TickActivity';
import {FightGroupMetaData, getFightGroupMetadata, isFightGroupMetadata} from "../models/FightGroup";
import DropdownFightSelector from './sections/DropdownFightSelector';
import {Encounter, EncounterMetaData} from '../models/LogLine';
import {useAuth0} from "@auth0/auth0-react";
import {useLocation} from "react-router-dom";


import ReactGA from 'react-ga4';
import * as semver from "semver";

function App() {
    const {isAuthenticated, user, loginWithRedirect, logout, getAccessTokenSilently} = useAuth0();

    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated) {
            getAccessTokenSilently().then(() => {
                console.log("User authenticated:", user);
            }).catch((err) => {
                console.warn("Token fetch failed:", err.message);
            });
        }
    }, [isAuthenticated, getAccessTokenSilently, user]);

    useEffect(() => {
        ReactGA.initialize('G-XL7FZPRS36');
        ReactGA.send({hitType: 'pageview'});
    }, []);

    const fightsStorage = localforage.createInstance({
        name: 'myFightData',
    });

    const [loadingAggregate, setLoadingAggregate] = useState<boolean>(false);
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
        const worker = new Worker(new URL('FileParserWorker.ts', import.meta.url));

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
                setSelectedFight(item);
                setLoadingAggregate(false);
            }
        };

        return worker;
    });

    const [fightMetadata, setFightMetadata] = useState<EncounterMetaData[] | null>(null);
    const [selectedFightMetadataIndex, setSelectedFightMetadataIndex] = useState<number | null>(null);
    const [selectedFightGroupIndex, setSelectedFightGroupIndex] = useState<number | undefined>(undefined);
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
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

    const handleSelectFight = (index: number, fightGroupIndex?: number) => {
        worker.postMessage({type: 'getItem', index, fightGroupIndex: fightGroupIndex});
        setSelectedFightMetadataIndex(index);
        setSelectedFightGroupIndex(fightGroupIndex);
    };

    const handleSelectAggregateFight = (indices: number[]) => {
        worker.postMessage({type: 'getAggregateItems', indices});
        setLoadingAggregate(true);
        setSelectedFightMetadataIndex(indices[0]);
    };

    const handleFightGroupSelectFight = (fightGroupIndex: number) => {
        worker.postMessage({type: 'getItem', index: selectedFightMetadataIndex, fightGroupIndex: fightGroupIndex});
        setSelectedFightGroupIndex(fightGroupIndex);
    };

    const renderDropdownFightSelector = () => {
        if (
            selectedFightMetadataIndex !== null &&
            fightMetadata &&
            isFightGroupMetadata(fightMetadata[selectedFightMetadataIndex])
        ) {
            const fightGroupMetaData = fightMetadata[selectedFightMetadataIndex] as FightGroupMetaData;
            return (
                <div>
                    <DropdownFightSelector
                        fights={fightGroupMetaData.fights}
                        onSelectFight={handleFightGroupSelectFight}
                        selectedFightIndex={selectedFightGroupIndex}
                    />
                </div>
            );
        }
        return null;
    };

    const availableTabs = Object.values(TabsEnum).filter((tab) => {
        if (tab === TabsEnum.REPLAY) {
            return selectedFight?.logVersion && semver.gte(selectedFight?.logVersion, "1.2.0");
        }
        return true;
    });

    useEffect(() => {
        // Check if fight data exists in localforage
        fightsStorage
            .getItem<Encounter[]>('fightData')
            .then((data: Encounter[] | null) => {
                if (data) {
                    setFightMetadata(
                        data.map((fight) => {
                            if (isFight(fight)) {
                                return fight.metaData;
                            } else {
                                return getFightGroupMetadata(fight);
                            }
                        })
                    );
                }
                setLoadingStorage(false);
            })
            .catch((error: any) => {
                console.error('Error getting fight data from localforage:', error);
                setLoadingStorage(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (location.pathname === '/login') {
        loginWithRedirect();
        return null;
    }

    if (location.pathname === '/logout') {
        logout({logoutParams: {returnTo: window.location.origin}});
        return null;
    }

    return (
        <div className="App">
            <div>
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
                {!loadingStorage && !parseInProgress && !selectedFight && !fightMetadata && (
                    <div>
                        <Instructions/>
                        <Dropzone onParse={handleParse}/>
                    </div>
                )}
                {loadingAggregate && (
                    <div className="loading-indicator-container">
                        <div className="loading-content">
                            <p>Aggregating fights...</p>
                            <CircularProgress/>
                        </div>
                    </div>
                )}
                {!loadingStorage && !loadingAggregate && !parseInProgress && !selectedFight && fightMetadata && (
                    <div>
                        <FightSelector fights={fightMetadata!} onSelectFight={handleSelectFight}
                                       onSelectAggregateFight={handleSelectAggregateFight}/>
                    </div>
                )}
                {!loadingStorage && !parseInProgress && selectedFight && (
                    <div className="App-main">
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <div className="back-icon-wrapper" onClick={() => setSelectedFight(null)}>
                                <Icon icon="ic:round-arrow-back"/>
                            </div>
                            {selectedFightMetadataIndex !== null &&
                            fightMetadata &&
                            isFightGroupMetadata(fightMetadata[selectedFightMetadataIndex]) ? (
                                <label>{fightMetadata[selectedFightMetadataIndex].name}</label>
                            ) : selectedFight.isNpc ? (
                                <a
                                    href={`https://oldschool.runescape.wiki/w/${selectedFight.mainEnemyName}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link"
                                >
                                    {selectedFight.name}
                                </a>
                            ) : (
                                <label>{selectedFight.name}</label>
                            )}
                        </div>
                        {renderDropdownFightSelector()}
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
                            {availableTabs.map((tab) => (
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
                        {(selectedFight.isBoss || selectedFight.metaData.fightLengthMs >= 15000) &&
                            selectedTab !== TabsEnum.REPLAY && <TickActivity selectedLogs={selectedFight}/>}
                        {selectedTab === TabsEnum.DAMAGE_DONE && <DamageDoneTab selectedLogs={selectedFight}/>}
                        {selectedTab === TabsEnum.DAMAGE_TAKEN && <DamageTakenTab selectedLogs={selectedFight}/>}
                        {selectedTab === TabsEnum.BOOSTS && <BoostsTab selectedLogs={selectedFight}/>}
                        {selectedTab === TabsEnum.EVENTS && <EventsTab selectedLogs={selectedFight}/>}
                        {selectedTab === TabsEnum.REPLAY && <ReplayTab selectedLogs={selectedFight}/>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
