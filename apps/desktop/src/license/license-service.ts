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

export function getMachineId(): string {
  const db = getDatabase();
  const machineId = computeMachineId();
  const row = getInstallation(db);
  if (row?.machineId !== machineId) {
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
    licenseMachineId: parsed.machineId,
    licenseIssuedAt: parsed.issuedAt,
    licenseExpiresAt: parsed.expiresAt,
    licenseSignature: parsed.signature,
    licenseJson: JSON.stringify(parsed),
    activatedAt,
  });
  db.save();

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
    if (row?.machineId !== currentMachineId) {
      upsertInstallation(db, { machineId: currentMachineId });
      db.save();
    }
  } catch (error) {
    logger.error(`Could not compute Machine ID for status: ${(error as Error).message}`);
  }

  const hasLicense = Boolean(row?.licenseSignature && row.licenseMachineId && row.licenseJson);
  const matchesMachine = currentMachineId !== null && row?.licenseMachineId === currentMachineId;
  const notExpired = !isExpired(row?.licenseExpiresAt);
  const activated = hasLicense && matchesMachine && notExpired;

  return {
    activated,
    machineId: currentMachineId ?? row?.machineId ?? null,
    expiresAt: row?.licenseExpiresAt ?? null,
    setupCompleted,
    licenseJson: row?.licenseJson ?? null,
  };
}
