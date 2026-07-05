export type ParsedLogExportPayload = Record<string, unknown>;

export type ParsedLogsWithoutRawExportFile = {
  exportedAt: string;
  logCount: number;
  failedLogIds: string[];
  logs: ParsedLogExportPayload[];
};

export async function downloadParsedLogsWithoutRaw(params: {
  apiUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onProgress?: (current: number, total: number, logId: string) => void;
}): Promise<{ blob: Blob; summary: ParsedLogsWithoutRawExportFile }> {
  const { apiUrl, getAuthHeaders, onProgress } = params;
  const headers = await getAuthHeaders();

  const idsResponse = await fetch(`${apiUrl}/admin/logs/without-raw/ids`, {
    headers,
  });
  if (!idsResponse.ok) {
    throw new Error(`Failed to list logs (${idsResponse.status})`);
  }

  const { logIds } = (await idsResponse.json()) as { logIds: string[] };
  const logs: ParsedLogExportPayload[] = [];
  const failedLogIds: string[] = [];

  for (let index = 0; index < logIds.length; index++) {
    const logId = logIds[index];
    onProgress?.(index + 1, logIds.length, logId);

    try {
      const response = await fetch(
        `${apiUrl}/admin/log/${logId}/parsed-export`,
        {
          headers,
        },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      logs.push(JSON.parse(await response.text()) as ParsedLogExportPayload);
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
