import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {Box, CircularProgress, Tab, Tabs, Typography} from '@mui/material';
import {BoostsTab, DamageDoneTab, DamageTakenTab, EventsTab, ReplayTab, TabsEnum,} from './Tabs';
import {Fight, FightMetaData, isFight} from '../models/Fight';
import * as semver from 'semver';
import '../App.css';
import DropdownFightSelector from './sections/DropdownFightSelector';
import {Icon} from '@iconify/react';
import {getRankColor} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import MedalIcon from "./MedalIcon";

type EncounterApiFG = {
    type: 'fightGroup';
    id: string;
    name: string;
    fights: { id: string; name: string; order: number }[];
};

type EncounterApiFight = {
    type: 'fight';
    fightGroup?: string;
    fight: Fight;
    meta: {
        fightGroup?: { id: string; name: string };
        log: { id: string };
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

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const isAggregate = window.location.pathname.startsWith('/encounter/aggregate/');

    const tabParam = searchParams.get('tab') as TabsEnum | null;
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
        async (encounterId: string, asInitial = false) => {
            setLoading(true);
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

                    if (asInitial && data.meta.fightGroup?.id) {
                        await fetchEncounter(data.meta.fightGroup.id);
                    }
                } else {
                    setGroup(data);
                    if (asInitial && data.fights.length) {
                        await fetchEncounter(data.fights[0].id);
                    }
                }
            } catch (e: any) {
                setError(e.message || 'Unknown error');
            } finally {
                setLoading(false);
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

    useEffect(() => {
        if (id) {
            setGroup(null);
            setFight(null);
            fetchEncounter(id, true);
        }
    }, [id, fetchEncounter]);

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
                <div style={{display: 'flex', alignItems: 'center'}}>
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
                {(fight as any)?.rank != null || (group as any)?.rank != null ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
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
                            if (rank === 2) return <MedalIcon color="#C0C0C0" />;
                            if (rank === 3) return <MedalIcon color="#CD7F32" />;
                            return null;
                        })()}
                    </Box>
                ) : null}
                {dropdown}

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

                {selectedTab === TabsEnum.DAMAGE_DONE && <DamageDoneTab selectedLogs={fight}/>}
                {selectedTab === TabsEnum.DAMAGE_TAKEN && <DamageTakenTab selectedLogs={fight}/>}
                {selectedTab === TabsEnum.BOOSTS && <BoostsTab selectedLogs={fight}/>}
                {selectedTab === TabsEnum.EVENTS && <EventsTab selectedLogs={fight}/>}
                {selectedTab === TabsEnum.REPLAY && <ReplayTab selectedLogs={fight}/>}
            </div>
        </div>
    );
};

export default Encounter;
