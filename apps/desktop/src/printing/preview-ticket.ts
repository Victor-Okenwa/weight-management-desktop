import type { PaperSizeGroup, PrintPreviewResult } from '@weight/shared/types/index';
import { buildSlipForRecord } from './load-print-context.js';

export function previewTicket(input: {
  recordId: number;
  paperSize: PaperSizeGroup;
}): PrintPreviewResult {
  const result = buildSlipForRecord(input.recordId, input.paperSize);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, html: result.html };
}
