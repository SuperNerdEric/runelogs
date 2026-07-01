import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Alert, Box, CircularProgress, Typography,} from '@mui/material';
import FightSelector from '../sections/FightSelector';
import {FightMetaData} from '../../models/Fight';
import {EncounterMetaData} from '../../models/LogLine';
import LogInfoBox from "./LogInfoBox";
import {contentColumnSx} from '../../theme';
import {getEncounterHref, getRunSummaryHref} from '../../utils/encounterTableRow';
import {inferLeaderboardFightGroupName} from '../../utils/leaderboardContent';
import {
    isFightGroupLiveInProgress,
    isFightLiveInProgress,
} from '../../utils/fightDisplayStatus';

interface ApiFight {
    id: string;
    name: string;
    mainEnemyName: string;
    startTime: string;
    isNpc: boolean;
    isBoss: boolean;
    isWave: boolean;
    fightDurationTicks: number;
    officialDurationTicks: number | null;
    success: boolean;
    logVersion: string;
    loggedInPlayer: string;
    logId: string;
    groupId: string | null;
    order: number;
}

interface ApiFightGroup {
    type: 'fightGroup';
    id: string;
    name: string;
    leaderboardName: string;
    officialDurationTicks: number | null;
    displayDurationTicks?: number | null;
    success: boolean;
    order: number;
    fights: ApiFight[];
}

interface ApiFightOnly {
    type: 'fight';
    id: string;
    name: string;
    mainEnemyName: string;
    startTime: string;
    isNpc: boolean;
    isBoss: boolean;
    isWave: boolean;
    fightDurationTicks: number;
    officialDurationTicks: number | null;
    success: boolean;
    logVersion: string;
    loggedInPlayer: string;
    logId: string;
    groupId: null;
    order: number;
}

type ApiEncounter = ApiFightOnly | ApiFightGroup;

interface ApiResponse {
    logId: string;
    name: string | null;
    uploaderId: string;
    uploadedAt: string;
    isLive?: boolean;
    receivingData?: boolean;
    liveActiveEncounterId?: string | null;
    encounters: ApiEncounter[];
}

const Log: React.FC = () => {
    const {logId} = useParams<{ logId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<EncounterMetaData[] | null>(null);
    const [uploaderId, setUploaderId] = useState<string>('');
    const [logName, setLogName] = useState<string | null>(null);
    const [uploadedAt, setUploadedAt] = useState<string>('');
    const [encounters, setEncounters] = useState<ApiEncounter[]>([]);
    const [receivingData, setReceivingData] = useState<boolean>(false);

    const loadLog = async (showLoading = true) => {
        if (!logId) {
            setError('No logId provided in URL');
            setLoading(false);
            return;
        }

        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const token = await (window as any).auth0?.getAccessTokenSilently?.();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });

            if (!res.ok) {
                throw new Error(`Server responded with status ${res.status}`);
            }

            const body: ApiResponse = await res.json();
            setEncounters(body.encounters);
            setReceivingData(Boolean(body.receivingData));

            const {uploaderId: up, name, uploadedAt: ua} = body;
            setUploaderId(up);
            setLogName(name);
            setUploadedAt(ua);

            const out: EncounterMetaData[] = [];

            body.encounters.sort((a, b) => a.order - b.order);

            for (const enc of body.encounters) {
                if (enc.type === 'fightGroup') {
                    const sortedFights = enc.fights
                        .slice()
                        .sort((a, b) => a.order - b.order);
                    const fightIds = sortedFights.map((f) => f.id);
                    const groupInProgress = isFightGroupLiveInProgress(
                        Boolean(body.receivingData),
                        enc.id,
                        fightIds,
                        body.liveActiveEncounterId,
                    );

                    const childFights: FightMetaData[] = sortedFights.map((f) => ({
                        name: f.name,
                        startTime: f.startTime,
                        fightDurationTicks: f.fightDurationTicks,
                        success: f.success,
                        inProgress: isFightLiveInProgress(
                            Boolean(body.receivingData),
                            f.id,
                            body.liveActiveEncounterId,
                        ),
                    }));

                    const fgMeta = {
                        name: enc.name,
                        officialDurationTicks: enc.displayDurationTicks ?? undefined,
                        success: enc.success,
                        inProgress: groupInProgress,
                        fights: childFights,
                        id: enc.id,
                        leaderboardName: enc.leaderboardName ?? inferLeaderboardFightGroupName(enc.name),
                    };

                    out.push(fgMeta);
                } else {
                    const fMeta: FightMetaData = {
                        name: enc.mainEnemyName,
                        startTime: enc.startTime,
                        fightDurationTicks: enc.fightDurationTicks,
                        success: enc.success
                    };

                    out.push(fMeta);
                }
            }

            setMetadata(out);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Unknown error fetching log');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadLog(true);
    }, [logId]);

    useEffect(() => {
        if (!logId || !receivingData) {
            return;
        }

        const interval = window.setInterval(() => {
            loadLog(false);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [logId, receivingData]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                <CircularProgress/>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Alert severity="error">
                    <Typography variant="h6">Error loading log:</Typography>
                    <Typography>{error}</Typography>
                </Alert>
            </Box>
        );
    }

    const hasEncounters = metadata !== null && metadata.length > 0;

    return (
        <Box p={2} sx={contentColumnSx}>
            {receivingData && (
                <Alert severity="info" sx={{mb: 2}}>
                    Live log in progress — this page will refresh while new data is received.
                </Alert>
            )}
            <LogInfoBox uploaderId={uploaderId} logName={logName} logId={logId!} uploadedAt={uploadedAt} onLogNameChange={setLogName}/>

            {hasEncounters ? (
                <FightSelector
                    fights={metadata!}
                    getFightHref={(index, fightGroupIndex) => {
                        const encounter = encounters[index];
                        if (!encounter) {
                            return undefined;
                        }
                        if (fightGroupIndex === undefined) {
                            if (encounter.type === 'fight') {
                                return getEncounterHref(encounter.id);
                            }
                            return undefined;
                        }
                        if (encounter.type === 'fightGroup') {
                            const fightId = encounter.fights[fightGroupIndex]?.id;
                            return fightId ? getEncounterHref(fightId) : undefined;
                        }
                        return undefined;
                    }}
                    getFightGroupHref={getRunSummaryHref}
                    onSelectAggregateFight={async (indices) => {
                        const selectedFights: string[] = [];

                        for (const i of indices) {
                            const encounter = encounters[i];
                            if (encounter?.type === 'fight') {
                                selectedFights.push(encounter.id);
                            }
                        }

                        if (selectedFights.length === 0) return;

                        try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL}/fight/aggregate`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ fightIds: selectedFights })
                            });

                            if (!res.ok) {
                                console.error(`Failed to create aggregate fight: ${res.status}`);
                                return;
                            }

                            const { aggregateId } = await res.json();
                            navigate(`/encounter/aggregate/${aggregateId}`);
                        } catch (err) {
                            console.error('Error aggregating fights:', err);
                        }
                    }}
                />
            ) : (
                <Typography sx={{mt: 2, color: 'white'}}>
                    No encounters found in this log.
                </Typography>
            )}
        </Box>
    );
};

export default Log;
