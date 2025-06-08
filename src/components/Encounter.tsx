import React, {useCallback, useEffect, useMemo, useState,} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Box, CircularProgress, Tab, Tabs, Typography,} from '@mui/material';
import {BoostsTab, DamageDoneTab, DamageTakenTab, EventsTab, ReplayTab, TabsEnum,} from './Tabs';
import TickActivity from './performance/TickActivity';
import {Fight, FightMetaData, isFight} from '../models/Fight';
import * as semver from 'semver';
import '../App.css';
import DropdownFightSelector from './sections/DropdownFightSelector';
import {Icon} from "@iconify/react";

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
    const [selectedTab, setSelectedTab] = useState<TabsEnum>(TabsEnum.DAMAGE_DONE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const selectorMeta: SelectorItem[] = useMemo(() => {
        if (!group) return [];
        return group.fights
            .sort((a, b) => a.order - b.order)
            .map((f) => ({
                id: f.id,
                name: f.name,
                date: '',
                time: '',
                fightDurationTicks: 0,
                success: true,
            }));
    }, [group]);
    /** fetches either a fight or fight-group in one go */
    const fetchEncounter = useCallback(
        async (encounterId: string, asInitial = false) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`https://api.runelogs.com/encounter/${encounterId}`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data: EncounterApi = await res.json();

                if (data.type === 'fight') {
                    if (!isFight(data.fight)) throw new Error('Malformed fight payload');
                    setFight(data.fight);
                    setLogId(data.meta.log.id);

                    /* on first load, if the fight belongs to a group, fetch that group too */
                    if (asInitial && data.meta.fightGroup?.id) {
                        await fetchEncounter(data.meta.fightGroup.id); // recursive fetch for the group
                    }
                } else {
                    setGroup(data);

                    // ← NEW: immediately fetch the first fight so `fight` is ready to render
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
        [],
    );

    /** user clicks another fight in the dropdown */
    const handleSelectFight = useCallback(
        (index: number) => {
            if (!group) return;
            const f = group.fights[index];
            if (f) fetchEncounter(f.id);
        },
        [group, fetchEncounter],
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
            t === TabsEnum.REPLAY ? fight.logVersion && semver.gte(fight.logVersion, '1.2.0') : true,
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
                {dropdown}

                <Tabs
                    value={selectedTab}
                    onChange={(_, v) => setSelectedTab(v)}
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

                {(fight.isBoss || fight.metaData.fightDurationTicks >= 25) &&
                    selectedTab !== TabsEnum.REPLAY && <TickActivity selectedLogs={fight}/>}

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
