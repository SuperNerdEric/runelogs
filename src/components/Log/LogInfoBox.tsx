import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Link,
    Typography,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth0 } from '@auth0/auth0-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {closeSnackbar, SnackbarKey, useSnackbar} from "notistack";
import CloseIcon from '@mui/icons-material/Close';
import React from "react";
import {displayUsername} from "../../utils/utils";

interface Props {
    uploaderId: string;
    uploadedAt: string;
    logId: string;
}

const LogInfoBox: React.FC<Props> = ({
                                         uploaderId,
                                         uploadedAt,
                                         logId
                                     }) => {
    const { user, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const showDelete = user?.username === uploaderId;
    const {enqueueSnackbar} = useSnackbar();

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
            navigate(`/logs/${uploaderId}`, { replace: true });
        } catch (err: any) {
            console.error('Failed to delete log:', err);
            alert(err.message || 'Failed to delete');
        }
    };

    return (
        <Box
            className="log-info-box"
            sx={{ position: 'relative' }}
        >
            {showDelete && (
                <IconButton
                    aria-label="delete"
                    size="large"
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        color: 'white',
                    }}
                    onClick={() => handleDelete(logId)}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}

            <Typography className="log-info-label">Uploader</Typography>
            <Link
                component={RouterLink}
                style={{textTransform: 'capitalize'}}
                to={`/logs/${uploaderId}`}
                className="log-info-value"
                underline="hover"
                variant="body1"
            >
                {displayUsername(uploaderId)}
            </Link>

            <Typography className="log-info-label">Uploaded</Typography>
            <Typography className="log-info-value">
                {format(new Date(uploadedAt), 'PPpp')}
            </Typography>

            <Typography className="log-info-label">Log&nbsp;ID</Typography>
            <Typography className="log-info-value">{logId}</Typography>
        </Box>
    );
};

export default LogInfoBox;
