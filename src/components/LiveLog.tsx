import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth0} from '@auth0/auth0-react';
import {
    Copy,
    Eye,
    EyeOff,
    Info,
    Radio,
    RefreshCw,
} from 'lucide-react';
import SectionBox from './SectionBox';
import PanelIcon from '../assets/help/panel_icon.png';
import {colors, contentColumnClass} from '../theme';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';

const NO_ACCESS_KEY_MESSAGE = 'You do not have a live log access key yet.';

interface AccessKeyResponse {
    hasKey: boolean;
    key?: string;
    createdAt?: string;
    lastUsedAt?: string | null;
}

const LiveLog: React.FC = () => {
    const {isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const fetchAccessKey = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/live-log/access-key`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to load access key (${res.status})`);
            }

            const data: AccessKeyResponse = await res.json();
            setAccessKey(data.hasKey ? data.key ?? null : null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load access key');
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAccessKey();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, fetchAccessKey]);

    const handleRegenerate = async () => {
        if (accessKey) {
            const confirmed = window.confirm(
                'Regenerating your access key will invalidate the previous key. Continue?',
            );
            if (!confirmed) {
                return;
            }
        }

        setRegenerating(true);
        setError(null);

        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/live-log/access-key/regenerate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to regenerate access key (${res.status})`);
            }

            const data: AccessKeyResponse = await res.json();
            setAccessKey(data.key ?? null);
            setRevealed(true);
            setCopied(false);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to regenerate access key');
        } finally {
            setRegenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!accessKey) {
            return;
        }

        try {
            await navigator.clipboard.writeText(accessKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy access key:', err);
        }
    };

    if (isLoading || !isAuthenticated || loading) {
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
                    <Radio className="size-8" style={{color: colors.upload.dragActive}} aria-hidden/>
                </div>
                <h1 className="upload-page-hero__title">Live Log</h1>
            </div>

            <SectionBox className="p-6 max-[1279px]:p-5 md:p-8 text-left">
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
                            Generate your Runelogs access key below and copy it.
                        </p>
                    </div>

                    <div className="upload-step-row">
                        <span className="upload-step-badge">3</span>
                        <p className="upload-step-text">
                            In RuneLite, open Combat Logger settings and paste the key into{' '}
                            <span className="mono-yellow">Runelogs Access Key</span>.
                        </p>
                    </div>

                    <div className="upload-step-row">
                        <span className="upload-step-badge">4</span>
                        <p className="upload-step-text">
                            Click the Combat Logger{' '}
                            <img src={PanelIcon} alt="Panel Icon" className="help-icon-inline"/> panel icon in the
                            RuneLite sidebar and enable live logging.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="live-log-field-label">
                            Runelogs Access Key
                        </label>
                        <div className="relative">
                            <Input
                                readOnly
                                value={
                                    accessKey
                                        ? revealed
                                            ? accessKey
                                            : '•'.repeat(Math.min(accessKey.length, 48))
                                        : NO_ACCESS_KEY_MESSAGE
                                }
                                className="live-log-access-input bg-[var(--color-bg-surface-alt)] pr-20 text-[var(--color-text-primary)]"
                            />
                            {accessKey && (
                                <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={revealed ? 'Hide access key' : 'Reveal access key'}
                                        onClick={() => setRevealed((prev) => !prev)}
                                    >
                                        {revealed ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Copy access key"
                                        onClick={handleCopy}
                                    >
                                        <Copy className="size-4"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                        {copied && accessKey && (
                            <p className="mt-2 text-sm" style={{color: colors.text.heal}}>
                                Copied to clipboard
                            </p>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end max-[1279px]:justify-center">
                        <button
                            type="button"
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="upload-primary-btn"
                        >
                            {regenerating ? (
                                <Spinner className="size-6 text-inherit"/>
                            ) : (
                                <>
                                    {accessKey ? <RefreshCw className="size-5"/> : <Radio className="size-5"/>}
                                    {accessKey ? 'Regenerate Key' : 'Generate Key'}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="upload-info-box">
                        <Info className="mt-0.5 size-5 shrink-0" style={{color: colors.text.rune}} aria-hidden/>
                        <p>
                            You can enable or disable live logging with the{' '}
                            <span className="mono-yellow">::livelog</span> command in-game.
                        </p>
                    </div>
                </div>
            </SectionBox>
        </div>
    );
};

export default LiveLog;
