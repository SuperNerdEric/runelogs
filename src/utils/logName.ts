export const NO_ENCOUNTERS_LOG_NAME = "No encounters";

export const LIVE_LOG_WAITING_SUFFIX = "(Waiting for data...)";

export function isLiveEmptyLogName(
  logName: string | null | undefined,
  isLive: boolean,
): boolean {
  return isLive && logName === NO_ENCOUNTERS_LOG_NAME;
}
