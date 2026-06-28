export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    throw new Error("Invalid JWT");
  }

  const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const json = atob(padded);
  return JSON.parse(json) as Record<string, unknown>;
}

export function tokenHasAdminPermission(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const permissions = payload.permissions;
  return Array.isArray(permissions) && permissions.includes("admin");
}
