import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Link,
    LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { flushSync } from 'react-dom';
import SectionBox from "./SectionBox";

const Upload: React.FC = () => {
    const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setErrorText(null);
        setProgress(null);
        setSelectedFile(e.target.files?.[0] ?? null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorText('Please select a file before submitting.');
            return;
        }

        setIsSubmitting(true);
        setErrorText(null);
        setProgress(0);

        try {
            const token = await getAccessTokenSilently();
            const formData = new FormData();
            formData.append('logFile', selectedFile);

            // Kick off the POST / SSE stream
            const response = await fetch('https://api.runelogs.com/log', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok || !response.body) {
                const errText = await response.text();
                throw new Error(errText || 'Upload failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop()!; // leftover partial block, if any

                // Process each complete SSE block
                for (const part of parts) {
                    const lines = part.split('\n').map((l) => l.trim());
                    let eventType: string | null = null;
                    let dataText: string | null = null;

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventType = line.replace(/^event:\s*/, '');
                        } else if (line.startsWith('data:')) {
                            dataText = line.replace(/^data:\s*/, '');
                        }
                    }

                    if (!eventType || !dataText) {
                        continue;
                    }

                    let payload: { progress?: number; logId?: string };
                    try {
                        payload = JSON.parse(dataText);
                    } catch {
                        continue;
                    }

                    if (eventType === 'progress' && typeof payload.progress === 'number') {
                        // Force React to commit this update immediately,
                        // then yield so the browser can repaint.
                        flushSync(() => {
                            // @ts-ignore
                            setProgress(payload.progress);
                        });
                        // Yield control to the browser for a repaint
                        await new Promise(requestAnimationFrame);
                    }

                    if (eventType === 'complete' && payload.logId) {
                        reader.cancel();
                        navigate(`/log/${payload.logId}`);
                        return;
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            setErrorText(err.message || 'An unexpected error occurred.');
            setProgress(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4} px={2}>
            <SectionBox>
                <Typography variant="h3" gutterBottom sx={{ color: 'white' }}>
                    Upload a Combat Log
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
                    <ol style={{ paddingLeft: '24px', margin: 0 }}>
                        <li>
                            <Typography variant="h5" component="span">
                                Install the{' '}
                                <Link
                                    href="https://runelite.net/plugin-hub/show/combat-logger"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Combat Logger
                                </Link>{' '}
                                plugin from the RuneLite plugin hub.
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="h5"  component="span">
                                Locate your combat logs stored in{' '}
                                <Typography variant="h5" component="span" sx={{ color: 'yellow', fontFamily: 'monospace' }}>
                                    .runelite/combat_log
                                </Typography>
                                .
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="h5" component="span">
                                Upload and analyze!
                            </Typography>
                        </li>
                    </ol>
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="contained"
                        component="label"
                        disabled={isSubmitting}
                        sx={{
                            textTransform: 'none',
                            backgroundColor: 'white',
                            color: 'black',
                            '&:hover': { backgroundColor: '#f0f0f0' }
                        }}
                    >
                        {selectedFile ? selectedFile.name : 'Choose Log File...'}
                        <input type="file" accept=".txt" hidden onChange={handleFileChange} />
                    </Button>

                    {errorText && <Alert severity="error">{errorText}</Alert>}

                    {progress !== null && (
                        <Box width="100%" sx={{ my: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(Math.max(progress, 0), 100)}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#444',
                                    '& .MuiLinearProgress-bar': { backgroundColor: '#1e88e5' }
                                }}
                            />
                            <Typography variant="body2" align="center" sx={{ color: 'white', mt: 1 }}>
                                Uploading: {progress.toFixed(0)}%
                            </Typography>
                        </Box>
                    )}

                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            sx={{
                                textTransform: 'none',
                                minWidth: 120,
                                backgroundColor: 'white',
                                color: 'black',
                                '&:hover': { backgroundColor: '#f0f0f0' }
                            }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : <><CloudUploadIcon sx={{ mr: 1 }} />Upload</>}
                        </Button>
                    </Box>
                </Box>
            </SectionBox>
        </Box>
    );
};

export default Upload;
