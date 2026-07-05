import { fetchLogIdsWithoutRaw } from "./restoreRawLog";

export type ParsedLogExportPayload = Record<string, unknown>;

export type ParsedLogsWithoutRawExportFile = {
  exportedAt: string;
  logCount: number;
  failedLogIds: string[];
  logs: ParsedLogExportPayload[];
};

export type IndividualParsedExportResult = {
  succeeded: number;
  failedLogIds: string[];
};

const PARSED_EXPORT_FETCH_MS = 10 * 60 * 1000;

function parsedExportFilename(logId: string): string {
  return `${logId}-parsed-export.txt`;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchSingleParsedLogExport(params: {
  apiUrl: string;
  logId: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}): Promise<Blob> {
  const { apiUrl, logId, getAuthHeaders } = params;
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiUrl}/admin/log/${logId}/parsed-export`, {
    headers,
    signal: AbortSignal.timeout(PARSED_EXPORT_FETCH_MS),
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status} for log ${logId}`);
  }

  return response.blob();
}

export async function downloadSingleParsedLogExport(params: {
  apiUrl: string;
  logId: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}): Promise<void> {
  const blob = await fetchSingleParsedLogExport(params);
  triggerBlobDownload(blob, parsedExportFilename(params.logId));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Downloads one file per log (no in-browser merge). Best for backups of large logs. */
export async function downloadIndividualParsedLogExports(params: {
  apiUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  logIds?: string[];
  onProgress?: (current: number, total: number, logId: string) => void;
  delayBetweenDownloadsMs?: number;
}): Promise<IndividualParsedExportResult> {
  const {
    apiUrl,
    getAuthHeaders,
    onProgress,
    delayBetweenDownloadsMs = 250,
  } = params;

  const logIds =
    params.logIds ?? (await fetchLogIdsWithoutRaw({ apiUrl, getAuthHeaders }));

  const failedLogIds: string[] = [];
  let succeeded = 0;

  for (let index = 0; index < logIds.length; index++) {
    const logId = logIds[index];
    onProgress?.(index + 1, logIds.length, logId);

    try {
      const blob = await fetchSingleParsedLogExport({
        apiUrl,
        logId,
        getAuthHeaders,
      });
      triggerBlobDownload(blob, parsedExportFilename(logId));
      succeeded += 1;
    } catch {
      failedLogIds.push(logId);
    }

    if (index < logIds.length - 1 && delayBetweenDownloadsMs > 0) {
      await sleep(delayBetweenDownloadsMs);
    }
  }

  return { succeeded, failedLogIds };
}

/** Combines all logs into one JSON file. Can be slow or fail for very large logs. */
export async function downloadParsedLogsWithoutRaw(params: {
  apiUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onProgress?: (current: number, total: number, logId: string) => void;
}): Promise<{ blob: Blob; summary: ParsedLogsWithoutRawExportFile }> {
  const { apiUrl, getAuthHeaders, onProgress } = params;

  const logIds = await fetchLogIdsWithoutRaw({ apiUrl, getAuthHeaders });
  const logs: ParsedLogExportPayload[] = [];
  const failedLogIds: string[] = [];

  for (let index = 0; index < logIds.length; index++) {
    const logId = logIds[index];
    onProgress?.(index + 1, logIds.length, logId);

    try {
      const blob = await fetchSingleParsedLogExport({
        apiUrl,
        logId,
        getAuthHeaders,
      });
      logs.push(JSON.parse(await blob.text()) as ParsedLogExportPayload);
    } catch {
      failedLogIds.push(logId);
    }
  }

  const summary: ParsedLogsWithoutRawExportFile = {
    exportedAt: new Date().toISOString(),
    logCount: logs.length,
    failedLogIds,
    logs,
  };

  const blob = new Blob([JSON.stringify(summary, null, 2)], {
    type: "text/plain;charset=utf-8",
  });

  return { blob, summary };
}
