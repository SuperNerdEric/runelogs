import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {useAuth0} from '@auth0/auth0-react';
import {Alert, Box, CircularProgress, LinearProgress, Link, TextField, Tooltip, Typography} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckIcon from '@mui/icons-material/Check';
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

const UPLOAD_OVERALL_WEIGHT = 35;
const PARSE_OVERALL_WEIGHT = 65;

function getOverallProgress(uploadPercent: number, parsePercent: number | null): number {
    if (parsePercent !== null) {
        return UPLOAD_OVERALL_WEIGHT + (parsePercent / 100) * PARSE_OVERALL_WEIGHT;
    }
    return (uploadPercent / 100) * UPLOAD_OVERALL_WEIGHT;
}

function UploadProgressIndicator({
    uploadPercent,
    parsePercent,
}: {
    uploadPercent: number;
    parsePercent: number | null;
}) {
    const isParsing = parsePercent !== null;
    const overallProgress = getOverallProgress(uploadPercent, parsePercent);
    const phasePercent = isParsing ? parsePercent : uploadPercent;

    return (
        <Box
            sx={{
                my: 1,
                p: 2,
                borderRadius: 1.5,
                bgcolor: colors.background.surfaceAlt,
                border: `1px solid ${colors.border.default}`,
            }}
        >
            <Typography
                sx={{
                    m: 0,
                    fontSize: fontSizes.base,
                    fontWeight: 600,
                    color: colors.text.primary,
                }}
            >
                {isParsing ? 'Parsing log' : 'Uploading file'}
            </Typography>
            <Typography
                sx={{
                    m: 0,
                    mt: 0.25,
                    fontSize: fontSizes.sm,
                    color: colors.text.muted,
                }}
            >
                Step {isParsing ? 2 : 1} of 2
            </Typography>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mt: 2}}>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.max(overallProgress, 0), 100)}
                    sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.background.progress,
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: colors.upload.dragActive,
                            borderRadius: 3,
                        },
                    }}
                />
                <Typography
                    sx={{
                        minWidth: 40,
                        fontSize: fontSizes.sm,
                        fontWeight: 600,
                        color: colors.text.primary,
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'right',
                    }}
                >
                    {Math.round(overallProgress)}%
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1.25,
                    fontSize: fontSizes.sm,
                }}
            >
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: isParsing ? colors.text.muted : colors.text.primary,
                        fontWeight: isParsing ? 400 : 500,
                    }}
                >
                    {isParsing && (
                        <CheckIcon sx={{fontSize: 16, color: colors.upload.dragActive}}/>
                    )}
                    Upload
                    {!isParsing && (
                        <Box component="span" sx={{color: colors.text.muted}}>
                            · {Math.round(uploadPercent)}%
                        </Box>
                    )}
                </Box>
                <Box
                    sx={{
                        color: isParsing ? colors.text.primary : colors.text.muted,
                        fontWeight: isParsing ? 500 : 400,
                    }}
                >
                    Parse
                    {isParsing && (
                        <Box component="span" sx={{color: colors.text.muted}}>
                            {' '}· {Math.round(phasePercent)}%
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

const Upload: React.FC = () => {
    const {isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [logName, setLogName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [uploadPercent, setUploadPercent] = useState<number | null>(null);
    const [parsePercent, setParsePercent] = useState<number | null>(null);

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
            setUploadPercent(null);
            setParsePercent(null);
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
        setUploadPercent(null);
        setParsePercent(null);
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
        setUploadPercent(0);
        setParsePercent(null);

        try {
            const token = await getAccessTokenSilently();
            const formData = new FormData();
            formData.append('logFile', selectedFile);
            const trimmedName = logName.trim();
            if (trimmedName) {
                formData.append('name', trimmedName);
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${import.meta.env.VITE_API_URL}/log`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    flushSync(() => setUploadPercent(percent));
                }
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                    setUploadPercent(100);
                    setParsePercent(0);
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

            const resetUploadState = () => {
                setIsSubmitting(false);
                setUploadPercent(null);
                setParsePercent(null);
            };

            xhr.onprogress = () => {
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

                    let payload: { progress?: number; logId?: string; error?: string };
                    try {
                        payload = JSON.parse(dataText);
                    } catch {
                        continue;
                    }

                    if (eventType === 'error') {
                        setErrorText(payload.error || 'Upload failed');
                        resetUploadState();
                        return;
                    }

                    if (eventType === 'progress' && typeof payload.progress === 'number') {
                        flushSync(() => setParsePercent(payload.progress!));
                    }

                    if (eventType === 'complete' && payload.logId) {
                        navigate(`/log/${payload.logId}`);
                        return;
                    }
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 400) {
                    resetUploadState();
                }
            };

            let lastResponseLength = 0;
            xhr.send(formData);
        } catch (err: any) {
            console.error(err);
            setErrorText(err.message || 'An unexpected error occurred.');
            setUploadPercent(null);
            setParsePercent(null);
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

                    <Box>
                        <Typography sx={{ mb: 0.75, color: colors.text.primary, fontWeight: 500 }}>
                            Name{' '}
                            <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 400 }}>
                                (Optional)
                            </Box>
                        </Typography>
                        <TextField
                            value={logName}
                            onChange={(e) => setLogName(e.target.value)}
                            disabled={isSubmitting}
                            fullWidth
                            inputProps={{ maxLength: 100 }}
                            sx={{
                                '& .MuiInputBase-root': {
                                    bgcolor: colors.background.surfaceAlt,
                                    color: colors.text.primary,
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: colors.border.default,
                                },
                            }}
                        />
                    </Box>

                    {errorText && <Alert severity="error">{errorText}</Alert>}

                    {uploadPercent !== null && (
                        <UploadProgressIndicator
                            uploadPercent={uploadPercent}
                            parsePercent={parsePercent}
                        />
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
