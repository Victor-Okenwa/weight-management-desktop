import type { ReactNode } from 'react';

/** Map of form field paths → whether a red asterisk is shown. */
export const requiredFields: Record<string, boolean> = {
  'softwareUnlock.licenseJson': true,
  'softwareUnlock.activated': true,
  'companyDetails.name': true,
  'companyDetails.email': false,
  'companyDetails.address': false,
  'companyDetails.phone': false,
  'hardware.port': true,
  'hardware.baudRate': true,
  'hardware.parity': true,
  'hardware.flowControl': true,
  'hardware.stopBits': true,
  'hardware.dataBits': true,
  'hardware.autoOpen': false,
  'hardware.indicator': true,
  'preferences.defaultUnit': true,
  'preferences.theme': true,
  'preferences.ticketPrefix': true,
  'preferences.ticketFooter': true,
};

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children}
      <span className="text-red-600 pl-0.5" aria-hidden="true">
        *
      </span>
    </span>
  );
}
