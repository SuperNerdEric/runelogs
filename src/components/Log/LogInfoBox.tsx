import {Link as RouterLink} from 'react-router-dom';
import {Check, Pencil, Trash2, X} from 'lucide-react';
import {useAuth0} from '@auth0/auth0-react';
import {format} from 'date-fns';
import {useNavigate} from 'react-router-dom';
import {closeSnackbar, SnackbarKey, useSnackbar} from 'notistack';
import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {displayUsername} from '../../utils/utils';
import {logNameTextClass} from '../../theme';
import {stopRowClick} from '../../utils/encounterTableRow';
import {cn} from '@/lib/utils';

interface Props {
    uploaderId: string;
    logName: string | null;
    logId: string;
    uploadedAt: string;
    onLogNameChange: (name: string | null) => void;
}

const LogInfoBox: React.FC<Props> = ({
    uploaderId,
    logName,
    logId,
    uploadedAt,
    onLogNameChange,
}) => {
    const {user, getAccessTokenSilently} = useAuth0();
    const navigate = useNavigate();
    const canEdit = user?.username === uploaderId;
    const {enqueueSnackbar} = useSnackbar();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(logName ?? '');
    const [saving, setSaving] = useState(false);

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

    const handleDelete = async (deleteLogId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this log?');
        if (!confirmed) return;

        try {
            const token = await getAccessTokenSilently();
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${deleteLogId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!resp.ok) {
                throw new Error(`Delete failed with status ${resp.status}`);
            }

            enqueueSnackbar('Log Deleted', {variant: 'success', autoHideDuration: 1000, action});
            navigate(`/logs/${uploaderId}`, {replace: true});
        } catch (err: any) {
            console.error('Failed to delete log:', err);
            alert(err.message || 'Failed to delete');
        }
    };

    const startEditing = () => {
        setDraft(logName ?? '');
        setEditing(true);
    };

    const cancelEditing = () => {
        setDraft(logName ?? '');
        setEditing(false);
    };

    const saveEditing = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const token = await getAccessTokenSilently();
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({name: draft.trim() || null}),
            });

            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.error || `Rename failed with status ${resp.status}`);
            }

            const data: {name: string | null} = await resp.json();
            onLogNameChange(data.name);
            setEditing(false);
            enqueueSnackbar('Log renamed', {variant: 'success', autoHideDuration: 1000, action});
        } catch (err: any) {
            console.error('Failed to rename log:', err);
            enqueueSnackbar(err.message || 'Failed to rename log', {variant: 'error', action});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="log-info-box">
            {canEdit && (
                <Button
                    aria-label="delete"
                    variant="ghost"
                    size="icon"
                    className="log-info-delete-btn"
                    onClick={() => handleDelete(logId)}
                >
                    <Trash2 className="size-4"/>
                </Button>
            )}

            <span className="log-info-label">Uploader</span>
            <RouterLink
                to={`/logs/${uploaderId}`}
                className={cn('link link-account capitalize')}
            >
                {displayUsername(uploaderId)}
            </RouterLink>

            <span className="log-info-label">Log&nbsp;Name</span>
            {editing ? (
                <div className="log-name-edit-row log-info-value" onClick={stopRowClick}>
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
            ) : (
                <div className="log-name-display-row log-name-display-row--start log-info-value">
                    <span
                        className={cn(logNameTextClass(!!logName), 'min-w-0 break-words')}
                    >
                        {logName ?? 'Unnamed'}
                    </span>
                    {canEdit && (
                        <Button
                            aria-label="edit log name"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 p-0.5 text-white/70"
                            onClick={startEditing}
                        >
                            <Pencil className="size-4"/>
                        </Button>
                    )}
                </div>
            )}

            <span className="log-info-label">Log&nbsp;ID</span>
            <span className="log-info-value log-info-id">{logId}</span>

            <span className="log-info-label">Uploaded</span>
            <span className="log-info-value">{format(new Date(uploadedAt), 'PPpp')}</span>
        </div>
    );
};

export default LogInfoBox;
