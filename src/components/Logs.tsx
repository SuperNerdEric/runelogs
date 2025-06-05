import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
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
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { useAuth0 } from '@auth0/auth0-react';
import {closeSnackbar, SnackbarKey, useSnackbar} from "notistack";
import CloseIcon from "@mui/icons-material/Close";

interface LogItem {
    id: string;
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
type SortKey = 'id' | 'uploadedAt' | 'fights' | 'fightGroups';

// Direction type
type Order = 'asc' | 'desc';

const Logs: React.FC = () => {
    const { uploaderId } = useParams<{ uploaderId: string }>();
    const { user, getAccessTokenSilently } = useAuth0();
    const {enqueueSnackbar} = useSnackbar();
    const [logs, setLogs] = useState<LogItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sorting state
    const [orderBy, setOrderBy] = useState<SortKey>('uploadedAt');
    const [order, setOrder] = useState<Order>('desc');

    const action = (snackbarId: SnackbarKey) => (
        <IconButton
            aria-label="close"
            size="small"
            onClick={() => closeSnackbar(snackbarId)}
            sx={{ color: 'inherit' }}     // keeps the icon the same colour as the toast
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
                const resp = await fetch(`https://api.runelogs.com/logs/${uploaderId}`);
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

    const handleDelete = async (logId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this log?');
        if (!confirmed) return;

        try {
            const token = await getAccessTokenSilently();
            const resp = await fetch(`https://api.runelogs.com/log/${logId}`, {
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
                case 'id':
                    valA = a.id;
                    valB = b.id;
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
        <Box m={2}>
            <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                Logs for Uploader: {uploaderId}
            </Typography>

            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {/* Log ID Column */}
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                    active={orderBy === 'id'}
                                    direction={orderBy === 'id' ? order : 'asc'}
                                    onClick={() => handleRequestSort('id')}
                                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    <strong>Log ID</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* Uploaded At Column */}
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                    active={orderBy === 'uploadedAt'}
                                    direction={orderBy === 'uploadedAt' ? order : 'asc'}
                                    onClick={() => handleRequestSort('uploadedAt')}
                                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    <strong>Uploaded At</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* # Fights Column */}
                            <TableCell align="right" sx={{ color: 'white' }}>
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
                            <TableCell align="right" sx={{ color: 'white' }}>
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

                            <TableCell align="center" sx={{ color: 'white' }}>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {sortedLogs.map((log) => (
                            <TableRow key={log.id} hover>
                                <TableCell sx={{ color: 'white', paddingY: 1 }}>
                                    <Link component={RouterLink} to={`/log/${log.id}`} underline="hover">
                                        {log.id}
                                    </Link>
                                </TableCell>

                                <TableCell sx={{ color: 'white', paddingY: 1 }}>
                                    {format(new Date(log.uploadedAt), 'PPpp')}
                                </TableCell>

                                <TableCell align="right" sx={{ color: 'white', paddingY: 1 }}>
                                    {log._count.fights}
                                </TableCell>

                                <TableCell align="right" sx={{ color: 'white', paddingY: 1 }}>
                                    {log._count.fightGroups}
                                </TableCell>

                                <TableCell align="center" sx={{ color: 'white', paddingY: 1 }}>
                                    {user?.sub === uploaderId && (
                                        <IconButton
                                            aria-label="delete"
                                            onClick={() => handleDelete(log.id)}
                                            size="small"
                                        >
                                            <DeleteIcon fontSize="small" sx={{ color: 'white' }} />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Logs;
