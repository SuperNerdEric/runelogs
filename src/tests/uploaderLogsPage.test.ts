import { describe, expect, it } from "vitest";
import {
  UPLOADER_LOGS_PAGE_SIZE,
  buildUploaderLogsQuery,
  uploaderLogsPageCount,
} from "../utils/uploaderLogsPage";

describe("uploader logs pagination", () => {
  it("requests 50 logs per page from the backend", () => {
    expect(UPLOADER_LOGS_PAGE_SIZE).toBe(50);
    expect(
      buildUploaderLogsQuery({
        page: 2,
        sort: "uploadedAt",
        order: "desc",
      }),
    ).toBe("page=2&limit=50&sort=uploadedAt&order=desc");
  });

  it("includes content filters with the page request", () => {
    expect(
      buildUploaderLogsQuery({
        page: 1,
        content: "Theatre of Blood",
        playerCount: 4,
        sort: "name",
        order: "asc",
      }),
    ).toBe(
      "content=Theatre+of+Blood&playerCount=4&page=1&limit=50&sort=name&order=asc",
    );
  });

  it("counts pages from the backend total", () => {
    expect(uploaderLogsPageCount(0)).toBe(1);
    expect(uploaderLogsPageCount(50)).toBe(1);
    expect(uploaderLogsPageCount(51)).toBe(2);
    expect(uploaderLogsPageCount(120)).toBe(3);
  });
});
