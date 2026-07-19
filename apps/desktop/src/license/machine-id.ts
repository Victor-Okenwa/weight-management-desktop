import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { logger } from '../logger.js';

let cachedMachineId: string | null = null;

function runPowerShell(script: string): string {
  const output = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8', windowsHide: true, timeout: 15_000 },
  );
  return output.trim();
}

function readMachineGuid(): string {
  const value = runPowerShell(
    "(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid",
  );
  if (!value) {
    throw new Error('MachineGuid is empty');
  }
  return value;
}

function readSystemUuid(): string {
  const value = runPowerShell('(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID');
  if (!value || /^ffffffff/i.test(value)) {
    throw new Error('System UUID is missing or invalid');
  }
  return value;
}

/**
 * Stable PC fingerprint: WMS- + first 12 hex of SHA-256(MachineGuid|SystemUUID).
 */
export function computeMachineId(): string {
  if (cachedMachineId) {
    return cachedMachineId;
  }

  if (process.platform !== 'win32') {
    throw new Error('Machine ID fingerprinting is only supported on Windows');
  }

  try {
    const machineGuid = readMachineGuid();
    const systemUuid = readSystemUuid();
    const digest = createHash('sha256')
      .update(`${machineGuid}|${systemUuid}`)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();
    cachedMachineId = `WMS-${digest}`;
    logger.info(`Computed Machine ID ${cachedMachineId}`);
    return cachedMachineId;
  } catch (error) {
    logger.error(`Failed to compute Machine ID: ${(error as Error).message}`);
    throw error;
  }
}

export function clearMachineIdCache() {
  cachedMachineId = null;
}
