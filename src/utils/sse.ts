export interface SseEvent {
  eventType: string;
  dataText: string;
}

export function parseSseChunk(chunk: string): SseEvent[] {
  const events: SseEvent[] = [];

  for (const part of chunk.split("\n\n")) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.startsWith(":")) {
      continue;
    }

    const lines = trimmed.split("\n");
    let eventType: string | null = null;
    let dataText: string | null = null;

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.replace(/^event:\s*/, "");
      } else if (line.startsWith("data:")) {
        dataText = line.replace(/^data:\s*/, "");
      }
    }

    if (eventType && dataText) {
      events.push({ eventType, dataText });
    }
  }

  return events;
}

export function consumeSseBuffer(buffer: string): {
  events: SseEvent[];
  remainder: string;
} {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  const events = parts.flatMap((part) => parseSseChunk(part));
  return { events, remainder };
}
