import { describe, expect, it } from "vitest";
import {
  LIVE_PAGE_RETRY_INTERVAL_MS,
  LIVE_PAGE_RETRY_TIMEOUT_MS,
  shouldPollLiveLogPage,
  shouldRetryTransientPageFetch,
} from "../utils/livePageFetchRetry";

describe("livePageFetchRetry", () => {
  it("polls live log pages while the session is open, finalizing, or data is flowing", () => {
    expect(shouldPollLiveLogPage("live", false)).toBe(true);
    expect(shouldPollLiveLogPage("finalizing", false)).toBe(true);
    expect(shouldPollLiveLogPage("none", true)).toBe(true);
    expect(shouldPollLiveLogPage("complete", true)).toBe(true);
    expect(shouldPollLiveLogPage("live", true)).toBe(true);
    expect(shouldPollLiveLogPage("none", false)).toBe(false);
    expect(shouldPollLiveLogPage("complete", false)).toBe(false);
  });

  it("retries 409 while loading, live/finalizing, or receiving data", () => {
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: true,
        liveLogState: "none",
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        liveLogState: "live",
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        liveLogState: "finalizing",
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        liveLogState: "none",
        receivingData: true,
        retryingAfterNotFound: false,
      }),
    ).toBe(true);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        liveLogState: "none",
        receivingData: false,
        retryingAfterNotFound: true,
      }),
    ).toBe(true);
  });

  it("never retries 404 and does not retry 409 after live ingest has settled", () => {
    expect(
      shouldRetryTransientPageFetch(404, {
        showLoading: true,
        liveLogState: "live",
        receivingData: true,
        retryingAfterNotFound: true,
      }),
    ).toBe(false);
    expect(
      shouldRetryTransientPageFetch(409, {
        showLoading: false,
        liveLogState: "complete",
        receivingData: false,
        retryingAfterNotFound: false,
      }),
    ).toBe(false);
    expect(
      shouldRetryTransientPageFetch(500, {
        showLoading: true,
        liveLogState: "live",
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
