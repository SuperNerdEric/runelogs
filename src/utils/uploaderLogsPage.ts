export const UPLOADER_LOGS_PAGE_SIZE = 50;

export type UploaderLogsSortKey =
  "name" | "uploadedAt" | "fights" | "fightGroups";

export type UploaderLogsSortOrder = "asc" | "desc";

export function uploaderLogsPageCount(
  total: number,
  pageSize = UPLOADER_LOGS_PAGE_SIZE,
): number {
  if (total <= 0) {
    return 1;
  }
  return Math.ceil(total / pageSize);
}

export function buildUploaderLogsQuery(options: {
  page: number;
  content?: string;
  playerCount?: number;
  sort: UploaderLogsSortKey;
  order: UploaderLogsSortOrder;
}): string {
  const params = new URLSearchParams();
  if (options.content) {
    params.set("content", options.content);
    if (options.playerCount != null) {
      params.set("playerCount", String(options.playerCount));
    }
  }
  params.set("page", String(options.page));
  params.set("limit", String(UPLOADER_LOGS_PAGE_SIZE));
  params.set("sort", options.sort);
  params.set("order", options.order);
  return params.toString();
}
