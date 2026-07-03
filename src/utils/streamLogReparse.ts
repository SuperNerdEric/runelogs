import type { ReparseProgressPayload } from "../utils/reparseProgress";
import { consumeSseBuffer } from "../utils/sse";

export async function streamLogReparse(
  apiUrl: string,
  logIds: string[],
  token: string,
  onProgress: (payload: ReparseProgressPayload) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiUrl}/log/reparse`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/json");

    let lastResponseLength = 0;
    let buffer = "";

    const handleEvents = (
      events: ReturnType<typeof consumeSseBuffer>["events"],
    ) => {
      for (const event of events) {
        if (event.eventType === "progress") {
          try {
            onProgress(JSON.parse(event.dataText) as ReparseProgressPayload);
          } catch {
            // Ignore malformed progress payloads.
          }
          continue;
        }

        if (event.eventType === "error") {
          try {
            const payload = JSON.parse(event.dataText) as { error?: string };
            reject(new Error(payload.error ?? "Reparse failed"));
          } catch {
            reject(new Error("Reparse failed"));
          }
          return;
        }
      }
    };

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastResponseLength);
      lastResponseLength = xhr.responseText.length;
      buffer += newText;

      const { events, remainder } = consumeSseBuffer(buffer);
      buffer = remainder;
      handleEvents(events);
    };

    xhr.onload = () => {
      buffer += xhr.responseText.substring(lastResponseLength);
      const { events } = consumeSseBuffer(`${buffer}\n\n`);
      handleEvents(events);

      if (xhr.status >= 400) {
        const errorEvent = events.find((event) => event.eventType === "error");
        if (errorEvent) {
          return;
        }

        reject(new Error(`Server returned ${xhr.status}`));
        return;
      }

      resolve();
    };

    xhr.onerror = () => {
      reject(new Error("Network error while reparsing logs"));
    };

    xhr.send(JSON.stringify({ logIds }));
  });
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
