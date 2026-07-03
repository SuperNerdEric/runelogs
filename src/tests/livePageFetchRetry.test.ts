import { describe, expect, it } from "vitest";
import {
  LIVE_PAGE_RETRY_INTERVAL_MS,
  LIVE_PAGE_RETRY_TIMEOUT_MS,
  shouldRetryTransientPageFetch,
} from "../utils/livePageFetchRetry";

describe("livePageFetchRetry", () => {
  it("retries 409 while loading or receiving live data", () => {
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: true,
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        receivingData: true,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        receivingData: false,
        retryingAfterNotFound: true,
      }),
    ).toBe(true);
  });

  it("never retries 404 and does not retry 409 after live ingest has stopped", () => {
    expect(
      shouldRetryTransientPageFetch(404, {
        showLoading: true,
        receivingData: true,
        retryingAfterNotFound: true,
      }),
    ).toBe(false);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(false);
    expect(
      shouldRetryTransientPageFetch(500, {
        showLoading: true,
        receivingData: true,
        retryingAfterNotFound: true,
      }),
    ).toBe(false);
  });

  it("exports retry timing constants used by live pages", () => {
    expect(LIVE_PAGE_RETRY_INTERVAL_MS).toBe(5000);
    expect(LIVE_PAGE_RETRY_TIMEOUT_MS).toBe(60_000);
  });
});
