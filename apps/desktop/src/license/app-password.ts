import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AuthStatus, PasswordActionResult, PasswordMode } from '@weight/shared/types/index';
import {
  clearLicenseAndPassword,
  getInstallation,
  upsertInstallation,
} from '@weight/database/repositories/installation';
import { getDatabase } from '../database/connection.js';
import { logger } from '../logger.js';

const MIN_PASSWORD_LENGTH = 6;
const SCRYPT_KEYLEN = 64;

/** Process-lifetime unlock; always false on app start. */
let sessionUnlocked = false;

export function invalidateSession(): void {
  sessionUnlocked = false;
}

function normalizeMode(value: string | null | undefined): PasswordMode | null {
  if (value === 'none' || value === 'required') return value;
  return null;
}

function hashPassword(password: string, salt: Buffer): string {
  return scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
}

function verifyAgainstStored(password: string, saltHex: string, hashHex: string): boolean {
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function getAuthStatus(): AuthStatus {
  const db = getDatabase();
  const row = getInstallation(db);
  const passwordMode = normalizeMode(row?.passwordMode);
  return {
    passwordMode,
    passwordConfigured: passwordMode !== null,
    sessionUnlocked: passwordMode === 'required' ? sessionUnlocked : true,
  };
}

export function setPasswordless(): PasswordActionResult {
  const db = getDatabase();
  upsertInstallation(db, {
    passwordMode: 'none',
    passwordSalt: null,
    passwordHash: null,
  });
  db.save();
  sessionUnlocked = true;
  logger.info('App password mode set to passwordless');
  return { ok: true };
}

export function setPassword(password: string): PasswordActionResult {
  const validationError = validateNewPassword(password);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const salt = randomBytes(16);
  const hash = hashPassword(password, salt);
  const db = getDatabase();
  upsertInstallation(db, {
    passwordMode: 'required',
    passwordSalt: salt.toString('hex'),
    passwordHash: hash,
  });
  db.save();
  sessionUnlocked = true;
  logger.info('App password set');
  return { ok: true };
}

export function verifyPassword(password: string): PasswordActionResult {
  const db = getDatabase();
  const row = getInstallation(db);
  const mode = normalizeMode(row?.passwordMode);

  if (mode !== 'required') {
    sessionUnlocked = true;
    return { ok: true };
  }

  if (!row?.passwordSalt || !row.passwordHash) {
    return { ok: false, error: 'Password is not configured' };
  }

  if (!verifyAgainstStored(password, row.passwordSalt, row.passwordHash)) {
    return { ok: false, error: 'Incorrect password' };
  }

  sessionUnlocked = true;
  return { ok: true };
}

export function changePassword(current: string, next: string): PasswordActionResult {
  const db = getDatabase();
  const row = getInstallation(db);
  const mode = normalizeMode(row?.passwordMode);

  if (mode === 'required') {
    if (!row?.passwordSalt || !row.passwordHash) {
      return { ok: false, error: 'Password is not configured' };
    }
    if (!verifyAgainstStored(current, row.passwordSalt, row.passwordHash)) {
      return { ok: false, error: 'Current password is incorrect' };
    }
  } else if (mode === 'none') {
    // Setting a password for the first time from passwordless — no current required
  } else {
    return { ok: false, error: 'Security mode is not configured' };
  }

  return setPassword(next);
}

export function clearPassword(current: string): PasswordActionResult {
  const db = getDatabase();
  const row = getInstallation(db);
  const mode = normalizeMode(row?.passwordMode);

  if (mode !== 'required') {
    return setPasswordless();
  }

  if (!row?.passwordSalt || !row.passwordHash) {
    return { ok: false, error: 'Password is not configured' };
  }

  if (!verifyAgainstStored(current, row.passwordSalt, row.passwordHash)) {
    return { ok: false, error: 'Current password is incorrect' };
  }

  return setPasswordless();
}

/** Forgot-password recovery: wipe license + password; user must re-license. */
export function clearLicenseForPasswordReset(): PasswordActionResult {
  const db = getDatabase();
  clearLicenseAndPassword(db);
  db.save();
  sessionUnlocked = false;
  logger.info('License and password cleared via forgot-password reset');
  return { ok: true };
}
