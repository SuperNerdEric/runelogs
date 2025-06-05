import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    CircularProgress,
    Alert,
    Typography,
} from '@mui/material';
import FightSelector from '../sections/FightSelector';
import {
    FightMetaData
} from '../../models/Fight';
import {
    EncounterMetaData
} from '../../models/LogLine';
import { formatHHmmss } from '../../utils/utils';
import LogInfoBox from "./LogInfoBox";

interface ApiFight {
    id: string;
    name: string;
    mainEnemyName: string;
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
    order: number;
    fights: ApiFight[];
}

interface ApiFightOnly {
    type: 'fight';
    id: string;
    name: string;
    mainEnemyName: string;
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
    uploaderId: string;
    uploadedAt: string;
    encounters: ApiEncounter[];
}

const Log: React.FC = () => {
    const { logId } = useParams<{ logId: string }>();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<EncounterMetaData[] | null>(null);
    const [uploaderId, setUploaderId] = useState<string>('');
    const [uploadedAt, setUploadedAt] = useState<string>('');

    useEffect(() => {
        if (!logId) {
            setError('No logId provided in URL');
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const token = await (window as any).auth0?.getAccessTokenSilently?.();
                const res = await fetch(`https://api.runelogs.com/log/${logId}`, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    }
                });

                if (!res.ok) {
                    throw new Error(`Server responded with status ${res.status}`);
                }

                const body: ApiResponse = await res.json();

                const {uploaderId: up, uploadedAt: ua} = body;
                setUploaderId(up);
                setUploadedAt(ua);

                const out: EncounterMetaData[] = [];

                // Sort top‐level encounters by their `order` field:
                body.encounters.sort((a, b) => a.order - b.order);

                for (const enc of body.encounters) {
                    if (enc.type === 'fightGroup') {
                        // Build an array of FightMetaData for each nested ApiFight:
                        const childFights: FightMetaData[] = enc.fights
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((f) => {
                                // Convert ticks → milliseconds (1 tick = 600 ms)
                                const lengthMs = Math.round((f.fightDurationTicks || 0) * 600);
                                const HHmmss = formatHHmmss(lengthMs, false);

                                return {
                                    name: f.name,
                                    date: 'N/A',
                                    time: HHmmss,
                                    fightDurationTicks: f.fightDurationTicks,
                                    success: f.success
                                };
                            });

                        // Create a FightGroupMetaData — note: we do NOT supply date/time here,
                        // because your model probably only expects `{ name: string; fights: FightMetaData[] }`.
                        const fgMeta = {
                            name: enc.name,
                            fights: childFights
                        };

                        out.push(fgMeta);
                    } else {
                        // Standalone fight → FightMetaData
                        const lengthMs = Math.round((enc.fightDurationTicks || 0) * 600);
                        const HHmmss = formatHHmmss(lengthMs, false);

                        const fMeta: FightMetaData = {
                            name: enc.name,
                            date: 'N/A',
                            time: HHmmss,
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
                setLoading(false);
            }
        })();
    }, [logId]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                <CircularProgress />
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

    if (!metadata || metadata.length === 0) {
        return (
            <Box p={4}>
                <Alert severity="info">
                    <Typography variant="h6">No encounters found in this log.</Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <LogInfoBox uploaderId={uploaderId} uploadedAt={uploadedAt} logId={logId!} />

            <FightSelector
                fights={metadata}
                onSelectFight={(index, fightGroupIndex) => {
                    // Replace this with whatever you do when a user clicks a fight.
                    // For example: navigate(`/log/${logId}/fight/${...}`);
                    console.log('Selected fight index', index, 'in group', fightGroupIndex);
                }}
                onSelectAggregateFight={(indices) => {
                    console.log('Selected aggregate indices', indices);
                }}
            />
        </Box>
    );
};

export default Log;
