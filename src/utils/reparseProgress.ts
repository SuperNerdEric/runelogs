export interface ReparseProgressPayload {
  progress?: number;
  phase?: string;
  phaseLabel?: string;
  logId?: string;
  logIndex?: number;
  logTotal?: number;
  error?: string;
  message?: string;
}

export function combineMultiLogReparseProgress(
  logIndex: number,
  logTotal: number,
  logProgress: number,
): number {
  const clampedProgress = Math.min(100, Math.max(0, logProgress));

  if (logTotal <= 1) {
    return clampedProgress;
  }

  const completedLogs = Math.max(0, logIndex - 1);
  return (completedLogs / logTotal) * 100 + clampedProgress / logTotal;
}

export function getOverallReparseProgress(
  payload: ReparseProgressPayload,
): number {
  return combineMultiLogReparseProgress(
    payload.logIndex ?? 1,
    payload.logTotal ?? 1,
    payload.progress ?? 0,
  );
}

export function getReparseStatusLabel(payload: ReparseProgressPayload): string {
  const logProgress = payload.progress ?? 0;

  if ((payload.logTotal ?? 1) > 1) {
    const phase = payload.phaseLabel ?? `${Math.round(logProgress)}%`;
    return `${phase} · log ${payload.logIndex ?? 1} of ${payload.logTotal}`;
  }

  if (payload.phaseLabel) {
    return `${payload.phaseLabel} · ${Math.round(logProgress)}%`;
  }

  return `${Math.round(logProgress)}%`;
}
