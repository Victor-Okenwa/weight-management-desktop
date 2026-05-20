// Serial port configuration constants

// Common baud rates for serial devices
export const BAUD_RATES = [
  110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200,
];

// Allowed stop bits
export const STOP_BITS = [1, 1.5, 2];

// Parity options
export const PARITY_FLAGS = ['none', 'even', 'odd', 'mark', 'space'] as const;

// Flow control options
export const FLOW_CONTROL_OPTIONS = ['none', 'xon/xoff', 'rts/cts', 'dtr/dsr'] as const;

// Allowed data bits
export const DATA_BITS = [5, 6, 7, 8];
