export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  // #region agent log
  const parsed = date ? new Date(date) : null;
  fetch('http://127.0.0.1:7728/ingest/ce56d33a-b6cc-4b12-ba3c-9f19b258f062', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'add81d' },
    body: JSON.stringify({
      sessionId: 'add81d',
      runId: 'post-fix',
      hypothesisId: 'A,B,C',
      location: 'format.ts:formatDate',
      message: 'formatDate called',
      data: {
        raw: date,
        rawType: typeof date,
        isValid: parsed ? !Number.isNaN(parsed.getTime()) : false,
        parsedTime: parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}
