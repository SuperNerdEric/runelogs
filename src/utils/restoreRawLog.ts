export type ParityDiff = {
  category: "structural" | "metadata" | "name" | "info";
  message: string;
  documented?: boolean;
};

export type RestoreParityReport = {
  passed: boolean;
  structuralMatch: boolean;
  metadataMatch: boolean;
  diffs: ParityDiff[];
  documentedExceptions: string[];
  warnings: string[];
};

export type RestoreRawLogResult = {
  success: true;
  logId: string;
  uploaded: boolean;
  byteSize: number;
  lineCount: number;
  parityReport: RestoreParityReport;
  sampleLines: string[];
};

export type RestoreRawLogError = {
  success: false;
  logId: string;
  error: string;
};

export type RestoreAllRawLogsStatus = {
  status: "idle" | "started" | "in_progress" | "completed" | "failed";
  total: number;
  processed: number;
  restored: number;
  failed: number;
  parityWarnings: number;
  progress: string;
  startedAt?: string;
  completedAt?: string;
  currentLogId?: string;
};

export async function fetchLogIdsWithoutRaw(params: {
  apiUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}): Promise<string[]> {
  const { apiUrl, getAuthHeaders } = params;
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiUrl}/admin/logs/without-raw/ids`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to list logs without raw upload (${response.status})`,
    );
  }

  const { logIds } = (await response.json()) as { logIds: string[] };
  return logIds;
}

export async function previewRestoreRawLog(params: {
  apiUrl: string;
  logId: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}): Promise<RestoreRawLogResult | RestoreRawLogError> {
  return restoreRawLog({ ...params, dryRun: true });
}

export async function restoreRawLog(params: {
  apiUrl: string;
  logId: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  dryRun?: boolean;
  force?: boolean;
}): Promise<RestoreRawLogResult | RestoreRawLogError> {
  const { apiUrl, logId, getAuthHeaders, dryRun, force } = params;
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  };
  const response = await fetch(`${apiUrl}/admin/log/${logId}/restore-raw`, {
    method: "POST",
    headers,
    body: JSON.stringify({ dryRun, force: force ?? true }),
  });

  if (!response.ok) {
    const message = await response.text();
    return {
      success: false,
      logId,
      error: message || `Restore failed (${response.status})`,
    };
  }

  return (await response.json()) as RestoreRawLogResult;
}

export async function startRestoreAllRawLogs(params: {
  apiUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}): Promise<RestoreAllRawLogsStatus> {
  const { apiUrl, getAuthHeaders } = params;
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  };
  const response = await fetch(`${apiUrl}/admin/logs/without-raw/restore-all`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to start restore-all (${response.status})`);
  }

  return (await response.json()) as RestoreAllRawLogsStatus;
}

export type ParsedLogImportSuccess = {
  success: true;
  logId: string;
  encounterCount: number;
  fightCount: number;
  fightGroupCount: number;
  s3Uploads: number;
};

export type ParsedLogImportError = {
  success: false;
  logId: string;
  error: string;
};

export type ParsedLogImportResult =
  ParsedLogImportSuccess | ParsedLogImportError;

const PARSED_IMPORT_TIMEOUT_MS = 10 * 60 * 1000;

export async function importParsedLogExportFromFile(params: {
  apiUrl: string;
  logId: string;
  file: File;
  getAuthHeaders: () => Promise<Record<string, string>>;
  skipS3?: boolean;
}): Promise<ParsedLogImportResult> {
  const { apiUrl, logId, file, getAuthHeaders, skipS3 } = params;
  const formData = new FormData();
  formData.append("exportFile", file, file.name);
  if (skipS3) {
    formData.append("skipS3", "true");
  }

  const headers = await getAuthHeaders();
  const response = await fetch(
    `${apiUrl}/admin/log/${logId}/import-parsed-export`,
    {
      method: "POST",
      headers,
      body: formData,
      signal: AbortSignal.timeout(PARSED_IMPORT_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    return {
      success: false,
      logId,
      error: message || `Import failed (${response.status})`,
    };
  }

  return (await response.json()) as ParsedLogImportSuccess;
}

export async function fetchRestoreAllRawLogsStatus(params: {
  apiUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}): Promise<RestoreAllRawLogsStatus> {
  const { apiUrl, getAuthHeaders } = params;
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${apiUrl}/admin/logs/without-raw/restore-all/status`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch restore-all status (${response.status})`);
  }

  return (await response.json()) as RestoreAllRawLogsStatus;
}
