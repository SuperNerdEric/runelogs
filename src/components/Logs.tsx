import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    CircularProgress,
    IconButton,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { useAuth0 } from '@auth0/auth0-react';
import {closeSnackbar, SnackbarKey, useSnackbar} from "notistack";
import {contentColumnSx, logNameTextSx, accountTextSx, media} from "../theme";
import {displayUsername} from "../utils/utils";
import {logTableRowProps, stopRowClick} from "../utils/encounterTableRow";

interface LogItem {
    id: string;
    name: string | null;
    uploadedAt: string;
    eligible: boolean;
    _count: {
        fights: number;
        fightGroups: number;
    };
}

interface LogsResponse {
    logs: LogItem[];
}

// Define the possible columns to sort by
type SortKey = 'name' | 'uploadedAt' | 'fights' | 'fightGroups';

// Direction type
type Order = 'asc' | 'desc';

const nameColumnSx = {
    color: 'white',
    width: '100%',
    maxWidth: 0,
    overflow: 'hidden',
} as const;

const shrinkColumnSx = {
    color: 'white',
    whiteSpace: 'nowrap',
} as const;

const tableCellPaddingSx = {
    paddingY: 1,
    [media.mobileDown]: { px: 1 },
} as const;

interface LogNameCellProps {
    log: LogItem;
    canEdit: boolean;
    onRename: (logId: string, name: string) => Promise<void>;
}

const LogNameCell: React.FC<LogNameCellProps> = ({ log, canEdit, onRename }) => {
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
            <Box display="flex" alignItems="center" gap={0.5} width="100%" onClick={stopRowClick}>
                <TextField
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
                    size="small"
                    autoFocus
                    disabled={saving}
                    fullWidth
                    inputProps={{ maxLength: 100 }}
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        '& .MuiInputBase-input': { color: 'white', py: 0.5 },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    }}
                />
                <IconButton aria-label="save log name" size="small" onClick={() => void saveEditing()} disabled={saving} sx={{ flexShrink: 0 }}>
                    <CheckIcon fontSize="small" sx={{ color: 'white' }} />
                </IconButton>
                <IconButton aria-label="cancel edit" size="small" onClick={cancelEditing} disabled={saving} sx={{ flexShrink: 0 }}>
                    <CloseIcon fontSize="small" sx={{ color: 'white' }} />
                </IconButton>
            </Box>
        );
    }

    return (
        <Box display="flex" alignItems="center" width="100%" gap={1}>
            <Link
                component={RouterLink}
                to={`/log/${log.id}`}
                onClick={stopRowClick}
                underline="hover"
                sx={{
                    ...logNameTextSx(!!log.name),
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {log.name ?? 'Unnamed'}
            </Link>
            {canEdit && (
                <IconButton
                    aria-label="edit log name"
                    size="small"
                    onClick={(e) => {
                        stopRowClick(e);
                        startEditing();
                    }}
                    sx={{ flexShrink: 0, ml: 'auto' }}
                >
                    <EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </IconButton>
            )}
        </Box>
    );
};

const Logs: React.FC = () => {
    const { uploaderId } = useParams<{ uploaderId: string }>();
    const navigate = useNavigate();
    const { user, getAccessTokenSilently } = useAuth0();
    const {enqueueSnackbar} = useSnackbar();
    const [logs, setLogs] = useState<LogItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sorting state
    const [orderBy, setOrderBy] = useState<SortKey>('uploadedAt');
    const [order, setOrder] = useState<Order>('desc');
    const canEditLogs = user?.username === uploaderId;

    const action = (snackbarId: SnackbarKey) => (
        <IconButton
            aria-label="close"
            size="small"
            onClick={() => closeSnackbar(snackbarId)}
            sx={{ color: 'inherit' }}
        >
            <CloseIcon fontSize="small" />
        </IconButton>
    );

    useEffect(() => {
        if (!uploaderId) {
            setError('No uploader ID provided in URL.');
            setLoading(false);
            return;
        }

        const fetchLogs = async () => {
            setLoading(true);
            setError(null);

            try {
                const resp = await fetch(`${import.meta.env.VITE_API_URL}/logs/${uploaderId}`);
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
        };

        fetchLogs();
    }, [uploaderId]);

    const handleRename = async (logId: string, name: string) => {
        try {
            const token = await getAccessTokenSilently();
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name.trim() || null }),
            });

            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.error || `Rename failed with status ${resp.status}`);
            }

            const data: { name: string | null } = await resp.json();
            setLogs((prev) =>
                prev?.map((log) => (log.id === logId ? { ...log, name: data.name } : log)) ?? null
            );
            enqueueSnackbar('Log renamed', { variant: 'success', autoHideDuration: 1000, action });
        } catch (err: any) {
            console.error('Failed to rename log:', err);
            enqueueSnackbar(err.message || 'Failed to rename log', { variant: 'error', action });
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
            // Remove deleted log from state
            enqueueSnackbar('Log Deleted', {variant: 'success', autoHideDuration: 1000, action});
            setLogs((prev) => prev?.filter((log) => log.id !== logId) ?? null);
        } catch (err: any) {
            console.error('Failed to delete log:', err);
            alert(err.message || 'Failed to delete');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box m={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <Box m={2}>
                <Typography variant="h4" gutterBottom sx={{color: 'white'}}>
                    Logs:{' '}
                    <Box component="span" sx={{...accountTextSx, textTransform: 'capitalize'}}>
                        {displayUsername(uploaderId || 'Unknown User')}
                    </Box>
                </Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                    No logs found for this uploader.
                </Typography>
            </Box>
        );
    }

    // Sorting helper functions
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
                    // Compare as timestamps
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

    const sortedLogs = logs.slice().sort(getComparator(order, orderBy));

    // Handler when a header is clicked
    const handleRequestSort = (property: SortKey) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    return (
        <Box sx={{...contentColumnSx, mt: 1, px: 2, pb: 0, [media.mobileDown]: { px: 1 }}}>
            <Box m={0}>
                <Box pb={0} pt={0}>
                    <Typography variant="h4" gutterBottom sx={{color: 'white'}}>
                        Logs:{' '}
                        <Box component="span" sx={{...accountTextSx, textTransform: 'capitalize'}}>
                            {displayUsername(uploaderId || 'Unknown User')}
                        </Box>
                    </Typography>
                </Box>

            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', width: '100%' }}>
                <Table sx={{ tableLayout: 'auto', width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            {/* Log Name Column */}
                            <TableCell sx={nameColumnSx}>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleRequestSort('name')}
                                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    <strong>Name</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* Uploaded Column */}
                            <TableCell sx={shrinkColumnSx}>
                                <TableSortLabel
                                    active={orderBy === 'uploadedAt'}
                                    direction={orderBy === 'uploadedAt' ? order : 'asc'}
                                    onClick={() => handleRequestSort('uploadedAt')}
                                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    <strong>Uploaded</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* # Fights Column */}
                            <TableCell align="right" sx={{ ...shrinkColumnSx, [media.mobileDown]: { display: 'none' } }}>
                                <TableSortLabel
                                    active={orderBy === 'fights'}
                                    direction={orderBy === 'fights' ? order : 'asc'}
                                    onClick={() => handleRequestSort('fights')}
                                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    <strong># Fights</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* # Fight Groups Column */}
                            <TableCell align="right" sx={{ ...shrinkColumnSx, [media.mobileDown]: { display: 'none' } }}>
                                <TableSortLabel
                                    active={orderBy === 'fightGroups'}
                                    direction={orderBy === 'fightGroups' ? order : 'asc'}
                                    onClick={() => handleRequestSort('fightGroups')}
                                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    <strong># Fight Groups</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* Delete Column */}
                            {canEditLogs && (
                                <TableCell align="center" sx={shrinkColumnSx}>
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {sortedLogs.map((log) => (
                            <TableRow key={log.id} {...logTableRowProps(navigate, log.id)}>
                                <TableCell sx={{ ...nameColumnSx, ...tableCellPaddingSx }}>
                                    <LogNameCell log={log} canEdit={canEditLogs} onRename={handleRename} />
                                </TableCell>

                                <TableCell sx={{ ...shrinkColumnSx, ...tableCellPaddingSx }}>
                                    <Box component="span" sx={{ [media.desktopUp]: { display: 'none' } }}>
                                        {format(new Date(log.uploadedAt), 'MMM d, yyyy')}
                                    </Box>
                                    <Box component="span" sx={{ display: 'none', [media.desktopUp]: { display: 'inline' } }}>
                                        {format(new Date(log.uploadedAt), 'PPp')}
                                    </Box>
                                </TableCell>

                                <TableCell align="right" sx={{ ...shrinkColumnSx, ...tableCellPaddingSx, [media.mobileDown]: { display: 'none' } }}>
                                    {log._count.fights}
                                </TableCell>

                                <TableCell align="right" sx={{ ...shrinkColumnSx, ...tableCellPaddingSx, [media.mobileDown]: { display: 'none' } }}>
                                    {log._count.fightGroups}
                                </TableCell>

                                {canEditLogs && (
                                    <TableCell align="center" sx={{ ...shrinkColumnSx, ...tableCellPaddingSx }}>
                                        <IconButton
                                            aria-label="delete"
                                            onClick={(e) => {
                                                stopRowClick(e);
                                                void handleDelete(log.id);
                                            }}
                                            size="small"
                                        >
                                            <DeleteIcon fontSize="small" sx={{ color: 'white' }} />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </Box>
        </Box>
    );
};

export default Logs;
