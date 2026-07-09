import { describe, expect, it } from "vitest";
import {
  LIVE_PAGE_RETRY_INTERVAL_MS,
  LIVE_PAGE_RETRY_TIMEOUT_MS,
  shouldPollLiveLogPage,
  shouldRetryTransientPageFetch,
} from "../utils/livePageFetchRetry";

describe("livePageFetchRetry", () => {
  it("polls live log pages while the session is open or data is flowing", () => {
    expect(shouldPollLiveLogPage(true, false)).toBe(true);
    expect(shouldPollLiveLogPage(false, true)).toBe(true);
    expect(shouldPollLiveLogPage(true, true)).toBe(true);
    expect(shouldPollLiveLogPage(false, false)).toBe(false);
  });

  it("retries 409 while loading, live, or receiving data", () => {
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: true,
        isLive: false,
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        isLive: true,
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        isLive: false,
        receivingData: true,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        isLive: false,
        receivingData: false,
        retryingAfterNotFound: true,
      }),
    ).toBe(true);
  });

  it("never retries 404 and does not retry 409 after live ingest has stopped", () => {
    expect(
      shouldRetryTransientPageFetch(404, {
        showLoading: true,
        isLive: true,
        receivingData: true,
        retryingAfterNotFound: true,
      }),
    ).toBe(false);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        isLive: false,
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(false);
    expect(
      shouldRetryTransientPageFetch(500, {
        showLoading: true,
        isLive: true,
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
