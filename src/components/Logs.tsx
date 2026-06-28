import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link as RouterLink, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {format} from 'date-fns';
import {useAuth0} from '@auth0/auth0-react';
import {closeSnackbar, SnackbarKey, useSnackbar} from 'notistack';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    FolderOpen,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import {colors, contentColumnClass, logNameTextClass} from '../theme';
import {displayUsername} from '../utils/utils';
import {buildProfileHref} from '../utils/profile';
import {logTableRowProps, stopRowClick} from '../utils/encounterTableRow';
import {
    pageHeaderClass,
    pageHeaderIconClass,
    pageHeaderSubtitleClass,
    pageHeaderTitleAccountClass,
} from './pageHeaderStyles';
import FilterSelect from './filters/FilterSelect';
import FilterToolbar from './filters/FilterToolbar';
import {filterFieldCompactClass} from './filters/filterStyles';
import {
    BROWSE_ANY_PLAYER_COUNT,
    BrowsePlayerCount,
    buildBrowsePlayerCountOptions,
    buildUploaderLogsHref,
    browsePlayerCountToApiParam,
    isRecentEncountersAllContent,
    RECENT_ENCOUNTERS_CONTENT_OPTIONS,
    RecentEncountersContentOption,
    resolveBrowsePlayerCount,
    resolveRecentEncountersContent,
} from '../utils/leaderboardContent';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';

interface LogItem {
    id: string;
    name: string | null;
    uploadedAt: string;
    eligible: boolean;
    saveStatus?: 'saving' | 'complete' | 'failed';
    processingProgress?: number;
    _count: {
        fights: number;
        fightGroups: number;
    };
}

function isParsingLog(log: LogItem): boolean {
    return log.saveStatus === 'saving';
}

interface LogStatusResponse {
    id: string;
    name: string | null;
    eligible: boolean;
    saveStatus: 'saving' | 'complete' | 'failed';
    processingProgress: number;
    _count: {
        fights: number;
        fightGroups: number;
    };
}

interface LogsResponse {
    logs: LogItem[];
}

async function fetchLogStatus(logId: string): Promise<LogStatusResponse | null> {
    const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}/status`);
    if (resp.status === 404) {
        return null;
    }
    if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
    }
    return resp.json() as Promise<LogStatusResponse>;
}

type SortKey = 'name' | 'uploadedAt' | 'fights' | 'fightGroups';
type Order = 'asc' | 'desc';

function toSearchParams(
    uploaderId: string,
    content: RecentEncountersContentOption,
    playerCount: BrowsePlayerCount,
): Record<string, string> {
    return Object.fromEntries(
        new URLSearchParams(
            buildUploaderLogsHref(uploaderId, {
                content: content.value,
                playerCount: isRecentEncountersAllContent(content.value)
                    ? undefined
                    : browsePlayerCountToApiParam(playerCount),
            }).split('?')[1] ?? '',
        ),
    );
}

const getComparator = (order: Order, orderBy: SortKey) => {
    return (a: LogItem, b: LogItem) => {
        let valA: number | string = '';
        let valB: number | string = '';

        switch (orderBy) {
            case 'name':
                valA = a.name ?? '';
                valB = b.name ?? '';
                break;
            case 'uploadedAt':
                valA = new Date(a.uploadedAt).getTime();
                valB = new Date(b.uploadedAt).getTime();
                break;
            case 'fights':
                valA = a._count.fights;
                valB = b._count.fights;
                break;
            case 'fightGroups':
                valA = a._count.fightGroups;
                valB = b._count.fightGroups;
                break;
        }

        if (valA < valB) {
            return order === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    };
};

interface SortHeaderProps {
    label: string;
    sortKey: SortKey;
    orderBy: SortKey;
    order: Order;
    onSort: (key: SortKey) => void;
}

const SortHeader: React.FC<SortHeaderProps> = ({label, sortKey, orderBy, order, onSort}) => {
    const active = orderBy === sortKey;
    return (
        <button type="button" className="app-table-sort" onClick={() => onSort(sortKey)}>
            <strong>{label}</strong>
            {active ? (
                order === 'asc' ? (
                    <ArrowUp className="app-table-sort__icon" aria-hidden/>
                ) : (
                    <ArrowDown className="app-table-sort__icon" aria-hidden/>
                )
            ) : (
                <ArrowUpDown className="app-table-sort__icon app-table-sort__icon--inactive" aria-hidden/>
            )}
        </button>
    );
};

interface LogNameCellProps {
    log: LogItem;
    canEdit: boolean;
    onRename: (logId: string, name: string) => Promise<void>;
}

const LogNameCell: React.FC<LogNameCellProps> = ({log, canEdit, onRename}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(log.name ?? '');
    const [saving, setSaving] = useState(false);

    const startEditing = () => {
        setDraft(log.name ?? '');
        setEditing(true);
    };

    const cancelEditing = () => {
        setDraft(log.name ?? '');
        setEditing(false);
    };

    const saveEditing = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await onRename(log.id, draft);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <div className="log-name-edit-row" onClick={stopRowClick}>
                <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            void saveEditing();
                        } else if (e.key === 'Escape') {
                            cancelEditing();
                        }
                    }}
                    autoFocus
                    disabled={saving}
                    maxLength={100}
                    className="log-name-edit-input"
                />
                <Button
                    aria-label="save log name"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-white"
                    onClick={() => void saveEditing()}
                    disabled={saving}
                >
                    <Check className="size-4"/>
                </Button>
                <Button
                    aria-label="cancel edit"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-white"
                    onClick={cancelEditing}
                    disabled={saving}
                >
                    <X className="size-4"/>
                </Button>
            </div>
        );
    }

    return (
        <div className="log-name-display-row">
            <RouterLink
                to={`/log/${log.id}`}
                onClick={stopRowClick}
                className={cn(
                    'link min-w-0 flex-1 truncate',
                    logNameTextClass(!!log.name),
                )}
            >
                {log.name ?? 'Unnamed'}
            </RouterLink>
            {canEdit && (
                <Button
                    aria-label="edit log name"
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-8 shrink-0"
                    onClick={(e) => {
                        stopRowClick(e);
                        startEditing();
                    }}
                >
                    <Pencil className="size-4 text-white/70"/>
                </Button>
            )}
        </div>
    );
};

interface LogsPageHeaderProps {
    uploaderId?: string;
}

const LogsPageHeader: React.FC<LogsPageHeaderProps> = ({uploaderId}) => (
    <div className={pageHeaderClass}>
        <div className={pageHeaderIconClass}>
            <FolderOpen className="size-8" style={{color: colors.upload.dragActive}} aria-hidden/>
        </div>
        <div>
            <RouterLink
                to={buildProfileHref(uploaderId || '')}
                className={cn(pageHeaderTitleAccountClass, 'link')}
            >
                {displayUsername(uploaderId || 'Unknown User')}
            </RouterLink>
            <p className={pageHeaderSubtitleClass}>Uploaded logs</p>
        </div>
    </div>
);

const Logs: React.FC = () => {
    const {uploaderId} = useParams<{ uploaderId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {user, getAccessTokenSilently} = useAuth0();
    const {enqueueSnackbar} = useSnackbar();

    const contentParam = searchParams.get('content');
    const playerCountParam = searchParams.get('playerCount');
    const initialContent = resolveRecentEncountersContent(contentParam);
    const initialPlayerCount = resolveBrowsePlayerCount(initialContent, playerCountParam);

    const [content, setContent] = useState(initialContent);
    const [playerCount, setPlayerCount] = useState(initialPlayerCount);
    const [logs, setLogs] = useState<LogItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderBy, setOrderBy] = useState<SortKey>('uploadedAt');
    const [order, setOrder] = useState<Order>('desc');
    const canEditLogs = user?.username === uploaderId;
    const isAllContent = isRecentEncountersAllContent(content.value);

    useEffect(() => {
        const newContent = resolveRecentEncountersContent(searchParams.get('content'));
        const newPlayerCount = resolveBrowsePlayerCount(
            newContent,
            searchParams.get('playerCount'),
        );

        setContent(newContent);
        setPlayerCount(newPlayerCount);
    }, [searchParams]);

    const updateSearchParams = (updates: {
        content?: RecentEncountersContentOption;
        playerCount?: BrowsePlayerCount;
    }) => {
        if (!uploaderId) {
            return;
        }

        const nextContent = updates.content ?? content;
        const nextPlayerCount = updates.playerCount ?? playerCount;
        setSearchParams(toSearchParams(uploaderId, nextContent, nextPlayerCount));
    };

    const action = (snackbarId: SnackbarKey) => (
        <Button
            aria-label="close"
            variant="ghost"
            size="icon"
            className="size-8 text-inherit"
            onClick={() => closeSnackbar(snackbarId)}
        >
            <X className="size-4"/>
        </Button>
    );

    const fetchLogs = useCallback(async () => {
        if (!uploaderId) {
            setError('No uploader ID provided in URL.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (!isRecentEncountersAllContent(content.value)) {
                params.set('content', content.value);
                const apiPlayerCount = browsePlayerCountToApiParam(playerCount);
                if (apiPlayerCount != null) {
                    params.set('playerCount', String(apiPlayerCount));
                }
            }

            const query = params.toString();
            const url = `${import.meta.env.VITE_API_URL}/logs/${uploaderId}${query ? `?${query}` : ''}`;
            const resp = await fetch(url);
            if (!resp.ok) {
                throw new Error(`Server returned ${resp.status}`);
            }
            const data: LogsResponse = await resp.json();
            setLogs(data.logs);
        } catch (err: any) {
            console.error('Failed to fetch logs:', err);
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [content.value, playerCount, uploaderId]);

    const parsingLogIds = useMemo(
        () => logs?.filter(isParsingLog).map((log) => log.id) ?? [],
        [logs],
    );

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (parsingLogIds.length === 0) {
            return;
        }

        const refreshParsingLogs = async () => {
            try {
                const results = await Promise.all(
                    parsingLogIds.map((logId) => fetchLogStatus(logId)),
                );

                setLogs((prev) => {
                    if (!prev) {
                        return prev;
                    }

                    const updates = new Map(
                        results
                            .filter((result): result is LogStatusResponse => result != null)
                            .map((result) => [result.id, result]),
                    );

                    if (updates.size === 0) {
                        return prev;
                    }

                    return prev
                        .map((log) => {
                            const update = updates.get(log.id);
                            if (!update) {
                                return log;
                            }

                            return {
                                ...log,
                                name: update.name,
                                eligible: update.eligible,
                                saveStatus: update.saveStatus,
                                processingProgress: update.processingProgress,
                                _count: update._count,
                            };
                        })
                        .filter((log) => log.saveStatus !== 'failed');
                });
            } catch (err) {
                console.error('Failed to refresh parsing logs:', err);
            }
        };

        const intervalId = window.setInterval(() => {
            void refreshParsingLogs();
        }, 5000);

        void refreshParsingLogs();

        return () => window.clearInterval(intervalId);
    }, [parsingLogIds]);

    const handleRename = async (logId: string, name: string) => {
        try {
            const token = await getAccessTokenSilently();
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({name: name.trim() || null}),
            });

            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.error || `Rename failed with status ${resp.status}`);
            }

            const data: {name: string | null} = await resp.json();
            setLogs((prev) =>
                prev?.map((log) => (log.id === logId ? {...log, name: data.name} : log)) ?? null,
            );
            enqueueSnackbar('Log renamed', {variant: 'success', autoHideDuration: 1000, action});
        } catch (err: any) {
            console.error('Failed to rename log:', err);
            enqueueSnackbar(err.message || 'Failed to rename log', {variant: 'error', action});
            throw err;
        }
    };

    const handleDelete = async (logId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this log?');
        if (!confirmed) return;

        try {
            const token = await getAccessTokenSilently();
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!resp.ok) {
                throw new Error(`Delete failed with status ${resp.status}`);
            }
            enqueueSnackbar('Log Deleted', {variant: 'success', autoHideDuration: 1000, action});
            setLogs((prev) => prev?.filter((log) => log.id !== logId) ?? null);
        } catch (err: any) {
            console.error('Failed to delete log:', err);
            alert(err.message || 'Failed to delete');
        }
    };

    const handleRequestSort = (property: SortKey) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const renderFilters = () => (
        <FilterToolbar className="mb-4">
            <FilterSelect
                field="content"
                value={content.value}
                options={RECENT_ENCOUNTERS_CONTENT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                }))}
                className="min-w-[100px] sm:min-w-[140px]"
                onChange={(nextContentValue) => {
                    const selectedContent = RECENT_ENCOUNTERS_CONTENT_OPTIONS.find(
                        (option) => option.value === nextContentValue,
                    )!;
                    const newPlayerCount = BROWSE_ANY_PLAYER_COUNT;
                    setContent(selectedContent);
                    setPlayerCount(newPlayerCount);
                    updateSearchParams({
                        content: selectedContent,
                        playerCount: newPlayerCount,
                    });
                }}
            />

            {!isAllContent && content.defaultPlayerCount != null && (
                <FilterSelect<BrowsePlayerCount>
                    field="team"
                    value={playerCount}
                    compact
                    className={filterFieldCompactClass}
                    options={buildBrowsePlayerCountOptions(content.playerCounts)}
                    onChange={(count) => {
                        setPlayerCount(count);
                        updateSearchParams({playerCount: count});
                    }}
                />
            )}
        </FilterToolbar>
    );

    if (loading) {
        return (
            <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
                <LogsPageHeader uploaderId={uploaderId}/>
                <div className="flex items-center justify-center py-12">
                    <Spinner className="text-white"/>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
                <LogsPageHeader uploaderId={uploaderId}/>
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const hasActiveFilter = !isAllContent;
    const emptyMessage = hasActiveFilter
        ? 'No logs found matching this filter.'
        : 'No logs found for this uploader.';

    if (!logs || logs.length === 0) {
        return (
            <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
                <LogsPageHeader uploaderId={uploaderId}/>
                {renderFilters()}
                <h2 className="text-h6 text-[var(--color-text-primary)]">{emptyMessage}</h2>
            </div>
        );
    }

    const sortedLogs = logs.slice().sort(getComparator(order, orderBy));

    return (
        <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
            <LogsPageHeader uploaderId={uploaderId}/>
            {renderFilters()}

            <div className="app-table-container bg-transparent shadow-none">
                <table className="app-table w-full table-auto">
                    <thead>
                        <tr>
                            <th className="app-table-cell--name">
                                <SortHeader
                                    label="Name"
                                    sortKey="name"
                                    orderBy={orderBy}
                                    order={order}
                                    onSort={handleRequestSort}
                                />
                            </th>
                            <th className="app-table-cell--nowrap">
                                <SortHeader
                                    label="Uploaded"
                                    sortKey="uploadedAt"
                                    orderBy={orderBy}
                                    order={order}
                                    onSort={handleRequestSort}
                                />
                            </th>
                            <th className="app-table-cell--nowrap app-table-cell--hide-mobile text-right">
                                <SortHeader
                                    label="# Fights"
                                    sortKey="fights"
                                    orderBy={orderBy}
                                    order={order}
                                    onSort={handleRequestSort}
                                />
                            </th>
                            <th className="app-table-cell--nowrap app-table-cell--hide-mobile text-right">
                                <SortHeader
                                    label="# Fight Groups"
                                    sortKey="fightGroups"
                                    orderBy={orderBy}
                                    order={order}
                                    onSort={handleRequestSort}
                                />
                            </th>
                            {canEditLogs && <th className="app-table-cell--nowrap text-center"/>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLogs.map((log) => {
                            const parsing = isParsingLog(log);

                            return (
                                <tr
                                    key={log.id}
                                    {...(parsing ? {className: 'app-table-row--static'} : logTableRowProps(navigate, log.id))}
                                >
                                    <td className="app-table-cell--name app-table-cell--py">
                                        {parsing ? (
                                            <div className="parsing-log-row">
                                                <Spinner size="sm" className="text-[var(--color-upload-drag-active)]"/>
                                                <span className={logNameTextClass(true)}>
                                                    Parsing {log.processingProgress ?? 0}%
                                                </span>
                                            </div>
                                        ) : (
                                            <LogNameCell log={log} canEdit={canEditLogs} onRename={handleRename}/>
                                        )}
                                    </td>
                                    <td className="app-table-cell--nowrap app-table-cell--py">
                                        <span className="date-responsive-short">
                                            {format(new Date(log.uploadedAt), 'MMM d, yyyy')}
                                        </span>
                                        <span className="date-responsive-full">
                                            {format(new Date(log.uploadedAt), 'PPp')}
                                        </span>
                                    </td>
                                    <td className="app-table-cell--nowrap app-table-cell--hide-mobile app-table-cell--py text-right">
                                        {parsing ? '—' : log._count.fights}
                                    </td>
                                    <td className="app-table-cell--nowrap app-table-cell--hide-mobile app-table-cell--py text-right">
                                        {parsing ? '—' : log._count.fightGroups}
                                    </td>
                                    {canEditLogs && (
                                        <td className="app-table-cell--nowrap app-table-cell--py text-center">
                                            {!parsing && (
                                                <Button
                                                    aria-label="delete"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-white"
                                                    onClick={(e) => {
                                                        stopRowClick(e);
                                                        void handleDelete(log.id);
                                                    }}
                                                >
                                                    <Trash2 className="size-4"/>
                                                </Button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Logs;
