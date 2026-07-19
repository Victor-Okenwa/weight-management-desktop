// Serial port configuration constants

// Common baud rates for serial devices
export const BAUD_RATES = [
  110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200,
];

// Allowed stop bits
export const STOP_BITS = [1, 2];

// Parity options
export const PARITY_FLAGS = ['none', 'even', 'odd', 'mark', 'space'] as const;

// Flow control options
export const FLOW_CONTROL_OPTIONS = ['none', 'xon/xoff', 'hardware'] as const;

// Allowed data bits
export const DATA_BITS = [5, 6, 7, 8];

export const PAPER_SIZE_GROUPS = ['80mm', '58mm', 'A4', 'Letter', 'Other'] as const;

export const paperSizeOptions = [
  { label: '80mm (thermal)', value: '80mm' as const },
  { label: '58mm (thermal)', value: '58mm' as const },
  { label: 'A4', value: 'A4' as const },
  { label: 'Letter', value: 'Letter' as const },
  { label: 'Other', value: 'Other' as const },
] as const;

export const appearanceOptions = [
  {
    label: 'Light',
    value: 'light' as const,
    description: 'This will use a light theme for the application.',
  },
  {
    label: 'Dark',
    value: 'dark' as const,
    description: 'This will use a dark theme for the application.',
  },
  {
    label: 'System',
    value: 'system' as const,
    description: 'This will use a system theme for the application.',
  },
] as const;
