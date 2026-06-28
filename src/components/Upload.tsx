import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {useAuth0} from '@auth0/auth0-react';
import AppTooltip from './AppTooltip';
import {
    Check,
    CloudUpload,
    FileText,
    HelpCircle,
    Info,
} from 'lucide-react';
import {flushSync} from 'react-dom';
import SectionBox from './SectionBox';
import {useStableDropzone} from '../hooks/useStableDropzone';
import {colors, contentColumnClass, fonts} from '../theme';
import {combineOverallUploadProgress} from '../utils/uploadProgress';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Input} from '@/components/ui/input';
import {Progress} from '@/components/ui/progress';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';

type UploadProgressPayload = {
    progress?: number;
    logId?: string;
    error?: string;
};

async function pollLogUntilReadable(
    logId: string,
    token: string,
): Promise<boolean> {
    const maxAttempts = 180;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
            headers: {Authorization: `Bearer ${token}`},
        });

        if (response.status === 200) {
            return true;
        }
        if (response.status === 410) {
            return false;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return false;
}

function parseSseChunk(chunk: string): Array<{eventType: string; dataText: string}> {
    const events: Array<{eventType: string; dataText: string}> = [];

    for (const part of chunk.split('\n\n')) {
        const lines = part.split('\n').map((line) => line.trim());
        let eventType: string | null = null;
        let dataText: string | null = null;

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventType = line.replace(/^event:\s*/, '');
            } else if (line.startsWith('data:')) {
                dataText = line.replace(/^data:\s*/, '');
            }
        }

        if (eventType && dataText) {
            events.push({eventType, dataText});
        }
    }

    return events;
}

function extractCompleteLogId(responseText: string): string | null {
    for (const {eventType, dataText} of parseSseChunk(responseText)) {
        if (eventType !== 'complete') {
            continue;
        }

        try {
            const payload = JSON.parse(dataText) as UploadProgressPayload;
            if (payload.logId) {
                return payload.logId;
            }
        } catch {
            continue;
        }
    }

    return null;
}

function UploadProgressIndicator({
    uploadPercent,
    parsePercent,
    parseStarted,
    recovering,
}: {
    uploadPercent: number;
    parsePercent: number | null;
    parseStarted: boolean;
    recovering: boolean;
}) {
    const isParsing = parsePercent !== null;
    const overallProgress = combineOverallUploadProgress(uploadPercent, parsePercent);
    const uploadComplete = isParsing || uploadPercent >= 100;
    const parseWaiting = uploadComplete && !parseStarted;

    return (
        <div className="upload-progress-panel">
            <h3 className="m-0 mb-3 text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                Step {isParsing ? 2 : 1} of 2
            </h3>

            <div className="mb-4 flex flex-col items-start gap-1.5 text-base">
                <div
                    className="inline-flex items-center gap-1 text-[var(--color-text-primary)]"
                    style={{fontWeight: uploadComplete ? 400 : 600}}
                >
                    {uploadComplete && (
                        <Check className="size-[18px]" style={{color: colors.upload.dragActive}} aria-hidden/>
                    )}
                    Upload
                    <span className="font-medium">· {Math.round(uploadPercent)}%</span>
                </div>
                <div
                    className="inline-flex items-center gap-1 text-[var(--color-text-primary)]"
                    style={{fontWeight: isParsing && !parseWaiting ? 600 : 400}}
                >
                    Parse
                    <span className="font-medium">
                        · {parseWaiting ? 'Waiting' : isParsing ? `${Math.round(parsePercent)}%` : 'Waiting'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Progress
                    className="upload-progress-bar h-3 flex-1 bg-[var(--color-bg-progress)] [&>div]:bg-[var(--color-upload-drag-active)]"
                    value={recovering ? undefined : Math.min(Math.max(overallProgress, 0), 100)}
                />
                {!recovering && (
                    <span className="min-w-10 text-right text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {Math.round(overallProgress)}%
                    </span>
                )}
            </div>

            {isParsing && (
                <p className="m-0 mt-3 text-sm text-muted">
                    {recovering
                        ? 'Connection lost — still parsing in the background. You can leave this page and check your logs list.'
                        : 'You can leave this page while parsing finishes. Check your logs list for progress.'}
                </p>
            )}
        </div>
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
    const [parseStarted, setParseStarted] = useState(false);
    const [recovering, setRecovering] = useState(false);

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
            setParseStarted(false);
            setRecovering(false);
            setSelectedFile(files[0]);
        }
    }, []);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
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
        setParseStarted(false);
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
        setParseStarted(false);
        setRecovering(false);

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

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = (event.loaded / event.total) * 100;
                    flushSync(() => setUploadPercent(percent));
                }
            };

            let pendingLogId: string | null = null;

            const resetUploadState = () => {
                setIsSubmitting(false);
                setUploadPercent(null);
                setParsePercent(null);
                setParseStarted(false);
                setRecovering(false);
            };

            const finishUpload = (logId: string) => {
                resetUploadState();
                navigate(`/log/${logId}`);
            };

            const handleUploadEvent = (eventType: string, dataText: string): 'stop' | 'continue' => {
                let payload: UploadProgressPayload;
                try {
                    payload = JSON.parse(dataText);
                } catch {
                    return 'continue';
                }

                if (eventType === 'error') {
                    setErrorText(payload.error || 'Upload failed');
                    resetUploadState();
                    return 'stop';
                }

                if (eventType === 'progress' && typeof payload.progress === 'number') {
                    if (payload.logId || payload.progress > 0) {
                        setParseStarted(true);
                    }
                    if (payload.logId) {
                        pendingLogId = payload.logId;
                    }
                    flushSync(() => {
                        setParsePercent(payload.progress!);
                    });
                }

                if (eventType === 'complete' && payload.logId) {
                    finishUpload(payload.logId);
                    return 'stop';
                }

                return 'continue';
            };

            const recoverAfterDisconnect = async () => {
                const logId = pendingLogId ?? extractCompleteLogId(xhr.responseText);
                if (!logId) {
                    setErrorText('Upload failed due to a network error.');
                    resetUploadState();
                    return;
                }

                setRecovering(true);
                setErrorText(null);
                setParsePercent((current) => current ?? 0);

                const ready = await pollLogUntilReadable(logId, token);
                if (ready) {
                    finishUpload(logId);
                    return;
                }

                setErrorText('Upload failed before the log could be saved.');
                resetUploadState();
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                    setUploadPercent(100);
                    setParsePercent(0);
                }
            };

            xhr.onerror = () => {
                void recoverAfterDisconnect();
            };

            xhr.onabort = () => {
                setErrorText('Upload was aborted.');
                setIsSubmitting(false);
            };

            xhr.onprogress = () => {
                const newText = xhr.responseText.substring(lastResponseLength);
                lastResponseLength = xhr.responseText.length;

                for (const {eventType, dataText} of parseSseChunk(newText)) {
                    if (handleUploadEvent(eventType, dataText) === 'stop') {
                        return;
                    }
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    for (const {eventType, dataText} of parseSseChunk(xhr.responseText)) {
                        if (handleUploadEvent(eventType, dataText) === 'stop') {
                            return;
                        }
                    }

                    const completedLogId = extractCompleteLogId(xhr.responseText);
                    if (completedLogId) {
                        finishUpload(completedLogId);
                        return;
                    }
                }

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
            setRecovering(false);
            setIsSubmitting(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="loading-indicator-container">
                <Spinner className="size-8 text-white"/>
            </div>
        );
    }

    return (
        <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
            <div className="upload-page-hero">
                <div className="upload-page-hero__icon">
                    <CloudUpload className="size-8" style={{color: colors.upload.dragActive}} aria-hidden/>
                </div>
                <h1 className="upload-page-hero__title">Upload a Combat Log</h1>
            </div>

            <SectionBox
                {...getRootProps()}
                className={cn(
                    'upload-section-box--drag p-6 max-[1279px]:p-5 md:p-8',
                    isDragActive && 'upload-section-box--drag-active',
                )}
            >
                <input {...getInputProps({
                    onDragEnter: (e) => e.stopPropagation(),
                    onDragOver: (e) => e.stopPropagation(),
                    onDragLeave: (e) => e.stopPropagation(),
                })}/>

                <div className="mb-8 flex flex-col gap-3">
                    <div className="upload-step-row">
                        <span className="upload-step-badge">1</span>
                        <p className="upload-step-text">
                            Install the{' '}
                            <a
                                href="https://runelite.net/plugin-hub/show/combat-logger"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                            >
                                Combat Logger
                            </a>{' '}
                            plugin from the RuneLite plugin hub.
                        </p>
                    </div>

                    <div className="upload-step-row">
                        <span className="upload-step-badge">2</span>
                        <p className="upload-step-text">
                            Locate your combat logs stored in{' '}
                            <span className="mono-yellow">.runelite/combat_log</span>.
                            <AppTooltip title="Help" side="top" disableTouch>
                                <RouterLink
                                    to="/help#find-combat-log"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link ml-1 inline-flex items-center align-middle"
                                >
                                    <HelpCircle className="size-[1em]" aria-hidden/>
                                </RouterLink>
                            </AppTooltip>
                        </p>
                    </div>

                    <div className="upload-step-row">
                        <span className="upload-step-badge">3</span>
                        <p className="upload-step-text">Upload and analyze!</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div
                        className={cn(
                            'upload-drop-zone',
                            isDragActive && 'upload-drop-zone--active',
                        )}
                    >
                        <FileText className="size-10" style={{color: colors.text.rune}} aria-hidden/>
                        <label
                            className={cn(
                                'upload-file-label',
                                selectedFile && 'upload-file-label--selected',
                                isSubmitting && 'upload-file-label--disabled',
                            )}
                        >
                            {selectedFile ? selectedFile.name : 'Choose Log File...'}
                            <input type="file" accept=".txt" hidden onChange={handleFileChange}/>
                        </label>
                    </div>

                    <div>
                        <label className="mb-1.5 block font-medium text-[var(--color-text-primary)]">
                            Name <span className="font-normal text-white/50">(Optional)</span>
                        </label>
                        <Input
                            value={logName}
                            onChange={(e) => setLogName(e.target.value)}
                            disabled={isSubmitting}
                            maxLength={100}
                            className="bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)]"
                        />
                    </div>

                    {errorText && (
                        <Alert variant="destructive">
                            <AlertDescription>{errorText}</AlertDescription>
                        </Alert>
                    )}

                    {uploadPercent !== null && (
                        <UploadProgressIndicator
                            uploadPercent={uploadPercent}
                            parsePercent={parsePercent}
                            parseStarted={parseStarted}
                            recovering={recovering}
                        />
                    )}

                    <div className="flex justify-end max-[1279px]:justify-center">
                        <button type="submit" disabled={isSubmitting} className="upload-primary-btn">
                            {isSubmitting ? (
                                <Spinner className="size-6 text-inherit"/>
                            ) : (
                                <>
                                    <CloudUpload className="size-5"/>
                                    Upload
                                </>
                            )}
                        </button>
                    </div>

                    <div className="upload-info-box">
                        <Info className="mt-0.5 size-5 shrink-0" style={{color: colors.text.rune}} aria-hidden/>
                        <p>
                            You can start a new combat log with the{' '}
                            <span style={{color: 'yellow', fontFamily: fonts.mono}}>::newlog</span> command in-game.
                        </p>
                    </div>
                </form>
            </SectionBox>
        </div>
    );
};

export default Upload;
