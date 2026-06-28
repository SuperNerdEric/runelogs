import React, {useEffect, useState} from 'react';
import {Link as RouterLink, useNavigate, useParams} from 'react-router-dom';
import {History} from 'lucide-react';
import {format} from 'date-fns';
import {colors} from '../theme';
import {encounterTableRowProps, stopRowClick} from '../utils/encounterTableRow';
import {ticksToTime} from '../utils/utils';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';

interface RecentEncounter {
    type: 'fight' | 'fightGroup';
    id: string;
    name: string;
    mainEnemyName?: string;
    startTime: string;
    leaderboardName?: string;
    success?: boolean;
    officialDurationTicks: number | null;
    inProgress?: boolean;
    uploadedAt: string;
    players?: string[];
}

interface RecentEncountersResponse {
    player: string;
    recentEncounters: RecentEncounter[];
}

const RecentEncounters: React.FC = () => {
    const navigate = useNavigate();
    const {playerName} = useParams<{ playerName: string }>();
    const [data, setData] = useState<RecentEncountersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/player/${playerName}/recent-encounters`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                setError(e.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [playerName]);

    const header = (
        <div className="player-section-header pb-4">
            <span className="inline-flex items-center leading-none">
                <History size={34} style={{color: colors.text.rune}} aria-hidden/>
            </span>
            <h2 className="player-section-title">Recent Encounters</h2>
        </div>
    );

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="text-white"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8">
                <p className="text-[var(--color-fight-failure)]">{error}</p>
            </div>
        );
    }

    const encounters = (data?.recentEncounters || []).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    if (encounters.length === 0) {
        return (
            <div className="mt-8">
                {header}
                <p className="text-white">No recent encounters found.</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {header}
            <div className="app-table-container">
                <table className="app-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th className="whitespace-nowrap">Duration</th>
                            <th>Players</th>
                            <th className="whitespace-nowrap">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {encounters.map((enc) => (
                            <tr key={enc.id} {...encounterTableRowProps(navigate, enc.id)}>
                                <td>
                                    <RouterLink
                                        to={`/encounter/${enc.id}`}
                                        className="link"
                                        onClick={stopRowClick}
                                    >
                                        {enc.name}
                                    </RouterLink>
                                </td>
                                <td className="whitespace-nowrap">
                                    {enc.inProgress
                                        ? 'In Progress'
                                        : enc.officialDurationTicks != null
                                            ? ticksToTime(enc.officialDurationTicks)
                                            : '-'}
                                </td>
                                <td>
                                    {enc.players?.length ? enc.players.map((p, i) => (
                                        <React.Fragment key={p}>
                                            <RouterLink
                                                to={`/player/${p}`}
                                                className={cn('link', p === playerName && 'link-player')}
                                                onClick={stopRowClick}
                                            >
                                                {p}
                                            </RouterLink>
                                            {i < enc.players!.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    )) : '-'}
                                </td>
                                <td className="whitespace-nowrap">
                                    <span className="date-responsive-short">
                                        {format(new Date(enc.startTime), 'MMM d, yyyy')}
                                    </span>
                                    <span className="date-responsive-full">
                                        {format(new Date(enc.startTime), 'PPp')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentEncounters;
