import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {Box, CircularProgress, Tab, Tabs, Typography, Alert} from '@mui/material';
import {BoostsTab, DamageDoneTab, DamageTakenTab, EventsTab, ReplayTab, TabsEnum,} from './Tabs';
import {Fight, FightMetaData, isFight} from '../models/Fight';
import * as semver from 'semver';
import '../App.css';
import DropdownFightSelector from './sections/DropdownFightSelector';
import {Icon} from '@iconify/react';
import {getRankColor} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import MedalIcon from "./MedalIcon";
import {ActorFilter, deserializeActorFilter, serializeActorFilter} from "../utils/actorFilter";
import {deserializeEquipmentFilter, EquipmentFilter, serializeEquipmentFilter} from "../utils/equipmentFilter";
import {colors} from "../theme";

type EncounterApiFG = {
    type: 'fightGroup';
    id: string;
    name: string;
    receivingData?: boolean;
    fights: { id: string; name: string; order: number }[];
};

type EncounterApiFight = {
    type: 'fight';
    fightGroup?: string;
    fight: Fight;
    receivingData?: boolean;
    meta: {
        fightGroup?: { id: string; name: string };
        log: { id: string };
        receivingData?: boolean;
    };
};

type EncounterApi = EncounterApiFG | EncounterApiFight;

interface SelectorItem extends FightMetaData {
    id: string;
}

const Encounter: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const [fight, setFight] = useState<Fight | null>(null);
    const [group, setGroup] = useState<EncounterApiFG | null>(null);
    const [logId, setLogId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [receivingData, setReceivingData] = useState(false);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const isAggregate = window.location.pathname.startsWith('/encounter/aggregate/');

    const tabParam = searchParams.get('tab') as TabsEnum | null;
    const sourceFilter = useMemo(() => deserializeActorFilter(searchParams.get('source')), [searchParams]);
    const targetFilter = useMemo(() => deserializeActorFilter(searchParams.get('target')), [searchParams]);
    const equipmentFilter = useMemo(() => deserializeEquipmentFilter(searchParams.get('equipment')), [searchParams]);
    const eventTypeFilter = searchParams.get('eventType');
    const isValidTab = Object.values(TabsEnum).includes(tabParam as TabsEnum);
    const [selectedTab, setSelectedTab] = useState<TabsEnum>(
        isValidTab ? (tabParam as TabsEnum) : TabsEnum.DAMAGE_DONE
    );

    // Sync tab state with URL (back/forward buttons)
    useEffect(() => {
        const currentTab = searchParams.get('tab') as TabsEnum | null;
        const isValid = Object.values(TabsEnum).includes(currentTab as TabsEnum);
        if (isValid && currentTab !== selectedTab) {
            setSelectedTab(currentTab as TabsEnum);
        }
    }, [searchParams, selectedTab]);

    // Ensure ?tab= is always present
    useEffect(() => {
        if (!tabParam) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', TabsEnum.DAMAGE_DONE);
            navigate(`${window.location.pathname}?${newParams.toString()}`, {replace: true});
        }
    }, [tabParam, navigate, searchParams]);

    const selectorMeta: SelectorItem[] = useMemo(() => {
        if (!group) return [];
        return group.fights
            .sort((a, b) => a.order - b.order)
            .map((f) => ({
                id: f.id,
                name: f.name,
                fightDurationTicks: 0,
                success: true,
            }));
    }, [group]);

    const fetchEncounter = useCallback(
        async (encounterId: string, asInitial = false, showLoading = true) => {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);
            try {
                const res = await fetch(
                    isAggregate
                        ? `${import.meta.env.VITE_API_URL}/fight/aggregate/${encounterId}`
                        : `${import.meta.env.VITE_API_URL}/encounter/${encounterId}`
                );
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data: EncounterApi = await res.json();

                if (data.type === 'fight') {
                    if (!isFight(data.fight)) throw new Error('Malformed fight payload');
                    setFight(data.fight);
                    setLogId(data.meta.log.id);
                    setReceivingData(Boolean(data.meta.receivingData ?? data.receivingData));

                    if (asInitial && data.meta.fightGroup?.id) {
                        await fetchEncounter(data.meta.fightGroup.id, false, showLoading);
                    }
                } else {
                    setGroup(data);
                    setReceivingData(Boolean(data.receivingData));
                    if (asInitial && data.fights.length) {
                        await fetchEncounter(data.fights[0].id, false, showLoading);
                    }
                }
            } catch (e: any) {
                setError(e.message || 'Unknown error');
            } finally {
                if (showLoading) {
                    setLoading(false);
                }
            }
        },
        [isAggregate]
    );

    const handleSelectFight = useCallback(
        (index: number) => {
            if (!group) return;
            const f = group.fights[index];
            if (!f) return;

            const newParams = new URLSearchParams(searchParams);
            const tabValue = newParams.get('tab') ?? TabsEnum.DAMAGE_DONE;

            // Push new fight ID and preserve tab query
            const basePath = isAggregate ? '/encounter/aggregate' : '/encounter';
            navigate(`${basePath}/${f.id}?tab=${encodeURIComponent(tabValue)}`);
        },
        [group, navigate, searchParams, isAggregate]
    );

    const updateActorFilter = useCallback(
        (key: 'source' | 'target', filter: ActorFilter | null) => {
            const newParams = new URLSearchParams(searchParams);
            if (filter) {
                newParams.set(key, serializeActorFilter(filter));
            } else {
                newParams.delete(key);
            }
            navigate(`${window.location.pathname}?${newParams.toString()}`);
        },
        [navigate, searchParams]
    );

    const updateEquipmentFilter = useCallback(
        (filter: EquipmentFilter | null) => {
            const newParams = new URLSearchParams(searchParams);
            if (filter) {
                newParams.set('equipment', serializeEquipmentFilter(filter));
            } else {
                newParams.delete('equipment');
            }
            navigate(`${window.location.pathname}?${newParams.toString()}`);
        },
        [navigate, searchParams]
    );

    useEffect(() => {
        if (id) {
            setGroup(null);
            setFight(null);
            fetchEncounter(id, true, true);
        }
    }, [id, fetchEncounter]);

    useEffect(() => {
        if (!id || !receivingData || isAggregate) {
            return;
        }

        const interval = window.setInterval(() => {
            fetchEncounter(id, false, false);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [id, receivingData, isAggregate, fetchEncounter]);

    const availableTabs = useMemo(() => {
        if (!fight) return [];
        return Object.values(TabsEnum).filter((t) =>
            t === TabsEnum.REPLAY ? fight.logVersion && semver.gte(fight.logVersion, '1.2.0') : true
        );
    }, [fight]);

    // Dynamically calculate font size based on the number of tabs
    // So that for smaller screens all tabs together equal 95% of the width
    const TAB_COUNT = availableTabs.length;
    const widthPerTab = 95 / TAB_COUNT;
    const fontSize = `${widthPerTab * 0.14}vw`;

    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress color="inherit"/>
            </Box>
        );

    if (error || !fight)
        return (
            <Box m={2}>
                <Typography color="error">{error ?? 'Encounter not found'}</Typography>
            </Box>
        );

    const dropdown =
        group && (
            <DropdownFightSelector
                fights={selectorMeta}
                onSelectFight={handleSelectFight}
                selectedFightIndex={selectorMeta.findIndex((m) => m.id === fight.id)}
            />
        );

    return (
        <div className="App">
            <div className="App-main">
                <div style={{display: 'flex', alignItems: 'center', alignSelf: 'flex-start'}}>
                    <Typography
                        variant="h4"
                        color="white"
                        sx={{display: 'flex', alignItems: 'center'}}
                    >
                        {logId && (
                            <Link to={`/log/${logId}`} className="back-icon-wrapper">
                                <Box
                                    component={Icon}
                                    icon="ic:round-arrow-back"
                                    sx={{
                                        fontSize: (theme) => theme.typography.h4.fontSize,
                                        color: 'white',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            </Link>
                        )}
                        {group ? (
                            group.name
                        ) : fight.isNpc ? (
                            <a
                                href={`https://oldschool.runescape.wiki/w/${fight.mainEnemyName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                                style={{color: 'inherit'}}
                            >
                                {fight.name}
                            </a>
                        ) : (
                            fight.name
                        )}
                    </Typography>
                </div>
                {receivingData && (
                    <Alert severity="info" sx={{alignSelf: 'stretch', mb: 1}}>
                        Log is receiving more data — this page will refresh while new data arrives.
                    </Alert>
                )}
                {(fight as any)?.rank != null || (group as any)?.rank != null ? (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1, alignSelf: 'center'}}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: getRankColor((fight as any)?.rank ?? (group as any)?.rank),
                                fontWeight: 'bold',
                            }}
                        >
                            #{(fight as any)?.rank ?? (group as any)?.rank}
                        </Typography>
                        {(() => {
                            const rank = (fight as any)?.rank ?? (group as any)?.rank;
                            if (rank === 1) return <CrownIcon />;
                            if (rank === 2) return <MedalIcon color={colors.medal.silver} />;
                            if (rank === 3) return <MedalIcon color={colors.medal.bronze} />;
                            return null;
                        })()}
                    </Box>
                ) : null}
                {dropdown && <Box sx={{alignSelf: 'center'}}>{dropdown}</Box>}

                <Tabs
                    value={selectedTab}
                    onChange={(_, newTab: TabsEnum) => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('tab', newTab);
                        navigate(`${window.location.pathname}?${newParams.toString()}`);
                    }}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    style={{marginBottom: '20px'}}
                >
                    {availableTabs.map((tab) => (
                        <Tab
                            key={tab}
                            label={tab}
                            value={tab}
                            sx={{
                                color: selectedTab === tab ? 'lightblue' : 'white',
                                minWidth: 0, // prevent MUI from enforcing a default min width
                                '@media (max-width:500px)': {
                                    padding: '6px 6px',
                                    fontSize: fontSize,
                                },
                            }}
                        />
                    ))}
                </Tabs>

                {selectedTab === TabsEnum.DAMAGE_DONE && (
                    <DamageDoneTab
                        selectedLogs={fight}
                        sourceFilter={sourceFilter}
                        targetFilter={targetFilter}
                        equipmentFilter={equipmentFilter}
                        onSelectSourceFilter={(filter) => updateActorFilter('source', filter)}
                        onSelectTargetFilter={(filter) => updateActorFilter('target', filter)}
                        onSelectEquipmentFilter={updateEquipmentFilter}
                        onClearSourceFilter={() => updateActorFilter('source', null)}
                        onClearTargetFilter={() => updateActorFilter('target', null)}
                        onClearEquipmentFilter={() => updateEquipmentFilter(null)}
                    />
                )}
                {selectedTab === TabsEnum.DAMAGE_TAKEN && (
                    <DamageTakenTab
                        selectedLogs={fight}
                        sourceFilter={sourceFilter}
                        targetFilter={targetFilter}
                        equipmentFilter={equipmentFilter}
                        onSelectSourceFilter={(filter) => updateActorFilter('source', filter)}
                        onSelectTargetFilter={(filter) => updateActorFilter('target', filter)}
                        onSelectEquipmentFilter={updateEquipmentFilter}
                        onClearSourceFilter={() => updateActorFilter('source', null)}
                        onClearTargetFilter={() => updateActorFilter('target', null)}
                        onClearEquipmentFilter={() => updateEquipmentFilter(null)}
                    />
                )}
                {selectedTab === TabsEnum.BOOSTS && <BoostsTab selectedLogs={fight}/>}
                {selectedTab === TabsEnum.EVENTS && (
                    <EventsTab
                        selectedLogs={fight}
                        sourceFilter={sourceFilter}
                        targetFilter={targetFilter}
                        equipmentFilter={equipmentFilter}
                        onSelectSourceFilter={(filter) => updateActorFilter('source', filter)}
                        onSelectTargetFilter={(filter) => updateActorFilter('target', filter)}
                        onSelectEquipmentFilter={updateEquipmentFilter}
                        onClearSourceFilter={() => updateActorFilter('source', null)}
                        onClearTargetFilter={() => updateActorFilter('target', null)}
                        onClearEquipmentFilter={() => updateEquipmentFilter(null)}
                        eventTypeFilter={eventTypeFilter}
                        onSelectEventTypeFilter={(eventType) => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set('eventType', eventType);
                            navigate(`${window.location.pathname}?${newParams.toString()}`);
                        }}
                        onClearEventTypeFilter={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('eventType');
                            navigate(`${window.location.pathname}?${newParams.toString()}`);
                        }}
                    />
                )}
                {selectedTab === TabsEnum.REPLAY && <ReplayTab selectedLogs={fight}/>}
            </div>
        </div>
    );
};

export default Encounter;
