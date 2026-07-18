# Licensing (offline)

## Software copyright

This repository is proprietary. See [LICENSE](../LICENSE) (All Rights Reserved). Package metadata uses `"license": "UNLICENSED"`.

That is separate from the customer entitlement files described below.

## Customer entitlements

This app will verify machine-bound licenses signed by the sibling tool:

```text
../WMS-licenser
```

## Roles

| Piece | Location |
| --- | --- |
| License CLI (signs) | `WMS-licenser` |
| Private key | `WMS-licenser/keys/private.pem` (never here) |
| Public key (verify) | `apps/desktop/assets/keys/public.pem` (to be added later) |
| License contract | `WMS-licenser/LICENSE_FORMAT.md` |

## License JSON (target)

```json
{
  "machineId": "string",
  "issuedAt": "RFC3339",
  "expiresAt": "RFC3339",
  "signature": "base64(Ed25519 signature)"
}
```

Canonical signed message:

```text
machineId + "\n" + issuedAt + "\n" + expiresAt
```

## Status

- **Not implemented yet** in this Electron app: Machine ID, activation UI, main-process verify.
- **WMS-licenser** is in learning mode: docs and rules first; Go CLI built step by step.

See also: `WMS-licenser/LEARNING.md` and `WMS-licenser/README.md`.
