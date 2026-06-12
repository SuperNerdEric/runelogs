import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {useAuth0} from '@auth0/auth0-react';
import {Alert, Box, CircularProgress, LinearProgress, Link, Tooltip, Typography} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {flushSync} from 'react-dom';
import SectionBox from "./SectionBox";
import {useStableDropzone} from "../hooks/useStableDropzone";
import {colors, contentColumnSx, fonts, fontSizes, media, typography} from "../theme";

const STEP_LINE_HEIGHT = 1.4;

const stepRowSx = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 1.5,
    alignItems: 'center',
    fontSize: typography.h5,
    fontWeight: 600,
    lineHeight: STEP_LINE_HEIGHT,
};

const stepBadgeSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${STEP_LINE_HEIGHT}em`,
    height: `${STEP_LINE_HEIGHT}em`,
    borderRadius: '50%',
    bgcolor: colors.background.surfaceAlt,
    border: `1px solid ${colors.border.default}`,
    color: colors.upload.dragActive,
    fontWeight: 600,
    fontSize: '0.7em',
    lineHeight: 1,
};

const stepTextSx = {
    m: 0,
    p: 0,
    fontSize: 'inherit',
    fontWeight: 'inherit',
    lineHeight: 'inherit',
};

const Upload: React.FC = () => {
    const {isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [uploadPhase, setUploadPhase] = useState<'upload' | 'parse' | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const onDrop = React.useCallback((files: File[]) => {
        if (files.length > 1) {
            setErrorText('Only one file can be uploaded at a time.');
        }
        if (files.length) {
            setProgress(null);
            setSelectedFile(files[0]);
        }
    }, []);

    const {
        getRootProps,
        getInputProps,
        isDragActive
    } = useStableDropzone({
        onDrop,
        multiple: true,
        accept: {'text/plain': ['.txt']},
        noClick: true,
        noKeyboard: true,
    });

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
        setUploadPhase('upload');

        try {
            const token = await getAccessTokenSilently();
            const formData = new FormData();
            formData.append('logFile', selectedFile);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${import.meta.env.VITE_API_URL}/log`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    flushSync(() => setProgress(percent));
                }
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                    setUploadPhase('parse');
                    setProgress(0);
                }
            };

            xhr.onerror = () => {
                setErrorText('Upload failed due to a network error.');
                setIsSubmitting(false);
            };

            xhr.onabort = () => {
                setErrorText('Upload was aborted.');
                setIsSubmitting(false);
            };

            xhr.onprogress = (e) => {
                const newText = xhr.responseText.substring(lastResponseLength);
                lastResponseLength = xhr.responseText.length;

                const events = newText.split('\n\n');
                for (const part of events) {
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

                    if (!eventType || !dataText) continue;

                    let payload: { progress?: number; logId?: string };
                    try {
                        payload = JSON.parse(dataText);
                    } catch {
                        continue;
                    }

                    if (eventType === 'progress' && typeof payload.progress === 'number') {
                        // @ts-ignore
                        flushSync(() => setProgress(payload.progress));
                    }

                    if (eventType === 'complete' && payload.logId) {
                        navigate(`/log/${payload.logId}`);
                        return;
                    }
                }
            };

            let lastResponseLength = 0;
            xhr.send(formData);
        } catch (err: any) {
            console.error(err);
            setErrorText(err.message || 'An unexpected error occurred.');
            setProgress(null);
            setIsSubmitting(false);
        }
    };


    if (isLoading || !isAuthenticated) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Box sx={{...contentColumnSx, mt: 2, px: 2, pb: 4, [media.mobileDown]: {px: 1}}}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 3,
                    pt: 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: colors.background.surfaceAlt,
                        border: `1px solid ${colors.border.default}`,
                    }}
                >
                    <CloudUploadIcon sx={{fontSize: 32, color: colors.upload.dragActive}}/>
                </Box>
                <Typography variant="h4" sx={{m: 0, fontWeight: 600, color: colors.text.primary}}>
                    Upload a Combat Log
                </Typography>
            </Box>

            <SectionBox
                {...getRootProps()}
                sx={{
                    p: {xs: 2.5, md: 4},
                    borderColor: isDragActive ? colors.upload.dragActive : colors.border.default,
                    borderStyle: isDragActive ? 'dashed' : 'solid',
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                    bgcolor: isDragActive ? colors.background.surfaceAlt : colors.background.surface,
                }}
            >
                <input {...getInputProps({
                    onDragEnter: (e) => e.stopPropagation(),
                    onDragOver: (e) => e.stopPropagation(),
                    onDragLeave: (e) => e.stopPropagation()
                })}/>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4}}>
                    <Box sx={stepRowSx}>
                        <Box component="span" sx={stepBadgeSx}>1</Box>
                        <Box sx={stepTextSx}>
                            Install the{' '}
                            <Link
                                href="https://runelite.net/plugin-hub/show/combat-logger"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Combat Logger
                            </Link>{' '}
                            plugin from the RuneLite plugin hub.
                        </Box>
                    </Box>

                    <Box sx={stepRowSx}>
                        <Box component="span" sx={stepBadgeSx}>2</Box>
                        <Box sx={stepTextSx}>
                            Locate your combat logs stored in{' '}
                            <Box component="span" sx={{color: 'yellow', fontFamily: 'monospace'}}>
                                .runelite/combat_log
                            </Box>
                            .
                            <Tooltip title="Help" placement="top">
                                <Link
                                    component={RouterLink}
                                    to="/help#find-combat-log"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{display: 'inline-flex', alignItems: 'center', gap: 0.25, ml: 0.5, verticalAlign: 'middle'}}
                                >
                                    <HelpOutlineIcon fontSize="inherit"/>
                                </Link>
                            </Tooltip>
                        </Box>
                    </Box>

                    <Box sx={stepRowSx}>
                        <Box component="span" sx={stepBadgeSx}>3</Box>
                        <Box sx={stepTextSx}>
                            Upload and analyze!
                        </Box>
                    </Box>
                </Box>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{display: 'flex', flexDirection: 'column', gap: 2}}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 3,
                            px: 2,
                            borderRadius: 1.5,
                            border: `2px dashed ${isDragActive ? colors.upload.dragActive : colors.border.default}`,
                            bgcolor: colors.background.surfaceAlt,
                            transition: 'border-color 0.2s ease, background-color 0.2s ease',
                        }}
                    >
                        <DescriptionOutlinedIcon
                            sx={{
                                fontSize: 40,
                                color: colors.text.rune,
                            }}
                        />
                        <Box
                            component="label"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.5 : 1,
                                pointerEvents: isSubmitting ? 'none' : 'auto',
                                px: 3,
                                py: 1.25,
                                borderRadius: '5px',
                                border: `3px solid ${colors.border.default}`,
                                bgcolor: colors.background.page,
                                color: selectedFile ? colors.text.gold : colors.text.primary,
                                fontFamily: fonts.body,
                                fontSize: fontSizes.base,
                                fontWeight: 500,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                transition: 'border-color 0.2s ease, color 0.2s ease',
                                '&:hover': {
                                    borderColor: colors.text.rune,
                                },
                            }}
                        >
                            {selectedFile ? selectedFile.name : 'Choose Log File...'}
                            <input type="file" accept=".txt" hidden onChange={handleFileChange}/>
                        </Box>
                    </Box>

                    {errorText && <Alert severity="error">{errorText}</Alert>}

                    {progress !== null && (
                        <Box width="100%" sx={{my: 1}}>
                            <LinearProgress
                                key={uploadPhase}
                                variant="determinate"
                                value={Math.min(Math.max(progress, 0), 100)}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: colors.background.progress,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: colors.upload.dragActive,
                                        borderRadius: 4,
                                    },
                                }}
                            />
                            <Typography variant="body2" align="center" sx={{color: colors.text.primary, mt: 1}}>
                                {uploadPhase === 'parse' ? 'Parsing' : 'Uploading'}: {progress.toFixed(0)}%
                            </Typography>
                        </Box>
                    )}

                    <Box display="flex" justifyContent="flex-end" sx={{[media.mobileDown]: {justifyContent: 'center'}}}>
                        <Box
                            component="button"
                            type="submit"
                            disabled={isSubmitting}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                minWidth: 140,
                                px: 3,
                                py: 1.25,
                                borderRadius: '5px',
                                border: `3px solid ${colors.border.default}`,
                                bgcolor: 'white',
                                color: colors.background.page,
                                fontFamily: fonts.body,
                                fontSize: fontSizes.base,
                                fontWeight: 600,
                                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                                '&:hover:not(:disabled)': {
                                    bgcolor: colors.upload.buttonHover,
                                    borderColor: colors.text.rune,
                                },
                                '&:disabled': {
                                    bgcolor: colors.background.progress,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    borderColor: colors.border.default,
                                },
                            }}
                        >
                            {isSubmitting
                                ? <CircularProgress size={24} sx={{color: 'inherit'}}/>
                                : <><CloudUploadIcon sx={{fontSize: 20}}/>Upload</>}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            mt: 1,
                            p: 2,
                            borderRadius: 1.5,
                            bgcolor: colors.background.page,
                            border: `1px solid ${colors.border.default}`,
                        }}
                    >
                        <InfoOutlinedIcon sx={{color: colors.text.rune, mt: 0.25, flexShrink: 0}}/>
                        <Typography variant="body1" sx={{color: colors.text.primary, m: 0}}>
                            You can start a new combat log with the{' '}
                            <Box component="span" sx={{color: 'yellow', fontFamily: fonts.mono}}>
                                ::newlog
                            </Box>{' '}
                            command in-game.
                        </Typography>
                    </Box>
                </Box>
            </SectionBox>
        </Box>
    );
};

export default Upload;
