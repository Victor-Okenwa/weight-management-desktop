import type { PaperSizeGroup, Record as WeightRecord, SettingsRow } from '@weight/shared/types/index';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatWeight(value: number | null | undefined, unit: string): string {
  if (value == null) return '--';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${escapeHtml(unit)}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  const day = date.getDate();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function pageCss(paperSize: PaperSizeGroup): string {
  switch (paperSize) {
    case '58mm':
      return `
        @page { size: 58mm auto; margin: 2mm; }
        body { width: 54mm; font-size: 11px; }
      `;
    case 'A4':
      return `
        @page { size: A4; margin: 12mm; }
        body { width: 100%; max-width: 180mm; font-size: 14px; margin: 0 auto; }
      `;
    case '80mm':
    default:
      return `
        @page { size: 80mm auto; margin: 2mm; }
        body { width: 72mm; font-size: 12px; }
      `;
  }
}

export function buildSlipHtml(
  record: WeightRecord,
  settings: SettingsRow,
  paperSize: PaperSizeGroup,
): string {
  const unit = settings.weightUnit || 'kg';
  const companyName = escapeHtml(settings.companyName?.trim() || 'Weighbridge Ticket');
  const address = escapeHtml(settings.companyAddress?.trim() || '');
  const phone = escapeHtml(settings.companyPhone?.trim() || '');
  const email = escapeHtml(settings.companyEmail?.trim() || '');
  const footer = escapeHtml(settings.ticketFooter?.trim() || '');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket ${escapeHtml(record.ticketId)}</title>
  <style>
    ${pageCss(paperSize)}
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #111;
      margin: 0;
      padding: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    h1 {
      font-size: 1.15em;
      margin: 0 0 4px;
      text-align: center;
      text-transform: uppercase;
    }
    .meta { text-align: center; font-size: 0.9em; color: #333; margin-bottom: 8px; }
    .line { border-top: 1px dashed #444; margin: 8px 0; }
    .row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin: 3px 0;
    }
    .label { color: #444; flex: 0 0 4.4em; }
    .value {
      font-weight: 600;
      font-size: 0.85em;
      text-align: left;
      flex: 1 1 auto;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .weights .value { font-variant-numeric: tabular-nums; }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>${companyName}</h1>
  <div class="meta">
    ${address ? `${address}<br/>` : ''}
    ${phone ? `${phone}<br/>` : ''}
    ${email || ''}
  </div>
  <div class="line"></div>
  <div class="row"><span class="label">Ticket</span><span class="value">${escapeHtml(record.ticketId)}</span></div>
  <div class="row"><span class="label">Type</span><span class="value">${escapeHtml(record.operationType)}</span></div>
  <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(record.status)}</span></div>
  <div class="row"><span class="label">Vehicle</span><span class="value">${escapeHtml(record.vehicleName ?? '--')}</span></div>
  <div class="row"><span class="label">Material</span><span class="value">${escapeHtml(record.materialName ?? '--')}</span></div>
  <div class="row"><span class="label">Operator</span><span class="value">${escapeHtml(record.operator ?? '--')}</span></div>
  <div class="line"></div>
  <div class="weights">
    <div class="row"><span class="label">Gross</span><span class="value">${formatWeight(record.grossWeight, unit)}</span></div>
    <div class="row"><span class="label">Tare</span><span class="value">${formatWeight(record.tareWeight, unit)}</span></div>
    <div class="row"><span class="label">Net</span><span class="value">${formatWeight(record.netWeight, unit)}</span></div>
  </div>
  <div class="line"></div>
  <div class="row"><span class="label">Created</span><span class="value">${formatDateTime(record.createdAt)}</span></div>
  <div class="row"><span class="label">Updated</span><span class="value">${formatDateTime(record.updatedAt)}</span></div>
  ${record.remark ? `<div class="row"><span class="label">Remark</span><span class="value">${escapeHtml(record.remark)}</span></div>` : ''}
  ${footer ? `<div class="footer">${footer}</div>` : ''}
</body>
</html>`;
}
