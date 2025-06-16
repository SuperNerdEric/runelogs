import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Alert, Box, CircularProgress, Typography,} from '@mui/material';
import FightSelector from '../sections/FightSelector';
import {FightMetaData} from '../../models/Fight';
import {EncounterMetaData} from '../../models/LogLine';
import LogInfoBox from "./LogInfoBox";

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
    uploaderId: string;
    uploadedAt: string;
    encounters: ApiEncounter[];
}

const Log: React.FC = () => {
    const {logId} = useParams<{ logId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<EncounterMetaData[] | null>(null);
    const [uploaderId, setUploaderId] = useState<string>('');
    const [uploadedAt, setUploadedAt] = useState<string>('');
    const [encounters, setEncounters] = useState<ApiEncounter[]>([]);

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
                                return {
                                    name: f.name,
                                    startTime: f.startTime,
                                    fightDurationTicks: f.fightDurationTicks,
                                    success: f.success
                                };
                            });

                        const fgMeta = {
                            name: enc.name,
                            officialDurationTicks: enc.officialDurationTicks,
                            fights: childFights
                        };

                        out.push(fgMeta);
                    } else {
                        // Standalone fight → FightMetaData
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
            <LogInfoBox uploaderId={uploaderId} uploadedAt={uploadedAt} logId={logId!}/>

            <FightSelector
                fights={metadata}
                onSelectFight={(index, fightGroupIndex) => {
                    let fightId: string | undefined;
                    const encounter = encounters[index];
                    if (fightGroupIndex === undefined) {
                        if (encounter && encounter.type === 'fight') {
                            fightId = encounter.id;
                        }
                    } else {
                        if (encounter && encounter.type === 'fightGroup') {
                            fightId = encounter.fights[fightGroupIndex].id;
                        }
                    }
                    if (fightId) {
                        navigate(`/encounter/${fightId}`);
                    }
                }}
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
        </Box>
    );
};

export default Log;
