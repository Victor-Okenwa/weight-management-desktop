import type { PaperSizeGroup, PrinterInfo, PrintersGrouped } from '@weight/shared/types/index';

function emptyGroups(): PrintersGrouped {
  return {
    '80mm': [],
    '58mm': [],
    A4: [],
    Letter: [],
    Other: [],
  };
}

/** Infer paper-size buckets from printer name / display name / description. */
export function inferPaperSizeGroups(text: string): PaperSizeGroup[] {
  const t = text.toLowerCase();
  const groups = new Set<PaperSizeGroup>();

  if (/\b80\s*mm\b|\bxp-?80\b|\bt80\b|\b80x|\b3\s*1\/8\b/.test(t)) {
    groups.add('80mm');
  }
  if (/\b58\s*mm\b|\bxp-?58\b|\bt58\b|\b58x|\b2\s*1\/4\b/.test(t)) {
    groups.add('58mm');
  }
  if (/\ba4\b|210\s*[x×]\s*297/.test(t)) {
    groups.add('A4');
  }
  if (/\bletter\b|8\.5\s*[x×]\s*11/.test(t)) {
    groups.add('Letter');
  }

  if (groups.size === 0) {
    groups.add('Other');
  }

  return [...groups];
}

export function groupPrinters(
  printers: Array<{
    name: string;
    displayName?: string;
    description?: string;
    isDefault?: boolean;
  }>,
): PrintersGrouped {
  const groups = emptyGroups();

  for (const printer of printers) {
    const displayName = printer.displayName || printer.name;
    const haystack = `${printer.name} ${displayName} ${printer.description ?? ''}`;
    const buckets = inferPaperSizeGroups(haystack);
    const info: PrinterInfo = {
      name: printer.name,
      displayName,
      isDefault: Boolean(printer.isDefault),
    };

    for (const bucket of buckets) {
      groups[bucket].push(info);
    }
  }

  return groups;
}
