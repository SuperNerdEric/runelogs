import type { ReparseProgressPayload } from "../utils/reparseProgress";

type PipelineJobStatus = {
  jobId: string;
  status: "idle" | "started" | "in_progress" | "completed" | "failed";
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentLogId?: string;
  error?: string | null;
  results?: Array<{
    logId: string;
    status: string;
    error: string | null;
  }>;
};

async function pollJobUntilDone(
  apiUrl: string,
  jobId: string,
  token: string,
  onProgress: (payload: ReparseProgressPayload) => void,
): Promise<void> {
  const maxAttempts = 3600;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${apiUrl}/log/reparse/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const status = (await response.json()) as PipelineJobStatus;
    const logIndex = Math.min(status.processed + 1, Math.max(status.total, 1));
    const logProgress =
      status.total > 0 ? (status.processed / status.total) * 100 : 0;

    onProgress({
      logIndex,
      logTotal: status.total,
      logId: status.currentLogId,
      progress: logProgress,
      phase: status.status,
      phaseLabel:
        status.status === "completed"
          ? "Complete"
          : status.status === "failed"
            ? "Failed"
            : "Reparsing",
    });

    if (status.status === "completed") {
      if (status.failed > 0 && status.succeeded === 0) {
        throw new Error(status.error ?? "All reparses failed");
      }
      if (status.failed > 0) {
        throw new Error(
          `Reparse finished with ${status.failed} failure${status.failed === 1 ? "" : "s"}`,
        );
      }
      return;
    }

    if (status.status === "failed") {
      throw new Error(status.error ?? "Reparse job failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Timed out waiting for reparse job");
}

export async function streamLogReparse(
  apiUrl: string,
  logIds: string[],
  token: string,
  onProgress: (payload: ReparseProgressPayload) => void,
): Promise<void> {
  const response = await fetch(`${apiUrl}/log/reparse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ logIds }),
  });

  if (!response.ok) {
    let message = `Server returned ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const body = (await response.json()) as { jobId?: string };
  if (!body.jobId) {
    throw new Error("Reparse job did not return a jobId");
  }

  onProgress({
    logIndex: 1,
    logTotal: logIds.length,
    logId: logIds[0],
    progress: 0,
    phase: "started",
    phaseLabel: "Queued",
  });

  await pollJobUntilDone(apiUrl, body.jobId, token, onProgress);
}

export function createInitialReparseProgress(
  logIds: string[],
): ReparseProgressPayload {
  return {
    logIndex: 1,
    logTotal: logIds.length,
    logId: logIds[0],
    progress: 0,
  };
}
