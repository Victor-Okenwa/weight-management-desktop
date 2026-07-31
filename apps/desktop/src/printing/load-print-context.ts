import type { PaperSizeGroup, Record as WeightRecord, SettingsRow } from '@weight/shared/types/index';
import { getRecordById } from '@weight/database/repositories/record';
import { getAllSettings } from '@weight/database/repositories/settings';
import { getDatabase } from '../database/connection.js';
import { buildSlipHtml } from './slip-template.js';

export type PrintContextResult =
  | { ok: true; html: string; record: WeightRecord; settings: SettingsRow }
  | { ok: false; error: string };

function toSettingsRow(
  settingsRow: NonNullable<ReturnType<typeof getAllSettings>>,
): SettingsRow {
  return {
    ...settingsRow,
    baudRate: settingsRow.baudRate as SettingsRow['baudRate'],
    dataBits: settingsRow.dataBits as SettingsRow['dataBits'],
    stopBits: settingsRow.stopBits as SettingsRow['stopBits'],
    parity: settingsRow.parity as SettingsRow['parity'],
    flowControl: settingsRow.flowControl as SettingsRow['flowControl'],
    printPaperSize: (settingsRow.printPaperSize || '80mm') as PaperSizeGroup,
  };
}

export function buildSlipForRecord(
  recordId: number,
  paperSize: PaperSizeGroup,
): PrintContextResult {
  const db = getDatabase();
  const record = getRecordById(db, recordId);
  if (!record) {
    return { ok: false, error: `Record ${recordId} not found` };
  }

  const settingsRow = getAllSettings(db);
  if (!settingsRow) {
    return { ok: false, error: 'Settings not initialized' };
  }

  const settings = toSettingsRow(settingsRow);
  const html = buildSlipHtml(record, settings, paperSize);
  return { ok: true, html, record, settings };
}
