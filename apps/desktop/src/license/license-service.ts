import type {
  ActivateLicenseResult,
  LicensePayload,
  LicenseStatus,
} from '@weight/shared/types/index';
import {
  getInstallation,
  saveLicense,
  upsertInstallation,
} from '@weight/database/repositories/installation';
import { getDatabase } from '../database/connection.js';
import { logger } from '../logger.js';
import { invalidateSession } from './app-password.js';
import { computeMachineId } from './machine-id.js';

function isLicensePayload(value: unknown): value is LicensePayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.machineId === 'string' &&
    record.machineId.length > 0 &&
    typeof record.issuedAt === 'string' &&
    record.issuedAt.length > 0 &&
    typeof record.expiresAt === 'string' &&
    record.expiresAt.length > 0 &&
    typeof record.signature === 'string' &&
    record.signature.length > 0
  );
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return true;
  return Date.now() >= expires;
}

function hasStoredLicense(
  row:
    | {
        licenseIssuedAt: string | null;
        licenseExpiresAt: string | null;
        licenseSignature: string | null;
      }
    | null
    | undefined,
): boolean {
  return Boolean(row?.licenseSignature && row.licenseIssuedAt && row.licenseExpiresAt);
}

/** Rebuild license JSON from stored fields for setup resume / display. */
function reconstructLicenseJson(row: {
  machineId: string;
  licenseIssuedAt: string | null;
  licenseExpiresAt: string | null;
  licenseSignature: string | null;
}): string | null {
  if (!hasStoredLicense(row) || !row.machineId) return null;
  return JSON.stringify({
    machineId: row.machineId,
    issuedAt: row.licenseIssuedAt,
    expiresAt: row.licenseExpiresAt,
    signature: row.licenseSignature,
  });
}

export function getMachineId(): string {
  const db = getDatabase();
  const machineId = computeMachineId();
  const row = getInstallation(db);

  // Persist fingerprint only before a license is bound. After unlock, `machineId`
  // is the licensed Machine ID and must not be overwritten on hardware change.
  if (!hasStoredLicense(row) && row?.machineId !== machineId) {
    upsertInstallation(db, { machineId });
    db.save();
  }

  return machineId;
}

export function activateLicense(licenseJson: string): ActivateLicenseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(licenseJson);
  } catch {
    return { ok: false, error: 'License must be valid JSON' };
  }

  if (!isLicensePayload(parsed)) {
    return {
      ok: false,
      error: 'License must include machineId, issuedAt, expiresAt, and signature',
    };
  }

  let currentMachineId: string;
  try {
    currentMachineId = computeMachineId();
  } catch (error) {
    return {
      ok: false,
      error: `Could not read Machine ID: ${(error as Error).message}`,
    };
  }

  if (parsed.machineId !== currentMachineId) {
    return {
      ok: false,
      error: `License is for ${parsed.machineId}, but this PC is ${currentMachineId}`,
    };
  }

  if (isExpired(parsed.expiresAt)) {
    return { ok: false, error: 'This license has already expired' };
  }

  // Crypto (Ed25519) verify against public.pem is deferred to a later pass.
  const db = getDatabase();
  const activatedAt = new Date().toISOString();
  saveLicense(db, {
    machineId: currentMachineId,
    licenseIssuedAt: parsed.issuedAt,
    licenseExpiresAt: parsed.expiresAt,
    licenseSignature: parsed.signature,
    activatedAt,
  });
  db.save();
  // License change always clears password (via saveLicense) and session
  invalidateSession();

  logger.info(`License activated for machineId=${currentMachineId}`);
  return {
    ok: true,
    expiresAt: parsed.expiresAt,
    machineId: parsed.machineId,
  };
}

export function getLicenseStatus(): LicenseStatus {
  const db = getDatabase();
  const row = getInstallation(db);
  const setupCompleted = row?.setupCompleted === true;

  let currentMachineId: string | null = null;
  try {
    currentMachineId = computeMachineId();
    if (!hasStoredLicense(row) && row?.machineId !== currentMachineId) {
      upsertInstallation(db, { machineId: currentMachineId });
      db.save();
    }
  } catch (error) {
    logger.error(`Could not compute Machine ID for status: ${(error as Error).message}`);
  }

  const licensed = hasStoredLicense(row);
  const matchesMachine =
    currentMachineId !== null && Boolean(row?.machineId) && row?.machineId === currentMachineId;
  const notExpired = !isExpired(row?.licenseExpiresAt);
  const activated = licensed && matchesMachine && notExpired;

  const passwordMode =
    row?.passwordMode === 'none' || row?.passwordMode === 'required' ? row.passwordMode : null;

  return {
    activated,
    machineId: currentMachineId ?? row?.machineId ?? null,
    expiresAt: row?.licenseExpiresAt ?? null,
    setupCompleted,
    // Reconstructed for wizard resume — not stored as a separate column
    licenseJson: row ? reconstructLicenseJson(row) : null,
    passwordMode,
  };
}
