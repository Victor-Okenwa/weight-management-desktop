/** Parse a license JSON string and return its expiresAt field when valid. */
export function parseLicenseExpiresAt(licenseJson: string): string | null {
  try {
    const parsed = JSON.parse(licenseJson) as Record<string, unknown>;
    if (typeof parsed.expiresAt === 'string' && parsed.expiresAt.trim().length > 0) {
      return parsed.expiresAt.trim();
    }
  } catch {
    // ignore invalid JSON while the user is still typing / pasting
  }
  return null;
}

/** Human-readable license expiry, e.g. "Saturday, 18 July 2026". */
export function formatLicenseExpiry(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
