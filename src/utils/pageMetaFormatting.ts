export const RUNELOGS_TITLE_SUFFIX = "| Runelogs";

export function formatPageTitle(
  primary: string,
  suffix: string = RUNELOGS_TITLE_SUFFIX,
): string {
  return `${primary} ${suffix}`;
}

/** Strip a leading "Runelogs —" / "Runelogs -" prefix when present. */
export function stripRunelogsTitlePrefix(title: string): string {
  return title.replace(/^Runelogs\s*[—–-]\s*/i, "").trim();
}
