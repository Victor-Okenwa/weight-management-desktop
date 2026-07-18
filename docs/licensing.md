# Licensing (offline)

## Software copyright

This repository is proprietary. See [LICENSE](../LICENSE) (All Rights Reserved). Package metadata uses `"license": "UNLICENSED"`.

That is separate from the customer entitlement files described below.

## Customer entitlements

This app verifies machine-bound licenses signed by the sibling tool:

```text
../WMS-licenser
```

## Roles

| Piece | Location |
| --- | --- |
| License CLI (signs) | `WMS-licenser` |
| Private key | `WMS-licenser/keys/private.pem` (never here) |
| Public key (verify) | `apps/desktop/assets/keys/public.pem` |
| License contract | `WMS-licenser/LICENSE_FORMAT.md` |
| Setup + unlock state | SQLite `installation` table (not `settings`) |

## Machine ID

Computed in the Electron main process on Windows:

1. Read **MachineGuid** from `HKLM\SOFTWARE\Microsoft\Cryptography`
2. Read **System UUID** from `Win32_ComputerSystemProduct`
3. `SHA-256(MachineGuid + "|" + SystemUUID)` → first 12 hex chars (uppercase)
4. Display / license field: `WMS-{12 hex}`

Example: `WMS-A1B2C3D4E5F6`

The same string must appear in the license JSON `machineId` field. Activation rejects a license whose `machineId` does not match this PC.

## `installation` table (single row)

| Column | Purpose |
| --- | --- |
| `setup_completed` | First-time wizard finished |
| `machine_id` | Machine ID this station / license is bound to |
| `license_issued_at` / `license_expires_at` / `license_signature` | Unlocked license fields |
| `activated_at` | When unlock succeeded |
| `password_mode` | `null` (unset), `none` (passwordless), or `required` |
| `password_salt` / `password_hash` | scrypt credentials when mode is `required` |

Company/hardware/ticket prefs stay in `settings`.

## App password

Setup order: **Unlock → Security → Company → Hardware → Preferences → Review**.

- **Passwordless:** app opens after license + setup without a password.
- **Require password:** every app launch shows `/app-lock` until the password is verified (in-memory session for that process only).
- **Forgot password:** confirmation dialog clears the stored license and password; user must request a **new license** from Solution Road Tech Support.
- **License change / re-activate:** clears password fields; Security must be chosen again in setup (or reconfigured in Settings after setup).
- **Settings → Security:** change password or switch modes; current password required when one is already set.

## License JSON

```json
{
  "machineId": "WMS-…",
  "issuedAt": "RFC3339",
  "expiresAt": "RFC3339",
  "signature": "base64(Ed25519 signature)"
}
```

Canonical signed message:

```text
machineId + "\n" + issuedAt + "\n" + expiresAt
```

## Resume / re-entry behavior

- **Unlocked mid-setup, then crash:** license stays in `installation`. Next launch skips Unlock; if Security was already saved, resume at Company; otherwise land on Security. Prefills company/hardware/preferences from `settings`.
- **Normal return (setup done + license valid):** if password required and session locked → `/app-lock`; otherwise protected routes open.
- **Expired license or motherboard change:** `getLicenseStatus().activated` is false → setup Unlock again; company/hardware/preferences still prefill from `settings`.

`activated` means: stored license exists, `machine_id` matches this PC’s fingerprint, and `expiresAt` is still in the future.

## Status

- **Done:** Setup unlock UI; real Machine ID fingerprint; `installation` table; activate persists license and requires Machine ID match; setup completion on `installation`; resume unlock + settings prefills; app password (setup + lock + settings); gate app on valid unlock + session.
- **Pending:** Ed25519 verify against `public.pem`.

## Dev note

After pulling schema changes, if migrations fail on an old local DB, delete the app `userData/data.db` (dev only) so migrations can recreate a clean schema.

See also: `WMS-licenser/LEARNING.md` and `WMS-licenser/README.md`.
